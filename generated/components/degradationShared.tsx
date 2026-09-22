import { Img, staticFile } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
} from "./fieldShared";
import {
  DASH_OFF_PX,
  DASH_ON_PX,
  INK,
  INK_HI,
  INK_LO,
  MARCH_PX_PER_F,
  PACKET_R_PX,
  PERSON_H_PX,
  STROKE_PX,
  THREAD_PX,
  TWO_PI,
  lerp,
  linkPackets,
} from "./alignShared";
import { OPENAI } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// degradationShared — the WORLD of the Noam Brown clip
// `Noam_Alignment_Degradation`. Orange Dwarkesh style, grid background,
// 24 fps, 1080x1920, opaque, muted.
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone, the errors
// compound and the lineage curls away from what the humans wanted. Corrected
// every generation, it straightens onto the humans' line.**
//
// ONE WORLD, ONE CLOCK, FIVE WINDOWS. Global frame `G = round((t - 4.440) *
// 24)`, origin = cut 1's in-point 0:04.440. Every cut renders `<World G={
// CUT_OFFSET + frame} k={k} />` and nothing in the world is keyed to a cut: a
// cut only chooses where the camera is. That is how cut N picks up exactly
// what cut N-1 left standing, and what happened in the gap nobody saw.
//
// ---------------------------------------------------------------------------
// THE VOCABULARY — fixed for the whole clip. <= 5 element types on any frame.
//
//   A GENERATION OF MODELS = the OpenAI mark (`OPENAI` from brandGlyphs),
//     FILLED in the accent tone, MARK_PX 88 world px across its em box, with
//     the per-icon shadow on a wrapper OUTSIDE the scale group. ORANGE MEANS
//     THE MODELS AND NOTHING ELSE. A mark's TONE IS ITS ALIGNMENT:
//     `toneOf(dev) = 1 - clamp01(dev / 60)`, ACCENT (ripe) = aligned with the
//     humans, ACCENT_DEEP (deep) = far off. Tone changes only when the
//     mechanism reaches the mark — its arrow lands, or the correction wave
//     arrives — never on a timer. Solid, no stroke, never transparent.
//
//   THE HUMANS = five `person.png` glyphs, white, PERSON_H_PX 118, a loose
//     shallow arc (spacing 130 px, hashed y offsets) at the base of the world.
//     THEY NEVER MOVE (beyond their own <= 3 px sway).
//
//   AN ARROW = "what its owner thinks aligned is", AND the link along which the
//     next generation is made. White INK_HI, STROKE_PX 6.5 round caps, open
//     chevron head. It runs from the owner's rim + RIM_GAP to where the child's
//     rim will be: the child's centre is D = 220 world px along the arrow's
//     direction, so the shaft is D - 2*(MARK_R + RIM_GAP) = 104 px long and the
//     head touches the child's future rim. The humans' arrow points STRAIGHT UP
//     from ARROW_BASE (their group's top + 30 px). A generation's arrow is a
//     COPY of its maker's arrow, slid along by D and turned by that
//     generation's inherited error. Packets ride arrows: white on the humans'
//     arrow, ACCENT on a mark's arrow, at a slow idle rate always and at the
//     build rate while that arrow is building its child.
//
//   THE GUIDE = the humans' direction extended to infinity: a dashed white line
//     at INK_LO, THREAD_PX, from ARROW_BASE straight up GUIDE_LEN world px,
//     dashes DASH_ON/DASH_OFF marching UP at MARCH_PX_PER_F forever. Drawn
//     UNDER the marks. ON THE GUIDE = ALIGNED.
//
//   BUILD THREADS = scaffolding, AND ONLY FOR GENERATION 1. White THREAD_PX at
//     INK_LO from a person's head-top to the forming mark, with white packets;
//     they draw head-led when the build starts, retract to the mark's rim as it
//     fills, and fade to 0 over 20 f after the mark's arrow has landed. Five of
//     them, and a short fan is what they are. FROM GENERATION 2 THE HUMANS'
//     HELP IS A PACKET, NOT A THREAD: a thread from a head to gen 2 is a long
//     diagonal across the whole picture and gen 3's would be longer still, so
//     instead WHITE THROUGH-PACKETS launch from ARROW_BASE, ride up the humans'
//     arrow, pass THROUGH every generation already standing (drawn under the
//     marks) and are absorbed into the one being formed — the same packet, size,
//     speed and white as the ones on the humans' own arrow. Gen 2 at the build
//     rate, gen 3 sparser (period 10), GEN 4 ONWARD NOTHING: from there the
//     models build the models and the people's help does not arrive at all.
//
// White ink at EXACTLY two opacities, INK_HI 1.0 and INK_LO 0.55. No third
// level, no other colour, no boxes, no numerals, no labels: the count IS the
// picture.
//
// ONE STROKE FAMILY. Everything that is a LINE is written in SCREEN px and
// divided by the live k (`strokeW`, `threadW`, `packetR`, `headLen`, the
// dashes), so a stroke is 6.5 screen px and a thread 3.25 at every zoom in
// every cut. Everything that is an OBJECT — MARK 88, PERSON_H 118, D 220, the
// node positions — is WORLD px and scales with the camera. K_REF is 1.0, so at
// k = 1 the two are the same number.
//
// ---------------------------------------------------------------------------
// THE GEOMETRY — the lineage. Deviation from straight up in degrees, positive =
// clockwise (to the RIGHT on screen), for the arrow OWNED by each node:
//
//   THETA = [0, 0.5, 1.5, 4, 9, 17, 28, 42, 58, 74, 88]
//
// index 0 = the humans' arrow, index n = generation n's arrow (n = 1..10).
// P[0] = ARROW_BASE; P[n+1] = P[n] + D * (sin th_n, -cos th_n) (world y down).
// Generation n's mark sits at P[n]; gen 10's own arrow (88 deg) points almost
// horizontally right at a generation that is never made.
//
// RESOLVED AT G612 (every arrow landed, nothing corrected yet), world px, with
// ARROW_BASE = (540.000, 1626.455) — the highest of the five heads' ink, 30 up:
//   P[ 0] = ( 540.000, 1626.455)      P[ 6] = ( 661.763,  319.396)
//   P[ 1] = ( 540.000, 1406.455)      P[ 7] = ( 765.046,  125.148)
//   P[ 2] = ( 541.920, 1186.463)      P[ 8] = ( 912.255,  -38.344)
//   P[ 3] = ( 547.679,  966.539)      P[ 9] = (1098.826, -154.926)
//   P[ 4] = ( 563.025,  747.075)      P[10] = (1310.303, -215.567)
//   P[ 5] = ( 597.441,  529.783)
// The ten marks span 770.303 px wide and 1842.022 px tall above the base, and
// gen 10 sits 1,516 px to the right of the guide it should have been on.
// Bounding box of the ten mark boxes at G612 (centres +/- MARK_R 44):
//   x  496.000 .. 1354.303   (width  858.303)
//   y -259.567 ..  1450.455  (height 1710.022)
// `bounds(612)`, which also takes in the people's ink, the humans' arrow and
// every standing arrow, is x 230.440 .. 1472.204, y -259.567 .. 1774.505.
// An arrow's shaft is 104 px between two marks and 148 px out of the base.
//
// STRAIGHTENING (cut 5): each generation's deviation goes to 0, and because a
// child sits at its parent's arrow tip, turning gen n's arrow SWINGS every
// descendant with it — the whole spiral unrolls onto the guide. `nodesAt(G)`
// is computed kinematically from the LIVE deviations every frame; there is no
// second set of positions anywhere in this clip.
//
// ---------------------------------------------------------------------------
// THE SCHEDULE — global frames. The world IS this table; a cut may not move it.
//
//   gen | build packets | humans' help | mark fill | copy (arrow lands) | fade
//     1 | G10 (humans)  | threads G6-16| G14-36    | G40-54             | G56-76
//     2 | G123 (gen 1)  | through, p5  | G146-172  | G172-188           | -
//     3 | G196          | through, p10 | G226-268  | G268-284           | -
//     4 | G286          | -            | G292-310  | G310-324           | -
//     5 | G326          | -            | G330-344  | G344-356           | -
//     6 | G358          | -            | G360-372  | G372-384           | -
//     7 | G390          | -            | G410-500  | G500-514           | -
//     8 | G516          | -            | G520-540  | G540-552           | -
//     9 | G554          | -            | G556-572  | G572-584           | -
//    10 | G586          | -            | G588-600  | G600-612           | -
//
// BUILD = packets stream along the maker's arrow (and the build threads) into
// the child's spot and the child's mark is revealed by a circular mask growing
// from its centre in step with the arrivals. A forming mark is drawn at ITS
// MAKER'S TONE. COPY = a duplicate of the maker's arrow slides D along its own
// direction over the copy window (eased, warp 0.8) rotating by
// (th_child - th_maker) as it goes, and lands as the child's own arrow; the
// child's tone ramps to its own over the same window, and the packets on the
// maker's arrow drop back to idle as the copy lands.
//
// "through, pN" = the humans' white through-packets, launched from ARROW_BASE
// every N frames from that generation's first build packet until its own arrow
// lands, and absorbed at its node after riding the chain through every
// generation below it (gen 2: 440 world px, 24.4 frames; gen 3: 660, 36.7).
//
// Also: the humans' arrow draws head-led G0-14, before anything else exists.
// The guide draws head-led from ARROW_BASE upward from G36 at GUIDE_DRAW_V
// world px/f, marching from its first frame, and is complete at G130. HOLD
// G612-688: nothing new forms; idle packets, marching dashes and sway carry it.
//
// CORRECTION WAVE (cut 5): a white packet train (same packet size, period 4)
// launches from ARROW_BASE at G681 and runs up the chain along the arrows at
// D per WAVE_F frames (220 px / 7 f), THROUGH each mark. Gen n's arrow starts
// turning to 0 the frame the front reaches its centre — G688 + 7(n-1) — and
// turns over TURN_F 18 frames (eased); its tone ramps to 1 over the same 18.
// Order is strictly from the base up, the last turn finishes at G769, and the
// train is still running at G790 so the clip does not resolve to stillness.
//
// ---------------------------------------------------------------------------
// WHAT A CUT MAY AND MAY NOT DO.
//   MAY: choose its camera; choose which part of the world is in frame; read
//        `nodesAt`, `stateAt`, `bounds`, `CAM-independent` helpers; add its own
//        measurement assertions.
//   MAY NOT: change a frame in the schedule, add an element type, move a node,
//        re-tone a mark, key anything to its own frame numbers, edit or
//        redefine anything this module exports. Append only, and only if that
//        cut's brief says so.
// ---------------------------------------------------------------------------

