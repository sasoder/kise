# Bake the CPU of cut 43 CpuHoursOverDone (sam-pricing-tokens) from the image agent's photo.
# Source: assets-src/sam-pricing-tokens/cpu_top_ryzen5_9600x_topdown_CC0.jpg (AMD Ryzen 5 9600X, heat-spreader side,
# dead top-down, CC0 Fritzchens Fritz, Commons thumb 1920 px; copied from images/cutout_sources/).
#  * the cut-out: the substrate's bright teal edge is keyed (green / blue well above red), and the chip's outline is the
#    intersection of a row fill and a column fill of that key (the top / bottom notches stay notches); 3 px eroded so
#    no mauve backdrop fringes the edge; area-downsampled for a clean anti-aliased edge.
#  * the branding is painted out (SOURCES.md: "paint it out if the graphic should be generic"; the line is about CPU
#    hours, not AMD): inside the heat spreader's central plate, every engraved mark (AMD logo, RYZEN, the model line,
#    the data-matrix and the four lines of codes) is masked by darkness against a smooth fit of the plate, dilated, and
#    replaced by that fit (a 2-D quadratic per channel) plus fine grain matched to the plate's own (std of its residual),
#    feathered into the metal. The pin-1 dimple, the pads and the capacitors stay.
# Writes public/sam-pricing-tokens/cpu_top_clean.png (RGBA) and generated/components/sam-pricing-tokens/cpuData.ts.
# Run (system python + the user's site-packages, no installs):
#   /usr/bin/python3 -I scripts/clips/sam-pricing-tokens/bake-cpu.py <repo root>
import base64
import io
import sys

sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
import numpy as np  # noqa: E402
from PIL import Image, ImageFilter  # noqa: E402

ROOT = sys.argv[1]
SRC = f"{ROOT}/assets-src/sam-pricing-tokens/cpu_top_ryzen5_9600x_topdown_CC0.jpg"
OUT_PNG = f"{ROOT}/public/sam-pricing-tokens/cpu_top_clean.png"
OUT_TS = f"{ROOT}/generated/components/sam-pricing-tokens/cpuData.ts"
OUT_SIZE = 640  # px (the chip is ~330-370 px on screen; ~1.8x headroom)
# the heat spreader's central plate, text-bearing area (source px x0, y0, x1, y1): all metal, no window
TEXT_BOX = (430, 420, 1300, 1440)

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape

# --- the outline -----------------------------------------------------------------------------------------
r, g, b = a[..., 0], a[..., 1], a[..., 2]
key = ((g - r) > 35) | ((b - r) > 45)
kk = Image.fromarray((key * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
key = np.asarray(kk) > 127
rowfill = np.zeros_like(key)
colfill = np.zeros_like(key)
for y in range(H):
    xs = np.nonzero(key[y])[0]
    if xs.size > 20:
        rowfill[y, xs.min() : xs.max() + 1] = True
for x in range(W):
    ys = np.nonzero(key[:, x])[0]
    if ys.size > 20:
        colfill[ys.min() : ys.max() + 1, x] = True
shape = rowfill & colfill
m = Image.fromarray((shape * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.MinFilter(7))
shape = np.asarray(m) > 127
ys, xs = np.nonzero(shape)
bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
print("chip bbox", bx0, bx1, by0, by1)

# --- paint out the engraving ------------------------------------------------------------------------------
x0, y0, x1, y1 = TEXT_BOX
box = a[y0:y1, x0:x1].copy()
lum = box.mean(2)
hh, ww = lum.shape
yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
u = xx / ww - 0.5
v = yy / hh - 0.5
BASIS = [np.ones_like(u), u, v, u * u, u * v, v * v]
BLK = 30  # the fit runs on block means of the valid metal (small and robust), evaluated per pixel


def fit(valid):
    out = np.zeros_like(box)
    nb_y, nb_x = hh // BLK, ww // BLK
    rows, vals = [], [[], [], []]
    for j in range(nb_y):
        for i in range(nb_x):
            sl = (slice(j * BLK, (j + 1) * BLK), slice(i * BLK, (i + 1) * BLK))
            vm = valid[sl]
            if vm.mean() < 0.5:
                continue
            rows.append([float(bb[sl][vm].mean()) for bb in BASIS])
            for c in range(3):
                vals[c].append(float(box[sl][..., c][vm].mean()))
    M = np.array(rows, dtype=np.float64)
    for c in range(3):
        coef = np.linalg.solve(M.T @ M, M.T @ np.array(vals[c]))
        out[..., c] = sum(float(coef[n]) * BASIS[n] for n in range(6))
    return out


valid = lum > 135
smooth = fit(valid)
for _ in range(2):  # refit on what is clearly metal
    valid = lum > smooth.mean(2) - 22
    smooth = fit(valid)
dark = lum < smooth.mean(2) - 38
dm = Image.fromarray((dark * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(4))
w_ = (np.asarray(dm).astype(np.float32) / 255.0)
w_ = np.clip(w_ * 1.6, 0, 1)[..., None]
resid = (box - smooth)[valid & ~(np.asarray(dm) > 10)]
std = resid.std(0)
rng = np.random.default_rng(43)
noise = rng.normal(0, 1, box.shape).astype(np.float32)
noise = np.asarray(Image.fromarray(np.clip(noise * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
noise = (noise - noise.mean((0, 1))) / (noise.std((0, 1)) + 1e-6)
fill = smooth + noise * std
box2 = box * (1 - w_) + fill * w_
# feather the box's own border back into the untouched photo (nothing changes outside it anyway: w_ ~ 0 there)
a[y0:y1, x0:x1] = box2
print("plate grain std", std.round(2), "painted px", int((w_[..., 0] > 0.5).sum()))

# --- crop, downsample, write ---------------------------------------------------------------------------------
side = max(bx1 - bx0, by1 - by0)
cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
crop = (int(round(cx - side / 2)), int(round(cy - side / 2)), int(round(cx + side / 2)), int(round(cy + side / 2)))
rgb = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).crop(crop).resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
alpha = Image.fromarray((shape * 255).astype(np.uint8)).crop(crop).resize((OUT_SIZE, OUT_SIZE), Image.BOX)
rgba = rgb.copy()
rgba.putalpha(alpha)
rgba.save(OUT_PNG, optimize=True)
buf = io.BytesIO()
rgba.save(buf, format="PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode("ascii")
with open(OUT_TS, "w") as f:
    f.write(
        "// GENERATED by scripts/clips/sam-pricing-tokens/bake-cpu.py — do not edit by hand.\n"
        "// The CPU of cut 43 CpuHoursOverDone: AMD Ryzen 5 9600X heat-spreader side, top-down (CC0, Fritzchens Fritz,\n"
        "// Wikimedia Commons), cut out of its backdrop, branding painted out. RGBA PNG, square.\n"
        f"export const CPU_PHOTO = {{ src: \"data:image/png;base64,{b64}\", aspect: 1, px: {OUT_SIZE} }} as const;\n"
    )
print("wrote", OUT_PNG, OUT_TS, len(b64) // 1024, "KB base64")
