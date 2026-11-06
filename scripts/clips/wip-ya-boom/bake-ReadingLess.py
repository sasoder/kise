"""ReadingLess (wip-ya-boom, cut 46): the reader cut-out.

Missouri State Archives, "Historic Fashion - 1910s" glass plate (assets_raw/photos/reader_Woman1910sSeatedReading.jpg),
person matte from neal-matte.swift, cropped head to skirt, through the kit's one grade (bake-photo.py).

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <src.jpg> <scratch>/reader_mask.png person
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-ReadingLess.py \
      <src.jpg> <scratch>/reader_mask.png
"""
import subprocess
import sys

SRC, MASK = sys.argv[1:3]
CROP = (430, 1080, 1720, 2900)  # head to the skirt, source px (aspect 0.7086)
subprocess.run(
    [sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", SRC, "public/wip-ya-boom/rl_reader.png", "--matte", MASK,
     "--crop", ",".join(map(str, CROP)), "--max", "1400"],
    check=True,
)
