# Pip's Math Garden — visual parity harness (demo look)

Compares the Vite app at `vite preview` (default `http://127.0.0.1:4173`) against dr eggbot's **garden-map-demo** baselines.

## Baseline source (not vendored in repo)

Baselines are copied from the operator bundle:

```
~/garden-design/design/garden-map-demo/
  garden.html          # built from src/ via build.sh
  shots/               # desk 1280×800, ipad 1024×768 & 768×1024, phone 390×844, reduced-motion
  shots-map/           # map-specific baselines
```

Committed mirror (after extract):

```
evidence/pips-garden-look/baseline/
  shots/...
  shots-map/...
```

Regenerate missing demo states only with the demo's own shot script — never hand-edit PNGs.

## Harness

| Script            | Purpose                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `harness.mjs`     | Per-screen/state screenshots vs baseline; pixelmatch threshold **0.1**; fail if **>1.0%** pixels differ |
| `fluid-sweep.mjs` | Widths 360, 414, 600, 744, 834, 1024, 1180, 1440 × portrait & landscape — overlap, clip, 56×56 targets  |
| `motion.test.mjs` | All garden transitions ≤300ms, transform/opacity only; keyboard static; reduced-motion opacity-only     |

Allowed diff masks (listed in harness output): butterflies, bee, clouds, text caret.

## Run (Chromium + WebKit)

```bash
npx playwright install --with-deps webkit chromium
npm run build
npm run preview &   # tmux session recommended
npm run verify:garden-look
```

Artifacts: `evidence/pips-garden-look/artifacts/` (demo \| build \| diff side-by-sides).
