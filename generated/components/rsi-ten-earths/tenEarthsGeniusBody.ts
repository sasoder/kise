// ---------------------------------------------------------------------------
// tenEarthsGeniusBody — the GEOMETRY and POSES of THE GENIUS (rsi-ten-earths): one AI drawn as a person in the house
// orange. Pure functions (no React). The API is the header of tenEarthsGenius.tsx; this file is its geometry.
//
// THE BODY IS covidFolk's (imported, never edited): the officer build in shirtsleeves (kyle-covid covidFolkBody,
// kind "officer" variant 3: a man ~312 units = 1.75 m, ~4.4 heads, tidy side-parted hair, collar points, a tie, a belt)
// re-inked in the accent. On top of that build this file adds the Genius's own parts, placed on the same head sphere
// and arm rig so they turn with him: ROUND GLASSES (a frame ring + a faint lens sheen per eye and a bridge), a swept
// HAIR TUFT, a PENCIL in the near fist, and it removes the tie on the open-collar variants.
// The parts are located in covidFolk's shape list by a SENTINEL build: the same pose built a second time with marker
// colours (clothing blue, hair green, tie magenta), so the order of shapes is known without touching covidFolk.
// ---------------------------------------------------------------------------
import { add, mix, mix2, mul, rot, sub } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import {
  FU,
  HEAD_R,
  HEAD_UP,
  POSES,
  SEAT,
  breathe,
  buildCovidFolk,
  closedD,
  covidGripTo,
  covidRig,
  ellPts,
  lerpPose,
  mirrorPose,
  tubeD,
  type CShape,
  type CovidAnchors,
  type CovidInks,
  type CovidPose,
  type P2,
} from "../kyle-covid/covidFolkBody";

export type { CShape, CovidPose, P2 };
export { FU };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);
const frac = (v: number) => v - Math.floor(v);

// ===================================================================================================================
// COLOURS AND THE LOOKS
// ===================================================================================================================
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
/** the crescent shadow of the orange cloth goes toward this deep orange (not the cast's grey-teal) */
export const ORANGE_SHADE = "#A85A08";
/** the face and hands: a light warm orange-cream, so the dot eyes read */
export const GENIUS_SKIN = "#FBDCB0";
/** the build covidFolk draws (never edited): the officer in shirtsleeves */
const KIND = "officer" as const;
/** covidFolkBody's SHADE_TO (the derived tones of an ink) */
const SHADE_TO = "#2C3433";
const VAR = 3;
/** a Genius's height in rig units (soles to the top of the skull) = 1.75 m; U = 178 units per metre */
export const GENIUS_UNITS = 312;
export const U = 178;
export const geniusScaleForPx = (px: number) => px / GENIUS_UNITS;

export type GeniusLook = { name: string; glasses: boolean; tie: boolean; tuft: number; hair: string };
/** the five variants: one species, tiny differences (glasses, tie / open collar, the swept tuft, the hair's tone) */
export const GENIUS_LOOKS: GeniusLook[] = [
  { name: "v0 THE Genius: round glasses, tie", glasses: true, tie: true, tuft: 0, hair: "#8E4A0C" },
  { name: "v1 swept tuft, tie", glasses: false, tie: true, tuft: 1, hair: "#9A520E" },
  { name: "v2 glasses, open collar, tuft", glasses: true, tie: false, tuft: 1, hair: "#A35A10" },
  { name: "v3 open collar, honey hair", glasses: false, tie: false, tuft: 0, hair: "#B0661A" },
  { name: "v4 glasses, open collar, dark hair", glasses: true, tie: false, tuft: 0, hair: "#7A3E0A" },
];
export const GENIUS_VARIANTS = GENIUS_LOOKS.length;
const lookOfV = (v: number) => GENIUS_LOOKS[((Math.round(v) % GENIUS_VARIANTS) + GENIUS_VARIANTS) % GENIUS_VARIANTS];

