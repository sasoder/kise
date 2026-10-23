import React from "react";
import { Easing, interpolate } from "remotion";
import {
  BLACK,
  EASE_LAND,
  INK,
  OP_LOW,
  OP_MID,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  camEase,
  clamp,
  runCamera2,
} from "../kits/core-memory/deathCountShared";
import { Inked } from "../kits/core-memory/cerroShared";
import {
  BAGS,
  CAM_CX,
  CAM_CY,
  CAM_K,
  CAM_LAST,
  GROUND_Y,
  JOIN_T,
  PACK,
  SERGEANT,
  SOLDIERS,
  SOLDIER_S,
  SOLDIER_YB,
  Soldier,
  TRACER,
  type HandsetPose,
  type Tracer,
  WALL,
  WallShape,
  cordD,
  defaultTracerGate,
  doctrineCameraAt,
  handsetShape,
  sergeantHandsetAt,
  soldierDuck,
} from "./doctrineWorld";

// ---------------------------------------------------------------------------
// MARINE SQUAD MOVES — cut 57's own module (owner: the cut-57 builder,
// MarineKnowsWhatToDo). Read-only for everyone else. It builds on the doctrine
// world (doctrineWorld.tsx, owned by cut 51, imported read-only) and adds what
// cut 57 needs: the squad that acts on its own, the camera that comes back
// down, and the fire that stops.
//
// TIME: `f` = cut 57's own frame (0..115); the doctrine world's t = JOIN_T + f.
//
// THE SQUAD (indices as in doctrineWorld SOLDIERS):
//   SERGEANT (3) lowers the handset onto the wall top (it stays there, on its
//     cord to the radio), rises from his crouch so his body clears the wall, and
//     points the way out past the wall's right end with his right arm (the arm
//     swings up from behind his body). On the call he and soldier 4 go: each
//     stands into a crouched run (a torso and two legs below the bust; feet
//     planted on the ground line while in stance, constant speed between short
//     ramps), out from behind the wall's right end, and kneels on the open
//     ground on the flank. The radio stays where it stood, with the handset on
//     the wall and the dim cable still running up to the chain.
//   SOLDIERS 0-2 shift one place right behind the wall, as one block.
//   FIRE resumes as the camera comes down, and stops as the squad moves: no
//     tracer is fired whose dash would cross a runner in the open, nor after
//     FIRE_STOP.
//
// LEGEND: as doctrineWorld (white ink on its hard +4/+4 shadow, furniture at
// OP_MID, the chain drained to OP_LOW). No chain echo (in this clip the chain
// means COPIES). No labels, no arrows: the movement is the arrow.
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => camEase(u, 1);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const DEG = Math.PI / 180;

export const DURATION_57 = 116;
/** the doctrine world's t for cut 57's frame f */
export const tOf = (f: number) => JOIN_T + f;

// ===========================================================================
// THE BEATS (cut 57 frames). Words: American f3 · Marine f22-32 · He knows f37-41 ·
// authorized f54-61 · right there f68-77 · creativity f83-96 · problem solve it f103-115.
// ===========================================================================
/** the chain and its "?" drain to OP_LOW while the camera comes down */
export const DRAIN = { from: 0, to: 24 } as const;
/** the handset goes back down onto the wall top ("He knows") */
export const LOWER = { from: 37, to: 49 } as const;
/** the sergeant rises from his crouch (the body clears the wall) */
export const RISE = { from: 45, to: 57, px: 56 } as const;
/** his arm swings up from behind his body to point the way ("authorized") */
export const POINT = { from: 49, to: 59 } as const;
/** the arm goes back behind his body as he starts to run */
export const STOW = { from: 82, to: 89 } as const;
/** the flank runs: start, stop (hip at rest), and where each one kneels */
export const RUNS = {
  4: { from: 80, to: 100, x1: 1080, accel: 5, decel: 7 },
  3: { from: 84, to: 104, x1: 942, accel: 5, decel: 7 },
} as const;
/** soldiers 0-2 shift one place right behind the wall */
export const SHIFT = { from: 86, to: 102, dx: 92 } as const;
/** the kneel settles over this many frames, ending at the run's end + KNEEL_TAIL */
const KNEEL_LEAD = 4;
const KNEEL_TAIL = 5;
/** fire: tracers resume from here (the camera is coming down) ... */
export const FIRE_RESUME = 10;
/** ... and none is fired after this frame */
export const FIRE_STOP = 96;

