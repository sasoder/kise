"""The tribe's cut-outs for wip-biblical (cut 16 GovernedBySound owns them; tribeShared.tsx reads tribeBake.ts).

All from one real photograph: "En Bretagne. Vieux conteur breton, auditoire attentif" (postcard, E.L.D., 1910s, PD),
animation_source/assets_raw/tribe/Postcard1910s_VieuxConteurBreton_AuditoireAttentif.jpg (1280 x 818).
Each figure: a hand-cut polygon (original px; it separates the figure from its overlapping neighbours and cuts the print
straight across where the figure goes on behind another, as a pasted print), intersected with an Apple Vision person matte
of a 2-3x Lanczos upscale of the crop (or of the whole postcard at 2x, whichever is more opaque) (the edge against the dark ground), then the clip's one photo grade
(wip-anthropic/bake-photo.py), and a flat red silhouette at half size for the voice's tint. Prints a line per figure for
generated/components/wip-biblical/tribeBake.ts.

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-biblical/bake-tribe.py <scratch>
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "wip-biblical")
SRC = os.path.join(
    ROOT, "..", "..", "wip", "nov", "ardent & bible", "biblical singularity", "animation_source", "assets_raw", "tribe",
    "Postcard1910s_VieuxConteurBreton_AuditoireAttentif.jpg",
)
RED = (0xE2, 0x0A, 0x39)

# name, polygon (original px, clockwise from the top left), upscale, mid-tone, the point to report (the mouth) in original
# px, and the row (original px) below which the hand cut alone decides the edge (dark dress on the dark ground, where the
# matte is unreliable; 0 = everywhere: heads packed in the crowd, where the matte takes the whole crowd)
FIGURES = [
    ("storyteller", [(762, 140), (800, 76), (922, 70), (968, 138), (980, 168), (1000, 225), (1018, 290), (1032, 330), (1036, 460),
                     (1040, 540), (1062, 548), (1078, 566), (1074, 600), (703, 600), (704, 505), (730, 494), (800, 480), (846, 466),
                     (850, 300), (842, 262), (830, 252), (812, 234), (805, 195), (807, 163), (770, 160)], 3, 0.42, (810, 207), 999),
    ("coif_girl", [(60, 212), (128, 204), (205, 250), (235, 290), (250, 330), (282, 360), (285, 410), (270, 430), (268, 520),
                   (262, 600), (20, 600), (4, 500), (8, 450), (58, 405), (66, 320)], 2, 0.5, None, 420),
    ("hat_boy", [(291, 280), (300, 250), (320, 230), (380, 218), (415, 212), (440, 222), (458, 238), (450, 262), (440, 290),
                 (452, 318), (450, 345), (470, 352), (488, 380), (492, 520), (500, 620), (275, 620), (270, 560), (272, 420),
                 (280, 355), (300, 330), (295, 300)], 2, 0.46, None, 999),
    ("smiling_boy", [(732, 192), (748, 180), (775, 176), (797, 190), (806, 215), (800, 250), (812, 262), (838, 280), (848, 300),
                     (848, 335), (750, 335), (750, 300), (735, 275), (728, 240), (726, 210)], 2, 0.46, None, 0),
    ("curly_child", [(670, 262), (690, 248), (718, 248), (742, 258), (752, 290), (748, 322), (775, 332), (780, 385), (640, 388),
                     (645, 345), (668, 325), (662, 295)], 2, 0.48, None, 0),
    ("standing_girl", [(1075, 18), (1180, 12), (1215, 58), (1226, 120), (1212, 150), (1236, 176), (1040, 290), (1040, 180),
                       (1075, 150), (1068, 60)], 2, 0.5, None, 999),
    ("front_girl", [(1150, 205), (1276, 208), (1279, 560), (1050, 560), (1055, 440), (1100, 425), (1105, 345), (1130, 300),
                    (1138, 240)], 2, 0.5, None, 999),
]

scratch = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
os.makedirs(scratch, exist_ok=True)
src = Image.open(SRC).convert("RGB")
# a matte of the whole postcard too (2x): a crop with too little context can come back empty
full_png = os.path.join(scratch, "full_2x.png")
src.resize((src.width * 2, src.height * 2), Image.LANCZOS).save(full_png)
full_mask = os.path.join(scratch, "full_2x_vision.png")
subprocess.run(["swift", os.path.join(ROOT, "scripts/clips/neal-stephenson-trailer/neal-matte.swift"), full_png, full_mask, "person"], check=True,
               stdout=subprocess.DEVNULL)
full_m = Image.open(full_mask).convert("L").resize(src.size, Image.BICUBIC)
for name, poly, up, mid, point, trust in FIGURES:
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    pad = 12
    x0, y0 = max(0, min(xs) - pad), max(0, min(ys) - pad)
    x1, y1 = min(src.width, max(xs) + pad), min(src.height, max(ys) + pad)
    crop = src.crop((x0, y0, x1, y1))
    crop = crop.resize((crop.width * up, crop.height * up), Image.LANCZOS)
    crop_jpg = os.path.join(scratch, f"{name}_crop.png")
    crop.save(crop_jpg)
    vmask = os.path.join(scratch, f"{name}_vision.png")
    subprocess.run(["swift", os.path.join(ROOT, "scripts/clips/neal-stephenson-trailer/neal-matte.swift"), crop_jpg, vmask, "person"], check=True,
                   stdout=subprocess.DEVNULL)
    vm = np.asarray(Image.open(vmask).convert("L").resize(crop.size, Image.BICUBIC), dtype=np.float64) / 255
    vf = np.asarray(full_m.crop((x0, y0, x1, y1)).resize(crop.size, Image.BICUBIC), dtype=np.float64) / 255
    vm = np.maximum(vm, vf)
    # the hand cut, antialiased (drawn at 4x, then reduced)
    big = Image.new("L", (crop.width * 4, crop.height * 4), 0)
    ImageDraw.Draw(big).polygon([((x - x0) * up * 4, (y - y0) * up * 4) for x, y in poly], fill=255)
    pm = np.asarray(big.resize(crop.size, Image.LANCZOS), dtype=np.float64) / 255
    # Vision's matte is soft on dark coats over the dark ground: steepen it, and keep the straight bottom cut whole
    v = np.clip((vm - 0.25) / 0.5, 0, 1)
    # white coifs and collars on the dark ground: the matte misses them, their brightness does not
    g = np.asarray(crop.convert("L"), dtype=np.float64) / 255
    v = np.maximum(v, np.clip((g - 0.42) / 0.12, 0, 1))
    rows_y = (np.arange(crop.height) / up + y0)[:, None]
    v = np.where(rows_y >= trust, 1.0, v)
    m = np.minimum(v, pm)
    mask_png = os.path.join(scratch, f"{name}_mask.png")
    Image.fromarray((m * 255 + 0.5).astype(np.uint8), "L").save(mask_png)
    # crop to the matte's box
    rows = np.nonzero((m > 0.5).any(axis=1))[0]
    cols = np.nonzero((m > 0.5).any(axis=0))[0]
    mg = 4 * up
    box = (max(0, cols.min() - mg), max(0, rows.min() - mg), min(crop.width, cols.max() + mg + 1), min(crop.height, rows.max() + 1))
    out = os.path.join(OUT, f"tr_{name}.png")
    subprocess.run(
        [sys.executable, os.path.join(ROOT, "scripts/clips/wip-anthropic/bake-photo.py"), crop_jpg, out, "--matte", mask_png,
         "--crop", ",".join(str(int(v)) for v in box), "--max", "2000", "--mid", str(mid)],
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
    s = p.width / (box[2] - box[0])  # png px per crop px (bake-photo may scale down)
    info = {"name": name, "w": p.width, "h": p.height, "aspect": round(p.width / p.height, 4)}
    if point:
        info["pointFx"] = round(((point[0] - x0) * up - box[0]) * s / p.width, 4)
        info["pointFy"] = round(((point[1] - y0) * up - box[1]) * s / p.height, 4)
    print(json.dumps(info))
