#!/usr/bin/env python3
"""Bake the Apple Park still exactly as it sits in the edit at TraditionalTechCompanies' f0.

Premiere: Scale 28.125 %, Position 0.5 / 0.5 in a 1080 x 1920 sequence -> the 3840 x 2564 photo is 1080 x 721.125
px, top at y 599.4375. This writes the screen rows 599 .. 1320 (722 rows) as an RGBA PNG resampled with Lanczos at
that exact sub-pixel placement; the two edge rows carry their coverage (0.5625) as alpha. The cut draws it at
(0, 599) for f0 (the live photo layer takes over from f1, under a short dissolve), so f0 matches the still in the edit.

Run with the system python (numpy + PIL):  /usr/bin/python3 scripts/clips/nik-neobanks-us/bake-apple-park-f0.py
"""
import numpy as np
from PIL import Image

SRC = "public/nik-neobanks-us/apple-park-aerial.jpg"
OUT = "public/nik-neobanks-us/apple-park-f0.png"
S = 0.28125
W, H = 3840, 2564
TOP = 960 - H * S / 2  # 599.4375
BOT = 960 + H * S / 2  # 1320.5625
R0, R1 = int(np.floor(TOP)), int(np.ceil(BOT))  # 599, 1321

src = Image.open(SRC).convert("RGB")
rows = []
alpha = []
for r in range(R0, R1):
    y0, y1 = max(r, TOP), min(r + 1, BOT)  # the covered part of this screen row
    alpha.append(y1 - y0)
inner = src.resize((1080, R1 - R0 - 2), Image.LANCZOS, box=(0, (R0 + 1 - TOP) / S, W, (R1 - 1 - TOP) / S))
first = src.resize((1080, 1), Image.LANCZOS, box=(0, 0, W, (R0 + 1 - TOP) / S))
last = src.resize((1080, 1), Image.LANCZOS, box=(0, (R1 - 1 - TOP) / S, W, H))
rgb = np.concatenate([np.asarray(first), np.asarray(inner), np.asarray(last)], axis=0)
a = np.round(np.array(alpha) * 255).astype(np.uint8)[:, None].repeat(1080, axis=1)
Image.fromarray(np.dstack([rgb, a])).save(OUT, optimize=True)
print(OUT, rgb.shape, "edge alpha", alpha[0], alpha[-1])
