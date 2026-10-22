#!/usr/bin/env python3
"""
Bake the ground textures of the Denver world (generated/components/scott-weather-fired/denverWorld.tsx).
Procedural (numpy + PIL, fixed seeds, deterministic); nothing is downloaded, no source image is read.

  plains.jpg   2048 x 2048, TILEABLE, 16 x 16 statute miles (128 px / mi). The high plains east of Denver seen
               from above: the 1-mile section grid (pale dirt section roads), each section cut into quarters,
               halves or wheat/fallow strips, a few centre-pivot circles, open prairie, draws (dry creek beds)
               as darker meandering lines, a fine grass/soil grain. Albedo in warm tan / olive; the stage fogs it.
               Image x = east, image y = SOUTH (row 0 = the tile's north edge).
  region.png   2048 x 2048 RGBA, 160 x 160 statute miles centred on the Jeppesen Terminal (12.8 px / mi), NOT tiled:
               a low-frequency colour wash (alpha ~0.25) that breaks the plains tile's repetition, the Denver metro
               (south-west of DEN: the 1-mile arterial grid, greyer blocks, parks), the South Platte's green line
               and Barr Lake. Image x = east, image y = south; the image centre = the terminal.

Geography (approximate, miles from the terminal, x east / y north): downtown Denver (-17, -7.6), Barr Lake
(-4.3, 6.3), Boulder (-37, 4), the South Platte from downtown north-east through Brighton (-8, 5) toward Greeley.

Run:  /usr/bin/python3 scripts/clips/scott-weather-fired/bake-plains.py
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, "public", "scott-weather-fired")
os.makedirs(OUT, exist_ok=True)

N = 2048


def tile_noise(n, beta, seed):
    """Tileable fractal noise (power spectrum 1/f^beta), normalised to mean 0, std 1."""
    rng = np.random.default_rng(seed)
    w = rng.standard_normal((n, n))
    F = np.fft.fft2(w)
    fx = np.fft.fftfreq(n)[None, :]
    fy = np.fft.fftfreq(n)[:, None]
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = 1
    F = F / np.power(f, beta)
    F[0, 0] = 0
    out = np.real(np.fft.ifft2(F))
    return (out - out.mean()) / out.std()


def hexrgb(h):
    return np.array([int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)], dtype=np.float64)


# ---------------------------------------------------------------------------------------------------------------
# plains.jpg
# ---------------------------------------------------------------------------------------------------------------
TILE_MI = 16
PX = N // TILE_MI  # 128 px per mile
rng = np.random.default_rng(7)

FIELD = {
    "prairie": ["#A1915E", "#A69563", "#9A8D5C", "#AB9A69", "#A08F60"],
    "wheat": ["#BEA26F", "#B99D69", "#C2A776"],
    "stubble": ["#B09769", "#AB9365"],
    "fallow": ["#A48A62", "#A88E66", "#9E865F"],
    "green": ["#8F8C58", "#898A56", "#939059"],
}


def pick(kind):
    c = FIELD[kind]
    return hexrgb(c[rng.integers(len(c))])


img = np.zeros((N, N, 3), dtype=np.float64)
stripe = np.zeros((N, N), dtype=np.float64)  # tillage lines' strength per pixel
yy, xx = np.mgrid[0:N, 0:N]


def fill(x0, y0, x1, y1, col, till=0.0, till_dir=0):
    img[y0:y1, x0:x1] = col
    if till > 0:
        if till_dir == 0:
            s = (np.sin(xx[y0:y1, x0:x1] * (2 * np.pi / 3.2)) > 0.6).astype(np.float64)
        else:
            s = (np.sin(yy[y0:y1, x0:x1] * (2 * np.pi / 3.2)) > 0.6).astype(np.float64)
        stripe[y0:y1, x0:x1] = s * till


for sj in range(TILE_MI):
    for si in range(TILE_MI):
        X0, Y0 = si * PX, sj * PX
        r = rng.random()
        if r < 0.5:
            # open prairie (unfarmed section)
            fill(X0, Y0, X0 + PX, Y0 + PX, pick("prairie"))
        elif r < 0.68:
            # dryland wheat-fallow strips (1/8 mile), N-S or E-W
            d = rng.integers(2)
            n = 8
            w = PX // n
            for k in range(n):
                kind = "wheat" if k % 2 == 0 else "fallow"
                col = pick(kind)
                if d == 0:
                    fill(X0 + k * w, Y0, X0 + (k + 1) * w, Y0 + PX, col, 0.5 if kind == "fallow" else 0.25, 0)
                else:
                    fill(X0, Y0 + k * w, X0 + PX, Y0 + (k + 1) * w, col, 0.5 if kind == "fallow" else 0.25, 1)
        elif r < 0.9:
            # quarter sections
            h = PX // 2
            for qj in range(2):
                for qi in range(2):
                    kind = ["wheat", "stubble", "fallow", "prairie", "green"][rng.integers(5)]
                    fill(X0 + qi * h, Y0 + qj * h, X0 + (qi + 1) * h, Y0 + (qj + 1) * h, pick(kind), 0.35 if kind != "prairie" else 0, rng.integers(2))
        else:
            # halves
            h = PX // 2
            d = rng.integers(2)
            for q in range(2):
                kind = ["wheat", "stubble", "fallow", "green"][rng.integers(4)]
                if d == 0:
                    fill(X0 + q * h, Y0, X0 + (q + 1) * h, Y0 + PX, pick(kind), 0.35, 0)
                else:
                    fill(X0, Y0 + q * h, X0 + PX, Y0 + (q + 1) * h, pick(kind), 0.35, 1)

# centre pivots: a circle in a quarter section (irrigated green inside, the corners left dry)
for _ in range(22):
    si, sj = rng.integers(TILE_MI), rng.integers(TILE_MI)
    qi, qj = rng.integers(2), rng.integers(2)
    cx = si * PX + qi * PX // 2 + PX // 4
    cy = sj * PX + qj * PX // 2 + PX // 4
    R = PX // 4 - 1
    m = (xx - cx) ** 2 + (yy - cy) ** 2 < R * R
    col = pick("green") if rng.random() < 0.7 else pick("wheat")
    img[m] = col
    stripe[m] = 0
    # the pivot's wheel tracks: faint rings
    rr = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    ring = m & (np.abs((rr % 6.0) - 3.0) < 0.5)
    img[ring] *= 0.97

# per-field irregularity + fine grain
n_lo = tile_noise(N, 1.6, 11)
n_mid = tile_noise(N, 1.1, 12)
n_hi = tile_noise(N, 0.2, 13)
lum = 1 + 0.018 * n_lo + 0.03 * n_mid + 0.03 * n_hi - 0.05 * stripe
img *= lum[:, :, None]
# warm/olive hue drift at low frequency
hue = tile_noise(N, 2.0, 14)
img[:, :, 0] *= 1 + 0.02 * hue
img[:, :, 2] *= 1 - 0.03 * hue

# draws: dry creek beds meandering roughly N-S / NE, darker and a touch greener (cottonwoods), tile-periodic
draw_mask = np.zeros((N, N), dtype=np.float64)
for k in range(5):
    x0 = rng.random() * N
    amp = 40 + 60 * rng.random()
    ph = rng.random() * 6.28
    wv = 1 + rng.integers(3)
    t = np.arange(N)
    x = (x0 + amp * np.sin(2 * np.pi * wv * t / N + ph) + 18 * np.sin(2 * np.pi * (wv + 3) * t / N + ph * 2)) % N
    for yi in range(N):
        xi = int(x[yi])
        for dx in range(-3, 4):
            draw_mask[yi, (xi + dx) % N] = max(draw_mask[yi, (xi + dx) % N], 1 - abs(dx) / 4)
draw_mask = np.array(Image.fromarray((draw_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))) / 255.0
img = img * (1 - 0.16 * draw_mask[:, :, None]) + hexrgb("#6E6A40") * (0.08 * draw_mask[:, :, None])

# compress the field-to-field contrast toward the local mean (the plains read as one warm grassland from the air,
# the fields a quiet patchwork in it), keeping the low-frequency variation
# (blurred on a 3 x 3 tiling so the tile stays seamless)
t3 = np.tile(np.clip(img, 0, 255).astype(np.uint8), (3, 3, 1))
wide = np.array(Image.fromarray(t3).filter(ImageFilter.GaussianBlur(60))).astype(np.float64)[N : 2 * N, N : 2 * N]
img = img * 0.5 + wide * 0.5

# section roads: pale dirt along every section line (2 px), plus a few paved county roads (every 2 mi, a bit wider)
road = np.zeros((N, N), dtype=np.float64)
for k in range(TILE_MI):
    p = k * PX
    road[:, [p % N, (p + 1) % N]] = 1
    road[[p % N, (p + 1) % N], :] = 1
road = np.array(Image.fromarray((road * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))) / 255.0
img = img * (1 - 0.32 * road[:, :, None]) + hexrgb("#D2BE95") * (0.32 * road[:, :, None])

img = np.clip(img, 0, 255).astype(np.uint8)
Image.fromarray(img).save(os.path.join(OUT, "plains.jpg"), quality=90)
print("plains.jpg", img.shape, img.reshape(-1, 3).mean(0))

# ---------------------------------------------------------------------------------------------------------------
# region.png (160 mi, centred on the terminal)
# ---------------------------------------------------------------------------------------------------------------
REG_MI = 160
RP = N / REG_MI  # 12.8 px / mi


def to_px(x, y):
    return (N / 2 + x * RP, N / 2 - y * RP)


rgba = np.zeros((N, N, 4), dtype=np.float64)
# low-frequency wash: warmer tans / cooler olives, alpha 0.22
w1 = tile_noise(N, 2.8, 21)
w2 = tile_noise(N, 2.8, 22)
warm = hexrgb("#B89C68")
olive = hexrgb("#8A8656")
t = np.clip(0.5 + 0.35 * w1, 0, 1)[:, :, None]
rgba[:, :, :3] = warm * t + olive * (1 - t)
rgba[:, :, 3] = np.clip(0.22 + 0.1 * w2, 0.05, 0.4)

# the Denver metro: a union of soft ellipses, edged by noise
gy, gx = np.mgrid[0:N, 0:N]
wx = (gx - N / 2) / RP
wy = (N / 2 - gy) / RP
urb = np.zeros((N, N))
for (cx, cy, rx, ry) in [(-18, -9, 13, 11), (-11, -16, 8, 8), (-19, 2, 9, 7), (-26, -20, 9, 8), (-9, -9, 5, 5), (-37, 4, 3.2, 3.8), (-28, 9, 5, 4), (-14, 8, 4, 3)]:
    d = ((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2
    urb = np.maximum(urb, np.exp(-1.2 * d))
un = tile_noise(N, 1.8, 23)
# development comes in half-mile blocks along the arterial grid: a block is built when the metro field plus noise
# clears a threshold, so the edge is ragged and square, like the real suburbs
cell = 0.5
cx_i = np.floor(wx / cell)
cy_i = np.floor(wy / cell)
hcell = (np.sin(cx_i * 12.9898 + cy_i * 78.233) * 43758.5453) % 1.0
urb = ((urb + 0.22 * un * (urb > 0.03) + 0.3 * (hcell - 0.5)) > 0.42).astype(np.float64)
urb = np.array(Image.fromarray((urb * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
ub = tile_noise(N, 0.6, 24)
ucol = hexrgb("#A39582") * (1 + 0.06 * ub)[:, :, None]
# the arterial grid every mile (lighter), slightly lighter blocks near the core
grid = ((np.abs(((wx + 0.5) % 1.0) - 0.5) < 0.05) | (np.abs(((wy + 0.5) % 1.0) - 0.5) < 0.05)).astype(np.float64)
ucol = ucol * (1 - 0.25 * grid[:, :, None]) + hexrgb("#C9BEAA") * (0.25 * grid[:, :, None])
# parks: a few green patches inside the city
pk = (tile_noise(N, 1.3, 25) > 1.6).astype(np.float64)
ucol = ucol * (1 - 0.5 * pk[:, :, None]) + hexrgb("#7C8150") * (0.5 * pk[:, :, None])
a_u = urb * 0.85
rgba[:, :, :3] = rgba[:, :, :3] * (1 - a_u[:, :, None]) + ucol * a_u[:, :, None]
rgba[:, :, 3] = rgba[:, :, 3] * (1 - a_u) + a_u

# the South Platte: downtown -> Commerce City -> Brighton -> north (cottonwood green, a thin band)
im = Image.new("L", (N, N), 0)
dr = ImageDraw.Draw(im)
river = [(-19, -10), (-17, -7.6), (-14, -3), (-11, 1), (-8.5, 5), (-7, 10), (-6.5, 16), (-4, 24), (0, 32), (6, 40), (14, 46), (30, 50), (60, 52)]
dr.line([to_px(x, y) for x, y in river], fill=255, width=4)
# Cherry Creek / Sand Creek hints into the city (thin)
dr.line([to_px(x, y) for x, y in [(-17, -7.6), (-14, -12), (-12, -16), (-11, -22)]], fill=200, width=2)
rv = np.array(im.filter(ImageFilter.GaussianBlur(2.2))) / 255.0
rgba[:, :, :3] = rgba[:, :, :3] * (1 - 0.8 * rv[:, :, None]) + hexrgb("#6C7044") * (0.8 * rv[:, :, None])
rgba[:, :, 3] = np.maximum(rgba[:, :, 3], 0.8 * rv)

# lakes: Barr Lake, Standley, Aurora reservoir, Cherry Creek reservoir (still water, a warm grey-green)
im = Image.new("L", (N, N), 0)
dr = ImageDraw.Draw(im)
# (Barr Lake near DEN is left out: from the cut cameras it read as a pale floating disc)
# (all lakes left out: drawn as ellipses they read as pale floating discs from the cut cameras and from altitude)
for (cx, cy, rx, ry) in []:
    x0, y0 = to_px(cx - rx, cy + ry)
    x1, y1 = to_px(cx + rx, cy - ry)
    dr.ellipse([x0, y0, x1, y1], fill=255)
lk = np.array(im.filter(ImageFilter.GaussianBlur(1.0))) / 255.0
rgba[:, :, :3] = rgba[:, :, :3] * (1 - lk[:, :, None]) + hexrgb("#C7BC9A") * lk[:, :, None]
rgba[:, :, 3] = np.maximum(rgba[:, :, 3], lk)

# keep the airfield's own square calm (the airfield paints its property there)
rgba = np.clip(rgba, 0, 255)
rgba[:, :, 3] *= 255
Image.fromarray(rgba.astype(np.uint8)).save(os.path.join(OUT, "region.png"), optimize=True)
print("region.png", rgba.shape)
