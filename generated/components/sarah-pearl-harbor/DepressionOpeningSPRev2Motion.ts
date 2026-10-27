// DepressionOpeningSPRev2Motion: the pure motion math of DepressionOpeningSPRev2 (no React), so the camera can
// be dumped and plotted (k / dk / d2k) outside Remotion. Every track is the integral of raised-cosine velocity
// lobes: velocity and acceleration are continuous, one acceleration lobe, one deceleration lobe, no steps.

export const W = 1080;
export const H = 1920;

/** raised-cosine velocity lobe, 0 at a, 1 at p, 0 at b (continuous velocity AND acceleration) */
export const lobeV = (f: number, a: number, p: number, b: number) => {
  if (f <= a || f >= b) return 0;
  if (f <= p) return 0.5 * (1 - Math.cos((Math.PI * (f - a)) / (p - a)));
  return 0.5 * (1 + Math.cos((Math.PI * (f - p)) / (b - p)));
};
/** exact integral of lobeV from a to f */
export const lobeI = (f: number, a: number, p: number, b: number) => {
  const L1 = p - a;
  const L2 = b - p;
  if (f <= a) return 0;
  if (f <= p) {
    const t = (f - a) / L1;
    return 0.5 * L1 * (t - Math.sin(Math.PI * t) / Math.PI);
  }
  const g = Math.min(f, b) - p;
  return 0.5 * L1 + 0.5 * (g + (L2 / Math.PI) * Math.sin((Math.PI * g) / L2));
};
const lobeTotal = (a: number, p: number, b: number) => 0.5 * (b - a);

// --- the photo (Capone soup kitchen, 2939x2392 original; baked to PHOTO_BAKE_W wide) ------------------------
export const PHOTO_W = 2939;
export const PHOTO_H = 2392;
export const PHOTO_S = 0.85; // screen px per ORIGINAL px at camera zoom 1 (native was 0.8027)
// photo top flush with the frame top (as low as it can sit and still cover the frame): FREE clear of the edge,
// faces bottom ~y 1041 (above the 1080 band). The photo's own left edge is at "UP COFFEE" (the "SO" of SOUP is
// outside the original photograph), so f0 starts at that edge.
export const PHOTO_TY = 0;
export const PHOTO_TX0 = -70; // photo left at f0: already clearly moving (9 px/f); the sign is centred ~f20
// pan velocity: one lobe that is well under way at f0 (9 px/f), peaks at f44 ("America", inside "original
// America firsters"), and decelerates to rest at f96; PAN_PEAK = px/frame at the peak (before camera zoom)
export const PAN = { a: -40, p: 44, b: 96 };
export const PAN_PEAK = 19.5;
export const panX = (f: number) => PAN_PEAK * (lobeI(f, PAN.a, PAN.p, PAN.b) - lobeI(0, PAN.a, PAN.p, PAN.b));
export const photoTX = (f: number) => PHOTO_TX0 - panX(f);

// --- the page (Statutes at Large 46 p.590, 1782x2754 original) --------------------------------------------
export const PAGE_W = 1782;
export const PAGE_H = 2754;
export const PAGE_S = 0.5; // world px per original px (at zoom 1: 891 px = 82% of frame width)
export const PAGE_X = 136; // world left: the whole left edge (margin notes, "590") inside the frame at landing
export const PAGE_Y = 724; // world top at rest (header ~y 808 on screen at landing; its foot runs off the bottom)
// the entrance: rises from below the frame edge at full size on one velocity lobe, landed (at rest) by f78
export const RISE = { a: 52, p: 59, b: 78 }; // reads as a document by f66 (~75 % risen), at rest by f78
// starts fully below the frame WITH its shadow (top edge 110 px under it: the lifted shadow reaches ~60 px above it)
export const RISE_DIST = H - PAGE_Y + 110;
export const pageDY = (f: number) => RISE_DIST * (1 - lobeI(f, RISE.a, RISE.p, RISE.b) / lobeTotal(RISE.a, RISE.p, RISE.b));
/** settling rotation (deg): leans 2.4 deg while it rises, eases through a small -0.5 deg counter-lean, rests at 0 */
export const pageRot = (f: number) => {
  const r = pageDY(f) / RISE_DIST;
  const u = Math.min(1, Math.max(0, (f - 64) / 16));
  return 2.4 * r - 0.5 * Math.sin(Math.PI * u) ** 2;
};

