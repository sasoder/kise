"""CarnegieLibraries' photographs, through the kit's one grade (bake-photo.py).

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <assets_raw>/carnegie/CarnegieApril1905.jpg <scratch>/mask_april.png person
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-carnegie.py <assets_raw> <scratch>

Carnegie: Vision's matte is fuzzy on the dark coat against the dark bookcase, so it is thresholded and smoothed into one
clean scissor line. Below his hands (the frame's last 170 px in the wide) the print holds a lap, a chair and the
photographer's signature, then ends short of the frame's bottom: those rows pass under an uneven edge into his own coat's
cloth, going into shadow, so his body runs off frame (details at the second pass below). The man himself, hands included,
is untouched. Libraries: each postcard cropped to the
building, without its caption, handwriting or publisher's line.
"""
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, binary_opening, distance_transform_edt, gaussian_filter

raw, scratch = sys.argv[1], sys.argv[2]
OUT = "public/wip-anthropic"
PAD = 420  # source rows reflected at the bottom

im = Image.open(f"{raw}/carnegie/CarnegieApril1905.jpg").convert("RGB")
mt = np.asarray(Image.open(f"{scratch}/mask_april.png").convert("L").resize(im.size, Image.BICUBIC), dtype=np.float64) / 255
sm = 0.002 * im.width  # scale
a = gaussian_filter(mt, 5 * sm) > 0.55
a = binary_fill_holes(a)
a = binary_opening(a, iterations=max(1, int(4 * sm)))
a = gaussian_filter(a.astype(np.float64), 5 * sm) > 0.5
rgb = np.asarray(im, dtype=np.float64)
rgb = np.concatenate([rgb, rgb[-PAD:][::-1]], axis=0)
rgb_open = rgb.copy()
a = np.concatenate([a, a[-PAD:][::-1]], axis=0)
H = rgb.shape[0]
# the sink: fades to black from just under the hands; the outline's rows fill in solid and then run straight down
y0, y1 = int(0.835 * H), int(0.905 * H)
ramp = np.clip((np.arange(H) - y0) / (y1 - y0), 0, 1) ** 0.7
rgb = rgb * (1 - ramp[:, None, None] * 0.995)
filled = a.copy()
for y in range(int(0.79 * H), H):
    xs = np.where(a[min(y, y1)])[0]
    if len(xs):
        filled[y, xs.min() : xs.max() + 1] = True
# the gap between hands and lap: it was the bright chair behind him, now the same dark
gap = gaussian_filter((filled & ~a).astype(np.float64), 3 * sm)
rgb = rgb * (1 - np.clip(gap * 1.6, 0, 1)[..., None] * 0.97)
gap_hard = filled & ~a
a = filled
rgb = rgb.astype(np.uint8)
Image.fromarray(rgb).save(f"{scratch}/carnegie_pad.jpg", quality=96)
Image.fromarray((a * 255).astype(np.uint8)).save(f"{scratch}/carnegie_cutline.png")


