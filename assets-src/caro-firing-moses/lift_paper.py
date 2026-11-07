"""Lift the corkboard look (QuoteCard, ResignForm) out of the show's 4K reference frames.

Run from the kise root:
  uv run --with numpy --with pillow --with scipy python assets-src/caro-firing-moses/lift_paper.py <reference dir>

Writes into public/caro-firing-moses/:
  qc_cork.jpg   dark cork plate (QuoteCard), quilted from the free cork strips of quoteCard_seqf1171.png
  qc_paper.jpg  blank card paper, quilted from the card's own blank area (pin and shadow excluded)
  qc_pin.png    the card's push pin (RGBA), qc_pinshadow.png its cast shadow as black + alpha
  qc_sheetL.png, qc_sheetR.png  the typed side sheets (RGBA, cut by the original frame on their outer side)
  rf_cork.jpg, rf_paper.jpg, rf_pin.png  the same for ResignForm (resignForm_seqf1560.png / _seqf1520.png)
Textures are illumination-flattened (divided by a wide blur) and quilted (Efros-Freeman, min-cut seams), so the
plates have no tiling seam. Deterministic (fixed seed).
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REF = sys.argv[1]
OUT = "public/caro-firing-moses/"
SRC = "assets-src/caro-firing-moses/"
rng = np.random.default_rng(7)


def load(name):
    return np.asarray(Image.open(f"{REF}/{name}").convert("RGB")).astype(np.float32)


def resize(a, s):
    h, w = a.shape[:2]
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return np.asarray(im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)).astype(np.float32)


def flatten(a, sigma, target):
    """Divide out the slow light falloff; keep the texture's local contrast."""
    lum = a.mean(2)
    low = ndi.gaussian_filter(lum, sigma, mode="reflect")
    return a * (target / np.maximum(low, 1))[..., None]


