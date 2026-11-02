"""Bake the Works in Progress style's printed materials (procedural; no third-party art). Deterministic (seeded).

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-paper.py [paper]

  paper: mint (default) | pink | lilac | yellow | offwhite   (the theme pairs in styles/works-in-progress.md)

Writes, into public/wip-anthropic/:
  paper_<paper>.jpg   2200 x 3800, a scanned printed sheet whose mean colour is the theme's paper. Measured on the
                      magazine's own feature art (ref_postmarks_sichuan_feature.jpg): fine grain ~+-3.5/255, almost no
                      large-scale mottle (~0.12/255), warm flecks on a cool ground, sparse dry scuffs and ink specks.
  stamp_paper.jpg     900 x 900, the stamp's off-white border stock.
  film_grain.png      1400 x 2300, neutral grey noise for WipFilmLife (overlay blend), moved to a new offset each frame.
And generated/components/kits/works-in-progress/wipInkData.ts: the 1024 px periodic ink density tile as a data: URL
(CSS mask; alpha = how much ink took). Periodic through FFT synthesis, so it can repeat under a large InkPrint.
"""
import base64
import io
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PUBLIC = os.path.join(ROOT, "public", "wip-anthropic")
KIT = os.path.join(ROOT, "generated", "components", "kits", "works-in-progress")
PAPERS = {
    "mint": ("#CEE0DC", "#073429"),
    "pink": ("#F8E6EA", "#E20A39"),
    "lilac": ("#D8D9F1", "#363B8F"),
    "yellow": ("#F4D06F", "#4C3906"),
    "offwhite": ("#FFF7F4", "#121212"),
}
RED = (0xE2, 0x0A, 0x39)
INDIGO = (0x36, 0x3B, 0x8F)
SEED = 20261102


def save_atomic(im, path, **kw):
    """Other sessions render against these files: write beside the target, then rename over it."""
    tmp = f"{path}.tmp{os.getpid()}"
    im.save(tmp, format=kw.pop("format"), **kw)
    os.replace(tmp, path)


def rgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


def fibres(rng, w, h, n, length, sigma=0.0):
    """Short curved strokes, summed in a float field: light and dark hair lines with no direction favoured."""
    im = Image.new("L", (w, h), 128)
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        a = rng.uniform(0, np.pi)
        bend = rng.normal(0, 0.05)
        pts = []
        for _s in range(int(rng.uniform(*length) / 4) + 2):
            pts.append((x, y))
            x += 4 * np.cos(a)
            y += 4 * np.sin(a)
            a += bend + rng.normal(0, 0.05)
        d.line(pts, fill=int(128 + rng.choice([-1, 1]) * rng.uniform(4, 30)), width=1)
    if sigma:
        im = im.filter(ImageFilter.GaussianBlur(sigma))
    return (np.asarray(im, dtype=np.float64) - 128) / 30


