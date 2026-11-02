"""One grade for every real photograph in a Works in Progress cut, so different sources match: greyscale, percentile
levels to the same black and white, the mid-tone pulled to the same grey, a little local contrast. Optional matte
(Apple Vision works offline: scripts/clips/neal-stephenson-trailer/neal-matte.swift) becomes the PNG's alpha.

  # the matte, once per photo (mode fg for objects, person for people)
  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <in.jpg> <scratch>/mask.png fg
  # the graded print
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-photo.py \
      <in.jpg> public/wip-anthropic/<name>.png [--matte <scratch>/mask.png] [--max 1600] [--crop x0,y0,x1,y1] [--mid 0.46]

Prints w, h and the aspect for CutOut. The kit's CutOut / PrintPhoto then add the shared print finish at render time
(duotone black and white of the page, print grain), so a baked and an unbaked photo sit on the page the same way;
only a baked one has matched levels.
"""
import argparse

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import binary_erosion, gaussian_filter

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("out")
p.add_argument("--matte")
p.add_argument("--max", type=int, default=1600)
p.add_argument("--crop")
p.add_argument("--mid", type=float, default=0.46, help="the median of the print, 0..1")
a = p.parse_args()

im = ImageOps.exif_transpose(Image.open(a.src)).convert("RGB")
mt = Image.open(a.matte).convert("L").resize(im.size, Image.BICUBIC) if a.matte else None
if a.crop:
    box = tuple(int(v) for v in a.crop.split(","))
    im = im.crop(box)
    mt = mt.crop(box) if mt else None
if max(im.size) > a.max:
    s = a.max / max(im.size)
    size = (round(im.width * s), round(im.height * s))
    im = im.resize(size, Image.LANCZOS)
    mt = mt.resize(size, Image.LANCZOS) if mt else None

rgb = np.asarray(im, dtype=np.float64) / 255
g = 0.30 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
alpha = np.asarray(mt, dtype=np.float64) / 255 if mt else np.ones(g.shape)
# a soft matte edge stays soft, but a pale halo of the old background goes: pull the matte in by a pixel, then steepen
if mt:
    core = binary_erosion(alpha > 0.5, iterations=1)
    alpha = np.clip((gaussian_filter(core.astype(np.float64), 0.8) - 0.15) / 0.7, 0, 1)
sel = g[alpha > 0.5] if (alpha > 0.5).any() else g
lo, hi = np.percentile(sel, [0.6, 99.4])
g = np.clip((g - lo) / max(hi - lo, 1e-3), 0, 1)
med = float(np.median(g[alpha > 0.5])) if (alpha > 0.5).any() else 0.5
gamma = np.log(a.mid) / np.log(np.clip(med, 0.05, 0.95))
g = g ** np.clip(gamma, 0.45, 2.2)
# local contrast, so a soft scan holds on a phone
r = max(g.shape) / 180
g = np.clip(g + 0.45 * (g - gaussian_filter(g, r)), 0, 1)
# a printed S-curve
g = g * g * (3 - 2 * g) * 0.45 + g * 0.55

out = np.dstack([g, g, g, alpha])
Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA").save(a.out, optimize=True)
print(f"{a.out}: {im.width} x {im.height}, aspect {im.width / im.height:.4f}, median {np.median(g[alpha > 0.5]):.3f}")
