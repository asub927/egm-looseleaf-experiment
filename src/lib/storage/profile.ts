/**
 * Elephant-Goldfish: Tactile Elementary Math
 *
 * Anonymous Zero-PII Student Profile Storage for COPPA Exemption.
 *
 * Under the Children's Online Privacy Protection Act (COPPA), applications
 * for children under 13 must not collect, transmit, or store personally
 * identifiable information (PII). This module stores only anonymous, client-local
 * learning state (avatar icon, star count, theme preference, and standard mastery flags)
 * in the browser's localStorage. No network requests, telemetry, or student identities
 * are ever utilized.
 */

export const PROFILE_STORAGE_KEY = "egm_student_profile" as const

export type AvatarType = "fox" | "rocket" | "star"
export type StudentTheme = "honey" | "sky" | "cork" | "meadow" | "studio"

export interface StudentProfile {
  schemaVersion: 1
  avatar: AvatarType
  grade: 2
  stars: number
  theme: StudentTheme
  masteredStandards: Record<string, boolean>
}

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  schemaVersion: 1,
  avatar: "fox", // Kit the Fox by default
  grade: 2,
  stars: 3,
  theme: "honey",
  masteredStandards: {},
}

/**
 * Safely accesses browser localStorage, returning null in non-browser
 * environments (e.g. Node tests, SSR) or if storage access is blocked.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Storage access may be blocked in restricted iframes or privacy modes
  }
  return null
}

/**
 * Sanitizes and validates an arbitrary input into a strictly typed StudentProfile,
 * falling back gracefully to defaults for any missing or invalid fields.
 */
function sanitizeProfile(raw: unknown): StudentProfile {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_STUDENT_PROFILE,
      masteredStandards: { ...DEFAULT_STUDENT_PROFILE.masteredStandards },
    }
  }

  const candidate = raw as Partial<StudentProfile>

  const validAvatars: readonly AvatarType[] = ["fox", "rocket", "star"]
  const validThemes: readonly StudentTheme[] = ["honey", "sky", "cork", "meadow", "studio"]

  const avatar: AvatarType =
    typeof candidate.avatar === "string" && (validAvatars as readonly string[]).includes(candidate.avatar)
      ? (candidate.avatar as AvatarType)
      : DEFAULT_STUDENT_PROFILE.avatar

  const stars: number =
    typeof candidate.stars === "number" && Number.isFinite(candidate.stars) && candidate.stars >= 0
      ? Math.floor(candidate.stars)
      : DEFAULT_STUDENT_PROFILE.stars

  const theme: StudentTheme =
    typeof candidate.theme === "string" && (validThemes as readonly string[]).includes(candidate.theme)
      ? (candidate.theme as StudentTheme)
      : DEFAULT_STUDENT_PROFILE.theme

  const masteredStandards: Record<string, boolean> = {}
  if (
    candidate.masteredStandards &&
    typeof candidate.masteredStandards === "object" &&
    !Array.isArray(candidate.masteredStandards)
  ) {
    for (const [key, value] of Object.entries(candidate.masteredStandards)) {
      if (typeof key === "string" && typeof value === "boolean") {
        masteredStandards[key] = value
      }
    }
  }

  return {
    schemaVersion: 1,
    avatar,
    grade: 2,
    stars,
    theme,
    masteredStandards,
  }
}

/**
 * Loads the student profile from localStorage under key `egm_student_profile`.
 * Falls back to default values if uninitialized or corrupted.
 */
export function loadStudentProfile(): StudentProfile {
  const storage = getStorage()
  if (!storage) {
    return {
      ...DEFAULT_STUDENT_PROFILE,
      masteredStandards: { ...DEFAULT_STUDENT_PROFILE.masteredStandards },
    }
  }

  try {
    const raw = storage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) {
      return {
        ...DEFAULT_STUDENT_PROFILE,
        masteredStandards: { ...DEFAULT_STUDENT_PROFILE.masteredStandards },
      }
    }
    const parsed = JSON.parse(raw)
    return sanitizeProfile(parsed)
  } catch {
    return {
      ...DEFAULT_STUDENT_PROFILE,
      masteredStandards: { ...DEFAULT_STUDENT_PROFILE.masteredStandards },
    }
  }
}

/**
 * Persists the student profile to localStorage.
 */
export function saveStudentProfile(profile: StudentProfile): StudentProfile {
  const sanitized = sanitizeProfile(profile)
  const storage = getStorage()
  if (storage) {
    try {
      storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitized))
    } catch {
      // Handle quota exceeded or private browsing restrictions silently
    }
  }
  return sanitized
}

/**
 * Increments the student's star reward count and persists the change.
 */
export function addStars(count: number = 1): StudentProfile {
  const current = loadStudentProfile()
  const increment = Number.isFinite(count) ? Math.floor(count) : 0
  const updatedStars = Math.max(0, current.stars + increment)
  const updated: StudentProfile = {
    ...current,
    stars: updatedStars,
  }
  return saveStudentProfile(updated)
}

/**
 * Marks a curriculum standard as mastered (e.g. "NC.2.OA.3" or "NC.2.OA.4") and persists the change.
 */
export function markStandardMastered(standardId: string): StudentProfile {
  const current = loadStudentProfile()
  const updated: StudentProfile = {
    ...current,
    masteredStandards: {
      ...current.masteredStandards,
      [standardId]: true,
    },
  }
  return saveStudentProfile(updated)
}

/**
 * Updates the student's desk theme preference ("honey" | "sky" | "cork" | "meadow") and persists the change.
 */
export function setThemePreference(theme: StudentTheme): StudentProfile {
  const current = loadStudentProfile()
  const updated: StudentProfile = {
    ...current,
    theme,
  }
  return saveStudentProfile(updated)
}

/**
 * Resets the student profile to initial defaults.
 */
export function resetProfile(): StudentProfile {
  const fresh: StudentProfile = {
    ...DEFAULT_STUDENT_PROFILE,
    masteredStandards: {},
  }
  const storage = getStorage()
  if (storage) {
    try {
      storage.removeItem(PROFILE_STORAGE_KEY)
      storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(fresh))
    } catch {
      // Storage access issue
    }
  }
  return fresh
}
