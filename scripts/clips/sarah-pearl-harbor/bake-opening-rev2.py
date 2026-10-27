"""Bake the two user-selected stills of DepressionOpeningSPRev2 into the house palette.

Reads the clip-folder originals READ ONLY and writes public/pearl-opening-rev2/:
  soup-duotone.jpg  Capone soup kitchen, Chicago 1931 (2939x2392) -> 2600 wide, warm umber/cream duotone
                    (blacks -> #17120D, a warm umber mid, whites -> #E9DDBF), tonal detail kept (no posterising).
                    Max unblurred on-screen scale is 0.85 of the original (0.885 baked keeps ~1 texel per px).
  page-cream.jpg    Statutes at Large 46 p.590, Tariff Act of 1930 (1782x2754) at its native size (no downscale:
                    the cut closes in on one phrase at ~2.75x the original, so the scan's own resolution is the
                    limit), cream paper with umber ink, a faint aged edge and a light unsharp mask.

Run from the repo root:  python3 scripts/clips/sarah-pearl-harbor/bake-opening-rev2.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
CLIP = Path("/Users/tom/Documents/tom fant/dwarkesh podcast/oct/SarahWar_How_the_Depression_pushed_Japan_to_Pearl_Harbor/images")
SOUP = CLIP / "00.2_GreatDepression_CaponeSoupKitchenChicago1931.jpg"
PAGE = CLIP / "02.5_ProtectAmericanJobs_TariffAct1930FirstPage.jpg"
OUT = ROOT / "public" / "pearl-opening-rev2"


def hexrgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


def gradient_map(lum: np.ndarray, stops: list[tuple[float, str]]) -> np.ndarray:
    """lum in 0..1 -> RGB through piecewise-linear colour stops"""
    xs = np.array([s[0] for s in stops])
    cols = np.stack([hexrgb(s[1]) for s in stops])
    out = np.empty(lum.shape + (3,))
    for c in range(3):
        out[..., c] = np.interp(lum, xs, cols[:, c])
    return out


def levels(lum: np.ndarray, lo_pct: float, hi_pct: float) -> np.ndarray:
    lo, hi = np.percentile(lum, [lo_pct, hi_pct])
    return np.clip((lum - lo) / (hi - lo), 0, 1)


def bake_soup() -> None:
    im = Image.open(SOUP).convert("L")
    w = 2600
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    lum = levels(np.asarray(im, dtype=np.float64) / 255.0, 0.3, 99.7)
    # a gentle S keeps the faces' contrast without crushing the coats
    lum = lum + 0.10 * np.sin(2 * np.pi * lum) * -0.5
    lum = np.clip(lum, 0, 1)
    rgb = gradient_map(lum, [(0.0, "#17120D"), (0.18, "#2E241A"), (0.5, "#76644A"), (0.82, "#C9BA97"), (1.0, "#E9DDBF")])
    Image.fromarray(np.round(rgb).astype(np.uint8)).save(OUT / "soup-duotone.jpg", quality=92, subsampling=0)


def bake_page() -> None:
    im = Image.open(PAGE).convert("L").filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    a = np.asarray(im, dtype=np.float64) / 255.0
    lum = levels(a, 1.0, 60.0)  # paper (the bulk of the page) -> 1, ink -> 0
    h, wd = lum.shape
    yy, xx = np.mgrid[0:h, 0:wd]
    # faint aged edge: paper darkens a little toward the border
    ex = np.minimum(xx, wd - 1 - xx) / wd
    ey = np.minimum(yy, h - 1 - yy) / h
    edge = np.clip(np.minimum(ex / 0.06, ey / 0.04), 0, 1)
    paper = 0.9 + 0.1 * edge
    rgb = gradient_map(lum, [(0.0, "#2A1F15"), (0.55, "#7A6A50"), (1.0, "#E9DDBF")])
    rgb = rgb * paper[..., None]
    Image.fromarray(np.round(np.clip(rgb, 0, 255)).astype(np.uint8)).save(OUT / "page-cream.jpg", quality=93, subsampling=0)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    bake_soup()
    bake_page()
    for p in sorted(OUT.iterdir()):
        print(p.relative_to(ROOT), Image.open(p).size, p.stat().st_size // 1024, "KB")
