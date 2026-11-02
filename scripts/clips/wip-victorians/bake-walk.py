"""TwentyMinuteWalk: the printed map. Stanford's Library Map, sheet 10 (1877 edition), crop window in the crop's own px, flat-fielded
so the scan's tan paper goes white (white multiplies to nothing on the mint page) and the engraving stays as neutral ink, held to a
ceiling of density so the stamps, the ring and the labels stand clear of it.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-victorians/bake-walk.py <Stanford crop.jpg> public/wip-victorians/tw_map.jpg
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter

Image.MAX_IMAGE_PIXELS = None
BOX = (2058, 461, 6346, 4606)  # TwentyMinuteWalk.tsx MAP_O*
OUT_W = 2000
DENSITY = 0.5  # the darkest engraved black, as ink coverage

im = Image.open(sys.argv[1]).convert("RGB").crop(BOX)
im = im.resize((OUT_W, round(im.height * OUT_W / im.width)), Image.LANCZOS)
g = np.asarray(im, dtype=np.float64) / 255
g = 0.30 * g[..., 0] + 0.59 * g[..., 1] + 0.11 * g[..., 2]
paper = gaussian_filter(maximum_filter(g, 31), 24)
g = np.clip(g / paper, 0, 1)
lo, hi = np.percentile(g, 0.5), np.percentile(g, 88)
g = np.clip((g - lo) / (hi - lo), 0, 1)
g = gaussian_filter(g, 0.8)  # a touch less detail under the stamps
out = 1 - (1 - g) * DENSITY
Image.fromarray((out * 255 + 0.5).astype(np.uint8), "L").save(sys.argv[2], quality=88)
print(sys.argv[2], im.size, f"median {np.median(out):.3f}")
