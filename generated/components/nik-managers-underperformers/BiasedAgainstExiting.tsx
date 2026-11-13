// ---------------------------------------------------------------------------
// BiasedAgainstExiting (nik-managers-underperformers, cut 14). Cheeky Pint style, the picture-book world
// (styles/cheeky-pint.md). Opaque 1080x1920, 23.976 fps, 77 frames. The office is officeRoom.tsx (wall, golden
// windows, light patch, the door with its EXIT sign, desks, chairs) on officeTokens.ts; the people are officeCast.tsx.
//
// CHECK LINE: "The manager finds the underperformer asleep at his desk and, instead of showing him the door, tucks a
// blanket over him."
//
// THE LINE: "(The problem is that a lot of managers are inherently) biased against exiting underperformers."
// WORD -> FRAME (brief, 23.976 fps): (inherently) 0-12 · biased 12 · against 26 · exiting 37 · underperformers 48
// (ends 74) · cut 77.
// DURATION: the slot 14.097 -> 17.309 s = 3.212 s x 23.976 = 77 frames (f0..f76).
//
// THE MOTION: one eased pull-out with a small truck right, already moving at f0 (an ease-out from a close on the
// sleeper slumped asleep on his desk, "z"s rising; nothing of the manager in frame, the door hidden) to the resolved wide
// (settled ~f48), then a slow push back in toward the pair (+4 % by f76, still closing in at the cut).
// f1-12 the manager comes in standing over the sleeper, a fond small smile, eye on him, holding a plum blanket (cream
// stripe, fringe) by its top edge out ahead of him in both hands (by "biased", f12).
// f18-34 he leans in and lays it over the sleeper's back and shoulders in one soft sweep: the hanging shape blends point
// by point into the drape along the sleeper's back, the shoulder end first. CONTACT f31 (the leading edge on his
// shoulders, CONTACT), the hip end and the hem after it; all of it settled by f42 (SETTLED). The sleeper sinks 4 px under
// it (f36-50). The near hand stays on the blanketed back and pats it once (f44-52); the far hand goes back to his side.
// f50-60 he straightens a little, his face up and his eye away from the sleeper, toward the room, and brings one finger
// to his lips, "shh" (finger out f57-61); the bigger snore "z" leaves at f54. Holds to the cut with a tiny sway.
// AMBER = the EXIT sign only: the exit nobody uses. The blanket is plum (CLOTH.plum) and cream; cream = the subject
// (the sleeper's jumper, the "z"s), board = context. Nothing else glows; the bloom is fixed.
//
// SOURCES: none (no real figures, no logos).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { CLOTH, HAIR, MGR, Manager, RIG, SKIN, SLEEPER, Sleeper, managerEye, sleeperZSource, type Look, type ManagerPose, type P2 } from "./officeCast";
import { Desk, FloorShadow, Monitor, OfficeStage, ROOM, WALL_F, toScreen, wallPt, type OfficeCam } from "./officeRoom";
import { OFFICE } from "./officeTokens";

