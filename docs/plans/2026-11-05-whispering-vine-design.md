# Whispering Vine (10 − ?) Whimsical Manipulative Implementation Plan

> **Goal:** Build and integrate the whimsical "Whispering Vine & Dewdrop Snail" interactive math manipulative for 2nd Grade addition/subtraction fact strategies (NC.2.OA.2) into the Elephant & Goldfish application.
> **Architecture:** A modular React 19 + SVG component (`WhisperingVine.tsx`) driven by a deterministic mathematical evaluator, Web Audio kalimba sound synthesis, tactile pointer drag physics with magnetic snap, prediction pebble chips, and metacognitive mismatch reflection.
> **Tech Stack:** TypeScript, React 19, Tailwind CSS, Web Audio API, SVG PointerEvents, Node.js invariant test runner.

---

### Task 1: Mathematical Evaluator & Seeds for Whispering Vine (NC.2.OA.2)

- **Files:**
  - Create: `src/lib/math/vine-evaluator.ts`
  - Create: `tests/invariants/vine_evaluator.test.ts`
- **Behavior:**
  - Validates problem seeds: `{ id, whole: 10, known: number, prompt: string }`
  - Evaluates user submissions: `{ problemId, guess: number | null, dragged: number, via: 'drag' | 'tap' | 'keyboard' }`
  - Returns structured verdicts: `correct`, `underfilled`, `overfilled`, with mismatch reflection triggers when `guess !== dragged && dragged === (whole - known)`.
- **Verification:** Node.js invariant test verifying 100% boundary conditions, negative protection, and fuzzy inputs.

---

### Task 2: Whimsical Audio Synthesizer (Kalimba & Garden Chimes)

- **Files:**
  - Create: `src/lib/audio/garden-chimes.ts`
- **Behavior:**
  - Dual-oscillator sine + triangle wood marimba / kalimba synthesis using Web Audio API.
  - Pentatonic scale mapping across 10 growth nodes (C4 to C6).
  - Celebration wind chime chord progression upon filling the vine.
  - Graceful no-op fallback when Web Audio is disabled or suspended.

---

### Task 3: React 19 Component: `WhisperingVine.tsx`

- **Files:**
  - Create: `src/components/math/WhisperingVine.tsx`
- **Behavior:**
  - Pure SVG vector art: Terracotta pot, segmented bamboo vine, blooming peach petals, glowing golden firefly pods, ambient drifting fireflies.
  - Snail slider handle with vertical pointer drag, integer snapping, and floating live-counter badge.
  - Clickable sleeping buds for direct tap snapping.
  - "First, what do you think?" shuffled pebble prediction chips.
  - Socratic hint escalation on under/overfill without negative penalties.
  - Mismatch reflection dialog for self-calibration.
  - "Watch Snail" autonomous walkthrough with ghost wand cursor.
  - Sensory "Calm" mode toggle.
  - Grown-up co-play prompt card.

---

### Task 4: App Integration & Story Mode Wireframe

- **Files:**
  - Modify: `src/components/math/NC2GWireframe.tsx`
  - Modify: `src/App.tsx`
- **Behavior:**
  - Add "Whispering Vine (10 − ?)" to the top manipulative switcher alongside Baking Pan and Tart Plate.
  - Allow switching between Equal Shares and Whispering Vine seamlessly.

---

### Task 5: Full Invariant Test Suite & Production Build Verification

- **Files:**
  - Verify: `npm test` (all 35+ invariant tests must pass)
  - Verify: `npm run check` (TypeScript typecheck + Vite build must succeed with 0 errors)
