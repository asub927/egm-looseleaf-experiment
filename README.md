# Elephant Goldfish Blueprint

## System Overview

Elephant Goldfish is an offline-first, tactile math desk and stationery-styled web application built with React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, and the Looseleaf procedural ink rendering engine. The repository implements over 120 hand-drawn UI primitives adhering to the shadcn/ui component API, complete with procedural sketch shading, paper texture simulation, physics curl animations, and vector doodles.

The application delivers an accessible, manipulative-first North Carolina Grade 2 mathematics curriculum across three foundational domains with 100% client-side privacy (COPPA compliant, zero telemetry, zero server dependencies).

> **Development Note**: This project uses Vite with HMR and Oxlint rules. Type-aware linting can be run via `npm run lint`. Verification and build checks are executed via `npm run check`.

---

## 3-Way Standard Navigation Architecture

The desk features a unified, top-level 3-way standard navigation architecture (`App.tsx`) with seamless state transitions and persistent local profile tracking (`egm_active_standard`, `egm_desk_theme`, `egm_student_profile`):

1. **`NC.2.OA.4` — Rectangular Arrays (`[🍪 Arrays]`)**:
   - Building rectangular arrays of up to 5 rows and 5 columns using tactile cookie counters on baking sheets.
   - Connects concrete row/column spatial arrangements to repeated addition equations ($3 + 3 + 3 + 3 = 12$).
   - Guards against orientation confusion ($3 \times 4 \neq 4 \times 3$) and enforces spatial contiguity without gaps.

2. **`NC.2.OA.3` — Odd & Even Parity (`[🌰 Odd & Even]`)**:
   - Determining parity of groups up to 20 tokens (chestnuts, acorns) by pairing items into two equal columns on a tactile sorting mat.
   - Expresses even numbers as sums of two equal addends ($a + a = 2a$) and models odd numbers with a singular unpaired leftover token.

3. **`NC.2.G.3` — Geometry Lab: Equal Partitioning (`[📐 Geometry]`)**:
   - Dividing 2D rectangular pans (brownies, sheet cakes, cornbread) and circular plates (fruit tarts, personal pizzas, giant cookies) into two, three, or four equal shares (_halves, thirds, fourths_).
   - Strictly enforces verbal share vocabulary (_"1 third"_, _"3 thirds make 1 whole"_) per North Carolina Grade 2 standards, intentionally omitting abstract fraction notation ($\frac{a}{b}$) until Grade 3.

---

## NC.2.G Geometry Lab Module (`NC.2.G.3`)

The Geometry Lab provides tactile spatial partitioning through direct manipulation manipulatives and single-tap accessible tool badges:

- **Tactile Manipulatives**:
  - **Rectangular Pan Partitioning**: Accordion divider cuts partition brownie baking pans or sheet cakes horizontally into 2, 3, or 4 equal rectangular bands.
  - **Circular Tart Partitioning**: Radial spoke dividers partition personal pizzas or berry fruit tarts into 2, 3, or 4 equal angular wedges with modulo $360^\circ$ angular wrap-around.
- **Dual-Mode Input Model**:
  - **Continuous Drag Manipulation**: Students drag cutter handles across the shape with real-time coordinate projection.
  - **Single-Tap Cutter Badges**: Prominent buttons (`[2 Halves ◫]`, `[3 Thirds ▥]`, `[4 Fourths ⊞]`) provide motor-accessible single-tap partitioning for classroom Chromebook trackpads and assistive inputs.
- **Socratic Scaffolding Ladder (Pencil Pal)**:
  - Powered by `MascotCompanion` and `useGeometryScaffolding`, providing an escalating 3-tier hint ladder:
    1. _Tier 1 (Socratic Verbal Prompt)_: Guided inquiry on unequal shares (_"Look at those pieces: one piece is small, and one piece is big! Equal halves must be the exact same size."_).
    2. _Tier 2 (Visual Ghost Guides)_: Dotted guide lines appear at the exact target split positions.
    3. _Tier 3 (Demonstrative Snap & Isomorphic Retry)_: Pencil Pal animates the correct partition cut, revokes seed star credit, and serves an isomorphic companion challenge (e.g., matching halves on an alternate shape).
- **Synchronized Audio Narration**:
  - Real-time word-by-word subtitle highlighting during Pencil Pal spoken prompts via Web Audio API synthesis and speech synthesis fallback (`src/lib/audio/audio-bus.ts`, `useAudioNarration`).

---

## Zero-Dependency Declarative Snapping Engine (`src/lib/drag/declarative-drag.ts`)

Rather than pulling in heavy third-party drag-and-drop frameworks that bundle Immer and D3 or conflict with React 19, the Geometry Lab introduces an internal, zero-dependency declarative pointer snapping engine:

- **Native Pointer Events**: Built on `PointerEvents` (`onPointerDown`, `onPointerMove`, `onPointerUp`) with `setPointerCapture` for rock-solid tracking beyond element bounds.
- **RequestAnimationFrame (RAF) Transforms**: Direct SVG transform updates bypass React reconciliation during raw pointer movements, maintaining a fluid 60 FPS without DOM re-renders.
- **SVG Coordinate Projection (`getSvgPoint`)**: Transforms window client coordinates to SVG viewBox coordinate space using `getScreenCTM()?.inverse()` with matrix transforms and bounding-box fallbacks for test DOM environments.
- **Schmitt-Trigger Magnetic Hysteresis**:
  - **Attraction Basin (Enter Snap)**: Handle snaps into magnetic target at $\pm 5\%$ distance (`DEFAULT_SNAP_THRESHOLD = 0.05`).
  - **Release Threshold (Exit Snap)**: Handle requires dragging past $\pm 10\%$ distance (`DEFAULT_RELEASE_THRESHOLD = 0.10`) to break free from the magnetic basin.
  - **Tremor Suppression**: Eliminates rapid jitter and fluttering caused by student finger tremor or low-precision laptop trackpads.
- **Dual Snapping Modes**:
  - `linear-horizontal`: Linear coordinate normalization $[0, 1]$ for rectangular pan dividers.
  - `radial`: Angular coordinate calculations $[0^\circ, 360^\circ)$ around an SVG center point for circular tart spokes.
- **Audio Debounce**: 250ms SFX cooldown (`SFX_COOLDOWN_MS = 250`) prevents acoustic spam during rapid boundary crossings.

---

## Headless Geometry Diagnostic Evaluator (`src/lib/math/geometry-evaluator.ts`)

Decoupled completely from React DOM, window, and SVG APIs, the evaluator executes pure numeric checks in $< 1\text{ms}$ under Node 26:

- **Rectangular Interval Partitioning**:
  - Sorted internal divider positions $c_1, \dots, c_{k-1} \in [0, 1]$.
  - Share intervals calculated as $s_0 = c_1$, $s_i = c_{i+1} - c_i$, $s_{k-1} = 1 - c_{k-1}$.
- **Circular Radial Partitioning**:
  - Sorted radial spoke angles $\theta_0, \dots, \theta_{k-1} \in [0, 360^\circ)$.
  - Share fractions calculated modulo 360: $s_i = (\theta_{i+1} - \theta_i) / 360$, with wrap-around $s_{k-1} = (360 - \theta_{k-1} + \theta_0) / 360$.
- **Tolerance & Status Resolution**:
  - Absolute tolerance bound: $|s_i - 1 / \text{targetShares}| \le 0.05$ (`GEOMETRY_TOLERANCE = 0.05`).
  - Deterministic status outcomes:
    - `correct`: All share fractions are within $\pm 5\%$ of equal partitions.
    - `unequal_shares`: Correct number of shares cut, but ratio variance exceeds tolerance threshold.
    - `wrong_share_count`: Number of cut pieces does not match problem specification.
    - `unpartitioned`: No dividers placed on the shape.
- **Developmentally Aligned Feedback**:
  - Returns verbal feedback strings adhering strictly to NC Grade 2 standards (_"Great job! You cut the brownies into 3 equal thirds!"_).

---

## Automated Invariant Test Matrix (35 Tests)

The test harness runs directly in Node 26 with native TypeScript stripping (`node --experimental-strip-types --test tests/invariants/*.test.ts`), executing 35 deterministic pedagogical invariants:

| Test Suite                     | Count  | Invariants Covered                                                                                                                                                                                                                                                                                                                             |
| :----------------------------- | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `curriculum.invariant.test.ts` |   9    | Problem seed bounds validation and evaluator compatibility across NC.2.OA.3, NC.2.OA.4, and NC.2.G.3 curricula. Catches invalid dimensions, token mismatches, illegal share counts ($< 2$ or $> 4$), and non-matching verbal names.                                                                                                            |
| `nc2-g.invariant.test.ts`      |   10   | Rectangular & circular equal share validation (halves, thirds, fourths), $360^\circ$ angular wrap-around, $\pm 5\%$ tolerance boundaries, unequal share diagnostics, wrong share counts, unpartitioned states, 200-seed adversarial cut fuzzing, canonical demonstrative cuts, isomorphic spec generation, and 3-tier scaffolding progression. |
| `nc2-oa3.invariant.test.ts`    |   8    | Parity evaluation, even pairs (`correct_even`), odd leftovers (`correct_odd`), unpaired slot gaps, empty mats, incomplete token inventory, right-column remainder layout, and 200-seed parity fuzzing.                                                                                                                                         |
| `nc2-oa4.invariant.test.ts`    |   8    | Rectangular array validation, $3 \times 4$ verification, orientation regressions ($4 \times 3 \neq 3 \times 4$), unequal rows, incomplete inventories, empty grids, square array ($3 \times 3$) orientation immunity, spatial contiguity/gap detection, and permutation oracles.                                                               |
| **Total Invariant Tests**      | **35** | **100% Pass Rate**                                                                                                                                                                                                                                                                                                                             |