// --- the camera push: a log-zoom and the screen travel of one page anchor, all lobes ------------------------
// The anchor is the centre of the real words "to protect American" (line 2 of the CHAP. 497 header, page x
// 1336-1667, x-height rows 214-232). The page lands (f78) with its whole left edge (margin notes, "590") inside the
// frame, so the push stays small through the rise and then runs straight into the phrase. The phrase sits only 223
// page px under the page's top edge, so with the page filling the top of frame (edge off-frame by f104) the phrase
// centre can sit no lower than 223 x scale: y ~620 at ~85 % width.
// Every camera track = one long main ease (starts f64 as the page settles, peak f84, lands ~f100-104) + ONE long tail
// lobe with the same start and peak (ending f260, far past the cut): after f84 the camera only decelerates, but the
// tail keeps the hold visibly alive (zoom creep + a drift up the page) - the end of the same push, no new move.
// The close-up: the frame's left edge sits at page x 1296, the clean gap in the running head (ink gap 1280-1319) and
// in line 1 (gap 1292-1300); on the phrase line that falls inside "States," (gap before "to" 1324-1337), so that
// fragment is feathered into the paper shadow (FEATHER, below the running head). The anchor IS that left-edge point,
// so after its travel ends (f104) the zoom creep grows about the left edge: no drift clips "Ch." or "to". The right
// edge then sits just past the text column (ink to 1668), which caps the scale at ~2.8.
const lobeN = (f: number, l: { a: number; p: number; b: number }) => lobeI(f, l.a, l.p, l.b) / lobeTotal(l.a, l.p, l.b);
export const PUSH_MAIN = { a: 64, p: 84, b: 106 };
export const TAIL = { a: 64, p: 84, b: 260 };
export const PHRASE = { u0: 1336, u1: 1667, v: 223 };
export const S_100 = 2.64; // page scale on f100 (phrase 874 px = 81 %); the tail's creep carries it to S_END
export const S_END = 2.8; // page scale on f131 (phrase 927 px = 86 %; right frame edge at page x ~1682)
// solve logZ(f) = LM * main(f) + LT * tail(f) through both targets
const lnz100 = Math.log(S_100 / PAGE_S);
const lnz131 = Math.log(S_END / PAGE_S);
const M100 = lobeN(100, PUSH_MAIN);
const M131 = lobeN(131, PUSH_MAIN);
const T100 = lobeN(100, TAIL);
const T131 = lobeN(131, TAIL);
const LT = (lnz131 - (lnz100 * M131) / M100) / (T131 - (T100 * M131) / M100);
const LM = (lnz100 - LT * T100) / M100;
export const zoom = (f: number) => Math.exp(LM * lobeN(f, PUSH_MAIN) + LT * lobeN(f, TAIL));
/** push progress for diagnostics: log-zoom as a fraction of its f131 value */
export const pushQ = (f: number) => Math.log(zoom(f)) / lnz131;
export const ANCHOR = { u: 1296, v: PHRASE.v };
export const ANCHOR_TRAVEL = { a: 70, p: 92, b: 104 };
// where the anchor (left-edge point, phrase height) should be on f104, and the tail's drift (screen px over the
// whole tail lobe): straight up the page only
export const ANCHOR_AT_104 = { x: 0, y: 572 };
export const TAIL_DRIFT = { x: 0, y: -270 };
const anchorWorld = { x: PAGE_X + PAGE_S * ANCHOR.u, y: PAGE_Y + PAGE_S * ANCHOR.v };
const T104 = lobeN(104, TAIL);
// travel target solved so the anchor sits on ANCHOR_AT_104 at f104 (travel complete + tail drift so far)
const ANCHOR_END = {
  x: ANCHOR_AT_104.x - TAIL_DRIFT.x * T104,
  y: ANCHOR_AT_104.y - TAIL_DRIFT.y * T104,
};
// the close-up's left feather (page px), on the phrase line only (line 1 already starts cleanly at the crop, x 1301):
// opaque paper shadow over the clipped "States," (ink to x 1323), fading out by x 1335 just before "to" (x 1337);
// rows v0-v1 with soft top and bottom
export const FEATHER = { u0: 1325, u1: 1335, v0: 202, v1: 252 };
/** the page's shadow fades as the camera closes in (the sheet lies flat; no dark strip as its edge leaves frame) */
export const shadowFade = (f: number) => {
  const t = Math.min(1, Math.max(0, (1.9 - zoom(f)) / 0.7));
  return t * t * (3 - 2 * t);
};
/** the camera: world point anchorWorld travels to its screen point while the zoom grows (identity before f70) */
export const camOf = (f: number) => {
  const q = lobeN(f, ANCHOR_TRAVEL);
  const t = lobeN(f, TAIL);
  return {
    z: zoom(f),
    ax: anchorWorld.x + (ANCHOR_END.x - anchorWorld.x) * q + TAIL_DRIFT.x * t,
    ay: anchorWorld.y + (ANCHOR_END.y - anchorWorld.y) * q + TAIL_DRIFT.y * t,
    wx: anchorWorld.x,
    wy: anchorWorld.y,
  };
};
export const toScreen = (f: number, x: number, y: number) => {
  const c = camOf(f);
  return { x: c.ax + c.z * (x - c.wx), y: c.ay + c.z * (y - c.wy) };
};
// the photo is a deeper plane: the same push magnifies it less (parallax), about a point above the queue
export const PHOTO_PARALLAX = 0.4;
export const PHOTO_FIX = { x: 540, y: 640 };
export const photoZoom = (f: number) => Math.pow(zoom(f), PHOTO_PARALLAX);
export const photoToScreen = (f: number, x: number, y: number) => {
  const z = photoZoom(f);
  return { x: PHOTO_FIX.x + z * (x - PHOTO_FIX.x), y: PHOTO_FIX.y + z * (y - PHOTO_FIX.y) };
};

