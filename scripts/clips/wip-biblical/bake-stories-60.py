"""Cut 60 (StoriesConverge): five blank typescript pages from the three PD thesis scans in
animation_source/assets_raw/study/. The typing (and the ruled border) is lifted off with a grey closing, so only the real
paper stays: its tone, foxing and edges. The cut draws its own word blocks and red flourishes on top.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-stories-60.py \
      "<working folder>/animation_source/assets_raw/study" public/wip-biblical

Writes sc_page_1..5.png (RGBA, 700 px wide, aspect printed). Largest array: 1400 x 1916 float64 = 21 MB.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter, grey_closing, median_filter

src_dir = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
SCANS = {
    "weld": "Typescript_1907_Weld_PrivateFreightCarSystem_UIllinois_p15.jpg",
    "gregg": "Typescript_1912_Gregg_IndicatorReducingMotions_UIllinois_p15.jpg",
    "ross": "Typescript_1917_Ross_RateMakingWorkmensCompensation_UIllinois_p15.jpg",
}
# page -> (scan, turned 180 degrees, mirrored): five different sheets from three scans
PAGES = {
    1: ("weld", False, False),
    2: ("gregg", False, False),
    3: ("ross", False, False),
    4: ("weld", True, True),
    5: ("gregg", True, False),
}
WORK_W = 1400
OUT_W = 700
ASPECT = 0.7315  # every page is cut to the same sheet: w / h


def blank(name: str) -> np.ndarray:
    im = Image.open(src_dir / SCANS[name]).convert("L")
    s = WORK_W / im.width
    im = im.resize((WORK_W, round(im.height * s)), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float64) / 255.0
    # trim the scan's outer 1.2 % (bed shadow, ragged edge), then cut to the one sheet aspect from the top
    m = int(WORK_W * 0.012)
    a = a[m:-m, m:-m]
    h = round(a.shape[1] / ASPECT)
    a = a[: min(h, a.shape[0])]
    # lift the typing and the rules: dark strokes narrower than the closing go; the paper's own tone stays
    c = grey_closing(a, size=(15, 15))
    c = median_filter(c, size=9)
    c = gaussian_filter(c, 1.2)
    # put back the paper's fibre (fine detail of the original that is lighter than the closing, i.e. not ink)
    # (only well away from the typing: a stroke's halo would leave the line as a ghost)
    ink = binary_dilation(a < c - 0.04, iterations=7)
    fibre = np.clip(a - gaussian_filter(a, 2.0), -0.02, 0.02)
    fibre[ink] = 0.0
    c = c + fibre * 0.6
    # levels: the sheet's median to 0.975 (the page reads lighter than the mint ground), its spread opened so the foxing reads
    med = float(np.median(c))
    c = 0.975 + (c - med) * 1.4
    return np.clip(c, 0, 1)


cache: dict[str, np.ndarray] = {}
for page, (name, turn, mirror) in PAGES.items():
    if name not in cache:
        cache[name] = blank(name)
    a = cache[name]
    if turn:
        a = a[::-1, ::-1]
    if mirror:
        a = a[:, ::-1]
    g = (a * 255).round().astype(np.uint8)
    im = Image.fromarray(g, "L").convert("RGB")
    h = round(OUT_W / ASPECT)
    im = im.resize((OUT_W, h), Image.LANCZOS)
    rgba = im.convert("RGBA")
    out = out_dir / f"sc_page_{page}.png"
    rgba.save(out)
    print(out, rgba.size, f"aspect {OUT_W / h:.4f}")
