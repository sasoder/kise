"""Generate the China theme's paper texture (rice paper: warm ground, soft fibres, mottle).

Run once:  python3 scripts/build-china-paper.py
Writes:    public/china/paper.png (2400x4200, RGB)

Deterministic (seeded). The texture is drawn by the Stage like the old grid photo: oversized,
parallax 0.15, the same slow drift on S. Contrast is kept low so it reads as paper, not noise:
mottle ~+-0.35 % (more read as clouds), fine fibres ~+-1.5 %, grain ~0.4 % of the paper's luminance;
a clean white (#F8F5EF), warm only on a second look.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2400, 4200
PAPER = np.array([248, 245, 239], dtype=np.float64)  # #F8F5EF (a clean rice-paper white)
SEED = 20261002
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "china", "paper.png")

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


mottle = 0.4 * smooth_noise(60, 105) + 0.35 * smooth_noise(160, 280) + 0.25 * smooth_noise(400, 700)
mottle = (mottle - mottle.mean()) / mottle.std()
light = fibre_layer(2600, (1, 1), (80, 180), 0.6)
dark = fibre_layer(1500, (1, 1), (60, 150), 0.7)
# fine grain: noise as an 8-bit layer (PIL blurs L images, not float ones), softened
grain8 = np.clip(128 + 40 * rng.standard_normal((H, W)), 0, 255).astype(np.uint8)
grain = np.asarray(Image.fromarray(grain8).filter(ImageFilter.GaussianBlur(0.5)), dtype=np.float64)
grain = (grain - grain.mean()) / (grain.std() + 1e-9)

m = 1.0 + 0.0035 * mottle + 0.016 * light - 0.012 * dark + 0.004 * grain
# darker paper reads warmer: blue drops a little faster than red
rgb = np.stack(
    [PAPER[0] * m, PAPER[1] * np.power(m, 1.02), PAPER[2] * np.power(m, 1.05)],
    axis=-1,
)
rgb = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
Image.fromarray(rgb).save(OUT, optimize=True)
lum = np.einsum("hwc,c->hw", rgb.astype(np.float64), np.array([0.2126, 0.7152, 0.0722]))
print(f"wrote {OUT}: {W}x{H}, mean {rgb.reshape(-1, 3).mean(axis=0).round(1)}, luminance p1/p50/p99 "
      f"{np.percentile(lum, 1):.1f}/{np.percentile(lum, 50):.1f}/{np.percentile(lum, 99):.1f}, "
      f"{os.path.getsize(OUT) / 1e6:.1f} MB")
