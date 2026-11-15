# Feature Concept Brief: NC.2.G Geometry Lab via Declarative Pointer Snapping

- **Author:** EGM Ideation Swarm (Synthesized from 6-Lens Goldfish Swarm Review)
- **Date:** 2026-11-04
- **Target Repository:** `https://github.com/asub927/egm-looseleaf-experiment.git`
- **Status:** Step 3: Synthesized Goldfish Brief (Review Complete)

---

## Overview

This feature integrates the **North Carolina Grade 2 Geometry curriculum (NC.2.G.3: Equal Shares of Rectangles and Circles)** into the Elephant-Goldfish tactile learning desk. It teaches foundational fractional and spatial reasoning to second graders (ages 7–8) by allowing them to divide shapes into halves, thirds, and fourths through physical, direct-manipulation gestures.

Rather than importing heavy external drag-and-drop suites, the module introduces a **lightweight, zero-dependency declarative pointer snapping engine** (`src/lib/drag/declarative-drag.ts`) built directly on native browser `PointerEvents`, coordinate projection, and magnetic attraction basins.

The learning experience is tailored specifically to second-grade fine motor control and early literacy:

1. **Rectangular Pan Partitioning (NC.2.G.3)**: Dragging Kit's wooden accordion ruler across a baking tray to magnetically slice it into equal halves, thirds, or fourths.
2. **Circular Tart Partitioning (NC.2.G.3)**: Dragging a radial pizza/pastry wheel across a fruit tart to partition it into equal halves, thirds, or fourths.
3. **Dual-Mode Ergonomic Guarantee**: Every drag gesture is mirrored by large, single-tap cutter badges (`[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`) to ensure 100% accessibility on classroom Chromebook trackpads and iPads.
4. **Pedagogical Audio Guidance**: Docked companion mascot **Pencil Pal** (`MascotCompanion`) guides the student with synchronized voice narration (`useAudioNarration`), real-time subtitle highlighting, and a 3-tier Socratic scaffolding ladder.

---

## Analysis: Synthesized Cross-Lens Swarm Review

The initial concept was rigorously evaluated across 6 specialist Goldfish review lenses (`egm-design`, `egm-zoom-out`, `egm-structural`, `egm-implementation-readiness`, `egm-comprehension`, `egm-codebase-details`). The review uncovered critical architectural and pedagogical risks that necessitated key design pivots:

### 1. Architectural & Dependency Risk: Heavy Third-Party `dragology` vs. Native Pointer Events

- **Goldfish Lens**: `egm-zoom-out`, `egm-codebase-details`, `egm-design`
- **Finding**: The upstream npm package `dragology` targets React 18/17 and bundles `immer`, `lodash-es`, and 5 separate D3 packages (`d3-delaunay`, `d3-interpolate-path`, etc.). In this repository—which runs strict **React 19.3.1**, Vite 8, and offline PWA packaging—installing `dragology` introduces peer dependency collisions, risks runtime fiber reconciliation crashes during speculative rendering, and causes severe bundle bloat.
- **Resolution**: Drop the third-party `dragology` package entirely. Snapping a 1D cutting line to fractional boundaries ($25\%, 33.3\%, 50\%, 66.7\%, 75\%$) or radial angles ($90^\circ, 120^\circ, 180^\circ$) requires only ~35 lines of native pointer math (`setPointerCapture`, `Math.atan2`, `svg.getScreenCTM()`). This achieves the exact same magnetic snap feel with 0 dependencies, 0 network fetch requirements, and 0 bundle overhead.

### 2. Scope Discipline: Deferring Freeform Polygon Composition (NC.2.G.1)

- **Goldfish Lens**: `egm-zoom-out`, `egm-design`, `egm-comprehension`
- **Finding**: Task 3 (freeform pattern block polygon composition) requires arbitrary 2D polygon rotation, edge-to-edge magnetic adjacency, and polygon boolean clipping. Continuous 2D rotation on school laptop trackpads is an ergonomic barrier for 7-year-olds, and edge snapping without fixed slots creates floating-point jitter and high implementation complexity. Furthermore, shape composition does not directly bridge into Grade 2 array multiplication.
- **Resolution**: Narrow the initial release strictly to **NC.2.G.3 (Equal Partitioning of Rectangles and Circles)**. Rectangular partitioning directly reinforces row-and-column array multiplication (NC.2.OA.4). Defer pattern block composition (NC.2.G.1) to Milestone 2 as discrete, fixed socket puzzles.

### 3. Developmental Cognition: Abstract Fraction Bar Notation vs. Verbal/Spatial Shares

