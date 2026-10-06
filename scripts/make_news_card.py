#!/usr/bin/env python3
"""News card in Tom's house style: 1080x1080 RGBA PNG, 8 px rounded corners (transparent outside), white header
(orange dash + SOURCE bold caps + grey date, then the headline in Inter Display Bold auto-sized to <= 2 lines),
the article's own photo below (cover crop), photo credit bottom-left.
  make_card.py OUT.png "SOURCE" "Date" "Headline" photo.jpg ["Photo: credit"] [crop_y 0..1]"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, source, date, headline, photo = sys.argv[1:6]
credit = sys.argv[6] if len(sys.argv) > 6 else ""
cropy = float(sys.argv[7]) if len(sys.argv) > 7 else 0.5
S, SS = 1080, 2                      # supersample 2x
W = S * SS
INTER = "/Users/tom/Library/Fonts/Inter-VariableFont_opsz,wght.ttf"
def font(px, wght, opsz=32):
    f = ImageFont.truetype(INTER, int(px * SS)); f.set_variation_by_axes([opsz, wght]); return f
PAD = 56 * SS
im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
def wrap(f, text, maxw):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]
for px in range(96, 40, -2):
    hf = font(px, 700); lines = wrap(hf, headline, W - 2 * PAD)
    if len(lines) <= 2: break
if len(lines) == 2:  # balance the two lines
    words = headline.split(); best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        wa, wb = d.textlength(a, font=hf), d.textlength(b, font=hf)
        if max(wa, wb) <= W - 2 * PAD and (best is None or abs(wa - wb) < best[0]): best = (abs(wa - wb), [a, b])
    lines = best[1]
lh = px * 1.13 * SS
head_top = 122 * SS
header_h = int(head_top + len(lines) * lh + 34 * SS)
ph = Image.open(photo).convert("RGB")
pw, phh = W, W - header_h
k = max(pw / ph.width, phh / ph.height)
ph = ph.resize((round(ph.width * k), round(ph.height * k)), Image.LANCZOS)
x0 = (ph.width - pw) // 2; y0 = int((ph.height - phh) * cropy)
im.paste(ph.crop((x0, y0, x0 + pw, y0 + phh)), (0, header_h))
d.rectangle([0, 0, W, header_h], fill=(255, 255, 255, 255))
# masthead row
my = 74 * SS
d.rounded_rectangle([PAD, my - 3 * SS, PAD + 36 * SS, my + 3 * SS], radius=3 * SS, fill=(255, 128, 0, 255))
sf, df = font(28, 700, 14), font(28, 400, 14)
sx = PAD + 52 * SS
d.text((sx, my), source.upper(), font=sf, fill=(17, 17, 17, 255), anchor="lm")
d.text((sx + d.textlength(source.upper(), font=sf) + 22 * SS, my), date, font=df, fill=(128, 128, 128, 255), anchor="lm")
for i, l in enumerate(lines):
    d.text((PAD - 3 * SS, head_top + i * lh), l, font=hf, fill=(17, 17, 17, 255), anchor="la")
if credit:
    cf = font(22, 500, 14)
    d.text((PAD + 1 * SS, W - 62 * SS + 1 * SS), credit, font=cf, fill=(0, 0, 0, 110), anchor="lm")
    d.text((PAD, W - 62 * SS), credit, font=cf, fill=(255, 255, 255, 255), anchor="lm")
mask = Image.new("L", (W, W), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, W - 1], radius=8 * SS, fill=255)
im.putalpha(mask)
im.resize((S, S), Image.LANCZOS).save(out)
print(out, f"headline {px}px, {len(lines)} lines:", lines)