export const FPS = 24;

export { ACCENT, ACCENT_DEEP, INK, INK_HI, INK_LO, lerp, TWO_PI };

/** The camera every screen-px size below is solved at. */
export const K_REF = 1.0;
/** A screen-px size in world px at camera zoom `k`. */
export const worldPx = (px: number, k: number = K_REF) => px / k;

/** Nothing in this clip moves more than this, screen px per frame. */
export const SPEED_CAP_SCREEN = 45;

// --- the line family: SCREEN px, divided by the live k ----------------------
export { DASH_OFF_PX, DASH_ON_PX, MARCH_PX_PER_F, PACKET_R_PX, STROKE_PX, THREAD_PX };
export const strokeW = (k: number) => STROKE_PX / Math.max(k, 1e-4);
export const threadW = (k: number) => THREAD_PX / Math.max(k, 1e-4);
/**
 * A PACKET IS A BEAD ON THE LINE IT RIDES, and it is sized against that line
 * rather than absolutely: PACKET_R_PX 3.6 is alignShared's radius on a
 * THREAD_PX 3.25 link, i.e. a bead 2.215x the width of its line. Held at 3.6 on
 * this clip's STROKE_PX 6.5 arrows a packet is 7.2 px across on a 6.5 px white
 * shaft — measured on the f26 still, a white packet on the humans' white arrow
 * was simply not there. Scaling it by the line keeps ONE rule and makes both
 * kinds read: 7.2 px across on a thread, 14.4 on an arrow.
 */
export const packetR = (k: number, lineW: number = THREAD_PX) =>
  (PACKET_R_PX * (lineW / THREAD_PX)) / Math.max(k, 1e-4);
/** The open chevron head: 26 screen px from tip to barb. */
export const HEAD_PX = 26;
export const headLen = (k: number) => HEAD_PX / Math.max(k, 1e-4);
export const dashArray = (k: number) =>
  `${(DASH_ON_PX / Math.max(k, 1e-4)).toFixed(3)} ${(DASH_OFF_PX / Math.max(k, 1e-4)).toFixed(3)}`;
export const dashOffset = (G: number, k: number) => -(MARCH_PX_PER_F * G) / Math.max(k, 1e-4);

