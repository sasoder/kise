"""Bake the three publisher slips of YaDivisionsClosed (wip-ya-boom, cut 29) into public/wip-ya-boom/ydc_logo_*.svg.

Each slip is cut 51's colour logo slip (public/wip-ya-boom/fbh_logo_*.svg, baked by bake-FewBigHitters.py: the real marks in
their own brand colours, HarperCollins without the grey "Publishers") re-cut to new paper margins: an even margin round the
mark, plus a stretch of blank paper on one side where the red CLOSED stamp is struck. Only the viewBox, the size and the
white sheet under the mark change; the mark's paths are untouched. Run from the kise repo root:
  python3 scripts/clips/wip-ya-boom/bake-YaDivisionsClosed.py
"""
import re

OUT = "public/wip-ya-boom"
# (src, out, the mark's box x, y, w, h in the source's user units, margin (fraction of the mark's height), extra paper on
# the right (fraction of the mark's WIDTH))
SLIPS = [
    ("fbh_logo_prh.svg", "ydc_logo_prh.svg", (0.0, 0.0, 1290.6, 531.4), 0.17, 0.42),
    ("fbh_logo_harpercollins.svg", "ydc_logo_harpercollins.svg", (0.0, 0.0, 90.0, 13.92), 0.6, 0.42),
    ("fbh_logo_hachette.svg", "ydc_logo_hachette.svg", (0.0, 0.0, 146.0, 38.0), 0.3, 0.42),
]

for src, out, (mx, my, mw, mh), margin, right in SLIPS:
    svg = open(f"{OUT}/{src}", encoding="utf-8").read()
    m = margin * mh
    nx, ny = mx - m, my - m
    nw, nh = mw + 2 * m + right * mw, mh + 2 * m
    svg, n = re.subn(r'viewBox="[^"]+"', f'viewBox="{nx:.3f} {ny:.3f} {nw:.3f} {nh:.3f}"', svg, count=1)
    assert n == 1, src
    svg = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r"<svg", f'<svg width="1200" height="{1200 * nh / nw:.0f}"', svg, count=1)
    # the white sheet under the mark: the first rect (the source's sheet) takes the new box
    svg, n = re.subn(
        r'<rect x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+" fill="#FFFFFF"/>',
        f'<rect x="{nx:.3f}" y="{ny:.3f}" width="{nw:.3f}" height="{nh:.3f}" fill="#FFFFFF"/>',
        svg,
        count=1,
    )
    assert n == 1, src
    open(f"{OUT}/{out}", "w", encoding="utf-8").write(svg)
    print(f"{out}: aspect {nw / nh:.4f}; mark x {(mx - nx) / nw:.4f}-{(mx + mw - nx) / nw:.4f} of the slip's width")
