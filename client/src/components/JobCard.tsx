import { useState, useEffect } from 'react'
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

interface JobCardProps {
  job: JobWithScore
  index: number
  onApply: (job: JobWithScore) => void
  onViewDetails: (job: JobWithScore) => void
  formatType: (type: string) => string
  getMatchBadgeColor: (score: number) => string
}

export default function JobCard({
  job,
  index,
  onApply,
  onViewDetails,
  formatType,
  getMatchBadgeColor,
}: JobCardProps) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if job is bookmarked on mount
  useEffect(() => {
    checkBookmarkStatus()
  }, [job.id, user])

  const checkBookmarkStatus = async () => {
    if (!user) return

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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) return

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

  const handleCardClick = () => {
    onViewDetails(job)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-1 ${
        index === 0 && job.matchScore > 70 ? 'ring-2 ring-green-400 ring-offset-2' : ''
      }`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                {index === 0 && job.matchScore > 70 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-full border border-green-300">
                    <span>⭐</span>
                    Top Match
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200">
                {formatType(job.type)}
              </span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${getMatchBadgeColor(job.matchScore)}`}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {job.matchScore}% Match
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Bookmark Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleBookmark(e)
              }}
              disabled={loading}
              className={`p-2.5 rounded-xl transition-all ${
                isBookmarked
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
              } disabled:opacity-50 shadow-sm`}
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
          </div>
        </div>
      </div>
    </div>
  )
}

