"""The prints of OldStoriesRemixed (wip-entertainment, cut 50): three classics and the older things they reworked, each
a b&w hand-cut print through bake-roughcut.py (the messy variant's scissors and the kit's grade). Raw copies in
assets-src/wip-entertainment/50/ (credits: the clip's animation_source/assets_raw/SOURCES.txt), out to
public/wip-entertainment/os_*.png. The two objects are matted first with Apple Vision (fg):

  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift assets-src/wip-entertainment/50/<vase>.jpg <scratch>/vase.png fg
  swift scripts/clips/neal-stephenson-trailer/neal-matte.swift assets-src/wip-entertainment/50/<bust>.jpg <scratch>/bust.png fg
  uv run --offline --with numpy --with pillow --with scipy --with opencv-python-headless python \
      scripts/clips/wip-entertainment/bake-50.py <scratch> [--colour]   # reads <scratch>/vase.png and <scratch>/bust.png

Title pages are cut as rectangles (--rect) round their identifying part (rev 2: rows ~320 px tall, so each page is
scissored down to its title block / Holinshed's arch / the Folio's title and Droeshout head), without the book's edges; they bake with a high
--mid so the paper stays paper (bake-roughcut pulls the median to --mid, and a page's median IS its paper).
"""
import subprocess
import sys

scratch = sys.argv[1]
COLOUR = ["--colour"] if "--colour" in sys.argv[2:] else []
SRC = "assets-src/wip-entertainment/50"
OUT = "public/wip-entertainment"
RC = "scripts/clips/wip-entertainment/bake-roughcut.py"

JOBS = [
    # name, source, show-w (world px of the subject), extra args
    ("os_vase", "homer_source_MycenaeanWarriorVase_c1200BC.jpg", 420, ["--matte", f"{scratch}/vase.png", "--mid", "0.5"]),
    ("os_homer", "homer_bust_BritishMuseum_whitebg.jpg", 330, ["--matte", f"{scratch}/bust.png", "--crop", "0,40,1920,2330", "--mid", "0.52"]),
    ("os_viehmann", "grimm_source_DorotheaViehmann_portrait.jpg", 330, ["--rect", "--crop", "200,30,1280,1110", "--mid", "0.55"]),
    ("os_khm1812", "grimm_KinderUndHausmaerchen_1812_vol1_titlepage.jpg", 390, ["--rect", "--crop", "110,300,1178,1250", "--mid", "0.8"]),
    ("os_holinshed", "shakespeare_source_Holinshed_Chronicles_1587_titlepage.jpg", 350, ["--rect", "--crop", "0,0,1280,1150", "--mid", "0.62"]),
    ("os_folio1623", "shakespeare_FirstFolio_1623_titlepage.jpg", 350, ["--rect", "--crop", "24,150,1742,1890", "--mid", "0.72"]),
]

for name, src, show_w, extra in JOBS:
    cmd = [sys.executable, RC, f"{SRC}/{src}", f"{OUT}/{name}.png", "--show-w", str(show_w), "--max", "1100", "--seed", name,
           "--json", f"{scratch}/{name}.json", *extra, *COLOUR]
    subprocess.run(cmd, check=True)
