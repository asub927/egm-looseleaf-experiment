# Baseline (garden-map-demo)

Generated from unmodified `~/garden-design/design/garden-map-demo/garden.html`.

```bash
cd evidence/pips-garden-look/baseline
./generate-baseline.sh --engine chromium   # lesson shots via verify.mjs + seeded map overlays
./generate-baseline.sh --engine webkit     # map rows only (capture-map-baselines.mjs)
```

Layout:

- `chromium/shots/` + `chromium/shots-map/` — full lesson mirror (171 files) plus seeded map rows
- `webkit/shots/` + `webkit/shots-map/` — map parity rows; counting-on shell rows (`b2-counting-on-{1story,4sheet,5win}`) via `capture-shell-baselines.mjs` from unmodified `garden.html`
- `superseded/walkthrough-02-map-3done/` — verify walkthrough 3-done PNGs replaced in retry 2

Seeded 3-done uses `window.__app.APP` flags (`making-ten`, `counting-on`, `decomposing`, `leaves: 6`, `owlAt: 0`), same as `shot-map.mjs`.
