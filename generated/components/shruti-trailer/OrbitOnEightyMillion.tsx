// ---------------------------------------------------------------------------
// OrbitOnEightyMillion (shruti-trailer, cut 13). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Neal /
// SKYROOT trailer look, on ../neal-stephenson-trailer/nealShared). Opaque 1920x1080, 23.976 fps, 191 frames; finals
// --scale 2 (3840x2160).
//
// CHECK LINE: Skyroot reached orbit off a tiny pile of money; everyone else has needed a pile of money that reaches all
// the way up to orbit. (Sound off: "the small rocket got to space on a little stack of cash; the usual price is a tower
// of cash twelve times taller.")
//
// THE LINE (Ashlee Vance, about Skyroot): "[And] they got to orbit on, I believe, around 80 million or less dollars. I
// don't think anyone, especially in the last 20 years, has done that for less than a billion dollars."
// WORD -> FRAME: they 2 · got 5 · to 8 · orbit 11 · on 16 · I 25 · believe 27 · around 37 · 80 43 · million 61 · or 67 ·
// less 77 · dollars 85 · I 98 · don't 102 · think 110 · anyone 111 · especially 122 · in 131 · the 141 · last 143 · 20 146 ·
// years 151 · has 157 · done 158 · that 161 · for 164 · less 167 · than 171 · a 174 · billion 176 · dollars 180 · ends ~187.
// DURATION: the slot 13.096 -> 21.063 s (sequence f314-f505) = 7.967 s x 23.976 = 191 frames (f0..f190). Before and
// after: the speaker on camera (hard cuts).
//
// THE MOTION: one world, one continuous camera. The lower part of the b&w photo Earth (the NASA EPIC disc re-projected
// as a sphere, India on its face) is a big curved limb across the bottom, its crest under the small stack; a DASHED white
// orbit is concentric with it high above (crest ~y 172 in the wide, limb ~y 902), its altitude = what a billion dollars
// of $100 bricks reaches. f0 close and low (k 3) on a SMALL stack of cash bricks standing upright on the limb a little
// left of centre (x 800), Vikram-1 standing on it as its launch pad; it lifts on "got" (f5), upright, drawing its chunky
// white trail (plain white on its hard shadow), and flies a gravity turn: one smooth widening quarter-ellipse to the
// RIGHT, tangent with the orbit at ~x 1089 of the wide (f41), while the camera follows up and pulls back (one smoothed
// log-zoom to k ~1.08). It never stops: eased into a steady orbital pace (~2.4-2.7 px/f on screen) it flies on along
// the orbit, drawing its trail behind it (one long sweep: up from the stack, over, along the orbit), to ~x 1626 at f190,
// still moving. The rocket is collage scale (~228 screen px in the wide, like SKYROOT), a plain b&w cut-out. The ONE
// chain moment: on "80 million" (f43-) the crown steps up out of the small stack's top (brick silhouettes, orange /
// purple / blue, CROWN_STEP apart) and rests there. From f92 the billion tower of the SAME bricks is pushed straight up
// out from behind the limb on the LEFT (x 410), accelerating then easing in, its top meeting the dashed orbit exactly
// on "billion" (f176). f56-f185 one long slow camera creep (k 1.08 -> 1.0, a hair right). f176-f190 living: the rocket
// flies on, the globe turns a hair, the paper drifts, film life. Nothing fades.
//   Cause before effect: the rocket stands on the stack top (contact) until f4; it moves from f5. The tower is pushed up
//   out of the Earth (its hidden courses are behind the limb from f0); its top touches the orbit line at f176.
// HEIGHT = COST: tower : small stack = 25 : 2 courses = 1000 : 80 = 12.5 : 1, same footprint (2 bricks wide). Both stand
// upright on screen, seated on the limb (the lower bottom corner touches, the rest tucked behind the limb) with a soft
// contact shadow; heights on each centre line from the limb up: the tower 731.6 world px (limb to orbit at x 410), the
// small stack 58.5 = 1/12.5 of it.
// CHAIN = INDIA'S OUTLIERS (COMMON.md): here Skyroot's small pile of money, once, on "80 million": the crown on the stack.
// No numbers on screen.
//
// FACTS / SOURCES: Skyroot Vikram-1, Mission Aagaman, lifted off 18 Jul 2026 from the First Launch Pad, Sriharikota, and
// reached orbit on the first attempt (SKYROOT trailer FACTS.txt: ISRO, Al Jazeera, Space.com, SpaceNews, Bloomberg).
// "$80 million or less" and "a billion" are Ashlee's own estimates: the stack heights follow his words; no figure is
// printed. Rocket: skyrootShared VIKRAM1 (ISRO photo of the flight vehicle on the pad, GODL-India). Earth: NASA DSCOVR
// EPIC natural-colour full disc, 28 Mar 2024, India centred (public domain), skyrootShared EARTH. Orbit and stack sizes
// are collage scale. Cash bricks: public/shruti-trailer/cash_*.png, baked by
// scripts/clips/shruti-trailer/bake-cash-bricks.py from a real Series 2013 $100 note (Wikimedia Commons
// "Series_2013_$100_bill_front.jpg", public domain, photo Cyfraw): the note's face cut out flat, greyscale, a pale paper
// strap round each bundle and its top edge of paper layers; both stacks are the same brick sprite.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ChainPhotoCutOut,
  SHADOW_OFF,
  Silhouette,
  H,
  INK,
  NEAL_FILTER,
  type NealCam,
  NealFilmLife,
  NealPaper,
  NealPlane,
  NealSvg,
  PhotoCutOut,
  SHADOW,
  W,
  chainProgress,
  clamp,
  depthTransform,
} from "../neal-stephenson-trailer/nealShared";
import { EARTH, RocketCutOut, VIKRAM1 } from "../skyroot-trailer/skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 191;
export const schema = z.object({ debug: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const ss = (t: number) => t * t * (3 - 2 * t);
const c01 = (t: number) => Math.max(0, Math.min(1, t));

// -- the world (world px = screen px of the final frame at k 1) ---------------------------------------------------------
/** The Earth: a circle of radius R_E round (EX, EY); its crest at (EX, 915), right under the small stack. */
export const R_E = 5500;
export const EX = 800;
export const EY = 915 + R_E;
/** The orbit's altitude over the crest; the orbit is concentric (radius RO), its crest at y 185. */
export const ALT = 730;
export const RO = R_E + ALT;
/** A point at angle th (rad, clockwise from up) and radius r about the Earth's centre. */
export const polar = (th: number, r: number) => ({ x: EX + r * Math.sin(th), y: EY - r * Math.cos(th) });
/** The limb's and the orbit's y at world x. */
export const limbY = (x: number) => EY - Math.sqrt(R_E * R_E - (x - EX) * (x - EX));
export const orbitY = (x: number) => EY - Math.sqrt(RO * RO - (x - EX) * (x - EX));
/** The two stacks stand UPRIGHT on screen, 2 bricks wide (same footprint): the small one on the crest a little left of
 *  centre, the billion tower on the left. Heights are measured on each stack's centre line from the limb up: the tower
 *  reaches the orbit there (TOWER_H), the small stack is exactly 1/12.5 of it (25 : 2 courses = 1000 : 80). */
export const BW = 60.5;
export const COLS = 2;
export const STACK_W = COLS * BW;
export const X_S = 800;
export const X_T = 410;
export const TOWER_ROWS = 25;
export const SMALL_ROWS = 2;
export const TOWER_H = limbY(X_T) - orbitY(X_T);
export const SMALL_H = (TOWER_H * SMALL_ROWS) / TOWER_ROWS;
export const BH = TOWER_H / TOWER_ROWS;
/** Seated on the limb: the sprite's bottom edge sits at the LOWER of its two bottom corners' limb y (that corner touches),
 *  the rest of the bottom tucked behind the limb; SINK = how far below the centre line's limb point the bottom edge is. */
const seatY = (x: number) => Math.max(limbY(x - STACK_W / 2), limbY(x + STACK_W / 2));
export const SINK_S = seatY(X_S) - limbY(X_S);
export const SINK_T = seatY(X_T) - limbY(X_T);
export const SMALL_SPRITE_H = SMALL_H + SINK_S;
export const TOWER_SPRITE_H = TOWER_H + SINK_T;
/** The small stack's angle about the Earth's centre (the climb starts radially from its top: here straight up). */
export const TH_S = Math.asin((X_S - EX) / R_E);

const SPRITE_SMALL = { src: "shruti-trailer/cash_stack_small.png", w: 605, h: 292 };
const SPRITE_TOWER = { src: "shruti-trailer/cash_tower.png", w: 302.5, h: 1825 }; // content 2 x 60.5 x 2.5 px wide

// -- the rocket's path: the climb (a gravity turn) then the orbit, in polar coordinates -----------------------------------
/** The climb is a quarter-ellipse in the local frame of the small stack: from its top (radius r0, angle TH_S)
 *  heading radially out, pitching over from the start, one smooth widening arc that meets the orbit tangentially:
 *  r = r0 + b sin t, along-track a (1 - cos t), t 0..90 deg, b = RO - r0, a = REACH b. Flown clockwise; TH_J the join. */
const REACH = 0.43;
const N_CLIMB = 800;
type P2 = { x: number; y: number };
const CLIMB: { th: number; r: number }[] = (() => {
  const r0 = Math.hypot(X_S - EX, EY - (limbY(X_S) - SMALL_H)); // the small stack's top, on its centre line
  const b = RO - r0;
  const a = REACH * b;
  const out = [{ th: TH_S, r: r0 }];
  let th = TH_S;
  for (let i = 1; i <= N_CLIMB; i++) {
    const t0 = ((i - 1) / N_CLIMB) * (Math.PI / 2);
    const t1 = (i / N_CLIMB) * (Math.PI / 2);
    const rm = r0 + b * Math.sin((t0 + t1) / 2);
    th += (a * (Math.cos(t0) - Math.cos(t1))) / rm;
    out.push({ th, r: r0 + b * Math.sin(t1) });
  }
  return out;
})();
export const TH_J = CLIMB[N_CLIMB].th;
const PATH: P2[] = [];
const PATH_S: number[] = [];
{
  for (const c of CLIMB) PATH.push(polar(c.th, c.r));
  const N_ARC = 3000; // an eighth of a turn of the orbit past the join (far more than is flown)
  for (let i = 1; i <= N_ARC; i++) PATH.push(polar(TH_J + (i / N_ARC) * (Math.PI / 8), RO));
  let s = 0;
  PATH_S.push(0);
  for (let i = 1; i < PATH.length; i++) {
    s += Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].y - PATH[i - 1].y);
    PATH_S.push(s);
  }
}
/** Arc length of the climb (the join). */
export const S_J = PATH_S[N_CLIMB];
const idxAt = (s: number) => {
  let lo = 0;
  let hi = PATH_S.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PATH_S[m] <= s) lo = m;
    else hi = m;
  }
  return lo;
};
export const pathAt = (s: number): P2 => {
  const i = Math.min(idxAt(Math.max(0, s)), PATH.length - 2);
  const t = c01((s - PATH_S[i]) / (PATH_S[i + 1] - PATH_S[i]));
  return { x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * t, y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * t };
};

