import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import JobCard from '../components/JobCard'
import ApplyModal from '../components/ApplyModal'
import JobDetailsModal from '../components/JobDetailsModal'
import { calculateMatchScore } from '../utils/matchScore'

interface JobWithScore {
  id: string
  title: string
  type: string
  description: string
  requirements: string[]
  posted_by: string
  created_at: string
  matchScore: number
}

interface Profile {
  skills: string[]
}

export default function SavedJobs() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState<JobWithScore[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobWithScore | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Fetch saved jobs and profile
  useEffect(() => {
    fetchSavedJobs()
  }, [user])

  const fetchSavedJobs = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch profile with skills
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      setProfile(profileData || { skills: [] })

      // Fetch saved jobs
      const { data: savedJobsData, error: savedError } = await supabase
        .from('saved_jobs')
        .select(`
          job_id,
          jobs (
            id,
            title,
            type,
            description,
            requirements,
            posted_by,
            created_at,
            status
          )
        `)
        .eq('user_id', user.id)

      if (savedError) throw savedError

      // Filter out closed jobs and calculate match scores
      const jobsWithScores = (savedJobsData || [])
        .map((item: any) => item.jobs)
        .filter((job: any) => job && job.status === 'open')
        .map((job: any) => ({
          ...job,
          matchScore: calculateMatchScore(job, profileData || { skills: [] }),
        }))
        .sort((a: any, b: any) => b.matchScore - a.matchScore)

      setSavedJobs(jobsWithScores)
    } catch (error) {
      console.error('Error fetching saved jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle apply click
  const handleApply = (job: JobWithScore) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  // Handle view details click
  const handleViewDetails = (job: JobWithScore) => {
    setSelectedJob(job)
    setIsDetailsModalOpen(true)
  }

  // Format type for display
  const formatType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Get match badge color
  const getMatchBadgeColor = (score: number) => {
    if (score > 70) return 'bg-green-100 text-green-800 border-green-200'
    if (score > 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
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
          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600">Loading saved jobs...</p>
            </div>
          )}

          {/* No Saved Jobs */}
          {!loading && savedJobs.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-gray-600 text-lg">No saved jobs yet</p>
              <p className="text-gray-500 mt-2">Start bookmarking jobs to view them here</p>
            </div>
          )}

          {/* Saved Jobs List */}
          {!loading && savedJobs.length > 0 && (
            <div className="grid gap-6">
              {savedJobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  onApply={handleApply}
                  onViewDetails={handleViewDetails}
                  formatType={formatType}
                  getMatchBadgeColor={getMatchBadgeColor}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onApply={handleApply}
        formatType={formatType}
        getMatchBadgeColor={getMatchBadgeColor}
      />

      {/* Apply Modal */}
      <ApplyModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

