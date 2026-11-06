"""Bake public/wip-anthropic/paper_offwhite.jpg for the ya boom clip (wip-ya-boom): the Works in Progress kit's own paper bake
(scripts/clips/wip-anthropic/bake-paper.py, theme offwhite), with one change: this clip has no indigo, so the sheet's stray ink
specks are the page's near-black instead. Writes only the paper sheet (the kit's stamp paper, grain and ink tile are untouched).

  uv run --offline --with numpy --with pillow --with scipy python scripts/clips/wip-ya-boom/bake-paper-offwhite.py
"""
import importlib.util
import os

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
spec = importlib.util.spec_from_file_location("bake_paper", os.path.join(ROOT, "scripts", "clips", "wip-anthropic", "bake-paper.py"))
bake = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bake)
bake.INDIGO_ARR = np.array([0x2A, 0x29, 0x28], dtype=np.float64)
bake.paper_sheet("offwhite")
print("paper_offwhite.jpg", os.path.getsize(os.path.join(bake.PUBLIC, "paper_offwhite.jpg")) // 1024, "KB")
