#!/usr/bin/env bash
# Regenerate baseline PNGs from unmodified garden-map-demo/garden.html only.
set -euo pipefail
DEMO="${HOME}/garden-design/design/garden-map-demo"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ ! -f "$DEMO/garden.html" ]]; then
  echo "Missing $DEMO/garden.html — extract garden-design bundle to ~/garden-design" >&2
  exit 1
fi
cd "$DEMO"
./build.sh
(cd "$DEMO" && npm install --no-save 2>/dev/null || true)
node verify.mjs
node shot-map.mjs
mkdir -p "$REPO/evidence/pips-garden-look/baseline/shots" "$REPO/evidence/pips-garden-look/baseline/shots-map"
rm -rf "$REPO/evidence/pips-garden-look/baseline/shots" "$REPO/evidence/pips-garden-look/baseline/shots-map"
mkdir -p "$REPO/evidence/pips-garden-look/baseline/shots" "$REPO/evidence/pips-garden-look/baseline/shots-map"
cp -a "$DEMO/shots/." "$REPO/evidence/pips-garden-look/baseline/shots/"
cp -a "$DEMO/shots-map/." "$REPO/evidence/pips-garden-look/baseline/shots-map/"
echo "Copied $(find "$REPO/evidence/pips-garden-look/baseline" -name '*.png' | wc -l) PNGs to evidence/pips-garden-look/baseline/"