// -- the rocket's travel ----------------------------------------------------------------------------------------------------
/** Still on the stack to f3; lifts on "got" (f5), gathering speed (ACC frames), then from DEC0 eases into the orbit and
 *  from ~DEC1 flies on at a steady orbital pace V_ORB world px/f to the end (never stalling). V_PEAK is solved so it
 *  reaches the join at F_JOIN. */
const LIFT = 3;
const ACC = 20;
const DEC0 = 26;
const DEC1 = 46;
export const F_JOIN = 41;
export const V_ORB = 2.8;
const SUB = 20;
const speedShape = (f: number, vp: number) => {
  const acc = ss(c01((f - LIFT) / ACC));
  const dec = ss(c01((f - DEC0) / (DEC1 - DEC0)));
  return f < LIFT ? 0 : vp * acc * (1 - dec) + V_ORB * acc * dec;
};
const integrate = (vp: number) => {
  const t: number[] = [0];
  for (let f = 1; f <= DURATION + 2; f++) {
    let a = 0;
    for (let i = 0; i < SUB; i++) a += speedShape(f - 1 + (i + 0.5) / SUB, vp) / SUB;
    t.push(t[f - 1] + a);
  }
  return t;
};
const ROCKET_TABLE = (() => {
  let lo = 1;
  let hi = 200;
  for (let it = 0; it < 60; it++) {
    const m = (lo + hi) / 2;
    if (integrate(m)[F_JOIN] < S_J) lo = m;
    else hi = m;
  }
  return integrate((lo + hi) / 2);
})();
const lerpTable = (table: number[], f: number) => {
  const c = Math.max(0, Math.min(table.length - 1, f));
  const a = Math.floor(c);
  const b = Math.min(a + 1, table.length - 1);
  return table[a] + (table[b] - table[a]) * (c - a);
};
export const sAt = (f: number) => lerpTable(ROCKET_TABLE, f);

