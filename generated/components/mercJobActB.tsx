import React from "react";
import {
  ACT_A_POOL_STRENGTH,
  CAPTION_Y,
  F1_ANCHOR,
  F1_BOX,
  FLOOR,
  FRAME_W,
  GRID,
  GRID_BOX,
  GRID_CENTRE,
  GRID_OTHERS,
  MX,
  MercJobWorld,
  REST_STATE_B,
  TILE,
  TILE_TOP,
  TOP_CLEAR,
  TOTO_H,
  TOTO_HOME,
  TOTO_ON_MERC,
  WX,
  camCheckL,
  makeClockCam,
  makePoolTrack,
  restToRest,
  toScreenL,
  viewOf,
  type Cam,
  type Glide,
  type WorldState,
} from "./mercJobShared";
import { clamp01, lerp, smoothstep } from "./stoutShared";

// ===========================================================================
// mercJobActB — ACT B of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01): cuts 4-5
// (HeadOfMercedes, BestJobs) at 9:16 (1080x1920) on ONE continuous story clock S, in the clip's one world
// (mercJobShared.tsx, Builder A's; nothing here edits it).
//
// THE CLOCK: cut 4 renders S = f (0 .. 106); cut 5 renders S = 91.2 + f (0 .. 53), cut 4's clock at
// 91.2 (seq 62.56 - 58.76 = 3.80 s = 91.2 f), so the join is exact (every state is a pure function of S;
// the camera and the pool are sampled linearly between integer frames).
//
// THE MOTION (one per cut; words are landings):
//   cut 4: a slow creep on the pair (Williams | Toto | Mercedes) drifting toward Mercedes while the pool
//          slides from Toto onto the Mercedes tile -> Toto wakes (lifts one elevation in place) as the camera
//          starts to lead, rises up and over onto the Mercedes tile's top (its head); the camera leads him
//          into a single-subject framing (tile ~345 px), Williams leaving the frame edge decisively; the ONE
//          LightSweep crosses the tile as he lands -> a held breath creeping in -> from "is" one long C1
//          pull-out begins.
//   cut 5: the pull-out carries on, out and down to the whole F1 GRID FORMATION (the two staggered columns,
//          Williams + Mercedes in its third row); every other team comes up out of the ground and tones
//          DARK -> board as the widening view reaches it (a front out from the pair's row, up and down,
//          decelerating with the zoom); the F1 mark slides up + fades in over the front row on "industry";
//          rest, then a tail drift.
// ===========================================================================

export const DUR_B = { HeadOfMercedes: 107, BestJobs: 54 } as const; // round(span x 24) + 16 (header of each cut)
export const S_B = { HeadOfMercedes: 0, BestJobs: 91.2 } as const;
export const S_B_END = S_B.BestJobs + DUR_B.BestJobs - 1; // 144.2
const C5 = S_B.BestJobs;

/** Act B's gestures on the clock (S). Comments: cut, frames, the word. */
export const ACT_B = {
  // c4 f0-38 "need to pinch myself because you know": the pool slides from Toto onto Mercedes
  poolToMerc: [-4, 38],
  // c4 f24-31: Toto wakes, lifting one elevation in place, just before the camera starts to lead (f26):
  // his first visible motion is the lift ("you know" f32-36, ahead of "being" f39)
  totoLift: [24, 31],
  // c4 f29-62 "being the head of Mercedes": up and over onto the Mercedes tile's top; x lands f58-60
  // ("Mercedes" f56) and the settle closes f62
  totoMove: [29, 62],
  totoSettle: [55, 62],
  // c4 f55-67: THE CLICK, a LightSweep across the Mercedes tile under his landing
  sweep: [55, 67],
  // c5 f18-34 "industry": the F1 mark slides up + fades in over the front row (lands ~f30)
  f1: [C5 + 18, C5 + 34],
} as const;
const winU = (S: number, w: readonly [number, number]) => (S - w[0]) / (w[1] - w[0]);

