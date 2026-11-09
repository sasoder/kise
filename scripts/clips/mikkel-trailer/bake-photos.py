#!/usr/bin/env python3
"""EighteenHundredCloser (mikkel-trailer): the photo cut-outs, greyscale + alpha, into public/mikkel-trailer/.

  earth    a full-disc Earth photo on black -> earth_disc.png (square, disc centred, radius printed)
  key      an object on a smooth background (sky, space, studio white) -> <out>.png: the background is modelled as a
           smooth 2D quadratic per channel fitted to the border, every pixel's distance from it gives a soft key, only
           the part connected to the frame edge is removed, holes inside the object are kept, the largest blobs stay,
           and edge pixels take the colour of the nearest solid pixel (no sky fringe).

  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-photos.py earth <src> <out>
  uv run --with numpy --with pillow --with scipy python3 scripts/clips/mikkel-trailer/bake-photos.py key <src> <out> \
      [--lo 18] [--hi 40] [--crop x0,y0,x1,y1] [--keep 1] [--rot deg] [--flip] [--max 2400] [--close px]
Inputs are the image sub-agent's local files (animation_source/assets/), copied to assets-src/mikkel-trailer/ first.
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ni


def load(src, crop=None, rot=0.0, flip=False, maxw=2400):
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop(crop)
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True, fillcolor=None)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    return np.asarray(im).astype(np.float32)


def grey(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def save_rgba(path, g, alpha, margin=8):
    ys, xs = np.where(alpha > 0.02)
    y0, y1 = max(ys.min() - margin, 0), min(ys.max() + margin, g.shape[0] - 1)
    x0, x1 = max(xs.min() - margin, 0), min(xs.max() + margin, g.shape[1] - 1)
    g = g[y0 : y1 + 1, x0 : x1 + 1]
    alpha = alpha[y0 : y1 + 1, x0 : x1 + 1]
    out = np.dstack([g, g, g, alpha * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path, optimize=True)
    print(path, out.shape[1], out.shape[0], f"aspect {out.shape[1] / out.shape[0]:.4f}")


def earth(src, out):
    a = load(src, maxw=4000)
    g = grey(a)
    m = g > 18
    lab, n = ni.label(m)
    big = np.argmax(ni.sum(m, lab, range(1, n + 1))) + 1
    m = ni.binary_fill_holes(lab == big)
    area = m.sum()
    cy, cx = ni.center_of_mass(m)
    r = np.sqrt(area / np.pi) - 3  # inset past the dark limb ring
    yy, xx = np.mgrid[0 : g.shape[0], 0 : g.shape[1]]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    alpha = np.clip(r - d + 0.5, 0, 1)
    size = int(np.ceil(2 * r)) + 8
    x0, y0 = int(round(cx - size / 2)), int(round(cy - size / 2))
    pad = max(0, -x0, -y0, x0 + size - g.shape[1], y0 + size - g.shape[0])
    gp = np.pad(g, pad)
    ap = np.pad(alpha, pad)
    g2 = gp[y0 + pad : y0 + pad + size, x0 + pad : x0 + pad + size]
    a2 = ap[y0 + pad : y0 + pad + size, x0 + pad : x0 + pad + size]
    o = np.dstack([g2, g2, g2, a2 * 255]).clip(0, 255).round().astype(np.uint8)
    Image.fromarray(o, "RGBA").save(out, optimize=True)
    print(out, f"size {size} r {r:.1f} (centre {size / 2:.1f})")


def key(src, out, lo, hi, crop, keep, rot, flip, maxw, close=0, seed_border=6):
    a = load(src, crop, rot, flip, maxw)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    X = (xx / W - 0.5).ravel()
    Y = (yy / H - 0.5).ravel()
    basis = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y], 1)
    sky = np.zeros((H, W), bool)
    b = seed_border
    sky[:b], sky[-b:], sky[:, :b], sky[:, -b:] = True, True, True, True
    for it in range(4):
        idx = np.flatnonzero(sky.ravel())
        if len(idx) > 200000:
            idx = idx[:: len(idx) // 200000 + 1]
        model = np.zeros_like(a)
        for c in range(3):
            coef, *_ = np.linalg.lstsq(basis[idx], a[..., c].ravel()[idx], rcond=None)
            model[..., c] = (basis @ coef).reshape(H, W)
        dist = np.sqrt(((a - model) ** 2).sum(-1))
        cand = dist < lo
        lab, _ = ni.label(cand)
        border = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])
        sky = np.isin(lab, border[border > 0])
    print("background model residual p50/p95 on bg:", np.percentile(dist[sky], 50), np.percentile(dist[sky], 95))
    obj = ~sky
    lab, n = ni.label(obj)
    sizes = ni.sum(obj, lab, range(1, n + 1))
    order = np.argsort(sizes)[::-1][:keep]
    obj = np.isin(lab, order + 1)
    if close > 0:
        yy_, xx_ = np.mgrid[-close : close + 1, -close : close + 1]
        disk = xx_ * xx_ + yy_ * yy_ <= close * close
        obj = ni.binary_closing(np.pad(obj, close + 2), structure=disk)[close + 2 : -close - 2, close + 2 : -close - 2]
        obj = ni.binary_opening(obj, iterations=2)
    obj = ni.binary_fill_holes(obj)
    # soft edge: inside a 3 px band around the outline the key follows the distance
    soft = np.clip((dist - lo) / (hi - lo), 0, 1)
    band = ni.binary_dilation(obj, iterations=2) & ~ni.binary_erosion(obj, iterations=2)
    alpha = obj.astype(np.float32)
    alpha[band] = np.maximum(soft[band], ni.binary_erosion(obj, iterations=2)[band])
    alpha = ni.gaussian_filter(alpha, 0.6)
    # decontaminate: colour of the nearest solid pixel under the edge
    solid = alpha > 0.97
    _, (iy, ix) = ni.distance_transform_edt(~solid, return_indices=True)
    g = grey(a)
    g = np.where(solid, g, g[iy, ix])
    if out is None:
        return a, g, alpha
    save_rgba(out, g, alpha)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode")
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--lo", type=float, default=18)
    ap.add_argument("--hi", type=float, default=40)
    ap.add_argument("--crop", type=str, default=None)
    ap.add_argument("--keep", type=int, default=1)
    ap.add_argument("--rot", type=float, default=0)
    ap.add_argument("--flip", action="store_true")
    ap.add_argument("--max", type=int, default=2400)
    ap.add_argument("--close", type=int, default=0)
    o = ap.parse_args()
    crop = tuple(int(v) for v in o.crop.split(",")) if o.crop else None
    if o.mode == "earth":
        earth(o.src, o.out)
    else:
        key(o.src, o.out, o.lo, o.hi, crop, o.keep, o.rot, o.flip, o.max, o.close)
