#!/usr/bin/python3
"""Bakes CheaperFasterVersatile's stage set into public/pushp-trailer/: cloud flats cut from the cumulus plate (sky key
on a fitted sky, sides and bottom cut with scissors scallops), each with its hard black copy baked in and a separate
quarter-size soft shadow, plus the two square black-and-white photos the pie wedges look onto.
Run with the system Python (it has numpy and PIL): /usr/bin/python3 scripts/clips/pushp-trailer/bake-cfv-clouds.py
"""
import json
import os
import random
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "public/zach-kelly-johnson/D/plate_sky_cumulus.jpg"
OUT = "public/pushp-trailer"
IMAGES = "/Users/tom/Documents/tom fant/core memory podcast/nov/CM_POD_PUSHP_EARLY_EDIT/trailer_CM_POD_PUSHP_EARLY_EDIT/images"
HARD_OFF = 11  # the hard black copy, source px (about 5 screen px at the flats' usual scale)

im = Image.open(SRC).convert("L")
W, H = im.size
v = np.asarray(im).astype(np.float32)


def cloud_mask():
    """The cloud's top contour, column by column: a cubic sky fitted on seed zones, then the first run of pixels off it.
    A heightfield has no holes, so no sky pocket can show as a black fleck inside a flat."""
    blurred = np.asarray(im.filter(ImageFilter.GaussianBlur(1.6))).astype(np.float64)
    q = 8
    h, w = H // q, W // q
    s = blurred[::q, ::q][:h, :w]
    yy, xx = np.mgrid[0:h, 0:w]
    x, y = xx / w, yy / h
    seed = (y < 0.08) | ((x < 0.14) & (y < 0.34)) | ((x > 0.82) & (y < 0.32))
    terms = lambda x, y: [np.ones_like(x), x, y, x * x, x * y, y * y, x**3, y**3, x * x * y, x * y * y]
    coef, *_ = np.linalg.lstsq(np.stack(terms(x, y), -1)[seed], s[seed], rcond=None)
    YY, XX = np.mgrid[0:H, 0:W]
    fit = np.stack(terms(XX / W, YY / H), -1).astype(np.float64) @ coef
    off = np.abs(blurred - fit) > 9
    run = off.copy()
    for k in range(1, 7):  # six off-sky pixels in a row
        run[:-k] &= off[k:]
    top = np.argmax(run, axis=0)
    top[~run.any(axis=0)] = H
    # a light median irons single-column spikes
    pad = np.pad(top, 7, mode="edge")
    top = np.median(np.stack([pad[i : i + len(top)] for i in range(15)]), axis=0)
    mask = (YY >= top[None, :] + 3).astype(np.uint8) * 255
    # a small round closing at half size (a square kernel leaves blocky steps): narrow slits in the contour fill in
    half = Image.fromarray(mask).resize((W // 2, H // 2), Image.BILINEAR)
    round_close = np.asarray(half.filter(ImageFilter.GaussianBlur(6))) > 105
    joined = np.maximum(np.asarray(half), round_close.astype(np.uint8) * 255)
    return Image.fromarray(joined).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.8))


cloud = cloud_mask()


