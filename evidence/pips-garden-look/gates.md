# Gates — feat/pips-garden-look

## CLEARED: bundle gate (round 3, 2026-11-17)

Extracted from `/cursor/stores/bot/pips-garden/` with verified SHA256:

- `garden-design-v3.tar.gz`
- `pstack-skills.tar.gz`

Baseline **171** PNGs committed before visual port (`53ed7d3`).

## Fluid sweep exclusions (map unit)

Overlap assertions ignore decorative path/gate pairs (see `fluid-sweep.mjs`).

**`bed-making-ten` × `pip-owl-map`**: Pip starts beside bed 1 at narrow widths; same visual stacking in `garden-map-demo` at 360/414 portrait (demo sweep not automated this run — excluded as intended art per brief).

## Open (Anantha)

- **G6**: Owl uses `min-width` / `min-height` 56px with visual SVG smaller inside — invisible grab padding pattern.
- **03-map-all-done**: baseline PNG absent (demo verify gap); not in harness manifest.
- **WebKit phone map chrome**: ~1.95% on fresh/01-map/shots-map (WebKit raster vs Chromium baseline PNG).
- **02-map-3done touch/narrow**: verify walkthrough baseline ≠ localStorage seed (~5.6% phone, ~3.0% ipad landscape on demo HTML); harness walkthrough blocked on lesson `win` timeout (see `map/heatmap-notes.md`).

## No pause items

Deploy, force-push to shared branches, data deletion, customer messages: none.
