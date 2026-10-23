#!/usr/bin/env python3
"""
Bake the airfield's photo ground for the O'Hare world (generated/components/scott-radar-map/ohareWorld.tsx,
TEX.aerial): the USDA NAIP 2023 orthophoto of ORD (public domain; assets-src/scott-radar-map/
KORD_NAIP2023_orthophoto_3830x4784.jpg, north up, plate carree, extent W -87.94056 E -87.87162 S 41.9480 N 42.0120;
see assets-src/scott-radar-map/SOURCES.md) registered to the world's miles and graded into the Denver world's warm look
(the manner of scripts/clips/scott-weather-fired/bake-den-aerial.py).

REGISTRATION: the world origin (the terminal core, FAA diagram px (1060, 1500)) at lon -87.90256, lat 41.97699 (from
the diagram's graticule: 87 55'W at px 696 and 430 px per minute of longitude; 41 59'N at px 1280, 578 px per minute
of latitude); 1 deg lat = 69.05 mi, 1 deg lon = 51.31 mi at 41.98 N; refined so the photo's runways sit on
ohareAirfield.ts's centrelines (ORIGIN_* nudges below, checked with --check, which writes an overlay).
The output covers the same square as ohare-field.png (OHARE_FIELD_MI centred on FIELD_CX, FIELD_CY).

GRADE: luminance through the warm ramp (olive-brown -> tan -> cream concrete) keeping some of the photo's colour (the
summer grass a soft olive); alpha feathered irregularly outside the runways so the photo dissolves into the baked
suburbs.

Run:  /usr/bin/python3 scripts/clips/scott-radar-map/bake-ohare-aerial.py [--check]
Writes public/scott-radar-map/ohare-aerial.webp (RGBA).
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SRC = os.path.join(ROOT, "assets-src", "scott-radar-map", "KORD_NAIP2023_orthophoto_3830x4784.jpg")
OUT = os.path.join(ROOT, "public", "scott-radar-map", "ohare-aerial.webp")
W_LON, E_LON, S_LAT, N_LAT = -87.94056, -87.87162, 41.9480, 42.0120
ORIGIN_LON = -87.90256 + 0.0
ORIGIN_LAT = 41.97699 + 0.00039
MI_LAT = 69.05
MI_LON = 51.31
N = 2048
FIELD_MI = 5.6
FIELD_CX, FIELD_CY = -0.25, 0.0
RUNWAYS = [
    (-1.241, 1.749, 0.181, 1.749),
    (-1.494, 0.749, 0.637, 0.749),
    (-1.494, 0.446, 0.641, 0.446),
    (-1.494, -0.580, 0.976, -0.580),
    (-1.492, -0.807, 0.554, -0.807),
    (-1.279, -1.394, 0.122, -1.394),
    (-0.589, 0.275, 0.306, 1.378),
    (0.123, -1.695, 1.142, -0.556),
]

img = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float64) / 255.0
h0, w0, _ = img.shape
s = FIELD_MI / N
jj, ii = np.mgrid[0:N, 0:N]
wx = FIELD_CX - FIELD_MI / 2 + (ii + 0.5) * s
wy = FIELD_CY + FIELD_MI / 2 - (jj + 0.5) * s
lon = ORIGIN_LON + wx / MI_LON
lat = ORIGIN_LAT + wy / MI_LAT
px = (lon - W_LON) / (E_LON - W_LON) * w0 - 0.5
py = (N_LAT - lat) / (N_LAT - S_LAT) * h0 - 0.5
inside = (px >= 0) & (px < w0 - 1) & (py >= 0) & (py < h0 - 1)
x0 = np.clip(np.floor(px).astype(int), 0, w0 - 2)
y0 = np.clip(np.floor(py).astype(int), 0, h0 - 2)
fx = np.clip(px - x0, 0, 1)[:, :, None]
fy = np.clip(py - y0, 0, 1)[:, :, None]
a = img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy) + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy

if "--check" in sys.argv:
    im = Image.fromarray((a * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for x0r, y0r, x1r, y1r in RUNWAYS:
        p = lambda x, y: ((x - (FIELD_CX - FIELD_MI / 2)) / s, ((FIELD_CY + FIELD_MI / 2) - y) / s)
        d.line([p(x0r, y0r), p(x1r, y1r)], fill=(255, 0, 0), width=2)
    im.save(os.path.join(os.environ.get("CHECK_DIR", "/tmp"), "aerial_check.png"))
    print("check written")
    sys.exit(0)

lum = 0.3 * a[:, :, 0] + 0.55 * a[:, :, 1] + 0.15 * a[:, :, 2]
lo, hi = np.percentile(lum[inside], 2), np.percentile(lum[inside], 99.7)
t = np.clip((lum - lo) / (hi - lo), 0, 1)
med = np.median(t[inside])
t = np.where(t < med, 0.5 * np.clip(t / med, 0, 1) ** 0.7, 0.5 + 0.5 * np.clip((t - med) / (1 - med), 0, 1) ** 0.8)
sat = a.max(2) - a.min(2)
concrete = np.clip((t - 0.6) / 0.2, 0, 1) * np.clip((0.12 - sat) / 0.08, 0, 1)
t = np.clip(t + 0.12 * concrete, 0, 1)
ramp = [
    (0.0, (0x66, 0x60, 0x3E)),
    (0.3, (0x8C, 0x86, 0x56)),
    (0.5, (0xA6, 0x9C, 0x67)),
    (0.68, (0xC2, 0xB3, 0x84)),
    (0.84, (0xE4, 0xDA, 0xC2)),
    (1.0, (0xF7, 0xF0, 0xE0)),
]
out = np.zeros_like(a)
for c in range(3):
    out[:, :, c] = np.interp(t, [p for p, _ in ramp], [col[c] / 255.0 for _, col in ramp])
chroma = a - lum[:, :, None]
out = np.clip(out + 0.2 * chroma, 0, 1)

# alpha: opaque over the airfield (runway box + margin), feathered irregularly outside it, never past the photo's edge
def soft_noise(cells, seed):
    r = np.random.default_rng(seed).standard_normal((cells, cells))
    im = Image.fromarray(((r - r.min()) / np.ptp(r) * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)
    return np.array(im.filter(ImageFilter.GaussianBlur(N / cells / 2))).astype(np.float64) / 255.0 - 0.5

box = np.maximum.reduce([wx - 1.35, -1.75 - wx, wy - 2.0, -1.85 - wy])  # <0 inside the airfield box
box = box + 0.35 * soft_noise(6, 3) + 0.12 * soft_noise(14, 4)
alpha = np.clip((0.35 - box) / 0.45, 0, 1)
alpha = alpha * alpha * (3 - 2 * alpha)
# the photo's own edge: fade over its last 0.12 mi
edge_mi = np.minimum.reduce([(lon - W_LON) * MI_LON, (E_LON - lon) * MI_LON, (lat - S_LAT) * MI_LAT, (N_LAT - lat) * MI_LAT])
alpha *= np.clip(edge_mi / 0.12, 0, 1) * inside
# and only over the airport's own ground: the diagram field texture's alpha (pavement + its mowed-grass halo), so the
# photo's off-airport streets never show beside the baked suburbs
fa = np.asarray(Image.open(os.path.join(ROOT, "public", "scott-radar-map", "ohare-field.png")).convert("RGBA")).astype(np.float64)[:, :, 3] / 255.0
alpha *= np.clip(fa * 1.25, 0, 1)
rgba = np.dstack([out, alpha])
Image.fromarray((rgba * 255).astype(np.uint8)).save(OUT, quality=88, method=6)
print("wrote", OUT, os.path.getsize(OUT))
