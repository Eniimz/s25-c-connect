import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostJobForm from '../components/PostJobForm'
import MyJobsList from '../components/MyJobsList'
import JobList from '../components/JobList'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, role, setRole, logout } = useAuth()
  const [switching, setSwitching] = useState(false)

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hi, {user?.email}</span>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center hover:bg-indigo-700 transition-colors"
                title="View Profile"
              >
                {getInitials()}
              </button>
              <button
                onClick={handleSwitchRole}
                disabled={switching}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {switching ? 'Switching...' : `Switch to ${role === 'finder' ? 'Seeker' : 'Finder'}`}
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
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
            <PostJobForm />
            <MyJobsList />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 font-medium"
              >
                Browse Jobs
              </button>
              <button
                onClick={() => navigate('/saved')}
                className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-medium hover:text-indigo-600 transition-colors"
              >
                Saved Jobs ❤️
              </button>
            </div>

            {/* Job List */}
            <JobList />
          </div>
        )}
      </main>
    </div>
  )
}

