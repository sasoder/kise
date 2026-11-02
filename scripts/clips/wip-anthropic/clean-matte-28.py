"""Cut 28: keep only the largest connected body of a Vision matte (drops the interviewer's hand and ghost knee beside Dario).
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-anthropic/clean-matte-28.py <mask.png> <out.png> [threshold]
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

src, out = sys.argv[1:3]
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
m = np.asarray(Image.open(src).convert("L"), dtype=np.float64) / 255
lab, n = label(m > thr)
sizes = np.bincount(lab.ravel())
sizes[0] = 0
keep = binary_dilation(lab == sizes.argmax(), iterations=4)
Image.fromarray(((m * keep) * 255 + 0.5).astype(np.uint8), "L").save(out)
print(f"{out}: {n} bodies, kept the largest")

# Optional 4th arg: a baked print to patch. A gap in the matte (the chair showing between Dario's arm and side) would be
# filled by the paper border as a white chip, so small holes become the shadow they sit in.
if len(sys.argv) > 4:
    from scipy.ndimage import binary_fill_holes

    rgba = np.asarray(Image.open(sys.argv[4]).convert("RGBA")).copy()
    solid = rgba[..., 3] > 127
    holes = binary_fill_holes(solid) & ~solid
    lab, n = label(holes)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    small = (lab > 0) & (sizes[lab] < 6000)
    small = binary_dilation(small, iterations=3)
    rgba[small] = (22, 22, 22, 255)
    Image.fromarray(rgba, "RGBA").save(sys.argv[4], optimize=True)
    print(f"{sys.argv[4]}: patched {n} holes")
