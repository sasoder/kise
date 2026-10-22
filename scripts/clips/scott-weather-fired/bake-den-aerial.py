#!/usr/bin/env python3
"""
Bake the airfield's ground for the Denver world (generated/components/scott-weather-fired/denverWorld.tsx, TEX.aerial):
the USGS 2002 orthophoto of DEN (public domain; assets-src/scott-weather-fired/Denver_airport_USGS_2002_3840.jpg,
north up, the 3840 px thumb of the 10800 px original) registered to the world's miles and graded into the warm look.

REGISTRATION (measured on the 3840 px image against denverAirfield.ts, itself traced from the KDEN layout):
  runway 8 threshold (2378, 1483) and 26 threshold (3675, 1491): 8/26 centreline y 1487 px  <-> y 1.937 mi
  runway 7/25 centreline y 2937 px                                                            <-> y -0.605 mi
  runway 17R/35L centreline x 2445 px, 17L/35R x 3020 px                                       <-> x 0.714 / 1.712 mi
  => sx = 0.001738 mi/px, sy = 0.001753 mi/px, the terminal (0, 0) at (2034.2, 2592) px.
The image is resampled to square miles-per-pixel (width scaled by sx/sy), so the texture spans
  x -3.535 .. 3.139 mi, y 4.544 .. -2.188 mi (AERIAL_* below; denverWorld reads the same numbers).

GRADE (the Will Mars manner, a real texture on the stage): luminance mapped through the plains' warm ramp (dark
olive-brown -> tan -> cream concrete) with a little of the photo's own colour kept, contrast eased, so concrete reads as
pale cream and the fields sit in the baked plains' family. ALPHA: feathered toward the edges (with a soft noise, so no
square edge shows) to dissolve into the baked plains.

Run:  /usr/bin/python3 scripts/clips/scott-weather-fired/bake-den-aerial.py
Writes public/scott-weather-fired/den-aerial.webp (RGBA).
"""
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SRC = os.path.join(ROOT, "assets-src", "scott-weather-fired", "Denver_airport_USGS_2002_3840.jpg")
OUT = os.path.join(ROOT, "public", "scott-weather-fired", "den-aerial.webp")

SX, SY = 0.001738, 0.001753
X0, Y0 = 2034.2, 2592.0

img = Image.open(SRC).convert("RGB")
w0, h0 = img.size
w1 = int(round(w0 * SX / SY))
img = img.resize((w1, h0), Image.LANCZOS)
print("extent x", round(-X0 * SX, 3), round((w0 - X0) * SX, 3), "y", round(Y0 * SY, 3), round((Y0 - h0) * SY, 3), "size", w1, h0, "mi", round(w0 * SX, 3))

a = np.asarray(img).astype(np.float64) / 255.0
lum = 0.3 * a[:, :, 0] + 0.55 * a[:, :, 1] + 0.15 * a[:, :, 2]
# ease the contrast around the fields' mid-tone, keep the concrete bright
lo, hi = np.percentile(lum, 2), np.percentile(lum, 99.7)
t = np.clip((lum - lo) / (hi - lo), 0, 1)
# the fields' median sits on the plains' tan; the bright, grey concrete lifts to pale cream
med = np.median(t)
t = np.where(t < med, 0.5 * np.clip(t / med, 0, 1) ** 0.7, 0.5 + 0.5 * np.clip((t - med) / (1 - med), 0, 1) ** 0.8)
sat = a.max(2) - a.min(2)
concrete = np.clip((t - 0.62) / 0.2, 0, 1) * np.clip((0.12 - sat) / 0.08, 0, 1)
t = np.clip(t + 0.12 * concrete, 0, 1)
ramp = [
    (0.0, (0x6A, 0x5E, 0x40)),
    (0.3, (0x93, 0x85, 0x58)),
    (0.5, (0xA9, 0x97, 0x65)),
    (0.68, (0xC2, 0xAF, 0x80)),
    (0.84, (0xE6, 0xDA, 0xC0)),
    (1.0, (0xF7, 0xF0, 0xE0)),
]
out = np.zeros_like(a)
for c in range(3):
    xs = [p for p, _ in ramp]
    ys = [col[c] / 255.0 for _, col in ramp]
    out[:, :, c] = np.interp(t, xs, ys)
# keep a touch of the photo's own colour (green irrigated fields, rust soil)
chroma = a - lum[:, :, None]
out = np.clip(out + 0.18 * chroma, 0, 1)

# alpha: an irregular soft mask (no rectangle at any pitch): a rounded-square distance field pulled in and out by a
# large, low-frequency noise, feathered over ~1.9 mi; the airfield itself stays fully opaque
h, w = lum.shape
yy, xx = np.mgrid[0:h, 0:w]
cx, cy = X0 * SX / SY, Y0  # the terminal, in the resampled image
ux = (xx - w / 2) / (w / 2)
uy = (yy - h / 2) / (h / 2)
p4 = (np.abs(ux) ** 3 + np.abs(uy) ** 3) ** (1 / 3)  # 0 centre .. 1 at the edge midpoints, rounded corners
rng = np.random.default_rng(5)
def soft_noise(cells, seed):
    r = np.random.default_rng(seed).standard_normal((cells, cells))
    im = Image.fromarray(((r - r.min()) / np.ptp(r) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.array(im.filter(ImageFilter.GaussianBlur(w / cells / 2))).astype(np.float64) / 255.0 - 0.5
wob = 0.3 * soft_noise(5, 5) + 0.1 * soft_noise(12, 6)
d = p4 + wob
alpha = np.clip((0.93 - d) / 0.62, 0, 1)
alpha = alpha * alpha * (3 - 2 * alpha)
# never cut into the airfield itself (runways reach ~3.3 mi north, ~2.9 mi east/west of the terminal)
fx = (xx - cx) * SY
fy = (cy - yy) * SY
core = np.clip(1.0 - np.maximum(0, np.maximum(np.abs(fx + 0.05) - 2.95, np.maximum(fy - 3.35, -fy - 1.55))) / 0.6, 0, 1)
core = core * core * (3 - 2 * core)
alpha = np.maximum(alpha, core * np.clip((0.98 - p4) / 0.22, 0, 1))
rgba = np.dstack([out, alpha])
Image.fromarray((rgba * 255).astype(np.uint8)).save(OUT, quality=88, method=6)
print("wrote", OUT, os.path.getsize(OUT))
