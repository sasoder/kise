import { Img, staticFile } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  breath,
  clamp01,
  iconShadow,
  makeTone,
  smoothstep,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// trapShared — the WORLD of the Noam Brown "evals are a test environment" clip.
//
// Five cuts, one standing picture. This file owns everything the five share:
// the sizes, the two ink rungs, the tableau's world coordinates, the two
// cameras, and every noun as a component. A cut decides what HAPPENS; this file
// decides what it is MADE OF. Import it, never restate a value.
//
// THE ONE IDEA: **DASHED = fake / simulated. SOLID = real.** The test
// environment is a big dashed white ring around the model; a forecast is
// dashed; the real world is solid. Dashes always march, so a hold is never
// static.
//
// THE VOCABULARY (fixed — the same object means the same thing in every cut):
//   the model      = ONE solid orange dot, MODEL_R_PX * 2 = 42 screen px across,
//                    ACCENT_DEEP at rest, ACCENT when it is thinking. `breath`
//                    on it always. Tone, never alpha (`MODEL_TONE`).
//   its attention  = accent, and accent is used for NOTHING else: a WORK THREAD
//                    (dot -> the thing it works on, with packets out and back)
//                    and a GAZE (a straight hand from the dot, like a needle).
//   the wall       = the dashed white ring the model is inside: the eval.
//   a noun         = a white Lucide OUTLINE icon inside a white station ring.
//                    radical = the math question, folder = the folder,
//                    key = the answer key.
//   a person       = public/person.png, white, PERSON_H_PX tall. The real world,
//                    or the evaluator ("you"). A FAKE person is that glyph at
//                    INK_LO inside a dashed circle.
//   the wire       = white, INK_HI, SOLID: the tripwire out of the folder to the
//                    evaluator. It passes through the wall.
// White ink has exactly two opacities: INK_HI 1.0 (the subject) and INK_LO 0.5
// (context). Nothing else. One stroke weight everywhere.
//
// SIZES are SCREEN px targets at CAM_CLOSE (K_REF). Every world size in here is
// that target divided by K_REF, so a ring, a dot and a stroke are the same size
// on screen in all five cuts; at CAM_WIDE they are x0.88, which is accepted.
//
// SHADOWS: `iconShadow(k)` on a wrapper group OUTSIDE any scale() group, bodies
// pure white. The global drop shadow, `GridBackground` and `Vignette` stay in
// each cut, exactly as LiveLoop / FilteringPipeline do it.
//
// EVERY COMPONENT IS PURE AND FRAME-DRIVEN and takes WORLD coordinates. The SVG
// ones (Wall, Station, FolderStation, Thread, Gaze, Wire) go inside the world
// <svg>; the DOM ones (PersonGlyph, FakePerson) go inside the world <div>,
// beside it. `Tableau` lays all of that out in the one legal z-order.
// ---------------------------------------------------------------------------

export const FPS = 24;

export const TWO_PI = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- ink --------------------------------------------------------------------
export const INK = "#FFFFFF";
export const INK_HI = 1.0; // the subject
export const INK_LO = 0.5; // context
/** The model's tone ramp: 0 = at rest (deep), 1 = thinking / lit (ripe). */
export const MODEL_TONE = makeTone(ACCENT_DEEP, ACCENT);

// --- sizes, as SCREEN px at K_REF -------------------------------------------
export const STROKE_PX = 6; // rings, icons, the wall — one weight
export const STATION_R_PX = 65; // a station ring's radius
export const MODEL_R_PX = 21; // the model dot: 42 px across
export const PERSON_H_PX = 118; // person.png's box (its ink is 0.84 of it)
export const THREAD_PX = STROKE_PX / 2; // a thread and the gaze: half stroke
export const WIRE_PX = 4.5; // the wire: half-to-full stroke
export const PACKET_R_PX = 5;
export const DASH_ON_PX = 26;
export const DASH_OFF_PX = 18;
export const MARCH_PX_PER_F = 0.6; // dashes march this far every frame

/** The camera every screen-px size above is solved at: CAM_CLOSE's k. */
export const K_REF = 1.3;
/** A screen-px size in world px at camera zoom `k` (K_REF by default). */
export const worldPx = (px: number, k: number = K_REF) => px / k;

