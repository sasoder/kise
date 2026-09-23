import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, camEase, clamp01, smoothstep, sway } from "./fieldShared";
import { CX_OPEN_CFE, CY_OPEN_BAR_CFE, K_OPEN_CFE } from "./FeedEverything";
import {
  BLACK,
  BLUE,
  COL_CX,
  COL_R,
  CX_REST,
  CUT2_HISTORY,
  C_REST,
  FOOD,
  K_REST,
  LogWindow,
  ORANGE,
  PILL_H,
  PILL_R,
  PURPLE,
  Pill,
  SHADOW,
  STAMP_SIZE,
  STAMP_WEIGHT,
  ShadowedText,
  WHITE,
  World,
  makeLog,
  pillWidth,
  runCamera2,
  widthOf,
} from "./cottageShared";
import type { ExGeom, ExchangeSpec } from "./cottageShared";

export const FPS = 24;
// Clip "anna - chatgpt knows my cottage cheese", 44.6 s. The composition starts
// at clip 21.20 s; speech ends on the end of "go?", 27.64 s.
// round((27.64 - 21.20) * 24) = 155 frames of speech, plus a 24-frame tail so
// the resolved window holds = 179. Delivered as `21_WhereDoesThatGo.mov`.
export const DURATION = 179;

// ---------------------------------------------------------------------------
// "WHERE DOES THAT GO?" — cut 2 of 2, the clip's payoff. The line:
//   "(But like, you know,) it knows how much cottage cheese I had at like
//    10 a.m. on a Wednesday. Is that good? Where does that go?"
//
// Word onsets (faster-whisper large-v3, clip-relative), frame =
// round((t - 21.20) * 24), re-read off cottage_words.json:
//   it 21.50 -> 7 · knows 21.60 -> 10 · how 21.90 -> 17 · much 22.36 -> 28 ·
//   cottage 22.56 -> 33 · cheese 22.84 -> 39 (ends 23.16 -> 47) ·
//   I had at like 23.16-23.94 -> 47-66 · 10 23.94 -> 66 · a.m. 24.28 -> 74
//   (ends 24.70 -> 84) · on a 24.70-25.08 -> 84-93 · Wednesday 25.08 -> 93
//   (ends 25.46 -> 102) · Is 25.78 -> 110 · that 26.22 -> 120 · good? 26.38 ->
//   124 (ends 26.54 -> 128) · Where 26.72 -> 132 · does 26.90 -> 137 ·
//   that 27.32 -> 147 · go? 27.48 -> 151 (ends 27.64 -> 155)
//
// THE WORLD is `cottageShared.tsx` (cut 1 owns it; this cut only imports it):
// the same ChatGPT window, the same size, exactly as cut 1 resolved it —
// 2 EGGS / 143, BLACK COFFEE / 2, BANANA / 105 in the three slots — plus this
// cut's own exchange, 1 CUP COTTAGE CHEESE (USDA FDC 172182, 183 kcal: its
// reply never reaches the numeral in this cut), with a STAMP ROW reserved.
//
// THE CONCEPT — IT KNOWS, AND A COPY LEAVES. The entry she describes is typed
// in her word order, sent, and stamped with what the app knows about it (the
// time and the day). One held breath. Then a COPY of the entry lifts out of the
// log — the original stays — and rises past the ChatGPT header and out of the
// top of frame, trailing the three chain colours. Nobody sees where it goes.
// The chain appears nowhere else in the clip: the chain = the copy that leaves.
//
// THE GESTURES — each with the word it serves. Nothing else moves except the
// paper's drift, the camera's sway and the reply's slow writing.
//   1. f0-11   CUT 1's OPEN (k 1.40, cx 640, the input bar's foot on screen y
//              1400, the right-hand pill lane above it, the older replies cut by
//              the LEFT frame edge — imported from FeedEverything.tsx); the log
//              exactly as cut 1 resolved it; the black caret waits.  — "it knows" (7-17)
//   2. f17-27  "1 CUP " types at a word-pace (1, space, C, U, P, space on odd
//              frames).                                          — "how much" (17-33)
//   3. f31-44  "COTTAGE CHEESE" types, 1 char/frame. The line grows LEFT from the
//              caret (x 791 -> 180), so G1 eases the camera back and left over
//              f12-42 to hold it: the whole line is in the band from the first
//              character to the send (screen x >= 94).   — "cottage cheese" (33-47)
//   4. f48-63  SEND (15 f — see DEVIATIONS): the pill grows out of the bar and
//              rises into the bottom slot; the log scrolls up by the stamped
//              exchange's full 335.1 (stamp row reserved); 2 EGGS goes out the
//              top of frame. G2 follows it: up, right with the pill's drift and
//              in (k 1.165 -> 1.24), so the entry lands on screen y ~835 as the
//              subject.                                    — "I had at like" (47-66)
//   5. f58-70  "10:00 AM" slides up 24 screen px + fades in (12 f, out-cubic),
//              Barlow 800 44 white on the hard shadow, right-aligned at the
//              column edge in the stamp row; 88 % there by f64.  — "10 a.m." (66-84)
//   6. f80-92  "WEDNESDAY ·" slides in the same way to the LEFT of "10:00 AM"
//              (one space-width apart, kerned widths); 88 % there by f86.
//                                                               — "Wednesday" (93)
//      f70 on  the reply to this entry writes behind the white caret at
//              4 world px/frame — bars only, still on its fourth bar at f178.
//              The ambient layer. At the tight framing the column's left edge is
//              off frame, so its caret comes in from the left edge at ~f82.
//   7. f86-126 HELD BREATH. G3: the camera creeps in on the stamped entry
//              (k 1.24 -> 1.30, the entry pinned on screen y ~835), still from
//              ~f121. Nothing new happens, except:
//      f118-136 the chain peeks from BEHIND the original pill — orange f118,
//              purple f120, blue f122, each a copy of the pill's silhouette
//              rising 36 / 24 / 12 px on the core memory ease over 14 f: a
//              PeakForSolar crown of three 12 px stripes. The wake-before-act.
//                                                         — "Is that good?" (110-128)
//   8. f127-160 THE PAYOFF, one continuous motion (V2, on the director's
//              review). A white COPY of exactly the pill — same size, same black
//              text, same hard shadow; the stamp row stays in the log with the
//              original — slides up out from BEHIND the original: a 60 px lift
//              on Easing.bezier(0.16, 1, 0.3, 1) over 16 f SUMMED with a C1
//              travel that accelerates from rest over 10 f to a 39 world
//              px/frame cruise (world speed 20.8 -> 15.3 -> 39). It swallows
//              the crown, and the crown rides out UNDER it: the moment the copy
//              has risen n steps past a colour (blue f129, purple f130, orange
//              f132, each while wholly hidden between the copy and the
//              original), that colour is carried n steps below the white on the
//              copy's own path. The step is proportional to the copy's speed
//              (26/39 frame x speed): ~10-15 px as it clears the original, 26 px
//              at cruise, so the stack is at most 78.7 px taller than the pill —
//              thin core memory edges stepping out below the white, orange the
//              lowest and at the back, then purple, blue, the white core on top;
//              the black shadow on the core only; no paper between the bands.
//              It curves 71.9 px onto the column axis (smoothstep over 140..640
//              px of rise), passes over the header lockup f147-157 and is wholly
//              out of the top of frame at f158; the steps follow it out, orange
//              last, gone at f160 — they leave the frame, nothing fades. The
//              original never moves. G4: one glide back, left and up (k 1.30 ->
//              1.00, cx 612 -> 540) that rises with the copy so the header comes
//              in from the top, settled on the whole-window framing by ~f153 —
//              then the camera STOPS and lets the copy leave on its own.
//                                                  — "Where does that go?" (132-155)
//   9. f160-178 HOLD: the whole window — header, BLACK COFFEE / 2, BANANA / 105,
//              1 CUP COTTAGE CHEESE with WEDNESDAY · 10:00 AM (still there), its
//              reply still writing, the input bar — and empty paper above the
//              header where the copy went.
//
// THE LAYERING of the payoff, drawn over the whole LogWindow (so the copy and
// the trail pass IN FRONT of the log and the header, and are never cut by the
// log's clip) — back to front:
//   the original's shadow (a redraw, identical to the log's own)
//   [clipped to y < the original pill's lower edge, 1057.9:]
//     the copy's shadow · orange · purple · blue · the white copy + its text
//   the original pill, white, redrawn on top — it never moves and is never
//   covered; the copy and the crown come out from BEHIND it.
// The clip keeps the copy's shadow off the original's stamp row in the first
// frame of the lift. The redraw starts
// on the frame the send lands (f63), inside the landing, so the one-time change
// from single- to double-drawn antialiased edges is hidden in motion.
//
// THE CAMERA — cut 1's open, then four eased glides, summed on one per-frame
// track (each glide adds its own eased delta to k, cx and the content centre;
// cy = centre + 125 / k) through `cottageShared`'s runCamera2 (the house
// CAM_STIFF / CAM_DAMP tracker with PeakForSolar's x channel). The keys:
//   OPEN  f0        k 1.40, cx 640, cy 1112.71 (FeedEverything's K_OPEN_CFE,
//                   CX_OPEN_CFE, CY_OPEN_BAR_CFE: the bar's foot on y 1400)
//   G1    f12-42    k -> 1.165, cx -> 553, centre 1023.43 -> 1080, warp 1.0:
//                   the typed line (180..938) and the sending pill's left end
//                   (148) inside x 60..1020, the frame top kept under the header
//   G2    f46-72    k -> 1.24, cx -> 612, centre -> 1040, warp 0.9: follows the
//                   send up and right and puts the entry on 835
//   G3    f86-118   k -> 1.30, centre -> 1039.95 (the entry's centre, y 1038.9,
//                   pinned on screen), warp 1.0
//   G4    f122-148  k -> 1.00, cx -> 540, centre -> 835 (C_REST), warp 0.9
//   THE DAMPED NUMBERS (no sway):
//     f     k        cx       cy        frame top (world)
//     0     1.4000   640.00   1112.71   427.0    open (cut 1's)
//     17    1.3956   638.35   1114.07   426.2    "how": typing starts
//     33    1.2620   588.91   1155.78   395.1    "cottage"
//     44    1.1745   556.53   1184.15   366.8    the line is whole
//     48    1.1673   553.96   1186.46   364.0    SEND
//     55    1.1762   561.86   1180.27   364.1    the send's fast middle
//     66    1.2169   593.83   1155.05   366.2    "10"; the pill landed at f63
//     74    1.2366   609.36   1142.87   366.6
//     93    1.2425   612.01   1140.60   368.0    "Wednesday"; G3 creeping
//     110   1.2801   612.00   1137.62   387.7    "Is"
//     124   1.2985   611.74   1135.49   396.2    "good?" — the breath (still)
//     127   1.2891   609.42   1129.57   384.9    LIFT
//     132   1.2427   598.25   1101.49   329.0    "Where"
//     137   1.1694   580.66   1057.83   236.9    "does" — the fast middle
//     147   1.0331   547.95    978.75    49.5    "that"
//     151   1.0095   542.27    965.33    14.3    "go?" — landing
//     155   1.0017   540.42    960.98     2.7    settled; the copy leaves alone
//     178   1.0000   540.00    960.00     0.0    rest (K_REST, CY_REST)
//   The header's shadow (y 351) stays above the frame top until G4: the frame
//   top never rises past world 364 before f127.
//
// MEASURED (scratchpad cwg/measure.ts, every frame, sway included):
//   camera, a fixed world point's screen velocity while it is on screen: max
//     |dv| 1.79 px/f^2 (window centre, f128, G4's first frames), 2.00 (the
//     header, from the frame it enters), 1.91 (x 120); G1 <= 0.99, G2 <= 0.82,
//     G3 <= 0.80. Max speed 15.2 px/f (window centre), 23.4 (the header).
//   speeds (screen px/frame): the copy 38.8 max (cruise) and never below
//     12.2 while the camera rises with it (no on-screen stall); the carried
//     colours 38.8 max, continuous from the frame each one first shows; the
//     send pill 41.4 (f56); the stamp row 35.6 (f59, riding the landing
//     exchange); the reply caret 4 world px/f.
//   the carried crown: step 26.0 world px at cruise (26.2 at f137, the one
//     overshoot of the copy's speed), the lowest colour at most 78.7 world px
//     below the core (92 screen px at f137, while k is 1.17; 78 at rest).
//   the log's scroll: velocity continuous (one smoothstep, 15 f).
//   band: the SUBJECT — the typed line, the entry pill (in flight and landed)
//     and its stamp — is inside x 60..1020, y 200..1450 on every frame (typed
//     line x 94..985). The lowest ink anywhere is 1430.7 (the bar's shadow at
//     rest). Outside the band: the column's left side (the older replies, the
//     input bar's left end, this entry's reply start) cut by or sitting in the
//     left margin at the tight framings, as in cut 1's open; the log's oldest
//     visible exchange running off the top edge before the payoff; the header
//     entering on G4 (f131-147); the copy + its steps on their exit (f150-159).
//
// DEVIATIONS from the brief, and why.
//   * THE OPEN IS CUT 1's V3 OPEN, imported (K_OPEN_CFE, CX_OPEN_CFE,
//     CY_OPEN_BAR_CFE), not the shared module's K_OPEN (1.12, cut 1's V1) and
//     not the V2 constants cut 1 left for this cut: the brief asks for the
//     framing cut 1 opens on, and that is now the bar-low k 1.40 close-up.
//     (Cut 1's log reports the director no longer needs the rhyme; it costs
//     nothing, so it is kept.) If cut 1 retunes those three, this cut follows.
//   * NO CREEP IN ON "it knows". The entry is 632 px of type that grows LEFT
//     from the caret; at k 1.40 its first word would be off the left edge, so
//     the camera's first move is the ease back and left that holds the line
//     (G1, from f12). A creep in first would reverse into it.
//   * k NEVER PASSES 1.30 (the brief allowed 1.8): the entry pill is 700 world
//     px wide with its shadow, and x 60..1020 holds it only up to k 1.37; 1.30
//     leaves room for the sway. The held breath is 1.24 -> 1.30 (+4.8 %).
//   * THE SEND TAKES 15 f (`sendF`, cottageShared's additive option), not the
//     shared 13: at k 1.17-1.24 the 352 px rise peaks at 49 screen px/f in
//     13 f; in 15 f with G2 following it peaks at 41.4. It lands at f63.
//   * THE LIFT STARTS AT f127, not f128, and G4's keys start at f122: the
//     damped camera needs ~4 f to get going, so this pairing keeps the copy
//     moving on screen (never below 12.2 px/f) while the camera rises with it
//     AND lands the whole-window framing by ~f153. The copy (pill only) is out
//     at f158 (brief ~f162) and the steps at f160 (brief ~f170).
//   * THE STAMP IS RIGHT-ALIGNED AT THE COLUMN EDGE (x 960), where the shared
//     module's `stampBaseline` puts it, flush with the pill's right edge.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE LOG — cut 1's resolved log as history, plus this cut's own exchange.
// ---------------------------------------------------------------------------
export const ENTRY = FOOD.cheese.entry; // "1 CUP COTTAGE CHEESE"
// "1 CUP " at a word-pace during "how much", then "COTTAGE CHEESE" 1 char/frame.
export const TYPE_AT = [
  17, 19, 21, 23, 25, 27, // 1 ␣ C U P ␣
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, // COTTAGE␣CHEESE
];
export const SEND_AT = 48;
// 15 f, not the shared 13: at this cut's k 1.17 the pill would peak at 49 px/f
export const SEND_FRAMES = 15;
export const LANDED_F = SEND_AT + SEND_FRAMES; // 63
export const REPLY_AT = 70;
export const REPLY_RATE = 4; // world px/frame: slow — still writing its bars at f178
export const CHEESE_SPEC: ExchangeSpec = {
  food: FOOD.cheese,
  stamp: true,
  typeAt: TYPE_AT,
  sendAt: SEND_AT,
  sendF: SEND_FRAMES,
  replyAt: REPLY_AT,
  replyRate: REPLY_RATE,
  replyStop: "bars",
};
export const CWG_SPECS: ExchangeSpec[] = [...CUT2_HISTORY, CHEESE_SPEC];
export const LOG = makeLog(CWG_SPECS);
export const CHEESE = CWG_SPECS.length - 1;

