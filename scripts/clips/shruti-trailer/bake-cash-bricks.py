#!/usr/bin/env python3
"""SHRUTI trailer (shruti-trailer), cut 13 OrbitOnEightyMillion: the two cash stacks, baked from ONE brick sprite.

  standin  plain white bricks (a clearly-marked stand-in until the cash photos land)
  photo    the $100-bundle brick: the face of a real $100 note (assets-src/shruti-trailer/cash_bill100_front.jpg = the
           clip's animation_source/assets/cash_bill100_front.jpg: Wikimedia Commons "Series_2013_$100_bill_front.jpg",
           public domain, photo by Cyfraw), cut
           out along its paper edge with a perspective warp (its four corners measured off the photo), greyscale, with
           the bundle's paper strap laid across it right of the portrait -> public/shruti-trailer/cash_brick.png

Both stacks are the same object at two lengths: COLS bricks wide, SMALL_ROWS (2) and TOWER_ROWS (25) courses high, so
tower : small = 25 : 2 = 12.5 : 1 exactly (Ashlee's "a billion" vs "80 million"), same footprint. Bricks sit in a
neat grid with a GAP (world px) between them: the cut's hard shadow (a black copy of the stack's alpha at +4/+4)
shows through the gaps as the joints. World sizes (the cut's world px): brick BW x BH = 60.5 x 29.2; a stack is
COLS * BW wide. The small stack is baked at 5 px / world px (it is seen up to k 3, finals --scale 2), the tower at
2.5 px / world px (seen at k <= 1.15).

  uv run --offline --with numpy --with pillow --with scipy python3 -I scripts/clips/shruti-trailer/bake-cash-bricks.py [standin|photo|compare]
  compare  (review 3) the five comparator stacks cash_cmp_<key>.png from the same brick: $80M per course, a partial
           top course as a thinner bundle, 2 buried courses under each; needs cash_brick.png (photo mode) first
Outputs: public/shruti-trailer/cash_stack_small.png, public/shruti-trailer/cash_tower.png (+ cash_brick.png in photo mode)
Memory: the largest arrays are the photo (2999 x 1294 x 3) and the brick (2340 x 970) in float32, < 100 MB.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, "public/shruti-trailer/")
SRC = os.path.join(ROOT, "assets-src/shruti-trailer/")

BW = 60.5  # brick width, world px
BH = 730.0 / 25  # brick height, world px (29.2): 25 courses = the 730 px orbit altitude
COLS = 2
SMALL_ROWS = 2
TOWER_ROWS = 25
GAP = 1.0  # world px between bricks (the shadow shows through as the joint)


def standin_brick(w: int, h: int) -> Image.Image:
    """A plain white brick with a pale strap band: the stand-in."""
    ss = 4
    im = Image.new("RGBA", (w * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w * ss - 1, h * ss - 1], fill=(246, 246, 246, 255))
    bw = int(0.16 * w * ss)
    x0 = (w * ss - bw) // 2
    d.rectangle([x0, 0, x0 + bw, h * ss - 1], fill=(205, 205, 205, 255))
    return im.resize((w, h), Image.LANCZOS)


BILL_SRC = os.path.join(SRC, "cash_bill100_front.jpg")
# the note's paper corners in the photo (px; measured off a blue-tint mask and checked by eye): TL, TR, BR, BL
BILL_QUAD = [(190, 120), (2712, 79), (2756, 1149), (184, 1204)]
BRICK_PX = (2340, 1130)  # the baked brick (w, h): the face 2340 x 995 (156 : 66.3) + the top edge
EDGE_PX = 135
STRAP_X = (0.545, 0.655)  # the paper strap, as fractions of the note's width (right of the portrait, clear of the seal)


def _perspective_coeffs(dst, src):
    """PIL's 8 perspective coefficients mapping output (dst) px to input (src) px."""
    a = []
    bvec = []
    for (x, y), (u, v) in zip(dst, src):
        a.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        a.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        bvec += [u, v]
    return np.linalg.solve(np.array(a, dtype=np.float64), np.array(bvec, dtype=np.float64))


