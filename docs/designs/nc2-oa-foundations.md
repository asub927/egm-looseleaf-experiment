# Tactile 2nd-Grade Math Foundations (NC.2.OA.3 & NC.2.OA.4)

* **Author:** Technical Design Team
* **Status:** Finalized (Implementation Phase)
* **Date:** 2026-11-02
* **Target Repository:** `https://github.com/asub927/egm-looseleaf-experiment.git`

---

## Overview

This project implements an offline-first, client-only web application designed for second-grade students (ages 7–8) that teaches the conceptual foundations of multiplication under the North Carolina Standard Course of Study:
* **NC.2.OA.3**: Determining odd and even parity within 20 by pairing objects, grouping into two equal sets, and expressing even numbers as a sum of two equal addends ($N = A + A$).
* **NC.2.OA.4**: Using addition to find the total number of objects arranged in rectangular arrays with up to 5 rows and up to 5 columns, and writing repeated addition equations by row and by column.

The application leverages the existing Looseleaf UI stationery component library (`@/components/ui` and `@/lib/ink`) to create an enactive, manipulative-first learning desk (graph paper, wooden rulers, stamps, stickers, and pencil companion) paired with an audio-first Socratic discovery loop:
* **Kit the Fox**: The learner avatar and local student profile who collects stars, unlocks stationery badges, and appears on the student desk ID chip.
* **Pencil Pal**: The companion pencil mascot who guides the student with warm Socratic voice prompts, reacts with dynamic poses (`idle`, `think`, `peek`, `sketch`, `celebrate`), and scaffolds mathematical discovery.

To ensure rich, expressive, child-friendly audio without violating the offline requirement, audio voice prompts and sound effects are pre-generated at development/build time using Google Gemini (`gemini-3.8-flash-tts`) and committed directly to the project as static assets (`public/audio/`). Questions are instantiated deterministically from verified North Carolina Department of Public Instruction (NCDPI) and Open Educational Resource (OER) curriculum archetypes. The application executes entirely client-side on GitHub Pages with zero external dependencies, collects zero student data for complete Children's Online Privacy Protection Act (COPPA) exemption, and operates seamlessly offline on low-cost classroom Chromebooks and iPads.

---

## The Problem

1. **The Literacy and Typing Trap in Early Elementary EdTech**:
   Most interactive math platforms for primary students rely on text-heavy conversational interfaces or multiple-choice quizzes. For 7-year-olds (who are emerging decoders with reading levels around Lexile 400L), reading paragraphs of instructions or typing answers on a keyboard induces severe cognitive fatigue unrelated to mathematical understanding. Children frequently guess blindly or abandon the tool.
2. **Abstract Rote Drills Without Concrete Grounding**:
   Multiplication readiness requires internalizing spatial structures (equal groups, rectangular arrays, row/column commutativity, parity pairing). Traditional drill software displays abstract equations ($3 \times 4 = 12$) without letting the child physically partition, rotate, or repair the groups, preventing genuine conceptual understanding.
3. **Fragile EdTech Infrastructure & Privacy Overhead**:
   Classroom web tools often require user accounts, teacher logins, and persistent server connections. In elementary schools with shared device carts, strict district firewalls, and COPPA restrictions on tracking minors, server-dependent apps introduce authentication failures, subscription costs, and maintenance burdens.

---

## Proposed Solution

A standalone, zero-PII tactile math laboratory where mathematical concepts are discovered through direct physical manipulation of stationery tokens on a grid:
* **Enactive Learning**: Math is performed through direct physical manipulation of stationery tokens (cookies, carrots, counters) on Looseleaf graph paper and pairing mats.
* **Socratic Audio Guidance**: Guidance is delivered through single-sentence audio prompts and a reactive pencil mascot ("Pencil Pal").
* **Autonomous Scaffolding Ladder**: When a student struggles, a deterministic 3-tier scaffolding ladder (Socratic Prompt $\rightarrow$ Visual Assist Ghost Outline $\rightarrow$ Step Demonstration with Isomorphic Retry) offers progressive support without ever doing the thinking for the child.
* **Property-Based Invariant Safety**: Math validation and pedagogical misconceptions (such as orientation errors) are verified by pure headless evaluators backed by Meta-inspired Just-In-Time (JiT) invariant testing running in under 150ms.

---

## Goals

