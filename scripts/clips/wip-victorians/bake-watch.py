"""The Czapek pocket watch (MET DP338176, CC0) as a kit for FourOrFiveHours and DirtyDogs: square-on with crown up, the
matte by flood from the studio grey, its two real hands lifted off and the enamel healed beneath them. bake-photo.py then
gives the healed print and a with-hands print the one grade, and the hands and the boss are cut from the graded one, each on a
square canvas with the pivot at its centre, ready to rotate. Writes pw_watch, pw_hour, pw_minute and pw_boss.

  uv run --offline --with numpy --with pillow --with scipy --with opencv-python-headless python \
      scripts/clips/wip-victorians/bake-watch.py <PocketWatch_MET_DP338176_ORIG.jpg> <scratch> <public/wip-victorians>
"""
import json
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ni

src, scratch, out = sys.argv[1:4]
im = np.asarray(Image.open(src).convert("RGB"))
TILT = 0.65  # degrees clockwise to bring IX-III level and XII-VI plumb (measured on the numerals)
v0 = im.astype(float).mean(2)

PIVOT = np.array([2006.0, 2129.0])  # the arbor's pin, read off a crop; also the midpoint of IX-III and XII-VI

def fit(pts):
    p = np.array([[PIVOT[0] + np.sin(a) * r, PIVOT[1] - np.cos(a) * r] for a, r in pts])
    for _ in range(4):
        A = np.c_[p, np.ones(len(p))]
        c = np.linalg.lstsq(A, -(p**2).sum(1), rcond=None)[0]
        cx, cy = -c[0] / 2, -c[1] / 2
        R = np.sqrt(cx**2 + cy**2 - c[2])
        res = np.hypot(p[:, 0] - cx, p[:, 1] - cy) - R
        p = p[np.abs(res) < max(3, 2 * res.std())]
    return cx, cy, R, res.std(), len(p)

# the case's outer edge: walking in from the studio grey until it turns gold
outer = []
for a in np.linspace(0, 2 * np.pi, 720, endpoint=False):
    for r in range(1050, 700, -1):
        px = im[int(PIVOT[1] - np.cos(a) * r), int(PIVOT[0] + np.sin(a) * r)].astype(int)
        if px.max() - px.min() > 30:
            outer.append((a, r))
            break
ox, oy, oR, ostd, on = fit(outer)
print("case outer", ox, oy, oR, ostd, on)
# enamel edge: walking out from inside the chapter ring until it turns gold
enamel = []
for a in np.linspace(0, 2 * np.pi, 720, endpoint=False):
    for r in range(790, 900):
        x, y = PIVOT[0] + np.sin(a) * r, PIVOT[1] - np.cos(a) * r
        px = im[int(y), int(x)].astype(int)
        if px.max() - px.min() > 40:
            enamel.append((a, r))
            break
ex, ey, eR, estd, en = fit(enamel)
print("enamel", ex, ey, eR, estd, en)
json.dump({"pivot": PIVOT.tolist(), "outer": [ox, oy, oR], "enamel": [ex, ey, eR]}, open(f"{scratch}/watch_geom.json", "w"))

# matte: everything grey and connected to the corners (or to the bow's hole) is studio; the rest is watch
chroma = im.astype(int).max(2) - im.astype(int).min(2)
grey = (chroma < 14) & (v0 < 175)
grey = ni.binary_opening(grey, iterations=2)
lab, n = ni.label(grey)
keep = {lab[20, 20], lab[20, -20], lab[-20, 20], lab[-20, -20]}
hole_seed = (int(PIVOT[1] - 1320), int(PIVOT[0] - 5))
print("bow hole seed", hole_seed, "label", lab[hole_seed], "v", v0[hole_seed], chroma[hole_seed])
keep.add(lab[hole_seed])
keep.discard(0)
bg = np.isin(lab, list(keep))
matte = ~bg
matte = ni.binary_closing(matte, iterations=5)
matte = ni.binary_opening(matte, iterations=6)
lab2, n2 = ni.label(matte)
sizes = ni.sum(matte, lab2, range(1, n2 + 1))
matte = lab2 == (np.argmax(sizes) + 1)
# the case is a true circle: keep the shadow side's rim from eating into the studio shadow
rr = np.hypot(*(np.mgrid[0 : im.shape[0], 0 : im.shape[1]][::-1] - np.array([ox, oy])[:, None, None]))
below = np.mgrid[0 : im.shape[0], 0 : im.shape[1]][0] > oy - oR * 0.8
matte = (matte & ~(below & (rr > oR + 3))) | (rr <= oR - 2)

