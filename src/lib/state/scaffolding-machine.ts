/**
 * Elephant-Goldfish: Tactile Elementary Math
 * Explicit Finite State Machine for Socratic Progressive Hint Ladders.
 *
 * Implements deterministic 3-tier progressive scaffolding across NC.2.OA.3,
 * NC.2.OA.4, and NC.2.G.3:
 *
 * State Transitions:
 *  - constructing: Active manipulative construction.
 *  - tier1_prompt: First failure; targeted Socratic cognitive prompt.
 *  - tier2_ghost: Second failure; visual ghost assist outline active.
 *  - tier3_demonstrate: Third failure or help request; step demonstrated, mastery revoked.
 *  - validated: Solved correctly, celebration active.
 *
 * Guaranteed Invariants:
 *  1. State Mutation Guard: modifying any token/cut in tier1 resets to constructing;
 *     in tier2, ghost assist remains visible while constructing; in validated, dismisses validation.
 *  2. Tier 3 Demonstration revokes mastery eligibility for that instance and unlocks isomorphic retry.
 *  3. Invariant selectors guarantee no impossible state combinations (e.g. validated with tier > 0).
 */

import type { MascotPose } from "../ink/art/mascots/index.ts"

export type ScaffoldingTier = 0 | 1 | 2 | 3

export type ScaffoldingPhase =
  "constructing" | "tier1_prompt" | "tier2_ghost" | "tier3_demonstrate" | "validated"

export interface ScaffoldingState {
  readonly phase: ScaffoldingPhase
  readonly tier: ScaffoldingTier
  readonly failureCount: number
  readonly isGhostVisible: boolean
  readonly feedback: string | null
  readonly wasDemonstrated: boolean
  readonly masteryEligible: boolean
  readonly isValidated: boolean
  readonly mascotPose: MascotPose
  readonly tierBadge: string
}

export type ScaffoldingEvent =
  | { type: "TOKEN_MUTATED" }
  | { type: "EVALUATION_SUCCESS"; feedback: string; badge: string }
  | {
      type: "EVALUATION_FAILURE"
      feedback: string
      tierBadge?: string
      tier1Pose?: MascotPose
    }
  | {
      type: "REQUEST_DEMONSTRATION"
      feedback: string
      tierBadge?: string
    }
  | { type: "TRIGGER_ISOMORPHIC_RETRY"; initialBadge: string }
  | { type: "RESET"; initialBadge: string }

export function createInitialScaffoldingState(initialBadge: string): ScaffoldingState {
  return {
    phase: "constructing",
    tier: 0,
    failureCount: 0,
    isGhostVisible: false,
    feedback: null,
    wasDemonstrated: false,
    masteryEligible: true,
    isValidated: false,
    mascotPose: "idle",
    tierBadge: initialBadge,
  }
}

/**
 * Pure transition function for the Socratic Scaffolding State Machine.
 */
export function scaffoldingReducer(
  state: ScaffoldingState,
  event: ScaffoldingEvent,
  initialBadge: string,
): ScaffoldingState {
  switch (event.type) {
    case "TOKEN_MUTATED": {
      if (state.isValidated) {
        return {
          ...state,
          phase: "constructing",
          isValidated: false,
          mascotPose: "idle",
          tierBadge: initialBadge,
          feedback: null,
        }
      }

      if (state.phase === "tier1_prompt") {
        return {
          ...state,
          phase: "constructing",
          feedback: null,
        }
      }

      if (state.phase === "tier2_ghost") {
        // Ghost assist remains visible during construction
        return {
          ...state,
          phase: "constructing",
          // isGhostVisible stays true
        }
      }

      if (state.phase === "tier3_demonstrate") {
        return {
          ...state,
          phase: "constructing",
        }
      }

      return state.phase === "constructing" ? state : { ...state, phase: "constructing" }
    }

    case "EVALUATION_SUCCESS": {
      return {
        ...state,
        phase: "validated",
        tier: 0,
        isValidated: true,
        mascotPose: "celebrate",
        tierBadge: event.badge,
        feedback: event.feedback,
      }
    }

    case "EVALUATION_FAILURE": {
      const nextFail = state.failureCount + 1

      if (nextFail === 1) {
        // Escalate to Tier 1: Targeted Socratic Prompt
        return {
          ...state,
          phase: "tier1_prompt",
          tier: 1,
          failureCount: 1,
          isValidated: false,
          feedback: event.feedback,
          tierBadge: event.tierBadge ?? "Step 1: Check Your Work",
          mascotPose: event.tier1Pose ?? "think",
        }
      }

      if (nextFail === 2) {
        // Escalate to Tier 2: Visual Assist Ghost Outline
        return {
          ...state,
          phase: "tier2_ghost",
          tier: 2,
          failureCount: 2,
          isGhostVisible: true,
          isValidated: false,
          tierBadge: event.tierBadge ?? "Step 2: Ghost Assist",
          mascotPose: "sketch",
          feedback: event.feedback,
        }
      }

      // 3 or more failures: Escalate to Tier 3 Step Demonstration
      return {
        ...state,
        phase: "tier3_demonstrate",
        tier: 3,
        failureCount: nextFail,
        wasDemonstrated: true,
        masteryEligible: false,
        isGhostVisible: true,
        isValidated: false,
        mascotPose: "sketch",
        tierBadge: event.tierBadge ?? "Step 3: Step Demonstration",
        feedback: event.feedback,
      }
    }

    case "REQUEST_DEMONSTRATION": {
      return {
        ...state,
        phase: "tier3_demonstrate",
        tier: 3,
        wasDemonstrated: true,
        masteryEligible: false,
        isGhostVisible: true,
        isValidated: false,
        mascotPose: "sketch",
        tierBadge: event.tierBadge ?? "Step 3: Step Demonstration",
        feedback: event.feedback,
      }
    }

    case "TRIGGER_ISOMORPHIC_RETRY": {
      return {
        phase: "constructing",
        tier: 0,
        failureCount: 0,
        isGhostVisible: false,
        feedback: null,
        wasDemonstrated: false,
        masteryEligible: true,
        isValidated: false,
        mascotPose: "wave",
        tierBadge: event.initialBadge,
      }
    }

    case "RESET": {
      return {
        phase: "constructing",
        tier: 0,
        failureCount: 0,
        isGhostVisible: false,
        feedback: null,
        wasDemonstrated: false,
        masteryEligible: true,
        isValidated: false,
        mascotPose: "idle",
        tierBadge: event.initialBadge,
      }
    }

    default:
      return state
  }
}
