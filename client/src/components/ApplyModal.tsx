import { useState, FormEvent, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Job {
  id: string
  title: string
  type: string
}

interface ApplyModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export default function ApplyModal({ job, isOpen, onClose }: ApplyModalProps) {
  const { user } = useAuth()
  const [proposal, setProposal] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Reset form when modal closes
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setProposal('')
    setFile(null)
    setSuccess(false)
    onClose()
  }

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!user || !job) return

    setLoading(true)
    setSuccess(false)

    try {
      let resumeUrl: string | null = null

      // Upload file if present
      if (file) {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}_${job.id}_${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, file)

          if (uploadError) {
            console.warn('Failed to upload resume:', uploadError)
            // Continue without resume if upload fails
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('resumes')
              .getPublicUrl(fileName)
            
            resumeUrl = urlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn('Resume upload error:', uploadErr)
          // Continue without resume
        }
      }

      // Create application
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          user_id: user.id,
          proposal: proposal.trim(),
          resume_url: resumeUrl,
          status: 'pending',
        })

      if (insertError) {
        console.error('Insert error details:', insertError)
        throw insertError
      }

      // Success
      setSuccess(true)
      
      // Auto-close after 2 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apply to Job</h2>
              <p className="text-gray-600 mt-1">{job.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Toast */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Application submitted successfully!</p>
            </div>
          )}

          {/* Proposal */}
          <div>
            <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-2">
              Why you're a good fit *
            </label>
            <textarea
              id="proposal"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y"
              placeholder="Tell them why you're the perfect fit for this role..."
              disabled={loading}
            />
          </div>

          {/* Resume */}
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
              Resume (optional)
            </label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">Accepted: PDF, DOC, DOCX</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