- **Goldfish Lens**: `egm-comprehension`
- **Finding**: The initial brief specified fallback buttons and badges labeled `[½]`, `[⅓]`, and `[¼]`. Under NCDPI and Common Core standards, formal fraction bar notation ($\frac{a}{b}$) is **not introduced until Grade 3** (NC.3.NF.1). Grade 2 students learn verbal and spatial partition concepts: _"halves, thirds, half of, a third of, fourths, quarter of"_, and _"two halves, three thirds, four fourths"_. Abstract numeral fractions confuse 7-year-olds who have not yet learned fraction notation.
- **Resolution**: Replace all fraction bar symbols with verbal labels accompanied by visual split icons: `[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`. Spoken mascot feedback reinforces verbal shares: _"Baker Kit has 3 equal thirds for 3 friends!"_

### 4. Direct Manipulation Mechanics: Parametric Accordion vs. Iterative Slicing

- **Goldfish Lens**: `egm-implementation-readiness`, `egm-comprehension`, `egm-design`
- **Finding**: Asking a 7-year-old to place 2 or 3 separate uncoordinated cut lines creates an ambiguous state machine (e.g., pan is left in an incomplete 1/3 vs 2/3 state) and causes erratic snapping jitter when multiple fractional snap points are active simultaneously.
- **Resolution**: Tasks are framed with an explicit target challenge (e.g., _"Help Kit cut 4 equal fourths for snack time!"_). The child drags a single parametric accordion cutter: moving the handle dynamically stretches and spaces the full set of partition lines across the shape. When released within the magnetic tolerance band ($\pm 6\%$), it snaps with an audible slice thud.

### 5. Runtime Performance: Decoupling Drag State from React 19 Fiber Reconciliation

- **Goldfish Lens**: `egm-design`, `egm-codebase-details`
- **Finding**: Firing React `useState` updates at 60/120Hz during pointer movement causes fiber reconciliation churn and frame drops on low-power school Chromebooks.
- **Resolution**: Drag coordinates update the DOM imperatively via CSS transforms in a `requestAnimationFrame` loop. React state is committed only upon entering/exiting a discrete snap basin or on `pointerup`.

### 6. Snapping Stability: Schmitt-Trigger Hysteresis & Sound Debounce

- **Goldfish Lens**: `egm-design`, `egm-codebase-details`
- **Finding**: Near snap boundaries, minor finger tremor can trigger rapid oscillate-in/oscillate-out loops, generating chaotic visual flicker and sound spam.
- **Resolution**: Implement dual-threshold Schmitt-trigger hysteresis: enter magnetic snap at $\pm 5\%$ distance, but require dragging past $\pm 10\%$ to break free. Throttle slice audio triggering with a 250ms cooldown.

### 7. Headless Invariant Testing Decoupling

- **Goldfish Lens**: `egm-codebase-details`, `egm-structural`
- **Finding**: The repository enforces a sub-150ms test execution gate (`npm test` running `node --experimental-strip-types`). If `geometry-evaluator.ts` imports from DOM, SVG, or UI modules, Node 26 will throw runtime reference errors.
- **Resolution**: `src/lib/math/geometry-evaluator.ts` is implemented as 100% pure headless math operating solely on numeric coordinates ($x \in [0, 1]$, angles $\theta$, target slice counts $N \in \{2, 3, 4\}$). Automated invariant tests in `tests/invariants/nc2-g.invariant.test.ts` verify mathematical and pedagogical invariants in $< 100\text{ms}$.

---

## The Two Selected Core Tasks

### Task 1: Rectangular Pan Partitioning (NC.2.G.3)

- **Standard**: Partition rectangles into two, three, or four equal shares; describe shares using the words _halves, thirds, half of, a third of, fourths, quarter of_; describe the whole as _two halves, three thirds, four fourths_. Recognize that equal shares of identical wholes need not have the same shape.
- **Visual Metaphor**: "Brownie Baking Pan" or "Sheet Cake" on graph paper within Looseleaf `<Paper stock="card" rules="graph">`.
- **Interaction**:
  - An SVG baking pan is displayed. Kit's accordion ruler cutter rests on the pan.
  - Socratic challenge prompt: _"Baker Kit baked a pan of brownies! Cut the pan into 3 equal thirds for 3 friends."_
  - Dragging the cutter horizontally or vertically adjusts the partition lines. As the student nears $33.3\%$ spacing ($\pm 6\%$), the lines magnetically lock into place with an audible slice thud.
  - Each slice illuminates with a watercolor tint and verbal badge: `[1 third]`, `[1 third]`, `[1 third]`.
  - Bottom equation banner: _"3 thirds = 1 whole pan"_.
