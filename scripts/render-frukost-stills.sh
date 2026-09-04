#!/usr/bin/env bash
# Renders one transparent PNG per counter state, in the order they happen in the clip.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=out/stills
mkdir -p "$OUT"
rm -f "$OUT"/*.png

NAMES=(
  01_mat_tom
  02_mat_macka1
  03_mat_macka2
  04_mat_macka3
  05_mat_kvarg1
  06_mat_agg1
  07_mat_macka4
  08_mat_hamburgare1
  09_mat_yoghurt1_klar
  10_dryck_tom
  11_dryck_juice1
  12_dryck_mjolk1
  13_dryck_vatten1
  14_dryck_kaffe1
  15_dryck_juice2
  16_dryck_kaffe2
  17_dryck_oboy1_klar
)

for i in "${!NAMES[@]}"; do
  echo "-> ${NAMES[$i]}"
  bunx remotion still src/frukost-entry.tsx FrukostBarChart "$OUT/${NAMES[$i]}.png" \
    --props="{\"snapshot\":$i}" --image-format=png --log=error
done

echo "Klart: $(ls -1 "$OUT" | wc -l | tr -d ' ') stills i $OUT"
