# EGM Drift Report (2026-11-02)

## design_draft.md

- **Pre-Generated Audio Assets Missing (`public/audio/`)**: Section 3 (Goal 3) and Phase 2 specify pre-generated, expressive child-friendly voice audio created via Google Gemini (`gemini-3.8-flash-tts`) committed as static assets in `public/audio/*.mp3`, indexed by `src/assets/audio-manifest.json`. Currently, `public/audio/`, `scripts/generate-assets-gemini.ts`, and `src/assets/audio-manifest.json` do not exist. Audio is dynamically synthesized via the native Web Speech API and procedural Web Audio tones in `src/lib/audio/sfx.ts`.
- **Curriculum Ingestion Pipeline Missing**: Phase 2 specifies `scripts/ingest-curriculum.ts` and `src/curriculum/items/*.yaml` to ingest official NCDPI unpacked content and OER item seeds, alongside `src/curriculum/invariants.ts`. Currently, curriculum problems are hardcoded directly within wireframe component state (`PRESET_PROBLEMS` array in `NC2OA3Wireframe.tsx` and static 3x4 seed in `NC2OA4Wireframe.tsx`).
- **Modular Component Decomposition Incomplete**: Phase 3 specifies decomposed discrete components:
  - `src/components/math/ArrayBoard.tsx` (5x5 manipulative grid on `Paper stock="graph"`)
  - `src/components/math/PairingMat.tsx` (2-column tactile pairing workspace for NC.2.OA.3)
  - `src/components/math/StrategyLensBar.tsx` (Row Eyes vs. Column Eyes switcher)
  - `src/components/math/SupplyTray.tsx` (Tactile inventory counter)
  - `src/components/math/MascotCompanion.tsx` (Pencil Pal dock with synchronized reactive poses)
  - `src/components/math/VictoryOverlay.tsx` (Red wax seal and celebratory fanfare)
    Currently, all layout, manipulative state, audio hooks, and UI controls remain tightly coupled within two monolithic wireframe files (`src/components/math/NC2OA4Wireframe.tsx` and `src/components/math/NC2OA3Wireframe.tsx`).
- **Socratic Scaffolding State Machine Hook Missing**: Phase 4 specifies `src/hooks/use-socratic-scaffolding.ts` to manage the deterministic 3-tier scaffolding escalation ladder (Tier 1: Socratic Prompt $\rightarrow$ Tier 2: Visual Ghost Outline $\rightarrow$ Tier 3: Step Demonstration with Isomorphic Retry). Currently, scaffolding is partially simulated using ad-hoc `failureCount` component state; Tier 3 (step auto-placement + mastery revocation + isomorphic seed swap) is not implemented.
- **Dual-Bus Audio Engine Architecture Divergence**: Phase 4 specifies `src/lib/audio/audio-bus.ts` providing a prioritized Preemptible Voice Bus and Polyphonic SFX Bus, along with `src/hooks/use-audio-narration.ts` for synchronized speech bubble karaoke word highlighting. Currently, audio is implemented as standalone functions in `src/lib/audio/sfx.ts` without audio bus prioritization or karaoke word highlighting.
- **Parity Mat Spatial Layout Divergence ("Frame 1 / Frame 2")**: CUJ 1 and Section 397 specify a single unified 2-column tactile pairing mat where counters snap two-by-two and odd numbers reveal a lone un-partnered counter at the bottom. Currently, `NC2OA3Wireframe.tsx` divides the workspace into two side-by-side cards labeled "Frame 1 (Pairs 1–5)" and "Frame 2 (Pairs 6–10)", introducing artificial framing jargon not specified in the design.
- **Full-Screen Commutative Modal Overlay Divergence**: CUJ 2 (lines 89-92) and Section 4 specify that upon triggering Column Eyes, the baking sheet remains fully interactive and visible while column indicators light up across the top in sky-blue wash ($3+3+3+3=12$) alongside row indicators ($4+4+4=12$). In reality, `NC2OA4Wireframe.tsx` mounts a full-screen opaque modal (`absolute inset-0 bg-paper/95`) that completely hides the baking sheet and manipulative cookies from the student.
- **Diff-Aware JiT Testing Script Missing**: Section 382 specifies `scripts/jittest.ts` to execute diff-aware invariant checks. Currently, `.githooks/pre-commit` and CI run the entire test directory unconditionally via `npm test`.
- **PWA Packaging & Local Profile Persistence Missing**: Phase 5 specifies `vite-plugin-pwa` precaching in `vite.config.ts`, `src/lib/storage/profile.ts` for local student profile persistence (`schemaVersion: 1`), and `.github/workflows/deploy.yml` for automated GitHub Pages deployment. None of these files or packages are currently implemented.