---

## Pre-Commit Latency & Release Gates

The project enforces high code quality and zero regressions through automated release gates:

- **Pre-Commit Latency (< 150ms)**:
  - Enforced locally via `.githooks/pre-commit`.
  - Pedagogical and geometric invariants are pure numeric functions executing in $< 40\text{ms}$ total test execution time.
- **Universal Release Gate Command (`npm run check`)**:
  - Executes `npm test && npm run build`.
  - Confirms 100% invariant test passes (35/35).
  - Confirms 0 TypeScript diagnostics (`tsc -b`).
  - Confirms 0 Vite build warnings (`vite build`).

```bash
# Run invariant tests (< 150ms execution time)
npm test

# Run full release gate verification (tests + typecheck + production build)
npm run check

# Fast linting via Oxlint
npm run lint

# Start local development server
npm run dev
```

---

## Subdirectories & System Boundaries

- `src`: [./src/README.md](./src/README.md) - Application source tree enclosing the React DOM mount, demo showcase shell, custom React hooks, UI primitives, math manipulatives (`src/components/math`), headless diagnostic evaluators (`src/lib/math`), and audio synthesizer (`src/lib/audio`).
- `src/lib/drag`: Declarative pointer drag and snapping engine (`declarative-drag.ts`).
- `src/lib/math`: Headless mathematical diagnostic evaluators (`geometry-evaluator.ts`, `evaluator.ts`).
- `src/components/math`: Interactive tactile math wireframes (`NC2GWireframe.tsx`, `NC2OA4Wireframe.tsx`, `NC2OA3Wireframe.tsx`).
- `src/curriculum`: Curriculum items, specifications, and seed validators (`nc2-g.ts`, `items.ts`, `invariants.ts`).
- `tests/invariants`: Node 26 native test harness containing deterministic pedagogical invariant test suites (`*.test.ts`).
- `.githooks`: Git pre-commit hook executing invariant tests locally before code is committed.
- `.github/workflows`: GitHub Actions CI workflow running the invariant suite on every push and pull request.

---

## Global Invariants

- Path alias `@/*` strictly resolves to `./src/*` across all build targets, test suites, and typecheckers. [vite.config.ts:resolve.alias] [tsconfig.app.json:compilerOptions.paths]
- Mathematical and pedagogical evaluators remain pure, headless functions decoupled from the DOM to enable sub-millisecond invariant testing. [src/lib/math/evaluator.ts] [src/lib/math/geometry-evaluator.ts]
- Invariant test suite must execute in $< 150\text{ms}$ to maintain zero-friction git commit ergonomics. [package.json:scripts.test] [.githooks/pre-commit]
- Full standard coverage for NC Grade 2 math (`NC.2.OA.4`, `NC.2.OA.3`, `NC.2.G.3`) with zero abstract fraction numerals ($\frac{a}{b}$) in UI or spoken dialogue.
- Component rendering requires an enclosing `<InkProvider>` context to supply global SVG filter definitions, noise textures, and density settings. [src/main.tsx:InkProvider] [src/lib/ink/react/provider.tsx:InkProvider]
- Procedural ink shaders and shapes produce deterministic vector paths when supplied with identical seeds. [src/lib/ink/rng.ts:createRng]
- Chart layout limits series datasets to a maximum of 240 bars and 1500 points using Largest-Triangle-Three-Buckets (LTTB) downsampling to safeguard browser rendering performance. [src/lib/ink/charts/chart-build.ts:MAX_BARS] [src/lib/ink/charts/chart-scale.ts:lttb]

---

## Global Side Effects

- Mounts virtual DOM tree directly to the host document element with id `#root`. [src/main.tsx:createRoot]
- Injects global SVG `<defs>` filter chains and paper textures dynamically into `document.body` or `document.head` when required by ink components. [src/lib/ink/react/defs.tsx:ensureInkDefs] [src/lib/ink/paper/defs.tsx:ensurePaperDefs]
- Registers document-level event listeners for reduced motion queries, mobile viewport resizes, and form reset bubbling. [src/hooks/use-live-motion.ts:useReducedMotion] [src/hooks/use-mobile.ts:useIsMobile] [src/hooks/use-form-reset.ts:useFormReset]
- Stores local learner preferences and standard progress in browser `localStorage` (`egm_active_standard`, `egm_desk_theme`, `egm_student_profile`) with 0 network telemetry.

---

## System Verification

- Run: `npm run check`
