import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AgentTile,
  CUTS,
  FPS,
  LightSweep,
  MuseStage,
  RADIUS,
  Slotted,
  TILE,
  amberBandM,
  makeClockCam,
  makePoolTrack,
  productPiece,
  toneFoot,
  type GlyphName,
  type PersonVariant,
} from "./museShared";

// ---------------------------------------------------------------------------
// GreaterPersonalization — cut 5 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta
// episode), Cheeky Pint S4 style on the clip's one family (museShared.tsx; brief
// out/musecommerce/briefs/BRIEF.md; out/musecommerce/WORLD_READY.md). 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: Today everyone gets the same thing; personalization means each person gets something of
// their own.
//
// THE LINE: "And I think the long term thing that we're quite excited about is greater personalization.
// Like ultimately, I"
// ONSETS (f, at 23.976): And 2 · I 3 · think 5 · the 8 · long 12 · term 27 · thing 36 · that 48 · we're 53 ·
// quite 58 · excited 62 · about 70 · is 75 · greater 83 · personalization. 91 · Like 115 · ultimately, 117 ·
// I 136 · (slot ends 139)
// WINDOW: seq 64.940 -> 70.737, span 5.797 s. DURATION = round(5.797 x 23.976) = 139, + 16-frame tail = 155.
//
// ONE MOTION: three people each hold the same plain board box. The amber agent slides along a lane just
// below the row in one pass, left to right; as it comes directly beneath each person, that person's box
// turns over about its vertical axis and its other face is their own cream product (sneaker, book, guitar).
// The turns follow the agent as one wave; the agent slows to rest beneath the third person, a little past
// them. The camera holds the agent and all three people in frame throughout: a slow drift right and
// push in with the agent until the three people span the frame.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.GreaterPersonalization.duration; // 155

