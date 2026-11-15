# Implementation Readiness Synthesis Report: NC.2.G Geometry Lab

**Target Document**: [`docs/designs/nc2-g-geometry-lab.md`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L294-L365)  
**Evaluated Scope**: Lines 294–365 (`## Detailed Implementation Plan`, `1. Touched Files Inventory & Technical Rationale`, `2. Phased Implementation Roadmap`, and `## Verification, Test Matrix & Release Gates`)  
**Auditing Swarm**: `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`  
**Governing Standard**: `implementation-readiness-standard` (Zero-Decision Rule, 100% First-Pass Actionability, Codebase Parity, Plain-English Engineering Copy)  
**Evaluation Status**: ⚠️ **REMEDIATION REQUIRED BEFORE IMPLEMENTATION**

---

## Executive Summary

The implementation plan provides a structured 7-phase roadmap and a comprehensive file inventory for delivering the **NC.2.G.3 (Equal Partitioning of Rectangles and Circles)** module. However, executing this plan directly in a fresh implementation session would require an engineer to make several critical architectural, mathematical, and schema decisions, violating the **Zero-Decision Rule**. Furthermore, wireframe navigation prop contracts currently lack the additions required to compile a 3-way standard union under `tsc -b`.

A joint audit synthesized findings into:

- **6 Blockers** (Missing curriculum seed definitions, underspecified partition math/tolerances, missing SVG matrix/RAF drag bindings, wireframe TypeScript navigation breaks, schema type divergence, and plain-English promotional/sensory violations).
- **7 Majors** (Missing standalone audio export, undefined scaffolding return/isomorphism contract, missing component prop interfaces, Node 26 type-stripping ESM import rules, missing profile mastery dispatch, missing localStorage key definition, and buzzword/roadmap header cleanup).
- **5 Nits** (SFX naming alignment, pre-commit latency threshold consistency, `npm run check` definition, test invariant numbering, and typography/LaTeX removals).

---

## Detailed Findings Matrix

### 1. Blocker Findings

