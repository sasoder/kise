"""DefensePaysFirst (cut 43, revision 2): retouch the C2 assets.

1. The Constellation (R7V-2, natural metal, side, nose left): its "UNITED STATES NAVY" titles, the national insignia
   (roundel and bar) and the small "R7V-2" on the nose would read military. Each is painted out in the fuselage's own
   metal: the box is refilled from the SAME rows a little further along the fuselage (the skin's shading runs along
   the fuselage, so a row-for-row copy carries the right tone and texture), then per row a linear correction is added
   so the patch's left and right edges meet the untouched skin exactly, and the patch is blended in through a
   feathered mask. The alpha channel is untouched.
2. The Plattsburgh hangar plate: the pickup in front of the door is removed the same
   way (rows copied from just beside it, edge-matched, feathered). The car at the right end never enters the frame.
3. The Fortepan sky: its glass-plate dust specks are spot-healed. A 9 x 9 median of the plate is taken; only pixels
   that differ from it by more than 26 levels (the specks; the film grain and the cloud edges stay under it), grown by
   2 px, are replaced by the median, so the cloud and the fine grain stay as photographed.

Run (from the kise root):
  uv run --offline --with pillow --with numpy python scripts/clips/zach-kelly-johnson/bake-defense-pays-c2.py
Writes public/zach-kelly-johnson/C2/cutout_constellation_side_facing-left_clean.png,
public/zach-kelly-johnson/C2/plate_hangar_side_plattsburgh_clean.jpg and
public/zach-kelly-johnson/C2/plate_sky_clouds_fortepan_clean.jpg.
"""
import numpy as np
from PIL import Image

C2 = "public/zach-kelly-johnson/C2/"


def patch(a, x0, x1, y0, y1, dx, feather=6, edge=3):
    """Refill a[y0:y1, x0:x1] from a[y0:y1, x0+dx:x1+dx], edge-matched per row, feathered in."""
    h, w = y1 - y0, x1 - x0
    src = a[y0:y1, x0 + dx : x1 + dx].astype(np.float32)
    tgt = a[y0:y1, x0:x1].astype(np.float32)
    left = a[y0:y1, x0 - edge : x0].astype(np.float32).mean(axis=1)
    right = a[y0:y1, x1 : x1 + edge].astype(np.float32).mean(axis=1)
    sl = src[:, :edge].mean(axis=1)
    sr = src[:, -edge:].mean(axis=1)
    t = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    if src.ndim == 3:
        t = t[..., None]
    corr = (left - sl)[:, None] * (1 - t) + (right - sr)[:, None] * t
    fill = src + corr
    # feathered mask: 1 inside, ramps to 0 over `feather` px at the box edges
    yy = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]
    xx = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
    m = np.clip(np.minimum(yy, xx) / feather, 0, 1).astype(np.float32)
    if src.ndim == 3:
        m = m[..., None]
    out = tgt * (1 - m) + fill * m
    a[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(a.dtype)


# 1. the Constellation
im = Image.open(C2 + "cutout_constellation_r7v2_natural_metal_side_facing-left.png").convert("RGBA")
a = np.array(im)
rgb = a[..., :3]
patch(rgb, 800, 1085, 178, 214, -300)  # "UNITED STATES NAVY"
patch(rgb, 1236, 1364, 194, 272, -160)  # the roundel and its bar
patch(rgb, 54, 102, 256, 278, 60)  # "R7V-2" on the nose
a[..., :3] = rgb
Image.fromarray(a, "RGBA").save(C2 + "cutout_constellation_side_facing-left_clean.png", optimize=True)

# 2. the hangar plate
im = Image.open(C2 + "plate_hangar_side_open_door_plattsburgh.jpg").convert("L")
a = np.array(im)
patch(a, 1640, 1850, 985, 1112, -230, feather=10)  # the pickup in front of the door
Image.fromarray(a, "L").save(C2 + "plate_hangar_side_plattsburgh_clean.jpg", quality=92)
# 3. the sky
from numpy.lib.stride_tricks import sliding_window_view

im = Image.open(C2 + "plate_sky_clouds_fortepan_period.jpg").convert("L")
a = np.array(im)
R = 4
pad = np.pad(a, R, mode="reflect")
med = np.median(sliding_window_view(pad, (2 * R + 1, 2 * R + 1)), axis=(-2, -1)).astype(np.uint8)
spot = np.abs(a.astype(np.int16) - med.astype(np.int16)) > 26
grow = spot.copy()
for dy in range(-2, 3):
    for dx in range(-2, 3):
        grow |= np.roll(np.roll(spot, dy, axis=0), dx, axis=1)
out = np.where(grow, med, a)
Image.fromarray(out.astype(np.uint8), "L").save(C2 + "plate_sky_clouds_fortepan_clean.jpg", quality=92)
print("ok", int(grow.sum()), "px healed of", a.size)
