import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  camMove,
  clamp01,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
} from "./d1Shared";
import {
  CONTENT_CY_FINAL,
  CONTINUE_FROM,
  CX_FINAL,
  CY_FINAL,
  CoinDefs,
  DOLLAR_K,
  FIELD_COINS,
  FieldCoin,
  K_FINAL,
  LIT_FINAL,
  MARK_POS,
  MARK_SIZE_RAMP,
  N_FIELD,
  ORDER_WINDOW,
  RampMark,
  SEED_POS,
  THREAD_FROM,
  THREAD_LIVE,
  THREAD_W,
  coinBreath,
  orderRadius,
  strain,
} from "./rampShared";
// Cut 1's opening camera, imported rather than restated — see "CUT 1'S
// BACKGROUND REST VALUES" below. Importing across sibling cuts is the house
// pattern (the D1 set imports `K_FINAL` the same way).
import {
  CAMX_X as CUT1_CAMX_X,
  CAM_CY as CUT1_CAM_CY,
  C_OPEN_X0,
  C_OPEN_Y0,
  K_OPEN,
} from "./TwoPercentOfTransactions";

// ---------------------------------------------------------------------------
// CUT 2 — "NotOnUs". Cheeky Pint style on kraft, opaque, 24 fps, 1080x1920.
//
// THE LINE (Eric Glyman, Ramp, on Cheeky Pint):
//   "and yet that's a really fancy way of saying 98% of spend is not on us."
//
// SRT span 11.580 -> 16.339. round((16.339 - 11.580) * 24) = round(4.759 * 24)
// = round(114.2) = 114 frames of speech, plus a 16-frame tail so the resolved
// field holds = 130.
//
// WORD ONSETS (frames from 11.580)
//   f0 and yet · f10 that's · f14 a · f17 really · f23 fancy · f31 way ·
//   f36 of · f40 saying · f48 98% (held to f74) · f74 of · f79 spend ·
//   f84 is · f89 not · f94 on · f103 us (to f114) · speech ends f114 ·
//   tail to f130.
//
// THE CLIP'S ONE RULE. A transaction is a coin, the United States is a field of
// coins, and AMBER IS WHAT RAMP HAS TOUCHED AND NOTHING ELSE. Cut 1 put 2% of
// the field amber. This cut releases the SAME front through everything else, in
// WHITE. No numeral, no label, no bar, no second colour, no fade.
//
// THE JOIN. f0 IS cut 1's resolved frame. The camera opens at
// (CX_FINAL, CY_FINAL, K_FINAL) with the damper at rest — cut 1 is dead still
// from f151 on, so there is no velocity to inherit — the field stands with
// LIT_FINAL amber coins at New York, the mark hangs off the Maine coast with
// its live thread, and `sway` / `coinBreath` / `strain` / the kraft's drift and
// parallax all run on `frame + CONTINUE_FROM` against cut 1's own rest values,
// so nothing in the world restarts. The SVG tree at f0 is cut 1's tree element
// for element (white, amber, thread, mark; the two "passed" groups are empty).
// Proven with a difference blend of cut 1's f177 against this f0.
//
// ---------------------------------------------------------------------------
// THE ONE MOTION, WITH THE WORDS AS INFLECTIONS
//
//   1. THE CLAIM, LOOKED AT                                      f0 -> f46
//      The camera creeps IN off the resolved wide onto the amber patch — k
//      K_FINAL -> K_TIGHT, centre (CX_FINAL, CONTENT_CY_FINAL) -> SEED_POS,
//      keys f0-f38 on warp 0.8, damper landed f44 — so "a really fancy way" is
//      said over a frame the amber patch is the subject of. Under it the
//      patch's OUTER RING strains harder and harder at the ring cut 1 stopped
//      it on: `strain`'s amplitude rises x1.0 -> x1.6 across the phase. That is
//      the whole of the phase; nothing else happens.
//
//   2. THE RELEASE                                              f48 -> f100
//      On "98%" the front is let go. The SAME light-up order continues: the lit
//      count n(f) runs LIT_FINAL -> N_FIELD on ONE curve, camEase(u, REL_WARP),
//      so it leaves fast and eases into the far coast. Every coin the front
//      reaches goes "passed", never amber: it LIFTS — scale 1 -> 1.45 -> 1.10
//      over LIFT_DUR frames on a zero-sloped bump, under the one group shadow —
//      and stays at 1.10 in full white. Because the order is cut 1's, the wave
//      starts at the amber patch's EDGE and runs outward, so the picture is
//      literally "everything except the amber".
//
//   3. THE FRAME IS PUSHED OPEN                                 f50 -> f96
//      Two frames after the release, one move back out: k K_TIGHT -> K_FINAL,
//      centre -> (CX_FINAL, CONTENT_CY_FINAL), keys f50-f90 on warp 0.75,
//      damper landed f96 — seven frames ahead of "us" (f103). The camera never
//      leads the wave; it is pushed open by it and lands on the whole map as
//      the front reaches the Pacific (f100).
//
//   4. "NOT ON US", AND THE HOLD                               f100 -> f130
//      The wave is spent. The map stands lifted-white with the small amber
//      patch untouched, the thread live, every coin breathing, the camera on
//      `sway`. The one thing that happens on "us" is the amber ring's strain
//      relaxing to zero across f100-f110: it has nothing left to push against.
//
// THE FRAME TABLE
//   f0             cut 1's resolved frame, to the pixel; the creep leaves
//   f32            k crosses DOLLAR_K 1.6 rising (the "$" knockout is held off
//                  for the whole cut — see defsK)
//   f38            the creep's last key
//   f44            the creep is landed: k 1.6973, 0.16% of K_TIGHT
//   f44 -> f50     the one held breath, 6 frames: the camera is the only still
//                  thing; the strain, the breath, the kraft's drift run under it
//   f46            the strain's rise is spent at x1.6
//   f48            "98%" — THE RELEASE. n(f) leaves LIT_FINAL (2% of the field)
//   f48.20         the first coin past the amber is reached
//   f50            the camera reacts, two frames late, and is pushed open
//   f54            the front's fastest: 38.5 screen px/f radially, 34.1 as a
//                  point on screen with the camera opening against it (cap 45)
//   f60            k crosses 1.6 falling
//   f74 "of"       62% of the field is passed
//   f79 "spend"    74%
//   f84 "is"       84%
//   f89 "not"      92%
//   f90            the open's last key
//   f94 "on"       98%
//   f96            the open is landed: k 0.9601, 0.22% of K_FINAL; cx 556.93 of
//                  556, cy 918.61 of 918.93
//   f100           the front reaches the Pacific; n = N_FIELD, 100%. Solved
//                  off the field, not asserted: the 40 westernmost coins
//                  (x 104.8-127.7, MAP.X0 100) are reached f94.70 -> f100.00,
//                  and the last coin of the whole field is one of them — the
//                  wave finishes ON the coast, not on an inland straggler.
//   f100 -> f110   the amber ring's strain relaxes to zero, under "us"
//   f114 -> f130   the tail: breath, sway, the live thread. Nothing fades —
//                  f120 against f121 still moves 11% of the frame.
//
// MEASURED (half-res preview, 130 frames). RE-MEASURED AT THE HARMONY PASS,
// against rampShared's revised light-up order — the director took ORDER_JITTER
// 0.8 -> 0.35 and then re-keyed the order off DISTANCE from the seed instead of
// BFS `hop`. Nothing in this file hard-coded the old order, but every value
// solved off it was swept again and the numbers below are the new render's.
//   SPEEDS   front as a screen point 33.90 px/f at f54 · front radius 39.84 at
//            f52 · a lifting coin's rim 1.42 at f50 · the camera's worst
//            on-screen point 32.46 at f18. House cap 45.
//            The distance-keyed order also made the front's own statistic
//            honest: `orderRadius`'s rattle (mean |raw - 5-frame mean|) fell
//            3.35 -> 0.65 px/f on a mean speed of 19.12, and the speed profile
//            is now monotone — 39.8 at f52 down through 32.0, 22.5, 26.5,
//            23.1, 19.2, 18.6, 16.7, 14.0, 11.2, 8.8 to 5.9 at f96 — where the
//            hop-keyed order had it jumping 20.5 -> 1.6 -> 20.6 on neighbouring
//            samples.
//            Steps > 15% between adjacent frames, re-measured at h = 1/4: two
//            gate artefacts (a map corner entering or leaving the sampled set
//            at f19 and f71, 64% -> 0% and 63% -> 2%); the release's own
//            acceleration at f50-f54 (15.5 -> 26.8 -> 33.9 px/f), which does
//            NOT shrink with h because it is not a discontinuity but the
//            authored dam-break — `camEase(u, 0.8)` has zero slope and a
//            continuous second derivative at both ends, so the ramp is smooth
//            and simply steep; and a handful of flags under 5 px/f in the long
//            tail of the run, which are the 20-coin window's remaining rattle.
//   THE JOIN cut 1 f177 against this f0, as PNG stills at half res so no codec
//            sits between them, each number beside cut 1's OWN f176 -> f177:
//              whole frame  mean 0.6718 against 0.6855
//              the field    mean 3.3942 against 3.4827
//              the kraft    mean 0.0298 against 0.0289, max 1 count in both
//              area > 1 ct  4.79% against 5.15%   (> 8 counts 2.56% / 2.60%)
//            — the join is TIGHTER than cut 1's own frame-to-frame step on
//            every measure. Max 57 against the control's 50, on one amber rim:
//            the one frame of `strain` phase the join is allowed. (The same
//            pair through the h264 preview reads 1.33, which is the codec's
//            I-frame/P-frame difference, not the picture's.) The kraft numbers
//            are the proof that the imported `C_OPEN_X0` / `C_OPEN_Y0` are the
//            right reference: the sheet differs from cut 1's by no more than
//            one count anywhere in the frame.
//   LEGIBILITY  a passed coin against an untouched one, on the SAME
//            mid-continent crop at the SAME camera — f0 (all ink) against f110
//            (all passed), both k 0.958: mean 184.0 -> 205.5 (+11.7%), area
//            above 150 counts 66.4% -> 80.7% (+14.3 points). The wave band
//            against the field 90 world px ahead of it, due west of the seed:
//            +54.6 counts at f60, +53.8 at f64, +51.7 at f72, +47.0 at f80,
//            +50.0 at f88 — roughly triple the hop-keyed order's margin,
//            because a frame's slice of a distance-keyed order is an arc one
//            or two coins deep instead of a scatter three or four rings deep.
//            The lift's peak stays at 1.45 and its shadow as it is; nothing
//            needed raising.
//   THE TAIL f120 against f121 still moves 10.6% of the frame by more than a
//            count. Nothing is parked.
//
// DEVIATIONS from the cut brief, all forced by the brief's own rules
//   * REL_WARP IS 0.80, NOT 0.75. Measured on the field's own order statistics
//     (`orderRadius`, 2,441 coins, seed at New York): at warp 0.75 the front's
//     radius crosses 49.2 screen px a frame at f53.5, over the house's 45. 0.78
//     measures 45.1, 0.80 measures 43.1 — the first step with real margin. The
//     dam still breaks: a quarter of the country is passed twelve frames in.
//     RE-SWEPT at the harmony pass against the revised order (distance-keyed,
//     ORDER_JITTER 0.35): 0.70: 48.90 · 0.72: 45.65 · 0.75: 43.07 · 0.78:
//     40.48 · 0.80: 39.84 · 0.85: 35.64 · 1.00: 30.13. The whole ladder came
//     DOWN, and the brief's own 0.75 is now under the cap at 43.07 — so this
//     deviation is no longer forced. It is kept at 0.80 anyway: the director
//     has approved the motion as built, 0.80 carries 12% more margin on the
//     one head this cut has, and the dam still breaks (a quarter of the
//     country is passed twelve frames in). Going back to 0.75 is a change to
//     an approved motion and therefore the director's call, not the builder's.
//   * THE CAMERA LANDS ON CUT 1'S RESOLVED CENTRE, NOT (540, 835). The brief
//     types the map's centre; cut 1 solved the resolved frame against the whole
//     picture (the map PLUS the mark hanging off its right) and landed on
//     CX_FINAL 556 / CONTENT_CY_FINAL 788.4. Cut 2 opens on cut 1's frame and
//     must return to it, or the join at the next cut is a jump.
//   * THE "$" KNOCKOUT IS HELD OFF FOR THE WHOLE CUT (`defsK`). See below.
//   * K_TIGHT IS 1.7 AND THE AMBER FILLS A FIFTH OF THE FRAME, NOT A THIRD. The
//     brief asks for both; the field decides. The amber patch is 111.8 world px
//     across (49 coins on an 11 px hex pitch), so a third of a 1080 frame would
//     need k 3.22 — at which the front measures 86 screen px a frame at its
//     fastest even at warp 0.75, and 58 at warp 1.05. k 1.7 is the briefed
//     number and the only one the speed cap allows; the patch reads as the
//     subject at 190 screen px across, with the mark, the thread and the whole
//     eastern seaboard around it.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 130;