- **Bridge to Arrays (NC.2.OA.4)**:
  - Splitting rectangles into equal rows and columns visually reinforces repeated addition and prepares students for Grade 3 rectangular area models.

### Task 2: Circular Tart Partitioning (NC.2.G.3)

- **Standard**: Partition circles into two, three, or four equal shares; describe shares using the words _halves, thirds, half of, a third of, fourths, quarter of_; recognize that equal shares of identical wholes need not have the same shape.
- **Visual Metaphor**: "Fruit Tart" or "Personal Pizza" on a cutting board within Looseleaf `<Paper stock="card">`.
- **Interaction**:
  - An SVG circular tart is displayed. A rotary pastry wheel cutter is positioned at the top.
  - Socratic challenge prompt: _"Kit baked a fruit tart! Divide the tart into 4 equal fourths for a picnic."_
  - The student drags the pastry cutter across the center of the tart. Based on the target share count, the cutter projects radial spokes:
    - Halves: 1 straight cut across diameter ($180^\circ$)
    - Thirds: 3 radial spokes ($120^\circ$ apart)
    - Fourths: 2 perpendicular cross cuts ($90^\circ$ apart)
  - As the cut angle aligns within $\pm 6^\circ$, the wedges snap into equal shares with slice thuds and verbal badges: `[1 fourth]`, `[1 fourth]`, `[1 fourth]`, `[1 fourth]`.
  - Bottom equation banner: _"4 fourths = 1 whole tart"_.

---

## Ergonomic Safety for 2nd Graders (Ages 7–8)

1. **Large Visual Hit Targets**:
   - Drag handles provide a minimum visual size of $48\text{px} \times 48\text{px}$ with a generous $56\text{px} \times 56\text{px}$ interactive touch boundary (exceeding WCAG 2.2 AAA $44\text{px}$).
2. **Dual-Mode Input Guarantee**:
   - Continuous dragging is never required. Prominent single-tap tool badges (`[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`) allow children on laptop trackpads or motor-impaired devices to split the shape instantly with one tap.
3. **Schmitt-Trigger Magnetic Snapping**:
   - Snap activation distance: $\pm 5\%$ / $\pm 6^\circ$. Snap release threshold: $\pm 10\%$ / $\pm 12^\circ$. Prevents finger tremor flicker.
4. **Synchronized Socratic Narration**:
   - All instructions, hints, and celebratory summaries are narrated aloud by Pencil Pal via `useAudioNarration` with synchronized word highlighting, ensuring complete accessibility for emerging readers.

---

## Goals vs. Non-Goals

### In-Scope Goals

- Add a 3rd curriculum module to the top navigation: `📐 NC.2.G Geometry`.
- Implement the 2 core partitioning archetypes: Rectangular Pan Partitioning (NC.2.G.3) and Circular Tart Partitioning (NC.2.G.3).
- Build a zero-dependency, lightweight declarative pointer snapping engine (`src/lib/drag/declarative-drag.ts`) using native `PointerEvents` and `requestAnimationFrame`.
- Enforce dual-mode accessibility with single-tap tool badges (`[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`).
- Implement a pure headless geometry evaluator (`src/lib/math/geometry-evaluator.ts`) decoupled from React DOM/SVG.
- Create automated invariant test suites in `tests/invariants/nc2-g.invariant.test.ts` running in $< 150\text{ms}$ under `npm test`.
- Integrate docked `MascotCompanion` (Pencil Pal) with `useAudioNarration` and a 3-tier Socratic scaffolding state machine (`useGeometryScaffolding`).
- Map audio cues directly to `SfxBus` in `src/lib/audio/audio-bus.ts` (`playStampThud` for slice thuds, `playPickupChirp` for tool pickups).
- 100% offline, zero tracking, COPPA-exempt student profile persistence in `localStorage` (`profile.ts`).

### Out-of-Scope Non-Goals

- Importing external `dragology`, D3, or Immer dependencies.
- Freeform polygon composition, continuous 2D rotation, or pattern blocks (NC.2.G.1) (deferred to Milestone 2 with fixed sockets).
- Abstract fraction bar numerals (`½`, `⅓`, `¼`) exceeding Grade 2 curriculum standards.
- Arbitrary freehand drawing without geometric snapping.
- Non-standard fractions (5ths, 6ths, 7ths, 8ths) exceeding Grade 2 standards.
- 3D solid rendering or WebGL engines (3D shapes remain 2D isometric nets and face counting).

---

## Alternatives Weighed

