"""Bake the parks-and-pools cascade for HeBuiltTheMap (robert-power-drug, cut 9).

Reads the sister clip's map plate (public/robert-graft-machine/highways/plate.jpg + nj_mask.png, read-only) and
writes generated/components/robert-power-drug/heBuiltMapParks.ts: ~44 cut-out positions in WORLD px (= px of the
4K source frame, as HighwaysHeBuilt) on the land of the five boroughs and Long Island, Poisson-disc spaced, clear
of the hero cut-outs, the caption bands of the final camera and the frame edges, with a pop frame each (densest
on "parks" f262, all landed by "pools" f276).

Run from the kise repo:  uv run --with numpy --with pillow python assets-src/robert-power-drug/parks_bake.py
Largest array: the plate, 2296 x 2492 float32 = 23 MB.
"""
import json
import math
import random

import numpy as np
from PIL import Image

PLATE = "public/robert-graft-machine/highways/"
OUT = "generated/components/robert-power-drug/heBuiltMapParks.ts"
PS, X0, PADTOP = 0.7, 560, 700  # highwaysData HW: plate px = (world - X0, world + PADTOP) * PS

plate = np.asarray(Image.open(PLATE + "plate.jpg").convert("L")).astype(np.float32)
nj = np.asarray(Image.open(PLATE + "nj_mask.png"))[..., 3]
H, W = plate.shape


def land(x, y):
    px, py = int((x - X0) * PS), int((y + PADTOP) * PS)
    if px < 0 or py < 0 or px >= W or py >= H:
        return False
    return plate[py, px] > 150 and nj[py, px] < 60


# hero boxes (world, mirror heBuiltMapLayout HEROES: x +- w/2, y - h .. y) + the Cross Bronx strip
HERO_BOXES = [
    (1780, 473, 2200, 650),  # Triborough
    (1240, 1109, 1810, 1357),  # Verrazano
    (1502, 529, 1877, 760),  # Lincoln Center
    (1945, 667, 2395, 895),  # Shea
    (3134, 768, 3266, 1386),  # Jones Beach tower
    (3237, 1142, 3463, 1404),  # umbrella
]
STRIP = [(1850, 389), (1900, 390), (1950, 393), (2000, 404), (2050, 427), (2100, 446), (2150, 462), (2200, 478),
         (2250, 500), (2270, 510)]
STRIP_HALF = 26
MARGIN = 12
SC = 1.05  # PARK_SC
KIND_SC = (1, 1.1, 1.05)  # PARK_KIND_SC
# per kind (0 tree, 1 lane pool, 2 kidney pool): the drawing's extent around its bottom-centre anchor incl. the paper
# rim (7), in drawing units (heBuiltMapParts Tree / Pool / KidneyPool), as (left, top, right, bottom); x SC x KIND_SC
UNITS = {0: (-42, -89, 42, 7), 1: (-61, -57, 61, 7), 2: (-62, -70, 58, 10)}
FOOT = {k: tuple(v * SC * KIND_SC[k] for v in u) for k, u in UNITS.items()}
SHARE = (0.5, 0.25, 0.25)  # trees and pools alternate, the pools alternate lane / kidney

# final camera (heBuiltMapLayout, settled from ~f236): c = (2112, 952), k = 0.782, focus screen y 900. Every icon sits
# inside the frame with a 30 px margin and, at landing, clear of the caption bands (screen y 1080-1250, 1360-1460,
# padded 8 px for the closing creep).
CX, CY, K = 2112, 952, 0.782
X_MIN = CX - (540 - 36) / K  # 30 px + the up-to-1.08 per-icon scale
X_MAX = CX + (540 - 36) / K
Y_TOP = 215  # icon tops below the plate's darkening top
Y_MAX = CY + (1920 - 900 - 40) / K
BANDS = [(CY + (1080 - 8 - 900) / K, CY + (1250 + 8 - 900) / K), (CY + (1360 - 8 - 900) / K, CY + (1460 + 8 - 900) / K)]
GAP = -16  # world px between neighbouring boxes: < 0 lets the paper rims just touch and tuck, a collage


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def box(x, y, kind, grow=0):
    l, t, r, b = FOOT[kind]
    return (x + l - grow, y + t - grow, x + r + grow, y + b + grow)