export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  andYet: 0,
  thats: 10,
  a: 14,
  really: 17,
  fancy: 23,
  way: 31,
  of1: 36,
  saying: 40,
  ninetyEight: 48, // THE RELEASE
  of2: 74,
  spend: 79,
  is: 84,
  not: 89,
  on: 94,
  us: 103, // the camera landed f96; the strain relaxes under this word
  end: 114,
} as const;

// ---------------------------------------------------------------------------
// THE RELEASE. One curve, one quantity: the lit count. n(F_REL) = LIT_FINAL
// (cut 1's 2%), n(F_COAST) = N_FIELD (every coin in the country). REL_WARP < 1
// puts the speed early — a dam breaking — and the smoothstep eases it into the
// far coast; the slope is zero at both ends for warp > 0.5, so the front never
// starts or stops with a step in speed.
// ---------------------------------------------------------------------------
export const F_REL = 48;
export const F_COAST = 100;
export const REL_WARP = 0.8;
export const SPEED_CAP = 45;
export const relFrac = (f: number) => camEase(clamp01((f - F_REL) / (F_COAST - F_REL)), REL_WARP);
export const litCount = (f: number) => LIT_FINAL + (N_FIELD - LIT_FINAL) * relFrac(f);

// The inverse, so a coin's reach frame is SOLVED rather than scanned:
// smoothstep(x) = t  =>  x = 1/2 - sin(asin(1 - 2t)/3), and u = x^(1/warp).
const smoothstepInv = (t: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(t)) / 3);
export const reachFrame = (order: number) => {
  const p = (order - LIT_FINAL + 1) / (N_FIELD - LIT_FINAL);
  if (p <= 0) return -1;
  if (p >= 1) return F_COAST;
  return F_REL + (F_COAST - F_REL) * Math.pow(smoothstepInv(p), 1 / REL_WARP);
};
/** Solved once: REACH[order] is the frame the front arrives at that coin. */
export const REACH: Float64Array = (() => {
  const a = new Float64Array(N_FIELD);
  for (let o = 0; o < N_FIELD; o++) a[o] = reachFrame(o);
  return a;
})();