/** the inks (covidFolk's CovidInks) of the Genius: all cloth in the accent family, the face a light orange-cream */
export const geniusInks = (v: number): Partial<CovidInks> => ({
  skin: GENIUS_SKIN,
  hair: lookOfV(v).hair,
  top: ACCENT,
  top2: "#FFC43A",
  shirt: ACCENT,
  tie: "#C7680A",
  belt: "#8F5208",
  lower: "#DE8C0A",
  tights: "#DE8C0A",
  shoe: "#7A3F0C",
  sole: "#5E300A",
  glove: "none",
  mask: "none",
});
/** the frames of the glasses and the pencil */
const FRAME_C = "#5E3008";
const LENS_C = "#FFF4DC";
const PENCIL = { body: "#F3EBDD", wood: "#E6C9A0", lead: "#3A2D25", end: "#C9BEA5" };
/** covidFolk's buckle grey, re-inked */
const BUCKLE_FROM = "#9C9488";
const BUCKLE_TO = "#B8700A";

// the sentinel inks (the second build that locates the parts): clothing blue, hair green, tie magenta
const SENT: Partial<CovidInks> = {
  skin: GENIUS_SKIN,
  hair: "#00FF00",
  top: "#0000FF",
  top2: "#0008FF",
  shirt: "#0000FF",
  tie: "#FF00FF",
  belt: "#0018FF",
  lower: "#0010FF",
  tights: "#0010FF",
  shoe: "#0020FF",
  sole: "#0028FF",
  glove: "none",
  mask: "none",
};
const rgbOf = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const isHairS = (h: string) => {
  const [r, g, b] = rgbOf(h);
  return g > r + 70 && g > b + 70;
};
const isTieS = (h: string) => {
  const [r, g, b] = rgbOf(h);
  return r > 110 && b > 110 && g < 0.5 * Math.min(r, b);
};

// ===================================================================================================================
// THE HEAD SPHERE (covidFolkBody's head, rebuilt from its exported rig so the glasses and tuft turn with it)
// ===================================================================================================================
type Head = { C: P2; R: number; roll: number; yaw: number; pitch: number };
const headOfPose = (q0: CovidPose): Head => {
  const { L, q, r } = covidRig(KIND, VAR, q0);
  const hunch = c01(q0.hunch ?? 0);
  const R = HEAD_R * L.head * (L.female ? 0.96 : 1);
  const C = add(r.headC, rot([0, -HEAD_UP + 7 * hunch], r.headAngle));
  return { C, R, roll: r.headAngle, yaw: q.headYaw, pitch: Math.max(-0.25, Math.min(0.55, ((q.pitch * Math.PI) / 180) * 0.8)) * Math.cos(q.headYaw) };
};
const hToFig = (h: Head, u: P2): P2 => add(h.C, rot([u[0] * h.R, u[1] * h.R], h.roll));
const hProj = (h: Head, beta: number, phi: number, rr = 1): { p: P2; d: number } => {
  const x0 = rr * Math.cos(phi) * Math.sin(beta + h.yaw);
  const y0 = -rr * Math.sin(phi);
  const d0 = Math.cos(phi) * Math.cos(beta + h.yaw);
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y1 = y0 * cp + d0 * rr * spc;
  const d1 = d0 * cp - (y0 / rr) * spc;
  return { p: hToFig(h, [x0, y1]), d: d1 };
};
const ringD = (c: P2, rx: number, ry: number, t: number, rotDeg: number) => {
  const o = ellPts(c, rx + t / 2, ry + t / 2, rotDeg, 18);
  const i = ellPts(c, Math.max(0.2, rx - t / 2), Math.max(0.2, ry - t / 2), rotDeg, 18).reverse();
  return `${closedD(o, 0.9)} ${closedD(i, 0.9)}`;
};

