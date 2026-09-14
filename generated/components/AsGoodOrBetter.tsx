import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_STIFF,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The kraft backdrop and the D1 mark. Imported, never redrawn.
import {
  D1Mark,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
} from "./d1Shared";
// THE WORLD. This piece IS the cut before it, ten seconds later, so every piece
// of geometry, every opacity, every stroke weight and the camera's resolved
// framing are IMPORTED from `IsItEvenWorthIt.tsx` and none of them is restated
// here. f0 of this piece is that piece's last frame.
import {
  AMBIENT,
  CLICK_HALF,
  CLICK_HALF_DUR,
  CLICK_INK,
  CY_FINAL,
  CONTENT_FINAL,
  DEPTH_DEEP,
  DEPTH_SETTLED,
  DOT_R,
  EASE_LAND,
  GROUND_OP,
  GROUND_W,
  GROUND_X0,
  GROUND_X1,
  GROUND_Y,
  K_FINAL,
  MARK_BOTTOM,
  MARK_X,
  MARK_Y,
  PACKET_DUR,
  PACKET_R,
  PACKET_STEP,
  ROW_N,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  WORLD_H,
  WORLD_W,
  originX,
  rowX,
} from "./IsItEvenWorthIt";

export const FPS = 24;
// Dan Sundheim (D1 Capital), on the short book after the year off:
// "As it turns out, if you look at our short alpha since that time, our short
// alpha has been as good or better."
//
// SRT span 0:43.259 -> 0:49.359 at 24fps.
// round((49.359 - 43.259) * 24) = round(6.100 * 24) = round(146.4) = 146
// frames of speech, plus a 16 frame tail so the resolved state holds = 162.
export const DURATION = 162;

