"""Bake the Earth survey net classification for MarsVsOceanV2 -> generated/components/will-mars-ocean/marsOceanV2Net.ts.

Run from the repo root (after scripts/clips/will-mars-ocean/bake-marsocean-mvo.py):  python3 scripts/clips/will-mars-ocean/bake-marsocean-v2-net.py
A 10-deg graticule sampled every 0.5 deg; each sample is '#' (land that carries the grid: mvo_earth_gridland_4k)
or a digit 0..9 (ocean; the basin channel of mvo_earth_ocean_4k: 0 coast .. 9 the middle of a basin).
"""
import numpy as np
from PIL import Image

D = "public/marsocean/"
land = np.asarray(Image.open(D + "mvo_earth_gridland_4k.png").convert("L")).astype(np.float32) / 255
basin = np.asarray(Image.open(D + "mvo_earth_ocean_4k.png").convert("RGB"))[..., 2].astype(np.float32) / 255
H, W = land.shape
STEP, SAMPLE = 10, 0.5


def cls(lon, lat):
    x = int(((lon + 180) / 360 * W)) % W
    y = min(H - 1, max(0, int((90 - lat) / 180 * H)))
    if land[y, x] > 0.5:
        return "#"
    return str(min(9, int(basin[y, x] * 10)))


merid = []
for lon in range(-180, 180, STEP):
    merid.append("".join(cls(lon, 90 - i * SAMPLE) for i in range(int(180 / SAMPLE) + 1)))
par = []
for lat in range(-80, 81, STEP):
    par.append("".join(cls(-180 + i * SAMPLE, lat) for i in range(int(360 / SAMPLE) + 1)))
with open("generated/components/will-mars-ocean/marsOceanV2Net.ts", "w") as f:
    f.write("// Baked by scripts/clips/will-mars-ocean/bake-marsocean-v2-net.py: the Earth survey net (10 deg, sampled every 0.5 deg).\n")
    f.write("// Per sample: '#' = land that carries the grid, '0'..'9' = ocean (basin: 0 coast .. 9 middle).\n")
    f.write("// MERID[i]: lon = -180 + 10 i, lat 90 -> -90. PAR[j]: lat = -80 + 10 j, lon -180 -> 180.\n")
    f.write("export const NET_STEP = %d;\nexport const NET_SAMPLE = %s;\n" % (STEP, SAMPLE))
    f.write("export const MERID: string[] = [\n" + "".join('  "%s",\n' % s for s in merid) + "];\n")
    f.write("export const PAR: string[] = [\n" + "".join('  "%s",\n' % s for s in par) + "];\n")
print("ok", len(merid), len(par))