/** the round glasses: a frame ring and a faint lens sheen per eye, a bridge; the far lens narrows as he turns */
const glassesShapes = (h: Head): CShape[] => {
  const fs = h.R / 31.5;
  const out: CShape[] = [];
  const eyes = [-1, 1].map((s) => hProj(h, s * 0.36, 0.02, 1.07));
  const vis = sst(0.05, 0.3, Math.max(eyes[0].d, eyes[1].d));
  if (vis < 0.01) return out;
  let rings = "";
  let lenses = "";
  let glint = "";
  for (const e of eyes) {
    if (e.d <= 0.06) continue;
    const w = sst(0.06, 0.3, e.d);
    const rx = 7.4 * fs * mix(0.42, 1, e.d);
    const ry = 7.0 * fs;
    rings += ringD(e.p, rx, ry, 1.9 * fs * mix(0.8, 1, w), h.roll) + " ";
    lenses += closedD(ellPts(e.p, rx, ry, h.roll, 16), 0.9) + " ";
    glint += closedD(ellPts(add(e.p, rot([-rx * 0.38, -ry * 0.42], h.roll)), rx * 0.26, ry * 0.15, h.roll - 35, 10), 0.9) + " ";
  }
  if (lenses) out.push({ d: lenses, fill: LENS_C, sh: 0, op: 0.2 * vis });
  if (glint) out.push({ d: glint, fill: "#FFFDF6", sh: 0, op: 0.55 * vis });
  // the bridge over the nose
  const b0 = hProj(h, -0.2, 0.05, 1.08);
  const b1 = hProj(h, 0, 0.09, 1.1);
  const b2 = hProj(h, 0.2, 0.05, 1.08);
  if (Math.min(b0.d, b2.d) > 0.0) out.push({ d: tubeD([b0.p, b1.p, b2.p], [1.6 * fs, 1.6 * fs, 1.6 * fs]), fill: FRAME_C, sh: 0, op: vis });
  if (rings) out.push({ d: rings, fill: FRAME_C, sh: 0, op: 0.95 * vis });
  // the arm of the glasses running back to the ear on the near side (a short line as the head turns)
  const side = Math.sin(h.yaw) >= 0 ? -1 : 1;
  const a0 = hProj(h, side * 0.62, 0.04, 1.06);
  const a1 = hProj(h, side * 1.2, 0.03, 1.04);
  const av = sst(0.3, 0.6, Math.abs(Math.sin(h.yaw))) * sst(-0.1, 0.15, a1.d);
  if (av > 0.01) out.push({ d: tubeD([a0.p, a1.p], [1.3 * fs, 1.0 * fs]), fill: FRAME_C, sh: 0, op: 0.7 * av * vis });
  return out;
};

/** the swept tuft: a small curl rising off the crown and sweeping forward (leans with the head's turn, no flip) */
const tuftShapes = (h: Head, hair: string, amt: number): CShape[] => {
  if (amt <= 0.01) return [];
  const sy = Math.sin(h.yaw);
  // head-local unit coords (x right, y down); the curl's tip sweeps toward where he faces (continuous in sin(yaw))
  const lean = 0.42 * sy;
  const pts: P2[] = [
    [-0.2 + 0.25 * sy, -0.9],
    [-0.12 + 0.2 * sy, -1.08],
    [0.02 + lean * 0.6, -1.2],
    [0.16 + lean, -1.24],
    [0.27 + lean * 1.15, -1.18],
    [0.2 + lean * 0.95, -1.13],
    [0.1 + lean * 0.6, -1.12],
    [0.12 + 0.2 * sy, -0.92],
  ];
  const d = closedD(pts.map((u) => hToFig(h, u)), 0.85);
  return [
    { d, fill: hair, sh: 0.5, op: amt },
    { d: closedD(pts.slice(1, 5).concat([[0.05 + lean * 0.5, -1.1]]).map((u) => hToFig(h, add(u, [-0.02, 0.02]))), 0.85), fill: mixC(hair, "#F3EBDD", 0.25), sh: 0, op: 0.55 * amt },
  ];
};

