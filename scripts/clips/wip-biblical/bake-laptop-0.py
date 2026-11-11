"""The laptop for wip-biblical cut 0 (NewStageForetold): a real MacBook Pro (2016) in three-quarter view, cut out, its
screen blanked to a pale lit panel so the cut can print the chat onto it in ink, then the one WiP grade.

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <laptop.jpg> <scratch>/m_laptop_fg.png fg
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-laptop-0.py <laptop.jpg> <scratch>/m_laptop_fg.png

Writes assets-src/wip-biblical/nsf_laptop_blank.png and nsf_laptop_matte.png (raw, read by the grade) and
public/wip-biblical/nsf_laptop.png. The screen's corners (photo px) are SCREEN below; NewStageForetold.tsx maps them.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

SRC, MATTE = Path(sys.argv[1]), Path(sys.argv[2])
REPO = Path(__file__).resolve().parents[3]
(REPO / "assets-src" / "wip-biblical").mkdir(parents=True, exist_ok=True)

# the lit display's corners in the photo: tl, tr, br, bl
SCREEN = [(563, 85), (1298, 72), (1230, 623), (518, 528)]

im = Image.open(SRC).convert("RGB")
rgb = np.asarray(im, dtype=np.float64) / 255
# blank the display: a pale panel, a touch darker toward its foot (as the lit page was), drawn 3 px past the lit edge so
# no page content survives along it
poly = Image.new("L", im.size, 0)
cx = sum(p[0] for p in SCREEN) / 4
cy = sum(p[1] for p in SCREEN) / 4
grown = [(x + (x - cx) * 0.006, y + (y - cy) * 0.008) for x, y in SCREEN]
ImageDraw.Draw(poly).polygon(grown, fill=255)
pm = gaussian_filter(np.asarray(poly, dtype=np.float64) / 255, 0.7)[..., None]
yy = np.arange(im.height, dtype=np.float64)[:, None]
tone = 0.90 - 0.05 * np.clip((yy - 72) / (623 - 72), 0, 1)
panel = np.dstack([tone * np.ones((im.height, im.width))] * 3) * np.array([0.97, 0.99, 1.0])
out = rgb * (1 - pm) + panel * pm
blank = REPO / "assets-src/wip-biblical/nsf_laptop_blank.png"
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(blank)

# the matte: Vision's foreground, with the display panel forced solid (a white page on a white ground can leak)
m = np.asarray(Image.open(MATTE).convert("L").resize(im.size, Image.BICUBIC), dtype=np.float64) / 255
m = np.maximum(m, pm[..., 0])
matte = REPO / "assets-src/wip-biblical/nsf_laptop_matte.png"
Image.fromarray((m * 255 + 0.5).astype(np.uint8)).save(matte)

subprocess.run(
    [sys.executable, str(REPO / "scripts/clips/wip-anthropic/bake-photo.py"), str(blank), str(REPO / "public/wip-biblical/nsf_laptop.png"),
     "--matte", str(matte), "--max", "1400", "--mid", "0.55"],
    check=True,
)
