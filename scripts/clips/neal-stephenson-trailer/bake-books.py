"""Bake Neal Stephenson's seven books (cut 45 TonsOfTVShows, booksWorld.tsx) as slim 2.5D hardcovers.

Each book = the real first-edition jacket front (refs/books/) as the front face, plus a visible thickness on the side
the book is seen from (the side that trails its flight to the row): books left of centre show their fore-edge (page
block) on the right, books right of centre their spine (the jacket wrapped round, darker) on the left, the centre book
only its tail. Every book also shows its tail (the page block's bottom) a little: the row hangs above the eye line.
The thickness is proportional to the page count (ASSETS_READY.md). Output: RGBA PNGs in
public/neal-stephenson-trailer/books/ and a JSON line per book (png size, cover box inside the png) for booksWorld.

Run (downloaded covers are data): /usr/bin/python3 -I scripts/clips/neal-stephenson-trailer/bake-books.py <refs/books dir>
"""
import json
import os
import sys

try:
    from PIL import Image
except ImportError:  # -I drops the user site, where Pillow lives on this Mac
    sys.path.append(os.path.expanduser("~/Library/Python/3.9/lib/python/site-packages"))
    from PIL import Image
import numpy as np

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "../../../public/neal-stephenson-trailer/books")
os.makedirs(OUT, exist_ok=True)

COVER_H = 312  # rest px (booksWorld's cover height)
BAKE = 720 / COVER_H  # bake px per rest px
SS = 2  # supersample for clean polygon edges
# visible side = SIDE_K x the book's real thickness; Anathem (937 pp, 2.03 in on 9.12 in) is the reference
REF_PAGES = 937
REF_THICK = 2.03 / 9.12 * COVER_H  # rest px
SIDE_K = 0.3
TAIL_K = 0.35  # the tail's drop per unit of side width

# RED_FILTER: jackets whose title is a warm colour on a cool or dark ground lose it in the clip's near-monochrome
# grade (orange on sea blue, red on grey-brown). They are baked as a red-filter black-and-white (as an orthochromatic
# photo through a red filter): luminance mostly from the red channel, so the title reads light; the grade then keeps it.
RED_FILTER = {"diamond-age": (0.75, 0.25, 0.0), "termination-shock": (0.85, 0.15, 0.0)}

BOOKS = [
    ("snow-crash", "1992_Snow_Crash.jpg", 470, "right"),
    ("diamond-age", "1995_The_Diamond_Age.jpg", 455, "right"),
    ("cryptonomicon", "1999_Cryptonomicon.jpg", 918, "right"),
    ("quicksilver", "2003_Quicksilver.jpg", 927, "tail"),
    ("anathem", "2008_Anathem.jpg", 937, "left"),
    ("seveneves", "2015_Seveneves.jpg", 880, "left"),
    ("termination-shock", "2021_Termination_Shock.jpg", 720, "left"),
]

rng = np.random.default_rng(7)


def pages_texture(w, h, along_x):
    """Page block: warm off-white with fine page lines running along the edge (x lines if along_x)."""
    base = np.array([226, 220, 205], np.float32)
    n = h if along_x else w
    lines = 1 - 0.07 * (rng.random(n) ** 3) - 0.025 * np.sin(np.arange(n) * 2.1)
    t = np.ones((h, w, 3), np.float32) * base
    t *= (lines[:, None, None] if along_x else lines[None, :, None])
    return t