// Where the stamped entry rests (it never moves after its send lands):
// pill x 263.84 .. 960, y 971.9 .. 1057.9; stamp row to 1105.9.
export const REST_GEOM: ExGeom = LOG.geom(CHEESE, DURATION);
export const PILL_W = pillWidth(ENTRY);
export const PILL_X1 = COL_R;
export const PILL_X0 = PILL_X1 - PILL_W;
export const PILL_Y0 = REST_GEOM.pillY0;
export const PILL_Y1 = REST_GEOM.pillY1;
export const PILL_CX = (PILL_X0 + PILL_X1) / 2;

// ---------------------------------------------------------------------------
// THE STAMP — what the app knows about the entry.
// ---------------------------------------------------------------------------
export const STAMP_TIME = "10:00 AM";
export const STAMP_DAY = "WEDNESDAY ·";
export const STAMP_R = COL_R;
// "WEDNESDAY ·" ends one space-width left of "10:00 AM" (no kern pairs touch
// the space), so the two read as one line: "WEDNESDAY · 10:00 AM".
export const STAMP_DAY_R =
  STAMP_R - widthOf(STAMP_TIME, STAMP_WEIGHT, STAMP_SIZE) - widthOf(" ", STAMP_WEIGHT, STAMP_SIZE);
export const STAMP_TIME_F = 58;
export const STAMP_DAY_F = 80;
export const TEXT_IN_F = 12;
export const TEXT_RISE_SCREEN = 24;

