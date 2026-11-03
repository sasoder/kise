"""bake_drive: the ground, the roads and the route data of DriveOutOfAustin (robert-johnson-ranch, cut 6).

  /usr/bin/python3 assets-src/robert-johnson-ranch/bake_drive.py

Reads the local DEM tiles (dem-z11/) and Natural Earth water (hillcountry-water.geojson); writes
  public/robert-johnson-ranch/drive/height.u16z     gzip, uint16 LE, NZ x NX: (visual height m + 1000) * 10 (the
                                                     exaggerated relief the ground shader ray-marches)
  public/robert-johnson-ranch/drive/albedo.png       RGBA: the painted ground colour (rgb) and cedar density (a)
  public/robert-johnson-ranch/drive/height_o.u16z, albedo_o.png   the same on the OUTER grid (150 m, the whole
                                                     offline DEM: the far land of the high wides)
  public/robert-johnson-ranch/drive/road.u16z        gzip, uint16 LE x4 per texel on the road grid: highway distance (m*20),
                                                     highway arc (m/0.7), dirt distance (m*20), dirt arc (m/0.7)
  generated/components/robert-johnson-ranch/driveRouteData.ts   grids, the two road polylines [x, z, h, s], places

THE ROADS. Leg 1 (real): US 290 from downtown Austin through the Oak Hill "Y" and Dripping Springs, smoothed as a
highway; the cattle guard is on its south side where the arc from downtown reaches 22 miles (35.41 km), just past
Dripping Springs. Legs 2-3 are ILLUSTRATIVE (Caro names no destination): a short dirt track south, a left turn to the
east-south-east, then a ranch road that follows valley floors of the DEM (least-cost path: slope + height above the
local valley floor) south and south-west into the empty hills toward the Blanco River country, cut at 22 road-miles.
"""
import gzip
import heapq
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drive_terrain import CELL, GX0, GZ0, NX, NZ, OCELL, OGX0, OGZ0, ONX, ONZ, bilinear, gblur, heights_on, local_heights, to_local  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "public", "robert-johnson-ranch", "drive")
TS = os.path.join(ROOT, "generated", "components", "robert-johnson-ranch", "driveRouteData.ts")
MILE = 1609.344
LEG = 22 * MILE

# relief: the large-scale trend a little, the local relief a lot (the hills must read as hills from a low camera)
EX_TREND = 1.6
EX_LOCAL = 5.0
TREND_SIGMA = 80  # cells (4 km)


