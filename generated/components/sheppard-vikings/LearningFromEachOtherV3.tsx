// ---------------------------------------------------------------------------
// LearningFromEachOtherV3 (sheppard-vikings, cut 2, take 3). Dwarkesh map style (styles/dwarkesh-map.md),
// the umber page with no map. Opaque 1080x1920, 23.976 fps, 141 frames.
// The page from kits/maps (TexcocoPage: umber LAND, world-space mottle, grain, vignette); the Spaniards on
// kits/maps/texcocoFigures, the Aztec Commoner (unarmed) from captureFigures, the Inca as built in take 2
// (LearningFromEachOtherV2's IncaTraveller: the rig under an unku with the soldier's chequer and a llauto, copied here).
//
// CHECK LINE: "one group of men pass a book along and all of them get it; the other two men each keep their own
// and never share".
//
// THE LINE: "(which is that) the Europeans are learning from each other, but the natives are not learning from
// each other. So (...)"
// WORD -> FRAME: the -3 · Europeans 5 · are 16 · learning 23 · from 31 · each 36 · other 40-46 · but 51 · the 60 ·
// natives 73-89 · are 89 · not 95 · learning 98 · from 105 · each 114 · other 118-122 · So 125
// DURATION: the slot 2.961 -> 8.842 s = 5.881 s x 23.976 = 141 frames (f0..f140), no tail.
//
// THE MOTION: one page, two rows at the same spacing (322 world px). TOP: three Spaniards; the first, orange,
// holds an orange book. He turns and holds it out; the second turns, reaches and takes it (CONTACT f13, both hands
// on it to f15; a copy slides out from behind the giver's book with the taker's hand, so the giver keeps his);
// the taker's coat crossfades to orange (first reaction f14, landed f26). He brings it to his chest, moves it to
// his other hand, turns and passes it to the third (CONTACT f32, orange f33-45). Three orange men, three books by
// "other" (f46), each reading (the third settles by f51). Camera: close on the first two (k 1.4, ~450 px tall,
// already easing), drifting through the first hand-over with the third man off frame, then tracking right and out
// so all three are held from the second reach (k 1.25 at f30, 1.2 at f44), then ONE eased move down and a little
// to both rows (landed f72), settling on the resolved frame by f112 (k 1.03: figures ~330 px, top feet ~590,
// bottom feet ~1110), then creeping in (k 1.065 at f140).
// BOTTOM (director's take 3 review): not drawn until the camera starts down; the Aztec (an opened screenfold
// codex) and the Inca (a quipu held up by its main cord) are revealed whole by the house entrance, sliding up
// 24 px while fading in over 14 f (Aztec f52-66, Inca f56-70). They stand with their backs to the gap, heads bowed
// over their own records held in both hands, the mirror of the three orange readers above. On "not learning from
// each other" each takes two slow steps further outward (one walk cycle, f92-120, 36 world px), so the empty
// middle widens. They never turn and never look across.
// GESTURES -> WORDS: hand-over 1 = "Europeans are learning" (3-26); hand-over 2 = "from each other" (20-46); the
// move down and the natives' entrance = "but the natives" (46-72); the steps apart = "are not learning from each
// other" (92-120); the creep in = "So" (112-140).
// Orange = WHAT IS PASSED ON (the book, and the men who have it). Everything else cream.
//
// SOURCES: the book stands for Cortes's printed letters to Charles V (Cartas de relacion, Seville 1522-25, read
// across Spain): the know-how one conquistador handed the next (Cortes from Hispaniola; Pizarro from Cortes). The
// Aztec record is a folded screenfold codex; the Inca record a quipu (knotted cords). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CREAM, Figure, ORANGE, SPANIARDS, SPANIARD_STAND, STAND, figureAnchors, figureRig, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { TexcocoPage, WorldSvg, idle, makeCamera, poseTrack, walkPose } from "../kits/maps/texcocoShared";
import { ACCENT, ACCENT_DEEP, INK, mixColor, smoothstep, swayCam, type P2 } from "../kits/maps/incaShared";
import { CAST_SPECS, Commoner, mirrorPose } from "../sheppard-capture-not-kill/captureFigures";

