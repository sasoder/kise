#!/usr/bin/env python3
"""EighteenHundredCloser (mikkel-trailer): the close level of detail of the planet's limb.

Warps the NASA ISS limb photo (assets-src/mikkel-trailer/plate_space_earthlimb_iss.jpg, "Cloudscape Over the
Philippine Sea", public domain) into an annular SECTOR of the Earth disc: the photo's horizon (fitted per column)
becomes the disc's rim, a crisp circle arc; the cloud deck below it runs inward. Angle <-> photo x, depth <-> photo y.
The inner edge and the two ends feather out, so it lies over the full-disc photo as the same planet seen closer.

Output: public/mikkel-trailer/limb_band.png, greyscale + alpha. Geometry (printed, and mirrored in the component):
  R_PX   the rim radius in output px (the image is 1:1 at that screen radius)
  HALF   the half-angle of the sector, degrees (feathered over the last FEATHER_DEG)
  T      the band's radial thickness as a fraction of R
The arc's centre sits at (W/2, R_PX + PAD) in image px, i.e. below the image; the rim's top at y = PAD.

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-limb.py
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ni

SRC = "assets-src/mikkel-trailer/plate_space_earthlimb_iss.jpg"
DST = "public/mikkel-trailer/limb_band.png"
R_PX = 4200.0
HALF = 24.0
FEATHER_DEG = 7.0
T = 0.17
INNER_FEATHER = 0.35  # fraction of the band thickness that feathers out on the inside
DEPTH = 850.0  # photo px of cloud deck below the horizon used for the band's thickness
PAD = 4

a = np.asarray(Image.open(SRC).convert("L")).astype(np.float32)
Hs, Ws = a.shape

# the horizon per column: first y where the deck is bright (smoothed), then a quadratic fit
sm = ni.uniform_filter(a, size=5)
xs = np.arange(0, Ws, 10)
hy = []
for x in xs:
    col = sm[:, x]
    ys = np.where(col > 150)[0]
    hy.append(ys[0] if len(ys) else np.nan)
hy = np.array(hy, dtype=float)
ok = ~np.isnan(hy)
coef = np.polyfit(xs[ok], hy[ok], 2)
res = hy[ok] - np.polyval(coef, xs[ok])
print("horizon fit", coef, "resid px p95", np.percentile(np.abs(res), 95))
horizon = lambda x: np.polyval(coef, x)
INSET = 10.0  # start a little below the haze line so the rim is the deck itself

# output geometry
half = np.deg2rad(HALF)
w_out = int(np.ceil(2 * R_PX * np.sin(half))) + 2 * PAD
inner = R_PX * (1 - T)
h_out = int(np.ceil(R_PX - inner * np.cos(half))) + 2 * PAD
cx, cy = w_out / 2.0, R_PX + PAD
print("out", w_out, h_out, "bytes", w_out * h_out * 4 * 4 / 1e9, "GB float32 x4")

yy, xx = np.mgrid[0:h_out, 0:w_out].astype(np.float32)
dx = xx - cx
dy = cy - yy
r = np.sqrt(dx * dx + dy * dy)
ang = np.arctan2(dx, dy)  # 0 = straight up, + = clockwise
# photo coords
u = (ang + half) / (2 * half)  # 0..1 left..right
px = u * (Ws - 1)
depth = (R_PX - r) / (R_PX * T)  # 0 at rim, 1 at inner edge
py = horizon(px) + INSET + depth * DEPTH
val = ni.map_coordinates(a, [py.ravel(), px.ravel()], order=1, mode="nearest").reshape(r.shape)

# alpha: crisp rim (1.2 px AA), feathered inner edge and ends
rim = np.clip((R_PX - r) / 1.2 + 0.5, 0, 1)
inn = np.clip((1 - depth) / INNER_FEATHER, 0, 1)
inn = inn * inn * (3 - 2 * inn)
endf = np.clip((half - np.abs(ang)) / np.deg2rad(FEATHER_DEG), 0, 1)
endf = endf * endf * (3 - 2 * endf)
alpha = rim * inn * endf * (depth >= 0)
out = np.dstack([val, val, val, alpha * 255]).clip(0, 255).round().astype(np.uint8)
Image.fromarray(out, "RGBA").save(DST, optimize=True)
print(DST, w_out, h_out, f"R_PX={R_PX} HALF={HALF} T={T} PAD={PAD}")
