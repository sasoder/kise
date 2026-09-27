import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FRAME_H, camEase, camMove, clamp01, hash, smoothstep, sway } from "./fieldShared";
import {
  AI_CARET_H,
  AI_CARET_LEAD,
  AI_CARET_W,
  BAR_GAP,
  BAR_H,
  BLACK,
  BLUE,
  CARET_IN,
  CARET_OUT,
  ORANGE,
  PURPLE,
  SHADOW,
  STROKE,
  WHITE,
  World,
  runCamera2,
  worldToScreen,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon", the cut at 19.75 s on the edit timeline. f0 = 19.75 s and
// frame = round((t - 19.75) * 24). Speech ends at the end of the second "et
// cetera", f150; plus a 22 frame tail = 172 frames (f0-171).
export const DURATION = 172;

// ---------------------------------------------------------------------------
// "PROXY FOR INTELLIGENCE" V2 — core memory podcast graphic standard (reference
// `PeakForSolar.tsx`), in the world of this speaker's previous clip
// (`cottageShared.tsx`, imported read-only). NO TEXT AT ALL: no letters, no
// labels, no numbers. Language is abstract white word-bars.
//
// THE LINE: "Like, his use of the English language is just superb. Obviously
// it's a proxy for high intelligence and analytical skills, et cetera, et
// cetera."
//
// THE WORD ONSETS (whisper, word level), in frames:
//   Like 1 · his 7 · use 11 · of 18 · the 23 · English 25 · language 30-39 ·
//   is 39 · just 49 · superb 53-63 · Obviously 67 · it's a 73 · proxy 79 ·
//   for 88 · high 93 · intelligence 97-106 · and 106 · analytical 116 ·
//   skills 124-132 · et cetera 135-143 · et cetera 144-150 · (next line "So" 156)
//
// THE IDEA, "inside the head": first only his words, a small immaculate block
// of language. The camera pulls back and finds where they come from: a person,
// whose head opens on a mind that wires itself up, and that mind feeds more
// words back up into the block. Words are the visible proxy for what is inside.
//
// THE MATERIAL: 1080x1920, 24 fps, OPAQUE. cottageShared's `World` (its
// `PaperGround`: dimmed 0.88, blurred 3 px squared paper, parallax 0.15 off the
// f0 camera, drift -0.3 px/f, scale 1 + (k - 1) * 0.3; the paper is 0.995x of
// source at the tightest k 1.82, never upscaled). White #FFFFFF ink; every white
// element sits on a hard black copy at +4/+4 world px (SHADOW), zero blur, drawn
// as an SVG copy. ONE stroke weight, 6 world px (STROKE): the thread, the head's
// ring, every link. The chain #FFB765 / #BC37FF / #0046FF, raw hex, no blend, no
// fade, has ONE job in this clip, Anna's verdict — here "superb" and nothing else.
//
// THE OBJECTS (world px; one world px = one screen px at k 1; all on x 540):
//   WORD BLOCK   cottageShared's word-bars (BAR_H 28, pill ends, BAR_GAP 20) in
//                JUSTIFIED lines: every line exactly 500 wide (x 290-790),
//                flush both sides, 3-4 bars of hashed lengths, pitch 50. Three
//                lines at first (bottom edge BB = y 700), two more later. The
//                bottom line of every state has a bar body over x 540, so the
//                thread always meets a bar, never a gap or a pill end (asserted).
//   PERSON       `public/person.png` rebuilt as SVG, measured off its alpha on
//                the 512 box: head centre (256.0, 143.35) r 102.4 = 0.20 box;
//                body x 41.0-471.0 (0.08-0.92), y 266.2-471.1 (0.52-0.92),
//                top corners circular r 194.6 (0.38; flat top 42), bottom
//                corners r 10.2 (0.02). A grid-search fit of the dome's row
//                widths to that shape is 0.20 px rms. In head radii R: body
//                half-width 2.1 R, top 1.2 R and bottom 3.2 R below the head
//                centre, top-corner radius 1.9 R, foot radius 0.1 R (gap head
//                -> body 0.2 R). Here R = 190: at rest the head centre is y
//                980, body y 1208-1588, half-width 399, corners 361 / 19.
//   THREAD       6 px, round caps, from inside the ring's band at the head's top
//                (y 793) straight up to the block's bottom edge (y 700): 90 long.
//   MIND         16 white dots r 16 on a Poisson-disk layout (best-candidate
//                sampling, relaxed only to the 70.8 px minimum separation),
//                centres within r 142 of the head centre, so every dot edge is
//                >= 26 px inside the ring's inner edge (r 184). LINKS: 6 px,
//                each dot to its 2 nearest neighbours, planar, connected, no
//                triangles, minimum angle between links at a dot > 55 deg; 19
//                links, 70.8-98 long. Chosen by eye from ~280 scored layouts:
//                two lobes and a central fold (it reads as a connected mind at
//                270 px wide), crowned by the TOP dot, pinned on the axis at
//                (0, -142) so the beads leave from it.
//
// THE GESTURES — one per phrase, one evolving picture. Nothing else moves but
// the paper's drift and the camera. No glow, pulses, springs, flashes.
//   1. f0-43   "his use of the English language" (7-39). The three lines
//              WRITE ON behind the white caret on ONE clock, exactly
//              cottageShared's reply writing: caret (14 x 58) grows in f0-3,
//              the written end runs 1500 px of writing path at 41.67 world px/f
//              f3-39 (bars grow continuously behind it, caret 10 px ahead,
//              wrapping to the next line's start like a text cursor), caret
//              thins away f39-43.
//   2. f51-77  "superb" (53-63). The chain rises from BEHIND the finished
//              block: orange f51, purple f53, blue f55, each a copy of the
//              bars' silhouette rising 18 / 12 / 6 px on
//              Easing.bezier(0.16, 1, 0.3, 1) over 22 f, drawn between the
//              shadow layer and the white. At rest a crown of three 6 px steps
//              above each bar — on the TOP LINE only (crowning every line
//              stripes the block into a flag; `crown: "all"` is kept as a prop).
//   3. f62-98  "obviously it's a proxy for" (67-88). ONE move: the camera
//              pulls back and, on the SAME clock (`pullG`: camEase warp 0.7
//              over f62-94, speed early, no overshoot), the whole person —
//              head, body and the mind under the head's fill — RISES 550 world
//              px into place under the block, arriving on f93-94 (0.8 px to go
//              at f93). The source of the words surfaces under them. f90-98 the
//              short thread draws from the head's top up to the block (EASE
//              bezier(0.45, 0, 0.25, 1)), its base riding the head's last 12 px.
//   4. f93-107 "high intelligence" (93-106). The head OPENS: its white fill
//              irises from the centre, a hole r 0 -> 184 on bezier(0.45, 0,
//              0.2, 1) over 14 f, until only the 6 px ring is left. The dots,
//              already under the fill, are revealed; the ring's hard shadow
//              reads as the aperture's inner edge.
//   5. f112-134 "analytical skills" (116-132). The links draw on in ONE wave
//              from the bottom of the head to the top dot: each grows from its
//              lower dot's edge toward its upper dot's over 6 f (smoothstep),
//              starting at 112 + 16 * (its lower dot's height through the
//              mind) +- 1.2 f of hashed jitter (starts 112.0-128.0). The last
//              link lands on the top dot at f134.
//   6. f134-166 "et cetera, et cetera" (135-150). Two white beads (r 12, hard
//              shadow; r 12 so a bead fits wholly behind a 28 px bar) EMERGE
//              from inside the r 16 top dot at f134 and f143, cross the ring
//              and run up the thread: a C1 acceleration from rest over 3 f,
//              then a 27.6 world px/f cruise (25.7 screen px/f), 152 px in 7 f.
//              Each goes in behind the bottom bar at x 540 and is gone (f141,
//              f150). On that frame the block is PUSHED UP one pitch on the
//              same land ease over 8 f (the bead hits, the stack lifts, like a
//              chat log) and ONE caret writes the new justified line into the
//              freed bottom slot at 62.5 world px/f (8 f a line): it grows in
//              f142-145, writes line 4 f145-153 (riding up with it through the
//              second push), wraps to line 5 f154-162, thins away f162-166. The
//              block grows UPWARD; its bottom never leaves the thread's top.
//              The caret never touches the line above it (>= 1.6 px, measured).
//   7. f166-171 hold: the late creep, the sway and the paper drift carry it.
//
// THE CAMERA — cottageShared's runCamera2 (the house CAM_STIFF / CAM_DAMP
// tracker with an x channel), keyed one frame at a time so the damper's target
// is the eased curve itself. cx is 540 throughout; the hand's `sway` is added.
//   CREEP  f0-62   k 1.80 -> 1.82 about the 3-line block's centre (y 636) on
//                  screen 835 (camMove, warp 1): 0.5 screen px/f, barely there.
//   PULL   f62-94  k 1.82 -> 0.94, log-linear on `pullG` (the rise's clock). A
//                  PURE ZOOM about the one world point the two framings share:
//                  y 169.20, held on screen y -14.57 (just above the frame), so
//                  every point moves monotonically — no overshoot and sink-back.
//                  Rest centre: the whole 3-line figure, crown top (554) to
//                  foot shadow (1592), on 835.
//   LATE   f94-170 k 0.94 -> 0.92 and the centre 1073 -> 996.39 (camMove,
//                  warp 1): as the block grows to 5 lines the camera eases out
//                  and tilts up so the 5-line crown top lands on screen y ~336.
//   THE DAMPED NUMBERS (no sway):
//     f     k        cx       cy        crown top  head top  foot (shadow)
//     0     1.8000   540.00   705.44      687.4    2102.2    3545.8   open
//     53    1.8176   540.00   704.77      686.0    2114.6    3572.3   "superb"
//     79    1.2846   540.00   934.44      471.3     981.0    2011.3   "proxy"
//     97    0.9487   540.00  1196.60      350.3     574.2    1335.1   landed
//     124   0.9346   540.00  1186.12      369.2     589.8    1339.3
//     150   0.9248   540.00  1150.05      362.5     627.0    1368.7
//     171   0.9202   540.00  1132.98      335.2     644.4    1382.4
//   REST (f100-140): k 0.94, figure crown 349 -> foot 1324, centre ~837.
//   END (f171): 5-line figure crown 335 -> foot 1382 (330-1390), centre ~859.
//   The zoom rate is one smooth lobe, peaking at -2.9 %/f at f76-77. The
//   person's head crosses the frame's bottom edge at ~f66 and peaks at 82
//   screen px/f there — the move's fast early part, on the way in. At the open
//   the head's top is >= 2097 on every frame to f62 (with sway): out of frame.
//   The block top never comes nearer than 318 px to the frame top (f156).
//   CAPTION-SAFE: after f10 nothing is below screen y 1400 except the person
//   rising in on the pull (f67-91); from f92 the lowest ink is the foot's
//   shadow at <= 1382.
//
// DEVIATIONS from the brief, and why.
//   * THE RISE IS 550 WORLD PX, NOT ~650. 550 already hides the person at the
//     open (head top >= 2097, 177 px below the frame), and it cuts the head's
//     on-screen entry speed from 93 to 82 px/f; the zoom term dominates, so no
//     warp or distance gets it under ~66.
//   * THE PULL / RISE CLOCK RUNS f62-94 (the brief's f62-96, arriving ~f94):
//     the person lands f93-94 and the damped camera by ~f99.
//   * THE BLOCK IS 500 WIDE (with its shadow 504), as in the approved open,
//     not 520.
//   * THE BEADS ARE r 12, NOT THE MIND'S r 16: a bar is 28 tall, and only a
//     bead under 14 can go wholly behind it. They emerge from inside the r 16
//     top dot, so nothing pops. 7 f each (27.6 world px/f).
//   * AT REST THE BBOX CANNOT BOTH SIT IN 330-1390 AND CENTRE ON 835 WITH 5
//     LINES at k ~0.92 (it is 1047 px tall; centred on 835 it spans
//     311-1358). The 3-line rest is centred on 835 (349-1324 at k 0.94); the
//     late tilt then keeps the 5-line figure inside the band (335-1382 at the
//     last frame, centre ~859). During the second push the crown top dips to
//     318 for a few frames (f156-162) before the tilt catches it.
//   * DURING EACH PUSH THE THREAD'S TOP IS BRIEFLY IN AN EMPTY SLOT: the old
//     bottom line lifts off, the new line is written in under it left to right
//     and meets the thread again when the caret passes x 540. It reads as a
//     line being inserted between thread and block.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE GEOMETRY, world px. Everything is centred on x 540.
// ---------------------------------------------------------------------------
export const CX = 540;

// -- the word block: justified lines of cottageShared's word-bars -------------
export const LINE_W = 500;
export const LINE_X0 = CX - LINE_W / 2; // 290
export const PITCH = 50;
/** The block's bottom edge (the bottom line's bar bottom): the thread's top. */
export const BB = 700;
/** Bar lengths per line; every line is LINE_W wide with BAR_GAP between bars.
 *  Lines 0-2 are written first; 3 and 4 are fed up by the two beads. The
 *  bottom line of every state (2, 3, 4) has a bar spanning x 540, so the
 *  thread always meets a bar body, never a gap or a pill end. */
export const LINES: number[][] = [
  [96, 188, 64, 92],
  [150, 70, 240],
  [124, 222, 114],
  [72, 238, 58, 72],
  [186, 150, 124],
];
const starts = (bars: number[]) => {
  const s: number[] = [];
  let x = 0;
  for (const w of bars) {
    s.push(x);
    x += w + BAR_GAP;
  }
  return { s, len: x - BAR_GAP };
};
export const LINE_STARTS = LINES.map((b) => starts(b).s);
for (let i = 0; i < LINES.length; i++) {
  const len = starts(LINES[i]).len;
  if (Math.abs(len - LINE_W) > 1e-9) {
    throw new Error(`ProxyForIntelligenceV2: line ${i} is ${len} wide, not ${LINE_W}`);
  }
}
for (const i of [2, 3, 4]) {
  const off = CX - LINE_X0;
  const ok = LINES[i].some((w, k) => LINE_STARTS[i][k] + BAR_H / 2 + 12 < off && off < LINE_STARTS[i][k] + w - BAR_H / 2 - 12);
  if (!ok) throw new Error(`ProxyForIntelligenceV2: line ${i} has no bar body over x ${CX}`);
}

// -- the thread and the person ------------------------------------------------
export const THREAD_L = 90;
export const HEAD_R = 190;
export const HEAD_TOP = BB + THREAD_L; // 790
export const HY = HEAD_TOP + HEAD_R; // 980, the head's centre at rest
// public/person.png, measured off its alpha on the 512 box: head centre
// (256.0, 143.35) r 102.4 = 0.20 box; body x 0.08-0.92 (41.0-471.0), y 0.52-0.92
// (266.2-471.1), top corners circular r 0.38 (194.6; flat top 0.08 = 42),
// bottom corners r 0.02 (10.2). In head radii:
export const BODY_HALF_W = 2.1 * HEAD_R; // 399
export const BODY_TOP = HY + 1.2 * HEAD_R; // 1208
export const BODY_BOTTOM = HY + 3.2 * HEAD_R; // 1588
export const BODY_TOP_R = 1.9 * HEAD_R; // 361
export const BODY_FOOT_R = 0.1 * HEAD_R; // 19
/** The head's outline once it has opened: the piece's one stroke weight. */
export const HOLE_R = HEAD_R - STROKE; // 184

// -- the mind: 16 dots r 16, Poisson-disk (min separation 70.8), centres within
//    r 142 so every dot edge is >= 26 px inside the ring's inner edge; links to
//    the two nearest neighbours, planar, connected, no triangles. Offsets from
//    the head centre. Dot 0 is the TOP dot, pinned on the axis; dot 1 is the
//    lowest. ------------------------------------------------------------------
export const DOT_R = 16;
export const DOTS: [number, number][] = [
  [0.0, -142.0],
  [0.69, 129.9],
  [113.68, 6.12],
  [-129.74, -0.98],
  [8.01, 3.48],
  [-62.58, 33.85],
  [-69.1, 117.99],
  [-62.07, -107.95],
  [69.1, -124.05],
  [-122.73, -71.43],
  [35.22, -61.88],
  [-49.11, -38.35],
  [-122.62, 71.62],
  [124.55, -63.84],
  [35.98, 68.52],
  [97.89, 102.87],
];
export const LINKS: [number, number][] = [
  [4, 14], [8, 10], [4, 10], [14, 15], [1, 14], [4, 11], [7, 11], [1, 6], [0, 7], [7, 9],
  [3, 9], [2, 13], [6, 12], [5, 12], [0, 8], [3, 12], [5, 11], [8, 13], [2, 15],
];

// ---------------------------------------------------------------------------
// THE TIMING. f0 = 19.75 s; frame = round((t - 19.75) * 24).
// ---------------------------------------------------------------------------
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// 1. the three lines write on behind the caret, one clock
export const WRITE_AT = 3; // the caret grows in f0-3
export const WRITE_END = 39; // "language" ends
export const WRITE_RATE = (3 * LINE_W) / (WRITE_END - WRITE_AT); // 41.67 world px/f

// 2. the chain crown on "superb"
export const CROWN_TRAVEL = 22;
export const CHAIN = [
  { key: "orange", color: ORANGE, step: 18, at: 51 },
  { key: "purple", color: PURPLE, step: 12, at: 53 },
  { key: "blue", color: BLUE, step: 6, at: 55 },
] as const;

// 3. the person rises into place on the pull-back's own clock, then the
//    thread draws up from the landed head to the block
export const RISE = 550; // world px below its rest at the open
export const PULL_F0 = 62;
export const PULL_F1 = 94;
export const PULL_WARP = 0.7;
/** THE ONE CLOCK of the pull-back and the rise: 0 -> 1 over f62-92, speed early. */
export const pullG = (f: number) => camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), PULL_WARP);
/** The person's offset below its rest, world px. */
export const riseAt = (f: number) => RISE * (1 - pullG(f));
export const THREAD_F0 = 90;
export const THREAD_F1 = 98;
const EASE_THREAD = Easing.bezier(0.45, 0, 0.25, 1);

