import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { triggerNotificationIfEnabled } from '../utils/notifications'

// Types
type UserRole = 'finder' | 'seeker'

interface Profile {
  id: string
  full_name: string | null
  email: string
  role: UserRole
  skills: string[]
  created_at: string
}

interface AuthContextType {
  user: User | null
  role: UserRole
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setRole: (newRole: UserRole) => Promise<void>
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRoleState] = useState<UserRole>('seeker')
  const [loading, setLoading] = useState(true)
  const globalMessageChannelRef = useRef<any>(null)

  // Helper function to ensure profile exists and get role
  const ensureProfileAndSetRole = async (userId: string, userEmail: string | undefined) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      // Handle "table not found" error
      if (selectError && selectError.code === 'PGRST205') {
        console.error('❌ Error: profiles table does not exist in Supabase!')
        console.error('📝 Please create the table using:')
        console.error('   1. Go to Supabase Dashboard → SQL Editor')
        console.error('   2. Run: CREATE TABLE profiles (id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, email TEXT NOT NULL, role TEXT NOT NULL DEFAULT \'seeker\', skills TEXT[], created_at TIMESTAMP DEFAULT NOW());')
        console.error('   3. Run: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;')
        setRoleState('seeker')
        return
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail || '',
            role: 'seeker',
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
          setRoleState('seeker')
        } else {
          console.log('✅ Profile created successfully')
          setRoleState('seeker')
        }
      } else {
        // Profile exists, set role from DB
        setRoleState(existingProfile.role as UserRole)
      }
    } catch (error) {
      console.error('Error ensuring profile:', error)
      setRoleState('seeker')
    }
  }

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (session?.user) {
          await ensureProfileAndSetRole(session.user.id, session.user.email)
        }
        setLoading(false)
      }
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (session?.user) {
          await ensureProfileAndSetRole(session.user.id, session.user.email)
        } else {
          setRoleState('seeker')
        }
        setLoading(false)
      }
    })

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Subscribe to all messages for the current user (for notifications)
  useEffect(() => {
    if (!user) return

    // Cleanup existing subscription
    if (globalMessageChannelRef.current) {
      supabase.removeChannel(globalMessageChannelRef.current)
    }

    // Subscribe to all messages where user is sender or recipient
    const channel = supabase
      .channel(`global_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any
          
          console.log('🔔 Global subscription received message:', {
            chat_id: newMessage.chat_id,
            sender_id: newMessage.sender_id,
            current_user_id: user.id,
          })
          
          // Check if this message is for the current user
          // chat_id format: user1_user2_jobId (where all UUIDs have dashes replaced by underscores)
          // UUIDs with dashes replaced become: xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx
          // So splitting by _ won't work. We need to match the normalized user ID in the chat_id
          const normalizedUserId = user.id.replace(/-/g, '_')
          
          // Check if the normalized user ID appears in the chat_id
          // It should be at the beginning (as first UUID) or after first UUID + underscore (as second UUID)
          const isForCurrentUser = newMessage.chat_id.startsWith(normalizedUserId + '_') || 
                                   newMessage.chat_id.includes('_' + normalizedUserId + '_')
          
          console.log('🔔 Chat ID parsing:', {
            chat_id: newMessage.chat_id,
            normalizedUserId,
            isForCurrentUser,
            isFromOtherUser: newMessage.sender_id !== user.id,
          })
          
          // Only trigger notification if message is from someone else and for current user
          if (isForCurrentUser && newMessage.sender_id !== user.id) {
            console.log('🔔 ✅ Triggering notification for message!')
            
            // Try to get job title for better notification
            try {
              // Extract jobId from chat_id using regex
              // Format: user1_user2_jobId where all UUIDs have dashes replaced by underscores
              // UUID normalized pattern: xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx
              const chatId = newMessage.chat_id
              const uuidPattern = '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
              const match = chatId.match(new RegExp(`^${uuidPattern}_${uuidPattern}_(.+)$`, 'i'))
              
              if (match && match[1]) {
                const jobIdNormalized = match[1]
                const jobId = jobIdNormalized.replace(/_/g, '-') // Convert back to UUID format
                
                const { data: jobData } = await supabase
                  .from('jobs')
                  .select('title')
                  .eq('id', jobId)
                  .single()
                
                if (jobData) {
                  await triggerNotificationIfEnabled(
                    user.id,
                    'New Message',
                    `You received a message in ${jobData.title}`,
                    '/favicon.ico'
                  )
                  return
                }
              }
            } catch (error) {
              console.error('Error fetching job title for notification:', error)
            }
            
            // Fallback to generic message
            await triggerNotificationIfEnabled(
              user.id,
              'New Message',
              `You received a new message`,
              '/favicon.ico'
            )
          } else {
            console.log('🔔 ❌ Not triggering notification:', {
              isForCurrentUser,
              isFromOtherUser: newMessage.sender_id !== user.id,
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Global message subscription status:', status)
      })

    globalMessageChannelRef.current = channel

    return () => {
      if (globalMessageChannelRef.current) {
        supabase.removeChannel(globalMessageChannelRef.current)
      }
    }
  }, [user])

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  // Login with email/password
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  // Logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setRoleState('seeker')
  }

  // Update role in both state and database
  const setRole = async (newRole: UserRole) => {
    if (!user) return

    try {
      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)

      if (error) throw error

      // Update state on success
      setRoleState(newRole)
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  const value = {
    user,
    role,
    loading,
    signInWithGoogle,
    signUp,
    login,
    logout,
    setRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

