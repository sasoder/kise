"""Bake the photos and covers of RichAuthors (wip-ya-boom, cut 21) into public/wip-ya-boom/ with the kit's one grade.

Covers are flat rectangles (no matte); people get the Apple Vision person matte first, then any stray background figure
the matte caught is erased by a polygon (fractions of the image). Run from the kise repo root:
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-RichAuthors.py [--only covers|people]
Prints each output's aspect for the component.
"""
import argparse
import os
import subprocess
import sys
import tempfile

RAW = "/Users/tom/Documents/tom fant/wip/nov/entertainment industry + ya boom/ya boom/animation_source/assets_raw"
OUT = "public/wip-ya-boom"
BAKE = ["uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python", "scripts/clips/wip-anthropic/bake-photo.py"]

COVERS = [
    ("covers/cover_Twilight.jpg", "ra_twilight.png"),
    ("covers/cover_NewMoon.jpg", "ra_newmoon.png"),
    ("covers/cover_Eclipse.jpg", "ra_eclipse.png"),
    ("covers/cover_BreakingDawn.jpg", "ra_breakingdawn.png"),
    ("covers/cover_TheHungerGames.jpg", "ra_hungergames.png"),
]
# (raw, out, extra bake args, erase polygons in image fractions)
PEOPLE: list = [
    # the 1999 portrait: a dark figure behind her right shoulder is caught by the matte
    (
        "portraits/portrait_JKRowling_1999.jpg",
        "ra_rowling.png",
        ["--max", "1200", "--mid", "0.4"],
        [[(0.6855, 0), (1, 0), (1, 0.625), (0.871, 0.558), (0.827, 0.417), (0.821, 0.233), (0.762, 0.067)]],
    ),
    # Time 100, 2010: the man beside her at the left edge is caught by the matte
    (
        "portraits/portrait_SuzanneCollins_2010.jpg",
        "ra_collins.png",
        ["--max", "1400", "--mid", "0.42"],
        [[(0, 0), (0.158, 0), (0.158, 0.62), (0.105, 0.72), (0, 0.79)]],
    ),
    ("portraits/portrait_StephenieMeyer_2012_smiling_crop.jpg", "ra_meyer.png", ["--max", "1400", "--mid", "0.42", "--crop", "0,250,2376,3168"], []),
]

p = argparse.ArgumentParser()
p.add_argument("--only", choices=["covers", "people"])
a = p.parse_args()
os.makedirs(OUT, exist_ok=True)

if a.only in (None, "covers"):
    for raw, out in COVERS:
        subprocess.run(BAKE + [os.path.join(RAW, raw), os.path.join(OUT, out), "--max", "900", "--mid", "0.5"], check=True)

if a.only in (None, "people"):
    with tempfile.TemporaryDirectory() as tmp:
        from PIL import Image, ImageDraw

        for raw, out, extra, erase in PEOPLE:
            mask = os.path.join(tmp, out.replace(".png", "_mask.png"))
            subprocess.run(["swift", "scripts/clips/neal-stephenson-trailer/neal-matte.swift", os.path.join(RAW, raw), mask, "person"], check=True)
            if erase:
                m = Image.open(mask).convert("L")
                d = ImageDraw.Draw(m)
                for poly in erase:
                    d.polygon([(x * m.width, y * m.height) for x, y in poly], fill=0)
                m.save(mask)
            subprocess.run(BAKE + [os.path.join(RAW, raw), os.path.join(OUT, out), "--matte", mask, "--max", "1400"] + extra, check=True)
sys.exit(0)