// ---------------------------------------------------------------------------
// "As good or better" — the payoff cut of the clip.
//
// Orange Dwarkesh style on kraft: opaque 1080x1920 cutaway at 24fps, ink
// #FFFFFF, two tones of one amber (ACCENT_DEEP at rest, ACCENT lit), solid
// dots, one stroke weight, one landing ease, `iconShadow(k)` on every mark and
// line-structure, `Vignette` last.
//
// THE WORLD IS THE CUT BEFORE IT, AND IT IS IMPORTED, NOT RESTATED.
// `IsItEvenWorthIt.tsx` resolves on: the ground line at GROUND_Y (5 px at
// GROUND_OP, lifted because something is measured against it), the D1 mark at
// (MARK_X, MARK_Y), and a row of ROW_N solid dots on `rowX` pressed only
// DEPTH_SETTLED under the line in the DEEP tone, each hanging from a
// THREAD_IDLE thread that leaves the mark's bottom at `originX(j)` and ends on
// the dot's top. The old CONCENTRATED short was pressed DEPTH_DEEP under the
// line — that depth is the thing this piece measures against. f0 opens on that
// piece's K_FINAL / CY_FINAL, so a viewer sees the same world ten seconds on.
//
// THE PICTURE. The thin shallow row turns out to be as deep as the old bet, and
// then deeper. Comparison is DEPTH AGAINST A SHARED FLOOR — never a chart — and
// the number is read off the picture.
//
// Word onsets, from composition start (= 43.259):
//   f0 as · f8 it · f11 turns · f15 out · f27 if · f33 you · f36 look · f43 at
//   f48 our · f54 short · f60 alpha · f66 since · f74 that · f89 time
//   f98 our · f100 short · f105 alpha · f110 has · f116 been · f120 as
//   f126 good · f131 or · f134 better (speech ends f146) · tail to f162
//
// THE SIX GESTURES, one per word, and nothing else.
//
//   1. THE THREADS WAKE                      — "as it TURNS OUT"     f0-f50
//      f0 is the inherited resolved frame, exactly: same geometry, same tone,
//      same camera. At f11 ("turns") the ROW_N idle threads go live over one
//      6-frame ramp, THREAD_IDLE -> THREAD_LIVE, and the D1 mark's own amber
//      dot ticks to the half-step for CLICK_INK frames: D1 is looking. THE
//      CAMERA pushes from f4 toward the LEFT END of the row — k K_FINAL -> 1.5,
//      cx MARK_X -> CX_LEFT, content centre CONTENT_FINAL -> C_WAVE, warp 0.72,
//      keys f4-f38 so the damper has it landed by f50 — framing where the wave
//      will start. Nothing else moves.
//
//   2. THE FIRST DOT GOES DEEP               — "our SHORT ALPHA"    f52-f66
//      The left-most dot (i 0) is pressed DEPTH_SETTLED -> DEPTH_DEEP and goes
//      deep -> ripe with the move; its thread lengthens with it. Keys f52-f64
//      (the press profile's soft start means the eye sees it leave on "short"
//      at f54), the house landing ease on the arrival, ink click-bright for
//      CLICK_INK frames. NOTHING ELSE MOVES, and the camera has been dead still
//      since f50 and stays still to f66 — the held breath.
//
//   3. THE WAVE                              — "SINCE THAT TIME"    f66-f127
//      The big motion, one continuous wave left -> right: dot i (1..24) starts
//      its press at f66 + (i-1) * WAVE_STEP, hashed +-1 frame so the wave
//      breathes, each press WAVE_DUR frames on the same profile, going deep ->
//      ripe over the press. Time passing, read along the row, every dot ending
//      as deep as the old bet. THE CAMERA TRACKS THE WAVEFRONT: one continuous
//      eased pan, cx 350 -> 750 at k 1.5 over keys f66-f106, warp 1.0, no
//      stalls — so the line of lit dots pours in from the left of frame and the
//      front never leaves the middle of it (measured at screen x 285 on f66,
//      512 on f90, 711 on f106). Measured off the damped camera table below:
//      the pan peaks at 21.9 screen px/frame and the fastest dot ANYWHERE in
//      the piece at 38.6 — inside the 45 px/frame close-up cap.
//
//   4. PULL BACK AND RE-CENTRE               — "ALPHA has been"     f106-f130
//      As the wave finishes at the right end the camera pulls back and
//      re-centres: k 1.5 -> 1.1, cx -> MARK_X, content centre -> C_WIDE, warp
//      0.72, keys f106-f122, landed by f130 — the whole ripe row in frame for
//      the comparison, with 91 px of margin either side of it.
//      Measured at the resolve: row screen x 91-989, mark top 464, ground 886,
//      rule 1128, the row past it 1182 — all inside y 200-1450.
//
//   5. THE REFERENCE RULE                    — "as GOOD"            f118-f130
//      A dashed ink line at y = GROUND_Y + DEPTH_DEEP — the depth of the old
//      concentrated short, the thing being measured against — draws in from the
//      row's first dot to its last in ONE stroke, f118-f130, at GROUND_OP,
//      THREAD_W, through the dots' centres, because depth in this world is
//      measured centre-to-line — and RULE_OVER past the end dot at each end, so
//      it has two visible ends on the one frame where the row is sitting on top
//      of it. The row is exactly on it. No click. This is the comparison and the
//      whole read of "as good".
//
//   6. ONE STEP PAST IT                      — "or BETTER"          f134-f144
//      One group move: every dot presses DEPTH_DEEP -> DEPTH_DEEP + BETTER_STEP,
//      past the rule, together — 0-2.5 frame hash, the house landing ease neat,
//      first arrivals f140 — click-bright across the row. A dense front takes
//      the half-step CLICK_HALF for CLICK_HALF_DUR (MEMORY: full ink at five
//      arrivals a frame lays a pale band through the mass). The threads follow.
//      The camera rides the press down ~12 screen px, warp 0.72, keys f133-f140,
//      settled by f146.
//
//   TAIL, f140-f162. Ripe row below the rule, live threads, the mark. The only
//   motion is one packet at a time travelling UP a thread to the mark at the
//   shared AMBIENT ceiling, as an INK bead (an accent bead at 0.38 on a live
//   accent thread is invisible, and ink is what every travelling head in this
//   set is) — the return coming home — one launch per eight
//   frames across the whole set. Held resolved; never fades out.
//
// ambient: the traffic this piece INHERITS. Cut 2's tail runs one packet at a
// time DOWN an idle thread; those keep running until the threads wake, and then
// the traffic reverses and comes back up them in the tail. Plus `breath` on
// every dot, `sway` on the camera, and the kraft sheet's own parallax and
// drift. Not gestures; that is what this world is.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot that has been pressed
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
  markSize: z.number(),
  beats: z.object({
    as: z.number(), // "as"          — f0, the inherited resolved frame
    it: z.number(), // "it"
    turns: z.number(), // "turns"    — the threads wake, the mark's dot ticks
    out: z.number(), // "out"
    ifWord: z.number(), // "if"
    you: z.number(), // "you"
    look: z.number(), // "look"
    at: z.number(), // "at"
    our: z.number(), // "our"
    short: z.number(), // "short"    — the first dot leaves
    alpha: z.number(), // "alpha"    — and lands
    since: z.number(), // "since"    — THE WAVE starts, the camera tracks it
    that: z.number(), // "that"
    time: z.number(), // "time"
    ourTwo: z.number(), // "our"
    shortTwo: z.number(), // "short"
    alphaTwo: z.number(), // "alpha" — the pull-back starts
    has: z.number(), // "has"
    been: z.number(), // "been"
    asTwo: z.number(), // "as"       — the rule is drawing
    good: z.number(), // "good"      — the row is exactly on it
    or: z.number(), // "or"
    better: z.number(), // "better"  — one group move past the rule
    end: z.number(), // speech ends; tail to 162
  }),
});

