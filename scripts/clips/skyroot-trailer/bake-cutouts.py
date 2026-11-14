#!/usr/bin/env python3
"""SKYROOT trailer (skyroot-trailer): the clip's photo cut-outs, greyscale + alpha, into public/skyroot-trailer/.

  vikram1   Skyroot's Vikram-1 on the First Launch Pad, Sriharikota (ISRO, GODL-India) -> vikram1.png
  lvm3      ISRO's LVM3-M6 on the Second Launch Pad (ISRO, GODL-India) -> lvm3.png (core + two S200 strap-ons)
  earth     NASA DSCOVR EPIC full disc, India centred (PD) -> earth_india.png

Both rockets are axially symmetric bodies standing upright, so they are cut as ROW SPANS, not keyed blobs: per body,
the left and right outline is found row by row (the strongest step against the background near a prior), the body's
axis is fitted as a straight line, the half-width is cleaned (median, outlier rows from the umbilical arm, cables,
service-tower arms and dark bands replaced by the mirrored side or interpolated), and the alpha is the exact
antialiased coverage of [axis - hw, axis + hw] per row. The result is a clean scissor-cut silhouette with no halo, no
background remnants and no stairs; the photo's own pixels fill it, and the outermost 2 px take the colour of the pixel
2-3 px inside (no sky fringe). Greyscale: the grade (SKYROOT_FILTER) is applied at render.

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/skyroot-trailer/bake-cutouts.py [vikram1|lvm3|earth|all]
Sources: assets-src/skyroot-trailer/ (copied from the clip's animation_source/assets/; credits in skyrootShared.tsx).
Memory: the largest array is the LVM3 crop, 1500 x 4600 x 3 float32 (83 MB).
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ni

Image.MAX_IMAGE_PIXELS = None
SRC = "assets-src/skyroot-trailer/"
OUT = "public/skyroot-trailer/"
GEOM = {}
DEBUG = {}  # per-body outlines of the last lvm3() run, for an overlay check


def grey(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def span_alpha(L, R, W):
    """Exact horizontal coverage of [L, R) per row (NaN rows are empty)."""
    x = np.arange(W)[None, :].astype(np.float32)
    Lc = np.nan_to_num(L, nan=0.0)[:, None]
    Rc = np.nan_to_num(R, nan=0.0)[:, None]
    cov = np.clip(np.minimum(x + 1, Rc) - np.maximum(x, Lc), 0, 1)
    cov[np.isnan(L) | np.isnan(R)] = 0
    return cov


def decontaminate(g, alpha, inset=3):
    """Edge pixels (alpha < 1) and the 2 px inside them take the colour of the nearest pixel `inset` px inside."""
    solid = ni.binary_erosion(alpha > 0.999, iterations=inset)
    _, (iy, ix) = ni.distance_transform_edt(~solid, return_indices=True)
    return np.where(solid, g, g[iy, ix])


def save(path, g, alpha, out_h=None, margin=6):
    ys, xs = np.where(alpha > 0.004)
    y0, y1 = ys.min(), ys.max() + 1
    x0, x1 = xs.min(), xs.max() + 1
    g = g[y0:y1, x0:x1]
    alpha = alpha[y0:y1, x0:x1]
    if out_h and out_h < g.shape[0]:
        s = out_h / g.shape[0]
        size = (round(g.shape[1] * s), out_h)
        pm = Image.fromarray((g * alpha).astype(np.float32), "F").resize(size, Image.LANCZOS)
        am = Image.fromarray(alpha.astype(np.float32), "F").resize(size, Image.LANCZOS)
        alpha = np.clip(np.asarray(am), 0, 1)
        g = np.where(alpha > 0.004, np.asarray(pm) / np.maximum(alpha, 1e-4), 0)
    g = np.pad(g, margin)
    alpha = np.pad(alpha, margin)
    o = np.dstack([g, g, g, alpha * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(o, "RGBA").save(path, optimize=True)
    print(path, o.shape[1], o.shape[0])
    return o.shape[1], o.shape[0], margin, (x0, y0), (out_h / (y1 - y0) if out_h and out_h < (y1 - y0) else 1.0)


def upright(g, shift):
    """Resample each row y at x + shift[y] (cubic), so a leaning axis becomes vertical."""
    H, W = g.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return ni.map_coordinates(g, [yy, xx + shift[:, None].astype(np.float32)], order=3, mode="nearest")


def edge_scan(d, thr, from_left):
    """Sub-pixel position where d first exceeds thr scanning a row from one side (NaN if never)."""
    H, W = d.shape
    out = np.full(H, np.nan, np.float32)
    for y in range(H):
        row = d[y] if from_left else d[y, ::-1]
        idx = np.flatnonzero(row > thr)
        if len(idx) == 0:
            continue
        i = idx[0]
        if i == 0:
            p = 0.0
        else:
            p = i - 1 + (thr - row[i - 1]) / max(row[i] - row[i - 1], 1e-3)
        out[y] = p if from_left else W - p
    return out


def clean_series(v, size=9, tol=2.5):
    """Median-clean a per-row series: values off their running median by more than tol are replaced by it."""
    ok = ~np.isnan(v)
    vv = np.interp(np.arange(len(v)), np.flatnonzero(ok), v[ok])
    med = ni.median_filter(vv, size, mode="nearest")
    vv = np.where(np.abs(vv - med) > tol, med, vv)
    return vv


# -- Vikram-1 -----------------------------------------------------------------------------------------------------
def vikram1():
    X0, Y0 = 1600, 700
    im = Image.open(SRC + "vikram1_on_pad_FLP_sriharikota_2026-07_ISRO.jpg").convert("RGB")
    a = np.asarray(im.crop((X0, Y0, X0 + 700, Y0 + 3800))).astype(np.float32)
    H, W = a.shape[:2]
    # the sky per row from the clean columns left of the rocket (x 0-80 of the crop), smoothed vertically
    sky = np.median(a[:, :80], axis=1)
    sky = ni.uniform_filter1d(sky, 31, axis=0, mode="nearest")
    d = np.sqrt(((a - sky[:, None, :]) ** 2).sum(-1))
    d = ni.gaussian_filter(d, 0.7)
    thr = 20.0
    L = edge_scan(d[:, :400], thr, True)
    # right side: scan from x 470 inward (the tower is farther right; the umbilical arm and its cables cross near the
    # nose and are fixed below by symmetry)
    R = edge_scan(d[:, :470], thr, False)
    rows = np.arange(H)
    have = ~np.isnan(L) & ~np.isnan(R) & (R - L > 20)
    # the base: the blue aft band ends where the grey launch pedestal (a wider, mid-grey cone) begins
    gmed = np.array([np.median(grey(a[y, int(L[y]) + 10 : int(R[y]) - 10])) if have[y] else 255 for y in range(H)])
    base = 3400 + int(np.argmax(gmed[3400:] > 80))
    tip = int(np.flatnonzero(have)[0])
    print("vikram1: tip row", tip, "base row", base, "(crop)")
    body = (rows >= tip) & (rows < base)
    # axis: a straight line through the midpoints of the clean body rows (below the cables, above the base)
    fitrows = np.flatnonzero(body & have & (rows > 900) & (rows < base - 40))
    mid = (L + R) / 2
    p = np.polyfit(fitrows, mid[fitrows], 1)
    for _ in range(3):
        res = mid[fitrows] - np.polyval(p, fitrows)
        keep = np.abs(res) < 2.0
        p = np.polyfit(fitrows[keep], mid[fitrows][keep], 1)
    axis = np.polyval(p, rows)
    print(f"vikram1: axis x = {p[1]:.1f} + {p[0]:.5f} * y  (tilt {np.degrees(np.arctan(p[0])):.3f} deg)")
    hwL = axis - L
    hwR = R - axis
    # each side is cut on its own outline (the aft band is a few px wider on the left: perspective and the flange), but
    # around the umbilical arm and its cables (crop rows < 700) the right side is trusted only where it agrees with the
    # left; the rest of that span (the plain cylinder) is interpolated from the clean rows around it
    arm = (rows < 700) & ~(np.abs(hwL - hwR) < 3.0)
    arm = ni.binary_dilation(arm, iterations=12) & (rows > 330) & (rows < 700)
    hwR = np.where(arm, np.nan, hwR)
    hwL[~body], hwR[~body] = np.nan, np.nan
    sides = []
    for hw in (hwL, hwR):
        hwb = clean_series(hw[tip:base], 15, 2.0)
        hwb = ni.gaussian_filter1d(hwb, 1.2, mode="nearest")
        hwf = np.full(H, np.nan, np.float32)
        hwf[tip:base] = np.maximum(hwb, 0)
        sides.append(hwf)
    hwfL, hwfR = sides
    # stand it upright: every row is shifted so the axis is one vertical line (the photo leans ~0.3 deg)
    ref = float(axis[base - 1])
    gs = upright(grey(a), axis - ref)
    Lf, Rf = ref - hwfL, ref + hwfR
    alpha = span_alpha(Lf, Rf, W)
    g = decontaminate(gs, alpha)
    w, h, m, (cx0, cy0), s = save(OUT + "vikram1.png", g, alpha, out_h=2400)
    # geometry (fractions of the PNG): nose tip, base, the axis at the base
    yb = (base - cy0) * s + m
    yt = (tip - cy0) * s + m
    xa = (ref + 0.5 - cx0) * s + m
    maxhw = np.nanmax((hwfL + hwfR) / 2) * s
    GEOM["vikram1"] = dict(w=w, h=h, noseY=yt / h, baseY=yb / h, axisX=xa / w, bodyW=2 * maxhw / w)
    print("vikram1 geom", GEOM["vikram1"])


# -- LVM3 ---------------------------------------------------------------------------------------------------------
LVM3_CROP = (2050, 1950, 3550, 6550)
LVM3_BASE = 4383  # crop row: the core's aft shroud lip; below it the engines sit behind the pad's red railing
# Per body, the outline priors (crop row, left x, right x) read off the photo at full resolution; every row is then
# snapped to the strongest step in the photo within +-WIN px of the prior. The S200 strap-ons' nose cones are slanted
# toward the core (their inner edge runs straight up), so each side is cut on its own, never mirrored. The core's aft
# end (two Vikas engines under a heat shield) is not round either.
LVM3_BODIES = {
    "core": [
        (95, 735, 735), (120, 675, 796), (180, 611, 862), (240, 578, 896), (300, 550, 925), (360, 526, 949),
        (420, 508, 969), (480, 493, 984), (540, 482, 996), (600, 475, 1003), (700, 471, 1002), (1040, 471, 1002),
        (1100, 480, 995), (1190, 505, 975), (1300, 512, 965), (1360, 515, 968), (2000, 524, 972), (3950, 527, 993),
        (3990, 527, 990), (3995, 545, 988),
        (4080, 568, 955), (4170, 590, 935), (4280, 620, 915), (4300, 624, 905), (LVM3_BASE, 628, 897),
    ],
    "boosterL": [
        (1893, 340, 470), (1900, 318, 490), (1950, 293, 498), (2000, 267, 500), (2100, 216, 500), (2200, 168, 500),
        (2260, 150, 498), (2300, 145, 498), (LVM3_BASE, 139, 501),
    ],
    "boosterR": [
        (1890, 1060, 1180), (1900, 1030, 1200), (1950, 1005, 1225), (2000, 1000, 1250), (2100, 1000, 1290),
        (2200, 1001, 1330), (2260, 1003, 1345), (2300, 1005, 1356), (2750, 1011, 1368), (3350, 1018, 1377),
        (3950, 1023, 1386), (LVM3_BASE, 1025, 1392),
    ],
}


def lvm3(win=10):
    X0, Y0, X1, Y1 = LVM3_CROP
    im = Image.open(SRC + "lvm3_M6_bluebird_on_pad_2025-12_ISRO.jpg").convert("RGB")
    a = np.asarray(im.crop((X0, Y0, X1, Y1))).astype(np.float32)
    H, W = a.shape[:2]
    g0 = grey(a)
    gs = ni.gaussian_filter(g0, 1.2)
    gx = np.zeros_like(gs)
    gx[:, 2:-2] = gs[:, 4:] - gs[:, :-4]  # + where it gets brighter to the right
    rows = np.arange(H)
    alpha = np.zeros((H, W), np.float32)
    for name, pts in LVM3_BODIES.items():
        py, pl, pr = (np.array(v, np.float32) for v in zip(*pts))
        top, bot = int(py[0]), int(py[-1])
        priorL = np.interp(rows, py, pl)
        priorR = np.interp(rows, py, pr)
        L = np.full(H, np.nan, np.float32)
        R = np.full(H, np.nan, np.float32)
        for y in range(top, bot):
            for side, prior, sign in (("L", priorL[y], 1), ("R", priorR[y], -1)):
                x0, x1 = int(round(prior)) - win, int(round(prior)) + win + 1
                seg = sign * gx[y, x0:x1]
                i = int(np.argmax(seg))
                # sub-pixel peak (parabola through the 3 samples)
                if 0 < i < len(seg) - 1:
                    d = seg[i - 1] - 2 * seg[i] + seg[i + 1]
                    off = 0.5 * (seg[i - 1] - seg[i + 1]) / d if d < 0 else 0.0
                else:
                    off = 0.0
                x = x0 + i + off + 0.5
                # a weak step (dark band against the dark tower) keeps the prior
                if seg[i] < 18:
                    x = prior
                (L if side == "L" else R)[y] = x
        for E, prior in ((L, priorL), (R, priorR)):
            seg = E[top:bot]
            seg[:] = clean_series(seg, 21, 2.0)
            seg[:] = ni.gaussian_filter1d(seg, 1.5, mode="nearest")
            # never more than win px off the prior
            seg[:] = np.clip(seg, prior[top:bot] - win, prior[top:bot] + win)
        DEBUG[name] = (L.copy(), R.copy())
        A = span_alpha(L, R, W)
        if name.startswith("booster"):
            # the strap-ons' rounded nose tops: per column, the strongest dark -> bright step going down (the top
            # outline), smoothed; rows above it are cut (the side priors alone let the tower in around the shoulders)
            gy = np.zeros_like(gs)
            gy[2:-2] = gs[4:] - gs[:-4]
            xs = np.arange(int(np.nanmin(L[top:top + 200])) - 2, int(np.nanmax(R[top:top + 200])) + 3)
            ya, yb = top - 15, top + 160
            te = np.array([ya + int(np.argmax(gy[ya:yb, x])) for x in xs], np.float32)
            te = ni.median_filter(te, 9, mode="nearest")
            te = ni.gaussian_filter1d(te, 2.0, mode="nearest")
            topEdge = np.full(W, np.inf, np.float32)
            topEdge[xs] = te
            topEdge[xs[0] - 200 : xs[0]] = np.inf
            cov = np.clip(rows[:, None] + 1 - topEdge[None, :], 0, 1)
            cov[top + 170 :] = 1
            A = A * cov
        alpha = np.maximum(alpha, A)
    g = decontaminate(g0, alpha)
    w, h, m, (cx0, cy0), s = save(OUT + "lvm3.png", g, alpha, out_h=2600)
    core = LVM3_BODIES["core"]
    tip = core[0][0]
    axis = (core[10][1] + core[10][2]) / 2  # the fairing cylinder's centre line
    GEOM["lvm3"] = dict(
        w=w, h=h, noseY=((tip - cy0) * s + m) / h, baseY=((LVM3_BASE - cy0) * s + m) / h, axisX=((axis - cx0) * s + m) / w,
        bodyW=((1395 - 141) * s) / w,
    )
    print("lvm3 geom", GEOM["lvm3"])
    return a, alpha


# NASA DSCOVR EPIC natural colour, 2024-03-28 07:20:39 UTC; the archive image is north-up, centroid 11.2 N 74.8 E
EPIC_CENTRE = (11.2, 74.8)
SRIHARIKOTA = (13.72, 80.23)  # Satish Dhawan Space Centre (SDSC-SHAR)


def ortho(lat, lon, lat0, lon0):
    """Orthographic disc coordinates (x right, y DOWN), in disc radii, of (lat, lon) seen from above (lat0, lon0)."""
    la, lo, la0, lo0 = (np.radians(v) for v in (lat, lon, lat0, lon0))
    x = np.cos(la) * np.sin(lo - lo0)
    y = np.cos(la0) * np.sin(la) - np.sin(la0) * np.cos(la) * np.cos(lo - lo0)
    return float(x), float(-y)


def earth():
    a = np.asarray(Image.open(SRC + "earth_india_disc.png").convert("RGB")).astype(np.float32)
    g = grey(a)
    m = g > 18
    lab, n = ni.label(m)
    big = np.argmax(ni.sum(m, lab, range(1, n + 1))) + 1
    m = ni.binary_fill_holes(lab == big)
    cy, cx = ni.center_of_mass(m)
    r = np.sqrt(m.sum() / np.pi) - 3  # inset past the dark limb ring
    yy, xx = np.mgrid[0 : g.shape[0], 0 : g.shape[1]]
    d = np.sqrt((xx + 0.5 - cx - 0.5) ** 2 + (yy + 0.5 - cy - 0.5) ** 2)
    alpha = np.clip(r - d + 0.5, 0, 1)
    size = int(np.ceil(2 * r)) + 8
    x0, y0 = int(round(cx - size / 2)), int(round(cy - size / 2))
    pad = max(0, -x0, -y0, x0 + size - g.shape[1], y0 + size - g.shape[0])
    g2 = np.pad(g, pad)[y0 + pad : y0 + pad + size, x0 + pad : x0 + pad + size]
    a2 = np.pad(alpha, pad)[y0 + pad : y0 + pad + size, x0 + pad : x0 + pad + size]
    o = np.dstack([g2, g2, g2, a2 * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(o, "RGBA").save(OUT + "earth_india.png", optimize=True)
    ccx, ccy = cx - x0, cy - y0
    sx, sy = ortho(*SRIHARIKOTA, *EPIC_CENTRE)
    GEOM["earth"] = dict(
        size=size, cx=ccx / size, cy=ccy / size, r=r / size, sriharikotaX=(ccx + sx * r) / size, sriharikotaY=(ccy + sy * r) / size
    )
    print(OUT + "earth_india.png", size, GEOM["earth"])


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for name, fn in [("vikram1", vikram1), ("lvm3", lvm3), ("earth", earth)]:
        if which in (name, "all"):
            fn()
    if GEOM:
        try:
            old = json.load(open(OUT + "geometry.json"))
        except FileNotFoundError:
            old = {}
        old.update({k: {kk: round(float(vv), 5) for kk, vv in v.items()} for k, v in GEOM.items()})
        json.dump(old, open(OUT + "geometry.json", "w"), indent=1)