# the hands, from the difference against the local enamel
H, Wd = im.shape[:2]
y, x = np.mgrid[0 : H, 0 : Wd]
def corridor(tip, half, base_half=None):
    a = PIVOT
    t = (tip - a) / np.linalg.norm(tip - a)
    u = (x - a[0]) * t[0] + (y - a[1]) * t[1]
    w = np.abs((x - a[0]) * -t[1] + (y - a[1]) * t[0])
    return (u > -30) & (u < np.linalg.norm(tip - a) + 8) & (w < half)

enamel_mask = rr < eR - 6
blur = cv2.medianBlur(cv2.GaussianBlur(v0.astype(np.float32), (0, 0), 1), 5)
far = cv2.GaussianBlur(cv2.medianBlur(np.uint8(np.clip(v0, 0, 255)), 151).astype(np.float32), (0, 0), 20)
diff = far - blur
hour_tip = np.array([1498.0, PIVOT[1] - 5])
min_tip = np.array([2172.0, 1372.0])
def refine(tip, half):
    for _ in range(3):
        c = corridor(tip, half) & (diff > 28) & enamel_mask & (np.hypot(x - PIVOT[0], y - PIVOT[1]) > 110)
        ys, xs = np.nonzero(c)
        P = np.c_[xs, ys].astype(float) - PIVOT
        d_ = np.linalg.svd(P - 0, full_matrices=False)[2][0]
        if d_ @ (tip - PIVOT) < 0:
            d_ = -d_
        L = (P @ d_).max()
        tip = PIVOT + d_ * L
    return tip, L, np.degrees(np.arctan2(d_[0], -d_[1])) % 360
hour_tip, hl, hdeg = refine(hour_tip, 42)
min_tip, ml, mdeg = refine(min_tip, 20)
print("hour", hour_tip, hl, hdeg, "minute", min_tip, ml, mdeg)

rp = np.hypot(x - PIVOT[0], y - PIVOT[1])
boss = np.hypot(x - 2004.5, y - 2128.5) < 62
hour_mask = corridor(hour_tip, 48) & (diff > 12)
min_mask = corridor(min_tip, 26) & (diff > 12)
# nothing under the boss (it rotates with the minute hand), and the minute hand stops short of the chapter ring's tick
hour_mask &= enamel_mask & (rp > 50)
min_mask &= enamel_mask & (rp > 50) & (rp < 772)
keep_big = lambda m: ni.binary_closing(m, iterations=3)
hour_mask, min_mask = keep_big(hour_mask), keep_big(min_mask)
# wide enough to take each hand's soft shadow too, or its ghost stays on the enamel
hole = ni.binary_dilation(hour_mask | min_mask | boss, iterations=24)
print("inpaint px", hole.sum())
y0, y1, x0, x1 = int(PIVOT[1] - 860), int(PIVOT[1] + 200), int(PIVOT[0] - 640), int(PIVOT[0] + 300)
crop = im[y0:y1, x0:x1][:, :, ::-1].copy()
heal = cv2.inpaint(crop, np.uint8(hole[y0:y1, x0:x1]) * 255, 7, cv2.INPAINT_TELEA)
clean = im.copy()
clean[y0:y1, x0:x1] = heal[:, :, ::-1]
# a little of the enamel's own tooth over the healed strokes
rng = np.random.default_rng(13)
noise = cv2.GaussianBlur(rng.normal(0, 1, im.shape[:2]).astype(np.float32), (0, 0), 1.2) * 3.5
clean = np.where(hole[..., None], np.clip(clean + noise[..., None], 0, 255), clean).astype(np.uint8)

