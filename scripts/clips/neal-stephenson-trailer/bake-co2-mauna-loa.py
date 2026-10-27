#!/usr/bin/env python3
"""Bake NOAA GML's Mauna Loa monthly mean CO2 into a small TS data module for cut 22 (TooMuchCarbon).

Usage (from the repo root, isolated mode because the CSV is downloaded data):
  python3 -I scripts/clips/neal-stephenson-trailer/bake-co2-mauna-loa.py \
      assets-src/neal-stephenson-trailer/co2_mm_mlo.csv generated/components/neal-stephenson-trailer/co2MaunaLoa.ts

Reads the `decimal date` and `average` (monthly mean, ppm) columns of every month. NOAA has already interpolated
missing months in `average` (flagged by a negative stdev); nothing is smoothed or resampled here.
"""
import csv
import sys

src, dst = sys.argv[1], sys.argv[2]
created = ""
rows = []
with open(src, newline="") as fh:
    lines = []
    for line in fh:
        if line.startswith("#"):
            if "File Creation" in line:
                created = line.split(":", 1)[1].strip()
            continue
        lines.append(line)
for r in csv.DictReader(lines):
    year, month = int(r["year"]), int(r["month"])
    t, ppm = float(r["decimal date"]), float(r["average"])
    if not (250 < ppm < 500):
        raise SystemExit(f"bad value {ppm} at {year}-{month}")
    rows.append((year, month, t, ppm))

# every month present, in order
for a, b in zip(rows, rows[1:]):
    if (b[0] * 12 + b[1]) - (a[0] * 12 + a[1]) != 1:
        raise SystemExit(f"gap between {a[:2]} and {b[:2]}")

first, last = rows[0], rows[-1]
hi = max(rows, key=lambda r: r[3])
lo = min(rows, key=lambda r: r[3])
out = []
out.append("// Mauna Loa monthly mean CO2 (ppm), every month March 1958 -> " f"{last[0]}-{last[1]:02d}.")
out.append("// SOURCE: NOAA Global Monitoring Laboratory, Mauna Loa monthly mean CO2 (gml.noaa.gov/ccgg/trends/; before May 1974")
out.append("//   Scripps Institution of Oceanography), file co2_mm_mlo.csv created " + created + ";")
out.append("//   column `average` (monthly mean, NOAA's interpolation of missing months kept), `decimal date`.")
out.append("// Baked by scripts/clips/neal-stephenson-trailer/bake-co2-mauna-loa.py from")
out.append("//   assets-src/neal-stephenson-trailer/co2_mm_mlo.csv. Do not edit by hand.")
out.append(f"// {len(rows)} months; first {first[0]}-{first[1]:02d} {first[3]:.2f}; last {last[0]}-{last[1]:02d} {last[3]:.2f};")
out.append(f"//   min {lo[3]:.2f} ({lo[0]}-{lo[1]:02d}); max {hi[3]:.2f} ({hi[0]}-{hi[1]:02d}).")
out.append(f"export const CO2_MONTHS = {len(rows)};")
out.append(f"export const CO2_FIRST = {{ year: {first[0]}, month: {first[1]}, t: {first[2]}, ppm: {first[3]} }} as const;")
out.append(f"export const CO2_LAST = {{ year: {last[0]}, month: {last[1]}, t: {last[2]}, ppm: {last[3]} }} as const;")
out.append(f"export const CO2_MIN = {lo[3]};")
out.append(f"export const CO2_MAX = {hi[3]};")


def chunk(vals, fmt, per=16):
    s = []
    for i in range(0, len(vals), per):
        s.append("  " + ", ".join(fmt % v for v in vals[i : i + per]) + ",")
    return "\n".join(s)


out.append("/** decimal year of each month (NOAA's mid-month decimal date) */")
out.append("export const CO2_T: readonly number[] = [\n" + chunk([r[2] for r in rows], "%.4f") + "\n];")
out.append("/** monthly mean CO2, ppm */")
out.append("export const CO2_PPM: readonly number[] = [\n" + chunk([r[3] for r in rows], "%.2f") + "\n];")
with open(dst, "w") as fh:
    fh.write("\n".join(out) + "\n")
print(f"wrote {dst}: {len(rows)} months, {first[3]} -> {last[3]}, min {lo[3]} max {hi[3]}")
