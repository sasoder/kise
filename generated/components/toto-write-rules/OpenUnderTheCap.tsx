// ---------------------------------------------------------------------------
// OpenUnderTheCap (toto-write-rules, cut 3). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 217 frames. REV 1 (the user's notes, notes/rev1_user_notes.md): ONE guided camera move,
// one thing at a time; the car is the real modern F1Car (rulesShared.tsx); amber = the engineers' upgrades fitted
// on real parts. Camera projection: toto-champion-eight/trackWorld.tsx (imported, never edited).
//
// CHECK LINE: "Toto's dream rules: one spending limit, $200M, and inside it the engineers can upgrade anything."
//
// THE LINE: "The innovation | part in me and listening to my engineers is free reign. Have a budget cap that is 200
// million and then make it as open as you want. | That would be magnificent..."
// WORD -> FRAME (from the comp start): part 8 · in 14 · me 21 · and 25 · listening 30 · to 37 · my 44 · engineers 47 ·
// is 58 · free 66 · reign 72 · have 89 · a 92 · budget 96 · cap 102 · that 108 · is 116 · 200 123 · million 136 ·
// and 146 · then 156 · make 162 · it 174 · as 178 · open 184 · as 191 · you 196 · want 200 (ends ~210).
// DURATION: the slot 3.760 -> 12.440 s = 8.68 s x 25 = 217 frames (f0..f216).
//
// THE MOTION (the camera leads the eye; one place at a time):
// f0-34 close and low on the cream F1 car's nose in a calm dark garage; the designer stands behind the nose, clear of
// the front tyre, with a tablet. f34-60 the camera trucks slowly along the car, nose to tail; as it passes each part ONE small amber
// idea bubble rises (the designer: front wing f30; the mechanic: sidepod f42, rear wing f52) and goes into its part.
// f58-72 the camera eases out to the whole car; the three new parts fit in place in sequence front to back (front wing
// f68, sidepod f76, rear wing f84): each lifts out of its seat, reshapes, warms to amber and seats. f92-140 the
// pull-out continues, craning up, to the whole plot; a low wall of banknote bricks builds up row by row round it
// (front and both sides, f100-118); then the "$200M" sign slides in along its pole's arm (f123-136). f152-182 the
// car rolls forward a metre towards the right-hand wall, wheels turning, and stops short of it with a small settle;
// then calm: a slow creep in, the mechanic wiping the rear wing.
// CAUSE -> EFFECT: each part's idea (bubble) goes into it before it is upgraded; the wall rises before the sign.
// AMBER = the engineers' upgrades only (bubbles, the three fitted parts). The wall is green/board, never amber.
// SOURCES: "$200M" is the budget cap Toto names in the line (spoken figure; no other numbers on screen). The car on
// champShared's approved true-scale 2022+ F1 outline.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM, GRAIN, GROUND, VIGNETTE, amberBandFor, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { OnLane, TRACK_COLOR, horizonY, laneK, planeCam, project, type TrackCam } from "../toto-champion-eight/trackWorld";
import { ENGINEER, ENGINEERS, Engineer, F1, F1Car, IdeaBubble, M, engineerHead, restPose, type EngineerPose, type EngineerSpec, type IdeaKind, type P2 } from "./rulesShared";

export const FPS = 25;
export const DURATION = 217;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ===========================================================================
// THE WORLD (metres; x across, h up, z depth away from the camera; the car's plane is z = 0)
// ===========================================================================
/** the car's cockpit x at rest, and how far it rolls at the end */
const CAR_C = -0.9;
const ROLL = 1.0;
/** the garage behind the car: open front at zF, back wall at zB, interior half-width X, opening H, facade top T */
const G = { X: 3.3, pillar: 0.35, zF: 1.7, zB: 5.6, H: 3.5, T: 4.1 } as const;
/** the cash wall: front run at z front, side runs at x +-X back to the garage front */
const WALL = { X: 3.75, front: -1.9, back: 1.7, H: 0.6, bundleH: 0.15, brickL: 0.62 } as const;
const FENCE = { bundleH: WALL.bundleH, brickL: WALL.brickL } as const;
/** the "$200M" sign on a pole just outside the front-right corner; the board slides in along the arm */
const SIGN = { poleX: 4.15, poleH: 3.3, x0: 2.05, x1: 3.75, h0: 2.5, h1: 3.18, z: -1.95, slide: 2.4 } as const;

