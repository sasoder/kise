"""Bake the covers, author portraits and publisher logos of FewBigHitters (wip-ya-boom, cut 51) into public/wip-ya-boom/.

Covers: the kit's one grade, no matte (flat rectangles). People: the Apple Vision person matte, cropped to head and shoulders,
then the grade. Logos: the real SVG marks turned into ONE black ink on white copy paper (colour fills -> ink; PRH's orange
oval -> paper, so its penguin prints as the familiar one-colour mark; HarperCollins drops the grey "Publishers"), with a
paper margin round the mark; the photocopy finish is added at render time by XeroxCutOut. Run from the kise repo root:
  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-FewBigHitters.py [--only covers|people|logos]
"""
import argparse
import os
import re
import subprocess
import tempfile

RAW = "/Users/tom/Documents/tom fant/wip/nov/entertainment industry + ya boom/ya boom/animation_source/assets_raw"
OUT = "public/wip-ya-boom"
BAKE = ["uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python", "scripts/clips/wip-anthropic/bake-photo.py"]
INK = "#121212"

COVERS = [
    ("cover_ItEndsWithUs.jpg", "fbh_itendswithus.png", 0.5),
    ("cover_ItStartsWithUs.jpg", "fbh_itstartswithus.png", 0.52),
    ("cover_Verity.jpg", "fbh_verity.png", 0.36),
    ("cover_FourthWing.jpg", "fbh_fourthwing.png", 0.55),
    ("cover_IronFlame.jpg", "fbh_ironflame.png", 0.46),
    ("cover_OnyxStorm.jpg", "fbh_onyxstorm.png", 0.4),
    ("cover_ACourtOfThornsAndRoses_2020.jpg", "fbh_acotar.png", 0.46),
    ("cover_TheHousemaid.jpg", "fbh_housemaid.png", 0.44),
]
# (raw, out, crop x0,y0,x1,y1 in source px, mid, erase polygons in fractions of the source)
PEOPLE = [
    # crops: head and shoulders down to the waist, the face (forehead to chin) about 0.22-0.25 of the crop's height
    ("portrait_ColleenHoover_HachettePress.jpg", "fbh_hoover.png", "0,0,1600,2715", 0.5, []),
    ("portrait_SarahJMaas_officialSite.jpg", "fbh_maas.png", "211,410,647,1033", 0.44, []),
    # signing table: the reader's arm at the right edge is not her
    ("portrait_RebeccaYarros_2024_signing.jpg", "fbh_yarros.png", "0,218,1500,2841", 0.48, [[(0.965, 0), (1, 0), (1, 1), (0.965, 1)]]),
    ("portrait_FreidaMcFadden_HachettePress.jpg", "fbh_mcfadden.png", "334,800,1414,2345", 0.48, []),
]
# (svg, out, colour fills -> ink or paper, drop fills, margin and top margin as fractions of the mark's height). The three
# slips that press up under the authors carry more blank paper above the mark, so the paper overlaps the portraits' lower edge
# while the wordmark stays below the caption bands.
LOGOS = [
    ("logo_PenguinRandomHouse.svg", "fbh_logo_prh.svg", {"#FF6F00": "#FFFFFF"}, [], 0.16, 1.25),
    ("logo_HarperCollins.svg", "fbh_logo_harpercollins.svg", {}, ["#989a9c"], 0.5, 0.5),
    ("logo_SimonAndSchuster.svg", "fbh_logo_simonschuster.svg", {}, [], 0.5, 0.5),
    ("logo_HachetteBookGroup.svg", "fbh_logo_hachette.svg", {}, [], 0.3, 2.0),
    ("logo_MacmillanPublishers.svg", "fbh_logo_macmillan.svg", {}, [], 0.24, 2.0),
]

p = argparse.ArgumentParser()
p.add_argument("--only", choices=["covers", "people", "logos"])
a = p.parse_args()
os.makedirs(OUT, exist_ok=True)

