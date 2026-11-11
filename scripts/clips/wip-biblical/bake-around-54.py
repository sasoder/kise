"""AroundTheSameModel (wip-biblical, cut 54): the near ring's people, cut out one by one and graded to the one WiP print.

Sources (clip folder, see animation_source/assets_raw/SOURCES.txt and broll/broll_sources.txt):
  - assets_raw/ai/TypingPhone_WomanTextingOnStreet_SanFrancisco2008.jpg (Ed Yourdon, CC BY-SA 2.0): the phone person at f0
  - broll/B13_GroupOnPhones.mov (RoyaltyFree4K, CC BY): people at a window on their phones (two of them used)
  - the same video's source, broll/source/group of people using their phones together [ZseLLgwQA9w].mp4 (RoyaltyFree4K,
    CC BY): three more people further along the row (at 6.0 s and 8.5 s)
Every person is a half figure, head to waist, with a straight bottom edge (the b-roll frames end at the waist; the
woman is cut at the hip, above the bicycle crossing her legs): pasted bust prints standing on the ring.

Per person: a box around them, Apple Vision's matte (person segmentation, or the foreground instance for the woman),
the connected part holding a seed point (an erosion first, so a touching neighbour comes away), then
scripts/clips/wip-anthropic/bake-photo.py for the one grade. Writes public/wip-biblical/atm_<name>.png and
generated/components/wip-biblical/aroundPeopleBake.ts (aspect, phone point as fractions of the print).

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-around-54.py <workdir>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion, label

CLIP = Path("/Users/tom/Documents/tom fant/wip/nov/ardent & bible/biblical singularity")
REPO = Path(__file__).resolve().parents[3]
WORK = Path(sys.argv[1])
WORK.mkdir(parents=True, exist_ok=True)
MATTE = REPO / "scripts/clips/neal-stephenson-trailer/neal-matte.swift"
BAKE = REPO / "scripts/clips/wip-anthropic/bake-photo.py"

# name, source, frame (None = a still), matte mode, box (x0, y0, x1, y1) in source px, seed (x, y), phone (x, y), mid
SRC13 = CLIP / "broll/source/group of people using their phones together ｜ RoyaltyFree4K [ZseLLgwQA9w].mp4"
# name, source, frame (int = frame of the b-roll .mov, float = seconds into the source video, None = a still), matte mode,
# box (x0, y0, x1, y1) in source px, seed (x, y), phone (x, y), mid
PEOPLE = [
    ("woman", CLIP / "animation_source/assets_raw/ai/TypingPhone_WomanTextingOnStreet_SanFrancisco2008.jpg", None, "fg",
     (1040, 250, 1920, 1500), (1560, 700), (1598, 866), 0.5),
    ("blueshirt", CLIP / "broll/B13_GroupOnPhones.mov", 0, "person", (978, 0, 1752, 1080), (1350, 320), (1412, 748), 0.5),
    ("vest", CLIP / "broll/B13_GroupOnPhones.mov", 0, "person", (478, 40, 955, 985), (700, 380), (640, 870), 0.46),
    ("curly", CLIP / "broll/B13_GroupOnPhones.mov", 96, "person", (1076, 160, 1656, 1080), (1330, 360), (1236, 690), 0.48),
    ("sweater", SRC13, 6.0, "person", (1130, 220, 1742, 1080), (1400, 600), (1330, 870), 0.5),
    ("redhead", SRC13, 8.5, "person", (640, 160, 1290, 1080), (980, 600), (1030, 890), 0.46),
    ("bald", SRC13, 8.5, "person", (1290, 0, 1920, 1080), (1500, 500), (1340, 850), 0.5),
]
ERODE = 7

rows = {}
for name, src, frame, mode, box, seed, phone, mid in PEOPLE:
    still = WORK / f"{name}_src.png"
    if frame is None:
        Image.open(src).convert("RGB").save(still)
    elif isinstance(frame, float):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(frame), "-i", str(src), "-frames:v", "1", str(still)], check=True)
    else:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", f"select='eq(n\\,{frame})'", "-frames:v", "1",
             "-fps_mode", "passthrough", str(still)],
            check=True,
        )
    raw = WORK / f"{name}_matte.png"
    subprocess.run(["swift", str(MATTE), str(still), str(raw), mode], check=True, capture_output=True)
    m = np.asarray(Image.open(raw).convert("L"), dtype=np.float64) / 255
    x0, y0, x1, y1 = box
    inbox = np.zeros(m.shape, bool)
    inbox[y0:y1, x0:x1] = True
    hard = (m > 0.5) & inbox
    # the connected part holding the seed, after an erosion that breaks thin bridges to a neighbour
    lab, _ = label(binary_erosion(hard, iterations=ERODE))
    keep = lab == lab[seed[1], seed[0]]
    if not keep.any() or lab[seed[1], seed[0]] == 0:
        raise SystemExit(f"{name}: seed not inside the matte")
    keep = binary_dilation(keep, iterations=ERODE + 2) & hard
    soft = np.where(keep, m, 0)
    clean = WORK / f"{name}_clean.png"
    Image.fromarray((soft * 255 + 0.5).astype(np.uint8), "L").save(clean)
    ys, xs = np.nonzero(keep)
    pad = 4
    cx0, cy0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    cx1, cy1 = min(m.shape[1], xs.max() + pad + 1), min(m.shape[0], ys.max() + 1)  # flush with the straight bottom
    out = REPO / f"public/wip-biblical/atm_{name}.png"
    res = subprocess.run(
        ["uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python", str(BAKE), str(still),
         str(out), "--matte", str(clean), "--crop", f"{cx0},{cy0},{cx1},{cy1}", "--max", "1100", "--mid", str(mid)],
        check=True, capture_output=True, text=True,
    )
    print(res.stdout.strip())
    w, h = cx1 - cx0, cy1 - cy0
    rows[name] = {
        "src": f"wip-biblical/atm_{name}.png",
        "aspect": round(w / h, 4),
        "phoneFx": round((phone[0] - cx0) / w, 4),
        "phoneFy": round((phone[1] - cy0) / h, 4),
    }

ts = REPO / "generated/components/wip-biblical/aroundPeopleBake.ts"
ts.write_text(
    "// Written by scripts/clips/wip-biblical/bake-around-54.py: the near ring's bust prints for AroundTheSameModel (cut 54).\n"
    "// aspect = w / h of the PNG; phoneFx / phoneFy = the phone, as fractions of the print. The bottom edge is the straight cut.\n"
    f"export const AROUND_PEOPLE = {json.dumps(rows, indent=2)} as const;\n"
)
print("wrote", ts)
