// ---------------------------------------------------------------------------
// SteelAndHorses (cut B of "Sheppard_Conquistador_Advantages"; Dwarkesh Patel
// with Si Sheppard). Dwarkesh map style, "beyond maps" umber page that IS the
// land of the Cortes world map. Opaque 1080x1920, 23.976 fps, 189 frames.
//
// CHECK LINE: After this cut the viewer can say: "a steel sword that breaks
// obsidian, and a horse: that small edge let a band of a couple hundred men
// take a whole empire."
//
// THE LINE: "[it's really just that they had] metal swords instead of obsidian
// blades and that they had horses. And that's enough to let a couple hundred
// men take over entire empires."
// WORD -> FRAME: swords 5 · instead 15 · of 30 · obsidian 37 · blades 45 ·
//   and 53 · that 65 · they 72 · had 77 · horses 82 · And 90 · that's 98 ·
//   enough 106 · to 113 · let 123 · a 133 · couple 136 · hundred 140 · men 145 ·
//   take 152 · over 160 · entire 165 · empires 172-186.
//
// THE MOTION (one pull-back, ~220x, keyed in log space): the camera opens CLOSE
// on an orange steel blade coming down; a cream macuahuitl swings in from the
// left edge and meets it (contact f44): the obsidian blades of the struck edge
// shatter and fall, the steel carries through. The camera keeps pulling back:
// the sword is a mounted conquistador's, the horse striding (f80-90), the
// warrior falling back a step; then the band behind him, each man shrinking
// into his dot: a block of 200 on the Gulf coast at the edge of the Aztec
// empire, which now fills the frame in cream hatch. From f148 an orange ink
// front leaves the band and takes the empire, province after province (done
// f178); the frame holds, creeping. No text.
//
// Orange = the Spaniards' edge (steel solid; horses and men as orange line;
// the men as dots; what they take). Everything indigenous is cream.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  LAND,
  MapStack,
  PaperTop,
  WorldSvg,
  camTransform,
  hash,
  landAt,
  mapSharpness,
  pchip,
  smoothstep,
  viewRect,
  type Cam,
  type P2,
} from "../kits/maps/cortesShared";
import { CREAM_BORDERS_D, EMPIRE_T_D, ENCLAVES, EmpireBorder, EmpireHatch, EmpireWash, EnemyBorder } from "../kits/maps/tlaxShared";
import { PROVINCES, PROVINCE_SEAMS } from "../kits/maps/tlaxProvinces";
import { CONQ_IDLE, CONQ_K, Conquistador, SCAB_REST, SWORD, WAR_K, WAR_READY, Warrior, conqRig, holdAt, warRig, type ConqPose, type WarPose } from "./techAdvFigures";
import { Chip, FootSoldier, HorseRider, SADDLE_Y, mkPen } from "./steelHorsesShared";
import { add, mix, mul, rot, sub } from "../kits/maps/stringsMotion";

export const FPS = 24000 / 1001;
export const DURATION = 189;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE TIMES
// ---------------------------------------------------------------------------
const T = {
  /** the steel meets the obsidian: the contact frame, and the first frame of every reaction */
  contact: 44,
  /** the orange front leaves the band / has taken the empire */
  front0: 148,
  front1: 176,
};

// ---------------------------------------------------------------------------
// THE WORLD: the hero's ground point on the Cortes map; cm -> world px
// ---------------------------------------------------------------------------
/** the final framing: k, and how many screen px a 1.70 m man stands there (= his dot) */
const K_END = 3.95;
const MAN_END_PX = 8.5;
/** world px per metre (a map symbol's scale, not the map's) */
const M2W = MAN_END_PX / 1.7 / K_END;
/** the band: 20 files x 10 ranks behind the leader, one dot = one man; anchors in hero metres (x east, y UP) */
const PITCH = 0.85;
/** the first file stands this far behind the leader, m */
const FILE0 = 3.6;
const COLS = 20;
const ROWS = 10;
const DOT_UP = 1.9; // the hero's dot sits at his chest
/** the hero's ground point (under his saddle), world px: the block's east end on the coast by Cempoala */
const HERO_W: P2 = [164.6 - (FILE0 + (COLS - 1) * PITCH) * M2W, 874 + DOT_UP * M2W];
type Man = { i: number; c: number; r: number; ax: number; ay: number; rider: boolean; gx: number; gy: number; ph: number; tilt: number };
const h01 = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** the riders scattered among the foot: [file, rank] */
const RIDERS = new Set(["0,2", "0,7", "5,0", "9,5", "14,9", "12,2", "17,6", "6,8"]);
const BAND: Man[] = [];
for (let r = 0; r < ROWS; r++)
  for (let c = COLS - 1; c >= 0; c--) {
    const i = r * COLS + c;
    const ax = FILE0 + c * PITCH;
    const ay = DOT_UP + (4.5 - r) * PITCH;
    const rider = RIDERS.has(`${c},${r}`);
    BAND.push({ i, c, r, ax, ay, rider, gx: ax + (rider ? 0.08 : 0), gy: ay - (rider ? DOT_UP : 1.12), ph: h01(i, 1), tilt: -5 + 10 * h01(i, 2) });
  }