// 4. the head opens
export const IRIS_F0 = 93;
export const IRIS_F1 = 107;
const EASE_IRIS = Easing.bezier(0.45, 0, 0.2, 1);

// 5. the mind wires itself up
export const WAVE_F0 = 112;
export const WAVE_SPAN = 16; // start frames spread over this, by height
export const LINK_F = 6;
export const WAVE_JITTER = 1.2;
const DOT_Y_MAX = Math.max(...DOTS.map((d) => d[1]));
const LOWER_Y_MIN = Math.min(...LINKS.map(([a, b]) => Math.max(DOTS[a][1], DOTS[b][1])));
/** each link: its lower dot, upper dot, and start frame */
export const WAVE = LINKS.map(([a, b], i) => {
  const lo = DOTS[a][1] >= DOTS[b][1] ? a : b;
  const hi = lo === a ? b : a;
  const u = (DOT_Y_MAX - DOTS[lo][1]) / (DOT_Y_MAX - LOWER_Y_MIN);
  const jit = (hash(i, 7) - 0.5) * 2 * WAVE_JITTER;
  const start = Math.min(WAVE_F0 + WAVE_SPAN, Math.max(WAVE_F0, WAVE_F0 + u * WAVE_SPAN + jit));
  return { lo, hi, start };
});

