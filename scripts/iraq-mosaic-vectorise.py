# Vectorises + georeferences the CIA 2003 "Distribution of Ethnoreligious Groups and
# Major Tribes" map of Iraq (public domain) into a lon/lat planar partition of Iraq,
# for the clip "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (builder M, Oct 5 2026).
#
#   uv run --with opencv-python-headless --with scipy --with shapely --with numpy \
#     python scripts/iraq-mosaic-vectorise.py <panel.png> <ne_iraq.json> [<diag dir>]
#
#   <panel.png>   the top-right panel of the LOC sheet "Iraq country profile" (CIA, 2003),
#                 Commons File:Iraq country profile. LOC 2003629031.jpg (11878 x 8047),
#                 https://upload.wikimedia.org/wikipedia/commons/c/ce/Iraq_country_profile._LOC_2003629031.jpg
#                 cropped to (9700, 560)-(11760, 2800) -> 2060 x 2240 px. (LOC 2003629031,
#                 https://www.loc.gov/item/2003629031/ ; the same map alone, 1044 px:
#                 CIA 761864AI 1-03.)
#   <ne_iraq.json> Natural Earth 10m Iraq (world-atlas countries-10m, id 368) as GeoJSON geometry.
# Writes scripts/iraq-mosaic.json (read by scripts/build-iraq-mosaic.mjs).
#
# METHOD
#  1. Classify every pixel to the nearest legend swatch in CIELAB (the 7 classes + the
#     page background + lake blue); ink (L < 100: text, rivers, dots, the border) and far
#     colours are unknown. Inside = the region enclosed by the border (not reachable through
#     page-background pixels from the page). The one light-grey patch inside (Jazira, NW of
#     Lake Tharthar, ~(814, 798) px) matches no swatch; its hue (R > G > B) is that of the
#     Sunni Arab/Kurd mix, so it is read as that class (the legend lists no other).
#  2. Unknown pixels (text, rivers, lakes, the legend box that covers the SW desert) take the
#     nearest known class; each class indicator is Gaussian-smoothed (sigma 3 px ~ 1.6 km)
#     and the argmax kept (removes the 1-2 px anti-alias bands between swatches); islands
#     under MIN_AREA px are dissolved into their surroundings. The labels are then extended
#     past the map's outline (nearest class) so the partition covers more than Iraq.
#  3. Georeference: affine fit (map px -> LCC km, parallels 31/36 N, centre 44 E 33 N) to
#     20 city dots, refined by ICP of the map's outline (the centre line of its 8 px border;
#     the stretch under the legend box excluded) against Natural Earth 10m Iraq; cities
#     weighted x3, 80th-percentile outlier cut, 10 iterations.
#  4. Vectorise as a planar partition: the pixel-crack boundaries between classes are cut into
#     chains at junctions, each chain smoothed once (Gaussian on 1 px resampled vertices,
#     junction ends fixed) and simplified, then polygonized, so neighbouring regions share
#     identical edges. Map to lon/lat, clip to Natural Earth Iraq -> the regions tile Iraq.
#     SEAMS = the shared chains between two classes, clipped to Iraq, tagged with the pair.
import json
import sys

import cv2
import numpy as np
from scipy import ndimage as ndi
from shapely import ops
from shapely.geometry import LineString, MultiLineString, MultiPolygon, Point, Polygon, mapping, shape
from shapely.validation import make_valid
from shapely.ops import polylabel

PANEL, NE_PATH = sys.argv[1], sys.argv[2]
DIAG = sys.argv[3] if len(sys.argv) > 3 else None
OUT = "scripts/iraq-mosaic.json"