// ===========================================================================
// RUN PROFILES
// ===========================================================================
/** distance along a trapezoid speed profile (linear ramps), 0..dist */
const runDist = (f: number, from: number, to: number, dist: number, accel: number, decel: number) => {
  const T = to - from;
  const V = dist / (T - accel / 2 - decel / 2);
  const tau = f - from;
  if (tau <= 0) return 0;
  if (tau < accel) return (V * tau * tau) / (2 * accel);
  if (tau < T - decel) return (V * accel) / 2 + V * (tau - accel);
  if (tau < T) return dist - (V * (T - tau) * (T - tau)) / (2 * decel);
  return dist;
};

// ===========================================================================
// THE TROOPER'S BODY (box-local, the bust's box of side SOLDIER_S = 100)
// ===========================================================================
const S = SOLDIER_S;
/** the hip, box-local: the lean pivots here */
const HIP = { x: 0.5 * S, y: 1.15 * S } as const;
/** the torso under the shoulders (hidden behind the wall while crouched) */
/** flush with the shoulders' flat base (x 0.12..0.88 S), square on top, rounded at the hips */
const TORSO = { x0: 0.12 * S, x1: 0.88 * S, y0: 0.88 * S, y1: 1.22 * S, r: 0.2 * S } as const;
const THIGH = 0.46 * S;
const SHIN = 0.42 * S;
const LEG_W = 0.2 * S;
const BOOT_W = 0.14 * S;
const BOOT_L = 0.16 * S;
/** ankle centre height on the ground (the boot's sole on the ground line) */
const ANKLE_Y = GROUND_Y - BOOT_W / 2 - 2;
/** the back knee resting on the ground */
const KNEE_GROUND_Y = GROUND_Y - LEG_W / 2;
/** the box top of a runner at speed, and kneeling */
const RUN_TOP = 1600;
const KNEEL_BACK_DX = -6;
const KNEEL_TOP = KNEE_GROUND_Y - Math.sqrt(THIGH * THIGH - KNEEL_BACK_DX * KNEEL_BACK_DX) - HIP.y;
/** gait */
const STRIDE = 1.5 * S; // 150 px
const DUTY = 0.4;
const LIFT = 20;
const LEAN_RUN = 10;
const LEAN_KNEEL = 3;
/** the pointing arm: pivot inside the shoulder disc, length to the fist */
const ARM = { px: 0.72 * S, py: 0.62 * S, len: 0.64 * S, w: 0.17 * S, fist: 0.11 * S, finger: 0.2 * S, fingerW: 0.09 * S } as const;
const ARM_STOWED = 97;
const ARM_POINT = -34;