// 6. et cetera, et cetera: two beads up the thread, two new lines
/** A bead is r 12, so it fits wholly behind a 28 px bar; it starts inside the
 *  (r 16) top dot and emerges from it. */
export const BEAD_R = 12;
export const BEAD_DEPART = [134, 143];
export const BEAD_T = 7; // frames from the top dot to the bar's centre line
export const BEAD_TA = 3; // frames of acceleration from rest
export const BEAD_Y0 = HY + DOTS[0][1]; // the top dot
export const BEAD_Y1 = BB - BAR_H / 2; // behind the bottom bar
export const BEAD_D = BEAD_Y0 - BEAD_Y1;
export const BEAD_V = BEAD_D / (BEAD_T - BEAD_TA / 2);
/** Upward travel of a bead t frames after it leaves: a C1 acceleration from rest
 *  over BEAD_TA, then a steady cruise into the block. */
export const beadDist = (t: number) => {
  if (t <= 0) return 0;
  if (t < BEAD_TA) {
    const u = t / BEAD_TA;
    return BEAD_V * BEAD_TA * (u * u * u - (u * u * u * u) / 2);
  }
  return Math.min(BEAD_D, (BEAD_V * BEAD_TA) / 2 + BEAD_V * (t - BEAD_TA));
};
/** The frame each bead is wholly behind the bottom bar: the push starts. */
export const ARRIVE = BEAD_DEPART.map((d) => d + BEAD_T);
export const PUSH_F = 8;
export const NEW_WRITE_LAG = 4; // arrival -> the new line's writing clock
export const NEW_RATE = LINE_W / 8; // 62.5 world px/f: a line in 8 f

