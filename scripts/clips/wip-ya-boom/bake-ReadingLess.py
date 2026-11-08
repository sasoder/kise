"""ReadingLess (wip-ya-boom, cut 46): the reader cut-out, in colour (rev 3).

A present-day colour photo: "Woman sitting on an armchair cross legged and reading an old book", Shixart1985, 2021,
Wikimedia Commons, CC BY 2.0 (assets_raw/photos/reader_WomanArmchairCrossLeggedReading2021.jpg, 4912x7360).
The matte is neal-matte.swift's fg mode on a 1600 px copy (it keeps her and the book, drops the armchair); two scraps of
the armchair it keeps (the arm beside her raised knee, the fabric and shadow under her near knee) are cleared here. Then
bake-photo.py --colour with the crop round the whole figure (it is resized to the photo first, so the 1600 px matte fits).

  ffmpeg -i <src.jpg> -vf scale=1600:-2 -q:v 2 <scratch>/reader_1600.jpg
  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <scratch>/reader_1600.jpg <scratch>/mask_fg.png fg
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-ReadingLess.py \
      <src.jpg> <scratch>/mask_fg.png <scratch>
"""
import subprocess
import sys

from PIL import Image, ImageDraw

SRC, MASK, SCRATCH = sys.argv[1:4]
# polygons to clear, in pixels of the 1600 x 2398 copy (scaled to the matte's own size below)
CLEAR = [
    [(1095, 1200), (1600, 1200), (1600, 1430), (1095, 1430)],  # the armchair's arm beside her raised knee
    # the armchair's fabric and its shadow under her near knee, below the line of the jeans, left of her far foot
    [(0, 1440), (140, 1460), (290, 1578), (290, 2398), (0, 2398)],
]
CROP_F = (90 / 1600, 500 / 2398, 1110 / 1600, 1700 / 2398)  # the whole figure, head to feet

m = Image.open(MASK).convert("L")  # 1600 x 2398 x 1 B
k = m.size[0] / 1600
draw = ImageDraw.Draw(m)
for poly in CLEAR:
    draw.polygon([(x * k, y * k) for x, y in poly], fill=0)
out = f"{SCRATCH}/reader_mask_clean.png"
m.save(out)

sw, sh = Image.open(SRC).size
crop = (round(CROP_F[0] * sw), round(CROP_F[1] * sh), round(CROP_F[2] * sw), round(CROP_F[3] * sh))
subprocess.run(
    [sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", SRC, "public/wip-ya-boom/rl_reader.png", "--matte", out,
     "--crop", ",".join(map(str, crop)), "--max", "1400", "--colour"],
    check=True,
)