// --- Toto: up and over ----------------------------------------------------------------------------
/** The vertical progress runs RISE_LEAD ahead of the horizontal (he is at the tile top's height before
 *  his right edge reaches the tile's left edge: asserted below). */
export const RISE_LEAD = 1.1;
export const totoB = (S: number) => {
  const u = winU(S, ACT_B.totoMove);
  const ux = restToRest(u, 2.5);
  const uy = restToRest(clamp01(u * (1 + RISE_LEAD)), 2.5);
  const lift = smoothstep(winU(S, ACT_B.totoLift)) * (1 - smoothstep(winU(S, ACT_B.totoSettle)));
  return { x: lerp(TOTO_HOME.x, TOTO_ON_MERC.x, ux), feetY: lerp(TOTO_HOME.feetY, TOTO_ON_MERC.feetY, uy), lift };
};

// --- the camera (look = the world point on screen (540, 835)) -------------------------------------
/** The pair framing: Williams' left edge to Mercedes' right edge, centred; tiles ~221 px. */
export const B_START = { x: (WX - TILE / 2 + MX + TILE / 2) / 2, y: TILE_TOP + TILE / 2, k: 2.3 };
/** The landing: Mercedes + Toto on its top, one centred subject; the tile ~345 px. */
const LAND_LOOK = { x: MX, y: (TOTO_ON_MERC.feetY - TOTO_H + FLOOR) / 2, k: 3.6 };
/** The F1 mark: 2.5 tiles wide, a headline over the front row. */
export const F1_WIDTH = 2.5 * TILE;
/** The wide rest: the whole formation, from the F1 mark's top to the back row's floor, centred in the
 *  caption band (TOP_CLEAR .. CAPTION_Y) at k 1.0 (tiles 96 px). */
const F1_TOP = F1_ANCHOR.bottom - (F1_WIDTH * F1_BOX.h) / F1_BOX.w;
const WIDE_K = 1.0;
const WIDE = { x: GRID_CENTRE.x, y: (F1_TOP + GRID_BOX.y1) / 2 + (835 - (TOP_CLEAR + CAPTION_Y) / 2) / WIDE_K, k: WIDE_K };
const CREEP_DX = 16;
export const ACT_B_GLIDES: Glide[] = [
  // c4 f0-38: the creep on the pair, already running at f0, drifting toward Mercedes
  { f0: -24, f1: 46, dx: CREEP_DX, k: 2.4 },
  // c4 f26-62: leads Toto in (the pan), centring Mercedes + Toto at his landing
  { f0: 26, f1: 62, dx: LAND_LOOK.x - B_START.x - CREEP_DX, dy: LAND_LOOK.y - B_START.y, warp: 0.8 },
  // c4 f32-54: the push in to the single subject (tile ~345 px), peaking as Williams crosses the frame edge
  // (<= 3 frames under 40 % visible; asserted below)
  { f0: 32, f1: 54, k: LAND_LOOK.k, warp: 1.3 },
  // c4 f54-74: the held breath creeps on in
  { f0: 54, f1: 74, k: LAND_LOOK.k * 1.03 },
  // c4 f74 ("is") -> c5 f38: ONE long C1 pull-out across the join, out and down to the whole formation
  // (the zoom front-loaded, the travel to the formation's centre a little later)
  { f0: 74, f1: C5 + 38, k: WIDE.k, warp: 0.7 },
  { f0: 74, f1: C5 + 38, dx: WIDE.x - LAND_LOOK.x, dy: WIDE.y - LAND_LOOK.y, warp: 1.3 },
  // c5 tail: the drift
  { f0: C5 + 30, f1: C5 + 76, dx: 28, k: WIDE.k * 1.006 },
];
const ACT_B_CAM = makeClockCam(B_START, ACT_B_GLIDES, Math.ceil(S_B_END) + 2);
export const actBCam = ACT_B_CAM.at;
export const ACT_B_REST: Cam = ACT_B_CAM.rest;
export const ACT_B_CHECK = camCheckL(ACT_B_CAM.at, 0, Math.ceil(S_B_END));

