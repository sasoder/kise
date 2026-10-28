# Bake the clip's price tag (sam-pricing-tokens, pricingShared PriceTag) from the image agent's photo.
# Source: assets-src/sam-pricing-tokens/pricetag_four_hanging_tags_blank_alt_unsplash.jpg (the kraft tag, 2nd from left,
# frontal, hanging on its twine against a white wall). The tag is keyed by saturation (kraft is warm and saturated, the
# wall and the cotton twine are neutral), its outline is the filled key, the twine where it crosses the paper is painted
# out with the paper's own colour (we draw our own twine), the punched hole is cut through, and a middle band of plain
# paper is removed so the tag is a little shorter (aspect ~0.6: the $3.40 sticker fits at a phone-readable size).
# Writes public/sam-pricing-tokens/tag_kraft.png (RGBA) and generated/components/sam-pricing-tokens/pricingData.ts.
# Run (system python + the user's site-packages, no installs):
#   /usr/bin/python3 -I scripts/clips/sam-pricing-tokens/bake-tag.py <repo root>
import base64
import io
import sys

sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

ROOT = sys.argv[1]
SRC = f"{ROOT}/assets-src/sam-pricing-tokens/pricetag_four_hanging_tags_blank_alt_unsplash.jpg"
OUT_PNG = f"{ROOT}/public/sam-pricing-tokens/tag_kraft.png"
OUT_TS = f"{ROOT}/generated/components/sam-pricing-tokens/pricingData.ts"
CROP = (1950, 1380, 2545, 2510)  # source px around the kraft tag (x0, y0, x1, y1)
TARGET_ASPECT = 0.6
OUT_H = 960

