#!/usr/bin/env python3
"""
Bake the rasters of UnderCerroGordo (generated/components/brent-death-count/UnderCerroGordo.tsx),
the photographic cut of the Brent "mine death count" clip: the 2005 photo of
Cerro Gordo turning into an X-RAY OF THE GROUND beneath it, with the mine
workings showing as soft light, and the 1897 newspaper item as a paper
clipping.

Inputs (already in public/minedeath/, nothing is downloaded):
  cerro_gordo_town_2005.jpg            2580 x 1720, the editor's still
  inyo_1897_fatal_accident_item.jpg    662 x 634, Inyo Independent, 16 Apr 1897

Outputs (public/minedeath/):
  ucg_photo.png       1152 x 1920, world x -36..1116, world y 0..1920: the photo
                      at the editor's framing (2880 x 1920 at x -39), resampled
                      once with Lanczos so frame 0 is not resampled again by the
                      browser. Lossless.
  ucg_world.jpg       1152 x 2500, world x -36..1116, world y 1200..3700: the
                      photo turning into its own X-ray, the ground and the
                      workings as ONE image. The component draws it over the
                      untouched photo and reveals its top with a rising mask.
  ucg_room_hot.png    the chamber of the 200 level at the peak of its swell:
                      its interior about 28 % brighter (highlights rolled off)
                      inside one clean, soft glow on the ground round it;
                      feathered RGBA crop that the component fades over the
                      world.
  ucg_clipping.png    the newspaper item as a paper clipping at 2x, with its
                      contact shadow, RGBA.

The underground is an X-ray, not painted rock (director's review, round 2; the
reference is a radiograph / a plaster cast of an ant colony): a dark, smooth,
quiet field in which a branching network of hollow passages shows as soft
light. numpy + PIL only, one seed, deterministic.
  1. THE GROUND: a warm charcoal-umber, 22 % brightness under the surface
     falling to 14 % at world y 3480 (the foot of the landed frame). No
     streaks, strata or bedding: only soft isotropic blotches (+-5 % at most),
     a gentle vignette toward the left and right edges, and the fine grain.
  2. THE HAND-OVER: over world y 1350 -> 1800 the photo turns into its own
     X-ray. It is cross-faded into a GHOST of itself: the ground's value
     modulated by the photo's local detail (luma over its own 14 px and 60 px
     low-pass, so shapes stay and broad light/dark bands do not), with 20 % of
     its colour. The ghost's strength then dies with depth and is zero on the
     photo's last rows, so the brush, the truck and the shed remain as dim
     shapes and there is no join, no band and no fog at y 1920.
  3. THE WORKINGS: capsule strokes (round joints) read through a slow domain
     warp so they wander, with a width and a brightness per vertex (brighter
     at junctions, dying toward dead ends), a little width noise, then
     feathered with a 6 px Gaussian and given a soft halo. Warm off-white added
     as light. Layout, 3.1 px per foot, surface = world y 1900:
       shaft        x 330, 22 px with a 9 px feather, plumb, the dimmest
                    member (about 45 %), its brightness breathing +-15 %
                    along its length; thins to a hair as it fades out upward
                    between y 2150 and 1950; runs down out of frame
       EVERY JUNCTION ON THE SHAFT IS A T ON ONE SIDE (right, left, right down
       its length), never a crossbar:
       200 level    y ~2520: starts at the shaft and runs RIGHT with a gentle
                    dip and one kink into THE CHAMBER (x 630-968, y 2397-2542):
                    a wide, low, irregular room standing on the drift's floor.
                    Its roof is an uneven low arch 95-143 px above the floor,
                    highest left of centre, coming down to the right in long
                    facets with blunt corners; small chips broken out of the
                    edge at irregular intervals, like rock, under a tighter
                    feather (3.2 px) so they survive; steep ragged end walls.
                    No peaks, no lobes, no pillar, no inset. Brighter where
                    the hollow is deeper. The brightest thing. Past it the
                    drift carries on as a short straight stub that dies
                    before the frame edge
       mid drift    y ~2900: leaves the shaft to the LEFT, about 290 px with a
                    gentle dip, dying out in rock before the frame edge (45 %)
       ore chimney  worked-out ground pitching ~65 deg overall from under the
                    room down-left to the 400 level: two steep ragged stopes
                    (34-74 px wide) set en echelon, joined by a short sloping
                    sub-level
       400 level    y ~3140 (55 %): from the foot of the lower stope (and a
                    little past it) to the shaft, where it ENDS
       dead ends    a raise and a winze off the 200 drift, a winze below the
                    mid drift, a raise above the 400 level, the sub-level's
                    stub. None hangs off the shaft, none off the chamber
     There are no timber ticks.
  4. One fine grain over everything drawn (matched to the photo's flat areas).

Usage:
  python3 scripts/clips/brent-death-count/bake-under-cerro-gordo.py [--debug DIR] [--only world|clipping]
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PUB = os.path.join(ROOT, "public", "minedeath")
PHOTO = os.path.join(PUB, "cerro_gordo_town_2005.jpg")
SCAN = os.path.join(PUB, "inyo_1897_fatal_accident_item.jpg")

SEED = 1897

# ---- the editor's framing ----
FRAME_W, FRAME_H = 1080, 1920
IMG_W, IMG_H = 2880, 1920
IMG_LEFT = -39

# ---- the baked world ----
MX = 36  # margin left and right of the frame, for the soft blur
W = FRAME_W + 2 * MX
B_TOP, B_BOT = 1200, 3700
H = B_BOT - B_TOP
PHOTO_END = 1920
LAND_TOP = 1560  # the landed frame shows world y 1560..3480 (200 level on screen y 960)

LUMA = np.array([0.299, 0.587, 0.114], dtype=np.float32)
UMBER = np.array([1.17, 0.96, 0.80], dtype=np.float32)  # warm charcoal-umber, luma 1

# ---- the ground ----
RAMP_Y0, RAMP_Y1 = 1350, 1800  # the photo turns into its X-ray over this ramp
GROUND_TOP, GROUND_BOT = 0.22, 0.14  # brightness under the surface / at world y 3480

# ---- the workings (world px) ----
SHAFT_X = 330
L200, L400 = 2520, 3140
ROOM_CX, ROOM_CY = 800, 2472  # the chamber's middle: where the clipping grows from
LIGHT = np.array([255, 245, 222], dtype=np.float32)  # warm off-white, what full light adds up to
GAIN = 0.52  # light of a stroke of brightness 1.0 (the 200 level's drift); leaves headroom for the swell
FEATHER = 6.0
ROOM_FEATHER = 3.2  # the chamber's edge: tighter, so the small bites of broken rock survive

# ---- room swell crop (world px) ----
HOT_X0, HOT_X1 = 420, 1116
HOT_Y0, HOT_Y1 = 2130, 2790
HOT_FEATHER = 70
SWELL = 0.34  # strength of the glow at the swell's peak (the chamber's interior about 28 % brighter)

# ---- clipping ----
PAD_L, PAD_R, PAD_T, PAD_B = 9, 5, 6, 6  # blank paper added round the scan, scan px
CLIP_SS = 2  # baked at 2x the scan
CLIP_PAD = 60  # transparent pad round the paper for the shadow, scan px
CREAM = np.array([0.975, 0.915, 0.79], dtype=np.float32)


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def gblur(a, sx, sy=None):
    """Gaussian blur (sigma in px) of a 2-D or 3-D float array, reflect-padded, via FFT."""
    if sy is None:
        sy = sx
    if sx <= 0 and sy <= 0:
        return a.astype(np.float32).copy()
    px = int(np.ceil(3 * sx)) + 1 if sx > 0 else 0
    py = int(np.ceil(3 * sy)) + 1 if sy > 0 else 0
    px = min(px, a.shape[1] - 1)
    py = min(py, a.shape[0] - 1)
    pad = ((py, py), (px, px)) + (((0, 0),) if a.ndim == 3 else ())
    p = np.pad(a, pad, mode="reflect")
    hh, ww = p.shape[:2]
    fy = np.fft.fftfreq(hh)[:, None]
    fx = np.fft.rfftfreq(ww)[None, :]
    k = np.exp(-2 * np.pi**2 * ((sx * fx) ** 2 + (sy * fy) ** 2))
    if a.ndim == 3:
        out = np.empty(p.shape, dtype=np.float32)
        for c in range(a.shape[2]):
            out[..., c] = np.fft.irfft2(np.fft.rfft2(p[..., c]) * k, s=(hh, ww))
    else:
        out = np.fft.irfft2(np.fft.rfft2(p) * k, s=(hh, ww)).astype(np.float32)
    return out[py : hh - py, px : ww - px].astype(np.float32)


def vnoise(rng, h, w, wy, wx):
    """Smooth value noise, unit std: white knots every (wy, wx) px, bicubic between."""
    gh = int(np.ceil(h / wy)) + 3
    gw = int(np.ceil(w / wx)) + 3
    g = rng.standard_normal((gh, gw)).astype(np.float32)
    a = resize_f(g, int(np.ceil(gw * wx)), int(np.ceil(gh * wy)))
    oy, ox = int(wy), int(wx)
    a = a[oy : oy + h, ox : ox + w]
    return (a / max(float(a.std()), 1e-6)).astype(np.float32)


def fbm(rng, h, w, wy, wx, octaves=4, gain=0.55):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for i in range(octaves):
        out += amp * vnoise(rng, h, w, max(wy / 2**i, 1.6), max(wx / 2**i, 1.6))
        tot += amp * amp
        amp *= gain
    return out / np.sqrt(tot)


def to_img(a):
    return Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8))


def luma(a):
    return (a[..., 0] * LUMA[0] + a[..., 1] * LUMA[1] + a[..., 2] * LUMA[2]).astype(np.float32)


def resize_f(a, w, h):
    """Bicubic resize of a 2-D float array."""
    return np.asarray(Image.fromarray(np.ascontiguousarray(a, dtype=np.float32)).resize((w, h), Image.BICUBIC))


# --------------------------------------------------------------------------
# the world
# --------------------------------------------------------------------------
# strokes: (x, y, width, brightness) per vertex; brightness 1.0 = the 200 level's drift at the shaft
# the shaft: plumb, the dimmest member, with a wider feather than the rest. It thins to a hair as it fades
# out upward (y 2150 -> 1950) and its brightness breathes slowly along its length (see SHAFT_BREATH)
SHAFT = [(SHAFT_X, 1946, 5, 0.0), (SHAFT_X, 2040, 10, 0.24), (SHAFT_X, 2150, 22, 0.52), (SHAFT_X, 2900, 22, 0.52), (SHAFT_X, 3760, 22, 0.48)]
SHAFT_FEATHER = 9.0
SHAFT_BREATH = 0.15  # +-15 %, a swing every 200-320 px
# EVERY JUNCTION ON THE SHAFT IS A T ON ONE SIDE (never a crossbar: a "+" on a vertical line is a grave
# marker): the 200 level leaves it to the right, the mid drift to the left, the 400 level to the right.
# the 200 level: starts at the shaft and runs right with a gentle dip and one kink, ending in the room
LEVEL_200 = [(336, 2512, 30, 0.95), (410, 2515, 27, 0.84), (486, 2518, 30, 0.86), (566, 2523, 32, 0.92), (660, 2521, 30, 1.0)]
# the mid drift: leaves the shaft to the LEFT between the levels, about 290 px with a gentle dip, dying
# out in rock before the frame edge; about 45 %. At y 2900, a step BELOW the sub-level on the other side
# (at 2850 the two lined up into one broken bar across the shaft)
MID_DRIFT = [(324, 2900, 24, 0.46), (256, 2902, 26, 0.48), (176, 2906, 25, 0.45), (104, 2907, 23, 0.36), (58, 2909, 20, 0.20), (34, 2910, 17, 0.06)]
# the chamber: a wide, LOW, irregular room in the rock above the drift (x 630-968, about 340 px). It stands
# on the drift's own floor (the tunnel's floor runs straight through it, with a slight sag) and rises
# above it. Its roof is an uneven low arch, 95 to 143 px above the floor: highest left of centre, coming
# down toward the right end in two long facets with one slight, broad second swell between them. Every
# corner along the roof is blunt (none sharper than ~125 deg). Steep, slightly ragged end walls.
# What it must NOT be, each from a rejected version: peaks, spikes or notches (five sharp peaks on a flat
# base, glowing, read as FLAMES, a crown, a mountain skyline; the accident was a cave-in, not a fire);
# steps (a tall box beside a lower one read as a truck); two round lobes (a cumulus, a loaf); a dome on
# the stope's stalk (a mushroom cloud); a pillar or any dark inset (a window, an eye, a figure).
# These points are the big shape, cut in long straight FACETS; chipped() then breaks small angular bites
# (4-9 px) out of it at irregular intervals, like broken rock: not a smooth curve and not teeth.
ROOM_ROOF = [
    (636, 2537), (630, 2508), (637, 2478), (630, 2452), (636, 2430), (670, 2405),
    (730, 2397), (796, 2413), (858, 2410), (926, 2428), (954, 2446), (966, 2476),
    (960, 2504), (968, 2520), (966, 2537),
]
ROOM_FLOOR = [(920, 2539), (860, 2541), (800, 2542), (740, 2542), (690, 2540), (656, 2538)]  # right to left
ROOM_B = 1.12
# the drift carries on past the chamber as a short STRAIGHT stub (about 85 px) that narrows a little and dies
# out in rock before the frame edge: a tunnel that stops, not a point (a point read as a tail)
STUB_200 = [(962, 2523, 30, 1.0), (1006, 2523, 28, 0.70), (1040, 2524, 25, 0.36), (1064, 2524, 21, 0.05)]
# the ore chimney: worked-out ground pitching ~65 deg overall from under the room down-left to the 400
# level, as Cerro Gordo's chimneys were stoped: two steep, ragged stopes set en echelon, joined by a short
# sloping sub-level. Wide and narrow by turns, about as dim as the 400 level, its light uneven
UPPER_STOPE = [(772, 2548, 36, 0.60), (768, 2612, 34, 0.52), (750, 2668, 66, 0.52), (736, 2722, 44, 0.48), (716, 2778, 56, 0.48), (704, 2824, 38, 0.46)]
SUB_LEVEL = [(806, 2824, 18, 0.16), (762, 2832, 20, 0.36), (700, 2842, 24, 0.46), (640, 2862, 24, 0.44), (590, 2882, 26, 0.46)]
LOWER_STOPE = [(590, 2882, 50, 0.48), (574, 2940, 70, 0.50), (552, 2996, 50, 0.46), (534, 3050, 74, 0.50), (512, 3100, 54, 0.48), (496, 3144, 46, 0.50)]
# the 400 level: from the foot of the lower stope (and a little past it on the right) to the shaft, where
# it ENDS; nothing leaves the shaft to the left at this depth
LEVEL_400 = [(336, 3143, 28, 0.60), (406, 3149, 27, 0.55), (488, 3146, 30, 0.58), (540, 3153, 24, 0.44), (592, 3158, 22, 0.34), (630, 3164, 20, 0.14)]
# dead ends at odd angles, dimmer, blunt. They make it a network: none of them hangs off the shaft
DEAD_ENDS = [
    [(486, 2518, 18, 0.50), (498, 2470, 18, 0.42), (516, 2428, 17, 0.28)],  # a raise above the 200 drift
    [(410, 2515, 18, 0.50), (436, 2562, 18, 0.40), (452, 2608, 16, 0.24)],  # a winze below it
    [(250, 2902, 18, 0.42), (238, 2946, 18, 0.34), (220, 2988, 17, 0.22)],  # a winze below the mid drift (was below the 400 level's left arm)
    [(592, 3158, 18, 0.34), (616, 3116, 17, 0.28), (620, 3074, 15, 0.14)],  # a raise off the 400 level's right arm
]


def chipped(pts, seed):
    """Chip a polyline like broken rock: small angular bites, 8-16 px wide and 4-9 px deep, at irregular
    intervals of 22-60 px along it; two in three are nubs of rock standing into the cavity, the rest small
    pockets broken out of the wall. Irregular and sparse on purpose: evenly spaced bumps under the X-ray
    feather become the scalloped edge of a cloud. Its own generator, so nothing else changes."""
    r = np.random.default_rng(seed)
    out = [pts[0]]
    gap = r.uniform(10, 30)  # distance to the next bite, carried over the corners
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        ln = float(np.hypot(bx - ax, by - ay))
        ux, uy = (bx - ax) / ln, (by - ay) / ln
        nx, ny = -uy, ux  # INTO the cavity (the outline runs clockwise on screen)
        pos = 0.0
        while True:
            w = r.uniform(8, 16)
            c = pos + gap + w / 2
            if c + w / 2 + 4 > ln:
                gap = max(6.0, gap - (ln - pos))
                break
            depth = r.uniform(4, 9) * (1 if r.uniform() < 0.66 else -1)
            skew = r.uniform(-0.3, 0.3) * w
            out.append((ax + ux * (c - w / 2), ay + uy * (c - w / 2)))
            out.append((ax + ux * (c + skew) + nx * depth, ay + uy * (c + skew) + ny * depth))
            out.append((ax + ux * (c + w / 2), ay + uy * (c + w / 2)))
            pos = c + w / 2
            gap = r.uniform(22, 60)
        out.append((bx, by))
    return out


def bake_world(debug):
    rng = np.random.default_rng(SEED)
    ph = Image.open(PHOTO).convert("RGB").resize((IMG_W, IMG_H), Image.LANCZOS)
    x0 = -IMG_LEFT - MX
    ph.crop((x0, 0, x0 + W, IMG_H)).save(os.path.join(PUB, "ucg_photo.png"), optimize=True)
    P = np.asarray(ph.crop((x0, 0, x0 + W, IMG_H))).astype(np.float32)  # world x -36..1116

    ys = np.arange(B_TOP, B_BOT, dtype=np.float32)
    X = np.broadcast_to(np.arange(-MX, FRAME_W + MX, dtype=np.float32)[None, :], (H, W))
    Y = np.broadcast_to(ys[:, None], (H, W))

    # ---- 1. the ground: dark, calm, warm
    v = np.interp(ys, [B_TOP, 1900, LAND_TOP + FRAME_H, B_BOT], [GROUND_TOP, GROUND_TOP, GROUND_BOT, GROUND_BOT - 0.012])
    mott = np.clip(0.024 * fbm(rng, H, W, 520, 520, octaves=3, gain=0.5), -0.05, 0.05)
    vig = 1 - 0.20 * (np.abs(X - FRAME_W / 2) / (FRAME_W / 2 + MX)) ** 2.2 * smoothstep((ys - 1500) / 500.0)[:, None]
    g_l = (255.0 * v)[:, None] * (1 + mott) * vig  # the ground's luma
    world = g_l[..., None] * UMBER[None, None, :]

    # ---- 2. the photo turns into its own X-ray
    n_p = PHOTO_END - B_TOP
    yp = ys[:n_p]
    Pp = P[B_TOP:PHOTO_END]
    lum = luma(Pp)
    lp14 = np.maximum(gblur(lum, 14.0), 1.0)
    lp60 = np.maximum(gblur(lum, 60.0), 1.0)
    k = (0.85 * (1 - smoothstep((yp - 1700) / (1916 - 1700.0))))[:, None]  # the ghost dies with depth
    ghost_l = g_l[:n_p] * np.clip(lum / lp14, 0.45, 1.9) ** k * np.clip(lp14 / lp60, 0.6, 1.6) ** (0.45 * k)
    chroma = (Pp - lum[..., None]) * (0.2 * (k / 0.85) * g_l[:n_p] / lp14)[..., None]  # 20 % of its colour
    ghost = ghost_l[..., None] * UMBER[None, None, :] + chroma
    r = 1 - (1 - smoothstep((yp - RAMP_Y0) / float(RAMP_Y1 - RAMP_Y0))) ** 2.0
    world[:n_p] = Pp + (ghost - Pp) * r[:, None, None]
    drawn = np.ones(H, np.float32)
    drawn[:n_p] = r  # how much of each row is ours (for the grain)

    # ---- 3. the workings, as light
    wx = 8.0 * vnoise(rng, H, W, 200, 200) + 3.0 * vnoise(rng, H, W, 60, 60)
    wy = 8.0 * vnoise(rng, H, W, 200, 200) + 3.0 * vnoise(rng, H, W, 60, 60)
    wvar = vnoise(rng, H, W, 70, 70)
    wrag = 0.7 * vnoise(rng, H, W, 40, 40) + 0.5 * vnoise(rng, H, W, 16, 16)

    def stroke(L, pts, warp=1.0, var=0.13, rag=0.0):
        for (ax, ay, aw, ab), (bx, by, bw, bb) in zip(pts[:-1], pts[1:]):
            pad = max(aw, bw) * 0.8 + 16
            xa, xb = int(max(min(ax, bx) - pad + MX, 0)), int(min(max(ax, bx) + pad + MX, W))
            ya, yb = int(max(min(ay, by) - pad - B_TOP, 0)), int(min(max(ay, by) + pad - B_TOP, H))
            if xb <= xa or yb <= ya:
                continue
            sl = (slice(ya, yb), slice(xa, xb))
            U = X[sl] + warp * wx[sl]
            V = Y[sl] + warp * wy[sl]
            dx, dy = bx - ax, by - ay
            t = np.clip(((U - ax) * dx + (V - ay) * dy) / (dx * dx + dy * dy), 0, 1)
            dist = np.hypot(U - (ax + t * dx), V - (ay + t * dy))
            hw = (aw + (bw - aw) * t) / 2 * (1 + var * wvar[sl] + rag * wrag[sl])
            L[sl] = np.maximum(L[sl], np.clip(hw - dist + 0.5, 0, 1) * (ab + (bb - ab) * t))

    def polygon(pts, rough, pre=1.1):
        """A hand-cut polygon as a 0..1 mask on the world grid. The noise tears its edge by about
        +-(rough x 2.5 x pre) px; corners are eased by about `pre` px."""
        ss = 4
        im = Image.new("L", (W * ss, H * ss), 0)
        ImageDraw.Draw(im).polygon([((px + MX) * ss, (py - B_TOP) * ss) for px, py in pts], fill=255)
        m = np.asarray(im.resize((W, H), Image.BOX)).astype(np.float32) / 255.0
        m = gblur(m, pre)
        m = m + rough * (0.6 * wrag + 0.5 * wvar) * 4 * m * (1 - m)  # only at the edge: no islands of noise
        return np.clip((m - 0.5) * 3.0 * max(pre, 1.0) + 0.5, 0, 1)

    L = np.zeros((H, W), np.float32)
    # the chimney first, under everything: ragged edges, uneven light
    stroke(L, UPPER_STOPE, var=0.12, rag=0.26)
    stroke(L, LOWER_STOPE, var=0.12, rag=0.26)
    L *= 1 + 0.16 * vnoise(rng, H, W, 44, 44)
    Lt = np.zeros((H, W), np.float32)
    for pts in [LEVEL_200, LEVEL_400, MID_DRIFT, SUB_LEVEL] + DEAD_ENDS:
        stroke(Lt, pts)
    stroke(Lt, STUB_200, warp=0.25, var=0.05)  # straight
    # T junctions: what leaves the shaft to the right ends inside it and never shows on its left side, and
    # the other way round for the mid drift (the domain warp may not push an end through the shaft)
    for pts, side in ((LEVEL_200, 1), (LEVEL_400, 1), (MID_DRIFT, -1)):
        jy = pts[0][1]
        win = (slice(int(jy - 60 - B_TOP), int(jy + 60 - B_TOP)), slice(SHAFT_X - 70 + MX, SHAFT_X + 70 + MX))  # only at the junction
        Lt[win] *= smoothstep((side * (X[win] - SHAFT_X) + 3.0) / 6.0)
    L = np.maximum(L, Lt * (1 + 0.07 * vnoise(rng, H, W, 60, 60)))
    # the shaft: its own layer (wider feather), breathing slowly along its length: two slow waves that
    # never fall into step (periods 640 and 410 px, so a swing every 200-320 px), +-15 % together. No
    # random numbers are drawn for it, so nothing else in the picture changes with it
    Ls = np.zeros((H, W), np.float32)
    stroke(Ls, SHAFT, warp=0.15, var=0.06)
    breath = 0.62 * np.sin(2 * np.pi * ys / 640.0 + 1.1) + 0.38 * np.sin(2 * np.pi * ys / 410.0 + 4.0)
    Ls *= (1 + SHAFT_BREATH * breath)[:, None]
    soft_shaft = gblur(Ls, SHAFT_FEATHER)
    room = polygon(chipped(ROOM_ROOF, SEED + 11) + ROOM_FLOOR, 0.03, pre=0.8)
    # an X-ray is brighter where the hollow is deeper: the narrow peaks of the roof are a little dimmer
    # than the body of the cavern (down to ~75 % at their tips), so it is a hollow, not a cut-out
    thick = np.clip((gblur(room, 20.0) - 0.30) / 0.55, 0, 1)
    room_l = room * (0.72 + 0.28 * thick) * (1 + 0.05 * vnoise(rng, H, W, 70, 70))
    L_base = np.maximum(L * (1 - room), ROOM_B * room_l)  # everything but the shaft

    # the chamber's own edge has a tighter feather inside (so its small bites survive) under the same soft
    # skirt as everything else outside
    soft_room = gblur(ROOM_B * room_l, ROOM_FEATHER)

    def light_of(Lf):
        soft = np.maximum(np.maximum(gblur(Lf, FEATHER), soft_shaft), soft_room)
        Lall = np.maximum(Lf, Ls)
        return GAIN * (soft + 0.16 * gblur(Lall, 26.0) + 0.08 * gblur(Lall, 70.0))

    def shoulder(a, knee=0.85):
        """Soft roll-off of the highlights: straight below the knee, never reaching 1 above it."""
        return np.where(a > knee, knee + (1 - knee) * (1 - np.exp(-(np.maximum(a, knee) - knee) / (1 - knee))), a)

    A = np.clip(light_of(L_base), 0, 1)
    out = world + (LIGHT[None, None, :] - world) * A[..., None]

    # the swell: a glow centred on the chamber, added as light and rolled off at the top. It is a heavily
    # blurred copy of the chamber (sigma 45 and 95 px), so it is one clean soft falloff with no edge of
    # its own, and because it is ADDED the chamber's jagged roof keeps all its contrast at the peak
    glow = SWELL * (0.6 * gblur(room, 45.0) + 0.4 * gblur(room, 95.0))
    A_hot = np.clip(shoulder(light_of(L_base) + glow), 0, 1)
    out_hot = world + (LIGHT[None, None, :] - world) * A_hot[..., None]

    # ---- 4. one grain over everything drawn
    g1 = gblur(rng.standard_normal((H, W)).astype(np.float32), 0.75)
    g2 = gblur(rng.standard_normal((H, W)).astype(np.float32), 2.2)
    grain = (1.4 * g1 / g1.std() + 1.0 * g2 / g2.std())[..., None]
    chroma_n = gblur(rng.standard_normal((H, W, 3)).astype(np.float32), 3.0)
    chroma_n = 0.7 * chroma_n / chroma_n.std()
    chroma_n -= chroma_n.mean(axis=2, keepdims=True)
    noise = (grain + chroma_n) * drawn[:, None, None]
    final = out + noise
    final_hot = out_hot + noise

    to_img(final).save(os.path.join(PUB, "ucg_world.jpg"), quality=94, subsampling=0, optimize=True)

    # hot crop with a feathered alpha
    cx0, cx1 = HOT_X0 + MX, HOT_X1 + MX
    cy0, cy1 = HOT_Y0 - B_TOP, HOT_Y1 - B_TOP
    hw_, hh_ = cx1 - cx0, cy1 - cy0
    fx = np.minimum(np.arange(hw_) + 0.5, hw_ - np.arange(hw_) - 0.5) / HOT_FEATHER
    fy = np.minimum(np.arange(hh_) + 0.5, hh_ - np.arange(hh_) - 0.5) / HOT_FEATHER
    fx[hw_ // 2 :] = 1.0  # the crop runs to the world's right edge: no feather on that side
    alpha = smoothstep(fy)[:, None] * smoothstep(fx)[None, :]
    hot = np.dstack([np.clip(final_hot[cy0:cy1, cx0:cx1] + 0.5, 0, 255), alpha * 255]).astype(np.uint8)
    Image.fromarray(hot).save(os.path.join(PUB, "ucg_room_hot.png"), optimize=True)

    if debug:
        o = LAND_TOP - B_TOP
        land = final[o : o + FRAME_H, MX : MX + FRAME_W]
        to_img(land).save(os.path.join(debug, "landed.png"))
        to_img(land).resize((270, 480), Image.LANCZOS).save(os.path.join(debug, "landed_270.png"))
        land_hot = land.copy()
        a = alpha[:, : FRAME_W - HOT_X0, None]
        land_hot[cy0 - o : cy1 - o, HOT_X0:FRAME_W] = land[cy0 - o : cy1 - o, HOT_X0:FRAME_W] * (1 - a) + final_hot[cy0:cy1, cx0 : MX + FRAME_W] * a
        for nm, im_ in (("chamber", land), ("chamber_hot", land_hot)):
            c = im_[760 - 4 : 1090 - 4, 540:1080]  # the director's crop (at f32 the camera is 4 px short of 1560)
            to_img(c).save(os.path.join(debug, nm + ".png"))
            to_img(c).resize((c.shape[1] // 4, c.shape[0] // 4), Image.LANCZOS).save(os.path.join(debug, nm + "_270.png"))
        to_img(land_hot).save(os.path.join(debug, "landed_hot.png"))
        whole = np.concatenate([P[:B_TOP, MX : MX + FRAME_W], final[:, MX : MX + FRAME_W]], axis=0)
        to_img(whole).save(os.path.join(debug, "world_whole.jpg"), quality=90)
        Lf = luma(final)
        for yy in (1560, 1700, 1800, 1920, 2100, 2700, 3000, 3300, 3470):
            row = Lf[yy - B_TOP, MX + 860 : MX + 1040]
            print(f"  ground at y {yy} (x 860-1040): luma {row.mean():.1f} = {row.mean() / 2.55:.1f} %   rgb {final[yy - B_TOP, MX + 860 : MX + 1040].mean(axis=0).round(0)}")

        def at(name, x, y, rr=16):
            print(f"  {name}: luma {gblur(Lf[y - B_TOP - 40 : y - B_TOP + 40, x + MX - 40 : x + MX + 40], 2.0)[40 - rr : 40 + rr, 40 - rr : 40 + rr].max():.0f}")

        for yy in (2000, 2250, 3400):
            print(f"  ground at y {yy}, centre (x 500-620): {Lf[yy - B_TOP - 20 : yy - B_TOP + 20, MX + 500 : MX + 620].mean() / 2.55:.1f} %")

        gl = Lf[2590 - B_TOP : 2630 - B_TOP, 880 + MX : 1000 + MX].mean()
        Lh = luma(final_hot)
        ri, rh = Lf[2460 - B_TOP : 2520 - B_TOP, 700 + MX : 900 + MX], Lh[2460 - B_TOP : 2520 - B_TOP, 700 + MX : 900 + MX]
        print(f"  chamber interior: luma {ri.mean():.0f} at rest, {rh.mean():.0f} at the peak (max {rh.max():.0f}) = +{100 * ((rh.mean() - gl) / (ri.mean() - gl) - 1):.0f} % over the ground ({gl:.0f})")
        at("200 drift", 500, 2519)
        at("upper stope", 742, 2712, 8)
        at("lower stope", 556, 2990, 8)
        at("400 level", 406, 3149)
        at("mid drift", 200, 2905)
        for yy in (2300, 2700, 3000, 3300):
            at(f"shaft at y {yy}", 330, yy, 6)
        print(f"  glow 40 px above the roof: {Lh[2355 - B_TOP : 2365 - B_TOP, 710 + MX : 760 + MX].mean():.0f} (rest {Lf[2355 - B_TOP : 2365 - B_TOP, 710 + MX : 760 + MX].mean():.0f})")
    print(f"world: {W} x {H} (world x {-MX}..{FRAME_W + MX}, y {B_TOP}..{B_BOT}); room hot: {hw_} x {hh_} at world ({HOT_X0}, {HOT_Y0})")


# --------------------------------------------------------------------------
# the clipping
# --------------------------------------------------------------------------
def bake_clipping(debug):
    rng = np.random.default_rng(SEED + 1)
    scan = Image.open(SCAN).convert("L")
    sw, sh = scan.size
    pw, ph_ = sw + PAD_L + PAD_R, sh + PAD_T + PAD_B
    # blank paper round the scan: its own edge pixels drawn outward, so there is no seam
    paper = Image.fromarray(np.pad(np.asarray(scan), ((PAD_T, PAD_B), (PAD_L, PAD_R)), mode="edge"))
    S = CLIP_SS
    big = paper.resize((pw * S, ph_ * S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    g = np.asarray(big).astype(np.float32) / 255.0
    Hc, Wc = g.shape
    # a hair of contrast: ink toward black, paper held just under white
    g = np.clip((g - 0.04) * (0.93 / (0.882 - 0.04)), 0, 0.965)

    # the scissor cut: a few straight snips per side, corners not square
    def knots(nk, lo, hi):
        return [rng.uniform(lo, hi) for _ in range(nk)]

    top = knots(4, 2.0 * S / 2, 9.0 * S / 2)
    bot = knots(4, 2.0 * S / 2, 9.0 * S / 2)
    lef = knots(5, 3.0 * S / 2, 12.0 * S / 2)
    rig = knots(5, 2.0 * S / 2, 7.0 * S / 2)
    fx = [0.0, 0.31, 0.62, 1.0]
    fy = [0.0, 0.22, 0.49, 0.77, 1.0]
    pts = []
    pts += [(lef[0] if i == 0 else (Wc - rig[0] if i == 3 else fx[i] * Wc), top[i]) for i in range(4)]
    pts += [(Wc - rig[i], fy[i] * Hc) for i in range(1, 4)]
    pts += [(Wc - rig[4] if i == 3 else (lef[4] if i == 0 else fx[i] * Wc), Hc - bot[i]) for i in range(3, -1, -1)]
    pts += [(lef[i], fy[i] * Hc) for i in range(3, 0, -1)]
    SSA = 4
    am = Image.new("L", (Wc * SSA, Hc * SSA), 0)
    ImageDraw.Draw(am).polygon([(x * SSA, y * SSA) for x, y in pts], fill=255)
    alpha = np.asarray(am.resize((Wc, Hc), Image.BOX)).astype(np.float32) / 255.0
    alpha = gblur(alpha, 0.7)

    # aged, uneven toning; a touch darker and yellower toward the cut
    tone = 1 + 0.02 * vnoise(rng, Hc, Wc, 260, 260) + 0.008 * vnoise(rng, Hc, Wc, 40, 40)
    near = gblur(alpha, 14.0)
    edge = np.clip((1 - near) * 2.0, 0, 1)  # 0 inside, ~1 at the cut
    rgb = g[..., None] * CREAM[None, None, :] * tone[..., None]
    rgb = rgb * (1 - edge[..., None] * np.array([0.05, 0.065, 0.11], dtype=np.float32))

    # the same grain as the picture (sized for the ~0.73x display scale)
    g1 = gblur(rng.standard_normal((Hc, Wc)).astype(np.float32), 1.0)
    g2 = gblur(rng.standard_normal((Hc, Wc)).astype(np.float32), 3.0)
    grain = (1.7 * g1 / g1.std() + 1.25 * g2 / g2.std()) / 255.0
    chroma = gblur(rng.standard_normal((Hc, Wc, 3)).astype(np.float32), 4.0)
    chroma = 0.8 * chroma / chroma.std() / 255.0
    chroma -= chroma.mean(axis=2, keepdims=True)
    rgb = np.clip(rgb + grain[..., None] + chroma, 0, 1)

    # contact shadow: a tight dark seat and a soft low penumbra, warm-dark
    P_ = CLIP_PAD * S
    Wt, Ht = Wc + 2 * P_, Hc + 2 * P_
    a_full = np.zeros((Ht, Wt), np.float32)
    a_full[P_ : P_ + Hc, P_ : P_ + Wc] = alpha

    def shifted(a, dy):
        out = np.zeros_like(a)
        out[dy:] = a[:-dy]
        return out

    sh1 = 0.46 * gblur(shifted(a_full, 9 * S), 13.0 * S)
    sh2 = 0.40 * gblur(shifted(a_full, 2 * S), 2.6 * S)
    sha = 1 - (1 - sh1) * (1 - sh2)
    shadow_rgb = np.array([22, 14, 9], dtype=np.float32) / 255.0
    rgb_full = np.zeros((Ht, Wt, 3), np.float32)
    rgb_full[P_ : P_ + Hc, P_ : P_ + Wc] = rgb
    out_a = a_full + sha * (1 - a_full)
    out_rgb = (rgb_full * a_full[..., None] + shadow_rgb[None, None, :] * (sha * (1 - a_full))[..., None]) / np.maximum(out_a, 1e-4)[..., None]
    rgba = np.dstack([np.clip(out_rgb * 255 + 0.5, 0, 255), np.clip(out_a * 255 + 0.5, 0, 255)]).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(PUB, "ucg_clipping.png"), optimize=True)
    if debug:
        bg = Image.new("RGBA", (Wt, Ht), (58, 44, 33, 255))
        bg.alpha_composite(Image.fromarray(rgba))
        bg.convert("RGB").save(os.path.join(debug, "clipping_on_dark.png"))
    print(f"clipping: paper {pw} x {ph_} scan px (scan at {PAD_L},{PAD_T}), png {Wt} x {Ht} at {S}x with a {CLIP_PAD} px pad")


def main():
    debug = None
    if "--debug" in sys.argv:
        debug = sys.argv[sys.argv.index("--debug") + 1]
        os.makedirs(debug, exist_ok=True)
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    if only in (None, "world"):
        bake_world(debug)
    if only in (None, "clipping"):
        bake_clipping(debug)


if __name__ == "__main__":
    main()