// ---------------------------------------------------------------------------
// THE CAMERA — see the header. It opens on CUT 1's OPEN (imported from cut 1,
// not copied, so the rhyme holds if cut 1's open is retuned), then runs four
// eased glides. Each glide adds its own eased delta to k, cx and the content
// centre; the track is keyed on every frame (so `interpolate` never draws a
// corner), cy = centre + CAM_LIFT / k, and the house damper does the rest.
// ---------------------------------------------------------------------------
export const K_OPEN_CWG = K_OPEN_CFE; // 1.40
export const CX_OPEN_CWG = CX_OPEN_CFE; // 640
// cut 1 keys its open on the input bar's screen line (y 1400); as a content
// centre that is cy - CAM_LIFT / k
export const CY_OPEN_CWG = CY_OPEN_BAR_CFE; // 1112.71
export const C_OPEN_CWG = CY_OPEN_CWG - CAM_LIFT / K_OPEN_CWG; // 1023.43
type Glide = { f0: number; f1: number; warp: number; k: number; cx: number; c: number };
// absolute targets, reached at f1; each glide starts where the previous one ends
export const T1 = { k: 1.165, cx: 553, c: 1080 }; // the typed line in the band, header still off
export const T2 = { k: 1.24, cx: 612, c: 1040 }; // the stamped entry on 835
export const T3 = { k: 1.3, cx: 612 }; // the held breath: in on the entry
export const ENTRY_C = (PILL_Y0 + REST_GEOM.stampY1) / 2; // 1038.9
// T3's centre keeps the entry's centre where T2 put it on screen
export const T3_C = ENTRY_C - ((ENTRY_C - T2.c) * T2.k) / T3.k;
export const GLIDES: Glide[] = [
  { f0: 12, f1: 42, warp: 1, k: T1.k - K_OPEN_CWG, cx: T1.cx - CX_OPEN_CWG, c: T1.c - C_OPEN_CWG },
  { f0: 46, f1: 72, warp: 0.9, k: T2.k - T1.k, cx: T2.cx - T1.cx, c: T2.c - T1.c },
  { f0: 86, f1: 118, warp: 1, k: T3.k - T2.k, cx: T3.cx - T2.cx, c: T3_C - T2.c },
  { f0: 122, f1: 148, warp: 0.9, k: K_REST - T3.k, cx: CX_REST - T3.cx, c: C_REST - T3_C },
];
const TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (let f = 0; f <= DURATION + 24; f++) {
    let k = K_OPEN_CWG;
    let cx = CX_OPEN_CWG;
    let c = C_OPEN_CWG;
    for (const g of GLIDES) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
      k += g.k * e;
      cx += g.cx * e;
      c += g.c * e;
    }
    F.push(f);
    K.push(k);
    CX.push(cx);
    CY.push(c + CAM_LIFT / k);
  }
  return { F, K, CY, CX };
})();
export const CWG_CAM_F = TRACK.F;
export const CWG_CAM_K = TRACK.K;
export const CWG_CAM_CY = TRACK.CY;
export const CWG_CAM_CX = TRACK.CX;
export const cwgCamera = (f: number) => runCamera2(f, CWG_CAM_F, CWG_CAM_CY, CWG_CAM_CX, CWG_CAM_K);
// The paper's parallax is measured from the opening camera, exactly as cut 1's.
const REST = { cx: CX_OPEN_CWG, cy: CY_OPEN_CWG };

