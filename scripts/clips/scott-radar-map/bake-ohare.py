#!/usr/bin/env python3
"""
Bake the ground textures of the O'Hare world (generated/components/scott-radar-map/ohareWorld.tsx), the Denver world's
look (scott-weather-fired) carried to Chicago. Deterministic (fixed seeds); nothing is downloaded.

  ohare-field.png  2048 x 2048 RGBA, OHARE_FIELD_MI x OHARE_FIELD_MI statute miles centred on (FIELD_CX, FIELD_CY)
                   (world miles, origin = the terminal core). The airfield's ground TRACED FROM THE FAA AIRPORT DIAGRAM
                   (assets-src/scott-radar-map/KORD_airport_diagram_FAA_dTPP_2610_3000px.png, public domain, AL-166,
                   effective 01 OCT 2026, north up): its grey pavement (taxiways, aprons, ramps) and its black building
                   blobs, the text and thin linework removed (a closing of the grey, an opening of the black), the
                   runways re-drawn from their traced centrelines (RUNWAYS below = ohareAirfield.ts). Painted in the
                   warm look: concrete pavement, cream roofs, mowed grass round it (alpha feathered out into the
                   suburbs). Image x = east, image y = south.
  suburbs.jpg      2048 x 2048, TILEABLE, 8 x 8 statute miles (256 px / mi): Chicago's suburbs seen from the air: the
                   one-mile arterial grid with its commercial strips, residential streets every 1/8 x 1/16 mile, roofs,
                   tree canopy, parks, industrial parks with pale roofs, a few ponds. Warm olive / tan / cream.
  region.png       2048 x 2048 RGBA, 128 x 128 statute miles centred on the terminal core (16 px / mi), NOT tiled: a
                   low-frequency wash that breaks the suburb tile's repetition, the farmland past the Fox River (west of
                   ~x -17: the section grid of corn / soy / stubble), the forest preserves (Des Plaines River east of the
                   field, Busse Woods north-west), Lake Michigan's shore far east (behind the cameras).

Scale of the diagram: the six parallel runways' drawn lengths against their published lengths (7,500 / 11,245 /
11,260 / 13,000 / 10,800 / 7,500 ft) give 0.0951 px per ft = 502 px per statute mile; the origin (1060, 1500) px is the
terminal core (Terminals 1-3).

Run:  /usr/bin/python3 scripts/clips/scott-radar-map/bake-ohare.py
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SRC = os.path.join(ROOT, "assets-src", "scott-radar-map", "KORD_airport_diagram_FAA_dTPP_2610_3000px.png")
OUT = os.path.join(ROOT, "public", "scott-radar-map")
os.makedirs(OUT, exist_ok=True)

N = 2048
PX_PER_MI_DIAG = 502.0
ORIGIN = (1060.0, 1500.0)
# the field texture's extent (keep in sync with ohareWorld.tsx TEX.field)
OHARE_FIELD_MI = 5.6
FIELD_CX = -0.25
FIELD_CY = 0.0
FT = 1 / 5280

# runway centrelines (miles; keep in sync with ohareAirfield.ts)
RUNWAYS = [
    ("9L/27R", -1.241, 1.749, 0.181, 1.749, 150),
    ("9C/27C", -1.494, 0.749, 0.637, 0.749, 200),
    ("9R/27L", -1.494, 0.446, 0.641, 0.446, 150),
    ("10L/28R", -1.494, -0.580, 0.976, -0.580, 150),
    ("10C/28C", -1.492, -0.807, 0.554, -0.807, 150),
    ("10R/28L", -1.279, -1.394, 0.122, -1.394, 150),
    ("4L/22R", -0.589, 0.275, 0.306, 1.378, 150),
    ("4R/22L", 0.123, -1.695, 1.142, -0.556, 150),
]


def hexrgb(h):
    return np.array([int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)], dtype=np.float64)


def tile_noise(n, beta, seed):
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


def mask_img(m):
    return Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8))


def morph(m, size, op):
    """binary dilate (max) / erode (min) with a square of odd size, as repeated 3x3 passes (PIL caps filter sizes)"""
    im = mask_img(m)
    f = ImageFilter.MaxFilter if op == "max" else ImageFilter.MinFilter
    k = size
    while k > 1:
        s = min(k, 9) if min(k, 9) % 2 == 1 else min(k, 9) - 1
        im = im.filter(f(s))
        k -= s - 1
    return np.array(im) > 127


def close_(m, s):
    return morph(morph(m, s, "max"), s, "min")


def open_(m, s):
    return morph(morph(m, s, "min"), s, "max")


# =================================================================================================================
# ohare-field.png
# =================================================================================================================
def bake_field():
    rgba = np.array(Image.open(SRC).convert("RGBA")).astype(np.int32)
    r, g, b = rgba[:, :, 0], rgba[:, :, 1], rgba[:, :, 2]
    v = (r + g + b) / 3
    neutral = (np.abs(r - g) < 12) & (np.abs(g - b) < 12)
    grey = neutral & (v > 180) & (v < 232)
    black = neutral & (v < 100)
    Hd, Wd = v.shape
    # only inside the diagram's field frame (the title, the notes and the frequency table stay out)
    frame = np.zeros_like(grey)
    frame[470:2460, 95:1865] = True
    grey &= frame
    black &= frame
    # the true grey fill only (big areas): the anti-aliased rims of the black text are grey too, an opening drops them
    grey = open_(grey & (v > 198) & (v < 216), 5)
    # the runways, redrawn as true-width strips (+ blast pads) in diagram px
    rw = Image.new("L", (Wd, Hd), 0)
    d = ImageDraw.Draw(rw)
    for _, x0, y0, x1, y1, wft in RUNWAYS:
        L = np.hypot(x1 - x0, y1 - y0)
        ux, uy = (x1 - x0) / L, (y1 - y0) / L
        ext = 300 * FT
        ax, ay = x0 - ux * ext, y0 - uy * ext
        bx, by = x1 + ux * ext, y1 + uy * ext
        hw = (wft * FT) / 2
        nx, ny = -uy * hw, ux * hw
        pts = [(ax + nx, ay + ny), (bx + nx, by + ny), (bx - nx, by - ny), (ax - nx, ay - ny)]
        d.polygon([(ORIGIN[0] + px * PX_PER_MI_DIAG, ORIGIN[1] - py * PX_PER_MI_DIAG) for px, py in pts], fill=255)
    runway = np.array(rw) > 127
    runway_zone = morph(runway, 17, "max")
    # pavement: the grey areas with the letters' holes closed, the runway zones
    pave = close_(grey | (black & morph(grey, 11, "max") & ~morph(runway_zone, 5, "max")), 9)
    pave = open_(pave, 5) | runway_zone
    # buildings: the black blobs that survive an opening (text, ticks and leader lines are thinner), off the runways
    bld = open_(black & ~morph(runway_zone, 9, "max"), 9)
    # drop small blobs (the filled dots of the circled markers): a coarse component size filter on a 1/4 grid
    small = mask_img(bld).resize((Wd // 4, Hd // 4), Image.BILINEAR)
    sm = np.array(small) > 60
    lab = np.zeros(sm.shape, dtype=np.int32)
    sizes = [0]
    cur = 0
    H4, W4 = sm.shape
    for y in range(H4):
        for x in range(W4):
            if sm[y, x] and lab[y, x] == 0:
                cur += 1
                stack = [(y, x)]
                lab[y, x] = cur
                n = 0
                while stack:
                    cy, cx = stack.pop()
                    n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < H4 and 0 <= xx < W4 and sm[yy, xx] and lab[yy, xx] == 0:
                            lab[yy, xx] = cur
                            stack.append((yy, xx))
                sizes.append(n)
    sizes = np.array(sizes)
    keep4 = sizes[lab] >= 40
    keep4[lab == 0] = False
    keep = np.array(mask_img(keep4).resize((Wd, Hd), Image.NEAREST)) > 127
    bld &= morph(keep, 9, "max")
    pave |= bld

    # resample to the texture grid: texture px (i, j) -> world miles -> diagram px
    T = N
    s = OHARE_FIELD_MI / T
    jj, ii = np.mgrid[0:T, 0:T]
    wx = FIELD_CX - OHARE_FIELD_MI / 2 + (ii + 0.5) * s
    wy = FIELD_CY + OHARE_FIELD_MI / 2 - (jj + 0.5) * s
    dx = ORIGIN[0] + wx * PX_PER_MI_DIAG
    dy = ORIGIN[1] - wy * PX_PER_MI_DIAG

    def sample(m):
        im = mask_img(m.astype(np.float64)).filter(ImageFilter.GaussianBlur(0.8))
        a = np.array(im).astype(np.float64) / 255
        xi = np.clip(dx, 0, Wd - 1.001)
        yi = np.clip(dy, 0, Hd - 1.001)
        x0 = np.floor(xi).astype(int)
        y0 = np.floor(yi).astype(int)
        fx = xi - x0
        fy = yi - y0
        out = a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy
        inside = (dx >= 95) & (dx < 1865) & (dy >= 470) & (dy < 2460)
        return out * inside

    P = sample(pave)
    B = sample(bld)
    R = sample(runway)
    # the airport's ground: the pavement grown by ~0.22 mi, feathered over ~0.18 mi (mowed grass round the field)
    prop = morph(pave, int(0.22 * PX_PER_MI_DIAG) | 1, "max")
    Pr = sample(prop)
    Pr = np.array(mask_img(Pr).filter(ImageFilter.GaussianBlur(0.09 / s))).astype(np.float64) / 255

    rng_n = tile_noise(T, 1.2, 31)
    hi_n = tile_noise(T, 0.3, 32)
    grass = hexrgb("#B4AB78")[None, None, :] * (1 + 0.025 * rng_n + 0.02 * hi_n)[:, :, None]
    # mowing stripes in the grass (E-W, the runways' way)
    stripe = (np.sin(jj * (2 * np.pi / 9.0)) > 0.3).astype(np.float64)
    grass *= (1 - 0.025 * stripe)[:, :, None]
    concrete = hexrgb("#D9CFBA")[None, None, :] * (1 + 0.018 * rng_n + 0.025 * hi_n)[:, :, None]
    runway_c = hexrgb("#E4DACA")[None, None, :] * (1 + 0.012 * hi_n)[:, :, None]
    roof = hexrgb("#ECE3D2")[None, None, :] * np.ones((T, T, 1))
    img = grass * (1 - P[:, :, None]) + concrete * P[:, :, None]
    img = img * (1 - R[:, :, None]) + runway_c * R[:, :, None]
    img = img * (1 - B[:, :, None]) + roof * B[:, :, None]
    alpha = np.clip(np.maximum(Pr, P), 0, 1)
    out = np.dstack([np.clip(img, 0, 255), alpha * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, "ohare-field.png"), optimize=True)
    print("ohare-field.png", out.shape, "pave", P.mean().round(3), "bld", B.mean().round(3))


# =================================================================================================================
# suburbs.jpg (tileable, 8 mi)
# =================================================================================================================
def bake_suburbs():
    TILE_MI = 8
    PX = N // TILE_MI  # 256 px / mi
    rng = np.random.default_rng(5)
    yy, xx = np.mgrid[0:N, 0:N]
    canopy = hexrgb("#7A764B")
    lawn = hexrgb("#A99F6C")
    roofc = [hexrgb(h) for h in ("#C8B9A0", "#B7A68D", "#D2C5AE", "#A99A84", "#C1AF95")]
    street = hexrgb("#C6B99E")
    arterial = hexrgb("#CFC2A6")
    comm = hexrgb("#CFC6B0")
    park = hexrgb("#959059")
    pond = hexrgb("#7E8C7E")
    lo = tile_noise(N, 1.8, 41)
    mid = tile_noise(N, 1.0, 42)
    hi = tile_noise(N, 0.2, 43)
    # base: lawns under a patchy canopy (more canopy in older blocks: low-frequency)
    can = np.clip(0.45 + 0.22 * lo + 0.18 * mid + 0.2 * hi, 0, 1)
    img = lawn[None, None, :] * (1 - can[:, :, None]) + canopy[None, None, :] * can[:, :, None]
    # zones from low-frequency noise (organic, never square): parks / golf / forest, industrial parks
    zp = tile_noise(N, 1.9, 45)
    zi = tile_noise(N, 1.9, 46)
    park_m = np.clip((zp - 1.15) / 0.25, 0, 1)
    ind_m = np.clip((zi - 1.25) / 0.2, 0, 1) * (1 - park_m)
    res_m = 1 - np.maximum(park_m, ind_m)
    # residential streets: every 1/8 mile N-S (32 px) and 1/16 mile E-W (16 px); houses along them
    st = (((xx % 32) < 1.4) | ((yy % 16) < 1.2)).astype(np.float64)
    house_n = tile_noise(N, 0.0, 44)
    row_pos = yy % 16
    col_pos = xx % 32
    lot = ((row_pos >= 3) & (row_pos <= 6) | (row_pos >= 9) & (row_pos <= 12)) & (col_pos % 6 >= 2) & (col_pos > 2) & (col_pos < 30)
    houses = (lot & (house_n > -0.4)).astype(np.float64)
    hcol = np.zeros((N, N, 3))
    pick = rng.integers(0, len(roofc), size=(N // 6 + 1, N // 8 + 1))
    for k, c in enumerate(roofc):
        sel = pick[(yy // 8) % pick.shape[0], (xx // 6) % pick.shape[1]] == k
        hcol[sel] = c
    hm = houses * 0.42 * res_m * (1 - 0.6 * can)
    img = img * (1 - hm[:, :, None]) + hcol * hm[:, :, None]
    sm = st * 0.3 * res_m * (1 - 0.5 * can)
    img = img * (1 - sm[:, :, None]) + street[None, None, :] * sm[:, :, None]
    # parks / golf / forest preserves: smooth green, tree clumps darker
    pkc = park[None, None, :] * (1 + 0.05 * mid)[:, :, None] * (1 - 0.18 * np.clip(hi, 0, 2)[:, :, None])
    img = img * (1 - park_m[:, :, None] * 0.45) + pkc * (park_m[:, :, None] * 0.45)
    # industrial parks: pale roofs on parking (soft)
    lotc = hexrgb("#B3AA8E")[None, None, :] * (1 + 0.03 * hi)[:, :, None]
    bh = np.sin((xx // 22) * 12.9898 + (yy // 18) * 78.233) * 43758.5453
    blocks = ((bh - np.floor(bh)) > 0.62).astype(np.float64) * 0.6
    indc = lotc * (1 - blocks[:, :, None]) + comm[None, None, :] * blocks[:, :, None]
    img = img * (1 - ind_m[:, :, None] * 0.35) + indc * (ind_m[:, :, None] * 0.35)
    # a few ponds in the parks
    for _ in range(10):
        cx, cy, R = rng.integers(0, N), rng.integers(0, N), rng.integers(6, 14)
        m = ((xx - cx) ** 2 + (yy - cy) ** 2 < R * R) & (park_m > 0.3)
        img[m] = img[m] * 0.3 + pond * 0.7
    # arterial grid every mile (3 px) with a soft commercial strip each side; half-mile collectors
    art = (((xx % PX) < 3) | ((yy % PX) < 3)).astype(np.float64)
    strip = ((((xx % PX) < 12) | ((xx % PX) > PX - 9) | ((yy % PX) < 12) | ((yy % PX) > PX - 9)) & (house_n > 0.3)).astype(np.float64) * (1 - art)
    img = img * (1 - 0.35 * strip[:, :, None]) + comm * (0.35 * strip[:, :, None])
    img = img * (1 - 0.5 * art[:, :, None]) + arterial * (0.5 * art[:, :, None])
    colr = (((((xx - PX // 2) % PX) < 2) | (((yy - PX // 2) % PX) < 2)).astype(np.float64)) * (1 - art)
    img = img * (1 - 0.25 * colr[:, :, None]) + arterial * (0.25 * colr[:, :, None])
    # tree canopy over everything residential (the speckle that breaks the grid up from the air)
    tree = np.clip((hi - 0.3) * 0.9, 0, 1) * (0.6 + 0.4 * can) * (1 - ind_m)
    img = img * (1 - 0.45 * tree[:, :, None]) + canopy * (0.45 * tree[:, :, None])
    # quiet the contrast toward the local mean (from the air the suburbs read as one warm, tree-speckled carpet)
    t3 = np.tile(np.clip(img, 0, 255).astype(np.uint8), (3, 3, 1))
    wide = np.array(Image.fromarray(t3).filter(ImageFilter.GaussianBlur(40))).astype(np.float64)[N : 2 * N, N : 2 * N]
    img = img * 0.55 + wide * 0.45
    img *= (1 + 0.025 * lo)[:, :, None]
    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img).save(os.path.join(OUT, "suburbs.jpg"), quality=90)
    print("suburbs.jpg", img.shape, img.reshape(-1, 3).mean(0).round(1))


# =================================================================================================================
# region.png (128 mi, centred on the terminal core)
# =================================================================================================================
def bake_region():
    REG_MI = 128
    RP = N / REG_MI  # 16 px / mi
    rng = np.random.default_rng(9)
    jj, ii = np.mgrid[0:N, 0:N]
    wx = (ii + 0.5) / RP - REG_MI / 2
    wy = REG_MI / 2 - (jj + 0.5) / RP
    lo = tile_noise(N, 2.2, 51)
    mid = tile_noise(N, 1.3, 52)
    rgba = np.zeros((N, N, 4))
    # the low-frequency wash (alpha ~0.2): warmer tans / cooler olives
    warm = hexrgb("#A99A68")
    cool = hexrgb("#727A4C")
    t = np.clip(0.5 + 0.35 * lo, 0, 1)[:, :, None]
    rgba[:, :, :3] = warm * t + cool * (1 - t)
    rgba[:, :, 3] = 0.2
    # farmland west of the Fox River: the section grid (16 px per mile), each section halves / quarters of corn,
    # soy, stubble; alpha ramps in from x -13 to -19 (the suburbs thin out past Elgin / St. Charles)
    farm_cols = [hexrgb(h) for h in ("#7F8A4C", "#8D9454", "#98A05A", "#B9A770", "#A89863", "#869050")]
    sec = np.zeros((N, N, 3))
    sx = np.floor(wx).astype(int)
    sy = np.floor(wy).astype(int)
    qx = (wx - sx) >= 0.5
    qy = (wy - sy) >= 0.5
    key = (sx * 73856093) ^ (sy * 19349663)
    k2 = (key + qx * 7 + qy * 13) % 9973
    split = (key % 3)
    idx = np.where(split == 0, key % 6, np.where(split == 1, (key + qx * 5) % 6, k2 % 6))
    for k, c in enumerate(farm_cols):
        sec[idx == k] = c
    sec *= (1 + 0.04 * mid)[:, :, None]
    roads = (np.abs(wx - np.round(wx)) < 0.06) | (np.abs(wy - np.round(wy)) < 0.06)
    sec[roads] = hexrgb("#CDBE98")
    farm_a = np.clip((-13 - wx) / 6, 0, 1) * 0.92
    # farmsteads' tree clumps: a dark speck at some section corners
    rgba[:, :, :3] = rgba[:, :, :3] * (1 - farm_a[:, :, None] / 0.92 * 0.0) * (1 - farm_a[:, :, None]) + sec * farm_a[:, :, None]
    rgba[:, :, 3] = np.maximum(rgba[:, :, 3], farm_a)
    # forest preserves: the Des Plaines River band east of the field (x ~ 2.2, winding N-S), Busse Woods (-5.5, 3.4)
    fp = np.zeros((N, N))
    river_x = 2.4 + 0.5 * np.sin(wy / 2.3) + 0.25 * np.sin(wy / 0.9 + 1)
    fp = np.maximum(fp, np.clip(1 - np.abs(wx - river_x) / 0.45, 0, 1) * (np.abs(wy) < 14))
    fp = np.maximum(fp, np.clip(1 - np.hypot((wx + 5.5) / 1.4, (wy - 3.4) / 1.1), 0, 1) * 1.6)
    fp = np.maximum(fp, np.clip(1 - np.hypot((wx + 9.5) / 1.2, (wy + 6.0) / 0.8), 0, 1) * 1.4)
    fp = np.clip(fp, 0, 1)
    fpc = hexrgb("#66703F") * (1 + 0.06 * mid)[:, :, None]
    a = fp * 0.32 * np.clip(0.6 + 0.6 * mid, 0, 1)
    rgba[:, :, :3] = rgba[:, :, :3] * (1 - a[:, :, None]) + fpc * a[:, :, None]
    rgba[:, :, 3] = np.maximum(rgba[:, :, 3], a)
    # Busse Lake (inside the woods)
    lake = np.hypot((wx + 5.3) / 0.55, (wy - 3.5) / 0.3) < 1
    rgba[lake, :3] = hexrgb("#7D8E84")
    rgba[lake, 3] = 0.9
    # Lake Michigan: east of the shore (x ~ 17 at the city, curving to x ~ 13 at the North Shore)
    shore = 17.5 - 4.5 * np.clip((wy - 0) / 20, 0, 1) + 1.5 * np.clip(-wy / 20, 0, 1)
    lm = np.clip((wx - shore) / 0.4, 0, 1)
    rgba[:, :, :3] = rgba[:, :, :3] * (1 - lm[:, :, None]) + hexrgb("#6F8C86") * lm[:, :, None]
    rgba[:, :, 3] = np.maximum(rgba[:, :, 3], lm * 0.95)
    out = np.clip(rgba * np.array([1, 1, 1, 255]), 0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, "region.png"), optimize=True)
    print("region.png", out.shape)


if __name__ == "__main__":
    bake_field()
    bake_suburbs()
    bake_region()