export type Props = z.infer<typeof schema>;

// -- the world beyond what is inherited -------------------------------------
// Only two numbers in this piece are new geometry. Everything else is imported.
export const RULE_Y = GROUND_Y + DEPTH_DEEP; // the old concentrated short's depth
export const RULE_DASH = "10 8";
// It runs a little PAST the end dots at each end. Drawn dot-to-dot it is hidden
// behind the row at exactly the frame it has to be read on ("as good", where
// the row is sitting on it), and only the dashes between the dots survive; the
// overshoot gives it two visible ends, so it reads as a line the row is on
// rather than as dashes between beads.
export const RULE_OVER = 30;
export const BETTER_STEP = 40; // "or better" — one step past the rule

export const RULE_X0 = rowX(0) - RULE_OVER;
export const RULE_X1 = rowX(ROW_N - 1) + RULE_OVER;
export const ROW_X0 = rowX(0); // 132
export const ROW_X1 = rowX(ROW_N - 1); // 948
export const MARK_TOP = MARK_Y - MARK_SIZE / 2;
export const PRESS_SPAN = DEPTH_DEEP - DEPTH_SETTLED; // 198 world px

// ---------------------------------------------------------------------------
// THE PRESS PROFILE. The house landing ease (EASE_LAND, imported) has a slope
// at its own START of 4.5x the average — on a PRESS_SPAN press at k 1.5 that is
// ~95 screen px/frame, twice the close-up cap, and the wave would strobe. So a
// press is written the way the pour's flights are in `LedToTheDesperation`: a
// short acceleration out of rest, a cruise, and then THE HOUSE LANDING EASE
// over the last of the distance — one ease, on the arrival, which is where it
// is read. The three pieces are solved for continuous velocity (PRESS_V falls
// out of the solve, and the landing's share of the distance falls out with it),
// so the eye reads one move with the house overshoot on the end of it and the
// peak speed is PRESS_V x the average rather than 4.5x.
//
// The short "or better" step is close enough to take EASE_LAND neat:
// 4.5 x 40/6 x 1.1 = 33 screen px/frame, inside the cap.
// ---------------------------------------------------------------------------
export const BACK_S = 1.5; // EASE_LAND is Easing.out(Easing.back(BACK_S))
export const BACK_SLOPE = BACK_S + 3; // its slope at u = 0
export const PRESS_ACC = 0.15; // the share of the press spent leaving rest
export const PRESS_LAND = 0.3; // the share of it spent on the house ease
export const PRESS_V = 1 / (1 - PRESS_ACC / 2 - PRESS_LAND * (1 - 1 / BACK_SLOPE));
export const PRESS_CRUISE_END = 1 - PRESS_LAND;
export const PRESS_BASE = PRESS_V * (PRESS_ACC / 2 + (PRESS_CRUISE_END - PRESS_ACC));
export const pressProfile = (u: number) => {
  const t = clamp01(u);
  if (t < PRESS_ACC) return (PRESS_V * t * t) / (2 * PRESS_ACC);
  if (t < PRESS_CRUISE_END) return PRESS_V * (PRESS_ACC / 2 + (t - PRESS_ACC));
  return PRESS_BASE + (1 - PRESS_BASE) * EASE_LAND((t - PRESS_CRUISE_END) / PRESS_LAND);
};

// ---------------------------------------------------------------------------
// THE SCHEDULE. Every frame here is a word's frame or is solved from one.
// ---------------------------------------------------------------------------
export const WAKE_DUR = 6; // THREAD_IDLE -> WAKE_TO, on "turns"
export const WAKE_TO = THREAD_LIVE;

export const PRESS0_F0 = 52; // two frames of anticipation on "short" (f54)
export const PRESS0_DUR = 12;
export const PRESS0_LAND = PRESS0_F0 + PRESS0_DUR; // f64

