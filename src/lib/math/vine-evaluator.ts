/**
 * Mathematical Evaluator and Problem Seeds for The Whispering Vine (NC.2.OA.2).
 *
 * Implements deterministic diagnostic evaluation for 2nd Grade addition/subtraction
 * fact strategies ("Think Addition", Missing Addend, Make 10).
 *
 * Fully decoupled from React DOM, window, and browser APIs to execute deterministically
 * in Node.js test runners in sub-millisecond time.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface VineProblemSeed {
  /** Unique problem seed identifier (e.g. 'vine-10-6') */
  id: string
  /** Target whole representing the full vine height (default 10 for NC.2.OA.2) */
  whole: number
  /** Number of known starting blossoms already open on the lower vine */
  known: number
  /** Child-friendly guiding math question */
  prompt: string
  /** Whimsical story narrative introducing Barnaby the Snail's garden problem */
  story: string
  /** Facilitation prompt for parents/teachers during co-play */
  coplayPrompt: string
}

export type VineSubmissionVia = "drag" | "tap" | "keyboard"

export interface VineSubmission {
  /** The id of the problem seed being answered */
  problemId: string
  /** Student's initial prediction guess, or null if skipped */
  guess: number | null
  /** Number of additional blossoms dragged or selected by the learner */
  dragged: number
  /** Input modality used for the interaction */
  via: VineSubmissionVia
}

export type VineVerdict = "correct" | "underfilled" | "overfilled"

export interface VineEvaluationResult {
  /** Structured verdict assessing whether the vine reached exactly whole */
  verdict: VineVerdict
  /** Difference between dragged quantity and expected quantity (dragged - expected) */
  diff: number
  /** Expected missing quantity (whole - known) */
  expected: number
  /** Metacognitive reflection trigger: true when guess !== dragged and dragged is correct */
  mismatchReflectionNeeded: boolean
  /** Pedagogical Socratic hint or congratulatory affirmation */
  hint: string
  /** NC Standard mathematical strategy classification */
  strategyName: string
}

// ============================================================================
// Canonical Problem Seeds (NC.2.OA.2: 10 - ?)
// ============================================================================

export const CANONICAL_VINE_SEEDS: readonly VineProblemSeed[] = [
  {
    id: "vine-10-6",
    whole: 10,
    known: 6,
    prompt: "How many more flowers until the vine is full?",
    story: "Barnaby's vine already has 6 open blossoms, but needs 10 to reach the garden trellis!",
    coplayPrompt: "Ask your learner: 'How did you count the sleeping buds in the gap?'",
  },
  {
    id: "vine-10-3",
    whole: 10,
    known: 3,
    prompt: "How many more flowers until the vine is full?",
    story: "3 little flowers popped open this morning. 10 flowers make a full vine!",
    coplayPrompt:
      "Ask your learner: 'Can you see how many more to make 5, and then 5 more to make 10?'",
  },
  {
    id: "vine-10-8",
    whole: 10,
    known: 8,
    prompt: "How many more flowers until the vine is full?",
    story: "8 glowing flowers are already awake! The top of the vine is almost reached.",
    coplayPrompt: "Ask your learner: 'Is 8 close to 10? How many steps away is it?'",
  },
  {
    id: "vine-10-4",
    whole: 10,
    known: 4,
    prompt: "How many more flowers until the vine is full?",
    story: "4 blossoms are smiling in the sun. How many more are waiting to bloom?",
    coplayPrompt: "Ask your learner: 'What number partners with 4 to make 10?'",
  },
  {
    id: "vine-10-7",
    whole: 10,
    known: 7,
    prompt: "How many more flowers until the vine is full?",
    story: "7 blossoms are dancing on the vine. How many sleeping buds are left?",
    coplayPrompt: "Ask your learner: 'If you count up from 7 to 10, what numbers do you say?'",
  },
  {
    id: "vine-10-5",
    whole: 10,
    known: 5,
    prompt: "How many more flowers until the vine is full?",
    story: "5 blossoms are open—halfway there! How many more to make the full 10?",
    coplayPrompt: "Ask your learner: 'Do you know your doubles? 5 plus what makes 10?'",
  },
]

export const VINE_SEEDS = CANONICAL_VINE_SEEDS

/**
 * Lookup a canonical seed by its unique identifier.
 */
