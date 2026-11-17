"""Bake the sheet and desk sprites for cut 53 DrowningInApplications (shruti-trailer).

Writes RGBA PNGs to public/shruti-trailer/drowning/:
  sheet_a.png, sheet_b.png, sheet_c.png  three visibly different application sheets (the varied real forms)
  slop.png                               ONE clean, very regular form with the OpenAI knot printed bottom-right
  back.png                               a blank sheet back (the paper alone, a touch darker): laid under a sheet as
                                         it flips, so the heap shows paper where the turning sheet narrows
  <name>_sh.png                          each sprite's hard-shadow silhouette (pure black, its alpha)
  desk.png                               the office desk cut-out
Every sprite is pre-graded to the clip's photo grade (nealShared NEAL_FILTER: grayscale, sepia 0.14, contrast 0.9,
brightness 1.04), so the component draws hundreds of sheets without a CSS filter each.

The sheets: black print (a letter, a form with boxes, a CV with a photo box; the slop form) printed on REAL paper:
--texture <jpg> x0 y0 x1 y1 takes the paper surface from a photo of plain sheets (a crop inside one sheet, its light
fall-off flattened), flipped/turned per sheet; the letter keeps its two fold creases, the form a curl at its foot; the
slop sheet stays perfectly flat and clean (machine-made). Without --texture the paper is a drawn stand-in tone.
--desk <png with alpha> uses the cut-out desk photo (the Vision matte: scripts/clips/neal-stephenson-trailer/
neal-matte.swift + subject-cutout.py); without it a drawn stand-in desk.
(--paper <jpg> ... would use whole photographed sheets as the originals; the delivered photos have none usable.)

Run (system python + the user's site-packages; -I because the photos are downloaded data):
  /usr/bin/python3 -I scripts/clips/shruti-trailer/bake-drowning-sheets.py assets-src/shruti-trailer/openai_mark_black.png \
      --texture <assets>/paper_scattered_sheets.jpg 2650 1700 3268 2500 --desk assets-src/shruti-trailer/desk_cutout.png
"""
import os
import sys

sys.path.append(os.path.expanduser("~/Library/Python/3.9/lib/python/site-packages"))
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../..")
OUT = os.path.join(ROOT, "public/shruti-trailer/drowning")
os.makedirs(OUT, exist_ok=True)

args = sys.argv[1:]
MARK = args[0]


def opt_list(name):
    if name not in args:
        return []
    i = args.index(name) + 1
    out = []
    while i < len(args) and not args[i].startswith("--"):
        out.append(args[i])
        i += 1
    return out


PAPERS = opt_list("--paper")
DESK = (opt_list("--desk") or [None])[0]
TEXARG = opt_list("--texture")

SW, SH = 360, 466  # sprite px (US letter 8.5 x 11)
SS = 3  # supersample for the drawn sheets
OUTK = 1.5  # the saved sprites are 1.5 x SW x SH (540 x 699): sharp at the push-in's ~1.9x zoom in a --scale 2 render
PAPER = (240, 238, 233)
INK = (28, 27, 26)


def grade(rgb):
    """NEAL_FILTER on an RGB float array 0..1: grayscale(1) sepia(0.14) contrast(0.9) brightness(1.04)."""
    g = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    x = np.stack([g, g, g], -1)
    a = 0.14
    m = np.array(
        [
            [0.393 + 0.607 * (1 - a), 0.769 - 0.769 * (1 - a), 0.189 - 0.189 * (1 - a)],
            [0.349 - 0.349 * (1 - a), 0.686 + 0.314 * (1 - a), 0.168 - 0.168 * (1 - a)],
            [0.272 - 0.272 * (1 - a), 0.534 - 0.534 * (1 - a), 0.131 + 0.869 * (1 - a)],
        ]
    )
    x = np.clip(np.einsum("...j,ij->...i", x, m), 0, 1)
    x = np.clip((x - 0.5) * 0.9 + 0.5, 0, 1)
    return np.clip(x * 1.04, 0, 1)


def save(img, name):
    """Grade an RGBA sprite, save it and its pure-black shadow silhouette."""
    a = np.asarray(img).astype(np.float64) / 255
    rgb = grade(a[..., :3])
    out = np.dstack([rgb, a[..., 3]])
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f"{name}.png"), optimize=True)
    sh = np.zeros_like(out)
    sh[..., 3] = a[..., 3]
    Image.fromarray((sh * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f"{name}_sh.png"), optimize=True)
    print("wrote", name, img.size)


