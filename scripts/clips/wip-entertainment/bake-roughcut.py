"""A real object cut out BY HAND for the messy variant (wip-entertainment, notes/COMMON.md): the kit's one grade
(as scripts/clips/wip-anthropic/bake-photo.py), then a pair of scissors round the matte: straight snips with corners,
an uneven white border (6-18 world px at the size it will be shown), now and then a snip a little into the subject.
The border is baked into the PNG's alpha; messyShared.tsx's <RoughCutPrint> (baked mode) adds the print grade, grain,
crooked angle and contact shadow at render time.

  # the matte, once per photo (fg for objects, person for people); skip it for a PNG that already has alpha
  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <in.jpg> <scratch>/mask.png fg
  uv run --offline --with numpy --with pillow --with scipy --with opencv-python-headless python \
      scripts/clips/wip-entertainment/bake-roughcut.py <in.jpg|png> public/wip-entertainment/<name>.png \
      --show-w 380 [--matte <scratch>/mask.png] [--crop x0,y0,x1,y1] [--max 1400] [--mid 0.46] [--border 6,18] \
      [--seed <name>] [--nibble 0.12] [--rect] [--json <scratch>/<name>.json]

--show-w   the subject's width (its matte's bounding box) in world px as it will be shown; sets the border's px.
--rect     no matte: the photo's own rectangle is the subject (a ticket, a sleeve photographed flat).
Prints the PNG's size and aspect, and `w` = the world width to give RoughCutPrint so the subject is --show-w wide.
"""
import argparse
import json

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy.ndimage import binary_erosion, gaussian_filter

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("out")
p.add_argument("--matte")
p.add_argument("--crop")
p.add_argument("--max", type=int, default=1400)
p.add_argument("--mid", type=float, default=0.46)
p.add_argument("--show-w", type=float, required=True)
p.add_argument("--border", default="6,18")
p.add_argument("--seed", default=None)
p.add_argument("--nibble", type=float, default=0.12, help="share of snips that cut a little into the subject")
p.add_argument("--rect", action="store_true")
p.add_argument("--json")
a = p.parse_args()
rng = np.random.default_rng(sum((i + 1) * ord(ch) for i, ch in enumerate(a.seed or a.out.rsplit("/", 1)[-1])))

src = ImageOps.exif_transpose(Image.open(a.src))
has_alpha = src.mode in ("RGBA", "LA") or (src.mode == "P" and "transparency" in src.info)
im = src.convert("RGB")
if a.matte:
    mt = Image.open(a.matte).convert("L").resize(im.size, Image.BICUBIC)
elif has_alpha and not a.rect:
    mt = src.convert("RGBA").split()[3]
else:
    mt = None
if a.crop:
    box = tuple(int(v) for v in a.crop.split(","))
    im = im.crop(box)
    mt = mt.crop(box) if mt else None
if max(im.size) > a.max:
    s = a.max / max(im.size)
    size = (round(im.width * s), round(im.height * s))
    im = im.resize(size, Image.LANCZOS)
    mt = mt.resize(size, Image.LANCZOS) if mt else None

# -- the grade (bake-photo.py's, unchanged) --
rgb = np.asarray(im, dtype=np.float64) / 255
g = 0.30 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
alpha = np.asarray(mt, dtype=np.float64) / 255 if mt else np.ones(g.shape)
if mt:
    core = binary_erosion(alpha > 0.5, iterations=1)
    alpha = np.clip((gaussian_filter(core.astype(np.float64), 0.8) - 0.15) / 0.7, 0, 1)
sel = g[alpha > 0.5] if (alpha > 0.5).any() else g
lo, hi = np.percentile(sel, [0.6, 99.4])
g = np.clip((g - lo) / max(hi - lo, 1e-3), 0, 1)
med = float(np.median(g[alpha > 0.5])) if (alpha > 0.5).any() else 0.5
gamma = np.log(a.mid) / np.log(np.clip(med, 0.05, 0.95))
g = g ** np.clip(gamma, 0.45, 2.2)
r = max(g.shape) / 180
g = np.clip(g + 0.45 * (g - gaussian_filter(g, r)), 0, 1)
g = g * g * (3 - 2 * g) * 0.45 + g * 0.55

