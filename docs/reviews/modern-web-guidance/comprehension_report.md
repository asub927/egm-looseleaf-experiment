# Stage 6: Comprehension Test Audit Report

**Target Document:** [/Users/aaranvi/dev/elephant-goldfish/docs/designs/modern-web-guidance-migration.md](file:///Users/aaranvi/dev/elephant-goldfish/docs/designs/modern-web-guidance-migration.md)  
**Evaluator:** Comprehension Goldfish (Naive Reader Persona)  
**Scope:** Feature Spec (Lines 1–245) & Detailed Implementation Plan (Lines 246–361)

---

## Feature Spec Paraphrase

### What this proposes

This technical design proposes a 6-track modernization program to upgrade Elephant Goldfish—an offline-first, Grade 2 North Carolina mathematics web application—using native Chromium platform capabilities on low-spec classroom Chromebooks. The six tracks introduce:

1. Same-document View Transitions (`document.startViewTransition` with `ReactDOM.flushSync`) for fluid standard switching in `src/App.tsx`.
2. CSS Container Queries (`@container (inline-size)`) with locked internal SVG aspect ratios for responsive math manipulatives (`BakingPan`, `TartPlate`, `PairingMat`).
3. Cooperative task yielding (`scheduler.yield()`) to prevent main-thread input lag during procedural ink pre-warming.
4. CSS text wrapping (`text-wrap: balance` for titles and `text-wrap: pretty` for dialogue) to eliminate orphan words.
5. Progressive CSS Anchor Positioning for popovers and tooltips while retaining Radix UI keyboard and screen-reader accessibility.
6. An optional, on-device Socratic AI tutor via Chrome's Built-in Prompt API (`window.ai`), protected by an 800ms timeout, gesture cancellation, and a strict fraction-numeral regex rejection filter.

The proposal guarantees client-side privacy, zero network telemetry, full COPPA compliance, deterministic numeric truth, and a 100% pass rate across 43 pedagogical invariants.

### How the existing system works, per this document

The current system runs on React 19, TypeScript, Vite, Tailwind CSS v4, and Radix UI with a procedural ink engine (Looseleaf) across three curriculum standards (`NC.2.OA.4` Arrays, `NC.2.OA.3` Parity, and `NC.2.G.3` Geometry). In the existing shell, switching standards unmounts and remounts wireframes in a single render tick, causing visual disorientation for young learners. Manipulatives rely on viewport-level breakpoints that clip or distort on $1366 \times 768$ Chromebooks or split-window displays. The procedural ink engine computes chalk strokes and SVG filters synchronously on the main thread, causing drag lag (INP spikes) on dual-core Celeron/ARM hardware. UI overlays rely on JavaScript positioning calculations via Radix/Floating UI, and the mascot tutor (Pencil Pal) is restricted to a rigid, deterministic 3-tier static hint string ladder without multi-lingual or adaptive phrasing.

---

## Detailed Implementation Plan Paraphrase

### What this proposes

The implementation plan schedules the migration into four sequential, file-partitioned work packages (WP0 through Phase 3) modifying or creating 18 targeted files without modifying pure math evaluators:

- **WP0 (Prerequisites):** Establishes ambient type declarations (`src/types/modern-web.d.ts`) compatible with `erasableSyntaxOnly` and `verbatimModuleSyntax`, and injects HappyDOM polyfills for view transitions and popovers in `tests/setup.ts`.
- **Phase 1 (Layout & Typography):** Applies container queries with locked SVG coordinate matrices to `BakingPan`, `TartPlate`, and `PairingMat`, and applies `text-balance` and `text-pretty` across wireframes and mascot speech bubbles.
- **Phase 2 (Navigation & Overlays):** Integrates `useDeskViewTransition` in `src/App.tsx` and declares progressive `@supports (position-anchor)` CSS rules for Radix popovers and tooltips.
- **Phase 3 (Concurrency, AI & Observability):** Implements `yieldToMain()` inside procedural ink cache loops, connects the `SocraticLlmBridge` with pointer gesture aborts, and introduces a local, zero-PII 100-entry in-memory `DiagnosticLogger`.

### How verification and fallback work, per this document

The rollout is governed by five automated verification gates: 43 pure mathematical invariant tests executed in Node 26 in $< 150\text{ms}$, Oxlint static analysis (0 errors/warnings), TypeScript type checking, a Vite 8 production build, and an aggregated `npm run check`. Each modernization track includes a strict runtime kill-switch: view transitions bypass to synchronous state updates on reduced motion or unsupported browsers; container queries default to 600px width; task yielding falls back to immediate promise resolution; anchor positioning falls back to Radix floating translations; and the Socratic bridge immediately falls back to deterministic static hints if `window.ai` is absent, takes $> 800\text{ms}$, is aborted by a gesture, or emits fraction numerals.

---

## Findings & Comprehension Discrepancies

### 🔴 Blocker Findings

#### 1. Contradictory Fallback Behavior in `yieldToMain()` Specification

- **Severity:** Blocker
- **Affected Scope:** Lines 104, 164–173, 238, 262, and 359.
- **Discrepancy Description & Rationale:**
  The document provides conflicting definitions of how `yieldToMain()` behaves when `scheduler.yield()` is unavailable:
  - In line 104 and line 262, the architecture states it uses a **"microtask fallback"**.
  - In line 172, the reference implementation returns a **macrotask timer**: `return new Promise((resolve) => setTimeout(resolve, 0));`.
  - In line 359, the runtime kill-switch states: "If `scheduler.yield` is absent, `yieldToMain()` resolves immediately as a **no-op Promise (`Promise.resolve()`)**."
  - In line 238, the rationale warns: "Microtask yielding delays also breach the $< 150\text{ms}$ pre-commit execution gate."

  These mechanisms have completely different runtime execution characteristics. `Promise.resolve()` (a microtask) does **not** yield to the browser's rendering or event loop at all—it continues executing on the current tick before paint, failing to prevent INP spikes. Conversely, `setTimeout(..., 0)` queues a macrotask on the browser event loop with a minimum timer clamp (typically 4ms in nested contexts), introducing latency. A new engineer implementing `src/lib/utils/scheduler.ts` cannot determine which fallback contract to follow.

#### 2. Inconsistent Capability Check Signatures for `window.ai`

- **Severity:** Blocker
- **Affected Scope:** Lines 58, 207, and 361.
- **Discrepancy Description & Rationale:**
  The document specifies three incompatible API property access paths for verifying the Chrome Built-in Prompt API:
  - Line 58 states: `capabilities().readily === "readily"`
  - Line 207 states: `window.ai?.languageModel?.capabilities() ... status is not "readily"`
  - Line 361 states: `capabilities().available !== 'readily'`

  In the evolving Chrome Prompt API spec, `.available` vs `.readily` vs `.status` reflect differing draft versions. A developer implementing `src/lib/ai/prompt-api.ts` and `src/types/modern-web.d.ts` cannot construct the correct TypeScript interface or runtime check without guessing which property exists.

#### 3. Broken CSS Anchor Positioning Syntax and Missing Anchor Name Declaration

- **Severity:** Blocker
- **Affected Scope:** Lines 191–199, 266, and 308.
- **Discrepancy Description & Rationale:**
  Line 194 defines:

  ```css
  position-anchor: var(--desk-anchor);
  ```

  In the CSS Anchor Positioning specification (Chrome 125+ / 128+), `position-anchor` expects a `<dashed-ident>` directly (e.g., `position-anchor: --desk-anchor;`), **not** a CSS custom property dereferenced via `var()`.

  Furthermore, the document never declares where `anchor-name: --desk-anchor` is assigned. An anchor position rule cannot function without a corresponding trigger element exposing `anchor-name: --desk-anchor`. Additionally, Radix UI popovers calculate positioning dynamically by applying inline `style` transformations (`transform: translate3d(...)`) via Floating UI. The document fails to explain how `@supports (position-anchor: ...)` overrides or deactivates Radix's inline JavaScript positioning without conflicting.

---

### 🟡 Major Findings

#### 4. Unexplained Domain Jargon: "Schmitt-Trigger Hysteresis"

- **Severity:** Major
- **Affected Scope:** Lines 65, 157, and 240.
- **Discrepancy Description & Rationale:**
  The document references a "Schmitt-trigger snapping engine" with thresholds of "$\pm 5\%$ attraction, $\pm 10\%$ release" (line 157) and "$\pm 5\%$ enter, $\pm 10\%$ release" (line 240). To a frontend developer or fresh team member, "Schmitt trigger" is an unexplained electrical engineering term. The document should explain inline that this refers to **dual-threshold hysteresis**—where entering a snap target requires moving within 5% distance, but releasing/detaching requires moving outside 10% distance—which prevents rapid pointer snapping flicker when hovering near drag boundaries.

#### 5. Unexplained Acronym: "CTM" (`getScreenCTM`)

- **Severity:** Major
- **Affected Scope:** Lines 157 and 240.
- **Discrepancy Description & Rationale:**
  The document references `svg.getScreenCTM()?.inverse()` without defining "CTM". A naive reader unfamiliar with the SVG DOM standard will not recognize that CTM stands for **Current Transformation Matrix**, which transforms screen coordinate points `(clientX, clientY)` into internal SVG user space. A brief definition is needed.

#### 6. Unexplained Compiler and Test Harness Terminology: `erasableSyntaxOnly`, `verbatimModuleSyntax`, `HappyDOM`, and "Node 26"

- **Severity:** Major
- **Affected Scope:** Lines 70, 120, 121, 237, 238, 254, 255, 284, 335, and 342.
- **Discrepancy Description & Rationale:**
  - `erasableSyntaxOnly` and `verbatimModuleSyntax` (lines 254, 284, 342) are cited as strict type-checking gates, but their meaning is never explained. The document must define that these TypeScript flags enforce type-only imports and disallow non-erasable runtime constructs (such as TypeScript `enum`s or namespaces) to ensure code can run directly under Node's native type-stripping runner.
  - `HappyDOM` (lines 121, 237, 255) is mentioned without explaining that it is Vitest's lightweight in-memory DOM simulation environment, or why it requires custom polyfills for `document.startViewTransition` and `showPopover`.
  - "Node 26" is cited as the test execution runtime (`node --experimental-strip-types`, line 335). In standard current environments, Node 26 represents the current experimental/nightly LTS baseline in this repository. Clarifying the runtime baseline avoids developer confusion.

#### 7. Unexplained Legal Acronym: "COPPA" & Inconsistent "INP" Latency Target

- **Severity:** Major
- **Affected Scope:** Lines 26, 39, 58, 66, 69, 203, 223, and 263.
- **Discrepancy Description & Rationale:**
  - COPPA is used repeatedly as the primary regulatory justification for zero telemetry and local-only AI, but the acronym is never expanded (Children's Online Privacy Protection Act) nor is its rule defined (prohibiting online collection of personal data from children under age 13 without verifiable parental consent).
  - Line 263 states: "keep INP under 16ms". Interaction to Next Paint (INP) is a Core Web Vital whose industry "good" threshold is $\le 200\text{ms}$. $16.6\text{ms}$ is the budget for a single 60 FPS animation frame ($1000\text{ms} / 60$). Conflating frame render budget with INP creates an ambiguous mental model for developers monitoring performance metrics.

#### 8. Missing Pedagogical Rationale for Banning Fraction Numerals

- **Severity:** Major
- **Affected Scope:** Lines 58, 69, 212, 236, 268, and 361.
- **Discrepancy Description & Rationale:**
  The document mandates a regex filter rejecting any prompt response with fraction numerals (`\b\d+\/\d+\b`). While line 236 notes that this "violates North Carolina Grade 2 curriculum standards", it does not explain _why_. In Grade 2 standards (`NC.2.G.3`), students learn the concept of equal sharing using concrete vocabulary ("halves", "thirds", "fourths", "half of"), while abstract fractional notation (such as $\frac{1}{2}$ or $\frac{2}{3}$) is strictly prohibited until Grade 3 to prevent premature symbolic confusion. Adding this 1-sentence pedagogical rationale prevents developers from assuming this rule is arbitrary.

#### 9. Undefined Origin of "nano" in Diagnostic Logging

- **Severity:** Major
- **Affected Scope:** Lines 225, 226, and 323.
- **Discrepancy Description & Rationale:**
  Line 225 logs `status: "nano_active"`, and lines 226/323 set DOM attributes `data-ai-engine="nano"|"fallback"`. The term "nano" is never introduced or defined in the document. The document should clarify that Chrome's on-device Prompt API is executed locally by Google's **Gemini Nano** model, explaining why the diagnostic logger tags active inference as `"nano"`.

---

### 🟢 Nit Findings

#### 10. Orphaned Draft Artifact: "Agent Swarm Coordination (Option B)"

- **Severity:** Nit
- **Affected Scope:** Line 242 (Table: Alternatives Considered).
- **Discrepancy Description & Rationale:**
  Line 242 evaluates "Agent Swarm Coordination (Option B)" against uncoordinated worker agents. Nowhere else in the design document is an "Option A" or "Option B" mentioned. This appears to be an orphaned label from a previous planning discussion and should be renamed to "Phased Work Package Sequencing".

#### 11. Inconsistent Schmitt-Trigger Threshold Terminology

- **Severity:** Nit
- **Affected Scope:** Lines 157 vs 240.
- **Discrepancy Description & Rationale:**
  Line 157 describes the threshold as "($\pm 5\%$ attraction, $\pm 10\%$ release)", whereas line 240 describes it as "($\pm 5\%$ enter, $\pm 10\%$ release)". Standardizing on "enter / release" or "attraction / release" throughout the text will eliminate minor ambiguity.

#### 12. Omission of Socratic Prompt Engineering Template

- **Severity:** Nit
- **Affected Scope:** Lines 206–208 and 318.
- **Discrepancy Description & Rationale:**
  While the document specifies the input diagnostic codes (`unequal_shares`, `wrong_share_count`), it omits the actual prompt string or system instructions passed into `session.prompt()`. Including an explicit template demonstrates how the prompt steers the model toward Socratic questioning and away from giving direct answers or fraction numerals.

#### 13. Unstated Benchmark Basis for Invariant Execution Gates

- **Severity:** Nit
- **Affected Scope:** Lines 70, 238, 272, and 333.
- **Discrepancy Description & Rationale:**
  The document specifies a strict $< 150\text{ms}$ gate for the 43 tests and $< 50\text{ms}$ for `nc2-g.invariant.test.ts`, but does not explain how these thresholds were calibrated or whether they are enforced via a test runner timeout or CI script.