/** The field's indices sorted by light-up order, so a frame's four states are
 *  four CONTIGUOUS SLICES of one array instead of a scan of 2,441 coins. */
export const BY_ORDER: number[] = (() => {
  const a = new Array<number>(N_FIELD);
  for (let i = 0; i < N_FIELD; i++) a[FIELD_COINS[i].order] = i;
  return a;
})();

// ---------------------------------------------------------------------------
// THE LIFT. What a coin does when the front arrives: 1 -> 1.45 -> LIFT_HOLD
// over LIFT_DUR frames, and then it stays lifted. Written as a settle ramp plus
// one cubic-cubic lobe (`64 w^3 (1-w)^3`) rather than as a back-out ease hung
// off a max(), so the scale is flat to SECOND order at both ends: no step in
// speed and no step in acceleration when a coin starts or finishes lifting,
// which at ~70 coins a frame is the difference between a rolling band and a
// fizz. Measured: peak 1.4512 at age 4.13, end exactly 1.10, |s'| < 1e-5 at
// both ends.
// ---------------------------------------------------------------------------
export const LIFT_DUR = 8;
export const LIFT_HOLD = 1.1;
export const LIFT_EXTRA = 0.4;
const lobe = (u: number) => 64 * u ** 3 * (1 - u) ** 3;
export const liftScale = (age: number) => {
  if (age <= 0) return 1;
  if (age >= LIFT_DUR) return LIFT_HOLD;
  const u = age / LIFT_DUR;
  return 1 + (LIFT_HOLD - 1) * smoothstep(u) + LIFT_EXTRA * lobe(u);
};

