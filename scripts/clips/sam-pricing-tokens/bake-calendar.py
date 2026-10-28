# Bake cut 35's calendar page (PriceCreepsUp, sam-pricing-tokens) from the image agent's item 8, a frontal photo of a
# real monthly wall-calendar page (Behnam Norouzi, Unsplash License; images/cutout_sources/SOURCES.md item 8).
# The page is a white rectangle on an off-white wall, which a foreground matte cannot separate reliably, so the mask
# is its measured rectangle (source px, rounded corners, 2 px feather). The printed month ("Jan"), the year with its
# tab and the hanger's slot window are painted out with paper (vertical interpolation between the paper rows above
# and below each region, plus the paper's own fine grain resampled from a clean patch), so the cut prints its own
# month in ink. Writes an RGBA PNG and the data module.
# Run with the system python and the user's site-packages (no installs):
#   /usr/bin/python3 -I scripts/clips/sam-pricing-tokens/bake-calendar.py <src.jpg> <out.png> <data.ts> [width]
import base64
import sys

sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

src, out_png, out_ts = sys.argv[1:4]
width = int(sys.argv[4]) if len(sys.argv) > 4 else 760

# the page (source px), measured off row / column profiles of the 4000 x 5538 photo
X0, Y0, X1, Y1 = 668, 999, 3278, 4688
CORNER = 12
FEATHER = 14
# regions painted out (source px): x0, y0, x1, y1
CLEAN = [
    (1440, Y0 - 4, 2600, 1405),  # the hanger's slot window (black clip + wall behind), its smudge and its shade on the paper's top
    (1000, 1690, 1890, 2140),  # "Jan"
    (2640, 1975, 3290, 2105),  # "2022" and its tab
]

im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
H, W, _ = im.shape
rng = np.random.default_rng(35)
# the paper's fine grain: a clean patch's deviation from its own blur
patch = im[2950:3050, 700:800]  # left margin of the grid area: paper only
grain = patch - np.asarray(Image.fromarray(patch.astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
def smooth(r, k=31):
    """box-smooth a boundary strip along its length, so a stray dark pixel does not streak"""
    pad = np.pad(r, ((k // 2, k // 2), (0, 0)), mode="edge")
    c = np.vstack([np.zeros((1, 3)), np.cumsum(pad, 0)])
    return (c[k:] - c[:-k]) / k


for x0, y0, x1, y1 in CLEAN:
    n, m = y1 - y0, x1 - x0
    at_top = y0 <= Y0 + 16  # reaches the paper's top edge: no paper above it
    at_right = x1 >= X1 - 16  # reaches the paper's right edge: no paper right of it
    t = np.linspace(0, 1, n)[:, None, None]
    s_ = np.linspace(0, 1, m)[None, :, None]
    fills = []
    if not at_top:  # vertical: the paper rows above and below
        top = smooth(im[y0 - 12 : y0 - 4].mean(0)[x0:x1])
        bot = smooth(im[y1 + 4 : y1 + 12].mean(0)[x0:x1])
        fills.append(top[None] * (1 - t) + bot[None] * t)
    if not at_right:  # horizontal: the paper columns left and right (keeps each row's own tone)
        lef = smooth(im[y0:y1, x0 - 12 : x0 - 4].mean(1))
        rig = smooth(im[y0:y1, x1 + 4 : x1 + 12].mean(1))
        fills.append(lef[:, None] * (1 - s_) + rig[:, None] * s_)
    fill = sum(fills) / len(fills)
    gy = rng.integers(0, grain.shape[0] - 1, size=n)
    gx = rng.integers(0, grain.shape[1] - 1, size=m)
    g = grain[gy[:, None], gx[None, :]]
    # feather the region's outer FEATHER px from the original paper into the fill (no rectangle ghost); not at
    # a side that reaches the paper's edge (the original there is the clip's shade / the tab)
    yy = np.minimum(np.arange(n), n - 1 - np.arange(n)) if not at_top else (n - 1 - np.arange(n))
    xx = np.minimum(np.arange(m), m - 1 - np.arange(m)) if not at_right else np.arange(m)
    a = np.clip(np.minimum(yy[:, None], xx[None, :]) / FEATHER, 0, 1)[:, :, None]
    a = a * a * (3 - 2 * a)
    im[y0:y1, x0:x1] = im[y0:y1, x0:x1] * (1 - a) + (fill + g * 0.6) * a

page = Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).crop((X0 - 4, Y0 - 4, X1 + 4, Y1 + 4))
m = Image.new("L", page.size, 0)
ImageDraw.Draw(m).rounded_rectangle((4, 4, page.size[0] - 5, page.size[1] - 5), radius=CORNER, fill=255)
m = m.filter(ImageFilter.GaussianBlur(1.2))
page.putalpha(m)
h = round(width * page.size[1] / page.size[0])
page = page.resize((width, h), Image.LANCZOS)
page.save(out_png, optimize=True)

b64 = base64.b64encode(open(out_png, "rb").read()).decode()
aspect = width / h
open(out_ts, "w").write(
    "// priceCreepsUpData — cut 35's baked calendar page (CRAFT \"Bitmaps inside an SVG\"). Written by\n"
    "// scripts/clips/sam-pricing-tokens/bake-calendar.py from the image agent's item 8 (a frontal photo of a real\n"
    "// monthly wall-calendar page, Unsplash): cut out on its measured rectangle, the printed month, the year and the\n"
    "// hanger slot painted out with paper. PriceCreepsUp prints each page's own month in ink.\n"
    "export type CalendarPage = {\n"
    "  /** data:image/png;base64 URL of the RGBA cut-out, or null (a cream placeholder page) */\n"
    "  src: string | null;\n"
    "  /** the PNG's w / h */\n"
    "  aspect: number;\n"
    "  /** the paper's top edge, as a fraction of the image height from its top (the bars' slot sits there) */\n"
    "  topV: number;\n"
    "  /** where the month prints: left edge (fraction of page width from its left), baseline (fraction of height), cap px */\n"
    "  label: { x0: number; baseV: number; capPx: number };\n"
    "};\n\n"
    "export const CALENDAR_PAGE: CalendarPage = {\n"
    f"  src: \"data:image/png;base64,{b64}\",\n"
    f"  aspect: {aspect:.6f},\n"
    f"  topV: {4 / (Y1 - Y0 + 8):.6f},\n"
    "  // the month's place: its left edge at the grid's first column (as the photo's printed month), its baseline\n"
    "  // raised into the cleaned upper paper (0.235 of the height, so the labels can sit just above the caption band)\n"
    f"  label: {{ x0: {(1030 - X0 + 4) / (X1 - X0 + 8):.4f}, baseV: 0.235, capPx: 50 }},\n"
    "};\n"
)
print(out_png, width, h, "aspect", round(aspect, 4), "png bytes", len(b64) * 3 // 4)
