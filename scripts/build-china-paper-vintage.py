"""Bake the "ChinaTalk, slightly vintage" paper assets (kit: generated/components/chinatalkVintage.tsx).

Run once:  python3 scripts/build-china-paper-vintage.py
Writes (all under public/china/):
  paper_vintage.png   2400x4200 RGB   the aged rice-paper ground (#F2EBDB): the build-china-paper.py recipe (mottle,
                                      soft fibres, fine grain) with a few more dark fibres and a very low-frequency
                                      age toning. Still a calm LIGHT paper: no stains, no foxing, no creases.
  fibre_vintage.png   1200x2100 L     the SAME fibres and mottle as a neutral map (mean 128), contrast amplified. The
                                      kit lays it over everything (soft-light, low opacity, same transform as the
                                      ground) so the paper's fibre shows faintly through flat red and ink.
  grain_0..3.png      1200x2040 L     neutral fine print grain (mean 128). The kit shows one per 2 frames (soft-light)
                                      at a hashed offset / flip, so a held frame stays alive.

Deterministic (seeded). Adapted from scripts/build-china-paper.py.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2400, 4200
PAPER = np.array([242, 235, 219], dtype=np.float64)  # V_PAPER #F2EBDB
SEED = 20261009
GRAIN_W, GRAIN_H = 1200, 2040
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "china")

rng = np.random.default_rng(SEED)


def smooth_noise(cells_w: int, cells_h: int) -> np.ndarray:
    """Gaussian noise on a coarse lattice, upsampled bicubically to W x H, unit variance."""
    lat = rng.standard_normal((cells_h, cells_w)).astype(np.float32)
    img = Image.fromarray(lat).resize((W, H), Image.BICUBIC)
    a = np.asarray(img, dtype=np.float64)
    return (a - a.mean()) / (a.std() + 1e-9)


def fibre_layer(count: int, width_px: tuple, value: tuple, blur: float) -> np.ndarray:
    """Soft, slightly curved fibres drawn on a black canvas, blurred, 0..1."""
    canvas = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(canvas)
    for _ in range(count):
        x, y = rng.uniform(-200, W + 200), rng.uniform(-200, H + 200)
        length = float(np.clip(rng.lognormal(mean=4.6, sigma=0.55), 30, 420))
        ang = rng.uniform(0, np.pi)
        step = 4.0
        pts = [(x, y)]
        for _ in range(int(length / step)):
            ang += rng.normal(0, 0.05)
            x += step * np.cos(ang)
            y += step * np.sin(ang)
            pts.append((x, y))
        w = int(rng.integers(width_px[0], width_px[1] + 1))
        v = int(rng.integers(value[0], value[1] + 1))
        d.line(pts, fill=v, width=w, joint="curve")
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(canvas, dtype=np.float64) / 255.0


def soft_grain(shape: tuple, sigma_blur: float, g: np.random.Generator) -> np.ndarray:
    """Unit-variance noise softened by a small Gaussian (PIL blurs L images, so go through 8 bit)."""
    n8 = np.clip(128 + 40 * g.standard_normal(shape), 0, 255).astype(np.uint8)
    a = np.asarray(Image.fromarray(n8).filter(ImageFilter.GaussianBlur(sigma_blur)), dtype=np.float64)
    return (a - a.mean()) / (a.std() + 1e-9)


# --- the ground ---------------------------------------------------------------------------------------------------
age = smooth_noise(5, 9)  # very low frequency: the sheet has toned unevenly
mottle = 0.4 * smooth_noise(60, 105) + 0.35 * smooth_noise(160, 280) + 0.25 * smooth_noise(400, 700)
mottle = (mottle - mottle.mean()) / mottle.std()
light = fibre_layer(2600, (1, 1), (80, 180), 0.6)
dark = fibre_layer(1900, (1, 1), (60, 150), 0.7)
grain = soft_grain((H, W), 0.5, rng)

m = 1.0 + 0.004 * age + 0.0036 * mottle + 0.017 * light - 0.015 * dark + 0.005 * grain
# darker paper reads warmer (aged): blue drops faster than red
rgb = np.stack([PAPER[0] * m, PAPER[1] * np.power(m, 1.04), PAPER[2] * np.power(m, 1.12)], axis=-1)
rgb = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, "paper_vintage.png")
Image.fromarray(rgb).save(out, optimize=True)
lum = np.einsum("hwc,c->hw", rgb.astype(np.float64), np.array([0.2126, 0.7152, 0.0722]))
print(f"wrote {out}: {W}x{H}, mean {rgb.reshape(-1, 3).mean(axis=0).round(1)}, luminance p1/p50/p99 "
      f"{np.percentile(lum, 1):.1f}/{np.percentile(lum, 50):.1f}/{np.percentile(lum, 99):.1f}, "
      f"{os.path.getsize(out) / 1e6:.1f} MB")

# --- the neutral fibre map (same fibres, amplified, mean 128) -------------------------------------------------------
fib = 128.0 + 150.0 * light - 130.0 * dark + 2.5 * mottle + 5.0 * grain
fib = fib - (fib.mean() - 128.0)
fib8 = np.clip(np.round(fib), 0, 255).astype(np.uint8)
fib_img = Image.fromarray(fib8).resize((W // 2, H // 2), Image.LANCZOS)
out = os.path.join(OUT_DIR, "fibre_vintage.png")
fib_img.save(out, optimize=True)
fa = np.asarray(fib_img, dtype=np.float64)
print(f"wrote {out}: {fib_img.size}, mean {fa.mean():.1f}, sd {fa.std():.1f}, p1/p99 "
      f"{np.percentile(fa, 1):.0f}/{np.percentile(fa, 99):.0f}, {os.path.getsize(out) / 1e6:.1f} MB")

# --- print grain, 4 frames --------------------------------------------------------------------------------------------
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
