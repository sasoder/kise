// ---------------------------------------------------------------------------
// tenEarthsBotBody — the GEOMETRY and POSES of THE ROBOT (rsi-ten-earths, brief W4): one AI drawn as a small
// picture-book toy robot in the house orange. Pure functions (no React). The API is the header of tenEarthsBot.tsx;
// this file is its geometry.
//
// THE POSE IS THE GENIUS'S (a covidFolk CovidPose + `pencil`, + the robot's own `boot`): every pose a cut builds for
// the Genius (GENIUS_POSES, covidFolk POSES, lerpPose, breathe, mirrorPose) drives the robot unchanged. The pose is
// solved on covidFolk's officer rig (covidRig, imported, never edited) and RETARGETED onto the robot's short body:
//   legs   the rig's hip-knee-ankle chain scaled by LEG_K about the floor (angles kept, planted feet stay planted;
//          the walk advance and the stepOut shift scale with it), the feet spread LEG_SPREAD wider under the barrel;
//          seated: the hips on the seat (seatH), the short legs dangling from it.
//   torso  a soft barrel on the hips, leaning with the rig's lean; the head a rounded box on a short neck, rolling
//          with the rig's head angle and turning with its yaw (2.5D: the face screen slides across the front and
//          foreshortens, a side plane appears, the far ear goes behind).
//   arms   the rig's shoulder-elbow-wrist chain scaled by ARM_K about the robot's shoulder (the rig's elbow side and
//          foreshortening kept). Hand targets (typing, the tick) are solved IN THE POSE (botGripTo) by setting the rig's
//          wrist targets, so the poses stay plain CovidPoses that lerpPose and breathe pass through.
// ---------------------------------------------------------------------------
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import { FU, POSES, breathe, closedD, covidRig, ellPts, lerpPose, mirrorPose, tubeD, type CShape, type CovidPose, type P2 } from "../kyle-covid/covidFolkBody";
import { GENIUS_POSES } from "./tenEarthsGeniusBody";

export type { CShape, CovidPose, P2 };
export { FU };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);
const frac = (v: number) => v - Math.floor(v);
const D2R = Math.PI / 180;

// ===================================================================================================================
// COLOURS AND THE LOOKS
// ===================================================================================================================
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
/** the crescent shadow of the orange body goes toward this deep orange (as the Genius's cloth did) */
export const ORANGE_SHADE = "#A85A08";
/** the joints (shoulder, elbow, knee discs, neck, ears) and the mitten hands: a light warm orange-cream */
export const BOT_SKIN = "#FFD9A0";
export const BOT_JOINT = "#FFCB7A";
/** the face screen (dark petrol) on and off, the eyes / smile / bulb (cream) */
export const BOT_SCREEN = "#24433F";
export const BOT_SCREEN_OFF = "#18292A";
export const BOT_EYE = "#F3EBDD";
const FOOT = "#E8940A";
const SOLE = "#B5660A";
const STALK = "#D98A0C";
const PANEL_C = "#F6EAD0";
const PANEL_LINE = "#C77A0A";

/** the cast's units: a man 312 = 1.75 m; U = 178 per metre. THE ROBOT is 240 units (1.35 m) soles to head top. */
export const BOT_UNITS = 240;
export const U = 178;
export const botScaleForPx = (px: number) => px / BOT_UNITS;

export type BotLook = { name: string; antenna: boolean; ears: boolean; panel: "plate" | "dial" | "vents" };
/** the five variants: one model, small details (antenna or none, ear discs, the chest panel's shape) */
export const BOT_LOOKS: BotLook[] = [
  { name: "v0 THE Bot: antenna, ear discs, chest plate", antenna: true, ears: true, panel: "plate" },
  { name: "v1 no antenna, ear discs, chest plate", antenna: false, ears: true, panel: "plate" },
  { name: "v2 antenna, no ears, chest dial", antenna: true, ears: false, panel: "dial" },
  { name: "v3 antenna, ear discs, chest vents", antenna: true, ears: true, panel: "vents" },
  { name: "v4 no antenna, ear discs, chest dial", antenna: false, ears: true, panel: "dial" },
];
export const BOT_VARIANTS = BOT_LOOKS.length;
const lookOfV = (v: number) => BOT_LOOKS[((Math.round(v) % BOT_VARIANTS) + BOT_VARIANTS) % BOT_VARIANTS];
export const botInks = () => ({ body: ACCENT, limb: ACCENT, joint: BOT_JOINT, hand: BOT_SKIN, foot: FOOT, sole: SOLE, screen: BOT_SCREEN, eye: BOT_EYE });

// ===================================================================================================================
// THE BODY'S MEASURES (robot units; feet at (0, 0), up -y)
// ===================================================================================================================
/** the rig's legs (69 + 66 + the ankle's 15 over the floor) scaled to the robot's (~29 + 28, ankle ~6) */
const LEG_K = 0.42;
const LEG_SPREAD = 11;
const LEG_W: [number, number, number] = [18, 16.5, 15];
/** the rig's arms (58 + 55) scaled to the robot's (~34 + 32) about its shoulder */
const ARM_K = 0.585;
const ARM_W: [number, number, number] = [15.5, 14, 13];
/** the grip point (mitten centre) past the wrist along the forearm */
const HAND_OFF = 8.5;
/** the torso barrel, torso-local (the hips at (0, 0), up -y): bottom +11, top -86; half width / depth / corner */
const TOR = { bot: 11, top: -90, w: 41, d: 34, rc: 25, sh: 68, shX: 33 };
const NECK = 3;
/** the head box: half width, depth, height, the top-view corner, the top / bottom corner radii (screen) */
const HEAD = { w: 49, d: 40, h: 41.5, rc: 23, rTop: 21, rBot: 17 };
/** the face screen on the front: half width / height, corner radius, its centre below the head's centre */
const SCR = { w: 37, h: 25, r: 12, y: 2 };
/** seated: the barrel's bottom sits on the seat (the hips SEAT_UP over it), a little forward on the chair */
const SEAT_UP = 11;
const SIT_FWD = 7;

