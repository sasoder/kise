"""The messy variant's sheet for wip-entertainment (COMMON.md): the kit's off-white printed paper (#FFF7F4), with a
heavier tooth, more scuffs, a few rubbed smudges and one faint fold crease. Procedural and seeded; no third-party art.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-entertainment/bake-messy-paper.py

Builds the kit's own sheet with scripts/clips/wip-anthropic/bake-paper.py's paper_sheet("offwhite") (into a scratch
dir, never over the kit's files), then roughs it up and writes public/wip-entertainment/paper_offwhite_messy.jpg
(2200 x 3800, the kit's PAPER_W x PAPER_H, so the kit's sheet geometry holds). The mean stays on #FFF7F4.
"""
import importlib.util
import os
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, "public", "wip-entertainment")
SEED = 20261106

spec = importlib.util.spec_from_file_location("bake_paper", os.path.join(ROOT, "scripts", "clips", "wip-anthropic", "bake-paper.py"))
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

tmp = tempfile.mkdtemp(prefix="messy-paper-")
bp.PUBLIC = tmp  # paper_sheet writes here, not into public/wip-anthropic
bp.INDIGO_ARR = np.array([38.0, 34.0, 33.0])  # the stray specks in near-black ink: red is the only colour in this clip
bp.paper_sheet("offwhite")
im = Image.open(os.path.join(tmp, "paper_offwhite.jpg")).convert("RGB")
field = np.asarray(im, dtype=np.float32)
h, w = field.shape[:2]
rng = np.random.default_rng(SEED)
base = bp.rgb("#FFF7F4").astype(np.float32)

# 1. a heavier tooth: more of the mid grain, a little warm
g = gaussian_filter(rng.standard_normal((h, w)).astype(np.float32), 0.7)
g /= g.std()
field += (2.2 * g)[..., None] * np.array([1.0, 0.97, 0.92], dtype=np.float32)
del g

# 2. more scuffs: dry rubbed streaks, mostly darker, in loose clusters
scuff = Image.new("L", (w, h), 128)
d = ImageDraw.Draw(scuff)
for _ in range(60):
    cx, cy = rng.uniform(0, w), rng.uniform(0, h)
    a0 = rng.uniform(0, np.pi)
    tone = rng.choice([-1, -1, -1, 1])
    for _k in range(int(rng.integers(4, 16))):
        x, y = cx + rng.normal(0, 34), cy + rng.normal(0, 52)
        a = a0 + rng.normal(0, 0.12)
        pts = [(x, y)]
        for _s in range(int(rng.uniform(18, 110) / 5) + 2):
            a += rng.normal(0, 0.09)
            x, y = x + 5 * np.cos(a), y + 5 * np.sin(a)
            pts.append((x, y))
        d.line(pts, fill=int(128 + tone * rng.uniform(14, 75)), width=1)
s = (np.asarray(scuff.filter(ImageFilter.GaussianBlur(1.0)), dtype=np.float32) - 128) / 70
field += (16 * s)[..., None] * np.array([1.0, 0.96, 0.86], dtype=np.float32)
del s, scuff

# 3. a few rubbed smudges: soft greyish patches where a hand passed (graphite-grey, very faint)
sm = np.zeros((h // 4, w // 4), np.float32)
for _ in range(9):
    cx, cy = rng.uniform(0, w / 4), rng.uniform(0, h / 4)
    rx, ry = rng.uniform(20, 70), rng.uniform(8, 26)
    yy, xx = np.ogrid[: h // 4, : w // 4]
    ang = rng.uniform(0, np.pi)
    u = ((xx - cx) * np.cos(ang) + (yy - cy) * np.sin(ang)) / rx
    v = (-(xx - cx) * np.sin(ang) + (yy - cy) * np.cos(ang)) / ry
    sm += np.exp(-(u * u + v * v) * 1.6).astype(np.float32) * rng.uniform(0.5, 1.0)
tex = gaussian_filter(rng.standard_normal((h // 4, w // 4)).astype(np.float32), 1.2)
sm = np.clip(sm * (0.75 + 0.35 * tex / tex.std()), 0, None)
sm = np.asarray(Image.fromarray(sm).resize((w, h), Image.BICUBIC))
field -= (7.5 * sm)[..., None] * np.array([1.0, 1.0, 0.92], dtype=np.float32)
del sm, tex

# 4. one faint fold crease, slightly off the horizontal, a third of the way down the frame at rest
#    (sheet rest: frame top-left at sheet px (560, 940)). A dark valley with a light ridge on one side, broken in places.
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
y_at = 940 + 610 + (xx - 1100) * np.tan(np.radians(-1.6)) + 3.0 * np.sin(xx / 310.0)
dist = yy - y_at
del yy
valley = np.exp(-(dist / 1.6) ** 2)
ridge = np.exp(-((dist + 3.2) / 2.4) ** 2)
broken = 0.55 + 0.45 * np.asarray(
    Image.fromarray(gaussian_filter(rng.standard_normal((1, w // 8)).astype(np.float32), 6)[0][None, :]).resize((w, 1), Image.BICUBIC)
)[0]
broken = np.clip(broken / max(broken.max(), 1e-3), 0.15, 1.0)[None, :]
field += ((-9.0 * valley + 4.5 * ridge) * broken)[..., None]
del valley, ridge, dist, xx

# the mean lands back on the paper
field += (base - field.reshape(-1, 3).mean(0, dtype=np.float64)).astype(np.float32)  # float64: a float32 column sum drifts
os.makedirs(OUT, exist_ok=True)
out = os.path.join(OUT, "paper_offwhite_messy.jpg")
Image.fromarray(np.clip(field, 0, 255).astype(np.uint8)).save(out, format="JPEG", quality=90, subsampling=0)
print(out, os.path.getsize(out) // 1024, "KB; mean", np.asarray(Image.open(out), dtype=np.float64).reshape(-1, 3).mean(0).round(2))
