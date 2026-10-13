#!/usr/bin/env python3
"""
Bake the extra rasters of NineHundredReal (generated/components/NineHundredReal.tsx): the DownTheShaft cut-away
seen whole, from a close view of a man on a rope under the collar (2x) out to the whole 900 ft (0.164x).

It only ADDS files (prefix nh_) to public/cerro/shaft/ and reads what scripts/bake-down-the-shaft.py made
(underground_plate.jpg, underground_cap.png) without touching it; the rock recipe is imported from that script.

Outputs:
  nh_wide.jpg     2333 x 4566, 1/3 res: world x -1500..5500, y -1960..11740 (world = DownTheShaft's: y 0 the lip,
                  10 px = 1 ft, plate x). Above the lip the dusk surface: ref_frame0.png at its DownTheShaft place
                  (x 136..1216, y -1944..-24), feathered into a soft continuation of its own edge columns. Below it
                  rock by the same recipe at 1/3 scale (collage of the mine's rock photos, broad beds with bold
                  partings dipping 13 degrees, the soil profile, dusk light dying over 150 ft). The component lays
                  the 1x plate and cap over its middle, so the shaft and the stations are DownTheShaft's own.
  nh_close.jpg    1380 x 2190, 3x: world x 300..760, y -160..570, for the open (the same way as nh_collar.jpg).
  nh_collar.jpg   1840 x 3408, 2x: world x 136..1056, y -224..1480. The 1x frame, cap and plate composited as the
                  component stacks them, enlarged 2x, sharpened back to the clip's softness and given the rock
                  photos' own fine grain: identical in layout to the 1x layers, so the cross-fade does not move.
  nh_man.png      276 x 432, RGBA: a man sitting in a harness on a rope, drawn; near black with the dusk on his
                  upper edges. (Box of 46 x 72 units; the rope runs at x = 23.)
  nh_liberty.png  548 x 1016, RGBA: the measuring overlay made from ../liberty_mask.png: white, 16 % inside, a
                  solid outline about 3 px wide at the size it is shown.

Run:  python3 scripts/bake-nine-hundred-real.py [--crops DIR]
"""
import importlib.util
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "cerro", "shaft")
_spec = importlib.util.spec_from_file_location("bds", os.path.join(ROOT, "scripts", "bake-down-the-shaft.py"))
bds = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bds)
smoothstep, gauss, gauss_big, noise1d, vnoise, rnoise, resize_f = bds.smoothstep, bds.gauss, bds.gauss_big, bds.noise1d, bds.vnoise, bds.rnoise, bds.resize_f

K = 3  # world px per px of the wide plate
WX0, WX1, WY0, WY1 = -1500, 5500, -1960, 11740
REF_X, REF_Y = 136, -1944  # where the clip's frame sits in the world
CX0, CX1, CY0, CY1 = 136, 1056, -224, 1480  # the 2x collar plate
PHI = 13.0
rng = np.random.default_rng(305)


def save_jpg(a, name, q=90):
    Image.fromarray(np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(SRC, name), quality=q, subsampling=1, optimize=True)


def building_matte(ref):
    """The hoist house cut out of the clip's frame: its blue roofs and walls keyed on their colour and closed over doors,
    windows and dark panels, plus the black stack; a thin sliver of ground under it; nothing of the hill, brush or junk."""
    blue = smoothstep(0.10, 0.20, ref[..., 2] - ref[..., 0])
    yy = np.arange(1920, dtype=np.float32)[:, None]
    blue = blue * smoothstep(850.0, 870.0, yy) * smoothstep(1545.0, 1525.0, yy)
    im = Image.fromarray((blue * 255).astype(np.uint8))
    im = im.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))  # no specks
    im = im.filter(ImageFilter.MaxFilter(33)).filter(ImageFilter.MinFilter(33))  # closed over doors, windows, dark panels
    m = np.asarray(im).astype(np.float32) / 255.0
    lum = ref.mean(2)
    stack = np.zeros_like(m)
    stack[868:1130, 706:770] = smoothstep(0.20, 0.12, gauss(lum[868:1130, 706:770], 1.5))
    st = Image.fromarray((stack * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    m = np.maximum(m, np.asarray(st).astype(np.float32) / 255.0)
    # one solid silhouette: every column is filled from its topmost to its lowest keyed pixel (roof line down to the wall's
    # foot: doors, rust panels and the yard between the two houses are inside; the hill between cupola and stack is not)
    on = m > 0.5
    top_i = np.argmax(on, axis=0)
    bot_i = 1919 - np.argmax(on[::-1], axis=0)
    rows_i = np.arange(1920)[:, None]
    m = np.maximum(m, (on.any(0)[None, :] & (rows_i >= top_i[None, :]) & (rows_i <= bot_i[None, :])).astype(np.float32))
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))).astype(np.float32) / 255.0
    m = np.maximum(m, np.roll(m, 9, axis=0))  # the sliver of ground it stands on
    m[:860] = 0
    # the bottom edge sinks into the ground over a few px
    has = m > 0.5
    bot = np.where(has.any(0), 1919 - np.argmax(has[::-1], axis=0), 0).astype(np.float32)[None, :]
    m = gauss(m, 3.5) * smoothstep(0.0, 16.0, bot - yy + 4.0)
    Image.fromarray(np.dstack([np.full((1920, 1080, 3), 255, np.uint8), np.clip(m * 255 + 0.5, 0, 255).astype(np.uint8)])).save(os.path.join(SRC, "nh_building_mask.png"), optimize=True)
    return m


