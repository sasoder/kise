import sys; sys.path.append("/Users/tom/Library/Python/3.9/lib/python/site-packages")
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
img, mask, out = sys.argv[1:4]
crop = tuple(map(int, sys.argv[4:8]))  # x0 y0 x1 y1 crop box
outw = int(sys.argv[8])
im = Image.open(img).convert("RGB"); m = Image.open(mask).convert("L")
# kill the photographer's credit (bottom-left corner)
d = ImageDraw.Draw(m); d.rectangle((0, im.size[1] - 70, 140, im.size[1]), fill=0)
a = np.asarray(m).astype(np.float32) / 255
a = np.clip((a - 0.35) / 0.5, 0, 1)  # tighten the soft edge
m = Image.fromarray((a * 255).astype(np.uint8))
m = m.filter(ImageFilter.MinFilter(5))  # erode ~2 px (the tent's light fringe)
m = m.filter(ImageFilter.GaussianBlur(1.1))
rgba = im.copy(); rgba.putalpha(m)
rgba = rgba.crop(crop)
rgba = rgba.resize((outw, round(outw * rgba.size[1] / rgba.size[0])), Image.LANCZOS)
rgba.save(out, optimize=True)
print(rgba.size)