CLASSES = ["kurd", "sunni", "sunniKurd", "shia", "shiaSunni", "turkoman", "sparse"]
LABELS = {
    "kurd": "Kurd",
    "sunni": "Sunni Arab",
    "sunniKurd": "Sunni Arab/Kurd mix",
    "shia": "Shia Arab",
    "shiaSunni": "Shia/Sunni Arab mix",
    "turkoman": "Sunni Turkoman",
    "sparse": "Sparsely populated",
}
SWATCH = [(195, 169, 178), (222, 200, 176), (136, 123, 114), (187, 192, 193), (134, 142, 145), (171, 159, 182), (244, 243, 235)]
BG, LAKE = (152, 136, 136), (173, 179, 202)
LEGEND_BOX = (214, 1390, 812, 2048)  # x0 y0 x1 y1 (px), +30 px margin (its frame + shadow)
MIN_AREA = {c: 700 for c in range(7)}  # px (~190 km^2); smaller islands are tribe-name / label artefacts
MIN_AREA[2] = MIN_AREA[4] = 350  # the mixes keep their small town pockets (As Sulaymaniyah, As Salman, Al Busayyah)
MIN_AREA[5] = 1000  # Turkoman: its real pockets are >= ~1500 px; smaller ones are lake/ink edge artefacts
MIN_AREA[6] = 1500  # sparse islands inside a people: white label knock-outs
SIGMA = 3.0

# --- city dots (px, measured on the panel) and their real positions ---------------
CITIES = {
    "Dihok": ((954.2, 327.1), (42.988, 36.867)),
    "Mosul": ((976.8, 445.5), (43.130, 36.340)),
    "Sinjar": ((758.9, 448.1), (41.877, 36.322)),
    "Arbil": ((1133.6, 476.5), (44.009, 36.191)),
    "As Sulaymaniyah": ((1381.4, 609.7), (45.437, 35.561)),
    "Kirkuk": ((1202.4, 625.6), (44.392, 35.468)),
    "Tikrit": ((1076.9, 825.2), (43.678, 34.607)),
    "Samarra": ((1116.5, 906.5), (43.874, 34.199)),
    "Baghdad": ((1209.8, 1087.3), (44.366, 33.315)),
    "Ar Ramadi": ((1018.8, 1075.3), (43.300, 33.420)),
    "Karbala": ((1141.0, 1247.2), (44.024, 32.616)),
    "Al Kut": ((1464.9, 1255.8), (45.818, 32.513)),
    "An Najaf": ((1193.5, 1382.0), (44.336, 32.000)),
    "An Nasiriyah": ((1514.0, 1556.0), (46.257, 31.044)),
    "Al Basrah": ((1832.3, 1688.9), (47.783, 30.508)),
    "As Salman": ((1235.7, 1699.9), (44.537, 30.505)),
    "Al Busayyah": ((1527.5, 1779.5), (46.112, 30.128)),
    "Ar Rutbah": ((486.0, 1145.6), (40.284, 33.038)),
    "An Nukhayb": ((807.4, 1377.5), (42.258, 32.041)),
    "Akashat": ((400.0, 1004.6), (40.600, 33.800)),
}
UNCERTAIN = {"Akashat", "An Nasiriyah"}  # reported, not fitted: Akashat's gazetteer position is approximate;
# the map's An Nasiriyah dot sits ~20 km W of the real town (the cartographer's placement)

# --- LCC (sphere) ---------------------------------------------------------------------
R = 6371.0
P1, P2, LAT0, LON0 = np.radians(31), np.radians(36), np.radians(33), np.radians(44)
NN = np.log(np.cos(P1) / np.cos(P2)) / np.log(np.tan(np.pi / 4 + P2 / 2) / np.tan(np.pi / 4 + P1 / 2))
FF = np.cos(P1) * np.tan(np.pi / 4 + P1 / 2) ** NN / NN
RHO0 = R * FF / np.tan(np.pi / 4 + LAT0 / 2) ** NN


def lcc(ll):
    ll = np.asarray(ll, float)
    lam, phi = np.radians(ll[..., 0]), np.radians(ll[..., 1])
    rho = R * FF / np.tan(np.pi / 4 + phi / 2) ** NN
    th = NN * (lam - LON0)
    return np.stack([rho * np.sin(th), RHO0 - rho * np.cos(th)], -1)


def lcc_inv(xy):
    xy = np.asarray(xy, float)
    x, y = xy[..., 0], xy[..., 1]
    rho = np.sign(NN) * np.hypot(x, RHO0 - y)
    th = np.arctan2(x, RHO0 - y)
    lam = LON0 + th / NN
    phi = 2 * np.arctan((R * FF / rho) ** (1 / NN)) - np.pi / 2
    return np.stack([np.degrees(lam), np.degrees(phi)], -1)