// ---------------------------------------------------------------------------
// THE BLOCK'S STATE at frame f.
// ---------------------------------------------------------------------------
export const pushAt = (j: number, f: number) => EASE_LAND(clamp01((f - ARRIVE[j]) / PUSH_F));
/** The slot (lines above the bottom) of line i at frame f. */
export const slotOf = (i: number, f: number) => {
  const base = i <= 2 ? 2 - i : 0;
  let s = base;
  if (i <= 2) s += pushAt(0, f);
  if (i <= 3) s += pushAt(1, f);
  return s;
};
export const barTopOf = (i: number, f: number) => BB - BAR_H - slotOf(i, f) * PITCH;

type Caret = { x: number; cy: number; h: number } | null;
type Writing = { widths: number[][]; caret: Caret };
const caretH = (f: number, w0: number, w1: number) => {
  const grow = clamp01((f - (w0 - CARET_IN)) / CARET_IN);
  const thin = clamp01((f - w1) / CARET_OUT);
  return AI_CARET_H * grow * (1 - thin);
};
/** Every line's drawn bar widths and the caret, for frame f. */
export const writingAt = (f: number): Writing => {
  const widths = LINES.map((bars) => bars.map(() => 0));
  let caret: Caret = null;
  const fill = (i: number, L: number) => {
    LINES[i].forEach((w, k) => {
      widths[i][k] = Math.max(0, Math.min(w, L - LINE_STARTS[i][k]));
    });
  };
  // the first three lines, on one clock
  const L0 = Math.min(3 * LINE_W, Math.max(0, (f - WRITE_AT) * WRITE_RATE));
  for (let i = 0; i < 3; i++) fill(i, L0 - i * LINE_W);
  const h0 = caretH(f, WRITE_AT, WRITE_END);
  if (h0 >= 0.5) {
    const line = Math.min(2, Math.floor(L0 / LINE_W));
    caret = {
      x: LINE_X0 + (L0 - line * LINE_W) + AI_CARET_LEAD,
      cy: barTopOf(line, f) + BAR_H / 2,
      h: h0,
    };
  }
  // the two new lines, one per bead, written by ONE caret: it grows in before
  // line 3's clock, waits at line 3's end while bead 2's push lifts it, wraps to
  // line 4's start when that clock begins, and thins away when line 4 is whole.
  const W = [0, 1].map((j) => ARRIVE[j] + NEW_WRITE_LAG);
  const Ls = W.map((w0) => Math.min(LINE_W, Math.max(0, (f - w0) * NEW_RATE)));
  fill(3, Ls[0]);
  fill(4, Ls[1]);
  const h1 = caretH(f, W[0], W[1] + LINE_W / NEW_RATE);
  if (h1 >= 0.5) {
    const i = f < W[1] ? 3 : 4;
    const L = f < W[1] ? Ls[0] : Ls[1];
    caret = { x: LINE_X0 + L + AI_CARET_LEAD, cy: barTopOf(i, f) + BAR_H / 2, h: h1 };
  }
  return { widths, caret };
};
/** The new lines' writing clocks (the caret wraps from line 3 to 4 at W_NEW[1]). */
export const W_NEW = [0, 1].map((j) => ARRIVE[j] + NEW_WRITE_LAG);

