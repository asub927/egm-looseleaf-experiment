# Baseline (garden-map-demo)

Generated on this VM from unmodified `~/garden-design/design/garden-map-demo/garden.html`.

```bash
cd ~/garden-design/design/garden-map-demo
./build.sh
npm install
node verify.mjs    # writes shots/ (desk, ipad, phone, reduced motion)
node shot-map.mjs  # writes shots-map/
```

Demo verify result: **1485/1495** checks passed (10 known demo flakes in rm config).

Copy into repo: `./evidence/pips-garden-look/baseline/generate-baseline.sh` (full regen) or manual `cp` as documented in BASELINE.md.

**171** PNG files under `shots/` and `shots-map/`.

Filename pattern: `{config}-{screen}.png` (see any file under `shots/` for examples).