def paper_sheet(name, w=2200, h=3800):
    rng = np.random.default_rng(SEED + sum(map(ord, name)))
    base = rgb(PAPERS[name][0])
    # grain: a mid-grain stipple plus the finest pixel noise, partly independent per channel (a scan's colour noise)
    mono = gaussian_filter(rng.standard_normal((h, w)), 0.62)
    mono /= mono.std()
    fine = rng.standard_normal((h, w))
    # the sheet's tooth breathes a little over the page, so no two regions read as copies of each other
    tooth = gaussian_filter(rng.standard_normal((h // 8, w // 8)), 5)
    tooth = np.asarray(Image.fromarray((tooth / tooth.std()).astype(np.float32)).resize((w, h), Image.BICUBIC))
    amp = 1 + 0.14 * np.clip(tooth, -2, 2)
    field = np.stack([base[c] + amp * (3.0 * mono + 1.1 * fine) for c in range(3)], axis=2)
    for c in range(3):
        n = gaussian_filter(rng.standard_normal((h, w)), 0.8)
        field[..., c] += 1.15 * n / n.std()
    # fibres: warm pale hairs and cool dark ones
    f = fibres(rng, w, h, 26000, (10, 46))
    field[..., 0] += np.where(f > 0, 3.2, 2.2) * f
    field[..., 1] += np.where(f > 0, 2.2, 2.6) * f
    field[..., 2] += np.where(f > 0, 1.4, 2.6) * f
    # warm flecks, as on the reference
    fl = np.zeros((h, w))
    idx = rng.integers(0, h * w, 16000)
    fl.flat[idx] = rng.uniform(0.5, 1.0, 16000)
    fl = gaussian_filter(fl, 0.75) * 3.2
    field[..., 0] += 7 * fl
    field[..., 1] -= 1.5 * fl
    field[..., 2] -= 8 * fl
    # the barest large-scale mottle (more reads as clouds) and an uneven sheet tone
    m = gaussian_filter(rng.standard_normal((h // 16, w // 16)), 9)
    m = np.asarray(Image.fromarray((m / m.std()).astype(np.float32)).resize((w, h), Image.BICUBIC))
    field += 0.42 * m[..., None]

    # scuffs: dry, broken streaks where the sheet was rubbed. Sparse, in loose clusters, light and dark.
    scuff = Image.new("L", (w, h), 128)
    d = ImageDraw.Draw(scuff)
    for _ in range(26):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        a0 = rng.uniform(0, np.pi)
        tone = rng.choice([-1, -1, 1])
        for _k in range(int(rng.integers(3, 12))):
            x, y = cx + rng.normal(0, 26), cy + rng.normal(0, 44)
            a = a0 + rng.normal(0, 0.1)
            ln = rng.uniform(16, 90)
            pts = [(x, y)]
            for _s in range(int(ln / 5) + 2):  # a curving fibre, never straight runs on the pixel grid
                a += rng.normal(0, 0.09)
                x, y = x + 5 * np.cos(a), y + 5 * np.sin(a)
                pts.append((x, y))
            d.line(pts, fill=int(128 + tone * rng.uniform(12, 70)), width=1)
    s = (np.asarray(scuff.filter(ImageFilter.GaussianBlur(0.95)), dtype=np.float64) - 128) / 70
    cool = np.array([1.05, 0.95, 0.8])  # a dark scuff goes grey-blue, a light one to the bare stock
    field += (19 * s)[..., None] * cool

    # stray ink specks: little irregular blots and spatters, in clusters, a few of them far apart
    blot = {"ink": np.zeros((h, w)), "red": np.zeros((h, w))}
    for key, clusters, spread in (("ink", 17, 70), ("red", 4, 34)):
        im = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(im)
        for _ in range(clusters):
            cx, cy = rng.uniform(0, w), rng.uniform(0, h)
            for _k in range(int(rng.integers(1, 7))):
                x, y = cx + rng.normal(0, spread), cy + rng.normal(0, spread)
                r = float(np.clip(rng.lognormal(0.2, 0.62), 0.6, 6.5))
                pts = [
                    (x + r * rng.uniform(0.6, 1.3) * np.cos(t), y + r * rng.uniform(0.6, 1.3) * np.sin(t))
                    for t in np.linspace(0, 2 * np.pi, 9)[:-1]
                ]
                d.polygon(pts, fill=int(rng.uniform(120, 240)))
        blot[key] = gaussian_filter(np.asarray(im, dtype=np.float64) / 255, 0.95)
    field = field * (1 - 0.72 * blot["ink"][..., None]) + INDIGO_ARR * 0.72 * blot["ink"][..., None]
    field = field * (1 - 0.62 * blot["red"][..., None]) + RED_ARR * 0.62 * blot["red"][..., None]

    # the mean lands exactly on the theme's paper
    field += base - field.mean((0, 1))
    save_atomic(Image.fromarray(np.clip(field, 0, 255).astype(np.uint8)), os.path.join(PUBLIC, f"paper_{name}.jpg"), format="JPEG", quality=91, subsampling=0)


def stamp_paper(n=900):
    rng = np.random.default_rng(SEED + 7)
    base = rgb("#EFE9DB")
    mono = gaussian_filter(rng.standard_normal((n, n)), 0.7)
    field = base + (3.0 * mono / mono.std())[..., None] * np.array([1.0, 1.0, 1.05])
    f = fibres(rng, n, n, 3000, (8, 30))
    field += (2.4 * f)[..., None]
    field += 0.9 * rng.standard_normal((n, n, 3))
    save_atomic(Image.fromarray(np.clip(field, 0, 255).astype(np.uint8)), os.path.join(PUBLIC, "stamp_paper.jpg"), format="JPEG", quality=90, subsampling=0)


def film_grain(w=1400, h=2300):
    rng = np.random.default_rng(SEED + 11)
    g = gaussian_filter(rng.standard_normal((h, w)), 0.58)
    g = g / g.std()
    save_atomic(Image.fromarray(np.clip(128 + 30 * g, 0, 255).astype(np.uint8), "L"), os.path.join(PUBLIC, "film_grain.png"), format="PNG", optimize=True)


def periodic(rng, n, lo, hi, power=1.0):
    """Band-limited noise on a torus: unit variance, wavelengths from n/lo down to n/hi cycles."""
    fx = np.fft.fftfreq(n)[:, None] * n
    fy = np.fft.fftfreq(n)[None, :] * n
    r = np.sqrt(fx**2 + fy**2)
    amp = np.where((r >= lo) & (r <= hi), 1 / np.maximum(r, 1) ** power, 0)
    spec = amp * np.exp(2j * np.pi * rng.uniform(size=(n, n)))
    a = np.fft.ifft2(spec).real
    return a / a.std()


def ink_tile(n=1024):
    """How much ink took, per pixel. Mostly full; worn regions where only patches of the rubber touched; pin-holes
    from the paper's tooth; a few bare gouges. The uneven density is mild: ink from a pad is nearly opaque where it lands."""
    rng = np.random.default_rng(SEED + 23)
    worn = periodic(rng, n, 2, 7, 0.6)  # where the pad was dry (the big regions)
    patch = periodic(rng, n, 14, 60, 0.7)  # patches of the rubber
    tooth = periodic(rng, n, 150, 400, 0.2)  # paper tooth, pin-holes
    gouge = periodic(rng, n, 40, 110, 0.6)  # broken edges, nicks
    density = periodic(rng, n, 4, 40, 0.8)

    wet = np.clip((worn + 0.2) / 1.0, 0, 1)  # 1 = a well inked region, 0 = a dry one
    wet = wet**0.8
    # dry region: only the high patches print; wet region: all prints. Hard edged: ink is there or it is not.
    a = np.clip((patch + 0.1 + 2.6 * wet) * 7, 0, 1)
    # pin-holes everywhere, denser where dry
    a *= 1 - np.clip((tooth - (1.55 + 0.8 * wet)) * 8, 0, 1)
    # nicks
    a *= 1 - np.clip((gouge - (1.8 + 0.5 * wet)) * 8, 0, 1)
    # a little unevenness in the printed parts
    a *= 0.95 + 0.04 * np.clip(density, -1.25, 1.25)
    a = np.clip(a, 0, 1)
    a8 = (np.round(a * 31) / 31 * 255).astype(np.uint8)  # 32 levels: the tile stays small in the bundle
    im = Image.merge("LA", (Image.new("L", (n, n), 255), Image.fromarray(a8, "L")))
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    target = os.path.join(KIT, "wipInkData.ts")
    with open(f"{target}.tmp{os.getpid()}", "w") as f:
        f.write(
            "// Generated by scripts/clips/wip-anthropic/bake-paper.py: the periodic ink density tile (alpha), inlined so\n"
            "// a CSS mask never races frame capture (CRAFT.md Build technique). Do not edit.\n"
            f'export const INK_TILE_SIZE = {n};\nexport const INK_TILE = "{uri}";\n'
        )
    os.replace(f"{target}.tmp{os.getpid()}", target)
    print("ink tile", len(uri) // 1024, "KB; mean coverage", round(float(a.mean()), 3))


INDIGO_ARR = np.array(INDIGO, dtype=np.float64)
RED_ARR = np.array(RED, dtype=np.float64)

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "mint"
    if name not in PAPERS:
        sys.exit(f"paper must be one of {', '.join(PAPERS)}")
    os.makedirs(PUBLIC, exist_ok=True)
    os.makedirs(KIT, exist_ok=True)
    paper_sheet(name)
    stamp_paper()
    film_grain()
    ink_tile()
    for f in sorted(os.listdir(PUBLIC)):
        print(f, os.path.getsize(os.path.join(PUBLIC, f)) // 1024, "KB")