// ---------------------------------------------------------------------------
// THE CAMERA — keyed eased glides (`camMove`: cy = content centre + CAM_LIFT / k,
// so the centre sits on screen y 835), damped by cottageShared's runCamera2.
// ---------------------------------------------------------------------------
export const CROWN_TOP_REST = BB - BAR_H - 2 * PITCH - CHAIN[0].step; // 554
export const FIGURE_BOTTOM = BODY_BOTTOM + SHADOW; // 1592
export const K_OPEN = 1.8;
export const K_CREEP = K_OPEN + 0.02;
/** The 3-line block's centre, at the open. */
export const C_OPEN = BB - (BAR_H + 2 * PITCH) / 2; // 636
/** The whole figure, crown to foot, at rest. */
export const C_REST = (CROWN_TOP_REST + FIGURE_BOTTOM) / 2; // 1073
export const K_REST = 0.94;
export const K_LATE = K_REST - 0.02;
/** Late: the 5-line block's crown top on screen y LATE_TOP_SCREEN at K_LATE. */
export const LATE_TOP_SCREEN = 336;
export const CROWN_TOP_LATE = CROWN_TOP_REST - 2 * PITCH; // 454
export const C_LATE = CROWN_TOP_LATE + (835 - LATE_TOP_SCREEN) / K_LATE;
export const CREEP_F1 = PULL_F0;
export const LATE_F1 = 170; // lands on the last frames; the sway carries the hold

