"""PaidToPay's photographs (cut 44), through the kit's one grade (bake-photo.py).

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <assets_raw>/westminster_mp/MP_StoneFullLength_topHat2.jpg <scratch>/mp_mask.png person
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-victorians/bake-paid.py <assets_raw> <scratch>

MP: Vision loses the top hat against the dark gate, so the hat is a hand-placed outline; the rest is Vision's matte smoothed
into one scissor line. Tower: the sky is thresholded out of the photochrom. The print is mirrored so the tower stands on the
right with the wing running left behind the MP; the dial alone is flipped back, so the numerals and hands read true.
Note: the black scan ground is removed, the torn notch stays; the finish (page black and white, contact shadow) is baked,
because the pile is dozens of copies and a filter per note is too slow.
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_fill_holes, binary_opening, gaussian_filter, label

raw, scratch = sys.argv[1], sys.argv[2]
OUT = "public/wip-victorians"


def bake(src, out, *args):
    subprocess.run([sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", src, out, *args], check=True)


# -- the MP --------------------------------------------------------------------------------------------------------
src = f"{raw}/westminster_mp/MP_StoneFullLength_topHat2.jpg"
im = Image.open(src).convert("RGB")
mt = np.asarray(Image.open(f"{scratch}/mp_mask.png").convert("L").resize(im.size, Image.BICUBIC), dtype=np.float64) / 255
a = gaussian_filter(mt, 2.2) > 0.6
hat = Image.new("L", im.size, 0)
ImageDraw.Draw(hat).polygon(
    [(636, 456), (699, 464), (700, 530), (705, 548), (713, 557), (677, 561), (640, 553), (610, 552), (597, 552), (588, 540), (594, 530), (611, 524), (634, 521)],
    fill=255,
)
a[:562] = False
# Vision also drops the hand at the coat's right side (white on the pale gate)
ImageDraw.Draw(hat).polygon(
    [(734, 1022), (776, 1027), (774, 1037), (768, 1042), (767, 1060), (762, 1075), (750, 1087), (732, 1103), (730, 1080), (732, 1040)],
    fill=255,
)
ImageDraw.Draw(hat).polygon([(728, 985), (790, 985), (784, 1030), (776, 1027), (734, 1022)], fill=255)
a = a | (np.asarray(hat) > 0)
head = np.asarray(Image.open(f"{scratch}/mp_mask.png").convert("L").resize(im.size, Image.BICUBIC), dtype=np.float64) / 255 > 0.5
a[553:640] |= head[553:640]
a = binary_fill_holes(a)
a = binary_opening(a, iterations=2)
lab, _ = label(a)
a = lab == np.argmax(np.bincount(lab.ravel())[1:]) + 1
a = gaussian_filter(a.astype(np.float64), 1.6) > 0.5
Image.fromarray((a * 255).astype(np.uint8)).save(f"{scratch}/mp_cutline.png")
ys, xs = np.where(a)
box = f"{xs.min() - 8},{ys.min() - 8},{xs.max() + 9},{ys.max() + 9}"
print("mp box", box)
bake(src, f"{OUT}/ptp_mp.png", "--matte", f"{scratch}/mp_cutline.png", "--crop", box, "--mid", "0.26")

# -- the tower and its wing ------------------------------------------------------------------------------------------
X0, Y0, X1, Y1 = 120, 20, 1120, 1810  # in the source: tower at the left of this crop, then the wing
full = Image.open(f"{raw}/objects/Westminster_LOC_92518894_street.jpg").convert("RGB")
crop = full.crop((X0, Y0, X1, Y1))
rgb = np.asarray(crop, dtype=np.float64)
lum = 0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
warm = rgb[..., 0] - rgb[..., 2]
sky_like = (lum > 128) & (warm < 62)
built = ~sky_like
built = gaussian_filter(built.astype(np.float64), 1.6) > 0.55
built = binary_opening(built, iterations=2)
lab, _ = label(built)
built = lab == np.argmax(np.bincount(lab.ravel())[1:]) + 1
built = binary_fill_holes(built)
# the shaft's own straight sides, where pale stone goes with the sky
Sx0, Sx1 = 84, 385  # in this crop, before the mirror
built[640:, Sx0:Sx1] = True
built = gaussian_filter(built.astype(np.float64), 2.2) > 0.5
# the photochrom's litho screen, softened so the one grade does not sharpen it into noise
rgb = np.dstack([gaussian_filter(rgb[..., c], 1.3) for c in range(3)])
flip = rgb[:, ::-1].copy()
mask = built[:, ::-1].copy()
mask[1100:, 930:] = False  # the park trees beside the tower's foot
# the dial, flipped back about its own centre
cx, cy, r = 383.5 - X0, 785 - Y0, 84
W = rgb.shape[1]
mx = W - 1 - cx
yy, xx = np.mgrid[: rgb.shape[0], : rgb.shape[1]]
d = np.hypot(xx - mx, yy - cy)
m = np.clip((r + 2 - d) / 4, 0, 1)[..., None]
srcx = np.clip((2 * mx - xx).astype(int), 0, W - 1)  # the mirrored plate mirrored once more about the dial's centre
flip = flip * (1 - m) + flip[yy, srcx] * m
Image.fromarray(flip.astype(np.uint8)).save(f"{scratch}/tower_flip.png")
Image.fromarray((mask * 255).astype(np.uint8)).save(f"{scratch}/tower_cutline.png")
ys, xs = np.where(mask)
print("tower x", xs.min(), xs.max(), "y", ys.min(), ys.max(), "size", W, rgb.shape[0], "dial cx", mx, "cy", cy)
bake(f"{scratch}/tower_flip.png", f"{OUT}/ptp_palace.png", "--matte", f"{scratch}/tower_cutline.png", "--max", "1800", "--mid", "0.44")

# -- the note --------------------------------------------------------------------------------------------------------
n = Image.open(f"{raw}/objects/WhiteNote_BoE_1888_10pound_small.jpg").convert("RGB")
g = np.asarray(n.convert("L"), dtype=np.float64)
a = binary_fill_holes(gaussian_filter(g, 1.0) > 55)
a = binary_opening(a, iterations=2)
lab, _ = label(a)
a = lab == np.argmax(np.bincount(lab.ravel())[1:]) + 1
Image.fromarray((a * 255).astype(np.uint8)).save(f"{scratch}/note_cutline.png")
ys, xs = np.where(a)
bake(f"{raw}/objects/WhiteNote_BoE_1888_10pound_small.jpg", f"{scratch}/note_graded.png", "--matte", f"{scratch}/note_cutline.png", "--crop", f"{xs.min()},{ys.min()},{xs.max() + 1},{ys.max() + 1}", "--mid", "0.74")
gr = np.asarray(Image.open(f"{scratch}/note_graded.png"), dtype=np.float64) / 255
PAD = 28
h, w = gr.shape[:2]
alpha = np.pad(gr[..., 3], PAD)
v = np.pad(gr[..., 0], PAD, mode="edge")
v = v ** 0.62  # a white note: its paper reads white on the mint page, its ink stays black
rng = np.random.default_rng(44)
v = np.clip(v + gaussian_filter(rng.normal(0, 1, v.shape), 0.7) * 0.035, 0, 1)
black, white = np.array([0x14, 0x19, 0x1a]) / 255, np.array([0xee, 0xed, 0xe4]) / 255
col = black + v[..., None] * (white - black)
sh = 0.30 * gaussian_filter(np.roll(alpha, 2, axis=0), 1.6) + 0.22 * gaussian_filter(np.roll(alpha, 7, axis=0), 7)
sh = np.clip(sh, 0, 1)
out_a = alpha + sh * (1 - alpha)
shade = np.array([0x0e, 0x1f, 0x1a]) / 255
out_rgb = (col * alpha[..., None] + shade * (sh * (1 - alpha))[..., None]) / np.maximum(out_a, 1e-3)[..., None]
res = np.dstack([out_rgb, out_a])
Image.fromarray((np.clip(res, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(f"{OUT}/ptp_note.png", optimize=True)
print("note", w, h, "aspect", w / h, "pad", PAD)
