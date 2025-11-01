interface MessageBubbleProps {
  message: string
  senderId: string
  currentUserId: string
  senderName: string
  timestamp: string
  isOtherUser: boolean
}

export default function MessageBubble({
  message,
  senderId,
  currentUserId,
  senderName,
  timestamp,
  isOtherUser,
}: MessageBubbleProps) {
  // Format timestamp
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

  return (
    <div className={`flex ${isOtherUser ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex flex-col max-w-[70%] ${isOtherUser ? 'items-start' : 'items-end'}`}>
        {isOtherUser && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOtherUser
              ? 'bg-gray-100 text-gray-900 rounded-tl-sm'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(timestamp)}</span>
      </div>
    </div>
  )
}

