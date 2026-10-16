#!/usr/bin/env python3
"""
Bake the static textures of the Ulysses underwater world (generated/components/kits/cheeky-pint/oceanShared.tsx).
Everything is procedural (numpy + PIL, fixed seeds, deterministic); nothing is downloaded.

Outputs (public/ulysses/), every one TILEABLE in both directions (built in the Fourier domain or
on integer wave vectors, so a tile's right edge continues into its left edge):

  seabed.jpg     2048 x 2048  silty sand seen from above: ripples (crests along x, so in a
                              grazing view they read as bands that tighten toward the horizon),
                              low patches of darker silt, a scatter of shell grit and pebbles,
                              lit from above. Colour = albedo x light; the component fogs it.
                              Texture x = lateral, texture y = depth (the plane's own axes).
  caustics.png   1024 x 1024  grey caustic network (photon-mapped through a tileable wave
                              height field): screen-blended over the seabed / tops of objects
                              near the surface, two copies drifting apart.
  surface.jpg    1024 x 1024  the sea surface seen from below, as a neutral luminance map
                              centred on mid grey: flat facets bright (Snell's window), tilted
                              facets darker (they reflect the water). The component hard-lights
                              two drifting copies over its own surface colour.

Run:  python3 scripts/textures/bake-ulysses-ocean.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "ulysses")
os.makedirs(OUT, exist_ok=True)


def spectral_noise(n, beta, seed, lo=1.0, hi=None, aniso=None):
    """Tileable n x n noise with a 1/f^beta amplitude spectrum, band-limited [lo, hi] cycles per
    tile. `aniso` = (angle_rad, ratio): stretch the spectrum (ratio > 1 = longer along angle)."""
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((n, n))
    F = np.fft.fft2(white)
    fy = np.fft.fftfreq(n) * n
    fx = np.fft.fftfreq(n) * n
    FX, FY = np.meshgrid(fx, fy)
    if aniso is not None:
        a, r = aniso
        u = FX * np.cos(a) + FY * np.sin(a)
        v = -FX * np.sin(a) + FY * np.cos(a)
        f = np.sqrt((u * r) ** 2 + (v / r) ** 2)
    else:
        f = np.sqrt(FX**2 + FY**2)
    amp = np.zeros_like(f)
    m = f >= lo
    if hi is not None:
        m &= f <= hi
    amp[m] = 1.0 / np.power(f[m], beta)
    out = np.real(np.fft.ifft2(F * amp))
    out -= out.mean()
    out /= out.std() + 1e-9
    return out


def grad(h):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    return gx, gy


def blur_wrap(img, sigma):
    """Gaussian blur with wrap-around (tileable), via FFT."""
    n0, n1 = img.shape[:2]
    fy = np.fft.fftfreq(n0)
    fx = np.fft.fftfreq(n1)
    FX, FY = np.meshgrid(fx, fy)
    g = np.exp(-2 * (np.pi**2) * (sigma**2) * (FX**2 + FY**2))
    if img.ndim == 2:
        return np.real(np.fft.ifft2(np.fft.fft2(img) * g))
    return np.stack([np.real(np.fft.ifft2(np.fft.fft2(img[..., c]) * g)) for c in range(img.shape[2])], -1)


def hex_rgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float64) / 255.0


def ramp(t, stops):
    """Map t (0..1 array) through colour stops [(pos, '#rrggbb'), ...] -> H x W x 3."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,))
    pos = [p for p, _ in stops]
    cols = [hex_rgb(c) for _, c in stops]
    for c in range(3):
        out[..., c] = np.interp(t, pos, [col[c] for col in cols])
    return out


def save_rgb(arr, name, q=92):
    im = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8))
    im.save(os.path.join(OUT, name), quality=q, subsampling=0)
    print("wrote", name, im.size)


def save_l(arr, name):
    im = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8))
    im.save(os.path.join(OUT, name))
    print("wrote", name, im.size)


