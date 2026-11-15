# Hooks

## Overview

A collection of React hooks and utilities supporting responsive viewport detection, form reset coordination, accessible animation and reduced motion preferences, paper decoration and tilt styling, and text ink marking with DOM rect measurement.

## Interface

- `useSocraticScaffolding(config: ScaffoldingConfig): SocraticScaffoldingReturn`: Headless 3-tier progressive hint ladder finite state machine for NC.2.OA.3 and NC.2.OA.4. [src/hooks/use-socratic-scaffolding.ts:useSocraticScaffolding]
- `useArrayScaffolding(config: Omit<ArrayScaffoldingConfig, "type">)`: Specialized array scaffolding hook with automatic type narrowing for ArrayDiagnostic. [src/hooks/use-socratic-scaffolding.ts:useArrayScaffolding]
- `useParityScaffolding(config: Omit<ParityScaffoldingConfig, "type">)`: Specialized parity scaffolding hook with automatic type narrowing for ParityDiagnostic. [src/hooks/use-socratic-scaffolding.ts:useParityScaffolding]
- `useAudioNarration(options?: UseAudioNarrationOptions): UseAudioNarrationReturn`: React hook synchronizing mascot speech state with speech synthesis playback, supporting subtitle words and active speaking state. [src/hooks/use-audio-narration.ts:useAudioNarration]
- `useFormReset(getElement: () => Element | null | undefined, onReset: () => void): void`: Coordinates form reset events across containing or associated HTML form elements. [src/hooks/use-form-reset.ts:useFormReset]
- `motionIsOff(el?: Element | null, providerReduced?: boolean): boolean`: Utility resolving whether motion is reduced based on provider state, ancestor `data-motion` attributes, `--ll-motion` CSS variables, or system media query. [src/hooks/use-live-motion.ts:motionIsOff]
- `useReducedMotion(ref?: React.RefObject<Element | null>): boolean`: React hook returning whether reduced motion is active, observing DOM mutations and media query changes. [src/hooks/use-live-motion.ts:useReducedMotion]
- `useIsMobile(): boolean`: React hook returning a boolean indicating whether the window viewport is below the 768px mobile breakpoint. [src/hooks/use-mobile.ts:useIsMobile]
- `usePaperDecor<P>(options: PaperObjectOptions<P>)`: Generates paper decoration ink nodes, deterministic seed-based tilt angles, and container styling attributes. [src/hooks/use-paper-object.ts:usePaperDecor]
- `useShapedSheet<P>(options: Omit<PaperObjectOptions<P>, "enabled" | "kind"> & { kind?: string; still?: boolean })`: Generates shaped sheet ink faces, root container styling, and tilt angles. [src/hooks/use-paper-object.ts:useShapedSheet]
- `useMarkInk<P extends LineParams>(o: UseMarkInkOptions<P>): UseMarkInkResult`: Measures element line rects and font ratios to render animated or static ink marking SVGs matching text layout. [src/hooks/use-mark-ink.tsx:useMarkInk]
- `useMarkPhase(o: { animate?: boolean; show?: boolean }): MarkPhaseState`: Tracks viewport intersection and animation readiness state transitions ("idle", "in", "off"). [src/hooks/use-mark-ink.tsx:useMarkPhase]
- `mergeLineRects(list: readonly RectLike[]): RectLike[]`: Merges contiguous or overlapping bounding client rectangles belonging to the same text line. [src/hooks/use-mark-ink.tsx:mergeLineRects]
- `BlockSvg({ kind, frame, keep }: { kind: string; frame: Frame; keep?: boolean }): JSX.Element`: Renders an absolute SVG overlay for block-level ink frames. [src/hooks/use-mark-ink.tsx:BlockSvg]
- `MARK_WIPE`: Tailwind CSS utility class string for clip-path wipe animation transitions. [src/hooks/use-mark-ink.tsx:MARK_WIPE]
- `MARK_REVEAL`: Tailwind CSS utility class string for stroke dash-offset draw animation transitions. [src/hooks/use-mark-ink.tsx:MARK_REVEAL]
- `MAX_MARK_LINES`: Numeric threshold cap (60) restricting maximum client rect line segments measured per element. [src/hooks/use-mark-ink.tsx:MAX_MARK_LINES]
- `MarkPhase`: Type union representing animation lifecycle phase (`"idle" | "in" | "off"`). [src/hooks/use-mark-ink.tsx:MarkPhase]
- `MarkRect`: Interface defining quantized rectangle coordinates `{ x: number; y: number; w: number; h: number }`. [src/hooks/use-mark-ink.tsx:MarkRect]
- `UseMarkInkOptions<P>`: Configuration interface for ink recipe options, rendering modes, animation delays, and seeds. [src/hooks/use-mark-ink.tsx:UseMarkInkOptions]
- `UseMarkInkResult`: Return interface containing ref callbacks, DOM host attributes, ink nodes, lifecycle phase, and readiness flag. [src/hooks/use-mark-ink.tsx:UseMarkInkResult]
- `MarkPhaseState`: Interface returning phase status, element ref callback, and DOM dataset attributes. [src/hooks/use-mark-ink.tsx:MarkPhaseState]