const mToW = (xm: number, yUp: number): P2 => [HERO_W[0] + xm * M2W, HERO_W[1] - yUp * M2W];
for (const m of BAND) {
  const [x, y] = mToW(m.ax, m.ay);
  if (!landAt(x, y)) throw new Error(`SteelAndHorses: man ${m.i} stands in the sea`);
}
/** the mosaic */
const CELLS = PROVINCES.filter((c) => c.key !== "xoconochco");
/** where the front starts: the leader, at the head of the block */
const FRONT_O: P2 = mToW(-0.08, DOT_UP);
const cellReach = (c: (typeof PROVINCES)[number]) => {
  let m = 0;
  for (const poly of c.polys) for (const ring of poly) for (const p of ring) m = Math.max(m, Math.hypot(p[0] - FRONT_O[0], p[1] - FRONT_O[1]));
  return m;
};
const CELL_REACH = new Map(PROVINCES.map((c) => [c.id, cellReach(c)]));
const FRONT_RMAX = Math.max(...CELLS.map((c) => CELL_REACH.get(c.id) as number)) * 1.07;

// ---------------------------------------------------------------------------
// THE CAST (cut A's conquistador and warrior: techAdvFigures, read-only).
// Their figure units: a man ~310; UC = cm per unit. Everything below is in
// HERO cm: the ground under his saddle at (0, 0), y down.
// ---------------------------------------------------------------------------
const UC = 170 / 310;
const WALK_CYCLE = 27;
const horsePhase = (f: number) => (f + 6) / WALK_CYCLE;
const horseBob = (f: number) => 1.1 * Math.cos(4 * Math.PI * horsePhase(f));
/** the rider's figure origin (his "feet" if he stood): his hips sit on the saddle */
const riderO = (f: number): P2 => [1, SADDLE_Y + horseBob(f) + 152 * UC];
const RIDE: ConqPose = {
  ...CONQ_IDLE,
  farElbow: undefined,
  headYaw: -0.98,
  pitch: 3,
  lean: -9,
  near: { w: [-26, -166], elbow: [1, 0.3], fist: 0.9, hand: 12 },
  footNear: [-49, -27],
  footFar: [-7, -27],
  brow: 0.6,
  mouth: -0.2,
};
/** the sword: where the fist is wanted (hero cm) and the blade's angle above the horizontal (pointing screen left), deg */
const swHx = pchip([[-12, -44], [0, -50], [T.contact, -67], [58, -70], [74, -66], [104, -56], [189, -54]]);
/** the horse stands SADDLE_Y + 157 cm lower than the tracks were keyed for */
const DY = SADDLE_Y + 157;
const swHy = pchip([[-12, -262 + DY], [0, -259 + DY], [T.contact, -238 + DY], [58, -232 + DY], [74, -232 + DY], [104, -238 + DY], [189, -239 + DY]]);
const swA = pchip([[-12, 44], [0, 34], [T.contact, -10], [56, -17], [70, -19], [104, 6], [189, 8]]);
const riderAt = (f: number) => {
  const o = riderO(f);
  const lean = RIDE.lean + 0.6 * Math.sin(f / 15);
  const base: ConqPose = { ...RIDE, lean, roll: 0.5 * Math.sin(f / 17) };
  const S = conqRig(base).far.S;
  const want: P2 = [(swHx(f) - o[0]) / UC, (swHy(f) - o[1]) / UC];
  const pose: ConqPose = { ...base, far: holdAt(S, want, CONQ_K, [0.2, 1], 0, 1) };
  const r = conqRig(pose);
  const a = swA(f);
  const rad = (a * Math.PI) / 180;
  const dir: P2 = [-Math.cos(rad), -Math.sin(rad)];
  const down: P2 = [-Math.sin(rad), Math.cos(rad)];
  /** a point of the blade's lower edge, x units from the guard, hero cm */
  const edge = (x: number): P2 => add(o, mul(add(add(r.far.grip, mul(dir, SWORD.grip + x)), mul(down, 8.8 - (2.3 * x) / 104)), UC));
  const mid = (x: number): P2 => add(o, mul(add(r.far.grip, mul(dir, SWORD.grip + x)), UC));
  return { o, pose, grip: r.far.grip, dirDeg: 180 + a, dir, down, edge, mid, rein: add(o, mul(r.near.grip, UC)) as P2 };
};
/** where on the blade the blow lands, units from the guard */
const SW_X = 92;
const CONTACT: P2 = riderAt(T.contact).edge(SW_X);