def bake_brick() -> None:
    """The brick sprite: the bundle's top edge (a strip of paper edges, EDGE_FRAC of the height) over the note's face
    (warped flat, inset 6 px so no background fringes, greyscale, its uneven light flattened), the paper strap wrapped
    round both. Real proportions: the face keeps the note's 156 : 66.3 mm aspect."""
    w, fh = BRICK_PX[0], BRICK_PX[1] - EDGE_PX
    inset = 6
    from scipy import ndimage as ni

    src = Image.open(BILL_SRC).convert("RGB")
    dst = [(-inset, -inset), (w + inset, -inset), (w + inset, fh + inset), (-inset, fh + inset)]
    flat = src.transform((w, fh), Image.PERSPECTIVE, tuple(_perspective_coeffs(dst, BILL_QUAD)), Image.BICUBIC)
    a = np.asarray(flat).astype(np.float32) / 255.0
    face = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    low = ni.gaussian_filter(face, sigma=fh / 3)
    face = np.clip(face - low + low.mean(), 0, 1)
    # a little more contrast so the print (portrait, numerals) still reads at a 15 px brick
    face = np.clip((face - 0.5) * 1.3 + 0.47, 0, 1)
    # the top edge: paper edges, light, fine uneven horizontal lines (deterministic noise)
    rng = np.random.default_rng(13)
    eh = EDGE_PX
    rows = np.clip(0.86 - 0.22 * rng.random(eh) ** 2.2, 0, 1)
    rows = ni.gaussian_filter1d(rows, 0.8)
    wav = ni.gaussian_filter1d(rng.standard_normal(w), 60) * 0.04
    edge = np.clip(rows[:, None] + wav[None, :] - 0.06 * np.linspace(0, 1, eh)[:, None], 0, 1)
    lum = np.vstack([edge, face])
    h = lum.shape[0]
    # the strap: a solid pale paper band round the bundle (the real one is mustard; pale so the band reads at 15 px,
    # the cash-brick silhouette), a darker seam at each edge, the print's fine texture carried through faintly
    x = np.arange(w) / w
    x0, x1 = STRAP_X
    inside = ni.gaussian_filter1d(((x >= x0) & (x <= x1)).astype(np.float32), 1.5)
    tex = lum - ni.gaussian_filter(lum, 2)
    strap = np.clip(0.9 + 0.1 * tex + 0.02 * rng.standard_normal((h, w)), 0, 1)
    seam = 1 - 0.45 * (np.exp(-(((x - x0) * w - 14) ** 2) / 120.0) + np.exp(-(((x - x1) * w + 14) ** 2) / 120.0))
    strap = strap * seam[None, :]
    strap[:eh] = np.clip(strap[:eh] + 0.05, 0, 1)  # the strap's top face catches more light
    lum = lum * (1 - inside[None, :]) + strap * inside[None, :]
    # the edge / face fold: a thin dark line
    lum[eh - 2 : eh + 2] *= 0.72
    g8 = (np.clip(lum, 0, 1) * 255 + 0.5).astype(np.uint8)
    rgba = np.dstack([g8, g8, g8, np.full_like(g8, 255)])
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "cash_brick.png"), optimize=True)
    print("brick", (w, h), "mean", float(lum.mean()))