export const FPS = 24000 / 1001;
export const DURATION = 141;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const DARK = "#17120D";
const ease = (t: number) => smoothstep(t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mulv = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const mixv = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ---------------------------------------------------------------------------
// THE PAGE: two rows, the same spacing (world px; feet)
// ---------------------------------------------------------------------------
export const SCALE = 1; // world px per figure unit: a Spaniard ~320 world px
export const GAP = 322; // the spacing in both rows
export const TOP_Y = 700;
export const BOT_Y = TOP_Y + 505;
export const TOP_X: [number, number, number] = [540 - GAP, 540, 540 + GAP];
/** the natives start a little inside the top row's places and step outward (STEP world px) on "not learning" */
export const NATIVE_X0 = 280;
export const STEP = 36;
export const STEP_F: [number, number] = [92, 120];
const SP_SPEC: Spec[] = [SPANIARDS[0], { ...SPANIARDS[1], spaniard: "sword" }, SPANIARDS[0]];

// ---------------------------------------------------------------------------
// THE CAMERA (k = screen px per world px; world point (wx, wy) at screen (sx, sy))
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  // close on the first two (~416 px tall), feet clear of the caption band, already easing right
  { f: 0, k: 1.4, wx: 540 - GAP / 2 - 12, wy: TOP_Y, sx: 540, sy: 1068 },
  // a slow drift through the first hand-over (the third man stays off frame until it is made)
  { f: 15, k: 1.375, wx: 540 - GAP / 2 - 4, wy: TOP_Y, sx: 540, sy: 1060 },
  // tracking right and easing out: the third man crosses the frame edge in a few frames, all three held from f26
  { f: 26, k: 1.26, wx: 540, wy: TOP_Y, sx: 540, sy: 1046 },
  { f: 44, k: 1.2, wx: 540, wy: TOP_Y, sx: 540, sy: 1040 },
  // down to both rows: lands f72, settles on the resolved frame by f112 (top feet ~590, bottom feet ~1110,
  // figures ~330 px), then only creeps in
  { f: 72, k: 1.05, wx: 540, wy: BOT_Y, sx: 540, sy: 1104 },
  { f: 112, k: 1.03, wx: 540, wy: BOT_Y, sx: 540, sy: 1110 },
  { f: 141, k: 1.065, wx: 540, wy: BOT_Y, sx: 540, sy: 1108 },
]);

