# Clean the prepared aircraft_package.png for FiveKilosThreeKilo (pushp-trailer). The original stays untouched.
# Fixes measured on the prepared cut-out: alpha floor of 16/255 in rectangles outside the matte (shows as a blue box
# on the plate); alpha 235 patch behind the box logo; the matte's flat cut across the box bottom at y 1100 (the real
# box runs to ~1105, re-keyed here off the sky); two rotor smudges beside the motors; a blue fringe; a sky-blue tether.
# It also heals the faint lens ghost (a disc about 44 px in radius at source 2500, 350) out of fields_clean.jpg into a
# new plate, fields_clean_healed.jpg; fields_clean.jpg stays untouched.
# Run with the system python and the user's site-packages (no installs):
#   /usr/bin/python3 -I scripts/clips/pushp-trailer/bake-package-clean.py
import sys

sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402


def erode(m, n=1):
    """min over the 3x3 neighbourhood, n times"""
    for _ in range(n):
        p = np.pad(m, 1, mode="edge")
        m = np.min([p[1 + dy : p.shape[0] - 1 + dy, 1 + dx : p.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], axis=0)
    return m


def connected(mask, seeds):
    """the parts of mask that touch a seed (x, y)"""
    img = Image.fromarray((mask * 255).astype(np.uint8)).copy()
    for s in seeds:
        ImageDraw.floodfill(img, s, 128)
    return np.array(img) == 128


def bleed(rgb, core, passes=14):
    """spread core colour outward, one px per pass, over everything that is not core"""
    out, have = rgb * core[..., None], core.astype(np.float32)
    done = core.copy()
    for _ in range(passes):
        po, ph = np.pad(out, ((1, 1), (1, 1), (0, 0))), np.pad(have, 1)
        so = sum(po[1 + dy : -1 + dy or None, 1 + dx : -1 + dx or None] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        sh = sum(ph[1 + dy : -1 + dy or None, 1 + dx : -1 + dx or None] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        new = (sh > 0) & ~done
        out[new] = so[new] / sh[new][..., None]
        have[new], done = 1, done | new
    out[~done] = rgb[~done]
    return out

ROOT = "/Users/tom/Documents/tom fant/CAPTIONSTOOL/kise/public/pushp-trailer/"
im = np.array(Image.open(ROOT + "aircraft_package.png").convert("RGBA")).astype(np.float32)
rgb, a = im[..., :3].copy(), im[..., 3] / 255

# 1. the floor
a = np.clip((a - 24 / 255) / (1 - 24 / 255), 0, 1)
# 2. the logo patch
a[955:1040, 840:905] = 1
# 3. the rotor smudges
a[305:332, 734:768] = 0
a[512:540, 1118:1158] = 0
# 4. the box bottom, keyed off the local sky (rgb still holds the original sky)
y0, y1, x0, x1 = 1088, 1118, 810, 975
sky = np.median(rgb[1120:1140, x0:x1].reshape(-1, 3), axis=0)
dist = np.sqrt(((rgb[y0:y1, x0:x1] - sky) ** 2).sum(-1))
key = np.clip((dist - 28) / 40, 0, 1)
a[y0:y1, x0:x1] = np.maximum(a[y0:y1, x0:x1], key)

# keep only what touches the aircraft or the box
tether = np.zeros(a.shape, bool)
tether[699:911, 895:935] = True
keep = connected(a > 0.04, [(950, 500), (890, 1000)])
keep |= tether & (a > 0.04)
a = np.where(keep, a, 0)

# 5. the fringe: tighten the edge one px, and pull interior colour out over every edge pixel
body = a.copy()
body_soft = np.clip(erode(body) * 0.65 + body * 0.35, 0, 1)
a = np.where(tether, a, body_soft)
core = erode(im[..., 3] / 255 > 0.97, 2)
core[955:1040, 840:905] = True
core &= ~tether
out = bleed(rgb, core)
# despill: outside the three real logos nothing on this aircraft is sky blue. What is (thin parts: vane, tips, a few
# edge px, no core left to bleed from) goes the carbon's dark; a mild tint is just clamped.
logo = np.zeros(a.shape, bool)
logo[375:450, 955:1025] = logo[490:530, 890:930] = logo[968:1034, 846:896] = True
spill = out[..., 2] - np.maximum(out[..., 0], out[..., 1])
hard = (out[..., 2] - out[..., 0] > 45) & ~logo
out[hard] = (44, 46, 50)
soft = (spill > 6) & ~logo & ~hard
out[..., 2][soft] = np.maximum(out[..., 0], out[..., 1])[soft] + 6
# 6. the tether: the real wire, neutral instead of sky blue, a little firmer
wire = tether & (a > 0.02)
out[wire] = (214, 216, 218)
a = np.where(tether, np.clip(a * 1.5, 0, 1), a)

# 7. the wobble: the matte's contour is lumpy under a 2x push. Re-level a blurred copy; the box gets the stronger pass.
def relevel(m, sigma):
    b = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32) / 255
    return np.clip((b - 0.32) / 0.36, 0, 1)


fine, coarse = relevel(a, 1.0), relevel(a, 2.4)
boxzone = np.zeros(a.shape, bool)
boxzone[914:1118, 808:978] = True
a = np.where(tether, a, np.where(boxzone, coarse, fine))
# the vane and the wing-tip skids are thinner than the blur: keep them
thin = np.zeros(a.shape, bool)
thin[745:860, 1255:1282] = thin[770:810, 1340:1365] = thin[495:530, 530:552] = True
a = np.where(thin, np.maximum(a, body_soft), a)

res = np.dstack([np.clip(out, 0, 255), np.clip(a, 0, 1) * 255]).round().astype(np.uint8)
Image.fromarray(res).save(ROOT + "aircraft_package_clean.png", optimize=True)
ys, xs = np.where(a > 0.5)
print("bbox", xs.min(), xs.max(), ys.min(), ys.max(), "corner alpha", res[100, 100, 3], res[1200, 1600, 3])

# -- the plate: smooth fill from the disc's surroundings, the sky's own grain from a clean patch beside it
plate = Image.open(ROOT + "fields_clean.jpg").convert("RGB")
GX, GY, HALF, R0, R1 = 2500, 350, 110, 52, 68
crop = plate.crop((GX - HALF, GY - HALF, GX + HALF, GY + HALF))
sharp = np.array(crop).astype(np.float32)
smooth = np.array(crop.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
yy, xx = np.mgrid[-HALF:HALF, -HALF:HALF]
rr = np.hypot(xx, yy)
fill = smooth.copy()
hole = rr < R1 + 6
for _ in range(3000):
    lap = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
    fill[hole] = lap[hole]
clean = plate.crop((GX - HALF - 240, GY - HALF, GX + HALF - 240, GY + HALF))
grain = np.array(clean).astype(np.float32) - np.array(clean.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
w = np.clip((R1 - rr) / (R1 - R0), 0, 1)[..., None]
w = w * w * (3 - 2 * w)
healed = sharp * (1 - w) + (fill + grain) * w
plate.paste(Image.fromarray(np.clip(healed, 0, 255).round().astype(np.uint8)), (GX - HALF, GY - HALF))
plate.save(ROOT + "fields_clean_healed.jpg", quality=96, subsampling=0)