export function getVineSeedById(id: string): VineProblemSeed | undefined {
  return CANONICAL_VINE_SEEDS.find((seed) => seed.id === id)
}

/**
 * Validate that a problem seed conforms to NC.2.OA.2 structural requirements.
 */
export function validateVineProblemSeed(seed: unknown): VineProblemSeed | null {
  if (!seed || typeof seed !== "object") return null
  const s = seed as Partial<VineProblemSeed>
  if (typeof s.id !== "string" || s.id.trim().length === 0) return null
  if (typeof s.whole !== "number" || !Number.isFinite(s.whole) || s.whole <= 0) return null
  if (typeof s.known !== "number" || !Number.isFinite(s.known) || s.known < 0 || s.known > s.whole)
    return null
  if (typeof s.prompt !== "string" || s.prompt.trim().length === 0) return null
  if (typeof s.story !== "string" || s.story.trim().length === 0) return null
  if (typeof s.coplayPrompt !== "string" || s.coplayPrompt.trim().length === 0) return null

  return {
    id: s.id,
    whole: Math.round(s.whole),
    known: Math.round(s.known),
    prompt: s.prompt,
    story: s.story,
    coplayPrompt: s.coplayPrompt,
  }
}

// ============================================================================
// Evaluator Function
// ============================================================================

/**
 * Evaluates a user submission against a Whispering Vine problem seed.
 *
 * Mathematical Invariants:
 *  - expected = whole - known (minuend - subtrahend = difference)
 *  - diff = safeDragged - expected
 *  - verdict = 'correct' when diff === 0
 *  - verdict = 'underfilled' when diff < 0
 *  - verdict = 'overfilled' when diff > 0
 *  - mismatchReflectionNeeded is triggered iff verdict === 'correct', guess is non-null,
 *    and guess !== safeDragged (metacognitive calibration).
 *
 * Robust against NaN, non-finite values, negative numbers, and boundary violations.
 */
export function evaluateVineSubmission(
  seed: VineProblemSeed,
  submission: VineSubmission,
): VineEvaluationResult {
  // 1. Sanitize seed inputs (Zero NaN, non-negative, valid bounds)
  const safeWhole = Number.isFinite(seed?.whole) ? Math.max(0, Math.round(seed.whole)) : 10
  const safeKnown = Number.isFinite(seed?.known)
    ? Math.max(0, Math.min(safeWhole, Math.round(seed.known)))
    : 0
  const expected = safeWhole - safeKnown

  // 2. Sanitize user submission inputs (Zero NaN, clamp negative to 0)
  const rawDragged = Number.isFinite(submission?.dragged) ? submission.dragged : 0
  const safeDragged = Math.max(0, Math.round(rawDragged))

  const rawGuess = submission?.guess
  const safeGuess =
    rawGuess !== null && rawGuess !== undefined && Number.isFinite(rawGuess)
      ? Math.max(0, Math.round(rawGuess))
      : null

  // 3. Compute difference from expected target
  const diff = safeDragged - expected

  // 4. Determine verdict and pedagogical feedback
  let verdict: VineVerdict
  let hint: string

  if (diff === 0) {
    verdict = "correct"
    hint = `${safeKnown} blossoms + ${expected} new flowers = ${safeWhole} total blossoms. So ${safeWhole} − ${safeKnown} = ${expected}.`
  } else if (diff < 0) {
    verdict = "underfilled"
    const remaining = expected - safeDragged
    hint =
      remaining === 1
        ? "There is still 1 sleeping bud glowing in the gap. Slide higher to wake it!"
        : `There are still ${remaining} sleeping buds glowing in the gap. Slide higher to wake them!`
  } else {
    verdict = "overfilled"
    const extra = safeDragged - expected
    hint =
      extra === 1
        ? `The vine went 1 bud past ${safeWhole}! Slide down a bit to fill exactly ${safeWhole}.`
        : `The vine went past ${safeWhole}! Slide down a bit to fill exactly ${safeWhole}.`
  }

  // 5. Metacognitive mismatch reflection trigger
  // Spark thoughtful reflection when prediction was non-null and differed from the correct tactile count
  const mismatchReflectionNeeded =
    verdict === "correct" && safeGuess !== null && safeGuess !== safeDragged

  return {
    verdict,
    diff,
    expected,
    mismatchReflectionNeeded,
    hint,
    strategyName: "Think Addition (10 − ?)",
  }
}
