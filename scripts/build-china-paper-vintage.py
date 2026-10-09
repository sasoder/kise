"""Bake the "ChinaTalk, slightly vintage" paper assets, pass 2: NEWSPRINT
(kit: generated/components/chinatalkVintage.tsx).

Run once:  python3 scripts/build-china-paper-vintage.py
Writes (all under public/china/):
  paper_vintage.png   2400x4200 RGB   the newsprint ground (#EDE7D9): a light, slightly grey page with a little
                                      unevenness and a faint tooth. The optional page cues live here (under the
                                      drawing): SHOW_THROUGH (the ghost of the other side's print) and CREASE (one soft
                                      horizontal fold). Still a calm LIGHT page: no stains, tears or foxing.
  fibre_vintage.png   2400x4200 L     the page's VISIBLE fibre and fine specks as a neutral map (mean 128). The kit
                                      lays it over EVERYTHING (hard-light, locked to the world): values under 128
                                      multiply (dark fibres, shives, specks: on the paper, on paper-coloured knock-outs,
                                      in red), values over 128 screen (light fibres showing through ink and red).
  grain_0..3.png      1200x2040 L     neutral fine print grain (mean 128), screen space, one per 2 frames (unchanged).

The kit REPEATS paper_vintage.png and fibre_vintage.png in world space (1 texel = 1 world px); both are made tileable
here (tileable(): each edge band is cross-dissolved with the half-shifted texture, so opposite edges match). The
tile's origin is world (-660, -1140): the standard frame sits in the middle of a tile.

Deterministic (seeded). Adapted from scripts/build-china-paper.py.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2400, 4200
PAPER = np.array([237, 231, 217], dtype=np.float64)  # V_PAPER #EDE7D9
SEED = 20261009
GRAIN_W, GRAIN_H = 1200, 2040
# the tile's origin in world px (must match PAPER_ORIGIN in the kit)
ORIGIN_X, ORIGIN_Y = -660, -1140
# page cues (each only if it stays quiet on the sheet)
SHOW_THROUGH = 0.0  # darkening of the ghost print; 0 = off. Tried at 0.025: the text lines read as banding over the whole page
CREASE = 0.022  # depth of the fold's valley; 0 = off
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "china")

rng = np.random.default_rng(SEED)


def smooth_noise(cells_w: int, cells_h: int) -> np.ndarray:
    """Gaussian noise on a coarse lattice, upsampled bicubically to W x H, unit variance."""
    lat = rng.standard_normal((cells_h, cells_w)).astype(np.float32)
    img = Image.fromarray(lat).resize((W, H), Image.BICUBIC)
    a = np.asarray(img, dtype=np.float64)
    return (a - a.mean()) / (a.std() + 1e-9)


def fibre_layer(count: int, width_px: tuple, value: tuple, blur: float, mean_len: float = 4.6, max_len: float = 420, wobble: float = 0.05) -> np.ndarray:
    """Soft, slightly curved fibres drawn on a black canvas, blurred, 0..1."""
    canvas = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(canvas)
    for _ in range(count):
        x, y = rng.uniform(-200, W + 200), rng.uniform(-200, H + 200)
        length = float(np.clip(rng.lognormal(mean=mean_len, sigma=0.55), 12, max_len))
        ang = rng.uniform(0, np.pi)
        step = 4.0
        pts = [(x, y)]
        for _ in range(max(1, int(length / step))):
            ang += rng.normal(0, wobble)
            x += step * np.cos(ang)
            y += step * np.sin(ang)
            pts.append((x, y))
        w = int(rng.integers(width_px[0], width_px[1] + 1))
        v = int(rng.integers(value[0], value[1] + 1))
        d.line(pts, fill=v, width=w, joint="curve")
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(canvas, dtype=np.float64) / 255.0


def speck_layer(count: int, radius: tuple, value: tuple, blur: float) -> np.ndarray:
    """Fine specks (the shives and dirt of newsprint), 0..1."""
    canvas = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(canvas)
    for _ in range(count):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.uniform(radius[0], radius[1])
        v = int(rng.integers(value[0], value[1] + 1))
        d.ellipse((x - r, y - r * rng.uniform(0.6, 1.0), x + r, y + r * rng.uniform(0.6, 1.0)), fill=v)
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(canvas, dtype=np.float64) / 255.0


def soft_grain(shape: tuple, sigma_blur: float, g: np.random.Generator) -> np.ndarray:
    """Unit-variance noise softened by a small Gaussian (PIL blurs L images, so go through 8 bit)."""
    n8 = np.clip(128 + 40 * g.standard_normal(shape), 0, 255).astype(np.uint8)
    a = np.asarray(Image.fromarray(n8).filter(ImageFilter.GaussianBlur(sigma_blur)), dtype=np.float64)
    return (a - a.mean()) / (a.std() + 1e-9)


def tileable(a: np.ndarray, band: int = 260) -> np.ndarray:
    """Make a zero-mean-ish texture periodic: within `band` px of each edge it cross-dissolves into the texture
    shifted by half a tile (whose own seam lies in the middle, where the mask hides it). Variance is preserved."""
    mean = float(np.median(a))
    out = a - mean
    for axis in (1, 0):
        n = out.shape[axis]
        t = np.arange(n, dtype=np.float64)
        m = np.clip(np.minimum(t, n - 1 - t) / band, 0, 1)
        m = m * m * (3 - 2 * m)
        shape = [1, 1]
        shape[axis] = n
        m = m.reshape(shape)
        out = (out * m + np.roll(out, n // 2, axis=axis) * (1 - m)) / np.sqrt(m * m + (1 - m) * (1 - m))
    return out + mean


def show_through() -> np.ndarray:
    """The ghost of the other side's print: columns of text lines, a headline, two picture boxes; blurred; 0..1."""
    canvas = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(canvas)
    g = np.random.default_rng(SEED + 7)
    col_w, gutter, x = 348, 40, 46
    boxes = [(46 + 2 * (col_w + gutter), 1500, 46 + 4 * (col_w + gutter) - gutter, 2050), (46, 3100, 46 + 2 * (col_w + gutter) - gutter, 3560)]
    while x + col_w < W:
        y = 60 + g.uniform(0, 30)
        while y < H - 60:
            n = int(g.integers(4, 12))
            for i in range(n):
                x1 = x + col_w * (g.uniform(0.35, 0.8) if i == n - 1 else 1.0)
                if not any(bx0 - 20 < x1 and x < bx1 + 20 and by0 - 20 < y < by1 + 20 for bx0, by0, bx1, by1 in boxes):
                    d.rectangle((x, y, x1, y + 9), fill=255)
                y += 23
            y += 20
        x += col_w + gutter
    for bx0, by0, bx1, by1 in boxes:
        d.rectangle((bx0, by0, bx1, by1), fill=150)
    return np.asarray(canvas.filter(ImageFilter.GaussianBlur(3.2)), dtype=np.float64) / 255.0


