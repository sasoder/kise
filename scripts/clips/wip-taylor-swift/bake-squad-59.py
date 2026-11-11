"""SquadThenDips (wip-taylor-swift, cut 59): bake Taylor and five 2015-squad friends as b&w person cut-outs.

For each photo: Apple Vision person matte (neal-matte.swift), matte fixes (keep the largest piece; Lena's two
neighbours cut away), crop to the matte's box, then the one grade (wip-anthropic/bake-photo.py) into
public/wip-taylor-swift/sq_<name>.png. Prints each PNG's size and aspect.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-taylor-swift/bake-squad-59.py <scratch>
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import label

RAW = "/Users/tom/Documents/tom fant/wip/nov/taylor swift + arabia/taylor swift/animation_source/assets_raw"
SCRATCH = sys.argv[1]
os.makedirs(f"{SCRATCH}/mattes", exist_ok=True)

# name -> (raw file, mid-tone)
PHOTOS = {
    "taylor": ("taylor/taylor_2019_Lover_thighup.jpg", 0.48),
    "karlie": ("squad/karlie_kloss_2013_street_fulllength_a.jpg", 0.44),
    "selena": ("squad/selena_gomez_2024_TIFF_fulllength_a.jpg", 0.42),
    "gigi": ("squad/gigi_hadid_2015_kneeup_b.jpg", 0.46),
    "cara": ("squad/cara_delevingne_2014_waistup_c.jpg", 0.44),
    "lena": ("squad/lena_dunham_2016_kneeup_a.jpg", 0.5),
}


# Lena 2016 stands beside a man (left) with a man in a knitted hat behind her right shoulder. Her left edge, traced on
# the photo (src px) where her white jacket meets his dark coat; everything left of it goes.
LENA_LEFT = [(1700, 0), (1700, 1982), (1850, 2117), (1446, 2342), (1446, 2792), (1475, 3212), (1544, 3542), (1514, 3812),
             (1550, 4112), (1550, 5312)]


def fix(name: str, m: np.ndarray) -> np.ndarray:
    m = m.copy()
    if name == "lena":
        from PIL import ImageDraw, ImageFilter
        h, w = m.shape
        keep = Image.new("L", (w, h), 0)
        ImageDraw.Draw(keep).polygon(LENA_LEFT + [(w, h), (w, 0)], fill=255)
        keep = np.asarray(keep.filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32) / 255
        m = (m * keep).astype(np.uint8)
        # the hat man reads half-opaque in the matte, her hair fully: drop the half-opaque part beside her head
        box = m[:2450, 2300:]
        hard = np.where(box > 200, 255, 0).astype(np.uint8)
        m[:2450, 2300:] = np.asarray(Image.fromarray(hard).filter(ImageFilter.GaussianBlur(1.2)))
    lab, _ = label(m > 40)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    return np.where(lab == sizes.argmax(), m, 0).astype(np.uint8)


only = sys.argv[2:] or list(PHOTOS)
for name in only:
    rel, mid = PHOTOS[name]
    src = f"{RAW}/{rel}"
    mask = f"{SCRATCH}/mattes/sq_{name}.png"
    subprocess.run(["swift", "scripts/clips/neal-stephenson-trailer/neal-matte.swift", src, mask, "person"], check=True)
    m = fix(name, np.asarray(Image.open(mask).convert("L")))
    Image.fromarray(m).save(mask)
    ys, xs = np.nonzero(m > 128)
    pad = int(0.02 * max(m.shape))
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(m.shape[1], xs.max() + pad), min(m.shape[0], ys.max() + pad)
    subprocess.run(
        [
            sys.executable,
            "scripts/clips/wip-anthropic/bake-photo.py",
            src,
            f"public/wip-taylor-swift/sq_{name}.png",
            "--matte",
            mask,
            "--crop",
            f"{x0},{y0},{x1},{y1}",
            "--mid",
            str(mid),
            "--max",
            "1600",
        ],
        check=True,
    )
