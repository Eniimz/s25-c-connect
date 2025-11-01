import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Job {
  id: string
  title: string
  type: 'academic' | 'startup' | 'part-time' | 'competition'
  description: string
  requirements: string[]
}

interface EditJobModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export default function EditJobModal({ job, isOpen, onClose, onSaved }: EditJobModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'academic' | 'startup' | 'part-time' | 'competition'>('academic')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [requirementInput, setRequirementInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Pre-fill form when job changes
  useEffect(() => {
    if (job) {
      setTitle(job.title)
      setType(job.type)
      setDescription(job.description)
      setRequirements(job.requirements || [])
      setRequirementInput('')
      setSuccess(false)
    }
  }, [job])

  // Reset form when modal closes
  const handleClose = () => {
    setSuccess(false)
    onClose()
  }

  // Add requirement
  const handleAddRequirement = () => {
    const trimmed = requirementInput.trim()
    if (trimmed && !requirements.includes(trimmed)) {
      setRequirements([...requirements, trimmed])
      setRequirementInput('')
    }
  }

  // Remove requirement
  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req))
  }

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!job) return

    try {
      setLoading(true)
      setSuccess(false)

      const { error } = await supabase
        .from('jobs')
        .update({
          title: title.trim(),
          type,
          description: description.trim(),
          requirements,
        })
        .eq('id', job.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        onSaved()
        handleClose()
      }, 1000)
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Failed to update job. Please try again.')
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
            <h2 className="text-2xl font-bold text-gray-900">Edit Job Posting</h2>
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
              <p className="text-green-800 font-medium">✅ Job updated successfully!</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Research Assistant Position"
              disabled={loading}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-2">
              Job Type *
            </label>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
              disabled={loading}
            >
              <option value="academic">Academic</option>
              <option value="startup">Startup</option>
              <option value="part-time">Part-Time</option>
              <option value="competition">Competition</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              disabled={loading}
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>

            {/* Requirements Tags */}
            {requirements.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {requirements.map((req, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(req)}
                      className="hover:text-indigo-600 transition-colors"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Requirement Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Add a requirement and press Enter"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                disabled={loading || !requirementInput.trim()}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
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
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

