"""SingleSubject (wip-taylor-swift, cut 3): tighten a cut-out's matte round light hair on a dark studio ground.

Apple Vision's foreground matte keeps a rim of the dark backdrop between the wisps (Einstein, Turner 1947). Inside a band
along the matte's edge, above `--below` (the shoulders), keep only pixels lighter than the backdrop. Writes a new mask PNG
for bake-photo.py --matte.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-taylor-swift/ss-hair-key.py \
      <in.jpg> <mask.png> <out_mask.png> [--band 140] [--below 0.55] [--lo 0.30] [--hi 0.45] [--protect cx,cy,r]

Einstein: --lo 0.16 --hi 0.3 --below 0.46 --protect 0.25,0.45,0.06
"""
import argparse

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, binary_opening, distance_transform_edt, gaussian_filter, label

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("mask")
p.add_argument("out")
p.add_argument("--band", type=float, default=140, help="px of the matte's edge (at 1600 px) that the key works in")
p.add_argument("--below", type=float, default=0.55, help="the key stops at this fraction of the height (the shoulders)")
p.add_argument("--lo", type=float, default=0.30)
p.add_argument("--hi", type=float, default=0.45)
p.add_argument("--protect", action="append", default=[], help="cx,cy,r as fractions of the width/height: no key inside (a shadowed ear)")
a = p.parse_args()

im = Image.open(a.src).convert("L")
mt = Image.open(a.mask).convert("L").resize(im.size, Image.BICUBIC)
full = im.size
s = 1600 / max(full)
size = (round(full[0] * s), round(full[1] * s))
g = np.asarray(im.resize(size, Image.LANCZOS), dtype=np.float32) / 255
m = np.asarray(mt.resize(size, Image.LANCZOS), dtype=np.float32) / 255
inside = m > 0.5
dist = distance_transform_edt(inside)
band = (dist < a.band) & inside
rows = np.arange(size[1])[:, None] < a.below * size[1]
zone = band & rows
yy, xx = np.mgrid[0 : size[1], 0 : size[0]]
for pr in a.protect:
    cx, cy, r = (float(v) for v in pr.split(","))
    zone &= (xx - cx * size[0]) ** 2 + (yy - cy * size[1]) ** 2 > (r * size[0]) ** 2
gs = gaussian_filter(g, 1.2)
keep = np.clip((gs - a.lo) / (a.hi - a.lo), 0, 1)
m2 = np.where(zone, m * keep, m)
# drop specks: keep the largest piece
b = binary_opening(m2 > 0.5, iterations=2)
lab, n = label(b)
if n > 1:
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    b = lab == sizes.argmax()
b = binary_fill_holes(b)
m3 = gaussian_filter(b.astype(np.float32), 1.0)
Image.fromarray((m3 * 255 + 0.5).astype(np.uint8), "L").resize(full, Image.BICUBIC).save(a.out)
print(a.out, full)
