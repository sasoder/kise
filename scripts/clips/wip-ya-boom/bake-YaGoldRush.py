"""Bake the six covers of YaGoldRush (wip-ya-boom, cut 0) with the Works in Progress kit's one photo grade (no matte: covers
are flat rectangles). The photocopy look is added at render time by yaShared.tsx's XeroxCutOut.

  python3 scripts/clips/wip-ya-boom/bake-YaGoldRush.py
"""
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
RAW = "/Users/tom/Documents/tom fant/wip/nov/entertainment industry + ya boom/ya boom/animation_source/assets_raw/covers"
OUT = os.path.join(ROOT, "public", "wip-ya-boom")
COVERS = {
    # out name: (raw file, print median)
    "ya0_hp_deathly_hallows": ("cover_HarryPotterDeathlyHallows.jpg", 0.5),
    "ya0_hunger_games": ("cover_TheHungerGames.jpg", 0.42),
    "ya0_twilight": ("cover_Twilight.jpg", 0.3),
    "ya0_percy_jackson": ("cover_PercyJacksonLightningThief.jpg", 0.44),
    "ya0_divergent": ("cover_Divergent.jpg", 0.46),
    "ya0_fault_in_our_stars": ("cover_TheFaultInOurStars.jpg", 0.6),
}

os.makedirs(OUT, exist_ok=True)
for name, (raw, mid) in COVERS.items():
    subprocess.run(
        [
            "uv", "run", "--offline", "--with", "numpy", "--with", "pillow", "--with", "scipy", "python",
            os.path.join(ROOT, "scripts", "clips", "wip-anthropic", "bake-photo.py"),
            os.path.join(RAW, raw), os.path.join(OUT, f"{name}.png"), "--max", "1100", "--mid", str(mid),
        ],
        check=True,
    )
