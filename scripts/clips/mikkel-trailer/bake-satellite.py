#!/usr/bin/env python3
"""EighteenHundredCloser: the geostationary satellite as a cut-out -> public/mikkel-trailer/geo_sat.png.

Source: Wideband Global SATCOM (WGS), U.S. Strategic Command, public domain (Wikimedia Commons
"Wideband_Global_SATCOM.png", 3840 px; the image sub-agent's geo_sat_01.jpg, copied to
assets-src/mikkel-trailer/geo_sat_wgs.jpg). Isolated on white: the white connected to the frame edge is keyed out, the
thin hinge gaps between the wing panels are closed (one solid wing each side), the wings are turned level (their angle
measured from the mask), graded to light silver and the picture is mirrored so the longer wing points LEFT (toward the Earth). Greyscale + alpha.
Prints the size and the body's centre as fractions of the output (mirrored in the component's SAT).

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-satellite.py
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ni

SRC = "assets-src/mikkel-trailer/geo_sat_wgs.jpg"
OUT = "public/mikkel-trailer/geo_sat.png"
a = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W = a.shape[:2]
dist = np.sqrt(((255 - a) ** 2).sum(-1))
cand = dist < 14
lab, _ = ni.label(cand)
border = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])
bg = np.isin(lab, border[border > 0])
obj = ~bg
# the hinge gaps between panels: a closing along the wing (they are a few px wide at 3840)
yy_, xx_ = np.mgrid[-9:10, -9:10]
obj = ni.binary_closing(np.pad(obj, 12), structure=xx_ * xx_ + yy_ * yy_ <= 81)[12:-12, 12:-12]
obj = ni.binary_fill_holes(obj)
lab, n = ni.label(obj)
sizes = ni.sum(obj, lab, range(1, n + 1))
obj = np.isin(lab, np.flatnonzero(sizes > 0.002 * sizes.max()) + 1)
# the wing angle: principal axis of the mask
ys, xs = np.nonzero(obj)
c = np.cov(np.stack([xs, ys]).astype(np.float64))
ev, evec = np.linalg.eigh(c)
vx, vy = evec[:, np.argmax(ev)]
ang = np.degrees(np.arctan2(vy, vx))
if ang > 90:
    ang -= 180
if ang < -90:
    ang += 180
print("wing angle (deg, image y down)", round(ang, 2))
# soft edge from the white distance, decontaminated colour
soft = np.clip((dist - 6) / 30, 0, 1)
alpha = np.where(ni.binary_erosion(obj, iterations=2), 1.0, obj * np.maximum(soft, 0.0))
alpha = ni.gaussian_filter(alpha.astype(np.float32), 0.7) * ni.binary_dilation(obj, iterations=2)
g = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
solid = alpha > 0.97
_, (iy, ix) = ni.distance_transform_edt(~solid, return_indices=True)
g = np.where(solid, g, g[iy, ix])
# the style's light ink: lifted to light silver (the dark solar cells become mid-grey with their cell lines kept, the body
# bright), so it belongs with the airship's lit side rather than reading as a dark bar
g = 70 + 185 * (np.clip(g, 0, 255) / 255) ** 0.55
rgba = np.dstack([g, g, g, alpha * 255]).clip(0, 255).astype(np.uint8)
im = Image.fromarray(rgba, "RGBA").rotate(ang, resample=Image.BICUBIC, expand=True)  # PIL turns anticlockwise
im = im.transpose(Image.FLIP_LEFT_RIGHT)
arr = np.asarray(im).astype(np.float32)
al = arr[..., 3]
ys, xs = np.nonzero(al > 5)
pad = 8
arr = arr[max(ys.min() - pad, 0) : ys.max() + pad + 1, max(xs.min() - pad, 0) : xs.max() + pad + 1]
im = Image.fromarray(arr.astype(np.uint8), "RGBA")
if im.width > 1800:
    im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
im.save(OUT, optimize=True)
al = np.asarray(im)[..., 3] > 128
colh = ni.uniform_filter1d(al.sum(0).astype(np.float32), 15)
bx = int(np.argmax(colh))
rows = np.nonzero(al[:, max(bx - 20, 0) : bx + 20].any(1))[0]
wing_rows = np.nonzero(al[:, 40])[0]
print(OUT, im.width, im.height, f"aspect {im.width / im.height:.4f}", f"body x {bx / im.width:.4f}",
      f"body y {(rows.min() + rows.max()) / 2 / im.height:.4f}", f"left wing tip y {wing_rows.mean() / im.height:.4f}")
