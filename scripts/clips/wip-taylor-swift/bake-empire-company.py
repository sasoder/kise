"""The two company prints for EmpireOfHerself (wip-taylor-swift, cut 42), through the one grade (bake-photo.py):

  public/wip-taylor-swift/empire_meta.png      the Meta sign at 1 Hacker Way, cropped to the sign face round its mark,
                                               the photo's own mark painted out to the sign's white, so the mark printed
                                               over it in indigo ink (the cut's InkPrint) lands on a clean face
  public/wip-taylor-swift/empire_starship.png  Starship on its launch tower, flight 5 (Oct 2024), a tall strip

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-taylor-swift/bake-empire-company.py \\
      "<working folder>/animation_source/assets_raw/empire" <scratch>

Prints where the photo's mark sat (crop px), for placing the ink.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter

SRC = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "wip-taylor-swift"
BAKE = ROOT / "scripts/clips/wip-anthropic/bake-photo.py"

# Meta: crop x 309-729, y 0-528 of the 1080 x 810 photo (above the sign's dark name bar)
META_CROP = (309, 0, 729, 528)
im = Image.open(SRC / "meta_hq_infinity_sign_1HackerWay_a.jpg").convert("RGB").crop(META_CROP)
a = np.asarray(im, dtype=np.float64)
lum = a.mean(-1) / 255
blue = (a[..., 2] - a[..., 0]) / 255
# the sign face: the bright rows below the trees; the mark: saturated blue on it
mark = (blue > 0.12) & (np.arange(a.shape[0])[:, None] > 200)
mark = binary_dilation(mark, iterations=7)
ys, xs = np.nonzero(mark)
print("meta mark (crop px): x", xs.min(), xs.max(), "y", ys.min(), ys.max(), "of", im.size)
# the face's own tone and soft shading, from the face around the mark
face = (~mark) & (lum > 0.75) & (np.arange(a.shape[0])[:, None] > 205)
fill = np.zeros_like(a)
for c in range(3):
    ch = np.where(face, a[..., c], 0)
    w = gaussian_filter(face.astype(np.float64), 25)
    fill[..., c] = gaussian_filter(ch, 25) / np.maximum(w, 1e-3)
soft = gaussian_filter(mark.astype(np.float64), 1.2)[..., None]
clean = a * (1 - soft) + fill * soft
tmp = SCRATCH / "meta_clean.png"
Image.fromarray(np.clip(clean, 0, 255).astype(np.uint8)).save(tmp)
subprocess.run([sys.executable, str(BAKE), str(tmp), str(OUT / "empire_meta.png"), "--max", "900", "--mid", "0.55"], check=True)

# Starship: x 800-1585 of 2308, full height
subprocess.run(
    [sys.executable, str(BAKE), str(SRC / "spacex_starship_launch_c.jpg"), str(OUT / "empire_starship.png"), "--crop", "800,0,1585,2470", "--max", "1400", "--mid", "0.5"],
    check=True,
)
