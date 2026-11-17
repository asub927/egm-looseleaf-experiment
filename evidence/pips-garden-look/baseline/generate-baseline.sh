#!/usr/bin/env bash
# Regenerate baseline PNGs from unmodified garden-map-demo/garden.html only.
# Usage: ./generate-baseline.sh [--engine chromium|webkit|both] [--map-only]
set -euo pipefail
DEMO="${HOME}/garden-design/design/garden-map-demo"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENGINE="${BASELINE_ENGINE:-chromium}"
MAP_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine) ENGINE="$2"; shift 2 ;;
    --map-only) MAP_ONLY=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$DEMO/garden.html" ]]; then
  echo "Missing $DEMO/garden.html — extract garden-design bundle to ~/garden-design" >&2
  exit 1
fi

echo "garden.html sha256: $(sha256sum "$DEMO/garden.html" | awk '{print $1}')"

run_engine() {
  local eng="$1"
  local root="$REPO/evidence/pips-garden-look/baseline/$eng"
  mkdir -p "$root/shots" "$root/shots-map"

  if [[ "$MAP_ONLY" -eq 0 && "$eng" == "chromium" ]]; then
  if [[ ! -d "$REPO/evidence/pips-garden-look/baseline/chromium/shots" && -d "$REPO/evidence/pips-garden-look/baseline/shots" ]]; then
    echo "Migrating legacy baseline/shots → baseline/chromium/shots"
    mkdir -p "$REPO/evidence/pips-garden-look/baseline/chromium"
    mv "$REPO/evidence/pips-garden-look/baseline/shots" "$root/shots"
    mv "$REPO/evidence/pips-garden-look/baseline/shots-map" "$root/shots-map"
  fi
    cd "$DEMO"
    ./build.sh
    (npm install --no-save 2>/dev/null || true)
    node verify.mjs
    node shot-map.mjs
    cp -a "$DEMO/shots/." "$root/shots/"
    cp -a "$DEMO/shots-map/." "$root/shots-map/"
  fi

  if [[ "$eng" == "chromium" && -d "$REPO/evidence/pips-garden-look/baseline/superseded/walkthrough-02-map-3done" ]]; then
    : # keep superseded
  elif [[ "$eng" == "chromium" && -d "$root/shots" ]]; then
    mkdir -p "$REPO/evidence/pips-garden-look/baseline/superseded/walkthrough-02-map-3done"
    for f in "$root/shots"/*02-map-3done.png; do
      [[ -f "$f" ]] || continue
      cp -n "$f" "$REPO/evidence/pips-garden-look/baseline/superseded/walkthrough-02-map-3done/" 2>/dev/null || cp "$f" "$REPO/evidence/pips-garden-look/baseline/superseded/walkthrough-02-map-3done/"
    done
  fi

  if [[ "$eng" == "chromium" ]]; then
    node "$SCRIPT_DIR/capture-map-baselines.mjs" "$eng" "$root/shots" "$root/shots-map" "02-map-3done,03-map-all-done"
    node "$SCRIPT_DIR/capture-map-baselines.mjs" "$eng" "$root/shots" "$root/shots-map" "fresh,3done"
  else
    node "$SCRIPT_DIR/capture-map-baselines.mjs" "$eng" "$root/shots" "$root/shots-map"
  fi
  echo "Engine $eng: $(find "$root" -name '*.png' | wc -l) PNGs"
}

case "$ENGINE" in
  chromium) run_engine chromium ;;
  webkit) run_engine webkit ;;
  both) run_engine chromium; run_engine webkit ;;
  *)
    echo "Unknown engine: $ENGINE" >&2
    exit 1
    ;;
esac

echo "Copied baselines under evidence/pips-garden-look/baseline/{chromium,webkit}/"