# ---------------------------------------------------------------------------------------
# 1. classify
# ---------------------------------------------------------------------------------------
img = cv2.imread(PANEL)
H, W = img.shape[:2]
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
cols = np.array(SWATCH + [BG, LAKE], np.uint8)[None, :, ::-1]
clab = cv2.cvtColor(cols, cv2.COLOR_BGR2LAB)[0].astype(np.float32)
d2 = ((lab[:, :, None, :] - clab[None, None]) ** 2).sum(-1)
L = d2.argmin(-1).astype(np.int16)
dmin = np.sqrt(d2.min(-1))
dark = lab[:, :, 0] < 100
IBG, ILAKE, UNK = 7, 8, -1

lbl, _ = ndi.label(L == IBG)
outside = lbl == lbl[300, 300]
lbl2, _ = ndi.label(~outside)
inside = lbl2 == lbl2[1090, 1200]  # Baghdad

K = L.copy()
inkhalo = ndi.binary_dilation(dark, iterations=3)  # anti-aliased ink edges read as false greys
rim = ndi.distance_transform_edt(inside) < 14  # the 8 px border line + its grey casing
lakes = ndi.binary_dilation(L == ILAKE, iterations=5)  # lake blue blends into false Turkoman/Shia at its shore
K[inkhalo | rim | lakes | (dmin > 22)] = UNK
grey, ng = ndi.label(inside & (L == IBG) & ~dark & (dmin <= 22))
if ng:
    ga = ndi.sum(np.ones_like(grey), grey, index=np.arange(1, ng + 1))
    K[np.isin(grey, np.nonzero(ga > 1500)[0] + 1)] = 2  # the light-grey Jazira patch -> Sunni Arab/Kurd mix (see header)
x0, y0, x1, y1 = LEGEND_BOX
K[y0:y1, x0:x1] = UNK
K[~inside] = UNK


def fill_nearest(K, valid):
    _, (iy, ix) = ndi.distance_transform_edt(~valid, return_indices=True)
    return K[iy, ix]


K = fill_nearest(K, K >= 0)
K[~inside] = UNK


def smooth_labels(K, region):
    acc = np.full((len(CLASSES),) + K.shape, -1.0, np.float32)
    for c in range(len(CLASSES)):
        acc[c] = ndi.gaussian_filter((K == c).astype(np.float32), SIGMA)
    S = acc.argmax(0).astype(np.int16)
    S[~region] = UNK
    return S


def dissolve_small(K, region):
    changed = 0
    for c in range(len(CLASSES)):
        cl, n = ndi.label(K == c)
        if n == 0:
            continue
        areas = ndi.sum(np.ones_like(cl), cl, index=np.arange(1, n + 1))
        small = np.isin(cl, np.nonzero(areas < MIN_AREA[c])[0] + 1)
        K[small] = UNK
        changed += int(small.sum())
    K = fill_nearest(K, K >= 0)
    K[~region] = UNK
    return K, changed


for _ in range(3):
    K = smooth_labels(K, inside)
    K = fill_nearest(K, K >= 0)
    K[~inside] = UNK
    K, ch = dissolve_small(K, inside)
    if ch == 0:
        break
# holes of one class inside another, under MIN_AREA, are gone: also dissolve tiny holes
# (the per-class pass above handles both since every hole is a component of its class)
counts = {CLASSES[c]: int((K == c).sum()) for c in range(len(CLASSES))}
print("class px:", counts)

# extend past the outline so the partition covers more than Iraq
FULL = fill_nearest(K, K >= 0)

# ---------------------------------------------------------------------------------------
# 3. georeference
# ---------------------------------------------------------------------------------------
ne = shape(json.load(open(NE_PATH)))
ne_ring = np.array(ne.exterior.coords)
ne_xy = lcc(ne_ring)
ne_line = LineString(ne_xy)
dens = np.array([ne_line.interpolate(s).coords[0] for s in np.arange(0, ne_line.length, 0.5)])