export const FPS = 24000 / 1001;
export const DURATION = 77;
/** castProbe (review only): the three figures at rest (the f0 poses) under the resolved wide's camera */
export const schema = z.object({ castProbe: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ss5 = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const lerpP = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// --- the layout (world px on the floor plane = screen px in the resolved wide) ---------------------------------------
const FLOOR = ROOM.floorY;
const SEAT_S = 1.25;
const MGR_S = 1.35;
const HIP_Y = FLOOR - RIG.floor * SEAT_S;
const DESK_LOCAL = -112;
const DESK_TOP = HIP_Y + DESK_LOCAL * SEAT_S;
const SLEEPER_X = 650;
const DESK = { x0: 30, x1: SLEEPER_X - 140 * SEAT_S };
/** between the sleeper's chair back and the door, a strip of wall clear on both sides of him */
const MGR_X = 846;
const MGR_HIP_Y = FLOOR + 6 - MGR.legs * MGR_S;

const SLEEPER_LOOK: Look = { skin: SKIN.light, hair: HAIR.chestnut, hairStyle: "curly", top: CLOTH.oat, pants: CLOTH.denim };
/** the manager: a cream shirt with the sleeves rolled, a dark blue-grey waistcoat and trousers, a plum tie (he separates
 *  from the caramel wall in value, and his cream arm from his dark waistcoat) */
const SUIT = mixHex(CLOTH.denim, COLOR.shadow, 0.3);
const MGR_LOOK: Look = { skin: SKIN.tan, hair: HAIR.grey, hairStyle: "part", top: CLOTH.cream, vest: SUIT, pants: SUIT, tie: CLOTH.plum };

// --- the camera ----------------------------------------------------------------------------------------------------
/** close on the sleeper's head (screen ~522, 880 at k 2.4) -> the resolved wide; then a slow push back in */
const SLEEPER_HEAD: P2 = [SLEEPER_X - 190 * SEAT_S, HIP_Y - 208 * SEAT_S];
const CLOSE = { k: 2.4, x: SLEEPER_HEAD[0] + (540 - 522) / 2.4, y: SLEEPER_HEAD[1] + (960 - 880) / 2.4 };
/** the resolved wide: the sleeper's head at screen x ~250, the manager ~620-800, the door and its sign right of him;
 *  feet at ~y 1540 */
const WIDE = { k: 1.2, x: 654, y: 917 };
const PULL_END = 48;
/** an ease-out from f0 (the move is already under way when the cut opens) */
const pullU = (f: number) => 1 - Math.pow(1 - c01(f / PULL_END), 3);
/** the push back in: its rate ramps up over f40-56 and holds, so the frame is still closing in at the cut (the
 *  integral of the ramp, normalised to 1 at f76); +PUSH in scale by f76, about the screen point PUSH_AT */
const PUSH = 0.04;
const PUSH_AT: P2 = [850, 800];
const PUSH_TABLE = (() => {
  const t = [0];
  for (let f = 1; f <= DURATION + 1; f++) t.push(t[f - 1] + ss(40, 56, f - 0.5));
  return t.map((v) => v / t[DURATION - 1]);
})();
const pushP = (f: number) => {
  const i = Math.max(0, Math.min(DURATION, Math.floor(f)));
  return lerp(PUSH_TABLE[i], PUSH_TABLE[i + 1], c01(f - i));
};
export const camAt = (f: number): OfficeCam => {
  const u = pullU(f);
  const k0 = Math.exp(lerp(Math.log(CLOSE.k), Math.log(WIDE.k), u));
  const x0 = lerp(CLOSE.x, WIDE.x, u);
  const y0 = lerp(CLOSE.y, WIDE.y, u);
  const k = k0 * (1 + PUSH * pushP(f));
  // the world point under PUSH_AT stays put
  const d = 1 / k0 - 1 / k;
  return { k, x: x0 + (PUSH_AT[0] - 540) * d, y: y0 + (PUSH_AT[1] - 960) * d };
};

// --- the manager's gesture -----------------------------------------------------------------------------------------
const add = (p: P2, q: P2): P2 => [p[0] + q[0], p[1] + q[1]];
const sub = (p: P2, q: P2): P2 => [p[0] - q[0], p[1] - q[1]];
const mul = (p: P2, k: number): P2 => [p[0] * k, p[1] * k];
const rotP = (p: P2, deg: number): P2 => {
  const c = Math.cos((deg * Math.PI) / 180);
  const sn = Math.sin((deg * Math.PI) / 180);
  return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c];
};
const mgrWorld = (p: P2): P2 => [MGR_X + p[0] * MGR_S, MGR_HIP_Y + p[1] * MGR_S];
const mgrLocal = (p: P2): P2 => [(p[0] - MGR_X) / MGR_S, (p[1] - MGR_HIP_Y) / MGR_S];

/** THE BLANKET: a plum card blanket with a cream stripe and a fringe, held hanging by its top edge, then laid over the
 *  sleeper's back and shoulders. One shape (top edge u 0..1, depth v 0..1) in two states: HANGING from his hands, and
 *  DRAPED along the sleeper's back (u 0 at his shoulders by his neck, u 1 past his hip), blended point by point, the
 *  leading (shoulder) end first. */
export const BLANKET = { fill: CLOTH.plum, stripe: mixHex(COLOR.cream, CLOTH.plum, 0.22), w: 150, h: 172 } as const;
/** the draped edges in the sleeper's torso frame (before his lean; + x = his back): the top along his back, the lower
 *  edge down his near side */
const DRAPE_TOP: P2[] = [[-84, -212], [-48, -228], [-6, -212], [22, -174], [33, -110], [36, -40], [44, 36]];
const DRAPE_BOT: P2[] = [[-96, -170], [-70, -174], [-46, -158], [-30, -118], [-26, -64], [-16, -6], [6, 52]];
const along = (pts: P2[], u: number): P2 => {
  const t = c01(u) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(t));
  return lerpP(pts[i], pts[i + 1], t - i);
};
/** the sleeper settles a few px under it */
const sinkAt = (f: number) => 4 * ss(36, 50, f);
const sleeperLean = (f: number) => SLEEPER.lean + 1.3 * breathAt(f);
const drapedAt = (f: number, u: number, v: number): P2 => {
  const q = rotP(lerpP(along(DRAPE_TOP, u), along(DRAPE_BOT, u), v), sleeperLean(f));
  return [SLEEPER_X + q[0] * SEAT_S, HIP_Y + sinkAt(f) + q[1] * SEAT_S];
};

