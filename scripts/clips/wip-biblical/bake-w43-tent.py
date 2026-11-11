"""WiredIntoOneTribe (cut 43): bend the field telegrapher's tent so its ground line follows the globe's rim.

The tent is pitched on top of the globe, but its photographed ground is straight: over 190 world px the rim drops about
17 px at each end, so the tent's corners would float. This lowers each column of the print by the rim's own drop at that
column (a circle of radius R world px), full at the ground and fading to nothing at the ridge, so the apex keeps its shape.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-w43-tent.py \
      public/wip-biblical/w43_operator.png public/wip-biblical/w43_operator_arc.png --w 190 --r 270
Prints the new aspect and the extra height (px) added at the bottom.
"""
import argparse

import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("out")
p.add_argument("--w", type=float, required=True, help="the print's width in world px")
p.add_argument("--r", type=float, required=True, help="the globe's radius in world px")
a = p.parse_args()

im = np.asarray(Image.open(a.src).convert("RGBA"), dtype=np.float32)
H0, W0 = im.shape[:2]
s = W0 / a.w  # image px per world px
dx = (np.arange(W0) + 0.5 - W0 / 2) / s
drop = (a.r - np.sqrt(np.maximum(a.r * a.r - dx * dx, 0))) * s  # image px
extra = int(np.ceil(drop.max())) + 2
H1 = H0 + extra
yy, xx = np.mgrid[0:H1, 0:W0].astype(np.float32)
# output row y samples source row y - drop(x) * ramp(y): the ramp rises from 0 at the top to 1 at the ground
ramp = np.clip(yy / H0, 0, 1) ** 2.2
sy = yy - drop[None, :] * ramp
out = np.zeros((H1, W0, 4), dtype=np.float32)
for c in range(4):
    out[..., c] = map_coordinates(im[..., c], [sy, xx], order=1, mode="constant", cval=0)
# premultiplied edges: kill colour where alpha is 0
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA").save(a.out, optimize=True)
print(f"{a.out}: {W0} x {H1}, aspect {W0 / H1:.4f}, extra {extra}px")
