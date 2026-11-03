"""TwentyMinuteWalk's school (cut 32, rev 2): Eton College, Lupton's Tower over School Yard, cut out of the left half of the
Met's stereograph (DP73247, CC0). Vision's foreground matte takes the whole card, so the cut line is the skyline: the faded
sky is modelled as a smooth field and the buildings are what is darker than it. Per column, the skyline is the first row from
the top under which the next rows are mostly building; everything below it is kept, down to a straight scissor cut across
School Yard. The sides are the stereo half's own straight edges. Then the kit's one grade (bake-photo.py).

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-victorians/bake-walk-eton.py <assets_raw> <scratch>
"""
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter

raw, scratch = sys.argv[1], sys.argv[2]
X0, Y0, X1, Y1 = 571, 330, 1721, 1420  # in the stereograph's px: Lupton's Tower centred, the wings cut off either side, finials to School Yard
im = Image.open(f"{raw}/eton/EtonCollege_MET_DP73247_stereograph.jpg").convert("RGB").crop((X0, Y0, X1, Y1))
rgb = np.asarray(im, dtype=np.float64)
lum = gaussian_filter(0.3 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2], 2.5)
h, w = lum.shape

# the sky as a smooth field: a quadratic surface fitted to the bright pixels of the top half
yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
sel = (lum > 203) & (yy < 0.45 * h)
A = np.stack([np.ones(sel.sum()), xx[sel] / w, yy[sel] / h, (xx[sel] / w) ** 2, (yy[sel] / h) ** 2, xx[sel] * yy[sel] / w / h], 1)
coef, *_ = np.linalg.lstsq(A, lum[sel], rcond=None)
sky = coef[0] + coef[1] * xx / w + coef[2] * yy / h + coef[3] * (xx / w) ** 2 + coef[4] * (yy / h) ** 2 + coef[5] * xx * yy / w / h
built = lum < sky - 9

RUN = 34
cs = np.cumsum(np.vstack([np.zeros((1, w)), built]), 0)
dens = (cs[RUN:] - cs[:-RUN]) / RUN  # building density of the RUN rows starting at each row
top = np.array([int(np.argmax(dens[:, x] > 0.72)) if (dens[:, x] > 0.72).any() else h for x in range(w)])
top = median_filter(top, 7)
mask = (yy >= top[None, :]).astype(np.float64)
mask = gaussian_filter(mask, 1.2)
# the scissor cut across the yard, very slightly off true
mask *= gaussian_filter((yy < h - 6 - 5 * np.sin(xx / w * 2.3 + 0.7) - 4 * (xx / w)).astype(np.float64), 0.8)
mask[:, :2] = 0
mask[:, -2:] = 0
Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8)).save(f"{scratch}/eton_cutline.png")
im.save(f"{scratch}/eton_crop.png")
print("crop", w, h, "skyline min", top.min(), "at x", int(np.argmin(top)))
subprocess.run(
    [sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", f"{scratch}/eton_crop.png", "public/wip-victorians/tw_eton.png", "--matte", f"{scratch}/eton_cutline.png", "--max", "1600", "--mid", "0.5"],
    check=True,
)