// ---- the macuahuitl (cut A's ClubArt: the fist at (0, 0), the paddle along + x; its blades, as drawn there)
const CLUB_B = { x0: 40, pitch: 13.2, bl: 10.8 };
const clubHalf = (x: number) => mix(7.2, 8.8, Math.max(0, Math.min(1, (x - 30) / 90)));
/** blade i on edge sd, club-local units: inner a, inner b, outer b, outer a */
const clubBlade = (i: number, sd: number): P2[] => {
  const xa = CLUB_B.x0 + i * CLUB_B.pitch;
  const xb = xa + CLUB_B.bl;
  const out = 9.2 + (hash(i, sd + 3) - 0.5) * 1.6;
  return [
    [xa, sd * (clubHalf(xa) - 1.6)],
    [xb, sd * (clubHalf(xb) - 1.6)],
    [xb - 0.5, sd * (clubHalf(xb) + out)],
    [xa + 0.5, sd * (clubHalf(xa) + out)],
  ];
};
/** the struck edge is the upper one (- y); its top blade's outer corner meets the steel */
const STRUCK = -1;
const CLUB_CORNER: P2 = clubBlade(5, STRUCK)[2];
/** the club's angle above the horizontal (pointing screen right) at the blow, deg */
const CLUB_BETA = 55;
/** the fist that puts that corner on the steel's edge, hero cm */
const FIST_C: P2 = sub(CONTACT, mul(rot(CLUB_CORNER, -CLUB_BETA), UC));
// it swings in and does not slow into the blow; the blow drives its head down, and he carries it low, away from his face
const mcBpre = pchip([[0, 96], [12, 86], [28, 70], [T.contact, CLUB_BETA]]);
const mcXpre = pchip([[0, -27], [12, -19], [28, -8], [T.contact, 0]]);
const mcYpre = pchip([[0, 7], [12, 5], [28, 2.4], [T.contact, 0]]);
const mcBpost = pchip([[T.contact, CLUB_BETA], [52, 50], [60, 26], [72, -22], [86, -40], [189, -41]], true);
const mcXpost = pchip([[T.contact, 0], [52, -22], [60, -46], [72, -52], [86, -54], [189, -54]], true);
const mcYpost = pchip([[T.contact, 0], [52, 34], [60, 46], [72, 50], [86, 50], [189, 50]], true);
const clubWant = (f: number) => {
  if (f <= T.contact) return { b: mcBpre(f), fist: add(FIST_C, [mcXpre(f), mcYpre(f)]) as P2 };
  const t = f - T.contact;
  const k = Math.min(1, t / 5);
  // the recoil starts ON the contact frame with a velocity (a blow, not an ease)
  return { b: mix(CLUB_BETA - 0.6 * t, mcBpost(f), k), fist: add(FIST_C, [mix(-2 * t, mcXpost(f), k), mix(4.2 * t, mcYpost(f), k)]) as P2 };
};
// ---- the warrior: he strikes, the blow throws his club back, he falls back a step
const W_X0 = -180;
const wX = pchip([[0, W_X0], [T.contact, -178], [48, -178.5], [70, -197], [189, -198]], true);
const wLean = pchip([[0, 6], [30, 10], [T.contact, 14], [52, 6], [64, -7], [84, -4], [189, -3.4]], true);
const wCrouch = pchip([[0, 4], [T.contact, 2], [58, 11], [72, 6], [189, 6]], true);
const STEP = 19 / UC; // units
const stepNear = pchip([[47, 0], [57, 1]], true);
const stepFar = pchip([[57, 0], [68, 1]], true);
const arcOf = (v: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, v)));
const shieldW = pchip([[0, 0], [T.contact, 0], [66, 1], [189, 1]], true);
const warriorAt = (f: number) => {
  const x = wX(f);
  const o: P2 = [x, 0];
  const sn = stepNear(Math.max(47, Math.min(57, f)));
  const sf = stepFar(Math.max(57, Math.min(68, f)));
  const sw = shieldW(Math.max(0, f));
  const shift = (W_X0 - x) / UC;
  const base: WarPose = {
    ...WAR_READY,
    headYaw: 0.92,
    pitch: -9,
    lean: wLean(f) + 0.3 * Math.sin(f / 17),
    crouch: wCrouch(f),
    far: { w: [mix(27, 30, sw), mix(-148, -178, sw) + 0.8 * Math.sin(f / 13)], elbow: [-0.5, 1], fist: 1, hand: 0 },
    footNear: [-12 + shift - STEP * sn, -9 * arcOf((f - 47) / 10) * (f > 47 && f < 57 ? 1 : 0)],
    footFar: [6 + shift - STEP * sf, -9 * arcOf((f - 57) / 11) * (f > 57 && f < 68 ? 1 : 0)],
    liftNear: -14 * arcOf((f - 47) / 10) * (f > 47 && f < 57 ? 1 : 0),
    liftFar: -14 * arcOf((f - 57) / 11) * (f > 57 && f < 68 ? 1 : 0),
    brow: 0.8,
    mouth: -0.6,
    hem: 40 * (wX(f + 1) - wX(f - 1)) * -0.25 + 2 * Math.sin(f / 9),
    shield: -6 + 10 * sw,
  };
  const want = clubWant(f);
  const S = warRig(base).near.S;
  const pose: WarPose = { ...base, club: -want.b, near: holdAt(S, [(want.fist[0] - o[0]) / UC, (want.fist[1] - o[1]) / UC], WAR_K, [-0.6, 1], 0, 1, 59, 56) };
  const grip = warRig(pose).near.grip;
  /** a club-local point in hero cm */
  const club = (p: P2): P2 => add(o, mul(add(grip, rot(p, -want.b)), UC));
  return { o, pose, club, b: want.b };
};
{
  // the blow is real geometry: the club's corner is ON the steel's edge on the contact frame, and nothing of the club is past it
  const w = warriorAt(T.contact);
  const c = w.club(CLUB_CORNER);
  if (Math.hypot(c[0] - CONTACT[0], c[1] - CONTACT[1]) > 0.1) throw new Error(`SteelAndHorses: the club does not reach the steel on the contact frame (${(c[0] - CONTACT[0]).toFixed(2)}, ${(c[1] - CONTACT[1]).toFixed(2)})`);
  const s = riderAt(T.contact);
  const over = (p: P2) => (w.club(p)[0] - CONTACT[0]) * -s.down[0] + (w.club(p)[1] - CONTACT[1]) * -s.down[1];
  const worst = Math.max(over([125, -4]), over([120, -8.8]), over(clubBlade(5, 1)[2]), over(clubBlade(4, STRUCK)[2]));
  if (worst > 0.2) throw new Error(`SteelAndHorses: the club's head is ${worst.toFixed(2)} cm past the steel's edge at the blow`);
}

