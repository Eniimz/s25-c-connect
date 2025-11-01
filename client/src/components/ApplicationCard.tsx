import { useNavigate } from 'react-router-dom'

interface Application {
  id: string
  job_id: string
  user_id?: string
  proposal?: string
  resume_url?: string | null
  status: string
  applied_at: string
  job: {
    id: string
    title: string
    type: string
    description: string
    requirements: string[]
    posted_by: string
    created_at: string
  }
}

interface ApplicationCardProps {
  application: Application
  formatType: (type: string) => string
  onViewJob?: (application: any) => void
}

export default function ApplicationCard({ application, formatType, onViewJob }: ApplicationCardProps) {
  const navigate = useNavigate()

  // Get status badge color and icon
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✓',
          label: 'Accepted'
        }
      case 'shortlisted':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: '⭐',
          label: 'Shortlisted'
        }
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '✗',
          label: 'Rejected'
        }
      case 'pending':
      default:
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '⏳',
          label: 'Pending'
        }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statusBadge = getStatusBadge(application.status)

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{application.job.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-200">
                    {formatType(application.job.type)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${statusBadge.color}`}>
            <span className="mr-1">{statusBadge.icon}</span>
            {statusBadge.label}
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Applied {formatDate(application.applied_at)}
          </span>
        </div>

        {/* Requirements Preview */}
        {application.job.requirements && application.job.requirements.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Requirements
            </h4>
            <div className="flex flex-wrap gap-2">
              {application.job.requirements.slice(0, 3).map((req, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                >
                  {req}
                </span>
              ))}
              {application.job.requirements.length > 3 && (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                  +{application.job.requirements.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (onViewJob) {
                onViewJob(application)
              }
            }}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Job
          </button>
          {application.status.toLowerCase() !== 'rejected' && (
            <button
              onClick={() => navigate(`/chat/${application.job.id}`)}
              className="flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