// --- the formation: a front out from the pair's row, driven by the widening view ---------------------
/** An other team's tile comes up out of the ground (`appear`, over the first ROW_EMERGE of its reveal) and
 *  tones DARK -> board over REVEAL_F frames. It starts when BOTH the front (out from the pair's row, up and
 *  down: one row away at c5 f0, two at f6, three at f14, decelerating) and the (sway-free) widening view
 *  (within REVEAL_LEAD world px of it) have reached it; never before cut 5. */
const REVEAL_F = 12;
const REVEAL_LEAD = 60;
const ROW_EMERGE = 0.35;
const FRONT_F = [0, 0, 6, 14]; // c5 frame at which the front reaches a row |row - pairRow| away
export const REVEAL_START: number[] = (() => {
  const out: number[] = GRID_OTHERS.map(() => Infinity);
  for (let S = C5; S <= S_B_END + 40; S += 0.125) {
    const v = viewOf(actBCam(S));
    GRID_OTHERS.forEach((g, i) => {
      if (out[i] < Infinity) return;
      const reached =
        g.x + TILE / 2 > v.x0 - REVEAL_LEAD && g.x - TILE / 2 < v.x1 + REVEAL_LEAD && g.floor > v.y0 - REVEAL_LEAD && g.floor - TILE < v.y1 + REVEAL_LEAD;
      if (reached) out[i] = Math.max(S, C5 + FRONT_F[Math.abs(g.row - GRID.pairRow)]);
    });
  }
  return out.map((s) => (s === Infinity ? C5 + 999 : s));
})();
export const rowReveal = (S: number) => REVEAL_START.map((s0) => smoothstep((S - s0) / REVEAL_F));
const rowAppear = (S: number) => rowReveal(S).map((r) => (r <= 0 ? 0 : r >= ROW_EMERGE ? 1 : Math.round(smoothstep(r / ROW_EMERGE) * 1000) / 1000));

// --- the light pool ------------------------------------------------------------------------------
export const actBPool = makePoolTrack(
  { x: TOTO_HOME.x, y: FLOOR - TOTO_H / 2 },
  [
    { S0: ACT_B.poolToMerc[0], S1: ACT_B.poolToMerc[1], x: MX, y: TILE_TOP + TILE / 2 }, // c4: onto Mercedes ("we want you to run this")
    { S0: 46, S1: 66, x: MX, y: TILE_TOP - 8 }, // up with Toto onto its top
    { S0: 80, S1: C5 + 40, x: MX, y: TILE_TOP - 8, spread: 0.32 }, // tightens as the view widens: Mercedes + Toto stay the lit subject
  ],
  Math.ceil(S_B_END) + 2,
);

// --- the state -------------------------------------------------------------------------------------
export const actBState = (S: number): WorldState => {
  const sw = winU(S, ACT_B.sweep);
  return {
    ...REST_STATE_B,
    toto: totoB(S),
    sweep: sw > 0 && sw < 1 ? { t: sw, on: "mercTile" } : null,
    row: { dim: 1, reveal: rowReveal(S), appear: rowAppear(S) },
    f1: clamp01(winU(S, ACT_B.f1)),
    f1Width: F1_WIDTH,
  };
};

/** Act B's world at S (cuts 4-5 render this with their own S). */
export const ActBWorld: React.FC<{ S: number }> = ({ S }) => {
  const cam = actBCam(S);
  const p = actBPool(S);
  return <MercJobWorld S={S} cam={cam} rest={ACT_B_REST} pool={{ x: p.x, y: p.y, spread: p.spread, strength: ACT_A_POOL_STRENGTH }} state={actBState(S)} />;
};

