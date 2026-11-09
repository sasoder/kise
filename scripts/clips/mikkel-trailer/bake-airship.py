#!/usr/bin/env python3
"""EighteenHundredCloser: Sceye's airship as a side-on cut-out, nose LEFT -> public/mikkel-trailer/sceye_airship.png.

Source: the IEEE Spectrum lead photo of the clip's news card (SoftBank; assets-src/mikkel-trailer/sceye_newscard_photo.jpg:
the airship climbing nose-up into a pale dawn sky, seen side-on from below). Turned 90 degrees so the nose points left and
keyed off the sky with bake-photos.py's smooth-background key. The hull's sun-lit lower edge is the colour of the sky, so
the key eats into it: there the outline is rebuilt from the photo's own edge (the strongest vertical colour step below
the keyed edge, per column, smoothed), and the hull is filled up to it. Greyscale + alpha.

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-airship.py
"""
import importlib.util
import numpy as np
from scipy import ndimage as ni

spec = importlib.util.spec_from_file_location("bp", "scripts/clips/mikkel-trailer/bake-photos.py")
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

SRC = "assets-src/mikkel-trailer/sceye_newscard_photo.jpg"
OUT = "public/mikkel-trailer/sceye_airship.png"
a, g, alpha = bp.key(SRC, None, 8, 18, (2050, 80, 3150, 2250), 1, 90, False, 2400)
H, W = alpha.shape
solid = alpha > 0.5
sm = ni.gaussian_filter(a, (2, 2, 0))
gy = np.sqrt((np.diff(sm, axis=0) ** 2).sum(-1))

# The lower edge from the nose's underside to the lower fin's root, in the turned crop's px: the strongest colour step
# within 20 px of a prior read off the photo (the edge's measured y every 100 px), then lightly smoothed.
# the nose's underside, x < 230, where the photo's edge is too faint: an ellipse through the nose tip (85, 740, measured
# from the horizontal edge) and the measured lower edge further aft
_NX = np.arange(86, 230, 8)
_NY = 740 + 175 * np.sqrt(np.clip(1 - ((_NX - 400) / 315) ** 2, 0, 1))
PRIOR_X = list(_NX) + [230, 260, 290, 320, 350, 380, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1440]
PRIOR_Y = list(_NY) + [880, 884, 890, 898, 905, 910, 912, 920, 920, 917, 913, 902, 893, 875, 856, 832, 805, 794]
X0, X1 = 86, 1440
xs = np.arange(X0, X1)
prior = np.interp(xs, PRIOR_X, PRIOR_Y)
edge = np.array([int(p) - 20 + np.argmax(gy[int(p) - 20 : int(p) + 20, x]) + 0.5 for x, p in zip(xs, prior)])
edge = ni.median_filter(edge, 15, mode="nearest")
edge = ni.gaussian_filter1d(edge, 4, mode="nearest")
print("edge vs prior: max |d|", float(np.abs(edge - prior).max()))
yy = np.arange(H)[:, None]
top = np.array([np.where(solid[:, x])[0].min() if solid[:, x].any() else H for x in xs])
fillA = np.clip(edge[None, :] - yy + 0.5, 0, 1) * (yy >= top[None, :])
alpha[:, X0:X1] = np.where(yy > edge[None, :] + 1, alpha[:, X0:X1] * 0, np.maximum(alpha[:, X0:X1], fillA))
# colour under the rebuilt band: the nearest pixel that was solid in the key
src_solid = solid & (alpha > 0.97)
grey_raw = bp.grey(a)
g = np.where(src_solid, g, grey_raw)  # inside the rebuilt band the photo itself is right (it is the hull)
# a clean scissor-cut outline: the mask smoothed (no jaggies, specks or spurs on the key's edge), then 1 px of AA
m = alpha > 0.5
yy_, xx_ = np.mgrid[-4:5, -4:5]
m = ni.binary_opening(m, structure=xx_ * xx_ + yy_ * yy_ <= 16)  # the mooring line off the nose tip, thin spurs
m = ni.gaussian_filter(m.astype(np.float32), 3.0) > 0.5
lab, n = ni.label(m)
sizes = ni.sum(m, lab, range(1, n + 1))
m = lab == (np.argmax(sizes) + 1)
m = ni.binary_fill_holes(m)
alpha = ni.gaussian_filter(m.astype(np.float32), 0.7)
lab, n = ni.label(alpha > 0.05)
sizes = ni.sum(alpha > 0.05, lab, range(1, n + 1))
alpha = alpha * (lab == (np.argmax(sizes) + 1))
bp.save_rgba(OUT, g, alpha)
