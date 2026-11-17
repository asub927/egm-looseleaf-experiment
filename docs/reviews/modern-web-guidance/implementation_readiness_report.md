# Stage 9: Implementation Readiness Test Report

- **Target Document:** [docs/designs/modern-web-guidance-migration.md](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/modern-web-guidance-migration.md)
- **Scope Evaluated:** `DetailedRange` (Lines 246–361: Complete File Touchpoint Registry, Work Package Sequencing WP0–Phase 3, Verification Gates & Release Criteria, Runtime Kill-Switch & Fallback Contracts)
- **Reviewer Personas:**
  - `egm-implementation-readiness` (Pragmatic Tech Lead)
  - `egm-codebase-details` (Pedantic Technical Quality Auditor)
  - `egm-style` (Technical Copy Editor)
- **Target Standard:** `feature-spec-standard` & Codebase Conformance
- **Overall Verdict:** **REJECTED (NOT IMPLEMENTABLE AS WRITTEN)**

---

## Executive Summary

Stage 9 tested whether an engineer could execute lines 246–361 step-by-step without hitting blockers, inventing missing specifications, or corrupting existing codebase invariants.

All three auditors independently reached the same critical verdict: **The execution range cannot be implemented as currently specified.**

The primary blockers are:

1. **Phantom Ink Loop & Synchronous React Fracture (Track 3):** Lines 263 and 315 instruct the engineer to insert `await yieldToMain()` into "background ink pre-warming loops" in `src/lib/ink/react/cache.ts`. In reality, `inkFrame` is 100% synchronous and evaluated inside React `useMemo` hooks. No background pre-warming loop exists. Making `inkFrame` asynchronous fractures React rendering across all 120+ Looseleaf UI primitives.
2. **Omission of Core Wireframes from File Touchpoint Registry:** `NC2OA4Wireframe.tsx`, `NC2OA3Wireframe.tsx`, and `NC2GWireframe.tsx` are modified in Phase 1 (line 297) and required for Phase 2 view transitions, yet are completely missing from the "Complete File Touchpoint Registry" (lines 252–273).
3. **Radix UI Floating UI vs. CSS Anchor Positioning Collision (Track 5):** Radix UI (`@radix-ui/react-popover` via `radix-ui` v1.8.1) mounts Floating UI to dynamically write inline styles (`transform: translate3d(...)`, `top`, `left`). Layering `@supports (position-anchor)` over Radix creates an uncoordinated fight with inline styles. Furthermore, static anchor token `--desk-anchor` collides if multiple overlays exist.
4. **Track 6 Implementation Disconnects & Node Invariant Test Crash:**
   - On target 4 GB Celeron Chromebooks running ChromeOS LTS, `window.ai` evaluates to unavailable 100% of the time.
   - The state machine in `use-geometry-scaffolding.ts` is purely synchronous; no asynchronous event dispatch is defined for AI hints.
   - Pointer gesture abort is bound to `MascotCompanion.tsx`, which is a sibling card that never receives manipulative drag events from `BakingPan` or `TartPlate`.
   - Importing `prompt-api.ts` into `use-geometry-scaffolding.ts` will crash pure Node 26 invariant tests (`ReferenceError: window is not defined`) if `window` is accessed at module evaluation time.
5. **Codebase Reality Inaccuracies:**
   - Invariant test suite contains **35 tests**, not 43.
   - `TartPlate.tsx` renders `viewBox="0 0 800 500"` with center `(400, 250)`, not `500 500`.
   - `PairingMat.tsx` does not contain the supply tray (`SupplyTray.tsx` is an independent component), and is a 3-column buddy grid, not 2-column.
   - `package.json` script `check` does not run `test:ui` (Vitest), so broken UI mocks in `tests/setup.ts` will pass Gate 5 silently.
   - Contradictory `yieldToMain()` fallbacks: text specifies `Promise.resolve()` (a microtask that does not yield to paint), whereas line 173 specified `setTimeout(0)`.

---

## 1. High-Severity Implementation Blockers

### Blocker 1: Phantom Procedural Ink Pre-Warming Loop in Synchronous `cache.ts`

- **Location:** Line 263, Line 315, Line 359
- **Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`
- **Finding:**
  Line 315 directs: _"In `src/lib/ink/react/cache.ts`, add time-slicing logic (`performance.now() - start > 16`) calling `await yieldToMain()` during ink texture pre-warming loops."_
  Codebase inspection reveals that `src/lib/ink/react/cache.ts` contains on-demand LRU caching (`inkFrame()`), which is invoked synchronously inside `useMemo` in `useInkCore` (`hooks.ts#L248-L265`). There is no background loop. An engineer cannot `await` in synchronous `useMemo` without migrating the ink pipeline to React Suspense or asynchronous workers.
