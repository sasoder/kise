#!/usr/bin/env bash
# v2: same 17 counter states, with the real Pressbyrån product photos.
# Passes the whole chart definition as inputProps so the shared component file
# is not edited — another session is working in it.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=out/stills-v2
PROPS=scripts/frukost-v2-props.json
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

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for i in "${!NAMES[@]}"; do
  echo "-> ${NAMES[$i]}"
  python3 -c "
import json, sys
p = json.load(open('$PROPS'))
p['snapshot'] = $i
json.dump(p, open('$TMP/props.json', 'w'))
"
  bunx remotion still src/frukost-entry.tsx FrukostBarChart "$OUT/${NAMES[$i]}.png" \
    --props="$TMP/props.json" --image-format=png --log=error
done

echo "Klart: $(ls -1 "$OUT" | wc -l | tr -d ' ') stills i $OUT"