/** the hands (hip frame): holding the top edge at chest height, both in front of him (f0-18); leaning in, they carry it
 *  down to the sleeper's back (f18-32) and let it go; the near hand rests on it, pats once (f44-52) and comes up to his
 *  lips, "shh" (f52-60); the far hand goes back to his side */
const HOLD_N: P2 = [-104, -128];
const HOLD_F: P2 = [16, -128];
/** by f12 he holds it out ahead of him toward the sleeper, at arm's length (f0: still in front of his body, off frame) */
const PRESENT_N: P2 = [-186, -142];
const PRESENT_F: P2 = [-74, -150];
const PRESENT = [1, 12] as const;
const LEAN_IN = [18, 32] as const;
export const CONTACT = 31;
/** the blend weight of a blanket point: the shoulder end (u 0) lands first (CONTACT), the hip end and the hem last;
 *  every point settled by f42 */
const blendW = (f: number, u: number, v: number) => ss5(20 + 4 * u + 2 * v, CONTACT + 7 * u + 4 * v, f);
export const SETTLED = CONTACT + 7 + 4;
const PAT = [44, 52] as const;
const SHH = [52, 60] as const;
const nearRestOnBack = (f: number): P2 => add(mgrLocal(drapedAt(f, 0.58, 0)), [4, -6]);
const handPath = (f: number) => {
  const li = ss5(LEAN_IN[0], LEAN_IN[1], f);
  const relN = mgrLocal(drapedAt(f, 0.4, 0));
  const relF = mgrLocal(drapedAt(f, 0.85, 0));
  // carried: from the hold to just above the back, the near hand ahead
  const pr = ss5(PRESENT[0], PRESENT[1], f);
  const carryN = lerpP(lerpP(HOLD_N, PRESENT_N, pr), add(relN, [26, -22]), li);
  const carryF = lerpP(lerpP(HOLD_F, PRESENT_F, pr), add(relF, [4, -20]), li);
  return { carryN, carryF };
};
export const managerPose = (f: number): ManagerPose & { carry: { n: P2; f: P2 }; finger: number; lips: P2; fist: P2; fingerBase: P2; fingerTip: P2 } => {
  const li = ss5(LEAN_IN[0], LEAN_IN[1] + 2, f);
  const up = ss5(SHH[0] - 2, SHH[1], f);
  const sway = Math.sin((f - 60) * 0.12) * ss(56, 70, f);
  const idle = Math.sin(f * 0.16) * (1 - li);
  const lean = lerp(lerp(0, -22, li), -8, up) + 0.4 * sway;
  const tilt = lerp(lerp(-6, -16, li), 4, up) + 0.3 * sway;
  const look = lerpP(lerpP([-3, 7], [-3, 9], li), [3, 0], up);
  const head = managerEye({ lean, tilt, look }).head;
  const R = RIG.R * MGR.headK;
  const hl = (q: P2) => add(head, rotP([q[0] * R, q[1] * R], lean + tilt));
  const lips = hl([-0.76, 0.44]);
  // "shh": the fist in front of and below the mouth line, clear of the chin; the finger stands vertical across the lips
  // with its tip at nose height
  const fist = hl([-0.9, 0.96]);
  const fingerBase = hl([-0.82, 0.76]);
  const fingerTip = hl([-0.8, 0.1]);
  const { carryN, carryF } = handPath(f);
  const idleOff: P2 = [0, 1.6 * idle];
  // near hand: carry -> rest on the back (from the release) -> one pat -> up to his lips
  const rel = ss5(LEAN_IN[1] - 2, LEAN_IN[1] + 6, f);
  const pat = f > PAT[0] && f < PAT[1] ? Math.sin((Math.PI * (f - PAT[0])) / (PAT[1] - PAT[0])) : 0;
  let near = lerpP(add(carryN, idleOff), nearRestOnBack(f), rel);
  near = add(near, [0, -18 * pat]);
  near = lerpP(near, fist, up);
  // far hand: carry -> after the release, back down to his side (behind him once it is past his front)
  // hanging at his side, hidden behind his body and near leg
  const home: P2 = [-36, 28];
  const back = ss5(LEAN_IN[1] + 2, LEAN_IN[1] + 16, f);
  const far = lerpP(add(carryF, idleOff), home, back);
  return {
    lean,
    tilt,
    near: { at: near, a: lerp(lerp(0, -20, rel), -70, up), thumb: up > 0.5 ? 1 : -1 },
    far: { at: far, a: lerp(0, -10, back), thumb: -1, behind: far[0] > -100 && back > 0.5 },
    closed: 0,
    look,
    mouth: ss(SHH[1] - 3, SHH[1] + 1, f) > 0.5 ? "pucker" : "smile",
    smile: lerp(0.45, 0.25, up),
    carry: { n: add(carryN, idleOff), f: add(carryF, idleOff) },
    finger: ss(SHH[1] - 3, SHH[1] + 1, f),
    lips,
    fist,
    fingerBase,
    fingerTip,
  };
};

