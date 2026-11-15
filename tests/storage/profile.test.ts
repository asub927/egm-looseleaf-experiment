import test from "node:test"
import assert from "node:assert/strict"
import {
  PROFILE_STORAGE_KEY,
  DEFAULT_STUDENT_PROFILE,
  loadStudentProfile,
  saveStudentProfile,
  addStars,
  markStandardMastered,
  setThemePreference,
  resetProfile,
  type StudentProfile,
} from "../../src/lib/storage/profile.ts"

// Mock in-memory localStorage for Node test runner environment
class MockLocalStorage {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

test("Storage Profile: Returns defaults when uninitialized or empty", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage in node environment
  globalThis.window = { localStorage: mockStorage }

  const profile = loadStudentProfile()
  assert.equal(profile.schemaVersion, 1)
  assert.equal(profile.avatar, "fox")
  assert.equal(profile.grade, 2)
  assert.equal(profile.stars, 3)
  assert.equal(profile.theme, "honey")
  assert.deepEqual(profile.masteredStandards, {})
})

test("Storage Profile: Correctly saves and loads valid profile", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  const customProfile: StudentProfile = {
    schemaVersion: 1,
    avatar: "rocket",
    grade: 2,
    stars: 7,
    theme: "sky",
    masteredStandards: { "NC.2.OA.3": true },
  }

  const saved = saveStudentProfile(customProfile)
  assert.deepEqual(saved, customProfile)

  const loaded = loadStudentProfile()
  assert.deepEqual(loaded, customProfile)
  assert.ok(mockStorage.getItem(PROFILE_STORAGE_KEY))
})

test("Storage Profile: Gracefully sanitizes corrupted JSON or missing fields", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  // Corrupted JSON
  mockStorage.setItem(PROFILE_STORAGE_KEY, "{ bad json }")
  let profile = loadStudentProfile()
  assert.deepEqual(profile, DEFAULT_STUDENT_PROFILE)

  // Corrupted fields / malicious injection
  mockStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify({
      avatar: "hacker_dragon",
      stars: -50,
      theme: "neon_dark",
      masteredStandards: "not an object",
    }),
  )
  profile = loadStudentProfile()
  assert.equal(profile.avatar, "fox")
  assert.equal(profile.stars, 3)
  assert.equal(profile.theme, "honey")
  assert.deepEqual(profile.masteredStandards, {})
})

test("Storage Profile: addStars correctly increments star count", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  resetProfile()
  const initial = loadStudentProfile()
  assert.equal(initial.stars, 3)

  const afterOne = addStars(1)
  assert.equal(afterOne.stars, 4)

  const afterFive = addStars(5)
  assert.equal(afterFive.stars, 9)

  const reloaded = loadStudentProfile()
  assert.equal(reloaded.stars, 9)
})

test("Storage Profile: markStandardMastered persists completed standards", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  resetProfile()
  let profile = loadStudentProfile()
  assert.deepEqual(profile.masteredStandards, {})

  profile = markStandardMastered("NC.2.OA.3")
  assert.equal(profile.masteredStandards["NC.2.OA.3"], true)

  profile = markStandardMastered("NC.2.OA.4")
  assert.equal(profile.masteredStandards["NC.2.OA.3"], true)
  assert.equal(profile.masteredStandards["NC.2.OA.4"], true)

  const reloaded = loadStudentProfile()
  assert.equal(reloaded.masteredStandards["NC.2.OA.3"], true)
  assert.equal(reloaded.masteredStandards["NC.2.OA.4"], true)
})

test("Storage Profile: setThemePreference updates theme", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  resetProfile()
  let profile = loadStudentProfile()
  assert.equal(profile.theme, "honey")

  profile = setThemePreference("cork")
  assert.equal(profile.theme, "cork")

  profile = setThemePreference("meadow")
  assert.equal(profile.theme, "meadow")

  const reloaded = loadStudentProfile()
  assert.equal(reloaded.theme, "meadow")
})

test("Storage Profile: resetProfile restores initial state", () => {
  const mockStorage = new MockLocalStorage()
  // @ts-expect-error Mocking window.localStorage
  globalThis.window = { localStorage: mockStorage }

  addStars(10)
  markStandardMastered("NC.2.OA.3")
  setThemePreference("sky")

  const modified = loadStudentProfile()
  assert.equal(modified.stars, 13)
  assert.equal(modified.theme, "sky")
  assert.equal(modified.masteredStandards["NC.2.OA.3"], true)

  const reset = resetProfile()
  assert.deepEqual(reset, DEFAULT_STUDENT_PROFILE)

  const reloaded = loadStudentProfile()
  assert.deepEqual(reloaded, DEFAULT_STUDENT_PROFILE)
})
