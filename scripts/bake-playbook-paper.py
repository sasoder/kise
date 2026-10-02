#!/usr/bin/env python3
"""
Bake the GoToTheTop playbook sheet: public/playbook/playbook-sheet.png (V2,
"really old" paper, after the director's review of V1).

Paper source (public domain): a blank leaf of the John Carter Brown Library
copy of Theodor de Bry, *Americae pars sexta* (Frankfurt 1596), the book the
clip's engravings come from, scanned by the Internet Archive, identifier
`americaeparssext00benz_0`, leaf n178 (the fibriest of the blank leaves
n177/n178/n179; n179's foot carries the verso's text set off onto it, so its
"stain" would bring ghost text and is not used; the water stain here is built
from the paper's own tone instead).

Tone and age are matched to the references the user liked (the de Bry plates
and Guaman Poma's pages): a deep, warm, uneven tea-brown that darkens toward
the edges, foxing, a soft water stain with a tide line at the foot, a worn,
darker, ragged rim with nicks, the real fibres kept and sharpened, a faint
fold. Everything is multiplicative on the real scan, so it stays
photographic.

What the bake does (numpy + PIL only; one raster, nothing per frame):
  1. Crops the leaf to paper only (no gilt fore-edge, no gutter, no cut
     edges) at the sheet's aspect, 820 x 1160, 1 texel per on-screen px.
  2. Flattens the scanner's lighting (degree-3 polynomial surface per channel,
     outliers rejected) and boosts the fibres' local contrast (high-pass
     ratio below ~5 px raised to the power FIBRE_BOOST).
  3. Ages it: uneven toning (three octaves), broad edge toning, a dark worn
     rim, an oxidised edge line, foxing (spots + a few diffuse blooms), a
     water stain rising from the foot on the right (darker interior, a sharp
     tide line, a fainter second line), handling grime at the lower corners,
     one centre fold, one dog-ear crease.
  4. Cuts a worn, ragged edge: fine-grained alpha (Catmull-Rom edge noise at
     120/30/8/3 px), a dozen small nicks, worn corners, one chipped corner,
     a translucent fibrous outermost pixel. Never a zig-zag.
  5. Adds a soft, low contact shadow (black, alpha <= ~0.26, offset 2/6 px)
     inside a 36 px transparent pad: the PNG is 892 x 1232 and the paper sits
     at (36, 36)-(856, 1196).

Usage:
  python3 scripts/bake-playbook-paper.py <debry1596_blank_0178.jpg> [out.png]
"""

import os
import sys

import numpy as np
from PIL import Image, ImageFilter

W, H, PAD = 820, 1160, 36
TW, TH = W + 2 * PAD, H + 2 * PAD
# Leaf n178 (3348 x 5096 scan): gilt fore-edge on the left (x < ~290), the
# gutter darkening on the right (x > ~3200). Paper only, at 820 / 1160.
CROP = (330, 450, 3200, 4510)
SEED = 1596
FIBRE_BOOST = 1.9
BASE = np.array([214.0, 188.0, 138.0])  # the sheet's centre tone (tea-brown cream)
WARM = np.array([0.58, 0.9, 1.28])  # how age darkens R, G, B (blue most)


def smooth2d(h, w, scale, rng):
    """Unit-variance smooth noise field (bicubic-upsampled random grid)."""
    s = max(1, int(scale))
    gh, gw = h // s + 4, w // s + 4
    g = rng.standard_normal((gh, gw)).astype(np.float32)
    im = Image.fromarray(g).resize((gw * s, gh * s), Image.BICUBIC)
    a = np.asarray(im)[s : s + h, s : s + w].astype(np.float64)
    return (a - a.mean()) / (a.std() + 1e-9)


def noise1d(n, scale, rng):
    """Smooth 1D noise in about [-1, 1]: Catmull-Rom through random knots."""
    k = int(np.ceil(n / scale)) + 4
    v = rng.uniform(-1.0, 1.0, k)
    t = np.arange(n) / scale + 1.0
    i = np.floor(t).astype(int)
    f = t - i
    p0, p1, p2, p3 = v[i - 1], v[i], v[i + 1], v[i + 2]
    return 0.5 * (
        2 * p1
        + (-p0 + p2) * f
        + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f
        + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3
    )


def edge_inset(n, rng, nicks):
    """Inset of one paper edge (px) along its length: worn and ragged."""
    e = (
        2.2
        + 1.3 * noise1d(n, 120, rng)
        + 0.8 * noise1d(n, 30, rng)
        + 0.5 * noise1d(n, 8, rng)
        + 0.28 * noise1d(n, 3, rng)
    )
    t = np.arange(n)
    for c, depth, width in nicks:
        e = e + depth * np.exp(-(((t - c) / width) ** 2))
    return np.maximum(e, 0.3)


