import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ApplyModal from './ApplyModal'
import JobDetailsModal from './JobDetailsModal'
import JobCard from './JobCard'
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
  const [allJobs, setAllJobs] = useState<JobWithScore[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([])
  
  // Debounce ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Fetch jobs and profile
  useEffect(() => {
    fetchData()
  }, [user])

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

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

      setAllJobs(jobsWithScores)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get all unique requirements from all jobs
  const allRequirements = useMemo(() => {
    const requirementsSet = new Set<string>()
    allJobs.forEach(job => {
      if (job.requirements && job.requirements.length > 0) {
        job.requirements.forEach(req => requirementsSet.add(req))
      }
    })
    return Array.from(requirementsSet).sort()
  }, [allJobs])

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // Search by title
      if (debouncedSearch && !job.title.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false
      }

      // Filter by type
      if (selectedType !== 'all' && job.type !== selectedType) {
        return false
      }

      // Filter by requirements
      if (selectedRequirements.length > 0) {
        const jobRequirements = job.requirements || []
        const hasAllSelected = selectedRequirements.every(req => jobRequirements.includes(req))
        if (!hasAllSelected) {
          return false
        }
      }

      return true
    })
  }, [allJobs, debouncedSearch, selectedType, selectedRequirements])

  // Toggle requirement filter
  const toggleRequirement = (req: string) => {
    if (selectedRequirements.includes(req)) {
      setSelectedRequirements(selectedRequirements.filter(r => r !== req))
    } else {
      setSelectedRequirements([...selectedRequirements, req])
    }
  }

  // Handle apply click
  const handleApply = (job: Job) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">Available Opportunities</h2>
            <p className="text-blue-50">Discover and apply to exciting job opportunities</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {!loading && allJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Search Bar */}
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Search by job title..."
            />
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="all">All Types</option>
                <option value="academic">Academic</option>
                <option value="startup">Startup</option>
                <option value="part-time">Part-Time</option>
                <option value="competition">Competition</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {(searchQuery || selectedType !== 'all' || selectedRequirements.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedType('all')
                    setSelectedRequirements([])
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Requirement Filters */}
          {allRequirements.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="flex flex-wrap gap-2">
                {allRequirements.map((req) => (
                  <button
                    key={req}
                    type="button"
                    onClick={() => toggleRequirement(req)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedRequirements.includes(req)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {req}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
      {!loading && allJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No jobs available at the moment</p>
          <p className="text-gray-500 mt-2">Check back later for new opportunities!</p>
        </div>
      )}

      {/* No Results */}
      {!loading && allJobs.length > 0 && filteredJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No jobs found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Jobs List */}
      {!loading && filteredJobs.length > 0 && (
        <div className="grid gap-6">
          {filteredJobs.map((job, index) => (
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

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob as JobWithScore | null}
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

