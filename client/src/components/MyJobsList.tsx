import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import EditJobModal from './EditJobModal'
import ApplicantsList from './ApplicantsList'

interface Job {
  id: string
  title: string
  type: 'academic' | 'startup' | 'part-time' | 'competition'
  description: string
  requirements: string[]
  posted_by: string
  status: string
  created_at: string
  views?: number
}

interface JobWithCount extends Job {
  applicantCount: number
  views: number
}

export default function MyJobsList() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())

  // Fetch my jobs
  useEffect(() => {
    if (user) {
      fetchMyJobs()
    }
  }, [user])

  const fetchMyJobs = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch applicant counts and ensure views field for each job
      const jobsWithCounts = await Promise.all((data || []).map(async (job) => {
        const { count, error: countError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)

        return {
          ...job,
          applicantCount: count || 0,
          views: job.views || 0
        }
      }))

      setJobs(jobsWithCounts)
    } catch (error) {
      console.error('Error fetching my jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (job: Job) => {
    setSelectedJob(job)
    setIsEditModalOpen(true)
  }

  // Handle delete
  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return
    }

    try {
      setDeletingId(jobId)
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      // Refresh list
      await fetchMyJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // Handle mark as filled
  const handleMarkFilled = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'filled' })
        .eq('id', jobId)

      if (error) throw error

      // Refresh list
      await fetchMyJobs()
    } catch (error) {
      console.error('Error marking job as filled:', error)
      alert('Failed to update job status. Please try again.')
    }
  }

  // Format type
  const formatType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Toggle expanded state
  const toggleExpand = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Job Postings</h2>
        <p className="text-gray-600">Manage your job postings</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      )}

      {/* No Jobs */}
      {!loading && jobs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">You haven't posted any jobs yet</p>
          <p className="text-gray-500 mt-2">Create your first job posting above!</p>
        </div>
      )}

      {/* Jobs List */}
      {!loading && jobs.length > 0 && (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status === 'open' ? 'Open' : 'Filled'}
                    </span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {formatType(job.type)}
                  </span>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                <span className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{job.views || 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>📩</span>
                  <span>{job.applicantCount}</span>
                </span>
                {job.views > 0 && (
                  <span className={`flex items-center gap-1 font-medium ${
                    (job.applicantCount / job.views * 100) > 50 
                      ? 'text-green-600' 
                      : (job.applicantCount / job.views * 100) > 25 
                        ? 'text-yellow-600' 
                        : ''
                  }`}>
                    <span>📊</span>
                    <span>{Math.round(job.applicantCount / job.views * 100)}% interest</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{job.description}</p>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 mb-4">
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {job.status === 'open' && (
                  <>
                    <button
                      onClick={() => handleEdit(job)}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleMarkFilled(job.id)}
                      className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Mark as Filled
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  disabled={deletingId === job.id}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === job.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>

              {/* Applicants Section */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => toggleExpand(job.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">
                      Applicants ({job.applicantCount})
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      expandedJobs.has(job.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedJobs.has(job.id) && (
                  <ApplicantsList jobId={job.id} jobRequirements={job.requirements} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditJobModal
        job={selectedJob}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={fetchMyJobs}
      />
    </div>
  )
}

