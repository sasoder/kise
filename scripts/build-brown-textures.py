"""Bake the BROWN grounds for the stout system's palette pass (deterministic; no downloads).

Run:    python3 scripts/build-brown-textures.py
Reads:  public/brown-paper.png (the house kraft photo, 6196 x 3478)
Writes: public/cheekypint2/brown-b1.jpg, brown-b2.jpg, brown-b3.jpg ONLY (1296 x 2304, like stout.jpg).
        It never touches stout.jpg or any other texture: build-cheekypint2-textures.py owns those.

Why: the stout ground (#17110C, L* 5.5) read like a black / orange / white brand. These sheets are the
same kraft photo, the same crop and the same fibre extraction as stout.jpg (so the fibres sit in the
same place under the same parallax), mapped onto a BROWN board instead of near-black:
  B1 espresso   mean #432C1C (L* 20; #402C1F with a little more chroma, C 17)
  B2 walnut     mean #533726 (L* 26)   (B2g uses this sheet too)
  B3 dark kraft mean #5B3E28 (L* 29; the light pool lifts the subject area to ~32, the band's top)
A brown board reads as a material, so the fibres show more than in stout (FIBRE / MOTTLE below), and
a little of the photo's own colour variation is kept (CHROMA_KEEP), so lighter fibres are a touch
yellower and the hollows a touch redder, as real kraft. Each sheet is then rescaled per channel to
its exact target mean.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "brown-paper.png")
OUT = os.path.join(ROOT, "public", "cheekypint2")
W, H = 1296, 2304
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

# name -> (target mean sRGB, fibre gain, mottle gain, chroma keep, dark keep)
# dark keep < 1 softens only the DARK side of the fibres and the mottle (light hairs on a dark board
# stay as they are): B1's corners must never fall below L* 14 (director, Oct 2 2026), and the
# sheet's own dark fibres, not the vignette, set its darkest percentile.
SHEETS = {
    "brown-b1.jpg": ((67, 44, 28), 0.10, 0.055, 0.30, 0.55),
    "brown-b2.jpg": ((83, 55, 38), 0.11, 0.06, 0.30, 1.0),
    "brown-b3.jpg": ((91, 62, 40), 0.11, 0.06, 0.30, 1.0),
}
# `python3 scripts/build-brown-textures.py brown-b1.jpg` bakes only the named sheets.
ONLY = set(sys.argv[1:])


# --- helpers (as build-cheekypint2-textures.py) ---------------------------------------------------
def box_axis(a: np.ndarray, r: int, axis: int) -> np.ndarray:
    if r < 1:
        return a
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis, dtype=np.float64)
    n = 2 * r + 1
    out = c[n:] - c[:-n] if axis == 0 else c[:, n:] - c[:, :-n]
    return (out / n).astype(np.float32)


def blur(a: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return a
    w = np.sqrt(12 * sigma * sigma / 3 + 1)
    r = max(1, int(round((w - 1) / 2)))
    out = a
    for _ in range(3):
        out = box_axis(out, r, 0)
        out = box_axis(out, r, 1)
    return out


def luma(rgb: np.ndarray) -> np.ndarray:
    return np.einsum("hwc,c->hw", rgb, LUMA)


# --- the kraft sheet: the same crop, mottle flattening and fibre boost as stout.jpg's source --------
SCALE = 1.3
src = Image.open(SRC).convert("RGB")
sw, sh = src.size
cw, ch = int(W * SCALE), int(H * SCALE)
x0 = (sw - cw) // 2 + 380
y0 = (sh - ch) // 2
crop = src.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
rgb = np.asarray(crop, dtype=np.float32) / 255.0
L = luma(rgb)
MOTTLE_KEEP = 0.35
Lb = blur(L, 90)
Lflat = L / np.maximum(Lb, 1e-4) * Lb.mean() * np.power(Lb / Lb.mean(), MOTTLE_KEEP)
Ls = Lflat + 1.15 * (Lflat - blur(Lflat, 1.6)) + 0.55 * (Lflat - blur(Lflat, 5.0))
det = np.clip((Ls - blur(Ls, 6.0)) / (Ls.std() + 1e-6), -3, 3)  # fibre detail, ~unit variance
mot = (Lb - Lb.mean()) / (Lb.std() + 1e-6)  # the large cloud, unit variance
# the photo's own colour variation: each channel relative to the luminance, normalised to its mean
ratio = rgb / np.maximum(L, 1e-4)[..., None]
ratio = np.stack([blur(ratio[..., c], 1.2) for c in range(3)], axis=-1)  # no per-pixel colour noise
ratio = ratio / ratio.reshape(-1, 3).mean(axis=0)

os.makedirs(OUT, exist_ok=True)
for name, (target, fibre, mottle, chroma, dark) in SHEETS.items():
    if ONLY and name not in ONLY:
        continue
    T = np.array(target, dtype=np.float32) / 255.0
    m = 1.0 + fibre * det + mottle * mot
    if dark != 1.0:
        m = np.where(m < 1.0, 1.0 - (1.0 - m) * dark, m)
    sheet = T[None, None, :] * m[..., None] * np.power(ratio, chroma)
    sheet = sheet * (T / sheet.reshape(-1, 3).mean(axis=0))  # exact target mean, per channel
    sheet = np.clip(sheet, 0, 1)
    img = Image.fromarray(np.clip(np.round(sheet * 255), 0, 255).astype(np.uint8))
    path = os.path.join(OUT, name)
    img.save(path, quality=95, subsampling=0, optimize=True)
    a = np.asarray(img, dtype=np.float32)
    lum = luma(a / 255.0) * 255
    print(f"{name}: mean RGB {a.reshape(-1, 3).mean(axis=0).round(1)}, luma p1/p50/p99 "
          f"{np.percentile(lum, 1):.1f}/{np.percentile(lum, 50):.1f}/{np.percentile(lum, 99):.1f}, "
          f"{os.path.getsize(path) / 1e6:.2f} MB")