## Invariants

- `useSocraticScaffolding` triggers Tier 1 on first failure with targeted pedagogical feedback based on diagnostic status, Tier 2 on second failure (`failureCount >= 2`) with `isGhostVisible: true` and ghost coordinates, and Tier 3 on third failure or help request with auto-placement of Row 1 / Pair 1 and revoked mastery eligibility. [src/hooks/use-socratic-scaffolding.ts:useSocraticScaffolding]
- `useSocraticScaffolding` resets to active construction state (`constructing`) and dismisses validated state whenever token modification occurs (state mutation guard). [src/hooks/use-socratic-scaffolding.ts:onTokenMutated]
- `useAudioNarration` cancels any active speech synthesis utterance immediately when a new speech request arrives (cancel-on-interrupt) or when unmounted. [src/hooks/use-audio-narration.ts:useAudioNarration]
- `useFormReset` only executes `onReset` if the event target is an `HTMLFormElement` that matches the element's associated form (`el.form`) or contains the element in its DOM subtree (`form.contains(el)`). [src/hooks/use-form-reset.ts:useFormReset]
- `useFormReset` preserves callback identity through a ref to avoid reattaching global DOM listeners across renders. [src/hooks/use-form-reset.ts:useFormReset]
- `motionIsOff` defaults to `false` in server-side / non-browser environments (`typeof window === "undefined"`) unless explicitly overridden by `providerReduced`. [src/hooks/use-live-motion.ts:motionIsOff]
- `useReducedMotion` synchronizes both `document.documentElement` attribute mutations (`data-motion`) and `(prefers-reduced-motion: reduce)` media query events. [src/hooks/use-live-motion.ts:useReducedMotion]
- `useIsMobile` evaluates screen viewport boundary strictly against `768px` (`max-width: 767px` media query and `window.innerWidth < 768`). [src/hooks/use-mobile.ts:useIsMobile]
- `usePaperDecor` and `useShapedSheet` disable rotation when `tilt === false` (evaluating degree to `0`), preserve explicit numeric tilt, or deterministically derive angle from seed clamped to `tiltMax`. [src/hooks/use-paper-object.ts:usePaperDecor] [src/hooks/use-paper-object.ts:useShapedSheet]
- `usePaperDecor` produces `null` decor and omits host ink attributes when `enabled` is `false`. [src/hooks/use-paper-object.ts:usePaperDecor]
- `useMarkInk` quantizes text line bounding coordinates to quarter-pixel increments (`0.25px`) to avoid layout jitter. [src/hooks/use-mark-ink.tsx:measure]
- `useMarkInk` discards measured rectangles and halts mark rendering if client rect line count exceeds `MAX_MARK_LINES` (60). [src/hooks/use-mark-ink.tsx:MAX_MARK_LINES] [src/hooks/use-mark-ink.tsx:measure]
- `useMarkPhase` assigns phase `"off"` when `show === false`, `"idle"` when animating prior to entering the viewport, and `"in"` upon intersecting or when un-animated. [src/hooks/use-mark-ink.tsx:useMarkPhase]

## Side Effects

- Attaches and tears down a document-level `reset` event listener. [src/hooks/use-form-reset.ts:useFormReset]
- Attaches and tears down media query listeners (`(prefers-reduced-motion: reduce)`) and a `MutationObserver` on `document.documentElement`. [src/hooks/use-live-motion.ts:useReducedMotion]
- Attaches and tears down media query listener for mobile viewport breakpoint change events. [src/hooks/use-mobile.ts:useIsMobile]
- Lazily creates and caches an `OffscreenCanvas` or DOM `<canvas>` 2D context in module scope for measuring font metrics. [src/hooks/use-mark-ink.tsx:canvasContext]
- Mutates module-scoped `ratioCache` map with computed font metrics. [src/hooks/use-mark-ink.tsx:fontRatios]
- Registers `ResizeObserver` and `MutationObserver` on host elements, and binds event listeners to `document.fonts`. [src/hooks/use-mark-ink.tsx:useMarkInk]
- Creates multiple `IntersectionObserver` instances and manages `setTimeout` dwell timers to monitor viewport entry. [src/hooks/use-mark-ink.tsx:useMarkPhase]
- Injects global ink SVG `<defs>` into the document head if no ink provider is detected. [src/hooks/use-mark-ink.tsx:useMarkInk]

## Verification

- Run: npm run build
