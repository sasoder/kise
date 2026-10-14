#!/usr/bin/env python3
"""
Bake the textures of NoEyesOnIt (generated/components/NoEyesOnIt.tsx), Cheeky Pint S4E02.
Sources (public/marsocean/, untouched): GEBCO_2026 shaded relief (global 8k + South Pacific 4k tile) and the
GEBCO_2026 TID "measured" masks. Nothing is downloaded.

The GEBCO colour relief is hypsometric (blue by depth, green/brown land) times a hillshade. The cut recolours it
in its shader, so the relief is split into three channels, one RGB JPEG per source (4:4:4, q95):
  R = shade   the hillshade: lum / blur(lum) (0.5 = flat), the relief the shader lights
  G = depth   broad lightness of the hypsometric colour (0 deep .. 1 shallow / shelf)
  B = land    1 on land / ice, 0 in the sea (soft edge)
Blur radii are the same in DEGREES for every source, so the three resolutions recolour identically and the
shader's hand-off between them shows no seam.

Outputs (public/marsocean/):
  noeyes_global_relief_8k.jpg   8192x4096, lon -180..180, lat 90..-90
  noeyes_tile_relief_4k.jpg     4096x4096, lon -140..-115, lat -20..-45
  noeyes_close_relief.jpg       CLOSE window of the tile (tile px), Lanczos x3 + unsharp (the ship's close-up)
  noeyes_close_mask.png         the measured mask over the same window, Lanczos x3 (soft swath edges)

Run:  python3 scripts/bake-noeyes-textures.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "public", "marsocean")

# the close-up window, in tile px (x0, y0, size) and its upsampling; keep in sync with NoEyesOnIt.tsx CLOSE
CLOSE = (1340, 920, 1280)
UP = 3

DEG_PER_PX = {"global": 360 / 8192, "tile": 25 / 4096}


def channels(img: Image.Image, deg_per_px: float, wrap: bool = False) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    pad = 0
    if wrap:  # the global map continues across lon 180: blur across the seam, not into a border
        pad = int(3 * 0.35 / deg_per_px)
        a = np.concatenate([a[:, -pad:], a, a[:, :pad]], axis=1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    # land: green / tan / white (the sea is always blue-dominant)
    land = ((b < g - 14) | (r > b + 4) | (np.minimum(np.minimum(r, g), b) > 222)).astype(np.float32)
    rad_land = max(1.0, 0.03 / deg_per_px)
    land_im = Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(
        ImageFilter.GaussianBlur(rad_land)
    )
    # broad lightness (depth) and the hillshade ratio
    rad = 0.35 / deg_per_px
    lum_im = Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8))
    base = np.asarray(lum_im.filter(ImageFilter.GaussianBlur(rad))).astype(np.float32)
    shade = np.clip(0.5 * (lum + 1) / (base + 1), 0, 1)
    depth = np.clip((base - 70) / (200 - 70), 0, 1)
    out = np.stack([shade * 255, depth * 255, np.asarray(land_im).astype(np.float32)], -1)
    if pad:
        out = out[:, pad:-pad]
    return Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8))


def save_jpg(im: Image.Image, name: str):
    im.save(os.path.join(D, name), quality=95, subsampling=0)
    print("wrote", name, im.size)


def main():
    g = Image.open(os.path.join(D, "gebco2026_relief_8k.jpg")).convert("RGB")
    ga = np.asarray(g).copy()
    ga[:, 0] = ga[:, 1]  # the WMS render's first column is a bright seam line at lon -180
    g = Image.fromarray(ga)
    save_jpg(channels(g, DEG_PER_PX["global"], wrap=True), "noeyes_global_relief_8k.jpg")

    t = Image.open(os.path.join(D, "spacific_relief_4k.jpg"))
    tc = channels(t, DEG_PER_PX["tile"])
    save_jpg(tc, "noeyes_tile_relief_4k.jpg")

    x0, y0, n = CLOSE
    box = (x0, y0, x0 + n, y0 + n)
    # upsample the RAW colour relief and split it again at the finer scale (same radii in degrees)
    # the WMS render carries 8x8 compression blocks: soften them a touch before the upsample
    raw = t.crop(box).filter(ImageFilter.GaussianBlur(0.55)).resize((n * UP, n * UP), Image.BICUBIC)
    raw = raw.filter(ImageFilter.UnsharpMask(radius=2.0, percent=45, threshold=1))
    cc = channels(raw, DEG_PER_PX["tile"] / UP)
    save_jpg(cc, "noeyes_close_relief.jpg")
    m = Image.open(os.path.join(D, "spacific_measured_mask_4k.png")).convert("L").crop(box).resize((n * UP, n * UP), Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(1.3))  # the TID grid's stippled (partial) cells read as a mesh close up
    m.save(os.path.join(D, "noeyes_close_mask.png"), optimize=True)
    print("wrote noeyes_close_mask.png", m.size)


if __name__ == "__main__":
    main()