#### [B-1] Complete Omission of 8 Problem Seed Definitions in `src/curriculum/items/nc2-g.ts`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:304, 305, 333`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L304) (Phase 3.2, Phase 3.3).
- **Discrepancy & Usability Impact**:
  The plan mandates creating [`src/curriculum/items/nc2-g.ts`](file:///Users/aaranvi/dev/elephant-goldfish/src/curriculum/items/nc2-g.ts) with a _"Seed bank of 8 verified NCDPI problem archetypes: 4 rectangular brownie/sheet cake pan challenges and 4 circular fruit tart/pizza challenges across halves, thirds, and fourths"_, and asserts 100% schema validation in [`tests/invariants/curriculum.invariant.test.ts`](file:///Users/aaranvi/dev/elephant-goldfish/tests/invariants/curriculum.invariant.test.ts). However, none of the 8 seed records are defined in the plan. Unlike existing modules ([`nc2-oa3.ts`](file:///Users/aaranvi/dev/elephant-goldfish/src/curriculum/items/nc2-oa3.ts) and [`nc2-oa4.ts`](file:///Users/aaranvi/dev/elephant-goldfish/src/curriculum/items/nc2-oa4.ts)) where every seed is enumerated, an implementer must guess or invent IDs, target shares, verbal share names, contexts, icons, and instructional narratives.
- **Remediation Requirement**:
  Define the complete literal array `NC2_G_SEEDS: readonly NC2GItem[]` directly in the document, covering all 8 seeds:
  1. `nc2-g-halves-brownies`: 2 shares, `"rectangle"`, context `"brownies"`, icon `"🍫"`, verbal `"halves"`.
  2. `nc2-g-thirds-cake`: 3 shares, `"rectangle"`, context `"sheet cake"`, icon `"🍰"`, verbal `"thirds"`.
  3. `nc2-g-fourths-sheet`: 4 shares, `"rectangle"`, context `"sheet brownies"`, icon `"🍫"`, verbal `"fourths"`.
  4. `nc2-g-halves-cornbread`: 2 shares, `"rectangle"`, context `"cornbread"`, icon `"🍞"`, verbal `"halves"`.
  5. `nc2-g-halves-pizza`: 2 shares, `"circle"`, context `"pizza"`, icon `"🍕"`, verbal `"halves"`.
  6. `nc2-g-thirds-tart`: 3 shares, `"circle"`, context `"fruit tart"`, icon `"🥧"`, verbal `"thirds"`.
  7. `nc2-g-fourths-pie`: 4 shares, `"circle"`, context `"berry pie"`, icon `"🫐"`, verbal `"fourths"`.
  8. `nc2-g-fourths-cookie`: 4 shares, `"circle"`, context `"giant cookie"`, icon `"🍪"`, verbal `"fourths"`.

---

#### [B-2] Underspecified Mathematical Contract for `evaluatePartition`: Coordinates, Tolerances, and Feedback

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:300, 324`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L300), and [`lines 207–211`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L207-L211) (Phase 1.1).
- **Discrepancy & Usability Impact**:
  `evaluatePartition(cuts: number[], spec: GeometryProblemSpec): GeometryDiagnostic` does not define:
  1. **Cut Representations**: For rectangles, `cuts` represents $k - 1$ normalized horizontal dividers in $[0, 1]$. For circles, `cuts` represents $k$ radial spoke angles in $[0, 360)$.
  2. **Tolerance Semantics**: Whether $\pm 5\%$ is absolute ($|s_i - 1/k| \le 0.05$ for all shares $i$) or relative.
  3. **Diagnostic Branches & Strings**: Feedback templates are omitted for `correct`, `unequal_shares`, `wrong_share_count`, and `unpartitioned`, unlike [`src/lib/math/evaluator.ts`](file:///Users/aaranvi/dev/elephant-goldfish/src/lib/math/evaluator.ts#L18-L58).
- **Remediation Requirement**:
  Document the exact algorithmic transform:
  - **Rectangle**: Given sorted dividers $c_1, \dots, c_{k-1} \in [0, 1]$, slice sizes are $s_0 = c_1$, $s_i = c_{i+1} - c_i$, $s_{k-1} = 1 - c_{k-1}$.
  - **Circle**: Given sorted spoke angles $\theta_0, \dots, \theta_{k-1} \in [0, 360)$, angular share fractions are $\Delta\theta_i / 360$ with wrap-around $\Delta\theta_{k-1} = (360 - \theta_{k-1} + \theta_0) / 360$.
  - **Tolerance**: Absolute tolerance threshold $|s_i - 1/k| \le 0.05$ for all shares $i$.
  - **Deterministic Feedback**:
    - `correct`: `"Great job! You cut the {context} into {targetShares} equal {verbalShareName}!"`
    - `unequal_shares`: `"These pieces aren't equal yet! Slide the cutter to make each share the same size."`
    - `wrong_share_count`: `"We need {targetShares} equal shares! Select the [{targetShares} {verbalShareName}] cutter."`
    - `unpartitioned`: `"Use the cutter to partition the {context} into {targetShares} equal {verbalShareName}!"`

---

#### [B-3] Missing SVG Matrix Inversion, Radial Drag Mode, and RAF Transform Contract in `useDeclarativeDrag`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:302, 328`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L302), and [`lines 225–243`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L225-L243) (Phase 2.1).
- **Discrepancy & Usability Impact**:
  The plan states that the engine performs SVG matrix coordinate inversion (`svg.getScreenCTM()?.inverse()`) and maintains 60 FPS without React reconciliation on raw move events (Release Gate 5). However, the hook signature accepts no SVG element ref, does not differentiate between 1D linear sliding and 2D radial angle calculation ($\text{atan2}$ around center $(cx, cy)$), and returns `activeValue` as React state which would re-render at 60/120Hz.