// --- the photo recedes as the page arrives: warm darken toward DARK + a modest blur -------------------------
export const DIM = { f0: 60, f1: 86 };
export const dimT = (f: number) => {
  const t = Math.min(1, Math.max(0, (f - DIM.f0) / (DIM.f1 - DIM.f0)));
  return t * t * (3 - 2 * t);
};
export const DIM_MAX = 0.5; // DARK overlay opacity at full dim
export const BLUR_MAX = 3.5; // px at full res: the photo above the page stays a legible dimmed photo, not mud

// --- the underline: ONE marker stroke under "to protect American" -----------------------------------------
// page px, measured on the scan: line 2 ink bottom (descenders) y 236, "to protect American" x 1336-1667; no
// line-3 ink under that span (line 3 ends at x 848). Drawn on "protect" (f90) -> "American", landed f102.
export const UL1 = { x0: 1336, x1: 1673, y0: 242.5, y1: 241 };
export const UL_W = 10.6; // page px = ~30 screen px at the final scale (1.5x the r5 marker)
export const PEN = { f0: 90, f1: 102 };
/** pen progress 0..1 along a stroke: quick confident start, steady middle, soft landing */
export const penT = (f: number, f0: number, f1: number) => {
  const t = Math.min(1, Math.max(0, (f - f0) / (f1 - f0)));
  return lobeI(t * 10, 0, 2, 10) / lobeTotal(0, 2, 10);
};
// once the phrase is underlined, the rest of the page recedes toward umber so the phrase is the brightest thing
export const RECEDE = { f0: 100, f1: 109, max: 0.25 };
export const recedeT = (f: number) => {
  const t = Math.min(1, Math.max(0, (f - RECEDE.f0) / (RECEDE.f1 - RECEDE.f0)));
  return RECEDE.max * t * t * (3 - 2 * t);
};
// ...and everything BELOW the underlined line recedes much harder (the caption bands sit on the body type there): the
// page stays sharp (one copy softened by only ~0.8 page px = ~2.4 screen px is masked in), and a warm umber "paper in
// shadow" layer, graded downward, takes away most of the contrast: the type fades into the paper, it does not smear.
// Page px. Shadow colour SHADE at opacity 0 (v dark0) -> darkMid (v dark1) -> darkMax (v dark2 and below).
export const BELOW = { dark0: 250, dark1: 296, dark2: 385, darkMid: 0.8, darkMax: 0.965, soft0: 262, soft1: 300, soft: 0.8 };
export const SHADE = "92,76,57"; // warm umber, rgb
export const belowT = (f: number) => {
  const t = Math.min(1, Math.max(0, (f - RECEDE.f0) / (RECEDE.f1 - RECEDE.f0)));
  return t * t * (3 - 2 * t);
};