// --- the objects: WORLD px --------------------------------------------------
/** A generation's mark: its em box, world px. */
export const MARK_PX = 88;
export const MARK = worldPx(MARK_PX);
export const MARK_R = MARK / 2;
/**
 * The radius a circular reveal has to reach to have uncovered all of the mark.
 * NOT the box's half-diagonal: the OpenAI glyph's ink runs x 0.164..23.836 and
 * y 0..24 on its 24 box and is a knot, so it touches the box edge at 12 and 6
 * o'clock and leaves the four corners empty — its furthest ink from the centre
 * is MARK_R. At the half-diagonal (62.2) the mark looked finished at 70% of its
 * own fill window and the last eight frames only uncovered empty corners.
 */
export const MARK_COVER_R = MARK_R * 1.02;
export { PERSON_H_PX };
export const PERSON_H = worldPx(PERSON_H_PX);
/** person.png's ink is 0.84 of its box. */
export const PERSON_INK = 0.84;
/** Centre to centre along an arrow: one generation. */
export const D = 220;
/** The air between a rim and the ink of the arrow that touches it. */
export const RIM_GAP = 14;

/**
 * The mark is a FILLED shape, so its per-icon shadow is lighter than the one on
 * a stroke: an identical filter under a solid body lays down a contiguous block
 * of shadow rather than a lift. 0.27 is the value challengeShared's `ModelMark`
 * was approved at, for the same mark at a smaller size.
 */
export const MARK_SHADOW_OPACITY = 0.27;

/** deep -> ripe. A mark's state is this ramp, never its alpha. */
export const TONE = makeTone(ACCENT_DEEP, ACCENT);

// ---------------------------------------------------------------------------
// THE PEOPLE. Five glyphs in a loose shallow arc at the base of the world —
// never a row: the ends sit a little low and every one of them is off its
// nominal y by a hashed amount. They never move.
// ---------------------------------------------------------------------------
export const PEOPLE_CX = 540;
export const PEOPLE_Y = 1700;
export const PEOPLE_STEP = 130;

export type Person = { x: number; y: number; seed: number };

export const PEOPLE: Person[] = Array.from({ length: 5 }, (_, i) => {
  const t = (i - 2) / 2;
  return {
    x: PEOPLE_CX + (i - 2) * PEOPLE_STEP,
    y: PEOPLE_Y + 13 * t * t + (hash(i, 17) - 0.5) * 24,
    seed: i,
  };
});

/** The top of a person's INK. */
export const headTop = (p: Person) => p.y - (PERSON_H * PERSON_INK) / 2;

/** The humans' arrow starts 30 px above the group's highest head. */
export const ARROW_BASE = {
  x: PEOPLE_CX,
  y: Math.min(...PEOPLE.map(headTop)) - 30,
};

// ---------------------------------------------------------------------------
// THE LINEAGE.
// ---------------------------------------------------------------------------
export const THETA = [0, 0.5, 1.5, 4, 9, 17, 28, 42, 58, 74, 88];
export const GENS = 10;

export const DEG = Math.PI / 180;
/** The unit vector an arrow at `deg` from straight up points along. */
export const dirOf = (deg: number) => ({ x: Math.sin(deg * DEG), y: -Math.cos(deg * DEG) });

/** A mark's alignment, read off its own deviation: 1 = on the humans' line. */
export const toneOf = (deviationDeg: number) => 1 - clamp01(Math.abs(deviationDeg) / 60);

// --- the correction wave ----------------------------------------------------
/** The train launches from ARROW_BASE here... */
export const WAVE_G0 = 681;
/** ...one packet every this many frames... */
export const WAVE_PERIOD = 4;
/** ...and covers one generation (D world px) in this many frames. */
export const WAVE_F = 7;
export const WAVE_V = D / WAVE_F;
/** A generation turns over this many frames once the front reaches its centre. */
export const TURN_F = 18;
/** When gen n starts turning: the frame the front reaches P[n]. */
export const turnAt = (n: number) => WAVE_G0 + WAVE_F * n;
/** 0..1: how far through its turn generation n is at G. */
export const correctionT = (n: number, G: number) =>
  n < 1 ? 0 : smoothstep(clamp01((G - turnAt(n)) / TURN_F));

/** The LIVE deviation of the arrow owned by node n, degrees. */
export const deviationAt = (n: number, G: number) =>
  n <= 0 ? 0 : THETA[n] * (1 - correctionT(n, G));

export type Node = { x: number; y: number };