for i, (slug, fn, pages, side) in enumerate(BOOKS):
    cov = Image.open(os.path.join(SRC, fn)).convert("RGB")
    if slug in RED_FILTER:
        wr, wg, wb = RED_FILTER[slug]
        c = np.asarray(cov).astype(np.float32)
        lum = np.clip(c[..., 0] * wr + c[..., 1] * wg + c[..., 2] * wb, 0, 255)
        cov = Image.fromarray(np.repeat(lum[..., None], 3, axis=2).astype(np.uint8))
    aspect = cov.size[0] / cov.size[1]
    ch = round(COVER_H * BAKE) * SS
    cw = round(COVER_H * aspect * BAKE) * SS
    s_rest = SIDE_K * REF_THICK * pages / REF_PAGES
    s = round(s_rest * BAKE) * SS  # side width (bake px)
    a = round(TAIL_K * s) if side != "tail" else round(0.5 * s)  # tail drop
    sx = s if side != "tail" else 0
    W_, H_ = cw + sx, ch + a
    img = np.zeros((H_, W_, 4), np.float32)
    cx0 = sx if side == "left" else 0  # the cover's left edge inside the png
    coverArr = np.asarray(cov.resize((cw, ch), Image.LANCZOS)).astype(np.float32)

    # the tail (bottom face): each row j shifted sideways by (sx/a)*j, page lines along x, in shade
    tail = pages_texture(cw, a, True) * 0.78 if a > 0 else None
    for j in range(a):
        off = (sx * j / a) if side != "left" else -(sx * j / a)
        x0 = cx0 + off
        xi = int(np.floor(x0))
        fr = x0 - xi
        row = np.zeros((W_ + 2, 4), np.float32)
        seg = np.concatenate([tail[j], np.full((cw, 1), 255.0)], axis=1)
        lo = max(0, xi)
        hi = min(W_, xi + cw)
        row[lo:hi] += seg[lo - xi : hi - xi] * (1 - fr)
        row[lo + 1 : hi + 1] += seg[lo - xi : hi - xi] * fr
        img[ch + j, :, :] = row[:W_]

    # the side face: each column i shifted down by (a/sx)*i
    if sx > 0:
        if side == "right":
            tex = pages_texture(sx, ch, False)
            tex[:, : 2 * SS] *= 0.55  # the front board's edge
            tex[:, -3 * SS :] *= 0.5  # the back board
        else:  # the spine: the jacket's left strip stretched, darker (turned away from the light)
            # one column: the mean of the jacket's left 3 %, smoothed down its length (no stray letters)
            strip = np.asarray(cov.crop((0, 0, max(2, round(cov.size[0] * 0.03)), cov.size[1]))).astype(np.float32)
            colm = strip.mean(axis=1)
            colm = np.asarray(Image.fromarray(colm.astype(np.uint8)[:, None, :].repeat(4, 1)).resize((4, ch), Image.LANCZOS)).astype(np.float32)[:, :1]
            kern = np.exp(-0.5 * (np.arange(-60, 61) / 20.0) ** 2)
            kern /= kern.sum()
            colm = np.stack([np.convolve(np.pad(colm[:, 0, c], 60, mode="edge"), kern, mode="valid") for c in range(3)], axis=1)
            tex = np.repeat(colm[:, None, :], sx, axis=1) * 0.62
            tex *= np.linspace(0.85, 1.0, sx)[None, :, None]
        for c in range(sx):
            # column c of the side, from the cover's edge outwards
            if side == "right":
                xcol = cx0 + cw + c
                k = c
            else:
                xcol = cx0 - 1 - c
                k = c
            dy = a * (k + 0.5) / sx
            yi = int(np.floor(dy))
            fr = dy - yi
            col = np.concatenate([tex[:, sx - 1 - c if side == "left" else c], np.full((ch, 1), 255.0)], axis=1)
            colbuf = np.zeros((H_ + 2, 4), np.float32)
            colbuf[yi : yi + ch] += col * (1 - fr)
            colbuf[yi + 1 : yi + 1 + ch] += col * fr
            cb = colbuf[:H_]
            img[:, xcol, :] = cb + img[:, xcol, :] * (1 - cb[:, 3:4] / 255)  # premultiplied over the tail

    # the front cover on top
    img[:ch, cx0 : cx0 + cw, :3] = coverArr
    img[:ch, cx0 : cx0 + cw, 3] = 255
    # premultiplied accumulation -> straight alpha
    al = img[..., 3:4]
    rgb = np.where(al > 0, img[..., :3] * 255 / np.maximum(al, 1e-3), 0)
    rgb = np.where(al >= 255, img[..., :3], rgb)
    out = np.concatenate([np.clip(rgb, 0, 255), np.clip(al, 0, 255)], axis=2).astype(np.uint8)
    im = Image.fromarray(out).resize((W_ // SS, H_ // SS), Image.LANCZOS)
    name = f"book_{i + 1}_{slug}.png"
    im.save(os.path.join(OUT, name), optimize=True)
    print(
        json.dumps(
            {
                "slug": slug,
                "file": name,
                "png": [im.size[0], im.size[1]],
                "cover": [cx0 / SS, 0, cw / SS, ch / SS],
                "bake": BAKE,
                "side": side,
                "sideRest": s_rest,
                "aspect": aspect,
                "pages": pages,
            }
        )
    )
