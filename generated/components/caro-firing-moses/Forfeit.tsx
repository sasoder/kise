// ---------------------------------------------------------------------------
// Forfeit (caro-firing-moses, cut 71.083). NEW graphic in the show's silhouette pictogram look (the hydra; COMMON.md
// look 1; ground, grain and bloom from robert-graft-machine/graftShared.tsx, parts in newsShared.tsx).
// Opaque 1080x1920, 24 fps, 225 frames.
//
// CHECK LINE: "If the mayor accepted the resignation, Moses's half-built projects would stop where they are and the
// money set aside for them would go too."
//
// THE LINE: "If a mayor accepted that resignation, not only would he be forfeiting the completion of whatever
// projects Moses was working on, along with the money that was apportioned for those projects, he'd also…"
// WORD -> FRAME: If -1 · a 1 · mayor 4 · accepted 10 · that 18 · resignation 25 · not 40 · only 46 · would 55 ·
// he 68 · be 71 · forfeiting 73 · the 85 · completion 89 · of 98 · whatever 106 · projects 110 · Moses 122 ·
// was 129 · working 134 · on 141 · along 149 · with 161 · the 166 · money 169 · that 174 · was 178 ·
// apportioned 182 · for 199 · those 203 · projects 210 · (he'd 223).
// DURATION: the slot 71.083 -> 80.458 s = 9.375 s x 24 = 225 frames (f0..f224).
//
// REV 1 (user: more dynamic with the camera; the piece sat high and the hand was cut by the left edge): the hand now
// comes straight down from the top edge with the stamp hanging just above the slip; one continuous living camera
// (keys in CAM below) opens close on slip and hand, pushes in on "accepted", eases down to the bridge by
// "forfeiting", tracks bridge -> parkway -> tower as each plan breaks (breaks staggered 0 / 11 / 22 f), holds wider
// and drifts, follows the sacks up a little on "money", settles on the whole picture centred near y 900 by f206.
// THE MOTION (v1): f0 is fully drawn: the Mayor's white hand holds a black rubber stamp above the resignation slip, and
// under it three of Moses's projects stand half-built (a suspension bridge missing its middle span, an elevated
// parkway ending in mid-air, the Jones Beach water tower stopped halfway), each with its unbuilt part as a dashed
// white plan, a working crane (trolley and hook moving) and a sack of money. "accepted": the stamp swings over and
// comes down, CONTACT f16 (ACCEPTED is on the slip from that frame, under the stamp), lifts off f19-29 to show it.
// "forfeiting": the cranes stop dead at f73 (hooks left swinging), and from f77 the plans break into their dashes,
// which fall out of the frame (all gone by ~f120): only the half-built black silhouettes are left. "money": wings
// slide out of the sacks f166-171 and they fly up and out of the frame f170-198. Resolved by f199; a living hold
// (grain, the hooks' faint sway, the hand's slight drift) to f224. No fades anywhere.
//
// SOURCES: none (no figures). The slip carries the words of the form in ResignForm ("RESIGNATION", "I, Robert
// Moses, do hereby resign"). The water tower is Jones Beach's (a Moses project), simplified.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FIRING_GLOW, FiringGlowDefs, FiringGround, MayorHand } from "./firingShared";
import {
  BRIDGE,
  CamKey,
  camAt,
  camTransform,
  BRIDGE_GANTRY_Y,
  BRIDGE_MID,
  BridgeSolid,
  GROUND_Y,
  Gantry,
  TruckCrane,
  TOWER,
  Dash,
  FallingDash,
  Ground,
  Hook,
  IMPRINT_H,
  IMPRINT_LOCAL,
  IMPRINT_ROT,
  MoneySack,
  PARKWAY,
  ParkwaySolid,
  Pt,
  RubberStamp,
  SLIP_IMPRINT_S,
  STAMP_KNOB,
  Slip,
  TowerCrane,
  TowerSolid,
  bridgePlan,
  dashify,
  lerp,
  parkwayPlan,
  prog,
  towerPlan,
} from "./newsShared";