* **Goal 1 (Curriculum Standard Alignment)**: Provide 100% standard coverage for NC.2.OA.3 and NC.2.OA.4 using the exact verified strategy names from the NCDPI Unpacked Content (`Pairing objects`, `Placing into two equal groups`, `Sum of two equal addends`, `Adding by rows`, `Adding by columns`).
* **Goal 2 (Manipulative-First Tactile UX)**: Deliver an enactive manipulative canvas using Looseleaf UI components (`Paper stock="graph"`, `StampButton`, `Mascot`, `Tape`, `Seal`) supporting dual-mode input (tap-to-place and drag-and-drop with magnetic snapping). Physical touch targets feature minimum visual $48\text{px} \times 48\text{px}$ elements with an expanded $8\text{px}$ touch slop/padding area yielding a $56\text{px} \times 56\text{px}$ interactive hit boundary (exceeding WCAG 2.2 AAA $44\text{px}$ requirements).
* **Goal 3 (Low-Literacy Accessibility via Two-Tier Audio Engine)**: Ensure zero literacy barriers for 2nd graders by pairing every on-screen Socratic prompt and mascot dialogue with audio voice guidance. At runtime, a zero-dependency Tier 1 engine provides procedural Web Audio oscillator sound effects and native Web Speech API narration (`src/lib/audio/sfx.ts`). Tier 2 builds out pre-rendered, expressive child-friendly voice audio pre-generated via Google Gemini (`gemini-3.8-flash-tts`) committed directly as offline static project assets (`public/audio/`), supplemented with synchronized word highlighting.
* **Goal 4 (Autonomous Socratic Scaffolding)**: Implement a deterministic 3-tier progressive hint ladder (Tier 1: Socratic Prompt $\rightarrow$ Tier 2: Visual Assist Ghost Outline $\rightarrow$ Tier 3: Step Demonstration with Isomorphic Retry) that preserves student agency and prevents learned helplessness.
* **Goal 5 (Zero-Backend COPPA Exemption & Offline PWA)**: Deploy as an offline-capable Progressive Web App on GitHub Pages with zero server backend, zero network tracking, and client-only `localStorage` profile persistence.
* **Goal 6 (Classroom Device Performance)**: Maintain 60 FPS touch responsiveness on budget education hardware (sub-$200 Intel Celeron / MediaTek Chromebooks and 6th-gen iPads) by optimizing Looseleaf procedural SVG filter execution.
* **Goal 7 (Pedagogical Invariant Safety via JiTTesting)**: Guarantee 100% mathematical and curriculum correctness using a "Human-on-the-Loop" Just-In-Time Testing architecture (`tests/invariants/` and `scripts/jittest.ts`). Ensure orientation constraints (e.g., rejecting 4 rows of 3 when 3 rows are requested) and Socratic misconception diagnostics are caught autonomously at PR/pre-commit time before landing in under 150ms.

---

## Non-Goals

* **Non-Goal 1 (Out-of-Scope Standards)**: No support for multi-digit multiplication, division, fractions, or word problems within 100 (NC.2.OA.1 and NC.2.OA.2 are reserved for Phase 2).
* **Non-Goal 2 (No Server or Authentication Backend)**: No student logins, cloud accounts, database storage, email capture, or server-side sync.
* **Non-Goal 3 (No Freeform Canvas or OCR)**: No unconstrained freehand drawing, physics sandboxes, or handwriting recognition algorithms.
* **Non-Goal 4 (No Live LLM Runtime)**: No runtime LLM streaming, generative chatbots, or non-deterministic prompt engines.
* **Non-Goal 5 (No Teacher Grading Dashboard)**: No multi-school administrative portals or grading telemetry feeds.
* **Non-Goal 6 (No Audio Input / Speech Recognition)**: No microphone capture, speech-to-text, or student voice analysis. All student interactions are direct tactile gestures (tap, drag) and visual feedback.
* **Non-Goal 7 (No Legacy Browser Compatibility)**: Targets modern evergreen browsers only (ChromeOS Chrome, iPadOS Safari 16+, Desktop Chrome/Firefox/Safari).
* **Non-Goal 8 (No Full-Screen Blocking Modals on Manipulative Canvases)**: Celebratory feedback, commutative discovery seals, and mathematical equations must never render as opaque full-screen modals covering the student's manipulatives. The manipulative workspace (cookie sheet or pairing mat) must remain continuously visible so the student directly observes the concrete mathematical relationship.

---

## Open Questions & Resolved Decisions

* **Question 1 (Audio Narration & Voice Pipeline - RESOLVED)**:
  * *Decision*: **Gemini Pre-Generated Audio Assets with Offline Storage**. Core Socratic prompts, mascot dialogue cues, and NCDPI strategy introductions (approx. 50 finite audio clips) are pre-generated during development via a dedicated Gemini script (`scripts/generate-assets-gemini.ts` using the Google GenAI SDK). The generated audio files (`.mp3`/`.webm`) are committed directly to `public/audio/` as static project assets and precached via the PWA Service Worker. At runtime in the student's browser, audio plays instantly with 0ms latency and 100% offline availability. For dynamic randomized parameters not covered by pre-recorded audio, the browser's native Web Speech API serves as a zero-dependency fallback.
* **Question 2 (Tactile Sound Asset Payload - RESOLVED)**:
  * *Decision*: **Gemini/Acoustic Sound Assets in Static Audio Sprite (`public/audio/stationery-sprite.webm`) & Web Audio Synthesizer**. Tactile stationery sounds (rubber stamp thud, paper rustle, pencil scratch, and celebration fanfare) are pre-rendered into a lightweight static audio sprite in `public/audio/`, with a pure Web Audio API oscillator synthesizer fallback.

---