- **Resolution:**
  - **Prune Track 3 entirely** (recommended by Stage 8 Intermediate Zoom Out); OR
  - Specify an explicit standalone asynchronous helper `prewarmInkCache(...)` that does not touch synchronous `inkFrame()`.
  - Fix the fallback contract: replace microtask `Promise.resolve()` with macrotask `setTimeout(resolve, 0)` or `MessageChannel`.

### Blocker 2: Complete Omission of Wireframe Components from File Touchpoint Registry

- **Location:** Lines 250–273 vs. Line 297, Line 306
- **Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`
- **Finding:**
  Phase 1 (Line 297) modifies `NC2OA4Wireframe.tsx`, `NC2OA3Wireframe.tsx`, and `NC2GWireframe.tsx` to add `text-balance`. Phase 2 (Line 306) requires targeting their headers and toolbars for view transitions. However, none of these 3 wireframes appear in the File Touchpoint Registry (Lines 252–273).
- **Resolution:**
  Add rows to the File Touchpoint Registry for all three wireframe components, specifying their exact modifications and selectors.

### Blocker 3: Radix UI Floating UI Collision & Ambiguous Overlay Scope

- **Location:** Lines 266–267, Lines 308–309, Line 360
- **Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`
- **Finding:**
  `PopoverPrimitive.Content` (`@radix-ui/react-popover` via `radix-ui` v1.8.1) mounts Floating UI to calculate geometry and write inline styles (`transform: translate3d(...)`). Injecting CSS `position-anchor` without disabling Floating UI creates layout jitter and visual clipping. Furthermore, using a static `--desk-anchor` causes collisions across multiple popovers/tooltips.
- **Resolution:**
  - **Prune Track 5 entirely** and keep Radix UI's existing positioning engine (which handles at most 1 active popover with zero measurable overhead); OR
  - Migrate away from Radix UI to native HTML `<div popover="auto">` with dynamic anchor IDs.

### Blocker 4: Track 6 Implementation Disconnects & Node Invariant Test Crash

- **Location:** Lines 268–269, Lines 318–320, Line 361
- **Reviewers:** `egm-implementation-readiness`, `egm-codebase-details`
- **Finding:**
  1. `tests/invariants/nc2-g.invariant.test.ts` imports `use-geometry-scaffolding.ts` directly in pure Node 26 without DOM globals. If `use-geometry-scaffolding.ts` imports `prompt-api.ts` and `prompt-api.ts` accesses `window` or `document` at top-level evaluation, running `npm test` crashes with `ReferenceError: window is not defined`.
  2. The state machine in `scaffolding-machine.ts` is synchronous. The plan provides no specification for async state transitions or UI loading states during the 800ms inference window.
  3. Pointer gesture abort is wired to `MascotCompanion.tsx`, but manipulative drag events occur inside `BakingPan`, `TartPlate`, and `PairingMat`, which are sibling cards. The events do not bubble to `MascotCompanion`.
  4. The fraction regex `/\b\d+\/\d+\b/` fails to catch Unicode vulgar fractions (`½`, `¼`) and spaced fractions (`1 / 2`).
- **Resolution:**
  - **Excise Track 6 completely** as recommended by the Skeptical Architect. Rely on the proven deterministic state machine in `useGeometryScaffolding.ts` with static bilingual strings for ELL support.

---

## 2. Major Codebase Discrepancies & Execution Gaps

### Finding M-1: Invariant Test Count Inaccuracy (35 Tests vs. Claimed 43 Tests)

- **Location:** Lines 300, 335
- **Issue:** The document claims Gate 1 and `npm run check` pass "43 invariant tests". The repository contains exactly **35 invariant tests** across 4 suites (`curriculum`: 9, `nc2-g`: 10, `nc2-oa3`: 8, `nc2-oa4`: 8).
- **Correction:** Update all test count assertions from 43 to **35**.

### Finding M-2: Inaccurate SVG ViewBox & Root Element Assumptions for Manipulatives

- **Location:** Lines 259–260, Lines 293–294
- **Issue:**
  1. In `TartPlate.tsx`, `CENTER_X = 400`, `CENTER_Y = 250`, and the SVG renders `viewBox="0 0 800 500"`. Changing the viewBox to `"0 0 500 500"` without recalculating `CENTER_X` to 250 shifts the plate off-canvas and breaks radial ray calculations.
  2. Neither `BakingPan.tsx` nor `TartPlate.tsx` has an "outer card" wrapper; both export `<svg ref={svgRef} ...>` as their root element. Wrapping the root in a `<div>` breaks callers passing `svgRef` or SVG attribute props.
- **Correction:** Clarify that container queries are applied to the manipulative container `div` inside `NC2GWireframe.tsx`, keeping `viewBox="0 0 800 500"` and `aspect-[16/10]` consistent across both tools.

### Finding M-3: `PairingMat.tsx` Layout & Missing `SupplyTray.tsx`

