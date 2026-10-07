// ---------------------------------------------------------------------------
// GarrottedToDeathV2 (71_GarrottedToDeath, the REBUILD). Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated". He = ATAHUALPA, captive of
// Pizarro at Cajamarca:
//   "(...this was a man of his word. But Pizarro) in no case, was, and had him
//    garrotted to death after getting what he wanted."
// Dwarkesh map style, "beyond maps" page; the world is ransomV2Shared (builder
// H2; used as-is). Opaque 1080x1920, 24 fps, EXACTLY 105 frames (f0..f104).
// OPENS on FillThatRoomV2's last frame (its f189: ransomEndScene / ransomEndCam).
// In-point 71.321 s.
//
// WORD -> LOCAL FRAME
//   [Pizarro -2..8] in 9 · NO 12 · CASE 14-21 · WAS 32 · and 39 · had 44 ·
//   him 48 · GARROTTED 56-63 · to 61 · DEATH 67-73 · after 73 · GETTING 78 ·
//   what 82 · he 84 · WANTED 84-90; the line ends f103.
//
// GESTURES (each with the words it serves; nothing else)
//   1. "in NO CASE, was" f4-f34: the promise is withdrawn. The half-open
//      gauntlet closes hard on the bar (f4-f12), the bar jerks back up level,
//      and the three slack orange strings snap taut one after another from the
//      bar downward (f10 / f14 / f18); one highlight runs down each. Held taut
//      to f34. "PIZARRO" steps down to the 0.55 ink by f36.
//   2. "and had him GARROTTED to DEATH" f28-f76: ONE camera glide down the
//      strings to the MAIN framing (f28-f60). The gauntlet TWISTS the bar about
//      the vertical (f40-f62: the bar foreshortens through end-on, a whole
//      turn) and the three strings wind into ONE twisted cord: the join travels
//      down from under the bar (f41-f59, ~24 px/f) and reaches him on
//      "garrotted". His arms are drawn up by the forearm strings converging
//      into the cord (f47-f60); the cord shortens and lifts him onto his toes
//      and off them (26 px, f58-f66). On "death" (f67-f76) he goes limp, as a
//      body: head forward, shoulders down, knees unlocked, hands open.
//   3. "after GETTING what he WANTED" f74-f88: the orange drains out of the
//      cord from the top down (f74-f82); the cord untwists, slack, and lowers
//      him: he folds down onto the floor at the foot of the bank (knees, hip,
//      shoulder), dim. From f76 the camera eases back so that THE GOLD is the
//      frame: the whole bank at full ink, the rest of the room a step darker.
//   4. f88-f104: the living hold: the bank, the chalk line, the dead cords
//      hanging slack from the opened hand, his body at its foot; a 2 % creep
//      toward the gold.
//
// HISTORY (nothing of it on screen but the name): Atahualpa was garrotted in
// the square of Cajamarca on 26 July 1533, after the ransom had been brought
// in and melted down. A garrote is a cord tightened by twisting a stick: here
// the captor's control bar is that stick. Sources: Francisco de Xerez,
// Verdadera relacion (1534); Pedro Pizarro, Relacion (1571); Hemming, The
// Conquest of the Incas (1970), ch. 4.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, INK, clamp01, hash, mixColor, screenOf, smootherstep, smoothstep, swayCam, type Cam, type P2 } from "./incaShared";
import { BAR_W, Emperor, HAND_S, Label, PuppetString, STRING_W, TONE, WorldSvg, emperorRig, mix, mix2, rot, type EmperorPose } from "./stringsShared";
import {
  Bank,
  CAM_RANSOM_END,
  CAM_RANSOM_MAIN,
  ChalkLine,
  END_DIP,
  END_GRIP,
  PIZARRO,
  PIZARRO_F0,
  POSE_REST,
  ROOM,
  RansomHand,
  RansomPage,
  RansomWall,
  endCreep,
  holdAnchors,
  ransomEndCam,
  ransomEndScene,
} from "./ransomV2Shared";