## Critical User Journeys (CUJs)

### CUJ 1: Exploring Parity via Pairing ("Buddies Strategy" - NC.2.OA.3)
* **Given**: A student opens the "Odd & Even Garden" lesson on a classroom iPad. A prompt displays: *"Can 11 carrots all find a buddy?"* with audio narration. The canvas displays 11 scattered carrot stamps and a 2-column pairing mat.
* **When**: The student taps or drags carrots onto the pairing mat. The counters magnetically snap into adjacent rows two-by-two. 5 pairs form cleanly, leaving 1 carrot alone at the bottom without a partner.
* **Then**: The student taps "Check". The pencil mascot points at the leftover counter with a magnifying glass (`peek` pose) and asks: *"Is there an extra carrot?"* The student taps the `[ODD]` badge. An ink stamp seals the victory (`5 + 5 + 1 = 11`), stars award to the student's local avatar profile (Kit the Fox), and confetti triggers.

### CUJ 2: Building Rectangular Arrays & Commutative Discovery (NC.2.OA.4)
* **Given**: A student selects the "Bakery Trays" array lesson. The prompt displays: *"Can you arrange 12 cookies into 3 equal rows?"* with read-aloud voice support.
* **When (Orientation Error)**: The student stamps 12 cookies arranged as 4 rows of 3 ($3 + 3 + 3 + 3 = 12$) and taps "Check".
* **Then (Orientation Diagnostic)**: The system strictly marks this incorrect. The mascot switches to the `think` pose and provides targeted Socratic feedback: *"Look closely: you made 4 rows with 3 cookies each (4 rows of 3)! But Pencil Pal asked for 3 equal rows. Can you put 4 in each row so there are only 3 rows?"*
* **When (Correct Construction)**: The student rearranges the stamps to form 3 horizontal rows of 4 ($4 + 4 + 4 = 12$) and taps "Check".
* **Then (Step 1 - Array Validation)**: The board remains interactive. Row indicators (`Row 1: 4`, `Row 2: 4`, `Row 3: 4`) illuminate in yellow watercolor wash. Pencil Pal celebrates (`celebrate` pose) and prompts: *"YES! You made 3 equal rows with 4 cookies in each row! Now click '👓 Column Eyes' to see what happens when you look up and down!"*
* **When (Step 2 - Strategy Switch)**: The student taps the `[👓 Column Eyes]` button.
* **Then (Step 3 - Socratic Commutative Discovery)**: Vertical column indicators light up across the top (`Col 1: 3` through `Col 4: 3`) in sky-blue watercolor wash with equation $3 + 3 + 3 + 3 = 12$. Confetti bursts and Pencil Pal delivers the mathematical insight: *"Aha! Look at the columns going down: 4 columns of 3 cookies! 3 + 3 + 3 + 3 = 12! 3 rows of 4 and 4 columns of 3 both equal 12!"* Star counters increment and the victory seal awards.

### CUJ 3: Scaffolding Ladder Escalation & Isomorphic Retry
* **Given**: A student is tasked with arranging 15 tiles into 3 equal rows.
* **When (Attempt 1 - Unequal Rows)**: The student places 6 tiles in row 1, 5 in row 2, and 4 in row 3, and taps "Check".
* **Then (Tier 1 - Socratic Prompt)**: The mascot switches to the `think` pose: *"Your rows are not equal: Row 1 has 6, Row 2 has 5, Row 3 has 4. Equal rows must have the exact same count!"* Manipulatives remain in place.
* **When (Attempt 2 - Second Failure)**: The student moves 1 tile but leaves rows unequal (5, 6, 4) and taps "Check".
* **Then (Tier 2 - Ghost Visual Assist)**: Visual ghost assist triggers. Faint pencil guide boxes appear over the correct 3x5 target cells: *"Pencil Pal drew dotted ghost boxes for 3 rows of 5! Can you fill the ghost boxes?"*
* **When (Attempt 3 - Need Help)**: The student taps "Ask Pencil Pal".
* **Then (Tier 3 - Demonstrative Step)**: Pencil Pal auto-places Row 1 with 5 tiles (`sketch` pose) and prompts the student to complete Rows 2 and 3. Mastery credit for this specific seed is revoked, and the system serves an isomorphic problem with a new random seed ($4 \text{ rows of } 3$) so the student must succeed independently.

---

## Technical Plan (Architecture)

### 1. High-Level System Architecture