- **Location:** Lines 261, 295
- **Issue:**
  1. `PairingMat.tsx` does not contain the supply tray. The supply tray is an independent component: `src/components/math/SupplyTray.tsx`.
  2. `PairingMat.tsx` renders a 3-column layout (`grid-cols-[60px_1fr_1fr]`). Applying `@sm:grid-cols-2` breaks the buddy pairing structure.
- **Correction:** Add `src/components/math/SupplyTray.tsx` to Track 2 in the registry. Keep `PairingMat.tsx` 3-column grid intact and apply container query sizing to slot dimensions and padding.

### Finding M-4: Verification Command Inaccuracies & UI Test Exclusion

- **Location:** Lines 300, 310, 324, Lines 332–351
- **Issue:**
  1. `npm run check` in `package.json` runs `format:check`, `lint`, `check:security`, `test`, and `build`. It **does not run `test:ui`** (Vitest). UI regressions or broken mocks in `tests/setup.ts` will pass Gate 5 silently.
  2. Gate 1 uses unquoted `tests/invariants/*.test.ts`, which is unportable across shells. The canonical package command is `npm test`.
  3. Prettier formatting is not included before `check`, causing format checks to fail if code deviates.
- **Correction:** Update Gate 1 to `npm test`. Update Gate 5 to `npm run check && npm run test:ui`. Instruct running `npm run format` prior to checks.

---

## 3. Style, Terminology & Editorial Polish (`egm-style`)

### Finding S-1: Verification Gate Count Numerical Contradiction

- **Location:** Line 330
- **Issue:** Text states "four verification gates," but immediately follows with five numbered gates (Gate 1 through Gate 5).
- **Correction:** Change to: `The implementation must satisfy five verification gates:`.

### Finding S-2: Accessibility Terminology Error ("keyboard traps")

- **Location:** Line 266
- **Issue:** States that Radix UI "keyboard traps" are preserved. In WCAG 2.1 (SC 2.1.2), a keyboard trap is a critical accessibility defect.
- **Correction:** Change to: `...preserving Radix UI accessibility contexts, focus containment, and pointer arrows.`

### Finding S-3: Undefined Symbol `SocraticLlmBridge`

- **Location:** Lines 264, 269
- **Issue:** References undefined identifier `SocraticLlmBridge`. The module exports `requestSocraticHint`.
- **Correction:** Replace `SocraticLlmBridge` with `requestSocraticHint`.

### Finding S-4: Unit Formatting and Delimiters

- **Location:** Lines 261, 263, 272, 333, 361
- **Issue:** Mixed LaTeX math notation (`$< 50\text{ms}$`, `$> 800\text{ms}$`) and unescaped regexes (`(\b\d+\/\d+\b)`).
- **Correction:** Standardize on plain text engineering notation (`< 50 ms`, `> 800 ms`, `< 16 ms`) and delimited regex code spans (`/\b\d+\/\d+\b/`).

---

## Implementation Readiness Scorecard

| Evaluation Dimension              | Verdict  | Summary                                                                                                         |
| :-------------------------------- | :------: | :-------------------------------------------------------------------------------------------------------------- |
| **1. Unambiguous Actionability**  | **FAIL** | Non-existent ink loop, undefined async state machine, and missing ambient types.                                |
| **2. Codebase Conformance**       | **FAIL** | Wireframes missing from registry; test count is 35 not 43; TartPlate viewBox and PairingMat grid mismatches.    |
| **3. Deterministic Sequencing**   | **FAIL** | Phase 1 & 2 depend on unregistered wireframe edits; Phase 3 depends on unrunnable AI/scheduler targets.         |
| **4. Verification Commands**      | **WARN** | `npm run check` ignores `test:ui`; Gate 1 uses raw glob instead of `npm test`.                                  |
| **5. Runtime Fallback Contracts** | **FAIL** | Track 3 microtask does not yield; Track 5 Radix override unworkable; Track 2 CSS width check impossible in CSS. |

---

## Final Recommendation for Stage 9 Sign-Off

The design in lines 246–361 cannot proceed to implementation as written.

To achieve an immediate **PASS**:

1. **Adopt the Streamlined 2-Stage Roadmap (from Stage 8)**:
   - Excise Track 3 (`scheduler.yield`), Track 5 (Anchor Positioning), Track 6 (Prompt API), and `DiagnosticLogger`.
   - Reduce file touchpoints from 18 files to the 6 core files:
     - `src/lib/dom/view-transitions.ts` (Create)
     - `src/App.tsx` (Modify)
     - `src/index.css` (Modify)
     - `src/components/math/BakingPan.tsx` (Modify)
     - `src/components/math/TartPlate.tsx` (Modify)
     - `src/components/math/PairingMat.tsx` (Modify)
2. **Add Wireframes to Registry**: If header typography (`text-balance`) is kept, register the 3 wireframe files explicitly.
3. **Correct Repository Realities**: Fix invariant test count to 35, keep `TartPlate` viewBox as `800 500`, update Gate 1 to `npm test`, and ensure Gate 5 executes `npm run check && npm run test:ui`.
