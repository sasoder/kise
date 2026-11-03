"""TwentyMinuteWalk's five men (cut 32, rev 2): head-and-shoulders prints with a paper border, cut like cut 0's statesmen.

Every print is the same cut in head units, so the five match: H = twice the crown-to-eye distance, the print runs from just over
the crown to 1.84 H below it (the shortest source, Balfour's, allows 1.85), 0.8 as wide as tall, centred on the head. Vision's
person matte, the kit's one grade (bake-photo.py), then a pair of scissors: a very slightly uneven bottom and sides off true.

  for f in <the five files>; do swift scripts/clips/neal-stephenson-trailer/neal-matte.swift <assets_raw>/men/$f.jpg <scratch>/mask/$f.png person; done
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-victorians/bake-walk-men.py <assets_raw> <scratch>

Prints, per man, the numbers TwentyMinuteWalk.tsx keeps in MEN: the PNG's size, the crown's and the eye line's y and the head's x.
"""
import json
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

raw, scratch = sys.argv[1], sys.argv[2]
OUT = "public/wip-victorians"
L = 1.84  # print height in head units
ASPECT = 0.8
# source file, the eye line's y in the source's px (read by eye on a gridded crop)
MEN = {
    "gladstone": ("Gladstone_1892_cropped", 885),
    "salisbury": ("Salisbury_ElliottFry", 922),
    "balfour": ("Balfour_LOC2014682753", 1623),
    "rosebery": ("Rosebery_three_quarter", 554),
    "derby": ("Derby_cropped", 647),
}

res = {}
for name, (f, eye) in MEN.items():
    src = f"{raw}/men/{f}.jpg"
    im = Image.open(src)
    w, h = im.size
    m = np.asarray(Image.open(f"{scratch}/mask/{f}.png").convert("L").resize((w, h)), dtype=np.float64) / 255 > 0.5
    rows = np.where(m.sum(1) >= 20)[0]
    crown = int(rows.min())
    H = 2 * (eye - crown)
    band = m[crown : int(crown + 0.9 * H)]
    xs = np.where(band)[1]
    cx = float(xs.mean())
    pw = ASPECT * L * H
    x0 = cx - pw / 2
    x0 = min(max(0, x0), w - pw)
    y0 = crown - 0.06 * H
    y1 = crown + L * H + 0.015 * H
    if y1 > h:
        raise SystemExit(f"{name}: needs {y1:.0f} px, the source has {h}")
    box = f"{round(x0)},{round(y0)},{round(x0 + pw)},{round(y1)}"
    graded = f"{scratch}/graded_{name}.png"
    subprocess.run(
        [sys.executable, "scripts/clips/wip-anthropic/bake-photo.py", src, graded, "--matte", f"{scratch}/mask/{f}.png", "--crop", box, "--max", "900", "--mid", "0.5"],
        check=True,
    )
    rgba = np.asarray(Image.open(graded).convert("RGBA"), dtype=np.float64) / 255
    oh, ow = rgba.shape[:2]
    s = oh / (y1 - y0)
    Y, X = np.mgrid[0:oh, 0:ow].astype(np.float64)
    seed = sum(map(ord, name)) / 40
    # scissors: long straight runs, very slightly off true
    keep = Y < oh - 6 - 6 * np.sin(X / ow * 2.1 + seed) - 6 * (X / ow)
    keep &= X > 3 + 0.02 * (oh - Y) * (0.5 + 0.5 * np.sin(seed))
    keep &= X < ow - 3 - 0.02 * (oh - Y) * (0.5 + 0.5 * np.cos(seed))
    rgba[..., 3] *= gaussian_filter(keep.astype(np.float64), 0.8)
    Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA").save(f"{OUT}/tw_{name}.png", optimize=True)
    res[name] = {"W": ow, "H": oh, "crownY": round((crown - y0) * s, 1), "eyeY": round((eye - y0) * s, 1), "headX": round((cx - x0) * s, 1)}
    print(name, res[name])
print(json.dumps(res))