// ===================================================================================================================
// THE POSE
// ===================================================================================================================
export type BotPose = CovidPose & {
  /** a pencil in a mitten: which hand (L = the near hand facing right), the tip's direction (deg), its opacity */
  pencil?: { hand: "L" | "R"; ang: number; op?: number };
  /** 0..1 switched on (default 1). 0 = off: the screen dark, no eyes, the head bowed; see BOT_POSES.bootUp */
  boot?: number;
};
/** the Genius's pose type: the robot takes it unchanged */
export type GeniusPose = BotPose;

const KIND = "officer" as const;
const VAR = 3;

/** the robot's skeleton for a pose (figure-local robot units) */
export const botRig = (q0: BotPose) => {
  const boot = c01(q0.boot ?? 1);
  const down = 1 - sst(0.25, 0.85, boot);
  const qb: BotPose = down > 0.0005 ? { ...q0, pitch: q0.pitch + 20 * down, crouch: q0.crouch + 3 * down } : q0;
  const { q, r } = covidRig(KIND, VAR, qb);
  const c = r.c;
  const s = r.s;
  const sit = c01(qb.sit ?? 0);
  const seatH = qb.seatH ?? 82;
  const G = s >= 0 ? 1 : -1;
  const hip: P2 = [r.hip[0] * LEG_K + sit * G * SIT_FWD * Math.abs(s), mix(r.hip[1] * LEG_K, -(seatH + SEAT_UP), sit)];
  const leg = (lr: (typeof r)["legL"]) => {
    const H: P2 = [hip[0] + (lr.H[0] - r.hip[0]) * LEG_K + lr.sgn * LEG_SPREAD * c, hip[1] + (lr.H[1] - r.hip[1]) * LEG_K];
    const K = add(H, mul(sub(lr.K, lr.H), LEG_K));
    const A = add(K, mul(sub(lr.A, lr.K), LEG_K));
    return { H, K, A, sgn: lr.sgn, lift: lr.lift, z: lr.z };
  };
  const toFig = (p: P2): P2 => add(hip, rot(p, q.lean));
  const neck = toFig([0, TOR.top]);
  const arm = (ar: (typeof r)["armL"]) => {
    const S = toFig([ar.sgn * TOR.shX * c, -TOR.sh]);
    const E = add(S, mul(sub(ar.E, ar.S), ARM_K));
    const W = add(S, mul(sub(ar.W, ar.S), ARM_K));
    const grip = add(W, mul(ar.dir, HAND_OFF));
    return { S, E, W, dir: ar.dir, fist: ar.fist, sgn: ar.sgn, z: ar.z, grip };
  };
  const headAngle = r.headAngle;
  const headC0 = add(neck, rot([0, -(NECK + HEAD.h)], q.lean * 0.4 + (headAngle - q.lean * 0.5) * 0.5));
  // switched off: the head sunk onto the neck and tipped to one side (the pitch above bows it in profile)
  const headC = add(headC0, [down * 3, down * 7]);
  return {
    q,
    c,
    s,
    G,
    sit,
    hip,
    toFig,
    neck,
    headC,
    roll: headAngle + 11 * down,
    yaw: q.yaw,
    headYaw: q.headYaw,
    pitch: q.pitch,
    boot,
    armL: arm(r.armL),
    armR: arm(r.armR),
    legL: leg(r.legL),
    legR: leg(r.legR),
  };
};
export type BotRig = ReturnType<typeof botRig>;

/** the pose with its arms solved so the MITTENS (grip points) land on figure-local robot points (L / R); the result is
 *  a plain CovidPose (the rig's wrist targets set), so lerpPose / breathe keep the hands where they were solved */
export const botGripTo = (pose: BotPose, grip: { L?: P2; R?: P2 }): BotPose => {
  let q: BotPose = pose;
  for (let it = 0; it < 5; it++) {
    const { r } = covidRig(KIND, VAR, q);
    const b = botRig(q);
    const solve = (T: P2 | undefined, rr: (typeof r)["armL"], br: BotRig["armL"], ap: CovidPose["armL"]) => {
      if (!T) return ap;
      const Wt = sub(T, mul(br.dir, HAND_OFF));
      return { ...ap, w: add(rr.S, mul(sub(Wt, br.S), 1 / ARM_K)) };
    };
    q = { ...q, armL: solve(grip.L, r.armL, b.armL, q.armL), armR: solve(grip.R, r.armR, b.armR, q.armR) };
  }
  return q;
};

// ===================================================================================================================
// SHAPE HELPERS (robot units in; closedD / tubeD give folk units, as the paint expects)
// ===================================================================================================================
const rrPts = (c: P2, hw: number, hh: number, rTop: number, rBot = rTop, nc = 6): P2[] => {
  const w = Math.max(0.4, hw);
  const rt = Math.max(0.2, Math.min(rTop, w, hh));
  const rb = Math.max(0.2, Math.min(rBot, w, hh));
  const out: P2[] = [];
  const corner = (cx: number, cy: number, r: number, a0: number) => {
    for (let i = 0; i <= nc; i++) {
      const a = (a0 + (90 * i) / nc) * D2R;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  // clockwise in screen (y down): bottom-right, bottom-left, top-left, top-right
  corner(c[0] + w - rb, c[1] + hh - rb, rb, 0);
  corner(c[0] - w + rb, c[1] + hh - rb, rb, 90);
  corner(c[0] - w + rt, c[1] - hh + rt, rt, 180);
  corner(c[0] + w - rt, c[1] - hh + rt, rt, 270);
  return out;
};
const polyD = (pts: P2[]) => closedD(pts, 0.35);
const arcPts = (c: P2, rx: number, ry: number, a0: number, a1: number, n = 9): P2[] => Array.from({ length: n }, (_, i) => {
  const a = mix(a0, a1, i / (n - 1)) * D2R;
  return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)] as P2;
});