// ---------------------------------------------------------------------------
// THE CHIPS: the top blades of the struck edge shatter (two gone, one snapped)
// ---------------------------------------------------------------------------
const GRAV = 1.5; // cm / f^2
const CHIPS = (() => {
  const w = warriorAt(T.contact);
  const out: { p0: P2; v: P2; spin: number; r: number; seed: number; rot0: number }[] = [];
  const src: [number, number, number][] = [
    [5, 0.25, 4.4], [5, 0.75, 3.6], [4, 0.2, 3.4], [4, 0.6, 4.6], [4, 0.9, 3], [3, 0.7, 3.6], [5, 0.5, 2.6],
  ];
  src.forEach(([bi, u, r], i) => {
    const q = clubBlade(bi, STRUCK);
    const local: P2 = [mix(q[0][0], q[1][0], u), mix(q[0][1], q[3][1], 0.62)];
    out.push({ p0: w.club(local), v: [-1.5 + 3.2 * h01(i, 31), -(0.6 + 2.2 * h01(i, 32))], spin: (h01(i, 33) - 0.5) * 34, r, seed: 40 + i, rot0: -w.b });
  });
  return out;
})();
/** what the blow removes of the club, club-local polygons (the blades with their rims) */
const GONE: P2[][] = [5, 4, 3].map((i) => {
  const q = clubBlade(i, STRUCK);
  const inner = i === 3 ? 0.45 : -0.12;
  const a: P2 = [q[0][0] - 1.6, mix(q[0][1], q[3][1], inner)];
  const b: P2 = [q[1][0] + 1.6, mix(q[1][1], q[2][1], inner)];
  return [a, b, [q[2][0] + 2, q[2][1] - 2.2], [q[3][0] - 2, q[3][1] - 2.2]];
});