// ---------------------------------------------------------------------------
// THE COPY — see the header, gesture 8.
// ---------------------------------------------------------------------------
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const LIFT_F = 127;
export const LIFT_L = 60; // world px of the lift's own ease
export const LIFT_T = 16; // frames of the lift's own ease
export const TRAVEL_T0 = 0; // the travel's acceleration starts with the lift
export const TRAVEL_TA = 10; // frames of acceleration, from rest
export const TRAVEL_V = 39; // world px/frame cruise (= screen px/frame at rest)
export const DX0 = 140; // the curve onto the column axis starts after this much rise
export const DX1 = 640; // ...and is on the axis by here (before the header)

/** Upward displacement of the copy, world px, t frames after the lift. The
 *  lift ease plus a travel whose velocity is V * smoothstep(u): the sum is C1
 *  from its first frame on. */
export const copyD = (t: number) => {
  if (t <= 0) return 0;
  const lift = LIFT_L * EASE_LAND(clamp01(t / LIFT_T));
  const u = clamp01((t - TRAVEL_T0) / TRAVEL_TA);
  const acc = TRAVEL_V * TRAVEL_TA * (u * u * u - (u * u * u * u) / 2);
  const cruise = TRAVEL_V * Math.max(0, t - TRAVEL_T0 - TRAVEL_TA);
  return lift + acc + cruise;
};
/** Sideways drift onto the column axis, as a function of the rise — so a
 *  colour carried n steps behind is on exactly the same path. */
