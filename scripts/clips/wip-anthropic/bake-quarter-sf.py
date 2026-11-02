"""QuarterOfAnthropic's San Francisco print: the night skyline, cropped square with Salesforce Tower and the Transamerica
Pyramid in the upper half. The photo is wider than it is tall, so the square's lower part continues the bay by stretching
the photo's own water downward; the stamps cover that part.

Its own soft grade instead of bake-photo.py: that bake's local contrast and S-curve turn a night scene into white crust on
black, "almost like a negative". Here the blacks lift to charcoal, the mid-tones open so building mass shows, and a
shoulder keeps the lights below paper white, with a slight softening so blown pixels do not sparkle at phone size.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/bake-quarter-sf.py <in.jpg> public/wip-anthropic/quarter_sf_night.png
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

src, out = sys.argv[1], sys.argv[2]
FLOOR, CEILING, OPEN, SHOULDER = 0.08, 0.78, 1.15, 1.6
im = Image.open(src).convert("RGB")
W, H = im.size
side, x0, y0 = int(W * 0.625), int(W * 0.286), int(H * 0.05)
SHORE = int(H * 0.715)  # the first row of open water
canvas = Image.new("RGB", (side, side))
canvas.paste(im.crop((x0, y0, x0 + side, SHORE)), (0, 0))
top = SHORE - y0
canvas.paste(im.crop((x0, SHORE, x0 + side, H)).resize((side, side - top), Image.LANCZOS), (0, top))
canvas = canvas.resize((1800, 1800), Image.LANCZOS)

rgb = np.asarray(canvas, dtype=np.float64) / 255
g = 0.30 * rgb[..., 0] + 0.59 * rgb[..., 1] + 0.11 * rgb[..., 2]
lo, hi = np.percentile(g, [0.5, 99.9])
g = np.clip((g - lo) / max(hi - lo, 1e-3), 0, 1)
g = gaussian_filter(g, 0.9)
g = g**OPEN
g = (1 - np.exp(-SHOULDER * g)) / (1 - np.exp(-SHOULDER))
g = FLOOR + (CEILING - FLOOR) * g
out_a = np.dstack([g, g, g, np.ones_like(g)])
Image.fromarray((out_a * 255 + 0.5).astype(np.uint8), "RGBA").save(out, optimize=True)
print(f"{out}: median {np.median(g):.3f}, p99 {np.percentile(g, 99):.3f}, max {g.max():.3f}")