/** The rocket's length (collage scale, like SKYROOT): 450 screen px at the k 3 opening (150 world px on the stack), and
 *  it shrinks slower than the world as the camera pulls back, L_screen = 450 (k / 3)^L_POW: ~225 px in the wide. */
const L_POW = 0.62;
export const rocketLen = (f: number) => {
  const k = camAt(f).k;
  return (450 * Math.pow(k / 3, L_POW)) / k;
};
/** The rocket's axis direction (unit, world) at frame f: the chord from the nozzle to the path point a rocket length ahead
 *  (its nose on the line), averaged over +-2 frames so the rigid body swings round the curve. */
const chordDir = (f: number) => {
  const s = sAt(f);
  const b = pathAt(s);
  const L = rocketLen(f);
  let s2 = s + L;
  for (let i = 0; i < 4; i++) {
    const q = pathAt(s2);
    const d = Math.hypot(q.x - b.x, q.y - b.y);
    s2 = s + (s2 - s) * (L / Math.max(1, d));
  }
  const q = pathAt(s2);
  const d = Math.hypot(q.x - b.x, q.y - b.y);
  return { x: (q.x - b.x) / d, y: (q.y - b.y) / d };
};
const ROT_W = [1, 2, 3, 2, 1];
export const rocketAt = (f: number) => {
  const s = sAt(f);
  const base = pathAt(s);
  const L = rocketLen(f);
  let ax = 0;
  let ay = 0;
  ROT_W.forEach((w, i) => {
    const d = chordDir(Math.max(0, f + i - 2));
    ax += w * d.x;
    ay += w * d.y;
  });
  // standing on the stack and in the first rocket length the body is upright (radial), easing onto the chord heading
  const n0 = Math.hypot(ax, ay);
  const w = ss(c01(s / L));
  const rx = (1 - w) * Math.sin(TH_S) + (w * ax) / n0;
  const ry = -(1 - w) * Math.cos(TH_S) + (w * ay) / n0;
  const n = Math.hypot(rx, ry);
  const ux = rx / n;
  const uy = ry / n;
  const rot = deg(Math.atan2(ux, -uy)); // CSS deg clockwise from nose-up
  return { s, base, L, ux, uy, rot, nose: { x: base.x + ux * L, y: base.y + uy * L } };
};
/** Half the rocket body's width as a fraction of its length. */
export const ROCKET_HALF_W_PER_L = (VIKRAM1.bodyW * (VIKRAM1.w / VIKRAM1.h)) / (VIKRAM1.baseY - VIKRAM1.noseY) / 2;
/** The chain (INDIA'S OUTLIERS), once: the crown stepping up out of the SMALL stack's top on "80 million", resting there to
 *  the end (brick silhouettes, orange / purple / blue, CROWN_STEP apart). */