## concepts_brief.md

- **Dual-Mode Drag-and-Drop with Magnetic Snapping Missing**: Section 1 specifies supporting both tap-to-place and drag-and-drop with an 80px magnetic snapping radius. Currently, only single-tap cell placement is supported; continuous drag gestures and magnetic snapping physics are not implemented.
- **Interactive Equation Token Badge Builder Missing**: Section 1 specifies that equations ($4 + 4 + 4 = 12$) are assembled by tapping structured token badges (`[4]`, `[+]`, `[=]`). Currently, equations are rendered as static, non-interactive text strings.
- **Multi-User Profile Selector & Restoration Token Missing**: Section 5 specifies an anonymous local profile selector (Fox, Rocket, Star) with versioned Zod schemas and a 6-character Progress Restoration Token for shared classroom device carts. Currently, only a static visual Kit the Fox avatar is rendered, with stars stored in volatile component state.
- **Offline PWA Configuration Missing**: Section 6 specifies configuring base path `base: '/egm-looseleaf-experiment/'` in `vite.config.ts` and Workbox precaching via `vite-plugin-pwa`. Currently, `vite.config.ts` has no base repository path or PWA caching configured.

## README.md

- **Missing Invariant Test Suite & Pre-Commit Hook Documentation**: Root documentation does not document the Node 26 headless math invariant test suite (`tests/invariants/`), `npm test` command, `.githooks/pre-commit`, or `.github/workflows/jittest.yml`.
- **Missing Math Subsystem Boundaries**: System Boundaries section does not reference the newly introduced math manipulatives domain in `src/components/math/` or `src/lib/math/`.

## src/README.md

- **Missing Math and Audio Subsystem Documentation**: Subdirectories & Boundaries does not document `src/lib/math` (headless diagnostic evaluators), `src/lib/audio` (sound synthesizer and speech narration), or `src/components/math` (tactile math wireframes).

## src/components/README.md

- **Missing Math Manipulatives Directory**: Subdirectories & Boundaries lists only `ui: [./ui/README.md]`, omitting `math/` (`NC2OA3Wireframe.tsx`, `NC2OA4Wireframe.tsx`).

## src/components/ui/README.md

No drift detected.

## src/hooks/README.md

No drift detected.

## src/lib/README.md

- **Missing Math and Audio Subdirectories**: Subdirectories & Boundaries lists only `ink`, omitting `src/lib/math` (`evaluator.ts`) and `src/lib/audio` (`sfx.ts`).
- **Missing Exported Interfaces**: Interface section does not list functions and types exported by `src/lib/math/evaluator.ts` (`evaluateArrayGrid`, `evaluatePairingMat`, `ArrayProblemSpec`, `ParityProblemSpec`, `ArrayDiagnostic`, `ParityDiagnostic`) or `src/lib/audio/sfx.ts` (`playStampThud`, `playPickupChirp`, `playNudgeTone`, `playVictoryFanfare`, `speakSpeech`).

## src/lib/ink/README.md

No drift detected.

## src/lib/ink/art/README.md

No drift detected.

## src/lib/ink/art/doodles/README.md

No drift detected.

## src/lib/ink/art/icons/README.md

No drift detected.

## src/lib/ink/art/mascots/README.md

No drift detected.

## src/lib/ink/art/props/README.md

No drift detected.

## src/lib/ink/art/scenes/README.md

No drift detected.

## src/lib/ink/art/stickers/README.md

No drift detected.

## src/lib/ink/charts/README.md

No drift detected.

## src/lib/ink/paper/README.md

No drift detected.

## src/lib/ink/react/README.md

No drift detected.

## src/lib/ink/recipes/README.md

No drift detected.

## src/lib/ink/recipes/chart-ink/README.md

No drift detected.
