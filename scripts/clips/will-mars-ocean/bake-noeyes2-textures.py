#!/usr/bin/env python3
"""
Bake the extra textures of NoEyesOnItV2 (generated/components/will-mars-ocean/NoEyesOnItV2.tsx). Everything else it loads is the
delivered NoEyesOnIt set (scripts/clips/will-mars-ocean/bake-noeyes-textures.py); this only bakes the NEW close-up window, around the
V2 ship's site: a real single-beam track end inside the emptiest stretch of the South Pacific tile (GEBCO_2026
TID: 1.4 % measured within ~400 km), tile px (3311, 3278) = lon -119.79, lat -40.01.

Outputs (public/marsocean/):
  noeyes2_close_relief.jpg   CLOSE window of the tile (tile px), Lanczos-style x3 + unsharp, split into channels
  noeyes2_close_mask.png     the measured mask over the same window, x3 (soft edges)

Run:  python3 scripts/clips/will-mars-ocean/bake-noeyes2-textures.py
"""
import importlib.util
import os

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
D = os.path.join(ROOT, "public", "marsocean")
spec = importlib.util.spec_from_file_location("bake1", os.path.join(ROOT, "scripts", "clips", "will-mars-ocean", "bake-noeyes-textures.py"))
bake1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bake1)

# keep in sync with NoEyesOnItV2.tsx CLOSE
CLOSE = (2515, 2539, 1280)
UP = 3


def main():
    t = Image.open(os.path.join(ROOT, "assets-src", "marsocean", "spacific_relief_4k.jpg"))
    x0, y0, n = CLOSE
    box = (x0, y0, x0 + n, y0 + n)
    raw = t.crop(box).filter(ImageFilter.GaussianBlur(0.55)).resize((n * UP, n * UP), Image.BICUBIC)
    raw = raw.filter(ImageFilter.UnsharpMask(radius=2.0, percent=45, threshold=1))
    cc = bake1.channels(raw, bake1.DEG_PER_PX["tile"] / UP)
    cc.save(os.path.join(D, "noeyes2_close_relief.jpg"), quality=95, subsampling=0)
    print("wrote noeyes2_close_relief.jpg", cc.size)
    m = Image.open(os.path.join(D, "spacific_measured_mask_4k.png")).convert("L").crop(box).resize((n * UP, n * UP), Image.LANCZOS)
    m = m.filter(ImageFilter.GaussianBlur(1.3))
    m.save(os.path.join(D, "noeyes2_close_mask.png"), optimize=True)
    print("wrote noeyes2_close_mask.png", m.size)


if __name__ == "__main__":
    main()