/** P[0..10] at G, kinematically from the live deviations. */
export const nodesAt = (G: number): Node[] => {
  const out: Node[] = [{ x: ARROW_BASE.x, y: ARROW_BASE.y }];
  for (let n = 0; n < GENS; n++) {
    const d = dirOf(deviationAt(n, G));
    const p = out[n];
    out.push({ x: p.x + D * d.x, y: p.y + D * d.y });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE SCHEDULE, as data.
// ---------------------------------------------------------------------------
export type Sched = {
  /** the generation this row makes */
  n: number;
  /** the frame build packets start on the maker's arrow */
  packets: number;
  /** the build threads' head-led draw window, or null */
  threads: [number, number] | null;
  /** which people those threads come from */
  threadPeople: number[];
  /** the mark's circular reveal */
  fill: [number, number];
  /** the maker's arrow duplicating, sliding D and landing as this gen's own */
  copy: [number, number];
  /** the threads fading to nothing, or null */
  fade: [number, number] | null;
  /** the frames the build's packet rate SURGES on. A build is one mechanism;
   *  a doubled phrase in the line is two surges inside it, never two builds. */
  surges: number[];
};

const ALL5 = [0, 1, 2, 3, 4];

export const SCHEDULE: Sched[] = [
  // gen 1's two surges are the doubled phrase "we make them, we make them" —
  // ONE build, seen twice. Gen 2's are "we use these models" and the frame the
  // five white threads reach past gen 1 on "to help us with".
  { n: 1, packets: 10, threads: [6, 16], threadPeople: ALL5, fill: [14, 36], copy: [40, 54], fade: [56, 76], surges: [10, 26] },
  { n: 2, packets: 123, threads: null, threadPeople: [], fill: [146, 172], copy: [172, 188], fade: null, surges: [123, 140] },
  { n: 3, packets: 196, threads: null, threadPeople: [], fill: [226, 268], copy: [268, 284], fade: null, surges: [196, 226] },
  { n: 4, packets: 286, threads: null, threadPeople: [], fill: [292, 310], copy: [310, 324], fade: null, surges: [288] },
  { n: 5, packets: 326, threads: null, threadPeople: [], fill: [330, 344], copy: [344, 356], fade: null, surges: [328] },
  { n: 6, packets: 358, threads: null, threadPeople: [], fill: [360, 372], copy: [372, 384], fade: null, surges: [360] },
  { n: 7, packets: 390, threads: null, threadPeople: [], fill: [410, 500], copy: [500, 514], fade: null, surges: [392, 430, 470] },
  { n: 8, packets: 516, threads: null, threadPeople: [], fill: [520, 540], copy: [540, 552], fade: null, surges: [518] },
  { n: 9, packets: 554, threads: null, threadPeople: [], fill: [556, 572], copy: [572, 584], fade: null, surges: [556] },
  { n: 10, packets: 586, threads: null, threadPeople: [], fill: [588, 600], copy: [600, 612], fade: null, surges: [588] },
];

export const sched = (n: number) => SCHEDULE[n - 1];

/** The whole world is 790 frames: cut 5's offset plus its duration. */
export const WORLD_FRAMES = 790;
/** The hold: everything has landed, nothing new forms, the wave has not come. */
export const HOLD = [612, 688] as const;

/** Global frame offsets of the five cuts. Asserted in each cut file. */
export const CUT_OFFSETS = {
  WeMakeThem: 0,
  NextGeneration: 119,
  IncreasingDegradation: 261,
  MisalignmentFromHumans: 516,
  MoreAndMoreAligned: 685,
} as const;

// --- the three mechanisms, as functions of G --------------------------------
const win = (G: number, w: [number, number], warp = 1) =>
  smoothstep(Math.pow(clamp01((G - w[0]) / (w[1] - w[0])), warp));

/** 0..1: generation n's mark revealed by its circular mask. */
export const buildAt = (n: number, G: number) => win(G, sched(n).fill);
/** 0..1: the maker's arrow duplicating, sliding D and landing as gen n's own. */
export const copyAt = (n: number, G: number) => win(G, sched(n).copy, 0.8);

export type Threads = { draw: number; opacity: number; people: number[] };

/** Generation n's build threads at G: head-led draw, then a fade to nothing. */
export const threadsAt = (n: number, G: number): Threads => {
  const s = sched(n);
  if (!s.threads) return { draw: 0, opacity: 0, people: [] };
  const draw = win(G, s.threads);
  const fade = s.fade ? win(G, s.fade) : 0;
  return { draw, opacity: INK_LO * (1 - fade), people: s.threadPeople };
};

/** A mark's own tone once it is itself, and the tone it is BORN at. */
export const ownTone = (n: number) => toneOf(THETA[n]);
const makerTone = (n: number) => (n <= 1 ? 1 : ownTone(n - 1));

/** Generation n's tone at G: its maker's until its own arrow lands, then its
 *  own, then back toward 1 as the correction wave straightens it. */
export const toneAt = (n: number, G: number) => {
  const base = lerp(makerTone(n), ownTone(n), copyAt(n, G));
  return lerp(base, 1, correctionT(n, G));
};

// --- the guide --------------------------------------------------------------
export const GUIDE_G0 = 36;
/** World px per frame. 32, not the brief's ceiling of 42: the draw head is
 *  capped at SPEED_CAP_SCREEN and cut 1 opens at k 1.35, where 42 world px/f is
 *  56.7 screen px/f. 32 * 1.35 = 43.2 and it is legal at every zoom any cut of
 *  this clip reaches. The guide still clears the top of cut 1's frame around
 *  G63 and is complete at G130. */
export const GUIDE_DRAW_V = 32;
export const GUIDE_LEN = 3000;
export const guideLen = (G: number) => clamp01(((G - GUIDE_G0) * GUIDE_DRAW_V) / GUIDE_LEN) * GUIDE_LEN;

// ---------------------------------------------------------------------------
// ARROWS. `arrowGeom` is the one place the arrow's length is decided: from the
// owner's rim + RIM_GAP to the child's future rim + RIM_GAP, so the head
// touches where the child's edge will be and every arrow in the clip is the
// same 104 px long.
// ---------------------------------------------------------------------------
export type ArrowGeom = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  ux: number;
  uy: number;
  len: number;
};

export const arrowGeom = (
  from: Node,
  to: Node,
  rFrom: number,
  rTo: number,
): ArrowGeom => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const a = rFrom + RIM_GAP;
  const b = L - (rTo + RIM_GAP);
  return {
    x0: from.x + ux * a,
    y0: from.y + uy * a,
    x1: from.x + ux * b,
    y1: from.y + uy * b,
    ux,
    uy,
    len: Math.max(0, b - a),
  };
};

/** The arrow owned by node n at G, as geometry. n = 0 is the humans' arrow,
 *  which starts at ARROW_BASE itself (rFrom 0). */
export const arrowOf = (n: number, G: number): ArrowGeom => {
  const P = nodesAt(G);
  const from = P[n];
  const d = dirOf(deviationAt(n, G));
  const to = { x: from.x + D * d.x, y: from.y + D * d.y };
  return arrowGeom(from, to, n === 0 ? 0 : MARK_R, MARK_R);
};

/** The frame node n's own arrow is standing by: G14 for the humans, the end of
 *  its copy window for a generation. */
export const arrowBorn = (n: number) => (n === 0 ? 14 : sched(n).copy[1]);

/** THE COPY, mid-slide: the maker's arrow duplicated, `u` of the way along its
 *  own direction and `u` of the way round to the child's angle. At u = 1 it IS
 *  the child's arrow. */
export const copyGeom = (n: number, G: number): { g: ArrowGeom; u: number } => {
  const u = copyAt(n, G);
  const P = nodesAt(G);
  const maker = P[n - 1];
  const dMaker = deviationAt(n - 1, G);
  const dChild = deviationAt(n, G);
  const slide = dirOf(dMaker);
  const from = { x: maker.x + D * slide.x * u, y: maker.y + D * slide.y * u };
  const ang = lerp(dMaker, dChild, u);
  const d = dirOf(ang);
  const to = { x: from.x + D * d.x, y: from.y + D * d.y };
  return { g: arrowGeom(from, to, n - 1 === 0 ? lerp(0, MARK_R, u) : MARK_R, MARK_R), u };
};

// ---------------------------------------------------------------------------
// PACKETS. `launchList` turns a period that VARIES with the frame into the
// exact launch frames, so a build can surge twice inside one window without a
// second mechanism and without any packet ever appearing from nowhere.
// ---------------------------------------------------------------------------
export const PACKET_V = 18; // world px per frame
export const PACKET_IDLE_PERIOD = 18;
export const PACKET_BUILD_PERIOD = 5;
/** The build rate, doubled, in the two surges the doubled phrase of cut 1 and
 *  the thread-joins of the later builds land on. */