export const FPS = 24;
export const DURATION = 105;
/** FillThatRoomV2's last frame: this cut's f0 */
const JOIN = 189;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---- the timeline ----------------------------------------------------------
const T = {
  grip: [4, 12] as [number, number],
  snap: [10, 14, 18], // head, his left, his right
  label: [24, 36] as [number, number],
  glide: [28, 60] as [number, number],
  twist: [40, 62] as [number, number],
  front: [41, 59] as [number, number],
  arms: [47, 60] as [number, number],
  lift: [58, 66] as [number, number],
  death: [67, 76] as [number, number],
  drain: [74, 82] as [number, number],
  untwist: [76, 86] as [number, number],
  lower: [75, 80] as [number, number],
  fold: [78, 88] as [number, number],
  gold: [76, 90] as [number, number],
  open: [84, 88] as [number, number],
  done: 88,
};
const span = (f: number, [a, b]: [number, number]) => (f - a) / (b - a);
/** a snap: fast off the mark, dead stop */
const snapE = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** a weighty fall: slow off the mark, firm landing, no overshoot */
const fall = (t: number) => smootherstep(Math.pow(clamp01(t), 1.2));
/** a trapezoid-speed ease (cosine shoulders of width a): peak speed 1 / (1 - a) of the mean */
const trap = (t: number, a = 0.22) => {
  const u = clamp01(t);
  const h = 1 / (1 - a);
  if (u < a) return h * (u / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * u) / a));
  if (u > 1 - a) return 1 - h * ((1 - u) / 2 - (a / (2 * Math.PI)) * Math.sin((Math.PI * (1 - u)) / a));
  return h * (u - a / 2);
};

// ---- the camera: the glide down, the ease back ------------------------------
const FLOOR = ROOM.floor;
/** THE GOLD: the whole bank in the frame, the floor at screen y 1140 */
const K_GOLD = 1.42;
const CAM_GOLD: Cam = { k: K_GOLD, cx: 545, cy: FLOOR - (1140 - 960) / K_GOLD };
/** the hold creeps toward this world point (the middle of the bank) */
const GOLD_AT: P2 = [545, 1300];
const lerpPlain = (a: Cam, b: Cam, t: number): Cam => ({ k: Math.exp(mix(Math.log(a.k), Math.log(b.k), t)), cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t) });
const baseCam = (f: number): Cam => {
  const end: Cam = { ...CAM_RANSOM_END, k: CAM_RANSOM_END.k * endCreep(JOIN + Math.min(f, T.glide[0])) };
  const a = lerpPlain(end, CAM_RANSOM_MAIN, trap(span(f, T.glide)));
  const b = lerpPlain(a, CAM_GOLD, smootherstep(span(f, T.gold)));
  const creep = Math.exp(0.02 * smoothstep((f - 86) / 26));
  return { k: b.k * creep, cx: GOLD_AT[0] + (b.cx - GOLD_AT[0]) / creep, cy: GOLD_AT[1] + (b.cy - GOLD_AT[1]) / creep };
};
export const camAt = (f: number): Cam => (f <= 0 ? ransomEndCam(JOIN) : swayCam(baseCam(f), JOIN + f));

// ---- the hand ---------------------------------------------------------------
const TAU = 2 * Math.PI;
/** the bar's turn about the vertical, radians: 0 -> a whole turn -> 0 */
const thetaAt = (f: number) => TAU * (trap(span(f, T.twist), 0.25) - smootherstep(span(f, T.untwist)));
const handAt = (f: number) => {
  const close = Math.pow(clamp01(span(f, T.grip)), 1.6);
  const open = smoothstep(span(f, T.open));
  return {
    grip: mix(mix(END_GRIP, 1, close), END_GRIP, open),
    dip: mix(END_DIP * (1 - snapE((f - 6) / 6)), END_DIP, open),
  };
};

