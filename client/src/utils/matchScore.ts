interface Job {
  requirements: string[]
  title?: string
  description?: string
  [key: string]: any
}

interface Profile {
  skills: string[]
  full_name?: string
  bio?: string
  projects?: Array<{name: string, description?: string}> | string[]
  [key: string]: any
}

/**
 * Normalize text for comparison (case-insensitive, trimmed, special chars removed)
 */
const normalize = (str: string): string => {
  return str.toLowerCase().trim().replace(/[^\w\s]/g, ' ')
}

/**
 * Extract keywords from text using common tech terms
 */
const extractKeywords = (text: string): Set<string> => {
  if (!text) return new Set()
  
  const normalized = normalize(text)
  const words = normalized.split(/\s+/).filter(w => w.length > 2)
  const keywords = new Set<string>()
  
  // Common tech keywords
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'react', 'vue', 'angular',
    'node', 'express', 'django', 'flask', 'spring', 'mongodb', 'postgresql', 'mysql',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'ci/cd', 'api', 'rest',
    'graphql', 'webpack', 'npm', 'redux', 'vuex', 'sass', 'less', 'html', 'css',
    'machine learning', 'ml', 'ai', 'data science', 'backend', 'frontend', 'fullstack',
    'devops', 'microservices', 'agile', 'scrum', 'testing', 'tdd', 'oop', 'sql',
    'nosql', 'redis', 'elasticsearch', 'rabbitmq', 'kafka', 'nginx', 'linux'
  ]
  
  // Add individual words and tech keywords
  words.forEach(word => keywords.add(word))
  techKeywords.forEach(keyword => {
    if (normalized.includes(keyword)) {
      keywords.add(keyword)
    }
  })
  
  return keywords
}

/**
 * Calculate skill overlap score
 */
const calculateSkillMatch = (jobReqs: string[], profileSkills: string[]): number => {
  if (!jobReqs || jobReqs.length === 0) return 0
  if (!profileSkills || profileSkills.length === 0) return 0
  
  const normalizedReqs = jobReqs.map(normalize)
  const normalizedSkills = profileSkills.map(normalize)
  
  let matched = 0
  const matchedTerms = new Set<string>()
  
  // Exact matches
  for (const req of normalizedReqs) {
    if (normalizedSkills.includes(req)) {
      matched++
      matchedTerms.add(req)
    }
  }
  
  // Partial matches (if requirement contains skill or vice versa)
  for (const req of normalizedReqs) {
    if (matchedTerms.has(req)) continue
    
    for (const skill of normalizedSkills) {
      if (req.includes(skill) || skill.includes(req)) {
        matched += 0.5
        matchedTerms.add(req)
        break
      }
    }
  }
  
  return (matched / normalizedReqs.length) * 100
}

/**
 * Calculate contextual match score from text fields
 */
const calculateContextMatch = (jobText: string, profileText: string): number => {
  if (!jobText) return 0
  if (!profileText) return 0
  
  const jobKeywords = extractKeywords(jobText)
  const profileKeywords = extractKeywords(profileText)
  
  if (jobKeywords.size === 0) return 0
  
  let matches = 0
  const jobKeywordsArray = Array.from(jobKeywords)
  for (const keyword of jobKeywordsArray) {
    if (profileKeywords.has(keyword)) {
      matches++
    }
  }
  
  return (matches / jobKeywords.size) * 100
}

/**
 * Calculate match score between job and profile using comprehensive analysis
 * @param job - Job with requirements, title, description
 * @param profile - Profile with skills, bio, projects
 * @returns Match score as percentage (0-100)
 */
export function calculateMatchScore(job: Job, profile: Profile): number {
  // Handle edge cases
  if (!job.requirements || job.requirements.length === 0) {
    return 100 // Perfect match if no requirements
  }
  
  if (!profile.skills || profile.skills.length === 0) {
    return 0 // No match if no skills
  }

  // Weighted components
  const weights = {
    skills: 0.60,    // 60% - Primary requirement matching
    jobContext: 0.20, // 20% - Job title + description context
    profileContext: 0.10, // 10% - Bio context
    projects: 0.10    // 10% - Project relevance
  }
  
  // 1. Skill matching (most important)
  const skillScore = calculateSkillMatch(job.requirements, profile.skills)
  
  // 2. Job context matching (title + description)
  const jobContextText = `${job.title || ''} ${job.description || ''}`
  const jobContextScore = calculateContextMatch(jobContextText, 
    `${profile.bio || ''} ${profile.skills.join(' ')}`)
  
  // 3. Profile context matching (bio)
  const bioContextScore = calculateContextMatch(
    jobContextText + ' ' + job.requirements.join(' '),
    profile.bio || ''
  )
  
  // 4. Project relevance
  let projectsScore = 0
  if (profile.projects && Array.isArray(profile.projects) && profile.projects.length > 0) {
    const projectsText = profile.projects.map((p: any) => {
      if (typeof p === 'object' && p !== null) {
        return `${p.name || ''} ${p.description || ''}`
      }
      return String(p)
    }).join(' ')
    
    projectsScore = calculateContextMatch(
      jobContextText + ' ' + job.requirements.join(' '),
      projectsText
    )
  }
  
  // Calculate weighted average
  const totalScore = 
    (skillScore * weights.skills) +
    (jobContextScore * weights.jobContext) +
    (bioContextScore * weights.profileContext) +
    (projectsScore * weights.projects)
  
  // Ensure score is between 0-100 and round
  const finalScore = Math.max(0, Math.min(100, totalScore))
  
  return Math.round(finalScore)
}