export const CROWN_START = 43;
const CROWN_TRAVEL = 16;

// -- the tower ----------------------------------------------------------------------------------------------------------------
/** The tower's height above the limb: pushed up out of the Earth from T0 (already moving on "I don't think anyone"),
 *  accelerating then easing in, its top on the orbit line at T1 ("billion" f176). */
export const T0 = 92;
export const T1 = 176;
const TOWER_EASE = Easing.bezier(0.45, 0, 0.3, 1);
const towerEase = (t: number) => TOWER_EASE(c01(t));
/** The tower's bottom edge y (world): pushed straight up out from behind the limb (+2 px hidden at f0). */
export const towerBottomY = (f: number) => seatY(X_T) + (TOWER_SPRITE_H + 2) * (1 - towerEase((f - T0) / (T1 - T0)));
/** The tower's visible height on its centre line (from the limb to its top). */
export const towerRise = (f: number) => Math.max(0, limbY(X_T) - (towerBottomY(f) - TOWER_SPRITE_H));

// -- the camera: coarse keys, linearly interpolated, box-smoothed per frame at module load ---------------------------------
const PRE = 40;
const POST = 40;
const track = (keys: [number, number][], win: number) => {
  const F = keys.map((k) => k[0]);
  const V = keys.map((k) => k[1]);
  const raw: number[] = [];
  for (let f = -PRE - win; f <= DURATION + POST + win; f++) raw.push(interpolate(f, F, V, clamp));
  const out: number[] = [];
  for (let f = -PRE; f <= DURATION + POST; f++) {
    let s = 0;
    for (let i = -win; i <= win; i++) s += raw[f + PRE + win + i];
    out.push(s / (2 * win + 1));
  }
  return (f: number) => {
    const c = Math.max(-PRE, Math.min(DURATION + POST, f)) + PRE;
    const a = Math.floor(c);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (c - a);
  };
};
/** ln k: close (k 3) on the stack and rocket, one pull-back lobe (fastest ~f20-f30, settling ~f55), then ONE long slow
 *  creep out through the quiet stretch and the tower's rise (the same lobe's tail: its speed only falls). */