export const WAVE_F0 = 66; // "since"
export const WAVE_STEP = 1.95; // frames between two dots leaving
export const WAVE_DUR = 16; // one press, on the profile above
export const WAVE_JIT = 1; // +-1 frame per dot, so the wave breathes
// dot 24 leaves at f110.85 and is home by f127, just under the rule's last inch

export const RULE_F0 = 118; // draws under "as" (f120) and reads on "good" (f126)
export const RULE_F1 = 130;

export const BETTER_F0 = 134; // "better"
export const BETTER_HASH = 2.5;
export const BETTER_DUR = 6; // first arrivals f140, last f144

export const TAIL_P0 = 140; // the return coming home
export const TAIL_STEP = 8;

export const pressStart = (i: number) =>
  i === 0 ? PRESS0_F0 : WAVE_F0 + (i - 1) * WAVE_STEP + (hash(i, 31) - 0.5) * 2 * WAVE_JIT;
export const pressDur = (i: number) => (i === 0 ? PRESS0_DUR : WAVE_DUR);
export const betterStart = (i: number) => BETTER_F0 + hash(i, 43) * BETTER_HASH;

// A dot's depth under the ground line, and how lit it is, at any frame. Both
// are read off the same press, so they cannot drift apart if it is retimed.
export const pressAt = (i: number, f: number) => clamp01((f - pressStart(i)) / pressDur(i));
export const depthAt = (i: number, f: number) => {
  const d = DEPTH_SETTLED + PRESS_SPAN * pressProfile(pressAt(i, f));
  const w = clamp01((f - betterStart(i)) / BETTER_DUR);
  return d + BETTER_STEP * (w <= 0 ? 0 : EASE_LAND(w));
};
export const toneAt = (i: number, f: number) => smoothstep(pressAt(i, f));

// ---------------------------------------------------------------------------
// THE CAMERA. Four moves, one track, all through the shared damper, and every
// one of them follows a gesture: the lens goes where the thing that is about to
// happen is, arrives ahead of the word, and then holds. Between moves nothing
// is on the camera but `sway`.
//
// This is the first cut of the set that PANS, so the track carries cx as well
// as cy and k and the damper runs all three on the shared CAM_STIFF / CAM_DAMP.
// `camMove` already writes an eased key per frame and takes cy off the EASED k;
// cx is put on the same eased curve, so a pan and a zoom inside one segment
// cannot drift apart. `KraftBackground` gets cx and cxRest, so the lateral
// travel reads as depth instead of a sliding sheet.
//
// The two framings are SOLVED rather than typed: each is the MIDPOINT of what
// has to be in frame, and `CAM_LIFT / k` puts a content centre at screen y 835
// under the captions.
//   C_WAVE  mark top .. the row at DEPTH_DEEP, at k 1.5 — mark top at screen
//           375, the ground at 951, the rule's depth at 1281
//   C_WIDE  mark top .. the row at DEPTH_DEEP + BETTER_STEP, at k 1.1 — mark top
//           at 464, the ground at 886, the rule at 1128, the row past it at
//           1182, and the row's 816 px span leaves 91 px of margin either side
//
// KEY WINDOWS end BEFORE their landing on purpose: the damper lags its target
// by ~6 frames, so keys that run to the landing frame leave the camera visibly
// moving under the word. M1 is the exception and is meant to be — it is
// FOLLOWING the wavefront rather than arriving ahead of it.
// ---------------------------------------------------------------------------
export const K_WAVE = 1.5;
export const K_WIDE = 1.1;
// The close-up's two lateral ends. CX_LEFT is NOT the first dot: at k 1.5 the
// frame is 720 world px wide and the first dot and the mark are 408 apart, so
// centring on the dot alone hangs the mark half off the right edge and leaves
// the left third of the frame empty — a side instrument and a parked edge, both
// of which this set does not do. 350 is the midpoint of the two with a little
// lead to the left, so the first dot sits at screen x 213 and the mark stays
// whole at 744-906, and the mark is still in frame at the far end of the pan.
export const CX_LEFT = 350;
export const CX_RIGHT = 750; // where the pan ends, as the wave reaches the end
export const RIDE_SCREEN = 12; // "better": the camera rides the press down