// ---------------------------------------------------------------------------
// THE STRAIN ON THE AMBER PATCH. Cut 1's ring, cut 1's weighting — the outer
// ORDER_WINDOW of the lit order leans outward along its own radial — carried
// forward so the join cannot show a change of rule. What is new is the GAIN: it
// rises x1 -> x1.6 across phase 1 (the front is pushing at the ring it was
// stopped on), holds through the release, and relaxes to zero across
// f100-f110, which is the only thing that happens on "us".
// ---------------------------------------------------------------------------
export const STRAIN_RISE_F1 = 46;
export const STRAIN_GAIN = 1.6;
export const STRAIN_RELAX_F0 = 100;
export const STRAIN_RELAX_F1 = 110;
export const strainGain = (f: number) =>
  (1 + (STRAIN_GAIN - 1) * smoothstep(f / STRAIN_RISE_F1)) *
  (1 - smoothstep((f - STRAIN_RELAX_F0) / (STRAIN_RELAX_F1 - STRAIN_RELAX_F0)));
/** Cut 1's ring weight, frozen at the front it stopped on. */
export const RING_W: Float64Array = (() => {
  const a = new Float64Array(N_FIELD);
  for (let o = 0; o < LIT_FINAL; o++) a[o] = smoothstep((o - (LIT_FINAL - ORDER_WINDOW)) / ORDER_WINDOW);
  return a;
})();
/** The outward unit radial of each amber coin, precomputed. */
export const RADIAL: { x: number; y: number }[] = BY_ORDER.slice(0, LIT_FINAL).map((i) => {
  const dx = FIELD_COINS[i].x - SEED_POS.x;
  const dy = FIELD_COINS[i].y - SEED_POS.y;
  const r = Math.hypot(dx, dy) || 1;
  return { x: dx / r, y: dy / r };
});