const LNK = track(
  [
    [-40, Math.log(3.0)],
    [4, Math.log(3.0)],
    [12, Math.log(2.6)],
    [20, Math.log(1.85)],
    [28, Math.log(1.3)],
    [38, Math.log(1.12)],
    [52, Math.log(1.08)],
    [185, Math.log(1.0)],
    [230, Math.log(0.99)],
  ],
  6,
);
/** The focus (world px at the frame's centre): on the stack + rocket at f0 (the v3 opening, moved with the stack: +375,
 *  -26), climbing with the rocket and out to the wide, then ONE long slow drift right with the flying rocket. */
const CX = track(
  [
    [-40, 804],
    [4, 804],
    [16, 812],
    [28, 878],
    [36, 942],
    [42, 950],
    [185, 966],
    [230, 967],
  ],
  7,
);
const CY = track(
  [
    [-40, 789],
    [4, 789],
    [14, 734],
    [22, 622],
    [28, 568],
    [36, 553],
    [46, 549],
    [185, 553],
    [230, 553],
  ],
  7,
);
export const camAt = (f: number): NealCam => ({ x: CX(f), y: CY(f), k: Math.exp(LNK(f)), x0: CX(0), y0: CY(0) });
/** The paper's camera: the same move, its zoom eased (k 3 -> 1.8) so the squares never go above 1.0x of source. */
const paperCam = (cam: NealCam): NealCam => ({ ...cam, k: 1 + (cam.k - 1) * 0.4 });

// -- the globe: a sphere re-projected per frame from the EPIC disc (canvas, grey) ---------------------------------------------
type V3 = [number, number, number];
type Mat = [V3, V3, V3];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const matMul = (a: Mat, b: Mat): Mat => {
  const bt: Mat = [
    [b[0][0], b[1][0], b[2][0]],
    [b[0][1], b[1][1], b[2][1]],
    [b[0][2], b[1][2], b[2][2]],
  ];
  return a.map((r) => [dot(r, bt[0]), dot(r, bt[1]), dot(r, bt[2])]) as Mat;
};
const transpose = (m: Mat): Mat => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];
const rotX = (d: number): Mat => {
  const c = Math.cos(rad(d));
  const s = Math.sin(rad(d));
  return [
    [1, 0, 0],
    [0, c, s],
    [0, -s, c],
  ];
};
const rotZ = (d: number): Mat => {
  const c = Math.cos(rad(d));
  const s = Math.sin(rad(d));
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
};
const rotAxis = (a: V3, d: number): Mat => {
  const c = Math.cos(rad(d));
  const s = Math.sin(rad(d));
  const t = 1 - c;
  const [x, y, zz] = a;
  return [
    [t * x * x + c, t * x * y - s * zz, t * x * zz + s * y],
    [t * x * y + s * zz, t * y * y + c, t * y * zz - s * x],
    [t * x * zz - s * y, t * y * zz + s * x, t * zz * zz + c],
  ];
};
/** The EPIC disc as a texture (north up, centroid 11.2 N 74.8 E). */
const TEX = { src: EARTH.src, cx: EARTH.cx * EARTH.size, cy: EARTH.cy * EARTH.size, r: EARTH.r * EARTH.size, lat0: 11.2, lon0: 74.8 };
const geoE = (lat: number, lon: number): V3 => {
  const p = rad(lat);
  const p0 = rad(TEX.lat0);
  const dl = rad(lon - TEX.lon0);
  return [Math.cos(p) * Math.sin(dl), Math.sin(p) * Math.cos(p0) - Math.cos(p) * Math.sin(p0) * Math.cos(dl), Math.sin(p) * Math.sin(p0) + Math.cos(p) * Math.cos(p0) * Math.cos(dl)];
};
const PAD = geoE(13.72, 80.23);
const NORTH: V3 = [0, Math.cos(rad(TEX.lat0)), Math.sin(rad(TEX.lat0))];
/** The view: tilted TILT deg from EPIC's (looking from the south over India toward the northern horizon), rolled so
 *  Sriharikota lies under the small stack's radius, PAD_ELEV deg in front of the limb (India on the visible face). */