// ---------------------------------------------------------------------------
// THE CAMERA: one pull-back. ppm = screen px per metre, a pchip in log space;
// the hero's ground point sits at A + ppm B (A screen px, B metres): close in,
// B holds the blades at the middle; far out, A places the map.
// ---------------------------------------------------------------------------
const PPM0 = 1050;
const PPM_END = K_END * M2W;
/** the map's last framing: this world point at this screen point */
const END_W: P2 = [89, 878];
const END_S: P2 = [540, 930];
const HERO_END: P2 = [END_S[0] + (HERO_W[0] - END_W[0]) * K_END, END_S[1] + (HERO_W[1] - END_W[1]) * K_END];
const lnPpm = pchip([
  [0, Math.log(PPM0)],
  [T.contact, Math.log(880)],
  // out to the two figures quickly, then a slower stretch on the horse and the man before the band
  [66, Math.log(345)],
  [84, Math.log(312)],
  [118, Math.log(30)],
  [150, Math.log(PPM_END * 1.03)],
  [DURATION, Math.log(PPM_END)],
]);
/** until the blow the camera rides a point of the blade's middle line: from near the fist (the hilt in frame) out to the place of the blow */
const rideX = pchip([[0, 44], [16, 86], [T.contact, SW_X]], true);
const rideShift = pchip([[0, 0], [14, -9], [T.contact, 0]], true);
const ridePt = (f: number): P2 => {
  const b = riderAt(f);
  const u = smoothstep((f - 26) / 18);
  const m = b.mid(rideX(f));
  const e = b.edge(rideX(f));
  return [mix(m[0], e[0], u) + rideShift(f), mix(m[1], e[1], u)];
};
const BxLate = pchip([[T.contact, -CONTACT[0] / 100], [66, 0.66], [84, 0.66], [120, 0.2], [150, 0], [DURATION, 0]], true);
const ByLate = pchip([[T.contact, -CONTACT[1] / 100], [66, 1.44], [84, 1.468], [120, 0.5], [150, 0], [DURATION, 0]], true);
// the hand-over at the blow keeps the camera's velocity: the late track is eased in over the first frames after it
const Bx = (f: number) => {
  if (f <= T.contact) return -ridePt(f)[0] / 100;
  const v = -(ridePt(T.contact)[0] - ridePt(T.contact - 1)[0]) / 100;
  const t = f - T.contact;
  return mix(-CONTACT[0] / 100 + v * t, BxLate(f), smoothstep(t / 12));
};
const By = (f: number) => {
  if (f <= T.contact) return -ridePt(f)[1] / 100;
  const v = -(ridePt(T.contact)[1] - ridePt(T.contact - 1)[1]) / 100;
  const t = f - T.contact;
  return mix(-CONTACT[1] / 100 + v * t, ByLate(f), smoothstep(t / 12));
};
const Ax = pchip([[0, 540], [84, 540], [120, 600], [150, HERO_END[0]], [DURATION, HERO_END[0]]], true);
const Ay = pchip([[0, 900], [T.contact, 900], [66, 960], [84, 960], [120, 950], [150, HERO_END[1]], [DURATION, HERO_END[1]]], true);
export const viewAt = (f: number) => {
  const ppm = Math.exp(lnPpm(f));
  const g: P2 = [Ax(f) + ppm * Bx(f), Ay(f) + ppm * By(f)];
  const k = ppm / M2W;
  const cam: Cam = { k, cx: HERO_W[0] - (g[0] - 540) / k, cy: HERO_W[1] - (g[1] - 960) / k };
  return { ppm, S: ppm / 100, g, cam };
};
/** a chip's place t frames after the blow, hero cm */
const chipAt = (i: number, t: number): P2 => [CHIPS[i].p0[0] + CHIPS[i].v[0] * t, CHIPS[i].p0[1] + CHIPS[i].v[1] * t + 0.5 * GRAV * t * t];
/** each chip is drawn until it has fallen out of the bottom of the frame (frames after the blow) */
export const CHIP_OUT = CHIPS.map((_, i) => {
  for (let t = 1; t < 60; t++) {
    const v = viewAt(T.contact + t);
    if (v.g[1] + (chipAt(i, t)[1] - 8) * v.S > FRAME_H) return t;
  }
  return 60;
});
{
  const end = mapSharpness(viewAt(DURATION - 1).cam);
  if (end.texelsPerPx < 0.95) throw new Error(`SteelAndHorses: the last framing is soft (${end.texelsPerPx.toFixed(2)} texels / px)`);
}