export const schema = z.object({
  /** a fractional offset on the cut's clock (checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** The third person's own thing (one constant: "guitar" per the brief; "headphones" / "camera" if it is weak). */
const THIRD_GLYPH: GlyphName = "guitar";

// --- the world (world px): people stand on y = 0; the agent's lane lies directly below them, tucked a hair
// BEHIND their feet (so the person's one shadow falls on the agent on the contact frame) ---------------------
const PITCH = 110;
const PEOPLE: { x: number; variant: PersonVariant; glyph: GlyphName }[] = [
  { x: 0, variant: "plain", glyph: "sneaker" },
  { x: PITCH, variant: "long", glyph: "book" },
  { x: 2 * PITCH, variant: "cap", glyph: THIRD_GLYPH },
];
const PEOPLE_FLOOR = 0;
const PEOPLE_TOP = PEOPLE_FLOOR - TILE;
/** The agent's lane: one tile lower, less a small tuck under the people's feet (touching = the cause). */
const LANE_DROP = TILE - 6;
const AGENT_FLOOR = PEOPLE_FLOOR + LANE_DROP;
/** The box each person holds: a tile nearly as wide as the person, standing in the slot of their top edge. */
const BOX = 88;
const SAME_BOX = productPiece("parcel", BOX);
/** The box is a slab: seen edge-on it is this thick (world px), so it never vanishes mid-turn. */
const BOX_THICK = 11;

// --- the clock ------------------------------------------------------------------------------------------
/** The agent is directly beneath person i on PASS_F[i] (contact = the cause of that person's turn). It
 *  passes the first two at constant speed (PASS_STEP frames a pitch) and slows through the third. */
const PASS_0 = 75;
const PASS_STEP = 11;
const PASS_LAST = 16; // frames from the second contact to the third (the agent is already slowing)
const PASS_F = [PASS_0, PASS_0 + PASS_STEP, PASS_0 + PASS_STEP + PASS_LAST]; // 75, 86, 102
/** A box turns over this many frames, starting on its contact frame. */
const FLIP_F = 16;
/** The one click: the sweep crosses the third product as it comes flat. */
const SWEEP_F0 = PASS_F[2] + FLIP_F - 4; // 114
const SWEEP_F1 = SWEEP_F0 + 11;
/** The agent's speed (world px / frame): a slow slide that gathers into the pass, constant from the first
 *  person to the second, then one even slowing (linear in speed) that takes it beneath the third person on
 *  PASS_F[2] and to rest a little past them: v0 t - v0 t^2 / (2 L) = PITCH at t = PASS_LAST gives L. */
const V_PASS = PITCH / PASS_STEP; // 10
const V_SLOW = 0.3;
const RAMP_F0 = 40; // the slow slide until here, then it gathers (it starts close: the whole row is in frame)
const RAMP_F1 = PASS_0 - 1;
const RAMP_POW = 5;
const LAND_F = (V_PASS * PASS_LAST * PASS_LAST) / (2 * (V_PASS * PASS_LAST - PITCH)); // 25.6
const speedAt = (f: number) => {
  if (f <= RAMP_F1) return V_SLOW + (V_PASS - V_SLOW) * Math.pow(Math.max(0, f - RAMP_F0) / (RAMP_F1 - RAMP_F0), RAMP_POW);
  if (f <= PASS_F[1]) return V_PASS;
  return V_PASS * Math.max(0, 1 - (f - PASS_F[1]) / LAND_F);
};
/** The agent's x per 1/8 frame (integrated speed), pinned so it is exactly beneath person 0 on PASS_0. */
const SUB = 8;
const AGENT_X: number[] = (() => {
  const xs: number[] = [0];
  for (let i = 1; i <= (DURATION + 4) * SUB; i++) xs.push(xs[i - 1] + speedAt((i - 0.5) / SUB) / SUB);
  const at0 = xs[PASS_0 * SUB];
  return xs.map((x) => x - at0 + PEOPLE[0].x);
})();
export const agentX = (f: number) => {
  const q = Math.max(0, Math.min(AGENT_X.length - 2, f * SUB));
  const i = Math.floor(q);
  return AGENT_X[i] + (AGENT_X[i + 1] - AGENT_X[i]) * (q - i);
};
export const AGENT_START_X = AGENT_X[0];
export const AGENT_END_X = AGENT_X[AGENT_X.length - 1];

/** One box's turn: near-constant angular speed with a little ease (the cosine already eases the width at
 *  both ends). c = the signed cosine: 1 = the board face flat, 0 = edge-on, -1 = the cream face flat. */
const turnAt = (u: number) => {
  const q = Math.max(0, Math.min(1, u));
  const t = q + 0.35 * (q * q * (3 - 2 * q) - q);
  const c = Math.cos(Math.PI * t);
  return { t, c, s: Math.sin(Math.PI * t) };
};

// --- camera: the agent and all three people are WHOLLY in frame for the whole cut: it opens a little wide,
// then drifts right and pushes in with the agent until the three people span the frame; never still -------------------------
const LOOK_WY = PEOPLE_TOP - 1.75; // the people's top edge (= the products' feet) on screen y ~ 965
const K_OPEN = 2.5;
const K_CLOSE = 2.82;
const X_OPEN = AGENT_START_X - TILE / 2 + (540 - 46) / K_OPEN; // the agent's left edge ~45 px in; all three people whole
const X_CLOSE = PEOPLE[1].x + (AGENT_END_X - PEOPLE[2].x) / 2 - 1; // the row, eased toward the resting agent
export const CAM = makeClockCam(
  { x: X_OPEN, y: LOOK_WY, k: K_OPEN },
  [
    // the opening creep, already running on f0
    { f0: -40, f1: 60, dx: 5, k: K_OPEN + 0.04 },
    // travelling right and pulling back with the agent, holding all three by the third turn
    { f0: 42, f1: 102, dx: X_CLOSE - X_OPEN - 5, k: K_CLOSE },
    // the settled creep through the tail
    { f0: 94, f1: 190, dx: 7, k: K_CLOSE + 0.08 },
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: AGENT_START_X + 60, y: PEOPLE_TOP + 10 },
  [
    { f0: -30, f1: 60, x: PEOPLE[0].x - 10, y: PEOPLE_TOP - 20 },
    { f0: 60, f1: 112, x: PEOPLE[2].x - 20, y: PEOPLE_TOP - 44 },
    { f0: 112, f1: 190, x: PEOPLE[1].x + 20, y: PEOPLE_TOP - 50 },
  ],
  DURATION,
);

const GreaterPersonalization: React.FC<Props> = ({ sOffset }) => {
  const f = useCurrentFrame() + sOffset;
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandM(cam);
  const sweepT = (f - SWEEP_F0) / (SWEEP_F1 - SWEEP_F0);
  const third = { x: PEOPLE[2].x - BOX / 2, y: PEOPLE_TOP - BOX, w: BOX, h: BOX };
  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)}>
        {/* the agent, in its lane below the row and behind it: the people's shadows fall on it as it passes */}
        <AgentTile x={agentX(f)} floor={AGENT_FLOOR} k={k} band={band} slot={false} />
        {PEOPLE.map((p, i) => {
          const turn = turnAt((f - PASS_F[i]) / FLIP_F);
          const back = turn.c < 0;
          const scaleX = Math.max(0.02, Math.abs(turn.c));
          // the cream face comes round out of its own shade (edge-on = unlit), never brighter than cream
          const shade = back ? 0.45 * (1 - scaleX) : 1;
          // the slab's edge: it swings across the box, left to right (with the agent), widest edge-on
          const ew = BOX_THICK * turn.s;
          const ex = p.x - (BOX / 2) * turn.c;
          return (
            <React.Fragment key={i}>
              <Slotted
                x={p.x}
                floor={PEOPLE_FLOOR}
                k={k}
                face={{ kind: "person", variant: p.variant }}
                piece={back ? productPiece(p.glyph, BOX) : SAME_BOX}
                out={1}
                pieceDim={shade}
                pieceFlip={scaleX}
              />
              {ew > 0.05 ? (
                <rect
                  x={ex - ew / 2}
                  y={PEOPLE_TOP - BOX}
                  width={ew}
                  height={BOX}
                  rx={Math.min(ew / 2, (RADIUS * BOX) / TILE)}
                  fill={toneFoot(1 - 0.5 * turn.t)}
                />
              ) : null}
            </React.Fragment>
          );
        })}
        <LightSweep x={third.x} y={third.y} w={third.w} h={third.h} k={k} t={sweepT} on="cream" r={(4 * BOX) / TILE} />
      </MuseStage>
    </AbsoluteFill>
  );
};

export default GreaterPersonalization;
