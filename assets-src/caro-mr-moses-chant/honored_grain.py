# Screen-space grain tile for HonoredByStudents (overlay blend, mid-grey = no change): luma noise plus a little
# colour noise like the original's sparkle. 1200x2040 so a per-frame offset of up to 120 px still covers 1080x1920.
# Usage: uv run --offline --with numpy --with opencv-python-headless python honored_grain.py <public_dir>
import sys, cv2, numpy as np
rng = np.random.default_rng(1937)
H, W = 2040, 1200
l = rng.normal(0, 1, (H, W)).astype(np.float32)
c = rng.normal(0, 1, (H, W, 3)).astype(np.float32)
l = cv2.GaussianBlur(l, (0, 0), 0.7); l /= l.std()
c = cv2.GaussianBlur(c, (0, 0), 0.9); c /= c.std()
img = 128 + 26 * l[..., None] + 9 * c
cv2.imwrite(f"{sys.argv[1]}/honored_grain.jpg", np.clip(img, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