```mermaid
graph TD
  subgraph Client [Client Runtime (React 19 + Vite SPA)]
    Desk[Desk Viewport & Canvas] --> Paper[Graph Paper Pad - NC.2.OA.4]
    Desk --> Tray[Manipulative Supply Tray]
    Desk --> Companion[Pencil Pal Mascot & Bubble]
    
    Paper --> Evaluator[Headless Math Diagnostic Evaluator]
    Evaluator --> StateMachine[Socratic Scaffolding State Machine]
    
    StateMachine --> Lens[Strategy Lens Controller - Row / Col]
    StateMachine --> AudioBus[Dual-Bus Audio Engine]
    
    AudioBus --> VoiceBus[Voice Bus - Gemini TTS / Web Speech API]
    AudioBus --> SFXBus[SFX Bus - Web Audio Polyphonic Synthesizer]
  end

  subgraph Ingestion [Build-Time OER Curriculum Pipeline]
    OER[NCDPI / Khan / IM Source Seeds] --> Parser[scripts/ingest-curriculum.ts]
    Parser --> Invariants[src/curriculum/invariants.ts]
    Parser --> Manifest[src/assets/audio-manifest.json]
  end

  subgraph JiTTesting [Meta-Inspired JiTTesting Quality Architecture]
    Diff[Developer Git Diff] --> JiTGen[tests/invariants/*.invariant.test.ts]
    JiTGen --> RubFake[Deterministic Adversarial Fuzzing Oracle]
    RubFake --> PreCommit[.githooks/pre-commit - Sub-150ms Gate]
    PreCommit --> CI[.github/workflows/jittest.yml]
    CI -- Regression Caught --> HotL[Human-on-the-Loop Targeted Escalation]
  end
```

### 2. Zero-Scroll Viewport Layout Geometry (`100dvh`)

To protect second-graders from cognitive fragmentation and disorientation caused by scrolling, the interface is strictly constrained to a single non-scrolling landscape viewport (`h-screen max-h-screen overflow-hidden`):
* **Header Bar ($40\text{px}$)**: Kit the Fox student profile badge, stars counter, audio sound toggle, reset trigger.
* **Main Area ($\approx 600\text{px}$ safe area on $1366 \times 768$ and $1024 \times 768$)**:
  * **Left Column (Math Canvas)**:
    * Compact Socratic prompt note ($\approx 44\text{px}$) with 🗣️ read-aloud voice button.
    * Strategy Lens switcher bar ($\approx 32\text{px}$) with dynamic orientation prompts.
    * $5 \times 5$ Discrete Grid with $48\text{px} \times 48\text{px}$ visual cells and $56\text{px} \times 56\text{px}$ interactive touch targets, row indicators on the left, column indicators across the top.
    * Repeated addition equation & `Check Answer ✔` footer bar ($\approx 44\text{px}$).
  * **Right Column (Companion & Inventory)**:
    * Cookie Supply Tray ($\approx 120\text{px}$) with 12 slots and live counter badge.
    * Pencil Pal Mascot dock ($\approx 200\text{px}$) with reactive SVG poses and speech bubble.
    * Socratic hint card ($\approx 44\text{px}$) for student-initiated assistance.

### 3. Headless Math Diagnostic Evaluator (`src/lib/math/evaluator.ts`)

The validation logic is strictly separated from React DOM rendering into pure, headless TypeScript functions. This allows executing comprehensive invariant suites and property-based fuzzing matrices in sub-millisecond automated runs:

```typescript
// NC.2.OA.4: Rectangular Arrays (up to 5x5)
export interface ArrayProblemSpec {
  targetRows: number
  targetCols: number
  totalTokens: number
}

export type ArrayDiagnostic =
  | { status: "correct"; equationRow: string; equationCol: string; activeRowCounts: number[]; activeColCounts: number[]; totalPlaced: number; feedback: string }
  | { status: "orientation_error"; actualRows: number; actualCols: number; activeRowCounts: number[]; totalPlaced: number; feedback: string }
  | { status: "unequal_rows"; rowCounts: number[]; totalPlaced: number; feedback: string }
  | { status: "wrong_row_count"; actualRows: number; targetRows: number; totalPlaced: number; feedback: string }
  | { status: "gap_error"; feedback: string }
  | { status: "incomplete_inventory"; placedCount: number; targetCount: number; feedback: string }
  | { status: "empty"; feedback: string }

export function evaluateArrayGrid(grid: boolean[][], spec: ArrayProblemSpec): ArrayDiagnostic {
  const totalPlaced = grid.flat().filter(Boolean).length
  if (totalPlaced === 0) return { status: "empty", feedback: "Tap a cookie from the tray to place it on the graph paper!" }
  if (totalPlaced !== spec.totalTokens) return { status: "incomplete_inventory", placedCount: totalPlaced, targetCount: spec.totalTokens, feedback: `You've placed ${totalPlaced} cookies on the paper. We need all ${spec.totalTokens} cookies to make ${spec.targetRows} equal rows! Check your tray.` }

  const rowCounts = grid.map((r) => r.filter(Boolean).length)
  const populatedRowIndices = rowCounts.map((count, idx) => (count > 0 ? idx : -1)).filter((idx) => idx !== -1)
  const activeRowCounts = populatedRowIndices.map((idx) => rowCounts[idx])

  // Vertical contiguity: populated rows must start at row 0 without skipped rows
  for (let i = 0; i < populatedRowIndices.length; i++) {
    if (populatedRowIndices[i] !== i) return { status: "gap_error", feedback: "Keep your rows together starting from the top row without empty rows in between!" }
  }

  // Horizontal contiguity: cookies in each row must be packed from column 0 without gaps
  for (let r = 0; r < populatedRowIndices.length; r++) {
    const row = grid[r]
    const lastPlacedCol = row.lastIndexOf(true)
    for (let c = 0; c <= lastPlacedCol; c++) {
      if (!row[c]) return { status: "gap_error", feedback: `Row ${r + 1} has a gap! Push your cookies together from left to right without empty spaces.` }
    }
  }

  const actualRows = populatedRowIndices.length
  const actualCols = Math.max(...activeRowCounts)

  // Orientation Error Guard: spec.targetRows !== spec.targetCols ensures square arrays (e.g. 3x3) never flag orientation error
  if (spec.targetRows !== spec.targetCols && actualRows === spec.targetCols && actualCols === spec.targetRows) {
    return {
      status: "orientation_error",
      actualRows, actualCols, activeRowCounts, totalPlaced,
      feedback: `Look closely: you made ${actualRows} rows with ${actualCols} cookies each (${actualRows} rows of ${actualCols})! But Pencil Pal asked for ${spec.targetRows} equal rows. Can you put ${spec.targetCols} in each row so there are only ${spec.targetRows} rows?`,
    }
  }

  if (actualRows !== spec.targetRows) {
    return { status: "wrong_row_count", actualRows, targetRows: spec.targetRows, totalPlaced, feedback: `You made ${actualRows} rows, but the challenge asks for exactly ${spec.targetRows} equal rows. Count your rows going down!` }
  }

  if (actualCols !== spec.targetCols || !activeRowCounts.every((c) => c === spec.targetCols)) {
    const rowBreakdown = activeRowCounts.map((count, idx) => `Row ${idx + 1} has ${count}`).join(", ")
    return { status: "unequal_rows", rowCounts: activeRowCounts, totalPlaced, feedback: `Your rows are not equal: ${rowBreakdown}. Equal rows must have the exact same count!` }
  }

  // SUCCESS: Target rows and columns matched
  const colCounts: number[] = []
  const cols = grid[0]?.length ?? 5
  for (let c = 0; c < cols; c++) {
    let count = 0
    for (let r = 0; r < grid.length; r++) { if (grid[r][c]) count++ }
    colCounts.push(count)
  }

  return {
    status: "correct",
    equationRow: `${Array(spec.targetRows).fill(spec.targetCols).join(" + ")} = ${spec.totalTokens}`,
    equationCol: `${Array(spec.targetCols).fill(spec.targetRows).join(" + ")} = ${spec.totalTokens}`,
    activeRowCounts, activeColCounts: colCounts.filter((c) => c > 0), totalPlaced,
    feedback: `YES! You made ${spec.targetRows} equal rows with ${spec.targetCols} cookies in each row! Now click '👓 Column Eyes' to see what happens when you look up and down!`,
  }
}

// NC.2.OA.3: Determining Odd and Even Parity (up to 20)
// Architectural Invariant: Single Dynamic Buddy Mat rendered as Math.ceil(totalTokens / 2) paired rows.
// Proscribed: Do not partition into multiple artificial containers (e.g. "Frame 1" / "Frame 2").
export interface ParityProblemSpec { totalTokens: number; strategy: "pairing" | "two_equal_groups" }
export interface PairingSlot { left: boolean; right: boolean }
export type ParityDiagnostic =
  | { status: "correct_even"; pairs: number; equation: string; totalPlaced: number; feedback: string }
  | { status: "correct_odd"; pairs: number; leftover: number; equation: string; totalPlaced: number; feedback: string }
  | { status: "unpaired_gap"; feedback: string }
  | { status: "unequal_groups"; groupA: number; groupB: number; feedback: string }
  | { status: "incomplete_inventory"; placed: number; target: number; feedback: string }
  | { status: "empty"; feedback: string }