// ===========================================================================
// BEATS
// ===========================================================================
export const BEAT = {
  fitFront: 68,
  fitSide: 76,
  fitRear: 84,
  fitLen: 11,
  stand: 90, // the designer stands up, pleased (f90-102)
  wallFrom: 100, // budget 96 .. cap 102 .. that 108
  wallTo: 118,
  signFrom: 123, // 200
  signTo: 136, // million
  rollFrom: 152,
  rollTo: 182,
  wipeFrom: 188,
} as const;

// ===========================================================================
// THE CAMERA: one move. Keys (frame, centre x m, k, eye m, ground y px pre-shift), eased between.
// ===========================================================================
const SHIFT = 190; // the user's standing "move it down" on 9:16 Cheeky Pint
const KEYS: { f: number; x: number; k: number; eye: number; gy: number }[] = [
  { f: 0, x: CAR_C + 2.55, k: 0.98, eye: 0.42, gy: 840 },
  { f: 34, x: CAR_C + 2.4, k: 1.0, eye: 0.42, gy: 840 },
  { f: 60, x: CAR_C - 1.75, k: 0.8, eye: 0.55, gy: 845 },
  { f: 72, x: CAR_C + 0.4, k: 0.43, eye: 1.0, gy: 850 },
  { f: 92, x: CAR_C + 0.42, k: 0.415, eye: 1.05, gy: 850 },
  { f: 140, x: 0.05, k: 0.258, eye: 3.1, gy: 770 },
  { f: 216, x: 0.12, k: 0.266, eye: 3.05, gy: 772 },
];
const D0 = 4.2 * M;
export const camAt = (f: number): TrackCam => {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1].f) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = clamp01((f - a.f) / (b.f - a.f));
  // the holds (28-..) are linear creeps; the moves are eased
  const e = i === 0 || i === 3 || i === 5 ? u : smoothstep(u) * smoothstep(u) * (3 - 2 * smoothstep(u)) * 0.5 + smoothstep(u) * 0.5;
  const k = Math.exp(lerp(Math.log(a.k), Math.log(b.k), e));
  return {
    x: lerp(a.x, b.x, e) * M,
    k,
    D: D0 * Math.pow(1.0 / k, 0.8),
    eye: lerp(a.eye, b.eye, e) * M,
    groundY: lerp(a.gy, b.gy, e),
    dx: 0,
    dy: SHIFT + 0.8 * Math.sin(f / 23),
  };
};
/** a world point on lane zFrom -> the world point on lane zTo that lands on the same screen pixel */
const toLane = (cam: TrackCam, wx: number, wy: number, zFrom: number, zTo: number): P2 => {
  const s = project(cam, wx, wy, zFrom);
  const kB = laneK(cam, zTo);
  return [cam.x + (s[0] - 540 - (cam.dx ?? 0)) / kB, (s[1] - (horizonY(cam) + cam.eye * kB) - (cam.dy ?? 0)) / kB];
};

// ===========================================================================
// THE CAR OVER TIME
// ===========================================================================
const rollAt = (f: number) => ROLL * ss5(BEAT.rollFrom, BEAT.rollTo, f);
const carX = (f: number) => (CAR_C + rollAt(f)) * M;
/** the body's pitch settle when it stops (world px, + = up at the cockpit) */
const bobAt = (f: number) => {
  const t = f - BEAT.rollTo + 3;
  return t > 0 ? -0.012 * M * Math.exp(-t / 5) * Math.sin(t / 2.2) : 0;
};
const fitAt = (f: number) => ({
  frontWing: clamp01((f - BEAT.fitFront) / BEAT.fitLen),
  sidepod: clamp01((f - BEAT.fitSide) / BEAT.fitLen),
  rearWing: clamp01((f - BEAT.fitRear) / BEAT.fitLen),
});