def bake(src, out, *args):
    subprocess.run([sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", src, f"{out}.png", *args], check=True)


# the graded intermediate stays in the scratch folder; only the finished print goes to public/
bake(f"{scratch}/carnegie_pad.jpg", f"{scratch}/carnegie_bust", "--matte", f"{scratch}/carnegie_cutline.png", "--max", "3300", "--mid", "0.30")

# The print finish, baked: the kit's CutOut filter is 38 megapixels of turbulence at this close-up (a frame timed out at
# 33 s), so its recipe runs here once: the page's black and white, the stipple, a hand-cut stock border, the contact shadow.
BUST_WORLD_W = 1032  # the cut's world width of the print: border and shadow are given in world px, as on CutOut
b = Image.open(f"{scratch}/carnegie_bust.png")
g, al = np.asarray(b.getchannel("R"), dtype=np.float64) / 255, np.asarray(b.getchannel("A"), dtype=np.float64) / 255

# The bottom, second pass. The sink above fixes the whole print's levels, so it stays as the grade's input and everything
# above the lap is left exactly as graded. Below the hands the print is regraded from the open photo: under an uneven edge
# it passes into the real cloth of his own coat (a patch of the sleeve, mirrored), so the scan's black edge, the signature
# and the bright lap are never seen and the frame's bottom is textured cloth going into shadow, with no line across it.
rows, cols = np.indices(rgb_open.shape[:2])
n0, n1 = rows.shape
patch = rgb_open[int(0.45 * n0) : int(0.62 * n0), int(0.08 * n1) : int(0.24 * n1)]
mirror = lambda v, n: np.where(v % (2 * n) < n, v % (2 * n), 2 * n - 1 - v % (2 * n))
# only the cloth's fine grain: its folds would show the mirror's seams
patch = patch - gaussian_filter(patch, (9, 9, 0)) + patch.mean(axis=(0, 1))
cloth = patch[mirror(rows, patch.shape[0]), mirror(cols, patch.shape[1])]
rng_b = np.random.default_rng(1913)


def blotch(sd):
    v = gaussian_filter(rng_b.random((n0 // 8, n1 // 8)), (sd[0] / 8, sd[1] / 8))
    v = np.asarray(Image.fromarray((v - v.mean()) / v.std()).resize((n1, n0), Image.BICUBIC))
    return v


edge = (rows / n0) + 0.016 * blotch((90, 330)) + 0.007 * blotch((30, 110))
to_cloth = np.clip((edge - 0.843) / 0.062, 0, 1)
to_cloth = to_cloth * to_cloth * (3 - 2 * to_cloth)
to_cloth = np.maximum(to_cloth, gaussian_filter(gap_hard.astype(np.float64), 6 * sm))
# the signature's corner of the chair goes under the cloth a little sooner
corner = np.clip((0.37 - cols / n1) / 0.03, 0, 1) * np.clip((rows / n0 - 0.836) / 0.014, 0, 1)
to_cloth = np.maximum(to_cloth, corner)
shadow = 1 - 0.72 * np.clip((edge - 0.85) / 0.1, 0, 1) + 0.07 * blotch((70, 240))
op = (rgb_open * (1 - to_cloth[..., None]) + cloth * to_cloth[..., None]) * np.clip(shadow, 0, 1)[..., None]
Image.fromarray(np.clip(op, 0, 255).astype(np.uint8)).save(f"{scratch}/carnegie_pad_open.jpg", quality=96)
bake(f"{scratch}/carnegie_pad_open.jpg", f"{scratch}/carnegie_bust_open", "--matte", f"{scratch}/carnegie_cutline.png", "--max", "3300", "--mid", "0.30")
g_open = np.asarray(Image.open(f"{scratch}/carnegie_bust_open.png").getchannel("R"), dtype=np.float64) / 255
# where it takes over: below the hands, and the gap between them and the lap; hands, cuffs and coat keep the first grade
ys = np.arange(g.shape[0])[:, None] / g.shape[0]
m = np.clip((ys - 0.846) / 0.016, 0, 1) * np.ones_like(g)
small = lambda v: np.asarray(Image.fromarray(v.astype(np.float32)).resize(b.size, Image.BILINEAR), dtype=np.float64)
m = np.maximum(m, np.clip((small(gaussian_filter(gap_hard.astype(np.float64), 8 * sm)) - 0.45) / 0.3, 0, 1))
g = g * (1 - m) + g_open * m
px = b.width / BUST_WORLD_W
M = int(40 * px)
g, al = np.pad(g, M), np.pad(al, M)
rng = np.random.default_rng(1905)
hx = lambda c: np.array([int(c[i : i + 2], 16) / 255 for i in (1, 3, 5)])
BLACK, WHITE, STOCK, SHADE = hx("#14191A"), hx("#EEEDE4"), hx("#EFE9DB"), hx("#0E1F1A")
n = gaussian_filter(rng.random(g.shape), (0.8, 0.6))
n = np.clip(0.5 + (n - n.mean()) / n.std() * 0.13, 0, 1)
tone = BLACK + (WHITE - BLACK) * g[..., None]
photo = np.clip(0.26 * tone * n[..., None] + 0.87 * tone + 0.047 * n[..., None] - 0.0234, 0, 1)
wob = gaussian_filter(rng.random(g.shape), 26 * px)
wob = (wob - wob.mean()) / wob.std()
paper = np.clip((8 * px + 3 * px * wob - distance_transform_edt(al < 0.5)) / 1.5 + 0.5, 0, 1)
shade = lambda sd, dy, op: op * np.roll(gaussian_filter(paper, sd * px), int(dy * px), axis=0)
s1, s2 = shade(1.6, 1.5, 0.36), shade(8, 6, 0.24)
sa = 1 - (1 - s1) * (1 - s2)
oa = paper + sa * (1 - paper)
rgb_out = (STOCK * paper[..., None] + SHADE * (sa * (1 - paper))[..., None]) / np.maximum(oa, 1e-4)[..., None]
rgb_out = photo * al[..., None] + rgb_out * (1 - al[..., None])
oa = al + oa * (1 - al)
Image.fromarray((np.dstack([np.clip(rgb_out, 0, 1), oa]) * 255 + 0.5).astype(np.uint8), "RGBA").save(f"{OUT}/carnegie_bust_print.png", optimize=True)
print("print", g.shape[1], g.shape[0], "margin", M, "aspect", g.shape[1] / g.shape[0])

# crops in the postcard's own px, as fractions of a 480 px wide view of it
CROPS = {
    "Athens_OH": (78, 5, 478, 252),
    "BentonHarbor_MI": (35, 25, 400, 262),
    "Fargo_ND": (70, 40, 400, 258),
    "Greenville_SC": (15, 36, 360, 278),
    "Meridian_MS": (60, 42, 400, 270),
    "Montgomery_AL": (90, 65, 430, 290),
    "Pittsburgh_PA": (130, 75, 430, 285),
    "Riverside_CA": (40, 40, 325, 235),
    "SanDiego_CA": (60, 30, 420, 280),
    "Sandusky_OH": (30, 5, 400, 255),
    "Sumter_SC": (40, 58, 440, 300),
    "Tuskegee_AL": (60, 30, 410, 270),
    "Wyandotte_MI": (60, 40, 430, 285),
}
for name, c in CROPS.items():
    src = f"{raw}/libraries/{name}.jpg"
    s = Image.open(src).width / 480
    box = ",".join(str(round(v * s)) for v in c)
    bake(src, f"{OUT}/carnegie_lib_{name}", "--crop", box, "--max", "760", "--mid", "0.5")
