"""SpendHalf's pile (wip-entertainment, cut 13): eleven real things, graded b&w. Flat rectangular things are cropped
and graded (bake-photo.py) and get their hand-cut border at render time (RoughCutPrint rect mode); the two with a
shape of their own (the notched Beverley ticket, the Admit One stub) are matted and cut by bake-roughcut.py.

  for f in cinema_ticket_Beverley_Paris_entree ticket_admit_one; do
    swift scripts/clips/neal-stephenson-trailer/neal-matte.swift assets-src/wip-entertainment/13/$f.jpg <scratch>/mask/$f.png fg; done
  uv run --offline --with numpy --with pillow --with scipy --with opencv-python-headless python \
      scripts/clips/wip-entertainment/bake-spend-half.py <scratch>

Raw copies: assets-src/wip-entertainment/13/ (from animation_source/assets_raw/13, credits in SOURCES.txt there).
Writes public/wip-entertainment/sh_<name>.png and prints each one's size and aspect.
"""
import subprocess
import sys

scratch = sys.argv[1]
RAW = "assets-src/wip-entertainment/13"
OUT = "public/wip-entertainment"
PY = sys.executable

# name: (source, crop box in source px or None, mid grey)
RECT = {
    "jewel_front": ("cd_jewelcase_empty_front", "115,64,3533,2893", 0.36),
    "jewel_back": ("cd_jewelcase_empty_back", "141,115,3488,2982", 0.36),
    "tdk": ("cd_jewelcase_TDK_shrinkwrap_c2000", "132,196,1146,1073", 0.6),
    "dvd": ("dvd_case_black", None, 0.3),
    "empire": ("cinema_ticket_Empire_London_1966", "10,0,1910,1409", 0.58),
    "ratatouille": ("cinema_ticket_Ratatouille_2007", "0,60,1640,1440", 0.6),
    "universal": ("cinema_ticket_Universal_Madrid", "6,4,954,404", 0.55),
    "stubs": ("ticket_roll_with_stub", "1418,200,1676,1135", 0.62),
}
# name: (source, world width of the subject as shown, mid grey)
CUT = {
    "beverley": ("cinema_ticket_Beverley_Paris_entree", 200, 0.55),
    "admit": ("ticket_admit_one", 290, 0.58),
}

for name, (src, crop, mid) in RECT.items():
    args = [PY, "scripts/clips/wip-anthropic/bake-photo.py", f"{RAW}/{src}.jpg", f"{OUT}/sh_{name}.png", "--max", "900", "--mid", str(mid)]
    if crop:
        args += ["--crop", crop]
    subprocess.run(args, check=True)

for name, (src, show_w, mid) in CUT.items():
    subprocess.run(
        [
            PY,
            "scripts/clips/wip-entertainment/bake-roughcut.py",
            f"{RAW}/{src}.jpg",
            f"{OUT}/sh_{name}.png",
            "--matte",
            f"{scratch}/mask/{src}.png",
            "--show-w",
            str(show_w),
            "--max",
            "900",
            "--mid",
            str(mid),
            "--seed",
            name,
            "--nibble",
            "0.08",
        ],
        check=True,
    )
