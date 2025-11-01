import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface RecentMessage {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender_email: string
  job_title: string
  job_id: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch recent unread messages
  useEffect(() => {
    if (isOpen && user) {
      fetchRecentMessages()
    }
  }, [isOpen, user])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Also close on backdrop click
  const handleBackdropClick = () => {
    onClose()
  }

  const fetchRecentMessages = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch unread messages for this user
      // We need to get all messages where user is recipient and read = false
      const normalizedUserId = user.id.replace(/-/g, '_')
      
      // Fetch recent messages where the user is involved
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Filter messages for this user and extract info
      const messagesForUser = (allMessages || [])
        .filter(msg => {
          const chatId = msg.chat_id
          return chatId.startsWith(normalizedUserId + '_') || chatId.includes('_' + normalizedUserId + '_')
        })
        .filter(msg => msg.sender_id !== user.id) // Only from others
        .slice(0, 5) // Last 5 messages

      // Fetch sender info and job info for each message
      const messagesWithInfo = await Promise.all(messagesForUser.map(async (msg: any) => {
        // Get sender email
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', msg.sender_id)
          .single()

        // Extract jobId from chat_id
        const chatId = msg.chat_id
        const uuidPattern = '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
        const match = chatId.match(new RegExp(`^${uuidPattern}_${uuidPattern}_(.+)$`, 'i'))
        let jobId = null
        let jobTitle = 'Unknown Job'

        if (match && match[1]) {
          jobId = match[1].replace(/_/g, '-')
          const { data: jobData } = await supabase
            .from('jobs')
            .select('title')
            .eq('id', jobId)
            .single()

          if (jobData) {
            jobTitle = jobData.title
          }
        }

        return {
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          sender_email: senderProfile?.email || 'Unknown',
          job_title: jobTitle,
          job_id: jobId || '',
        }
      }))

      setRecentMessages(messagesWithInfo)
    } catch (error) {
      console.error('Error fetching recent messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageClick = (message: RecentMessage) => {
    if (message.job_id) {
      onClose()
      navigate(`/chat/${message.job_id}`)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black bg-opacity-25 pointer-events-auto" onClick={handleBackdropClick}></div>
      <div className="fixed top-20 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto" ref={dropdownRef}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Messages</h3>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No recent messages</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleMessageClick(msg)}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {msg.sender_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {msg.sender_email.split('@')[0]}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1 truncate">{msg.job_title}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