def gblur(a, sigma):
    """Separable Gaussian blur in float (reflect-padded), any trailing channels."""
    r = int(3 * sigma + 0.5)
    x = np.arange(-r, r + 1)
    k = np.exp(-x * x / (2 * sigma * sigma))
    k /= k.sum()

    def conv1(arr, axis):
        pad = [(0, 0)] * arr.ndim
        pad[axis] = (r, r)
        p = np.pad(arr, pad, mode="reflect")
        out = np.zeros_like(arr)
        for i, kv in enumerate(k):
            sl = [slice(None)] * arr.ndim
            sl[axis] = slice(i, i + arr.shape[axis])
            out += kv * p[tuple(sl)]
        return out

    return conv1(conv1(a, 0), 1)


def poly_flatten(img):
    """Divide out the scan's lighting: degree-3 surface per channel."""
    h, w, _ = img.shape
    bs = 10
    small = img[: h - h % bs, : w - w % bs].reshape(h // bs, bs, w // bs, bs, 3).mean(axis=(1, 3))
    gy, gx = np.mgrid[0 : small.shape[0], 0 : small.shape[1]]
    u = (gx + 0.5) * bs / w * 2 - 1
    v = (gy + 0.5) * bs / h * 2 - 1
    terms = [(i, j) for i in range(4) for j in range(4) if i + j <= 3]

    def basis(uu, vv):
        return np.stack([uu ** i * vv ** j for i, j in terms], axis=-1)

    A = basis(u.ravel(), v.ravel())
    yy, xx = np.mgrid[0:h, 0:w]
    full = basis((xx + 0.5) / w * 2 - 1, (yy + 0.5) / h * 2 - 1)
    out = np.empty_like(img)
    for c in range(3):
        b = small[..., c].ravel()
        keep = np.ones_like(b, dtype=bool)
        for _ in range(3):
            coef, *_ = np.linalg.lstsq(A[keep], b[keep], rcond=None)
            r = b - A @ coef
            keep = np.abs(r) < 2.5 * r[keep].std()
        out[..., c] = img[..., c] / (full @ coef)
    return out


def main():
    np.seterr(all="ignore")  # numpy + Accelerate raise spurious matmul FP flags
    src = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else "public/playbook/playbook-sheet.png"
    rng = np.random.default_rng(SEED)

    leaf = Image.open(src).convert("RGB").crop(CROP).resize((W, H), Image.LANCZOS)
    raw = np.asarray(leaf).astype(np.float64)
    flat = poly_flatten(raw)
    # Fibres: raise the high-pass ratio (detail under ~5 px) to FIBRE_BOOST.
    lo = gblur(flat, 5)
    flat = lo * (flat / np.maximum(lo, 1e-3)) ** FIBRE_BOOST

    # ---- the worn edge (signed distance d, px, > 0 inside) ---------------
    eT = edge_inset(W, rng, [(120, 3.2, 5), (330, 4.5, 7), (560, 2.6, 4), (742, 3.8, 6)])
    eB = edge_inset(W, rng, [(95, 3.6, 6), (300, 5.2, 8), (505, 2.8, 4), (660, 4.2, 6)])
    eL = edge_inset(H, rng, [(210, 3.0, 5), (H // 2, 3.4, 5), (705, 4.6, 7), (1010, 2.8, 4)])
    eR = edge_inset(H, rng, [(160, 4.0, 6), (430, 2.8, 5), (H // 2, 3.0, 5), (845, 5.0, 8)])

    yy, xx = np.mgrid[0:TH, 0:TW]
    X = xx - PAD + 0.5
    Y = yy - PAD + 0.5
    Xi = np.clip(np.round(X).astype(int), 0, W - 1)
    Yi = np.clip(np.round(Y).astype(int), 0, H - 1)
    dl = X - eL[Yi]
    dr = (W - eR[Yi]) - X
    dt = Y - eT[Xi]
    db = (H - eB[Xi]) - Y
    d = np.minimum(np.minimum(dl, dr), np.minimum(dt, db))
    # Worn corners (TL, TR, BR, BL) and one chipped corner (TR: a cut-off bite).
    for r, a, b in ((9.0, dl, dt), (7.0, dr, dt), (13.0, dr, db), (10.0, dl, db)):
        m = (a < r) & (b < r)
        dc = r - np.sqrt((r - np.minimum(a, r)) ** 2 + (r - np.minimum(b, r)) ** 2)
        d = np.where(m, np.minimum(d, dc), d)
    chip = (dr + dt - 15.0) / np.sqrt(2)
    d = np.minimum(d, chip + 0.7 * noise1d(TW, 4, rng)[None, :])
    alpha = np.clip(d + 0.5, 0.0, 1.0)
    fib = smooth2d(TH, TW, 2, rng)
    alpha = alpha * (1 - 0.22 * np.exp(-np.maximum(d, 0) / 1.2) * (0.55 + 0.45 * np.clip(fib, -1, 1)))
    dd = np.maximum(d, 0.0)

    # ---- age fields (on the padded canvas; + = darker) -------------------
    m1 = np.clip(smooth2d(TH, TW, 60, rng), -1.6, 1.6)
    m2 = np.clip(smooth2d(TH, TW, 170, rng), -1.6, 1.6)
    n_a = smooth2d(TH, TW, 230, rng)
    n_b = smooth2d(TH, TW, 90, rng)
    n_c = smooth2d(TH, TW, 32, rng)

    tone = 0.05 * n_a + 0.018 * n_b + 0.011 * n_c  # uneven tea toning (large-scale first)
    broad = 0.21 * (1 + 0.45 * m2) * np.exp(-dd / 80.0)  # darker toward the edges
    rim = 0.21 * (1 + 0.5 * m1) * np.exp(-dd / 9.0)  # the worn, browned rim
    edge_line = 0.11 * np.exp(-dd / 1.6)  # oxidised edge (aged, not singed)
    dark = (tone + broad)[..., None] * WARM + rim[..., None] * np.array([0.7, 0.95, 1.15])
    dark = dark + edge_line[..., None] * np.array([0.85, 1.0, 1.1])

    # Handling grime at the lower corners (thumbs), a little grey.
    for cx, cy in ((0, H), (W, H)):
        rr = np.hypot(X - cx, Y - cy)
        dark = dark + (0.07 * np.exp(-rr / 120.0))[..., None] * np.array([0.95, 1.0, 1.06])

    # Water stain from the foot, right side: a darker interior, a sharp tide
    # line where it dried, a fainter second line inside it.
    xs = np.arange(TW) - PAD
    rise = 150 + 46 * noise1d(TW, 230, rng) + 16 * noise1d(TW, 55, rng) + 5 * noise1d(TW, 14, rng)
    fade_in = np.clip((xs - 250) / 170.0, 0, 1)  # spares the lower-left (the X)
    rise = rise * (fade_in ** 0.8)
    tide_y = H - rise
    s = Y - tide_y[None, :]  # > 0 inside the stain
    inside = np.clip(s / 18.0, 0, 1) * (rise[None, :] > 4)
    tide = np.where(s >= 0, np.exp(-s / 2.6), np.exp(s / 0.9)) * (rise[None, :] > 4)
    s2 = s - (26 + 8 * noise1d(TW, 80, rng))[None, :]
    tide2 = np.where(s2 >= 0, np.exp(-s2 / 3.5), np.exp(s2 / 1.2)) * (rise[None, :] > 30)
    kt = (0.75 + 0.25 * noise1d(TW, 40, rng))[None, :]
    stain = 0.075 * inside + kt * (0.17 * tide + 0.07 * tide2)
    dark = dark + stain[..., None] * np.array([0.5, 0.92, 1.35])

    # Foxing: rust spots (cores with halos) and a few soft blooms.
    fox = np.zeros((TH, TW))
    spots = [
        # margins
        (58, 96, 2.8, 0.42), (71, 106, 1.5, 0.34), (49, 121, 1.2, 0.3), (40, 160, 1.0, 0.26),
        (772, 470, 2.4, 0.4), (783, 490, 1.4, 0.3), (765, 505, 1.0, 0.24),
        (706, 1092, 3.2, 0.44), (723, 1080, 1.7, 0.34), (690, 1110, 1.3, 0.28),
        (612, 74, 1.9, 0.34), (238, 132, 1.4, 0.3), (36, 640, 1.8, 0.32), (300, 1118, 2.1, 0.36),
        (790, 760, 1.6, 0.3), (802, 300, 1.2, 0.26), (25, 900, 1.5, 0.3), (420, 1132, 1.3, 0.26),
        (150, 40, 1.1, 0.24), (520, 30, 1.6, 0.3),
        # a few in the field, clear of the drawing
        (300, 300, 1.2, 0.24), (660, 260, 1.5, 0.28), (690, 820, 1.1, 0.22), (240, 1040, 1.3, 0.24),
        (120, 380, 1.0, 0.2), (560, 1010, 1.2, 0.22), (760, 980, 1.8, 0.3),
    ]
    for sx, sy, sr, st in spots:
        cx, cy = sx + PAD, sy + PAD
        x0, x1 = int(cx - 10 * sr) - 2, int(cx + 10 * sr) + 3
        y0, y1 = int(cy - 10 * sr) - 2, int(cy + 10 * sr) + 3
        sub_y, sub_x = np.mgrid[y0:y1, x0:x1]
        blob = np.zeros(sub_x.shape)
        for _ in range(5):
            ox, oy = rng.normal(0, 0.5 * sr, 2)
            rr = sr * rng.uniform(0.5, 1.0)
            dist = np.hypot(sub_x - cx - ox, sub_y - cy - oy)
            blob = np.maximum(blob, np.exp(-((dist / rr) ** 2.2)))
        halo = 0.3 * np.exp(-((np.hypot(sub_x - cx, sub_y - cy) / (3.2 * sr)) ** 2))
        fox[y0:y1, x0:x1] = np.maximum(fox[y0:y1, x0:x1], 1.2 * st * np.maximum(blob, halo))
    for bx, by, br, bs in ((150, 200, 16, 0.07), (700, 640, 22, 0.06), (420, 70, 14, 0.06),
                           (90, 760, 12, 0.06), (610, 1120, 18, 0.07)):
        rr = np.hypot(X - bx, Y - by)
        fox = fox + bs * np.exp(-((rr / br) ** 2)) * (0.75 + 0.25 * np.clip(n_c, -1, 1))
    dark = dark + fox[..., None] * np.array([0.45, 0.85, 1.22])

    # One faint centre fold (dirt in the crease) and a dog-ear crease.
    yf = H / 2 + 2.0 * noise1d(TW, 260, rng)
    kf = 0.75 + 0.25 * noise1d(TW, 90, rng)
    dyf = Y - yf[None, :]
    fold = kf[None, :] * (
        0.05 * np.exp(-((dyf / 1.1) ** 2))
        - 0.02 * np.exp(-(((dyf - 2.6) / 1.6) ** 2))
        + 0.03 * np.exp(-(((dyf + 9.0) / 9.0) ** 2))
        + 0.015 * np.exp(-((dyf / 14.0) ** 2))
    )
    dark = dark + fold[..., None] * np.array([0.85, 0.95, 1.1])
    ax, ay, bx, by = W - 66.0, H + 0.0, W + 0.0, H - 54.0
    ux, uy = bx - ax, by - ay
    ul = np.hypot(ux, uy)
    ux, uy = ux / ul, uy / ul
    nx, ny = -uy, ux
    along = (X - ax) * ux + (Y - ay) * uy
    across = (X - ax) * nx + (Y - ay) * ny
    fade = np.clip(np.sin(np.clip(along / ul, 0, 1) * np.pi) * 1.6, 0, 1)
    crease = fade * (0.05 * np.exp(-((across / 0.9) ** 2)) - 0.018 * np.exp(-(((across - 2.0) / 1.3) ** 2)))
    corner = 0.05 * np.clip(across / 6.0, 0, 1)
    dark = dark + (crease + corner)[..., None] * WARM

    # ---- colour ---------------------------------------------------------------
    tex = np.pad(flat, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge")
    rgb = BASE[None, None, :] * tex * np.clip(1.0 - dark, 0.05, 1.2)
    rgb = np.clip(rgb, 0, 255)

    # ---- contact shadow + composite -------------------------------------------
    a_img = Image.fromarray(np.clip(alpha * 255, 0, 255).astype(np.uint8))
    sh = np.asarray(a_img.filter(ImageFilter.GaussianBlur(7))).astype(np.float64) / 255
    sh = np.roll(np.roll(sh, 6, axis=0), 2, axis=1) * 0.26
    out_a = alpha + sh * (1 - alpha)
    safe = np.where(out_a > 0, out_a, 1)
    out_rgb = rgb * (alpha / safe)[..., None]
    out = np.dstack([out_rgb, out_a * 255])
    out = np.clip(np.round(out), 0, 255).astype(np.uint8)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    Image.fromarray(out).save(out_path, optimize=True)
    inner = rgb[PAD + 300 : PAD + 860, PAD + 200 : PAD + 620].reshape(-1, 3).mean(axis=0)
    rimc = rgb[PAD + 400 : PAD + 700, PAD + 3 : PAD + 12].reshape(-1, 3).mean(axis=0)
    print(f"wrote {out_path} {TW}x{TH}; centre paper {inner.round(1)}; left rim {rimc.round(1)}")


if __name__ == "__main__":
    main()
