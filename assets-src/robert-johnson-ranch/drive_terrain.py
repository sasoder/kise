"""drive_terrain: the shared terrain maths of the DriveOutOfAustin bake (robert-johnson-ranch, cut 6).

The DEM: AWS Terrain Tiles (Terrarium PNG, z11, 256 px) in dem-z11/11_<x>_<y>.png, x 459-470, y 839-848.
elev_m = R*256 + G + B/256 - 32768. Web-Mercator tiles, resampled here into a LOCAL METRIC FRAME:
  origin Austin downtown (-97.7431, 30.2672); X east (m), Z SOUTH (m) (north recedes from a north-looking camera);
  x = (lon - LON0) * MX, z = -(lat - LAT0) * MZ (equirectangular about LAT0; < 0.1 % error over the 100 km window).
Run with /usr/bin/python3 (numpy + PIL; no scipy on this Mac).
"""
import math
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
LON0, LAT0 = -97.7431, 30.2672
MX = 111319.49 * math.cos(math.radians(LAT0))
MZ = 110574.0
TX0, TX1, TY0, TY1, Z = 459, 470, 839, 848, 11

# the local grid (the ground the cut sees): 50 m cells
CELL = 50.0
GX0, GX1 = -75000.0, 25000.0
GZ0, GZ1 = -35000.0, 60000.0
NX = int(round((GX1 - GX0) / CELL))
NZ = int(round((GZ1 - GZ0) / CELL))


def to_local(lon, lat):
    return (lon - LON0) * MX, -(lat - LAT0) * MZ


def to_lonlat(x, z):
    return LON0 + x / MX, LAT0 - z / MZ


def mosaic():
    """the Terrarium mosaic (metres) and its global pixel origin"""
    cols = TX1 - TX0 + 1
    rows = TY1 - TY0 + 1
    out = np.zeros((rows * 256, cols * 256), np.float64)
    for ty in range(TY0, TY1 + 1):
        for tx in range(TX0, TX1 + 1):
            im = np.asarray(Image.open(os.path.join(HERE, "dem-z11", f"11_{tx}_{ty}.png")).convert("RGB"), np.float64)
            e = im[..., 0] * 256 + im[..., 1] + im[..., 2] / 256 - 32768
            out[(ty - TY0) * 256:(ty - TY0 + 1) * 256, (tx - TX0) * 256:(tx - TX0 + 1) * 256] = e
    return out


def merc_px(lon, lat):
    """global pixel coords (z11, 256 px tiles) of lon/lat, pixel CENTRES at integer + 0.5"""
    n = 256 * 2 ** Z
    gx = (lon + 180.0) / 360.0 * n
    lr = np.radians(lat)
    gy = (1 - np.log(np.tan(lr) + 1 / np.cos(lr)) / math.pi) / 2 * n
    return gx, gy


def bilinear(a, fx, fy):
    """sample a (rows, cols) at float pixel coords (centre convention: pixel i covers [i, i+1), centre i + 0.5)"""
    x = np.clip(fx - 0.5, 0, a.shape[1] - 1.001)
    y = np.clip(fy - 0.5, 0, a.shape[0] - 1.001)
    x0 = np.floor(x).astype(np.int64)
    y0 = np.floor(y).astype(np.int64)
    tx = x - x0
    ty = y - y0
    return (a[y0, x0] * (1 - tx) * (1 - ty) + a[y0, x0 + 1] * tx * (1 - ty) + a[y0 + 1, x0] * (1 - tx) * ty + a[y0 + 1, x0 + 1] * tx * ty)


def local_heights():
    """raw elevation (m) on the local grid (NZ rows north->south, NX cols west->east), cell centres"""
    return heights_on(GX0, GZ0, CELL, NX, NZ)


# the outer grid: the whole offline DEM at 150 m (the far land of the high wides; the inner grid's trend comes from it)
OCELL = 150.0
OGX0, OGZ0 = -150000.0, -69000.0
ONX, ONZ = 1332, 1106


def heights_on(x0, z0, cell, nx, nz):
    """raw elevation (m) on any local grid, cell centres"""
    m = mosaic()
    xs = x0 + (np.arange(nx) + 0.5) * cell
    zs = z0 + (np.arange(nz) + 0.5) * cell
    X, Zz = np.meshgrid(xs, zs)
    lon, lat = to_lonlat(X, Zz)
    gx, gy = merc_px(lon, lat)
    return bilinear(m, gx - TX0 * 256, gy - TY0 * 256)


def gblur(a, sigma):
    """gaussian blur (sigma in cells) by FFT with reflect padding"""
    if sigma <= 0:
        return a.copy()
    p = int(min(3 * sigma + 2, min(a.shape) - 1))
    b = np.pad(a, p, mode="reflect")
    ky = np.fft.fftfreq(b.shape[0])[:, None]
    kx = np.fft.rfftfreq(b.shape[1])[None, :]
    g = np.exp(-2 * (math.pi ** 2) * (sigma ** 2) * (kx ** 2 + ky ** 2))
    out = np.fft.irfft2(np.fft.rfft2(b) * g, s=b.shape)
    return out[p:-p, p:-p]


def grid_xy(x, z):
    """local metres -> float grid coords (centre convention)"""
    return (np.asarray(x) - GX0) / CELL, (np.asarray(z) - GZ0) / CELL
