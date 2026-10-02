"""Bake the Cheeky Pint 2.0 look-development textures (deterministic; no downloads).

Run once:  python3 scripts/build-cheekypint2-textures.py
Reads:     public/brown-paper.png (the house kraft photo, 6196 x 3478)
Writes:    public/cheekypint2/ (every texture 1296 x 2304 = 1.2 x the 1080 x 1920 frame, so a
           moving camera has parallax headroom; a still draws the centre at 1:1)
  kraft-fresh.jpg  the kraft photo CRISP and LIGHT: the large cloudy mottle flattened to ~35 %,
                   the fibres boosted with an unsharp mask so they survive a phone screen, and the
                   whole sheet lifted to a light warm kraft. Ground of looks 1 (freshKraft) and 3
                   (print).
  kraft-frost.jpg  the same sheet blurred ~14 px: what a frosted-glass column shows of the paper
                   behind it (drawn clipped to the glass, under a cream tint).
  stout.jpg        look 2's ground: a stout-black warm brown (#17110C) with the kraft's fibres in
                   it at a few percent, so it reads as dark card, not as a flat fill.
  grain.png        fine film grain, mid-grey 128 +- noise, for an overlay / soft-light pass.
  card.png         card-stock fibre (light and dark hair fibres + tooth), mid-grey, soft-light
                   inside the cream cards so they read as stock, not as UI.
  speckle.png      print ink texture (look 3): white with clustered gaps covering ~6 %, used as a
                   luminance mask that eats a little of each ink layer.

Why bake: the old KraftBackground blurred a 3000 px photo by 13 px live on every frame. Baked,
the ground is one <Img> draw per frame and every texture is a fixed asset the motion version can
offset per frame (grain on twos) at no filter cost.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "brown-paper.png")
OUT = os.path.join(ROOT, "public", "cheekypint2")
W, H = 1296, 2304
SEED = 20261002
rng = np.random.default_rng(SEED)
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


# --- helpers -----------------------------------------------------------------------------------
def box_axis(a: np.ndarray, r: int, axis: int) -> np.ndarray:
    """Running mean of radius r along one axis (edge-padded), same shape."""
    if r < 1:
        return a
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis, dtype=np.float64)
    n = 2 * r + 1
    if axis == 0:
        out = c[n:] - c[:-n]
    else:
        out = c[:, n:] - c[:, :-n]
    return (out / n).astype(np.float32)


def blur(a: np.ndarray, sigma: float) -> np.ndarray:
    """Three box passes per axis ~ a gaussian of `sigma` px (2-D float array)."""
    if sigma <= 0:
        return a
    w = np.sqrt(12 * sigma * sigma / 3 + 1)
    r = max(1, int(round((w - 1) / 2)))
    out = a
    for _ in range(3):
        out = box_axis(out, r, 0)
        out = box_axis(out, r, 1)
    return out


def blur_rgb(a: np.ndarray, sigma: float) -> np.ndarray:
    return np.stack([blur(a[..., c], sigma) for c in range(a.shape[-1])], axis=-1)


def luma(rgb: np.ndarray) -> np.ndarray:
    return np.einsum("hwc,c->hw", rgb, LUMA)


def save_rgb(a: np.ndarray, name: str, quality: int = 92) -> None:
    img = Image.fromarray(np.clip(np.round(a * 255), 0, 255).astype(np.uint8), "RGB")
    path = os.path.join(OUT, name)
    if name.endswith(".jpg"):
        img.save(path, quality=quality, subsampling=0, optimize=True)
    else:
        img.save(path, optimize=True)
    m = (a.reshape(-1, 3).mean(axis=0) * 255).round(1)
    lum = luma(a) * 255
    print(f"{name}: mean RGB {m}, luma p1/p50/p99 {np.percentile(lum, 1):.1f}/{np.percentile(lum, 50):.1f}/"
          f"{np.percentile(lum, 99):.1f}, {os.path.getsize(path) / 1e6:.2f} MB")


def save_grey(a: np.ndarray, name: str) -> None:
    img = Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), "L")
    path = os.path.join(OUT, name)
    img.save(path, optimize=True)
    print(f"{name}: mean {a.mean():.1f}, std {a.std():.1f}, {os.path.getsize(path) / 1e6:.2f} MB")


os.makedirs(OUT, exist_ok=True)

# --- 1. the kraft sheet, crisp and light ---------------------------------------------------------
# A portrait window of the landscape photo at SCALE source px per output px (1.3: the fibres come
# out a little finer and sharper than 1:1, where the photo is soft).
SCALE = 1.3
src = Image.open(SRC).convert("RGB")
sw, sh = src.size
cw, ch = int(W * SCALE), int(H * SCALE)
x0 = (sw - cw) // 2 + 380  # off-centre: the photo's middle has a darker cloud
y0 = (sh - ch) // 2
crop = src.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
rgb = np.asarray(crop, dtype=np.float32) / 255.0
L = luma(rgb)

# flatten the cloudy mottle to MOTTLE_KEEP of itself (ratio to a heavy blur), keep the fibres
MOTTLE_KEEP = 0.35
Lb = blur(L, 90)
Lflat = L / np.maximum(Lb, 1e-4) * Lb.mean() * np.power(Lb / Lb.mean(), MOTTLE_KEEP)
# boost the fibres: unsharp mask at two radii (hair fibres ~1.5 px, tooth ~5 px)
Ls = Lflat + 1.15 * (Lflat - blur(Lflat, 1.6)) + 0.55 * (Lflat - blur(Lflat, 5.0))
gain = (Ls / np.maximum(L, 1e-4))[..., None]
fresh = rgb * gain
# lift to a light warm kraft: per-channel scale to the target mean, then a gentle shoulder
TARGET = np.array([206, 172, 127], dtype=np.float32) / 255.0  # ~#CEAC7F, a light kraft
fresh = np.clip(fresh * (TARGET / fresh.reshape(-1, 3).mean(axis=0)), 0, 1)
save_rgb(fresh, "kraft-fresh.jpg")

# --- 2. frosted glass: the same sheet, blurred -----------------------------------------------------
frost = blur_rgb(fresh, 14.0)
save_rgb(frost, "kraft-frost.jpg")

# --- 3. stout: dark warm brown with the kraft's fibres faintly in it --------------------------------
STOUT = np.array([23, 17, 12], dtype=np.float32) / 255.0  # #17110C
det = (Ls - blur(Ls, 6.0)) / (Ls.std() + 1e-6)  # fibre detail, ~unit variance
det = np.clip(det, -3, 3)
mot = (Lb - Lb.mean()) / (Lb.std() + 1e-6)
m = 1.0 + 0.085 * det + 0.05 * mot
stout = STOUT[None, None, :] * m[..., None]
save_rgb(np.clip(stout, 0, 1), "stout.jpg", quality=95)

# --- 4. film grain -----------------------------------------------------------------------------------
g8 = np.clip(128 + 46 * rng.standard_normal((H, W)), 0, 255).astype(np.uint8)
g = np.asarray(Image.fromarray(g8, "L").filter(ImageFilter.GaussianBlur(0.55)), dtype=np.float32)
g = 128 + (g - g.mean()) / (g.std() + 1e-6) * 30
save_grey(g, "grain.png")


# --- 5. card stock fibre -------------------------------------------------------------------------------
def fibre_layer(count: int, value: tuple, blur_px: float) -> np.ndarray:
    canvas = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(canvas)
    for _ in range(count):
        x, y = rng.uniform(-100, W + 100), rng.uniform(-100, H + 100)
        length = float(np.clip(rng.lognormal(mean=3.4, sigma=0.5), 8, 120))
        ang = rng.uniform(0, np.pi)
        pts = [(x, y)]
        for _ in range(int(length / 3)):
            ang += rng.normal(0, 0.12)
            x += 3 * np.cos(ang)
            y += 3 * np.sin(ang)
            pts.append((x, y))
        d.line(pts, fill=int(rng.integers(value[0], value[1] + 1)), width=1, joint="curve")
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur_px))
    return np.asarray(canvas, dtype=np.float32) / 255.0


light = fibre_layer(9000, (90, 200), 0.45)
dark = fibre_layer(5000, (70, 170), 0.5)
tooth8 = np.clip(128 + 50 * rng.standard_normal((H, W)), 0, 255).astype(np.uint8)
tooth = np.asarray(Image.fromarray(tooth8, "L").filter(ImageFilter.GaussianBlur(1.1)), dtype=np.float32)
tooth = (tooth - tooth.mean()) / (tooth.std() + 1e-6)
cloud = blur(rng.standard_normal((H, W)).astype(np.float32), 26)
cloud = cloud / (cloud.std() + 1e-6)
card = 128 + 70 * light - 60 * dark + 7 * tooth + 6 * cloud
save_grey(card, "card.png")

# --- 6. print ink speckle -----------------------------------------------------------------------------
# What a screen print's solid looks like up close: the ink's density mottles a little (a fine tooth,
# ~0.9-1.0, drifting slowly across the sheet) and a sparse dust of 1-2 px pinholes lets the paper
# through. ~5-6 % of each fill is eaten on average, and nothing reads as a blotch at phone size.
# (v1 clustered at 7 px and v2 at 2-6 px: both read as crumbs / grunge, not as ink.)
tooth_n = blur(rng.standard_normal((H, W)).astype(np.float32), 0.7)
tooth_n = tooth_n / tooth_n.std()
drift = blur(rng.standard_normal((H, W)).astype(np.float32), 50.0)
drift = drift / drift.std()
dens = 0.955 - 0.032 * np.clip(tooth_n, -2.5, 2.5) - 0.02 * drift  # ink density, mean ~0.955
pin_field = blur(rng.standard_normal((H, W)).astype(np.float32), 0.55)
pins = pin_field < np.percentile(pin_field, 1.4)  # 1-2 px pinholes, ~1.4 %
dens = np.where(pins, 0.12, dens)
mask = np.clip(dens, 0, 1) * 255
save_grey(mask, "speckle.png")
print(f"speckle: mean ink density {mask.mean() / 255:.3f} (eats {100 - 100 * mask.mean() / 255:.1f} %), "
      f"pinholes {100 * pins.mean():.1f} %")
