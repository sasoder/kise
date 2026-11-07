# Bake the flat page plate for HonoredByStudents from the show's own 4K frames (notes/reference/honored_src*.png).
# World W = pixels of the widest frame (src 22.30). Every frame is a pure scale+shift of it (honored_register.py;
# SIFT + RANSAC similarity, rotation < 0.007 deg, median residual < 0.75 px). The plate covers W x X0..X0+PW/P,
# y Y0..Y0+PH/P at P plate px per W px. Sources, weighted where each is sharpest:
#   wide  = mean(22.30, 22.75)      (same framing; the averaged pair halves the baked colour grain)
#   mid   = 23.75                    (W y >= 700, 1.44x denser)
#   tight = mean(24.25, 24.75, 25.20) (W y >= 1026, 1.8x denser; inside the highlighter box only 24.25)
# Low-frequency light of mid/tight is matched to wide (smooth gain field); chroma grain is blurred away (the cut adds
# its own animated grain). Also writes the highlighter layer (the real one, 24.75 / 24.25 ratio) as a multiply PNG.
# Usage: uv run --offline --with numpy --with opencv-python-headless python honored_plate.py <public_dir> <debug_dir>
import json, sys, os, cv2, numpy as np
REF = "/Users/tom/Documents/tom fant/dwarkesh podcast/nov/Caro_Mr_Moses_chant/animation_source/notes/reference"
OUT, DBG = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True); os.makedirs(DBG, exist_ok=True)
P = 1.25
X0, Y0, X1, Y1 = 1360.0, 0.0, 2920.0, 2226.0
PW, PH = int(round((X1 - X0) * P)), int(round((Y1 - Y0) * P))
print("plate", PW, PH)

# frame -> W similarity (from honored_register.py; refit here so the script stands alone)
sift = cv2.SIFT_create(nfeatures=20000)
def gray(im):
    return cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), (0, 0), 1.2)
def load(n):
    return cv2.imread(f"{REF}/honored_src{n}.png", cv2.IMREAD_COLOR)
base_img = load("22.30")
kb, db = sift.detectAndCompute(gray(base_img), None)
bf = cv2.BFMatcher()
def fit(im):
    k, d = sift.detectAndCompute(gray(im), None)
    m = bf.knnMatch(d, db, k=2)
    good = [a for a, b in m if a.distance < 0.75 * b.distance]
    src = np.float32([k[a.queryIdx].pt for a in good]); dst = np.float32([kb[a.trainIdx].pt for a in good])
    M, _ = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=20000)
    return M

