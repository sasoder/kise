"""Bakes the two map levels of HalfTheContinent (plague clip) from the ink mask of
Abraham Ortelius, Typus Orbis Terrarum, 1570 (Library of Congress 2017585794):

    python3 scripts/build-HalfTheContinent-ortelius.py

  public/plague/halfcontinent_ortelius_half.png   the whole sheet at 1/2 size (3139 x 2469)
  public/plague/halfcontinent_ortelius_close.png  Asia at full size (the CLOSE box below)

Both are the kit's cream ink (#E9DDBF) with the engraved line as ALPHA, so the
map is printed straight onto the kit page (its mottle shows between the lines,
the sheet has no edge) and the orange hand-colour can lie UNDER the ink.
"""
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SRC = "public/plague/ortelius_1570_ink.png"
CLOSE = (4150, 150, 6050, 2950)  # x0, y0, x1, y1 in sheet px (also in HalfTheContinentOrtelius.ts)
INK = (233, 221, 191)

mask = Image.open(SRC).convert("L")

# The sheet's margin outside the engraved border (scan edge, stamps, pencil
# notes) is faded out, so the sheet never shows an outer edge on the page.
# (start of fade, full) per side, sheet px; the border sits at about
# x 170 / 5985, y 350 / 4350.
a = np.asarray(mask).astype(np.float32)
h, w = a.shape


def ramp(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


xs = np.arange(w, dtype=np.float32)
ys = np.arange(h, dtype=np.float32)
fx = ramp(xs, 70, 150) * (1 - ramp(xs, 6000, 6080))
fy = ramp(ys, 250, 330) * (1 - ramp(ys, 4370, 4450))
mask = Image.fromarray((a * fy[:, None] * fx[None, :]).astype(np.uint8))


def cream(m):
    out = Image.new("RGBA", m.size, INK + (0,))
    out.putalpha(m)
    return out


half = mask.resize((mask.width // 2, mask.height // 2), Image.LANCZOS)
cream(half).save("public/plague/halfcontinent_ortelius_half.png", optimize=True)
cream(mask.crop(CLOSE)).save("public/plague/halfcontinent_ortelius_close.png", optimize=True)
print("half", half.size, "close", mask.crop(CLOSE).size)
