"""QuarterOfAnthropic's ground strip: the day view from the Embarcadero, its sky removed along the rooflines (the sky is
bright and smooth, so a flood from the top edge follows them), the largest piece kept, and the bottom edge cut by hand in
a slow wave so the strip lies on the page as a cut-out. Writes the matte for bake-photo.py, cropped afterwards with --crop.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-quarter-ground.py <in.jpg> <scratch>/mask.png
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ni

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("L")
full = im.size
im.thumbnail((2000, 2000))
g = np.asarray(im, dtype=float) / 255
cand = (ni.gaussian_filter(g, 1.2) > 0.5) & (ni.gaussian_gradient_magnitude(g, 1.5) < 0.03)
lab, _ = ni.label(cand)
sky = np.isin(lab, list(set(np.unique(lab[0])) - {0}))
sky = ni.binary_fill_holes(ni.binary_closing(sky, iterations=3))
fg = ni.binary_opening(~sky, iterations=2)
lab, n = ni.label(fg)
fg = lab == (1 + np.argmax(ni.sum(fg, lab, range(1, n + 1))))
# the crop's bottom edge (y 1224 of 2000-wide) as a slow hand-cut wave
h, w = fg.shape
x = np.arange(w)
edge = 1198 + 14 * np.sin(x / 210 + 0.6) + 8 * np.sin(x / 83 + 2.1) + 3 * np.sin(x / 31)
fg &= np.arange(h)[:, None] < edge[None, :]
Image.fromarray((fg * 255).astype("uint8")).resize(full, Image.BICUBIC).save(out)
print(full, w, h)