// ---- Atahualpa --------------------------------------------------------------
const STAND: P2 = [ROOM.standX, FLOOR];
const LIFT = 26;
/** where the cord ends above him (figure-local y, before the lift) */
const KNOT_Y = -432;
const W_REST: P2 = [72, -150];
const W_TAUT: P2 = [76, -166];
const W_UP: P2 = [29, -374];
const W_LIE_L: P2 = [-80, -190];
const W_LIE_R: P2 = [82, -152];
/** lying: the hip's place on the floor at the foot of the bank (world) */
const HIP_LIE: P2 = [446, 1488];
export const figureAt = (f: number) => {
  const F = JOIN + f;
  const tautL = snapE((f - T.snap[1] - 1) / 4);
  const tautR = snapE((f - T.snap[2] - 1) / 4);
  const up = smootherstep(span(f, T.arms));
  const lift = smoothstep(span(f, T.lift));
  const dead = fall(span(f, T.death));
  const lower = smootherstep(span(f, T.lower));
  const u = clamp01(span(f, T.fold));
  const lie = smootherstep(u);
  const armsDown = smootherstep((f - 77) / 10);
  const sag = 13 * dead * (1 - lower);
  const hang = (LIFT * lift - 13 * dead) * (1 - lower);
  const wrist = (sgn: number, taut: number, lieP: P2): P2 => {
    const a = mix2([sgn * W_REST[0], W_REST[1]], [sgn * W_TAUT[0], W_TAUT[1]], taut);
    const b = mix2(a, [sgn * W_UP[0], W_UP[1] - sag], up);
    return mix2(b, lieP, armsDown);
  };
  // the fold: the legs go out from under him first (R), the trunk follows (TR)
  const R = 90 * smootherstep(Math.pow(u, 0.9));
  const TR = 80 * smootherstep((u - 0.28) / 0.72);
  const pose: EmperorPose = {
    head: mix(0.7 * Math.sin(F / 23) * (1 - dead), mix(22, 9, lie), dead),
    nod: dead,
    slump: mix(1.6 * dead, 1.15, lie) + 0.75 * Math.sin(Math.PI * clamp01(u / 0.85)),
    lean: TR - R + 4 * dead * (1 - lie),
    wristL: wrist(-1, tautL, W_LIE_L),
    wristR: wrist(1, tautR, W_LIE_R),
    fistL: mix(mix(0.75, 0.5, up), 0, smoothstep((f - 66) / 7)),
    fistR: mix(mix(0.75, 0.5, up), 0, smoothstep((f - 68) / 7)),
    hang,
    limp: mix(mix(mix(POSE_REST.limp, 0.5, up), 1, dead), 0.55, lie),
  };
  const rig = emperorRig(pose, "inca");
  const hipW = mix2([STAND[0] + rig.hip[0], STAND[1] + rig.hip[1]], HIP_LIE, lie);
  const rh = rot(rig.hip, R);
  const at: P2 = [hipW[0] - rh[0], hipW[1] - rh[1]];
  const w = (v: P2): P2 => {
    const q = rot(v, R);
    return [at[0] + q[0], at[1] + q[1]];
  };
  const loc = holdAnchors(pose, [0, 0]);
  return { pose, at, R, ties: { head: w(loc.head), l: w(loc.l), r: w(loc.r) }, dim: smoothstep((f - 79) / 9), knotY: FLOOR + KNOT_Y - LIFT * lift * (1 - lower) };
};

// ---- the strings and the cord ------------------------------------------------
const AXIS = ROOM.hand[0];
const BAR_Y = ROOM.hand[1] + 25;
const REACH = BAR_W / 2 - 12;
export const cordAt = (f: number) => {
  const fig = figureAt(f);
  const hand = handAt(f);
  const th = thetaAt(f);
  const c = Math.cos(th);
  const by = BAR_Y + hand.dip;
  // the join of the three strings: down from the bar to the knot above him; back up as the cord untwists
  const down = clamp01(span(f, T.front));
  const reach = 1 - Math.pow(1 - down, 1.5) * (1 - 0.5 * down);
  const back = smootherstep((f - 77) / 10);
  const yF = mix(by, fig.knotY, reach * (1 - back));
  const d = yF - by;
  const g = smoothstep(d / 90);
  const yG = by + Math.min(d * 0.55, 150);
  const ax = [AXIS, AXIS - REACH * c, AXIS + REACH * c];
  const ties = [fig.ties.head, fig.ties.l, fig.ties.r];
  const turns = th / TAU;
  // the dead front, by height: from the bar down the cord, then on down the strings
  const dr = span(f, T.drain);
  const yDead = dr <= 0 ? -1e6 : dr < 1 ? mix(by - 4, yF, dr) : 1e6;
  return { fig, hand, th, by, yF, yG, g, d, ax, ties, turns, yDead };
};