export const STROKE_W = worldPx(STROKE_PX);
export const STATION_R = worldPx(STATION_R_PX);
export const MODEL_R = worldPx(MODEL_R_PX);
export const PERSON_H = worldPx(PERSON_H_PX);
export const THREAD_W = worldPx(THREAD_PX);
export const WIRE_W = worldPx(WIRE_PX);
export const PACKET_R = worldPx(PACKET_R_PX);
export const DASH_ON = worldPx(DASH_ON_PX);
export const DASH_OFF = worldPx(DASH_OFF_PX);
export const MARCH_W = worldPx(MARCH_PX_PER_F);
/** A Lucide glyph fills this fraction of its ring's diameter. */
export const GLYPH_FRACTION = 0.6;
/** The folder station's ring is bigger: it holds a glyph AND the key. */
export const FOLDER_R_SCALE = 1.35;
/** ...and its glyph sits LOW in that ring, as a fraction of the glyph's own box,
 *  so the key has room to come out of the folder's mouth without crossing the
 *  ring.
 *
 *  THIS IS SOLVED AGAINST `KEY_FRACTION`, NOT CHOSEN. The rise's apex is the one
 *  frame where the key must be wholly above the folder's mouth line (that is
 *  what lets the clip be dropped there without anything popping), so the apex
 *  sits at `mouth - the key's own ink depth`; and the key's bit — the tip of the
 *  Lucide glyph at (21, 2) on the 24 grid — is then the ink closest to the
 *  ring. Dropping the glyph by 0.26 of its box (21.1 world px) drops the mouth
 *  with it, which is the only thing that buys the bigger key its headroom.
 *  MEASURED at cut 3's own camera through the rise (k 1.30): the key clears the
 *  ring's inner edge by 8.0 screen px at the apex, exactly what the 0.60 key
 *  cleared it by. The folder glyph itself keeps 8.9 screen px at k 1.30 and
 *  7.9 at CAM_WIDE. */
export const FOLDER_GLYPH_DY = 0.26;
/** the glyph's offset once the key has settled (keyRise 1): the pair re-centres. */
export const FOLDER_GLYPH_DY_REST = 0.1;

// ---------------------------------------------------------------------------
// THE TABLEAU, in world px (k = 1 means world px = screen px).
//
// Measured at CAM_CLOSE (k 1.3, world y 922 on screen y 835):
//   wall        screen x 98..982 (side margin 98, brief asks >= 70)
//               screen y 332..1216 (the caption band wants ink above ~1400)
//   the evaluator is fully off frame above: person.png's ink ends at 0.92 of
//   its box, i.e. world y 253, which lands at screen y -26 — and stays off with
//   the sway's 5 world px at its worst. This is what fixes CAM_CLOSE.y: at 890
//   the last 14 px of their feet sat on the top edge of every resolved frame.
// Measured at CAM_WIDE (k 1.15, world y 830 on screen y 835), sway at its worst
// in each direction:
//   evaluator head screen y 69.8  (brief asks >= 50 from the top edge)
//   wall bottom    screen y 1286.2 (brief asks above 1300)
//   wall side      screen x 142.9 of margin (brief asks >= 70)
// CAM_WIDE WAS k 1.0 / y 800, which put the head at 205 and the wall's bottom at
// 1252 — 1.15 is the biggest zoom the three still fit at, in this sense: the head
// constraint is y <= 164.6 + 785/k and the wall's is y >= 1222.3 - 465/k, so the
// two cross at k 1.1818 and there is no y at all above that. 1.15 keeps 19.8 px
// of headroom on the head and 13.8 px on the wall's bottom, which the damper's
// own landing error (a cut reads a knot to within ~0.5%) needs.
//
// DEVIATION from the brief's recommended numbers, with the arithmetic:
//   * WALL r is 340, not 360. At 360 the wall spans 936 screen px at CAM_CLOSE,
//     i.e. 72 px of side margin before the stroke (69 after it, 66 with sway) —
//     under the brief's own >= 70 floor. 340 gives 98, and it also takes 126
//     world px off the half-circumference the cut-3 wipe has to cover under the
//     45 screen px/frame head ceiling.
//   * WALL cy 875 and CAM_CLOSE y 922, not 870 / 930. The wall is the frame of
//     the picture, so its centre is roughly what CAM_LIFT should put near
//     screen 835; 922 is as far up the wall as the frame can go before the
//     evaluator's feet come back into the top of it (see above), and it still
//     leaves the wall's own ink centred at screen 774.
// ---------------------------------------------------------------------------
export const WALL = { cx: 540, cy: 875, r: 340 };
export const MODEL_HOME = { x: 540, y: 1010 };
export const QUESTION = { x: 405, y: 760 };
export const FOLDER = { x: 675, y: 760 };
/** The person ("you"), OUTSIDE the wall and above it. (x, y) is their CENTRE. */
export const EVALUATOR = { x: 540, y: 215 };

/** The folder station's ring radius (the one ring that is not STATION_R). */
export const FOLDER_R = STATION_R * FOLDER_R_SCALE;

/** A camera: k, and the world point (x, y) that sits at screen (540, 835). */
export type Cam = { k: number; x: number; y: number };
export const CAM_CLOSE: Cam = { k: 1.3, x: 540, y: 922 };
export const CAM_WIDE: Cam = { k: 1.15, x: 540, y: 830 };

/** `runCamera`'s cy for a camera: CAM_LIFT puts (x, y) on screen y 835. */
export const camCy = (c: Cam) => c.y + CAM_LIFT / c.k;

/** The white beads on the WIRE. Unlike every other packet in the clip they are
 *  only ever seen at CAM_WIDE — cut 4 runs the wire out as it pulls back there
 *  and cut 5 holds it there — so they are solved at CAM_WIDE rather than at
 *  K_REF, and both cuts use THIS value so a bead cannot change size across the
 *  join. PACKET_R_PX of screen at CAM_WIDE = 4.35 world px. */
export const WIRE_PACKET_R = worldPx(PACKET_R_PX, CAM_WIDE.k);