const TILT = 62;
const M_TILT = rotX(TILT);
const padT = [dot(M_TILT[0], PAD), dot(M_TILT[1], PAD), dot(M_TILT[2], PAD)];
export const PAD_ELEV = deg(Math.asin(padT[2]));
const M_VIEW = matMul(rotZ(deg(Math.atan2(padT[0], padT[1])) - deg(TH_S)), M_TILT);
/** The globe's own turn about its axis (texture only): a hair, eastward. */
const SPIN_PER_F = 0.012;

type Level = { w: number; h: number; data: Float32Array };
let texPromise: Promise<Level[]> | null = null;
const loadTexture = () => {
  if (!texPromise) {
    texPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no 2d context"));
        ctx.drawImage(img, 0, 0);
        const src = ctx.getImageData(0, 0, c.width, c.height).data;
        const w0 = c.width;
        const h0 = c.height;
        const l0 = new Float32Array(w0 * h0);
        for (let i = 0; i < w0 * h0; i++) l0[i] = 0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2];
        const levels: Level[] = [{ w: w0, h: h0, data: l0 }];
        while (levels[levels.length - 1].w > 64) {
          const p = levels[levels.length - 1];
          const w = p.w >> 1;
          const h = p.h >> 1;
          const d = new Float32Array(w * h);
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const i = 2 * y * p.w + 2 * x;
              d[y * w + x] = 0.25 * (p.data[i] + p.data[i + 1] + p.data[i + p.w] + p.data[i + p.w + 1]);
            }
          levels.push({ w, h, data: d });
        }
        resolve(levels);
      };
      img.onerror = () => reject(new Error(`could not load ${TEX.src}`));
      img.src = staticFile(TEX.src);
    });
  }
  return texPromise;
};
const sampleLevel = (lv: Level, x: number, y: number) => {
  const xf = Math.max(0, Math.min(lv.w - 1.001, x - 0.5));
  const yf = Math.max(0, Math.min(lv.h - 1.001, y - 0.5));
  const x0 = xf | 0;
  const y0 = yf | 0;
  const fx = xf - x0;
  const fy = yf - y0;
  const i = y0 * lv.w + x0;
  const d = lv.data;
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + lv.w] * (1 - fx) + d[i + lv.w + 1] * fx) * fy;
};
const TEX_R = TEX.r * 0.985;
/** The globe's screen centre and radius under the camera. */
export const globeAt = (f: number) => {
  const t = depthTransform(camAt(f));
  const c = t.toScreen(EX, EY);
  return { cx: c.x, cy: c.y, rs: R_E * t.k };
};

