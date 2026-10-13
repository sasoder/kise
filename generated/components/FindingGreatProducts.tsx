import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, lerp, smoothstep } from "./stoutShared";
import {
  AgentTile,
  CUTS,
  FPS,
  FRAME_H,
  FRAME_W,
  LEDGE_H,
  LIFT_DY,
  Ledge,
  LightSweep,
  MuseStage,
  ProductTile,
  TILE,
  amberBandM,
  liftAt,
  tileRect,
  tone,
  toScreenM,
  winU,
  type Cam,
  type GlyphName,
} from "./museShared";

// ---------------------------------------------------------------------------
// FindingGreatProducts — cut 2 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta
// episode). Cheeky Pint S4 style (stoutShared, palette B1) on the clip's family (museShared.tsx; brief
// out/musecommerce/briefs/BRIEF.md; out/musecommerce/WORLD_READY.md). 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: Out of a whole wall of products, the agent picks out the few great ones for you.
//
// THE LINE (heard just before: "a lot of people are trusting the agents to shop for them."):
//   "I think the agents are finding them, you know, in my case, like great teas or who's ever case, like
//    great products for them to purchase."
// ONSETS (f, 23.976): And -6 · I 0 · think 4 · the 6 · agents 9 · are 12 · finding 16 · them, 22 · you 32 ·
//   know, 37 · in 41 · my 41 · case, 43 · like 51 · great 53 · teas 59 · or 65 · who's 74 · ever 82 · case, 85 ·
//   like 95 · great 99 · products 102 · for 110 · them 113 · to 116 · purchase. 119 · (slot ends 131)
// WINDOW: seq 18.769 -> 24.233, span 5.464 s. DURATION = round(5.464 x 23.976) = 131, + 16-frame tail = 147.
//
// ONE MOTION: the amber agent glides at one constant speed along its lane in a wall of board-tone products;
// each tile it passes directly under and picks turns cream and lifts one elevation; the camera, which rode
// close with it, opens out to the whole wall: dozens of board tiles, three cream ones, the agent beside the last.
//
// GESTURES (gesture -> words -> frames)
//   f0: close on the agent already gliding left to right (9.17 world px/f), shelves of board products passing
//     above and below; the camera tracks with a slight lead -> "I think the agents are finding them" -> f0-52
//   PICK 1 (FIRST_PICK): the agent is directly under it on f56 (contact); it turns cream (12 f) and lifts
//     (7 f) from f57 -> "great teas" (f53-65)
//   the camera lets the agent run ahead and pulls out and up into the wall -> "or who's ever case, like great
//     products" -> f66-122 (target; the damped camera lands ~f128)
//   PICK 2 (sneaker, two columns on): contact f80, reacts f81 -> "who's ever case" (f74-85); the picks stand on
//     columns 0, 2 and 4, evenly spaced, so the trio reads as three
//   PICK 3 (headphones): contact f104, reacts f105; THE ONE CLICK, a LightSweep across it as it lifts,
//     f104-115 -> "products" (f102)
//   the agent slows from f106 and comes to rest one tile on, beside the last pick, on f126, settling one
//     elevation f118-127 -> "for them to purchase" (f110-125)
//   f126-146: the wall (k ~1.47, tiles ~141 px), edge to edge; the three cream picks (row centred y ~880) and the
//     agent grouped around the frame middle with >= 60 px side margins; a slow lateral creep.
// Nothing else: no labels, no counters.
// ---------------------------------------------------------------------------

/** The first pick's glyph: "tshirt" (the director's default: the speaker's tees) or "tea". */
export const FIRST_PICK: "tshirt" | "tea" = "tshirt";

export { FPS };
export const DURATION = CUTS.FindingGreatProducts.duration; // 147

