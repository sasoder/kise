# Torn bottom strip for HonoredByStudents framing 'centre' (rev 3). Reads the real plate (honored_plate.jpg, 1.25 plate
# px per world px, world x 1360..2920) and writes honored_tear.png: plate rows 2480..2782 (world y 1984..2225.6, plus 24
# rows of ground to 2244.8) with
# the page torn just under the caption's last line ("outstanding citizen.", ink to world y ~2102) and above the rule
# and the next stories' heads (world y >= 2123), on the show's own dark ground (sampled from the right side of
# notes/reference/honored_src22.30.png beyond the torn right edge: BGR mean 3.5 / 1.3 / 1.4, std ~1).
# The paper above the tear is the plate's own pixels, unchanged except a lighter torn band; nothing new is printed.
# Tear model: a roughly level edge (control points kept inside the measured ink gaps, per world x), low + mid + high
# frequency wander, a lighter band of torn fibres on the paper side (ragged inner boundary, ink lightened with it), a
# fibrous fringe sticking out below the edge (anisotropic noise) plus a few longer hairs, and a faint contact shadow
# onto the ground (on a near-black ground it is ~1 level, as in the reference).
# Usage: uv run --offline --with numpy --with opencv-python-headless python honored_tear.py <public_dir>
import sys, cv2, numpy as np

PUB = sys.argv[1]
P = 1.25
X0 = 1360.0
R0, R1 = 2480, 2782  # plate rows of the strip (2480 is a multiple of 8; world 1984)
SS = 4  # supersampling for the edge geometry
GROUND = np.array([4.0, 1.0, 1.0], np.float32)  # BGR, the reference ground (rounded)

plate = cv2.imread(f"{PUB}/honored_plate.jpg", cv2.IMREAD_COLOR)
strip = plate[R0:R1].astype(np.float32)
H, W = strip.shape[:2]
del plate
rng = np.random.default_rng(1938)

# ---- the edge, world y per world x. Gaps measured on the plate (ink rows): x < 1760 between the caption's last line
# (<= 2102) and the double rule (>= 2123); x 1760-2620 between caption line 2 (<= 2064) and the rule / ornament /
# PUPILS rule (>= 2123); x 2620-2842 open to ~2176; right column (x > 2842) text 2099-2121, gap 2121-2138.
CX = [1360, 1480, 1600, 1720, 1800, 1900, 2000, 2080, 2160, 2260, 2360, 2440, 2540, 2620, 2700, 2780, 2850, 2920]
CY = [2112, 2114, 2110, 2113, 2109, 2104, 2100, 2106, 2097, 2093, 2104, 2109, 2100, 2108, 2118, 2122, 2128, 2127]
WS = W * SS
xs_world = X0 + (np.arange(WS) + 0.5) / (SS * P)
base = np.interp(xs_world, CX, CY)
base = cv2.GaussianBlur(base[None, :].astype(np.float32), (0, 0), sigmaX=22 * P * SS)[0]


def fourier(n_modes, wl_lo, wl_hi, amp):
    out = np.zeros(WS, np.float32)
    for _ in range(n_modes):
        wl = rng.uniform(wl_lo, wl_hi)
        out += np.sin(2 * np.pi * xs_world / wl + rng.uniform(0, 2 * np.pi)) * rng.uniform(0.5, 1.0)
    return out / np.abs(out).max() * amp


edge = base + fourier(5, 70, 220, 3.0) + fourier(8, 9, 32, 1.5)
jit = rng.normal(0, 1, WS).astype(np.float32)
jit = cv2.GaussianBlur(jit[None, :], (0, 0), sigmaX=1.2 * SS)[0]
edge += jit / jit.std() * 0.35
# hard limits from the ink gaps (fibres reach ~5 world px below the edge)
lo = np.where(xs_world < 1760, 2106.0, np.where(xs_world > 2842, 2123.0, 2084.0))
hi = np.where(xs_world < 2620, 2116.0, np.where(xs_world > 2842, 2130.0, 2124.0))
edge = np.clip(edge, lo, hi)
print("edge world y: min %.1f max %.1f" % (edge.min(), edge.max()))
edge_ss = (edge * P - R0) * SS  # supersampled strip rows

# ---- supersampled fields. Two edges, as newsprint tears: the printed surface layer ends at E1, the thinner fibre layer
# runs on to E2 (the paper's end) as a light, unprinted band of irregular width; beyond E2 a short soft fuzz and a few
# loose fibres. t = plate px below E2 (negative = paper).
HS = H * SS
yy = np.arange(HS, dtype=np.float32)[:, None] + 0.5
t = (yy - edge_ss[None, :]) / SS

