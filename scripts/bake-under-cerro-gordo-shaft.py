#!/usr/bin/env python3
"""
Bake the underground of UnderCerroGordo V2 (generated/components/UnderCerroGordo.tsx):
the approved "Down the shaft" cut-away, stopping at the 200 ft level.

A WRAPPER, not a copy. scripts/bake-down-the-shaft.py is loaded as a module
(importlib; it is not modified and nothing is written next to it), three of its
module constants are overridden, and its main() is re-compiled from its own
source with the text patches listed in PATCHES below. Every patch anchor
must occur exactly once in the original, or this script stops: if the original
bake ever changes under it, it fails loudly instead of baking something else.

Same seed, same canvas (1400 x 10368), same order of random draws up to the
shaft's timbering: the rock, the soil profile, the lip, the collar and the
shaft's timbers are THE SAME PIXELS as public/cerro/shaft/underground_plate.jpg
down to the 200 ft station (checked at the end of every run, which stops if the
rock is not the original's). The only differences above the station are the
cable (2 px wide; its +-10 % tone noise is a later random draw) and the light of
this station's bigger lamp on the shaft's timbers (from world y ~1330). So the
component lays the ORIGINAL public/cerro/shaft/underground_cap.png over this
plate. From the station down the timbering is a new draw of the same code.

What differs from the original bake:
  - ONE station, at 200 ft (floor at world y 2000), built like the original's
    900 ft station: the bigger room (96 px), the lamp (r 92, k 1.2) and its
    separately saved light map, the bucket on the end of the cable, the person
    for scale at plate x 690.
  - the level leaves the shaft to the RIGHT ONLY (a drift of 445 px; the
    original 900 ft station's right-hand drift is 450. The station's rough
    roof, floor and back wall are random draws that depend on this length:
    440-480 were baked and looked at, 445 has the cleanest lamp-lit wall, and
    its heading ends at screen x ~915, just behind the clipping's edge). The
    shaft's left wall and its wall timbers run straight through the station:
    no room, no stub, no lit rock on the left. Shaft + level read "|-", never
    a cross.
  - the timbered shaft CARRIES ON DOWN under the station (no sump, no water):
    it is baked to 900 ft as in the original; the plate is cut at world y 3600.
  - the cable is baked down to world y 900; from there to the bucket the
    component draws it, so it can sway.

Outputs (public/minedeath/):
  ucg2_plate.jpg           1400 x 3572, opaque. Plate x 0..1400, world y 28..3600
                           (world y 0 = the cut lip, 10 px = 1 ft, shaft centre
                           plate x 530), as the original plate.
  ucg2_station_light.png   1020 x 230, the lamp's own light on the 200 ft
                           station (plate x 110, world y 1840), on black.
Nothing under public/cerro/shaft/ is written. This run's cap and grain tile are
not saved: the component loads the original's (the cap's ground, far edge and
brush are random draws made after the stations, so this run's cap is a different
draw of the same ground; the original's is the approved one, and its face rows
are this plate's pixels).

Run:  python3 scripts/bake-under-cerro-gordo-shaft.py [--crops DIR]
"""
import importlib.util
import os
import sys

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
sys.dont_write_bytecode = True  # no .pyc next to the original

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, "scripts", "bake-down-the-shaft.py")
OUT = os.path.join(ROOT, "public", "minedeath")

PLATE_Y1 = 3600  # world y of the plate's last row (the frame's lower edge reaches ~3170 at the end of the hold)
WALL = 7.4  # px of the shaft's left side (its wall timber) that the station's room leaves alone

# the 200 ft station, with the original 900 ft station's room, lamp and timber, opened to the right only
# (right: see the header before changing it; every length is a different draw of the station's rock)
HERO = dict(y=2000, left=0, right=445, h=72, room=96, lamp=+1, lamp_dx=52, lamp_r=92.0, lamp_k=1.2)
CABLE_LIVE_Y = 900