const Globe: React.FC<{ frame: number }> = ({ frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [handle] = useState(() => delayRender("EPIC texture"));
  const done = useRef(false);
  useLayoutEffect(() => {
    let live = true;
    loadTexture()
      .then((l) => {
        if (live) setLevels(l);
      })
      .catch((e) => cancelRender(e));
    return () => {
      live = false;
    };
  }, []);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cw = Math.round(W * dpr);
  const chh = Math.round(H * dpr);
  useLayoutEffect(() => {
    if (!levels || !ref.current) return;
    const g = globeAt(frame);
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(cw, chh);
    const out = img.data;
    const Rd = g.rs * dpr;
    const cx = g.cx * dpr;
    const cy = g.cy * dpr;
    // view -> texture frame: E = M^T v, then undo the globe's spin about its axis
    const Mt = matMul(rotAxis(NORTH, -SPIN_PER_F * frame), transpose(M_VIEW));
    const lv = levels[0];
    const y0 = Math.max(0, Math.floor(cy - Rd - 2));
    const y1 = chh - 1;
    for (let j = y0; j <= y1; j++) {
      const vy = -(j + 0.5 - cy) / Rd;
      // the disc's span on this row
      const half = Math.sqrt(Math.max(0, 1 - vy * vy)) * Rd + 2;
      const x0 = Math.max(0, Math.floor(cx - half));
      const x1 = Math.min(cw - 1, Math.ceil(cx + half));
      for (let i = x0; i <= x1; i++) {
        const vx = (i + 0.5 - cx) / Rd;
        const d2 = vx * vx + vy * vy;
        const d = Math.sqrt(d2);
        const cov = Math.max(0, Math.min(1, (1 - d) * Rd + 0.5));
        if (cov <= 0) continue;
        const vz = Math.sqrt(Math.max(0, 1 - d2));
        const ex = Mt[0][0] * vx + Mt[0][1] * vy + Mt[0][2] * vz;
        const ey = Mt[1][0] * vx + Mt[1][1] * vy + Mt[1][2] * vz;
        const L = sampleLevel(lv, TEX.cx + ex * TEX_R, TEX.cy - ey * TEX_R);
        const o = (j * cw + i) * 4;
        out[o] = L;
        out[o + 1] = L;
        out[o + 2] = L;
        out[o + 3] = cov * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [levels, frame, cw, chh, dpr, handle]);
  return <canvas ref={ref} width={cw} height={chh} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, filter: NEAL_FILTER }} />;
};
/** The globe's hard shadow (screen px). */
const GLOBE_SHADOW = 5;
const GlobeShadow: React.FC<{ frame: number }> = ({ frame }) => {
  const g = globeAt(frame);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <circle cx={g.cx + GLOBE_SHADOW} cy={g.cy + GLOBE_SHADOW} r={g.rs} fill={SHADOW} />
    </svg>
  );
};

// -- the dashed orbit -------------------------------------------------------------------------------------------------------
/** The planned orbit, DASHED: thinner and lighter than the flown trail; dashes fixed on the circle (world px). */
const DASH_W = 6.5;
const DASH_SHADOW = 3;
const DASH_OP = 0.85;
const DASH = "24 16";
const DashedOrbit: React.FC = () => (
  <g opacity={DASH_OP}>
    <circle cx={EX + DASH_SHADOW} cy={EY + DASH_SHADOW} r={RO} fill="none" stroke={SHADOW} strokeWidth={DASH_W} strokeDasharray={DASH} />
    <circle cx={EX} cy={EY} r={RO} fill="none" stroke={INK} strokeWidth={DASH_W} strokeDasharray={DASH} />
  </g>
);

// -- the stacks -------------------------------------------------------------------------------------------------------------
/** The tower: the baked sprite stretched to TOWER_SPRITE_H (+0.5 %), upright, its bottom centre at (X_T, bottomY), on the
 *  Core Memory hard shadow. */
const Tower: React.FC<{ bottomY: number }> = ({ bottomY }) => (
  <PhotoCutOut src={SPRITE_TOWER.src} x={X_T} y={bottomY} w={STACK_W} aspect={STACK_W / TOWER_SPRITE_H} filter={NEAL_FILTER} />
);
/** The small stack with the chain crown stepping up out of its top: back to front the hard shadow, orange, purple, blue
 *  brick silhouettes (CROWN_STEP apart, straight up), then the photo bricks. */
const SmallStack: React.FC<{ frame: number }> = ({ frame }) => {
  const pl = { src: SPRITE_SMALL.src, x: X_S, y: seatY(X_S), w: STACK_W, aspect: STACK_W / SMALL_SPRITE_H };
  const topY = seatY(X_S) - SMALL_SPRITE_H + 0.5;
  return (
    <>
      <Silhouette {...pl} colour={SHADOW} dx={SHADOW_OFF} dy={SHADOW_OFF} />
      {/* the copies show only above the stack's top (else they peek through the gaps between courses) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, clipPath: `polygon(-9999px -9999px, 9999px -9999px, 9999px ${topY}px, -9999px ${topY}px)` }}>
        <ChainPhotoCutOut {...pl} core="none" progress={chainProgress(frame, CROWN_START, { travel: CROWN_TRAVEL })} />
      </div>
      <PhotoCutOut {...pl} hardShadow={false} filter={NEAL_FILTER} />
    </>
  );
};
/** Soft contact shadows where the stacks stand on the limb, drawn over the globe and clipped to the Earth's disc so they
 *  only darken the ground (never the bricks). */
const Contact: React.FC<{ x: number; on: number }> = ({ x, on }) => {
  if (on <= 0) return null;
  const y = limbY(x);
  return (
    <g clipPath="url(#oe-earth)" opacity={on}>
      <ellipse cx={x + 3} cy={y + 2} rx={STACK_W * 0.66} ry={9} fill="url(#oe-contact)" />
      <ellipse cx={x + 2} cy={y + 1} rx={STACK_W * 0.52} ry={3.5} fill="url(#oe-contact-core)" />
    </g>
  );
};
const ContactDefs: React.FC = () => (
  <defs>
    <clipPath id="oe-earth">
      <circle cx={EX} cy={EY} r={R_E} />
    </clipPath>
    <radialGradient id="oe-contact">
      <stop offset="0%" stopColor="#000" stopOpacity={0.34} />
      <stop offset="45%" stopColor="#000" stopOpacity={0.2} />
      <stop offset="75%" stopColor="#000" stopOpacity={0.06} />
      <stop offset="100%" stopColor="#000" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="oe-contact-core">
      <stop offset="0%" stopColor="#000" stopOpacity={0.55} />
      <stop offset="50%" stopColor="#000" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#000" stopOpacity={0} />
    </radialGradient>
  </defs>
);

// -- the trail -------------------------------------------------------------------------------------------------------------
/** The trail's width on screen: a little over half the body's, never under 11 px (chunky at phone size). */
const trailScreenW = (k: number) => Math.max(11, Math.min(26, 0.5 * 2 * ROCKET_HALF_W_PER_L * 450 * Math.pow(k / 3, L_POW)));
const TRAIL_SHADOW = 5; // screen px
const trailD = (sFrom: number, sTo: number) => {
  if (sTo <= sFrom) return "";
  const i0 = idxAt(sFrom);
  const i1 = idxAt(sTo);
  const pts: P2[] = [pathAt(sFrom)];
  for (let i = i0 + 1; i <= i1; i += i < N_CLIMB ? 2 : 6) pts.push(PATH[i]);
  pts.push(pathAt(sTo));
  return "M" + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L");
};
const Trail: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const r = rocketAt(frame);
  if (r.s <= 0.05) return null;
  const w = trailScreenW(k) / k;
  const d = trailD(0, r.s);
  const stroke = { fill: "none", strokeWidth: w, strokeLinecap: "butt" as const, strokeLinejoin: "round" as const };
  return (
    <g>
      <path d={d} transform={`translate(${TRAIL_SHADOW / k} ${TRAIL_SHADOW / k})`} stroke={SHADOW} {...stroke} />
      <path d={d} stroke={INK} {...stroke} />
    </g>
  );
};

const Debug: React.FC<{ frame: number; cam: NealCam }> = ({ frame, cam }) => {
  const r = rocketAt(frame);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#f0f" strokeWidth={1} />
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#f0f" strokeWidth={1} />
      <text x={20} y={50} fill="#f0f" fontSize={30} fontFamily="monospace">
        f{frame} k {cam.k.toFixed(3)} cam ({cam.x.toFixed(0)}, {cam.y.toFixed(0)}) s {r.s.toFixed(0)}/{S_J.toFixed(0)} rot {r.rot.toFixed(1)} tower {towerRise(frame).toFixed(0)}
      </text>
    </svg>
  );
};

// -- the cut ------------------------------------------------------------------------------------------------------------------
const OrbitOnEightyMillion: React.FC<z.infer<typeof schema>> = ({ debug }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const r = rocketAt(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame} seed="shruti-13">
        <NealPaper frame={frame} cam={paperCam(cam)} />
        <NealPlane cam={cam}>
          <NealSvg>
            <DashedOrbit />
          </NealSvg>
          <Tower bottomY={towerBottomY(frame)} />
          <SmallStack frame={frame} />
        </NealPlane>
        <GlobeShadow frame={frame} />
        <Globe frame={frame} />
        <NealPlane cam={cam}>
          <NealSvg>
            <ContactDefs />
            <Contact x={X_S} on={1} />
            <Contact x={X_T} on={c01(towerRise(frame) / 12)} />
            <Trail frame={frame} k={cam.k} />
          </NealSvg>
          <RocketCutOut rocket={VIKRAM1} x={r.base.x} y={r.base.y} height={r.L} rot={r.rot} pivot={0} shadow={4} filter={NEAL_FILTER} />
        </NealPlane>
        {debug ? <Debug frame={frame} cam={cam} /> : null}
      </NealFilmLife>
    </AbsoluteFill>
  );
};

export default OrbitOnEightyMillion;