/** the pencil in a fist: the grip point (the hand anchor), the direction the tip points (deg, 0 = screen right) */
export const PENCIL_TIP = 30;
const PENCIL_BACK = 14;
const pencilShapes = (grip: P2, ang: number, op = 1): CShape[] => {
  const d: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
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
// THE POSE: covidFolk's CovidPose plus the Genius's pencil
// ===================================================================================================================
export type GeniusPose = CovidPose & {
  /** a pencil in a fist: which hand (L = the near hand facing right), the tip's direction (deg), its opacity */
  pencil?: { hand: "L" | "R"; ang: number; op?: number };
};
export type GeniusAnchors = CovidAnchors & {
  /** the pencil's tip (figure-local units; world px from geniusAnchors) when the pose holds one, else the hand */
  pencilTip: P2;
};
export type GeniusBuild = { shapes: CShape[]; anchors: GeniusAnchors; heightUnits: number };
export type GeniusBuildOpts = { frame?: number; drain?: number };

/** build a Genius (figure-local units: feet at (0, 0), FOLK units in the shape paths as covidFolk) */
export const buildGenius = (variant: number, pose: GeniusPose, o: GeniusBuildOpts = {}): GeniusBuild => {
  const lk = lookOfV(variant);
  const hold = { L: "none" as const, R: "none" as const };
  const inks = geniusInks(variant);
  const real = buildCovidFolk(KIND, VAR, pose, { inks, hold, carry: "none", frame: o.frame ?? 0, drain: o.drain });
  // locate the parts: by the real inks' exact colours (fast); a drained figure (inks mixed) needs the sentinel build
  const drained = (o.drain ?? 0) > 0;
  const probe = drained ? buildCovidFolk(KIND, VAR, pose, { inks: SENT, hold, carry: "none", frame: o.frame ?? 0 }) : null;
  const n = Math.min(real.shapes.length, probe ? probe.shapes.length : Infinity);
  const R = real.shapes;
  const hairSet = new Set([inks.hair, mixC(inks.hair as string, "#F3EBDD", 0.22), mixC(inks.hair as string, SHADE_TO, 0.35)]);
  const tieSet = new Set([inks.tie, mixC(inks.tie as string, SHADE_TO, 0.1)]);
  const isHair = (i: number) => (probe ? isHairS(probe.shapes[i].fill) : hairSet.has(R[i].fill));
  const isTie = (i: number) => (probe ? isTieS(probe.shapes[i].fill) : tieSet.has(R[i].fill));
  const isSleeve = (i: number) => (probe ? probe.shapes[i].fill === SENT.top && probe.shapes[i + 1].fill === SENT.top2 : R[i].fill === inks.top && R[i + 1].fill === inks.top2) && R[i].det === undefined;
  // the last hair shape (hair is drawn after the face), the front arms (a sleeve then its cuff) after it
  let lastHair = -1;
  for (let i = 0; i < n; i++) if (isHair(i)) lastHair = i;
  let frontStart = n;
  for (let i = lastHair + 1; i < n - 1; i++)
    if (isSleeve(i)) {
      frontStart = i;
      break;
    }
  const head = headOfPose(pose);
  const extras: CShape[] = [];
  if (lk.tuft > 0) extras.push(...tuftShapes(head, lk.hair, lk.tuft));
  if (lk.glasses) extras.push(...glassesShapes(head));
  const shapes: CShape[] = [];
  for (let i = 0; i < n; i++) {
    if (i === frontStart) shapes.push(...extras);
    if (!lk.tie && isTie(i)) continue;
    const s = real.shapes[i];
    shapes.push(s.fill === BUCKLE_FROM ? { ...s, fill: BUCKLE_TO } : s);
  }
  if (frontStart >= n) shapes.push(...extras);
  const a = real.anchors;
  let pencilTip: P2 = a.handL;
  if (pose.pencil) {
    const grip = pose.pencil.hand === "L" ? a.handL : a.handR;
    const ang = pose.pencil.ang;
    pencilTip = add(grip, mul([Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)], PENCIL_TIP));
    shapes.push(...pencilShapes(grip, ang, pose.pencil.op ?? 1));
  }
  return { shapes, anchors: { ...a, pencilTip }, heightUnits: real.heightUnits + (lk.tuft > 0 ? 8 : 0) };
};

/** the anchors of a pose in figure-local rig units (no paint) */
export const geniusAnchorsLocal = (variant: number, pose: GeniusPose): GeniusAnchors => buildGenius(variant, pose).anchors;

// ===================================================================================================================
// POSES (pure, frame-driven, seek-safe; dir 1 = facing screen right; at 23.976 fps)
// ===================================================================================================================
export const GENIUS_FPS = 24000 / 1001;
/** covidFolk's breathe runs on 29.97 fps frames: convert this clip's frames to its clock */
const covidClock = (frame: number) => (frame * (30000 / 1001)) / GENIUS_FPS;
const face = (q: GeniusPose, dir: 1 | -1): GeniusPose => (dir === 1 ? q : { ...mirrorPose(q), pencil: q.pencil ? { ...q.pencil, hand: q.pencil.hand === "L" ? "R" : "L", ang: 180 - q.pencil.ang } : undefined });
const SMILE = 0.22;

