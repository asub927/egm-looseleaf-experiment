# Stage 7 Critic Review Report

- **Target Document:** [docs/designs/modern-web-guidance-migration.md](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/modern-web-guidance-migration.md)
- **Scope Evaluated:** `FeatureRange` (Lines 1–245: Overview, The Problem, Proposed Solution, Goals, Non-Goals, Technical Plan & Architecture by Track, Zero-PII Observability, Alternatives Considered)
- **Reviewer Personas:**
  - `egm-design` (Hostile Design Critic)
  - `egm-structural` (Structural Layout Validator & Document Architect)
  - `egm-style` (Technical Copy Editor)
- **Target Standard:** `feature-spec-standard`

---

## Executive Summary

Stage 7 evaluated the conceptual and feature architectural foundation (Lines 1–245) across three distinct lenses: system feasibility and edge cases (`egm-design`), structural layout and cross-track symmetry (`egm-structural`), and editorial rigor and terminology (`egm-style`).

The reviewers identified **27 total findings** across the 6 tracks, with critical consensus centered on:

1. **Track 6 (Prompt API / Gemini Nano) Classroom Hardware Infeasibility:** 4 GB Celeron Chromebooks cannot reliably allocate or execute local on-device models, an 800 ms timeout guarantees aborts on cold starts, and regexes fail to catch Unicode vulgar fractions (`½`, `¼`) required by early math standards.
2. **Track 5 (CSS Anchor Positioning) Conflict with Radix UI:** Radix UI sets dynamic inline `transform` styles via Floating UI, conflicting with CSS Anchor Positioning. In addition, the spec uses invalid syntax `position-anchor: var(--desk-anchor)`.
3. **Track 3 (`scheduler.yield()`) Fallback Contradiction:** Falling back to `Promise.resolve()` queues a microtask that does not yield to the browser's render/paint loop. Furthermore, the procedural ink cache does not currently run background pre-warming.
4. **Structural & Parity Gaps:** Track 4 is missing from `## The Problem` and `## Non-Goals`, and `## Alternatives Considered` scrambles track order and injects meta-workflow options into the platform architecture matrix.
5. **Marketing Language & Promotional Adjectives:** 14 instances of promotional fluff ("seamless", "robust", "flawless", "delightful") requiring pruning to maintain objective technical tone.

---

## 1. High-Severity & Architectural Findings (`egm-design`)

### Finding D-1: Hardware Infeasibility & Out-of-Memory Risk on Classroom Chromebooks (Track 6)

- **Location:** Line 24, Lines 203–220
- **Issue:** The document targets standard K-2 classroom hardware (e.g., Lenovo 300e / 100e Chromebooks with Intel Celeron or MediaTek processors, 4 GB RAM, 32 GB eMMC, ChromeOS LTS). The Chrome Prompt API (`window.ai.languageModel`) requires Google Gemini Nano, downloading a ~1.5 GB to 2.5 GB model payload and consuming over 1.8 GB of resident GPU/system memory. On 4 GB devices, this triggers out-of-memory tab crashes, extreme disk paging, or outright capability check rejections (`"no"` or `"after-download"` blocked by disk quotas).
- **Recommendation:**
  - Explicitly restrict Track 6 to hardware with at least 8 GB RAM and dedicated NPU/GPU support.
  - Require a persistent hard gate checking available device memory (`navigator.deviceMemory >= 8`) and storage quota before invoking `ai.languageModel.capabilities()`.
  - Designate Track 6 as strictly experimental/opt-in rather than baseline curriculum infrastructure.

### Finding D-2: 800 ms Socratic Timeout Guarantees Cold-Start Failure (Track 6)

- **Location:** Line 58, Line 213
- **Issue:** An `AbortSignal.timeout(800)` is hard-coded for hint generation. Even on high-end desktop hardware, Gemini Nano time-to-first-token (TTFT) typically ranges between 1,200 ms and 2,800 ms on initial session creation. On target Celeron/ARM hardware, an 800 ms timeout guarantees 100% abort rates, thrashing CPU resources while generating zero usable hints.
- **Recommendation:**
  - Increase the timeout to 3,500 ms for initial inference.
  - Implement a pre-warmed singleton session (`ai.languageModel.create()`) initialized during idle periods, while retaining static fallback hints if inference exceeds 2,000 ms.

### Finding D-3: Gesture-Only Cancellation Causes State Machine Desynchronization (Track 6)

- **Location:** Line 216
- **Issue:** The document specifies: `"Streaming token abort on user manipulative interaction: AbortController.abort() fires immediately on any desk gesture"`. This leaves a major desync vulnerability: if a student interacts via keyboard navigation (Enter/Space), screen reader, or virtual keypad, the abort controller does not fire. An in-flight query can resolve seconds later and overwrite a new problem state with an outdated hint.
- **Recommendation:**
  - Tie the `AbortController` to a state machine epoch or problem ID counter (`boardEpoch`).
  - Abort in-flight requests on **any** state change (keyboard, pointer, voice, or problem progression), discarding any response whose generation token does not match the active `boardEpoch`.