// ===================================================================================================================
// THE PENCIL (as the Genius's)
// ===================================================================================================================
export const PENCIL_TIP = 30;
const PENCIL_BACK = 14;
const PENCIL = { body: "#F3EBDD", wood: "#E6C9A0", lead: "#3A2D25", end: "#C9BEA5" };
const pencilShapes = (grip: P2, ang: number, op = 1): CShape[] => {
  const d: P2 = [Math.cos(ang * D2R), Math.sin(ang * D2R)];
  const tip = add(grip, mul(d, PENCIL_TIP));
  const cone = add(grip, mul(d, PENCIL_TIP - 6.5));
  const back = add(grip, mul(d, -PENCIL_BACK));
  const n: P2 = [-d[1], d[0]];
  const w = 2.3;
  return [
    { d: closedD([add(back, mul(n, w)), add(cone, mul(n, w)), add(cone, mul(n, -w)), add(back, mul(n, -w))], 0.2), fill: PENCIL.body, sh: 0.4, op },
    { d: closedD([add(back, mul(n, w * 1.05)), add(add(back, mul(d, 3.5)), mul(n, w * 1.05)), add(add(back, mul(d, 3.5)), mul(n, -w * 1.05)), add(back, mul(n, -w * 1.05))], 0.2), fill: PENCIL.end, sh: 0, op },
    { d: closedD([add(cone, mul(n, w)), tip, add(cone, mul(n, -w))], 0.15), fill: PENCIL.wood, sh: 0, op },
    { d: closedD([add(add(tip, mul(d, -2.4)), mul(n, 0.9)), tip, add(add(tip, mul(d, -2.4)), mul(n, -0.9))], 0.15), fill: PENCIL.lead, sh: 0, op },
  ];
};

// ===================================================================================================================
// THE BUILD
// ===================================================================================================================
export type BotAnchors = {
  headC: P2;
  headR: number;
  headTop: P2;
  mouth: P2;
  mouthDir: P2;
  eyes: [P2, P2];
  lungL: P2;
  lungR: P2;
  chest: P2;
  shoulderL: P2;
  shoulderR: P2;
  wristL: P2;
  wristR: P2;
  handL: P2;
  handR: P2;
  mittenL: P2;
  mittenR: P2;
  hip: P2;
  kneeL: P2;
  kneeR: P2;
  ankleL: P2;
  ankleR: P2;
  toeL: P2;
  toeR: P2;
  heelL: P2;
  heelR: P2;
  hemL: P2;
  hemR: P2;
  /** the pencil's tip when the pose holds one, else the near mitten */
  pencilTip: P2;
  /** the antenna bulb (the head top when the variant has none) and the face screen's centre */
  antennaTip: P2;
  screen: P2;
};
export type GeniusAnchors = BotAnchors;
export type BotBuild = { shapes: CShape[]; anchors: BotAnchors; heightUnits: number };
export type BotBuildOpts = { frame?: number; drain?: number };
const DEAD = "#8A7B62";

