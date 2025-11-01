import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PostJobForm from '../components/PostJobForm'

export default function Dashboard() {
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
          <PostJobForm />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Browse Jobs
            </h2>
            <p className="text-gray-600">
              Browse jobs soon...
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