// ---------------------------------------------------------------------------
// THE CAMERA. Two moves and one 6-frame held breath, all through one damped
// `runCamera`. `camMove` takes cy off the EASED k, so the content centre sits
// on screen y 835 — under the burnt-in captions — at every zoom. cx gets its
// own key-per-frame track through the SAME damper (`runCamera` with an inert k
// channel), because `camMove` only carries cy and k: the hurricane's pattern,
// and cut 1's.
//
// K_TIGHT 1.7 is the brief's; the release's speed is what pins it there (see
// the deviations above). Both f0s are AHEAD of their landings because the
// damper costs about six frames on a move this size: keys f0-f38 land f44,
// keys f50-f90 land f96. Measured on `runCamera` itself, not guessed —
// k(44) = 1.6973 (0.16% of K_TIGHT), k(96) = 0.9601 (0.22% of K_FINAL).
// ---------------------------------------------------------------------------
export const K_TIGHT = 1.7;
export const CREEP_F0 = 0;
export const CREEP_F1 = 38;
export const CREEP_WARP = 0.8;
export const HOLD_F0 = 44; // the creep is landed
export const OPEN_F0 = 50; // two frames after the release
export const OPEN_F1 = 90;
export const OPEN_WARP = 0.75;

const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_FINAL,
  k1: K_TIGHT,
  c0: CONTENT_CY_FINAL,
  c1: SEED_POS.y,
  warp: CREEP_WARP,
});
const OPEN = camMove({
  f0: OPEN_F0,
  f1: OPEN_F1,
  k0: K_TIGHT,
  k1: K_FINAL,
  c0: SEED_POS.y,
  c1: CONTENT_CY_FINAL,
  warp: OPEN_WARP,
});
export const CAM_F = [...CREEP.F, OPEN_F0 - 1, ...OPEN.F, DURATION];
export const CAM_K = [...CREEP.K, K_TIGHT, ...OPEN.K, K_FINAL];
export const CAM_CY = [
  ...CREEP.CY,
  SEED_POS.y + CAM_LIFT / K_TIGHT,
  ...OPEN.CY,
  CY_FINAL,
];