export const copyDX = (D: number) => (COL_CX - PILL_CX) * smoothstep((D - DX0) / (DX1 - DX0));

// THE CHAIN — orange at the back, blue nearest the white. `peek` is the crown
// step above the original at rest; `n` is the colour's place in the stack.
export const PEEK_F = 14;
export const CHAIN = [
  { key: "orange", color: ORANGE, peek: 36, peekAt: 118, n: 3 },
  { key: "purple", color: PURPLE, peek: 24, peekAt: 120, n: 2 },
  { key: "blue", color: BLUE, peek: 12, peekAt: 122, n: 1 },
] as const;

/** The copy's speed, world px/frame, t frames after the lift (a central
 *  difference of the C1 path). */
export const copyV = (t: number) => {
  if (t <= 0) return 0;
  const h = 0.25;
  return (copyD(t + h) - copyD(t - h)) / (2 * h);
};
/** THE TRAIL STEP: proportional to the copy's speed, so the crown's steps open
 *  with the speed and close with it — 26 px at the 39 px/frame cruise, so the
 *  whole stack is at most 78 px taller than the pill. */
export const TRAIL_STEP_MAX = 26;
export const TRAIL_TAU = TRAIL_STEP_MAX / TRAVEL_V; // frames
export const trailStep = (t: number) => TRAIL_TAU * copyV(t);

