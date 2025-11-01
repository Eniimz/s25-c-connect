import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSupported, setNotificationSupported] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [projects, setProjects] = useState<Array<{name: string, description?: string}>>([])
  const [projectNameInput, setProjectNameInput] = useState('')
  const [projectDescInput, setProjectDescInput] = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)

  // Check if browser supports notifications
  useEffect(() => {
    setNotificationSupported('Notification' in window && 'serviceWorker' in navigator)
  }, [])

  // Fetch profile skills on mount
  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('skills, notifications_enabled, full_name, bio, projects')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        setSkills(data.skills || [])
        setNotificationsEnabled(data.notifications_enabled || false)
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        // Convert string array to object array for backward compatibility
        const projectsData = data.projects || []
        setProjects(projectsData.map((p: any) => {
          if (typeof p === 'object' && p !== null) return p
          if (typeof p === 'string') {
            try {
              const parsed = JSON.parse(p)
              if (typeof parsed === 'object' && parsed !== null) return parsed
              return { name: p }
            } catch {
              return { name: p }
            }
          }
          return { name: String(p) }
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add skill
  const handleAddSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  // Remove skill
  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  // Add project
  const handleAddProject = () => {
    const nameTrimmed = projectNameInput.trim()
    if (nameTrimmed) {
      const descTrimmed = projectDescInput.trim()
      setProjects([...projects, { 
        name: nameTrimmed, 
        description: descTrimmed || undefined 
      }])
      setProjectNameInput('')
      setProjectDescInput('')
    }
  }

  // Remove project
  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, idx) => idx !== index))
  }

  // Handle notification toggle
  const handleToggleNotifications = async () => {
    if (!user || !notificationSupported) return

    try {
      // Request notification permission if enabling
      if (!notificationsEnabled) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          alert('Notification permission denied. Please enable it in your browser settings.')
          return
        }
      }

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: !notificationsEnabled })
        .eq('id', user.id)

      if (error) throw error

      setNotificationsEnabled(!notificationsEnabled)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      console.error('Error updating notification preference:', error)
      alert('Failed to update notification preference. Please try again.')
    }
  }

  // Handle resume upload
  const handleResumeUpload = async (file: File) => {
    if (!user) return

    try {
      setUploadingResume(true)
      setSuccess(false)

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `resumes/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      // 3. Call backend API to parse resume
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://s25-c-connect-3st9.vercel.app'
      const parseResponse = await fetch(`${backendUrl}/api/parse-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: publicUrl, userId: user.id })
      })

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        throw new Error(errorData.message || 'Failed to parse resume')
      }

      const parseResult = await parseResponse.json()

      // 4. Auto-fill form with parsed data
      if (parseResult.success && parseResult.data) {
        setFullName(parseResult.data.full_name || fullName)
        setBio(parseResult.data.bio || bio)
        // Convert string array to object array
        const parsedProjects = (parseResult.data.projects || []).map((p: string) => ({ name: p }))
        setProjects(parsedProjects)
        setSkills(parseResult.data.skills || skills)

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        alert('Resume uploaded and parsed successfully! Review and save your profile.')
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Failed to upload and parse resume: ${error.message || 'Unknown error. Please check console for details.'}`)
    } finally {
      setUploadingResume(false)
    }
  }

  // Save profile
  const handleSave = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setSaving(true)
      setSuccess(false)

      const { error } = await supabase
        .from('profiles')
        .update({ 
          skills,
          full_name: fullName,
          bio: bio,
          projects: projects // Store as objects, Supabase will handle it as JSONB
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Your Profile</h2>
            <p className="text-gray-600 text-sm">
              {user?.email}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Profile updated successfully!</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 mt-2">Loading profile...</p>
            </div>
          )}

          {/* Form */}
          {!loading && (
            <form onSubmit={handleSave} className="space-y-8">
              {/* Resume Upload */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Resume</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your resume and we'll automatically extract your details using AI
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleResumeUpload(file)
                        }}
                        disabled={uploadingResume || saving}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
                          uploadingResume || saving
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {uploadingResume ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Upload Resume</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              {notificationSupported && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
                      </div>
                      <p className="text-sm text-gray-600 ml-[52px]">
                        Get notified when you receive new messages
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleNotifications}
                      disabled={saving}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        notificationsEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Divider with "OR" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR Enter Details Manually</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your full name"
                  disabled={saving}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us about yourself (2-3 sentences)"
                  disabled={saving}
                />
                <p className="mt-3 text-sm text-gray-500">
                  A brief description to help others understand your background
                </p>
              </div>

              {/* Projects */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Projects
                </label>
                {projects.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {projects.map((project, idx) => (
                      <div
                        key={idx}
                        className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 mb-1">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-sm text-purple-700">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0"
                          disabled={saving}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Project Input */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={projectNameInput}
                      onChange={(e) => setProjectNameInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProject())}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Project name"
                      disabled={saving}
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={projectDescInput}
                      onChange={(e) => setProjectDescInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProject())}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Description (optional)"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      disabled={saving || !projectNameInput.trim()}
                      className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Showcase your previous work and achievements
                </p>
              </div>

              {/* Current Skills */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Your Skills
                </label>
                {skills.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-indigo-600 transition-colors"
                          disabled={saving}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Skill Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Add a skill and press Enter"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={saving || !skillInput.trim()}
                    className="px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Your skills help match you with relevant opportunities
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {saving ? (
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
          )}
        </div>
      </main>
    </div>
  )
}

