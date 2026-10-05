import React from "react";
import {
  CAPTION_Y,
  ACT_A_POOL_STRENGTH,
  FLOOR,
  MJPillar,
  MX,
  MercJobWorld,
  REST_STATE_B,
  ROW_X,
  TILE,
  TILE_TOP,
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
// (HeadOfMercedes, BestJobs) on ONE continuous story clock S, in the clip's one world
// (mercJobShared.tsx, Builder A's; nothing here edits it).
//
// THE CLOCK: cut 4 renders S = f (0 .. 106); cut 5 renders S = 91.2 + f (0 .. 53), cut 4's clock at
// 91.2 (seq 62.56 - 58.76 = 3.80 s = 91.2 f), so the join is exact (every state is a pure function of S;
// the camera and the pool are sampled linearly between integer frames).
//
// THE MOTION (one per cut; words are landings):
//   cut 4: a slow creep on the pair drifting toward Mercedes while the pool slides from Toto onto the
//          Mercedes tile -> Toto wakes (lifts one elevation), rises up and over onto the Mercedes tile's
//          top (its head), the camera leading him in to the tile at ~300 px; the ONE LightSweep crosses
//          the tile as he lands -> from "is" one long C1 pull-out begins.
//   cut 5: the pull-out carries on and decelerates to a wide rest; the industry row (always there, in
//          the DARK) tones DARK -> board as the widening view reaches each tile, a front moving out from
//          the pair; the F1 mark slides up + fades in over Toto on "industry"; rest, then a tail drift.
// ===========================================================================

export const DUR_B = { HeadOfMercedes: 107, BestJobs: 54 } as const; // round(span x 24) + 16 (header of each cut)
export const S_B = { HeadOfMercedes: 0, BestJobs: 91.2 } as const;
export const S_B_END = S_B.BestJobs + DUR_B.BestJobs - 1; // 144.2
const C5 = S_B.BestJobs;

/** Act B's gestures on the clock (S). Comments: cut, frames, the word. */
export const ACT_B = {
  // c4 f0-38 "need to pinch myself because you know": the pool slides from Toto onto Mercedes
  poolToMerc: [-4, 38],
  // c4 f26-33: Toto wakes, lifting one elevation in place, as the camera starts to lead (f28): his first
  // visible motion is the lift ("you know" f32-36, ahead of "being" f39)
  totoLift: [26, 33],
  // c4 f31-62 "being the head of Mercedes": up and over onto the Mercedes tile's top; x lands f58-60
  // ("Mercedes" f56) and the settle closes f62
  totoMove: [31, 62],
  totoSettle: [55, 62],
  // c4 f55-67: THE CLICK, a LightSweep across the Mercedes tile under his landing
  sweep: [55, 67],
  // c5 f18-34 "industry": the F1 mark slides up + fades in over Toto (lands ~f30)
  f1: [C5 + 18, C5 + 34],
} as const;
const winU = (S: number, w: readonly [number, number]) => (S - w[0]) / (w[1] - w[0]);

// --- Toto: up and over ----------------------------------------------------------------------------
/** The vertical progress runs RISE_LEAD ahead of the horizontal (he is at the tile top's height before
 *  his right edge reaches the tile's left edge: asserted below). */
export const RISE_LEAD = 0.8;
export const totoB = (S: number) => {
  const u = winU(S, ACT_B.totoMove);
  const ux = restToRest(u, 2.5);
  const uy = restToRest(clamp01(u * (1 + RISE_LEAD)), 2.5);
  const lift = smoothstep(winU(S, ACT_B.totoLift)) * (1 - smoothstep(winU(S, ACT_B.totoSettle)));
  return { x: lerp(TOTO_HOME.x, TOTO_ON_MERC.x, ux), feetY: lerp(TOTO_HOME.feetY, TOTO_ON_MERC.feetY, uy), lift };
};

// --- the industry row: a front out from the pair, driven by the widening view -----------------------
/** A row tile tones DARK -> board over REVEAL_F frames, starting when the (sway-free) view's edge comes
 *  within REVEAL_LEAD world px of its near edge, and never before cut 5 (the nearest pair of tiles is
 *  already in view at cut 5 f0: it starts there). */
const REVEAL_F = 12;
const REVEAL_LEAD = 150;

// --- the camera (look = the world point on screen (960, 480)) -------------------------------------
/** The pair framing: Toto at home through Mercedes, the tiles centred at ~221 px. */
export const B_START = { x: (Math.min(TOTO_HOME.x - TOTO_H / 2, WX - TILE / 2) + MX + TILE / 2) / 2, y: TILE_TOP + TILE / 2, k: 2.3 };
/** The landing: Mercedes + Toto on its top, centred; the tile ~300 px. */
const LAND_LOOK = { x: MX, y: (TOTO_ON_MERC.feetY - TOTO_H + FLOOR) / 2, k: 3.12 };
/** The wide rest: the F1 mark over Toto over the row; the row runs off both frame edges. */
export const F1_WIDTH = 2.5 * TILE;
const WIDE = { y: 470, k: 1.2 };
const CREEP_DX = 56;
export const ACT_B_GLIDES: Glide[] = [
  // c4 f0-38: the creep, already running at f0, drifting toward Mercedes
  { f0: -24, f1: 46, dx: CREEP_DX, k: 2.42 },
  // c4 f28-60: leads Toto in (the pan), centring Mercedes + Toto at his landing
  { f0: 28, f1: 60, dx: LAND_LOOK.x - B_START.x - CREEP_DX, dy: LAND_LOOK.y - B_START.y },
  // c4 f38-54: the push in to the tile ~300 px, late and quick, so Williams leaves the frame edge
  // decisively at the push's peak speed (<= 3 frames under 40 % visible; asserted below)
  { f0: 38, f1: 54, k: LAND_LOOK.k, warp: 1.3 },
  // c4 f54-80: the held breath creeps on in (the tile ~300 -> ~330 px), so the pull-out is already at
  // speed when it brings Williams back across the edge
  { f0: 54, f1: 80, k: LAND_LOOK.k * 1.16 },
  // c4 f74 ("is") -> c5 f38: ONE long C1 pull-out across the join to the wide rest (front-loaded)
  { f0: 74, f1: C5 + 38, dy: WIDE.y - LAND_LOOK.y, k: WIDE.k, warp: 0.7 },
  // c5 tail: the drift
  { f0: C5 + 32, f1: C5 + 80, dx: 16, k: WIDE.k * 1.02 },
];
const ACT_B_CAM = makeClockCam(B_START, ACT_B_GLIDES, Math.ceil(S_B_END) + 2);
export const actBCam = ACT_B_CAM.at;
export const ACT_B_REST: Cam = ACT_B_CAM.rest;
export const ACT_B_CHECK = camCheckL(ACT_B_CAM.at, 0, Math.ceil(S_B_END));

/** The world px half-width of the view at S (no sway). */
const revealStart = (() => {
  // per ROW_X tile: the first S (to 1/8 f) at which the view's edge is within REVEAL_LEAD of its near edge
  const out: number[] = ROW_X.map(() => Infinity);
  for (let S = C5; S <= S_B_END + 40; S += 0.125) {
    const v = viewOf(actBCam(S));
    ROW_X.forEach((x, i) => {
      if (out[i] < Infinity) return;
      const near = x > MX ? x - TILE / 2 : x + TILE / 2;
      const reached = x > MX ? v.x1 + REVEAL_LEAD >= near : v.x0 - REVEAL_LEAD <= near;
      if (reached) out[i] = Math.max(C5, S);
    });
  }
  return out.map((s) => (s === Infinity ? C5 + 999 : s));
})();
export const REVEAL_START = revealStart;
export const rowReveal = (S: number) => REVEAL_START.map((s0) => smoothstep((S - s0) / REVEAL_F));

// --- the light pool ------------------------------------------------------------------------------
export const actBPool = makePoolTrack(
  { x: TOTO_HOME.x, y: FLOOR - TOTO_H / 2 },
  [
    { S0: ACT_B.poolToMerc[0], S1: ACT_B.poolToMerc[1], x: MX, y: TILE_TOP + TILE / 2 }, // c4: onto Mercedes ("we want you to run this")
    { S0: 46, S1: 66, x: MX, y: TILE_TOP - 8 }, // up with Toto onto its top
    { S0: 80, S1: C5 + 40, x: MX, y: TILE_TOP - 8, spread: 0.34 }, // tightens as the view widens: Williams falls outside it
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
    row: null, // drawn by RowB (children): invisible until revealed
    f1: clamp01(winU(S, ACT_B.f1)),
    f1Width: F1_WIDTH,
  };
};

/**
 * RowB — the industry row for Act B. Before its reveal a tile is NOT DRAWN (no DARK square, edge, glyph or
 * shadow); as the widening view reaches it, it comes up out of the ground: its DARK body fades in over the
 * first third of the reveal while MJPillar tones it DARK -> board, its glyph and lit edge and shadow
 * fading in with that tone. The row stands clear of everything else, so drawing it over the world is safe.
 */
const ROW_EMERGE = 0.35;
const RowB: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const rv = rowReveal(S);
  const v = viewOf(cam);
  const m = TILE + 60 / cam.k;
  return (
    <g>
      {ROW_X.map((x, i) =>
        rv[i] > 0.0005 && x + m > v.x0 && x - m < v.x1 ? (
          <g key={x} opacity={rv[i] < ROW_EMERGE ? (Math.round(smoothstep(rv[i] / ROW_EMERGE) * 1000) / 1000).toString() : undefined}>
            <MJPillar x={x} k={cam.k} mark="chassis" dim={1} dark={1 - rv[i]} />
          </g>
        ) : null,
      )}
    </g>
  );
};