/** build a robot (figure-local: feet at (0, 0); shape paths in FOLK units as covidFolk's) */
export const buildBot = (variant: number, pose: BotPose, o: BotBuildOpts = {}): BotBuild => {
  const lk = lookOfV(variant);
  const R = botRig(pose);
  const { c, s, G, q } = R;
  const frame = o.frame ?? 0;
  const out: CShape[] = [];
  const boot = R.boot;
  const lit = sst(0.35, 0.55, boot);

  // ---- legs (far first) and feet ---------------------------------------------------------------------------------
  const legs = [R.legL, R.legR].sort((a, b) => a.z - b.z);
  const feet: Record<string, { toe: P2; heel: P2 }> = {};
  const legShapes = (lg: BotRig["legL"]) => {
    const sh: CShape[] = [];
    sh.push({ d: tubeD([lg.H, lg.K, lg.A], LEG_W), fill: ACCENT, sh: 0.6 });
    // the foot: a rounded bun forward of the ankle (its length shows as the leg turns), pitched by the rig's lift
    const as = Math.abs(s);
    const half = 10.5 * Math.abs(c) + 16 * as;
    const fwd = G * 6 * as;
    const lift = lg.lift * 0.55;
    const piv = lg.A;
    const fp = (p: P2): P2 => add(piv, rot(sub(p, piv), lift));
    const cx = lg.A[0] + fwd;
    const top = lg.A[1] - 6;
    const bot = lg.A[1] + 7.5;
    const foot = rrPts([cx, (top + bot) / 2], half, (bot - top) / 2, 8, 4.5).map(fp);
    sh.push({ d: polyD(foot), fill: FOOT, sh: 0.5 });
    const sole = rrPts([cx, bot - 1.6], half - 0.5, 1.8, 1.5, 1.5, 3).map(fp);
    sh.push({ d: polyD(sole), fill: SOLE, sh: 0, op: 0.9 });
    const key = lg.sgn < 0 ? "L" : "R";
    // the toe / heel anchors slide continuously through the front and back views (no jump where the facing flips)
    const gs = s / (Math.abs(s) + 0.12);
    feet[key] = { toe: fp([cx + gs * half, bot]), heel: fp([cx - gs * half, bot]) };
    return sh;
  };

  // ---- arms -------------------------------------------------------------------------------------------------------
  const armShapes = (a: BotRig["armL"], withShoulder: boolean) => {
    const sh: CShape[] = [];
    sh.push({ d: tubeD([a.S, a.E, a.W], ARM_W), fill: ACCENT, sh: 0.55 });
    if (withShoulder) sh.push({ d: closedD(ellPts(a.S, 10.5, 10, 0, 14), 0.9), fill: BOT_JOINT, sh: 0.4 });
    // the wrist cuff and the mitten (a rounded paddle, a little wider at the end; rounder as a fist)
    const d = a.dir;
    const ang = Math.atan2(d[1], d[0]) / D2R;
    const f = c01(a.fist);
    const mc = add(a.W, mul(d, HAND_OFF));
    sh.push({ d: closedD(ellPts(add(a.W, mul(d, 0.5)), 4.2, 7.6, ang, 12), 0.9), fill: BOT_JOINT, sh: 0, op: 0.95 });
    sh.push({ d: closedD(ellPts(mc, mix(10.8, 9, f), mix(8.6, 9, f), ang, 16), 0.9), fill: BOT_SKIN, sh: 0.45 });
    return sh;
  };
  // near / far: an arm with z < 0 is behind the barrel; the in-front copy fades over |s| 0.06..0.36 (no pop on a turn)
  const frontOp = (z: number) => 1 - sst(0.06, 0.36, -z);

  // ---- the torso barrel (a squircle-ish bean: a little wider at the belly) -----------------------------------------
  const tw = (TOR.w - TOR.rc) * Math.abs(c) + (TOR.d - TOR.rc) * Math.abs(s) + TOR.rc;
  const tcy = (TOR.bot + TOR.top) / 2;
  const thh = (TOR.bot - TOR.top) / 2;
  const torsoPts: P2[] = Array.from({ length: 40 }, (_, i) => {
    const t = (i / 40) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const e = 2 / 3.2;
    const x = tw * Math.sign(ct) * Math.abs(ct) ** e * (1 + 0.07 * st);
    const y = tcy + thh * Math.sign(st) * Math.abs(st) ** e;
    return R.toFig([x, y]);
  });
  // ---- the front details (panel / dial / vents) foreshortened on the barrel's front --------------------------------
  const frontVis = sst(0.02, 0.3, c);
  const backVis = sst(0.05, 0.4, -c);
  const fx = TOR.d * s * 0.92;
  const fk = Math.max(0.05, Math.abs(c));
  const panelShapes: CShape[] = [];
  if (frontVis > 0.01) {
    const pc: P2 = [fx, -50];
    if (lk.panel === "plate") {
      panelShapes.push({ d: polyD(rrPts(pc, 15 * fk, 11, 5 * fk + 1, 5 * fk + 1, 4).map(R.toFig)), fill: PANEL_C, sh: 0.25, op: frontVis });
      // one status slot (a short petrol line) and a tiny light: never two dots (two dots under a smile read as a face)
      panelShapes.push({ d: polyD(rrPts([fx - 3 * fk, -53], 8.5 * fk + 0.2, 1.7, 1.5, 1.5, 3).map(R.toFig)), fill: BOT_SCREEN, sh: 0, op: frontVis * 0.85 });
      panelShapes.push({ d: polyD(rrPts([fx - 3 * fk, -46.5], 8.5 * fk + 0.2, 1.4, 1.2, 1.2, 3).map(R.toFig)), fill: PANEL_LINE, sh: 0, op: frontVis * 0.6 });
    } else if (lk.panel === "dial") {
      panelShapes.push({ d: closedD(ellPts(R.toFig(pc), 11.5 * fk + 0.4, 11.5, q.lean, 18), 0.9), fill: PANEL_C, sh: 0.25, op: frontVis });
      // a gauge: a petrol needle from the centre and a small hub (never a yellow yolk in a white ring)
      const hub = R.toFig(pc);
      const nd = R.toFig([fx + 6.5 * fk, -55.5]);
      panelShapes.push({ d: tubeD([hub, nd], [2.2, 1.6]), fill: BOT_SCREEN, sh: 0, op: frontVis * 0.9 });
      panelShapes.push({ d: closedD(ellPts(hub, 2.6 * fk + 0.3, 2.6, q.lean, 10), 0.9), fill: BOT_SCREEN, sh: 0, op: frontVis * 0.9 });
    } else {
      for (const k of [-1, 0, 1]) panelShapes.push({ d: polyD(rrPts([fx, -50 + k * 7.5], 14 * fk, 2.1, 2 * fk + 0.2, 2 * fk + 0.2, 3).map(R.toFig)), fill: PANEL_C, sh: 0, op: frontVis * 0.95 });
    }
    // a soft seam line round the barrel (the lid of the belly), a darker orange
    const seam: P2[] = Array.from({ length: 13 }, (_, i) => {
      const ph = mix(-Math.PI / 2, Math.PI / 2, i / 12);
      const x = TOR.w * 0.98 * Math.sin(ph) * c + TOR.d * Math.cos(ph) * s;
      return R.toFig([x, -24 + 1.5 * Math.cos(ph) * c]);
    });
    panelShapes.push({ d: tubeD(seam, seam.map(() => 1.5)), fill: mixC(ACCENT, ORANGE_SHADE, 0.45), sh: 0, op: 0.55 * frontVis });
  }
  if (backVis > 0.01) {
    const bx = -TOR.d * s * 0.92;
    for (const k of [-1, 1]) panelShapes.push({ d: polyD(rrPts([bx, -52 + k * 7], 12 * fk, 2, 2, 2, 3).map(R.toFig)), fill: mixC(ACCENT, ORANGE_SHADE, 0.5), sh: 0, op: backVis * 0.8 });
  }

  // ---- the neck -----------------------------------------------------------------------------------------------------
  const neckTop = add(R.headC, rot([0, HEAD.h - 3], R.roll));
  const neckShapes: CShape[] = [{ d: tubeD([add(R.neck, rot([0, 6], q.lean)), neckTop], [22, 20]), fill: BOT_JOINT, sh: 0.4 }];
  {
    const m = mix2(R.neck, neckTop, 0.45);
    const nn = rot([1, 0], R.roll);
    neckShapes.push({ d: tubeD([add(m, mul(nn, -10)), add(m, mul(nn, 10))], [1.4, 1.4]), fill: mixC(BOT_JOINT, ORANGE_SHADE, 0.35), sh: 0, op: 0.6 });
  }

  // ---- the head box ---------------------------------------------------------------------------------------------------
  const hy = R.headYaw;
  const hc = Math.cos(hy);
  const hs = Math.sin(hy);
  const pitch = R.pitch * hc;
  const H: (u: P2) => P2 = (u) => add(R.headC, rot(u, R.roll));
  const hw = (HEAD.w - HEAD.rc) * Math.abs(hc) + (HEAD.d - HEAD.rc) * Math.abs(hs) + HEAD.rc;
  const headPts = rrPts([0, 0], hw, HEAD.h, HEAD.rTop, HEAD.rBot, 7).map(H);
  const headD = polyD(headPts);
  const headShapes: CShape[] = [{ d: headD, fill: ACCENT, sh: 0.7 }];
  // the side plane (the box's side facing us), front AND back views: the visible side is the one whose outward normal
  // turns toward us (sg = -sign(hs)); lit when it lies on the screen-left (faces the light), shaded on the right
  {
    const vis = sst(0.04, 0.3, Math.abs(hs));
    if (vis > 0.01) {
      const sg = hs >= 0 ? -1 : 1;
      const xs = sg * HEAD.w * hc;
      const side = Math.sign(xs) || -sg;
      const inner = xs - side * HEAD.d * Math.abs(hs) * 0.92;
      const outer = side * (hw + 6);
      const x0 = Math.min(inner, outer);
      const x1 = Math.max(inner, outer);
      const lit = side < 0;
      const pts: P2[] = [[x0, -HEAD.h - 6], [x1, -HEAD.h - 6], [x1, HEAD.h + 6], [x0, HEAD.h + 6]].map((p) => H(p as P2));
      headShapes.push({ d: closedD(pts, 0.1), fill: lit ? mixC(ACCENT, "#FFE6A8", 0.28) : mixC(ACCENT, ORANGE_SHADE, 0.3), blur: 3.2, clip: headD, op: 0.75 * vis, sh: 0 } as CShape);
    }
  }
  // ears: a stub always behind the head, the outer disc in front when it faces us
  const earBack: CShape[] = [];
  const earFront: CShape[] = [];
  if (lk.ears) {
    for (const sg of [-1, 1]) {
      const depth = -sg * hs; // > 0 toward us
      const cx = sg * hc * (HEAD.w + 3);
      const stub = rrPts([cx + sg * Math.sign(hc || 1) * 2, 3], 4 + 3 * Math.abs(hc), 11.5, 4, 4, 3).map(H);
      earBack.push({ d: polyD(stub), fill: mixC(BOT_JOINT, ORANGE_SHADE, 0.15), sh: 0.3 });
      const op = sst(0.02, 0.25, depth);
      if (op > 0.01) {
        const rx = 2.5 + 9.5 * Math.abs(hs);
        earFront.push({ d: closedD(ellPts(H([sg * hc * (HEAD.w + 4), 3]), rx, 11.5, 0, 16), 0.9), fill: BOT_JOINT, sh: 0.35, op });
        earFront.push({ d: closedD(ellPts(H([sg * hc * (HEAD.w + 4), 3]), rx * 0.45, 5, 0, 12), 0.9), fill: mixC(BOT_JOINT, ORANGE_SHADE, 0.25), sh: 0, op: op * 0.9 });
      }
    }
  }
  // the face screen on the front (it slides across and foreshortens as the head turns; nods move it down)
  const scrVis = sst(0.0, 0.22, hc);
  const sx = HEAD.d * hs * 0.93;
  const sk = Math.max(0.02, hc);
  const sy = SCR.y + 6 * Math.sin(pitch * D2R) * 1.2;
  const faceShapes: CShape[] = [];
  const eyes: [P2, P2] = [H([sx - 14 * sk, sy - 3]), H([sx + 14 * sk, sy - 3])];
  let mouthP: P2 = H([sx, sy + 11]);
  if (scrVis > 0.01) {
    const scrPts = rrPts([sx, sy], SCR.w * sk, SCR.h, SCR.r * Math.min(1, sk * 1.4) + 1, SCR.r * Math.min(1, sk * 1.4) + 1, 6).map(H);
    faceShapes.push({ d: polyD(scrPts), fill: mixC(BOT_SCREEN_OFF, BOT_SCREEN, lit), sh: 0, op: scrVis });
    // the glass: a faint cream sheen in its upper-left corner
    const gl = [...arcPts([sx - SCR.w * sk * 0.55, sy - SCR.h * 0.45], SCR.w * sk * 0.32, SCR.h * 0.28, 185, 265, 7)];
    faceShapes.push({ d: tubeD(gl.map(H), gl.map(() => 2.4)), fill: BOT_EYE, sh: 0, op: 0.22 * scrVis });
    // the eyes: cream dots, blink (lids), the happy squint (laugh) as two little arcs; boot: off -> on
    const look = pose.look ?? [0, 0];
    const blink = c01(q.lids);
    const laugh = sst(0.25, 0.7, c01(pose.laugh ?? 0));
    // boot: the eyes open from a line (0.42..0.6) and blink once (0.72..0.84)
    const bootLid = boot >= 1 ? 0 : 1 - sst(0.42, 0.6, boot) + Math.sin(Math.PI * sst(0.68, 0.88, boot)) ** 2;
    const lid = c01(Math.max(blink, c01(bootLid)));
    const eyeOn = lit;
    const er = 6.4;
    const glowOp = 0.32 * eyeOn * scrVis * (1 - laugh);
    for (const k of [-1, 1]) {
      const ec: P2 = [sx + (k * 14 + look[0] * 3) * sk, sy - 3 + look[1] * 2.5];
      const rx = er * mix(0.45, 1, sk);
      const ry = Math.max(0.9, er * (1 - lid * 0.86));
      if (glowOp > 0.01) faceShapes.push({ d: closedD(ellPts(H(ec), rx * 1.9, ry * 1.6 + 2, R.roll, 14), 0.9), fill: BOT_EYE, blur: 3.2, glow: true, sh: 0, op: glowOp * (1 - lid) });
      const dotOp = eyeOn * scrVis * (1 - laugh);
      if (dotOp > 0.01) faceShapes.push({ d: closedD(ellPts(H(ec), rx, ry, R.roll, 16), 0.9), fill: BOT_EYE, sh: 0, glow: true, op: dotOp });
      if (laugh > 0.01) {
        const ap = arcPts([ec[0], ec[1] + 3], rx * 1.1, er * 0.95, 200, 340, 9).map(H);
        faceShapes.push({ d: tubeD(ap, ap.map((_, i) => (i === 0 || i === ap.length - 1 ? 2.6 : 3.6))), fill: BOT_EYE, sh: 0, glow: true, op: laugh * eyeOn * scrVis });
      }
    }
    // the smile: a tiny cream line (mouth > 0 curves it up); talk (open) / laugh open it into a small D
    const sm = c01(q.mouth ?? 0);
    const open = Math.max(c01(pose.open ?? 0), 0.85 * c01(pose.laugh ?? 0));
    const mOn = eyeOn * sst(0.8, 1, boot === 1 ? 1 : boot);
    const mc: P2 = [sx, sy + 11];
    mouthP = H(mc);
    if (mOn > 0.01) {
      const mw = 7.5 * mix(0.5, 1, sk);
      const curve = 1.2 + 9 * sm;
      const pts: P2[] = Array.from({ length: 9 }, (_, i) => {
        const u = i / 8;
        return [mc[0] - mw + 2 * mw * u, mc[1] + curve * 0.35 * Math.sin(Math.PI * u) - curve * 0.12];
      });
      if (open > 0.03) {
        const lower = pts.map((p, i) => [p[0], p[1] + open * 6 * Math.sin(Math.PI * (i / 8))] as P2).reverse();
        faceShapes.push({ d: closedD([...pts, ...lower].map(H), 0.6), fill: BOT_EYE, sh: 0, glow: true, op: mOn * scrVis });
      } else faceShapes.push({ d: tubeD(pts.map(H), pts.map((_, i) => (i === 0 || i === 8 ? 1.8 : 2.6))), fill: BOT_EYE, sh: 0, glow: true, op: mOn * scrVis * 0.95 });
    }
  }
  // the back of the head: two small vents when it is turned away
  const hBack = sst(0.1, 0.45, -hc);
  if (hBack > 0.01) {
    const bx = -HEAD.d * hs * 0.9;
    for (const k of [-1, 1]) faceShapes.push({ d: polyD(rrPts([bx, 2 + k * 8], 18 * Math.max(0.05, -hc), 2.2, 2, 2, 3).map(H)), fill: mixC(ACCENT, ORANGE_SHADE, 0.5), sh: 0, op: hBack * 0.85 });
  }
  // the antenna: a short stalk off the crown (on the yaw axis, so it never slides) and a cream bulb
  const antShapes: CShape[] = [];
  const topP = H([0, -HEAD.h + 1]);
  let antTip = H([0, -HEAD.h]);
  if (lk.antenna) {
    const wob = (o.frame !== undefined ? 2.2 * Math.sin(frame * 0.19 + variant) : 0) - 0.35 * (q.lean + q.roll);
    const a0 = H([0, -HEAD.h + 2]);
    const a1 = add(H([0, -HEAD.h - 9]), rot([0, -0], 0));
    const tip = add(a1, rot([0, -12], R.roll + wob));
    antTip = add(tip, rot([0, -5], R.roll + wob));
    antShapes.push({ d: closedD(ellPts(add(topP, rot([0, -1], R.roll)), 7.5, 3.6, R.roll, 12), 0.9), fill: BOT_JOINT, sh: 0.3 });
    antShapes.push({ d: tubeD([a0, a1, tip], [4.2, 3.6, 3.2]), fill: STALK, sh: 0.3 });
    const bulbOn = sst(0.15, 0.35, boot);
    antShapes.push({ d: closedD(ellPts(antTip, 6.2, 6.2, 0, 14), 0.9), fill: mixC("#9C9078", BOT_EYE, bulbOn), sh: 0.25 });
    if (bulbOn > 0.01) antShapes.push({ d: closedD(ellPts(antTip, 11, 11, 0, 14), 0.9), fill: BOT_EYE, blur: 4, glow: true, sh: 0, op: 0.3 * bulbOn });
  }

  // ---- assemble in painter's order ---------------------------------------------------------------------------------
  const arms = [R.armL, R.armR];
  // behind the barrel: every arm (the in-front copy covers it when it is the near one)
  for (const lg of legs) out.push(...legShapes(lg));
  for (const a of [...arms].sort((x, y) => x.z - y.z)) out.push(...armShapes(a, false));
  out.push({ d: polyD(torsoPts), fill: ACCENT, sh: 0.75 });
  out.push(...panelShapes);
  out.push(...neckShapes);
  out.push(...earBack);
  out.push(...headShapes);
  out.push(...faceShapes);
  out.push(...earFront);
  out.push(...antShapes);
  for (const a of [...arms].sort((x, y) => x.z - y.z)) {
    const op = frontOp(a.z);
    if (op <= 0.003) continue;
    for (const sh of armShapes(a, true)) out.push({ ...sh, op: (sh.op ?? 1) * op });
  }
  let pencilTip: P2 = R.armL.grip;
  if (pose.pencil) {
    const grip = pose.pencil.hand === "L" ? R.armL.grip : R.armR.grip;
    const ang = pose.pencil.ang;
    pencilTip = add(grip, mul([Math.cos(ang * D2R), Math.sin(ang * D2R)], PENCIL_TIP));
    out.push(...pencilShapes(grip, ang, pose.pencil.op ?? 1));
  }
  const drain = c01(o.drain ?? 0);
  const shapes = drain > 0 ? out.map((sh) => ({ ...sh, fill: mixC(sh.fill, sh.fill === BOT_EYE ? "#5A5246" : DEAD, drain) })) : out;

  // ---- anchors ------------------------------------------------------------------------------------------------------
  const chest = R.toFig([TOR.d * s * 0.6, -52]);
  const headTop = H([0, -HEAD.h]);
  const anchors: BotAnchors = {
    headC: R.headC,
    headR: HEAD.h,
    headTop,
    mouth: mouthP,
    mouthDir: norm(rot([G * Math.abs(hs) + 0.0001, 0.25], R.roll)),
    eyes,
    lungL: R.toFig([-14 * c, -50]),
    lungR: R.toFig([14 * c, -50]),
    chest,
    shoulderL: R.armL.S,
    shoulderR: R.armR.S,
    wristL: R.armL.W,
    wristR: R.armR.W,
    handL: R.armL.grip,
    handR: R.armR.grip,
    mittenL: R.armL.grip,
    mittenR: R.armR.grip,
    hip: R.hip,
    kneeL: R.legL.K,
    kneeR: R.legR.K,
    ankleL: R.legL.A,
    ankleR: R.legR.A,
    toeL: feet.L.toe,
    toeR: feet.R.toe,
    heelL: feet.L.heel,
    heelR: feet.R.heel,
    hemL: R.toFig([-tw * 0.85, TOR.bot - 2]),
    hemR: R.toFig([tw * 0.85, TOR.bot - 2]),
    pencilTip,
    antennaTip: antTip,
    screen: H([sx, sy]),
  };
  return { shapes, anchors, heightUnits: -Math.min(headTop[1], antTip[1] - 6) };
};