/** two-bone IK, the knee always on the forward (+x) side */
const ik = (hip: Pt, ankle: Pt): Pt => {
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d = Math.min(Math.hypot(dx, dy), THIGH + SHIN - 0.01);
  const cosA = (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const base = Math.atan2(dy, dx);
  return { x: hip.x + THIGH * Math.cos(base - A), y: hip.y + THIGH * Math.sin(base - A) };
};
/** the ankle actually reached (the leg never stretches past its length) */
const reach = (hip: Pt, ankle: Pt): Pt => {
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d = Math.hypot(dx, dy);
  const m = THIGH + SHIN - 0.01;
  if (d <= m) return ankle;
  return { x: hip.x + (dx / d) * m, y: hip.y + (dy / d) * m };
};

type Leg = { hip: Pt; knee: Pt; ankle: Pt };
const legPath = (l: Leg) => `M${l.hip.x} ${l.hip.y} L${l.knee.x} ${l.knee.y} L${l.ankle.x} ${l.ankle.y}`;
const LegShape: React.FC<{ l: Leg; fill: string }> = ({ l, fill }) => (
  <>
    <path d={legPath(l)} fill="none" stroke={fill} strokeWidth={LEG_W} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d={`M${l.ankle.x - 2} ${l.ankle.y + 1} L${l.ankle.x + BOOT_L} ${l.ankle.y + 1}`}
      fill="none"
      stroke={fill}
      strokeWidth={BOOT_W}
      strokeLinecap="round"
    />
  </>
);

/** one foot in the gait, from the distance run (s), the start x, and its phase offset */
const gaitAnkle = (x0: number, s: number, off: number): Pt => {
  const c = s / STRIDE + off;
  const n = Math.floor(c);
  const fr = c - n;
  const d = (DUTY * STRIDE) / 2;
  // the plant of cycle n: the hip is at x0 + (n - off) * STRIDE when the stance starts
  const plant = (m: number) => x0 + (m - off) * STRIDE + d;
  if (fr < DUTY) return { x: plant(n), y: ANKLE_Y };
  const u = (fr - DUTY) / (1 - DUTY);
  return { x: lerp(plant(n), plant(n + 1), smooth(u)), y: ANKLE_Y - LIFT * Math.sin(Math.PI * u) };
};

// ===========================================================================
// THE SQUAD'S STATE AT FRAME f
// ===========================================================================
export type Trooper = {
  i: number;
  /** "rest" draws doctrineWorld's own Soldier (cut 51 pixel for pixel) */
  rest: boolean;
  /** world offset of the bust from its cut-51 place */
  dx: number;
  /** the bust's box top (world) */
  top: number;
  /** extra lean (deg, + = top to the right) about the hip */
  lean: number;
  /** the pointing arm's angle (deg, 0 = right, - = up), or null */
  arm: number | null;
  far: Leg | null;
  near: Leg | null;
  /** clear of the wall (in the open) */
  out: boolean;
};

const restTop = (i: number) => SOLDIER_YB + SOLDIERS[i].lift;

/** a runner's hip x and box top, and its legs, at f */
const runnerAt = (i: 3 | 4, f: number, duck: number): Trooper => {
  const R = RUNS[i];
  const x0 = SOLDIERS[i].x;
  const dist = R.x1 - x0;
  const s = runDist(f, R.from, R.to, dist, R.accel, R.decel);
  const hx = x0 + s;
  // vertical: rest -> (sergeant: risen) -> run height -> kneel
  const base = restTop(i);
  const risen = i === SERGEANT ? base - RISE.px * interpolate(f, [RISE.from, RISE.to], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp }) : base;
  const eRun = interpolate(f, [R.from, R.from + R.accel + 2], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  const eKneel = interpolate(f, [R.to - KNEEL_LEAD, R.to + KNEEL_TAIL], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const top = lerp(lerp(risen, RUN_TOP, eRun), KNEEL_TOP, eKneel) + duck;
  const lean = LEAN_RUN * eRun * (1 - eKneel) + LEAN_KNEEL * eKneel;
  // the hip in world (the pivot of the lean)
  const bx = x0 - S / 2;
  const hip = { x: bx + HIP.x + s, y: top + HIP.y };
  const hipFar = { x: hip.x - 4, y: hip.y };
  const hipNear = { x: hip.x + 4, y: hip.y };
  // gait (two feet half a cycle apart), blended into the kneel at the end
  let aFar = gaitAnkle(x0 + 0, s, 0.5);
  let aNear = gaitAnkle(x0 + 0, s, 0);
  // before the run: feet under the hips (hidden behind the wall)
  const stand = 1 - eRun;
  aFar = { x: lerp(aFar.x, hipFar.x - 12, stand), y: lerp(aFar.y, ANKLE_Y, stand) };
  aNear = { x: lerp(aNear.x, hipNear.x + 12, stand), y: lerp(aNear.y, ANKLE_Y, stand) };
  // the kneel: the far knee down on the ground behind, the near foot planted ahead
  const kFar = { x: hip.x + KNEEL_BACK_DX - 40, y: ANKLE_Y };
  const kNear = { x: hip.x + 42, y: ANKLE_Y };
  aFar = { x: lerp(aFar.x, kFar.x, eKneel), y: lerp(aFar.y, kFar.y, eKneel) };
  aNear = { x: lerp(aNear.x, kNear.x, eKneel), y: lerp(aNear.y, kNear.y, eKneel) };
  aFar = reach(hipFar, aFar);
  aNear = reach(hipNear, aNear);
  const far: Leg = { hip: hipFar, knee: ik(hipFar, aFar), ankle: aFar };
  const near: Leg = { hip: hipNear, knee: ik(hipNear, aNear), ankle: aNear };
  // the sergeant's arm
  let arm: number | null = null;
  if (i === SERGEANT) {
    const up = interpolate(f, [POINT.from, POINT.to], [0, 1], { easing: EASE_LAND, ...clamp });
    const down = interpolate(f, [STOW.from, STOW.to], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
    const a = lerp(ARM_STOWED, ARM_POINT, up * (1 - down));
    arm = f >= POINT.from && f < STOW.to ? a : null;
  }
  return { i, rest: false, dx: s, top, lean, arm, far, near, out: hx > WALL.x1 - 30 };
};

/** the whole squad at f (t = JOIN_T + f), with the fire gate's ducks */
export const squadAt = (f: number): Trooper[] => {
  const t = tOf(f);
  return SOLDIERS.map((_, i) => {
    const duck = soldierDuck(i, t, marineGate);
    if (i === 3 || i === 4) {
      const R = RUNS[i];
      const moving = i === SERGEANT ? f >= RISE.from : f >= R.from;
      if (!moving) return { i, rest: true, dx: 0, top: restTop(i) + duck, lean: 0, arm: null, far: null, near: null, out: false };
      return runnerAt(i, f, duck);
    }
    // 0-2: one place right, as one block, a small bob per step
    const u = interpolate(f, [SHIFT.from, SHIFT.to], [0, 1], clamp);
    const e = smooth(u);
    const bob = -3 * Math.abs(Math.sin(u * 2 * Math.PI));
    return { i, rest: u <= 0, dx: SHIFT.dx * e, top: restTop(i) + duck + bob, lean: 0, arm: null, far: null, near: null, out: false };
  });
};

// ===========================================================================
// THE FIRE GATE
// ===========================================================================
/** a runner's body box in the open at (fractional) frame f, or null while behind the wall */
const runnerBox = (i: 3 | 4, f: number) => {
  const R = RUNS[i];
  if (f < R.from) return null;
  const x0 = SOLDIERS[i].x;
  const hx = x0 + runDist(f, R.from, R.to, R.x1 - x0, R.accel, R.decel);
  if (hx < WALL.x1 - 50) return null;
  return { x0: hx - 70, x1: hx + 80, y0: RUN_TOP - 10, y1: GROUND_Y };
};
const dashCrosses = (tr: Tracer) => {
  const dx = tr.impact.x - tr.start.x;
  const dy = tr.impact.y - tr.start.y;
  const D = Math.hypot(dx, dy);
  const ux = dx / D;
  const uy = dy / D;
  for (let t = tr.launch; t <= tr.hitT + 0.01; t += 0.25) {
    const f = t - JOIN_T;
    const head = Math.min(D, (t - tr.launch) * TRACER.speed);
    const tail = Math.max(0, (t - tr.launch) * TRACER.speed - TRACER.len);
    const xa = tr.start.x + ux * head;
    const xb = tr.start.x + ux * tail;
    const ya = tr.start.y + uy * head;
    const yb = tr.start.y + uy * tail;
    for (const i of [3, 4] as const) {
      const b = runnerBox(i, f);
      if (!b) continue;
      if (Math.max(xa, xb) < b.x0 || Math.min(xa, xb) > b.x1) continue;
      if (Math.max(ya, yb) < b.y0 || Math.min(ya, yb) > b.y1) continue;
      return true;
    }
  }
  return false;
};
const gateCache = new Map<number, boolean>();
/** cut 57's fire: cut 51's own (none in flight at the join) plus a resumed
 *  fire from FIRE_RESUME to FIRE_STOP that never crosses a runner in the open */
export const marineGate = (tr: Tracer): boolean => {
  const hit = gateCache.get(tr.seed);
  if (hit !== undefined) return hit;
  const f = tr.launch - JOIN_T;
  const v = (tr.launch < JOIN_T && defaultTracerGate(tr)) || (f >= FIRE_RESUME && f <= FIRE_STOP && !dashCrosses(tr));
  gateCache.set(tr.seed, v);
  return v;
};

// ===========================================================================
// THE HANDSET
// ===========================================================================
/** put down: lying on the wall's top course right of the radio, mouthpiece toward it (bow +1 = arched up) */
const SGT_REST: HandsetPose = { ear: { x: PACK.x1 + 64, y: WALL.top - 9 }, mouth: { x: PACK.x1 + 8, y: WALL.top - 9 }, bow: 1 };
const SGT_UP = sergeantHandsetAt(JOIN_T);
/** the handset: at his ear (as cut 51 left it, following his duck), then down onto the wall top */
export const handsetAt = (f: number): HandsetPose => {
  const duck = soldierDuck(SERGEANT, tOf(f), marineGate);
  const u = 1 - interpolate(f, [LOWER.from, LOWER.to], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const lift = Math.sin(u * Math.PI) * 16;
  const up = { ear: { x: SGT_UP.ear.x, y: SGT_UP.ear.y + duck }, mouth: { x: SGT_UP.mouth.x, y: SGT_UP.mouth.y + duck } };
  return {
    ear: { x: lerp(SGT_REST.ear.x, up.ear.x, u), y: lerp(SGT_REST.ear.y, up.ear.y, u) - lift },
    mouth: { x: lerp(SGT_REST.mouth.x, up.mouth.x, u), y: lerp(SGT_REST.mouth.y, up.mouth.y, u) - lift },
    bow: lerp(SGT_REST.bow, -1, u),
  };
};

// ===========================================================================
// DRAWING
// ===========================================================================
const TORSO_D = `M${TORSO.x0} ${TORSO.y0} L${TORSO.x1} ${TORSO.y0} L${TORSO.x1} ${TORSO.y1 - TORSO.r} Q${TORSO.x1} ${TORSO.y1} ${TORSO.x1 - TORSO.r} ${TORSO.y1} L${TORSO.x0 + TORSO.r} ${TORSO.y1} Q${TORSO.x0} ${TORSO.y1} ${TORSO.x0} ${TORSO.y1 - TORSO.r} Z`;
const torsoRect = (fill: string) => <path d={TORSO_D} fill={fill} />;
const armShape = (a: number, fill: string) => {
  const c = Math.cos(a * DEG);
  const s = Math.sin(a * DEG);
  const ex = ARM.px + ARM.len * c;
  const ey = ARM.py + ARM.len * s;
  const fx = ex + ARM.finger * c;
  const fy = ey + ARM.finger * s;
  return (
    <>
      <path d={`M${ARM.px} ${ARM.py} L${ex} ${ey}`} fill="none" stroke={fill} strokeWidth={ARM.w} strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={ARM.fist} fill={fill} />
      <path d={`M${ex} ${ey} L${fx} ${fy}`} fill="none" stroke={fill} strokeWidth={ARM.fingerW} strokeLinecap="round" />
    </>
  );
};

/** one trooper: doctrineWorld's Soldier at rest, else the extended body
 *  (far leg, arm, torso + near leg as one silhouette, the Soldier's bust on top) */
const TrooperShape: React.FC<{ tr: Trooper; duckRest: number }> = ({ tr, duckRest }) => {
  if (tr.rest) return <Soldier i={tr.i} duck={duckRest} />;
  const base = SOLDIERS[tr.i];
  const bx = base.x - S / 2 + tr.dx;
  const by = tr.top;
  const hip = { x: bx + HIP.x, y: by + HIP.y };
  const rot = tr.lean !== 0 ? `rotate(${tr.lean} ${hip.x} ${hip.y}) ` : "";
  // the soldier's own tilt (doctrineWorld rotates the bust about (0.5 S, 0.9 S)): the body follows it
  const local = `${rot}translate(${bx} ${by}) rotate(${base.tilt} ${0.5 * S} ${0.9 * S})`;
  // Soldier draws at (base.x - S/2, SOLDIER_YB + lift + duck): move it onto (bx, by)
  const soldierShift = `${rot}translate(${tr.dx} ${by - restTop(tr.i)})`;
  const hasBody = tr.far !== null;
  return (
    <g>
      {tr.far ? <Inked render={(fill) => <LegShape l={tr.far as Leg} fill={fill} />} /> : null}
      {tr.arm !== null ? (
        <g transform={local}>
          <Inked render={(fill) => armShape(tr.arm as number, fill)} />
        </g>
      ) : null}
      {hasBody ? (
        <>
          <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
            {tr.near ? <LegShape l={tr.near} fill={SHADOW} /> : null}
            <g transform={local}>{torsoRect(SHADOW)}</g>
          </g>
          {tr.near ? <LegShape l={tr.near} fill={INK} /> : null}
          <g transform={local}>{torsoRect(INK)}</g>
        </>
      ) : null}
      <g transform={soldierShift}>
        <Soldier i={tr.i} duck={0} />
      </g>
      {hasBody ? (
        // the bust's own shadow falls across the torso top: the torso's ink covers it (one body)
        <g transform={local}>
          <rect x={TORSO.x0} y={0.9 * S - 0.5} width={TORSO.x1 - TORSO.x0} height={SHADOW_OFF + 3} fill={INK} />
        </g>
      ) : null}
    </g>
  );
};

/**
 * Cut 57's squad layer, drawn where doctrineWorld's SquadLayer is (pass it as
 * DoctrineScene's `squad`). At f 0 it draws exactly what SquadLayer draws at
 * t = JOIN_T (same paths, same order).
 */
export const MarineSquad: React.FC<{ f: number; id: string }> = ({ f, id }) => {
  const t = tOf(f);
  const squad = squadAt(f);
  const hs = handsetAt(f);
  // the radio pack ducks with the sergeant while he is beside it, then stands on its own
  const sgtDuck = soldierDuck(SERGEANT, t, marineGate);
  const packDuck = f < RISE.from ? sgtDuck : 0;
  const cordA = hs.mouth;
  const cordB = { x: PACK.x0 + 6, y: PACK.top + 30 + packDuck };
  const BAG_RX = 15;
  // paint order: the runners in the open are drawn last (in front of the others)
  const order = [0, 1, 2, 3, 4];
  // the radio stands on its own once the sergeant leaves: he runs behind it
  const packFront = f >= RUNS[3].from;
  const pack = (
    <>
      <Inked
        render={(fill) => (
          <rect x={PACK.x0} y={PACK.top + packDuck} width={PACK.x1 - PACK.x0} height={WALL.top + 20 - PACK.top} rx={7} fill={fill} />
        )}
      />
      <circle cx={PACK.x0 + 12} cy={PACK.top + 13 + packDuck} r={5.5} fill={BLACK} />
      <rect x={PACK.x0 + 22} y={PACK.top + 9 + packDuck} width={18} height={8} rx={2} fill={BLACK} />
    </>
  );
  return (
    <g>
      <defs>
        <mask id={`${id}-wall`} maskUnits="userSpaceOnUse" x={-2000} y={-3000} width={6000} height={7000}>
          <rect x={-2000} y={-3000} width={6000} height={7000} fill="#FFFFFF" />
          {BAGS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={BAG_RX} fill="#000000" />
          ))}
          <rect x={WALL.x0 + BAG_RX} y={WALL.top + 10} width={WALL.x1 - WALL.x0 - 2 * BAG_RX} height={WALL.bottom - WALL.top + 400} fill="#000000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-wall)`}>
        {packFront ? null : pack}
        {order.map((i) => (
          <TrooperShape key={i} tr={squad[i]} duckRest={soldierDuck(i, t, marineGate)} />
        ))}
        {packFront ? pack : null}
      </g>
      <WallShape />
      <Inked render={(fill) => <path d={cordD(cordA, cordB, 3.5, 10, 8)} fill="none" stroke={fill} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />} />
      <Inked render={(fill) => handsetShape(hs, fill)} />
      <Inked render={(fill) => <rect x={-1600} y={GROUND_Y} width={4400} height={STROKE} fill={fill} opacity={OP_MID} />} />
    </g>
  );
};

/** the chain's and the question's opacity at f: 1 at the join, drained to OP_LOW */
export const chainOpacityAt = (f: number) => 1 - (1 - OP_LOW) * smooth(clamp01((f - DRAIN.from) / (DRAIN.to - DRAIN.from)));

// ===========================================================================
// THE CAMERA
// ===========================================================================
// Cut 51's key track up to the join (t <= 127), then cut 57's keys, through the
// same damped tracker, so position, zoom AND their velocities carry across the
// cut. k and cx are damped; cy is derived each frame from the damped k so the
// ground line sits exactly on its own eased screen track (above the captions).
// Move 1 (f0-24, log-eased): down to the squad, close on the sergeant.
// Move 2 (f60-104): drift right toward where he points and ease back a little
// so the flank is in shot. Under both: cut 51's never-stopping push-in creep.
const CREEP = Math.log(1.035) / 56; // cut 51's creep rate (per frame, log k)
const K0 = CAM_K[JOIN_T];
const CX0 = CAM_CX[JOIN_T];
export const K_CLOSE = 1.45;
export const K_END = 1.12;
export const CX_CLOSE = 600;
export const CX_END = 720;
const M1 = { from: 0, to: 24 } as const;
const M2 = { from: 60, to: 104 } as const;
/** the ground line's screen y: at the join, close, end */
const G0 = 960 + (GROUND_Y - CAM_LAST.cy) * CAM_LAST.k;
export const G_CLOSE = 1072;
export const G_END = 1062;
const e1 = (f: number) => camEase((f - M1.from) / (M1.to - M1.from), 1);
const e2 = (f: number) => camEase((f - M2.from) / (M2.to - M2.from), 1);
const A1 = Math.log(K_CLOSE) - Math.log(K0) - CREEP * M1.to;
const A2 = Math.log(K_END) - Math.log(K0) - A1 - CREEP * M2.to;
const kTarget = (f: number) => Math.exp(Math.log(K0) + CREEP * f + A1 * e1(f) + A2 * e2(f));
const cxTarget = (f: number) => CX0 + (CX_CLOSE - CX0) * e1(f) + (CX_END - CX_CLOSE) * e2(f);
const gsy = (f: number) => G0 + (G_CLOSE - G0) * e1(f) + (G_END - G_CLOSE) * e2(f);

const KF: number[] = [];
const KK: number[] = [];
const KX: number[] = [];
const KY: number[] = [];
for (let t = 0; t <= JOIN_T; t++) {
  KF.push(t);
  KK.push(CAM_K[t]);
  KX.push(CAM_CX[t]);
  KY.push(CAM_CY[t]);
}
for (let f = 1; f <= DURATION_57 + 4; f++) {
  KF.push(JOIN_T + f);
  KK.push(kTarget(f));
  KX.push(cxTarget(f));
  KY.push(CAM_CY[JOIN_T]); // unused: cy is derived from the damped k
}
const camCache = new Map<number, { cx: number; cy: number; k: number }>();
/** the camera at cut 57's frame f (no sway; DoctrineFrame adds sway(t)) */
export const marineCameraAt = (f: number) => {
  if (f <= 0) return doctrineCameraAt(JOIN_T);
  const hit = camCache.get(f);
  if (hit) return hit;
  const c = runCamera2(JOIN_T + f, KF, KY, KX, KK);
  const cam = { cx: c.cx, cy: GROUND_Y - (gsy(f) - 960) / c.k, k: c.k };
  camCache.set(f, cam);
  return cam;
};

// -- the join, asserted at load ------------------------------------------------
{
  const c = doctrineCameraAt(JOIN_T);
  const want = { cx: 546.42, cy: 1640.27, k: 0.58953 };
  if (Math.abs(c.cx - want.cx) > 0.01 || Math.abs(c.cy - want.cy) > 0.01 || Math.abs(c.k - want.k) > 0.00001) {
    throw new Error(`cut 57 join: cut 51's last camera moved (${c.cx}, ${c.cy}, ${c.k})`);
  }
  if (c.cx !== CAM_LAST.cx || c.cy !== CAM_LAST.cy || c.k !== CAM_LAST.k) throw new Error("cut 57 join: CAM_LAST mismatch");
  if (soldierDuck(SERGEANT, JOIN_T) !== 0 || soldierDuck(SERGEANT, JOIN_T, marineGate) !== 0) {
    throw new Error("cut 57 join: the sergeant must be still at the join");
  }
  const h = sergeantHandsetAt(JOIN_T);
  const m = handsetAt(0);
  if (h.ear.x !== m.ear.x || h.ear.y !== m.ear.y || h.mouth.x !== m.mouth.x || h.mouth.y !== m.mouth.y) {
    throw new Error("cut 57 join: the handset is not where cut 51 left it");
  }
  if (chainOpacityAt(0) !== 1) throw new Error("cut 57 join: the chain must be at full opacity on f0");
}
