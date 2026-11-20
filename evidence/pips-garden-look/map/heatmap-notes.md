# Map diff heatmap notes (worker retry 1)

Recorded before code changes at HEAD 3d3c6a06.

## Phone `02-map-3done` chromium (5.89% → 5.56% after line-height fix)

Finer grid 16×6: dominant cells `r0c*`–`r1c*` (~0.79% frame each). Top band = header + maptalk + upper garden.

## Phone webkit `fresh` / `01-map` / shots-map `3done` (~1.95%)

Top row cells only (~1.40% each). WebKit text raster vs Chromium baseline (text not masked).

## Root cause analysis (measured this run)

| Comparison                                                   | Percent |
| ------------------------------------------------------------ | ------- |
| Live React app vs live demo (in-memory 3done, phone)         | 0.32%   |
| Committed baseline vs demo verify walkthrough shot           | 0.00%   |
| Demo walkthrough vs demo in-memory seed (phone 02-map-3done) | 5.57%   |
| Demo walkthrough vs in-memory (ipad landscape 02-map)        | 3.13%   |
| Demo walkthrough vs in-memory (desk 02-map)                  | 1.11%   |

Harness `setThreeBedsDone` + reload matches demo in-memory, not verify walkthrough capture for narrow/touch 02-map rows.

## Fixes applied

- `line-height: normal` on `.garden-root` + map chrome (undoes body `1.55`).
- `text-rendering: geometricPrecision` on garden root.
- shots-map `3done`: `owlBedIndex: 0` (shot-map.mjs).
- Touch drags: CDP on Chromium, `dragTo` on WebKit (lesson flows).

## Still open

- 02-map-3done on ipad landscape + phone needs verify-style walkthrough in harness (`win` step timeout on React lessons).
- WebKit phone map chrome ~1.95% vs Chromium baselines.