/** frames per walk cycle (two steps) at 23.976 fps (~1.0 s, the cast's pace) and the feet's advance per frame */
export const GENIUS_WALK_CYCLE = 24;
const STRIDE = 44;
export const geniusWalkAdvance = (scale: number) => (2 * STRIDE * scale) / GENIUS_WALK_CYCLE;

/** stepOut timing: frames for the whole step-out (three steps, ~12 frames each, and the turn to us) */
export const STEP_OUT_FRAMES = 44;

/** typeAtDesk: the seat and the keyboard the desk (W2's) must match, units from `at` (= under the hips), facing
 *  right (mirror x when facing left). seatH = the chair's seat top (0.47 m), deskH = the desk top (0.74 m), keys =
 *  the two hand points on the keys (near hand first), knee = how far the knees reach forward (the desk's front edge
 *  must be beyond it), eye = the eye point (the monitor's centre should sit ~ at eye height, ~110 units ahead). */
export const GENIUS_DESK = {
  seatH: 84,
  deskH: 132,
  keys: [
    [64, -136],
    [70, -139],
  ] as P2[],
  kneeX: 70, // the knee joint; the trouser front reaches x ~85 and the toes x ~96, the knee top y ~-94
  seat: { x0: -26, x1: 24 },
  chairBackX: -30,
};
/** writeTick: the tick on a sheet in the screen plane to the figure's right (facing right; mirror x when facing
 *  left), units from `at`: the stroke's three points (start, the corner, the end) */
export const GENIUS_TICK = { p0: [72, -226] as P2, p1: [82, -213] as P2, p2: [106, -240] as P2 };

const stand0 = (dir: 1 | -1): GeniusPose => ({ ...POSES.stand(dir), mouth: SMILE });
const solve = (q: GeniusPose, grip: { L?: P2; R?: P2 }): GeniusPose => ({ ...covidGripTo(KIND, VAR, q, grip, [0, 0], 1), pencil: q.pencil });
const flipX = (p: P2, dir: 1 | -1): P2 => [p[0] * dir, p[1]];

