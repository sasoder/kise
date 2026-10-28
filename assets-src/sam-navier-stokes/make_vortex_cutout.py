#!/usr/bin/python3
"""make_vortex_cutout.py - the vortex photo cut-out for sam-navier-stokes cut 1 (HundredthOfTheCost).

Source (default): OpenAI's own illustration of the Navier-Stokes blow-up vortex (3D streamline tubes on white,
unlabelled), the original of the user's reference picture: assets-src/sam-navier-stokes/openai_vortex_hires.png
(1300 x 1452). The user's first, low-res copy is assets-src/sam-navier-stokes/user_vortex.png (1030 x 580). Any other
original: pass its path as the first argument and rerun; both outputs are regenerated and the component reads only
them (its on-screen size and axis come from VORTEX_BOX / VORTEX_AXIS_U, so a new source lands in the same framing).

What it does (white -> alpha, a soft matte that keeps the thin tube tips):
  * WHITE  = the paper of the source (the median of its border pixels, per channel; 253 in the OpenAI original).
  * alpha  = clamp((min(WHITE) - min(R, G, B) - FLOOR) / KNEE): the picture is tubes on pure white, so a pixel's darkest
    channel says how much tube covers it. Antialiased tips (min 190..245) stay as partial alpha, never cut.
    KNEE 110: any tube colour whose darkest channel is under ~143 is solid (all of the blue/teal/orange body);
    specular highlights inside a tube keep some alpha and show paper through, which on cream reads the same.
  * a soft matte: the alpha is smoothed by a 0.6 px gaussian (no stair-stepped edges when it is scaled up).
  * colour  = the pixel un-mixed from WHITE, F = WHITE - (WHITE - p) / alpha, so no white fringe is left in the colour
    (no halo on any ground); below alpha 0.03 the colour is the nearest solid tube colour's (a 5 px max filter).
  * cropped to the content box + 8 px, then scaled (Lanczos, straight colour + alpha) to at most MAX_H px tall:
    the vortex is ~800-850 px tall on screen, so 1000 keeps it sharp without a huge data module.
  * VORTEX_AXIS_U: the vortex's straight axis line (the arrow at its top), as a share of the PNG's width: the
    alpha-weighted mean x of the top 2 % of the content box.
Outputs (overwritten):
  public/sam-navier-stokes/vortex_cutout.png                     the RGBA cut-out (straight alpha)
  generated/components/sam-navier-stokes/vortexData.ts           the same PNG as a data: URL (CRAFT: bitmaps inside
                                                                 an SVG are inlined) + its size and content box
Run from the kise root:  /usr/bin/python3 assets-src/sam-navier-stokes/make_vortex_cutout.py [source.png]
"""
import base64
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets-src/sam-navier-stokes/openai_vortex_hires.png"
OUT_PNG = ROOT / "public/sam-navier-stokes/vortex_cutout.png"
OUT_TS = ROOT / "generated/components/sam-navier-stokes/vortexData.ts"
FLOOR = 2.0
KNEE = 110.0
PAD = 8
MAX_H = 1000

rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float64)
mn = rgb.min(axis=2)
border = np.concatenate([rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3), rgb[:, :3].reshape(-1, 3), rgb[:, -3:].reshape(-1, 3)])
WHITE = np.median(border, axis=0)
alpha = np.clip((WHITE.min() - mn - FLOOR) / KNEE, 0.0, 1.0)
# soft matte
alpha_img = Image.fromarray((alpha * 255).round().astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
alpha = np.asarray(alpha_img).astype(np.float64) / 255.0

# un-mix from white
a3 = np.maximum(alpha, 1e-3)[..., None]
fg = WHITE - (WHITE - rgb) / a3
fg = np.clip(fg, 0, 255)
# where alpha is tiny, borrow the nearest solid colour (a max filter on the solid-weighted colour)
solid = alpha > 0.5
fill = np.zeros_like(rgb)
for c in range(3):
    ch = np.where(solid, rgb[..., c], 0).astype(np.uint8)
    # spread darker tube colours outward: invert, max-filter, invert back (a min filter on solid pixels)
    inv = Image.fromarray(np.where(solid, 255 - ch, 0).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    fill[..., c] = 255 - np.asarray(inv).astype(np.float64)
weak = alpha < 0.03
fg[weak] = fill[weak]

ys, xs = np.where(alpha > 0.01)
x0, x1 = max(0, xs.min() - PAD), min(rgb.shape[1], xs.max() + 1 + PAD)
y0, y1 = max(0, ys.min() - PAD), min(rgb.shape[0], ys.max() + 1 + PAD)
rgba = np.dstack([fg, alpha * 255.0])[y0:y1, x0:x1].round().astype(np.uint8)
img = Image.fromarray(rgba)
if img.height > MAX_H:
    # scale colour and alpha separately (straight alpha), so no dark or white fringe is resampled into the edge
    sz = (round(img.width * MAX_H / img.height), MAX_H)
    prem = (rgba[..., :3].astype(np.float64) * (rgba[..., 3:4] / 255.0)).round().astype(np.uint8)
    p2 = np.asarray(Image.fromarray(prem).resize(sz, Image.LANCZOS)).astype(np.float64)
    a2 = np.asarray(Image.fromarray(rgba[..., 3]).resize(sz, Image.LANCZOS)).astype(np.float64)
    c2 = np.clip(p2 / np.maximum(a2[..., None] / 255.0, 1e-3), 0, 255)
    rgba = np.dstack([c2, a2]).round().astype(np.uint8)
    img = Image.fromarray(rgba)
OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT_PNG, optimize=True)

# the content box inside the crop (alpha > 0.25): where the vortex itself starts and ends
cy, cx = np.where(rgba[..., 3] > 64)
box = (int(cx.min()), int(cy.min()), int(cx.max() + 1), int(cy.max() + 1))
band = rgba[box[1] : box[1] + max(2, round(0.02 * (box[3] - box[1]))), :, 3].astype(np.float64)
axis_u = float((band.sum(axis=0) * np.arange(img.width)).sum() / band.sum() + 0.5) / img.width
buf = io.BytesIO()
img.save(buf, format="PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode("ascii")
OUT_TS.parent.mkdir(parents=True, exist_ok=True)
OUT_TS.write_text(
    "// vortexData - the vortex photo cut-out of sam-navier-stokes cut 1, inlined as a data: URL (CRAFT \"Bitmaps\n"
    "// inside an SVG\"). GENERATED by assets-src/sam-navier-stokes/make_vortex_cutout.py from the user's reference\n"
    f"// picture {SRC.name} (supplied by the user for this clip). Do not edit by hand; rerun the script.\n"
    f"export const VORTEX_W = {img.width};\n"
    f"export const VORTEX_H = {img.height};\n"
    f"/** the vortex's own box inside the PNG (alpha > 0.25): x0, y0, x1, y1 in PNG px */\n"
    f"export const VORTEX_BOX = [{box[0]}, {box[1]}, {box[2]}, {box[3]}] as const;\n"
    f"/** the vortex's straight axis line as a share of the PNG's width */\n"
    f"export const VORTEX_AXIS_U = {axis_u:.4f};\n"
    f"export const VORTEX_SRC = \"data:image/png;base64,{b64}\";\n"
)
print(f"{SRC.name} (white {WHITE}) -> {OUT_PNG.relative_to(ROOT)} {img.width}x{img.height}, box {box}, axis {axis_u:.4f}, data {len(b64) / 1024:.0f} KB")