export const surgePeriod = (base: number, f: number, surges: number[]) => {
  let m = 1;
  for (const s of surges) m += Math.exp(-((f - s) * (f - s)) / (2 * 5 * 5));
  return base / m;
};

export const launchList = (f0: number, f1: number, periodAt: (f: number) => number) => {
  const out: number[] = [];
  // Primed, so the first launch is ON the window's first frame rather than one
  // period into it: a build that starts with nothing on the wire for three
  // frames reads as a hesitation.
  let acc = 1;
  for (let f = f0; f <= f1; f += 0.5) {
    acc += 0.5 / Math.max(0.5, periodAt(f));
    if (acc >= 1) {
      acc -= 1;
      out.push(f);
    }
  }
  return out;
};

export type Packet = { x: number; y: number; u: number };

/** Every packet in flight along `a -> b` at `G`, from an explicit launch list. */
export const streamPackets = (
  G: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
  launches: number[],
  speed: number = PACKET_V,
): Packet[] => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L <= 0) return [];
  const travel = L / speed;
  const out: Packet[] = [];
  for (const t0 of launches) {
    const t = G - t0;
    if (t < 0 || t > travel) continue;
    const u = t / travel;
    out.push({ x: a.x + dx * u, y: a.y + dy * u, u });
  }
  return out;
};

/** The build launches on the maker's arrow for generation n. Two surges: the
 *  start of the build, and a second one a third of the way through the fill. */
export const buildLaunches = (n: number) => {
  const s = sched(n);
  return launchList(s.packets, s.fill[1], (f) =>
    surgePeriod(PACKET_BUILD_PERIOD, f, s.surges),
  );
};

const BUILD_LAUNCHES: number[][] = SCHEDULE.map((s) => buildLaunches(s.n));

/** A build thread's own launches. Slower than the arrow's (a thread is
 *  scaffolding, not the link the generation is made along) and offset per
 *  person, so five threads never launch in unison. */
const THREAD_LAUNCH_CACHE = new Map<string, number[]>();
export const threadLaunches = (s: Sched, personIndex: number) => {
  const key = `${s.n}-${personIndex}`;
  const hit = THREAD_LAUNCH_CACHE.get(key);
  if (hit) return hit;
  const out = launchList(s.packets, s.fill[1], (f) =>
    surgePeriod(PACKET_BUILD_PERIOD * 1.9, f + personIndex * 2.3, s.surges),
  );
  THREAD_LAUNCH_CACHE.set(key, out);
  return out;
};

/** Is node n's arrow building its child right now? */
export const buildingAt = (n: number, G: number) => {
  const child = n + 1;
  if (child > GENS) return false;
  const s = sched(child);
  return G >= s.packets && G <= s.fill[1];
};

// ---------------------------------------------------------------------------
// THE HUMANS' THROUGH-PACKETS. Generation 1 is close enough to the people for a
// fan of build threads to be a fan; from generation 2 on those threads are long
// diagonals that cross the whole picture and dominate it (measured on the first
// render's f40 and f62 of cut 2), and gen 3's would be longer still. So the
// humans' help travels the way everything else in this clip travels: as WHITE
// PACKETS ON THE CHAIN. They launch from ARROW_BASE, ride up the humans' arrow,
// pass THROUGH each generation already standing (drawn under the marks, so a
// mark occludes one as it goes by) and are absorbed into the one being formed.
//
// It is the same packet, the same size, the same speed and the same white as a
// packet on the humans' own arrow — nothing new is introduced, and the read is
// exact: the people are still in it, their contribution now has to travel
// further and through more generations to get there, and by generation 4 it
// does not arrive at all.
//
// THROUGH_PERIOD[n] is the launch period for generation n, or null for a
// generation the humans do not reach: gen 1 has its own thread fan, gens 2 and
// 3 have this, gen 4 onward have nothing — from there the models build the
// models.
// ---------------------------------------------------------------------------
export const THROUGH_PERIOD: (number | null)[] = [
  null, // gen 1 — the thread fan
  PACKET_BUILD_PERIOD, // gen 2 — at the build rate, with the build's own surges
  10, // gen 3 — sparser: the humans are two generations away now
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

export const throughLaunches = (n: number) => {
  const per = THROUGH_PERIOD[n - 1];
  if (per === null) return [];
  const s = sched(n);
  // The launches run from the first build packet until the generation's own
  // arrow LANDS, not until its mark is full: the people are still feeding it
  // while it becomes itself, and the last few are still climbing the chain
  // twenty-odd frames later, which is what keeps the cut from resolving.
  return per === PACKET_BUILD_PERIOD
    ? launchList(s.packets, s.copy[1], (f) => surgePeriod(per, f, s.surges))
    : launchList(s.packets, s.copy[1], () => per);
};

const THROUGH_LAUNCHES: number[][] = SCHEDULE.map((s) => throughLaunches(s.n));

/** Positions along a polyline at arc length `s`. */
const alongChain = (pts: Node[], s: number): Node | null => {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (s <= acc + len) {
      const u = len <= 0 ? 0 : (s - acc) / len;
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
    }
    acc += len;
  }
  return null;
};

/** The humans' white packets in flight toward generation n at G — from
 *  ARROW_BASE, through every generation below it, to P[n]. */
export const throughPackets = (n: number, G: number): Node[] => {
  const launches = THROUGH_LAUNCHES[n - 1];
  if (launches.length === 0) return [];
  const path = nodesAt(G).slice(0, n + 1);
  const out: Node[] = [];
  for (const t0 of launches) {
    const s = (G - t0) * PACKET_V;
    if (s < 0) continue;
    const p = alongChain(path, s);
    if (p) out.push(p);
  }
  return out;
};

// --- the correction train ---------------------------------------------------
/** The chain as a polyline at G: P[0..10] and then gen 10's arrow, extended. */
export const chainAt = (G: number): Node[] => {
  const P = nodesAt(G);
  const d = dirOf(deviationAt(GENS, G));
  const last = P[GENS];
  return [...P, { x: last.x + GUIDE_LEN * d.x, y: last.y + GUIDE_LEN * d.y }];
};

/** The correction train at G: white packets running up the chain THROUGH each
 *  mark, launched from ARROW_BASE every WAVE_PERIOD frames from WAVE_G0 on. */
