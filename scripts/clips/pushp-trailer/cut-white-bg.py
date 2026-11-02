#!/usr/bin/env python3
"""Cut an object generated on pure white to an alpha PNG: the white connected to the border becomes transparent,
soft dark blur in it (propeller discs) keeps its density as dark semi-transparent pixels, the rest stays opaque."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ni

src, dst = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert("RGB")).astype(float)
v = a.min(axis=2)
lab, _ = ni.label(v >= 170)
border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
bg = np.isin(lab, list(border))
alpha = np.ones(v.shape)
dark = 45.0
alpha[bg] = np.clip((250 - v[bg]) / (250 - dark), 0, 1)
rgb = a.copy()
rgb[bg] = dark
out = np.dstack([rgb, alpha * 255]).round().astype("uint8")
ys, xs = np.where(alpha > 0.02)
m = 8
im = Image.fromarray(out, "RGBA").crop((max(xs.min() - m, 0), max(ys.min() - m, 0), xs.max() + m, ys.max() + m))
im.save(dst)
print(dst, im.size)