def photo_brick(w: int, h: int, variant: int) -> Image.Image:
    """The brick sprite resized to w x h; variants differ by a few % of brightness (never mirrored: the print reads)."""
    src = Image.open(os.path.join(OUT, "cash_brick.png")).convert("RGBA").resize((w, h), Image.LANCZOS)
    k = [1.0, 0.96, 1.03, 0.985][variant % 4]
    a = np.asarray(src).astype(np.float32)
    a[..., :3] = np.clip(a[..., :3] * k, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def stack(rows: int, scale: float, mode: str) -> Image.Image:
    W = int(round(COLS * BW * scale))
    H = int(round(rows * BH * scale))
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = GAP * scale
    for r in range(rows):
        for c in range(COLS):
            x0 = c * BW * scale + g / 2
            y1 = H - r * BH * scale - g / 2
            y0 = y1 - BH * scale + g
            bw = int(round(BW * scale - g))
            bh = int(round(y1 - y0))
            v = (r * 7 + c * 3) % 4
            b = standin_brick(bw, bh) if mode == "standin" else photo_brick(bw, bh, v)
            im.alpha_composite(b, (int(round(x0)), int(round(y0))))
    return im


# -- compare mode (review 3): the comparator stacks, money raised before first orbit ----------------------------------
# One course = $80M (Skyroot's $160M = its 2 courses). The brick height matches the component's Skyroot stack on
# screen: SMALL_H / 2, where SMALL_H = (limb-to-orbit height at x 410) * 2 / 25 with R_E 5500, ALT 730, EX 800.
_R_E, _ALT, _EX = 5500.0, 730.0, 800.0
_dx = 410.0 - _EX
_limb = -((_R_E**2 - _dx**2) ** 0.5)
_orbit = -(((_R_E + _ALT) ** 2 - _dx**2) ** 0.5)
SMALL_H = (_limb - _orbit) * SMALL_ROWS / TOWER_ROWS
CMP_BH = SMALL_H / SMALL_ROWS
USD_PER_COURSE = 80.0
COMPARE = [("rocketlab", 150.0), ("firefly", 350.0), ("astra", 600.0), ("isar", 1000.0), ("relativity", 1300.0)]
BURIED = 2  # extra full courses under the visible height: they stay behind the limb (the ground slopes under a stack)


def partial_brick(w: int, full_h: int, h: int, variant: int, mode: str) -> Image.Image:
    """A thinner bundle: the brick's top edge strip over the LOWER part of its face, h px high (h <= full_h)."""
    full = standin_brick(w, full_h) if mode == "standin" else photo_brick(w, full_h, variant)
    edge = int(round(full_h * EDGE_PX / BRICK_PX[1]))
    if h <= edge + 2:
        return full.crop((0, 0, w, h))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.alpha_composite(full.crop((0, 0, w, edge)), (0, 0))
    out.alpha_composite(full.crop((0, full_h - (h - edge), w, full_h)), (0, edge))
    return out


def compare_stack(courses: float, scale: float, mode: str) -> Image.Image:
    """BURIED + floor(courses) full courses and one partial course on top (a thinner bundle) of `courses % 1`."""
    full = int(np.floor(courses + 1e-9))
    frac = courses - full
    rows = BURIED + full
    W = int(round(COLS * BW * scale))
    H = int(round((rows + frac) * CMP_BH * scale))
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = GAP * scale
    bw = int(round(BW * scale - g))
    for r in range(rows + (1 if frac > 1e-6 else 0)):
        for c in range(COLS):
            x0 = c * BW * scale + g / 2
            y1 = H - r * CMP_BH * scale - g / 2
            hh = CMP_BH if r < rows else frac * CMP_BH
            y0 = y1 - hh * scale + g
            bh = int(round(y1 - y0))
            v = (r * 7 + c * 3) % 4
            if r < rows:
                b = standin_brick(bw, bh) if mode == "standin" else photo_brick(bw, bh, v)
            else:
                b = partial_brick(bw, int(round(CMP_BH * scale - g)), bh, v, mode)
            im.alpha_composite(b, (int(round(x0)), int(round(y0))))
    return im


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "standin"
    os.makedirs(OUT, exist_ok=True)
    if mode == "compare":
        for key, usd in COMPARE:
            im = compare_stack(usd / USD_PER_COURSE, 2.5, "photo")
            im.save(os.path.join(OUT, f"cash_cmp_{key}.png"), optimize=True)
            print(key, usd, "courses", usd / USD_PER_COURSE, im.size)
        print("CMP_BH", CMP_BH)
        return
    if mode == "photo":
        bake_brick()
    small = stack(SMALL_ROWS, 5.0, mode)
    tower = stack(TOWER_ROWS, 2.5, mode)
    small.save(os.path.join(OUT, "cash_stack_small.png"), optimize=True)
    tower.save(os.path.join(OUT, "cash_tower.png"), optimize=True)
    print("small", small.size, "tower", tower.size, "mode", mode)


if __name__ == "__main__":
    main()
