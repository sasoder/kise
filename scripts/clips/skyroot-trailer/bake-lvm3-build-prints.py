#!/usr/bin/env python3
"""Bake the three LVM3 build prints for TeamThatBuiltLVM3 (skyroot-trailer, cut 17).

Crops and downsizes the director's sourced ISRO photos (GODL-India, credit ISRO; credits in the working folder's
images/image_sources.txt) into public/skyroot-trailer/lvm3_build_{a,b,c}.jpg. Colour is kept: the cut grades them with
SKYROOT_FILTER at render time. Run with /usr/bin/python3 (it has PIL).
"""
from pathlib import Path
from PIL import Image

SRC = Path("/Users/tom/Documents/tom fant/core memory podcast/nov/SKYROOT/trailer_SKYROOT/images")
OUT = Path(__file__).resolve().parents[3] / "public" / "skyroot-trailer"

# name: (source file, crop box in src px (x0, y0, x1, y1), output width)
PRINTS = {
    # S200 strap-ons integrated with the L110 core (2017): portrait 3:4 on the stack, the gantry rails at its foot
    "lvm3_build_a.jpg": ("18.5a_TeamWhichBuilt_LVM3BoostersAndCore2017.jpg", (930, 0, 2955, 2700), 690),
    # L110 liquid stage at the stage preparation facility (2017): the whole 3:2 frame
    "lvm3_build_b.jpg": ("18.5b_TeamWhichBuilt_LVM3L110Stage2017.jpg", (0, 0, 4637, 3091), 900),
    # C25 cryogenic stage (2017): the whole 3:2 frame
    "lvm3_build_c.jpg": ("18.5c_TeamWhichBuilt_LVM3C25Stage2017.jpg", (0, 0, 3186, 2124), 900),
}

for name, (src, box, w) in PRINTS.items():
    im = Image.open(SRC / src).convert("RGB").crop(box)
    h = round(w * im.height / im.width)
    im.resize((w, h), Image.LANCZOS).save(OUT / name, quality=90)
    print(name, w, h)
