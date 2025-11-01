import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import PostJobForm from '../components/PostJobForm'
import MyJobsList from '../components/MyJobsList'
import JobList from '../components/JobList'
import NotificationCenter from '../components/NotificationCenter'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, role, setRole, logout } = useAuth()
  const [switching, setSwitching] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notification preference and unread count
  useEffect(() => {
    if (user) {
      fetchNotificationPreference()
      fetchUnreadCount()
    }
  }, [user])

  const fetchNotificationPreference = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setNotificationsEnabled(data.notifications_enabled || false)
      }
    } catch (error) {
      console.error('Error fetching notification preference:', error)
    }
  }

  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const normalizedUserId = user.id.replace(/-/g, '_')
      
      // Fetch messages for this user
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!allMessages) return

      // Count unread messages from others
      const unread = allMessages.filter(msg => {
        const chatId = msg.chat_id
        const isForUser = chatId.startsWith(normalizedUserId + '_') || chatId.includes('_' + normalizedUserId + '_')
        return isForUser && msg.sender_id !== user.id && !msg.read
      }).length

      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Handle role switch
  const handleSwitchRole = async () => {
    const newRole = role === 'finder' ? 'seeker' : 'finder'
    try {
      setSwitching(true)
      await setRole(newRole)
    } catch (error) {
      console.error('Failed to switch role:', error)
    } finally {
      setSwitching(false)
    }
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.email) return 'U'
    const email = user.email
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {role === 'finder' ? 'Finder Dashboard' : 'Seeker Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">Welcome back!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-indigo-700">{role === 'finder' ? 'Finder' : 'Seeker'} Mode</span>
              </div>
              {notificationsEnabled && (
                <button
                  onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
                  className="relative w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center cursor-pointer hover:bg-indigo-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                title="View Profile"
              >
                {getInitials()}
              </button>
              <button
                onClick={handleSwitchRole}
                disabled={switching}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {switching ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Switching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Switch to {role === 'finder' ? 'Seeker' : 'Finder'}
                  </>
                )}
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {role === 'finder' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Applications Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer"
                   onClick={() => navigate('/applications')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1">View Applications</h3>
                <p className="text-sm opacity-90">Manage all applicants</p>
              </div>

              {/* Post Job Card */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1">Post New Job</h3>
                <p className="text-sm opacity-90">Create opportunities</p>
              </div>

              {/* Profile Card */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                   onClick={() => navigate('/profile')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1">Edit Profile</h3>
                <p className="text-sm opacity-90">Update your skills</p>
              </div>
            </div>
            
            <PostJobForm />
            <MyJobsList />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Browse Jobs Card */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                   onClick={() => navigate('/dashboard')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1">Browse Jobs</h3>
                <p className="text-sm opacity-90">Discover opportunities</p>
              </div>

              {/* My Applications Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                   onClick={() => navigate('/my-applications')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1">My Applications</h3>
                <p className="text-sm opacity-90">Track your applications</p>
              </div>

              {/* Saved Jobs Card */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
                   onClick={() => navigate('/saved')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1">Saved Jobs</h3>
                <p className="text-sm opacity-90">Your favorites</p>
              </div>
            </div>

            {/* Job List */}
            <JobList />
          </div>
        )}
      </main>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => {
          setNotificationCenterOpen(false)
          // Refresh unread count when closing
          if (user) {
            fetchUnreadCount()
          }
        }}
      />
    </div>
  )
}

