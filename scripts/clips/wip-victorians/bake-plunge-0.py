"""Helpers for ThrowOutThePlunge (wip-victorians, cut 0). Two steps around scripts/clips/wip-anthropic/bake-photo.py:

  # before the grade: clone the dead weed off the tub's rim along the rim's own slope, then lift the ice. Tones only: the
  # highlights and the fine contrast of what is already in the photo, inside a hand-placed mask of the tub's interior.
  ... bake-plunge-0.py retouch <IceBathTub.jpg> <scratch>/tub_clean.jpg

  # after the grade: a pasted print with hand-cut edges. Crops to the matte, then cuts the bottom on a slightly uneven line,
  # plus optional cuts in from either side so the print keeps clear of the frame edge.
  ... bake-plunge-0.py cut <baked.png> <out.png> [--left 158] [--right 143] [--seed 1] [--lift 0]

  # rev 3, the Palace of Westminster from the river (Westminster_LOC_2004678932_cropped.jpg, 3840 x 2367). Before the grade:
  # the matte (sky out along the roofline and towers; Victoria Tower's flagpole off; Westminster Abbey and the wing past the
  # Clock Tower cropped by the box below) and a clean river under the embankment: the steamer's funnel and flag cloned off
  # the wall, and the water under the palace replaced, row by row, by the boat-free water at the photo's left, so the
  # boats and the printed caption go. The river only shows between the men's heads on the settled frame.
  ... bake-plunge-0.py parliament <Westminster.jpg> <scratch>/parl_clean.jpg --matte-out <scratch>/parl_matte.png
  ... bake-photo.py <scratch>/parl_clean.jpg public/wip-victorians/pl_parliament.png --matte <scratch>/parl_matte.png \
        --crop 512,180,3185,2300 --max 2000 --mid 0.5
  ... bake-plunge-0.py cut public/wip-victorians/pl_parliament.png public/wip-victorians/pl_parliament.png --lift 0.16
"""
import argparse

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, binary_fill_holes, gaussian_filter, label, uniform_filter1d

p = argparse.ArgumentParser()
p.add_argument("mode", choices=["retouch", "cut", "parliament"])
p.add_argument("src")
p.add_argument("out")
p.add_argument("--left", type=int, default=0)
p.add_argument("--right", type=int, default=0)
p.add_argument("--seed", type=float, default=1)
p.add_argument("--lift", type=float, default=0, help="cut: a quieter print, the blacks lifted towards grey")
p.add_argument("--matte-out")
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
elif a.mode == "parliament":
    im = np.asarray(Image.open(a.src).convert("RGB"), dtype=np.float64)
    g = (0.30 * im[..., 0] + 0.59 * im[..., 1] + 0.11 * im[..., 2]) / 255
    # the parapet of the embankment, sloping a little across the photo; the wall's face below it, the water from WATER
    parapet = lambda x: 1645 + 0.012 * (x - 400)
    WATER = 1785
    # the steamer's funnel, flag and a skiff stand in front of the wall: clone the wall 350 px to their right over them
    x0, x1, y0, y1 = 1250, 1500, 1680, WATER
    box = np.zeros(g.shape)
    box[y0:y1, x0:x1] = 1
    box = gaussian_filter(box, 6)[..., None]
    im = im * (1 - box) + np.roll(im, -350, axis=1) * box
    # the water under the palace, row by row, from the clean water at the photo's left (x 250-950), laid back and forth
    # (mirrored, so no seams) with each source column's own brightness drift taken out
    xs = np.arange(512, 3185)
    k = (xs - 512) % 1400
    src_x = 250 + np.where(k < 700, k, 1399 - k)
    rows = slice(WATER - 12, 2300)
    clean = im[rows, 250:950]
    colmean = gaussian_filter(clean.mean(axis=(0, 2)), 25)
    clean = clean * (clean.mean() / colmean)[None, :, None]
    water = clean[:, src_x - 250]
    fade = np.clip((np.arange(WATER - 12, 2300) - (WATER - 12)) / 12, 0, 1)[:, None, None]
    im[rows, xs] = im[rows, xs] * (1 - fade) + water * fade
    # the matte: the sky out by tone, every column solid below the first sustained run of building
    gs = gaussian_filter(g, 0.7)
    t = np.clip((0.665 - gs) / 0.10, 0, 1)
    t = t * t * (3 - 2 * t)
    run = uniform_filter1d((gs < 0.58).astype(np.float64), 12, axis=0, origin=-5) > 0.999
    start = np.argmax(run, axis=0)
    Y = np.arange(g.shape[0])[:, None]
    X = np.arange(g.shape[1])[None, :]
    solid = (Y >= start[None, :]) & run.any(axis=0)[None, :]
    # below a column's first run, only what is darker than the sky (a leaning tower edge leaves sky in such a column);
    # enclosed lights (the clock faces, sunlit stone) come back by filling the holes
    core = binary_fill_holes((t > 0.5) | (solid & (gs < 0.66)))
    m = np.where(core, 1.0, t)
    lab, _ = label(m > 0.5)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    m = m * binary_dilation(np.isin(lab, np.where(sizes > 20000)[0]), iterations=2)
    # Victoria Tower's flagpole, from the top of the photo down into the lantern
    m[:290, 756:782] = 0
    # everything below the parapet is print (wall and water) down to the crop
    m = np.where(Y >= parapet(X), 1.0, m)
    Image.fromarray(np.clip(im + 0.5, 0, 255).astype(np.uint8)).save(a.out, quality=96)
    Image.fromarray((m * 255 + 0.5).astype(np.uint8)).save(a.matte_out)
    print(a.out, a.matte_out)
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
    if a.lift:
        rgba[..., :3] = a.lift + (1 - a.lift) * rgba[..., :3]
    Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(a.out, optimize=True)
    print(f"{a.out}: {w} x {h}, aspect {w / h:.4f}")
