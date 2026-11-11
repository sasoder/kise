"""The globe's print for wip-biblical (cut 43 owns it; cut 73 reuses it): a real Earth (NASA Blue Marble, equirectangular)
turned into two ink densities that globeShared.tsx's EarthPrint lays onto the page at render time.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-globe-43.py \
      <blue_marble_equirect.jpg> public/wip-biblical/gl_earth_ink.png [--width 8192]

Output: an equirectangular RGB PNG (lon -180..180 left to right, lat 90..-90 top to bottom).
  R = deep-green ink density of the land (0 bare paper .. 255 solid ink): the photo's own relief, greyscaled and levelled,
      so forests print dark, deserts light, ice almost bare paper; a slightly firmer coastline.
  G = density of the ocean's pale wash (0 on land).
  B = unused.
The land/sea split comes from the photo's colour (water is the dark blue pixels), cleaned of specks.
"""
import argparse

import numpy as np
from PIL import Image
from scipy.ndimage import binary_closing, binary_opening, gaussian_filter, label

Image.MAX_IMAGE_PIXELS = None

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("out")
p.add_argument("--width", type=int, default=8192)
a = p.parse_args()

im = Image.open(a.src).convert("RGB")
W = a.width
H = W // 2
if im.size != (W, H):
    im = im.resize((W, H), Image.LANCZOS)
# float32 throughout: 8192 x 4096 x 3 x 4 bytes = 400 MB at most
rgb = np.asarray(im, dtype=np.float32) / 255
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
lum = 0.30 * r + 0.59 * g + 0.11 * b

# water: blue clearly over red and green (the topo-bathy's shelves are light blue; ice and snow are near grey)
water = ((b > r + 0.06) & (b >= g + 0.01) & (lum < 0.72)) | ((lum < 0.13) & (b > r))
water = binary_opening(water, iterations=2)
water = binary_closing(water, iterations=2)
del r, g, b, rgb
# drop tiny land specks and tiny lakes so the coast reads at the settled size
lab, n = label(~water)
sizes = np.bincount(lab.ravel())
land = np.isin(lab, np.nonzero(sizes >= 220)[0]) & (lab > 0)
lab, n = label(~land)
sizes = np.bincount(lab.ravel())
land = ~(np.isin(lab, np.nonzero(sizes >= 900)[0]) & (lab > 0))
del lab

# land density: the photo's own tone, levelled on land pixels, inverted (dark ground = more ink)
sel = lum[land]
lo, hi = np.percentile(sel, [1.0, 99.0])
t = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1)
# local contrast so the relief holds when small
t = np.clip(t + 0.35 * (t - gaussian_filter(t, W / 1400)), 0, 1)
dens = 0.30 + 0.62 * (1 - t) ** 1.15
# a firmer coast: one soft line just inside the land's edge
edge = gaussian_filter(land.astype(np.float32), W / 4096 * 1.6)
coast = np.clip(1 - np.abs(edge - 0.5) * 2.2, 0, 1) * land
dens = np.clip(dens + 0.22 * coast, 0, 1)
# ice and snow print as almost bare paper
dens = np.where(lum > 0.82, dens * np.clip((0.95 - lum) / 0.13, 0.12, 1), dens)
landA = gaussian_filter(land.astype(np.float32), 0.7)
R = dens * landA
# the ocean wash: the topo-bathy's own depth (darker water = deeper), softened, so shelves print lighter than the abyss
ol = lum[~land]
o_lo, o_hi = np.percentile(ol, [2.0, 98.0])
deep = 1 - np.clip((lum - o_lo) / max(o_hi - o_lo, 1e-3), 0, 1)
deep = gaussian_filter(np.where(land, 0.0, deep).astype(np.float32), W / 2400)
G = (0.42 + 0.58 * deep ** 0.8) * (1 - landA)

out = np.zeros((H, W, 3), dtype=np.uint8)
out[..., 0] = np.round(R * 255).astype(np.uint8)
out[..., 1] = np.round(G * 255).astype(np.uint8)
Image.fromarray(out).save(a.out, optimize=True)
print(f"{a.out}: {W}x{H}, land {land.mean() * 100:.1f}% of pixels")
