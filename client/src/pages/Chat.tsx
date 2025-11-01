import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import MessageBubble from '../components/MessageBubble'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

interface Profile {
  email: string
}

export default function Chat() {
  const { jobId } = useParams<{ jobId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [jobTitle, setJobTitle] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat
  useEffect(() => {
    if (!user || !jobId) return

    initializeChat()
    
    return () => {
      // Cleanup: unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user, jobId])

  const initializeChat = async () => {
    if (!user || !jobId) return

    try {
      setLoading(true)

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('title, posted_by')
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError
      setJobTitle(jobData.title)

      // Determine other user
      let otherUserId: string
      const applicantUserId = searchParams.get('applicant')
      
      if (applicantUserId) {
        // Finder mode: chatting with applicant
        otherUserId = applicantUserId
      } else {
        // Seeker mode: chatting with finder
        otherUserId = jobData.posted_by
      }

      // Block self-chat
      if (user.id === otherUserId) {
        alert("You cannot chat with yourself!")
        navigate(-1)
        return
      }

      // Fetch other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', otherUserId)
        .single()

      if (profileError) throw profileError
      setOtherUser(profileData)

      // Generate chat_id: sorted UUIDs + jobId
      const sortedIds = [user.id, otherUserId].sort()
      const generatedChatId = `${sortedIds[0]}_${sortedIds[1]}_${jobId}`.replace(/-/g, '_')
      setChatId(generatedChatId)

      // Subscribe to real-time messages
      subscribeToMessages(generatedChatId)

      // Fetch initial messages
      await fetchMessages(generatedChatId)
    } catch (error) {
      console.error('Error initializing chat:', error)
      alert('Failed to initialize chat')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = (chatId: string) => {
    // Cleanup any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create channel
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Real-time message received:', payload)
          const newMessage = payload.new as Message
          
          // Prevent duplicates - only add if message doesn't already exist
          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    channelRef.current = channel
    return channel
  }

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
          console.error('❌ Error: messages table does not exist in Supabase!')
          console.error('📝 Please create the table using the SQL in the README.md file')
          console.error('📋 Or run this SQL in your Supabase SQL Editor:')
          console.error(`
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
          `)
        }
        return
      }
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !chatId || !user) return

    try {
      setSending(true)

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: newMessage.trim(),
        })
        .select()

      if (error) {
        console.error('Error sending message:', error)
        // Check if it's a table doesn't exist error
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
          alert('❌ Messages table does not exist! Please run the SQL in README.md to create it.')
        } else {
          alert('Failed to send message. Please check console for details.')
        }
        return
      }
      
      // Optimistically add the message to the list immediately
      if (data && data[0]) {
        setMessages((prev) => [...prev, data[0] as Message])
      }
      
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getSenderName = (senderId: string): string => {
    if (senderId === user?.id) {
      return 'You'
    }
    if (otherUser) {
      return otherUser.email.split('@')[0]
    }
    return 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/applications')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{jobTitle}</h1>
                <p className="text-sm text-gray-500">
                  Chatting with {otherUser?.email.split('@')[0] || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg.content}
                  senderId={msg.sender_id}
                  currentUserId={user!.id}
                  senderName={getSenderName(msg.sender_id)}
                  timestamp={msg.created_at}
                  isOtherUser={msg.sender_id !== user!.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

