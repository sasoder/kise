"""Cut 23 (AlphabetBreaksTheCircle): the Phoenician cippus from Kition as a cut-out print, and the Phoenician letters as
SVG outlines.

  1. the stone: the Met's photograph (74.51.2294, CC0) at 1600 px, the museum's painted inventory number "I." cloned
     off with the stone's own texture beside it, the Apple Vision matte (neal-matte.swift fg) as alpha, then the one
     grade (bake-photo.py), written to public/wip-biblical/ab_cippus.png.
  2. the letters: aleph..waw (U+10900-10905) from Noto Sans Phoenician (OFL, macOS Supplemental fonts), as SVG path
     data in font units (y up), written to generated/components/wip-biblical/alphabetGlyphs.ts.

  uv run --offline --with numpy --with pillow --with scipy --with fonttools python \
      scripts/clips/wip-biblical/bake-alphabet-23.py <front.jpg> <scratch>
(the scratch folder gets the 1600 px copy, the matte and the retouched jpg).
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageFilter

src, scratch = Path(sys.argv[1]), Path(sys.argv[2])
repo = Path(__file__).resolve().parents[3]
scratch.mkdir(parents=True, exist_ok=True)

# -- 1. the stone ------------------------------------------------------------------------------------------------------
small = scratch / "cippus_1600.jpg"
im = Image.open(src).convert("RGB")
s = 1600 / max(im.size)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
# the inventory mark "I." sits at about x 636-690, y 1196-1272 here: cover it with the stone 64 px to its left, feathered
x0, y0, x1, y1 = 630, 1190, 696, 1278
dx = -64
patch = im.crop((x0 + dx, y0, x1 + dx, y1))
feather = Image.new("L", patch.size, 0)
feather.paste(255, (8, 8, patch.width - 8, patch.height - 8))
feather = feather.filter(ImageFilter.GaussianBlur(4))
im.paste(patch, (x0, y0), feather)
im.save(small, quality=95)
mask = scratch / "cippus_mask.png"
subprocess.run(["swift", str(repo / "scripts/clips/neal-stephenson-trailer/neal-matte.swift"), str(small), str(mask), "fg"], check=True)
bbox = Image.open(mask).convert("L").getbbox()
pad = 6
crop = f"{max(0, bbox[0] - pad)},{max(0, bbox[1] - pad)},{min(im.width, bbox[2] + pad)},{min(im.height, bbox[3] + pad)}"
subprocess.run(
    [sys.executable, str(repo / "scripts/clips/wip-anthropic/bake-photo.py"), str(small), str(repo / "public/wip-biblical/ab_cippus.png"),
     "--matte", str(mask), "--crop", crop, "--max", "1200", "--mid", "0.64"],
    check=True,
)
print("crop", crop)

# -- 2. the letters ----------------------------------------------------------------------------------------------------
from fontTools.pens.boundsPen import BoundsPen  # noqa: E402
from fontTools.pens.svgPathPen import SVGPathPen  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402

font = TTFont("/System/Library/Fonts/Supplemental/NotoSansPhoenician-Regular.ttf")
gs = font.getGlyphSet()
cmap = font.getBestCmap()
names = ["aleph", "bet", "gimel", "dalet", "he", "waw"]
lines = [
    "// Phoenician aleph..waw (U+10900-10905), outlines from Noto Sans Phoenician (SIL OFL 1.1), in font units (1000/em, y up).",
    "// Written by scripts/clips/wip-biblical/bake-alphabet-23.py; do not edit by hand.",
    "export type PhoenicianGlyph = { name: string; d: string; adv: number; bounds: [number, number, number, number] };",
    "export const PHOENICIAN: PhoenicianGlyph[] = [",
]
for i, n in enumerate(names):
    g = gs[cmap[0x10900 + i]]
    pen = SVGPathPen(gs)
    g.draw(pen)
    bp = BoundsPen(gs)
    g.draw(bp)
    b = [round(v) for v in bp.bounds]
    lines.append(f'  {{ name: "{n}", adv: {g.width}, bounds: [{b[0]}, {b[1]}, {b[2]}, {b[3]}], d: "{pen.getCommands()}" }},')
lines.append("];")
(repo / "generated/components/wip-biblical/alphabetGlyphs.ts").write_text("\n".join(lines) + "\n")
print("glyphs ok")