if a.only in (None, "covers"):
    for raw, out, mid in COVERS:
        subprocess.run(BAKE + [os.path.join(RAW, "covers", raw), os.path.join(OUT, out), "--max", "900", "--mid", str(mid)], check=True)

if a.only in (None, "people"):
    from PIL import Image, ImageDraw

    with tempfile.TemporaryDirectory() as tmp:
        for raw, out, crop, mid, erase in PEOPLE:
            src = os.path.join(RAW, "portraits", raw)
            mask = os.path.join(tmp, out.replace(".png", "_mask.png"))
            subprocess.run(["swift", "scripts/clips/neal-stephenson-trailer/neal-matte.swift", src, mask, "person"], check=True)
            if erase:
                m = Image.open(mask).convert("L")
                x0, y0, x1, y1 = (int(v) for v in crop.split(","))
                # erase polygons are fractions of the CROP; map them onto the mask's (source-sized) pixels
                sx, sy = m.width / Image.open(src).width, m.height / Image.open(src).height
                d = ImageDraw.Draw(m)
                for poly in erase:
                    d.polygon([((x0 + x * (x1 - x0)) * sx, (y0 + y * (y1 - y0)) * sy) for x, y in poly], fill=0)
                m.save(mask)
            subprocess.run(BAKE + [src, os.path.join(OUT, out), "--matte", mask, "--max", "1200", "--crop", crop, "--mid", str(mid)], check=True)

if a.only in (None, "logos"):
    for raw, out, remap, drop, margin, top in LOGOS:
        svg = open(os.path.join(RAW, "logos", raw), encoding="utf-8").read()
        for c in drop:
            # drop every element filled with that colour (attribute or style form)
            svg = re.sub(r"<path[^>]*fill(?:=\"|:)" + re.escape(c) + r"[^>]*/>", "", svg, flags=re.I)
            svg = re.sub(r"<g[^>]*fill(?:=\"|:)" + re.escape(c) + r"[^>]*>.*?</g>", "", svg, flags=re.I | re.S)
        def ink(m):
            col = m.group(2)
            for k, v in remap.items():
                if col.lower() == k.lower():
                    return m.group(1) + v
            if col.lower() in ("#fff", "#ffffff", "white", "none"):
                return m.group(0)
            return m.group(1) + INK
        svg = re.sub(r"(fill(?:=\"|:))(#[0-9a-fA-F]{3,6}|white|none)", ink, svg)
        # gradient fills (Macmillan's wave) print as solid ink too
        svg = re.sub(r"(fill(?:=\"|:))url\(#[^)]+\)", lambda m: m.group(1) + INK, svg)
        # paths with no fill draw black by default: that is ink already. Now the paper margin: grow the viewBox and lay a
        # white sheet under the mark.
        vb = re.search(r'viewBox="([^"]+)"', svg)
        x, y, w, h = (float(v) for v in vb.group(1).replace(",", " ").split())
        if raw.startswith("logo_HarperCollins"):
            w = 90.0  # the wordmark ends before the dropped "Publishers"
        m = margin * h
        mt = top * h
        nx, ny, nw, nh = x - m, y - mt, w + 2 * m, h + m + mt
        svg = svg.replace(vb.group(0), f'viewBox="{nx:.3f} {ny:.3f} {nw:.3f} {nh:.3f}"', 1)
        svg = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', r"\1", svg, count=1)
        svg = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', r"\1", svg, count=1)
        svg = re.sub(r"(<svg[^>]*>)", r'\1<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" fill="#FFFFFF"/>' % (nx, ny, nw, nh), svg, count=1)
        svg = re.sub(r"<svg", f'<svg width="{nw * 1200 / nw:.0f}" height="{nh * 1200 / nw:.0f}"', svg, count=1)
        open(os.path.join(OUT, out), "w", encoding="utf-8").write(svg)
        print(f"{out}: aspect {nw / nh:.4f}, mark top at {mt / nh:.4f} of the slip's height")