// ===========================================================================
// LOAD-TIME CHECKS (Act B): the camera caps; Toto clears the Mercedes tile's corner; Williams never hovers
// at the frame edge; nothing is drawn of the formation in cut 4; the caption band and the top clearance at
// the wide rest; the last formation tile lands by ~c5 f30.
// ===========================================================================
const failB = (m: string): never => {
  throw new Error(`mercJobActB: ${m}`);
};
export const ACT_B_PROBE = { exitN: 0, entryN: 0, lastLand: 0 };
{
  const probe = (globalThis as { __MJ_PROBE__?: string[] }).__MJ_PROBE__;
  const rule = (ok: boolean, m: string) => {
    if (ok) return;
    if (probe) probe.push(m);
    else failB(m);
  };
  rule(ACT_B_CHECK.maxA <= 2.5, `Act B camera |dv| ${ACT_B_CHECK.maxA.toFixed(2)} px/f^2 at S ${ACT_B_CHECK.atA}`);
  rule(ACT_B_CHECK.maxV <= 45, `Act B camera ${ACT_B_CHECK.maxV.toFixed(1)} px/f at S ${ACT_B_CHECK.atV}`);
  for (let S = ACT_B.totoMove[0]; S <= ACT_B.totoMove[1]; S += 0.125) {
    const t = totoB(S);
    // the corner: his right edge passes the Mercedes tile's left edge only once his feet are at its top
    if (t.x + TOTO_H / 2 > MX - TILE / 2) rule(t.feetY <= TILE_TOP + 1e-6, `Toto clips the Mercedes corner (feet ${t.feetY.toFixed(2)}) at S ${S}`);
  }
  // Williams never hovers at the frame edge: <= 3 frames under 40 % visible on the push in, and on the pull-out
  for (let S = 0; S <= S_B_END; S++) {
    const c = actBCam(S);
    const a = toScreenL(c, WX - TILE / 2, 0).x;
    const b = toScreenL(c, WX + TILE / 2, 0).x;
    const fr = Math.max(0, Math.min(FRAME_W, b) - Math.max(0, a)) / (b - a);
    if (fr > 0 && fr < 0.4) {
      if (S < 70) ACT_B_PROBE.exitN++;
      else ACT_B_PROBE.entryN++;
    }
  }
  rule(ACT_B_PROBE.exitN <= 3 && ACT_B_PROBE.entryN <= 3, `Williams under 40 % at the frame edge for ${ACT_B_PROBE.exitN} / ${ACT_B_PROBE.entryN} frames`);
  // nothing of the formation is drawn in cut 4
  rule(Math.min(...REVEAL_START) >= C5, "a formation tile is drawn in cut 4");
  ACT_B_PROBE.lastLand = Math.max(...REVEAL_START) + REVEAL_F - C5;
  rule(ACT_B_PROBE.lastLand <= 34, `the last formation tile lands at c5 f${ACT_B_PROBE.lastLand.toFixed(1)}`);
  // the floor above the caption line until the wide; at the rest the whole formation in the band
  for (let S = 0; S <= S_B_END; S++) {
    const c = actBCam(S);
    rule(toScreenL(c, MX, FLOOR + 4).y + 5 <= CAPTION_Y, `the pair's floor at y ${toScreenL(c, MX, FLOOR + 4).y.toFixed(0)} on S ${S}`);
    if (S >= C5 + 40) {
      rule(toScreenL(c, GRID_BOX.x0, GRID_BOX.y1 + 4).y + 5 <= CAPTION_Y, `the back row's floor at y ${toScreenL(c, GRID_BOX.x0, GRID_BOX.y1).y.toFixed(0)} on S ${S}`);
      rule(toScreenL(c, F1_ANCHOR.x, F1_TOP).y - 5 >= TOP_CLEAR, `the F1 mark's top at y ${toScreenL(c, F1_ANCHOR.x, F1_TOP).y.toFixed(0)} on S ${S}`);
    }
  }
  if (GRID.pairRow !== 2) failB("the pair is not the third row");
}