const CAMX = (() => {
  const F: number[] = [];
  const X: number[] = [];
  for (let i = 0; i <= CREEP_F1 - CREEP_F0; i++) {
    F.push(CREEP_F0 + i);
    X.push(CX_FINAL + (SEED_POS.x - CX_FINAL) * camEase(i / (CREEP_F1 - CREEP_F0), CREEP_WARP));
  }
  F.push(OPEN_F0 - 1);
  X.push(SEED_POS.x);
  for (let i = 0; i <= OPEN_F1 - OPEN_F0; i++) {
    F.push(OPEN_F0 + i);
    X.push(SEED_POS.x + (CX_FINAL - SEED_POS.x) * camEase(i / (OPEN_F1 - OPEN_F0), OPEN_WARP));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X, K: F.map(() => 1) };
})();
export const CAMX_F = CAMX.F;
export const CAMX_X = CAMX.X;
export const CAMX_K = CAMX.K;

export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const x = runCamera(f, CAMX_F, CAMX_X, CAMX_K).cy;
  return { k: c.k, cy: c.cy, cx: x };
};

/** Where a world point lands on screen at frame f, sway included — the same
 *  arithmetic the render does, so the velocity scan and the picture cannot
 *  drift apart. */
export const screenAt = (f: number, x: number, y: number) => {
  const cam = camAt(f);
  const d = sway(f + CONTINUE_FROM);
  return {
    x: FRAME_W / 2 + (x - (cam.cx + d.dx)) * cam.k,
    y: FRAME_H / 2 + (y - (cam.cy + d.dy)) * cam.k,
    k: cam.k,
  };
};

/** The mechanism's head: the front's radius from the seed, in world px, read
 *  off the field's own order statistics. */
export const frontRadius = (f: number) => orderRadius(Math.max(1, litCount(f)));

// ---------------------------------------------------------------------------
// CUT 1'S BACKGROUND REST VALUES. `GridBackground` measures its parallax from
// the camera's OPENING cy/cx, so a cut that opens on a sibling's resolved frame
// has to keep the sibling's reference or the kraft jumps at the join — 35 px at
// this k and parallax, which a difference blend sees instantly.
//
// HARMONY PASS (director): these WERE a local `// HARMONY:` restatement of cut
// 1's opening camera, derived here from the band and the mark so a render of
// this file would not depend on a sibling still being iterated. They are now
// IMPORTED from `TwoPercentOfTransactions` — cut 1 is the only thing that can
// know where cut 1's camera rests, so a restatement is one more place for the
// two cuts to drift apart, and importing across sibling cuts is the house
// pattern (the D1 set imports `K_FINAL` that way). The two values are exactly
// what cut 1's own `KraftBackground` is handed:
//   cxRest = CAMX_X[0] = C_OPEN_X0                        835.126
//   cyRest = CAM_CY[0] = C_OPEN_Y0 + CAM_LIFT / K_OPEN    784.818
// (`camMove`'s first key is `c0 + CAM_LIFT / k0`, so the second line is an
// identity, not a re-derivation; both were checked against cut 1's own arrays.)
// ---------------------------------------------------------------------------
export const CUT1_CX_REST = C_OPEN_X0;
export const CUT1_CY_REST = C_OPEN_Y0 + CAM_LIFT / K_OPEN;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
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
  markSize: z.number(),
  beats: z.object({
    andYet: z.number(), // "and yet"
    thats: z.number(), // "that's"
    a: z.number(), // "a"
    really: z.number(), // "really"
    fancy: z.number(), // "fancy" — said over the amber, the camera still creeping
    way: z.number(), // "way"
    of1: z.number(), // "of"
    saying: z.number(), // "saying"
    ninetyEight: z.number(), // "98%" — the release
    of2: z.number(), // "of"
    spend: z.number(), // "spend"  — three quarters of the field is passed
    is: z.number(), // "is"
    not: z.number(), // "not"
    on: z.number(), // "on"
    us: z.number(), // "us"    — the strain relaxing is all that happens
    end: z.number(), // speech ends; tail to 130
  }),
});

