import { useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type JobType = 'academic' | 'startup' | 'part-time' | 'competition'

export default function PostJobForm() {
  const { user } = useAuth()
  
  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<JobType>('academic')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [requirementInput, setRequirementInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
    
    if (!user) return

    setLoading(true)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          title: title.trim(),
          type,
          description: description.trim(),
          requirements,
          posted_by: user.id,
          status: 'open',
        })

      if (error) throw error

      // Success
      setSuccess(true)
      
      // Reset form
      setTitle('')
      setType('academic')
      setDescription('')
      setRequirements([])
      setRequirementInput('')

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error posting job:', error)
      alert('Failed to post job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a Job Opportunity</h2>

      {/* Success Toast */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Job posted successfully!</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Job Title *
          </label>
          <input
            id="title"
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
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Job Type *
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as JobType)}
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Posting...
            </span>
          ) : (
            'Post Job'
          )}
        </button>
      </form>
    </div>
  )
}