### Finding D-4: Fraction Numeral Leaks and NC.2.G.3 Compliance Violation (Track 6)

- **Location:** Line 58, Line 211
- **Issue:** To prevent the model from spoiling direct numerical answers, the regex `const FRACTION_REGEX = /\b\d+\/\d+\b/;` is used. This regex fails to catch:
  1. Unicode vulgar fractions (`½`, `⅓`, `¼`, `¾`, `⅐`, etc.).
  2. Spaced fractions (e.g., `1 / 2`, `3 / 4`).
  3. Word-form answers (e.g., `"half"`, `"one fourth"`, `"quarter"`).
- **Recommendation:**
  - Expand the validation filter to reject Unicode fractions (`/[\u00BC-\u00BE\u2150-\u215E]/`), spaced digit fractions (`/\b\d+\s*\/\s*\d+\b/`), and standard elementary fraction word terms.

### Finding D-5: Layout Collision Between Radix UI Floating UI and CSS Anchor Positioning (Track 5)

- **Location:** Lines 185–201
- **Issue:** `src/components/ui/popover.tsx` and `src/components/ui/tooltip.tsx` wrap Radix UI (`@radix-ui/react-popover` and `@radix-ui/react-tooltip`). Radix delegates positioning to Floating UI, which computes coordinates on scroll/resize and injects inline styles (`transform: translate3d(...)` or `top`/`left`). Injecting `position-anchor` and `top: anchor(...)` causes layout conflicts and visual stutter between browser layout passes and Radix inline overrides.
- **Recommendation:**
  - Explicitly specify that CSS Anchor Positioning bypasses Radix UI's Floating UI engine by passing `forceMount` and disabling Radix's internal positioning wrapper, OR implement Anchor Positioning exclusively on lightweight native popovers (`popover="auto"`).

### Finding D-6: Invalid CSS Anchor Syntax (`var(--desk-anchor)`)

- **Location:** Line 194
- **Issue:** The code snippet specifies `position-anchor: var(--desk-anchor);`. The CSS Anchor Positioning specification (`CSS Anchor Positioning Level 1`) dictates that `position-anchor` takes a dashed-ident (`--desk-anchor`), not a CSS variable substitution (`var(...)`).
- **Recommendation:**
  - Correct the CSS rule to: `position-anchor: --desk-anchor;`.

### Finding D-7: Microtask Fallback Contradiction for `scheduler.yield()` (Track 3)

- **Location:** Line 172, Line 238
- **Issue:** The document states: `"Yield to paint every 8ms... fallback: Promise.resolve()"`. Microtasks (`Promise.resolve()`) drain before the browser yields control to paint or render. A `Promise.resolve()` loop will block the main thread and freeze rendering identically to synchronous execution. Furthermore, `setTimeout(0)` clamps to 4 ms in nested loops.
- **Recommendation:**
  - Use `MessageChannel` (`port.postMessage()`) or `requestAnimationFrame` as the fallback mechanism when `scheduler.yield()` is unavailable.

### Finding D-8: Phantom Pre-warming Loop in Ink Generation (Track 3)

- **Location:** Line 38, Line 159
- **Issue:** The problem statement claims `src/lib/ink/react/cache.ts` contends with main-thread input during ink generation. However, in the existing codebase, ink rendering is purely synchronous and executed on-demand inside React `useMemo` hooks. There is no existing background pre-warming loop.
- **Recommendation:**
  - Frame Track 3 as introducing cooperative chunking for ink path calculations and heavy math manipulative layout, rather than claiming to refactor an existing pre-warming loop.

---

## 2. Structural & Layout Findings (`egm-structural`)

### Finding S-1 (Major): Omission of Track 4 in Problem Section & Index Misalignment

- **Location:** Lines 30–47 (`## The Problem`)
- **Issue:** `## The Problem` defines only 5 subsections for a 6-track proposal. Track 4 (`Modern Typography & CSS Motion`) is completely missing, leaving `text-wrap: balance` and `text-wrap: pretty` without an explicit problem statement. Subsections 4 and 5 correspond to Tracks 6 and 5, breaking 1:1 numbering parity with the tracks.
- **Recommendation:**
  - Add `### 4. Early-Literacy Typographic Deficiencies and Subtitle Layout Shifts`.
  - Renumber sequentially to match Tracks 1 through 6.

### Finding S-2 (Major): Scrambled Ordering and Domain Mixing in Alternatives Considered

