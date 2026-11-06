"""Cut 35 (CheaperSameAgain): the Despicable Me poster as a b&w print, its photocopies (each one a copy of the copy
before it, so every generation is rougher), and one banknote as a flat print for the stack of bills.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-entertainment/bake-35.py \
      "<assets_raw>/35" --poster <file> --bill <file> [--bill-crop x0,y0,x1,y1] [--copies 12]

Copies the raws into assets-src/wip-entertainment/35/ (once), then writes into public/wip-entertainment/:
  cs_poster.jpg        the poster's 2:3 window in the clip's one photo grade (bake-photo.py); RoughCutPrint `rect` cuts it
  cs_copy_<n>.jpg      photocopy generation n (n = 2 .. copies + 1): a sheet of copy paper with the poster copied onto
                       it a little skewed and off-centre, each from the generation before (blur, harder contrast, toner
                       speckle, a grey fog creeping in from the lid edge, the odd black copier edge)
  cs_bill.png          the banknote, graded, as a flat rectangle (the stack in the cut is many of it)
Prints the sizes the cut needs.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

p = argparse.ArgumentParser()
p.add_argument("raw")
p.add_argument("--poster", required=True)
p.add_argument("--poster-mid", type=float, default=0.48)
p.add_argument("--poster-crop")
p.add_argument("--poster-mix", default=None, help="r,g,b weights replacing the grade's luminance (an orange title on a blue sky)")
p.add_argument("--bill")
p.add_argument("--bill-crop")
p.add_argument("--bill-mid", type=float, default=0.55)
p.add_argument("--copies", type=int, default=12)
p.add_argument("--stack")
p.add_argument("--steps", type=int, default=8)
p.add_argument("--thin", type=float, default=0.86, help="share of the edge band gone by the last state")
p.add_argument("--out", default=None, help="output folder (default public/wip-entertainment)")
a = p.parse_args()

RAW = Path(a.raw)
ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets-src/wip-entertainment/35"
OUT = Path(a.out) if a.out else ROOT / "public/wip-entertainment"
BAKE = ROOT / "scripts/clips/wip-anthropic/bake-photo.py"
if not a.out:
    SRC.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
TMP = Path(tempfile.mkdtemp(prefix="bake35-"))


def raw_copy(name: str) -> Path:
    if a.out:  # a trial bake into a scratch folder: read the raw in place
        return RAW / name
    dst = SRC / name
    if not dst.exists():
        shutil.copy2(RAW / name, dst)
    return dst


def grade(src: Path, out: Path, box, mid: float, mx: int):
    args = [sys.executable, str(BAKE), str(src), str(out), "--max", str(mx), "--mid", str(mid)]
    if box:
        args += ["--crop", ",".join(map(str, box))]
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


# -- the poster: its largest centred 2:3 window (or --poster-crop), graded --------------------------------------------
psrc = raw_copy(a.poster)
if a.poster_mix:
    rgbp = np.asarray(Image.open(psrc).convert("RGB"), dtype=np.float32)
    gp = rgbp @ np.array([float(v) for v in a.poster_mix.split(",")], dtype=np.float32)
    psrc = TMP / "poster_mix.png"
    Image.fromarray(np.clip(gp + 0.5, 0, 255).astype(np.uint8), "L").convert("RGB").save(psrc)
w, h = Image.open(psrc).size
if a.poster_crop:
    box = tuple(int(v) for v in a.poster_crop.split(","))
elif w / h > 2 / 3:
    cw = round(h * 2 / 3)
    box = ((w - cw) // 2, 0, (w - cw) // 2 + cw, h)
else:
    ch = round(w * 3 / 2)
    box = (0, (h - ch) // 2, w, (h - ch) // 2 + ch)
grade(psrc, TMP / "poster.png", box, a.poster_mid, 1050)
poster = Image.open(TMP / "poster.png").convert("L")
poster.convert("RGB").save(OUT / "cs_poster.jpg", quality=92)
print(f"cs_poster.jpg {poster.size[0]}x{poster.size[1]} aspect {poster.size[0] / poster.size[1]:.4f}")

# -- the photocopies ---------------------------------------------------------------------------------------------------
# A sheet a little bigger than the print (the print's 2:3 window + a margin), the copy of the print placed on it a little
# skewed, scaled and off-centre. Generation n is copied from generation n-1's IMAGE (not from the original), so the loss
# compounds: soft focus, an S-curve that eats the mid-tones, toner speckle, and a fog that grows from one edge.
PW, PH = 700, 1050  # the copy's working size (the poster's 2:3 at 700 px)
MARGIN = 0.075  # sheet margin, share of the print's width
SW, SH = round(PW * (1 + 2 * MARGIN)), round(PH + 2 * PW * MARGIN)
PAPER = 247.0  # copy paper white (0..255), a touch brighter than the print's white
TONER = 22.0
rng = np.random.default_rng(35)

img = np.asarray(poster.resize((PW, PH), Image.LANCZOS), dtype=np.float64) / 255


def warp(g: np.ndarray, rot_deg: float, scale: float, dx: float, dy: float) -> np.ndarray:
    """The copier's misplacement: rotate/scale/shift the image about its centre (out-of-bounds = paper white)."""
    hh, ww = g.shape
    yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float64)
    cx, cy = ww / 2, hh / 2
    th = np.deg2rad(rot_deg)
    x = (xx - cx - dx) / scale
    y = (yy - cy - dy) / scale
    sx = np.cos(th) * x + np.sin(th) * y + cx
    sy = -np.sin(th) * x + np.cos(th) * y + cy
    return map_coordinates(g, [sy, sx], order=1, mode="constant", cval=1.0)


