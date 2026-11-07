# Register every 4K reference frame of the original HonoredByStudents graphic onto the widest one (src 22.30).
# Prints a similarity (scale, rotation, tx, ty) per frame: W (22.30 px) = A @ frame_px + t. Writes honored_reg.json.
import json, sys, cv2, numpy as np
REF = "/Users/tom/Documents/tom fant/dwarkesh podcast/nov/Caro_Mr_Moses_chant/animation_source/notes/reference"
names = ["22.30", "22.75", "23.25", "23.75", "24.25", "24.75", "25.20"]
def load(n):
    im = cv2.imread(f"{REF}/honored_src{n}.png", cv2.IMREAD_GRAYSCALE)
    return cv2.GaussianBlur(im, (0, 0), 1.2)
sift = cv2.SIFT_create(nfeatures=20000)
base = load("22.30")
kb, db = sift.detectAndCompute(base, None)
out = {}
bf = cv2.BFMatcher()
for n in names:
    im = load(n)
    k, d = sift.detectAndCompute(im, None)
    m = bf.knnMatch(d, db, k=2)
    good = [a for a, b in m if a.distance < 0.75 * b.distance]
    src = np.float32([k[a.queryIdx].pt for a in good]); dst = np.float32([kb[a.trainIdx].pt for a in good])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=20000)
    H, inlH = cv2.findHomography(src, dst, cv2.RANSAC, 2.0)
    s = float(np.hypot(M[0, 0], M[1, 0])); rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    res = np.linalg.norm((src[inl.ravel() == 1] @ M[:, :2].T + M[:, 2]) - dst[inl.ravel() == 1], axis=1)
    print(n, len(good), int(inl.sum()), f"s={s:.5f} rot={rot:.4f} t=({M[0,2]:.1f},{M[1,2]:.1f}) med_res={np.median(res):.2f} p90={np.percentile(res,90):.2f}")
    print("   H persp terms", H[2, 0], H[2, 1])
    out[n] = {"M": M.tolist(), "H": H.tolist(), "s": s}
json.dump(out, open(sys.argv[1], "w"), indent=1)
