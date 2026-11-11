"""The Doré prophets for wip-biblical (cut 0 owns them; cut 86 reuses them): one matte per engraving, then the one WiP grade.

Each engraving's matte is Apple Vision's foreground matte (scripts/clips/neal-stephenson-trailer/neal-matte.swift, mode fg),
kept only inside a hand-drawn polygon round the one prophet, so the onlookers, walls and rocks of the plate fall away, and
cut along a hand-cut line where another figure overlaps him. Polygons are in "plate per mille" px: the plate scaled to
1000 px wide. The combined mattes are saved to assets-src/wip-biblical/ (raw-only, read by this bake), the prints to
public/wip-biblical/pr_<name>.png through scripts/clips/wip-anthropic/bake-photo.py.

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <plate.jpg> <scratch>/m_<Plate>_fg.png fg   # once per plate
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-prophets-0.py <raw prophets dir> <scratch dir with m_*_fg.png>
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

RAW = Path(sys.argv[1])
MATTES = Path(sys.argv[2])
REPO = Path(__file__).resolve().parents[3]
SRC_OUT = REPO / "assets-src" / "wip-biblical"
PUB_OUT = REPO / "public" / "wip-biblical"
SRC_OUT.mkdir(parents=True, exist_ok=True)
PUB_OUT.mkdir(parents=True, exist_ok=True)

# name: (plate, polygon in per-mille px, mid-tone)
PROPHETS = {
    # Ezekiel prophesying: standing on a rock, right arm up, pointing up and to the right. Cut at the shins, above the
    # seated onlookers who overlap his robe's foot.
    "ezekiel": (
        "EzekielProphesying",
        [(222, 92), (650, 92), (650, 560), (560, 600), (528, 690), (512, 705), (512, 760), (470, 772), (420, 778), (372, 772),
         (322, 776), (290, 766), (266, 700), (222, 560)],
        0.5,
    ),
    # Jeremiah: thrown forward on the steps, right arm flung up to the right. Cut clear of the onlookers at his left hand
    # and of the seated man by his robe.
    "jeremiah": (
        "Jeremiah",
        [(195, 330), (255, 328), (330, 262), (600, 258), (600, 360), (525, 420), (512, 560), (505, 700), (535, 855),
         (500, 885), (440, 880), (360, 820), (318, 790), (300, 720), (280, 600), (232, 585), (195, 565)],
        0.5,
    ),
    # Saint John on Patmos: seated on his rock with tablet and pen, gazing up (to the left as engraved).
    "john": (
        "SaintJeanAPatmos",
        [(200, 262), (880, 262), (880, 1040), (200, 1040)],
        0.5,
    ),
    # Daniel: standing, head bowed, a scroll in his hand over the low wall (the wall itself falls away).
    "daniel": (
        "Daniel",
        [(80, 320), (575, 320), (575, 1075), (505, 1075), (505, 1140), (80, 1140)],
        0.48,
    ),
    # Amos: the shepherd-prophet standing on the hill with his staff, head bowed.
    "amos": (
        "ProphetAmos",
        [(150, 240), (580, 240), (580, 1080), (150, 1080)],
        0.5,
    ),
}

for name, (plate, poly, mid) in PROPHETS.items():
    src = RAW / f"Dore1866_{plate}.jpg"
    im = Image.open(src)
    W, H = im.size
    s = W / 1000
    fg = np.asarray(Image.open(MATTES / f"m_{plate}_fg.png").convert("L").resize((W, H), Image.BICUBIC), dtype=np.float64) / 255
    pm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm).polygon([(x * s, y * s) for x, y in poly], fill=255)
    # the polygon's own edge is a hand cut: a little softening, no feather
    pa = np.clip(gaussian_filter(np.asarray(pm, dtype=np.float64) / 255, 1.2), 0, 1)
    m = fg * pa
    matte = SRC_OUT / f"pr_{name}_matte.png"
    Image.fromarray((m * 255 + 0.5).astype(np.uint8), "L").save(matte, optimize=True)
    ys, xs = np.nonzero(m > 0.04)
    pad = int(24 * s)
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + pad), min(H, ys.max() + pad))
    out = PUB_OUT / f"pr_{name}.png"
    subprocess.run(
        [sys.executable, str(REPO / "scripts/clips/wip-anthropic/bake-photo.py"), str(src), str(out), "--matte", str(matte),
         "--crop", ",".join(str(v) for v in box), "--max", "1100", "--mid", str(mid)],
        check=True,
    )
    print(name, "crop", box, "per-mille", tuple(round(v / s) for v in box))