export const wavePackets = (G: number): Node[] => {
  if (G < WAVE_G0) return [];
  const chain = chainAt(G);
  const segs: { a: Node; b: Node; len: number; s: number }[] = [];
  let acc = 0;
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, s: acc });
    acc += len;
  }
  const total = acc;
  const out: Node[] = [];
  for (let t0 = WAVE_G0; t0 <= G; t0 += WAVE_PERIOD) {
    const s = (G - t0) * WAVE_V;
    if (s > total) continue;
    const seg = segs.find((q) => s >= q.s && s <= q.s + q.len) ?? segs[segs.length - 1];
    const u = seg.len <= 0 ? 0 : (s - seg.s) / seg.len;
    out.push({ x: lerp(seg.a.x, seg.b.x, u), y: lerp(seg.a.y, seg.b.y, u) });
  }
  return out;
};

// --- sway -------------------------------------------------------------------
/** Every mark and every person carries its own <= 3 px drift on its own two
 *  periods, so nothing in the world is ever perfectly still and nothing moves
 *  in unison. Arrows and nodes do NOT sway: they are the geometry. */
export const drift = (G: number, seed: number, amp = 2.6) => ({
  dx: amp * Math.sin(G / (17 + 5 * hash(seed, 3)) + seed * 2.1),
  dy: amp * Math.sin(G / (23 + 6 * hash(seed, 9)) + seed * 3.7),
});

// ---------------------------------------------------------------------------
// STATE — everything a cut or the World needs to know about a frame, derived
// and never stored.
// ---------------------------------------------------------------------------
export type GenState = {
  n: number;
  node: Node;
  /** 0..1, the circular reveal */
  fill: number;
  tone: number;
  /** its own arrow is standing */
  hasArrow: boolean;
  /** its own arrow is mid-copy */
  copying: boolean;
  copyU: number;
  threads: Threads;
};

export type WorldState = {
  G: number;
  nodes: Node[];
  guide: number;
  /** the humans' arrow drawing head-led, 0..1 */
  baseArrow: number;
  gens: GenState[];
};

export const stateAt = (G: number): WorldState => {
  const nodes = nodesAt(G);
  const gens: GenState[] = [];
  for (let n = 1; n <= GENS; n++) {
    const s = sched(n);
    const u = copyAt(n, G);
    gens.push({
      n,
      node: nodes[n],
      fill: buildAt(n, G),
      tone: toneAt(n, G),
      hasArrow: G >= s.copy[1],
      copying: G > s.copy[0] && G < s.copy[1],
      copyU: u,
      threads: threadsAt(n, G),
    });
  }
  return {
    G,
    nodes,
    guide: guideLen(G),
    baseArrow: smoothstep(clamp01(G / 14)),
    gens,
  };
};

/** The world's ink bounding box at G — the people, every revealed mark, and
 *  every standing arrow. The guide is excluded: it runs off frame by design. */
