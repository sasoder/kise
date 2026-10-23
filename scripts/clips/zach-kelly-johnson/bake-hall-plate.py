"""TwentyYearsOnePlane: extend the Ellsworth hangar plate's floor downward for a 9:16 frame.

The plate (public/zach-kelly-johnson/A/plate_hall_ellsworth.jpg, 2600x2060) is landscape, its floor only the lower
26 %. Shown at the scale where the aircraft (~75 % of the frame width) sits believably in the hall, it covers only the
top ~70 % of a 1080x1920 frame, so the near floor is extended: rows 0..KEEP stay as photographed; below them the
nearest floor is spread over OUT output rows with a stretch that grows linearly from 1:1 at the seam to R:1 at the
bottom (the vertical magnification of a ground plane nearing the lens), and it goes soft quickly below the seam (a
heavy gaussian on the stretched rows, full strength from ~30 % of the extension down): a calm, out-of-focus
foreground with no stretch streaks. The cut darkens it further toward the bottom in the scene.

Run: uv run --offline --with pillow --with numpy python scripts/clips/zach-kelly-johnson/bake-hall-plate.py <in> <out>
"""
import math
import sys

import numpy as np
from PIL import Image, ImageFilter

KEEP = 1600  # source rows kept as photographed (the floor/wall join is at ~1520)
TOTAL = 3040  # output rows
SOFT = 30.0  # px gaussian radius of the out-of-focus near floor
SOFT_IN = 0.3  # fraction of the extension over which it goes fully soft

src = Image.open(sys.argv[1]).convert("L")
a = np.asarray(src).astype(np.float32)
h, w = a.shape
B = h - KEEP - 1
OUT = TOTAL - KEEP

# solve OUT * ln(R) / (R - 1) = B for R (bisection)
lo, hi = 1.0001, 100.0
for _ in range(80):
    mid = (lo + hi) / 2
    if OUT * math.log(mid) / (mid - 1) > B:
        lo = mid
    else:
        hi = mid
R = (lo + hi) / 2

y = np.arange(OUT) + 0.5
v = KEEP + OUT / (R - 1) * np.log(1 + (R - 1) * y / OUT)
v = np.clip(v, 0, h - 1)
v0 = np.floor(v).astype(int)
v1 = np.minimum(v0 + 1, h - 1)
t = (v - v0)[:, None]
ext = a[v0] * (1 - t) + a[v1] * t

soft = np.asarray(Image.fromarray(np.clip(ext, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SOFT))).astype(np.float32)
u = np.clip(y / (SOFT_IN * OUT), 0, 1)
wgt = (u * u * (3 - 2 * u))[:, None]
ext = ext * (1 - wgt) + soft * wgt

out = np.vstack([a[:KEEP], ext])
Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(sys.argv[2], quality=86, optimize=True)
print(out.shape, "R", round(R, 2))
