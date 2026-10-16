"""Bake the MarsVsOcean (Cheeky Pint S4E02) Earth textures into public/marsocean/ (mvo_ prefix; originals untouched).

Run from the repo root:  python3 scripts/clips/will-mars-ocean/bake-marsocean-mvo.py
Inputs : public/marsocean/earth_daymap_8k.jpg (Solar System Scope, CC BY 4.0),
         public/marsocean/earth_topobathy_5400.jpg (NASA Blue Marble NG topo + bathy, public domain)
Outputs: mvo_earth_color_4k.jpg   the daymap at 4096x2048
         mvo_earth_ocean_4k.png   R = water (soft coast, from the daymap's flat navy)
                                  G = shelf (Blue Marble ocean luminance, blurred: 1 = shallow)
                                  B = basin (0 at coasts .. 1 in the middle of an ocean basin, smooth)
         mvo_earth_gridland_4k.png  land that carries the grid: land minus islands under ~3.5 deg
"""
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
D = "public/marsocean/"


def blur(a, r):
    return np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def wrapx(a, pad):
    return np.concatenate([a[:, -pad:], a, a[:, :pad]], axis=1)


# --- colour + water mask + shelf ---------------------------------------------------------------
day = Image.open(D + "earth_daymap_8k.jpg").convert("RGB")
a = np.asarray(day).astype(np.float32)
dist = np.sqrt(((a - np.array([30, 59, 117])) ** 2).sum(-1))
ocean = np.clip((40 - dist) / 25, 0, 1)
ocean_img = Image.fromarray((ocean * 255).astype(np.uint8)).resize((4096, 2048), Image.BOX)
tb = Image.open(D + "earth_topobathy_5400.jpg").convert("RGB").resize((4096, 2048), Image.LANCZOS)
t = np.asarray(tb).astype(np.float32)
lum = 0.2126 * t[..., 0] + 0.7152 * t[..., 1] + 0.0722 * t[..., 2]
om = np.asarray(ocean_img).astype(np.float32) / 255
vals = lum[om > 0.9]
lo, hi = np.percentile(vals, 5), np.percentile(vals, 99)
shelf = np.clip((lum - lo) / (hi - lo), 0, 1)
shelf = np.where(om > 0.5, shelf, 1.0)  # land counts as shallow so the coast glows evenly
shelf_img = Image.fromarray((shelf * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
out = np.zeros((2048, 4096, 3), np.uint8)
out[..., 0] = np.asarray(ocean_img)
out[..., 1] = np.asarray(shelf_img)
day.resize((4096, 2048), Image.LANCZOS).save(D + "mvo_earth_color_4k.jpg", quality=92)

# --- basin: distance-from-coast, multi-scale, softened ------------------------------------------
water = Image.fromarray(out[..., 0]).resize((1024, 512), Image.BOX)
land = 255 - np.asarray(water)
wrap = wrapx(land, 256)
near = blur(wrap, 8)[:, 256:-256] * 1.0 + blur(wrap, 36)[:, 256:-256] * 1.1 + blur(wrap, 100)[:, 256:-256] * 1.6
basin = np.clip(1 - near, 0, None)
wat = np.asarray(water).astype(np.float32) / 255
basin = basin / max(1e-6, np.percentile(basin[wat > 0.5], 99.5))
basin = np.clip(basin, 0, 1) ** 0.7
basin = blur(wrapx((basin * 255).astype(np.uint8), 256), 14)[:, 256:-256]
basin = np.clip(basin / max(1e-6, basin.max()), 0, 1)
out[..., 2] = np.asarray(Image.fromarray((basin * 255).astype(np.uint8)).resize((4096, 2048), Image.BICUBIC))
Image.fromarray(out).save(D + "mvo_earth_ocean_4k.png", optimize=True)

# --- grid land: morphological opening (~3.5 deg) drops small islands; exact coast kept ----------
land4 = 1 - out[..., 0].astype(np.float32) / 255
small = np.asarray(Image.fromarray((land4 * 255).astype(np.uint8)).resize((1024, 512), Image.BOX))
pad = 64
im = Image.fromarray(np.where(wrapx(small, pad) > 127, 255, 0).astype(np.uint8))
opened = im.filter(ImageFilter.MinFilter(11)).filter(ImageFilter.MaxFilter(11))
grown = opened.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
g = np.asarray(grown)[:, pad:-pad]
g4 = np.asarray(Image.fromarray(g).resize((4096, 2048), Image.BILINEAR)).astype(np.float32) / 255
gl = np.clip(land4 * np.clip(g4 * 1.5, 0, 1), 0, 1)
Image.fromarray((gl * 255).astype(np.uint8)).save(D + "mvo_earth_gridland_4k.png", optimize=True)
print("baked mvo_earth_color_4k.jpg, mvo_earth_ocean_4k.png, mvo_earth_gridland_4k.png")
