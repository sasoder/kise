"""QuarterOfAnthropic's ground strip: the day view from the Embarcadero, its sky removed along the rooflines (the sky is
bright and smooth, so a flood from the top edge follows them) and the largest piece kept. The strip runs to the photo's
own bottom edge, which stays below the frame. Writes the matte for bake-photo.py, cropped afterwards with --crop.

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
Image.fromarray((fg * 255).astype("uint8")).resize(full, Image.BICUBIC).save(out)
print(full)