def overlap(p, q):
    return p[0] < q[2] and p[2] > q[0] and p[1] < q[3] and p[3] > q[1]


def ok(x, y, kind):
    x0, y0, x1, y1 = box(x, y, kind)
    if x0 < X_MIN or x1 > X_MAX or y0 < Y_TOP or y1 > Y_MAX:
        return False
    for b0, b1 in BANDS:
        if y1 > b0 and y0 < b1:
            return False
    for hb in HERO_BOXES:
        if overlap((x0, y0, x1, y1), (hb[0] - MARGIN, hb[1] - MARGIN, hb[2] + MARGIN, hb[3] + MARGIN)):
            return False
    for (ax, ay), (bx, by) in zip(STRIP, STRIP[1:]):
        if seg_dist(x, (y0 + y1) / 2, ax, ay, bx, by) < STRIP_HALF + MARGIN + (y1 - y0) / 2:
            return False
    # the whole footprint on land (a 5 x 4 grid over the box, the rim excluded)
    for u in (0.1, 0.3, 0.5, 0.7, 0.9):
        for v in (0.15, 0.4, 0.65, 0.9):
            if not land(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v):
                return False
    return True


# fill: every 8 px grid point, visited roughly top to bottom with a jitter (a dense, irregular quilt rather than rows),
# takes the kind furthest behind its share, else any kind that fits
rng = random.Random(9)
cands = [(x, y) for y in range(int(Y_TOP) + 60, int(Y_MAX), 8) for x in range(int(X_MIN) + 40, int(X_MAX) - 40, 8)]
cands.sort(key=lambda p: p[1] + rng.uniform(0, 260))
pts = []
for x, y in cands:
    x += rng.uniform(-4, 4)
    # the kind furthest behind its share (half trees, a quarter each pool) first, then the others
    cnt = [sum(1 for p in pts if p[2] == k) for k in (0, 1, 2)]
    order_k = sorted((0, 1, 2), key=lambda k: (cnt[k] / SHARE[k], k))
    n = len(pts) + 1
    if any(n * SHARE[k] - cnt[k] > 1.5 for k in (0, 1, 2)):
        order_k = order_k[:1]  # one kind badly behind: wait for a spot that takes it
    for kind in order_k:
        if not ok(x, y, kind):
            continue
        mine = box(x, y, kind, GAP / 2)
        if any(overlap(mine, box(a, b, k, GAP / 2)) for a, b, k in pts):
            continue
        pts.append((x, y, kind))
        break
    if len(pts) >= 46:
        break

# pop frames: density peaks on "parks" (f262), first on "hundreds" (f235), last lands by "pools" (f276)
F0, F1 = 233, 272  # pop START frames; a pop lands ~4 frames after its start
fs = np.arange(F0, F1 + 1, dtype=np.float64)
pdf = 0.25 + np.exp(-0.5 * ((fs - 258) / 8.0) ** 2)
cdf = np.cumsum(pdf)
cdf = (cdf - cdf[0]) / (cdf[-1] - cdf[0])
order = list(range(len(pts)))
rng.shuffle(order)
items = []
for rank, i in enumerate(order):
    u = (rank + 0.5) / len(pts)
    f = float(np.interp(u, cdf, fs))
    x, y, kind = pts[i]
    items.append({"x": round(x, 1), "y": round(y, 1), "f": round(f, 2), "kind": kind,
                  "rot": round(rng.uniform(-7, 7), 2), "s": round(rng.uniform(0.9, 1.08), 3)})
items.sort(key=lambda d: d["f"])
with open(OUT, "w") as fh:
    fh.write("// Baked by assets-src/robert-power-drug/parks_bake.py (HeBuiltTheMap). World px of the 4K source frame;\n")
    fh.write("// x, y = the icon's bottom centre on land; f = pop start frame; kind 0 = tree, 1 = lane pool, 2 = kidney pool; rot deg; s scale.\n")
    fh.write("export const PARKS: { x: number; y: number; f: number; kind: number; rot: number; s: number }[] = ")
    fh.write(json.dumps(items))
    fh.write(";\n")
print(len(items), "items", "kinds", [sum(1 for d in items if d["kind"] == k) for k in (0, 1, 2)], "x", round(X_MIN), round(X_MAX), "bands", [tuple(round(v) for v in b) for b in BANDS])
