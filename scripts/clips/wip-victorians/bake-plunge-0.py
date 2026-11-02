"""Helpers for ThrowOutThePlunge (wip-victorians, cut 0). Two steps around scripts/clips/wip-anthropic/bake-photo.py:

  # before the grade: clone the dead weed off the tub's rim along the rim's own slope, then lift the ice. Tones only: the
  # highlights and the fine contrast of what is already in the photo, inside a hand-placed mask of the tub's interior.
  ... bake-plunge-0.py retouch <IceBathTub.jpg> <scratch>/tub_clean.jpg

  # after the grade: a pasted print with hand-cut edges. Crops to the matte, then cuts the bottom on a slightly uneven line,
  # plus optional cuts in from either side so the print keeps clear of the frame edge.
  ... bake-plunge-0.py cut <baked.png> <out.png> [--left 158] [--right 143] [--seed 1]
"""
import argparse

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

p = argparse.ArgumentParser()
p.add_argument("mode", choices=["retouch", "cut"])
p.add_argument("src")
p.add_argument("out")
p.add_argument("--left", type=int, default=0)
p.add_argument("--right", type=int, default=0)
p.add_argument("--seed", type=float, default=1)
a = p.parse_args()

# The tub's interior, in the file's px (1920 x 1440).
ICE = [
    (405, 768), (432, 672), (512, 576), (640, 509), (800, 472), (1200, 440), (1600, 419), (1920, 400),
    (1920, 784), (1600, 856), (1200, 944), (960, 984), (752, 995), (560, 968), (448, 912), (408, 832),
]

if a.mode == "retouch":
    im = np.asarray(Image.open(a.src).convert("RGB"), dtype=np.float64)
    # the weed's box, and the clean stretch of rim 300 px to its left, down the rim's slope
    x0, x1, y0, y1 = 1570, 1885, 700, 1150
    dx, dy = -300, 65
    box = np.zeros(im.shape[:2])
    box[y0:y1, x0:x1] = 1
    box = gaussian_filter(box, 12)[..., None]
    moved = np.roll(np.roll(im, -dx, axis=1), -dy, axis=0)
    im = im * (1 - box) + moved * box
    # the ice
    mask = Image.new("L", (im.shape[1], im.shape[0]), 0)
    ImageDraw.Draw(mask).polygon(ICE, fill=255)
    m = gaussian_filter(np.asarray(mask, dtype=np.float64) / 255, 9)
    g = (0.30 * im[..., 0] + 0.59 * im[..., 1] + 0.11 * im[..., 2]) / 255
    low = gaussian_filter(g, 26)
    broad = gaussian_filter(g, 90)
    detail = g - low
    # the broad shading evens out and rises towards pale ice; the crystals' own light and dark get much stronger
    lifted = 0.84 + 0.5 * (broad - np.median(g[m > 0.9])) + 0.7 * (low - broad) + 1.7 * detail
    lifted = np.clip(lifted, 0.02, 1)
    # the very top of the highlights opens up
    lifted = lifted + 0.12 * np.clip((lifted - 0.7) / 0.3, 0, 1) ** 2
    lifted = np.clip(lifted, 0, 1)
    out = g * (1 - m) + lifted * m
    ratio = (out / np.maximum(g, 0.02))[..., None]
    Image.fromarray(np.clip(im * ratio + 0.5, 0, 255).astype(np.uint8)).save(a.out, quality=96)
    print(a.out)
else:
    rgba = np.asarray(Image.open(a.src).convert("RGBA"), dtype=np.float64) / 255
    ys, xs = np.where(rgba[..., 3] > 0.5)
    rgba = rgba[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1].copy()
    h, w = rgba.shape[:2]
    Y, X = np.mgrid[0:h, 0:w].astype(np.float64)
    # a pair of scissors: long straight runs, very slightly off true, no wobble
    keep = Y < h - 8 - 10 * np.sin(X / w * 2.1 + a.seed) - 8 * (X / w)
    if a.left:
        keep &= X > a.left - 0.022 * (h - Y)
    if a.right:
        keep &= X < w - a.right + 0.022 * (h - Y)
    rgba[..., 3] *= gaussian_filter(keep.astype(np.float64), 0.8)
    Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(a.out, optimize=True)
    print(f"{a.out}: {w} x {h}, aspect {w / h:.4f}")