def smooth01(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def hexf(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float64)


def vnoise(shape, cells, seed):
    """smooth value noise (bilinear upsampled random grid), 0..1"""
    rng = np.random.default_rng(seed)
    gy = shape[0] // cells + 2
    gx = shape[1] // cells + 2
    g = rng.random((gy, gx))
    ys = (np.arange(shape[0]) + 0.5) / cells
    xs = (np.arange(shape[1]) + 0.5) / cells
    Y, X = np.meshgrid(ys, xs, indexing="ij")
    return bilinear(g, X + 0.5, Y + 0.5)


# ---------------------------------------------------------------------------------------------------------------
# heights
# ---------------------------------------------------------------------------------------------------------------
def heights():
    """the inner (50 m) and outer (150 m, the whole offline DEM) grids; ONE trend, computed on the outer grid, so the
    two agree at the inner grid's edge"""
    ho = heights_on(OGX0, OGZ0, OCELL, ONX, ONZ)
    tro = gblur(ho, TREND_SIGMA * CELL / OCELL)
    t0 = 175.0  # the trend at downtown Austin: the visual height datum
    hvo = EX_TREND * (tro - t0) + EX_LOCAL * (ho - tro)
    h = local_heights()
    h = gblur(h, 0.7)
    xs = GX0 + (np.arange(NX) + 0.5) * CELL
    zs = GZ0 + (np.arange(NZ) + 0.5) * CELL
    X, Zz = np.meshgrid(xs, zs)
    tr = bilinear(tro, (X - OGX0) / OCELL, (Zz - OGZ0) / OCELL)
    hv = EX_TREND * (tr - t0) + EX_LOCAL * (h - tr)
    return h, hv, ho, hvo


# ---------------------------------------------------------------------------------------------------------------
# water (Natural Earth 10 m) as local polylines / polygons
# ---------------------------------------------------------------------------------------------------------------
def water():
    d = json.load(open(os.path.join(HERE, "hillcountry-water.geojson")))
    lakes, rivers = [], []
    for f in d["features"]:
        g = f["geometry"]
        cla = (f["properties"].get("featurecla") or "").replace("\x00", "")
        if g["type"] == "MultiPolygon":
            for poly in g["coordinates"]:
                lakes.append([[to_local(lo, la) for lo, la in ring] for ring in poly])
        elif g["type"] == "MultiLineString":
            for line in g["coordinates"]:
                rivers.append(([to_local(lo, la) for lo, la in line], cla))
    return lakes, rivers


# ---------------------------------------------------------------------------------------------------------------
# the painted ground
# ---------------------------------------------------------------------------------------------------------------
def albedo(h, cell=CELL, x0=GX0, z0=GZ0):
    """the painted ground on a grid of `cell` m (blurs and noise sized in metres, so both grids paint alike)"""
    K = 50.0 / cell
    nz_, nx_ = h.shape
    gy, gx = np.gradient(h, cell)
    slope = np.hypot(gx, gy)
    rel = h - gblur(h, 10 * K)
    rough = np.sqrt(gblur((h - gblur(h, 12 * K)) ** 2, 40 * K))
    hc = smooth01(3.0, 8.0, rough)  # 1 = the dissected Hill Country, 0 = the flat blacklands east of the Balcones
    n1 = vnoise(h.shape, max(1, round(7 * K)), 1)
    n2 = vnoise(h.shape, max(1, round(23 * K)), 2)
    n3 = vnoise(h.shape, max(1, round(3 * K)), 3)
    GRASS = hexf("#807A58")
    GRASS_DRY = hexf("#8A8162")
    GROUND = hexf("#857659")
    GROUND_MID = hexf("#6F6250")
    BLACK = hexf("#625948")
    VALLEY = hexf("#6C6C4E")
    m2 = (0.3 + 0.4 * n2)[..., None]
    c = GRASS_DRY[None, None, :] * (1 - m2) + GRASS[None, None, :] * m2
    sl = smooth01(0.02, 0.2, gblur(slope, 1.5 * K))[..., None]
    rock = GROUND[None, None, :] * (1 - n1[..., None] * 0.4) + GROUND_MID[None, None, :] * (n1[..., None] * 0.4)
    c = c * (1 - sl * 0.3) + rock * (sl * 0.3)
    c = c * (1 - (1 - hc[..., None]) * 0.5) + BLACK[None, None, :] * ((1 - hc[..., None]) * 0.5)
    vf = smooth01(-4, -18, gblur(rel, 3 * K))[..., None] * 0.2
    c = c * (1 - vf) + VALLEY[None, None, :] * vf
    c *= (0.97 + 0.06 * n3)[..., None]
    # cedar (Ashe juniper) on the slopes of the Hill Country, live oaks along the creek bottoms
    ced = hc * (0.25 + 0.75 * smooth01(0.03, 0.12, slope)) * (0.35 + 0.65 * smooth01(0.3, 0.7, n1))
    ced = np.maximum(ced, hc * smooth01(-6, -16, rel) * 0.55)
    ced *= 0.55 + 0.45 * hc
    rgba = np.zeros(h.shape + (4,), np.float64)
    rgba[..., :3] = c
    rgba[..., 3] = np.clip(ced, 0, 1) * 255
    # Austin, c. 1978: a pale urban tint (the blocks themselves are drawn as volumes)
    im = Image.new("L", (nx_, nz_), 0)
    dr = ImageDraw.Draw(im)
    def P(x, z):
        return ((x - x0) / cell, (z - z0) / cell)
    urban = [(-5600, -9000), (-2500, -11000), (3000, -11500), (7500, -8000), (8500, -1500), (6000, 4500), (1500, 7500), (-3500, 6000), (-6200, 2500), (-6000, -4000)]
    dr.polygon([P(*q) for q in urban], fill=255)
    um = gblur(np.asarray(im, np.float64) / 255, 14 * K) * (0.55 + 0.45 * vnoise(h.shape, max(1, round(9 * K)), 7))
    URB = hexf("#958D79")
    rgba[..., :3] = rgba[..., :3] * (1 - 0.55 * um[..., None]) + URB[None, None, :] * (0.55 * um[..., None])
    rgba[..., 3] *= 1 - smooth01(0.2, 0.6, um)
    # water
    lakes, rivers = water()
    wm = Image.new("L", (nx_, nz_), 0)
    dw = ImageDraw.Draw(wm)
    for poly in lakes:
        dw.polygon([P(*q) for q in poly[0]], fill=255)
        for hole in poly[1:]:
            dw.polygon([P(*q) for q in hole], fill=0)
    for line, cla in rivers:
        w = max(1, round((4 if "Lake" in cla else 3) * K))
        dw.line([P(*q) for q in line], fill=255, width=w, joint="curve")
    wmask = gblur(np.asarray(wm, np.float64) / 255, max(0.4, 0.8 * K))
    WATER = hexf("#35504D")
    rgba[..., :3] = rgba[..., :3] * (1 - wmask[..., None]) + WATER[None, None, :] * wmask[..., None]
    rgba[..., 3] *= 1 - smooth01(0.05, 0.4, wmask)
    return np.clip(rgba, 0, 255).astype(np.uint8), wmask


# ---------------------------------------------------------------------------------------------------------------
# the roads
# ---------------------------------------------------------------------------------------------------------------
def catmull(pts, step=20.0):
    P = np.array(pts, np.float64)
    P = np.vstack([P[0] * 2 - P[1], P, P[-1] * 2 - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        n = max(2, int(np.linalg.norm(p2 - p1) / step))
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2])
    return np.array(out)


def arclen(P):
    return np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])