TEX = None
if TEXARG:
    t = Image.open(TEXARG[0]).convert("L").crop(tuple(int(v) for v in TEXARG[1:5]))
    t = np.asarray(t.resize((SW * SS, SH * SS), Image.LANCZOS)).astype(np.float64) / 255
    # flatten the photo's light fall-off (divide by a heavy blur), keep the fibre and a trace of the shading
    lo = np.asarray(Image.fromarray((t * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(SS * 40))).astype(np.float64) / 255
    TEX = (t / np.maximum(lo, 0.05)) * (0.85 + 0.15 * lo / lo.mean())
    TEX = TEX / np.median(TEX)


def paper_canvas(seed, clean=False):
    """A blank sheet at SS x: the real paper surface (or a drawn stand-in tone) with a slightly darker edge."""
    rng = np.random.default_rng(seed)
    w, h = SW * SS, SH * SS
    tone = np.array(PAPER) / 255
    if TEX is not None:
        tex = TEX
        if seed % 2:
            tex = tex[::-1, ::-1]
        if seed % 3 == 1:
            tex = tex[:, ::-1]
        amt = 0.45 if clean else 1.0
        base = tone * (1 + (tex[..., None] - 1) * amt)
    else:
        n = rng.normal(0, 1, (h // 6 + 1, w // 6 + 1))
        n = np.asarray(Image.fromarray(((n * 0.5 + 0.5).clip(0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)) / 255 - 0.5
        base = np.ones((h, w, 3)) * tone + n[..., None] * 0.035
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]) / (SS * 6)
    base = base * (0.93 + 0.07 * np.clip(edge, 0, 1))[..., None]
    img = Image.fromarray((base.clip(0, 1) * 255).astype(np.uint8)).convert("RGBA")
    return img, ImageDraw.Draw(img)


def shade(img, creases=(), curl=0.0):
    """Paper life on a finished sheet: fold creases (a light and a dark band at each y fraction) and a curl (a
    darkening toward the foot), multiplied over paper and print alike."""
    a = np.asarray(img).astype(np.float64)
    h = a.shape[0]
    y = np.arange(h)[:, None] / h
    m = np.ones((h, 1))
    for c in creases:
        d = (y - c) * h / SS
        m = m * (1 - 0.07 * np.exp(-((d - 1.5) / 1.6) ** 2) + 0.05 * np.exp(-((d + 2.5) / 3.0) ** 2))
    if curl:
        m = m * (1 - curl * np.clip((y - 0.78) / 0.22, 0, 1) ** 2)
    a[..., :3] = np.clip(a[..., :3] * m[..., None], 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def S(v):
    return int(round(v * SS))


def bar(d, x, y, w, t=4.2):
    d.rounded_rectangle([S(x), S(y), S(x + w), S(y + t)], radius=S(t / 2), fill=INK)


def finish(img):
    return img.resize((round(SW * OUTK), round(SH * OUTK)), Image.LANCZOS)


def sheet_letter():
    """A: a typed letter. Sender block top-left, date right, five ragged paragraphs, a signature scribble."""
    img, d = paper_canvas(11)
    rng = np.random.default_rng(1)
    for i, w in enumerate([96, 120, 84]):
        bar(d, 34, 34 + i * 12, w, 4)
    bar(d, 248, 34, 78, 4)
    bar(d, 34, 92, 140, 4.5)
    y = 118
    for para in [4, 5, 3, 5, 4]:
        for li in range(para):
            last = li == para - 1
            w = 292 - (rng.uniform(40, 170) if last else rng.uniform(0, 26))
            x = 34 + (18 if li == 0 else 0)
            bar(d, x, y, w - (18 if li == 0 else 0), 3.6)
            y += 11.5
        y += 9
    # signature: a black scribble (print), then a typed name
    pts = [(40 + t * 1.6, y + 14 + 9 * np.sin(t / 5.0) * np.cos(t / 11.0)) for t in range(0, 70)]
    d.line([(S(px), S(py)) for px, py in pts], fill=INK, width=S(2.6), joint="curve")
    bar(d, 34, y + 34, 90, 4)
    return finish(shade(img, creases=(1 / 3, 2 / 3)))


def sheet_form():
    """B: an application form. A black masthead band with a reversed title, labelled field boxes, checkboxes."""
    img, d = paper_canvas(23)
    d.rectangle([S(26), S(26), S(SW - 26), S(62)], fill=INK)
    d.rounded_rectangle([S(40), S(40), S(170), S(47)], radius=S(3), fill=PAPER)
    y = 80
    rows = [[1.0], [0.55, 0.45], [0.3, 0.7], [1.0], [0.5, 0.5]]
    for r in rows:
        x = 26
        for frac in r:
            w = (SW - 52) * frac
            bar(d, x + 4, y, w * 0.38, 3.4)
            d.rectangle([S(x + 4), S(y + 9), S(x + w - 6), S(y + 31)], outline=INK, width=S(2.2))
            x += w
        y += 46
    for i in range(4):
        d.rectangle([S(30), S(y + i * 18), S(41), S(y + i * 18 + 11)], outline=INK, width=S(2.2))
        bar(d, 50, y + i * 18 + 4, [150, 120, 172, 96][i], 3.4)
    d.rectangle([S(26), S(SH - 52), S(SW - 26), S(SH - 24)], outline=INK, width=S(2.2))
    bar(d, 34, SH - 42, 60, 3.4)
    return finish(shade(img, curl=0.12))


def sheet_cv():
    """C: a CV. A photo box top-right, a big name, two columns of bullet lines, section rules."""
    img, d = paper_canvas(37)
    d.rectangle([S(SW - 112), S(30), S(SW - 30), S(128)], fill=(118, 116, 112))
    d.ellipse([S(SW - 92), S(46), S(SW - 50), S(88)], fill=(70, 69, 67))
    d.pieslice([S(SW - 104), S(86), S(SW - 38), S(150)], 180, 360, fill=(70, 69, 67))
    d.rectangle([S(SW - 112), S(128), S(SW - 30), S(150)], fill=PAPER)
    bar(d, 30, 36, 150, 13)
    bar(d, 30, 60, 112, 4)
    bar(d, 30, 72, 92, 4)
    y = 150
    rng = np.random.default_rng(5)
    for sec in range(4):
        bar(d, 30, y, 70, 6)
        d.rectangle([S(30), S(y + 12), S(SW - 30), S(y + 13.6)], fill=INK)
        y += 22
        for li in range([4, 4, 3, 2][sec]):
            d.ellipse([S(34), S(y), S(39), S(y + 5)], fill=INK)
            bar(d, 46, y + 0.5, rng.uniform(150, 270), 3.6)
            y += 12.5
        y += 12
    return finish(img)


def sheet_slop(mark_path):
    """The SLOP sheet: one clean, generic, machine-regular form. A centred title line, three blocks of perfectly
    justified lines (every line the same length), even spacing, and a LARGE OpenAI knot printed bottom-right (41 % of
    the sheet's width: ~80-110 px at 1920 wide once the push-in lands on the copies, rev 3)."""
    img, d = paper_canvas(53, clean=True)
    bar(d, SW / 2 - 70, 34, 140, 7)
    bar(d, SW / 2 - 44, 50, 88, 3.6)
    y = 82
    for blk in range(3):
        for li in range(5):
            bar(d, 36, y, SW - 72, 3.6)
            y += 11.4
        y += 14
    # the knot, bottom-right, as if stamped (print black). Sprite px: 148 wide (41 % of the sheet) at a 20 px margin
    m = Image.open(mark_path).convert("RGBA")
    mw = S(148)
    mh = int(round(mw * m.height / m.width))
    m = m.resize((mw, mh), Image.LANCZOS)
    ink = Image.new("RGBA", m.size, INK + (255,))
    ink.putalpha(m.getchannel("A"))
    img.alpha_composite(ink, (S(SW - 20) - mw, S(SH - 20) - mh))
    return finish(img)


def sheet_from_photo(path, seed):
    """REAL mode: a photographed sheet, assumed already cropped to the page (the image agent's paper_*.jpg)."""
    im = Image.open(path).convert("RGB")
    im = im.resize((SW, SH), Image.LANCZOS).convert("RGBA")
    return im


def desk_standin():
    """STAND-IN desk: a three-quarter office desk drawn in greys (top slab, a drawer pedestal, a leg panel)."""
    w, h = 1320, 820
    s = 2
    img = Image.new("RGBA", (w * s, h * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def P(pts):
        return [(x * s, y * s) for x, y in pts]

    top, edge, front, dark, drawer = (226, 224, 219), (150, 148, 144), (190, 188, 183), (92, 90, 87), (205, 203, 198)
    d.polygon(P([(60, 0), (1260, 0), (1320, 70), (0, 70)]), fill=top)
    d.rectangle([0, 70 * s, 1320 * s, 104 * s], fill=edge)
    # left pedestal with three drawers
    d.rectangle([40 * s, 104 * s, 470 * s, 800 * s], fill=front)
    for i in range(3):
        y0 = 124 + i * 222
        d.rectangle([60 * s, y0 * s, 450 * s, (y0 + 200) * s], fill=drawer)
        d.rounded_rectangle([200 * s, (y0 + 30) * s, 310 * s, (y0 + 46) * s], radius=8 * s, fill=dark)
    d.rectangle([40 * s, 800 * s, 470 * s, 820 * s], fill=dark)
    # modesty panel and the right leg panel
    d.rectangle([470 * s, 104 * s, 1250 * s, 360 * s], fill=(170, 168, 163))
    d.rectangle([1180 * s, 104 * s, 1280 * s, 820 * s], fill=front)
    d.rectangle([1180 * s, 104 * s, 1196 * s, 820 * s], fill=edge)
    return img.resize((w, h), Image.LANCZOS)


if PAPERS:
    originals = [sheet_from_photo(p, i) for i, p in enumerate(PAPERS[:3])]
else:
    originals = [sheet_letter(), sheet_form(), sheet_cv()]
for name, im in zip(["sheet_a", "sheet_b", "sheet_c"], originals):
    save(im, name)
save(sheet_slop(MARK), "slop")
back = np.asarray(finish(shade(paper_canvas(7)[0], curl=0.06))).astype(np.float64)
back[..., :3] *= 0.9  # the back, turned away from the light
save(Image.fromarray(back.astype(np.uint8)), "back")
if DESK:
    save(Image.open(DESK).convert("RGBA"), "desk")
else:
    save(desk_standin(), "desk")