def quilt(srcs, out_h, out_w, B, O, n_cand=600, tol=0.2, flip=True, min_detail=0.0, reuse=0.6):
    """Image quilting from several source arrays (plus their mirror images). Returns out_h x out_w x 3."""
    C = 3
    if flip:
        srcs = list(srcs) + [s[:, ::-1].copy() for s in srcs]
    cands = []
    for si, s in enumerate(srcs):
        h, w = s.shape[:2]
        if h < B or w < B:
            continue
        # detail map: local high-pass energy, so soft (defocused, upscaled) patches can be left out; smooth
        # patches otherwise win the overlap cost and repeat
        lum = s.mean(2)
        hp = (lum - ndi.gaussian_filter(lum, 2.0)) ** 2
        det = ndi.uniform_filter(hp, B)
        ys, xs = np.meshgrid(np.arange(0, h - B + 1, 2), np.arange(0, w - B + 1, 2), indexing="ij")
        for y, x in zip(ys.ravel(), xs.ravel()):
            cands.append((si, y, x, det[y + B // 2, x + B // 2]))
    cands = np.array(cands)
    if min_detail > 0:
        cands = cands[cands[:, 3] >= np.quantile(cands[:, 3], min_detail)]
    cands = cands[:, :3].astype(int)
    n_src = len(srcs) // 2 if flip else len(srcs)
    # reuse penalty: a use count per source pixel (a flipped copy shares its original's counts)
    used = [np.zeros(s.shape[:2], np.float32) for s in srcs[:n_src]]

    def use_of(i):
        si, y, x = cands[i]
        w = srcs[si].shape[1]
        if si >= n_src:
            si, x = si - n_src, w - B - x
        return used[si][y + B // 2, x + B // 2], (si, y, x)
    step = B - O
    ny = int(np.ceil((out_h - O) / step))
    nx = int(np.ceil((out_w - O) / step))
    H, W = ny * step + O, nx * step + O
    out = np.zeros((H, W, C), np.float32)

    def patches(idx):
        return np.stack([srcs[cands[i, 0]][cands[i, 1]:cands[i, 1] + B, cands[i, 2]:cands[i, 2] + B] for i in idx])

    for gy in range(ny):
        for gx in range(nx):
            y0, x0 = gy * step, gx * step
            idx = rng.choice(len(cands), n_cand, replace=False)
            P = patches(idx)
            cost = np.zeros(n_cand, np.float32)
            tgt = out[y0:y0 + B, x0:x0 + B]
            if gx > 0:
                cost += ((P[:, :, :O] - tgt[None, :, :O]) ** 2).sum((1, 2, 3))
            if gy > 0:
                cost += ((P[:, :O, :] - tgt[None, :O, :]) ** 2).sum((1, 2, 3))
            if gx > 0 and gy > 0:
                cost -= ((P[:, :O, :O] - tgt[None, :O, :O]) ** 2).sum((1, 2, 3))
            pen = np.array([use_of(i)[0] for i in idx], np.float32)
            cost = cost * (1 + reuse * pen) + (pen * 1e-3 if gx == 0 and gy == 0 else 0)
            ok = np.where(cost <= cost.min() * (1 + tol) + 1e-6)[0]
            pick = rng.choice(ok)
            p = P[pick]
            _, (usi, uy, ux) = use_of(idx[pick])
            r_ = B // 2
            used[usi][max(0, uy + B // 2 - r_):uy + B // 2 + r_, max(0, ux + B // 2 - r_):ux + B // 2 + r_] += 1
            mask = np.ones((B, B), bool)
            if gx > 0:
                e = ((p[:, :O] - tgt[:, :O]) ** 2).sum(2)  # B x O, vertical seam
                mask[:, :O] &= seam_mask(e)
            if gy > 0:
                e = ((p[:O, :] - tgt[:O, :]) ** 2).sum(2).T  # B x O, horizontal seam
                mask[:O, :] &= seam_mask(e).T
            m = ndi.gaussian_filter(mask.astype(np.float32), 1.0)
            if gx == 0 and gy == 0:
                m[:] = 1
            out[y0:y0 + B, x0:x0 + B] = tgt * (1 - m[..., None]) + p * m[..., None]
    return out[:out_h, :out_w]


def seam_mask(e):
    """e: rows x O error. Min-cost vertical path; True right of the path (take the new patch)."""
    r, o = e.shape
    cost = e.copy()
    for i in range(1, r):
        prev = cost[i - 1]
        left = np.r_[np.inf, prev[:-1]]
        right = np.r_[prev[1:], np.inf]
        cost[i] += np.minimum(np.minimum(left, prev), right)
    path = np.zeros(r, int)
    path[-1] = int(np.argmin(cost[-1]))
    for i in range(r - 2, -1, -1):
        j = path[i + 1]
        lo, hi = max(0, j - 1), min(o, j + 2)
        path[i] = lo + int(np.argmin(cost[i, lo:hi]))
    cols = np.arange(o)[None, :]
    return cols >= path[:, None]


def save_jpg(a, name, q=92):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT + name, quality=q)


def save_png(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT + name, optimize=True)


def cutout(a, poly, pins, s):
    """RGBA of a sheet: the quadrilateral poly (frame px, measured edges) plus the pin heads (cx, cy, r) that stand
    over its top edge; bounding box of the lot, edge softened by ~1 px."""
    from PIL import ImageDraw
    xs = [p[0] for p in poly] + [c[0] - c[2] for c in pins] + [c[0] + c[2] for c in pins]
    ys = [p[1] for p in poly] + [c[1] - c[2] for c in pins] + [c[1] + c[2] for c in pins]
    x0, y0 = max(0, int(min(xs)) - 4), max(0, int(min(ys)) - 4)
    x1, y1 = min(a.shape[1], int(max(xs)) + 4), min(a.shape[0], int(max(ys)) + 4)
    m = Image.new("L", (x1 - x0, y1 - y0), 0)
    d = ImageDraw.Draw(m)
    d.polygon([(px - x0, py - y0) for px, py in poly], fill=255)
    for cx, cy, r in pins:
        d.ellipse([cx - r - x0, cy - r - y0, cx + r - x0, cy + r - y0], fill=255)
    alpha = ndi.gaussian_filter(np.asarray(m).astype(np.float32), 1.5)
    return resize(np.dstack([a[y0:y1, x0:x1], alpha]), s)


# ---------------------------------------------------------------- QuoteCard: quoteCard_seqf1171.png
SQ = 0.5
q = load("quoteCard_seqf1171.png")
Image.fromarray(q[0:300, 760:3100].astype(np.uint8)).save(SRC + "qc_f1171_corkTop.png")
cork_srcs = [q[0:275, 790:3080], q[1850:2160, 790:3090], q[330:1740, 778:888], q[330:1740, 2968:3085]]
cork_srcs = [resize(flatten(c, 140, 62.0), SQ) for c in cork_srcs]
qc_cork = quilt(cork_srcs, 2400, 1440, B=104, O=26)
save_jpg(qc_cork, "qc_cork.jpg")

# card paper: the blank card minus the pin + shadow box
card = q[325:1735, 912:2938]
card_flat = flatten(card, 300, float(np.median(card)))
# the pin + its shadow sit in x 1720..2060, y 240..600 of the frame = card x 808..1148, y 0..275
paper_srcs = [card_flat[:, :800], card_flat[290:, :], card_flat[:, 1160:]]
paper_srcs = [resize(p, SQ) for p in paper_srcs]
save_jpg(quilt(paper_srcs, 820, 1100, B=80, O=20), "qc_paper.jpg", 94)
print("qc paper median", float(np.median(card)))

# pin: ellipse mask around the head; shadow from the paper ratio
px0, py0, px1, py1 = 1720, 240, 2060, 600
pc = q[py0:py1, px0:px1]
yy, xx = np.mgrid[py0:py1, px0:px1]
head = ((xx - 1931) / 66.0) ** 2 + ((yy - 345) / 68.0) ** 2 <= 1
head_a = ndi.gaussian_filter(head.astype(np.float32), 1.5)
save_png(resize(np.dstack([pc, head_a * 255]), SQ), "qc_pin.png")
level = float(np.median(q[600:900, 1500:1700]))
ratio = ndi.gaussian_filter(pc.mean(2), 6) / level
sh = np.clip(1 - ratio, 0, 1)
sh[yy < 318] = 0  # above the card edge = cork, not shadow
sh *= 1 - ndi.gaussian_filter(head.astype(np.float32), 4)  # under the head: the head covers it
sh = np.clip((sh - 0.03) / 0.97, 0, 1)
save_png(resize(np.dstack([np.zeros_like(pc), sh * 255]), SQ), "qc_pinshadow.png")
print("qc pin level", level, "max shadow", float(sh.max()))

# typed side sheets
# edges measured by max gradient: left sheet top (150,181)-(700,170), right (768,400)-(775,1900), bottom
# (150,2038)-(700,2032); right sheet left (3088,400)-(3102,1900), top y 188, bottom y 2037. The frame cuts both.
save_png(cutout(q, [(0, 184), (767, 169), (776, 2031), (0, 2040)], [(518, 225, 57)], SQ), "qc_sheetL.png")
save_png(cutout(q, [(3086, 188), (3840, 187), (3840, 2035), (3103, 2039)], [(3170, 250, 60)], SQ), "qc_sheetR.png")

# ---------------------------------------------------------------- ResignForm: resignForm_seqf1560.png
SR = 0.42
r = load("resignForm_seqf1560.png")
Image.fromarray(r[0:180, 300:3700].astype(np.uint8)).save(SRC + "rf_f1560_corkTop.png")
r2 = load("resignForm_seqf1520.png")
r3 = load("resignForm_seqf1492.png")  # the opening frame, still dark from the show's fade: flatten() evens it out
rc = [r[0:150, 330:3420], r2[0:205, 330:3640], r2[1965:2040, 1650:3330], r3[0:240, 380:2900]]
rc_mean = float(np.mean([c.mean() for c in rc]))
rc = [resize(flatten(c, 120, rc_mean), SR) for c in rc]
save_jpg(quilt(rc, 2400, 1440, B=48, O=14, min_detail=0.45), "rf_cork.jpg")
print("rf cork mean", rc_mean)

paper = r[1240:1900, 460:3380]
pmed = np.median(paper.reshape(-1, 3), 0)
paper_f = flatten(paper, 300, float(pmed.mean()))
save_jpg(quilt([resize(paper_f, SR)], 1060, 1100, B=80, O=20), "rf_paper.jpg", 94)
print("rf paper median rgb", pmed)

# pin (right corner of the form)
rx0, ry0, rx1, ry1 = 3230, 140, 3450, 360
rp = r[ry0:ry1, rx0:rx1]
yy, xx = np.mgrid[ry0:ry1, rx0:rx1]
hd = ((xx - 3333) / 62.0) ** 2 + ((yy - 230) / 61.0) ** 2 <= 1
save_png(resize(np.dstack([rp, ndi.gaussian_filter(hd.astype(np.float32), 1.5) * 255]), SR), "rf_pin.png")
print("done")