im = Image.open(SRC).convert("RGB").crop(CROP)
a = np.asarray(im).astype(np.float32)
sat = a.max(2) - a.min(2)
lum = a.mean(2)
# the paper: saturated and not wall-bright
paper = (sat > 42) & ((a[..., 0] - a[..., 2]) > 40) & (lum < 210)
# drop specks: keep pixels with enough paper around them
pk = Image.fromarray((paper * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(7))
paper = np.asarray(pk) > 127
# the outline: fill each row between the paper's outer edges (the twine and eyelet only cut holes inside)
H, W = paper.shape
shape = np.zeros_like(paper)
rows = np.nonzero(paper.sum(1) > 6)[0]
for y in range(rows.min(), rows.max() + 1):
    xs = np.nonzero(paper[y])[0]
    if len(xs) > 6:
        shape[y, xs.min() : xs.max() + 1] = True
# smooth the outline a hair (anti-aliased edge)
sm = Image.fromarray((shape * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
alpha = np.asarray(sm).astype(np.float32) / 255
alpha = np.clip((alpha - 0.5) * 2.2 + 0.5, 0, 1)
ys, xs = np.nonzero(shape)
top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max()
# the hole: the darkest low-saturation blob near the top centre (the twine passes through it)
cx = (left + right) / 2
# paint out what is inside the outline but not paper (twine, eyelet shadow): grow paper colours inward
rgb = a.copy()
valid = paper.copy()
fill_mask = shape & ~paper
for _ in range(60):
    if not (fill_mask & ~valid).any():
        break
    acc = np.zeros_like(rgb)
    cnt = np.zeros(valid.shape, np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
        v = np.roll(np.roll(valid, dy, 0), dx, 1)
        c = np.roll(np.roll(rgb, dy, 0), dx, 1)
        acc += c * v[..., None]
        cnt += v
    grow = (~valid) & (cnt > 0) & shape
    rgb[grow] = acc[grow] / cnt[grow][:, None]
    valid = valid | grow
# a little texture back over the painted area: the paper's own grain from a clean patch
patch = a[int(top + 0.55 * (bot - top)) : int(top + 0.55 * (bot - top)) + 200, int(cx - 100) : int(cx + 100)]
grain = patch - patch.mean((0, 1))
tile = np.tile(grain, (H // grain.shape[0] + 1, W // grain.shape[1] + 1, 1))[:H, :W]
painted = fill_mask & shape
rgb[painted] = rgb[painted] + tile[painted] * 0.8
# crop to the paper
rgb = rgb[top : bot + 1, left : right + 1]
alpha = alpha[top : bot + 1, left : right + 1]
h0, w0 = alpha.shape
# shorten: remove a band of plain paper from the middle, blended over 24 px
want_h = int(round(w0 / TARGET_ASPECT))
cut = max(0, h0 - want_h)
if cut > 0:
    y0 = int(0.58 * h0)
    blend = 24
    upper_rgb, lower_rgb = rgb[: y0 + blend], rgb[y0 + cut :]
    upper_a, lower_a = alpha[: y0 + blend], alpha[y0 + cut :]
    t = np.linspace(0, 1, blend)[:, None]
    mid_rgb = upper_rgb[-blend:] * (1 - t[..., None]) + lower_rgb[:blend] * t[..., None]
    mid_a = upper_a[-blend:] * (1 - t) + lower_a[:blend] * t
    rgb = np.concatenate([upper_rgb[:-blend], mid_rgb, lower_rgb[blend:]], 0)
    alpha = np.concatenate([upper_a[:-blend], mid_a, lower_a[blend:]], 0)
h1, w1 = alpha.shape
# the punched hole, measured on the baked tag (the eyelet's hole): centre (HOLE_U w, HOLE_V h), radius
# HOLE_R w; cut through, its edge a shade darker (the punched edge)
HOLE_U, HOLE_V, HOLE_R = 0.501, 0.2125, 0.057
yy, xx = np.mgrid[0:h1, 0:w1]
# the photo's twine runs up from the hole over the eyelet ring and the top edge: that whole patch (twine and ring)
# is replaced by clean paper copied from 0.34 h further down the same tag, feathered; the tag keeps a plain punched
# hole (our own twine is drawn by pricingShared)
TW_U0, TW_U1, TW_V1, SHIFT = 0.30, 0.70, 0.33, 0.34
band = np.clip(np.minimum(xx - TW_U0 * w1, TW_U1 * w1 - xx) / 16, 0, 1) * np.clip((TW_V1 * h1 - yy) / 14, 0, 1)
src_y = np.clip(np.round(yy + SHIFT * h1).astype(int), 0, h1 - 1)
refl = rgb[src_y, xx]
rgb = rgb * (1 - band[..., None]) + refl * band[..., None]
d = np.hypot(xx - HOLE_U * w1, yy - HOLE_V * h1)
hr = HOLE_R * w1
alpha = alpha * np.clip((d - hr) / 1.5, 0, 1)
rim = np.clip(1 - np.abs(d - hr - 2) / 3, 0, 1) * 0.25
rgb = rgb * (1 - rim[..., None])
# a 1-px choke of the outer edge (the wall's light fringe)
alpha = np.minimum(alpha, np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32) / 255 * 1.0 + 0.0)
# exposure: the photo was shot in the dim light of a white wall; lift it to a kraft lit under the stout lamp (before
# pricingShared's GRADE maps it into the card range)
EXPOSURE = 1.24
out = np.dstack([np.clip(rgb * EXPOSURE, 0, 255), alpha * 255]).astype(np.uint8)
img = Image.fromarray(out)
scale = OUT_H / h1
img = img.resize((int(round(w1 * scale)), OUT_H), Image.LANCZOS)
img.save(OUT_PNG)
buf = io.BytesIO()
img.save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
aspect = img.width / img.height
print(f"tag {img.width}x{img.height} aspect {aspect:.4f} holeV {HOLE_V} holeR {HOLE_R} (of w) cut {cut}px")
ts = f"""// pricingData — the clip's baked photo cut-outs, inlined as data URLs (CRAFT "Bitmaps inside an SVG").
// GENERATED by scripts/clips/sam-pricing-tokens/bake-tag.py from
// assets-src/sam-pricing-tokens/pricetag_four_hanging_tags_blank_alt_unsplash.jpg (Unsplash licence; see the image
// agent's images/cutout_sources/SOURCES.md): the kraft swing tag, keyed, its twine painted out (pricingShared draws
// the twine), the hole cut through, a {cut}-px middle band of plain paper removed. Do not edit by hand.
import type {{ TagArt }} from "./pricingShared";

export const TAG_PHOTO: TagArt | null = {{
  src: "data:image/png;base64,{b64}",
  aspect: {aspect:.4f},
  holeV: {HOLE_V},
  holeR: {HOLE_R},
  footV: 1,
  sticker: {{ cv: 0.62, w: 0.88, h: 0.4 }},
}};
"""
open(OUT_TS, "w").write(ts)