def billow(box, thr, seed_xy):
    """An organic all-round cut of one lit billow: the blob of bright plate pixels around a seed."""
    x0, y0, x1, y1 = box
    q = 3
    s = np.asarray(im.crop(box).filter(ImageFilter.GaussianBlur(7)).resize(((x1 - x0) // q, (y1 - y0) // q))).astype(np.float32)
    on = s > thr
    seen = np.zeros_like(on)
    dq = deque([((seed_xy[1] - y0) // q, (seed_xy[0] - x0) // q)])
    seen[dq[0]] = True
    while dq:
        r, c = dq.popleft()
        for a, b in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= a < s.shape[0] and 0 <= b < s.shape[1] and on[a, b] and not seen[a, b]:
                seen[a, b] = True
                dq.append((a, b))
    m = Image.fromarray((seen * 255).astype(np.uint8)).resize((x1 - x0, y1 - y0), Image.BICUBIC)
    m = m.filter(ImageFilter.GaussianBlur(9))
    return Image.fromarray(((np.asarray(m) > 128) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3))


def graded(arr):
    """Lifted so the storm-dark underside reads as a mid grey on the grey paper; the archive's warm-neutral on top."""
    t = np.clip(arr / 255.0, 0, 1) ** 0.62
    t = 0.2 + 0.78 * t
    rgb = np.stack([t * 1.012, t * 0.998, t * 0.962], axis=-1)
    return np.clip(rgb * 255, 0, 255).astype(np.uint8)


def blob(x0, y0, x1, y1, seed, top=False, m=110):
    """The scissors: a filled rect inset by m with random lobes round its sides and bottom (and top when asked)."""
    rnd = random.Random(seed)
    w, h = x1 - x0, y1 - y0
    b = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(b)
    d.rectangle([m, m if top else -10, w - m, h - m], fill=255)

    def lobes(ax, ay, bx, by):
        n = max(2, int(max(abs(bx - ax), abs(by - ay)) / (m * 1.1)))
        for i in range(n + 1):
            t = (i + rnd.uniform(-0.25, 0.25)) / n
            cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
            r = rnd.uniform(0.45, 0.95) * m
            sx = min(rnd.uniform(1.0, 1.5), 0.98 * m / r)  # never past the crop, or the plate's edge shows as a straight cut
            d.ellipse([cx - r * sx, cy - r, cx + r * sx, cy + r], fill=255)

    lobes(m, h - m, w - m, h - m)
    lobes(m, m if top else 0, m, h - m)
    lobes(w - m, m if top else 0, w - m, h - m)
    if top:
        lobes(m, m, w - m, m)
    return b.filter(ImageFilter.GaussianBlur(1.6))


def flat(name, box, seed, top=False, m=110, use_sky=True, shape=None):
    x0, y0, x1, y1 = box
    if shape is not None:
        a = np.asarray(shape).astype(np.float32) / 255
    else:
        a = np.asarray(blob(x0, y0, x1, y1, seed, top, m)).astype(np.float32) / 255
    if use_sky:
        a = a * (np.asarray(cloud.crop(box)).astype(np.float32) / 255)
    rgb = graded(v[y0:y1, x0:x1])
    pad = 80
    cw, ch = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    alpha = np.zeros((ch, cw), np.float32)
    alpha[pad : pad + y1 - y0, pad : pad + x1 - x0] = a
    # hard copy underneath, baked
    hard = np.zeros_like(alpha)
    hard[HARD_OFF:, HARD_OFF:] = alpha[:-HARD_OFF, :-HARD_OFF]
    canvas = np.zeros((ch, cw, 3), np.float32)
    canvas[pad : pad + y1 - y0, pad : pad + x1 - x0] = rgb
    out_a = alpha + hard * (1 - alpha)
    # premultiplied over black -> straight
    col = np.where(out_a[..., None] > 1e-3, canvas * alpha[..., None] / np.maximum(out_a[..., None], 1e-3), 0)
    png = np.dstack([np.clip(col, 0, 255), out_a * 255]).astype(np.uint8)
    Image.fromarray(png).save(f"{OUT}/cfv_{name}.png", optimize=True)
    # the same flat without the hard copy, for the overlapping front bank (a hard copy pokes through notches as black shards)
    Image.fromarray(np.dstack([np.clip(canvas, 0, 255), alpha * 255]).astype(np.uint8)).save(f"{OUT}/cfv_{name}_nh.png", optimize=True)
    # the soft cast shadow, quarter size, same box
    s = Image.fromarray((alpha * 255).astype(np.uint8)).resize((cw // 4, ch // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(9))
    sa = np.asarray(s).astype(np.float32) * 0.5
    sp = np.dstack([np.zeros_like(sa), np.zeros_like(sa), np.zeros_like(sa), sa]).astype(np.uint8)
    Image.fromarray(sp).save(f"{OUT}/cfv_{name}_soft.png", optimize=True)
    # the natural version: the real cloud's top contour, sides and base dissolving softly (no scissors, no hard copy)
    if shape is None and use_sky:
        feather = Image.new("L", (cw, ch), 0)
        inset = 120
        ImageDraw.Draw(feather).rectangle([pad + inset, -300, cw - pad - inset, ch - pad - inset], fill=255)
        feather = feather.filter(ImageFilter.GaussianBlur(46))
        nat = np.zeros_like(alpha)
        nat[pad : pad + y1 - y0, pad : pad + x1 - x0] = np.asarray(cloud.crop(box)).astype(np.float32) / 255
        nat = nat * (np.asarray(feather).astype(np.float32) / 255)
        Image.fromarray(np.dstack([np.clip(canvas, 0, 255), nat * 255]).astype(np.uint8)).save(f"{OUT}/cfv_{name}_nat.png", optimize=True)
        s2 = Image.fromarray((nat * 255).astype(np.uint8)).resize((cw // 4, ch // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(10))
        sa2 = np.asarray(s2).astype(np.float32) * 0.46
        Image.fromarray(np.dstack([np.zeros_like(sa2), np.zeros_like(sa2), np.zeros_like(sa2), sa2]).astype(np.uint8)).save(f"{OUT}/cfv_{name}_natsoft.png", optimize=True)
    print(name, cw, ch)
    return {"w": cw, "h": ch}


sizes = {}
# boxes in plate px (2600 x 1788)
sizes["tower"] = flat("tower", (420, 150, 1940, 1240), 3)
sizes["shelf"] = flat("shelf", (1830, 640, 2600, 1290), 5)
sizes["shelfb"] = flat("shelfb", (1880, 640, 2600, 1290), 19, m=70)
sizes["left"] = flat("left", (0, 450, 800, 1260), 7)
sizes["crest"] = flat("crest", (700, 150, 1900, 800), 11, m=90)
sizes["knob"] = flat("knob", (920, 150, 1540, 640), 13, m=60)
sizes["lump"] = flat("lump", (20, 680, 440, 950), 17, m=46)
print(json.dumps(sizes))


def pie_photo(src, box, name, gamma=1.0):
    p = Image.open(f"{IMAGES}/{src}").convert("L").crop(box).resize((1400, 1400), Image.LANCZOS)
    a = np.asarray(p).astype(np.float32) / 255
    a = np.clip(a, 0, 1) ** gamma
    Image.fromarray(np.dstack([a * 258, a * 254, a * 246]).clip(0, 255).astype(np.uint8)).save(f"{OUT}/{name}.jpg", quality=90)


pie_photo("11.5a_EightyPercent_ContainerShipKochiIndia2023.jpg", (420, 270, 1920, 1770), "cfv_pie_freight", 0.95)
pie_photo("16.0a_HumanTransportation_MumbaiLocalHangingOffDoors2006.jpg", (480, 130, 1560, 1210), "cfv_pie_people", 0.92)


def aircraft_shadow(radius=9, name="cfv_aircraft_shadow"):
    """One soft dark blur for the aircraft's shadow, from the sister cut's cleaned aircraft: quarter size, baked so no CSS filter can halo it."""
    a = Image.open(f"{OUT}/fk_aircraft.png").convert("RGBA")
    al = np.asarray(a).astype(np.float32)[..., 3]
    q = Image.fromarray(np.where(al > 40, 255, 0).astype(np.uint8)).resize((a.width // 4, a.height // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius))
    qa = np.asarray(q).astype(np.float32)
    Image.fromarray(np.dstack([np.zeros_like(qa), np.zeros_like(qa), np.zeros_like(qa), qa]).astype(np.uint8)).save(f"{OUT}/{name}.png", optimize=True)


aircraft_shadow()
aircraft_shadow(18, "cfv_aircraft_shadow_soft")
