import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FEATHER_STEPS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// John Charles Beren, clip `JohnCharlesBeren_Feels_Like_AGI`: "and each time a
// new model comes out, it'll sort of catch up in some of these areas".
//
// SRT span 0:12.939 -> 0:17.460 at 24fps.
// round((17.460 - 12.939) * 24) = round(4.521 * 24) = round(108.504) = 109
// frames of speech, plus a 16 frame tail so the resolved state holds = 125.
export const DURATION = 125;

// ---------------------------------------------------------------------------
// "Catch up in some of these areas". Six areas, six vertical crowds of agents
// STANDING ON ONE FLOOR, each one under a human on a ledge at its own height —
// the human's advantage in that area. A new model comes out: one read-wave
// rises from under the floor through all six. Then all six grow at once, and
// three of them arrive flush under their ledge while three run out of travel
// and stop short. The last frame IS the sentence: caught up in SOME of these
// areas.
//
// Every gesture is one word. Nothing else happens.
//   open at k 1.10 with the whole thing inside the
//     frame: one white floor rule under all six,
//     six finite stacks standing on it at six
//     different heights, six ledges with their
//     people above them. Idle is breath and sway
//     and nothing else.                           — "and each time"      f0
//   one read-wave front rises from BELOW the floor
//     up through all six stacks, deep -> ripe on a
//     single eased front. It crosses the floor line
//     at ~f43, clears the tallest rest top (660) by
//     f54, and keeps travelling to f66 so it is off
//     the top of the world before anything grows —
//     every new row is born ripe. Ripe stays ripe.  — "a new model
//                                                     comes out"         f34-66
//   the one camera move: k 1.10 -> 0.95, content
//     centre fixed at 586 so it is a pure pull-back.
//     Keyed f36-56, damped, landed and still by f64
//     — eleven frames clear of "catch". Nothing
//     else moves while it runs.                    — "comes out"         f38-64
//   every stack is growing from the very first
//     frame: a slow steady creep off the floor that
//     has covered 28% of each column's travel by
//     f66, so a new row is arriving at every top
//     edge while the sentence is still setting up.
//     No column is ever static.                    — under everything    f0-125
//   the creep speeds up into one acceleration lobe
//     — the catch-up itself. Columns 1, 3 and 5
//     take the lobe over f66-88, arrive at their
//     ledge and LOCK at f88 — over f78-88 the
//     feather collapses, the wobble goes out of the
//     edge and the top three rows snap onto the
//     lattice at one radius, so what lands under
//     the rule is one straight COMPLETE row ~9-15
//     px under it. A locked column cannot grow
//     again: that is what "caught up" means.       — "catch up in some"  f66-88
//   columns 2, 4 and 6 take the same lobe over
//     f66-96, peaking at f81, then ease out of it
//     into a slower creep that never stops: the
//     last 16% of their travel, a row and a half,
//     is delivered over f96-124, so the very last
//     frame still has a row arriving. Tops stay
//     feathered and jittered throughout and never
//     reach their ledges — 9 to 12 dot rows short. — "of these areas"    f66-125
//
// ambient: breath on every dot and the camera's own sway, from f0 to f125.
// No idle thread traffic in this piece — a thread between two dots inside a
// 4-wide column is noise at this scale, and the only thing that is allowed to
// move a dot's colour is the read-wave.
//
// v2 pass, on the director's note about the first preview:
//   * the stacks had no base and ran off the bottom of the frame at every
//     camera position, so they read as six endless stripes filling two thirds
//     of the frame including the caption zone, and the growth had nothing to be
//     measured from. They now stand on ONE floor rule at world y 1000 and every
//     stack is a finite, countable thing.
//   * the lock was not flush: the old straighten ramp was
//     `clamp01(1 - d / 2.5)`, which is 0.8 at the top row (d = 0.5) and 0.4 at
//     the second, so the two rows the eye actually reads kept 20% and 60% of
//     their jitter under the rule. It is now a plateau: fully straight for the
//     top three rows, fading out over the three below them.
//   * heights retuned against the new floor; pitch 142 -> 136 and the ledges
//     120 -> 116 so the floor rule, which reaches 40 px past the outermost
//     column, still clears the frame edge by 62 screen px at the opening k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot the new model has reached
  accentDeep: z.string(), // deep: a dot at rest
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  beats: z.object({
    and: z.number(), // "and"
    eachTime: z.number(), // "each time a new"
    model: z.number(), // "model"
    comesOut: z.number(), // "comes out"
    itllSort: z.number(), // "it'll sort"
    ofCatch: z.number(), // "of catch"
    catchUp: z.number(), // "catch"
    upInSome: z.number(), // "up in some"
    some: z.number(), // "some"
    ofThese: z.number(), // "of these areas"
    areas: z.number(), // "areas"
    end: z.number(), // speech ends; tail to 125
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  beats: {
    and: 0,
    eachTime: 25,
    model: 37,
    comesOut: 48,
    itllSort: 63,
    ofCatch: 72,
    catchUp: 75,
    upInSome: 81,
    some: 88,
    ofThese: 93,
    areas: 100,
    end: 109,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

const smooth = smoothstep;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole camera track: k 1.10 -> 0.95 with
// the content centre FIXED at world y 586 — the midpoint of everything this
// piece ever draws, from the highest person's head (172) to the floor rule
// (1001). So it is a pure pull-back: nothing slides, the frame just opens.
// `camMove` writes it as a warped smoothstep (warp 0.72, speed early) keyed per
// frame and `runCamera` damps it; cy comes off the eased k at every frame, so
// the content centre sits at screen y 835 at every camera position and not only
// at the ends.
//
//   f0-36    k 1.10  the whole composition already inside the frame: people at
//                    screen y 380 at the top, the floor at 1290 at the bottom,
//                    62 screen px of margin either side of the floor rule.
//   f38-64   -> 0.95 the pull-back that makes room for what is about to grow.
//                    Keyed f36-56; the damper lands it inside 0.2% of 0.95 by
//                    f64, eleven frames before "catch" (f75), so the growth and
//                    the lock happen in a frame that has already stopped. The
//                    resolved frame holds everything in screen y 441-1229, with
//                    the floor 750 px clear of the frame bottom and well inside
//                    the caption-safe band.
//
// There is no second key anywhere. The growth carries the last third on its
// own, which is the house rule and also the only way the flush lock reads: a
// camera still moving under it would turn a straight row into a drift.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;
const K_OPEN = 1.1;
const K_FINAL = 0.95;
const CONTENT_CENTRE = 586;
const CAM = camMove({
  f0: 36,
  f1: 56,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_CENTRE,
  c1: CONTENT_CENTRE,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [
  CONTENT_CENTRE + CAM_LIFT / K_OPEN,
  ...CAM.CY,
  CONTENT_CENTRE + CAM_LIFT / K_FINAL,
];

// ---------------------------------------------------------------------------
// The six areas.
//
// Each is a narrow crowd of agents on the reference field's own pitch
// (940/39 x 440/29), FOUR seats wide, scattered off its cell by the field's own
// 0.9 jitter and radius-varied by the stable hash so it reads as a crowd and
// not as a bar. Four, not seven and not five: seven seats is 169 world px of
// seats and five is 131 px with jitter, and at a pitch narrow enough to keep the
// row inside the opening frame the six crowds ran together into one wall with
// corduroy stripes down it — rendered and rejected. Four seats is 72 px of
// seats, 108 px with the full jitter, inside a 136 px pitch.
//
// A column's TOP is never a ruled line while it is growing: it undulates by
// `wobble` along x and the crowd dissolves into it over FEATHER_STEPS rows.
// Its BASE is the opposite of that, and this is the whole v2 change: every
// column stands on ONE white floor rule at world y 1000, its bottom rows laid
// on the full lattice with the jitter taken out of them, so a stack reads as a
// finite, countable quantity measured from a shared base rather than as a
// stripe that runs out of the frame. The floor reaches 40 world px past the
// outermost column each way.
//
// Above each column, at its own height, a white ledge: one ink rule at this
// piece's single stroke weight with a person standing on it. The ledge heights
// differ because a human's advantage differs by area.
//
// The lattice is per column: its rows are spaced evenly between the floor and
// that column's own final top row, so BOTH ends land exactly — the bottom row
// sits BASE_GAP above the rule and the locking top row lands LOCK_GAP under its
// ledge. That costs a per-column step of 14.90 to 15.27 against the field's
// nominal 15.17, a 2.5% spread that is invisible at this dot size and is the
// price of a lock that is actually flush and a base that is actually flat.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29; // the field's nominal row pitch; the per-column step rounds to it
const COL_SEATS = 4; // seats across a column
const PITCH = 136; // world px between column centres; the seat row is ~788 px wide
const NCOL = 6;
const JIT_X = 0.9; // the field's own scatter, both ways
const JIT_Y = 0.9;

const FLOOR_Y = 1000; // the one floor rule: every stack stands on it
const FLOOR_PAD = 40; // how far the rule reaches past the outermost column
const BASE_GAP = 12; // the bottom row's centre, above the rule
const BASE_Y = FLOOR_Y - BASE_GAP;

const LEDGE_Y = [380, 470, 430, 300, 560, 240];
const LOCKS = [true, false, true, false, true, false]; // columns 1, 3, 5 of 6
const REST_TOP = [660, 780, 650, 730, 800, 600];
// where the topmost ROW of dots ends up. A locking column lands its top row
// LOCK_GAP under its own rule; a short column stops where it stops, 9 to 12 dot
// rows short of its ledge.
const LOCK_GAP = 10;
const SHORT_TOP = [0, 650, 0, 540, 0, 450];
const FINAL_ROW = LEDGE_Y.map((ly, c) => (LOCKS[c] ? ly + LOCK_GAP : SHORT_TOP[c]));

// Rows per column, and the step that makes them land on both ends exactly.
const COL_ROWS = FINAL_ROW.map((y) => Math.round((BASE_Y - y) / STEP_Y));
const COL_STEP = FINAL_ROW.map((y, c) => (BASE_Y - y) / COL_ROWS[c]);
// Three rows of headroom above the final one, because a still-wobbling edge
// dips up to 1.9 rows above its own nominal top and those rows have to exist.
const EXTRA_ROWS = 3;

// The nominal top edge each column drives to. A locker aims half a row above
// its top row, so with the feather collapsed there is exactly one row above the
// edge and it is the flush one. A short column aims at its top row and keeps
// its wobble, so its edge is the ragged thing it always was.
const FINAL_TOP = FINAL_ROW.map((y, c) => (LOCKS[c] ? y - 0.5 * COL_STEP[c] : y));
const COL_X = Array.from({ length: NCOL }, (_, c) => CENTRE_X + (c - (NCOL - 1) / 2) * PITCH);

const LEDGE_W = 116;
const PERSON_SIZE = 72;
// person.png is a 512 box whose glyph runs to y 471, so the feet sit at 0.920
// of the drawn height. That is what puts them ON the rule rather than through
// it.
const PERSON_FOOT = 471 / 512;
const STROKE = 3; // the one stroke weight in this piece

// A seat's half-width, so the floor rule knows how wide a column really is.
const COL_HALF = ((COL_SEATS - 1) / 2) * STEP_X + 0.5 * JIT_X * STEP_X + DOT_RADIUS * 1.25;
const FLOOR_X0 = COL_X[0] - COL_HALF - FLOOR_PAD;
const FLOOR_X1 = COL_X[NCOL - 1] + COL_HALF + FLOOR_PAD;

// ---------------------------------------------------------------------------
// Seats on the lattice. `straightenPlateau(rows)` is the one shape used at both
// ends of a column: fully 1 for the first ~3 rows, then out over the next 3.
// The lock feeds it the seat's depth below the top edge, the floor feeds it the
// seat's row index off the base. It is a PLATEAU and not a linear ramp, which
// is the fix for the ragged lock: `1 - d / 2.5` was only 0.8 at the top row, so
// the row directly under the rule kept a fifth of its jitter.
// ---------------------------------------------------------------------------
const STRAIGHT_FULL = 2.6; // rows that go fully onto the lattice
const STRAIGHT_FADE = 3; // rows over which it fades back into the crowd
const straightenPlateau = (depth: number) =>
  clamp01((STRAIGHT_FULL + STRAIGHT_FADE - depth) / STRAIGHT_FADE);

type Seat = {
  c: number;
  x: number;
  yj: number;
  y0: number;
  base: number; // how far this seat is already straightened by the floor
  r: number;
  h: number;
};
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let c = 0; c < NCOL; c++) {
    const step = COL_STEP[c];
    for (let r = 0; r <= COL_ROWS[c] + EXTRA_ROWS; r++) {
      for (let s = 0; s < COL_SEATS; s++) {
        const i = c * 100000 + r * COL_SEATS + s;
        const y0 = BASE_Y - r * step;
        out.push({
          c,
          x:
            COL_X[c] +
            (s - (COL_SEATS - 1) / 2) * STEP_X +
            (hash(i, 11) - 0.5) * STEP_X * JIT_X,
          yj: y0 + (hash(i, 12) - 0.5) * step * JIT_Y,
          y0,
          base: straightenPlateau(r),
          r: 0.75 + 0.5 * hash(i, 13),
          h: hash(i, 71),
        });
      }
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The new model coming out: ONE front, rising. It starts 150 world px BELOW the
// floor and travels on a single smoothstep — not a per-column stagger, not a
// flash. A seat's tone is its distance behind the front, so the ramp is the
// front and the two cannot drift: deep ahead of it, ripe behind it, WAVE_SOFT
// world px of gradient in between. It only ever travels up, so ripe stays ripe.
//
// WAVE_Y0 is 1150 and not the first pass's 1900. Nothing is drawn below the
// floor any more, so a front that starts at the old frame-bottom spends 17 of
// its 32 frames invisible and then crosses the whole 500 px of crowd in nine —
// a flash, not a wave. From 150 px under the floor the visible run is f39 to
// f54: it crosses the floor line at ~f43 and clears the tallest rest top (660)
// by f54, comfortably inside the f60 the director asked for, and is still off
// the top of the world by f66 so every row born in the growth is born ripe.
// ---------------------------------------------------------------------------
const WAVE_LEAD = 3; // frames of anticipation before "model"
const WAVE_Y0 = 1150;
const WAVE_Y1 = 250;
const WAVE_SOFT = 100;

// ---------------------------------------------------------------------------
// The rise. On the director's note about v3: "make it so that the dots start
// animating in from the start of the graphic all the way to the end."
//
// v3 had the six stacks standing dead still from f0 to f66 and again from f96
// to f125 — two thirds of the piece with nothing arriving at a top edge. The
// growth is now ONE continuous rise per column that starts on frame 0 and, for
// the three short columns, is still delivering a row on frame 124.
//
// It is authored as a VELOCITY and integrated, so there are no segments to butt
// together and the speed is continuous everywhere by construction:
//
//   v(f) = creep + (tail - creep) * S(u) + peak * sin^2(pi * u),
//          u = clamp01((f - f0) / L),   S = smoothstep
//
// — a constant baseline rate that hands over smoothly to a second constant
// rate, plus one smooth acceleration lobe on top of it. S and sin^2 both leave
// and arrive with zero slope, so dv/df is 0 at f0 and at f0 + L: the lobe
// starts AT the creep speed rather than from a standstill, and there is no
// kink at either end. `rise` is its exact integral, normalised so g(0) = 0.
//
//   lockers (1, 3, 5)  creep to 28% of travel by f66, then the lobe over
//                      f66-88 while the creep itself fades to nothing, so
//                      g = 1 EXACTLY on "some" and the velocity is 0 when it
//                      gets there. Clamped at 1 afterwards: a locked column
//                      cannot grow again, which is the point of the lock.
//   shorts  (2, 4, 6)  the same creep, the same lobe stretched over f66-96
//                      (peak f81), easing out into a slower creep that runs to
//                      the last frame. It delivers the final 16% of the travel
//                      over f96-124, a row and a half, so g(123) < 1 and
//                      g(124) = 1: the last frame still has a row arriving.
//
// The resolved frame is unchanged — every column ends exactly where v3 left it,
// the lock still lands flush on f88 and the shorts still stop where they stop.
// ---------------------------------------------------------------------------
const GROW_LEAD = 6; // frames of anticipation before "of catch"
const SHORT_TAIL = 8; // where the short columns come off the lobe, after the lock
const FLAT_RAMP = 10; // the lock resolves over this many frames into "some"
// 0.28 and 0.16, not the 0.20 / 0.12 the first pass was cut at. A short column
// only has 130-190 world px of travel in it, so a share is worth about a third
// as much there as in a locker: at 0.20 the shorts moved 11.8 px over f0-30 and
// 7.8 px over f110-124 — under a dot row either end, and in the crops the top
// edge was only just different. At 0.28 / 0.16 the opening creep is 16.5 px
// (1.1 rows) by f30 and the tail delivers 20.8 px (1.4 rows), which is a row
// arriving at both ends and still leaves the lobe 15x the creep speed.
const CREEP_SHARE = 0.28; // of the travel, covered by the opening creep by f66
const TAIL_SHARE = 0.16; // of the travel, left for the short columns' f96-124 creep

// The two integrals the rise is made of: S(t) = t^2(3-2t) and sin^2(pi t),
// each from 0 to u. Both are 0 at u = 0 and 1/2 at u = 1.
const intS = (u: number) => u * u * u * (1 - u / 2);
const intBump = (u: number) => u / 2 - Math.sin(2 * Math.PI * u) / (4 * Math.PI);

// g(f): the fraction of a column's travel covered, monotone and C1 in f.
const rise = (f: number, f0: number, L: number, creep: number, tail: number, peak: number) => {
  const u = clamp01((f - f0) / L);
  return clamp01(
    creep * Math.min(f, f0) +
      L * (creep * u + (tail - creep) * intS(u) + peak * intBump(u)) +
      tail * Math.max(0, f - f0 - L),
  );
};

const CatchUpInSomeAreas: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = reached by the new model (ripe). Built once per
  // frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the read-wave ---------------------------------------------------------
  // f34 -> f66: three frames of anticipation before "model", and off the top of
  // the world by the frame the columns start growing into it.
  const waveF0 = beats.model - WAVE_LEAD;
  const waveF1 = beats.ofCatch - GROW_LEAD;
  const waveY = WAVE_Y0 + (WAVE_Y1 - WAVE_Y0) * smooth((frame - waveF0) / (waveF1 - waveF0));

  // -- the catch-up, per column ----------------------------------------------
  // One continuous rise per column from f0. The lobe runs f66 -> f88 for the
  // three that lock on "some" and f66 -> f96 for the three that do not, and the
  // shorts keep creeping on to the last frame. `top` is the nominal edge,
  // `flat` is how far the lock has resolved it. The rates are solved here from
  // the beats so the two columns' g land on 1 exactly where they should.
  const growF0 = beats.ofCatch - GROW_LEAD;
  const lockF = beats.some;
  const shortEnd = lockF + SHORT_TAIL;
  const lastF = DURATION - 1;
  const creep = CREEP_SHARE / growF0;
  const lockL = lockF - growF0;
  const lockPeak = (1 - CREEP_SHARE - 0.5 * lockL * creep) / (0.5 * lockL);
  const shortL = shortEnd - growF0;
  const shortTail = TAIL_SHARE / (lastF - shortEnd);
  const shortPeak =
    (1 - CREEP_SHARE - TAIL_SHARE - shortL * (creep + 0.5 * (shortTail - creep))) / (0.5 * shortL);
  const gLock = rise(frame, growF0, lockL, creep, 0, lockPeak);
  const gShort = rise(frame, growF0, shortL, creep, shortTail, shortPeak);
  const colTop: number[] = [];
  const colFlat: number[] = [];
  for (let c = 0; c < NCOL; c++) {
    const g = LOCKS[c] ? gLock : gShort;
    colTop.push(REST_TOP[c] + (FINAL_TOP[c] - REST_TOP[c]) * g);
    colFlat.push(LOCKS[c] ? smooth((frame - (lockF - FLAT_RAMP)) / FLAT_RAMP) : 0);
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the dots --------------------------------------------------------------
  // Existence, radius taper and straightening all come off ONE number: the
  // seat's signed distance, in its own column's rows, inside that column's
  // current top edge.
  const dots: { key: number; x: number; y: number; r: number; fill: string }[] = [];
  for (let i = 0; i < SEATS.length; i++) {
    const s = SEATS[i];
    const step = COL_STEP[s.c];
    const flat = colFlat[s.c];
    const edge = colTop[s.c] + (1 - flat) * wobble(s.x, s.c * 1.7 + 0.4) * step;
    const d = (s.y0 - edge) / step;
    const fe = feather(d, FEATHER_STEPS * (1 - flat) + 0.02);
    if (s.h >= fe) continue;
    // the floor always straightens the base; the lock straightens the top.
    const straighten = Math.max(s.base, flat * straightenPlateau(d));
    const y = s.yj + (s.y0 - s.yj) * straighten;
    const rv = s.r + (1 - s.r) * straighten;
    dots.push({
      key: i,
      x: s.x,
      y,
      r: dotRadius * rv * (0.7 + 0.3 * fe) * breath(frame, s.h),
      fill: tone(smooth((y - waveY) / WAVE_SOFT)),
    });
  }

  // -- the per-icon shadow ---------------------------------------------------
  // Screen px divided by the camera's k, so a ledge, the floor and a person
  // carry the same small lift at k 1.10 and at k 0.95.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the six areas */}
            {dots.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={dotUnread} />
            ))}

            <g style={{ filter: icon }}>
              {/* the floor: one rule under all six, the base every stack is
                  measured from */}
              <line
                x1={FLOOR_X0}
                y1={FLOOR_Y}
                x2={FLOOR_X1}
                y2={FLOOR_Y}
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={OP_READ}
              />

              {/* the ledges: one ink rule per area, at its own height */}
              {COL_X.map((x, c) => (
                <line
                  key={c}
                  x1={x - LEDGE_W / 2}
                  y1={LEDGE_Y[c]}
                  x2={x + LEDGE_W / 2}
                  y2={LEDGE_Y[c]}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ))}
            </g>
          </svg>

          {/* one person standing on each ledge */}
          {COL_X.map((x, c) => (
            <Img
              key={c}
              src={staticFile("person.png")}
              style={{
                position: "absolute",
                left: x - PERSON_SIZE / 2,
                top: LEDGE_Y[c] - STROKE / 2 - PERSON_SIZE * PERSON_FOOT,
                width: PERSON_SIZE,
                height: PERSON_SIZE,
                filter: `brightness(0) invert(1) ${icon}`,
                opacity: OP_READ,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default CatchUpInSomeAreas;
