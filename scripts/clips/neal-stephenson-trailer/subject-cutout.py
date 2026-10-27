# Cut out one research subject for cut 54 InstantExpert (neal-stephenson-trailer).
# The mask comes from the macOS Vision foreground mask (neal-matte.swift, mode fg) or, for a subject Vision cannot
# separate, from a luminance key (--key) or a fitted disc (--disc, the Moon). This script tightens the soft edge,
# erodes the fringe, crops to the subject and writes an RGBA PNG `height` px tall.
# Run with the system python and the user's site-packages (no installs):
#   /usr/bin/python3 -I scripts/clips/neal-stephenson-trailer/subject-cutout.py in.jpg mask.png out.png 620 [opts]
# opts: --crop x0 y0 x1 y1 (source px, applied first) · --lo 0.35 --hi 0.85 (mask levels) · --erode 5 (odd px) ·
#       --key dark|light T0 T1 (alpha from luminance: dark = keep pixels darker than the ground) ·
#       --key sky B0 B1 (alpha from blueness b - r: the sky goes; --keyblur px) · --disc ·
#       --fill (fill holes inside the mask) · --poly "x,y x,y ..." (source px: an inner outline unioned in) ·
#       --keeppoly "x,y ..." --keepblur px (source px: only this region kept) · --cutpoly "x,y ..." (source px: removed) · --seed x y (source px: keep only the piece connected to it)
import sys

sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

a = sys.argv[1:]
src, maskp, out, height = a[0], a[1], a[2], int(a[3])
opts = a[4:]


def opt(name, n=1, cast=float, default=None):
    if name not in opts:
        return default
    i = opts.index(name)
    v = [cast(x) if cast else x for x in opts[i + 1 : i + 1 + n]]
    return v if n > 1 else (v[0] if n == 1 else True)


im = Image.open(src).convert("RGB")
if maskp != "-":
    m = Image.open(maskp).convert("L")
else:
    m = Image.new("L", im.size, 255)
crop = opt("--crop", 4, int)
if crop:
    im, m = im.crop(tuple(crop)), m.crop(tuple(crop))

key = opt("--key", 3, None)
if key and key[0] == "sky":
    # alpha from how un-blue a pixel is: the sky (blue over red) goes, cloud and ash (grey) stay
    rgb = np.asarray(im).astype(np.float32) / 255
    blu = rgb[..., 2] - rgb[..., 0]
    kb = float(opt("--keyblur", default=0))
    if kb > 0:  # JPEG chroma is blocky: smooth the key before thresholding
        blu = np.asarray(Image.fromarray(((blu + 1) * 127.5).astype(np.uint8)).filter(ImageFilter.GaussianBlur(kb))).astype(np.float32) / 127.5 - 1
    k = 1 - np.clip((blu - float(key[1])) / (float(key[2]) - float(key[1])), 0, 1)
    al = np.asarray(m).astype(np.float32) / 255 * k
elif key:
    lum = np.asarray(im.convert("L")).astype(np.float32) / 255
    t0, t1 = float(key[1]), float(key[2])
    k = np.clip((lum - t0) / (t1 - t0), 0, 1)
    if key[0] == "dark":
        k = 1 - k
    al = np.asarray(m).astype(np.float32) / 255 * k
else:
    al = np.asarray(m).astype(np.float32) / 255
lo, hi = opt("--lo", default=0.35), opt("--hi", default=0.85)
al = np.clip((al - lo) / (hi - lo), 0, 1)
m = Image.fromarray((al * 255).astype(np.uint8))

poly = opt("--poly", 1, None)
if poly:
    # a hand-traced inner outline (source px, "x,y x,y ..."), unioned with the key where the key cannot separate
    ox, oy = (crop[0], crop[1]) if crop else (0, 0)
    pts = [tuple(float(v) for v in q.split(",")) for q in poly.split()]
    pm = Image.new("L", m.size, 0)
    ImageDraw.Draw(pm).polygon([(x - ox, y - oy) for x, y in pts], fill=255)
    pm = pm.filter(ImageFilter.GaussianBlur(3))
    m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(pm)))

cut = opt("--cutpoly", 1, None)
if cut:
    # a region (source px) that is not the subject: a stray cloud touching it
    ox, oy = (crop[0], crop[1]) if crop else (0, 0)
    pts = [tuple(float(v) for v in q.split(",")) for q in cut.split()]
    cm = Image.new("L", m.size, 255)
    ImageDraw.Draw(cm).polygon([(x - ox, y - oy) for x, y in pts], fill=0)
    m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(cm.filter(ImageFilter.GaussianBlur(2)))))

keep = opt("--keeppoly", 1, None)
if keep:
    # only this region (source px) is the subject: shapes a column that narrows to its base (--keepblur px edge)
    ox, oy = (crop[0], crop[1]) if crop else (0, 0)
    pts = [tuple(float(v) for v in q.split(",")) for q in keep.split()]
    km = Image.new("L", m.size, 0)
    ImageDraw.Draw(km).polygon([(x - ox, y - oy) for x, y in pts], fill=255)
    km = km.filter(ImageFilter.GaussianBlur(float(opt("--keepblur", default=4))))
    m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(km)))

seed = opt("--seed", 2, int)
if seed:
    # keep only the piece connected to the seed (source px): drops stray clouds and specks
    b = m.point(lambda v: 255 if v > 60 else 0)
    ox, oy = (crop[0], crop[1]) if crop else (0, 0)
    ImageDraw.floodfill(b, (seed[0] - ox, seed[1] - oy), 128)
    keep = (np.asarray(b) == 128).astype(np.uint8) * 255
    keep = np.asarray(Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)))
    m = Image.fromarray(np.minimum(np.asarray(m), keep))

if "--fill" in opts:
    # flood the outside from the border; whatever the flood cannot reach is inside
    b = m.point(lambda v: 255 if v > 127 else 0)
    pad = Image.new("L", (b.width + 2, b.height + 2), 0)
    pad.paste(b, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    inside = np.asarray(pad.crop((1, 1, b.width + 1, b.height + 1))) != 128
    m = Image.fromarray(np.maximum(np.asarray(m), inside.astype(np.uint8) * 255))

if "--disc" in opts:
    ys, xs = np.nonzero(np.asarray(m) > 127)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    r = min(xs.max() - xs.min(), ys.max() - ys.min()) / 2 - 2
    big = Image.new("L", (m.width * 4, m.height * 4), 0)
    ImageDraw.Draw(big).ellipse(((cx - r) * 4, (cy - r) * 4, (cx + r) * 4, (cy + r) * 4), fill=255)
    m = big.resize(m.size, Image.LANCZOS)
else:
    er = int(opt("--erode", default=5))
    if er > 1:
        m = m.filter(ImageFilter.MinFilter(er))
    m = m.filter(ImageFilter.GaussianBlur(1.0))

rgba = im.copy()
rgba.putalpha(m)
bbox = Image.fromarray((np.asarray(m) > 24).astype(np.uint8) * 255).getbbox()
rgba = rgba.crop(bbox)
w = round(height * rgba.width / rgba.height)
rgba = rgba.resize((w, height), Image.LANCZOS)
rgba.save(out, optimize=True)
print(out, rgba.size, "aspect", round(rgba.width / rgba.height, 4))