// ---------------------------------------------------------------------------
// THE BOOK: a small bound volume, orange cover, cream page block (figure units; centre at (0, 0))
// ---------------------------------------------------------------------------
const BW = 48;
const BH = 62;
const Book: React.FC<{ at: P2; scale: number; rot?: number }> = ({ at, scale, rot = 0 }) => {
  const x0 = -BW / 2;
  const y0 = -BH / 2;
  const T = 6; // the page block's depth
  const x1 = x0 + BW;
  const y1 = y0 + BH;
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)})`} strokeLinejoin="round" strokeLinecap="round">
      {/* casing */}
      <path d={`M${x0 - 4},${y0 - 2}L${x1 + 1},${y0 - 2}L${x1 + T + 2},${y0 + T - 1}L${x1 + T + 2},${y1 + T + 2}L${x0 + T - 1},${y1 + T + 2}L${x0 - 4},${y1 + 1}Z`} fill={DARK} fillOpacity={0.62} stroke={DARK} strokeOpacity={0.62} strokeWidth={3.6} />
      {/* the back board under the pages */}
      <path d={`M${x1},${y0}L${x1 + T},${y0 + T}L${x1 + T},${y1 + T}L${x0 + T},${y1 + T}L${x0},${y1}Z`} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={2} />
      {/* the page block: fore-edge and tail, ruled with the leaves */}
      <path d={`M${x1},${y0 + 3}L${x1 + T - 1.5},${y0 + T + 1.5}L${x1 + T - 1.5},${y1 + T - 1.5}L${x0 + T + 1.5},${y1 + T - 1.5}L${x0 + 3},${y1}L${x1},${y1}Z`} fill={INK} stroke={DARK} strokeWidth={1.6} />
      <path d={[1.5, 3, 4.5].map((u) => `M${x1 + u},${y0 + 3 + u}L${x1 + u},${y1 + u - 0.5}L${x0 + 3 + u},${y1 + u - 0.5}`).join("")} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={0.8} />
      {/* the cover */}
      <rect x={x0} y={y0} width={BW} height={BH} rx={2.4} fill={ACCENT} stroke={DARK} strokeWidth={2.4} />
      {/* the rounded spine with its raised bands */}
      <path d={`M${x0 + 10},${y0}L${x0 + 1},${y0}Q${x0 - 4.5},${y0 + BH / 2} ${x0 + 1},${y1}L${x0 + 10},${y1}Z`} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={2} />
      <path d={[0.22, 0.42, 0.62, 0.82].map((v) => `M${x0 - 1.6},${y0 + BH * v}L${x0 + 9.5},${y0 + BH * v}`).join("")} stroke={DARK} strokeWidth={2.2} strokeOpacity={0.85} />
      <path d={`M${x0 + 10},${y0 + 1}L${x0 + 10},${y1 - 1}`} stroke={DARK} strokeWidth={1.2} strokeOpacity={0.7} />
      {/* the tooled frame and the centre lozenge */}
      <rect x={x0 + 15} y={y0 + 6} width={BW - 21} height={BH - 12} fill="none" stroke={DARK} strokeWidth={1.3} strokeOpacity={0.6} />
      <rect x={x0 + 18} y={y0 + 9} width={BW - 27} height={BH - 18} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={0.45} />
      <path d={`M${x0 + 31.5},${-10}L${x0 + 38},0L${x0 + 31.5},10L${x0 + 25},0Z`} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={1.4} strokeOpacity={0.8} />
      {/* the clasp across the fore-edge */}
      <path d={`M${x1 - 7},${-4}L${x1 + T + 2},${-4 + T * 0.5}L${x1 + T + 2},${4 + T * 0.5}L${x1 - 7},${4}Z`} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={1.5} />
      <circle cx={x1 - 3.5} cy={0} r={1.8} fill={DARK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SPANIARDS' POSES (yaw within +-0.5, so every arm draws in front of the body)
// armR = his screen-right arm (the book hand when facing right); armL = screen left (the taking hand)
// ---------------------------------------------------------------------------
const POMMEL = SPANIARD_STAND[0].armL;
const SIDE_R = { w: [56, -150] as P2, elbow: [0.6, 1] as P2, fist: 0.4, hand: 0 };
const WAIT: FigPose = { ...SPANIARD_STAND[0], yaw: 0.32, headYaw: 0.4, armR: SIDE_R };
const READ: FigPose = { ...SPANIARD_STAND[0], yaw: 0.3, headYaw: 0.75, pitch: 14, brow: 0.15, armL: POMMEL, armR: { w: [70, -230], elbow: [0.9, 0.7], fist: 0.6, hand: -70 } };
const giveBase: FigPose = { ...READ, yaw: 0.5, headYaw: 0.62, pitch: 6, lean: 13, crouch: 4, armR: { w: [150, -215], elbow: [0.3, 1], fist: 0.55, hand: -35 } };
const takeBase: FigPose = { ...WAIT, yaw: -0.4, headYaw: -0.55, pitch: 6, lean: -12, crouch: 4, armL: { w: [-150, -215], elbow: [-0.3, 1], fist: 0.5, hand: 35 }, armR: SIDE_R };
/** at his chest, both hands on the book (the book changes hands) */
const CHEST: FigPose = { ...READ, yaw: 0.06, headYaw: 0.12, pitch: 16, armL: { w: [-12, -202], elbow: [-0.7, 1], fist: 0.6, hand: 45 }, armR: { w: [14, -202], elbow: [0.7, 1], fist: 0.6, hand: -45 } };

/** the book's centre from the hand that holds it (figure units, rotated with nothing: books stay upright) */
const OFF_R: P2 = [14, -25];
const OFF_L: P2 = [-14, -25];
const BOOK_ROT = -5;

/** the wrist target that puts a hand's grip on world point G (fixed-point on the rig's own grip) */
const solveWrist = (sp: Spec, q: FigPose, at: P2, arm: "L" | "R", G: P2): FigPose => {
  let p = q;
  for (let i = 0; i < 12; i++) {
    const a = figureAnchors(sp, p, at, SCALE);
    const g = arm === "L" ? a.handL : a.handR;
    const d = mulv(sub(G, g), 1 / SCALE);
    const ap = arm === "L" ? p.armL : p.armR;
    const na = { ...ap, w: add(ap.w, d) };
    p = arm === "L" ? { ...p, armL: na } : { ...p, armR: na };
  }
  return p;
};
const gripOf = (sp: Spec, q: FigPose, at: P2, arm: "L" | "R"): P2 => {
  const a = figureAnchors(sp, q, at, SCALE);
  return arm === "L" ? a.handL : a.handR;
};

// the two hand-overs: the giver's book meets the taker's hand halfway between them, at chest height
export const CONTACT: [number, number] = [13, 32];
const handover = (gi: number, ti: number) => {
  const gAt: P2 = [TOP_X[gi], TOP_Y];
  const tAt: P2 = [TOP_X[ti], TOP_Y];
  const M: P2 = [(gAt[0] + tAt[0]) / 2, TOP_Y - 222 * SCALE];
  const give = solveWrist(SP_SPEC[gi], giveBase, gAt, "R", sub(M, mulv(OFF_R, SCALE)));
  const take = solveWrist(SP_SPEC[ti], takeBase, tAt, "L", sub(M, mulv(OFF_L, SCALE)));
  const gErr = Math.hypot(...sub(add(gripOf(SP_SPEC[gi], give, gAt, "R"), mulv(OFF_R, SCALE)), M));
  const tErr = Math.hypot(...sub(add(gripOf(SP_SPEC[ti], take, tAt, "L"), mulv(OFF_L, SCALE)), M));
  if (gErr > 1.5 || tErr > 1.5) throw new Error(`LearningFromEachOtherV3: hand-over ${gi}->${ti} out of reach (${gErr.toFixed(1)}, ${tErr.toFixed(1)})`);
  return { M, give, take };
};
const HO1 = handover(0, 1);
const HO2 = handover(1, 2);

const C1 = CONTACT[0];
const C2 = CONTACT[1];
// #1: reading -> turns and holds it out -> back to reading (the book stays in his right hand)
const sp0Track = poseTrack([
  [0, READ],
  [3, READ],
  [C1, HO1.give],
  [C1 + 2, HO1.give],
  [C1 + 12, READ],
]);
// #2: waiting -> turns and takes it -> to his chest, into the other hand -> turns and gives -> reading
const SW2: [number, number] = [19, 24];
const sp1Track = poseTrack([
  [0, WAIT],
  [2, WAIT],
  [C1, HO1.take],
  [C1 + 2, HO1.take],
  [SW2[0], CHEST],
  [SW2[1], CHEST],
  [C2, HO2.give],
  [C2 + 2, HO2.give],
  [C2 + 13, READ],
]);
// #3: waiting -> turns and takes it -> to his chest, into the other hand -> reading
const SW3: [number, number] = [C2 + 7, C2 + 11];
const sp2Track = poseTrack([
  [0, WAIT],
  [C2 - 12, WAIT],
  [C2, HO2.take],
  [C2 + 2, HO2.take],
  [SW3[0], CHEST],
  [SW3[1], CHEST],
  [C2 + 19, READ],
]);

const relayInk = (t: number): Ink => ({ main: mixColor(CREAM.main, ORANGE.main, t), deep: mixColor(CREAM.deep, ORANGE.deep, t), hair: mixColor(CREAM.hair, ORANGE.hair, t) });

// ---------------------------------------------------------------------------
// THE NATIVES' RECORDS (figure units, drawn at the hand's grip)
// ---------------------------------------------------------------------------
/** a screenfold codex opened out in a zigzag of five leaves, painted signs on them (centre (0, 0), its foot at
 *  y +26; drawn facing right, mirrored by `facing`) */
const Codex: React.FC<{ at: P2; scale: number; ink: Ink; facing: 1 | -1 }> = ({ at, scale, ink, facing }) => {
  const N = 5;
  const W = 18;
  const H = 52;
  const X0 = -(N * W) / 2;
  const dip = 5; // the folds: alternate leaves lean in and out, so the edges zigzag
  const edge = (i: number) => (i % 2 === 0 ? 0 : -dip);
  const leaf = (i: number) => {
    const xa = X0 + i * W;
    const xb = xa + W;
    const ya = edge(i);
    const yb = edge(i + 1);
    return { xa, xb, ya, yb, d: `M${xa},${-H / 2 + ya}L${xb},${-H / 2 + yb}L${xb},${H / 2 + yb}L${xa},${H / 2 + ya}Z`, lit: i % 2 === 0 };
  };
  const leaves = Array.from({ length: N }, (_, i) => leaf(i));
  const ys = (l: (typeof leaves)[number], u: number, v: number) => [l.xa + u * W, -H / 2 + v * H + (l.ya + (l.yb - l.ya) * u)] as P2;
  const pt = (q: P2) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${(scale * facing).toFixed(4)} ${scale.toFixed(4)})`} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${X0 - 2},${-H / 2 - 3}L${-X0 + 2},${-H / 2 - 3 - dip}L${-X0 + 2},${H / 2 + 3}L${X0 - 2},${H / 2 + 3}Z`} fill={DARK} fillOpacity={0.62} stroke={DARK} strokeOpacity={0.62} strokeWidth={4} />
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={l.d} fill={l.lit ? ink.main : ink.deep} stroke={DARK} strokeWidth={2.1} />
          {/* the painted frame lines along the top and foot of every leaf */}
          <path d={`M${pt(ys(l, 0.06, 0.1))}L${pt(ys(l, 0.94, 0.1))}M${pt(ys(l, 0.06, 0.9))}L${pt(ys(l, 0.94, 0.9))}`} stroke={DARK} strokeWidth={1.3} strokeOpacity={0.7} />
          {i % 3 === 0 ? (
            <>
              {/* a day sign: a ringed disc, and its count in dots */}
              <circle cx={ys(l, 0.5, 0.36)[0]} cy={ys(l, 0.5, 0.36)[1]} r={5} fill="none" stroke={DARK} strokeWidth={1.6} strokeOpacity={0.8} />
              <circle cx={ys(l, 0.5, 0.36)[0]} cy={ys(l, 0.5, 0.36)[1]} r={1.7} fill={DARK} fillOpacity={0.8} />
              <path d={[0.25, 0.5, 0.75].map((u) => `M${pt(ys(l, u, 0.68))}h0.1`).join("")} stroke={DARK} strokeWidth={3.2} strokeOpacity={0.75} />
            </>
          ) : i % 3 === 1 ? (
            <>
              {/* a little seated figure */}
              <circle cx={ys(l, 0.5, 0.3)[0]} cy={ys(l, 0.5, 0.3)[1]} r={3.2} fill={DARK} fillOpacity={0.7} />
              <path d={`M${pt(ys(l, 0.5, 0.38))}L${pt(ys(l, 0.5, 0.58))}L${pt(ys(l, 0.78, 0.68))}M${pt(ys(l, 0.24, 0.48))}L${pt(ys(l, 0.72, 0.46))}`} fill="none" stroke={DARK} strokeWidth={1.8} strokeOpacity={0.7} />
            </>
          ) : (
            <>
              {/* a stepped fret and a bar of dots */}
              <path d={`M${pt(ys(l, 0.15, 0.48))}L${pt(ys(l, 0.15, 0.36))}L${pt(ys(l, 0.45, 0.36))}L${pt(ys(l, 0.45, 0.24))}L${pt(ys(l, 0.8, 0.24))}`} fill="none" stroke={DARK} strokeWidth={1.7} strokeOpacity={0.75} />
              <path d={[0.25, 0.5, 0.75].map((u) => `M${pt(ys(l, u, 0.66))}h0.1`).join("")} stroke={DARK} strokeWidth={3.2} strokeOpacity={0.75} />
            </>
          )}
        </g>
      ))}
    </g>
  );
};

/** a quipu held up by its main cord between two hands (world points a, b): the cord sags between them, many
 *  knotted pendant cords hang from it at different lengths, the knots as dots */
const Quipu: React.FC<{ a: P2; b: P2; scale: number; ink: Ink; swing: number }> = ({ a, b, scale, ink, swing }) => {
  const dir = b[0] >= a[0] ? 1 : -1;
  const A: P2 = [a[0] - dir * 22 * scale, a[1] + 2 * scale];
  const B: P2 = [b[0] + dir * 24 * scale, b[1] + 6 * scale];
  const sag = 9 * scale;
  const cord = (t: number): P2 => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + sag * 4 * t * (1 - t)];
  const n = 10;
  const pend = Array.from({ length: n }, (_, i) => {
    const t = 0.06 + (0.88 * (i + 0.5)) / n;
    const top = cord(t);
    const len = (50 + 32 * (0.5 + 0.5 * Math.sin(i * 2.7 + 0.4))) * scale;
    const sw = swing * (0.7 + 0.3 * Math.sin(i * 1.9)) * scale;
    const bot: P2 = [top[0] + sw, top[1] + len];
    const nk = 2 + ((i * 7) % 3);
    const knots = Array.from({ length: nk }, (_, j) => {
      const u = 0.22 + (0.66 * (j + 0.3 + 0.4 * Math.sin(i * 3 + j))) / nk;
      return [top[0] + sw * u * u, top[1] + len * u] as P2;
    });
    return { top, bot, knots, dark: i % 4 === 1 };
  });
  const pdD = (p: (typeof pend)[number]) => `M${p.top[0].toFixed(1)},${p.top[1].toFixed(1)}Q${(p.top[0] + (p.bot[0] - p.top[0]) * 0.15).toFixed(1)},${((p.top[1] + p.bot[1]) / 2).toFixed(1)} ${p.bot[0].toFixed(1)},${p.bot[1].toFixed(1)}`;
  const main = `M${A[0].toFixed(1)},${A[1].toFixed(1)}Q${((A[0] + B[0]) / 2).toFixed(1)},${((A[1] + B[1]) / 2 + 2 * sag).toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}`;
  const s = scale;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={pend.map(pdD).join("")} stroke={DARK} strokeOpacity={0.62} strokeWidth={7 * s} />
      <path d={main} stroke={DARK} strokeOpacity={0.62} strokeWidth={10 * s} />
      {pend.map((p, i) => (
        <g key={i}>
          <path d={pdD(p)} stroke={DARK} strokeWidth={4.6 * s} />
          <path d={pdD(p)} stroke={p.dark ? ink.deep : ink.main} strokeWidth={2.5 * s} />
          {p.knots.map((k, j) => (
            <circle key={j} cx={k[0]} cy={k[1]} r={4.3 * s} fill={p.dark ? ink.deep : ink.main} stroke={DARK} strokeWidth={1.5 * s} />
          ))}
          <circle cx={p.bot[0]} cy={p.bot[1]} r={1.9 * s} fill={DARK} fillOpacity={0.8} />
        </g>
      ))}
      <path d={main} stroke={DARK} strokeWidth={7.4 * s} />
      <path d={main} stroke={ink.main} strokeWidth={4.8 * s} />
      <path d={main} stroke={DARK} strokeWidth={1 * s} strokeOpacity={0.5} strokeDasharray={`${2.6 * s} ${3.2 * s}`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE INCA (take 2's IncaTraveller, copied): the rig under an unku with the chequer of the Inca soldier and a dark
// llauto. `held` draws between the tunic and the arm over it (what he holds sits in his hand).
// ---------------------------------------------------------------------------
const INCA: Spec = { a: 40, hw: 44, H: 94, hipY: -150, hem: 34, limb: 0.98, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "bands", arm: [58, 55], leg: [69, 67] };
const P2s = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUTL = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const volume = (theta: number, A: number, B: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const wf = Math.hypot(A * c, B * s) / A;
  const term = Math.atan2(A * c, B * s);
  const flat = Math.abs(s) < 1e-6;
  const front = (p: P2): P2 => {
    if (flat) return p;
    const xc = Math.max(-1, Math.min(1, p[0] / A)) * A;
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    return [A * Math.sin(ph) * c + B * Math.cos(ph) * s + (p[0] - xc) * wf, p[1]];
  };
  const side = (p: P2): P2 => [p[0] * wf, p[1]];
  return { wf, front, side, s };
};
const Inca: React.FC<{ pose: FigPose; at: P2; scale: number; ink: Ink; uid: string; held?: React.ReactNode }> = ({ pose: q, at, scale, ink, uid, held }) => {
  const r = figureRig(INCA, q);
  const hw = INCA.hw;
  const shY = r.shY;
  const V = volume(q.yaw, hw + 6, (hw + 6) * 0.58);
  const { side, front } = V;
  const HEM = 58;
  const TUNIC = [
    side([-6, shY - 3]),
    side([-(hw + 11), shY + 1]),
    side([-(hw + 13), shY + 16]),
    side([-(hw + 4), shY + 20]),
    side([-(hw + 6), HEM - 4]),
    side([-(hw + 7), HEM]),
    side([0, HEM + 3]),
    side([hw + 7, HEM]),
    side([hw + 6, HEM - 4]),
    side([hw + 4, shY + 20]),
    side([hw + 13, shY + 16]),
    side([hw + 11, shY + 1]),
    side([6, shY - 3]),
  ];
  const tunicD = `M${TUNIC.map(P2s).join("L")}Z`;
  const cells: string[] = [];
  const cx0 = -hw + 2;
  const cw = (2 * hw - 4) / 4;
  const cy0 = shY + 46;
  const ch = (HEM - 6 - cy0) / 4;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      if ((i + j) % 2) continue;
      const pts: P2[] = [
        [cx0 + i * cw, cy0 + j * ch],
        [cx0 + (i + 1) * cw, cy0 + j * ch],
        [cx0 + (i + 1) * cw, cy0 + (j + 1) * ch],
        [cx0 + i * cw, cy0 + (j + 1) * ch],
      ].map((p) => front(p as P2));
      if (Math.abs(pts[1][0] - pts[0][0]) < 0.6) continue;
      cells.push(`M${pts.map(P2s).join("L")}Z`);
    }
  const yoke = [[-22, shY + 1], [-14, shY + 14], [-7, shY + 14], [0, shY + 26], [7, shY + 14], [14, shY + 14], [22, shY + 1]].map((p) => front(p as P2));
  const shade: string[] = [];
  for (let i = 0; i < 6; i++) {
    const x = hw * 0.45 + i * 5.2;
    shade.push(`M${P2s(side([x, shY + 22 + i * 2]))}L${P2s(side([x + 6, HEM - 6]))}`);
  }
  const farRight = V.s > 0.5;
  const nearArm: "L" | "R" | "both" = Math.abs(V.s) > 0.5 ? (farRight ? "L" : "R") : "both";
  const anc = figureAnchors(INCA, q, at, scale);
  const crown = anc.crown;
  const ys = -2.5 * Math.sin(crown.yaw);
  return (
    <g>
      <Figure spec={INCA} pose={q} at={at} scale={scale} uid={`${uid}-b`} ink={ink} />
      <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`}>
        <g transform={`translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`}>
          <path d={tunicD} fill="none" stroke={DARK} strokeOpacity={0.62} strokeWidth={5.2} strokeLinejoin="round" />
          <path d={tunicD} fill={ink.main} {...OUTL} />
          <clipPath id={`${uid}-tun`}>
            <path d={tunicD} />
          </clipPath>
          <g clipPath={`url(#${uid}-tun)`}>
            <path d={cells.join("")} fill={DARK} fillOpacity={0.74} />
            <path d={`M${yoke.map(P2s).join("L")}`} fill={ink.deep} stroke={DARK} strokeWidth={1.6} strokeOpacity={0.85} strokeLinejoin="round" />
            <path d={shade.join("")} fill="none" stroke={DARK} strokeWidth={1} strokeOpacity={0.55} strokeLinecap="round" />
            <path d={`M${P2s(side([-(hw + 8), cy0 - 4]))}L${P2s(side([hw + 8, cy0 - 4]))}`} stroke={DARK} strokeWidth={1.3} strokeOpacity={0.7} />
          </g>
        </g>
      </g>
      {held}
      <Figure spec={INCA} pose={q} at={at} scale={scale} uid={`${uid}-a`} body={false} arms={nearArm} ink={ink} />
      <g transform={`translate(${crown.at[0].toFixed(2)} ${crown.at[1].toFixed(2)}) rotate(${crown.rot.toFixed(2)}) scale(${crown.scale.toFixed(4)}) translate(${ys.toFixed(2)} 0)`}>
        <path d="M-25,-19Q0,-13 25,-19L25.5,-11Q0,-5 -25.5,-11Z" fill={DARK} fillOpacity={0.9} stroke={DARK} strokeWidth={1.2} />
        <path d="M-18,-15.6l2,5M-9,-14.2l2,5M0,-13.8l2,5M9,-14.2l2,5M18,-15.6l2,5" stroke={ink.deep} strokeWidth={1.1} strokeOpacity={0.75} />
        <path d={`M${(-24 * Math.cos(crown.yaw)).toFixed(1)},-12l-2,11`} stroke={DARK} strokeWidth={2.4} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NATIVES: backs to the gap, each head bowed over his own record held in both hands in front of him; on
