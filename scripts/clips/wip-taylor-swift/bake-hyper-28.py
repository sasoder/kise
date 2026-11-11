"""HyperSpecific (wip-taylor-swift, cut 28): bake the record, the red scarf, the cardigan and the polaroid as b&w cut-outs.

For each photo: Apple Vision fg matte (neal-matte.swift), then the one grade (wip-anthropic/bake-photo.py) into
public/wip-taylor-swift/hs_<name>.png. Prints each PNG's size and aspect.
- record: the A&M LP (CC0) was shot a little off square, so the disc is stretched to a circle first; then cropped square on
  the disc. Its label is cut out again as hs_record_label.png, a circle on the same centre with the dead wax round it, so the
  component can turn the label while the vinyl's sheen stays put, as on a real turntable. The printed label (another
  artist's record) is replaced by plain paper of the same tone: faint fibre, a little uneven, one faint ring printed a hair
  off centre (so the turn still shows), the spindle hole.
- scarf: the photo is a close crop of a draped brioche scarf, so the scarf is rebuilt from its knit: a straight band of
  about four and a half ribs, three windows of the photo laid end to end along the ribs (cross-faded seams), a fringe of
  tassels at both ends cut from single ribs, then bent into a loose S (rows shifted sideways, flat at both ends). Graded
  light (mid 0.55) so the red ink printed over it stays red.
- polaroid: the bookshelf in its window is replaced by Taylor on the 1989 World Tour (Melbourne, Dec 2015), cropped
  square-ish to the window, blacks lifted a little like instant film.
- cardigan: the matte as it comes.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-taylor-swift/bake-hyper-28.py <scratch>
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

ROOT = "/Users/tom/Documents/tom fant/wip/nov/taylor swift + arabia/taylor swift/animation_source/assets_raw"
RAW = f"{ROOT}/song"
OUT = "public/wip-taylor-swift"
SCRATCH = sys.argv[1]
os.makedirs(f"{SCRATCH}/mattes", exist_ok=True)
rng = np.random.default_rng(28)


def matte(name: str) -> str:
    out = f"{SCRATCH}/mattes/{name}.png"
    if not os.path.exists(out):
        subprocess.run(["swift", "scripts/clips/neal-stephenson-trailer/neal-matte.swift", f"{RAW}/{name}.jpg", out, "fg"], check=True)
    return out


def bake(src: str, out: str, mask: str, mid: float, max_px: int, crop: str | None = None) -> None:
    cmd = [sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", src, out, "--matte", mask, "--mid", str(mid), "--max", str(max_px)]
    if crop:
        cmd += ["--crop", crop]
    subprocess.run(cmd, check=True)


# -- the record ------------------------------------------------------------------------------------------------------------
REC = "vinyl_record_AandM_b"
im = Image.open(f"{RAW}/{REC}.jpg").convert("RGB")
mk = Image.open(matte(REC)).convert("L")
# the disc's box on the matte: 3692 wide, 3572 tall; stretch y to a circle
a = np.asarray(mk) > 127
ys, xs = np.nonzero(a)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
sy = (x1 - x0) / (y1 - y0)
size = (im.width, round(im.height * sy))
im = im.resize(size, Image.LANCZOS)
mk = mk.resize(size, Image.LANCZOS)
cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2 * sy, (x1 - x0) / 2
pad = 24
box = (round(cx - r - pad), round(cy - r - pad), round(cx + r + pad), round(cy + r + pad))
# the disc is round: a drawn circle a hair inside the matte's edge is cleaner than the matte itself
circ = Image.new("L", size, 0)
ImageDraw.Draw(circ).ellipse((cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3), fill=255)
circ = circ.filter(ImageFilter.GaussianBlur(2))
im.crop(box).save(f"{SCRATCH}/record_round.jpg", quality=95)
circ.crop(box).save(f"{SCRATCH}/record_round_mask.png")
print(f"record: stretched y by {sy:.4f}, disc r {r:.0f} px")
bake(f"{SCRATCH}/record_round.jpg", f"{OUT}/hs_record.png", f"{SCRATCH}/record_round_mask.png", 0.2, 1400)
rec = Image.open(f"{OUT}/hs_record.png").convert("RGBA")
k = rec.width / (box[2] - box[0])
lc = rec.width / 2
# the plain paper label, painted over the printed one (label r ~620-640 of the disc's 1846 px radius)
la = np.asarray(rec, dtype=np.float32).copy()
yy, xx = np.mgrid[0 : rec.height, 0 : rec.width].astype(np.float32)
rr = np.hypot(xx - lc, yy - lc)
LAB_R = 646 * k
paper = np.full(rr.shape, 0.86, np.float32)
paper += 0.012 * gaussian_filter(rng.standard_normal(rr.shape).astype(np.float32), 1.2) / 0.2  # fibre
paper += 0.012 * gaussian_filter(rng.standard_normal(rr.shape).astype(np.float32), 22) / 0.013  # uneven, age
paper -= 0.035 * np.clip((xx - lc + 0.4 * (yy - lc)) / LAB_R, 0, 1)  # one side a touch darker
ring_r = np.hypot(xx - lc - 0.03 * LAB_R, yy - lc + 0.015 * LAB_R)  # one faint printed ring, a hair off centre
paper -= 0.07 * np.exp(-(((ring_r - 0.84 * LAB_R) / 1.1) ** 2))
paper = np.where(rr < 0.072 * LAB_R, 0.08, paper)  # the spindle hole
paper -= 0.10 * np.exp(-(((rr - LAB_R) / 1.4) ** 2))  # the label's own edge
inside = np.clip(LAB_R + 0.5 - rr, 0, 1)
for c in range(3):
    la[..., c] = la[..., c] * (1 - inside) + np.clip(paper, 0, 1) * 255 * inside
rec = Image.fromarray(la.clip(0, 255).astype(np.uint8), "RGBA")
rec.save(f"{OUT}/hs_record.png", optimize=True)
# the label and the dead wax round it, as its own circle on the same centre
lr = 700 * k
lab = Image.new("L", rec.size, 0)
ImageDraw.Draw(lab).ellipse((lc - lr, lc - lr, lc + lr, lc + lr), fill=255)
lab = lab.filter(ImageFilter.GaussianBlur(3 * k * 4))
la = np.asarray(rec).copy()
la[..., 3] = (la[..., 3].astype(np.float32) * np.asarray(lab, dtype=np.float32) / 255).astype(np.uint8)
lb = (round(lc - lr - 8), round(lc - lr - 8), round(lc + lr + 8), round(lc + lr + 8))
Image.fromarray(la, "RGBA").crop(lb).save(f"{OUT}/hs_record_label.png", optimize=True)
print(f"{OUT}/hs_record_label.png: {lb[2] - lb[0]} px square, {(lb[2] - lb[0]) / rec.width:.4f} of the disc print's width")

# -- the scarf: rebuilt from its own knit -----------------------------------------------------------------------------------
SC = "scarf_red_knit_a"
src = Image.open(f"{RAW}/{SC}.jpg").convert("RGB")
src = np.asarray(src.resize((src.width // 2, src.height // 2), Image.LANCZOS), dtype=np.float32)
H, W = src.shape[:2]
BX0, BX1 = round(0.36 * W), round(0.545 * W)  # about four and a half ribs, where they run straight
BW = BX1 - BX0
WINDOWS = [(0.30, 0.97), (0.36, 0.97), (0.50, 0.92)]  # three stretches of the scarf, laid end to end
SEAM = 110
PADX = 40
tiles = [src[round(a * H) : round(b * H), BX0 - PADX : BX1 + PADX] for a, b in WINDOWS]
# match each stretch's brightness to the first, then line its ribs and stitches up with the band's end before the seam
base = tiles[0].mean()
tiles = [t * (base / t.mean()) for t in tiles]
band = tiles[0][:, PADX:-PADX]
for t in tiles[1:]:
    end = band[-SEAM:].mean(-1)
    best = (1e18, 0, 0)
    for dy in range(0, 90, 2):
        for dx in range(-PADX + 2, PADX - 1, 2):
            cand = t[dy : dy + SEAM, PADX + dx : PADX + dx + BW].mean(-1)
            err = float(((cand - cand.mean()) - (end - end.mean())).var())
            if err < best[0]:
                best = (err, dy, dx)
    _, dy, dx = best
    t = t[dy:, PADX + dx : PADX + dx + BW]
    ramp = np.linspace(0, 1, SEAM, dtype=np.float32)[:, None, None]
    blend = band[-SEAM:] * (1 - ramp) + t[:SEAM] * ramp
    band = np.concatenate([band[:-SEAM], blend, t[SEAM:]])
    print(f"seam: stitches lined up at dy {dy}, dx {dx}")
BL = band.shape[0]
# the fringe: tassels cut from single ribs, hanging off both ends
TL = round(0.5 * BW)
N_TAS = 6
top = round(TL * 1.15) + 10
canvas_h = BL + 2 * top
cv = np.full((canvas_h, BW + 40, 3), 255, np.float32)
ca = np.zeros((canvas_h, BW + 40), np.float32)
cv[top : top + BL, 20 : 20 + BW] = band
ca[top : top + BL, 20 : 20 + BW] = 255
ca[top : top + BL, 20:22] = 140  # a soft side edge
ca[top : top + BL, 18 + BW : 20 + BW] = 140
rib = BW / 4.5
for end in (0, 1):
    for i in range(N_TAS):
        tw = max(6, round(rib * 0.42))
        ln = round(TL * (0.82 + 0.3 * rng.random()))
        sx = round(rng.random() * (BW - tw))
        sy0 = round(rng.random() * (BL - ln))
        strand = band[sy0 : sy0 + ln, sx : sx + tw]
        al = np.full((ln, tw), 255, np.float32)
        tip = np.linspace(1, 0.55, ln)[:, None] if end else np.linspace(0.55, 1, ln)[:, None]
        half = (tw / 2) * tip
        xs_ = np.abs(np.arange(tw)[None, :] - (tw - 1) / 2)
        al *= np.clip(half - xs_ + 0.5, 0, 1)
        # rounded end
        e = np.arange(ln)[:, None] if end else (ln - 1 - np.arange(ln))[:, None]
        al *= np.clip((ln - e) / (tw * 0.5), 0, 1)
        cxp = 20 + (i + 0.5) * BW / N_TAS - tw / 2 + (rng.random() - 0.5) * 4
        x0p = round(cxp)
        if end:
            y0p = top + BL - 4
        else:
            y0p = top - ln + 4
        sl = (slice(y0p, y0p + ln), slice(x0p, x0p + tw))
        m = al / 255
        cv[sl] = cv[sl] * (1 - m[..., None]) + strand * m[..., None]
        ca[sl] = np.maximum(ca[sl], al)
# the loose S: rows shift sideways by -A cos(pi t), flat at both ends
A = round(1.0 * BW)
CH, CW = cv.shape[:2]
out = np.full((CH, CW + 2 * A, 3), 255, np.float32)
oa = np.zeros((CH, CW + 2 * A), np.float32)
xo = np.arange(CW + 2 * A, dtype=np.float32)
for y in range(CH):
    d = A - A * np.cos(np.pi * y / (CH - 1))
    sx = xo - d
    for c in range(3):
        out[y, :, c] = np.interp(sx, np.arange(CW), cv[y, :, c], left=255, right=255)
    oa[y] = np.interp(sx, np.arange(CW), ca[y], left=0, right=0)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(f"{SCRATCH}/scarf_built.jpg", quality=95)
Image.fromarray(oa.clip(0, 255).astype(np.uint8), "L").save(f"{SCRATCH}/scarf_built_mask.png")
print(f"scarf band {BW} x {BL} px (1:{BL / BW:.1f}), tassels {TL} px, S amplitude {A} px")
bake(f"{SCRATCH}/scarf_built.jpg", f"{OUT}/hs_scarf.png", f"{SCRATCH}/scarf_built_mask.png", 0.55, 1400)

# -- the polaroid, with Taylor in its window --------------------------------------------------------------------------------
PO = "polaroid_single_a"
po = np.asarray(Image.open(f"{RAW}/{PO}.jpg").convert("RGB"), dtype=np.float32)
WX0, WY0, WX1, WY1 = 192, 186, 1465, 1489  # the picture window, measured from the column and row profiles
tay = Image.open(f"{ROOT}/taylor/taylor_2015_1989Tour_fulllength.jpg").convert("RGB")
ww, wh = WX1 - WX0, WY1 - WY0
cw = 800
ch = round(cw * wh / ww)
tc = tay.crop((290, 0, 290 + cw, ch)).resize((ww, wh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
tc = np.asarray(tc, dtype=np.float32)
tc = 22 + tc * (225 / 255)  # instant film: blacks lifted, whites held
po[WY0:WY1, WX0:WX1] = tc
Image.fromarray(po.astype(np.uint8)).save(f"{SCRATCH}/polaroid_taylor.jpg", quality=95)
m = matte(PO)
ma = np.asarray(Image.open(m).convert("L")) > 127
ys, xs = np.nonzero(ma)
crop = f"{max(0, xs.min() - 12)},{max(0, ys.min() - 12)},{xs.max() + 12},{ys.max() + 12}"
bake(f"{SCRATCH}/polaroid_taylor.jpg", f"{OUT}/hs_polaroid.png", m, 0.5, 1000, crop)

# -- the cardigan ------------------------------------------------------------------------------------------------------------
CA = "cardigan_cream_cableknit_a"
m = matte(CA)
ma = np.asarray(Image.open(m).convert("L")) > 127
ys, xs = np.nonzero(ma)
crop = f"{max(0, xs.min() - 12)},{max(0, ys.min() - 12)},{xs.max() + 12},{ys.max() + 12}"
bake(f"{RAW}/{CA}.jpg", f"{OUT}/hs_cardigan.png", m, 0.5, 1000, crop)