// ---------------------------------------------------------------------------
// THE PAGE: the land's umber and the world-space mottle at every zoom; the
// baked map under it once the camera is far enough out for it to be sharp
// ---------------------------------------------------------------------------
const Mottle: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const v = viewRect(cam, 24);
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((v.y0 - oy) / S) * S + oy;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
  });
  // drawn in SCREEN px (a css scale of ~1000 on a 640 px image loses precision)
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: 0.9, overflow: "hidden" }}>
      {mt.map((t, i) => (
        <Img key={`m-${i}`} src={staticFile("manchuria/mottle.png")} style={{ position: "absolute", left: tx + t.x * k, top: ty + t.y * k, width: t.s * k * 1.002, height: t.s * k * 1.002, opacity: t.o }} />
      ))}
    </div>
  );
};
/** the baked map is drawn below this zoom (sharp below k 11; a little soft for the few frames above it) */
const K_MAP = 17;

// ---------------------------------------------------------------------------
// THE EMPIRE: the province mosaic in cream hatch; the orange front
// ---------------------------------------------------------------------------
const BIG = { x: -1200, y: -1000, w: 3600, h: 3900 };
const frontPath = (R: number) => {
  const n = 120;
  let d = "";
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    const rr = R * (1 + 0.035 * Math.sin(3 * th + 1) + 0.022 * Math.sin(7 * th + 2.3) + 0.014 * Math.sin(13 * th + 0.4) + 0.008 * Math.sin(29 * th));
    d += `${i ? "L" : "M"}${(FRONT_O[0] + rr * Math.cos(th)).toFixed(2)},${(FRONT_O[1] + rr * Math.sin(th)).toFixed(2)}`;
  }
  return `${d}Z`;
};
const ALL_BORDERS_D = CREAM_BORDERS_D + ENCLAVES.tlaxcala.border;
/** the cream of the empire (ground tint, hatch, seams) comes up with the map in one long even rise: none under
 *  the close figures (k > 110), all of it by k 12 */