export const FPS = 24;
export const DURATION = 225;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- layout -------------------------------------------------------------------------------------------------
// grain seed offset (any value: these cuts are not joined to A's hydra world)
const GRAIN_G0 = 1000;
const SLIP_S = 640 / 560; // 640 px wide
const STAMP_S = SLIP_IMPRINT_S * SLIP_S; // 0.86
const SLIP_C: Pt = [540, 425 + 120 * SLIP_S]; // top edge y 425
const rotV = (x: number, y: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const IMPRINT_POS: Pt = [SLIP_C[0] + IMPRINT_LOCAL[0] * SLIP_S, SLIP_C[1] + IMPRINT_LOCAL[1] * SLIP_S];
// the stamp: at rest beside/above the slip, on contact its face centre is the imprint's centre
const STAMP_REST: Pt = [560, 396]; // rev 1: hangs just above the slip's top edge, centre, the hand straight above
const STAMP_REST_ROT = -2;
const CONTACT = 16;
// the Mayor's hand (builder A's, firingShared): fingertip anchor; the stamp's knob sits in the pinch, just under and
// behind the fingertip
const HAND_S = 0.5;
const KNOB_FROM_TIP: Pt = [-13, 21]; // in the hand's own frame (fingers along +x)
// rev 1: the hand comes down from the top of the frame, turned so the arm runs up out of the top edge (never cut by
// the left edge at any camera pose)
const HAND_ROT = 80;
// the camera (rev 1): one continuous living camera, world point (fx, fy) shown at screen (sx, sy) = (540, 900):
// close on the slip and hand, a firm push onto the imprint on "accepted", down to the bridge by "forfeiting", a
// track across bridge -> parkway -> tower as each plan breaks, wider through "projects Moses was working on", up a
// little with the money, settling on the whole picture (slip + three projects centred near y 900) by f205, drifting.
const K = (f: number, fx: number, fy: number, k: number): CamKey => ({ f, fx, fy, k, sx: 540, sy: 900 });
const CAM: CamKey[] = [
  K(0, 540, 528, 1.15),
  K(9, 537, 534, 1.16),
  K(20, 512, 572, 1.21),
  K(48, 508, 588, 1.23),
  // the track (~1.5x): bridge centred while its plan breaks (f77-83), glide, parkway centred (f89-95), glide,
  // tower centred (f101-111); the glides ease in and out and the holds keep drifting toward the next project
  K(76, 232, 880, 1.48),
  K(83, 282, 884, 1.5),
  K(89, 530, 888, 1.51),
  K(95, 592, 888, 1.52),
  K(101, 826, 886, 1.52),
  K(111, 872, 882, 1.5),
  K(134, 528, 768, 1.03),
  K(166, 506, 758, 1.045),
  K(190, 520, 712, 1.0),
  K(206, 512, 748, 1.0),
  K(224, 510, 744, 1.016),
];

// ---- the cranes -----------------------------------------------------------------------------------------------
const STOP = 73; // "forfeiting": the work stops dead
// work time: runs with the frame until STOP, then coasts to a halt in a few frames
const workT = (f: number) => (f < STOP ? f : STOP + 3 * (1 - Math.exp(-(f - STOP) / 3)));
// the hook's swing: a jolt when the work stops, decaying to a faint living sway
const hookSway = (f: number, seed: number) => {
  const base = 0.5 * Math.sin((f + seed * 17) * 0.13);
  if (f < STOP) return base;
  const t = f - STOP;
  return base + 4.5 * Math.exp(-t / 28) * Math.sin(t * 0.32 + seed);
};
// the three rigs: [trolley/tip x range], [hook y range], periods (trolley, hoist) in frames
const RIG = {
  gantry: { hook: [942, 972] as Pt, period: 54 },
  truck: { x: 752, tip: [664, 772] as Pt, hook: [784, 804] as Pt, period: 48 },
  tower: { x: 904, top: 724, jib: 104, counter: 6, tr: [834, 856] as Pt, hook: [764, 784] as Pt, period: [62, 50] as Pt },
};

// ---- the plans: every dash breaks off once, falls with gravity, leaves the frame ----------------------------------
type PlanDash = Dash & { breakF: number; seed: string };
const PLAN_START = 77;
const PLAN_SPREAD = 17;
const mkPlan = (dashes: Dash[], offset: number, seed: string): PlanDash[] => {
  // break from the far end of the plan back toward the built part, with a little jitter
  const maxAlong = Math.max(...dashes.map((d) => d.along), 1);
  return dashes.map((d, i) => {
    const jitter = ((i * 7919) % 5) - 2;
    const t = 1 - d.along / maxAlong;
    return { ...d, breakF: Math.round(PLAN_START + offset + PLAN_SPREAD * t + jitter * 0.6), seed };
  });
};
const PLANS: PlanDash[] = [
  ...mkPlan(dashify(bridgePlan(), 12, 8, 1), 0, "br"),
  ...mkPlan(dashify(parkwayPlan(), 12, 8, 2), 11, "pk"),
  ...mkPlan(dashify(towerPlan(), 12, 8, 3), 22, "tw"),
];

// ---- the sacks --------------------------------------------------------------------------------------------------
const SACKS: { at: Pt; s: number; path: [Pt, Pt, Pt]; lift: number }[] = [
  { at: [184, BRIDGE.deckTop], s: 1.05, path: [[160, 850], [50, 740], [-90, 640]], lift: 170 },
  { at: [560, PARKWAY.deckTop - 7], s: 1.1, path: [[630, 780], [880, 740], [1170, 660]], lift: 173 },
  { at: [TOWER.cx, TOWER.builtTop + 2], s: 1.05, path: [[900, 840], [1010, 780], [1170, 730]], lift: 176 },
];
const WINGS_IN = 166;
const FLY_DUR = 24;
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

const Forfeit: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(CAM, f);

  // ---- the stamp: rest -> arc over -> down (contact f16) -> hold -> lift back to rest ----
  const faceOff = rotV(0, (IMPRINT_H / 2) * STAMP_S, IMPRINT_ROT);
  const contactPos: Pt = [IMPRINT_POS[0] + faceOff[0], IMPRINT_POS[1] + faceOff[1]];
  const apex: Pt = [lerp(STAMP_REST[0], contactPos[0], 0.6), STAMP_REST[1] - 34];
  let sp: Pt = STAMP_REST;
  let srot = STAMP_REST_ROT;
  if (f >= 8 && f < CONTACT) {
    const t = prog(f, 8, CONTACT, Easing.in(Easing.quad));
    sp = cubic(STAMP_REST, [STAMP_REST[0] + 10, apex[1]], [contactPos[0], apex[1]], contactPos, t);
    srot = lerp(STAMP_REST_ROT, IMPRINT_ROT, prog(f, 8, CONTACT - 2));
  } else if (f >= CONTACT && f < 19) {
    sp = [contactPos[0], contactPos[1] + (f === CONTACT ? 2 : 0)];
    srot = IMPRINT_ROT;
  } else if (f >= 19) {
    const t = prog(f, 19, 30, Easing.inOut(Easing.cubic));
    sp = cubic(contactPos, [contactPos[0], apex[1] - 10], [STAMP_REST[0] - 10, apex[1]], STAMP_REST, t);
    srot = lerp(IMPRINT_ROT, STAMP_REST_ROT, t);
  }
  // the hand's living drift once at rest
  const drift = f >= 30 ? 2.5 * Math.sin((f - 30) * 0.09) * prog(f, 30, 40) : 0;
  sp = [sp[0], sp[1] + drift];
  const knob = rotV(0, -STAMP_KNOB * STAMP_S, srot);
  const kft = rotV(KNOB_FROM_TIP[0], KNOB_FROM_TIP[1], HAND_ROT + srot);
  const tip: Pt = [sp[0] + knob[0] - kft[0], sp[1] + knob[1] - kft[1]];
  // the slip gives a little under the blow
  const slipDip = f >= CONTACT ? 3 * Math.exp(-(f - CONTACT) / 3) * (f - CONTACT < 1 ? 1 : 1) : 0;
  const inked = f >= CONTACT;

  // ---- the rigs ----
  const wt = workT(f);
  const osc = (period: number, ph: number) => 0.5 + 0.5 * Math.sin((wt * 2 * Math.PI) / period + ph);
  const gantryHook = lerp(RIG.gantry.hook[0], RIG.gantry.hook[1], osc(RIG.gantry.period, 0));
  const truckHook = lerp(RIG.truck.hook[0], RIG.truck.hook[1], osc(RIG.truck.period, 1.3));
  const towerTr = lerp(RIG.tower.tr[0], RIG.tower.tr[1], osc(RIG.tower.period[0], 2.1));
  const towerHook = lerp(RIG.tower.hook[0], RIG.tower.hook[1], osc(RIG.tower.period[1], 0.4));

  // ---- sacks ----
  const sacks = SACKS.map((s, i) => {
    const wings = prog(f, WINGS_IN + i, WINGS_IN + i + 5, Easing.out(Easing.back(1.6)));
    const flap = wings > 0 ? 18 + 22 * Math.sin((f - WINGS_IN) * 1.15 + i) : 0;
    const t = prog(f, s.lift, s.lift + FLY_DUR, Easing.in(Easing.quad));
    const [x, y] = cubic(s.at, s.path[0], s.path[1], s.path[2], t);
    const bob = f >= s.lift ? -3 * Math.sin((f - s.lift) * 1.15 + i) : 0;
    const rot = f >= s.lift ? lerp(0, s.path[2][0] < s.at[0] ? -14 : 14, prog(f, s.lift, s.lift + 10)) : 0;
    return { x, y: y + bob, s: s.s, wings, flap, rot, on: t < 1 };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FiringGround G={GRAIN_G0 + frame} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <FiringGlowDefs />
        <g filter={`url(#${FIRING_GLOW})`}>
          <g transform={camTransform(cam)}>
          {/* ---- the projects ---- */}
          <Ground x0={-700} x1={1800} />
          <BridgeSolid />
          <Hook x={BRIDGE_MID} top={BRIDGE_GANTRY_Y + 2} hookY={gantryHook} sway={hookSway(f, 0)} load="beam" />
          <Gantry x={BRIDGE_MID} y={BRIDGE_GANTRY_Y} />
          <ParkwaySolid />
          <TruckCrane x={RIG.truck.x} ground={GROUND_Y} tip={RIG.truck.tip} />
          <Hook x={RIG.truck.tip[0]} top={RIG.truck.tip[1] + 6} hookY={truckHook} sway={hookSway(f, 1)} load="beam" />
          <TowerSolid />
          <TowerCrane
            x={RIG.tower.x}
            ground={GROUND_Y}
            top={RIG.tower.top}
            jib={RIG.tower.jib}
            counter={RIG.tower.counter}
            dir={-1}
            trolley={towerTr}
          >
            <Hook x={towerTr} top={RIG.tower.top + 8} hookY={towerHook} sway={hookSway(f, 2)} load="pallet" />
          </TowerCrane>

          {/* the money */}
          {sacks.map((s, i) => s.on && <MoneySack key={`s${i}`} x={s.x} y={s.y} s={s.s} rot={s.rot} wings={s.wings} flap={s.flap} />)}

          {/* the plans, breaking and falling a short way: they drop behind the ground line and are gone */}
          <defs>
            <clipPath id="aboveGround" clipPathUnits="userSpaceOnUse">
              <rect x={-200} y={-200} width={1480} height={GROUND_Y + 200} />
            </clipPath>
          </defs>
          <g clipPath="url(#aboveGround)">
            {PLANS.map((d, i) => {
              const fall = f - d.breakF;
              if (fall > 24) return null;
              return <FallingDash key={`d${i}`} d={d} fall={fall} seed={d.seed} />;
            })}
          </g>

          {/* ---- the slip, the label, the stamp, the hand ---- */}
          <Slip id="slip" x={SLIP_C[0]} y={SLIP_C[1] + slipDip} s={SLIP_S} inked={inked} imprintS={STAMP_S / SLIP_S} />
          <RubberStamp x={sp[0]} y={sp[1]} rot={srot} s={STAMP_S} />
          <MayorHand x={tip[0]} y={tip[1]} s={HAND_S} rot={HAND_ROT + srot} arm={1800} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default Forfeit;