// --- the angles the gaze lives on -------------------------------------------
export const angleTo = (from: { x: number; y: number }, to: { x: number; y: number }) =>
  Math.atan2(to.y - from.y, to.x - from.x);
/** The model's line of sight to the question: up and to the left. */
export const ANG_QUESTION = angleTo(MODEL_HOME, QUESTION);
/** ...and to the folder: up and to the right. */
export const ANG_FOLDER = angleTo(MODEL_HOME, FOLDER);
/** Half-way between them, which is straight up: where cut 3's needle stops. */
export const ANG_MID = (ANG_QUESTION + ANG_FOLDER) / 2;
/** The needle's length from the model's centre — short of the stations, so it
 *  reads as a hand pointing rather than as a second thread touching. */
export const GAZE_LEN = 205;
/** The work thread's two ends: the model's edge and the question ring's edge. */
export const THREAD_GAP = MODEL_R * 1.15;

// ---------------------------------------------------------------------------
// THE ICONS. lucide-static (ISC), inlined verbatim on the 24 grid, with
// pathLength="1" added to every element so one inherited `stroke-dasharray` on
// the parent <g> draws every sub-path by the same fraction of ITS OWN length.
// ---------------------------------------------------------------------------
export const ICON_RADICAL = `<path pathLength="1" d="M3 12h3.28a1 1 0 0 1 .948.684l2.298 7.934a.5.5 0 0 0 .96-.044L13.82 4.771A1 1 0 0 1 14.792 4H21"/>`;
export const ICON_FOLDER = `<path pathLength="1" d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`;
export const ICON_KEY = `<path pathLength="1" d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path pathLength="1" d="m21 2-9.6 9.6"/><circle pathLength="1" cx="7.5" cy="15.5" r="5.5"/>`;

/** The folder glyph's own geometry, in its 24-unit em box: the top edge of its
 *  body (the "mouth" the key comes out of) and the centre of that body. */
const FOLDER_MOUTH_U = 6.0;
const FOLDER_BODY_U = 13.2;
/** The key, as a fraction of the folder glyph's em box. It is the SUBJECT of the
 *  folder station — "a folder with the answer key in it" has to read on a phone
 *  — so it is bigger than the body it sits in and overlaps the folder's outline,
 *  which is allowed: the folder is at INK_LO behind it. 0.78 makes the key's box
 *  63.2 world px, 82 screen px at CAM_CLOSE (21 px at the 270-px reading test)
 *  against the 0.60 key's 63 / 16. See FOLDER_GLYPH_DY for what pays for it. */
export const KEY_FRACTION = 0.78;
/** The key glyph's own ink depth below its box centre, as a fraction of its box:
 *  the bottom of its bow, the circle at (7.5, 15.5) r 5.5 on the 24 grid. The
 *  rise's apex is `mouth - this - half a stroke`, so the key is EXACTLY clear of
 *  the mouth there and not a world px higher — the 0.60 key used half its own
 *  box, which wasted 5.6 world px of headroom the 0.78 key cannot spare. */
const KEY_INK_BELOW_U = 21.0 - 12.0;

// ---------------------------------------------------------------------------
// THE CAMERA. Authored as KNOTS on one monotone cubic Hermite (Fritsch-Carlson
// tangents, so the track can never overshoot a knot and reverse), one key per
// frame, through the shared damper — the same construction FilteringPipeline
// uses and for the same reason: chained `camMove`s each have to come to a dead
// stop at their junction, and this clip's camera pans as well as zooms, so it
// needs a third channel that `camMove` does not have.
// ---------------------------------------------------------------------------
export const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

export type CamKnot = { f: number; k: number; x: number; y: number };

/** One key per frame, from f = 0 to `last`, off the Hermite through `knots`.
 *  CY is taken off the EASED k (cy = y + CAM_LIFT / k), so the framing and the
 *  zoom settle together instead of the composition sagging through a move. */
export const camKnots3 = (knots: CamKnot[], last: number) => {
  const kf = knots.map((n) => n.f);
  const kOf = hermite(kf, knots.map((n) => n.k));
  const xOf = hermite(kf, knots.map((n) => n.x));
  const yOf = hermite(kf, knots.map((n) => n.y));
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  for (let f = 0; f <= last; f++) {
    const kk = kOf(f);
    K.push(kk);
    CX.push(xOf(f));
    CY.push(yOf(f) + CAM_LIFT / kk);
  }
  return { K, CX, CY };
};

/** `runCamera` with a third channel. The arrays are indexed BY FRAME (as
 *  `camKnots3` returns them), clamped at both ends. */
export const runCam3 = (upto: number, CX: number[], CY: number[], K: number[]) => {
  const at = (a: number[], f: number) => a[Math.max(0, Math.min(a.length - 1, f))];
  let cx = CX[0];
  let cy = CY[0];
  let k = K[0];
  let vx = 0;
  let vy = 0;
  let vk = 0;
  const n = Math.max(0, Math.round(upto));
  for (let f = 1; f <= n; f++) {
    vx += (at(CX, f) - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (at(CY, f) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (at(K, f) - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cx, cy, k };
};

// ---------------------------------------------------------------------------
// GEOMETRY HELPERS
// ---------------------------------------------------------------------------
export const ptOnCircle = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + Math.cos(a) * r,
  y: cy + Math.sin(a) * r,
});

/** An arc as a polyline path, sampled about every 1.5 degrees. */
export const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const steps = Math.max(2, Math.ceil((Math.abs(a1 - a0) / TWO_PI) * 240));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = ptOnCircle(cx, cy, r, a0 + (a1 - a0) * (i / steps));
    d += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
};