/** the anchors of a pose in figure-local robot units (no paint) */
export const botAnchorsLocal = (variant: number, pose: BotPose): BotAnchors => buildBot(variant, pose).anchors;

// ===================================================================================================================
// POSES (pure, frame-driven, seek-safe; dir 1 = facing screen right; at 23.976 fps): the Genius's names and timings
// ===================================================================================================================
export const BOT_FPS = 24000 / 1001;
const covidClock = (frame: number) => (frame * (30000 / 1001)) / BOT_FPS;
const SMILE = 0.22;
const face = (q: BotPose, dir: 1 | -1): BotPose => (dir === 1 ? q : { ...mirrorPose(q), pencil: q.pencil ? { ...q.pencil, hand: q.pencil.hand === "L" ? "R" : "L", ang: 180 - q.pencil.ang } : undefined, boot: q.boot });
/** an idle blink every ~4 s (5 frames), seeded so a crowd never blinks together */
export const botBlink = (frame: number, seed = 0) => {
  const P = 89 + (Math.abs(Math.round(seed * 7)) % 5) * 11;
  const u = (((frame + seed * 37) % P) + P) % P;
  return u < 5 ? Math.sin((Math.PI * u) / 5) ** 0.7 : 0;
};
const withBlink = (q: BotPose, frame: number, seed: number): BotPose => ({ ...q, lids: Math.max(q.lids, botBlink(frame, seed)) });

