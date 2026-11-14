#!/usr/bin/env python3
"""TeamThatBuiltLVM3 (skyroot-trailer, cut 17): a patch that hides the LVM3 photo's own small ISRO logo under the
large white ISRO mark the cut prints on the core (so the photo's logo never peeks out beside the mark as a ghost).

The core is a cylinder lit from the side: its tone varies smoothly across x and hardly along y, so the box is refilled
with one smooth across-x profile (a robust quartic fitted to the per-column medians of the box, the logo's dark
strokes rejected as outliers) plus a faint seeded grain. Feathered alpha at the box's edge. Reads public/skyroot-trailer/lvm3.png
(skyrootShared's cut-out, never edited), writes public/skyroot-trailer/lvm3_logo_patch.png and prints its box (src px).

  /usr/bin/python3 scripts/clips/skyroot-trailer/bake-lvm3-logo-patch.py
"""
import numpy as np
from PIL import Image

SRC = "public/skyroot-trailer/lvm3.png"
OUT = "public/skyroot-trailer/lvm3_logo_patch.png"
X0, X1 = 300, 456  # the logo's box with margin, src px (logo ~317-435)
Y0, Y1 = 1302, 1414  # (logo ~1292-1400: its tip touches the interstage ring's lip above; the Hindi type starts ~1420)
FEATHER = 5

im = Image.open(SRC).convert("RGBA")
a = np.asarray(im).astype(np.float32)
g = a[..., :3].mean(axis=2)
h = Y1 - Y0
med = np.median(g[Y0:Y1, X0:X1], axis=0)
x = np.arange(X1 - X0, dtype=np.float64)
keep = np.ones_like(x, dtype=bool)
for _ in range(4):  # robust fit: drop columns well below the fit (the arrow's stroke) and refit
    c = np.polyfit(x[keep], med[keep], 4)
    fit = np.polyval(c, x)
    keep = med > fit - 4
prof = np.polyval(c, x).astype(np.float32)
rng = np.random.default_rng(17)
fill = np.clip(prof[None, :] + rng.normal(0, 1.5, (h, X1 - X0)).astype(np.float32), 0, 255)
yy, xx = np.mgrid[0:h, 0 : X1 - X0]
edge = np.minimum.reduce([yy + 1, h - yy, xx + 1, (X1 - X0) - xx]).astype(np.float32)
alpha = np.clip(edge / FEATHER, 0, 1) * (a[Y0:Y1, X0:X1, 3] / 255.0)
out = np.dstack([fill, fill, fill, alpha * 255]).astype(np.uint8)
Image.fromarray(out).save(OUT, optimize=True)
print({"x0": X0, "y0": Y0, "x1": X1, "y1": Y1})
