"""Cut 28: the shrimp in its real colour, the style's exception for a real material whose colour is the point. The kit's
CutOut greys everything and dilates one border width, so this bakes the print and its paper border together: the photo's
own colour slightly muted, legs and antennae darkened and thickened into that colour, a wide border round the body and a
thin one round the legs so the gaps between them stay open.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-shrimp-28.py <in.jpg> <mask.png> <out.png>
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion, distance_transform_edt, gaussian_filter

src, mask, out = sys.argv[1:4]
CROP = (60, 0, 3500, 2620)
OUT_W = 1800
MUTE = 0.22  # share of the colour taken back toward grey, so it feels printed
EVEN = 0.45  # share of each pixel's hue replaced by the shrimp's own pinkest hue: the rock behind the clear tail turns it olive
THIN_TINT = 0.86  # how far legs and antennae go toward the body's colour
THIN_L = 0.30  # their tone
THICKEN = 3  # px added to legs and antennae
BORDER_BODY = 9.0  # px at this size; the print shows at 980 / 1800
BORDER_THIN = 4.5
STOCK = np.array([0xEF, 0xE9, 0xDB]) / 255

im = Image.open(src).convert("RGB")
mt = Image.open(mask).convert("L").resize(im.size, Image.BICUBIC)
im, mt = im.crop(CROP), mt.crop(CROP)
size = (OUT_W, round(im.height * OUT_W / im.width))
im, mt = im.resize(size, Image.LANCZOS), mt.resize(size, Image.LANCZOS)
rgb = np.asarray(im, dtype=np.float64) / 255
solid = np.asarray(mt, dtype=np.float64) / 255 > 0.5

# body = what survives a wide opening; thin = everything else
core = binary_erosion(solid, iterations=20)
body = binary_dilation(core, iterations=22) & solid
thin = solid & ~body
w = np.clip(gaussian_filter(thin.astype(np.float64), 4), 0, 1)

# fill outward from the matte, so thickening and edges carry the shrimp's colour, not the tank's
# (the body's rim comes from further in: the matte's outer pixels are dark tank, a dashed black line otherwise)
inner = binary_erosion(solid, iterations=1) & (thin | binary_erosion(body, iterations=7))
idx = distance_transform_edt(~inner, return_distances=False, return_indices=True)
rgb = rgb[idx[0], idx[1]]

L = 0.30 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
lo, hi = np.percentile(L[body], [0.6, 99.4])
L2 = np.clip((L - lo) / max(hi - lo, 1e-3), 0, 1)
L2 = np.clip(L2 + 0.4 * (L2 - gaussian_filter(L2, 10)), 0, 1) ** 0.8  # a little local contrast; lifted, so salmon rather than brown
L2 = L2 * L2 * (3 - 2 * L2) * 0.45 + L2 * 0.55
col = rgb * (L2 / np.maximum(L, 0.02))[..., None]  # same ratios: no saturation added
grey = (0.30 * col[..., 0] + 0.59 * col[..., 1] + 0.11 * col[..., 2])[..., None]
# the pinkest part of the body sets the hue; ratios only, so this evens the hue without adding saturation
ratio = col[..., 0] / np.maximum(grey[..., 0], 0.02)
pink = np.median(col[body & (ratio > np.percentile(ratio[body], 96)) & (L2 > 0.25)], axis=0)
pink = pink / float(0.30 * pink[0] + 0.59 * pink[1] + 0.11 * pink[2])
col = col + (np.clip(pink * grey, 0, 1) - col) * EVEN
col = np.clip(col + (grey - col) * MUTE, 0, 1)

# legs and antennae: the body's colour at a darker tone, keeping a little of their own modelling
bc = np.median(col[body], axis=0)
print("pink hue", (pink * 100).round())
tint = bc / max(float(0.30 * bc[0] + 0.59 * bc[1] + 0.11 * bc[2]), 1e-3) * (THIN_L + 0.22 * (gaussian_filter(L2, 4)[..., None] - 0.5))
col = col + (np.clip(tint, 0, 1) - col) * (w * THIN_TINT)[..., None]

# silhouette: thickened legs, then the two widths of border with a slow hand-cut wander
fig = solid | binary_dilation(thin, iterations=THICKEN)
rng = np.random.default_rng(28)
wander = gaussian_filter(rng.standard_normal(fig.shape), 28)
wander = wander / wander.std()
dFig = distance_transform_edt(~fig)
dBody = distance_transform_edt(~body)
reach = np.maximum(BORDER_BODY + 1.6 * wander - dBody, BORDER_THIN + 0.7 * wander - dFig)
paper = np.clip(reach + 0.5, 0, 1)  # one px of antialias
figA = np.clip(gaussian_filter(fig.astype(np.float64), 0.8) * 1.6 - 0.3, 0, 1)

outRgb = STOCK * (1 - figA[..., None]) + col * figA[..., None]
alpha = np.maximum(paper, figA)
arr = np.dstack([outRgb, alpha])
Image.fromarray((arr * 255 + 0.5).astype(np.uint8), "RGBA").save(out, optimize=True)
print(f"{out}: {size[0]} x {size[1]}, aspect {size[0] / size[1]:.4f}, body colour {(bc * 255).round()}")