export const bounds = (G: number) => {
  const st = stateAt(G);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const put = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const p of PEOPLE) {
    put(p.x - (PERSON_H * PERSON_INK) / 2, p.y - (PERSON_H * PERSON_INK) / 2);
    put(p.x + (PERSON_H * PERSON_INK) / 2, p.y + (PERSON_H * PERSON_INK) / 2);
  }
  if (st.baseArrow > 0) {
    const g = arrowOf(0, G);
    put(g.x0, g.y0);
    put(g.x1, lerp(g.y0, g.y1, st.baseArrow));
  }
  for (const g of st.gens) {
    if (g.fill > 0) {
      put(g.node.x - MARK_R, g.node.y - MARK_R);
      put(g.node.x + MARK_R, g.node.y + MARK_R);
    }
    if (g.hasArrow) {
      const a = arrowOf(g.n, G);
      put(Math.min(a.x0, a.x1), Math.min(a.y0, a.y1));
      put(Math.max(a.x0, a.x1), Math.max(a.y0, a.y1));
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
};

// ===========================================================================
// THE DRAWING. Everything below is camera-independent: it draws in world
// coordinates and takes the live `k` only so the line family comes out at its
// screen weight. A cut wraps `World` in `worldTransform` + `sway` + the global
// drop shadow.
// ===========================================================================

export const PersonGlyph: React.FC<{ k: number; p: Person; G: number; opacity?: number }> = ({
  k,
  p,
  G,
  opacity = INK_HI,
}) => {
  const d = drift(G, p.seed + 40, 2.2);
  return (
    <Img
      src={staticFile("person.png")}
      style={{
        position: "absolute",
        left: p.x - PERSON_H / 2 + d.dx,
        top: p.y - PERSON_H / 2 + d.dy,
        width: PERSON_H,
        height: PERSON_H,
        opacity,
        filter: `brightness(0) invert(1) ${iconShadow(k)}`,
      }}
    />
  );
};

/** A generation. The shadow is on a WRAPPER OUTSIDE the scale group: inside it
 *  the filter would be authored in the glyph's own 24-unit space and come out
 *  em/24 times too heavy. The reveal is a circular clip growing from the box's
 *  centre. */
export const Mark: React.FC<{
  k: number;
  id: string;
  x: number;
  y: number;
  tone: number;
  fill?: number;
  em?: number;
  opacity?: number;
}> = ({ k, id, x, y, tone, fill = 1, em = MARK, opacity = 1 }) => {
  const f = clamp01(fill);
  if (f <= 0 || opacity <= 0) return null;
  const r = MARK_COVER_R * (em / MARK) * f;
  const clipped = f < 1;
  // THE CLIP GOES ON ITS OWN UNTRANSFORMED WRAPPER. A `clip-path` is resolved
  // in the user space of the element that REFERENCES it, which for an element
  // carrying its own `transform` is the space that transform establishes — so a
  // circle at the mark's world centre put on the scale group itself comes out
  // translated by (x, y) and blown up by em/24, which is off the frame. That is
  // what made every partly-filled mark invisible on the first render.
  return (
    <g
      style={{ filter: iconShadow(k, undefined, undefined, MARK_SHADOW_OPACITY) }}
      opacity={opacity}
    >
      {clipped ? (
        <defs>
          <clipPath id={id}>
            <circle cx={x} cy={y} r={r} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={clipped ? `url(#${id})` : undefined}>
        <g
          transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${(em / 24).toFixed(
            6,
          )}) translate(-12 -12)`}
        >
          {OPENAI.paths.map((d) => (
            <path key={d.length} d={d} fill={TONE(tone)} fillRule="evenodd" />
          ))}
        </g>
      </g>
    </g>
  );
};

/** An arrow: shaft plus an open chevron head. `draw` 0..1 draws it head-led
 *  from its tail. */
export const Arrow: React.FC<{
  k: number;
  g: ArrowGeom;
  draw?: number;
  colour?: string;
  opacity?: number;
}> = ({ k, g, draw = 1, colour = INK, opacity = INK_HI }) => {
  const t = clamp01(draw);
  if (t <= 0 || opacity <= 0) return null;
  const sw = strokeW(k);
  const hx = g.x0 + (g.x1 - g.x0) * t;
  const hy = g.y0 + (g.y1 - g.y0) * t;
  const hl = headLen(k);
  const ang = Math.atan2(g.uy, g.ux);
  const a = ang + Math.PI * 0.8;
  const b = ang - Math.PI * 0.8;
  const headT = clamp01((t - 0.72) / 0.28);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line
        x1={g.x0}
        y1={g.y0}
        x2={hx}
        y2={hy}
        stroke={colour}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {headT > 0 ? (
        <path
          d={
            `M${(g.x1 + Math.cos(a) * hl).toFixed(2)} ${(g.y1 + Math.sin(a) * hl).toFixed(2)} ` +
            `L${g.x1.toFixed(2)} ${g.y1.toFixed(2)} ` +
            `L${(g.x1 + Math.cos(b) * hl).toFixed(2)} ${(g.y1 + Math.sin(b) * hl).toFixed(2)}`
          }
          fill="none"
          stroke={colour}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={headT.toFixed(3)}
        />
      ) : null}
    </g>
  );
};

/** The guide: the humans' direction, extended to infinity and marching. */
export const Guide: React.FC<{ k: number; G: number; len: number }> = ({ k, G, len }) => {
  if (len <= 0) return null;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
      <line
        x1={ARROW_BASE.x}
        y1={ARROW_BASE.y}
        x2={ARROW_BASE.x}
        y2={ARROW_BASE.y - len}
        stroke={INK}
        strokeWidth={threadW(k)}
        strokeLinecap="butt"
        strokeDasharray={dashArray(k)}
        strokeDashoffset={dashOffset(G, k)}
      />
    </g>
  );
};

/** A build thread: a person's head-top to the forming mark's centre. */
export const Thread: React.FC<{
  k: number;
  from: Node;
  to: Node;
  draw?: number;
  opacity?: number;
}> = ({ k, from, to, draw = 1, opacity = INK_LO }) => {
  const t = clamp01(draw);
  if (t <= 0 || opacity <= 0) return null;
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={lerp(from.x, to.x, t)}
      y2={lerp(from.y, to.y, t)}
      stroke={INK}
      strokeWidth={threadW(k)}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
};

const Dots: React.FC<{
  k: number;
  pts: Packet[] | Node[];
  colour: string;
  opacity: number;
  /** the SCREEN width of the line these ride, so a bead is always 2.215x it */
  lineW?: number;
}> = ({ k, pts, colour, opacity, lineW = THREAD_PX }) => {
  if (pts.length === 0) return null;
  const r = packetR(k, lineW);
  return (
    <g opacity={opacity}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill={colour} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WORLD at G. Draw order: the guide under everything, then the threads,
// then the arrows and their packets, then the marks, then the correction train
// which runs THROUGH the marks and is therefore over them.
// ---------------------------------------------------------------------------
export const World: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const st = stateAt(G);

  // Every arrow that is standing, plus the one that is mid-copy.
  const standing: { n: number; g: ArrowGeom; draw: number }[] = [];
  if (G >= 0) standing.push({ n: 0, g: arrowOf(0, G), draw: st.baseArrow });
  for (const gen of st.gens) {
    if (gen.hasArrow) standing.push({ n: gen.n, g: arrowOf(gen.n, G), draw: 1 });
  }
  const copying = st.gens.filter((g) => g.copying).map((g) => ({ n: g.n, ...copyGeom(g.n, G) }));

  const wave = wavePackets(G);

  return (
    <>
      {PEOPLE.map((p) => (
        <PersonGlyph key={p.seed} k={k} p={p} G={G} />
      ))}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <Guide k={k} G={G} len={st.guide} />

        {/* build threads, and the white packets that ride them */}
        {st.gens.map((gen) => {
          if (gen.threads.draw <= 0 || gen.threads.opacity <= 0) return null;
          const s = sched(gen.n);
          return (
            <g key={`th${gen.n}`}>
              {gen.threads.people.map((pi) => {
                const p = PEOPLE[pi];
                const from = { x: p.x, y: headTop(p) };
                // A thread delivers INTO the spot and is pushed back by what
                // grows there: it ends at the centre while nothing exists and
                // retracts to the mark's rim as the reveal fills. Left running
                // to the centre it drew five white slivers out through the
                // knot's own holes — measured on the f26 still.
                const back = MARK_R * gen.fill;
                const dxn = gen.node.x - from.x;
                const dyn = gen.node.y - from.y;
                const ln = Math.hypot(dxn, dyn) || 1;
                const to = {
                  x: gen.node.x - (dxn / ln) * back,
                  y: gen.node.y - (dyn / ln) * back,
                };
                const pk =
                  gen.threads.draw >= 1 ? streamPackets(G, from, to, threadLaunches(s, pi)) : [];
                return (
                  <g key={`th${gen.n}-${pi}`}>
                    <Thread
                      k={k}
                      from={from}
                      to={to}
                      draw={gen.threads.draw}
                      opacity={gen.threads.opacity}
                    />
                    <Dots k={k} pts={pk} colour={INK} opacity={gen.threads.opacity} />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* the arrows */}
        {standing.map((a) => (
          <Arrow key={`ar${a.n}`} k={k} g={a.g} draw={a.draw} />
        ))}
        {copying.map((c) => (
          <Arrow key={`cp${c.n}`} k={k} g={c.g} />
        ))}

        {/* packets on every standing arrow: white on the humans', accent on a
            mark's; idle always, build rate while that arrow builds its child */}
        {standing.map((a) => {
          if (a.draw < 1) return null;
          // the idle stream is alignShared's own helper: a constant period on a
          // fixed segment is exactly what it computes, and it retimes with the
          // link instead of carrying a clock of its own.
          const pts = linkPackets({
            frame: G,
            k,
            from: { x: a.g.x0, y: a.g.y0 },
            to: { x: a.g.x1, y: a.g.y1 },
            period: PACKET_IDLE_PERIOD,
            speed: PACKET_V,
            phase: a.n * 5,
          });
          const child = a.n + 1;
          const build =
            child <= GENS && buildingAt(a.n, G)
              ? streamPackets(
                  G,
                  { x: a.g.x0, y: a.g.y0 },
                  { x: a.g.x1, y: a.g.y1 },
                  BUILD_LAUNCHES[child - 1],
                )
              : [];
          const colour = a.n === 0 ? INK : ACCENT;
          return (
            <g key={`pk${a.n}`}>
              <Dots k={k} pts={pts} colour={colour} opacity={INK_LO} lineW={STROKE_PX} />
              <Dots k={k} pts={build} colour={colour} opacity={INK_HI} lineW={STROKE_PX} />
            </g>
          );
        })}

        {/* the humans' through-packets, under the marks they pass */}
        {st.gens.map((gen) => {
          const pts = throughPackets(gen.n, G);
          if (pts.length === 0) return null;
          return (
            <Dots
              key={`thru${gen.n}`}
              k={k}
              pts={pts}
              colour={INK}
              opacity={INK_HI}
              lineW={STROKE_PX}
            />
          );
        })}

        {/* the generations */}
        {st.gens.map((gen) => {
          if (gen.fill <= 0) return null;
          const d = drift(G, gen.n);
          return (
            <Mark
              key={`mk${gen.n}`}
              k={k}
              id={`degMask${gen.n}`}
              x={gen.node.x + d.dx}
              y={gen.node.y + d.dy}
              tone={gen.tone}
              fill={gen.fill}
            />
          );
        })}

        {/* the correction train */}
        <Dots k={k} pts={wave} colour={INK} opacity={INK_HI} lineW={STROKE_PX} />
      </svg>
    </>
  );
};

/** The camera lift this clip shares with the rest of the set: a content y at
 *  `cy - CAM_LIFT / k` lands on screen y 835, under the captions. */
export { CAM_LIFT };

// ===========================================================================
// THE PROOFS. Every one of them is a wall the module cannot be built through.
// ===========================================================================

/** 1. Generation 1 stands exactly D above the base on the first frame. */
(() => {
  const p = nodesAt(0)[1];
  if (Math.abs(p.x - ARROW_BASE.x) > 1e-9 || Math.abs(p.y - (ARROW_BASE.y - D)) > 1e-9) {
    throw new Error(
      `degradationShared: nodesAt(0)[1] is (${p.x}, ${p.y}), not D above ARROW_BASE.`,
    );
  }
})();

/** 2. The spiral at G612 IS the closed form, to 1e-6. */
export const SPIRAL = (() => {
  let x = ARROW_BASE.x;
  let y = ARROW_BASE.y;
  const out = [{ x, y }];
  for (let n = 0; n < GENS; n++) {
    x += D * Math.sin(THETA[n] * DEG);
    y -= D * Math.cos(THETA[n] * DEG);
    out.push({ x, y });
  }
  const live = nodesAt(612);
  for (let n = 0; n <= GENS; n++) {
    if (Math.abs(live[n].x - out[n].x) > 1e-6 || Math.abs(live[n].y - out[n].y) > 1e-6) {
      throw new Error(`degradationShared: node ${n} at G612 is off the closed-form spiral.`);
    }
  }
  return out;
})();

/** 3. Everything is straight by the end of the world. */
(() => {
  for (let n = 0; n <= GENS; n++) {
    if (deviationAt(n, WORLD_FRAMES) >= 0.01) {
      throw new Error(
        `degradationShared: generation ${n} is still ${deviationAt(n, WORLD_FRAMES).toFixed(
          3,
        )} deg off at G${WORLD_FRAMES}.`,
      );
    }
  }
})();

/** 4. The bounding box at G612 is what the header comment says it is. */
export const BOX_612 = (() => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let n = 1; n <= GENS; n++) {
    const p = SPIRAL[n];
    x0 = Math.min(x0, p.x - MARK_R);
    y0 = Math.min(y0, p.y - MARK_R);
    x1 = Math.max(x1, p.x + MARK_R);
    y1 = Math.max(y1, p.y + MARK_R);
  }
  const want = { x0: 496.0, y0: -259.567, x1: 1354.303, y1: 1450.455 };
  for (const key of ["x0", "y0", "x1", "y1"] as const) {
    const got = { x0, y0, x1, y1 }[key];
    if (Math.abs(got - want[key]) > 0.002) {
      throw new Error(
        `degradationShared: the G612 box's ${key} is ${got.toFixed(
          3,
        )}, the header comment says ${want[key]}.`,
      );
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
})();

/** 5. THE SCHEDULE IS ORDERED. A generation cannot be built by an arrow that
 *  has not landed, cannot be copied before it is filled, and cannot fade its
 *  threads before its arrow lands. */
(() => {
  for (const s of SCHEDULE) {
    // Gen 1 is the exception on purpose: its packets set off at G10 while the
    // humans' arrow is still drawing (71% of the way up at that frame, and a
    // packet at u = 0 is always behind the head). Every later generation waits
    // for its maker's arrow to have landed.
    const makerArrow = s.n === 1 ? 0 : arrowBorn(s.n - 1);
    if (s.packets < makerArrow) {
      throw new Error(
        `degradationShared: gen ${s.n} builds at G${s.packets}, before its maker's arrow lands at G${makerArrow}.`,
      );
    }
    if (s.fill[0] < s.packets || s.fill[1] <= s.fill[0]) {
      throw new Error(`degradationShared: gen ${s.n}'s fill window is out of order.`);
    }
    if (s.copy[0] < s.fill[0] || s.copy[1] <= s.copy[0]) {
      throw new Error(`degradationShared: gen ${s.n}'s copy window is out of order.`);
    }
    if (s.threads && s.threads[1] <= s.threads[0]) {
      throw new Error(`degradationShared: gen ${s.n}'s thread window is out of order.`);
    }
    if (s.fade && s.fade[0] < s.copy[1]) {
      throw new Error(`degradationShared: gen ${s.n}'s threads fade before its arrow lands.`);
    }
  }
  if (SCHEDULE[GENS - 1].copy[1] !== HOLD[0]) {
    throw new Error("degradationShared: the hold does not start where gen 10's arrow lands.");
  }
})();

/** 6. NOTHING IN THE WORLD BREAKS THE SPEED CAP at the zooms this clip uses.
 *  The fastest movers are the guide's draw head, a packet, and the correction
 *  train; the copy's slide is checked by each cut against its own camera. */
export const K_CEIL = 1.4;
(() => {
  const fastest = Math.max(GUIDE_DRAW_V, PACKET_V, WAVE_V);
  if (fastest * K_CEIL > SPEED_CAP_SCREEN) {
    throw new Error(
      `degradationShared: ${fastest.toFixed(1)} world px/f is ${(fastest * K_CEIL).toFixed(
        1,
      )} screen px/f at k ${K_CEIL}.`,
    );
  }
})();