# square-on: rotate about the pivot; pivot lands at a known spot on the output canvas
SCALE = 1440.0 / (2 * oR)
OUT_W = 1560
ABOVE = 1290  # output px above the pivot, the bow included
BELOW = 790
M = np.array(
    [
        [SCALE * np.cos(np.radians(TILT)), -SCALE * np.sin(np.radians(TILT)), 0],
        [SCALE * np.sin(np.radians(TILT)), SCALE * np.cos(np.radians(TILT)), 0],
    ]
)
M[:, 2] = np.array([OUT_W / 2, ABOVE]) - M[:, :2] @ PIVOT
warp = lambda a, flags=cv2.INTER_LANCZOS4: cv2.warpAffine(a, M, (OUT_W, ABOVE + BELOW), flags=flags, borderValue=146 if a.ndim == 2 else (146, 146, 146))
clean_o = warp(clean)
with_o = warp(im)
matte_o = np.clip(warp(np.uint8(matte) * 255, cv2.INTER_AREA), 0, 255)
hmask_o = warp(np.float32(cv2.GaussianBlur(np.float32(np.clip(diff / 60, 0, 1) * (ni.binary_dilation(hour_mask, iterations=2))), (0, 0), 1)), cv2.INTER_AREA)
mmask_o = warp(np.float32(cv2.GaussianBlur(np.float32(np.clip(diff / 45, 0, 1) * (ni.binary_dilation(min_mask, iterations=2))), (0, 0), 1)), cv2.INTER_AREA)
bmask_o = warp(np.float32(cv2.GaussianBlur(np.float32(boss), (0, 0), 1.5)), cv2.INTER_AREA)
Image.fromarray(clean_o).save(f"{scratch}/watch_clean.png")
Image.fromarray(with_o).save(f"{scratch}/watch_with.png")
Image.fromarray(matte_o).save(f"{scratch}/watch_matte.png")
np.savez(f"{scratch}/hand_masks.npz", hour=hmask_o, minute=mmask_o, boss=bmask_o)
geom = {
    "out_w": OUT_W,
    "out_h": ABOVE + BELOW,
    "pivot_out": [OUT_W / 2, ABOVE],
    "scale": SCALE,
    "case_R_out": oR * SCALE,
    "enamel_R_out": eR * SCALE,
    "enamel_c_out": (M[:, :2] @ np.array([ex, ey]) + M[:, 2]).tolist(),
    "case_c_out": (M[:, :2] @ np.array([ox, oy]) + M[:, 2]).tolist(),
    "hour_deg": hdeg + TILT,
    "minute_deg": mdeg + TILT,
    "hour_len_out": hl * SCALE,
    "minute_len_out": ml * SCALE,
}
print(json.dumps(geom, indent=1))
json.dump(geom, open(f"{scratch}/watch_out_geom.json", "w"), indent=1)

# the one grade for both prints, then cut the hands from the graded one (each on a square canvas with the pivot at its centre)
GRADE = ["uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python", "scripts/clips/wip-anthropic/bake-photo.py"]
for name, rgb in (("pw_watch", "watch_clean"), ("pw_with", "watch_with")):
    target = f"{out}/{name}.png" if name == "pw_watch" else f"{scratch}/{name}.png"
    subprocess.run(GRADE + [f"{scratch}/{rgb}.png", target, "--matte", f"{scratch}/watch_matte.png", "--max", "2400", "--mid", "0.9"], check=True)
g = np.asarray(Image.open(f"{scratch}/pw_with.png").convert("RGBA"), dtype=np.float32) / 255
px, py = int(OUT_W / 2), ABOVE
def square(alpha, side, name):
    half = side // 2
    a = alpha[py - half : py + half, px - half : px + half]
    c = g[py - half : py + half, px - half : px + half, 0]
    rgba = np.dstack([c, c, c, np.clip(a, 0, 1)])
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(f"{out}/{name}.png", optimize=True)
    print(name, side)
square(hmask_o, int(2 * (hl * SCALE + 14)), "pw_hour")
square(mmask_o, int(2 * (ml * SCALE + 14)), "pw_minute")
square(bmask_o, 160, "pw_boss")