- **Remediation Requirement**:
  Update `DeclarativeDragOptions` in the plan:
  ```typescript
  export interface DeclarativeDragOptions {
    mode: "linear-horizontal" | "radial"
    svgRef: React.RefObject<SVGSVGElement | null>
    center?: { x: number; y: number } // Required for radial mode (viewBox center)
    bounds?: { min: number; max: number } // Linear pixel bounds [minX, maxX]
    targets: SnapTarget[]
    snapThreshold?: number // Default 0.05
    releaseThreshold?: number // Default 0.10
    onTransform?: (value: number, pixelOffset: number) => void // Imperative RAF transform callback
    onSnap?: (target: SnapTarget) => void
    onRelease?: () => void
    onCommit?: (value: number, snappedTarget: SnapTarget | null) => void // Discrete commit on pointerup
  }
  ```

---

#### [B-4] Incomplete Wireframe Navigation Prop Contracts Break 3-Way Routing Under TypeScript

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:313-315, 346-348`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L313-L315), [`src/App.tsx:34-51`](file:///Users/aaranvi/dev/elephant-goldfish/src/App.tsx#L34-L51), [`src/components/math/NC2OA4Wireframe.tsx:53-61`](file:///Users/aaranvi/dev/elephant-goldfish/src/components/math/NC2OA4Wireframe.tsx#L53-L61), [`src/components/math/NC2OA3Wireframe.tsx:50-58`](file:///Users/aaranvi/dev/elephant-goldfish/src/components/math/NC2OA3Wireframe.tsx#L50-L58).
- **Discrepancy & Usability Impact**:
  In [`src/App.tsx`](file:///Users/aaranvi/dev/elephant-goldfish/src/App.tsx), `NC2OA4Wireframe` only accepts `onSwitchToParity`, and `NC2OA3Wireframe` only accepts `onSwitchToArrays`. Adding `📐 NC.2.G Geometry` buttons without updating the component prop interfaces will cause immediate compilation errors under `tsc -b`.
- **Remediation Requirement**:
  1. Add `onSwitchToGeometry?: () => void` to `NC2OA4Wireframe` props and wire to the geometry header button.
  2. Add `onSwitchToGeometry?: () => void` to `NC2OA3Wireframe` props and wire to the geometry header button.
  3. Define `NC2GWireframeProps`:
     ```typescript
     export interface NC2GWireframeProps {
       theme?: DeskTheme
       onSetTheme?: (t: DeskTheme) => void
       onSwitchToArrays?: () => void
       onSwitchToParity?: () => void
     }
     ```
  4. In `App.tsx`, pass `onSwitchToGeometry={() => setActiveStandard("geometry")}` to both existing wireframes, and wire `NC2GWireframe` to switch back to arrays and parity.

---

#### [B-5] Schema Type Divergence & Missing Validator Functions in `src/curriculum/invariants.ts`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:165-175, 303`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L165-L175), [`src/curriculum/invariants.ts:20-35, 175-189`](file:///Users/aaranvi/dev/elephant-goldfish/src/curriculum/invariants.ts#L20-L35).
- **Discrepancy & Usability Impact**:
  Section 3 defines `GeometryShapeType` and `GeometryProblemSpec`, but Section 1 (row 303) names `NC2GItem` and `PartitionShapeType`. Additionally, row 303 omits `assertValidNC2GItem`, and `GeometryProblemSpec` lacks curriculum schema fields (`standard: "NC.2.G.3"`, `context: string`).
- **Remediation Requirement**:
  Harmonize Section 1 and Section 3:
  1. Use `GeometryShapeType = "rectangle" | "circle"`.
  2. Define `NC2GItem` in [`src/curriculum/invariants.ts`](file:///Users/aaranvi/dev/elephant-goldfish/src/curriculum/invariants.ts) with `standard: "NC.2.G.3"`, `shapeType: GeometryShapeType`, `targetShares: 2 | 3 | 4`, `equation: string`, `context: string`, `narrative: string`, and `verbalShareName: "halves" | "thirds" | "fourths"`.
  3. Provide `createNC2GItem`, `validateNC2GItem`, and `assertValidNC2GItem(item: unknown): asserts item is NC2GItem`.
  4. In `geometry-evaluator.ts`, declare `export type GeometryProblemSpec = NC2GItem`.

---

#### [B-6] Plain-English Violations: Promotional Adjectives & Sensory Oxymoron

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:305, 307`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L305).
- **Discrepancy & Usability Impact**:
  - Line 305: _"verifying seamless integration with evaluatePartition"_ uses the ungrounded promotional adjective "seamless".
  - Line 307: _"provides tactile acoustic feedback"_ is a sensory oxymoron; Web Audio frequency sweeps provide auditory feedback, not tactile (haptic/vibrational) sensations.
- **Remediation Requirement**:
  - Replace line 305 with: _"verifying functional compatibility with evaluatePartition."_
  - Replace line 307 with: _"provides auditory feedback when a cut line snaps."_

---

### 2. Major Findings

#### [M-1] Missing Top-Level Standalone Proxy Export for `playSliceThud` in `audio-bus.ts`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:307, 308, 329`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L307), [`src/lib/audio/audio-bus.ts:388-411`](file:///Users/aaranvi/dev/elephant-goldfish/src/lib/audio/audio-bus.ts#L388-L411), [`src/lib/audio/sfx.ts:1-21`](file:///Users/aaranvi/dev/elephant-goldfish/src/lib/audio/sfx.ts#L1-L21).
- **Discrepancy & Fix**:
  Row 307 specifies adding `playSliceThud()` to `SfxBus`, and row 308 specifies re-exporting it from `sfx.ts`. In `audio-bus.ts`, all sound effects require both the class method AND a top-level standalone function (`export function playSliceThud(): void { audioBus.sfx.playSliceThud() }`). Without this proxy export, `sfx.ts` will trigger a TypeScript compilation error.

#### [M-2] Scaffolding State Machine Interface & Isomorphism Selector Undefined in `use-geometry-scaffolding.ts`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:306, 337`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L306), [`src/hooks/use-socratic-scaffolding.ts:214-251`](file:///Users/aaranvi/dev/elephant-goldfish/src/hooks/use-socratic-scaffolding.ts#L214-L251).
- **Discrepancy & Fix**:
  Define `GeometryScaffoldingConfig`, `GeometryScaffoldingReturn` (matching the `SocraticScaffoldingReturn` shape required by `MascotCompanion`), helper `demonstrateGeometryStep(spec: NC2GItem): number[]`, and `getIsomorphicGeometrySpec(current: NC2GItem, seeds: readonly NC2GItem[]): NC2GItem`.

#### [M-3] Missing Component Prop Interfaces for `BakingPan`, `TartPlate`, and `PartitionToolBar`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:309-311, 340-342`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L309-L311).
- **Discrepancy & Fix**:
  Explicitly specify:
  - `BakingPanProps`: `cuts: number[]`, `targetShares: 2 | 3 | 4`, `isGhostVisible: boolean`, `onCutsChange: (cuts: number[]) => void`, `svgRef: React.RefObject<SVGSVGElement | null>`.
  - `TartPlateProps`: `radialAngles: number[]`, `targetShares: 2 | 3 | 4`, `isGhostVisible: boolean`, `onAnglesChange: (angles: number[]) => void`, `svgRef: React.RefObject<SVGSVGElement | null>`.
  - `PartitionToolBarProps`: `activeShares: 2 | 3 | 4`, `targetShares: 2 | 3 | 4`, `onSelectShares: (shares: 2 | 3 | 4) => void`, `onCheckAnswer: () => void`, `isSolved: boolean`.

#### [M-4] Node 26 Native Type-Stripping Invariant Test Harness Import Rules Not Documented

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:301, 325, 360`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L301), [`package.json:10`](file:///Users/aaranvi/dev/elephant-goldfish/package.json#L10).
- **Discrepancy & Fix**:
  Tests are run natively via `node --experimental-strip-types --test tests/invariants/*.test.ts`. Note explicitly in Phase 1: all test imports must use relative paths with explicit `.ts` extensions (e.g. `../../src/lib/math/geometry-evaluator.ts`) without path aliases (`@/`), and must avoid non-erasable TypeScript runtime syntax per `tsconfig.app.json`.

#### [M-5] Unstated COPPA Student Profile Mastery Registration in `NC2GWireframe`

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:312, 365`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L312), [`src/lib/storage/profile.ts:157-181`](file:///Users/aaranvi/dev/elephant-goldfish/src/lib/storage/profile.ts#L157-L181).
- **Discrepancy & Fix**:
  Specify that upon unassisted problem validation (`scaffolding.masteryEligible === true`), `NC2GWireframe` calls `addStars(1)` and `markStandardMastered("NC.2.G.3")`.

#### [M-6] Undefined LocalStorage Persistence Key and Sanitization for Active Standard

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:313, 346`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L313), [`src/App.tsx:13-32`](file:///Users/aaranvi/dev/elephant-goldfish/src/App.tsx#L13-L32).
- **Discrepancy & Fix**:
  Define storage key `egm_active_standard` with a sanitizing initializer checking for `"arrays" | "parity" | "geometry"`, defaulting to `"arrays"`.

#### [M-7] Corporate Buzzwords and Subjective Roadmap Headings

- **Affected Scope**: [`docs/designs/nc2-g-geometry-lab.md:301, 323, 339`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md#L301).
- **Discrepancy & Fix**:
  - Line 301: Replace _"Meta-inspired Just-In-Time invariant test suite"_ with _"Automated invariant test suite"_.
  - Line 323: Replace _"Phase 1: Invariant Quality Engine & Pure Evaluator"_ with _"Phase 1: Diagnostic Evaluator & Invariant Tests"_.
  - Line 339: Replace _"Phase 5: Tactile SVG Manipulatives & Dual-Mode Controls"_ with _"Phase 5: Interactive SVG Manipulatives & Controls"_.

---

### 3. Nit Findings

1. **SFX Naming Alignment**: Standardize on `playSliceThud()` across lines 89, 129, and 307 (replaces obsolete mentions of `playStampThud` for cut snapping).
2. **Pre-Commit Latency Consistency**: Standardize pre-commit test execution threshold to `< 150ms` across lines 301, 325, 350, and 361 (removes conflicting `< 100ms` claim).
3. **`npm run check` Definition**: Update lines 351 and 362 to accurately reference `npm run check (npm test && npm run build)`.
4. **Test Invariant Numbering**: Annotate new curriculum tests in `tests/invariants/curriculum.invariant.test.ts` as `Curriculum Invariant 7, 8, 9` for traceability.
5. **Typography & LaTeX Removals**:
   - Replace LaTeX pixel units `$48\text{px}$` $\to$ `48px` (lines 309, 310).
   - Replace LaTeX latency references $< 150\text{ms}$ $\to$ `< 150ms` (lines 301, 361).
   - Strip decorative adverbs: _"pass cleanly"_ $\to$ _"pass"_, _"strictly fit"_ $\to$ _"fit"_ (lines 362, 363).
   - Add language tag `text` to fenced code block on line 322.

---

## Conclusion & Implementation Gate Status

**STATUS: NOT READY FOR DIRECT EXECUTION (Remediation Required)**  
The implementation plan cannot be executed without guessing. Applying the proposed drop-in edits to [`docs/designs/nc2-g-geometry-lab.md`](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/nc2-g-geometry-lab.md) will achieve 100% first-pass actionability under the Zero-Decision Rule.
