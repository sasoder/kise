#!/usr/bin/env python3
"""NewNormalFleet (mikkel-trailer, cut 02): the horizon prints, greyscale + alpha -> public/mikkel-trailer/horizon_*.png.

Source: assets-src/mikkel-trailer/horizon_fuji_shinkansen.jpg (the clip's still 05.2b, "Series N700A and Mt. Fuji",
MaedaAkihiko, Wikimedia Commons, CC BY-SA 4.0), 3840 x 2560. Two prints cut from it, so the horizon has two depths:

  horizon_fuji.png   the mountain, cut along its own skyline (the deep-blue sky keyed with bake-photos.py's smooth
                     model, the skyline = the first row of a solid run of non-sky per column, so the thin power lines in
                     the sky are not part of it), straight-cut at y 1560 (it sits behind the train print, its base clutter left out), and its two
                     ends scissor-cut down to that line so it can stand narrower than the frame.
  horizon_train.png  the Shinkansen line: the train cut along its own roof (a robust straight-line fit to the roof
                     scanned up from its white upper body; the nose's outline read off a zoom), the viaduct, railing and
                     the field below, down to y 2400. The catenary gantry over the line is left out of both prints (it is
                     inpainted out of the mountain, and its two masts are filled across the train body), so the skyline
                     is just the mountain and the train.

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-horizon.py
"""
import importlib.util

import numpy as np
from PIL import Image
from scipy import ndimage as ni

spec = importlib.util.spec_from_file_location("bp", "scripts/clips/mikkel-trailer/bake-photos.py")
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

SRC = "assets-src/mikkel-trailer/horizon_fuji_shinkansen.jpg"
P = "public/mikkel-trailer/"
FUJI_BOTTOM = 1560  # just under the gantry's arm: the mountain print stops where the clutter of its base begins
TRAIN_TOP, TRAIN_BOTTOM = 1700, 2400

a_full = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)  # 3840 x 2560 x 3 float32: 118 MB
H_, W_ = a_full.shape[:2]
g_full = bp.grey(a_full)


def decon(g, alpha):
    solid = alpha > 0.97
    _, (iy, ix) = ni.distance_transform_edt(~solid, return_indices=True)
    return np.where(solid, g, g[iy, ix])


def save(path, g, alpha, y0):
    """save_rgba crops to the alpha's bbox; print where the crop sits in source px (the component needs it)."""
    ys, xs = np.where(alpha > 0.02)
    print(path, "bbox src x", xs.min(), xs.max(), "y", ys.min() + y0, ys.max() + y0)
    bp.save_rgba(path, g, alpha, margin=0)


# -- the catenary gantry, removed from the mountain print ----------------------------------------------------------------
# The gantry's top (src x 2098-2374, y 1380 -> 1560) stands in front of the mountain; the mountain print is scaled and
# lowered behind the train, so a second, smaller gantry would show on its slope. Its steel (anything brighter than the
# local slope, plus its two masts) is replaced, feathered, from the same slope 290 px to its right.
GANTRY = (2098, 2374, 1380, FUJI_BOTTOM + 8)
SHIFT = 290  # the clean slope right of the gantry (the pylon and houses there are below the cut)


def gantry_free():
    x0, x1, y0, y1 = GANTRY
    g = g_full.copy()
    patch = g_full[y0:y1, x0:x1]
    bg = ni.median_filter(patch, size=41)
    m = (patch - bg) > 12
    m[:, 2232 - x0 : 2260 - x0] = True  # the two masts' lower shafts (darker than the bright lattice)
    m[:, 2336 - x0 : 2362 - x0] = True
    m = ni.binary_dilation(m, iterations=4)
    w = ni.gaussian_filter(m.astype(np.float32), 2)
    src = g_full[y0:y1, x0 + SHIFT : x1 + SHIFT]
    g[y0:y1, x0:x1] = patch * (1 - w) + src * w
    return g