def crease() -> np.ndarray:
    """One soft horizontal fold across the page at world y 1165: a fine valley line in a broad soft shading; -1..1."""
    yy = np.arange(H, dtype=np.float64)[:, None]
    xx = np.arange(W, dtype=np.float64)[None, :]
    y0 = (1165 - ORIGIN_Y) + 1.6 * np.sin(2 * np.pi * xx / W) + 0.9 * np.sin(2 * np.pi * 5 * xx / W + 1.3)
    dy = yy - y0
    valley = -np.exp(-(dy**2) / (2 * 1.4**2))
    shade = 0.35 * (dy / 26.0) * np.exp(-(dy**2) / (2 * 26.0**2)) * -1.0
    return valley + shade


# --- the ground --------------------------------------------------------------------------------------------------------
age = smooth_noise(5, 9)  # very low frequency: the sheet is a little uneven
mottle = 0.4 * smooth_noise(60, 105) + 0.35 * smooth_noise(160, 280) + 0.25 * smooth_noise(400, 700)
mottle = (mottle - mottle.mean()) / mottle.std()
light = fibre_layer(2600, (1, 1), (80, 180), 0.6)
dark = fibre_layer(1500, (1, 1), (60, 150), 0.7)
shives = fibre_layer(5200, (1, 2), (70, 200), 0.55, mean_len=3.0, max_len=60, wobble=0.12)
specks = speck_layer(5200, (0.6, 1.7), (90, 255), 0.55)
grain = soft_grain((H, W), 0.5, rng)