/** Act B's world at S (cuts 4-5 render this with their own S). */
export const ActBWorld: React.FC<{ S: number }> = ({ S }) => {
  const cam = actBCam(S);
  const p = actBPool(S);
  return (
    <MercJobWorld S={S} cam={cam} rest={ACT_B_REST} pool={{ x: p.x, y: p.y, spread: p.spread, strength: ACT_A_POOL_STRENGTH }} state={actBState(S)}>
      <RowB S={S} cam={cam} />
    </MercJobWorld>
  );
};

// ===========================================================================
// LOAD-TIME CHECKS (Act B): the camera caps; Toto clears the Mercedes tile's corner and is lifted while
// he crosses Williams; the floor above the caption line; the last visible row tile lands by ~c5 f30.
// ===========================================================================
const failB = (m: string): never => {
  throw new Error(`mercJobActB: ${m}`);
};
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
    // he is lifted whenever he overlaps the Williams tile
    if (t.x + TOTO_H / 2 > WX - TILE / 2 && t.x - TOTO_H / 2 < WX + TILE / 2) rule(t.lift > 0.98, `Toto crosses Williams at lift ${t.lift.toFixed(2)} on S ${S}`);
  }
  // Williams never hovers at the frame edge: <= 3 frames under 40 % visible on the push in, and on the pull-out
  let exitN = 0;
  let entryN = 0;
  for (let S = 0; S <= S_B_END; S++) {
    const c = actBCam(S);
    const a = toScreenL(c, WX - TILE / 2, 0).x;
    const b = toScreenL(c, WX + TILE / 2, 0).x;
    const fr = Math.max(0, Math.min(1920, b) - Math.max(0, a)) / (b - a);
    if (fr > 0 && fr < 0.4) {
      if (S < 70) exitN++;
      else entryN++;
    }
  }
  rule(exitN <= 3 && entryN <= 3, `Williams under 40 % at the frame edge for ${exitN} (push) / ${entryN} (pull-out) frames`);
  for (let S = 0; S <= S_B_END; S++) {
    const c = actBCam(S);
    rule(toScreenL(c, MX, FLOOR + 4).y + 5 <= CAPTION_Y, `the floor at y ${toScreenL(c, MX, FLOOR + 4).y.toFixed(0)} on S ${S}`);
  }
}