export function evaluatePairingMat(slots: PairingSlot[], spec: ParityProblemSpec): ParityDiagnostic {
  let placed = 0, pairs = 0, unpairedSlots = 0
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].left) placed++
    if (slots[i].right) placed++
    if (slots[i].left && slots[i].right) pairs++
    else if (slots[i].left || slots[i].right) unpairedSlots++
  }
  if (placed === 0) return { status: "empty", feedback: "Tap a counter from the tray to place it on the pairing mat!" }
  if (placed !== spec.totalTokens) return { status: "incomplete_inventory", placed, target: spec.totalTokens, feedback: `You placed ${placed} counters. We need all ${spec.totalTokens} counters on the mat!` }

  let encounteredEmpty = false
  for (let i = 0; i < slots.length; i++) {
    const hasTokens = slots[i].left || slots[i].right
    if (!hasTokens && !encounteredEmpty) {
      if (slots.slice(i + 1).some((s) => s.left || s.right)) return { status: "unpaired_gap", feedback: "Keep your pairs lined up from top to bottom without empty rows!" }
      encounteredEmpty = true
    }
  }

  const isEven = spec.totalTokens % 2 === 0
  const expectedPairs = Math.floor(spec.totalTokens / 2)

  if (isEven) {
    if (pairs === expectedPairs && unpairedSlots === 0) {
      return { status: "correct_even", pairs, equation: `${expectedPairs} + ${expectedPairs} = ${spec.totalTokens}`, totalPlaced: placed, feedback: `All ${spec.totalTokens} counters have a buddy! ${spec.totalTokens} is an EVEN number (${expectedPairs} + ${expectedPairs} = ${spec.totalTokens})!` }
    }
    return { status: "unequal_groups", groupA: pairs + unpairedSlots, groupB: pairs, feedback: "Every counter should have a buddy! Pair them up side-by-side." }
  } else {
    if (pairs === expectedPairs && unpairedSlots === 1) {
      return { status: "correct_odd", pairs, leftover: 1, equation: `${expectedPairs} + ${expectedPairs} + 1 = ${spec.totalTokens}`, totalPlaced: placed, feedback: `One counter is left over without a buddy! That means ${spec.totalTokens} is an ODD number (${expectedPairs} + ${expectedPairs} + 1 = ${spec.totalTokens})!` }
    }
    return { status: "unequal_groups", groupA: pairs + unpairedSlots, groupB: pairs, feedback: "Make as many pairs as possible to see if one is left over!" }
  }
}
```

### 4. Socratic Commutative Discovery Loop (3-State Finite State Machine)

To build genuine conceptual intuition rather than rote quiz answering, validation does not abruptly seal the problem instance:
1. **State 1: Array Construction**: Student places manipulatives to satisfy the target row constraint ($3$ rows of $4$).
2. **State 2: Row Validation & Strategy Pivot**: When $3 \times 4$ is checked, the array is marked correct. The board stays active, row indicators illuminate in yellow, and Pencil Pal directs the student: *"Now click 👓 Column Eyes to see what happens when you look up and down!"*
3. **State 3: Column Commutative Revelation**: Student toggles to Column Eyes. Columns illuminate in sky blue, displaying $3 + 3 + 3 + 3 = 12$. Pencil Pal delivers the key mathematical revelation ($3 \times 4 = 4 \times 3$), triggering victory fanfare, confetti, and star awards.

> [!IMPORTANT]
> **State Mutation Guard**: If the student moves, removes, or places any manipulative token while in **State 2 (Row Validated)**, the finite state machine immediately resets to **State 1 (Array Construction)**. The Column Eyes prompt and active row highlights are dismissed until the student checks the modified array again.

### 5. Meta-Inspired JiTTesting ("Human-on-the-Loop") Architecture

Based on Meta's production engineering methodology (*"Catching Bugs Before They Land: JiTTesting's Human-on-the-Loop Approach at Full Scale"*), we introduce a repo-level quality guardrail system to prevent pedagogical regressions.

#### A. The Pedagogical Problem JiTTesting Solves
In primary education software, standard unit tests often verify syntactic compilation or basic happy paths, completely missing subtle pedagogical regressions—such as inadvertently accepting $4 \times 3$ when $3 \times 4$ was asked, or evaluating square arrays ($3 \times 3$) as orientation errors. Manually writing exhaustive permutation matrices for every curriculum variation creates developer fatigue.

#### B. The 3-Phase Implementation

```
┌───────────────────────────┐     ┌───────────────────────────────────┐     ┌────────────────────────────┐
│   Developer Git Diff/PR   │ ──> │   Node 26 Invariant Test Suite    │ ──> │ Human-on-the-Loop Alert    │
│  (src/lib/math/evaluator) │     │ (12 Invariants + 250 Fuzz Seeds)  │     │ (Only True Regressions)    │
└───────────────────────────┘     └───────────────────────────────────┘     └────────────────────────────┘
```

1. **Phase 1: Diff-Aware Invariant Verification (`tests/invariants/`)**:
   * Runs locally at pre-commit via `.githooks/pre-commit` and on CI via `.github/workflows/jittest.yml`.
   * Covers all pedagogical invariants: orientation errors, unequal rows, incomplete inventory, empty canvas, square array edge cases, and spatial gap detection.
2. **Phase 2: Deterministic Adversarial Fuzzing Oracle (RubFake Equivalent)**:
   * Employs property-based invariant fuzzing (e.g., Invariant 8 testing 250 seeded randomized grid permutations).
   * Asserts zero false positives: only the exact target configuration ($3 \times 4$ contiguous from $(0,0)$) is awarded `correct`. Redundant or mathematically ambiguous states are filtered deterministically, eliminating test flakiness.
3. **Phase 3: Human-on-the-Loop Targeted Escalation**:
   * Developers do **not** write hundreds of repetitive permutations manually.
   * Tests run in **121ms** (well under the 150ms pre-commit threshold).
   * If an invariant fails, commit/CI halts and produces a concise high-signal alert detailing the exact pedagogical breakdown (target standard, submitted grid, expected diagnostic, regressing line).

---

## Security, Privacy & COPPA Compliance

* **Full COPPA & FERPA Exemption**: The application collects zero Personally Identifiable Information (PII). There are no user accounts, no email addresses, no names, no device identifiers, and no student tracking.
* **Zero Network Egress**: The client runtime makes zero network requests during classroom execution. All audio, sprites, fonts, and assets are local static files.
* **School Firewall Safe**: Runs entirely self-contained without connecting to external CDN hosts or third-party analytics endpoints.
* **Local-Only Storage**: Student progress (avatar selection, stars earned, completed standard badges) is persisted strictly in the browser's local `localStorage` sandbox. Clearing browser data completely resets the application.

---

## Accessibility (A11y) & Universal Design

* **WCAG 2.2 AAA Touch Target Sizing**: Primary interactive elements (manipulative tokens, grid cells, buttons) provide a minimum visual size of $48\text{px} \times 48\text{px}$ wrapped in an expanded $56\text{px} \times 56\text{px}$ interactive hit zone, accommodating young children with developing fine motor control.
* **Dual-Mode Input Ergonomics**: Supports both direct tap-to-stamp and drag-and-drop interactions. Students unable to perform continuous drag gestures can complete all tasks through single-tap interactions.
* **Screen Reader & Cognitive Support**:
  * Semantic ARIA live regions (`aria-live="polite"`) broadcast mascot speech and diagnostic feedback.
  * Discrete grid cells provide descriptive accessible labels (e.g., `Row 2, Column 3: empty` / `Row 2, Column 3: cookie placed`).
* **Visual & Auditory Redundancy**:
  * All spoken Socratic dialogue is simultaneously mirrored in the on-screen mascot speech bubble with synchronized text highlighting.
  * Warm, high-contrast ink styling (`#1c1917` ink on `bg-amber-50/40` paper) maintains high readability while reducing screen glare.