m = tileable(1.0 + 0.006 * age + 0.0045 * mottle + 0.006 * light - 0.005 * dark + 0.005 * grain)
if SHOW_THROUGH > 0:
    m = m - SHOW_THROUGH * np.asarray(Image.fromarray((show_through() * 255).astype(np.uint8)).transpose(Image.FLIP_LEFT_RIGHT), dtype=np.float64) / 255.0
if CREASE > 0:
    m = m + CREASE * crease()
# darker newsprint reads a little warmer: blue drops slightly faster than red
rgb = np.stack([PAPER[0] * m, PAPER[1] * np.power(m, 1.03), PAPER[2] * np.power(m, 1.09)], axis=-1)
rgb = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, "paper_vintage.png")
Image.fromarray(rgb).save(out, optimize=True)
lum = np.einsum("hwc,c->hw", rgb.astype(np.float64), np.array([0.2126, 0.7152, 0.0722]))
print(f"wrote {out}: {W}x{H}, mean {rgb.reshape(-1, 3).mean(axis=0).round(1)}, luminance p1/p50/p99 "
      f"{np.percentile(lum, 1):.1f}/{np.percentile(lum, 50):.1f}/{np.percentile(lum, 99):.1f}, "
      f"{os.path.getsize(out) / 1e6:.1f} MB")

# --- the neutral fibre map (hard-light over everything; mean 128) ---------------------------------------------------------
fib = 128.0 + 15.0 * light - 22.0 * dark - 40.0 * shives - 62.0 * specks + 1.5 * mottle + 2.6 * grain
fib = tileable(fib)
fib = fib - (np.median(fib) - 128.0)
fib8 = np.clip(np.round(fib), 0, 255).astype(np.uint8)
out = os.path.join(OUT_DIR, "fibre_vintage.png")
Image.fromarray(fib8).save(out, optimize=True)
fa = fib8.astype(np.float64)
print(f"wrote {out}: {fib8.shape[1]}x{fib8.shape[0]}, mean {fa.mean():.1f}, median {np.median(fa):.0f}, sd {fa.std():.1f}, "
      f"p1/p99 {np.percentile(fa, 1):.0f}/{np.percentile(fa, 99):.0f}, {os.path.getsize(out) / 1e6:.1f} MB")

# --- print grain, 4 frames (unchanged from pass 1) --------------------------------------------------------------------------
for i in range(4):
    g = np.random.default_rng(SEED + 101 * (i + 1))
    fine = soft_grain((GRAIN_H, GRAIN_W), 0.45, g)
    clump = soft_grain((GRAIN_H, GRAIN_W), 1.1, g)
    n = 0.8 * fine + 0.6 * clump
    n = n / n.std()
    g8 = np.clip(np.round(128.0 + 20.0 * n), 0, 255).astype(np.uint8)
    out = os.path.join(OUT_DIR, f"grain_{i}.png")
    Image.fromarray(g8).save(out, optimize=True)
    print(f"wrote {out}: {GRAIN_W}x{GRAIN_H}, mean {g8.mean():.1f}, sd {g8.std():.1f}, "
          f"{os.path.getsize(out) / 1e6:.1f} MB")