# the map's outline: the centre line of the border (inside eroded by half its 8 px width)
core = ndi.binary_erosion(inside, iterations=4)
cs, _ = cv2.findContours(core.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outline = max(cs, key=cv2.contourArea)[:, 0, :].astype(float)
bx0, by0, bx1, by1 = LEGEND_BOX
keep = ~((outline[:, 0] > bx0 - 25) & (outline[:, 0] < bx1 + 25) & (outline[:, 1] > by0 - 25) & (outline[:, 1] < by1 + 25))
outline = outline[keep][::2]

cn = [k for k in CITIES if k not in UNCERTAIN]
cpx = np.array([CITIES[k][0] for k in cn])
cxy = lcc(np.array([CITIES[k][1] for k in cn]))


def design(p):
    return np.column_stack([p[:, 0], p[:, 1], np.ones(len(p))])


A, *_ = np.linalg.lstsq(design(cpx), cxy, rcond=None)
from scipy.spatial import cKDTree

tree = cKDTree(dens)
for it in range(10):
    t = design(outline) @ A
    dist, idx = tree.query(t)
    cut = np.percentile(dist, 80)
    m = dist <= cut
    Xs = np.vstack([design(outline[m])] + [design(cpx)] * 3)
    Ys = np.vstack([dens[idx[m]]] + [cxy] * 3)
    A, *_ = np.linalg.lstsq(Xs, Ys, rcond=None)
t = design(outline) @ A
dist, _ = tree.query(t)
cres = np.linalg.norm(design(cpx) @ A - cxy, axis=1)
print(f"outline: median {np.median(dist):.2f} km, p80 {np.percentile(dist, 80):.2f} km, p95 {np.percentile(dist, 95):.2f} km (n={len(dist)})")
print(f"cities: rms {np.sqrt((cres ** 2).mean()):.2f} km, max {cres.max():.2f} km ({cn[int(cres.argmax())]})")
for k, r in zip(cn, cres):
    print(f"   {k:16s} {r:5.1f} km")
for k in UNCERTAIN:
    r = np.linalg.norm(design(np.array([CITIES[k][0]])) @ A - lcc(np.array([CITIES[k][1]])), axis=1)[0]
    print(f"   {k:16s} {r:5.1f} km (not fitted)")
# pixel scale
sx = np.linalg.norm(A[0]) ; sy = np.linalg.norm(A[1])
print(f"scale: {sx:.3f} / {sy:.3f} km per px")


def px2ll(p):
    p = np.asarray(p, float)
    return lcc_inv(design(p) @ A)


# ---------------------------------------------------------------------------------------
# 4. planar partition from the label raster (pixel cracks -> chains -> smooth -> faces)
# ---------------------------------------------------------------------------------------
# restrict to a box round Iraq (+ margin) for speed
ys, xs = np.nonzero(inside)
X0, X1, Y0, Y1 = max(0, xs.min() - 40), min(W, xs.max() + 41), max(0, ys.min() - 40), min(H, ys.max() + 41)
G = FULL[Y0:Y1, X0:X1]
gh, gw = G.shape
segs = {}  # undirected crack segments keyed by endpoints -> (labelA, labelB)
# vertical cracks between (y, x) and (y, x+1): from corner (x+1, y) to (x+1, y+1)
dy, dx = np.nonzero(G[:, :-1] != G[:, 1:])
for y, x in zip(dy, dx):
    segs[((x + 1, y), (x + 1, y + 1))] = (int(G[y, x]), int(G[y, x + 1]))
dy, dx = np.nonzero(G[:-1, :] != G[1:, :])
for y, x in zip(dy, dx):
    segs[((x, y + 1), (x + 1, y + 1))] = (int(G[y, x]), int(G[y + 1, x]))
# frame
FR = -2
for x in range(gw):
    segs[((x, 0), (x + 1, 0))] = (FR, int(G[0, x]))
    segs[((x, gh), (x + 1, gh))] = (FR, int(G[gh - 1, x]))
for y in range(gh):
    segs[((0, y), (0, y + 1))] = (FR, int(G[y, 0]))
    segs[((gw, y), (gw, y + 1))] = (FR, int(G[y, gw - 1]))

deg = {}
for a, b in segs:
    deg[a] = deg.get(a, 0) + 1
    deg[b] = deg.get(b, 0) + 1
adj = {}
for (a, b), pr in segs.items():
    adj.setdefault(a, []).append((b, pr))
    adj.setdefault(b, []).append((a, pr))

# junction = degree != 2 ; also break where the label pair changes (cannot at deg 2) .
used = set()
chains = []


def key(a, b):
    return (a, b) if (a, b) in segs else (b, a)


for start in list(adj):
    if deg[start] == 2:
        continue
    for nb, pr in adj[start]:
        k0 = key(start, nb)
        if k0 in used:
            continue
        used.add(k0)
        pts = [start, nb]
        prev, cur = start, nb
        while deg[cur] == 2:
            nxt = [n for n, _ in adj[cur] if n != prev][0]
            kk = key(cur, nxt)
            if kk in used:
                break
            used.add(kk)
            pts.append(nxt)
            prev, cur = cur, nxt
        chains.append((pts, tuple(sorted(pr)), False))
# closed loops (islands) not touching any junction
for (a, b), pr in segs.items():
    if (a, b) in used:
        continue
    used.add((a, b))
    pts = [a, b]
    prev, cur = a, b
    while cur != a:
        nxt = [n for n, _ in adj[cur] if n != prev][0]
        kk = key(cur, nxt)
        if kk in used:
            break
        used.add(kk)
        pts.append(nxt)
        prev, cur = cur, nxt
    chains.append((pts, tuple(sorted(pr)), True))
print(f"chains: {len(chains)}")


def resample(p, step=1.0, closed=False):
    p = np.asarray(p, float)
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(2, int(np.ceil(s[-1] / step)) + 1)
    si = np.linspace(0, s[-1], n)
    return np.column_stack([np.interp(si, s, p[:, 0]), np.interp(si, s, p[:, 1])])


def smooth_chain(p, closed, frame):
    if frame:
        return np.asarray(p, float)
    q = resample(p, 1.0)
    if closed:
        q = q[:-1]
        qs = np.column_stack([ndi.gaussian_filter1d(q[:, i], 3.0, mode="wrap") for i in range(2)])
        return np.vstack([qs, qs[:1]])
    if len(q) < 5:
        return q
    # fixed ends: smooth the deviation from the chord
    n = len(q)
    t = np.linspace(0, 1, n)[:, None]
    chord = q[0] * (1 - t) + q[-1] * t
    dev = q - chord
    pad = 12
    devp = np.vstack([-dev[pad:0:-1], dev, -dev[-2 : -pad - 2 : -1]])
    ds = np.column_stack([ndi.gaussian_filter1d(devp[:, i], 3.0, mode="nearest") for i in range(2)])[pad : pad + n]
    ds[0] = 0
    ds[-1] = 0
    return chord + ds


lines = []
meta = []
for pts, pr, closed in chains:
    frame = FR in pr
    q = smooth_chain(pts, closed, frame)
    ls = LineString(q).simplify(0.3, preserve_topology=False) if not frame else LineString(q)
    if closed and len(ls.coords) < 4:
        ls = LineString(q)
    lines.append(ls)
    meta.append((pr, closed, frame))

faces = list(ops.polygonize(ops.unary_union(lines)))
print(f"faces: {len(faces)}")
reg_by_class = {c: [] for c in range(len(CLASSES))}
for f in faces:
    if f.area < 2:
        continue
    mask = np.zeros((gh, gw), np.uint8)
    ext = np.round(np.array(f.exterior.coords) * 4).astype(np.int32)
    cv2.fillPoly(mask, [ext], 1, shift=2)
    for h in f.interiors:
        cv2.fillPoly(mask, [np.round(np.array(h.coords) * 4).astype(np.int32)], 0, shift=2)
    vals = G[mask.astype(bool)]
    vals = vals[vals >= 0]
    if len(vals) == 0:
        rp = f.representative_point()
        c = int(G[min(gh - 1, int(rp.y)), min(gw - 1, int(rp.x))])
    else:
        c = int(np.bincount(vals).argmax())
    reg_by_class[c].append(f)


def to_ll_geom(g):
    def tr(coords):
        a = np.asarray(coords, float) + [X0, Y0]
        return px2ll(a)

    if g.geom_type == "Polygon":
        return Polygon(tr(g.exterior.coords), [tr(h.coords) for h in g.interiors])
    if g.geom_type == "MultiPolygon":
        return MultiPolygon([to_ll_geom(p) for p in g.geoms])
    if g.geom_type == "LineString":
        return LineString(tr(g.coords))
    if g.geom_type == "MultiLineString":
        return MultiLineString([tr(l.coords) for l in g.geoms])
    raise ValueError(g.geom_type)


ne_v = make_valid(ne)
regions = []
for c, fs in reg_by_class.items():
    if not fs:
        continue
    u = ops.unary_union(fs)
    u_ll = to_ll_geom(u)
    clipped = make_valid(u_ll.intersection(ne_v))
    polys = [g for g in getattr(clipped, "geoms", [clipped]) if g.geom_type == "Polygon"]
    for p in polys:
        km2 = Polygon(lcc(np.array(p.exterior.coords))).area - sum(Polygon(lcc(np.array(h.coords))).area for h in p.interiors)
        if km2 < 1:
            continue
        regions.append((CLASSES[c], p, km2))

# seams between classes (not the frame), as lon/lat lines clipped to Iraq
seams = []
for ls, (pr, closed, frame) in zip(lines, meta):
    if frame or UNK in pr:
        continue
    a, b = CLASSES[pr[0]], CLASSES[pr[1]]
    g = make_valid(to_ll_geom(ls)).intersection(ne_v)
    for part in getattr(g, "geoms", [g]):
        if part.geom_type == "LineString" and part.length > 0:
            seams.append((a, b, part))
# merge seam pieces per pair
merged = []
pairs = sorted(set((a, b) for a, b, _ in seams))
for a, b in pairs:
    m = ops.linemerge([s for x, y, s in seams if (x, y) == (a, b)])
    for part in getattr(m, "geoms", [m]):
        merged.append((a, b, part))


def r5(p):
    return [round(float(p[0]), 5), round(float(p[1]), 5)]


def km_len(ls):
    q = lcc(np.array(ls.coords))
    return float(np.linalg.norm(np.diff(q, axis=0), axis=1).sum())


total = sum(k for _, _, k in regions)
ne_km2 = Polygon(lcc(ne_ring)).area
print(f"regions: {len(regions)}, area {total:.0f} km^2 vs NE Iraq {ne_km2:.0f} km^2 ({100 * (total - ne_km2) / ne_km2:+.3f} %)")
for c in CLASSES:
    rs = [k for cc, _, k in regions if cc == c]
    print(f"   {c:10s} {len(rs):3d} regions {sum(rs):9.0f} km^2")
print(f"seams: {len(merged)} pieces, {sum(km_len(s) for _, _, s in merged):.0f} km")

out = {
    "source": {
        "map": "CIA, 'Distribution of Ethnoreligious Groups and Major Tribes' (761864AI 1-03), public domain; panel of 'Iraq: Country Profile' (CIA 2003), LOC 2003629031",
        "url": "https://commons.wikimedia.org/wiki/File:Iraq_country_profile._LOC_2003629031.jpg",
        "border": "Natural Earth 10m (world-atlas countries-10m, Iraq id 368)",
        "fit": {
            "outline_median_km": round(float(np.median(dist)), 2),
            "outline_p80_km": round(float(np.percentile(dist, 80)), 2),
            "cities_rms_km": round(float(np.sqrt((cres ** 2).mean())), 2),
            "affine_px_to_lcc_km": A.T.round(6).tolist(),
            "lcc": {"parallels": [31, 36], "lat0": 33, "lon0": 44, "R_km": R},
            "panel_crop": [9700, 560, 11760, 2800],
        },
    },
    "classes": [{"id": c, "label": LABELS[c]} for c in CLASSES],
    "regions": [
        {
            "cls": c,
            "km2": round(k, 1),
            "rings": [[r5(p) for p in p_.exterior.coords]] + [[r5(p) for p in h.coords] for h in p_.interiors],
            "anchor": r5(polylabel(p_, 0.002).coords[0]),
        }
        for c, p_, k in sorted(regions, key=lambda r: -r[2])
    ],
    "seams": [{"a": a, "b": b, "km": round(km_len(s), 1), "pts": [r5(p) for p in s.coords]} for a, b, s in merged],
}
json.dump(out, open(OUT, "w"))
print("wrote", OUT)

if DIAG:
    np.save(f"{DIAG}/K.npy", K)
    json.dump({"A": A.tolist(), "outline": outline.tolist(), "cities": {k: v[0] for k, v in CITIES.items()}}, open(f"{DIAG}/fit.json", "w"))
