"""SingleSubject (wip-taylor-swift, cut 3): hand-cut a bust out of a person matte, so the print ends in a cut line under
the shoulders rather than at the photo's edge or a sitter's arm. Keeps the matte inside a polygon given as fractions of
the image (x,y pairs); the edge is softened by a pixel, and CutOut's paper border follows it.

  uv run --offline --with numpy --with pillow python scripts/clips/wip-taylor-swift/ss-cut-mask.py <mask.png> <out.png> \
      0,0 1,0 1,0.6 0.5,0.66 0,0.6

Darwin (Maull & Polyblank 1855, darwin_maullpolyblank1855_b.jpg):
  0.28,0 1,0 1,0.58 0.8,0.6 0.55,0.62 0.36,0.6 0.3,0.45
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out, *pts = sys.argv[1:]
m = Image.open(src).convert("L")
w, h = m.size
poly = [(float(p.split(",")[0]) * w, float(p.split(",")[1]) * h) for p in pts]
cut = Image.new("L", (w, h), 0)
ImageDraw.Draw(cut).polygon(poly, fill=255)
cut = cut.filter(ImageFilter.GaussianBlur(1.0))
a = np.asarray(m, dtype=np.float32) * np.asarray(cut, dtype=np.float32) / 255
Image.fromarray(a.astype(np.uint8), "L").save(out)
print(out, w, h)