def surface(w, rows, ref):
    """The dusk surface above the lip at 1/3 res: the clip's FULL 16:9 frame (the timeline shows only its centre 9:16),
    at the clip's place and scale, so the hoist house stands in its own real surroundings. Left and right it feathers
    into a soft, out-of-focus continuation of its own edge colours, row by row (sky above, hill and ground below)."""
    wide = np.asarray(Image.open(os.path.join(SRC, "nh_frame0_wide.png")).convert("RGB")).astype(np.float32) / 255.0
    fh, fw = wide.shape[:2]  # 640 x 1138
    c0 = (REF_X - WX0) // K - int(round((fw - 360) / 2.0))  # the 9:16 crop is the frame's centre 360 columns
    r0 = (REF_Y - WY0) // K
    noise1d(w, 170, rng)  # keeps the shared generator's sequence as it was (the other plates must not change)
    loc = np.random.default_rng(911)

    def profile(cols):
        p = np.empty((rows, 3), np.float32)
        src = wide[:, cols].mean(1)
        p[r0 : r0 + fh] = src
        p[:r0] = src[0]
        p[r0 + fh :] = src[-1]
        wide8 = p[:, None, :].repeat(8, 1)
        return np.dstack([gauss_big(np.ascontiguousarray(wide8[..., k]), 46.0) for k in range(3)])[:, 0, :]  # very smooth down the rows: no bands

    # the hill beyond the frame takes the tone of the LIT hillside just right of the house (the frame's last columns are
    # in brush shadow and would give a dark block)
    left, right = profile(slice(0, 140)), profile(slice(fw - 300, fw - 150)) * 1.28
    t = np.clip((np.arange(w, dtype=np.float32) - c0) / float(fw), 0, 1)[None, :, None]
    bg = left[:, None, :] * (1 - t) + right[:, None, :] * t
    lo = loc.standard_normal((rows // 48 + 2, w // 90 + 2)).astype(np.float32)
    lo2 = loc.standard_normal((rows // 14 + 2, w // 22 + 2)).astype(np.float32)
    bg = bg * (1.0 + 0.05 * resize_f(lo, w, rows) + 0.045 * resize_f(lo2, w, rows))[..., None]
    out = gauss(bg.astype(np.float32), 9.0)
    xx = np.arange(fw, dtype=np.float32)
    al = (smoothstep(0.0, 190.0, xx) * smoothstep(0.0, 330.0, fw - 1 - xx))[None, :, None]
    out[r0 : r0 + fh, c0 : c0 + fw] = out[r0 : r0 + fh, c0 : c0 + fw] * (1 - al) + wide * al
    return out


def wide_plate(ref, rock_src, rubble_src):
    w, h = (WX1 - WX0) // K, (WY1 - WY0) // K
    top = (-WY0) // K  # row of world y 0
    hr = h - top + 40  # rock rows, from world y -120
    print("wide: rock collage", w, "x", hr, flush=True)
    rock = bds.collage(hr, w, rock_src, rng, tile=214, step=160, blob=(300, 200), blob_step=(180, 140), skip=(0.0, 0.35), scale_range=(0.30, 0.43))
    # broad beds and bold partings, as in the 1x plate, at a third of the size
    sphi, cphi = math.sin(math.radians(PHI)), math.cos(math.radians(PHI))
    off = hr * sphi + 60
    n = int(off + w + 160)
    band_t, band_c, plane = np.zeros(n, np.float32), np.zeros(n, np.float32), np.zeros(n, np.float32)
    xi = np.arange(n, dtype=np.float32)
    u0 = 0.0
    while u0 < n:
        u1 = u0 + float(rng.uniform(57, 143))
        band_t[int(u0) : int(u1)] = float(rng.uniform(-0.15, 0.15))
        band_c[int(u0) : int(u1)] = float(rng.uniform(-0.035, 0.035))
        if rng.random() < 0.7:
            plane += float(rng.uniform(0.3, 0.5)) * np.exp(-0.5 * ((xi - u1) / float(rng.uniform(0.7, 1.1))) ** 2)
        u0 = u1
    band_t, band_c = gauss(band_t[None, :], 1.7)[0], gauss(band_c[None, :], 1.7)[0]
    for y0 in range(0, hr, 1200):
        y1 = min(hr, y0 + 1200)
        Y, X = np.mgrid[y0:y1, 0:w].astype(np.float32)

        def rn(sa, sl, seed):
            return rnoise(y1 - y0, w, sa, sl, PHI, np.random.default_rng(seed), y0=y0)

        ub = X * cphi - Y * sphi + off + 11 * rn(270, 500, 31) + 2 * rn(37, 100, 32)
        tone = (1.0 + 0.095 * rn(87, 317, 18) + 0.05 * rn(35, 127, 19) + bds.sample_profile(band_t, ub)) * (1.0 - bds.sample_profile(plane, ub) * (0.55 + 0.45 * smoothstep(-0.8, 0.3, rn(20, 233, 33))))
        wc = 0.02 * rn(107, 273, 20) + bds.sample_profile(band_c, ub)
        blk = rock[y0:y1]
        blk[:] = 1.0 + (blk - 1.0) * 1.2
        blk *= tone[..., None]
        blk[..., 0] *= 1.0 + wc
        blk[..., 2] *= 1.0 - wc
    alb = np.clip(rock, 0.03, 2.4) * bds.ROCK_ALBEDO
    del rock
    # the soil profile along the lip
    xw = WX0 + (np.arange(w, dtype=np.float32) + 0.5) * K
    lip = 36.0 * np.tanh((xw - 700.0) / 420.0) + 9.0 * noise1d(w, 120, rng) + 4.0 * noise1d(w, 14, rng)  # world y
    wy = (np.arange(hr, dtype=np.float32) - 40 + 0.5)[:, None] * K  # world y of the rock rows
    zr = 150  # rows of the soil zone
    rub = bds.collage(zr, w, rubble_src, rng, tile=90, step=64, blob=(96, 70), blob_step=(54, 44), skip=(0.0, 0.25), scale_range=(0.25, 0.38))
    L = rub.mean(2)
    rub_bot = lip + 215.0 + 45.0 * noise1d(w, 80, rng)
    t_rub = smoothstep(-0.5, 0.5, (rub_bot[None, :] - wy[:zr]) / 30.0 + 0.8 * vnoise(zr, w, 12, 8, rng) + np.clip(2.0 * (gauss(L, 1.0) - 1.0), -1.2, 1.2))
    st = smoothstep(0.90, 1.18, L)[..., None]
    rcol = rub * (bds.SOIL_ALBEDO * (1 - st) + bds.RUBBLE_ALBEDO * st)
    alb[:zr] = alb[:zr] * (1 - t_rub[..., None]) + rcol * t_rub[..., None]
    t_skin = smoothstep(-0.5, 0.5, ((lip + 16.0)[None, :] - wy[:zr]) / 4.0)
    alb[:zr] = alb[:zr] * (1 - t_skin[..., None]) + bds.SKIN_ALBEDO * t_skin[..., None]
    # light: the dusk dies over 150 ft, our lamp takes over, its colour warming over 300 ft
    wyr = wy[:, 0]
    dusk_w, lamp_w, hue_w = 1.0 - smoothstep(0.0, 1500.0, wyr), smoothstep(150.0, 1500.0, wyr), smoothstep(300.0, 3000.0, wyr)
    lamp_col = (bds.DUSK * (float(bds.LAMP.mean()) / float(bds.DUSK.mean())))[None, :] * (1 - hue_w)[:, None] + bds.LAMP[None, :] * hue_w[:, None]
    amb = bds.DUSK[None, :] * dusk_w[:, None] + lamp_col * lamp_w[:, None]
    o = alb * amb[:, None, :]
    hi = np.maximum(o - 0.6, 0)
    o = bds.BLACK + (1.0 - bds.BLACK) * (np.minimum(o, 0.6) + 0.4 * (1.0 - np.exp(-hi / 0.4)))
    out = np.empty((h, w, 3), np.float32)
    out[top - 40 :] = o
    surf = surface(w, top + 60, ref)
    is_rock = smoothstep(-2.0, 2.0, wy[: 100] - lip[None, :])[..., None]  # rows top-40 .. top+60
    out[: top - 40] = surf[: top - 40]
    out[top - 40 : top + 60] = surf[top - 40 :] * (1 - is_rock) + out[top - 40 : top + 60] * is_rock
    out = gauss(out, 0.55)
    save_jpg(out, "nh_wide.jpg")
    print("nh_wide.jpg", (w, h), "world x", WX0, WX1, "y", WY0, WY1, flush=True)
    return out


def collar_plate(ref, rock_src, f=2, box=(CX0, CX1, CY0, CY1), name="nh_collar.jpg"):
    """The 1x frame, cap and plate as the component stacks them, enlarged f times and given back the clip's softness."""
    x0, x1, y0, y1 = box
    w, h = x1 - x0, y1 - y0
    plate = np.asarray(Image.open(os.path.join(SRC, "underground_plate.jpg")).convert("RGB")).astype(np.float32) / 255.0
    cap = np.asarray(Image.open(os.path.join(SRC, "underground_cap.png")).convert("RGBA")).astype(np.float32) / 255.0
    base = np.zeros((h, w, 3), np.float32)
    r_ref = -24 - y0  # rows that the clip's frame fills
    base[:r_ref] = ref[1920 - r_ref :, x0 - REF_X : x1 - REF_X]
    base[r_ref : 28 - y0] = base[r_ref - 3 : r_ref].mean(0, keepdims=True)
    base[28 - y0 :] = plate[: y1 - 28, x0:x1]
    ca0, ca1 = max(y0, -208), min(y1, -208 + cap.shape[0])
    a = cap[ca0 + 208 : ca1 + 208, x0:x1, 3:4]
    base[ca0 - y0 : ca1 - y0] = base[ca0 - y0 : ca1 - y0] * (1 - a) + cap[ca0 + 208 : ca1 + 208, x0:x1, :3] * a
    big = Image.fromarray(np.clip(base * 255 + 0.5, 0, 255).astype(np.uint8)).resize((w * f, h * f), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.2 * f, percent=95 if f == 2 else 115, threshold=0))
    big = np.asarray(big).astype(np.float32) / 255.0
    # the rock photos' own grain, at their native scale: what an enlargement cannot have
    fine = bds.collage(h * f, w * f, [s for s in rock_src if s[2] > 2], rng, tile=560, step=420, blob=(520,), blob_step=(330,), skip=(0.0,), scale_range=(0.95, 1.1)).mean(2)
    fine = fine - gauss(fine, 2.6)
    fine = fine / (fine.std() + 1e-6)
    rows = (np.arange(h * f, dtype=np.float32) / f + y0)[:, None]
    k = 0.055 * smoothstep(-120.0, -40.0, rows)  # nothing on the clip's own pixels at the very top
    big = np.clip(big * (1.0 + k * np.clip(fine, -2.5, 2.5))[..., None], 0, 1)
    save_jpg(gauss(big, 0.5), name, 92)
    print(name, (w * f, h * f), "world x", x0, x1, "y", y0, y1, flush=True)
    return big


def man():
    S = 6
    w, h = 46 * S, 72 * S
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)

    def limb(pts, th):
        p = [(x * S, y * S) for x, y in pts]
        d.line(p, fill=255, width=int(th * S), joint="curve")
        for x, y in p:
            d.ellipse([x - th * S / 2, y - th * S / 2, x + th * S / 2, y + th * S / 2], fill=255)

    d.ellipse([13.6 * S, 8.6 * S, 26.6 * S, 18.6 * S], fill=255)  # helmet
    d.polygon([(12.6 * S, 15.4 * S), (28.4 * S, 14.6 * S), (28.4 * S, 16.4 * S), (12.6 * S, 17.2 * S)], fill=255)  # its brim
    d.ellipse([15.2 * S, 13.6 * S, 25.0 * S, 23.2 * S], fill=255)  # head
    d.polygon([(12.4 * S, 23.2 * S), (17 * S, 21.4 * S), (23.5 * S, 21.6 * S), (26.8 * S, 24 * S), (27.2 * S, 41.5 * S), (14.2 * S, 43 * S), (11.8 * S, 33 * S)], fill=255)  # torso, leaning back a little
    d.polygon([(7.6 * S, 25 * S), (12.6 * S, 24.2 * S), (13.4 * S, 39 * S), (8.2 * S, 39.6 * S)], fill=255)  # the pack
    limb([(25.6, 24.6), (30.6, 20.6), (24.2, 13.4)], 3.5)  # the near arm, hand on the rope above his head
    limb([(15.4, 24.8), (19.6, 27.4), (23.6, 19.4)], 3.3)  # the far arm, hand on the rope at his chin
    limb([(22.0, 41.2), (34.6, 44.4), (33.6, 59.4)], 5.6)  # the near leg: thigh out, shin hanging
    limb([(19.4, 42.4), (30.4, 47.6), (28.2, 61.6)], 5.2)  # the far leg
    d.polygon([(30.6 * S, 58.6 * S), (39.4 * S, 60.6 * S), (39.8 * S, 64.2 * S), (30.8 * S, 63.6 * S)], fill=255)  # boots
    d.polygon([(25.2 * S, 60.8 * S), (33.6 * S, 62.8 * S), (33.8 * S, 66.2 * S), (25.2 * S, 65.6 * S)], fill=255)
    d.line([(14.6 * S, 38.4 * S), (27.0 * S, 37.0 * S)], fill=255, width=int(2.4 * S))  # the harness belt
    m = np.asarray(img.filter(ImageFilter.GaussianBlur(S * 0.22))).astype(np.float32) / 255.0
    rim = np.clip(m - np.roll(m, int(1.7 * S), axis=0), 0, 1)  # the edges that face the sky: helmet, shoulders, forearms, thighs
    rim[: int(1.7 * S)] = 0
    rim = gauss(rim, S * 0.3)
    body = np.array([0.062, 0.070, 0.082], np.float32)
    dusk = np.array([0.52, 0.64, 0.72], np.float32)
    rgb = body[None, None, :] * (1 - 0.9 * rim[..., None]) + dusk[None, None, :] * (0.9 * rim[..., None])
    Image.fromarray(np.dstack([np.clip(rgb * 255 + 0.5, 0, 255), m[..., None] * 255]).astype(np.uint8)).save(os.path.join(SRC, "nh_man.png"), optimize=True)
    print("nh_man.png", (w, h), flush=True)


def liberty():
    src = Image.open(os.path.join(ROOT, "public", "cerro", "liberty_mask.png")).convert("RGBA").split()[3]
    m = src.resize((548, 1016), Image.LANCZOS)
    edge = np.asarray(m.filter(ImageFilter.MaxFilter(7))).astype(np.float32) / 255.0 - np.asarray(m.filter(ImageFilter.MinFilter(5))).astype(np.float32) / 255.0
    a = np.clip(0.16 * np.asarray(m).astype(np.float32) / 255.0 + 0.96 * gauss(np.clip(edge, 0, 1), 0.7), 0, 1)
    Image.fromarray(np.dstack([np.full((1016, 548, 3), 255, np.uint8), (a * 255).astype(np.uint8)])).save(os.path.join(SRC, "nh_liberty.png"), optimize=True)
    print("nh_liberty.png (548, 1016)", flush=True)


def main():
    ref = bds.load("ref_frame0.png")
    rock_src, rubble_src, _broken, _detail, _gravel = bds.build_sources()
    man()
    liberty()
    big = collar_plate(ref, rock_src)
    wide = wide_plate(ref, rock_src, rubble_src)
    collar_plate(ref, rock_src, f=3, box=(300, 760, -160, 570), name="nh_close.jpg")  # last: the other plates keep their random draw
    if "--crops" in sys.argv:
        out = sys.argv[sys.argv.index("--crops") + 1]
        os.makedirs(out, exist_ok=True)
        Image.fromarray((big[:1920, 380:1460] * 255).astype(np.uint8)).save(os.path.join(out, "collar_crop.jpg"), quality=90)
        Image.fromarray((wide * 255).astype(np.uint8)).resize((wide.shape[1] // 3, wide.shape[0] // 3), Image.LANCZOS).save(os.path.join(out, "wide_small.jpg"), quality=88)


if __name__ == "__main__":
    main()