export const C_WAVE = (MARK_TOP + GROUND_Y + DEPTH_DEEP + DOT_R) / 2;
export const C_WIDE = (MARK_TOP + GROUND_Y + DEPTH_DEEP + BETTER_STEP + DOT_R) / 2;
export const C_RIDE = C_WIDE + RIDE_SCREEN / K_WIDE;

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M0 "as it turns out" — push in on the LEFT END, where the wave will start
  {
    f0: 4,
    f1: 38,
    k0: K_FINAL,
    k1: K_WAVE,
    c0: CONTENT_FINAL,
    c1: C_WAVE,
    x0: MARK_X,
    x1: CX_LEFT,
    warp: 0.72,
  },
  // M1 "since that time" — TRACK THE WAVEFRONT. One continuous eased pan, no
  // stalls, still moving under the words because it is following the front.
  {
    f0: 66,
    f1: 106,
    k0: K_WAVE,
    k1: K_WAVE,
    c0: C_WAVE,
    c1: C_WAVE,
    x0: CX_LEFT,
    x1: CX_RIGHT,
    warp: 1,
  },
  // M2 "alpha has been" — pull back and re-centre for the comparison
  {
    f0: 106,
    f1: 122,
    k0: K_WAVE,
    k1: K_WIDE,
    c0: C_WAVE,
    c1: C_WIDE,
    x0: CX_RIGHT,
    x1: MARK_X,
    warp: 0.72,
  },
  // M3 "better" — ride the group press down, and settle
  {
    f0: 133,
    f1: 140,
    k0: K_WIDE,
    k1: K_WIDE,
    c0: C_WIDE,
    c1: C_RIDE,
    x0: MARK_X,
    x1: MARK_X,
    warp: 0.72,
  },
];

// `camMove` does not expose the ease it uses, and a segment with a constant k
// has no k to read it back off, so the pan carries its own copy. Same function
// and same warp — this is `camEase` from `fieldShared`.
const camEaseLocal = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));