# ---------------------------------------------------------------------------------------------
# 1. SEABED
# ---------------------------------------------------------------------------------------------
def bake_seabed():
    n = 2048
    yy, xx = np.mgrid[0:n, 0:n] / n  # 0..1 tile coords
    # ripple crests run along x (wave vector mostly along y), warped by a tileable field so they
    # bend, fork and fade; integer cycles keep the tile seamless
    warp = spectral_noise(n, 2.2, 11, lo=1, hi=24) * 0.055 + spectral_noise(n, 1.6, 12, lo=4, hi=60) * 0.012
    phase = 2 * np.pi * (14 * yy + 2 * xx + warp * 14)
    s = (np.sin(phase) + 1) * 0.5
    ripple = np.power(s, 1.6) - 0.35 * np.power(s, 6)  # sharper crest, soft lee side
    rip_amp = 0.55 + 0.45 * np.clip(spectral_noise(n, 2.4, 13, lo=1, hi=10) * 0.6 + 0.4, 0, 1)
    # broad relief + fine grain
    relief = spectral_noise(n, 2.6, 14, lo=1, hi=40)
    fine = spectral_noise(n, 1.0, 15, lo=200, hi=900)
    h = ripple * rip_amp * 1.35 + relief * 0.4 + fine * 0.05
    # pebbles / shell grit: sparse soft bumps
    rng = np.random.default_rng(16)
    peb = np.zeros((n, n))
    for _ in range(900):
        cx, cy = rng.integers(0, n, 2)
        r = rng.uniform(1.5, 7.5) if rng.random() < 0.85 else rng.uniform(8, 16)
        R = int(r * 2 + 2)
        ys = (np.arange(cy - R, cy + R + 1) % n)
        xs = (np.arange(cx - R, cx + R + 1) % n)
        dy = (np.arange(-R, R + 1))[:, None]
        dx = (np.arange(-R, R + 1))[None, :]
        b = np.clip(1 - (dx**2 + dy**2 * 1.3) / (r * r), 0, 1) ** 0.6
        peb[np.ix_(ys, xs)] = np.maximum(peb[np.ix_(ys, xs)], b * rng.uniform(0.6, 1.0))
    h = h + peb * 1.6
    # light from above, a little from the far side (texture y = depth, top = far)
    gx, gy = grad(h * 9.0)
    nx, ny, nz = -gx, -gy, np.ones_like(h)
    L = np.array([-0.25, -0.45, 0.86])
    L /= np.linalg.norm(L)
    lam = (nx * L[0] + ny * L[1] + nz * L[2]) / np.sqrt(nx**2 + ny**2 + nz**2)
    lam = np.clip(lam, 0, 1)
    # ripple troughs collect dark silt / detritus
    trough = np.clip(1 - s * 1.6, 0, 1) ** 2 * rip_amp
    silt = np.clip(spectral_noise(n, 2.0, 17, lo=2, hi=30) * 0.5 + 0.5, 0, 1)
    tone = 0.55 + 0.25 * silt - 0.22 * trough
    albedo = ramp(tone, [(0.0, "#3E3326"), (0.35, "#64543F"), (0.6, "#8A775A"), (0.85, "#A99372"), (1.0, "#BCA884")])
    # grit: light shell bits and dark pebbles
    grit_rng = np.random.default_rng(18)
    grit = spectral_noise(n, 0.0, 19, lo=300)
    shells = (grit > 2.9).astype(np.float64)
    shells = blur_wrap(shells, 0.8)
    pebcol = peb > 0.05
    alb = albedo.copy()
    pebtone = np.clip(spectral_noise(n, 1.0, 20, lo=50) * 0.5 + 0.5, 0, 1)
    pc = ramp(pebtone, [(0, "#3A3128"), (0.5, "#5B5043"), (1, "#7D705E")])
    alb[pebcol] = alb[pebcol] * 0.35 + pc[pebcol] * 0.65
    alb = alb + shells[..., None] * hex_rgb("#D9CDB4") * 0.5
    _ = grit_rng
    light = 0.38 + 0.78 * lam
    col = alb * light[..., None]
    # occlusion in the deeper hollows
    ao = np.clip(blur_wrap(h, 18) - h, -2, 2)
    col = col * (1 - 0.10 * np.clip(ao, 0, 2))[..., None]
    col = blur_wrap(col, 0.6)
    save_rgb(col, "seabed.jpg", 90)


# ---------------------------------------------------------------------------------------------
# 2. CAUSTICS (photon mapping through a tileable wave height field)
# ---------------------------------------------------------------------------------------------
def bake_caustics():
    n = 1024
    h = spectral_noise(n, 2.4, 31, lo=3, hi=40, aniso=(0.5, 1.15))
    gx, gy = grad(h)
    ss = 2  # photons per pixel per axis
    m = n * ss
    yy, xx = np.mgrid[0:m, 0:m] / ss
    # sample the gradient at photon positions (nearest)
    ix = (xx.astype(int)) % n
    iy = (yy.astype(int)) % n
    k = 520.0
    px = (xx - gx[iy, ix] * k) % n
    py = (yy - gy[iy, ix] * k) % n
    acc = np.zeros(n * n)
    np.add.at(acc, (py.astype(int) % n) * n + (px.astype(int) % n), 1.0)
    acc = acc.reshape(n, n) / (ss * ss)
    acc = blur_wrap(acc, 1.1)
    c = acc / np.percentile(acc, 99.6)
    c = np.clip(c, 0, 1)
    c = np.power(c, 1.35)
    save_l(c, "caustics.png")


# ---------------------------------------------------------------------------------------------
# 3. THE SURFACE FROM BELOW
# ---------------------------------------------------------------------------------------------
def bake_surface():
    n = 1024
    # long soft swells (wind-aligned) with a smaller chop riding on them
    h = spectral_noise(n, 3.4, 41, lo=2, hi=10, aniso=(0.25, 1.6)) + spectral_noise(n, 3.0, 42, lo=6, hi=22, aniso=(0.6, 1.2)) * 0.35
    gx, gy = grad(h)
    # facets that face the sky are bright (Snell's window), facets that tilt away reflect the water
    L = np.array([0.35, 0.6])
    b = -(gx * L[0] + gy * L[1])
    slope = np.sqrt(gx**2 + gy**2)
    b = b / (np.percentile(np.abs(b), 99) + 1e-9) - 0.35 * slope / (np.percentile(slope, 99) + 1e-9)
    b = blur_wrap(b, 1.5)
    # a NEUTRAL luminance map centred on mid grey: the component hard-lights it over its own
    # surface colour (bright overhead, the water's reflection at grazing angles)
    b = 0.5 + (b - b.mean()) * (0.17 / (b.std() + 1e-9))
    save_l(b, "surface.jpg")


if __name__ == "__main__":
    bake_seabed()
    bake_caustics()
    bake_surface()