/** frames per walk cycle (two steps), as the Genius's; the feet advance LEG_K as far per frame (short legs) */
export const BOT_WALK_CYCLE = 24;
export const botWalkAdvance = (scale: number) => (2 * 44 * LEG_K * scale) / BOT_WALK_CYCLE;
export const STEP_OUT_FRAMES = 44;

/** typeAtDesk: the seat and the keyboard, units from `at` (= the floor under the hips), facing right (mirror x when
 *  facing left). seatH = the seat top (as the Genius's, the hall chair is 82), deskH = the desk top, keys = the two
 *  MITTEN points on the keys (near hand first; they land there exactly), the dangling feet's lowest point, the barrel's
 *  front and back at the seat, the eyes. */
export const BOT_DESK = {
  seatH: 84,
  deskH: 132,
  keys: [
    [58, -138],
    [64, -141],
  ] as P2[],
  /** the knees at x ~26..41, y ~-92; the dangling feet's soles at y ~-57 (toes x ~45..62, under the desk): the desk
   *  apron must stay above y -100 and the desk's front edge at x >= 52 (the barrel's front reaches x ~50) */
  kneeX: 41,
  seat: { x0: -26, x1: 24 },
  chairBackX: -38,
};
/** writeTick: the tick on a sheet in the screen plane in front of it (facing right; mirror x when facing left), units
 *  from `at`: the stroke's start, corner, end (at its chest, within its short reach) */