const creamOf = (k: number) => 1 - smoothstep(Math.log(k / 12) / Math.log(110 / 12));
const Empire: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const px = (v: number) => v / cam.k;
  const R = frame <= T.front0 ? 0 : (FRONT_RMAX * (frame - T.front0)) / (T.front1 - T.front0);
  const fd = R > 0 ? frontPath(R) : "";
  const done = R >= FRONT_RMAX;
  // a province is taken when the front has crossed all of it: its ground deepens, its seams turn
  const taken = new Set(PROVINCES.filter((c) => R >= (CELL_REACH.get(c.id) as number) * 1.04).map((c) => c.id));
  const takenD = PROVINCES.filter((c) => taken.has(c.id)).map((c) => c.d).join("");
  const seamsOrange = PROVINCE_SEAMS.filter((q) => taken.has(q.a) && taken.has(q.b)).map((q) => q.d).join("");
  const seamsCream = PROVINCE_SEAMS.filter((q) => !(taken.has(q.a) && taken.has(q.b))).map((q) => q.d).join("");
  const cream = creamOf(cam.k);
  return (
    <WorldSvg cam={cam}>
      <defs>
        <mask id="shOut" maskUnits="userSpaceOnUse" x={BIG.x} y={BIG.y} width={BIG.w} height={BIG.h}>
          <rect x={BIG.x} y={BIG.y} width={BIG.w} height={BIG.h} fill="#fff" />
          {fd ? <path d={fd} fill="#000" /> : null}
        </mask>
        <mask id="shIn" maskUnits="userSpaceOnUse" x={BIG.x} y={BIG.y} width={BIG.w} height={BIG.h}>
          <rect x={BIG.x} y={BIG.y} width={BIG.w} height={BIG.h} fill="#000" />
          {fd ? <path d={fd} fill="#fff" /> : null}
        </mask>
        <clipPath id="shEmp">
          <path d={EMPIRE_T_D} clipRule="evenodd" />
        </clipPath>
      </defs>
      {!done ? (
        <g mask="url(#shOut)" opacity={cream}>
          <EmpireWash d={EMPIRE_T_D} solidity={1} />
          <EmpireHatch d={EMPIRE_T_D} cam={cam} solidity={1.25} wash={false} />
        </g>
      ) : (
        <EmpireHatch d="M0,0" cam={cam} opacity={0.01} wash={false} />
      )}
      {fd ? (
        <g mask="url(#shIn)">
          <path d={EMPIRE_T_D} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={0.1} />
          <path d={EMPIRE_T_D} fillRule="evenodd" fill="url(#tlxHatchAcc)" opacity={0.92} />
        </g>
      ) : null}
      {takenD ? <path d={takenD} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={0.3} /> : null}
      <g opacity={cream}>{seamsCream ? <path d={seamsCream} fill="none" stroke={INK} strokeWidth={px(1.4)} strokeOpacity={0.8} strokeLinejoin="round" /> : null}</g>
      {seamsOrange ? <path d={seamsOrange} fill="none" stroke={DARK} strokeWidth={px(4)} strokeOpacity={0.45} strokeLinejoin="round" /> : null}
      {seamsOrange ? <path d={seamsOrange} fill="none" stroke={ACCENT} strokeWidth={px(2)} strokeLinejoin="round" /> : null}
      {!done ? (
        <g mask="url(#shOut)" opacity={0.35 + 0.65 * cream}>
          <EmpireBorder d={ALL_BORDERS_D} cam={cam} solidity={1} />
        </g>
      ) : null}
      {fd ? (
        <g mask="url(#shIn)">
          <EnemyBorder d={ALL_BORDERS_D} cam={cam} />
          {/* the wet edge of the front: a moving ink line */}
          {!done ? (
            <g clipPath="url(#shEmp)">
              <path d={fd} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={px(9)} />
              <path d={fd} fill="none" stroke={ACCENT} strokeWidth={px(4.6)} />
            </g>
          ) : null}
        </g>
      ) : null}
    </WorldSvg>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const figAlpha = (hpx: number) => smoothstep((hpx - 10) / 11);
const dotR = (hpx: number) => Math.max(2, 0.235 * hpx);

const Cast: React.FC<{ frame: number; g: P2; S: number }> = ({ frame, g, S }) => {
  const pen = mkPen(S);
  const rd = riderAt(frame);
  const wr = warriorAt(frame);
  const broken = frame >= T.contact;
  const tc = frame - T.contact;
  const scr = (p: P2): P2 => [g[0] + p[0] * S, g[1] + p[1] * S];
  const U = S * UC;
  // the blades the blow took are cut out of the warrior's drawing
  const goneD = broken ? GONE.map((q) => `M${q.map((p) => scr(wr.club(p)).map((v) => v.toFixed(1)).join(",")).join("L")}Z`).join("") : "";
  return (
    <>
      <clipPath id="shGone">
        <path d={`M-4000,-4000H6000V8000H-4000Z${goneD}`} clipRule="evenodd" />
      </clipPath>
      <g clipPath={broken ? "url(#shGone)" : undefined}>
        <Warrior pose={wr.pose} at={scr(wr.o)} scale={U} uid="sh-w" />
      </g>
      <g transform={`translate(${g[0].toFixed(2)} ${g[1].toFixed(2)}) scale(${S.toFixed(5)})`}>
        <HorseRider
          pen={pen}
          phase={horsePhase(frame)}
          uid="hero"
          rider={false}
          reinTo={rd.rein}
          under={broken ? CHIPS.map((c, i) => (tc < CHIP_OUT[i] ? <Chip key={i} pen={pen} at={chipAt(i, tc)} rot={c.rot0 + c.spin * tc} r={c.r} seed={c.seed} /> : null)) : null}
        />
      </g>
      <Conquistador pose={rd.pose} at={scr(rd.o)} scale={U} uid="sh-c" sword={{ g: rd.grip, dir: rd.dirDeg }} scab={SCAB_REST + 6} steel={{ lead: null, all: true }} sheathed={false} />
    </>
  );
};

const SteelAndHorses: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { ppm, S, g, cam } = viewAt(frame);
  const pen = mkPen(S);
  const hpx = ppm * 1.7;
  const fa = figAlpha(hpx);
  // in the hold the block moves a few px inland
  const adv = -7 * smoothstep((frame - 168) / 21);
  const toScreen = (xm: number, yUp: number): P2 => [g[0] + xm * ppm, g[1] - yUp * ppm];
  const onScreen = (p: P2, m: number) => p[0] > -m && p[0] < FRAME_W + m && p[1] > -m && p[1] < FRAME_H + m;
  const showBand = hpx < 420;
  const dots: P2[] = [];
  if (fa < 0.999) {
    for (const m of BAND) dots.push(toScreen(m.ax, m.ay));
    dots.push(toScreen(-0.08, DOT_UP));
  }
  const r = dotR(hpx);
  const cs = Math.min(1.3, 0.2 * r);
  return (
    <AbsoluteFill style={{ backgroundColor: LAND }}>
      {cam.k < K_MAP ? (
        <AbsoluteFill style={{ opacity: smoothstep((K_MAP - cam.k) / (K_MAP - 12.5)) }}>
          <MapStack cam={cam} mottleOpacity={0} />
        </AbsoluteFill>
      ) : null}
      <Mottle cam={cam} />
      <Empire cam={cam} frame={frame} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {/* the men as dots (one dot = one man), under the figures they grow out of */}
        {dots.length ? (
          <g opacity={1 - fa} transform={`translate(${adv.toFixed(2)} 0)`}>
            {/* the block's dark plate: it stays a block whatever the land under it does */}
            <rect x={toScreen(FILE0, 0)[0] - 1.5 * PITCH * ppm} y={toScreen(0, DOT_UP + 4.5 * PITCH)[1] - 1.5 * PITCH * ppm} width={(COLS - 1 + 3) * PITCH * ppm} height={(ROWS - 1 + 3) * PITCH * ppm} rx={0.8 * PITCH * ppm} fill={DARK} fillOpacity={0.92} stroke={DARK} strokeWidth={3} />
            <rect x={toScreen(FILE0, 0)[0] - 1.5 * PITCH * ppm} y={toScreen(0, DOT_UP + 4.5 * PITCH)[1] - 1.5 * PITCH * ppm} width={(COLS - 1 + 3) * PITCH * ppm} height={(ROWS - 1 + 3) * PITCH * ppm} rx={0.8 * PITCH * ppm} fill="none" stroke="#FFC83A" strokeWidth={1.8} />
            <circle cx={dots[dots.length - 1][0]} cy={dots[dots.length - 1][1]} r={r + 2.4} fill={DARK} fillOpacity={0.82} />
            {dots.map((d, i) => (onScreen(d, 8) ? <circle key={`c${i}`} cx={d[0]} cy={d[1]} r={r + cs / 2} fill={DARK} fillOpacity={0.62} /> : null))}
            {dots.map((d, i) => (onScreen(d, 8) ? <circle key={`f${i}`} cx={d[0]} cy={d[1]} r={r - cs / 2} fill="#FFC83A" /> : null))}
          </g>
        ) : null}
        {fa > 0.001 ? (
          <g opacity={fa}>
            {/* the band: foot with pikes, riders spaced among them */}
            {showBand
              ? BAND.map((m) => {
                  const p = toScreen(m.gx, m.gy);
                  if (!onScreen(p, m.rider ? 1.7 * ppm : 0.6 * ppm) && !onScreen([p[0], p[1] - 2.8 * ppm], 0.6 * ppm)) return null;
                  return (
                    <g key={m.i} transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) scale(${S.toFixed(5)})`}>
                      {m.rider ? <HorseRider pen={pen} phase={horsePhase(frame) + m.ph} uid={`r${m.i}`} /> : <FootSoldier pen={pen} phase={frame / 22 + m.ph} tilt={m.tilt} uid={`s${m.i}`} />}
                    </g>
                  );
                })
              : null}
            <Cast frame={frame} g={g} S={S} />
          </g>
        ) : null}
      </svg>
      <PaperTop />
    </AbsoluteFill>
  );
};

export default SteelAndHorses;

/** review sheet: the cast at one size (S px per cm) */
export const SteelAndHorsesSheet: React.FC<{ S?: number; frame?: number }> = ({ S = 2.6, frame = 60 }) => {
  const pen = mkPen(S);
  return (
    <AbsoluteFill style={{ backgroundColor: LAND }}>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <Cast frame={frame} g={[720, 1100]} S={S} />
        <g transform={`translate(300 1800) scale(${S})`}>
          <FootSoldier pen={pen} phase={0.1} uid="s1" />
        </g>
        <g transform={`translate(760 1800) scale(${S})`}>
          <HorseRider pen={pen} phase={0.4} uid="r1" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