export const GENIUS_POSES = {
  /** standing three-quarter facing dir, a slow breath (frame = the cut's frame) */
  stand: (dir: 1 | -1 = 1, frame = 0, seed = 0): GeniusPose => breathe(stand0(dir), covidClock(frame), 1, seed) as GeniusPose,
  /** standing facing us, a slow breath */
  front: (frame = 0, seed = 0): GeniusPose => breathe({ ...POSES.front(), mouth: SMILE }, covidClock(frame), 1, seed) as GeniusPose,
  /** standing at any yaw (0 front .. +-0.62 three-quarter .. +-1.3 profile .. PI back), breathing */
  turnTo: (yaw: number, frame = 0, seed = 0): GeniusPose => breathe({ ...POSES.turnTo(yaw), mouth: SMILE }, covidClock(frame), 1, seed) as GeniusPose,
  /** the walk with planted feet: phase from the frame (GENIUS_WALK_CYCLE frames per two steps); move `at` by
   *  geniusWalkAdvance(scale) px per frame in dir */
  walk: (dir: 1 | -1 = 1, frame = 0, amount = 1): GeniusPose => ({ ...POSES.walk(dir, frame / GENIUS_WALK_CYCLE, amount), mouth: SMILE }),
  /** stepping out (of a rack door, out of a crowd) sideways in dir: t 0..1 over STEP_OUT_FRAMES; two steps from a
   *  standstill, then he turns three-quarter toward us. Move `at` by stepOutShift(dir, t) * scale (the feet stay
   *  planted). */
  stepOut: (dir: 1 | -1 = 1, t = 0): GeniusPose => {
    const u = c01(t);
    const { phase, amt } = stepOutCurve(u);
    const w = POSES.walk(dir, phase, amt) as GeniusPose;
    const end: GeniusPose = { ...POSES.turnTo(dir * 0.42), mouth: SMILE, footL: [-8 * dir, 0], footR: [7 * dir, -1] };
    const q = lerpPose(w, end, sst(0.68, 1, u)) as GeniusPose;
    // the turn is a small shuffle step of the trailing foot (it lifts while it travels; the other stays planted)
    const lift = 13 * Math.sin(Math.PI * sst(0.7, 0.97, u));
    const trail = dir === 1 ? "footL" : "footR";
    return { ...q, mouth: SMILE, headYaw: q.headYaw - dir * 0.18 * sst(0.55, 0.95, u), [trail]: [q[trail][0], q[trail][1] - lift] as P2 };
  },
  /** seated on a chair at a desk, facing dir, hands on the keyboard (GENIUS_DESK.keys) typing in small taps; the
   *  frame drives the typing (deterministic rhythm) and a slow breath. `at` = the floor under the hips. */
  typeAtDesk: (dir: 1 | -1 = 1, frame = 0, seed = 0): GeniusPose => {
    const base: GeniusPose = { ...POSES.sit(1, GENIUS_DESK.seatH), lean: 7, pitch: 3, headYaw: 0.9, mouth: SMILE * 0.8 };
    const b = breathe(base, covidClock(frame), 0.8, seed) as GeniusPose;
    const tap = (k: number, ph: number) => {
      // one finger-tap bob per ~5 frames, in bursts (a phrase of taps, a short pause)
      const burst = sst(0.25, 0.45, 0.5 + 0.5 * Math.sin(frame * 0.09 + seed * 2 + k * 0.7));
      return Math.max(0, Math.sin(frame * 1.25 + ph + seed)) ** 2 * burst;
    };
    const kL = add(GENIUS_DESK.keys[0], [1.5 * Math.sin(frame * 0.21 + seed), -3.2 * tap(0, 0)]);
    const kR = add(GENIUS_DESK.keys[1], [1.5 * Math.sin(frame * 0.17 + 1 + seed), -3.2 * tap(1, 2.1)]);
    const q = solve(b, { L: kL, R: kR });
    const typed = { ...q, armL: { ...q.armL, fist: 0.15, hand: 18 }, armR: { ...q.armR, fist: 0.15, hand: 18 }, look: [0.35, 0.05] as P2 };
    return face(typed, dir);
  },
  /** raising the pencil and drawing a tick on a sheet beside him (GENIUS_TICK, in the screen plane to his front
   *  side): t 0..1 = 0..0.3 raise to the sheet, 0.3..0.44 the short down stroke, 0.44..0.72 the long up stroke,
   *  0.72..1 he lowers it a little and nods. The tip is exactly on the stroke: tickDrawn(dir, t) gives the drawn part. */
  writeTick: (dir: 1 | -1 = 1, t = 0, frame = 0): GeniusPose => {
    const u = c01(t);
    const base = breathe({ ...stand0(1), headYaw: 0.75, pitch: 4 }, covidClock(frame), 0.6) as GeniusPose;
    const holdAng = 28;
    const restQ: GeniusPose = { ...base, pencil: { hand: "L", ang: 80 } };
    const tipAt = tickTip(u);
    const ang = mix(80, holdAng, sst(0, 0.3, u)) + (u > 0.3 ? -8 * sst(0.44, 0.72, u) : 0) + 10 * sst(0.75, 1, u);
    const dd: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
    const lower = sst(0.75, 1, u);
    const tip = add(tipAt, [-6 * lower, 22 * lower]);
    const gripPt = sub(tip, mul(dd, PENCIL_TIP));
    const writing = solve({ ...base, pencil: { hand: "L", ang } }, { L: gripPt });
    const raise = sst(0, 0.3, u);
    let q = raise >= 0.999 ? writing : (lerpPose(restQ, writing, raise) as GeniusPose);
    q = { ...q, pencil: { hand: "L", ang }, look: [0.6, -0.1] as P2, mouth: SMILE + 0.15 * sst(0.72, 0.9, u), pitch: q.pitch + 5 * Math.sin(Math.PI * sst(0.74, 0.98, u)) ** 2 };
    return face(q, dir);
  },
  /** a small happy cheer: both arms up in a V, a little bounce, the laugh face. amount 0..1 raises it (ease it over
   *  10+ frames), frame drives the bounce (an 18-frame loop); yaw 0 = facing us */
  cheer: (frame = 0, amount = 1, yaw = 0): GeniusPose => {
    const a = ease(c01(amount));
    const base: GeniusPose = yaw === 0 ? { ...POSES.front() } : { ...POSES.turnTo(yaw) };
    const ph = (frame / 18) * 2 * Math.PI;
    const bounce = (0.5 - 0.5 * Math.cos(ph)) * a;
    const { r } = covidRig(KIND, VAR, base);
    // each wrist swings out sideways round its shoulder on a near-straight arm (a jumping-jack arc: the IK never
    // passes the wrist close to the shoulder, so the elbow cannot flip) up into the V
    const arm = (sgn: -1 | 1) => {
      const S = sgn < 0 ? r.armL.S : r.armR.S;
      const w0 = sgn < 0 ? base.armL.w : base.armR.w;
      const d0 = sub(w0, S);
      const th0 = Math.atan2(d0[1], d0[0]);
      const th1 = sgn < 0 ? (249 * Math.PI) / 180 : (-69 * Math.PI) / 180;
      const th0u = sgn < 0 ? (th0 < 0 ? th0 + 2 * Math.PI : th0) : th0;
      const th = mix(th0u, th1, a) + sgn * 0.06 * Math.sin(ph) * a;
      const R = mix(Math.hypot(d0[0], d0[1]), 92 + 4 * Math.sin(ph), a);
      const w = add(S, [R * Math.cos(th), R * Math.sin(th) - 8 * bounce]);
      const hint = mix2(sgn < 0 ? base.armL.elbow : base.armR.elbow, [sgn * 0.85, 0.35], a);
      return { w, elbow: hint, fist: mix(0.3, 0.55, a), hand: -sgn * 12 * a };
    };
    return { ...base, armL: arm(-1), armR: arm(1), crouch: base.crouch + 5 * bounce, pitch: base.pitch - 4 * a, laugh: 0.85 * sst(0.2, 0.9, a), mouth: SMILE };
  },

};