// ---------------------------------------------------------------------------
// THE TWISTED CORD: the three strings wound into one; the strands' wraps are
// the engraver's slanted strokes across it, closer as it tightens
// ---------------------------------------------------------------------------
const Cord: React.FC<{ x: number; y0: number; y1: number; k: number; amount: number; gap: number; phase: number; yDead: number; glint: number | null }> = ({ x, y0, y1, k, amount, gap, phase, yDead, glint }) => {
  if (y1 - y0 < 1 || amount < 0.02) return null;
  const w = ((STRING_W * 3.3) / k) * (0.55 + 0.45 * amount);
  const yd = Math.max(y0, Math.min(y1, yDead));
  const line = (a: number, b: number) => `M${x.toFixed(1)},${a.toFixed(1)}L${x.toFixed(1)},${b.toFixed(1)}`;
  let marks = "";
  const sl = w * 0.5;
  for (let y = y0 - gap + ((phase % 1) + 1) * gap; y < y1 - sl; y += gap) if (y > y0 + sl) marks += `M${(x - w / 2).toFixed(1)},${(y + sl).toFixed(1)}L${(x + w / 2).toFixed(1)},${(y - sl).toFixed(1)}`;
  const gl: [number, number][] = [];
  if (glint !== null) {
    const gy = mix(y0, y1, glint);
    for (const [hw, o] of [
      [26, 0.22],
      [15, 0.32],
      [7, 0.45],
    ]) {
      const a = Math.max(yd, gy - hw / k);
      const b = Math.min(y1, gy + hw / k);
      if (b - a > 1) gl.push([a, o], [b, o]);
    }
  }
  return (
    <g fill="none" opacity={clamp01(amount * 2.2)}>
      <path d={line(y0, y1)} stroke={DARK} strokeOpacity={0.62} strokeWidth={w + 3 / k} strokeLinecap="round" />
      {yd > y0 + 0.5 ? <path d={line(y0, yd)} stroke={INK} strokeOpacity={0.5} strokeWidth={w} strokeLinecap="butt" /> : null}
      {y1 > yd + 0.5 ? (
        <>
          <path d={line(yd, y1)} stroke={ACCENT_DEEP} strokeWidth={w} strokeLinecap="butt" />
          <path d={line(yd, y1)} stroke={ACCENT} strokeWidth={w * 0.62} strokeLinecap="butt" />
        </>
      ) : null}
      {gl.length
        ? [0, 2, 4].map((i) => (gl[i] ? <path key={i} d={line(gl[i][0], gl[i + 1][0])} stroke="#FFF3D2" strokeOpacity={gl[i][1]} strokeWidth={w * 0.62} strokeLinecap="butt" /> : null))
        : null}
      <path d={marks} stroke={DARK} strokeOpacity={0.72} strokeWidth={1.5 / k} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GAUNTLET, TURNING: ransomV2Shared's hand (same plates, same hatching;
// identical to it at theta 0), closed on the bar and turned about the forearm's
// axis. The fist is a ring of eight lobes round an oval (four fingers in front,
// four fingertips behind): as it turns they pass across it and round its side;
// the bar foreshortens, its near end comes toward us (the end grain shows) and
// passes in front of the fist; the thumb goes round the back.
// ---------------------------------------------------------------------------
const C_DEEP = "#D3C5A2";
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const f1 = (n: number) => n.toFixed(1);
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const sp = t1 - t0;
    if (sp < 3) continue;
    t0 += hash(i, seed + 7) * rag * sp;
    t1 -= hash(i, seed + 13) * rag * sp;
    d += `M${f1(px + dx * t0)},${f1(py + dy * t0)}L${f1(px + dx * t1)},${f1(py + dy * t1)}`;
  }
  return d;
};
const H_FORE = "M-43,-150L-50,-900L50,-900L43,-150Z";
const H_CUFF = "M-77,-176Q-40,-186 0,-192Q40,-186 77,-176L54,-82Q0,-70 -54,-82Z";
const H_THUMB = "M52,-46C80,-42 92,-2 76,26C68,38 50,35 50,22C56,10 58,-6 48,-24Z";
const HS = {
  fore: hatchD(6, -900, 50, -150, 96, 2.8, 71, 0.2),
  fore2: hatchD(26, -900, 50, -150, 58, 3.4, 72, 0.2),
  fore3: hatchD(-50, -900, -38, -150, 84, 3.2, 70, 0.3),
  back: hatchD(10, -66, 60, -4, 103, 2.8, 73),
  back2: hatchD(34, -66, 60, -4, 56, 3.4, 74),
  cuff: hatchD(12, -192, 78, -70, 102, 2.8, 75),
  cuff2: hatchD(40, -192, 78, -70, 55, 3.4, 76),
  cuff3: hatchD(-78, -170, -58, -80, 78, 3.2, 69, 0.3),
  thumb: hatchD(64, -46, 92, 36, 100, 2.6, 84, 0.15),
  lames: [0, 1, 2].map((j) => hatchD(14, -96 + j * 11.5, 52, -78 + j * 11.5, 98, 2.8, 79 + j, 0.15)),
  bar: hatchD(-BAR_W / 2, 18, BAR_W / 2, 26, 100, 4, 77, 0.2),
};
/** the fist's oval (hand units): half-width across the knuckles, half-depth */
const FA = 60;
const FB = 38;
const EDGES = [-59.5, -29.7, 0.1, 29.9, 59.7];
const TwistHand: React.FC<{ at: P2; theta: number; uid: string }> = ({ at, theta, uid }) => {
  const S = HAND_S;
  const sc = `scale(${S})`;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const half = (BAR_W / 2) * Math.abs(c);
  /** a point on a cylinder of radius r at angle phi (0 = toward us), turned */
  const on = (r: number, phiDeg: number) => {
    const p = (phiDeg * Math.PI) / 180 + theta;
    return { x: r * Math.sin(p), front: Math.cos(p) > 0.04 };
  };
  const wf = Math.sqrt(c * c + (FB / FA) * (FB / FA) * s * s);
  const BACK = `M${f1(-53 * wf)},-58Q0,-67 ${f1(53 * wf)},-58L${f1(59 * wf)},-13Q0,-4 ${f1(-59 * wf)},-13Z`;
  // the eight lobes
  const lobes: { xa: number; xb: number; front: boolean; j: number }[] = [];
  for (const front of [true, false])
    for (let j = 0; j < 4; j++) {
      let xa = 1e9;
      let xb = -1e9;
      for (let n = 0; n <= 8; n++) {
        const x = mix(EDGES[j], EDGES[j + 1], n / 8);
        const zz = FB * Math.sqrt(Math.max(0, 1 - (x / FA) * (x / FA))) * (front ? 1 : -1);
        if (-x * s + zz * c < -1e-6) continue;
        const xr = x * c + zz * s;
        xa = Math.min(xa, xr);
        xb = Math.max(xb, xr);
      }
      if (xb - xa > 2.5) lobes.push({ xa, xb: xb - (xb - xa) / 29.8, front, j });
    }
  // the thumb: on the right at 0, round the back, mirrored on the left at a half-turn, toward us at three quarters
  const thumbFront = s < -0.02;
  const tsx = thumbFront && Math.abs(c) < 0.45 ? (c < 0 ? -0.45 : 0.45) : c;
  const thumb = (
    <g transform={`translate(${f1(50 * (thumbFront ? c * 0.6 : c))} 0) scale(${tsx.toFixed(3)} 1) translate(-50 0)`}>
      <path d={H_THUMB} fill={C_DEEP} {...OUT} strokeWidth={2} />
      <g clipPath={`url(#${uid}-thumb)`}>
        <path d={HS.thumb} {...ln(0.8, 0.6)} />
        <path d="M52,-22Q68,-26 84,-16M54,2Q70,0 86,8" {...ln(1.1, 0.75)} />
      </g>
    </g>
  );
  const bar = (side: -1 | 1) => (
    <g clipPath={`url(#${uid}-bar${side})`}>
      <path d={`M${-half},2L${half},2L${half + 3},14L${half},26L${-half},26L${-half - 3},14Z`} fill={C_DEEP} {...OUT} />
      <path d={`M${-half + 8},8Q${-half * 0.4},5.5 0,8T${half - 8},7.5M${-half + 14},13.5Q${-half * 0.5},16 ${-half * 0.1},13T${half - 10},14M${-half + 6},19Q0,21 ${half - 6},19`} {...ln(0.95, 0.6)} />
      <g clipPath={`url(#${uid}-barin)`}>
        <path d={HS.bar} {...ln(0.85, 0.5)} />
      </g>
      {half > 26 ? <path d={[-3.4, 0, 3.4].map((o) => `M${side * (half - 12) + o * Math.abs(c)},1L${side * (half - 12) + o * Math.abs(c)},27`).join("")} {...ln(1.5, 0.9)} /> : null}
    </g>
  );
  // which half of the bar comes toward us (its +x end is at depth -s)
  const nearSide: -1 | 0 | 1 = Math.abs(s) < 0.03 ? 0 : (s < 0 ? 1 : -1) * (c >= 0 ? 1 : -1) > 0 ? 1 : -1;
  const capX = nearSide * half;
  const capR = 13 * Math.abs(s);
  const seam = on(46, -16.4);
  const seam2 = on(46, 163.6);
  const ridge = on(1, 0);
  const ridge2 = on(1, 180);
  const rivets = [-51.2, -24.6, 24.6, 51.2, 128.8, 155.4, 204.6, 231.2].map((p) => on(77, p));
  const plate = [-33, 0, 33, 147, 180, 213].map((p) => on(1, p));
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`}>
      <clipPath id={`${uid}-fore`}>
        <path d={H_FORE} />
      </clipPath>
      <clipPath id={`${uid}-cuff`}>
        <path d={H_CUFF} />
      </clipPath>
      <clipPath id={`${uid}-back`}>
        <path d={BACK} />
      </clipPath>
      <clipPath id={`${uid}-thumb`}>
        <path d={H_THUMB} />
      </clipPath>
      <clipPath id={`${uid}-bar-1`}>
        <rect x={-half - 6} y={-4} width={half + 6} height={36} />
      </clipPath>
      <clipPath id={`${uid}-bar1`}>
        <rect x={0} y={-4} width={half + 6} height={36} />
      </clipPath>
      <clipPath id={`${uid}-barin`}>
        <rect x={-half} y={2} width={2 * half} height={24} />
      </clipPath>
      <g transform={sc}>
        <path d={H_FORE} fill={INK} {...OUT} />
        <g clipPath={`url(#${uid}-fore)`}>
          <path d={HS.fore} {...ln(0.9, 0.62)} />
          <path d={HS.fore2} {...ln(0.85, 0.5)} />
          <path d={HS.fore3} {...ln(0.85, 0.4)} />
          {[seam, seam2].map((q, i) => (q.front ? <path key={i} d={`M${f1(q.x * 1.08)},-900L${f1(q.x * 0.92)},-150`} {...ln(1.3, 0.7)} /> : null))}
          {[-250, -330, -410, -490, -570, -650, -730, -810].map((yy) => (
            <path key={yy} d={`M-52,${yy}Q0,${yy + 11} 52,${yy}`} {...ln(1.3, 0.75)} />
          ))}
        </g>
        {[0, 1, 2].map((j) => {
          const y0 = -90 + j * 11.5;
          return (
            <g key={j}>
              <path d={`M-52,${y0}Q0,${y0 - 9} 52,${y0}L53,${y0 + 14}Q0,${y0 + 5} -53,${y0 + 14}Z`} fill={j === 1 ? C_DEEP : INK} {...OUT} strokeWidth={1.9} />
              <path d={HS.lames[j]} {...ln(0.8, 0.55)} />
            </g>
          );
        })}
        {/* the back of the hand; the palm when it has turned away */}
        <path d={BACK} fill={mixColor(INK, C_DEEP, (0.25 - c) / 0.5)} {...OUT} />
        <g clipPath={`url(#${uid}-back)`}>
          <path d={HS.back} {...ln(0.9, 0.62)} />
          <path d={HS.back2} {...ln(0.85, 0.5)} />
          {plate.map((q, i) => (q.front ? <path key={i} d={`M${f1(q.x * 52)},-60L${f1(q.x * 66)},-10`} {...ln(1.2, 0.6)} /> : null))}
          <path d={`M${f1(-57 * wf)},-22Q0,-13 ${f1(57 * wf)},-22`} {...ln(1.2, 0.6)} />
        </g>
        <path d={H_CUFF} fill={INK} {...OUT} />
        <g clipPath={`url(#${uid}-cuff)`}>
          <path d={HS.cuff} {...ln(0.9, 0.62)} />
          <path d={HS.cuff2} {...ln(0.85, 0.5)} />
          <path d={HS.cuff3} {...ln(0.85, 0.4)} />
          <path d="M-74,-163Q-38,-172 0,-178Q38,-172 74,-163M-57,-93Q0,-81 57,-93" {...ln(1.3, 0.8)} />
          {[ridge, ridge2].map((q, i) => (q.front ? <path key={i} d={`M${f1(q.x * 77)},-192L${f1(q.x * 54)},-80`} {...ln(1.2, 0.6)} /> : null))}
        </g>
        {rivets.map((q, i) => (q.front ? <circle key={i} cx={q.x} cy={-169.5 - (1 - Math.abs(q.x) / 77) * 11} r={2.5} fill={DARK} opacity={0.8} /> : null))}
      </g>
      {/* the bar's far half (both halves while it lies across) */}
      {nearSide !== 1 ? bar(1) : null}
      {nearSide !== -1 ? bar(-1) : null}
      <g transform={sc}>
        {thumbFront ? null : thumb}
        {lobes.map((L) => {
          const w = L.xb - L.xa;
          const m = (L.xa + L.xb) / 2;
          const x0 = L.xa;
          if (!L.front)
            return (
              <g key={`r${L.j}`}>
                <path d={`M${f1(x0)},3L${f1(x0 + w)},3L${f1(x0 + w)},18Q${f1(x0 + w)},31 ${f1(m)},31Q${f1(x0)},31 ${f1(x0)},18Z`} fill={C_DEEP} {...OUT} strokeWidth={2} />
                <path d={`M${f1(x0)},14Q${f1(m)},18.4 ${f1(x0 + w)},14`} {...ln(1.05, 0.75)} />
              </g>
            );
          return (
            <g key={`f${L.j}`}>
              <path d={`M${f1(x0)},-11L${f1(x0 + w)},-11L${f1(x0 + w)},18Q${f1(x0 + w)},31 ${f1(m)},31Q${f1(x0)},31 ${f1(x0)},18Z`} fill={INK} {...OUT} strokeWidth={2} />
              <path d={[0, 10, 20].map((yy) => `M${f1(x0 + (yy === 20 ? 1 : 0))},${yy}Q${f1(m)},${yy + (yy === 20 ? 4 : 4.4)} ${f1(x0 + w - (yy === 20 ? 1 : 0))},${yy}`).join("")} {...ln(1.05, 0.75)} />
              {w > 12 ? <path d={hatchD(x0 + w - 10, -9, x0 + w - 1.4, 27, 95, 2.2, 78 + L.j, 0.2)} {...ln(0.8, 0.6)} /> : null}
            </g>
          );
        })}
        {lobes.map((L) => {
          if (!L.front) return null;
          const w = L.xb - L.xa;
          return (
            <g key={`k${L.j}`}>
              <path d={`M${f1(L.xa + 1)},-9Q${f1(L.xa + w / 2)},-27 ${f1(L.xa + w - 1)},-9Z`} fill={INK} {...OUT} strokeWidth={1.9} />
              {w > 20 ? <path d={`M${f1(L.xa + w * 0.55)},-17.4q5,2 6.6,7.6M${f1(L.xa + w * 0.7)},-13.6q2.6,1.6 3.2,4`} {...ln(0.8, 0.55)} /> : null}
            </g>
          );
        })}
        {thumbFront ? thumb : null}
      </g>
      {/* the bar's near half, and its end grain */}
      {nearSide !== 0 ? (
        <>
          {bar(nearSide)}
          <ellipse cx={capX} cy={14} rx={Math.max(1.2, capR)} ry={12.6} fill={C_DEEP} {...OUT} />
          {capR > 5 ? <ellipse cx={capX} cy={14} rx={capR * 0.52} ry={6.6} {...ln(1, 0.6)} /> : null}
          {capR > 9 ? <circle cx={capX} cy={14} r={1.6} fill={DARK} opacity={0.7} /> : null}
        </>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
const UID = "gtd2";
const DIM_TO = [0x17 / 255, 0x12 / 255, 0x0d / 255];

const GarrottedToDeathV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const F = JOIN + frame;
  const cam = camAt(frame);
  const k = cam.k;
  const st = cordAt(frame);
  const { fig, hand, th, by, yF, yG, g, ax, ties, turns, yDead } = st;
  const end = ransomEndScene(F);
  const endS = [end.strings.head, end.strings.l, end.strings.r];
  const sides = [1, -1, 1];

  // the three strings: bar -> gather -> join -> tie
  const loose = smoothstep((frame - 77) / 11);
  const strings = [0, 1, 2].map((i) => {
    const t0 = T.snap[i];
    const e0 = snapE((frame - t0) / 4);
    const e1 = snapE((frame - t0 - 1.5) / 4.5);
    const s0 = endS[i].slack;
    const sway = 1 + 0.09 * Math.sin(frame / (8.5 + i) + i * 1.9);
    const slack: [number, number] = [Math.max(s0 * (1 - e0), 0.7 * loose), Math.max(s0 * (1 - e1), 0.85 * loose)];
    const sag = mix(mix(endS[i].sag ?? 0.17, 0.17, e1), 0.2 * sway, loose);
    const side = loose > 0 ? mix(sides[i], [0.6, -1, 1][i], loose) : (endS[i].side ?? sides[i]);
    const A: P2 = [ax[i], by];
    const G: P2 = [mix(ax[i], AXIS, g), yG];
    const J: P2 = [mix(ax[i], AXIS, g), yF];
    const liveOf = (a: number, b: number): [number, number] | null => {
      if (yDead <= Math.min(a, b)) return [0, 1];
      if (yDead >= Math.max(a, b)) return null;
      return [clamp01((yDead - a) / (b - a)), 1];
    };
    const hi = frame >= t0 + 2 && frame < T.twist[0] + 2 ? (frame - t0 - 2) / 12 : null;
    return { A, G, J, tie: ties[i], slack, sag, side, liveOf, hi: hi !== null && hi > -0.1 && hi < 1.1 ? hi : null };
  });
  const dead = mix(TONE.dead + 0.1, TONE.second, smoothstep((frame - 74) / 10));

  const twisting = Math.abs(Math.sin(th / 2)) > 0.002;
  const labelOp = mix(1, TONE.second, smoothstep(span(frame, T.label)));
  const full = smoothstep((frame - 76) / 10);
  const rest = 0.3 * smoothstep(span(frame, T.gold));
  const d = 0.45 * fig.dim;
  const gap = mix(21, 5.4, smoothstep(turns)) * (1 - 0.14 * smoothstep(span(frame, T.lift))) ;
  const cordGlint = frame > T.front[1] && frame < T.drain[0] + 3 ? ((frame - T.front[1]) % 13) / 11 - 0.05 : null;

  return (
    <RansomPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <defs>
          <filter id={`${UID}-case`} x="-40%" y="-25%" width="180%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={5.5} result="fat" />
            <feFlood floodColor={DARK} floodOpacity={0.92} />
            <feComposite in2="fat" operator="in" result="case" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`${1 - d} 0 0 0 ${d * DIM_TO[0]} 0 ${1 - d} 0 0 ${d * DIM_TO[1]} 0 0 ${1 - d} 0 ${d * DIM_TO[2]} 0 0 0 1 0`}
              result="fig"
            />
            <feMerge>
              <feMergeNode in="case" />
              <feMergeNode in="fig" />
            </feMerge>
          </filter>
        </defs>
        <RansomWall />
        {rest > 0.003 ? <rect x={-900} y={-900} width={2900} height={4200} fill={DARK} opacity={rest} /> : null}
        <ChalkLine l={1} r={1} />
        {full < 0.999 ? <Bank shadeX={STAND[0]} /> : null}
        {full > 0.001 ? (
          <g opacity={full}>
            <Bank shadeX={null} />
          </g>
        ) : null}
        <g filter={`url(#${UID}-case)`}>
          <g transform={`translate(${fig.at[0].toFixed(2)} ${fig.at[1].toFixed(2)}) rotate(${fig.R.toFixed(2)})`}>
            <Emperor pose={fig.pose} variant="inca" at={[0, 0]} tone={1} uid={`${UID}-e`} />
          </g>
        </g>
        {strings.map((s, i) => (
          <g key={i}>
            {s.G[1] - s.A[1] > 0.6 ? <PuppetString from={s.A} to={s.G} slack={0} base={dead} live={s.liveOf(s.A[1], s.G[1])} k={k} /> : null}
            {s.J[1] - s.G[1] > 0.6 && g < 0.995 ? <PuppetString from={s.G} to={s.J} slack={0} base={dead} live={s.liveOf(s.G[1], s.J[1])} k={k} /> : null}
            <PuppetString from={s.J} to={s.tie} slack={s.slack} sag={s.sag} side={s.side} base={yDead > -1e5 ? dead : 1} live={frame >= T.drain[1] + 3 ? null : frame >= T.drain[1] ? [(frame - T.drain[1]) / 3, 1] : s.liveOf(s.J[1], s.tie[1])} highlight={s.hi} k={k} />
          </g>
        ))}
        <Cord x={AXIS} y0={yG} y1={yF} k={k} amount={g} gap={gap} phase={turns * 7} yDead={yDead} glint={cordGlint} />
        {twisting ? <TwistHand at={ROOM.hand} theta={th} uid={`${UID}-t`} /> : <RansomHand at={ROOM.hand} grip={hand.grip} dip={hand.dip} uid={`${UID}-h`} />}
      </WorldSvg>
      <Label text={PIZARRO.text} x={PIZARRO.x} y={PIZARRO.y} cam={cam} frame={F} f0={PIZARRO_F0} size={PIZARRO.size} opacity={labelOp} />
    </RansomPage>
  );
};

/** where things are on screen (checks, the report) */
export const framing = (f: number) => {
  const cam = camAt(f);
  const st = cordAt(f);
  const y = (wy: number) => Math.round(screenOf([AXIS, wy], cam)[1]);
  return { f, k: +cam.k.toFixed(3), bar: y(st.by), join: y(st.yF), headTie: st.ties[0].map(Math.round), floor: y(FLOOR), line: y(ROOM.line), turn: Math.round((st.th * 180) / Math.PI), hang: +st.fig.pose.hang.toFixed(1), R: Math.round(st.fig.R) };
};

export default GarrottedToDeathV2;
