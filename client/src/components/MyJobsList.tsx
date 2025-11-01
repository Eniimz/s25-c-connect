import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import EditJobModal from './EditJobModal'

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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">My Job Postings</h2>
            <p className="text-green-50">Manage and track your posted opportunities</p>
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
            <div key={job.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100">
              {/* Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            job.status === 'open'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {job.status === 'open' ? '✓ Open' : 'Filled'}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200">
                          {formatType(job.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Analytics */}
              <div className="flex items-center gap-4 text-sm mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-bold text-blue-900">{job.views || 0}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-bold text-purple-900">{job.applicantCount}</span>
                </div>
                {job.views > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium ${
                    (job.applicantCount / job.views * 100) > 50 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : (job.applicantCount / job.views * 100) > 25 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>{Math.round(job.applicantCount / job.views * 100)}% interest</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-4 whitespace-pre-wrap line-clamp-3">{job.description}</p>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
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
                      className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleMarkFilled(job.id)}
                      className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Filled
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  disabled={deletingId === job.id}
                  className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === job.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
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

