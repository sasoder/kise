"""The tribe's cut-outs for wip-biblical, rev 3 (Nov 12, user: "too modern ... something more like cavemen"): a bearded
storyteller in skins and six listeners cut from the wood engravings of Louis Figuier, "Primitive Man" (New York: Putnam, 1876;
drawings by Emile Bayard, engraved by Laplante, Hildibrand and others; public domain), scanned by the University of
California Libraries for the Internet Archive (primitiveman00figurich). Raw page scans and SOURCES.txt are in the clip's
animation_source/assets_raw/cavemen/.

Each figure: the plate turned upright (and mirrored where the figure must face the other way), Apple Vision's foreground
matte of the whole plate (scripts/clips/neal-stephenson-trailer/neal-matte.swift, mode fg), kept only inside a hand-drawn
polygon round the one figure (plate px, after the turn/mirror), cut straight across at the bottom like a pasted print;
below `trust` the polygon alone decides (the rock he sits on, the dark furs the matte loses). Then the clip's one grade
(wip-anthropic/bake-photo.py) and a flat red silhouette at half size for the voice's tint. Prints the tribeBake.ts lines.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-cavemen-16.py <scratch>
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "wip-biblical")
RAW = os.path.join(ROOT, "..", "..", "wip", "nov", "ardent & bible", "biblical singularity", "animation_source", "assets_raw", "cavemen")
RED = (0xE2, 0x0A, 0x39)

# plate key: (file, degrees to turn it upright (PIL rotate), mirror)
PLATES = {
    "front": ("Figuier1876_PrimitiveMan_Frontispiece_FamilyOfTheStoneAge_n9.jpg", 0, False),
    "front_m": ("Figuier1876_PrimitiveMan_Frontispiece_FamilyOfTheStoneAge_n9.jpg", 0, True),
    "fig39": ("Figuier1876_PrimitiveMan_Fig39_ManOfTheReindeerEpoch_n120.jpg", 0, False),
    "fig68": ("Figuier1876_PrimitiveMan_Fig68_ArtsOfDrawingAndSculpture_n150.jpg", 0, False),
}

# name, plate, polygon (plate px BEFORE the mirror, clockwise), trust row (plate px; 99999 = matte everywhere), mid-tone,
# the point to report (the storyteller's mouth, at the front of his beard) in plate px before the mirror
FIGURES = [
    # the storyteller: the father of the frontispiece, bearded, in skins, his arm flung back against the rock; mirrored so
    # he faces left with the open air before his mouth for the voice. Cut straight across at the thighs, above the furs
    # and the children.
    ("teller", "front_m",
     [(340, 800), (430, 790), (470, 900), (600, 980), (800, 1050), (1000, 1080), (1050, 950), (1100, 830), (1250, 780),
      (1380, 820), (1420, 930), (1420, 1050), (1380, 1120), (1500, 1200), (1650, 1300), (1720, 1450), (1690, 1600),
      (1620, 1700), (1560, 1750), (1560, 1950), (1050, 1950), (1050, 1700), (1000, 1500), (900, 1300), (780, 1200),
      (600, 1130), (450, 1030), (350, 960)], 99999, 0.46, (1385, 1000)),
    # the mother suckling her baby (frontispiece), seated, bent towards the right
    ("mother", "front",
     [(450, 1820), (600, 1760), (720, 1690), (860, 1670), (960, 1720), (1010, 1850), (1010, 1990), (1030, 2080), (1050, 2200),
      (1030, 2300), (960, 2340), (940, 2520), (160, 2520), (150, 2300), (220, 2050), (330, 1880)], 99999, 0.5, None),
    # the small boy seated with his back to us, looking up and right (frontispiece)
    ("child", "front",
     [(1090, 2520), (1150, 2450), (1300, 2430), (1430, 2480), (1470, 2600), (1440, 2750), (1470, 2950), (1500, 3150),
      (1520, 3330), (1080, 3330), (1060, 3150), (1080, 2900), (1080, 2700)], 99999, 0.5, None),
    # the older boy crouched over his work, facing left (frontispiece); a bust, cut across his back (he sits at the back)
    ("crouching_boy", "front",
     [(1480, 2380), (1560, 2260), (1680, 2230), (1800, 2270), (1880, 2380), (2000, 2440), (2100, 2560), (2130, 2760),
      (1460, 2760), (1440, 2520)], 99999, 0.5, None),
    # the young woman seated on a rock, looking straight out (Fig. 39); a bust cut across at the chest, clear of the
    # man's leg (she sits at the back)
    ("seated_woman", "fig39",
     [(1290, 1800), (1420, 1700), (1430, 1450), (1550, 1370), (1700, 1400), (1770, 1550), (1780, 1700), (1900, 1800),
      (1980, 1960), (1290, 1960)], 99999, 0.5, None),
    # the man crouched over his carving, facing right (Fig. 68, left); cut across above the reclining man's knee
    ("carver", "fig68",
     [(230, 1800), (330, 1720), (450, 1690), (560, 1700), (640, 1770), (720, 1850), (760, 1950), (850, 1975), (920, 2040),
      (940, 2120), (900, 2260), (160, 2260), (160, 2050), (200, 1900)], 99999, 0.5, None),
    # the young man sitting back against the rock, knee up, facing left over his work (Fig. 68, right)
    ("reclining_man", "fig68",
     [(1560, 2120), (1700, 2050), (1850, 2070), (1930, 2160), (1960, 2300), (2060, 2380), (2120, 2550), (2110, 2800),
      (2080, 3000), (2000, 3150), (1800, 3230), (1200, 3270), (480, 3280), (460, 3180), (560, 3080), (800, 3000), (950, 2850),
      (1000, 2720), (1150, 2680), (1350, 2700), (1480, 2650), (1500, 2420), (1530, 2280)], 99999, 0.5, None),
]

scratch = sys.argv[1]
os.makedirs(scratch, exist_ok=True)
plates = {}
for key, (fn, rot, mirror) in PLATES.items():
    im = Image.open(os.path.join(RAW, fn)).convert("RGB")
    if rot:
        im = im.rotate(rot, expand=True)
    if mirror:
        im = ImageOps.mirror(im)
    png = os.path.join(scratch, f"plate_{key}.png")
    im.save(png)
    mask = os.path.join(scratch, f"plate_{key}_fg.png")
    if not os.path.exists(mask):
        subprocess.run(["swift", os.path.join(ROOT, "scripts/clips/neal-stephenson-trailer/neal-matte.swift"), png, mask, "fg"],
                       check=True, stdout=subprocess.DEVNULL)
    fg = np.asarray(Image.open(mask).convert("L").resize(im.size, Image.BICUBIC), dtype=np.float64) / 255
    plates[key] = (png, im.size, mirror, fg)

lines = {}
for name, key, poly, trust, mid, point in FIGURES:
    png, (W, H), mirror, fg = plates[key]
    if mirror:
        poly = [(W - x, y) for x, y in poly]
        point = (W - point[0], point[1]) if point else None
    pm = Image.new("L", (W, H), 0)
    ImageDraw.Draw(pm).polygon(poly, fill=255)
    # the polygon's own edge is a hand cut: a little softening, no feather
    pa = np.clip(gaussian_filter(np.asarray(pm, dtype=np.float64) / 255, 1.2), 0, 1)
    v = np.clip((fg - 0.2) / 0.6, 0, 1)
    v[int(trust):, :] = 1.0
    m = v * pa
    mask_png = os.path.join(scratch, f"{name}_mask.png")
    Image.fromarray((m * 255 + 0.5).astype(np.uint8), "L").save(mask_png)
    ys, xs = np.nonzero(m > 0.5)
    pad = 10
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + pad + 1), min(H, ys.max() + 1))
    out = os.path.join(OUT, f"tr_{name}.png")
    subprocess.run(
        [sys.executable, os.path.join(ROOT, "scripts/clips/wip-anthropic/bake-photo.py"), png, out, "--matte", mask_png,
         "--crop", ",".join(str(int(v)) for v in box), "--max", "1600", "--mid", str(mid)],
        check=True, stdout=subprocess.DEVNULL,
    )
    p = Image.open(out)
    a = np.asarray(p)[..., 3]
    sil = np.zeros((p.height, p.width, 4), np.uint8)
    sil[..., 0], sil[..., 1], sil[..., 2] = RED
    sil[..., 3] = a
    Image.fromarray(sil, "RGBA").resize((max(1, p.width // 2), max(1, p.height // 2)), Image.LANCZOS).save(
        os.path.join(OUT, f"tr_{name}_sil.png"), optimize=True
    )
    info = {"name": name, "w": p.width, "h": p.height, "aspect": round(p.width / p.height, 4), "srcH": int(box[3] - box[1])}
    if point:
        info["pointFx"] = round((point[0] - box[0]) / (box[2] - box[0]), 4)
        info["pointFy"] = round((point[1] - box[1]) / (box[3] - box[1]), 4)
    print(json.dumps(info))
