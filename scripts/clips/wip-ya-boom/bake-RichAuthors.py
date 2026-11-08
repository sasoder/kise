"""Bake the photos and covers of RichAuthors (wip-ya-boom, cut 21) into public/wip-ya-boom/ with the kit's one grade, in
colour (rev 3: bake-photo.py --colour, the same levels and mid-tone per channel; the component passes `colour`).

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
# (raw, out, extra bake args, erase polygons in image fractions, red despill at the matte edge)
PEOPLE: list = [
    # the 1999 portrait: a dark figure behind her right shoulder is caught by the matte
    (
        "portraits/portrait_JKRowling_1999.jpg",
        "ra_rowling.png",
        ["--max", "1200", "--mid", "0.4"],
        [[(0.6855, 0), (1, 0), (1, 0.625), (0.871, 0.558), (0.827, 0.417), (0.821, 0.233), (0.762, 0.067)]],
        False,
    ),
    # Time 100, 2010: the man beside her at the left edge is caught by the matte; in colour the red backdrop glows through
    # the edge of her hair, so the edge gets a red despill
    (
        "portraits/portrait_SuzanneCollins_2010.jpg",
        "ra_collins.png",
        ["--max", "1400", "--mid", "0.42"],
        [[(0, 0), (0.158, 0), (0.158, 0.62), (0.105, 0.72), (0, 0.79)]],
        True,
    ),
    ("portraits/portrait_StephenieMeyer_2012_smiling_crop.jpg", "ra_meyer.png", ["--max", "1400", "--mid", "0.42", "--crop", "0,250,2376,3168"], [], False),
]


def despill_red(path: str, k: float = 1.55, full: float = 40, fade: float = 50) -> None:
    """Cap red at k x green near the matte edge (the backdrop's red caught in the hair): fully within `full` px of the edge,
    fading out over the next `fade` px. Her hair inside runs R/G ~1.26 (p99 2.0 with lips and skin, all far from the edge),
    the edge band ~2.3, so the cap only touches the spill."""
    import numpy as np
    from PIL import Image
    from scipy.ndimage import distance_transform_edt

    a = np.asarray(Image.open(path), dtype=np.float64)
    d = distance_transform_edt(a[..., 3] > 127)
    w = np.clip((full + fade - d) / fade, 0, 1)
    r, g = a[..., 0], a[..., 1]
    a[..., 0] = r - w * np.maximum(r - k * g, 0)
    Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8), "RGBA").save(path, optimize=True)
    print(f"{path}: red despill at the edge")


p = argparse.ArgumentParser()
p.add_argument("--only", choices=["covers", "people"])
a = p.parse_args()
os.makedirs(OUT, exist_ok=True)

if a.only in (None, "covers"):
    for raw, out in COVERS:
        subprocess.run(BAKE + [os.path.join(RAW, raw), os.path.join(OUT, out), "--max", "900", "--mid", "0.5", "--colour"], check=True)

if a.only in (None, "people"):
    with tempfile.TemporaryDirectory() as tmp:
        from PIL import Image, ImageDraw

        for raw, out, extra, erase, despill in PEOPLE:
            mask = os.path.join(tmp, out.replace(".png", "_mask.png"))
            subprocess.run(["swift", "scripts/clips/neal-stephenson-trailer/neal-matte.swift", os.path.join(RAW, raw), mask, "person"], check=True)
            if erase:
                m = Image.open(mask).convert("L")
                d = ImageDraw.Draw(m)
                for poly in erase:
                    d.polygon([(x * m.width, y * m.height) for x, y in poly], fill=0)
                m.save(mask)
            subprocess.run(BAKE + [os.path.join(RAW, raw), os.path.join(OUT, out), "--matte", mask, "--max", "1400"] + extra + ["--colour"], check=True)
            if despill:
                despill_red(os.path.join(OUT, out))
sys.exit(0)