// "not learning from each other" each takes two slow steps further OUTWARD (one walk cycle, f92-120), the empty
// middle widening. They never turn, never look across.
// ---------------------------------------------------------------------------
const AZ_SPEC = CAST_SPECS.commoner;
/** the Aztec faces screen left (away from the gap): armR is his near arm, armL the far */
const AZ_READ: FigPose = {
  ...STAND,
  yaw: -0.9,
  headYaw: -0.95,
  pitch: 24,
  brow: 0.3,
  lids: 0.35,
  lean: -2,
  armR: { w: [-46, -198], elbow: [0.6, 1], fist: 0.6, hand: -25 },
  armL: { w: [-92, -202], elbow: [0.3, 1], fist: 0.6, hand: -10 },
};
/** the Inca faces screen right, the mirror */
const IN_READ: FigPose = mirrorPose(AZ_READ);
const stepD = (f: number) => STEP * ease((f - STEP_F[0]) / (STEP_F[1] - STEP_F[0]));
const STRIDE = STEP / 2; // two steps = one walk cycle = STEP units
/** the walk's legs only, laid over the reading pose (the arms keep the record); the planted foot never slides */
const nativePose = (base: FigPose, f: number, seed: number): FigPose => {
  const d = stepD(f);
  const v = Math.abs(stepD(f + 0.5) - stepD(f - 0.5));
  const vMax = (1.5 * STEP) / (STEP_F[1] - STEP_F[0]);
  const amount = Math.min(1, (v / vMax) * 2.2);
  const q = walkPose(base, d / (2 * STRIDE), amount, STRIDE);
  return idle({ ...q, armL: base.armL, armR: base.armR }, f, seed, 0.7);
};
/** the bottom row is not drawn until the camera starts down; each man is then revealed whole with the house
 *  entrance (slides up 24 px while fading in over 14 f), the Aztec first, both fully in by f70 */