const M1 = camMove({ f0: 0, f1: CREEP_F1, k0: K_OPEN, k1: K_CREEP, c0: C_OPEN, c1: C_OPEN, warp: 1 });
// THE PULL is a pure zoom about one fixed point. Easing the centre and k
// linearly between the two framings makes (y - c) * k non-monotonic for the
// block (its top overshot the rest by 22 screen px and sank back). The two
// framings share exactly one world y that sits on the same screen y in both:
// PIVOT_Y, on screen PIVOT_S. Holding it there while k eases (log-linear, so
// the zoom reads as one steady rate) moves every point of the world straight
// toward it, monotonically: the block rises, the person comes up from below.
export const PIVOT_Y = (C_OPEN * K_CREEP - C_REST * K_REST) / (K_CREEP - K_REST);
export const PIVOT_S = 835 + (PIVOT_Y - C_OPEN) * K_CREEP;
const M2 = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let f = PULL_F0; f <= PULL_F1; f++) {
    const k = K_CREEP * Math.pow(K_REST / K_CREEP, pullG(f));
    F.push(f);
    K.push(k);
    CY.push(PIVOT_Y + (FRAME_H / 2 - PIVOT_S) / k);
  }
  return { F, K, CY };
})();
const M3 = camMove({ f0: PULL_F1, f1: LATE_F1, k0: K_REST, k1: K_LATE, c0: C_REST, c1: C_LATE, warp: 1 });
export const CAM_F = [...M1.F, ...M2.F.slice(1), ...M3.F.slice(1)];
export const CAM_K = [...M1.K, ...M2.K.slice(1), ...M3.K.slice(1)];
export const CAM_CY = [...M1.CY, ...M2.CY.slice(1), ...M3.CY.slice(1)];
export const CAM_CX = CAM_F.map(() => CX);
/** The damped camera at frame f, without the hand's sway. */
export const camAt = (f: number) => runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K);
export const toScreen = worldToScreen;