export type Props = z.infer<typeof schema>;

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
  markSize: MARK_SIZE_RAMP,
  beats: BEATS,
});

const NotOnUs: React.FC<Props> = ({
  accent,
  backgroundBase,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  markSize,
}) => {
  const frame = useCurrentFrame();
  // The world's clock, continued from cut 1: sway, breath, strain, the kraft's
  // drift and its parallax reference all read this, never `frame`.
  const fc = frame + CONTINUE_FROM;

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(fc);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // The "$" knockout is held OFF for the whole cut. `CoinDefs` switches it at
  // DOLLAR_K 1.6 and this camera crosses 1.6 twice (f32 rising, f60 falling),
  // which would put a 1.0 screen px stroke onto 2,441 coins in a single frame,
  // twice — a pop on the whole field, and the wrong state at f0, where cut 1's
  // resolved frame (k 0.958) has it off and the join is measured. At K_TIGHT
  // the stroke would be 1.05 screen px, which is what DOLLAR_K exists to
  // refuse; nothing is lost.
  const defsK = Math.min(k, DOLLAR_K - 0.01);

  // -- the release, as three contiguous slices of the order ------------------
  const n = Math.max(LIT_FINAL, Math.min(N_FIELD, Math.floor(litCount(frame))));
  const nBand = Math.max(LIT_FINAL, Math.min(n, Math.floor(litCount(frame - LIFT_DUR))));
  const gain = strainGain(frame);

  // ONE pass in INDEX order, not four passes in order-of-lighting order. The
  // slices are contiguous in `order` and it is tempting to walk them, but the
  // field is jittered +/- 1.2 px on an 11 px pitch, so neighbouring coins do
  // overlap by a pixel or two and WHICH ONE IS ON TOP is decided by the paint
  // order. Cut 1 paints in index order; walking the order slices instead put a
  // 1-4 count difference across the whole field at the join (>1 count: 9.0% of
  // the frame against the 5.4% of cut 1's own f176 -> f177). Indexed, the join
  // matches cut 1's own frame-to-frame diff exactly.
  const ink: React.ReactNode[] = [];
  const passed: React.ReactNode[] = [];
  const band: React.ReactNode[] = [];
  const amber: React.ReactNode[] = [];
  for (let i = 0; i < N_FIELD; i++) {
    const o = FIELD_COINS[i].order;
    const breathe = coinBreath(fc, i);
    if (o < LIT_FINAL) {
      const lean = RING_W[o] * gain * strain(fc, i);
      amber.push(
        FieldCoin({
          i,
          state: "amber",
          scale: breathe,
          dx: RADIAL[o].x * lean,
          dy: RADIAL[o].y * lean,
        }),
      );
    } else if (o >= n) {
      ink.push(FieldCoin({ i, state: "ink", scale: breathe }));
    } else if (o < nBand) {
      passed.push(FieldCoin({ i, state: "passed", scale: LIFT_HOLD * breathe }));
    } else {
      band.push(FieldCoin({ i, state: "passed", scale: liftScale(frame - REACH[o]) * breathe }));
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={fc}
        cy={cy}
        cyRest={CUT1_CY_REST}
        cx={cx}
        cxRest={CUT1_CX_REST}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            <CoinDefs k={defsK} />

            {/* the 98% the front has not reached yet: the country, still ink */}
            <g>{ink}</g>
            {/* what it has passed: lifted, full white, at rest */}
            <g>{passed}</g>
            {/* THE FRONT. The only group that carries a shadow — ONE filter on
                the band, never one per coin — so the wave reads as a ridge of
                money standing up and rolling west. */}
            <g style={{ filter: icon }}>{band}</g>
            {/* Ramp's 2%, untouched by the wave, straining at the ring cut 1
                stopped it on. Drawn last of the field, as in cut 1, so an amber
                coin can never be clipped by a white neighbour. */}
            <g>{amber}</g>

            {/* Ramp reaching New York. Live, and it never moves. */}
            <g style={{ filter: icon }}>
              <line
                x1={THREAD_FROM.x}
                y1={THREAD_FROM.y}
                x2={SEED_POS.x}
                y2={SEED_POS.y}
                stroke={accent}
                strokeWidth={THREAD_W}
                strokeLinecap="round"
                opacity={THREAD_LIVE}
              />
            </g>

            <RampMark x={MARK_POS.x} y={MARK_POS.y} size={markSize} k={k} opacity={OP_READ} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default NotOnUs;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted so a change to a window or an ease
// cannot quietly turn one motion into two, break the join with cut 1, or slide
// the payoff off its word.
// ---------------------------------------------------------------------------
{
  const c0 = camAt(0);
  if (
    Math.abs(c0.k - K_FINAL) > 1e-9 ||
    Math.abs(c0.cx - CX_FINAL) > 1e-9 ||
    Math.abs(c0.cy - CY_FINAL) > 1e-9
  ) {
    throw new Error(
      `NotOnUs: f0 is (k ${c0.k}, cx ${c0.cx}, cy ${c0.cy}), not cut 1's resolved camera (k ${K_FINAL}, cx ${CX_FINAL}, cy ${CY_FINAL})`,
    );
  }
}
// The kraft's parallax reference IS cut 1's, not a copy of it: the two values
// this cut hands `KraftBackground` have to be the two values cut 1 hands its
// own, or the sheet steps at the join.
if (
  Math.abs(CUT1_CX_REST - CUT1_CAMX_X[0]) > 1e-9 ||
  Math.abs(CUT1_CY_REST - CUT1_CAM_CY[0]) > 1e-9
) {
  throw new Error(
    `NotOnUs: the kraft rests at (${CUT1_CX_REST}, ${CUT1_CY_REST}), not on cut 1's opening camera (${CUT1_CAMX_X[0]}, ${CUT1_CAM_CY[0]})`,
  );
}
if (Math.abs(litCount(F_REL) - LIT_FINAL) > 1e-9 || Math.abs(litCount(F_COAST) - N_FIELD) > 1e-9) {
  throw new Error(
    `NotOnUs: the release runs ${litCount(F_REL)} -> ${litCount(F_COAST)}, not ${LIT_FINAL} -> ${N_FIELD}`,
  );
}
// The camera reacts to the wave; it never leads it.
if (OPEN_F0 - F_REL !== 2) {
  throw new Error(`NotOnUs: the camera leaves on f${OPEN_F0}, not two frames after the release (f${F_REL})`);
}
// The house rule: an arrival settles 4-10 frames BEFORE its word.
if (BEATS.us - 96 < 4 || BEATS.us - 96 > 10) {
  throw new Error(`NotOnUs: the camera lands on f96, which is not 4-10 frames ahead of "us" (f${BEATS.us})`);
}
// The front is the cut's one head, and it is capped like any other.
{
  let worst = 0;
  for (let f = F_REL; f <= F_COAST; f += 0.25) {
    const v =
      (frontRadius(f + 0.5) - frontRadius(f - 0.5)) * camAt(Math.round(f)).k;
    if (v > worst) worst = v;
  }
  if (worst > SPEED_CAP) {
    throw new Error(`NotOnUs: the front peaks at ${worst.toFixed(1)} screen px/frame, over the ${SPEED_CAP} cap`);
  }
}
