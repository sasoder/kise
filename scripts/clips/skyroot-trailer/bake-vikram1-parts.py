#!/usr/bin/env python3
"""ThreeFactoriesEveryMonth (skyroot-trailer, cut 38): slice skyrootShared's Vikram-1 cut-out (vikram1.png, never
edited) into its five parts at the stage joints visible in the photo, so the cut can assemble the rocket on a line.

Joints (src rows, 0 = top; each a dark ring seam measured off the per-row centre luminance):
  339   fairing / Raman upper stage
  579   upper stage / stage 3 (Kalam-100)
  750   stage 3 / stage 2 (Kalam-250)       (falls between "VIK" and "RAM I" on the print: whole again when mated)
  1260  stage 2 interstage / stage 1 (Kalam-1200), where the chevrons begin
Each slice keeps the full PNG width (so the axis stays at VIKRAM1.axisX) and runs one row past its joint upward
(OVERLAP), hidden under the part above when mated, so no hairline opens at a joint.

  /usr/bin/python3 scripts/clips/skyroot-trailer/bake-vikram1-parts.py
"""
from PIL import Image

SRC = "public/skyroot-trailer/vikram1.png"
OUT = "public/skyroot-trailer/vikram1_part_{}.png"
JOINTS = [0, 339, 579, 750, 1260, 2412]
NAMES = ["fairing", "upper", "stage3", "stage2", "stage1"]  # top (nose) to bottom (base)
OVERLAP = 1

im = Image.open(SRC).convert("RGBA")
w, h = im.size
assert (w, h) == (221, 2412), (w, h)
for i, name in enumerate(NAMES):
    top = max(0, JOINTS[i] - (OVERLAP if i > 0 else 0))
    bot = JOINTS[i + 1]
    im.crop((0, top, w, bot)).save(OUT.format(name), optimize=True)
    print(name, {"top": top, "bottom": bot})
