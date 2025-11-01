import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ApplyModal from './ApplyModal'
import { calculateMatchScore } from '../utils/matchScore'

interface Job {
  id: string
  title: string
  type: string
  description: string
  requirements: string[]
  posted_by: string
  created_at: string
}

interface JobWithScore extends Job {
  matchScore: number
}

interface Profile {
  skills: string[]
}

export default function JobList() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobWithScore[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch jobs and profile
  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
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

      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // Calculate match scores and sort
      const jobsWithScores = (jobsData || []).map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, profileData || { skills: [] })
      })).sort((a, b) => b.matchScore - a.matchScore)

      setJobs(jobsWithScores)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle apply click
  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setIsModalOpen(true)
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Opportunities</h2>
        <p className="text-gray-600">Browse and apply to jobs posted by finders</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      )}

      {/* No Jobs */}
      {!loading && jobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No jobs available at the moment</p>
          <p className="text-gray-500 mt-2">Check back later for new opportunities!</p>
        </div>
      )}

      {/* Jobs List */}
      {!loading && jobs.length > 0 && (
        <div className="grid gap-6">
          {jobs.map((job, index) => (
            <div 
              key={job.id} 
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${
                index === 0 && job.matchScore > 70 ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    {index === 0 && job.matchScore > 70 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        ⭐ Top Match
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {formatType(job.type)}
                    </span>
                    <span className={`inline-block px-3 py-1 border rounded-full text-sm font-semibold ${getMatchBadgeColor(job.matchScore)}`}>
                      Match: {job.matchScore}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleApply(job)}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{job.description}</p>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      <ApplyModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

