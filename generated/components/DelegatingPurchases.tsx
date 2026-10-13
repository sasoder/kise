import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BAG,
  CAPTION_Y0,
  CARD,
  CUTS,
  FPS,
  FRAME_W,
  LightSweep,
  MuseStage,
  PaymentCard,
  PersonTile,
  SLOT_W,
  Slotted,
  TILE,
  amberBandM,
  camCheck,
  makeClockCam,
  makePoolTrack,
  restToRest,
  tileRect,
  toScreenM,
  winU,
  type Glide,
  type PieceDef,
} from "./museShared";
import { clamp01, lerp, smoothstep } from "./stoutShared";

// ---------------------------------------------------------------------------
// DelegatingPurchases — cut 1 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta
// episode), Cheeky Pint S4 style (stoutShared, palette B1) on the clip's one family (museShared.tsx; brief
// out/musecommerce/briefs/BRIEF.md; out/musecommerce/WORLD_READY.md). 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: The person hands their payment card to the agent, and the agent does the buying.
//
// THE LINE: "(Muse is one of the first products where people) are fully delegating purchases to the agents.
// And this is like a step"
// ONSETS (f): are 5 · fully 9 · delegating 16 · purchases 31 · to 47 · the 55 · agents. 59 · And 75 ·
// this 83 · is 87 · like 90 · a 93 · step 100 · (slot ends 100)
// WINDOW: seq 5.422 -> 9.593, span 4.171 s. DURATION = round(4.171 x 23.976) = 100, + 16-frame tail = 116.
//
// ONE MOTION: the payment card leaves the person's slot, is carried over and goes down into the agent's
// slot; as it seats, one light sweep crosses the amber tile and a shopping bag comes up out of the same slot.
// The camera creeps in on the pair, then glides with the card so the agent and its bag are the subject,
// the person at rest on the left with an empty slot.
// GESTURES (gesture -> words -> frames)
//   f0: person (cream) | agent (amber), the card standing 0.6 out of the person's slot; creep-in running;
//     the pool already sliding toward the agent
//   the card rises out of the person's slot (clear of it ~f14.6), lifts one elevation and travels across in
//     one arc (peak f22-24) -> "fully delegating" -> f6-30.6
//   it comes down into the agent's slot (enters f30.6, seated f45: THE CAUSE) -> "purchases" -> f30.6-45
//   THE ONE CLICK: a LightSweep crosses the amber tile as the card seats -> f42-54
//   the bag rises out of the same slot, decelerating (first out f47; standing f72) -> "to the agents" -> f46-72
//   settled and alive: slow push, pool on the agent -> f72-115
// Nothing else. No text.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.DelegatingPurchases.duration; // 116