export const schema = z.object({
  /** the first pick's glyph (the transcript word is "teas" / "tees") */
  firstPick: z.enum(["tshirt", "tea"]).default(FIRST_PICK),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the wall (world px): columns COL apart, shelves PITCH apart; row 0 is the agent's lane ------------------
const COL = 110;
const PITCH = 128;
const ROW_TOP = -8; // the wall runs past the frame top and bottom in every framing
const ROW_BOTTOM = 7;
const floorOf = (r: number) => r * PITCH;
const colX = (c: number) => c * COL;

// --- the agent's run: constant speed, directly under column 0 on F_PICK1 -------------------------------------
const SPEED = COL / 12; // world px per frame
const F_PICK1 = 56;
const F_PICK2 = 80; // column 2
const F_PICK3 = 104; // column 4
const F_SLOW = 106;
const SLOW_F = 20; // rests on F_SLOW + SLOW_F = 126, on column 5
const F_REST = F_SLOW + SLOW_F;
const agentX = (f: number) => {
  const lin = (g: number) => (g - F_PICK1) * SPEED;
  if (f <= F_SLOW) return lin(f);
  const u = clamp01((f - F_SLOW) / SLOW_F);
  // speed falls as 1 - smoothstep(u): distance = SPEED x SLOW_F x (u - u^3 + u^4 / 2)
  return lin(F_SLOW) + SPEED * SLOW_F * (u - u * u * u + (u * u * u * u) / 2);
};

type Pick = { r: number; c: number; f: number };
const PICKS: Pick[] = [
  { r: -1, c: 0, f: F_PICK1 },
  { r: -1, c: 2, f: F_PICK2 },
  { r: -1, c: 4, f: F_PICK3 },
];
const SWEEP_F0 = F_PICK3;
const SWEEP_F1 = F_PICK3 + 11;

// --- the mixed products ---------------------------------------------------------------------------------
const SHELF: GlyphName[] = ["tea", "headphones", "guitar", "backpack", "parcel", "tshirt", "book", "watch", "lamp", "mug", "gift", "camera", "bag", "sneaker"];
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** What stands in for a pick's glyph on the shelves around the picks. */
const PLAIN: GlyphName[] = ["book", "lamp", "camera", "mug", "watch", "backpack"];
const glyphAt = (r: number, c: number, pickGlyphs: GlyphName[]): GlyphName => {
  const g = SHELF[mod(r * 5 + c * 3, SHELF.length)];
  // no twin of a picked product on the picks' own shelf or right above / below a pick: the trio is the only one
  const near = PICKS.some((p) => Math.abs(p.r - r) <= 1 && Math.abs(p.c - c) <= 1) || (r === PICKS[0].r && c >= PICKS[0].c - 3 && c <= PICKS[2].c + 4);
  if (!near || !pickGlyphs.includes(g)) return g;
  // the stand-in: not what its left / right neighbours carry
  const beside = [SHELF[mod(r * 5 + (c - 1) * 3, SHELF.length)], SHELF[mod(r * 5 + (c + 1) * 3, SHELF.length)]];
  const i0 = mod(r * 2 + c, PLAIN.length);
  for (let j = 0; j < PLAIN.length; j++) {
    const cand = PLAIN[(i0 + j) % PLAIN.length];
    if (!beside.includes(cand)) return cand;
  }
  return PLAIN[i0];
};

// --- the camera: a target (riding with the agent, then opening to the wall) under the house damped follower ----
const STIFF = 0.09;
const DAMP = 0.468;
const LAG = (SPEED * DAMP) / STIFF; // the follower's steady lag behind a target moving at SPEED
const LEAD = 34; // the camera's look runs this far ahead of the agent (world px)
const PAN0 = 50;
const PAN1 = 128;
const PULL0 = 52;
const PULL1 = 114;
const K_CLOSE = 2.25;
const LOOK_Y_CLOSE = -TILE / 2;
const LOOK_Y_WIDE = -124; // the picks' row lands near screen y 880, the agent just under the middle
const CREEP = 0.3; // world px per frame: the slow lateral creep of the wide view
const X_WIDE = 274; // the wide view's look x on PAN1: picks + agent (world x -48..598) centred on ~f136
const trackX = (f: number) => agentX(f) + LEAD + LAG;
/** The look's x: riding with the agent until PAN0, then ONE decelerating curve (a Hermite span, C1 at both
 *  ends) into the wide view's slow creep: the agent runs ahead, and the first pick stays in the frame. */
const lookX = (f: number) => {
  if (f <= PAN0) return trackX(f);
  if (f >= PAN1) return X_WIDE + CREEP * (f - PAN1);
  const D = PAN1 - PAN0;
  const t = (f - PAN0) / D;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * trackX(PAN0) + (t3 - 2 * t2 + t) * SPEED * D + (-2 * t3 + 3 * t2) * X_WIDE + (t3 - t2) * CREEP * D;
};
const camTarget = (f: number): Cam => {
  const e = smoothstep(winU(f, PULL0, PULL1));
  const kClose = K_CLOSE - 0.0012 * f; // a slow breath out while it rides
  const kWide = 1.5 - 0.0004 * (f - PULL0); // (tiles ~141 px in the resolved frame) and it keeps opening, very slowly, to the end
  return {
    x: lookX(f),
    y: lerp(LOOK_Y_CLOSE, LOOK_Y_WIDE, e),
    k: Math.exp(lerp(Math.log(kClose), Math.log(kWide), e)),
  };
};
const PRE = 80;
const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let c = camTarget(-PRE);
  c = { ...c, x: c.x - LAG };
  let v = { x: SPEED, y: 0, k: 0 };
  for (let f = -PRE; f <= DURATION + 3; f++) {
    if (f > -PRE) {
      const t = camTarget(f);
      v = { x: v.x + (t.x - c.x) * STIFF - v.x * DAMP, y: v.y + (t.y - c.y) * STIFF - v.y * DAMP, k: v.k + (t.k - c.k) * STIFF - v.k * DAMP };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    if (f >= 0) out.push({ ...c });
  }
  return out;
})();
export const camAt = (f: number): Cam => {
  const a = Math.max(0, Math.min(CAM_TRACK.length - 2, Math.floor(f)));
  const t = clamp01(f - a);
  const A = CAM_TRACK[a];
  const B = CAM_TRACK[a + 1];
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
};
/** Numbers for the report (bun -e): the agent's and the picks' screen positions on a frame. */
export const probe = (f: number) => {
  const cam = camAt(f);
  return {
    cam,
    agent: toScreenM(cam, agentX(f), -TILE / 2),
    picks: PICKS.map((p) => toScreenM(cam, colX(p.c), floorOf(p.r) - TILE / 2)),
  };
};

const FindingGreatProducts: React.FC<Props> = ({ firstPick }) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandM(cam);
  const pickGlyphs: GlyphName[] = [firstPick, "sneaker", "headphones"];

  // what the camera sees (+ a margin for the sway and the shadows)
  const M = 130;
  const vx0 = cam.x - FRAME_W / 2 / k - M;
  const vx1 = cam.x + FRAME_W / 2 / k + M;
  const vy0 = cam.y - FRAME_H / 2 / k - M;
  const vy1 = cam.y + FRAME_H / 2 / k + M;
  const c0 = Math.floor(vx0 / COL);
  const c1 = Math.ceil(vx1 / COL);
  // the ledges run far past both frame edges (their ends are never seen)
  const lx0 = (c0 - 4) * COL;
  const lx1 = (c1 + 4) * COL;

  const rows: number[] = [];
  for (let r = ROW_TOP; r <= ROW_BOTTOM; r++) if (floorOf(r) + LEDGE_H > vy0 && floorOf(r) - TILE < vy1) rows.push(r);
  const cols: number[] = [];
  for (let c = c0; c <= c1; c++) cols.push(c);

  const ax = agentX(f);
  const agentLift = 1 - smoothstep(winU(f, F_REST - 8, F_REST + 1));
  const e = smoothstep(winU(f, PULL0, PULL1));
  const pool = { x: lerp(ax, 330, 0.5 * e), y: lerp(-60, -130, e) };

  const p3 = PICKS[2];
  const p3lift = liftAt(f, p3.f);
  const p3rect = tileRect(colX(p3.c), floorOf(p3.r) - LIFT_DY * smoothstep(p3lift));

  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM_TRACK[0]} pool={pool}>
        {rows.map((r) => (
          <React.Fragment key={r}>
            <Ledge x0={lx0} x1={lx1} y={floorOf(r)} k={k} dim={1} />
            {r === 0
              ? null
              : cols.map((c) =>
                  PICKS.some((p) => p.r === r && p.c === c) ? null : <ProductTile key={c} x={colX(c)} floor={floorOf(r)} k={k} glyph={glyphAt(r, c, pickGlyphs)} dim={1} />,
                )}
            {/* this shelf's picks last: a lifted tile's shadow falls on its neighbours */}
            {PICKS.map((p, j) =>
              p.r === r ? <ProductTile key={`p${j}`} x={colX(p.c)} floor={floorOf(r)} k={k} glyph={pickGlyphs[j]} dim={tone(f, p.f)} lift={liftAt(f, p.f)} /> : null,
            )}
            {r === PICKS[2].r ? <LightSweep {...p3rect} k={k} t={winU(f, SWEEP_F0, SWEEP_F1)} on="cream" /> : null}
            {r === 0 ? <AgentTile x={ax} floor={0} k={k} band={band} lift={agentLift} /> : null}
          </React.Fragment>
        ))}
      </MuseStage>
    </AbsoluteFill>
  );
};

export default FindingGreatProducts;
