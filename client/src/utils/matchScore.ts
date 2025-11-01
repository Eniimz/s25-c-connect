interface Job {
  requirements: string[]
  [key: string]: any
}

interface Profile {
  skills: string[]
  [key: string]: any
}

/**
 * Calculate match score between job requirements and profile skills
 * @param job - Job with requirements array
 * @param profile - Profile with skills array
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

  // Normalize strings for comparison (case-insensitive, trimmed)
  const normalize = (str: string) => str.toLowerCase().trim()
  
  const jobRequirements = job.requirements.map(normalize)
  const profileSkills = profile.skills.map(normalize)

  // Count matched skills
  let matched = 0
  for (const requirement of jobRequirements) {
    if (profileSkills.includes(requirement)) {
      matched++
    }
  }

  // Calculate percentage
  const score = (matched / jobRequirements.length) * 100
  
  // Round to nearest integer
  return Math.round(score)
}