# (anchor in the original main(), replacement). Each anchor must occur exactly once.
PATCHES = [
    # 1. no sump under this station: the shaft's timbers start again 4 px under its floor, as at a passing station
    ("(SUMP if s is BOTTOM_STATION else 4)", "4"),
    # 2. the left wall timbers run straight through the station (only the right ones stop at its roof)
    (
        "            for a, b in station_rows:  # they stop at the roof of a station and start again at its floor\n",
        "            for a, b in (station_rows if side > 0 else ()):  # the right ones stop at the roof of the station and start again at its floor\n",
    ),
    # 3. one drift, to the right; open_ is 0 on the shaft's left wall and left of it
    (
        '        length = np.where(xf < SHAFT_X, float(st["left"]), float(st["right"])).astype(np.float32)\n',
        '        length = np.full(n, float(st["right"]), np.float32)\n        open_ = smoothstep(-0.7, 0.7, xf - (XL + UCG_WALL))\n',
    ),
    # 4. the room ends at the shaft's left wall timber
    (
        "        m *= smoothstep(1.0, -1.0, dl[None, :] - (length[None, :] + jag[:, None]))\n",
        "        m *= smoothstep(1.0, -1.0, dl[None, :] - (length[None, :] + jag[:, None]))\n        m *= open_[None, :]\n",
    ),
    # 5, 6. no shadow line and no lamp light on the rock left of the shaft
    ("        edge_ = gauss(m, 2.4) * (1 - m)\n", "        edge_ = gauss(m, 2.4) * (1 - m) * open_[None, :]\n"),
    (
        "        prox = gauss(m, 11.0) * (1 - m)  # a little of the light on the cut rock around the opening\n",
        "        prox = gauss(m, 11.0) * (1 - m) * open_[None, :]  # a little of the light on the cut rock around the opening\n",
    ),
    # 7, 8. the shaft's cap and sill at the station start at the left wall timber: nothing sticks out to the left
    ("        sc.rect(XL - 12, capy, XR + 12, capy + 7.2,", "        sc.rect(XL + 5.5, capy, XR + 12, capy + 7.2,"),
    ("        sc.rect(XL - 16, yf - 4.2, XR + 16, yf + 1.0,", "        sc.rect(XL + 5.5, yf - 4.2, XR + 16, yf + 1.0,"),
    # 9. one post frames the shaft, on the side of the level (the left wall timber is the other one)
    (
        "    for side in (-1, 1):\n        px_ = XL - 7.5 if side < 0 else XR + 1.5\n",
        "    for side in (1,):\n        px_ = XL - 7.5 if side < 0 else XR + 1.5\n",
    ),
    # 10. (the sump block is cut out below, between its two comment lines)
    # 11-15. outputs: new names under public/minedeath/, the plate cut at PLATE_Y1; the cap and the grain are not saved
    ('.save(os.path.join(SRC, "station_light.png"), optimize=True)', '.save(os.path.join(UCG_OUT, "ucg2_station_light.png"), optimize=True)'),
    ("    plate = Image.fromarray(u8[TOP + PLATE_Y0 :])\n", "    plate = Image.fromarray(u8[TOP + PLATE_Y0 : TOP + UCG_PLATE_Y1])\n"),
    ('    plate.save(os.path.join(SRC, "underground_plate.jpg"),', '    plate.save(os.path.join(UCG_OUT, "ucg2_plate.jpg"),'),
    ('    Image.fromarray(cap).save(os.path.join(SRC, "underground_cap.png"), optimize=True)\n', "    del cap  # underground_cap.png: the component loads the original's\n"),
    (
        '    Image.fromarray(np.clip(128 + g * 30, 0, 255).astype(np.uint8)).save(os.path.join(SRC, "grain_tile.png"), optimize=True)\n',
        "    del g  # grain_tile.png: the component loads the original's\n",
    ),
    # 16. the review crops: this plate's own
    ('        crop("plate_mid.jpg", 4500)\n        crop("plate_bottom.jpg", 9000)\n', '        crop("plate_landed.jpg", 2104)\n'),
]
SUMP_FROM = "    # the sump: black water a little under the floor\n"
SUMP_TO = "    # the hoist cable\n"


def patched_main_source():
    text = open(ORIG, encoding="utf-8").read()
    start = text.index("\ndef main():\n") + 1
    end = text.index('\nif __name__ == "__main__":')
    src = text[start:end]
    for anchor, repl in PATCHES:
        if src.count(anchor) != 1:
            raise SystemExit(f"bake-down-the-shaft.py has changed: {src.count(anchor)} x {anchor!r}")
        src = src.replace(anchor, repl)
    if src.count(SUMP_FROM) != 1 or src.count(SUMP_TO) != 1:
        raise SystemExit("bake-down-the-shaft.py has changed: the sump block was not found")
    a, b = src.index(SUMP_FROM), src.index(SUMP_TO)
    return src[:a] + src[b:]


def compare_with_original():
    """Stop unless this plate is the original plate, pixel for pixel, down to the station (the shaft's lamp light and cable apart)."""
    a = np.asarray(Image.open(os.path.join(ROOT, "public", "cerro", "shaft", "underground_plate.jpg")).convert("RGB")).astype(np.int16)
    b = np.asarray(Image.open(os.path.join(OUT, "ucg2_plate.jpg")).convert("RGB")).astype(np.int16)
    n = min(a.shape[0], b.shape[0])
    d = np.abs(a[:n] - b[:n]).max(axis=2)
    rock = d.copy()
    rock[:, 478:578] = 0  # the shaft and its collar timbers
    rows = np.where(rock.max(axis=1) > 2)[0]
    first = int(rows[0]) + 28 if len(rows) else n + 28
    shaft = d[: 1300 - 28, 478:578].copy()
    shaft[:, 520 - 478 : 530 - 478] = 0  # the cable
    print("plate", b.shape[1], "x", b.shape[0], "| the rock is the original plate's down to world y", first, "| shaft timbers above world y 1300: max abs diff", int(shaft.max()), flush=True)
    if first < HERO["y"] - 200 or shaft.max() > 12:
        raise SystemExit("this plate's top is NOT the original's: do not lay the original cap over it")


def main():
    spec = importlib.util.spec_from_file_location("bake_down_the_shaft", ORIG)
    dts = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(dts)  # its helpers, its constants, its seeded rng

    dts.STATIONS = []
    dts.BOTTOM_STATION = HERO
    dts.CABLE_LIVE_Y = CABLE_LIVE_Y
    dts.UCG_OUT = OUT
    dts.UCG_PLATE_Y1 = PLATE_Y1
    dts.UCG_WALL = WALL

    exec(compile(patched_main_source(), ORIG + " [main() patched by bake-under-cerro-gordo-shaft.py]", "exec"), dts.__dict__)
    os.makedirs(OUT, exist_ok=True)
    dts.main()
    compare_with_original()


if __name__ == "__main__":
    main()
