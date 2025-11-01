import { useState, useEffect, useCallback, useMemo } from 'react'
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
  profile: {
    email: string
    skills: string[]
  }
  job: {
    requirements: string[]
  }
}

interface ApplicantsListProps {
  jobId: string
  jobRequirements: string[]
}

export default function ApplicantsList({ jobId, jobRequirements }: ApplicantsListProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  // Memoize jobRequirements to prevent unnecessary re-renders
  const memoizedJobRequirements = useMemo(() => jobRequirements, [jobId, JSON.stringify(jobRequirements)])

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      
      // First, get applications
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false })

      if (appsError) throw appsError

      // Then, fetch profiles for each application
      const appsWithProfiles = await Promise.all((appsData || []).map(async (app) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, skills')
          .eq('id', app.user_id)
          .maybeSingle()

        if (profileError) {
          console.warn('Error fetching profile for user:', app.user_id, profileError)
        }

          return {
            ...app,
            profile: profileData || { email: 'Unknown', skills: [] },
            job: { requirements: memoizedJobRequirements }
          }
      }))

      setApplications(appsWithProfiles)
    } catch (error) {
      console.error('Error fetching applications:', error)
      alert('Failed to load applications. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [jobId, memoizedJobRequirements])

  // Fetch applications for this job
  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

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

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Loading applicants...</p>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">No applicants yet</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {applications.map((app) => {
        const profile = app.profile || { email: 'Unknown', skills: [] }
        const matchScore = calculateMatchScore({ requirements: memoizedJobRequirements }, { skills: profile.skills })
        
        // Extract name from email (part before @)
        const displayName = profile.email === 'Unknown' 
          ? 'Unknown User' 
          : profile.email.split('@')[0]
        
        return (
          <div key={app.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {displayName}
                </p>
                <p className="text-sm text-gray-600">{profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                  {formatStatus(app.status)}
                </span>
                {app.status === 'pending' && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                    {matchScore}% match
                  </span>
                )}
              </div>
            </div>

            {/* Proposal */}
            <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
              {app.proposal}
            </p>

            {/* Resume */}
            {app.resume_url && (
              <div className="mb-3">
                <a
                  href={app.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Resume
                </a>
              </div>
            )}

            {/* Actions */}
            {app.status === 'pending' && (
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => updateStatus(app.id, 'shortlisted')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => updateStatus(app.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