# -- the mountain -----------------------------------------------------------------------------------------------------------
def fuji():
    a = a_full[:FUJI_BOTTOM]
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    X = (xx / W - 0.5).ravel()
    Y = (yy / H - 0.5).ravel()
    basis = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y], 1)
    seed = np.zeros((H, W), bool)
    seed[:6] = True
    seed[:1200, :6] = True
    seed[:1200, -6:] = True
    sky = seed
    for _ in range(4):
        idx = np.flatnonzero(sky.ravel())
        idx = idx[:: max(1, len(idx) // 200000)]
        model = np.zeros_like(a)
        for c in range(3):
            coef, *_ = np.linalg.lstsq(basis[idx], a[..., c].ravel()[idx], rcond=None)
            model[..., c] = (basis @ coef).reshape(H, W)
        dist = np.sqrt(((a - model) ** 2).sum(-1))
        lab, _ = ni.label(dist < 26)
        keep = np.unique(lab[seed])
        sky = np.isin(lab, keep[keep > 0])
    print("fuji sky residual p50/p95:", np.percentile(dist[sky], 50), np.percentile(dist[sky], 95))
    # skyline: the first row that starts a run of >= 14 non-sky rows (a power line is 2-4 rows)
    non = (~sky).astype(np.int32)
    run = ni.uniform_filter1d(non.astype(np.float32), 14, axis=0, origin=-7) * 14  # rows y..y+13
    solid = run >= 13.5
    first = np.where(solid.any(0), solid.argmax(0), H - 1).astype(np.float32)
    first = ni.median_filter(first, 7, mode="nearest")
    # sub-pixel: the soft key along the edge row
    sl = ni.gaussian_filter1d(first, 1.2, mode="nearest")
    print("fuji peak src y", sl.min(), "at x", int(sl.argmin()), "ends", sl[0], sl[-1])
    # the ends: a smooth scissor cut down to the bottom line over the outer 13 % of each side
    t = np.linspace(0, 1, W)
    e = np.minimum(t, 1 - t) / 0.13
    s = np.clip(e, 0, 1)
    s = s * s * (3 - 2 * s)
    sl = sl + (FUJI_BOTTOM + 4 - sl) * (1 - s)
    alpha = np.clip(yy - sl[None, :] + 0.5, 0, 1).astype(np.float32)
    g = decon(gantry_free()[:FUJI_BOTTOM], alpha)
    save(P + "horizon_fuji.png", g, alpha, 0)


# -- the train line ---------------------------------------------------------------------------------------------------------
def train():
    y0, y1 = TRAIN_TOP, TRAIN_BOTTOM
    g = g_full[y0:y1]
    H, W = g.shape
    # the roof: from the white upper body (src y 1778) scan up while bright
    bright = g > 165
    ref = 1778 - y0
    roof = np.full(W, np.nan, np.float32)
    for x in range(W):
        if not bright[ref, x]:
            continue
        y = ref
        while y > 0 and bright[y - 1, x]:
            y -= 1
        roof[x] = y
    have = ~np.isnan(roof)
    xs = np.arange(W)
    nose = int(np.argmax(have))
    # the roof is a straight line (gantry shadows and poles stop the scan early): a robust line fit aft of the nose,
    # the scan itself only along the nose's curve
    fit = have & (xs > nose + 500)
    k, c = np.polyfit(xs[fit], roof[fit], 1)
    for _ in range(4):
        r = roof[fit] - (k * xs[fit] + c)
        ok = np.abs(r) < 3
        k, c = np.polyfit(xs[fit][ok], roof[fit][ok], 1)
    line = k * xs + c
    # the nose: its outline read off a 2x zoom (source px; the cockpit window belongs to the train, the houses behind
    # it do not), then the roof line
    NX = [0, 222, 227, 230, 232, 245, 265, 300, 350, 400, 440, 460, 490, 520, 535, 560, 600, 700]
    NY = [1894, 1894, 1885, 1870, 1860, 1845, 1832, 1820, 1812, 1802, 1795, 1782, 1771, 1766, 1759, 1754, 1752, 1751]
    nose_y = np.interp(xs, NX, NY) - y0
    blend = np.clip((xs - 600) / 100, 0, 1)
    roof = nose_y * (1 - blend) + line * blend
    print("roof line src y", line[nose] + y0, "->", line[-1] + y0, "nose x", nose)
    yy = np.arange(H)[:, None]
    alpha = np.clip(yy - roof[None, :] + 0.5, 0, 1).astype(np.float32)
    # Everything standing in front of the train body (the gantry's two masts, five thin poles) is filled across, row by
    # row, from the clean columns either side (the body's stripes and windows run horizontally), so the train can slide
    # behind the viaduct without carrying them along. The back of car 2 (x 2365-2735: the gantry's shadows, which must not
    # ride along, and a frame of posts in front of its skirt) is replaced from the same place one car length (1160 px)
    # forward, on car 1.
    g = g.copy()
    for a0, a1, top in [(2231, 2259, 0), (2334, 2362, 0), (393, 409, 1818), (1110, 1126, 1824), (1698, 1714, 1829), (3207, 3224, 1828), (3798, 3814, 1838)]:
        cols = np.arange(a0 + 1, a1)
        r0 = (int(roof[a0:a1].min()) - 2) if top == 0 else top - 6 - y0
        r1 = 1912 - y0
        t = (cols - a0) / (a1 - a0)
        g[r0:r1, cols] = g[r0:r1, a0][:, None] * (1 - t)[None, :] + g[r0:r1, a1][:, None] * t[None, :]
    dy = int(round(k * 1160))
    g[1738 - y0 : 1912 - y0, 2365:2735] = g[1738 - y0 - dy : 1912 - y0 - dy, 2365 - 1160 : 2735 - 1160]
    # the railing's top edge (the light rail over the dark undercarriage): the strongest light-over-dark step near a
    # first guess, per column, then a robust line
    gs = ni.gaussian_filter(g, 1.0)
    step = gs[1:] - gs[:-1]
    guess = 1892 + 0.0059 * xs - y0
    rail = np.array([int(gg_) - 14 + np.argmax(step[int(gg_) - 14 : int(gg_) + 14, x]) + 1 for x, gg_ in zip(xs, guess)], np.float32)
    rk, rc = np.polyfit(xs, rail, 1)
    for _ in range(5):
        ok = np.abs(rail - (rk * xs + rc)) < 3
        rk, rc = np.polyfit(xs[ok], rail[ok], 1)
    rail_line = rk * xs + rc
    print("railing top src y", rail_line[0] + y0, "->", rail_line[-1] + y0)
    # level the line: every column moves up by the roof's slope (the train recedes a little to the right in the photo),
    # so the carriages can be repeated with no step at the joins
    from scipy.ndimage import map_coordinates

    Hs = H - 40
    yy2, xx2 = np.mgrid[0:Hs, 0:W].astype(np.float32)
    src_y = yy2 + k * xx2
    gL = map_coordinates(g, [src_y, xx2], order=1, mode="nearest")
    aL = map_coordinates(alpha, [src_y, xx2], order=1, mode="nearest")
    roofL = float(c)
    railL = rail_line - k * xs  # nearly flat now
    print("levelled: roof row", roofL + y0, "railing", railL.min() + y0, "->", railL.max() + y0)
    yyL = np.arange(Hs)[:, None]
    # the moving train: roof (and nose) down to just below the railing's top (the viaduct print covers its foot)
    foot = int(np.ceil(railL.max())) + 8
    t_alpha = aL * (yyL < foot)
    t_g = decon(gL, np.where(t_alpha > 0.5, t_alpha, 0))
    # the train runs on past the photo's right edge: car 3 (joint 2735 -> joint 3822, levelled) repeated twice
    J0, J1 = 2735, 3822
    reps = 2
    tg = np.concatenate([t_g[:, :J1]] + [t_g[:, J0:J1]] * reps, axis=1)
    ta = np.concatenate([t_alpha[:, :J1]] + [t_alpha[:, J0:J1]] * reps, axis=1)
    r0 = int(np.floor(roofL)) - 2
    tg, ta = tg[r0:foot], ta[r0:foot]
    out = np.dstack([tg, tg, tg, ta * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(P + "horizon_train_strip.png", optimize=True)
    print(P + "horizon_train_strip.png", out.shape[1], out.shape[0], f"top = levelled src y {r0 + y0}, nose x 227, joint period {J1 - J0}")
    # the viaduct, railing and field: static, cut along the railing's top
    b_alpha = np.clip(yyL - railL[None, :] + 0.5, 0, 1).astype(np.float32)
    b_g = decon(gL, b_alpha)
    rb = int(np.floor(railL.min())) - 1
    out = np.dstack([b_g[rb:], b_g[rb:], b_g[rb:], b_alpha[rb:] * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(P + "horizon_viaduct.png", optimize=True)
    print(P + "horizon_viaduct.png", out.shape[1], out.shape[0], f"top = levelled src y {rb + y0}")


if __name__ == "__main__":
    import sys

    for t in sys.argv[1:] or ["fuji", "train"]:
        globals()[t]()
