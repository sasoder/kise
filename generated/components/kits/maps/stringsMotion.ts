// ---------------------------------------------------------------------------
// stringsMotion: the pure maths of the "strings" set (Sheppard, "Why captured
// emperors cooperated"): vectors, the relaxed two-bone solve, the emperor's and
// the nobles' rigs, the captor hand's anchors, the string curve, the layout and
// the camera presets. No React here; the drawing is stringsShared.tsx.
// World units = px at k 1, x 0..1080. A camera preset's FOCUS is the world
// point held at screen (540, 835) (the house caption-safe anchor, camFor's
// default), NOT at the frame's middle.
// ---------------------------------------------------------------------------
import { camFor, clamp01, hash, type Cam, type P2 } from "./incaShared";

export type Variant = "aztec" | "inca";

// ---- vectors ---------------------------------------------------------------
export const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
export const vlen = (a: P2) => Math.hypot(a[0], a[1]);
export const norm = (a: P2): P2 => {
  const l = vlen(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const rot = (a: P2, deg: number): P2 => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

/** a two-bone joint that may FORESHORTEN (a frontal figure's forearm points at
 *  the viewer): the middle joint starts at `hint` (the relaxed elbow / knee)
 *  and is only moved as far as the bones' full lengths force it. Continuous in
 *  the target; the target is clamped to the reach. */
export const relaxedJoint = (S: P2, W: P2, hint: P2, L1: number, L2: number): { mid: P2; end: P2 } => {
  let w = W;
  const d = vlen(sub(W, S));
  if (d > L1 + L2 - 0.5) w = add(S, mul(norm(sub(W, S)), L1 + L2 - 0.5));
  let e = hint;
  for (let i = 0; i < 24; i++) {
    const a = sub(e, w);
    const la = vlen(a);
    if (la > L2) e = add(w, mul(a, L2 / la));
    const b = sub(e, S);
    const lb = vlen(b);
    if (lb > L1) e = add(S, mul(b, L1 / lb));
  }
  return { mid: e, end: w };
};

// ---------------------------------------------------------------------------
// LAYOUT (world px)
// ---------------------------------------------------------------------------
/** the emperor's feet */
export const EMPEROR_AT: P2 = [540, 760];
/** the emperor stands ~330 px tall (feet to the diadem's tip) */
export const EMPEROR_H = 330;
/** the captor's hand: the middle of its grip (where the bar passes) */
export const HAND_AT: P2 = [540, 170];
export const BAR_W = 360;
export const N_NOBLES = 7;
/** the nobles' feet, on a shallow arc (the centre one lowest), their variant and hashed size */
export const NOBLES: { x: number; y: number; s: number; v: number }[] = Array.from({ length: N_NOBLES }, (_, i) => {
  const u = (i - 3) / 3;
  return { x: 150 + 130 * i, y: 1094 - 28 * u * u, s: 0.97 + 0.07 * hash(i, 911), v: [2, 0, 3, 1, 2, 0, 3][i] };
});
/** which fist holds noble i's string: 4 left (0-3), 3 right (4-6) */
export const fistOf = (i: number): "L" | "R" => (i <= 3 ? "L" : "R");
/** outside-in order (0, 6, 1, 5, 2, 4, 3) and each noble's rank in it */
export const OUTSIDE_IN = [0, 6, 1, 5, 2, 4, 3];
export const outsideRank = (i: number) => OUTSIDE_IN.indexOf(i);

// ---------------------------------------------------------------------------
// THE EMPEROR'S RIG (figure-local: feet at (0, 0), up is negative y)
// ---------------------------------------------------------------------------
export type EmperorPose = {
  /** head tilt, deg (+ = toward screen right) */
  head: number;
  /** 0..1 the head bowed forward: it drops onto the chest, eyes close */
  nod: number;
  /** 0..1 the torso's slump: shoulders drop and round, knees give */
  slump: number;
  /** torso lean about the hips, deg */
  lean: number;
  /** wrist targets, figure-local (L = SCREEN left); they ride with `hang` */
  wristL: P2;
  wristR: P2;
  /** 1 = closed fist, 0 = open hand */
  fistL: number;
  fistR: number;
  /** px the body is lifted off its feet (the toes point down as it grows) */
  hang: number;
  /** 0..1 the hands dangle from the wrists (a marionette's) */
  limp: number;
};
export const lerpPose = (a: EmperorPose, b: EmperorPose, t: number): EmperorPose => ({
  head: mix(a.head, b.head, t),
  nod: mix(a.nod, b.nod, t),
  slump: mix(a.slump, b.slump, t),
  lean: mix(a.lean, b.lean, t),
  wristL: mix2(a.wristL, b.wristL, t),
  wristR: mix2(a.wristR, b.wristR, t),
  fistL: mix(a.fistL, b.fistL, t),
  fistR: mix(a.fistR, b.fistR, t),
  hang: mix(a.hang, b.hang, t),
  limp: mix(a.limp, b.limp, t),
});
/** upright, fists raised at chest height (E1) */
export const POSE_UPRIGHT: EmperorPose = { head: 0, nod: 0, slump: 0, lean: 0, wristL: [-80, -219], wristR: [80, -219], fistL: 1, fistR: 1, hang: 0, limp: 0 };
/** upright, the hands raised and OPEN, 14 px lower (before he takes the strings) */
export const POSE_OPEN: EmperorPose = { ...POSE_UPRIGHT, wristL: [-80, -205], wristR: [80, -205], fistL: 0.45, fistR: 0.45 };
/** slumped: head bowed and tilted, shoulders dropped, arms hanging, hands open (E2) */
export const POSE_SLUMP: EmperorPose = { head: 25, nod: 1, slump: 1, lean: 3, wristL: [-58, -122], wristR: [66, -120], fistL: 0, fistR: 0, hang: 0, limp: 0.4 };
/** hanging from three strings: wrists lifted to shoulder height, elbows drooping, toes down (E3) */
export const POSE_HANG: EmperorPose = { head: 0, nod: 0, slump: 0.12, lean: 0, wristL: [-106, -256], wristR: [106, -256], fistL: 0.6, fistR: 0.6, hang: 11, limp: 1 };

const ARM = { upper: 60, fore: 56 };
const LEG = { thigh: 70, shin: 68 };
/** the headdress's top in head-local units (the head string ties here) */
/** the head is drawn at this scale (head-local units x HEAD_SCALE = figure px) */
export const HEAD_SCALE = 1.1;
const HEAD_TOP: Record<Variant, P2> = { aztec: [0, -53], inca: [0, -33] };
export type EmperorRig = ReturnType<typeof emperorRig>;
export const emperorRig = (q: EmperorPose, variant: Variant = "aztec") => {
  const s = q.slump;
  const hip: P2 = [q.lean * 0.4, -152 + 9 * s - q.hang];
  const up = rot([0, -1], q.lean);
  const rt = rot([1, 0], q.lean);
  const top = add(hip, mul(up, 96 - 12 * s));
  const hw = 47 - 5 * s;
  const dr = 3 + 10 * s;
  const shL = add(add(top, mul(rt, -hw)), mul(up, -dr));
  const shR = add(add(top, mul(rt, hw)), mul(up, -dr));
  const neck = add(top, mul(up, 3 - 3 * s));
  const headAngle = q.lean + q.head;
  const headC = add(neck, rot([0, -(28 - 14 * q.nod)], q.lean + q.head * 0.45));
  const arm = (S: P2, W: P2, sgn: number, fist: number) => {
    const { mid: E, end: Wc } = relaxedJoint(S, [W[0], W[1] - q.hang], add(S, [sgn * 9, 54]), ARM.upper, ARM.fore);
    const f = sub(Wc, E);
    const fd: P2 = vlen(f) > 4 ? norm(f) : [0, -1];
    const dir = norm(mix2(fd, [0, 1], q.limp));
    return { S, E, W: Wc, dir, fist, sgn, grip: add(Wc, mul(dir, 10)) };
  };
  const armL = arm(shL, q.wristL, -1, q.fistL);
  const armR = arm(shR, q.wristR, 1, q.fistR);
  const leg = (sgn: number) => {
    const H: P2 = [hip[0] + sgn * 17, hip[1] + 2];
    const A: P2 = [sgn * 21, -15 - q.hang];
    const { mid: K } = relaxedJoint(H, A, [H[0] + sgn * (4 + 7 * s), H[1] + 68], LEG.thigh, LEG.shin);
    return { H, K, A, sgn };
  };
  return {
    hip,
    top,
    shL,
    shR,
    neck,
    headC,
    headAngle,
    armL,
    armR,
    legL: leg(-1),
    legR: leg(1),
    /** 0 = flat on the ground, 1 = toes hanging down */
    point: clamp01(q.hang / 9),
    headTop: add(headC, rot(mul(HEAD_TOP[variant], HEAD_SCALE), headAngle)),
  };
};
/** the emperor's anchors in WORLD px (at = his feet) */
export const emperorAnchors = (q: EmperorPose, variant: Variant = "aztec", at: P2 = EMPEROR_AT) => {
  const r = emperorRig(q, variant);
  const w = (v: P2): P2 => add(at, v);
  return {
    /** the middle of each fist (a string he holds leaves 8 px below it) */
    fistL: w(r.armL.grip),
    fistR: w(r.armR.grip),
    /** where a string from above ties to each wrist */
    wristL: w(add(r.armL.W, [0, -7])),
    wristR: w(add(r.armR.W, [0, -7])),
    headTop: w(r.headTop),
    headC: w(r.headC),
    chest: w(mix2(r.top, r.hip, 0.3)),
    feet: at,
  };
};

// ---------------------------------------------------------------------------
// THE NOBLE'S RIG (figure-local at scale 1: ~150 tall upright, feet at (0, 0))
// ---------------------------------------------------------------------------
export const nobleRig = (bow: number) => {
  const b = clamp01(bow);
  const hipY = -62 + 5 * b;
  const shY = hipY - 44 + 14 * b;
  const hw = 21 + 2 * b;
  const headC: P2 = [0, shY - 13 + 17 * b];
  return { b, hipY, shY, hw, headC, crown: [0, headC[1] - 12.5] as P2, hemY: hipY + 27 };
};
/** noble i's head-top (where his string ties) in WORLD px */
export const nobleHeadTop = (i: number, bow: number): P2 => {
  const n = NOBLES[i];
  return [n.x, n.y + nobleRig(bow).crown[1] * n.s];
};
/** noble i's height in world px (feet to feather tips), upright */
export const NOBLE_H = 152;

// ---------------------------------------------------------------------------
// THE CAPTOR'S HAND + BAR (hand-local: (0, 0) = the middle of the grip)
// ---------------------------------------------------------------------------
/** the gauntlet is drawn at this scale: cuff ~190 px wide, the fist ~150 */
export const HAND_S = 1.25;
/** the wrist the hand tilts about (hand-local, world px) */
const HAND_WRIST: P2 = [0, -66 * HAND_S];
export type HandState = { bar: number; tilt: number };
export const handAnchors = (h: HandState, at: P2 = HAND_AT) => {
  const w = (v: P2): P2 => add(at, add(HAND_WRIST, rot(sub(v, HAND_WRIST), h.tilt)));
  const half = (BAR_W / 2 - 12) * h.bar;
  return {
    /** under the fist: the single string (bar 0) and the head string leave here */
    grip: w([0, 30 * HAND_S]),
    /** under the bar's middle and ends */
    barC: w([0, 25]),
    barL: w([-half, 25]),
    barR: w([half, 25]),
    wrist: add(at, HAND_WRIST),
  };
};

// ---------------------------------------------------------------------------
// THE STRING: a curve from `from` (the puller's end, s = 0) to `to` (s = 1).
// slack 1 = hanging loose (a belly under gravity; a near-vertical string bows
// sideways and wanders), 0 = straight and taut. slack may be [atFrom, atTo],
// so a pull can travel down the string (the from end straightens first).
// ---------------------------------------------------------------------------
export type StringGeom = { from: P2; to: P2; slack?: number | [number, number]; sag?: number; side?: number };
export const stringPoint = (g: StringGeom, s: number): P2 => {
  const [s0, s1] = typeof g.slack === "number" ? [g.slack, g.slack] : (g.slack ?? [0, 0]);
  const sl = mix(s0, s1, s);
  const c = mix2(g.from, g.to, s);
  if (sl <= 0.0005) return c;
  const ch = sub(g.to, g.from);
  const L = vlen(ch);
  const u = norm(ch);
  const side = g.side ?? (u[0] >= 0 ? 1 : -1);
  const n: P2 = [-u[1], u[0]];
  const nn: P2 = n[1] < 0 ? [-n[0], -n[1]] : n; // the normal that points down
  const vert = 1 - Math.abs(u[0]);
  const d = sl * ((g.sag ?? 0.17) * L + 6);
  const env = 4 * s * (1 - s);
  // gravity's part across the chord + a sideways bow where the string is near vertical
  const belly = env * d * (Math.abs(u[0]) * 0.9 + 0.1);
  const bow = env * d * 0.42 * vert * side;
  const wander = Math.sin(2 * Math.PI * s) * d * 0.16 * (0.4 + 0.6 * vert) * side;
  return [c[0] + nn[0] * belly + n[0] * (bow + wander), c[1] + nn[1] * belly + n[1] * (bow + wander)];
};
/** the string's polyline over [a, b] */
export const stringPts = (g: StringGeom, a = 0, b = 1, n = 40): P2[] => {
  const out: P2[] = [];
  const m = Math.max(2, Math.ceil(n * Math.abs(b - a)) + 1);
  for (let i = 0; i < m; i++) out.push(stringPoint(g, a + ((b - a) * i) / (m - 1)));
  return out;
};

// ---------------------------------------------------------------------------
// CAMERAS: { focus, k }: the world point `focus` held at screen (540, 835)
// ---------------------------------------------------------------------------
export type CamPreset = { focus: P2; k: number };
/** E1 at k 1.18 (director, 2026-10-06: k 1 read too small on a phone; 1.18 is the largest zoom that keeps all seven nobles >= 40 px inside the frame) */
export const CAM_E1: CamPreset = { focus: [540, 760], k: 1.18 };
export const CAM_E2: CamPreset = { focus: [540, 560], k: 1.12 };
export const CAM_E3: CamPreset = { focus: [540, 640], k: 0.96 };
export const camOf = (c: CamPreset): Cam => camFor(c.focus, c.k);
/** between two presets (log-zoom; t is the caller's eased 0..1) */
export const lerpCam = (a: CamPreset, b: CamPreset, t: number): CamPreset => ({
  focus: mix2(a.focus, b.focus, t),
  k: Math.exp(mix(Math.log(a.k), Math.log(b.k), t)),
});