/** the blanket's outline (world) at frame f: top edge u 0..1, the hip side down, the hem back, the shoulder side up */
const NU = 9;
const blanketPt = (f: number, pose: ReturnType<typeof managerPose>, u: number, v: number): P2 => {
  // hanging from the carried hands (gravity straight down), the near hand a little in from the leading corner
  const n = mgrWorld(pose.carry.n);
  const fw = mgrWorld(pose.carry.f);
  const d = sub(fw, n);
  const e = mul(d, 1 / Math.max(1e-6, Math.hypot(d[0], d[1])));
  const W = BLANKET.w * MGR_S;
  const tl = sub(n, mul(e, 0.07 * W));
  const hang = add(add(tl, mul(e, W * u)), [0, BLANKET.h * MGR_S * v]);
  return lerpP(hang, drapedAt(f, u, v), blendW(f, u, v));
};
const blanketOutline = (f: number, pose: ReturnType<typeof managerPose>): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < NU; i++) out.push(blanketPt(f, pose, i / (NU - 1), 0));
  for (const v of [0.34, 0.67]) out.push(blanketPt(f, pose, 1, v));
  for (let i = NU - 1; i >= 0; i--) out.push(blanketPt(f, pose, i / (NU - 1), 1));
  for (const v of [0.67, 0.34]) out.push(blanketPt(f, pose, 0, v));
  return out;
};
/** a closed Catmull-Rom path through the points (soft cloth corners) */
const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = add(p1, mul(sub(p2, p0), 1 / 6));
    const c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + "Z";
};
const Blanket: React.FC<{ f: number; pose: ReturnType<typeof managerPose> }> = ({ f, pose }) => {
  const outline = blanketOutline(f, pose);
  const band = (v0: number, v1: number) => {
    const pts: P2[] = [];
    for (let i = 0; i < NU; i++) pts.push(blanketPt(f, pose, i / (NU - 1), v0));
    for (let i = NU - 1; i >= 0; i--) pts.push(blanketPt(f, pose, i / (NU - 1), v1));
    return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("") + "Z";
  };
  const fringe: React.ReactNode[] = [];
  for (let i = 1; i < 12; i++) {
    const u = i / 12;
    const a = blanketPt(f, pose, u, 1);
    const b = blanketPt(f, pose, u, 0.93);
    const dir = sub(a, b);
    const e = mul(dir, 9 / Math.max(1e-6, Math.hypot(dir[0], dir[1])));
    fringe.push(<path key={i} d={`M${a[0].toFixed(2)} ${a[1].toFixed(2)}l${e[0].toFixed(2)} ${e[1].toFixed(2)}`} stroke={mixHex(BLANKET.fill, COLOR.shadow, 0.1)} strokeWidth={4} strokeLinecap="round" />);
  }
  const top: P2[] = [];
  for (let i = 0; i < NU; i++) top.push(blanketPt(f, pose, i / (NU - 1), 0.02));
  return (
    <g>
      {fringe}
      <path d={smoothClosed(outline)} fill={BLANKET.fill} />
      <path d={band(0.74, 0.8)} fill={BLANKET.stripe} />
      <path d={band(0.85, 0.88)} fill={BLANKET.stripe} />
      {/* the folded top hem, a shade lighter */}
      <path d={top.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("")} stroke={mixHex(BLANKET.fill, COLOR.cream, 0.2)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
};

// --- the "z"s: card letters rising from the back of his head, draining into the wall tone as they go -----------------
const Z_PERIOD = 22;
const Z_LIFE = 88;
/** THE SNORE: a deeper breath in (f44-53) and out, and one big "z" leaves at SNORE_Z */
const SNORE_Z = 54;
const breathAt = (f: number) => {
  const base = Math.sin((f / 60) * Math.PI * 2 + 0.6);
  const deep = lerp(1.25, -1.1, ss(52, 60, f));
  return lerp(base, deep, ss(44, 52, f) * (1 - ss(60, 70, f)));
};
const zSourceWorld = (f: number): P2 => {
  const p = sleeperZSource(breathAt(f));
  return [SLEEPER_X + p[0] * SEAT_S, HIP_Y + p[1] * SEAT_S];
};
/** a "z"'s path: up from his head, bending back to the left (away from the manager) */
const zPos = (src: P2, age: number, i: number, big: boolean) => ({
  x: src[0] + age * (big ? 1.5 : 1.2) - 0.016 * age * age + 10 * Math.sin(age * 0.08 + i * 1.7),
  y: src[1] - age * (big ? 3.1 : 2.9),
});
/** the live "z"s at f: centre and size (world) */
const zsAt = (f: number) => {
  const out: { x: number; y: number; size: number }[] = [];
  for (let i = -6; i < 7; i++) {
    const big = i === 6;
    const birth = big ? SNORE_Z : i * Z_PERIOD;
    const age = f - birth;
    if (age < 0 || age > Z_LIFE) continue;
    const { x, y } = zPos(zSourceWorld(birth), age, i, big);
    out.push({ x, y, size: (30 + age * 0.4) * (big ? 1.5 : 1) });
  }
  return out;
};
const Zs: React.FC<{ f: number }> = ({ f }) => {
  const out: React.ReactNode[] = [];
  for (let i = -6; i < 7; i++) {
    const big = i === 6;
    const birth = big ? SNORE_Z : i * Z_PERIOD;
    const age = f - birth;
    if (age < 0 || age > Z_LIFE) continue;
    const src = zSourceWorld(birth);
    const { x, y } = zPos(src, age, i, big);
    const size = (30 + age * 0.4) * (big ? 1.5 : 1);
    const a = -14 + 9 * Math.sin(age * 0.06 + i);
    const drain = ss(34, Z_LIFE, age);
    const fill = mixHex(COLOR.cream, OFFICE.wallTop, drain);
    const t = size * 0.27;
    const w = size * 0.8;
    const h = size;
    const d = `M${-w / 2} ${-h / 2}L${w / 2} ${-h / 2}L${-w / 2} ${h / 2}L${w / 2} ${h / 2}`;
    out.push(
      <g key={i} transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${a.toFixed(3)})`}>
        <path d={d} transform="translate(2 4)" stroke={COLOR.shadow} strokeWidth={t} strokeLinejoin="round" strokeLinecap="round" fill="none" opacity={0.18 * (1 - drain)} style={{ filter: "blur(2px)" }} />
        <path d={d} stroke={fill} strokeWidth={t} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// --- probes (screen space) -----------------------------------------------------------------------------------------
const inPoly = (p: P2, poly: P2[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** both faces clear (world): his eye, mouth and head centre not under the blanket or a hand (bar the "shh" hand at
 *  his lips), the sleeper's face not under the blanket */
const facesClear = (f: number) => {
  const pose = managerPose(f);
  const poly = blanketOutline(f, pose);
  const { head, eye } = managerEye(pose);
  const pts = [head, eye, pose.lips].map(mgrWorld);
  if (pts.some((p) => inPoly(p, poly))) return false;
  for (const h of [pose.near, pose.far]) {
    if (h === pose.near && f >= SHH[0]) continue;
    const hw = mgrWorld(h.at);
    if (pts.some((p) => Math.hypot(p[0] - hw[0], p[1] - hw[1]) < (17 + 8) * MGR_S)) return false;
  }
  const sh = SLEEPER_HEAD;
  const sMouth = add(sh, rotP([-0.74 * RIG.R * SEAT_S, 0.48 * RIG.R * SEAT_S], SLEEPER.tilt));
  return !inPoly(sh, poly) && !inPoly(sMouth, poly);
};

export const debugAt = (f: number) => {
  const cam = camAt(f);
  const pose = managerPose(f);
  const S = (p: P2, wf = 1) => toScreen(cam, p[0], p[1], wf).map((v) => Math.round(v));
  const sg = ROOM.sign;
  const D = ROOM.door;
  const R = RIG.R * MGR.headK;
  const { head } = managerEye(pose);
  const nose = add(head, rotP([-0.97 * R, 0.1 * R], pose.lean + pose.tilt));
  const outline = blanketOutline(f, pose);
  const topEdge: P2[] = [];
  for (let i = 0; i < NU; i++) topEdge.push(blanketPt(f, pose, i / (NU - 1), 0));
  return {
    cam,
    sleeperHead: S(SLEEPER_HEAD),
    managerHead: S(mgrWorld(head)),
    /** the leftmost screen x of his head (the nose tip) and of his hands */
    mgrHeadLeft: S(mgrWorld(nose))[0] - Math.round(0.19 * R * MGR_S * cam.k),
    handsLeft: Math.min(S(mgrWorld(pose.near.at))[0], S(mgrWorld(pose.far.at))[0]) - Math.round(17 * MGR_S * cam.k),
    blanket: outline.map((p) => S(p)),
    blanketTop: topEdge.map((p) => S(p)),
    sign: [S(wallPt(sg.cx - sg.w / 2, sg.y0), WALL_F), S(wallPt(sg.cx + sg.w / 2, sg.y0 + sg.h), WALL_F)],
    doorLeft: S(wallPt(D.x0 - 18, D.y0), WALL_F)[0],
    /** the sleeper's chair back (right edge) and the manager's front shoe tip / back (screen x) */
    chairBack: S([SLEEPER_X + 46 * SEAT_S, HIP_Y])[0],
    mgrFront: S(mgrWorld([-94, 0]))[0],
    mgrBack: S(mgrWorld([30, 0]))[0],
    facesClear: facesClear(f),
  };
};

(() => {
  // BAE_PROBE=1 (probe scripts only): print instead of throwing
  const probe = typeof process !== "undefined" && !!process.env?.BAE_PROBE;
  const fail = (m: string) => {
    if (probe) console.log(`CHECK: ${m}`);
    else throw new Error(`BiasedAgainstExiting: ${m}`);
  };
  // amber only on the EXIT sign: the blanket is plum and cream
  const amber = [COLOR.amberTop, COLOR.amberFoot, COLOR.amberHot].map((c) => c.toLowerCase());
  if ([BLANKET.fill, BLANKET.stripe].some((c) => amber.includes(c.toLowerCase()))) fail("amber outside the EXIT sign");
  // f0: the door hidden (its bloom included); no part of him in frame (the blanket's corner may show)
  const d0 = debugAt(0);
  if (d0.doorLeft < 1080 + 60) fail("the door shows at f0");
  if (d0.mgrHeadLeft < 1080 + 4 || d0.handsLeft < 1080 + 4 || d0.mgrFront < 1080 + 4) fail(`a part of the manager is in frame at f0 (head ${d0.mgrHeadLeft}, hands ${d0.handsLeft})`);
  // the blanket lands shoulder end first and has settled everywhere by f44
  if (CONTACT > 40 || SETTLED > 44) fail(`the blanket lands at f${CONTACT} and settles at f${SETTLED} (must be <= f44)`);
  for (let i = 0; i <= 10; i++) for (const v of [0, 0.5, 1]) if (blendW(44, i / 10, v) < 1) fail("the blanket is still moving at f44");
  for (let f = 0; f < DURATION; f++) if (!facesClear(f)) fail(`a face is covered at f${f}`);
  // no "z" over the manager's head (nose included) or his hands
  for (let f = 0; f < DURATION; f++) {
    const pose = managerPose(f);
    const R = RIG.R * MGR.headK * MGR_S;
    const { head } = managerEye(pose);
    const nose = add(head, rotP([-0.97 * RIG.R * MGR.headK, 0.1 * RIG.R * MGR.headK], pose.lean + pose.tilt));
    const discs: [P2, number][] = [[mgrWorld(head), R], [mgrWorld(nose), 0.19 * R], [mgrWorld(pose.near.at), 17 * MGR_S], [mgrWorld(pose.fist), 17 * MGR_S]];
    for (const zz of zsAt(f)) {
      const zr = zz.size * 0.65;
      for (const [c, r] of discs) if (Math.hypot(zz.x - c[0], zz.y - c[1]) < zr + r + 4) fail(`a "z" crosses the manager at f${f}`);
    }
  }
  const inBand = (y: number) => (y > 1080 && y < 1250) || (y > 1360 && y < 1460);
  for (let f = 0; f < DURATION; f++) {
    const d = debugAt(f);
    if (inBand(d.sleeperHead[1]) || inBand(d.managerHead[1])) fail(`a face in a caption band at f${f}`);
    // the held top edge whole; once laid, its shoulder half (the rest follows his back down into the band, as the back does)
    const n = f < 20 ? NU : Math.ceil(NU / 2);
    for (const p of d.blanketTop.slice(0, n)) if (p[0] > 0 && p[0] < 1080 && inBand(p[1])) fail(`the blanket's top edge in a caption band at f${f}`);
    for (const p of d.sign) if (inBand(p[1])) fail(`the sign in a caption band at f${f}`);
  }
  // the resolved wide: the sign in frame with >= 40 px of wall to its right, the door clear of him, wall between the
  // chair back and his feet, the sleeper's face clear of the left edge
  for (let f = 48; f < DURATION; f++) {
    const d = debugAt(f);
    const [a, b] = d.sign;
    if (a[0] < 0 || b[0] > 1040) fail(`the EXIT sign is within 40 px of the right edge at f${f} (${b[0]})`);
    if (b[0] - a[0] < 170) fail(`the EXIT sign is only ${b[0] - a[0]} px wide at f${f}`);
    if (d.doorLeft < d.mgrBack + 8) fail(`he stands in front of the door at f${f}`);
    if (d.mgrFront < d.chairBack + 12) fail(`no wall between the chair back and his feet at f${f}`);
    if (d.sleeperHead[0] < 200) fail(`the sleeper's head is near the left edge at f${f}`);
  }
})();

// --- the cut -------------------------------------------------------------------------------------------------------
const BiasedAgainstExiting: React.FC<z.infer<typeof schema>> = ({ castProbe }) => {
  const frame = useCurrentFrame();
  const f = castProbe ? 0 : frame;
  const cam = castProbe ? camAt(PULL_END) : camAt(f);
  const breath = breathAt(f);
  const pose = managerPose(f);
  // the blanket and the "shh" finger, drawn in world coords inside his group (over his body, under his near arm and
  // hands)
  // the "shh" finger: a short rounded bar from the fist up across the lips, a touch lighter than the face it crosses,
  // with its one soft shadow
  const tipNow = lerpP(pose.fingerBase, pose.fingerTip, pose.finger);
  const fd = `M${pose.fingerBase[0].toFixed(2)} ${pose.fingerBase[1].toFixed(2)}L${tipNow[0].toFixed(2)} ${tipNow[1].toFixed(2)}`;
  const finger =
    pose.finger > 0 ? (
      <>
        <path d={fd} transform="translate(3 2)" stroke={COLOR.shadow} strokeWidth={11} strokeLinecap="round" opacity={0.22} style={{ filter: "blur(1.5px)" }} />
        <path d={fd} stroke={mixHex(MGR_LOOK.skin, COLOR.cream, 0.22)} strokeWidth={11} strokeLinecap="round" />
      </>
    ) : null;
  const front = (
    <>
      <g transform={`scale(${(1 / MGR_S).toFixed(6)}) translate(${-MGR_X} ${-MGR_HIP_Y})`}>
        <Blanket f={f} pose={pose} />
      </g>
      {finger}
    </>
  );
  return (
    <OfficeStage S={f} cam={cam}>
      {/* the floor shadows (one per object group) */}
      <FloorShadow x0={DESK.x0 - 160} x1={DESK.x1 + 10} y={FLOOR} a={0.28} />
      <FloorShadow x0={SLEEPER_X - 190} x1={SLEEPER_X + 70} y={FLOOR} a={0.3} />
      <FloorShadow x0={MGR_X - 140} x1={MGR_X + 40} y={FLOOR + 6} a={0.32} />
      {/* his desk and his monitor (a line chart that sags and runs flat, toward him) */}
      <Desk x0={DESK.x0 - 400} x1={DESK.x1} top={DESK_TOP} floor={FLOOR} />
      <Monitor x={318} top={DESK_TOP} face={1} w={92} line="flat" />
      <Zs f={f} />
      <Sleeper x={SLEEPER_X} y={HIP_Y + sinkAt(f)} s={SEAT_S} look={SLEEPER_LOOK} desk={DESK_LOCAL - sinkAt(f) / SEAT_S} breath={breath} />
      <Manager x={MGR_X} y={MGR_HIP_Y} s={MGR_S} look={MGR_LOOK} pose={pose} front={front} />
    </OfficeStage>
  );
};

export default BiasedAgainstExiting;