def speckle(shape, density: float, seed: int) -> np.ndarray:
    """Toner speckle: specks of 1-3 px, darker where `density` is higher (0..1 multiplier map)."""
    r = np.random.default_rng(seed)
    dots = (r.random(shape) < density).astype(np.float64)
    dots = np.maximum(dots, gaussian_filter(dots, 0.7) * 2.2)
    return np.clip(dots, 0, 1)


for n in range(2, a.copies + 2):
    k = (n - 1) / a.copies  # 0..1 through the generations
    # the copier: soft focus, then an S-curve (harder each time), a small skew and shift
    g = gaussian_filter(img, 0.45 + 0.2 * k)
    gain = 1.02 + 0.03 * k
    g = np.clip(0.5 + (g - 0.5) * gain, 0, 1)
    g = 0.85 * g + 0.15 * g * g * (3 - 2 * g)
    rot = rng.uniform(-1.4, 1.4)
    sc = rng.uniform(0.985, 1.015)
    g = warp(g, rot, sc, rng.uniform(-10, 10), rng.uniform(-10, 10))
    img = g  # the next generation copies THIS one (its specks too, added below)

    # the sheet: paper white; the copy lands on it skewed and off-centre (a slightly skewed crop: an edge of the image may
    # run off the sheet), then speckle all over (heavier in the image) and a black copier edge on one side now and then
    sheet = np.ones((SH, SW))
    rot2 = rng.uniform(-1.8, 1.8)
    off = (rng.uniform(-0.6, 0.6) * PW * MARGIN, rng.uniform(-0.6, 0.6) * PW * MARGIN)
    big = np.ones((SH, SW))
    y0 = (SH - PH) // 2
    x0 = (SW - PW) // 2
    big[y0 : y0 + PH, x0 : x0 + PW] = g
    # the original print's own edge copies as a dark rule round the image (the lid's shadow along the print's cut edge),
    # broken here and there; it keeps the moon a disc cut by the print's top edge instead of melting into the margin
    t = 3
    for sl, ln in (((slice(y0 - t, y0), slice(x0 - t, x0 + PW + t)), PW), ((slice(y0 + PH, y0 + PH + t), slice(x0 - t, x0 + PW + t)), PW),
                   ((slice(y0 - t, y0 + PH + t), slice(x0 - t, x0)), PH), ((slice(y0 - t, y0 + PH + t), slice(x0 + PW, x0 + PW + t)), PH)):
        region = big[sl]
        along = region.shape[1] if region.shape[1] > region.shape[0] else region.shape[0]
        dark = 0.25 + 0.5 * gaussian_filter(rng.random(along), 18) + (rng.random(along) < 0.04) * 0.6
        dark = np.clip(dark, 0, 1)
        big[sl] = np.minimum(region, dark[None, :] if region.shape[1] > region.shape[0] else dark[:, None])
    big = warp(big, rot2, 1.0, off[0], off[1])
    sheet = big
    # fog: grey creeping in from one side of this sheet only (the lid not quite down); it does not compound
    side = rng.integers(0, 4)
    ramp = np.linspace(1, 0, SH if side < 2 else SW) ** 4
    if side == 1 or side == 3:
        ramp = ramp[::-1]
    fog = (ramp[:, None] if side < 2 else ramp[None, :]) * (0.08 + 0.14 * k)
    sheet = np.clip(sheet - fog * (0.5 + gaussian_filter(rng.random(sheet.shape), 30) * 2.0), 0, 1)
    dens = 0.0004 + 0.0022 * k
    specks = speckle(sheet.shape, dens, 1000 + n) * 0.85
    sheet = np.clip(sheet - specks, 0, 1)
    # a share of this sheet's specks inside the image ride into the next generation
    img = np.clip(img - 0.5 * specks[y0 : y0 + PH, x0 : x0 + PW], 0, 1)
    if rng.random() < 0.45 + 0.3 * k:
        edge = rng.integers(0, 4)
        wpx = int(rng.uniform(6, 16 + 12 * k))
        jag = gaussian_filter(rng.random(SH if edge < 2 else SW), 6) * 8
        if edge == 0:
            for yy in range(SH):
                sheet[yy, : wpx + int(jag[yy])] *= 0.12
        elif edge == 1:
            for yy in range(SH):
                sheet[yy, SW - wpx - int(jag[yy]) :] *= 0.12
        elif edge == 2:
            for xx in range(SW):
                sheet[: wpx + int(jag[xx]), xx] *= 0.12
        else:
            for xx in range(SW):
                sheet[SH - wpx - int(jag[xx]) :, xx] *= 0.12
    out = TONER + (PAPER - TONER) * sheet
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "L").convert("RGB").save(OUT / f"cs_copy_{n}.jpg", quality=90)
print(f"cs_copy_2..{a.copies + 1}.jpg {SW}x{SH} aspect {SW / SH:.4f} (print window {PW}x{PH} at its centre)")