// One track out of the four moves. `camMove` emits a key per frame inside a
// move; a gap between two moves gets ONE key holding the last value, which is
// what makes a hold a hold rather than a slow ramp into the next key. f0 is
// pinned to the inherited resolved framing, so the world does not move at all
// under "as it".
const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_FINAL];
  const CY: number[] = [CY_FINAL];
  const CX: number[] = [MARK_X];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    const span = s.f1 - s.f0;
    m.F.forEach((f, i) => {
      // M1 hands straight over to M2 on the same frame — the pan does not stop
      // and then start again — so the shared key is written once, by the move
      // that is taking over.
      if (f === F[F.length - 1]) {
        F.pop();
        K.pop();
        CY.pop();
        CX.pop();
      }
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(s.x0 + (s.x1 - s.x0) * camEaseLocal(i / span, s.warp));
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();

export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

// The damped camera at every integer frame, run once. Same loop and same
// constants as `runCamera`, with cx on it as well — so this table IS the
// camera, and the speed figures in the header were measured off it.
export const CAM_AT = (() => {
  const kA = new Float64Array(DURATION + 1);
  const cyA = new Float64Array(DURATION + 1);
  const cxA = new Float64Array(DURATION + 1);
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let cx = CAM_CX[0];
  let vy = 0;
  let vk = 0;
  let vx = 0;
  kA[0] = k;
  cyA[0] = cy;
  cxA[0] = cx;
  for (let f = 1; f <= DURATION; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    const txr = interpolate(f, CAM_F, CAM_CX, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (txr - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    kA[f] = k;
    cyA[f] = cy;
    cxA[f] = cx;
  }
  return { k: kA, cy: cyA, cx: cxA };
})();

export const camAt = (f: number) => {
  const i = Math.max(0, Math.min(DURATION, Math.round(f)));
  return { k: CAM_AT.k[i], cy: CAM_AT.cy[i], cx: CAM_AT.cx[i] };
};

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_R,
  markSize: MARK_SIZE,
  beats: {
    as: 0,
    it: 8,
    turns: 11,
    out: 15,
    ifWord: 27,
    you: 33,
    look: 36,
    at: 43,
    our: 48,
    short: 54,
    alpha: 60,
    since: 66,
    that: 74,
    time: 89,
    ourTwo: 98,
    shortTwo: 100,
    alphaTwo: 105,
    has: 110,
    been: 116,
    asTwo: 120,
    good: 126,
    or: 131,
    better: 134,
    end: 146,
  },
});

const AsGoodOrBetter: React.FC<Props> = ({
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
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = pressed (ripe). Built once per frame.
  const tone = makeTone(accentDeep, accent);
  // the mark's own amber dot, ticking to the half-step and back
  const strainTone = makeTone(accent, CLICK_HALF);

  // -- camera ----------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- gesture 1: the threads wake, and the mark's dot ticks -----------------
  const live = interpolate(frame, [beats.turns, beats.turns + WAKE_DUR], [THREAD_IDLE, WAKE_TO], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const tick = frame >= beats.turns && frame < beats.turns + CLICK_INK ? 1 : 0;

  // -- the row, this frame ---------------------------------------------------
  const dots: { i: number; x: number; y: number; r: number; fill: string }[] = [];
  for (let i = 0; i < ROW_N; i++) {
    // one click-bright per arrival: ink for the single dot of gesture 2, and
    // the half-step for the dense front of gesture 6
    const bLand = betterStart(i) + BETTER_DUR;
    let fill = tone(toneAt(i, frame));
    if (i === 0 && frame >= PRESS0_LAND && frame < PRESS0_LAND + CLICK_INK) fill = ink;
    else if (frame >= bLand && frame < bLand + CLICK_HALF_DUR) fill = CLICK_HALF;
    dots.push({
      i,
      x: rowX(i),
      y: GROUND_Y + depthAt(i, frame),
      r: dotRadius * breath(frame, hash(i, 9)),
      fill,
    });
  }

  // -- gesture 5: the reference rule ----------------------------------------
  const ruleG = smoothstep(clamp01((frame - RULE_F0) / (RULE_F1 - RULE_F0)));
  const ruleX1 = RULE_X0 + (RULE_X1 - RULE_X0) * ruleG;

  // -- the ambient traffic ---------------------------------------------------
  // Inherited: cut 2's tail runs one packet at a time DOWN an idle thread, and
  // those keep running until the threads wake. Then the traffic reverses and
  // the tail brings it back UP to the mark. Same launcher, same ceiling, same
  // radius; only the direction and the clock change.
  const packets: { key: string; x: number; y: number }[] = [];
  const fly = (n: number, t0: number, up: boolean) => {
    if (frame < t0 || frame >= t0 + PACKET_DUR) return;
    const i = Math.floor(hash(n, up ? 17 : 5) * ROW_N) % ROW_N;
    const d = dots[i];
    const u = (frame - t0) / PACKET_DUR;
    const a = up ? { x: d.x, y: d.y - d.r } : { x: originX(i), y: MARK_BOTTOM };
    const b = up ? { x: originX(i), y: MARK_BOTTOM } : { x: d.x, y: d.y - d.r };
    packets.push({
      key: `${up ? "u" : "d"}${n}`,
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
    });
  };
  for (let n = 0; ; n++) {
    const t0 = -4 + n * PACKET_STEP;
    if (t0 >= beats.turns) break;
    fly(n, t0, false);
  }
  for (let n = 0; ; n++) {
    const t0 = TAIL_P0 + n * TAIL_STEP;
    if (t0 >= DURATION) break;
    fly(n, t0, true);
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
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
            {/* the market's surface, and the depth the old bet reached */}
            <g style={{ filter: icon }}>
              <line
                x1={GROUND_X0}
                y1={GROUND_Y}
                x2={GROUND_X1}
                y2={GROUND_Y}
                stroke={ink}
                strokeWidth={GROUND_W}
                strokeLinecap="round"
                opacity={GROUND_OP}
              />
              {ruleG > 0.002 ? (
                <line
                  x1={RULE_X0}
                  y1={RULE_Y}
                  x2={ruleX1}
                  y2={RULE_Y}
                  stroke={ink}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                  strokeDasharray={RULE_DASH}
                  opacity={GROUND_OP}
                />
              ) : null}
            </g>

            {/* the threads: every dot hangs from the mark, idle until it wakes */}
            <g style={{ filter: icon }}>
              {dots.map((d) => (
                <line
                  key={`t${d.i}`}
                  x1={originX(d.i)}
                  y1={MARK_BOTTOM}
                  x2={d.x}
                  y2={d.y - d.r}
                  stroke={accent}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                  opacity={live}
                />
              ))}
            </g>

            {/* the ambient traffic, at the shared ceiling */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={ink} opacity={AMBIENT} />
            ))}

            {/* the stocks, pressed under the line */}
            {dots.map((d) => (
              <circle key={d.i} cx={d.x} cy={d.y} r={d.r} fill={d.fill} />
            ))}

            {/* D1, looking */}
            <D1Mark
              x={MARK_X}
              y={MARK_Y}
              size={markSize}
              k={k}
              opacity={OP_READ}
              dotColor={strainTone(tick)}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AsGoodOrBetter;
