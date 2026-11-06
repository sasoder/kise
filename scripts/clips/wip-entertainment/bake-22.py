"""Cut 22 (FiveFranchises): the five 2025 posters and the five originals they came from, as flat b&w prints.

Copies the raws into assets-src/wip-entertainment/22/ (once), crops each to one 2:3 window, and grades it with the
clip's one photo grade (scripts/clips/wip-anthropic/bake-photo.py: greyscale, matched levels, local contrast) into
public/wip-entertainment/ff_<name>.jpg. No matte: RoughCutPrint's `rect` mode cuts the border at render time.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-entertainment/bake-22.py "<assets_raw>/22"
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

RAW = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets-src/wip-entertainment/22"
OUT = ROOT / "public/wip-entertainment"
BAKE = ROOT / "scripts/clips/wip-anthropic/bake-photo.py"
SRC.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

# file -> (output name, mid-tone of the print[, channel mix]). The window is the largest centred 2:3 box. A channel mix
# replaces the grade's luminance where a coloured title would go grey on its ground (Lilo 2002: red lettering on a pale
# sky, so red counts for little and the title prints dark).
FILES = {
    "rank1_NeZha2.jpg": ("ff_nezha2", 0.50),
    "rank1_orig_NeZha_2019.jpg": ("ff_nezha_2019", 0.46),
    "rank2_Zootopia2.jpg": ("ff_zootopia2", 0.50),
    "rank2_orig_Zootopia_2016.jpg": ("ff_zootopia_2016", 0.48),
    "rank3_AvatarFireAndAsh.jpg": ("ff_avatar3", 0.44),
    "rank3_orig_Avatar_2009.jpg": ("ff_avatar_2009", 0.40),
    "rank4_LiloAndStitch.jpg": ("ff_lilo2025", 0.48),
    "rank4_orig_LiloAndStitch_2002.jpg": ("ff_lilo_2002", 0.52, (0.05, 0.55, 0.40)),
    "rank5_AMinecraftMovie.jpg": ("ff_minecraft_movie", 0.50),
    "rank5_orig_Minecraft_game_2011.jpg": ("ff_minecraft_2011", 0.52),
}

TMP = Path(tempfile.mkdtemp(prefix="bake22-"))
for name, spec in FILES.items():
    out, mid = spec[0], spec[1]
    raw = SRC / name
    if not raw.exists():
        shutil.copy2(RAW / name, raw)
    src = raw
    if len(spec) > 2:
        rgb = np.asarray(Image.open(raw).convert("RGB"), dtype=np.float32)
        g = rgb @ np.array(spec[2], dtype=np.float32)
        src = TMP / f"{out}_mix.png"
        Image.fromarray(np.clip(g + 0.5, 0, 255).astype(np.uint8), "L").convert("RGB").save(src)
    w, h = Image.open(src).size
    if w / h > 2 / 3:
        cw = round(h * 2 / 3)
        box = ((w - cw) // 2, 0, (w - cw) // 2 + cw, h)
    else:
        ch = round(w * 3 / 2)
        box = (0, (h - ch) // 2, w, (h - ch) // 2 + ch)
    subprocess.run(
        [sys.executable, str(BAKE), str(src), str(TMP / f"{out}.png"), "--crop", ",".join(map(str, box)), "--max", "1050", "--mid", str(mid)],
        check=True,
    )
    # no alpha in a flat poster: a JPEG keeps public/ light (every render copies it)
    Image.open(TMP / f"{out}.png").convert("RGB").save(OUT / f"{out}.jpg", quality=92)