- **Location:** Lines 230–243 (`## Alternatives Considered`)
- **Issue:** The alternatives table scrambles the track sequence (`Track 6 -> 5 -> 3 -> 1 -> 2 -> 4 -> Agent Swarm Coordination`). Additionally, row 7 injects an agent workflow decision ("Agent Swarm Coordination (Option B)") into an architectural browser platform matrix.
- **Recommendation:**
  - Re-sort rows 1 through 6 in canonical numerical order with explicit track prefixes.
  - Move the meta-process agent workflow trade-off into a dedicated section or note.

### Finding S-3 (Nit): Omission of Track 4 Boundary in Non-Goals

- **Location:** Lines 75–83 (`## Non-Goals`)
- **Issue:** Goals 1–6 map to Tracks 1–6, but `## Non-Goals` only covers Tracks 1, 2, 3, 5, and 6. Track 4 has no defined negative boundary.
- **Recommendation:**
  - Add: `- **No Dynamic Line Balancing During Narration Playback**: text-wrap: balance will not be applied to dynamic speech bubbles or word-by-word highlighted subtitles to avoid layout thrashing.`

### Finding S-4 (Nit): Singular vs. Plural Metadata Label Asymmetry

- **Location:** Line 143 vs Lines 152, 160, 179, 186, 204
- **Issue:** Line 143 uses singular `- **Module**:`, whereas all other tracks use plural `- **Modules**:`.
- **Recommendation:** Update Line 143 to `- **Modules**:`.

### Finding S-5 (Nit): Typo in Prompt API Capability Check Property

- **Location:** Line 58
- **Issue:** Line 58 specifies `capabilities().readily === "readily"`, whereas the standard Prompt API property is `capabilities().available === "readily"`.
- **Recommendation:** Change property check to `capabilities().available === "readily"`.

---

## 3. Style, Tone & Editorial Findings (`egm-style`)

### Finding ST-1: Promotional Adjectives and Adverbs

- **Locations:** Lines 15, 19, 53, 54, 57, 104, 144, 187
- **Instances:**
  - Line 15: `"delightful"` $\rightarrow$ Replace with `"responsive and accessible"`.
  - Line 19 & 53: `"seamless same-document transitions"` $\rightarrow$ Replace with `"continuous document transitions"`.
  - Line 54 & 153: `"perfect proportionality"` $\rightarrow$ Replace with `"constant aspect ratio"`.
  - Line 57: `"flawlessly anchored"` $\rightarrow$ Replace with `"declaratively aligned"`.
  - Line 104: `"silky-smooth"` $\rightarrow$ Replace with `"sub-16ms frame budget"`.
  - Line 187: `"effortlessly positioned"` $\rightarrow$ Replace with `"natively positioned"`.

### Finding ST-2: Unescaped Slash Delimiters in Text Regex

- **Location:** Line 58
- **Issue:** Regex written as `(\b\d+\/\d+\b/)` with mismatched delimiters.
- **Recommendation:** Format as inline code: `/\b\d+\/\d+\b/`.

---

## Consolidated Action Plan for Resolution

| ID        | Finding Summary                                               | Primary Owner         | Proposed Resolution                                                                                           |
| :-------- | :------------------------------------------------------------ | :-------------------- | :------------------------------------------------------------------------------------------------------------ |
| **ACT-1** | Track 6 Hardware Gate & Quota Verification                    | Architecture / Design | Restrict to 8 GB+ RAM; gate behind `navigator.deviceMemory >= 8`; mark Track 6 as experimental.               |
| **ACT-2** | Track 6 TTFT Timeout & State Epoch Abort                      | Design / Systems      | Increase inference timeout to 3,500 ms; bind abort controller to `boardEpoch` across all input modalities.    |
| **ACT-3** | Vulgar & Spaced Fraction Regex Expansion                      | Pedagogy / Math       | Expand regex to cover Unicode fractions (`½`, `¼`) and spaced patterns (`1 / 2`).                             |
| **ACT-4** | Radix Floating UI vs. Anchor Collision & Syntax Fix           | Frontend / CSS        | Fix syntax to `position-anchor: --desk-anchor;`; document bypass or native popover migration for Radix.       |
| **ACT-5** | `scheduler.yield()` Fallback to `MessageChannel`              | Concurrency / Core    | Replace `Promise.resolve()` fallback with `MessageChannel` to ensure real yield to browser paint.             |
| **ACT-6** | Fix Structural Symmetry in Problem, Non-Goals, & Alternatives | Layout / Docs         | Add Track 4 problem statement; add Track 4 non-goal; re-sort alternatives 1–6 and extract swarm meta-process. |
| **ACT-7** | Strip Promotional Language                                    | Copy Editing          | Replace fluff words ("seamless", "flawlessly", "delightful") with objective technical descriptions.           |