/** Is angle `a` inside the range that starts at `from` and sweeps `sweep`
 *  (positive, clockwise in SVG's y-down frame)? */
export const inArc = (a: number, from: number, sweep: number) => {
  if (sweep <= 0) return false;
  if (sweep >= TWO_PI) return true;
  let d = (a - from) % TWO_PI;
  if (d < 0) d += TWO_PI;
  return d <= sweep;
};

// ---------------------------------------------------------------------------
// THE WALL — the dashed ring the eval puts around the model.
//
// `draw` 0..1 is a centre-out wipe from the BOTTOM point, both ways, closing at
// the top. `dashedFrom` / `dashedSweep` is the angular range that is DASHED
// while the rest is SOLID (default: all of it, which is what an eval is);
// cut 2 walks that range around behind a sweeping hand. `bright` is an angular
// range drawn at INK_HI over an INK_LO base. `march` is the frame: the dashes
// advance MARCH_PX_PER_F screen px every frame, anchored to a fixed point on
// the circle so a wall split into several runs has ONE continuous pattern.
// ---------------------------------------------------------------------------
const WALL_BUCKETS = 360;

export const Wall: React.FC<{
  k: number;
  cx?: number;
  cy?: number;
  r?: number;
  draw?: number;
  dashedFrom?: number;
  dashedSweep?: number;
  brightFrom?: number;
  brightSweep?: number;
  march?: number;
  opacity?: number;
  stroke?: number;
}> = ({
  k,
  cx = WALL.cx,
  cy = WALL.cy,
  r = WALL.r,
  draw = 1,
  dashedFrom = 0,
  dashedSweep = TWO_PI,
  brightFrom,
  brightSweep,
  march = 0,
  opacity = INK_HI,
  stroke = STROKE_W,
}) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const hasBright = brightFrom !== undefined && (brightSweep ?? 0) > 0;
  const base = hasBright ? INK_LO : opacity;
  const BOT = Math.PI / 2; // the bottom point, where the wipe starts
  const step = TWO_PI / WALL_BUCKETS;

  type Run = { a0: number; a1: number; dashed: boolean; bright: boolean };
  const runs: Run[] = [];
  let cur: Run | null = null;
  for (let j = 0; j < WALL_BUCKETS; j++) {
    const o = -Math.PI + (j + 0.5) * step; // offset from the bottom point
    const exists = Math.abs(o) <= Math.PI * d;
    const a = BOT + o;
    const dashed = exists && inArc(a, dashedFrom, dashedSweep);
    const bright = exists && hasBright && inArc(a, brightFrom as number, brightSweep as number);
    if (!exists) {
      cur = null;
      continue;
    }
    if (cur && cur.dashed === dashed && cur.bright === bright) {
      cur.a1 = a + step / 2;
    } else {
      cur = { a0: a - step / 2, a1: a + step / 2, dashed, bright };
      runs.push(cur);
    }
  }
  if (runs.length === 0) return null;

  return (
    <g style={{ filter: iconShadow(k) }}>
      {runs.map((run, i) => (
        <path
          key={`w${i}`}
          d={arcPath(cx, cy, r, run.a0, run.a1)}
          fill="none"
          stroke={INK}
          strokeWidth={stroke}
          strokeLinecap={run.dashed ? "butt" : "round"}
          strokeDasharray={run.dashed ? `${DASH_ON} ${DASH_OFF}` : undefined}
          // anchored to the circle's own arc length, so every run shares one
          // pattern and the whole ring marches as one thing
          strokeDashoffset={run.dashed ? -(march * MARCH_W + r * (run.a0 + Math.PI)) : undefined}
          opacity={run.bright ? INK_HI : base}
        />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MODEL — one solid orange dot. Solid, breathing, no stroke. Its state is
// TONE (deep -> ripe), never alpha. The per-icon shadow is a touch lighter than
// the set's: this is a big FILLED shape where everything else is a 6 px stroke,
// so the identical filter lays down one contiguous block of shadow and reads
// heavier (LiveLoop measured the same thing on the Claude mark).
// ---------------------------------------------------------------------------
export const MODEL_SHADOW_OPACITY = 0.27;

export const ModelDot: React.FC<{
  frame: number;
  k: number;
  x?: number;
  y?: number;
  tone?: number;
  scale?: number;
  seed?: number;
  opacity?: number;
}> = ({ frame, k, x = MODEL_HOME.x, y = MODEL_HOME.y, tone = 0, scale = 1, seed = 0.31, opacity = 1 }) => (
  <g style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW_OPACITY) }} opacity={opacity}>
    <circle cx={x} cy={y} r={MODEL_R * scale * breath(frame, seed)} fill={MODEL_TONE(clamp01(tone))} />
  </g>
);

// ---------------------------------------------------------------------------
// A STATION — a white ring with one Lucide outline icon in it. The ring draws
// on from the top, clockwise; the icon strokes on after it (pathLength draw).
// `dashed` 0..1 opens the gaps between the ring's dashes continuously, so a
// station can be converted from real to fake without a cut.
// ---------------------------------------------------------------------------
export const Station: React.FC<{
  k: number;
  x: number;
  y: number;
  icon: string;
  r?: number;
  draw?: number;
  iconDraw?: number;
  dashed?: boolean | number;
  march?: number;
  opacity?: number;
  /** the glyph's own opacity, when it is not the ring's (the folder recedes
   *  behind its key; its RING is still a station and stays at INK_HI) */
  iconOpacity?: number;
  /** the glyph's offset inside its ring, in world px (the folder sits low) */
  iconDy?: number;
  glyph?: number;
  stroke?: number;
}> = ({
  k,
  x,
  y,
  icon,
  r = STATION_R,
  draw = 1,
  iconDraw,
  dashed = 0,
  march = 0,
  opacity = INK_HI,
  iconOpacity,
  iconDy = 0,
  glyph = GLYPH_FRACTION,
  stroke = STROKE_W,
}) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const idr = clamp01(iconDraw ?? clamp01((d - 0.55) / 0.45));
  const dash = clamp01(typeof dashed === "boolean" ? (dashed ? 1 : 0) : dashed);
  const a0 = -Math.PI / 2;
  const box = 2 * r * glyph;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <path
        d={arcPath(x, y, r, a0, a0 + TWO_PI * d)}
        fill="none"
        stroke={INK}
        strokeWidth={stroke}
        strokeLinecap={dash > 0 ? "butt" : "round"}
        strokeDasharray={dash > 0 ? `${DASH_ON} ${DASH_OFF * dash}` : undefined}
        strokeDashoffset={dash > 0 ? -march * MARCH_W : undefined}
      />
      {idr > 0 ? (
        <g
          transform={`translate(${(x - box / 2).toFixed(3)} ${(y + iconDy - box / 2).toFixed(
            3,
          )}) scale(${(box / 24).toFixed(5)})`}
          fill="none"
          stroke={INK}
          color={INK}
          strokeWidth={(stroke * 24) / box}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${idr.toFixed(4)} 1`}
          opacity={iconOpacity === undefined ? undefined : iconOpacity / Math.max(opacity, 1e-6)}
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FOLDER STATION — "a folder with the answer key in it". A bigger ring, the
// folder glyph large inside it, and the KEY in front of it.
//
// `keyRise` 0..1 is ONE gesture: the key starts hidden inside the folder's
// body, rises up through the folder's mouth (it is genuinely clipped by the
// mouth line while it is behind it — at u = 0.5 it is exactly clear of it, so
// dropping the clip there cannot be seen), then settles back down INTO the body
// in front, at INK_HI, while the folder glyph eases to INK_LO.
// ---------------------------------------------------------------------------
export const FolderStation: React.FC<{
  k: number;
  x?: number;
  y?: number;
  r?: number;
  draw?: number;
  iconDraw?: number;
  keyRise?: number;
  keyBob?: number;
  dashed?: boolean | number;
  march?: number;
  opacity?: number;
  stroke?: number;
}> = ({
  k,
  x = FOLDER.x,
  y = FOLDER.y,
  r = FOLDER_R,
  draw = 1,
  iconDraw,
  keyRise = 0,
  keyBob = 0,
  dashed = 0,
  march = 0,
  opacity = INK_HI,
  stroke = STROKE_W,
}) => {
  const d = clamp01(draw);
  if (d <= 0) return null;
  const u = clamp01(keyRise);
  const fbox = 2 * r * GLYPH_FRACTION;
  const s = fbox / 24;
  // the folder sits low in its ring WHILE THE KEY RISES (the apex needs the
  // headroom), then folder and key ride up together as the key settles, so the
  // resting pair is centred in the ring like the radical is in its own.
  const seat = smoothstep(clamp01((u - 0.5) / 0.5));
  const dy = fbox * lerp(FOLDER_GLYPH_DY, FOLDER_GLYPH_DY_REST, seat);
  const mouthY = y + dy - fbox / 2 + FOLDER_MOUTH_U * s;
  const bodyY = y + dy - fbox / 2 + FOLDER_BODY_U * s;
  const keyBox = fbox * KEY_FRACTION;

  // out of the mouth over the first half, home into the body over the second.
  // The apex is where the key's own INK bottom sits on the mouth line, so the
  // clip can be dropped there with nothing to see.
  const outY = mouthY - ((KEY_INK_BELOW_U * keyBox) / 24 + stroke / 2);
  const kyRaw =
    u <= 0.5
      ? lerp(bodyY, outY, smoothstep(u * 2))
      : lerp(outY, bodyY, smoothstep((u - 0.5) * 2));
  const keyY = kyRaw + keyBob;
  const clipped = u > 0 && u <= 0.5;
  const clipId = `fkm${Math.round(x)}-${Math.round(y)}`;

  return (
    <>
      <Station
        k={k}
        x={x}
        y={y}
        r={r}
        icon={ICON_FOLDER}
        draw={d}
        iconDraw={iconDraw}
        dashed={dashed}
        march={march}
        opacity={opacity}
        // The GLYPH recedes as the key takes over — the key is the subject — but
        // the RING does not: it is a station like any other and stays at INK_HI.
        iconOpacity={opacity * lerp(INK_HI, INK_LO, smoothstep(clamp01((u - 0.3) / 0.55)))}
        iconDy={dy}
      />
      {u > 0 ? (
        <g style={{ filter: iconShadow(k) }} opacity={opacity}>
          {clipped ? (
            <clipPath id={clipId}>
              <rect
                x={x - fbox}
                y={mouthY - 4 * fbox}
                width={2 * fbox}
                height={4 * fbox}
              />
            </clipPath>
          ) : null}
          <g clipPath={clipped ? `url(#${clipId})` : undefined}>
            <g
              transform={`translate(${(x - keyBox / 2).toFixed(3)} ${(keyY - keyBox / 2).toFixed(
                3,
              )}) scale(${(keyBox / 24).toFixed(5)})`}
              fill="none"
              stroke={INK}
              color={INK}
              strokeWidth={(stroke * 24) / keyBox}
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: ICON_KEY }}
            />
          </g>
        </g>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// PEOPLE. person.png, white, drawn with Remotion's <Img> so the frame waits for
// it to load — never an SVG <image> on staticFile, which races frame capture.
// These are DOM elements: they go inside the world <div>, not the world <svg>.
// ---------------------------------------------------------------------------
export const PersonGlyph: React.FC<{
  k: number;
  x: number;
  y: number;
  h?: number;
  opacity?: number;
  src?: string;
}> = ({ k, x, y, h = PERSON_H, opacity = INK_HI, src = "person.png" }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      left: x - h / 2,
      top: y - h / 2,
      width: h,
      height: h,
      opacity,
      filter: `brightness(0) invert(1) ${iconShadow(k)}`,
    }}
  />
);

