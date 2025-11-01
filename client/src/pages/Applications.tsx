import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateMatchScore } from '../utils/matchScore'

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
    requirements: string[]
  }
  profile: {
    email: string
    skills: string[]
  }
}

export default function Applications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch all applications for user's jobs
  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // First, get all jobs posted by this user
      const { data: myJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, requirements')
        .eq('posted_by', user.id)

      if (jobsError) throw jobsError
      if (!myJobs || myJobs.length === 0) {
        setApplications([])
        return
      }

      const jobIds = myJobs.map(j => j.id)

      // Fetch all applications for these jobs
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false })

      if (appsError) throw appsError

      // Fetch profiles for each application
      const appsWithProfiles = await Promise.all((appsData || []).map(async (app) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, skills')
          .eq('id', app.user_id)
          .maybeSingle()

        // Find the job details
        const job = myJobs.find(j => j.id === app.job_id)

        return {
          ...app,
          profile: profileData || { email: 'Unknown', skills: [] },
          job: job || { id: app.job_id, title: 'Unknown Job', requirements: [] }
        }
      }))

      setApplications(appsWithProfiles)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update application status
  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      // Refresh applications
      await fetchApplications()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update application status')
    }
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false
    }

    // Search filter (by email or job title)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesEmail = app.profile.email.toLowerCase().includes(query)
      const matchesJobTitle = app.job.title.toLowerCase().includes(query)
      if (!matchesEmail && !matchesJobTitle) {
        return false
      }
    }

    return true
  })

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Search by applicant or job title..."
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          )}

          {/* No Applications */}
          {!loading && applications.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No applications yet</p>
              <p className="text-gray-500 mt-2">Applications from seekers will appear here</p>
            </div>
          )}

          {/* No Results */}
          {!loading && applications.length > 0 && filteredApplications.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No applications found</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Summary Stats */}
          {!loading && filteredApplications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">
                      {filteredApplications.filter(a => a.status === 'pending').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Shortlisted</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {filteredApplications.filter(a => a.status === 'shortlisted').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {filteredApplications.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Applications Table */}
          {!loading && filteredApplications.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                        Match Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => {
                      const matchScore = calculateMatchScore(
                        { requirements: app.job.requirements },
                        { skills: app.profile.skills }
                      )
                      
                      const getMatchColor = (score: number) => {
                        if (score >= 70) return 'bg-green-500'
                        if (score >= 40) return 'bg-yellow-500'
                        return 'bg-gray-400'
                      }
                      
                      return (
                        <tr key={app.id} className="hover:bg-indigo-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {app.job.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs font-bold text-gray-700">
                                  {app.profile.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900">{app.profile.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(app.status)}`}>
                              {formatStatus(app.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full ${getMatchColor(matchScore)} transition-all`}
                                  style={{ width: `${matchScore}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${
                                matchScore >= 70 ? 'text-green-600' : 
                                matchScore >= 40 ? 'text-yellow-600' : 
                                'text-gray-600'
                              }`}>
                                {matchScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {app.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(app.id, 'shortlisted')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Shortlist
                                  </button>
                                  <button
                                    onClick={() => updateStatus(app.id, 'rejected')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.resume_url && (
                                <a
                                  href={app.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Resume
                                </a>
                              )}
                              {app.user_id !== user?.id && (
                                <button
                                  onClick={() => navigate(`/chat/${app.job.id}?applicant=${app.user_id}`)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Message
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

