"""Bake the MarsVsOceanV2 survey traces: public/marsocean/mvo_earth_tracks_4k.png (greyscale 4096x2048).

Run from the repo root:  python3 scripts/clips/will-mars-ocean/bake-marsocean-v2-tracks.py
GEBCO_2026 TID measured-cells mask (gebco2026_measured_mask_8k.png: white = measured by ship sonar), 2x2 max-pooled
so single-cell tracks survive the halving. Honest data: no lines are added or removed.
"""
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
D = "public/marsocean/"
m = np.asarray(Image.open(D + "gebco2026_measured_mask_8k.png").convert("L"))
h, w = m.shape
mp = m.reshape(h // 2, 2, w // 2, 2).max(axis=(1, 3))
Image.fromarray(mp).save(D + "mvo_earth_tracks_4k.png", optimize=True)
print("ok", mp.shape)
