"""Bake the MarsVsOceanV2 seafloor: public/marsocean/mvo_earth_floor_4k.jpg (greyscale, 4096x2048).

Run from the repo root (after scripts/clips/will-mars-ocean/bake-marsocean-mvo.py):  python3 scripts/clips/will-mars-ocean/bake-marsocean-v2-floor.py
GEBCO_2026 shaded relief, ocean only: normalised to the ocean's own range (5th-99th percentile), islands and land
replaced by the surrounding floor (a masked blur), so nothing bright pokes through the water.
"""
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
D = "public/marsocean/"
g = np.asarray(Image.open("assets-src/marsocean/gebco2026_relief_8k.jpg").convert("L").resize((4096, 2048), Image.LANCZOS)).astype(np.float32)
water = np.asarray(Image.open(D + "mvo_earth_ocean_4k.png").convert("RGB"))[..., 0].astype(np.float32) / 255
land = np.asarray(Image.open(D + "mvo_earth_gridland_4k.png").convert("L")).astype(np.float32) / 255
sea = (water > 0.5) & (land < 0.5)
lo, hi = np.percentile(g[sea], 5), np.percentile(g[sea], 99)
v = np.clip((g - lo) / (hi - lo), 0, 1)
# fill land + small islands from the surrounding floor: masked blur (normalised convolution), wrap-aware
m = (sea & (g < np.percentile(g[sea], 97))).astype(np.float32)
pad = 64
def blur(a, r):
    """Gaussian blur of a 0..1 array at 1024x512 (8-bit), wrap-aware, back to full size."""
    small = np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((1024, 512), Image.BOX)).astype(np.uint8)
    w = np.concatenate([small[:, -pad:], small, small[:, :pad]], axis=1)
    bl = np.asarray(Image.fromarray(w).filter(ImageFilter.GaussianBlur(r)))[:, pad:-pad]
    return np.asarray(Image.fromarray(bl).resize((4096, 2048), Image.BICUBIC)).astype(np.float32) / 255
num = blur(v * m, 6)
den = blur(m, 6)
fill = np.clip(num / np.maximum(den, 1e-3), 0, 1)
out = np.where(m > 0.5, v, fill)
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(D + "mvo_earth_floor_4k.jpg", quality=90)
print("ok", lo, hi)