export const schema = z.object({
  /** draws the caption strip's top edge (measurement only) */
  strip: z.boolean().default(false),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (world px; floor y = 0) ---------------------------------------------------------------
const FLOOR = 0;
const TOP = FLOOR - TILE; // the tiles' top edge: the slots
const PX = -56; // the person
const AX = 56; // the agent
/** The bag in the card's slot: the slot keeps the card's width (no jump when the bag follows the card). */
const BAG_IN_CARD_SLOT: PieceDef = { ...BAG, w: CARD.w };

// --- the clock (frames) ------------------------------------------------------------------------------
const CARD_OUT0 = 0.6; // f0: how far the card stands out of the person's slot
const RISE: [number, number] = [6, 22]; // the card's rise: out of the slot and on up to the arc's top
const FALL: [number, number] = [24, 45]; // down from the arc's top into the agent's slot; seated at FALL[1]
const HOVER = 14; // the arc's top: the card's bottom this far above the tile tops (world px)
const SWEEP: [number, number] = [42, 54];
const BAG_RISE: [number, number] = [46, 72];

/** The card's bottom edge (world y) at f: one rise and one fall, C1. */
const cardBottom = (f: number) => {
  const y0 = TOP + CARD.h * (1 - CARD_OUT0);
  return y0 - (y0 - (TOP - HOVER)) * smoothstep(winU(f, RISE[0], RISE[1])) + (HOVER + CARD.h) * smoothstep(winU(f, FALL[0], FALL[1]));
};
const solve = (lo: number, hi: number, rising: boolean) => {
  // the frame on which the card's bottom crosses the tiles' top edge
  let a = lo;
  let b = hi;
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    const above = cardBottom(m) <= TOP;
    if (above === rising) b = m;
    else a = m;
  }
  return (a + b) / 2;
};
/** The card is clear of the person's slot / enters the agent's slot (it moves sideways only in between). */
export const F_CLEAR = solve(RISE[0], RISE[1], true);
export const F_ENTER = solve(FALL[0], FALL[1], false);
const LIFT_F = 5;
const card = (f: number) => {
  const bottom = cardBottom(f);
  const x = lerp(PX, AX, restToRest(winU(f, F_CLEAR, F_ENTER), 2.5));
  const lift = smoothstep((f - F_CLEAR) / LIFT_F) * (1 - smoothstep((f - (F_ENTER - LIFT_F)) / LIFT_F));
  const where: "person" | "air" | "agent" = f < F_CLEAR ? "person" : f < F_ENTER ? "air" : "agent";
  return { x, bottom, lift, where, out: clamp01((TOP + CARD.h - bottom) / CARD.h) };
};

// --- the camera (look = the world point on the frame's middle) ------------------------------------------
const K0 = 3.4;
const K_END = 3.6;
/** f0: the pair centred, the tiles' centres on screen y ~ 900 (their floor above the caption strip). */
const START = { x: 0, y: TOP + TILE / 2 + 60 / K0, k: K0 };
/** The rest: the agent a little right of the middle so the person stays whole at the left. */
const END_X = AX - 60 / K_END;
const GLIDES: Glide[] = [
  // the creep-in, already running at f0
  { f0: -26, f1: 44, k: 3.47 },
  // glides with the card onto the agent
  { f0: 10, f1: 62, dx: END_X - START.x, warp: 0.9 },
  // the push onto the agent and its bag
  { f0: 36, f1: 76, k: K_END },
  // settled and alive: the slow push through the tail
  { f0: 66, f1: 150, k: 3.7 },
];
const CAM = makeClockCam(START, GLIDES, DURATION + 2);
export const CAM_CHECK = camCheck(CAM.at, 0, DURATION - 1);
const POOL = makePoolTrack(
  { x: PX + 10, y: TOP - 10 },
  [
    { f0: -6, f1: 44, x: AX, y: TOP - 6 }, // with the card, onto the agent's slot
    { f0: 46, f1: 74, x: AX, y: TOP - 30 }, // up with the bag
  ],
  DURATION + 2,
);

// --- load-time checks ------------------------------------------------------------------------------------
{
  const fail = (m: string): never => {
    throw new Error(`DelegatingPurchases: ${m}`);
  };
  if (CAM_CHECK.maxA > 2.5) fail(`camera |dv| ${CAM_CHECK.maxA.toFixed(2)} at f${CAM_CHECK.atA}`);
  if (CAM_CHECK.maxV > 45) fail(`camera ${CAM_CHECK.maxV.toFixed(1)} px/f at f${CAM_CHECK.atV}`);
  for (let f = 0; f < DURATION; f++) {
    const c = CAM.at(f);
    // the tiles' floor stays above the caption strip (sway 5 px), the person whole in frame
    const floorY = toScreenM(c, AX, FLOOR).y;
    if (floorY + 5 > CAPTION_Y0) fail(`the floor at y ${floorY.toFixed(0)} on f${f}`);
    const left = toScreenM(c, PX - TILE / 2, FLOOR).x;
    const right = toScreenM(c, AX + TILE / 2, FLOOR).x;
    if (left - 3 < 8 || right + 3 > FRAME_W - 8) fail(`the pair leaves the frame (${left.toFixed(0)} .. ${right.toFixed(0)}) on f${f}`);
  }
  if (!(F_CLEAR > RISE[0] && F_ENTER > F_CLEAR + 8 && F_ENTER < FALL[1])) fail(`card clock ${F_CLEAR} / ${F_ENTER}`);
}

const DelegatingPurchases: React.FC<Props> = ({ strip }) => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandM(cam);
  const c = card(f);
  const bagOut = restToRest(winU(f, BAG_RISE[0], BAG_RISE[1]), 3);
  const sweepT = winU(f, SWEEP[0], SWEEP[1]);
  const agentRect = tileRect(AX, FLOOR);
  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)}>
        {/* the person: the card in its slot until it is clear, then the empty slot (hands free) */}
        {c.where === "person" ? (
          <Slotted x={PX} floor={FLOOR} k={k} face={{ kind: "person" }} piece={CARD} out={c.out} />
        ) : (
          <PersonTile x={PX} floor={FLOOR} k={k} slot={SLOT_W} />
        )}
        {/* the agent: its slot takes the card, then gives the bag */}
        {f < BAG_RISE[0] ? (
          <Slotted x={AX} floor={FLOOR} k={k} face={{ kind: "agent" }} band={band} piece={CARD} out={c.where === "agent" ? c.out : 0} />
        ) : (
          <Slotted x={AX} floor={FLOOR} k={k} face={{ kind: "agent" }} band={band} piece={BAG_IN_CARD_SLOT} out={bagOut} />
        )}
        {/* THE ONE CLICK */}
        <LightSweep x={agentRect.x} y={agentRect.y} w={agentRect.w} h={agentRect.h} k={k} t={sweepT} on="amber" />
        {/* the card in the air: lifted one elevation, over both tiles */}
        {c.where === "air" ? <PaymentCard x={c.x} bottom={c.bottom} k={k} lift={c.lift} /> : null}
      </MuseStage>
      {strip ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: CAPTION_Y0, height: 170, border: "2px dashed rgba(243,235,221,0.5)" }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default DelegatingPurchases;