// ---------------------------------------------------------------------------
export const schema = z.object({
  // which lines wear the chain: "top" = only the top line, "all" = every bar
  crown: z.enum(["top", "all"]),
  // the hand on the camera
  sway: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ crown: "top", sway: true });

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
const ringPath = (cx: number, cy: number, R: number, r: number) => {
  const outer = `M${cx - R} ${cy} a${R} ${R} 0 1 0 ${2 * R} 0 a${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  if (r < 0.25) return outer;
  return `${outer} M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
};
const BODY_PATH = (() => {
  const x0 = CX - BODY_HALF_W;
  const x1 = CX + BODY_HALF_W;
  const flat = BODY_HALF_W - BODY_TOP_R;
  const R = BODY_TOP_R;
  const r = BODY_FOOT_R;
  return [
    `M${CX - flat} ${BODY_TOP}`,
    `H${CX + flat}`,
    `A${R} ${R} 0 0 1 ${x1} ${BODY_TOP + R}`,
    `V${BODY_BOTTOM - r}`,
    `A${r} ${r} 0 0 1 ${x1 - r} ${BODY_BOTTOM}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${BODY_BOTTOM - r}`,
    `V${BODY_TOP + R}`,
    `A${R} ${R} 0 0 1 ${CX - flat} ${BODY_TOP}`,
    "Z",
  ].join(" ");
})();