def resample(P, step):
    s = arclen(P)
    q = np.arange(0, s[-1], step)
    q = np.append(q, s[-1])
    return np.stack([np.interp(q, s, P[:, 0]), np.interp(q, s, P[:, 1])], 1)


def smooth_path(P, sigma_of_s, step=20.0):
    """gaussian smoothing along the arc with a sigma (m) that may vary with arc; the ends stay put"""
    P = resample(P, step)
    s = arclen(P)
    out = P.copy()
    for i in range(1, len(P) - 1):
        sg = sigma_of_s(s[i])
        if sg <= 0:
            continue
        r = min(3 * sg, s[i] - s[0], s[-1] - s[i])
        if r < step:
            continue
        m = (s >= s[i] - r) & (s <= s[i] + r)
        w = np.exp(-0.5 * ((s[m] - s[i]) / sg) ** 2)
        out[i] = (P[m] * w[:, None]).sum(0) / w.sum()
    return resample(out, step)


def valley_route(h, src, waypoints):
    """least-cost path on a 100 m grid: slope + height above the local valley floor"""
    wx0, wx1, wz0, wz1 = -62000.0, -14000.0, 3000.0, 38000.0
    c0, c1 = int((wx0 - GX0) / CELL), int((wx1 - GX0) / CELL)
    r0, r1 = int((wz0 - GZ0) / CELL), int((wz1 - GZ0) / CELL)
    a = h[r0:r1, c0:c1]
    a = a[: a.shape[0] // 2 * 2, : a.shape[1] // 2 * 2].reshape(a.shape[0] // 2, 2, a.shape[1] // 2, 2).mean((1, 3))
    C = 100.0
    rel = a - gblur(a, 5)
    gy, gx = np.gradient(a, C)
    cost = 1 + 60 * np.hypot(gx, gy) + 0.25 * np.clip(rel + 2, 0, None)
    R, Cc = a.shape

    def node(x, z):
        return int((z - wz0) / C), int((x - wx0) / C)

    def path(s, t):
        dist = np.full(a.shape, np.inf)
        prev = -np.ones(a.shape, np.int64)
        dist[s] = 0
        pq = [(0.0, s)]
        nb = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        while pq:
            d, (i, j) = heapq.heappop(pq)
            if (i, j) == t:
                break
            if d > dist[i, j]:
                continue
            for di, dj in nb:
                ii, jj = i + di, j + dj
                if 0 <= ii < R and 0 <= jj < Cc:
                    nd = d + C * math.hypot(di, dj) * 0.5 * (cost[i, j] + cost[ii, jj])
                    if nd < dist[ii, jj]:
                        dist[ii, jj] = nd
                        prev[ii, jj] = i * Cc + j
                        heapq.heappush(pq, (nd, (ii, jj)))
        out = []
        cur = t[0] * Cc + t[1]
        while cur >= 0:
            i, j = divmod(cur, Cc)
            out.append((wx0 + (j + 0.5) * C, wz0 + (i + 0.5) * C))
            cur = prev[i, j]
        return out[::-1]

    pts = [src]
    cur = node(*src)
    for w in waypoints:
        nw = node(*w)
        seg = path(cur, nw)
        pts += seg[1:]
        cur = nw
    return np.array(pts, np.float64)


def roads(h):
    L = lambda lo, la: to_local(lo, la)  # noqa: E731
    # US 290: downtown -> across the river -> Oak Hill "Y" -> Dripping Springs -> on toward Johnson City (smoothed)
    hw_pts = [
        L(-97.7431, 30.2672),
        (-1500, 1400),
        (-4300, 2800),
        (-7600, 3500),
        L(-97.8605, 30.2335),
        (-16000, 4700),
        (-21000, 5900),
        (-26000, 7000),
        (-30000, 7900),
        L(-98.0867, 30.1902),
        (-36500, 8700),
        (-41000, 8300),
        (-47000, 7000),
        (-53000, 5300),
        (-59000, 3500),
    ]
    hw = smooth_path(catmull(hw_pts), lambda s: 600.0)
    s_hw = arclen(hw)
    # the junction: 22 miles from downtown
    jx = np.interp(LEG, s_hw, hw[:, 0])
    jz = np.interp(LEG, s_hw, hw[:, 1])
    # the dirt road: south from the highway's centre line, a left turn (east-south-east), then the valley route
    T1 = (jx, jz + 2900)
    az = math.radians(112)
    src = (T1[0] + 1300 * math.sin(az), T1[1] - 1300 * math.cos(az))
    vr = valley_route(h, src, [(-44000, 26000), (-50000, 30000), (-53500, 31000)])
    first = np.array([(jx, jz), (jx, jz + 1400), T1, (T1[0] + 300 * math.sin(az), T1[1] - 300 * math.cos(az)), src], np.float64)
    dirt = np.vstack([resample(first, 20.0), vr[1:]])
    dirt = smooth_path(dirt, lambda s: 0.0 if s < 2300 else (110.0 if s < 5000 else min(320.0, 110.0 + (s - 5000) * 0.2)))
    dirt = smooth_path(dirt, lambda s: 0.0 if s < 2300 else 140.0)
    s_d = arclen(dirt)
    if s_d[-1] < LEG:
        raise SystemExit(f"dirt road only {s_d[-1] / 1000:.1f} km; extend the waypoints")
    cut = np.searchsorted(s_d, LEG)
    end = (np.interp(LEG, s_d, dirt[:, 0]), np.interp(LEG, s_d, dirt[:, 1]))
    dirt = np.vstack([dirt[:cut], end])
    return hw, dirt, (jx, jz)


def dist_field(P, gx0, gz0, cell, nx, nz, clamp):
    """distance (m) to the polyline and the arc of the nearest point, per texel centre"""
    s = arclen(P)
    D = np.full((nz, nx), clamp, np.float64)
    A = np.zeros((nz, nx), np.float64)
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        lo = np.minimum(a, b) - clamp
        hi = np.maximum(a, b) + clamp
        j0 = max(0, int((lo[0] - gx0) / cell))
        j1 = min(nx, int((hi[0] - gx0) / cell) + 2)
        i0 = max(0, int((lo[1] - gz0) / cell))
        i1 = min(nz, int((hi[1] - gz0) / cell) + 2)
        if j1 <= j0 or i1 <= i0:
            continue
        xs = gx0 + (np.arange(j0, j1) + 0.5) * cell
        zs = gz0 + (np.arange(i0, i1) + 0.5) * cell
        X, Zz = np.meshgrid(xs, zs)
        ab = b - a
        ll = max(1e-9, ab @ ab)
        t = np.clip(((X - a[0]) * ab[0] + (Zz - a[1]) * ab[1]) / ll, 0, 1)
        d = np.hypot(X - (a[0] + t * ab[0]), Zz - (a[1] + t * ab[1]))
        sub = D[i0:i1, j0:j1]
        m = d < sub
        sub[m] = d[m]
        A[i0:i1, j0:j1][m] = (s[i] + t * math.sqrt(ll))[m]
    return D, A


# the road grid (40 m) over both roads
RX0, RX1, RZ0, RZ1, RCELL = -62000.0, 3000.0, -4000.0, 36000.0, 40.0
RNX = int((RX1 - RX0) / RCELL)
RNZ = int((RZ1 - RZ0) / RCELL)
DCLAMP = 1600.0


def main():
    os.makedirs(OUT, exist_ok=True)
    h, hv, ho, hvo = heights()
    print("visual heights", hv.min(), hv.max(), "outer", hvo.min(), hvo.max())
    enco = np.clip(np.round((hvo + 1000) * 10), 0, 65535).astype("<u2")
    with gzip.open(os.path.join(OUT, "height_o.u16z"), "wb", compresslevel=9) as f:
        f.write(enco.tobytes())
    rgbao, _ = albedo(ho, OCELL, OGX0, OGZ0)
    Image.fromarray(rgbao).save(os.path.join(OUT, "albedo_o.png"), optimize=True)
    enc = np.clip(np.round((hv + 1000) * 10), 0, 65535).astype("<u2")
    with gzip.open(os.path.join(OUT, "height.u16z"), "wb", compresslevel=9) as f:
        f.write(enc.tobytes())
    hq = enc.astype(np.float64) / 10 - 1000  # exactly what the shader sees
    rgba, wmask = albedo(h)
    Image.fromarray(rgba).save(os.path.join(OUT, "albedo.png"), optimize=True)
    hw, dirt, J = roads(h)
    print("highway km", arclen(hw)[-1] / 1000, "dirt km", arclen(dirt)[-1] / 1000)
    Dh, Ah = dist_field(hw, RX0, RZ0, RCELL, RNX, RNZ, DCLAMP)
    Dd, Ad = dist_field(dirt, RX0, RZ0, RCELL, RNX, RNZ, DCLAMP)
    road = np.stack([Dh * 20, Ah / 0.7, Dd * 20, Ad / 0.7], -1)
    road = np.clip(np.round(road), 0, 65535).astype("<u2")
    with gzip.open(os.path.join(OUT, "road.u16z"), "wb", compresslevel=9) as f:
        f.write(road.tobytes())

    def hat(P):
        gx = (P[:, 0] - GX0) / CELL
        gz = (P[:, 1] - GZ0) / CELL
        return bilinear(hq, gx, gz)

    def poly(P, step):
        P = resample(P, step)
        s = arclen(P)
        hh = hat(P)
        return ",".join(f"[{x:.1f},{z:.1f},{y:.1f},{q:.1f}]" for (x, z), y, q in zip(P, hh, s))

    # places
    dl = arclen(dirt)
    farm = dirt[-1]
    places = {
        "austin": to_local(-97.7431, 30.2672),
        "oakHill": to_local(-97.8605, 30.2335),
        "drippingSprings": to_local(-98.0867, 30.1902),
        "junction": J,
        "farm": tuple(farm),
    }
    ws = []
    for k, v in places.items():
        ws.append(f"  {k}: [{v[0]:.1f}, {v[1]:.1f}, {float(hat(np.array([v]))[0]):.1f}],")
    with open(TS, "w") as f:
        f.write("// GENERATED by assets-src/robert-johnson-ranch/bake_drive.py (do not edit): the ground grids and the two\n")
        f.write("// roads of DriveOutOfAustin in the local metric frame (origin downtown Austin; X east, Z SOUTH, metres; heights\n")
        f.write("// are the VISUAL heights the ground shader ray-marches, exaggerated: trend x%.1f, local relief x%.1f).\n" % (EX_TREND, EX_LOCAL))
        f.write("// Leg 1 is the real US 290 (smoothed); legs 2-3 (the dirt road) are illustrative: valley floors of the DEM.\n")
        f.write(f"export const GRID = {{ x0: {GX0}, z0: {GZ0}, cell: {CELL}, nx: {NX}, nz: {NZ} }};\n")
        f.write(f"/** the outer grid: the whole offline DEM at 150 m (the far land); past it the land is the air */\n")
        f.write(f"export const GRID_O = {{ x0: {OGX0}, z0: {OGZ0}, cell: {OCELL}, nx: {ONX}, nz: {ONZ} }};\n")
        f.write(f"export const ROAD_GRID = {{ x0: {RX0}, z0: {RZ0}, cell: {RCELL}, nx: {RNX}, nz: {RNZ}, distScale: 20, arcScale: 0.7 }};\n")
        f.write(f"export const LEG_M = {LEG:.2f};\n")
        f.write(f"export const HWY_LEN = {arclen(hw)[-1]:.1f};\n")
        f.write(f"export const DIRT_LEN = {dl[-1]:.1f};\n")
        f.write("/** places [x, z, visual height] */\nexport const PLACE = {\n" + "\n".join(ws) + "\n} as const;\n")
        f.write("/** US 290 from downtown: [x, z, h, arc] every 100 m */\n")
        f.write(f"export const HWY: [number, number, number, number][] = [{poly(hw, 100.0)}];\n")
        f.write("/** the dirt road from the highway's centre line to the farm: [x, z, h, arc] every 50 m */\n")
        f.write(f"export const DIRT: [number, number, number, number][] = [{poly(dirt, 50.0)}];\n")
    # Austin c. 1978 as a soft cluster of low pale blocks round downtown (a street grid turned ~17 deg), off the water
    # and off the highway; downtown a little taller
    rng = np.random.default_rng(1978)
    blocks = []
    ang = math.radians(17)
    ca, sa = math.cos(ang), math.sin(ang)
    sp = 640.0
    for i in range(-9, 10):
        for j in range(-9, 10):
            gx0, gz0 = i * sp + rng.uniform(-90, 90), j * sp + rng.uniform(-90, 90)
            x = gx0 * ca - gz0 * sa + 400
            z = gx0 * sa + gz0 * ca + 300
            r = math.hypot(x - 400, z - 300)
            if rng.random() > math.exp(-((r / 3400.0) ** 2)) * 1.15:
                continue
            w = rng.uniform(280, 470)
            d = rng.uniform(260, 450)
            # off the water and the highway
            gxi, gzi = (x - GX0) / CELL, (z - GZ0) / CELL
            wv = bilinear(wmask, np.array([gxi]), np.array([gzi]))[0]
            if wv > 0.05:
                continue
            dh = np.min(np.hypot(hw[:, 0] - x, hw[:, 1] - z))
            if dh < 420:
                continue
            tall = r < 1300
            ht = rng.uniform(260, 620) if tall else rng.uniform(90, 230)
            cx = np.array([x - w / 2, x + w / 2, x - w / 2, x + w / 2])
            cz = np.array([z - d / 2, z - d / 2, z + d / 2, z + d / 2])
            gh = float(np.min(bilinear(hq, (cx - GX0) / CELL, (cz - GZ0) / CELL)))
            blocks.append(f"[{x:.0f},{z:.0f},{w:.0f},{d:.0f},{ht:.0f},{gh:.1f}]")
    with open(TS, "a") as f:
        f.write("/** Austin's blocks: [x, z, w (along the turned grid's x), d, height, ground h]; the grid is turned 17 deg */\n")
        f.write(f"export const CITY: [number, number, number, number, number, number][] = [{','.join(blocks)}];\n")
        f.write("export const CITY_ANGLE = 17;\n")
    print("city blocks", len(blocks))
    # a check image
    sc = 4
    small = rgba[::sc, ::sc, :3].copy()
    im = Image.fromarray(small)
    d = ImageDraw.Draw(im)
    for P, col in ((hw, (230, 230, 210)), (dirt, (255, 200, 120))):
        d.line([((x - GX0) / CELL / sc, (z - GZ0) / CELL / sc) for x, z in P], fill=col, width=1)
    im.save(os.path.join(os.environ.get("BAKE_CHECK", "/tmp"), "drive_bake_check.png"))
    print("farm", farm, "junction", J)


if __name__ == "__main__":
    main()
