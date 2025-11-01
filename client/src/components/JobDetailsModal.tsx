import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

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

interface JobDetailsModalProps {
  job: JobWithScore | null
  isOpen: boolean
  onClose: () => void
  onApply: (job: JobWithScore) => void
  formatType: (type: string) => string
  getMatchBadgeColor: (score: number) => string
}

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onApply,
  formatType,
  getMatchBadgeColor,
}: JobDetailsModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasTrackedView = useRef(false)

  // Track view on open and check bookmark
  useEffect(() => {
    if (isOpen && job) {
      if (!hasTrackedView.current) {
        hasTrackedView.current = true
        incrementView()
      }
      checkBookmarkStatus()
      checkApplicationStatus()
    }
  }, [isOpen, job, user])

  const incrementView = async () => {
    if (!user || !job) return

    try {
      // Get current views
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('views')
        .eq('id', job.id)
        .single()

      if (fetchError) throw fetchError

      const currentViews = (data?.views || 0) as number
      
      // Update views
      await supabase
        .from('jobs')
        .update({ views: currentViews + 1 })
        .eq('id', job.id)
    } catch (error) {
      console.warn('Failed to increment job view:', error)
    }
  }

  const checkBookmarkStatus = async () => {
    if (!user || !job) return

    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('job_id', job.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark:', error)
      }

      setIsBookmarked(!!data)
    } catch (error) {
      console.error('Error checking bookmark:', error)
    }
  }

  const checkApplicationStatus = async () => {
    if (!user || !job) return

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', job.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking application:', error)
      }

      setHasApplied(!!data)
    } catch (error) {
      console.error('Error checking application:', error)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user || !job) return

    try {
      setLoading(true)

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', job.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsBookmarked(false)
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            job_id: job.id,
            user_id: user.id,
          })

        if (error) throw error
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {formatType(job.type)}
                </span>
                <span className={`inline-block px-3 py-1 border rounded-full text-sm font-semibold ${getMatchBadgeColor(job.matchScore)}`}>
                  Match: {job.matchScore}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-400 hover:bg-gray-100'
                } disabled:opacity-50`}
                title={isBookmarked ? 'Remove from saved' : 'Save job'}
              >
                {isBookmarked ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
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
          <div className="pt-4 border-t border-gray-200 space-y-2">
            {hasApplied && job.posted_by !== user?.id ? (
              <button
                onClick={() => {
                  onClose()
                  navigate(`/chat/${job.id}`)
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat with Finder
              </button>
            ) : !hasApplied ? (
              <button
                onClick={() => {
                  onClose()
                  onApply(job)
                }}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply Now
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