const ProxyForIntelligenceV2: React.FC<Props> = ({ crown, sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };
  const w = writingAt(frame);

  // -- the block's bars ---------------------------------------------------------
  const bar = (i: number, k: number, width: number, dy: number, off: number, fill: string) =>
    width < 0.5 ? null : (
      <rect
        key={`${i}-${k}-${off}-${fill}`}
        x={LINE_X0 + LINE_STARTS[i][k] + off}
        y={barTopOf(i, frame) - dy + off}
        width={width}
        height={BAR_H}
        rx={Math.min(BAR_H / 2, width / 2)}
        fill={fill}
      />
    );
  const allBars = (off: number, fill: string) =>
    LINES.map((bars, i) => bars.map((_, k) => bar(i, k, w.widths[i][k], 0, off, fill)));

  const crowned = crown === "top" ? [0] : [0, 1, 2];
  const crownLayer = CHAIN.map((c) => {
    const dy = c.step * EASE_LAND(clamp01((frame - c.at) / CROWN_TRAVEL));
    if (dy < 0.5) return null;
    return (
      <g key={c.key}>
        {crowned.map((i) => LINES[i].map((width, k) => bar(i, k, width, dy, 0, c.color)))}
      </g>
    );
  });

  // -- the person rises into place on the pull-back's clock ----------------------
  const rise = riseAt(frame);
  const hy = HY + rise;

  // -- the thread: from inside the ring's band at the head's top ------------------
  const threadY0 = HEAD_TOP + 3 + rise;
  const threadU = EASE_THREAD(clamp01((frame - THREAD_F0) / (THREAD_F1 - THREAD_F0)));
  const threadTip = threadY0 - (threadY0 - (BB - STROKE / 2)) * threadU;
  const thread = (off: number, stroke: string) =>
    frame > THREAD_F0 ? (
      <line
        x1={CX + off}
        y1={threadY0 + off}
        x2={CX + off}
        y2={threadTip + off}
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    ) : null;

  // -- the head -----------------------------------------------------------------
  const holeR = HOLE_R * EASE_IRIS(clamp01((frame - IRIS_F0) / (IRIS_F1 - IRIS_F0)));
  const head = (off: number, fill: string) => (
    <path d={ringPath(CX + off, hy + off, HEAD_R, holeR)} fill={fill} fillRule="evenodd" />
  );
  const body = (off: number, fill: string) => (
    <path d={BODY_PATH} transform={`translate(${off} ${off + rise})`} fill={fill} />
  );

  // -- the mind -----------------------------------------------------------------
  const dot = (i: number) => ({ x: CX + DOTS[i][0], y: hy + DOTS[i][1] });
  const inset = DOT_R - STROKE / 2; // the link's round cap ends on the dot's edge
  const links = WAVE.map((l, i) => {
    const g = smoothstep((frame - l.start) / LINK_F);
    if (g <= 0) return null;
    const a = dot(l.lo);
    const b = dot(l.hi);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const sx = a.x + ux * inset;
    const sy = a.y + uy * inset;
    const run = (len - 2 * inset) * g;
    return { key: i, sx, sy, ex: sx + ux * run, ey: sy + uy * run };
  }).filter((l): l is NonNullable<typeof l> => l !== null);
  const linkLines = (off: number, stroke: string) =>
    links.map((l) => (
      <line
        key={`l${l.key}-${off}`}
        x1={l.sx + off}
        y1={l.sy + off}
        x2={l.ex + off}
        y2={l.ey + off}
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    ));
  const dots = (off: number, fill: string) =>
    DOTS.map((_, i) => {
      const p = dot(i);
      return <circle key={`d${i}-${off}`} cx={p.x + off} cy={p.y + off} r={DOT_R} fill={fill} />;
    });

  // -- the beads ----------------------------------------------------------------
  const beads = BEAD_DEPART.map((dep, j) => {
    const t = frame - dep;
    if (t <= 0) return null;
    const y = BEAD_Y0 - beadDist(t);
    if (y <= BB - BEAD_R) return null; // wholly behind the bottom bar: absorbed
    return (
      <g key={`bead${j}`}>
        <circle cx={CX + SHADOW} cy={y + SHADOW} r={BEAD_R} fill={BLACK} />
        <circle cx={CX} cy={y} r={BEAD_R} fill={WHITE} />
      </g>
    );
  });

  const c = w.caret;
  const caretRect = (off: number, fill: string) =>
    c ? (
      <rect
        x={c.x + off}
        y={c.cy - c.h / 2 + off}
        width={AI_CARET_W}
        height={c.h}
        rx={Math.min(AI_CARET_W / 2, c.h / 2)}
        fill={fill}
      />
    ) : null;

  return (
    <World
      frame={frame}
      cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }}
      rest={{ cx: CAM_CX[0], cy: CAM_CY[0] }}
    >
      {/* THE MIND, under the head: shadows, then links, then dots */}
      <g>
        {linkLines(SHADOW, BLACK)}
        {dots(SHADOW, BLACK)}
        {linkLines(0, WHITE)}
        {dots(0, WHITE)}
      </g>

      {/* every hard shadow of the figure and the block, one layer */}
      <g>
        {body(SHADOW, BLACK)}
        {head(SHADOW, BLACK)}
        {thread(SHADOW, BLACK)}
        {allBars(SHADOW, BLACK)}
      </g>

      {/* the chain: copies of the finished block, behind its white */}
      {crownLayer}

      {/* the figure's white */}
      <g>
        {body(0, WHITE)}
        {head(0, WHITE)}
        {thread(0, WHITE)}
      </g>

      {/* the beads ride over the ring and the thread, and go in behind the bar */}
      {beads}

      {/* the block's white, then the caret */}
      <g>{allBars(0, WHITE)}</g>
      {caretRect(SHADOW, BLACK)}
      {caretRect(0, WHITE)}
    </World>
  );
};

export default ProxyForIntelligenceV2;