// ===========================================================================
// THE CREW: the designer (kneeling behind the front wheel with a tablet, then stands) and the mechanic
// ===========================================================================
type Crew = { id: "designer" | "mech"; spec: EngineerSpec; x: number; z: number; face: 1 | -1 };
const SIZE = 1.64; // 440 rig px -> 1.8 m
const CREW: Record<Crew["id"], Crew> = {
  designer: { id: "designer", spec: ENGINEERS.designer, x: CAR_C + 2.9, z: 0.75, face: 1 },
  mech: { id: "mech", spec: ENGINEERS.mech, x: CAR_C + 1.0 - 2.05, z: 0.85, face: -1 },
};
/** how far the designer is sunk: 0 (she stands behind the nose, her own shape, clear of the front tyre) */
const kneelAt = (f: number) => 0 * M * (1 - ss5(BEAT.stand, BEAT.stand + 12, f));
const blinkOf = (f: number, seeds: number[]) => {
  for (const b of seeds) {
    const u = f - b;
    if (u >= 0 && u < 5) return [0.5, 1, 1, 0.6, 0.2][Math.floor(u)];
  }
  return 0;
};
const mix = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const liftHand = (f: number, at: number, down: number) => ss(at, at + 7, f) * (1 - ss(down, down + 10, f));
/** a world point on the car's lane -> a crew member's hip-local hand target (rig px) */
const handTo = (c: Crew, f: number, w: P2, sink: number, bob: number): P2 => {
  const q = toLane(camAt(f), w[0], w[1], 0, c.z * M);
  const rigX = (q[0] - c.x * M) / (SIZE * (c.face === 1 ? -1 : 1));
  const rigY = (q[1] - sink) / SIZE;
  return [rigX - ENGINEER.hip[0], rigY - ENGINEER.hip[1] + bob];
};
const poseOf = (id: Crew["id"], f: number): EngineerPose => {
  const breathe = 1.4 * Math.sin(f / 13 + (id === "mech" ? 1.7 : 0));
  const idea: P2 = [-120, -190];
  if (id === "designer") {
    const up = liftHand(f, 30, 44);
    const tablet: P2 = [-60, -40];
    const pleased = ss(BEAT.stand, BEAT.stand + 10, f);
    return restPose({
      hand: mix(tablet, idea, up),
      farHand: mix([-40, -30], [14, 2], pleased),
      lean: 6 * (1 - pleased) - 2 * up,
      tilt: -10 * (1 - pleased) * (1 - up) + 6 * up,
      smile: 0.35 + 0.5 * Math.max(up, pleased),
      happy: 0.6 * pleased,
      blink: blinkOf(f, [20, 96, 170]),
      bob: breathe,
    });
  }
  const c = CREW.mech;
  const up = Math.max(liftHand(f, 42, 54), liftHand(f, 52, 64) * 0.95);
  const wipe = ss(BEAT.wipeFrom, BEAT.wipeFrom + 8, f);
  const wingPt: P2 = [carX(f) + (-2.12 + 0.06 * Math.sin(f / 2.6)) * M, -(0.8 + 0.06 * Math.cos(f / 2.6)) * M];
  const wipeHand = wipe > 0.001 ? handTo(c, f, wingPt, 0, breathe) : ([-22, 4] as P2);
  return restPose({
    hand: mix(mix([-22, 4], idea, up), wipeHand, wipe),
    farHand: [14, 2],
    lean: -2 * up - 6 * wipe,
    tilt: 6 * up - 8 * wipe,
    smile: 0.35 + 0.4 * up + 0.2 * wipe,
    blink: blinkOf(f, [12, 80, 150, 205]),
    bob: breathe,
  });
};