---

## Verification, Test Matrix & Release Gates

### Release Gate Thresholds (Definition of Done)
1. **Pedagogical Invariant Pass Rate**: 100% of invariant tests in `tests/invariants/*.test.ts` must pass.
2. **Pre-Commit Execution Latency**: `npm test` must execute in $< 150\text{ms}$ locally.
3. **Compilation & Build**: `npm run check` (`tsc -b && vite build`) must pass with 0 errors and 0 warnings.
4. **Zero-Scroll Viewport Conformance**: Layout must fit completely within a $1024 \times 768$ landscape viewport without triggering vertical or horizontal scrollbars.
5. **Frame Rate Budget**: Maintain 60 FPS animation smoothness on CPU-throttled classroom hardware profiles.

---

## Alternatives Considered

| Dimension | Chosen Architecture | Alternative Considered | Why Alternative Was Rejected |
| :--- | :--- | :--- | :--- |
| **Dialogue & Guidance** | **Deterministic Finite State Machine + Pre-Generated Audio** | Runtime LLM streaming chat (OpenAI / Gemini API) | Runtime LLMs violate the 100% offline classroom requirement, introduce 1–3s latency, risk non-deterministic math hallucinations, and violate COPPA privacy restrictions on minor student input. |
| **Canvas Spatial Model** | **Discrete Grid Pad (`Paper stock="graph"`)** | Freeform continuous coordinates (`StickerBoard`) | Looseleaf’s `StickerBoard` uses floating-point coordinates. Freeform placement makes spatial equal-group detection ambiguous ($5 \times 5$ array vs. scattered cookies), inducing cognitive frustration for 7-year-olds. |
| **Curriculum Instantiation** | **Deterministic Seeded PRNG Archetypes** | Hardcoded static question lists | Static question banks become predictable after 1–2 sessions. A seeded PRNG generator enables infinite isomorphic retries while preserving exact NCDPI unpacked problem structures. |
| **Audio Pipeline** | **Gemini Pre-Generated Assets (`public/audio/`) with Web Speech Fallback** | Pure Web Speech API synthesis | Native browser voices vary dramatically between ChromeOS and iPad Safari (often sounding robotic or flat). Pre-rendered Gemini TTS provides warm, natural, educational cadence for primary instruction. |
| **Testing Strategy** | **Meta-Inspired JiTTesting Human-on-the-Loop** | Manual developer test writing only | Manually testing every orientation, permutation, and misconception state induces developer fatigue. JiTTesting automatically synthesizes adversarial invariants at commit time without human overhead. |

---

## Detailed Implementation Plan

### Phase 1: Mathematical Diagnostic Core & Invariant Engine
* **Goal**: Establish pure headless math evaluation and the JiTTesting quality gate.
* **Files**:
  * `[Implemented] src/lib/math/evaluator.ts`: Pure diagnostic evaluator for NC.2.OA.3 (odd/even pairing) and NC.2.OA.4 (rectangular arrays).
  * `[Implemented] tests/invariants/nc2-oa4.invariant.test.ts`: Invariant suite covering target configurations, transpositions, and fuzzing matrices.
  * `[Implemented] tests/invariants/nc2-oa3.invariant.test.ts`: Invariant suite covering odd/even pairs, leftovers, and sums of equal addends ($N = A + A$).
  * `[Implemented] .githooks/pre-commit`: Local git hook running invariant checks in < 150ms.
  * `[Implemented] .github/workflows/jittest.yml`: GitHub Actions workflow running on pushes and PRs.
  * `[Implemented] src/lib/audio/sfx.ts`: Tier 1 procedural Web Audio synthesizer (pickup, stamp, nudge, victory) and native Web Speech narration fallback.
  * `[Subsumed] scripts/jittest.ts`: Subsumed by native Node 26 `--experimental-strip-types --test` executing all 16 invariants in 120ms (well within the 150ms pre-commit threshold).