/** A stage prop inside a test: `reveal` 0 = a real, solid person at INK_HI;
 *  1 = the same glyph at INK_LO inside a dashed circle. */
export const FakePerson: React.FC<{
  k: number;
  frame: number;
  x: number;
  y: number;
  h?: number;
  reveal?: number;
  opacity?: number;
  src?: string;
}> = ({ k, frame, x, y, h = PERSON_H, reveal = 1, opacity = 1, src = "person.png" }) => {
  const rv = clamp01(reveal);
  const rr = h * 0.66;
  const pad = rr + STROKE_W * 2;
  return (
    <>
      <PersonGlyph k={k} x={x} y={y} h={h} opacity={opacity * lerp(INK_HI, INK_LO, rv)} src={src} />
      {rv > 0 ? (
        <svg
          width={2 * pad}
          height={2 * pad}
          viewBox={`0 0 ${2 * pad} ${2 * pad}`}
          style={{ position: "absolute", left: x - pad, top: y - pad, overflow: "visible" }}
        >
          <g style={{ filter: iconShadow(k) }}>
            <path
              d={arcPath(pad, pad, rr, -Math.PI / 2, -Math.PI / 2 + TWO_PI * rv)}
              fill="none"
              stroke={INK}
              strokeWidth={STROKE_W}
              strokeLinecap="butt"
              strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
              strokeDashoffset={-frame * MARCH_W}
              opacity={opacity * INK_LO}
            />
          </g>
        </svg>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE MODEL'S ATTENTION. Accent, half stroke, round caps, and accent is used
// for nothing else in the clip.
//
// A WORK THREAD runs from the model to the thing it is working on and carries
// packets OUT AND BACK — it is working the problem, so the traffic never stops.
// A GAZE is a straight hand from the model, like a needle on a dial.
// ---------------------------------------------------------------------------
export const PACKET_PERIOD = 16; // frames between launches on one thread
export const PACKET_SPEED = 26; // world px/frame, capped against the camera
const SPEED_CAP_SCREEN = 45;

/** Every out-and-back packet in flight on `from -> to` at `frame`, oldest
 *  first. Pure, and derived from the geometry, so it retimes with the thread. */
export const threadPackets = ({
  frame,
  k,
  from,
  to,
  period = PACKET_PERIOD,
  speed = PACKET_SPEED,
  phase = 0,
}: {
  frame: number;
  k: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  period?: number;
  speed?: number;
  phase?: number;
}): { x: number; y: number; u: number }[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= 0 || period <= 0) return [];
  const v = Math.min(speed, SPEED_CAP_SCREEN / Math.max(k, 1e-4));
  const travel = len / v; // frames, one way
  const life = 2 * travel; // out and back
  const out: { x: number; y: number; u: number }[] = [];
  const nMax = Math.floor((frame - phase) / period);
  const nMin = Math.ceil((frame - phase - life) / period);
  for (let n = nMin; n <= nMax; n++) {
    const t = frame - (phase + n * period);
    if (t < 0 || t > life) continue;
    const u = t <= travel ? t / travel : 2 - t / travel;
    out.push({ x: from.x + dx * u, y: from.y + dy * u, u });
  }
  return out;
};

export const Thread: React.FC<{
  frame: number;
  k: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  progress?: number;
  packets?: boolean;
  period?: number;
  phase?: number;
  opacity?: number;
  width?: number;
}> = ({
  frame,
  k,
  from,
  to,
  progress = 1,
  packets = false,
  period = PACKET_PERIOD,
  phase = 0,
  opacity = 1,
  width = THREAD_W,
}) => {
  const p = clamp01(progress);
  if (p <= 0) return null;
  const tip = { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p) };
  const pk = packets && p >= 1 ? threadPackets({ frame, k, from, to, period, phase }) : [];
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line
        x1={from.x}
        y1={from.y}
        x2={tip.x}
        y2={tip.y}
        stroke={ACCENT}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {pk.map((q, i) => (
        <circle key={`p${i}`} cx={q.x} cy={q.y} r={PACKET_R} fill={ACCENT} />
      ))}
    </g>
  );
};

export const Gaze: React.FC<{
  k: number;
  from: { x: number; y: number };
  angle: number;
  length?: number;
  gap?: number;
  opacity?: number;
  width?: number;
}> = ({ k, from, angle, length = GAZE_LEN, gap = THREAD_GAP, opacity = 1, width = THREAD_W }) => {
  if (length <= gap) return null;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line
        x1={from.x + c * gap}
        y1={from.y + s * gap}
        x2={from.x + c * length}
        y2={from.y + s * length}
        stroke={ACCENT}
        strokeWidth={width}
        strokeLinecap="round"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WIRE — cut 4's tripwire, out of the folder's ring edge to the evaluator's
// feet, straight through the wall. WHITE, INK_HI, SOLID (it is real), half-to-
// full stroke, with packets flowing TOWARD the evaluator.
// ---------------------------------------------------------------------------
export const Wire: React.FC<{
  frame: number;
  k: number;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  progress?: number;
  packets?: boolean;
  period?: number;
  opacity?: number;
  width?: number;
}> = ({
  frame,
  k,
  from,
  to,
  progress = 1,
  packets = true,
  period = PACKET_PERIOD,
  opacity = INK_HI,
  width = WIRE_W,
}) => {
  const p = clamp01(progress);
  if (p <= 0) return null;
  const a = angleTo(FOLDER, EVALUATOR);
  const A = from ?? { x: FOLDER.x + Math.cos(a) * FOLDER_R, y: FOLDER.y + Math.sin(a) * FOLDER_R };
  const B = to ?? { x: EVALUATOR.x, y: EVALUATOR.y + PERSON_H * 0.42 };
  const tip = { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p) };
  const len = Math.hypot(B.x - A.x, B.y - A.y);
  const v = Math.min(PACKET_SPEED, SPEED_CAP_SCREEN / Math.max(k, 1e-4));
  const travel = len / v;
  const pk: { x: number; y: number }[] = [];
  if (packets && p >= 1 && travel > 0) {
    const nMax = Math.floor(frame / period);
    for (let n = Math.ceil((frame - travel) / period); n <= nMax; n++) {
      const t = frame - n * period;
      if (t < 0 || t > travel) continue;
      const u = t / travel;
      pk.push({ x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u) });
    }
  }
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line x1={A.x} y1={A.y} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth={width} strokeLinecap="round" />
      {pk.map((q, i) => (
        <circle key={`q${i}`} cx={q.x} cy={q.y} r={WIRE_PACKET_R} fill={INK} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TABLEAU — the whole standing picture from one state object, in the ONE
// legal z-order: wall -> wire -> threads and the gaze -> stations and their
// icons -> the person -> the model, on top. Cuts 4 and 5 re-draw the standing
// picture through this component so it matches cut 3's exactly.
//
// `under` and `over` are cut-specific layers: `under` goes behind the wall,
// `over` in front of the model. Both are SVG content in WORLD coordinates.
// ---------------------------------------------------------------------------
export type TableauState = {
  frame: number;
  /** the dashed ring: 0..1 centre-out wipe from the bottom point */
  wallDraw: number;
  wallDashedFrom?: number;
  wallDashedSweep?: number;
  wallBrightFrom?: number;
  wallBrightSweep?: number;
  wallOpacity?: number;
  /** the math-question station */
  questionDraw: number;
  questionIconDraw?: number;
  /** where it is, if a cut is still carrying it (defaults to QUESTION) */
  questionAt?: { x: number; y: number };
  questionDashed?: number;
  /** the folder station and the key in it */
  folderDraw: number;
  folderIconDraw?: number;
  folderAt?: { x: number; y: number };
  keyRise: number;
  keyBob?: number;
  folderDashed: number;
  /** the work thread, model -> question, and its out-and-back packets */
  workThread: number;
  workPackets?: boolean;
  /** the needle: null = no gaze at all */
  gazeAngle: number | null;
  gazeLength: number;
  /** the tripwire, folder -> evaluator */
  wire: number;
  wirePackets?: boolean;
  /** the model */
  modelTone: number;
  modelOffset: { x: number; y: number };
  modelScale?: number;
  /** the person outside the wall */
  evaluatorOpacity: number;
  evaluatorAt?: { x: number; y: number };
};

export const Tableau: React.FC<{
  state: TableauState;
  k: number;
  worldW?: number;
  worldH?: number;
  under?: React.ReactNode;
  over?: React.ReactNode;
}> = ({ state: s, k, worldW = 1080, worldH = 1920, under, over }) => {
  const frame = s.frame;
  const model = { x: MODEL_HOME.x + s.modelOffset.x, y: MODEL_HOME.y + s.modelOffset.y };
  const qAt = s.questionAt ?? QUESTION;
  const fAt = s.folderAt ?? FOLDER;
  const evAt = s.evaluatorAt ?? EVALUATOR;

  // The work thread runs edge to edge: off the model's rim, into the ring's.
  const aq = angleTo(model, qAt);
  const tFrom = { x: model.x + Math.cos(aq) * THREAD_GAP, y: model.y + Math.sin(aq) * THREAD_GAP };
  const tTo = { x: qAt.x - Math.cos(aq) * STATION_R, y: qAt.y - Math.sin(aq) * STATION_R };

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
  };

  return (
    <>
      <svg width={worldW} height={worldH} viewBox={`0 0 ${worldW} ${worldH}`} style={svgStyle}>
        {under}
        <Wall
          k={k}
          draw={s.wallDraw}
          dashedFrom={s.wallDashedFrom ?? 0}
          dashedSweep={s.wallDashedSweep ?? TWO_PI}
          brightFrom={s.wallBrightFrom}
          brightSweep={s.wallBrightSweep}
          march={frame}
          opacity={s.wallOpacity ?? INK_HI}
        />
        {s.wire > 0 ? (
          <Wire frame={frame} k={k} progress={s.wire} packets={s.wirePackets ?? true} />
        ) : null}
        {s.workThread > 0 ? (
          <Thread
            frame={frame}
            k={k}
            from={tFrom}
            to={tTo}
            progress={s.workThread}
            packets={s.workPackets ?? false}
          />
        ) : null}
        {s.gazeAngle !== null ? (
          <Gaze k={k} from={model} angle={s.gazeAngle} length={s.gazeLength} />
        ) : null}
        {s.questionDraw > 0 ? (
          <Station
            k={k}
            x={qAt.x}
            y={qAt.y}
            icon={ICON_RADICAL}
            draw={s.questionDraw}
            iconDraw={s.questionIconDraw}
            dashed={s.questionDashed ?? 0}
            march={frame}
          />
        ) : null}
        {s.folderDraw > 0 ? (
          <FolderStation
            k={k}
            x={fAt.x}
            y={fAt.y}
            draw={s.folderDraw}
            iconDraw={s.folderIconDraw}
            keyRise={s.keyRise}
            keyBob={s.keyBob ?? 0}
            dashed={s.folderDashed}
            march={frame}
          />
        ) : null}
      </svg>

      {s.evaluatorOpacity > 0 ? (
        <PersonGlyph k={k} x={evAt.x} y={evAt.y} opacity={s.evaluatorOpacity} />
      ) : null}

      <svg width={worldW} height={worldH} viewBox={`0 0 ${worldW} ${worldH}`} style={svgStyle}>
        <ModelDot
          frame={frame}
          k={k}
          x={model.x}
          y={model.y}
          tone={s.modelTone}
          scale={s.modelScale ?? 1}
        />
        {over}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// THE RESOLVED FRAMES, so the next cut opens on the picture already standing.
// `frame` is a placeholder: a cut spreads these and passes its own.
// ---------------------------------------------------------------------------
/** How far cut 4's model backs off on "huh", in world px, straight back down
 *  its own gaze line. `SeemsLikeATrap.STATS.model.recoilWorld`. */
export const CUT4_RECOIL = 20;

export const STATE_END_CUT3: TableauState = {
  frame: 0,
  wallDraw: 1,
  wallDashedFrom: 0,
  wallDashedSweep: TWO_PI,
  questionDraw: 1,
  folderDraw: 1,
  keyRise: 1,
  folderDashed: 0,
  workThread: 1,
  workPackets: true,
  gazeAngle: ANG_MID,
  gazeLength: GAZE_LEN,
  wire: 0,
  modelTone: 1,
  modelOffset: { x: 0, y: 0 },
  evaluatorOpacity: 1,
};

/** CUT 4's ACTUAL RESOLVED FRAME, read off `SeemsLikeATrap.STATS` and not a
 *  sketch of it: the tripwire run out to the evaluator with its white beads
 *  climbing, the folder ring converted to dashes (it is bait, made of the same
 *  stuff as the wall), the key home and still, the model still holding the 20
 *  world px it recoiled by on "huh" straight back down the folder bearing, and a
 *  SHORT needle (150 world px) lying back on the wire's root at -69.4 deg rather
 *  than cut 3's ANG_MID at GAZE_LEN. Cut 5 opens on this. */
export const STATE_END_CUT4: TableauState = {
  ...STATE_END_CUT3,
  keyBob: 0,
  folderDashed: 1,
  gazeAngle: (-69.4 * Math.PI) / 180,
  gazeLength: 150,
  modelOffset: {
    x: -Math.cos(ANG_FOLDER) * CUT4_RECOIL,
    y: -Math.sin(ANG_FOLDER) * CUT4_RECOIL,
  },
  wire: 1,
  wirePackets: true,
};
