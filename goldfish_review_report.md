# Goldfish Annotated Review Report

**Status:** resolved
**Target:** `design_draft.md` & Codebase READMEs (`full file`)

## Prioritized Findings & AI Suggestions

### [Issue 1] [`egm-codebase-details`] - Severity: High
*   **Affected Scope:** [Lines 45-55](design_draft.md#L45-L55), [Lines 385-391](design_draft.md#L385-L391) (Goal 3 & Phase 2)
*   **Discrepancy Description:** Pre-Generated Audio Assets Missing (`public/audio/`). The design doc states static `.mp3` assets are pre-generated via Gemini TTS and stored in `public/audio/` indexed by `src/assets/audio-manifest.json`, but the current implementation uses native Web Speech API and procedural Web Audio synth in `src/lib/audio/sfx.ts`.
*   **Rationale:** The codebase functions offline with Web Audio synthesis and Web Speech API, but the design doc lists static Gemini audio files as already required for Phase 1.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Update `design_draft.md` to document the two-tier audio architecture: Tier 1 runtime fallback uses procedural Web Audio synth (`sfx.ts`) + browser `speechSynthesis` (active now), while Tier 2 pre-rendered Gemini TTS assets (`public/audio/`) remain the build-time asset target in Phase 2.
*   ***Proposed Edit:***
    *   Location: `design_draft.md` Phase 1 & Phase 2 tables
    *   Change: Clarify that the procedural synthesizer in `src/lib/audio/sfx.ts` provides the offline foundation, and mark static asset generation as Phase 2 build-time pipeline work.

### [Issue 2] [`egm-design`] - Severity: High
*   **Affected Scope:** [Lines 89-93](design_draft.md#L89-L93), [Lines 287-296](design_draft.md#L287-L296) (CUJ 2 & Section 4)
*   **Discrepancy Description:** Full-Screen Commutative Modal Overlay Divergence. In `NC2OA4Wireframe.tsx`, activating "Column Eyes" mounts an opaque full-screen modal (`absolute inset-0 bg-paper/95`) that hides the baking sheet and manipulative cookies. The design requires that the board remain visible and interactive with row and column highlights side-by-side.
*   **Rationale:** Second-graders need to visually inspect the actual 3x4 cookies while column lines illuminate; an opaque full-screen modal breaks the conceptual link between rows and columns.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Add an explicit Non-Goal / Design Invariant in `design_draft.md`: "Zero Full-Screen Blocking Modals on Manipulative Canvases." Require celebratory seals and equations to render in-place within the workspace headers/footers without obscuring the manipulative board.
*   ***Proposed Edit:***
    *   Location: `design_draft.md` Non-Goals & Invariants
    *   Change: Add invariant rule specifying that manipulative boards must never be covered by full-screen overlays during or after validation.

### [Issue 3] [`egm-comprehension`] - Severity: High
*   **Affected Scope:** [Lines 80-83](design_draft.md#L80-L83), [Lines 240-284](design_draft.md#L240-L284) (CUJ 1 & Section 3)
*   **Discrepancy Description:** Parity Mat Spatial Layout Divergence ("Frame 1 / Frame 2"). `NC2OA3Wireframe.tsx` partitioned 20 slots into two separate cards labeled "Frame 1 (Pairs 1–5)" and "Frame 2 (Pairs 6–10)", which introduced confusing developer framing not in the design or NCDPI standard.
*   **Rationale:** The design specifies a single, unified 2-column "Buddies" pairing mat dynamically scaled to the active problem seed ($N/2$ pairs).
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Standardize the parity mat specification in `design_draft.md` as "Single Dynamic Buddy Mat" with rows scaled to $\lceil N/2 \rceil$, explicitly proscribing multiple ten-frame containers for pairing.
*   ***Proposed Edit:***
    *   Location: `design_draft.md` Section 3 & Phase 3
    *   Change: Explicitly define `PairingMat` geometry as a single centered column of $N/2$ pairs, eliminating any reference to multi-frame partitions.

### [Issue 4] [`egm-structural`] - Severity: High
*   **Affected Scope:** [Lines 392-402](design_draft.md#L392-L402) (Phase 3 Component Plan)
*   **Discrepancy Description:** Modular Component Decomposition Incomplete. The design specifies individual components (`ArrayBoard.tsx`, `PairingMat.tsx`, `StrategyLensBar.tsx`, `SupplyTray.tsx`, `MascotCompanion.tsx`, `VictoryOverlay.tsx`), but these remain tightly coupled inside `NC2OA4Wireframe.tsx` and `NC2OA3Wireframe.tsx`.
*   **Rationale:** Wireframe prototyping successfully proved the interactions, but production architectural alignment requires modular component decomposition.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Update Phase 3 in `design_draft.md` to note the current monolithic wireframe state as Phase 3A (Interactive Prototyping) and Phase 3B as the modular component extraction stage.
*   ***Proposed Edit:***
    *   Location: `design_draft.md` Detailed Implementation Plan
    *   Change: Restructure Phase 3 into Phase 3A (Unified Wireframes, completed) and Phase 3B (Discrete Component Extraction, in progress).

### [Issue 5] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [README.md#L11-L26](README.md#L11-L26)
*   **Discrepancy Description:** Missing Invariant Test Suite, Pre-Commit Hook, and Math Subsystems Documentation in root `README.md`.
*   **Rationale:** Developers reading `README.md` have no documentation of the Node 26 invariant testing harness (`npm test`), `.githooks/pre-commit`, `.github/workflows/jittest.yml`, or `src/components/math/`.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Update `README.md` to document the headless math invariant suite, sub-150ms pre-commit gate, CI workflow, and math manipulative boundaries.
*   ***Proposed Edit:***
    *   Location: `README.md` Subdirectories & Invariants
    *   Change: Add `tests/` documentation, testing invariants, and math subsystem architecture.

### [Issue 6] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [src/README.md#L6-L23](src/README.md#L6-L23)
*   **Discrepancy Description:** `src/README.md` does not document `src/lib/math`, `src/lib/audio`, or `src/components/math`.
*   **Rationale:** The subsystem map in `src/README.md` has drifted from the actual source tree.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Add entries for `src/components/math`, `src/lib/math`, and `src/lib/audio` into `src/README.md`.
*   ***Proposed Edit:***
    *   Location: `src/README.md` Subdirectories & Boundaries
    *   Change: Document the math manipulatives and audio modules.

### [Issue 7] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [src/components/README.md#L6-L7](src/components/README.md#L6-L7)
*   **Discrepancy Description:** `src/components/README.md` only lists `ui: [./ui/README.md]`, omitting `math/`.
*   **Rationale:** `src/components/math/` contains the core educational manipulatives and wireframes.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Add `math/` to `src/components/README.md` with links to `NC2OA4Wireframe.tsx` and `NC2OA3Wireframe.tsx`.
*   ***Proposed Edit:***
    *   Location: `src/components/README.md` Subdirectories & Boundaries
    *   Change: Add `- math: Tactile mathematics manipulatives, arrays, and parity pairing mats.`

### [Issue 8] [`egm-codebase-details`] - Severity: Medium
*   **Affected Scope:** [src/lib/README.md#L6-L39](src/lib/README.md#L6-L39)
*   **Discrepancy Description:** `src/lib/README.md` omits `src/lib/math` (`evaluator.ts`) and `src/lib/audio` (`sfx.ts`) and their exported interfaces.
*   **Rationale:** Evaluators and audio synthesizers are critical shared library modules used by the entire application and invariant test suites.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Update `src/lib/README.md` to list `math/` and `audio/` under Subdirectories, and add their exported symbols (`evaluateArrayGrid`, `evaluatePairingMat`, audio synthesis triggers) to Interface.
*   ***Proposed Edit:***
    *   Location: `src/lib/README.md` Subdirectories & Interface
    *   Change: Add math evaluator and audio synth boundaries and interfaces.

### [Issue 9] [`egm-zoom-out`] - Severity: Low
*   **Affected Scope:** [Lines 382](design_draft.md#L382) (Diff-Aware JiT Script)
*   **Discrepancy Description:** `scripts/jittest.ts` was planned as a diff-aware test filter, but Node 26 runs the entire 16-test suite directly via `npm test` in 120ms.
*   **Rationale:** A custom diff parser adds unnecessary code complexity when the entire test suite already runs well below the 150ms latency ceiling.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Update `design_draft.md` to document that `npm test` running Node 26 native `--test` executes in < 150ms, fulfilling the JiTTesting latency SLA without requiring custom script filtering.
*   ***Proposed Edit:***
    *   Location: `design_draft.md` Phase 1 Table
    *   Change: Mark diff script as simplified/subsumed by native Node test runner.