# -- the scissors --
solid = alpha > 0.5
ys, xs = np.where(solid)
sx0, sx1, sy0, sy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
px_per_world = (sx1 - sx0) / a.show_w
b0, b1 = (float(v) * px_per_world for v in a.border.split(","))
pad = int(np.ceil(b1 * 2.5)) + 4
H, W = g.shape
canvas = np.zeros((H + 2 * pad, W + 2 * pad), np.uint8)
canvas[pad : pad + H, pad : pad + W] = solid.astype(np.uint8) * 255
k = int(round(b1))
fat = cv2.dilate(canvas, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1)))
cs, _ = cv2.findContours(fat, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cs, key=cv2.contourArea)
# straight snips: the dilated outline simplified, so every chord cuts in by at most (b1 - b0)
poly = cv2.approxPolyDP(c, epsilon=max(1.0, 0.85 * (b1 - b0)), closed=True)[:, 0, :].astype(np.float64)
# every vertex its own distance out, and now and then a snip into the subject
cx, cy = poly[:, 0].mean(), poly[:, 1].mean()
n = len(poly)
out = []
for i in range(n):
    prev, cur, nxt = poly[i - 1], poly[i], poly[(i + 1) % n]
    t = nxt - prev
    nrm = np.array([t[1], -t[0]]) / max(np.hypot(*t), 1e-6)
    if np.dot(nrm, cur - [cx, cy]) < 0:
        nrm = -nrm
    d = rng.uniform(-0.2, 0.15) * (b1 - b0)
    if rng.uniform() < a.nibble:
        d = -(b1 + rng.uniform(0.15, 0.6) * b0)
    out.append(cur + nrm * d)
poly = np.array(out)

SS = 4
cut = Image.new("L", (canvas.shape[1] * SS, canvas.shape[0] * SS), 0)
ImageDraw.Draw(cut).polygon([(float(x * SS), float(y * SS)) for x, y in poly], fill=255)
cut = np.asarray(cut.resize((canvas.shape[1], canvas.shape[0]), Image.LANCZOS), dtype=np.float64) / 255

grey = np.ones(canvas.shape)
asub = np.zeros(canvas.shape)
grey[pad : pad + H, pad : pad + W] = g
asub[pad : pad + H, pad : pad + W] = alpha
tone = grey * asub + 1.0 * (1 - asub)  # the subject on its white border
# trim to the cut
ys, xs = np.where(cut > 0.01)
y0, y1, x0, x1 = max(0, ys.min() - 2), ys.max() + 3, max(0, xs.min() - 2), xs.max() + 3
tone, cutc = tone[y0:y1, x0:x1], cut[y0:y1, x0:x1]
rgba = np.dstack([tone, tone, tone, cutc])
Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(a.out, optimize=True)
oh, ow = tone.shape
w_world = ow / px_per_world
print(f"{a.out}: {ow} x {oh}, aspect {ow / oh:.4f}; RoughCutPrint w {w_world:.1f} for a subject {a.show_w:g} wide; "
      f"subject box in the PNG x {sx0 + pad - x0}..{sx1 + pad - x0}, y {sy0 + pad - y0}..{sy1 + pad - y0}; {len(poly)} snips")
if a.json:
    json.dump(
        {
            "w": ow,
            "h": oh,
            "aspect": ow / oh,
            "worldW": w_world,
            "subject": [int(sx0 + pad - x0), int(sy0 + pad - y0), int(sx1 + pad - x0), int(sy1 + pad - y0)],
            "cut": [[round(float(x - x0), 1), round(float(y - y0), 1)] for x, y in poly],
        },
        open(a.json, "w"),
    )