// ---- stepOut: the walk's phase and amount along t, and the planted-foot shift ----------------------------------------
const stepOutCurve = (u: number) => {
  // three steps at the walk's cadence (u 0..0.8: lead, trail, lead), the stride easing in over the first and out over
  // the last; the trailing foot then closes up in the turn
  const w = c01(u / 0.8);
  const phase = 0.05 + 1.5 * w;
  const amt = sst(0, 0.22, w) * (1 - sst(0.72, 1, w));
  return { phase, amt };
};
/** the drawn ankle x (units) of each foot in a stepOut pose (the rig's own ankles: the hips' turn included) */
const anklesX = (dir: 1 | -1, u: number): [number, number] => {
  const { r } = covidRig(KIND, VAR, GENIUS_POSES.stepOut(dir, u));
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
    const lA = frac(stepOutCurve(a).phase) < 0.5;
    const lB = frac(stepOutCurve(b).phase) < 0.5;
    // the support changes feet between these samples: no shift (both feet are down at the switch)
    if (lA === lB) s -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
    prev = cur;
  }
  return s;
};

// ---- writeTick: the tip along the stroke ----------------------------------------------------------------------------
const tickTip = (u: number): P2 => {
  const { p0, p1, p2 } = GENIUS_TICK;
  if (u <= 0.3) return p0;
  if (u <= 0.44) return mix2(p0, p1, ease((u - 0.3) / 0.14));
  if (u <= 0.72) return mix2(p1, p2, ease((u - 0.44) / 0.28));
  return p2;
};
/** the drawn part of the tick at writeTick t, figure-local units (facing right; mirrored for dir -1): a polyline */
export const tickDrawn = (dir: 1 | -1, t: number): P2[] => {
  const u = c01(t);
  const { p0, p1 } = GENIUS_TICK;
  if (u <= 0.3) return [];
  const pts: P2[] = [p0];
  if (u < 0.44) pts.push(tickTip(u));
  else {
    pts.push(p1);
    if (u > 0.44) pts.push(tickTip(u));
  }
  return pts.map((p) => flipX(p, dir));
};

/** the seated hips' height over the floor (units) for typeAtDesk */
export const GENIUS_HIP_SEATED = GENIUS_DESK.seatH + SEAT.hipAbove;