// ===========================================================================
// THE IDEAS: one small amber bubble at a time, each into its part
// ===========================================================================
type BubbleSpec = { key: string; kind: IdeaKind; who: Crew["id"]; rise: [number, number]; into: [number, number]; part: P2; hover: P2 };
const R_BUB = 0.24 * M;
const BUBBLES: BubbleSpec[] = [
  { key: "fw", kind: "frontWing", who: "designer", rise: [29, 35], into: [36, 42], part: [2.95, 0.16], hover: [0.42, 0.05] },
  { key: "sp", kind: "sidepod", who: "mech", rise: [42, 48], into: [49, 55], part: [-0.35, 0.42], hover: [0.45, 0.05] },
  { key: "rw", kind: "rearWing", who: "mech", rise: [52, 58], into: [59, 65], part: [-2.15, 0.8], hover: [-0.45, 0.1] },
];
type BubbleState = { x: number; y: number; z: number; tail: number; absorb: number };
const bubbleAt = (b: BubbleSpec, f: number): BubbleState | null => {
  if (f < b.rise[0] || f >= b.into[1]) return null;
  const c = CREW[b.who];
  const sink = b.who === "designer" ? kneelAt(f) : 0;
  const head = engineerHead(c.x * M, sink, SIZE, c.face, poseOf(b.who, f));
  const r = ss5(b.rise[0], b.rise[1], f);
  // it comes out from behind the head, sideways (towards the camera's path), and bobs
  let x = lerp(head[0], head[0] + b.hover[0] * M, r);
  let y = lerp(head[1], head[1] - b.hover[1] * M - R_BUB * 0.4, r) + 0.02 * M * Math.sin((f - b.rise[0]) / 4) * r;
  let zz = c.z;
  const u = ss5(b.into[0], b.into[1] - 2, f);
  if (u > 0) {
    const tx = carX(f) + b.part[0] * M;
    const ty = -b.part[1] * M;
    x = lerp(x, tx, u);
    y = lerp(y, ty, u) - 0.12 * M * Math.sin(u * Math.PI);
    zz = lerp(c.z, -0.05, u);
  }
  return { x, y, z: zz, tail: r * (1 - ss(b.into[0], b.into[0] + 3, f)), absorb: clamp01((f - (b.into[1] - 4)) / 4) };
};

// ===========================================================================
// THE CASH WALL
// ===========================================================================
const quadD = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
/** the bundles: a muted banknote green (board-leaning), a lighter edge, a cream paper strap; never amber */
const MONEY = { note: "#7F9466", noteAlt: "#889C6D", edge: "#A7B78A", strap: "#EDE3CC", dark: "#56653F" } as const;

/** how far a stack of n rows has built by frame f: rows push up out of the ground one at a time (eased each) */
const builtRows = (n: number, a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a)) * n;
  const i = Math.floor(u);
  return Math.min(n, i + smoothstep(u - i));
};
/** one bundle brick between two corners on a vertical plane (metres): [x, z] at each end, h0..h1 */
const Brick: React.FC<{ cam: TrackCam; a: [number, number]; b: [number, number]; h0: number; h1: number; tone: string; strap: boolean }> = ({ cam, a, b, h0, h1, tone, strap }) => {
  const P = (x: number, h: number, z: number) => project(cam, x * M, -h * M, z * M);
  const q = [P(a[0], h0, a[1]), P(b[0], h0, b[1]), P(b[0], h1, b[1]), P(a[0], h1, a[1])];
  const edge = Math.min(0.035, (h1 - h0) * 0.3);
  const top = [P(a[0], h1 - edge, a[1]), P(b[0], h1 - edge, b[1]), q[2], q[3]];
  const mid = (t: number, h: number): P2 => P(lerp(a[0], b[0], t), h, lerp(a[1], b[1], t));
  return (
    <g>
      <path d={quadD(q)} fill={tone} stroke={mixHex(COLOR.board, MONEY.dark, 0.5)} strokeWidth={f3(0.018 * laneK(cam, a[1] * M) * M)} strokeLinejoin="round" />
      <path d={quadD(top)} fill={MONEY.edge} />
      {strap ? <path d={quadD([mid(0.44, h0), mid(0.56, h0), mid(0.56, h1), mid(0.44, h1)])} fill={MONEY.strap} /> : null}
    </g>
  );
};
/** a run of the low cash wall from a to b ([x, z] metres), built to height H (metres; rows rise out of the ground) */
const MoneyWall: React.FC<{ cam: TrackCam; a: [number, number]; b: [number, number]; H: number; seed: number }> = ({ cam, a, b, H, seed }) => {
  if (H <= 0.002) return null;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bh = FENCE.bundleH;
  const n = Math.ceil(H / bh);
  const out: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    // row r counted down from the top: its slot is [H - (r+1) bh, H - r bh], cut at the ground
    const h1 = H - r * bh;
    const h0 = Math.max(0, h1 - bh);
    if (h1 <= 0.004) continue;
    const off = (r % 2) * FENCE.brickL * 0.5;
    for (let t0 = -off; t0 < L; t0 += FENCE.brickL) {
      const s0 = Math.max(0, t0 + 0.012);
      const s1 = Math.min(L, t0 + FENCE.brickL - 0.012);
      if (s1 - s0 < 0.05) continue;
      const pa: [number, number] = [lerp(a[0], b[0], s0 / L), lerp(a[1], b[1], s0 / L)];
      const pb: [number, number] = [lerp(a[0], b[0], s1 / L), lerp(a[1], b[1], s1 / L)];
      const tone = hash(seed * 17 + r * 5.1 + t0 * 3.3) > 0.5 ? MONEY.note : MONEY.noteAlt;
      out.push(<Brick key={`${r}_${f3(t0)}`} cam={cam} a={pa} b={pb} h0={h0} h1={h1} tone={tone} strap={s1 - s0 > 0.4} />);
    }
  }
  return <g>{out}</g>;
};
// the garage interior: dark board tones so the cream car reads against it
const DARK = {
  wall: mixHex(COLOR.board, COLOR.ground, 0.62),
  wallTop: mixHex(COLOR.board, COLOR.ground, 0.48),
  floor: mixHex(COLOR.boardFoot, COLOR.ground, 0.62),
  sideL: mixHex(COLOR.board, COLOR.ground, 0.74),
  sideR: mixHex(COLOR.board, COLOR.ground, 0.56),
  ceil: mixHex(COLOR.board, COLOR.ground, 0.8),
} as const;
const GRASS = { far: "#A7A56F", mid: "#959C60", near: "#848D50" } as const;
const APRON = mixHex(TRACK_COLOR.asphaltLight, COLOR.cream, 0.45);