### Phase 2: Curriculum Ingestion & Voice Asset Generation Pipeline
* **Goal**: Convert official NCDPI unpacked content and OER seeds into structured typed items and pre-generate high-quality voice audio.
* **Files**:
  * `[Implemented] src/curriculum/invariants.ts`: Strongly typed runtime schema and validation for NC.2.OA.3 parity and NC.2.OA.4 arrays.
  * `[Implemented] src/curriculum/items/nc2-oa3.ts`: Seed bank of 8 verified NCDPI odd/even parity problems.
  * `[Implemented] src/curriculum/items/nc2-oa4.ts`: Seed bank of 7 verified NCDPI rectangular array challenges.
  * `[Implemented] tests/invariants/curriculum.invariant.test.ts`: Invariant suite asserting 100% curriculum item validity and evaluator integration.
  * `[Create] scripts/generate-assets-gemini.ts`: Build-time batch generator for offline Gemini TTS audio assets (`public/audio/`).

### Phase 3: Zero-Scroll Classroom Manipulative Components
* **Goal**: Assemble the interactive Looseleaf stationery canvas for NC.2.OA.3 and NC.2.OA.4.
* **Phase 3A: Unified Interactive Wireframes [Implemented]**:
  * `[Implemented] src/components/math/NC2OA4Wireframe.tsx`: Single-screen zero-scroll interactive desk running live with tactile baking sheet, cookie stamps, Socratic mascot guidance, and in-place row/column commutative highlights without full-screen blocking modals.
  * `[Implemented] src/components/math/NC2OA3Wireframe.tsx`: Single dynamic Buddy Pairing Mat scaled to $\lceil N/2 \rceil$ pairs with acorns, inquiry prompt, and doubles addend equations.
* **Phase 3B: Discrete Component Extraction [Implemented]**:
  * `[Implemented] src/components/math/ArrayBoard.tsx`: Discrete $5 \times 5$ manipulative grid built on `Paper stock="graph"`, supporting $48\text{px}$ visual tokens and $56\text{px}$ hit zones, with clean perimeter layout.
  * `[Implemented] src/components/math/PairingMat.tsx`: Single 2-column dynamic tactile pairing mat for NC.2.OA.3 ($N = A + A$ and leftover buddy detection).
  * `[Implemented] src/components/math/SupplyTray.tsx`: Tactile inventory counter with remaining cookie/acorn stamps and tap-to-stamp affordances.
  * `[Implemented] src/components/math/MascotCompanion.tsx`: Pencil Pal dock rendering reactive Looseleaf poses (`idle`, `think`, `peek`, `sketch`, `celebrate`) and synchronized speech bubble with real-time word-by-word subtitle highlighting.

### Phase 4: Socratic Scaffolding State Machine & Audio Engine
* **Goal**: Connect student actions to the 3-tier scaffolding ladder and dual-bus audio synthesis.
* **Files**:
  * `[Implemented] src/hooks/use-socratic-scaffolding.ts`: Headless state machine tracking attempts, triggering Socratic hints (Tier 1), visual ghost outlines (Tier 2), and step demonstrations with isomorphic retries (Tier 3).
  * `[Implemented] src/lib/audio/audio-bus.ts`: Dual-bus audio engine managing the Preemptible Voice Bus (with Chromium GC protection and iOS AudioContext unlock) and Polyphonic SFX Bus (tactile rubber stamp thuds, paper rustle, victory fanfare).
  * `[Implemented] src/hooks/use-audio-narration.ts`: Synchronizes mascot dialogue with speech synthesis, word boundaries, and posing.
  * `[Implemented] Wireframe Integration`: `NC2OA4Wireframe.tsx` and `NC2OA3Wireframe.tsx` wired to `useArrayScaffolding`, `useParityScaffolding`, and `useAudioNarration`.

### Phase 5: PWA Packaging, Persistence & GitHub Pages Deployment
* **Goal**: Enable complete offline execution and deployment.
* **Files**:
  * `[Implemented] public/manifest.json`: Web App Manifest for landscape pinning and standalone PWA launch.
  * `[Implemented] index.html`: Viewport configuration (`viewport-fit=cover`, gesture lock), iPad/Chromebook landscape pinning meta tags.
  * `[Implemented] src/lib/storage/profile.ts`: Local client-only profile persistence (`localStorage`) for student avatar, stars earned, and standard mastery badges.
  * `[Implemented] .github/workflows/deploy.yml`: Automated GitHub Pages deployment pipeline.