/** A colour's upward displacement from the original, and its sideways drift.
 *  At rest it is its crown step (12 / 24 / 36 on the core memory ease). Once
 *  the lift starts the copy slides up over the crown; the moment the copy has
 *  risen `n` trail steps past a colour, the colour is picked up and carried
 *  `n` steps BELOW the copy, on the copy's own path — so the crown rides out
 *  under the white as thin steps that open with the speed. Each pick-up happens
 *  while that colour is wholly hidden between the copy (above, in front) and
 *  the original (below, in front). */
export const chainD = (c: (typeof CHAIN)[number], f: number) => {
  const peek = f >= c.peekAt ? c.peek * EASE_LAND(clamp01((f - c.peekAt) / PEEK_F)) : 0;
  const t = f - LIFT_F;
  const carried = t > 0 ? copyD(t) - c.n * trailStep(t) : -Infinity;
  if (carried > peek) return { dy: carried, dx: copyDX(carried) };
  return { dy: peek, dx: 0 };
};

export const schema = z.object({
  // the hand on the camera, as in cut 1
  sway: z.boolean(),
  stampTime: z.string(),
  stampDay: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  sway: true,
  stampTime: STAMP_TIME,
  stampDay: STAMP_DAY,
});

const EASE_TEXT = Easing.out(Easing.cubic);
const COPY_CLIP = "cwg-copy-clip";