1. **Third-Party `dragology` vs. Native Declarative Pointer Snapping**:
   - _Rejected_: Installing `npm install dragology`.
   - _Reason_: Targets React 18/17, collides with React 19.3.1 peer dependencies, pulls in Immer and 5 D3 packages, risks runtime crash during offscreen speculative rendering, and bloats offline PWA bundle.
   - _Adopted_: Native pointer snapping engine in `src/lib/drag/declarative-drag.ts`. Uses native `PointerEvents` and simple coordinate math. Exactly replicates the tactile magnetic snap feel with 0 dependencies and 0 build risk.

2. **Full NC.2.G Suite (including Pattern Blocks) vs. Focused NC.2.G.3 Partitioning**:
   - _Rejected_: Building Task 3 (Pattern Block Composition) in the initial milestone.
   - _Reason_: Requires complex continuous polygon rotation, edge-to-edge magnetic detection, and polygon boolean clipping. Trackpad rotation is difficult for 7-year-olds and distracts from core fraction learning.
   - _Adopted_: Focus exclusively on NC.2.G.3 (Rectangles & Circles). This provides deep mathematical value, directly prepares students for array multiplication (NC.2.OA.4), and delivers a polished tactile experience within scope.

3. **Abstract Fraction Numerals (`[½]`, `[⅓]`) vs. Verbal/Spatial Share Labels**:
   - _Rejected_: Displaying fraction numerals ($\frac{1}{2}, \frac{1}{3}, \frac{1}{4}$).
   - _Reason_: Fraction bars are a Grade 3 standard (NC.3.NF.1). Grade 2 children have not been taught fraction notation, causing confusion and classroom hesitation.
   - _Adopted_: Grade 2 verbal labels with visual split icons: `[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]` and spoken audio: _"two equal halves"_, _"three equal thirds"_.

4. **Iterative Multiple Slices vs. Parametric Accordion Cutter**:
   - _Rejected_: Requiring students to place multiple independent cut lines across the pan.
   - _Reason_: Second graders struggle with fine-motor placement of multiple lines, leaving shapes in awkward, incomplete states.
   - _Adopted_: Parametric multi-cutter. Challenge states target shares (e.g. 3 equal thirds); dragging the handle dynamically projects and spaces the full set of equal shares.

---

## Key Decisions & Implementation Staging

### Architectural Contracts

1. **State Machine Interface (`useGeometryScaffolding`)**:

   ```typescript
   export type GeometryShapeType = "rectangle" | "circle"
   export type GeometryShareCount = 2 | 3 | 4 // Halves, Thirds, Fourths

   export interface GeometryChallenge {
     id: string
     shapeType: GeometryShapeType
     targetShares: GeometryShareCount
     label: string
     narrative: string
     verbalShareName: "halves" | "thirds" | "fourths"
   }

   export interface GeometryDiagnostic {
     status: "correct" | "unequal_shares" | "wrong_share_count" | "unpartitioned"
     currentCutPercent: number // 0..1 or angle in degrees
     targetTolerance: number
     feedback: string
     verbalSummary: string
   }
   ```

2. **Top Navigation Refactoring (`App.tsx`)**:

   ```typescript
   export type ActiveStandard = "arrays" | "parity" | "geometry"
   ```

   Wire up unified header navigation so all three standards switch cleanly without code duplication.

3. **Implementation Staging**:
   - **Stage 1 (Evaluator & Invariant Tests)**: Implement `src/lib/math/geometry-evaluator.ts` and `tests/invariants/nc2-g.invariant.test.ts`. Verify `< 150ms` runtime via `npm test`.
   - **Stage 2 (Declarative Pointer Snapping Hook)**: Implement `src/lib/drag/declarative-drag.ts` with Schmitt-trigger hysteresis and audio debounce.
   - **Stage 3 (Curriculum Item Seeds & Scaffolding)**: Define `src/curriculum/items/nc2-g.ts` and `src/hooks/use-geometry-scaffolding.ts`.
   - **Stage 4 (UI Wireframe & Integration)**: Create `src/components/math/NC2GWireframe.tsx`, embed inside Looseleaf `<Paper>` and `<Desk>`, connect `MascotCompanion` and audio narration, and wire into `App.tsx`.

---

## Anchored Feature Hypothesis

> **The NC.2.G Geometry Lab delivers two high-impact, tactile SVG manipulative tasks (Rectangular Brownie Pan Partitioning and Circular Tart Partitioning) powered by zero-dependency native declarative pointer snapping, dual-mode verbal/spatial single-tap tools (`[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`), pure headless invariant testing under 150ms, synchronized Pencil Pal Socratic narration, and 100% offline COPPA-exempt execution.**
