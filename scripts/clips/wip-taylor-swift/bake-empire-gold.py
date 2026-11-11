"""Gold leaf for EmpireOfHerself (wip-taylor-swift, cut 42): public/wip-taylor-swift/empire_gold.jpg, a seamless tile of
laid gold leaf (square leaves with faint overlapping seams, each leaf a slightly different tone and lustre, a fine
burnish grain). Used as the frames' fill; the one real colour in the clip.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-taylor-swift/bake-empire-gold.py [ref.jpg]

With a reference photo of a real gilded icon, its gold's median colour and spread set the palette (sampled from pixels
that read as gold: warm hue, high saturation, mid-high value); without one, a measured leaf gold (#C9A043 body).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "wip-taylor-swift" / "empire_gold.jpg"
N = 512  # tile px
LEAF = 64  # one leaf, tile px (8 x 8 leaves per tile, so it tiles)
rng = np.random.default_rng(42)

base = np.array([201, 160, 67], dtype=np.float64)  # body
lo = np.array([128, 92, 30], dtype=np.float64)  # the shadowed leaf
hi = np.array([246, 222, 150], dtype=np.float64)  # the lit leaf
if len(sys.argv) > 1:
    ref = np.asarray(Image.open(sys.argv[1]).convert("RGB").resize((400, 400)), dtype=np.float64)
    r, g, b = ref[..., 0], ref[..., 1], ref[..., 2]
    mx = ref.max(-1)
    sat = (mx - ref.min(-1)) / np.maximum(mx, 1)
    gold = (r > g) & (g > b) & (sat > 0.35) & (mx > 165) & ((r - g) < 55) & ((g - b) > 45)
    px = ref[gold]
    if len(px) > 500:
        base = np.median(px, 0)
        lo = np.percentile(px, 8, axis=0)
        hi = np.percentile(px, 96, axis=0)
        print("gold from reference:", base.round(), lo.round(), hi.round(), len(px))

# per-leaf tone (lustre) in -1..1, laid with a small offset per row, the way leaf is laid
n = N // LEAF
tone = np.zeros((N, N))
for j in range(n):
    off = int(rng.integers(0, LEAF))
    for i in range(n + 1):
        t = rng.normal(0, 0.45)
        x0 = (i * LEAF + off) % N
        xs = (np.arange(LEAF) + x0) % N
        tone[j * LEAF:(j + 1) * LEAF][:, xs] = t
tone = gaussian_filter(tone, 1.2, mode="wrap")
# seams: a faint dark line where leaves overlap
seam = np.zeros((N, N))
for j in range(n):
    seam[j * LEAF, :] = 1
    seam[(j * LEAF + 1) % N, :] = 0.5
seam = gaussian_filter(seam, 0.7, mode="wrap")
# burnish grain: fine streaks along x, and a broad slow lustre
grain = gaussian_filter(rng.normal(0, 1, (N, N)), (0.6, 3.5), mode="wrap")
grain /= grain.std()
broad = gaussian_filter(rng.normal(0, 1, (N, N)), 40, mode="wrap")
broad /= broad.std()

v = 0.18 * tone + 0.06 * grain + 0.22 * broad - 0.35 * seam  # -1 .. 1 roughly
v = np.clip(v, -1, 1)[..., None]
img = np.where(v >= 0, base + (hi - base) * v, base + (base - lo) * v)
OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(OUT, quality=92)
print(OUT, N, "x", N)