const WhereDoesThatGo: React.FC<Props> = ({ sway: withSway, stampTime, stampDay }) => {
  const frame = useCurrentFrame();
  const cam = cwgCamera(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };

  // THE TEXT ENTRANCE: slide up TEXT_RISE_SCREEN screen px while fading in.
  const textIn = (f0: number) => {
    const u = EASE_TEXT(clamp01((frame - f0) / TEXT_IN_F));
    const kAt = cwgCamera(f0 + TEXT_IN_F).k;
    return { o: u, dy: (1 - u) * (TEXT_RISE_SCREEN / kAt) };
  };

  // THE STAMP, in the exchange's reserved row (moves with the exchange).
  const stamp = (i: number, g: ExGeom) => {
    if (i !== CHEESE || frame < STAMP_TIME_F) return null;
    const t = textIn(STAMP_TIME_F);
    const w = frame >= STAMP_DAY_F ? textIn(STAMP_DAY_F) : null;
    return (
      <g>
        <g opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
          <ShadowedText
            text={stampTime}
            x={STAMP_R}
            y={g.stampBaseline}
            size={STAMP_SIZE}
            weight={STAMP_WEIGHT}
            anchor="end"
          />
        </g>
        {w ? (
          <g opacity={w.o} transform={`translate(0 ${w.dy.toFixed(3)})`}>
            <ShadowedText
              text={stampDay}
              x={STAMP_DAY_R}
              y={g.stampBaseline}
              size={STAMP_SIZE}
              weight={STAMP_WEIGHT}
              anchor="end"
            />
          </g>
        ) : null}
      </g>
    );
  };

  const landed = LOG.landed(CHEESE, frame);
  const D = copyD(frame - LIFT_F);
  const dx = copyDX(D);

  return (
    <World frame={frame} cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }} rest={REST}>
      <defs>
        <clipPath id={COPY_CLIP}>
          <rect x={-4000} y={-9000} width={9000} height={9000 + PILL_Y1} />
        </clipPath>
      </defs>

      <LogWindow log={LOG} frame={frame} idPrefix="cwg" overExchange={stamp} />

      {landed ? (
        <g>
          {/* the original's shadow, at the very back of this stack */}
          <rect
            x={PILL_X0 + SHADOW}
            y={PILL_Y0 + SHADOW}
            width={PILL_W}
            height={PILL_H}
            rx={PILL_R}
            fill={BLACK}
          />
          <g clipPath={`url(#${COPY_CLIP})`}>
            {/* the copy's hard shadow — on the white core only */}
            {D > 0 ? (
              <rect
                x={PILL_X0 + dx + SHADOW}
                y={PILL_Y0 - D + SHADOW}
                width={PILL_W}
                height={PILL_H}
                rx={PILL_R}
                fill={BLACK}
              />
            ) : null}
            {/* the chain: the crown, then the crown carried */}
            {CHAIN.map((c) => {
              const p = chainD(c, frame);
              if (p.dy <= 0) return null;
              return (
                <Pill
                  key={c.key}
                  entry={ENTRY}
                  x1={PILL_X1 + p.dx}
                  y0={PILL_Y0 - p.dy}
                  fill={c.color}
                  shadow={false}
                  text={false}
                />
              );
            })}
            {/* the copy: exactly the pill, its text — the stamp row stays in
                the log with the original */}
            {D > 0 ? (
              <Pill entry={ENTRY} x1={PILL_X1 + dx} y0={PILL_Y0 - D} shadow={false} fill={WHITE} />
            ) : null}
          </g>
          {/* the original, in front: it never moves */}
          <Pill entry={ENTRY} x1={PILL_X1} y0={PILL_Y0} shadow={false} />
        </g>
      ) : null}
    </World>
  );
};

export default WhereDoesThatGo;