export const BOT_TICK = { p0: [54, -128] as P2, p1: [60, -118] as P2, p2: [78, -141] as P2 };

const solve = (q: BotPose, grip: { L?: P2; R?: P2 }): BotPose => ({ ...botGripTo(q, grip), pencil: q.pencil, boot: q.boot });
const G = GENIUS_POSES;

export const BOT_POSES = {
  /** standing three-quarter facing dir, a slow idle bob and a blink every ~4 s */
  stand: (dir: 1 | -1 = 1, frame = 0, seed = 0): BotPose => withBlink(G.stand(dir, frame, seed), frame, seed),
  /** standing facing us */
  front: (frame = 0, seed = 0): BotPose => withBlink(G.front(frame, seed), frame, seed),
  /** standing at any yaw (0 front .. +-0.62 three-quarter .. +-1.3 profile .. PI back) */
  turnTo: (yaw: number, frame = 0, seed = 0): BotPose => withBlink(G.turnTo(yaw, frame, seed), frame, seed),
  /** the walk with planted feet (BOT_WALK_CYCLE frames per two steps); move `at` by botWalkAdvance(scale) px per frame */
  walk: (dir: 1 | -1 = 1, frame = 0, amount = 1): BotPose => G.walk(dir, frame, amount),
  /** stepping out sideways in dir: t 0..1 over STEP_OUT_FRAMES; move `at` by stepOutShift(dir, t) * scale */
  stepOut: (dir: 1 | -1 = 1, t = 0): BotPose => G.stepOut(dir, t),
  /** seated at a desk facing dir, the mittens on the keys (BOT_DESK.keys) tapping in bursts. `at` = the floor under
   *  the hips. */
  typeAtDesk: (dir: 1 | -1 = 1, frame = 0, seed = 0): BotPose => {
    const base: BotPose = { ...POSES.sit(1, BOT_DESK.seatH), yaw: 1.12, lean: 9, pitch: 3, headYaw: 0.9, mouth: SMILE * 0.8 };
    const b = breathe(base, covidClock(frame), 0.6, seed) as BotPose;
    const tap = (k: number, ph: number) => {
      const burst = sst(0.25, 0.45, 0.5 + 0.5 * Math.sin(frame * 0.09 + seed * 2 + k * 0.7));
      return Math.max(0, Math.sin(frame * 1.25 + ph + seed)) ** 2 * burst;
    };
    const kL = add(BOT_DESK.keys[0], [1.3 * Math.sin(frame * 0.21 + seed), -3 * tap(0, 0)]);
    const kR = add(BOT_DESK.keys[1], [1.3 * Math.sin(frame * 0.17 + 1 + seed), -3 * tap(1, 2.1)]);
    const q = solve(b, { L: kL, R: kR });
    const typed: BotPose = { ...q, armL: { ...q.armL, fist: 0.2, hand: 14 }, armR: { ...q.armR, fist: 0.2, hand: 14 }, look: [0.35, 0.05], lids: Math.max(q.lids, botBlink(frame, seed + 3)) };
    return face(typed, dir);
  },
  /** the pencil comes up and draws a tick on a sheet in front of it (BOT_TICK): t 0..0.3 raise, 0.3..0.44 the short
   *  stroke, 0.44..0.72 the long stroke, 0.72..1 lowered a little + a nod. pencilTip is on the stroke while drawing. */
  writeTick: (dir: 1 | -1 = 1, t = 0, frame = 0): BotPose => {
    const u = c01(t);
    const base = breathe({ ...POSES.stand(1), mouth: SMILE, yaw: 0.85, headYaw: 0.75, pitch: 4 }, covidClock(frame), 0.6) as BotPose;
    const restQ: BotPose = { ...base, pencil: { hand: "L", ang: 80 } };
    const ang = mix(80, 22, sst(0, 0.3, u)) + (u > 0.3 ? -10 * sst(0.44, 0.72, u) : 0) + 10 * sst(0.75, 1, u);
    const dd: P2 = [Math.cos(ang * D2R), Math.sin(ang * D2R)];
    const lower = sst(0.75, 1, u);
    const tip = add(tickTip(u), [-6 * lower, 16 * lower]);
    const writing = solve({ ...base, pencil: { hand: "L", ang } }, { L: sub(tip, mul(dd, PENCIL_TIP)) });
    const raise = sst(0, 0.3, u);
    let q = raise >= 0.999 ? writing : (lerpPose(restQ, writing, raise) as BotPose);
    q = { ...q, pencil: { hand: "L", ang }, look: [0.6, 0.3], mouth: SMILE + 0.15 * sst(0.72, 0.9, u), pitch: q.pitch + 5 * Math.sin(Math.PI * sst(0.74, 0.98, u)) ** 2 };
    return face(q, dir);
  },
  /** a small happy cheer: both arms up in a V, a bounce (an 18-frame loop), the happy squint. Ramp amount 0 -> 1 over
   *  14+ frames; yaw 0 = facing us */
  cheer: (frame = 0, amount = 1, yaw = 0): BotPose => {
    const q = G.cheer(frame, amount, yaw);
    const a = ease(c01(amount));
    if (a < 0.0005) return q;
    // the robot's own V: its head is wide and its arms short, so the Genius's near-vertical V would land the mittens
    // on its head. Each mitten swings out on an arc round its shoulder (down -> arms wide -> up and OUT at ~45 deg)
    const r = botRig(q);
    const ph = (frame / 18) * 2 * Math.PI;
    const tgt = (ar: BotRig["armL"]): P2 => {
      const left = ar.sgn < 0;
      const th = (mix(left ? 100 : 80, left ? 226 : -46, a) + (left ? -1 : 1) * 5 * Math.sin(ph) * a) * D2R;
      const R = mix(62, 71 + 2.5 * Math.sin(ph), a);
      return add(ar.S, [R * Math.cos(th), R * Math.sin(th)]);
    };
    return solve(q, { L: tgt(r.armL), R: tgt(r.armR) });
  },
  /** switching on: t 0..1 (~16 frames). Off (dark screen, head bowed, bulb dim) -> the bulb lights (0.15..0.35), the
   *  eyes open from a line (0.42..0.6), the head lifts (0.25..0.85), one blink (0.68..0.88), the smile (0.8..1).
   *  yaw: the standing yaw (0 front, 0.62 three-quarter right...). Over any other pose: { ...pose, boot: t }. */
  bootUp: (t = 1, yaw = 0, frame = 0): BotPose => ({ ...(yaw === 0 ? G.front(frame) : G.turnTo(yaw, frame)), boot: c01(t) }),
};
/** BOT_POSES.bootUp's length in frames (a guide; any length works, t is 0..1) */
export const BOOT_FRAMES = 16;