def warp(im, M):
    s = float(np.hypot(M[0, 0], M[1, 0]))
    A = M * P
    A[0, 2] -= P * X0; A[1, 2] -= P * Y0
    f = im.astype(np.float32)
    scale = s * P  # plate px per frame px
    if scale < 1:  # pre-filter before a downscale so the grain does not alias
        f = cv2.GaussianBlur(f, (0, 0), 0.5 / scale)
    out = cv2.warpAffine(f, A, (PW, PH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    cov = cv2.warpAffine(np.ones(im.shape[:2], np.float32), A, (PW, PH), flags=cv2.INTER_LINEAR, borderValue=0)
    return out, (cov > 0.999).astype(np.float32)

regs = {}
def group(names, exclude_box=None):
    acc = np.zeros((PH, PW, 3), np.float32); wsum = np.zeros((PH, PW), np.float32); cov_all = None
    for n in names:
        im = base_img if n == "22.30" else load(n)
        M = np.array([[1, 0, 0], [0, 1, 0]], np.float64) if n == "22.30" else fit(im)
        regs[n] = M.tolist()
        w, c = warp(im, M)
        wt = c.copy()
        if exclude_box is not None and n in exclude_box[0]:
            bx0, by0, bx1, by1 = exclude_box[1]
            wt[int((by0 - Y0) * P):int((by1 - Y0) * P), int((bx0 - X0) * P):int((bx1 - X0) * P)] = 0
        acc += w * wt[..., None]; wsum += wt
        cov_all = c if cov_all is None else np.minimum(cov_all, c) if n not in (exclude_box or [[]])[0] else cov_all
        del im
    return acc / np.maximum(wsum, 1e-6)[..., None], cov_all, wsum

HBOX = (2090.0, 1890.0, 2880.0, 1995.0)  # W box round the real highlighter (excluded from 24.75 / 25.20)
wide, cov_w, _ = group(["22.30", "22.75"])
mid, cov_m, _ = group(["23.75"])
tight, cov_t, _ = group(["24.25", "24.75", "25.20"], (["24.75", "25.20"], HBOX))
json.dump(regs, open(f"{DBG}/regs.json", "w"), indent=1)

def feather(cov, ramp_w):
    d = cv2.distanceTransform((cov > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
    r = ramp_w * P
    t = np.clip(d / r, 0, 1)
    return t * t * (3 - 2 * t)

# light match: smooth gain field of wide / group over the group's coverage
def gain(g, cov):
    sig = 60 * P
    m = cv2.erode(cov, np.ones((9, 9), np.uint8))
    num = cv2.GaussianBlur(wide * m[..., None], (0, 0), sig); den = cv2.GaussianBlur(g * m[..., None], (0, 0), sig)
    mm = cv2.GaussianBlur(m, (0, 0), sig)[..., None]
    gf = (num / np.maximum(mm, 1e-4)) / np.maximum(den / np.maximum(mm, 1e-4), 1e-3)
    return np.clip(gf, 0.7, 1.4)
mid = mid * gain(mid, cov_m)
tight = tight * gain(tight, cov_t)

w_m = feather(cov_m, 80)
w_t = feather(cov_t, 80)
plate = wide * (1 - w_m[..., None]) + mid * w_m[..., None]
plate = plate * (1 - w_t[..., None]) + tight * w_t[..., None]

# chroma denoise (the baked colour sparkle), keep luma detail
ycc = cv2.cvtColor(np.clip(plate, 0, 255).astype(np.uint8), cv2.COLOR_BGR2YCrCb).astype(np.float32)
for c in (1, 2):
    ycc[..., c] = cv2.GaussianBlur(ycc[..., c], (0, 0), 2.5)
y8 = np.clip(ycc[..., 0], 0, 255).astype(np.uint8)
ycc[..., 0] = cv2.fastNlMeansDenoising(y8, None, h=4, templateWindowSize=7, searchWindowSize=15).astype(np.float32)
out = cv2.cvtColor(np.clip(ycc, 0, 255).astype(np.uint8), cv2.COLOR_YCrCb2BGR)
cv2.imwrite(f"{OUT}/honored_plate.jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 93])
cv2.imwrite(f"{DBG}/w_mid.png", (w_m * 255).astype(np.uint8)); cv2.imwrite(f"{DBG}/w_tight.png", (w_t * 255).astype(np.uint8))

# ---- the real highlighter: ratio 24.75 / 24.25 in the box, both warped to the plate
i24 = load("24.25"); i75 = load("24.75")
a, _ = warp(i24, fit(i24)); b, _ = warp(i75, fit(i75))
bx0, by0, bx1, by1 = [int(v) for v in ((HBOX[0] - X0) * P, (HBOX[1] - Y0) * P, (HBOX[2] - X0) * P, (HBOX[3] - Y0) * P)]
A = cv2.GaussianBlur(a[by0:by1, bx0:bx1], (0, 0), 2.0); B = cv2.GaussianBlur(b[by0:by1, bx0:bx1], (0, 0), 2.0)
paper = A[..., :].mean(axis=2) > 120  # ratio is only meaningful on paper, not on ink
ratio = np.where(paper[..., None], B / np.maximum(A, 1), np.nan)
blue = ratio[..., 0]
print("blue ratio pct", np.nanpercentile(blue, [1, 5, 25, 50, 75, 95, 99]))
np.save(f"{DBG}/hl_ratio.npy", ratio)
cv2.imwrite(f"{DBG}/hl_A.png", np.clip(A, 0, 255).astype(np.uint8)); cv2.imwrite(f"{DBG}/hl_B.png", np.clip(B, 0, 255).astype(np.uint8))
print("box plate px", bx0, by0, bx1, by1)
