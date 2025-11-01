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
      className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer ${
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
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleBookmark(e)
            }}
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
        </div>
      </div>
    </div>
  )
}