export const ENTER = { aztec: 52, inca: 56, frames: 14, rise: 24 } as const;
const entrance = (f: number, f0: number) => ease((f - f0) / ENTER.frames);

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const LearningFromEachOtherV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = swayCam(camAt(f), f);

  // ---- the top row --------------------------------------------------------------------------------------
  const tracks = [sp0Track, sp1Track, sp2Track];
  const poses = tracks.map((t, i) => idle(t(f), f, i + 1, 0.8));
  const ats: P2[] = TOP_X.map((x) => [x, TOP_Y]);
  const inks = [ORANGE, relayInk(ease((f - C1 - 1) / 12)), relayInk(ease((f - C2 - 1) / 12))];
  const grip = (i: number, arm: "L" | "R") => gripOf(SP_SPEC[i], poses[i], ats[i], arm);
  const inR = (i: number) => add(grip(i, "R"), mulv(OFF_R, SCALE));
  const inL = (i: number) => add(grip(i, "L"), mulv(OFF_L, SCALE));
  /** where the taker's book is: in his left hand, then (the swap) into his right */
  const takerBook = (i: number, sw: [number, number]) => {
    const t = ease((f - sw[0] - 1) / (sw[1] - sw[0] - 1));
    return mixv(inL(i), inR(i), t);
  };
  // the copy coincides with the giver's book on the contact frame, then rides with the taker's hand
  const poseAt = (i: number, fr: number) => idle(tracks[i](fr), fr, i + 1, 0.8);
  const bookR = (i: number, fr: number) => add(gripOf(SP_SPEC[i], poseAt(i, fr), ats[i], "R"), mulv(OFF_R, SCALE));
  const bookL = (i: number, fr: number) => add(gripOf(SP_SPEC[i], poseAt(i, fr), ats[i], "L"), mulv(OFF_L, SCALE));
  const fix1 = sub(bookR(0, C1), bookL(1, C1));
  const fix2 = sub(add(bookR(1, C2), fix1), bookL(2, C2));

  const books: (P2 | null)[] = [inR(0), f >= C1 ? add(takerBook(1, SW2), fix1) : null, f >= C2 ? add(takerBook(2, SW3), fix2) : null];
  // which arm is drawn over the book: the hand that holds it (both while it changes hands)
  const bookArm = (i: number): "L" | "R" | "both" => {
    if (i === 0) return "R";
    const sw = i === 1 ? SW2 : SW3;
    const c = i === 1 ? C1 : C2;
    if (f < c) return "L";
    if (f < sw[0] - 2) return "L";
    if (f <= sw[1] + 2) return "both";
    return "R";
  };
  const otherArm = (a: "L" | "R" | "both"): "L" | "R" | "none" => (a === "both" ? "none" : a === "L" ? "R" : "L");

  // ---- the bottom row -----------------------------------------------------------------------------------
  const nInk = CREAM;
  const azIn = entrance(f, ENTER.aztec);
  const inIn = entrance(f, ENTER.inca);
  const azAt: P2 = [540 - NATIVE_X0 - stepD(f), BOT_Y];
  const inAt: P2 = [540 + NATIVE_X0 + stepD(f), BOT_Y];
  const azPose = nativePose(AZ_READ, f, 5);
  const inPose = nativePose(IN_READ, f, 6);
  const azA = figureAnchors(AZ_SPEC, azPose, azAt, SCALE);
  const inA = figureAnchors(INCA, inPose, inAt, SCALE);
  const codexAt = add(mixv(azA.handL, azA.handR, 0.5), [-2, -30]);
  const quipuSwing = 2.2 * Math.sin(f / 9) + 5 * (stepD(f + 0.5) - stepD(f - 0.5));

  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        {/* the bottom row: the Aztec (left), the empty place, the Inca (right) */}
        {azIn > 0.001 ? (
          <g opacity={azIn} transform={`translate(0 ${(ENTER.rise * (1 - azIn)).toFixed(3)})`}>
            <Commoner uid="l3-az" pose={azPose} at={azAt} scale={SCALE} ink={nInk} shield={false} club={false} />
            <Codex at={codexAt} scale={SCALE} ink={nInk} facing={-1} />
            <Figure spec={AZ_SPEC} pose={azPose} at={azAt} scale={SCALE} uid="l3-az-ar" body={false} arms="R" ink={nInk} />
          </g>
        ) : null}
        {inIn > 0.001 ? (
          <g opacity={inIn} transform={`translate(0 ${(ENTER.rise * (1 - inIn)).toFixed(3)})`}>
            <Inca uid="l3-in" pose={inPose} at={inAt} scale={SCALE} ink={nInk} held={<Quipu a={inA.handL} b={inA.handR} scale={SCALE} ink={nInk} swing={-quipuSwing} />} />
          </g>
        ) : null}

        {/* the top row: bodies (with the free arm), then the books (the taker's copy under the giver's), then the book hands */}
        {[2, 1, 0].map((i) => (
          <Figure key={`b${i}`} spec={SP_SPEC[i]} pose={poses[i]} at={ats[i]} scale={SCALE} uid={`l3-s${i}`} ink={inks[i]} arms={otherArm(bookArm(i))} />
        ))}
        {[2, 1, 0].map((i) => {
          const b = books[i];
          return b ? <Book key={`k${i}`} at={b} scale={SCALE} rot={BOOK_ROT} /> : null;
        })}
        {[2, 1, 0].map((i) => (
          <Figure key={`a${i}`} spec={SP_SPEC[i]} pose={poses[i]} at={ats[i]} scale={SCALE} uid={`l3-s${i}-h`} body={false} arms={bookArm(i)} ink={inks[i]} />
        ))}
      </WorldSvg>
    </TexcocoPage>
  );
};

export default LearningFromEachOtherV3;