// ===========================================================================
// THE CUT
// ===========================================================================
const OpenUnderTheCap: React.FC<z.infer<typeof schema>> = () => {
  const uid = `ouc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const S = useCurrentFrame();
  const cam = camAt(S);
  const kz = (zm: number) => laneK(cam, zm * M);
  const P = (xm: number, hm: number, zm: number) => project(cam, xm * M, -hm * M, zm * M);
  const hor = horizonY(cam) + (cam.dy ?? 0);
  const band = amberBandFor(planeCam(cam, 0));
  const k0 = kz(0);
  const cx = carX(S);
  const rolled = rollAt(S) * M;

  // ---- the paddock: sky, a soft far hedge, grass, the light apron ----
  const hedgeZ = 26;
  const hedge = quadD([P(-30, 0, hedgeZ), P(30, 0, hedgeZ), P(30, 2.4, hedgeZ), P(-30, 2.4, hedgeZ)]);
  const apron = quadD([P(-WALL.X - 0.5, 0, WALL.front - 0.6), P(WALL.X + 0.5, 0, WALL.front - 0.6), P(WALL.X + 0.5, 0, G.zB + 0.5), P(-WALL.X - 0.5, 0, G.zB + 0.5)]);

  // ---- the garage (behind the car): calm and dark, few props ----
  const X = G.X;
  const Xo = G.X + G.pillar;
  const gWall = quadD([P(-X, 0, G.zB), P(X, 0, G.zB), P(X, G.H, G.zB), P(-X, G.H, G.zB)]);
  const gFloor = quadD([P(-X, 0, G.zF), P(X, 0, G.zF), P(X, 0, G.zB), P(-X, 0, G.zB)]);
  const gSideL = quadD([P(-X, 0, G.zF), P(-X, 0, G.zB), P(-X, G.H, G.zB), P(-X, G.H, G.zF)]);
  const gSideR = quadD([P(X, 0, G.zF), P(X, 0, G.zB), P(X, G.H, G.zB), P(X, G.H, G.zF)]);
  const gCeil = quadD([P(-X, G.H, G.zF), P(X, G.H, G.zF), P(X, G.H, G.zB), P(-X, G.H, G.zB)]);
  const gRoof = quadD([P(-Xo, G.T, G.zF), P(Xo, G.T, G.zF), P(Xo, G.T, G.zB + 0.3), P(-Xo, G.T, G.zB + 0.3)]);
  const facade = `${quadD([P(-Xo, 0, G.zF), P(-X, 0, G.zF), P(-X, G.T, G.zF), P(-Xo, G.T, G.zF)])}${quadD([P(X, 0, G.zF), P(Xo, 0, G.zF), P(Xo, G.T, G.zF), P(X, G.T, G.zF)])}${quadD([P(-X, G.H, G.zF), P(X, G.H, G.zF), P(X, G.T, G.zF), P(-X, G.T, G.zF)])}`;
  const fascia = quadD([P(-Xo, G.H + 0.2, G.zF), P(Xo, G.H + 0.2, G.zF), P(Xo, G.H + 0.36, G.zF), P(-Xo, G.H + 0.36, G.zF)]);
  const lamp = (() => {
    const a = P(-1.2, G.H - 0.02, 3.6);
    const b = P(1.2, G.H - 0.14, 3.6);
    return <rect x={f3(a[0])} y={f3(a[1])} width={f3(b[0] - a[0])} height={f3(Math.max(1, b[1] - a[1]))} rx={f3((b[1] - a[1]) / 2)} fill="#FFF0D2" opacity={0.7} />;
  })();
  const tyreStack = [0, 1, 2].map((i) => {
    const a = P(2.2, 0.24 * (i + 1), 5.0);
    const b = P(2.95, 0.24 * i, 5.0);
    return <rect key={i} x={f3(a[0])} y={f3(a[1])} width={f3(b[0] - a[0])} height={f3(b[1] - a[1])} rx={f3((b[1] - a[1]) * 0.4)} fill={mixHex(COLOR.inkDark, COLOR.ground, 0.35)} />;
  });

  // ---- the cash wall: rows push up out of the ground; the front run stays under the wheel hubs on screen ----
  const rows = Math.round(WALL.H / WALL.bundleH);
  const wallH = (WALL.H * builtRows(rows, BEAT.wallFrom, BEAT.wallTo, S)) / rows;
  const capFront = (cam.eye - ((cam.eye - F1.tyreR * M) * k0) / kz(WALL.front)) / M - 0.04;
  const frontH = Math.max(0, Math.min(wallH, capFront));
  const sideWalls = [-1, 1].map((sd) => <MoneyWall key={sd} cam={cam} a={[sd * WALL.X, WALL.back]} b={[sd * WALL.X, WALL.front]} H={wallH} seed={sd + 11} />);
  const frontWall = <MoneyWall cam={cam} a={[-WALL.X, WALL.front]} b={[WALL.X, WALL.front]} H={frontH} seed={5} />;

  // ---- the sign: the pole rises with the wall; then the board slides in along the arm ----
  const poleRows = Math.round(SIGN.poleH / WALL.bundleH);
  const poleH = (SIGN.poleH * builtRows(poleRows, BEAT.wallFrom, BEAT.wallTo, S)) / poleRows;
  const signIn = ss5(BEAT.signFrom, BEAT.signTo, S);
  const sign = (() => {
    const zS = SIGN.z;
    const s = kz(zS) * M;
    const iron = mixHex(COLOR.board, COLOR.inkDark, 0.4);
    const pb = P(SIGN.poleX, 0, zS);
    const pt = P(SIGN.poleX, poleH, zS);
    const pw = 0.12 * s;
    const armUp = poleH >= SIGN.poleH - 0.01;
    const slide = (1 - signIn) * SIGN.slide;
    const settle = S > BEAT.signTo - 2 ? 2.2 * Math.sin(clamp01((S - BEAT.signTo + 2) / 12) * Math.PI) * Math.exp(-Math.max(0, S - BEAT.signTo) / 8) : 0;
    const sway = 0.5 * Math.sin(S / 21) + settle;
    const a = P(SIGN.x0 + slide, SIGN.h1, zS);
    const b = P(SIGN.x1 + slide, SIGN.h0, zS);
    const scx = (a[0] + b[0]) / 2;
    const w = b[0] - a[0];
    const h = b[1] - a[1];
    const arm0 = P(SIGN.poleX, SIGN.poleH - 0.1, zS);
    const arm1 = P(SIGN.x0 - 0.1, SIGN.poleH - 0.1, zS);
    const hangY = arm0[1];
    const textPx = 0.5 * s;
    return (
      <g>
        <rect x={f3(pb[0] - pw / 2)} y={f3(pt[1])} width={f3(pw)} height={f3(Math.max(0, pb[1] - pt[1]))} fill={iron} />
        {armUp ? <rect x={f3(arm1[0])} y={f3(hangY - 0.045 * s)} width={f3(arm0[0] - arm1[0])} height={f3(0.09 * s)} rx={f3(0.03 * s)} fill={iron} /> : null}
        {signIn > 0.001 ? (
          <g transform={`rotate(${f3(sway)} ${f3(scx)} ${f3(hangY)})`}>
            {[0.12, 0.88].map((t, i) => (
              <path key={i} d={`M${f3(a[0] + w * t)} ${f3(hangY)}L${f3(a[0] + w * t)} ${f3(a[1])}`} stroke={iron} strokeWidth={f3(0.035 * s)} />
            ))}
            <rect x={f3(a[0] + 0.05 * s)} y={f3(a[1] + 0.06 * s)} width={f3(w)} height={f3(h)} rx={f3(0.07 * s)} fill={COLOR.shadow} opacity={0.25} style={{ filter: `blur(${f3(0.04 * s)}px)` }} />
            <rect x={f3(a[0])} y={f3(a[1])} width={f3(w)} height={f3(h)} rx={f3(0.07 * s)} fill={`url(#${uid}sign)`} />
            <rect x={f3(a[0] + 0.06 * s)} y={f3(a[1] + 0.06 * s)} width={f3(w - 0.12 * s)} height={f3(h - 0.12 * s)} rx={f3(0.04 * s)} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.4)} strokeWidth={f3(0.022 * s)} />
            <text x={f3(scx)} y={f3(a[1] + h / 2 + textPx * 0.36)} fontFamily={FONT_NUM} fontSize={f3(textPx)} letterSpacing="-0.015em" textAnchor="middle" fill={COLOR.inkDark} style={{ fontFeatureSettings: '"lnum" 1' }}>
              $200M
            </text>
          </g>
        ) : null}
      </g>
    );
  })();

  // ---- the crew ----
  const crewNode = (id: Crew["id"]) => {
    const c = CREW[id];
    const pose = poseOf(id, S);
    const sink = id === "designer" ? kneelAt(S) : 0;
    const flip = c.face === 1 ? -1 : 1;
    // the designer's tablet, in her near hand
    const hx = c.x * M + flip * (ENGINEER.hip[0] + pose.hand[0]) * SIZE;
    const hy = sink + (ENGINEER.hip[1] + pose.hand[1] - (pose.bob ?? 0)) * SIZE;
    const tabletIn = id === "designer" ? 1 : 0;
    return (
      <OnLane key={id} cam={cam} z={c.z * M}>
        <g clipPath={`url(#${uid}gnd${id})`}>
          <Engineer x={c.x * M} y={sink} size={SIZE} face={c.face} spec={c.spec} pose={pose} />
          {tabletIn > 0 ? (
            <g transform={`rotate(${f3(flip * -20)} ${f3(hx)} ${f3(hy)})`}>
              <rect x={f3(hx - 0.13 * M)} y={f3(hy - 0.09 * M)} width={f3(0.26 * M)} height={f3(0.18 * M)} rx={f3(0.02 * M)} fill={mixHex(COLOR.inkDark, COLOR.board, 0.2)} />
              <rect x={f3(hx - 0.11 * M)} y={f3(hy - 0.07 * M)} width={f3(0.22 * M)} height={f3(0.14 * M)} rx={f3(0.01 * M)} fill={mixHex(COLOR.cream, "#BFD3D6", 0.4)} opacity={0.85} />
            </g>
          ) : null}
        </g>
      </OnLane>
    );
  };

  // ---- the bubbles ----
  const bubbles = BUBBLES.map((b) => {
    const s = bubbleAt(b, S);
    if (!s) return null;
    const c = CREW[b.who];
    const sink = b.who === "designer" ? kneelAt(S) : 0;
    const head = engineerHead(c.x * M, sink, SIZE, c.face, poseOf(b.who, S));
    const from = toLane(cam, head[0], head[1], c.z * M, s.z * M);
    return (
      <OnLane key={b.key} cam={cam} z={s.z * M}>
        <IdeaBubble x={s.x} y={s.y} r={R_BUB} kind={b.kind} k={kz(s.z)} amberBand={amberBandFor(planeCam(cam, s.z * M))} from={from} tail={s.tail} absorb={s.absorb} wobble={2 * Math.sin(S / 9 + b.rise[0])} bold />
      </OnLane>
    );
  });
  const behindBubbles = BUBBLES.map((b, i) => ({ b, i })).filter(({ b }) => S < b.rise[0] + 3).map(({ i }) => bubbles[i]);
  const frontBubbles = BUBBLES.map((b, i) => ({ b, i })).filter(({ b }) => S >= b.rise[0] + 3).map(({ i }) => bubbles[i]);

  // the clip at each crew lane's ground (the kneeling designer's legs are below it)
  const gndClip = (id: Crew["id"]) => (
    <clipPath key={id} id={`${uid}gnd${id}`}>
      <rect x={f3(cam.x - 4000)} y={-8000} width={8000} height={8000} />
    </clipPath>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: SKY.haze, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.3" stopColor={SKY.upper} />
            <stop offset="0.6" stopColor={SKY.mid} />
            <stop offset="0.85" stopColor={SKY.low} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <linearGradient id={`${uid}gnd`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor)} x2="0" y2="1920">
            <stop offset="0" stopColor={mixHex(GRASS.far, SKY.haze, 0.5)} />
            <stop offset="0.3" stopColor={GRASS.far} />
            <stop offset="1" stopColor={mixHex(GRASS.near, COLOR.shadow, 0.12)} />
          </linearGradient>
          <linearGradient id={`${uid}wall`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, G.H, G.zB)[1])} x2="0" y2={f3(P(0, 0, G.zB)[1])}>
            <stop offset="0" stopColor={DARK.wallTop} />
            <stop offset="1" stopColor={DARK.wall} />
          </linearGradient>
          <linearGradient id={`${uid}fac`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, G.T, G.zF)[1])} x2="0" y2={f3(P(0, 0, G.zF)[1])}>
            <stop offset="0" stopColor={mixHex(COLOR.board, COLOR.cream, 0.5)} />
            <stop offset="1" stopColor={mixHex(COLOR.board, COLOR.cream, 0.22)} />
          </linearGradient>
          <linearGradient id={`${uid}sign`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, SIGN.h1, SIGN.z)[1])} x2="0" y2={f3(P(0, SIGN.h0, SIGN.z)[1])}>
            <stop offset="0" stopColor={mixHex(COLOR.cream, "#FFF4E2", 0.3)} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          {gndClip("designer")}
          {gndClip("mech")}
        </defs>
        <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, hor + 70))} fill={`url(#${uid}sky)`} />
        <rect x={-60} y={f3(hor - 2)} width={1200} height={f3(Math.max(0, 2000 - hor))} fill={`url(#${uid}gnd)`} />
        <path d={hedge} fill={mixHex(GRASS.mid, SKY.haze, 0.55)} style={{ filter: "blur(3px)" }} />
        <path d={apron} fill={APRON} />
        {/* the garage */}
        <path d={gRoof} fill={mixHex(COLOR.board, COLOR.cream, 0.4)} />
        <path d={gWall} fill={`url(#${uid}wall)`} />
        <path d={gFloor} fill={DARK.floor} />
        <path d={gSideL} fill={DARK.sideL} />
        <path d={gSideR} fill={DARK.sideR} />
        <path d={gCeil} fill={DARK.ceil} />
        {lamp}
        {tyreStack}
        <path d={facade} fill={`url(#${uid}fac)`} />
        <path d={fascia} fill={mixHex(COLOR.board, COLOR.cream, 0.1)} />
        {/* the crew (behind the car) and the bubbles still behind their heads */}
        {behindBubbles}
        {crewNode("mech")}
        {crewNode("designer")}
        {/* THE CAR */}
        <OnLane cam={cam} z={0}>
          <F1Car x={cx} y={0} k={k0} amberBand={band} upgrade={fitAt(S)} wheelSpin={rolled} bob={bobAt(S)} />
        </OnLane>
        {frontBubbles}
        {/* the cash wall (sides back to the garage, then the front run), the sign */}
        {sideWalls}
        {frontWall}
        {sign}
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <Grain S={S} />
    </AbsoluteFill>
  );
};

/** the kit's grain on twos (as StoutStage / TrackStage) */
const Grain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};

export default OpenUnderTheCap;
