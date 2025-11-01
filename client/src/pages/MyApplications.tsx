import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ApplicationCard from '../components/ApplicationCard'
import JobDetailsModal from '../components/JobDetailsModal'

interface Application {
  id: string
  job_id: string
  user_id: string
  proposal: string
  resume_url: string | null
  status: string
  applied_at: string
  job: {
    id: string
    title: string
    type: string
    description: string
    requirements: string[]
    posted_by: string
    created_at: string
  }
}

export default function MyApplications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  
  const channelRef = useRef<any>(null)

  // Fetch all applications for current user
  useEffect(() => {
    if (user) {
      fetchApplications()
    }
    
    // Setup realtime listener for status updates
    const channel = supabase
      .channel(`applications_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Application status updated:', payload)
          // Update the application in the list
          setApplications((prev) =>
            prev.map((app) =>
              app.id === payload.new.id ? { ...app, status: (payload.new as any).status } : app
            )
          )
        }
      )
      .subscribe()
    
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user])

  const fetchApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch all applications for this user with job details
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            type,
            description,
            requirements,
            posted_by,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })

      if (appsError) throw appsError

      // Transform the data to flatten the job object
      const transformedApps = (appsData || []).map((app: any) => ({
        ...app,
        job: app.jobs
      }))

      setApplications(transformedApps)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle view job
  const handleViewJob = (application: Application) => {
    setSelectedApplication(application)
    setIsJobModalOpen(true)
  }

  // Format type for display
  const formatType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get match badge color (not used in this context, but required by modal)
  const getMatchBadgeColor = () => 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Applications
                </h1>
                <p className="text-xs text-gray-500">Track your job applications</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 animate-pulse">
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Applications */}
          {!loading && applications.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">You haven't applied to any jobs yet</p>
              <p className="text-gray-500 mt-2">Explore opportunities!</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          )}

          {/* Applications Grid */}
          {!loading && applications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  formatType={formatType}
                  onViewJob={handleViewJob}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Job Details Modal */}
      {selectedApplication && (
        <JobDetailsModal
          job={{
            ...selectedApplication.job,
            matchScore: 0
          }}
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          onApply={() => {}}
          formatType={formatType}
          getMatchBadgeColor={getMatchBadgeColor}
        />
      )}
    </div>
  )
}