// ---- stepOut: the planted-foot shift, integrated from the ROBOT's own ankles ---------------------------------------------
const stepOutPhase = (u: number) => {
  const w = c01(u / 0.8);
  return 0.05 + 1.5 * w;
};
const anklesX = (dir: 1 | -1, u: number): [number, number] => {
  const r = botRig(BOT_POSES.stepOut(dir, u));
  return [r.legL.A[0], r.legR.A[0]];
};
/** units to add to `at`'s x at stepOut t so the planted foot stays put (signed: includes dir) */
export const stepOutShift = (dir: 1 | -1, t: number, samples = 90) => {
  const u1 = c01(t);
  let s = 0;
  const N = Math.max(1, Math.ceil(samples * u1));
  let prev = anklesX(dir, 0);
  for (let i = 0; i < N; i++) {
    const a = (u1 * i) / N;
    const b = (u1 * (i + 1)) / N;
    const cur = anklesX(dir, b);
    const lA = frac(stepOutPhase(a)) < 0.5;
    const lB = frac(stepOutPhase(b)) < 0.5;
    if (lA === lB) s -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
    prev = cur;
  }
  return s;
};
export const botStepOutShift = stepOutShift;

// ---- writeTick: the tip along the stroke ----------------------------------------------------------------------------
const tickTip = (u: number): P2 => {
  const { p0, p1, p2 } = BOT_TICK;
  if (u <= 0.3) return p0;
  if (u <= 0.44) return mix2(p0, p1, ease((u - 0.3) / 0.14));
  if (u <= 0.72) return mix2(p1, p2, ease((u - 0.44) / 0.28));
  return p2;
};
/** the drawn part of the tick at writeTick t, figure-local units (facing right; mirrored for dir -1): a polyline */
export const tickDrawn = (dir: 1 | -1, t: number): P2[] => {
  const u = c01(t);
  const { p0, p1 } = BOT_TICK;
  if (u <= 0.3) return [];
  const pts: P2[] = [p0];
  if (u < 0.44) pts.push(tickTip(u));
  else {
    pts.push(p1);
    if (u > 0.44) pts.push(tickTip(u));
  }
  return pts.map((p) => [p[0] * dir, p[1]] as P2);
};
export const botTickDrawn = tickDrawn;

/** the seated hips' height over the floor (units) for typeAtDesk */
export const BOT_HIP_SEATED = BOT_DESK.seatH + SEAT_UP;
export { vlen };
