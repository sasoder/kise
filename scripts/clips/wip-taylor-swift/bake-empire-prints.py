"""The era prints for EmpireOfHerself (wip-taylor-swift, cut 42): each photo of her cropped to its brick in the tower, then
through the one grade (scripts/clips/wip-anthropic/bake-photo.py) into public/wip-taylor-swift/empire_print_<name>.png.

  python scripts/clips/wip-taylor-swift/bake-empire-prints.py "<working folder>/animation_source/assets_raw/taylor"

The cell sizes here must match ROWS in generated/components/wip-taylor-swift/EmpireOfHerself.tsx (photo px at the
settled frame); the crop is the largest box of the cell's aspect in the photo, scaled by `zoom`, centred on (fx, fy)
(fractions of the photo) and clamped inside it. The prints are pictures, not detail: about twice the cell size.
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "wip-taylor-swift"

# name, file, cell w, cell h, fx, fy, zoom
PRINTS = [
    ("vma23", "taylor_2023_VMA_headshoulders.png", 400, 160, 0.50, 0.25, 1.0),
    ("curls", "taylor_2010_Fearless_curls_headshoulders.jpg", 220, 160, 0.53, 0.42, 0.78),
    ("lover", "taylor_2019_Lover_headshoulders.jpg", 166, 160, 0.51, 0.33, 0.62),
    ("speaknow", "taylor_2012_SpeakNowTour_kneeup.jpg", 160, 160, 0.42, 0.42, 0.9),
    ("gg24", "taylor_2024_GoldenGlobes_headshoulders.png", 226, 160, 0.50, 0.30, 0.9),
    ("tour1989", "taylor_2015_1989Tour_fulllength.jpg", 200, 160, 0.47, 0.2, 0.8),
    ("letterman", "taylor_2012_Letterman_street_fulllength.jpg", 186, 160, 0.45, 0.30, 0.85),
    ("redgma", "taylor_2012_Red_GMA_reddress.jpg", 230, 160, 0.58, 0.2, 0.62),
    ("fearless", "taylor_2010_FearlessTour_kneeup.jpg", 156, 160, 0.50, 0.30, 0.75),
    ("acms", "press_2010_ACMs_interview.jpg", 170, 160, 0.45, 0.3, 0.75),
    ("stride", "taylor_2024_ErasTour_stride_fulllength.jpg", 216, 160, 0.42, 0.47, 0.75),
    ("thighup", "taylor_2019_Lover_thighup.jpg", 210, 160, 0.53, 0.30, 0.85),
    ("gown", "taylor_2024_ErasTour_gown_fulllength.jpg", 176, 160, 0.53, 0.47, 0.42),
    ("tiff", "press_2013_TIFF_crowd.jpg", 186, 160, 0.42, 0.45, 0.85),
    ("gg13", "press_2013_GoldenGlobes_redcarpet.jpg", 200, 160, 0.52, 0.48, 0.75),
    ("gg24b", "taylor_2024_GoldenGlobes_headshoulders.png", 220, 160, 0.50, 0.40, 0.95),
    ("speaknowb", "taylor_2012_SpeakNowTour_kneeup.jpg", 166, 160, 0.40, 0.30, 0.6),
]

only = set(sys.argv[2:])
for name, file, cw, ch, fx, fy, zoom in PRINTS:
    if only and name not in only:
        continue
    im = ImageOps.exif_transpose(Image.open(SRC / file))
    W, H = im.size
    asp = cw / ch
    bw, bh = (W, W / asp) if W / H < asp else (H * asp, H)
    bw, bh = bw * zoom, bh * zoom
    x0 = min(max(fx * W - bw / 2, 0), W - bw)
    y0 = min(max(fy * H - bh / 2, 0), H - bh)
    box = f"{round(x0)},{round(y0)},{round(x0 + bw)},{round(y0 + bh)}"
    out = OUT / f"empire_print_{name}.png"
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/clips/wip-anthropic/bake-photo.py"), str(SRC / file), str(out),
         "--crop", box, "--max", str(round(2 * max(cw, ch)))],
        check=True,
    )
