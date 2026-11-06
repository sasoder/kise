"""Bake the spines and the hand of AcceleratingDemise (wip-ya-boom, cut 68) into public/wip-ya-boom/ad_*.png.

Spines: a horizontal band of a real front cover (the author's name, or a strip of the cover art with no lettering) cut out as
a flat strip, so a stack of them reads as book spines seen side-on; the kit's one grade, no matte. The photocopy finish is
added at render time by yaShared.tsx's XeroxCutOut.
Hand: assets_raw/photos/hand_ReachingBookOnShelf_colour.jpg (the back of a hand with its fingers on a shelf), a traced
scissor-cut polygon (the automatic mattes miss the fingers), turned upside down so the fingers hang over the top of a lying
spine and the wrist runs up out of the frame.

Run from the kise repo root:
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-AcceleratingDemise.py [--only spines|hand]
"""
import argparse
import os
import subprocess
import tempfile

RAW = "/Users/tom/Documents/tom fant/wip/nov/entertainment industry + ya boom/ya boom/animation_source/assets_raw"
OUT = "public/wip-ya-boom"
BAKE = ["uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python", "scripts/clips/wip-anthropic/bake-photo.py"]

# out name: (cover, band top and bottom as fractions of the cover's height, side trim as a fraction of its width, print median)
SPINES = {
    # the authors' names
    "ad_fw_yarros": ("cover_FourthWing.jpg", 0.862, 0.962, 0.03, 0.55),
    "ad_if_yarros": ("cover_IronFlame.jpg", 0.858, 0.962, 0.03, 0.42),
    "ad_os_yarros": ("cover_OnyxStorm.jpg", 0.858, 0.962, 0.03, 0.4),
    "ad_iewu_hoover": ("cover_ItEndsWithUs.jpg", 0.798, 0.936, 0.02, 0.56),
    "ad_iswu_hoover": ("cover_ItStartsWithUs.jpg", 0.742, 0.882, 0.02, 0.5),
    "ad_verity_hoover": ("cover_Verity.jpg", 0.834, 0.94, 0.04, 0.36),
    "ad_hm_mcfadden": ("cover_TheHousemaid.jpg", 0.882, 0.962, 0.03, 0.42),
    "ad_acotar_maas": ("cover_ACourtOfThornsAndRoses_2020.jpg", 0.842, 0.922, 0.03, 0.46),
    # strips of the same covers' art, no lettering (they pass through the caption bands)
    "ad_fw_art": ("cover_FourthWing.jpg", 0.676, 0.776, 0.03, 0.5),
    "ad_if_art": ("cover_IronFlame.jpg", 0.66, 0.765, 0.03, 0.42),
    "ad_os_art": ("cover_OnyxStorm.jpg", 0.70, 0.80, 0.03, 0.42),
    "ad_verity_art": ("cover_Verity.jpg", 0.60, 0.70, 0.04, 0.36),
    "ad_hm_art": ("cover_TheHousemaid.jpg", 0.155, 0.255, 0.03, 0.42),
    "ad_fw_art2": ("cover_FourthWing.jpg", 0.165, 0.265, 0.03, 0.5),
    "ad_hm_eye": ("cover_TheHousemaid.jpg", 0.33, 0.43, 0.03, 0.42),
    "ad_if_art2": ("cover_IronFlame.jpg", 0.77, 0.85, 0.03, 0.42),
}

HAND = "hand_ReachingBookOnShelf_colour.jpg"
# the right-hand hand (back of the hand, fingers up, bracelet at the wrist) traced as a scissor-cut polygon; points in the
# photo's pixels (the 2300 x 2381 window from x 2100, y 1250, traced at 900/2300 scale); the photo is then turned upside
# down, so the fingers hang down over the spine and the wrist runs up out of frame
HAND_WIN = (2100, 1250, 4400, 3631)
HAND_POLY = [(395, 790), (405, 700), (410, 560), (405, 480), (415, 410), (440, 390), (470, 370), (490, 300), (500, 200),
             (510, 140), (530, 118), (560, 108), (578, 118), (590, 112), (605, 118), (620, 95), (630, 65), (650, 62), (660, 80),
             (665, 130), (667, 200), (668, 260), (666, 335), (668, 375), (678, 398), (700, 402), (720, 385),
             (739, 339), (758, 297), (771, 259), (784, 233), (792, 202), (800, 190),
             (812, 200), (812, 240), (805, 290), (790, 340), (775, 390), (760, 430), (740, 470), (720, 500), (690, 550),
             (660, 600), (640, 650), (632, 700), (640, 790)]

p = argparse.ArgumentParser()
p.add_argument("--only", choices=["spines", "hand"])
a = p.parse_args()
os.makedirs(OUT, exist_ok=True)

if a.only in (None, "spines"):
    from PIL import Image

    for out, (raw, y0, y1, side, mid) in SPINES.items():
        src = os.path.join(RAW, "covers", raw)
        w, h = Image.open(src).size
        crop = f"{round(side * w)},{round(y0 * h)},{round((1 - side) * w)},{round(y1 * h)}"
        subprocess.run(BAKE + [src, os.path.join(OUT, f"{out}.png"), "--crop", crop, "--max", "900", "--mid", str(mid)], check=True)

if a.only in (None, "hand"):
    from PIL import Image, ImageDraw

    src = os.path.join(RAW, "photos", HAND)
    k = (HAND_WIN[2] - HAND_WIN[0]) / 900
    with tempfile.TemporaryDirectory() as tmp:
        win = Image.open(src).convert("RGB").crop(HAND_WIN)
        mask = Image.new("L", win.size, 0)
        ImageDraw.Draw(mask).polygon([(x * k, y * k) for x, y in HAND_POLY], fill=255)
        turned_src = os.path.join(tmp, "hand_turned.png")
        turned_mask = os.path.join(tmp, "hand_turned_mask.png")
        win.transpose(Image.Transpose.ROTATE_180).save(turned_src)
        mask.transpose(Image.Transpose.ROTATE_180).save(turned_mask)
        # turned, the hand spans x 225-1290, y 330-2215 of the window; crop to it with a little air
        subprocess.run(BAKE + [turned_src, os.path.join(OUT, "ad_hand_down.png"), "--matte", turned_mask, "--crop", "200,300,1320,2240", "--max", "1100", "--mid", "0.5"], check=True)