# band width (plate px): slow variation plus a jagged component, so the inner boundary bites into the print
bw = 1.5 + 8.0 * (0.5 + 0.5 * fourier(7, 25, 110, 1.0)) ** 1.5
bj = rng.normal(0, 1, WS).astype(np.float32)
bj = cv2.GaussianBlur(bj[None, :], (0, 0), sigmaX=0.9 * SS)[0]
bw = np.clip(bw + bj / bj.std() * 0.9, 0.8, None)
rag = rng.normal(0, 1, (HS, WS)).astype(np.float32)
rag = cv2.GaussianBlur(rag, (0, 0), sigmaX=0.7 * SS, sigmaY=0.9 * SS)
rag /= rag.std()
v = (-t) / bw[None, :] + 0.18 * rag  # 0 at E2, 1 at E1
band = np.clip((1.15 - v) / 0.3, 0, 1)  # 1 inside the band, soft over ~0.3 band widths
band = (band * band * (3 - 2 * band)).astype(np.float32)

# the thin band is slightly translucent toward E2 (alpha 0.88 at the very end), fuzz beyond it
fz = rng.normal(0, 1, (HS, WS)).astype(np.float32)
fz = cv2.GaussianBlur(fz, (0, 0), sigmaX=0.5 * SS, sigmaY=0.8 * SS)
fz /= fz.std()
fuzz_d = 0.8 + 1.4 * (0.5 + 0.5 * fourier(6, 15, 60, 1.0))  # plate px
fuzz = 0.55 * np.exp(-np.clip(t, 0, None) / fuzz_d[None, :]) * np.clip(0.5 + 0.45 * fz, 0, 1)
alpha = np.where(t <= 0, 1.0 - 0.12 * np.exp(t / 1.2), fuzz * (t > 0)).astype(np.float32)
del fz, rag, v

# a few loose fibres: thin, gently bent, mostly short
hair = np.zeros((HS, WS), np.float32)
for _ in range(int(W / 22)):
    xi = rng.uniform(0, WS)
    y0 = float(np.interp(xi, np.arange(WS), edge_ss)) - rng.uniform(0, 1.0) * SS
    ang = np.radians(rng.normal(0, 40))
    ln = rng.gamma(2.0, 1.6) * SS + 1.5 * SS
    bend = np.radians(rng.normal(0, 25))
    pts = []
    for s in np.linspace(0, 1, 6):
        a = ang + bend * s
        pts.append((xi + np.sin(a) * ln * s, y0 + np.cos(a) * ln * s))
    pts = np.int32(np.array(pts) * 16)
    cv2.polylines(hair, [pts], False, float(rng.uniform(0.25, 0.6)), thickness=max(1, int(round(0.45 * SS))),
                  lineType=cv2.LINE_AA, shift=4)
alpha = np.maximum(alpha, hair)
band = np.maximum(band, (hair > 0.02).astype(np.float32) * (t > -2))
del hair


def down(a):
    return cv2.resize(a, (W, H), interpolation=cv2.INTER_AREA)


A = np.clip(down(alpha), 0, 1)
B = np.clip(down(band), 0, 1)
del alpha, band

# light (unprinted) paper: the local bright paper level, lifted like the reference's torn edge (x ~1.2), carrying the
# plate's own fine texture; inside the band the print is gone (ink replaced, not just lightened)
gray = strip.mean(axis=2)
paper_mask = (gray > 140).astype(np.float32)
num = cv2.GaussianBlur(strip * paper_mask[..., None], (0, 0), 12)
den = cv2.GaussianBlur(paper_mask, (0, 0), 12)[..., None]
local_paper = num / np.maximum(den, 1e-3)
light = local_paper * 1.16 + 4
tex = (gray - cv2.GaussianBlur(gray, (0, 0), 2.5)) * paper_mask
light = light + np.clip(tex, -14, 14)[..., None] * 0.7
light = cv2.GaussianBlur(light, (0, 0), 0.6)
paper = strip * (1 - B[..., None]) + light * B[..., None]

# ground with a faint contact shadow under the edge
sh = cv2.GaussianBlur(A, (0, 0), 3.0)
sh = np.roll(sh, 2, axis=0)
ground = GROUND[None, None, :] * (1 - 0.8 * sh[..., None])
out = paper * A[..., None] + ground * (1 - A[..., None])
out = np.clip(np.round(out), 0, 255).astype(np.uint8)
# PAD rows of plain ground under the strip, so the strip runs past the plate's own bottom edge (world 2225.6) and the
# plate's anti-aliased last row can never show through as a faint line on the ground
PAD = 24
out = np.vstack([out, np.tile(np.round(GROUND).astype(np.uint8)[None, None, :], (PAD, W, 1))])
cv2.imwrite(f"{PUB}/honored_tear.png", out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
print("wrote", f"{PUB}/honored_tear.png", out.shape, "world y", R0 / P, "..", (R1 + PAD) / P)