# -- the stack of bills, thinning --------------------------------------------------------------------------------------
# The fat stack (a 3/4 view: the top bill's face, the long front side and the short right end showing the bills' edges)
# matted (Apple Vision) and cut out by hand (bake-roughcut.py), then thinned in STEPS states: each state takes a share
# of the edge band out just under the top bill and drops the top bill (and everything above the seam) by the same
# amount, column by column (dy(x) = share x the band's thickness at x, so the near corner drops more than the ends).
# chunk_k = state k-1 above the new seam: the top bill and the few bills under it that slide off between state k-1 and
# state k (it covers state k exactly where they differ, so the swap is invisible until it moves).
if a.stack:
    from scipy.ndimage import map_coordinates as mc

    ssrc = raw_copy(a.stack)
    mask = TMP / "stack_mask.png"
    subprocess.run(["swift", str(ROOT / "scripts/clips/neal-stephenson-trailer/neal-matte.swift"), str(ssrc), str(mask), "fg"], check=True, stdout=subprocess.DEVNULL)
    cut = TMP / "stack_cut.png"
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/clips/wip-entertainment/bake-roughcut.py"), str(ssrc), str(cut), "--show-w", "600", "--matte", str(mask),
         "--max", "1100", "--seed", "cs_stack", "--nibble", "0.08"],
        check=True,
    )
    rgba = np.asarray(Image.open(cut).convert("RGBA"), dtype=np.float64) / 255
    Hs, Ws = rgba.shape[:2]
    assert (Ws, Hs) == (916, 651), f"the stack cut changed size ({Ws}x{Hs}): re-measure TOP and THICK"
    # measured on the 916 x 651 cut: the top bill's front edge (then up the short right end), and the edge band's height
    TOP = [(0, 172), (40, 182), (150, 205), (300, 238), (450, 275), (600, 310), (745, 350), (800, 285), (885, 182), (916, 182)]
    THICK = [(0, 165), (55, 170), (400, 237), (725, 290), (870, 190), (916, 180)]
    xs = np.arange(Ws, dtype=np.float64)
    seam = np.interp(xs, *zip(*TOP)) + 12  # just under the top bill
    thick = np.interp(xs, *zip(*THICK))
    yy, xx = np.mgrid[0:Hs, 0:Ws].astype(np.float64)
    # premultiplied, so the interpolation never drags white fringes out of transparent px
    pm = rgba.copy()
    pm[..., :3] *= pm[..., 3:4]

    def state(share: float) -> np.ndarray:
        dy = share * thick
        sy = np.where(yy < seam[None, :] + dy[None, :], yy - dy[None, :], yy)
        out = np.dstack([mc(pm[..., c], [sy, xx], order=1, mode="constant", cval=0.0) for c in range(4)])
        return out

    def save(pmx: np.ndarray, path: Path):
        al = pmx[..., 3:4]
        rgb = np.where(al > 1e-4, pmx[..., :3] / np.maximum(al, 1e-4), 1.0)
        Image.fromarray((np.dstack([rgb, al]) * 255 + 0.5).clip(0, 255).astype(np.uint8), "RGBA").save(path, optimize=True)

    shares = [a.thin * k / a.steps for k in range(a.steps + 1)]
    prev = None
    for k, sh in enumerate(shares):
        st = state(sh)
        save(st, OUT / f"cs_stack_{k}.png")
        if prev is not None:
            m = np.clip(seam[None, :] + sh * thick[None, :] - yy + 0.5, 0, 1)
            save(prev * m[..., None], OUT / f"cs_chunk_{k}.png")
        prev = st
    print(f"cs_stack_0..{a.steps}.png, cs_chunk_1..{a.steps}.png {Ws}x{Hs} aspect {Ws / Hs:.4f} (RoughCutPrint w 619.6)")

# -- the banknote ------------------------------------------------------------------------------------------------------
if a.bill:
    bsrc = raw_copy(a.bill)
    box = tuple(int(v) for v in a.bill_crop.split(",")) if a.bill_crop else None
    grade(bsrc, TMP / "bill.png", box, a.bill_mid, 900)
    b = Image.open(TMP / "bill.png").convert("RGB")
    b.save(OUT / "cs_bill.png")
    print(f"cs_bill.png {b.size[0]}x{b.size[1]} aspect {b.size[0] / b.size[1]:.4f}")
