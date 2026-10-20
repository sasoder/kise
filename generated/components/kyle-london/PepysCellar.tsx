// ---------------------------------------------------------------------------
// PepysCellar (kyle-london, cut 32). Dwarkesh map style (styles/dwarkesh-map.md), the umber page with no map
// (kits/maps TexcocoPage), the redesigned cast (londonCastV2.tsx) in the depth pass (londonDepth.tsx, DEPTH.md).
// Opaque 1080x1920, 29.97 fps, 143 frames.
//
// CHECK LINE: "Pepys, a pillar of the Royal Society, walked into his own cellar and stepped in his neighbour's
// sewage" — and took it in his stride: the disgust is ours, not his.
//
// THE LINE: "...you know, the stuff that Pepys does, bodily functions is like mind blowing to us."
// WORD -> FRAME: know 2 · the 6 · stuff 7 · that 15 · Pepys 22 · does 30 · bodily 46 · functions 58 · is 78 · like 93 ·
// mind 97 · blowing 113 · to 122 · us 131 (cut back to the speaker at 143)
// DURATION: the slot 32.933 -> 37.704 s (in frame 987 -> out frame 1130 at 29.97) = 143 frames (f0..f142).
//
// THE MOTION: one continuous camera in Pepys's brick cellar, one-point perspective (eye y -340, the VP on the camera's
// centre line), flagstones to the VP, barrels as volumes, daylight falling down the stairs from the door at the upper
// left. f0: Pepys (the same cream Pepys as cut 22, candle in his far hand) is coming down the stone stairs; the camera
// follows him down. His left shoe lands in a dark glossy patch at the foot of the stairs beside the damp right-hand
// wall (contact f50, first reaction f51: a ripple, the shoe sinks a little, four flies lift into the candlelight). He
// pauses and glances down (f56-68), throws one irritated look at the streak on the neighbour's wall (f66-82), steps his
// other foot down, scrapes the sole twice on the edge of the bottom step (f84-96: contact with the step f84) and calmly
// walks on toward a wine barrel (f98-). On "mind blowing to us" the camera pushes in and tilts down on the patch and
// his receding, printing shoe, while the flies keep circling in the light: the "ugh" is left with the viewer. The mess
// itself is never drawn: only a dark shadow shape, a wet rim, prints and a stain on the wall.
// Colour: Pepys is the "old": cream / umber; NO orange anywhere (orange = the new science). The flame is pale cream
// with a warm umber halo.
//
// DEPTH: eye y -340; dRef 900 at kRef 2.5, dolly 0.5 (the push-in has parallax). Stairs at Z -70..70 (7 risers of
// 40, goings of 55, the bottom riser at X 0); Pepys walks the stair's middle (Z 0), then on into the room toward the
// barrel (Z 0 -> ~110); the right wall X 230, the left wall X -600, the back wall Z 760, the ceiling y -540. Light:
// one, upper left (the door). Contact shadows on the treads and the floor; the cast's form shadow.
//
// SOURCES: The Diary of Samuel Pepys, 20 October 1660 (going down into his cellar he put his foot into a great heap
// of turds: Mr Turner's house of office was full and coming into his cellar; "which do trouble me, but I will have
// it helped"), via the Pepys Diary online (pepysdiary.com). No figures or dates on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera } from "../kits/maps/texcocoShared";
import { swayCam } from "../kits/maps/incaShared";
import { POSES, Pepys, castAnchors, headTurn, idle, lerpFig, walkPose, type FigPose } from "./londonCastV2";
import { Box, ContactShadow, Cylinder, GroundPlane, perspective, type DepthOpts, type Persp } from "./londonDepth";

export const FPS = 30000 / 1001;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const PP = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
/** a smooth closed outline through the points (Catmull-Rom): the pool and the seep have soft edges, never corners */
const smoothD = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${PP(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${PP([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${PP([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${PP(p2)}`;
  }
  return `${d}Z`;
};
const DARK = "#17120D";
const INK = "#E9DDBF";
/** the pool and the stain: a wet dark umber (never black), its rim catching the candle */
const POOL = "#2A2018";
// architecture: dark umber planes in cream line (styles/dwarkesh-map.md)
const ARCH = { lit: "#5A4A37", mid: "#4A3D2E", dark: "#2F271E", line: INK };

// ---------------------------------------------------------------------------
// THE ROOM (3D units = the cast's; floor Y 0, up -Y, Z behind the front plane)
// ---------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -340, dRef: 900, kRef: 2.5, dolly: 0.5 };
const WALL_R = 300;
const WALL_L = -600;
const BACK_Z = 760;
const CEIL = -540;
/** the doorway at the top of the stairs, in the stairwell wall behind the landing (X0, X1, top Y) */
const DOOR: [number, number, number] = [-445, -350, -505];
const STAIR_Z: [number, number] = [-70, 70];
const RISE = 40;
const GOING = 55;
const N_RISERS = 7;
/** the X of riser j (1..7; 7 = the bottom riser at X 0) */
const riserX = (j: number) => -GOING * (N_RISERS - j);
/** the height of the surface under X (the landing, a tread or the floor) */
const treadY = (X: number) => (X >= 0 ? 0 : X < riserX(1) ? -RISE * N_RISERS : -RISE * N_RISERS + RISE * (Math.floor((X - riserX(1)) / GOING) + 1));
/** the body's path down the stairs (a smooth line through the treads) */
const bodyY = (X: number) => Math.max(-RISE * N_RISERS, Math.min(0, ((X - GOING / 2) * RISE) / GOING));

// ---------------------------------------------------------------------------
// PEPYS: the walk down (stride = one going), contact at f50 with his left shoe at X 27.5
// ---------------------------------------------------------------------------
const STAIR_V = (2 * GOING) / 26; // units / frame (one cycle = two treads in 26 frames)
const F_CONTACT = 50;
const X_REF = riserX(1); // footfalls land on tread centres
const stairX = (f: number) => {
  if (f <= F_CONTACT) return -(F_CONTACT - f) * STAIR_V;
  return 0;
};
const BASE: FigPose = {
  ...POSES.stand(1),
  yaw: 0.86,
  headYaw: 0.82,
  pitch: 9,
  lean: 1.5,
  armL: { w: [-14, -146], elbow: [-0.7, 0.6], fist: 0.35, hand: 8 },
  armR: { w: [62, -206], elbow: [0.4, 1], fist: 1, hand: -24 },
  // no standing foot offsets: the walk's footfalls land exactly on the tread centres
  footL: [0, 0],
  footR: [0, 0],
};
/** the standing ankle's default x in the rig (figureRig's leg: sgn * 21 * cos(yaw) * a / 60) */
const ankle0 = (sgn: number, yaw: number) => sgn * 21 * Math.cos(yaw) * (57 / 60);
/** set a pose's feet to world sole positions (X, Y) for a figure whose `at` is (Xa, Ya), scale 1 */
const plantFeet = (q: FigPose, Xa: number, Ya: number, L: P2, R: P2): FigPose => ({
  ...q,
  footL: [L[0] - Xa - ankle0(-1, q.yaw), L[1] - Ya],
  footR: [R[0] - Xa - ankle0(1, q.yaw), R[1] - Ya],
});
/** the walk down the stairs: walkPose with stride = GOING, each foot's height put on the tread under it */
const stairPose = (f: number) => {
  const Xa = stairX(f);
  const phase = (Xa - X_REF) / (2 * GOING);
  let q = walkPose(BASE, phase, 1, GOING);
  q = { ...q, armR: BASE.armR };
  // each ankle lands 10 units behind a tread's centre, so the shoe (its toe forward) sits in the middle of the tread
  const fx = (o: number) => Xa + o - 10;
  const Lx = fx(q.footL[0]);
  const Rx = fx(q.footR[0]);
  // lift the swinging foot over the nosing it passes: a foot never goes below the tread under it
  const Ly = Math.min(treadY(Lx - 8), treadY(Lx + 20)) + q.footL[1];
  const Ry = Math.min(treadY(Rx - 8), treadY(Rx + 20)) + q.footR[1];
  // his base sits at the LOWER foot's tread (a leg cannot reach down a whole riser from a hip set on the stair line):
  // the higher foot bends its knee. A continuous line 0.6 of a riser below the stair line (no bob).
  const Ya = Math.min(0, bodyY(Xa) + RISE * 0.6) - 2;
  q = plantFeet(q, Xa, Ya, [Lx, Ly], [Rx, Ry]);
  return { q, Xa, Ya, L: [Lx, Ly] as P2, R: [Rx, Ry] as P2 };
};
const AT_CONTACT = stairPose(F_CONTACT);
// after the contact (world positions of his feet and his body, Z 0)
const L0 = AT_CONTACT.L; // the left shoe, in the patch
const R0 = AT_CONTACT.R; // the right shoe, on the bottom tread
const R1: P2 = [50, 0]; // the right shoe, stepped down beside it
const SCRAPE: P2 = [-6, -RISE]; // the left sole on the edge of the bottom step
const L2: P2 = [58, 0];
// the walk on, into the mid-ground toward the barrel: along this heading (X, Z), the speed ramping in over 12 frames;
// his footfalls are planted in 3D on the path (left / right of it), so the feet do not slide as he recedes
const F_WALK = 98;
const WALK_DIR: P2 = [0.62, 0.78];
const WALK_PERP: P2 = [0.78, -0.62];
const WALK_V = 5;
const WALK_STRIDE = 46;
const walkDist = (f: number) => {
  const t = f - F_WALK;
  if (t <= 0) return 0;
  return t < 12 ? (WALK_V * t * t) / 24 : WALK_V * 6 + WALK_V * (t - 12);
};
/** a foot's distance along the path and its lift, for a leg phase (walkPose's timing: planted u < 0.5, then a swing) */
const legOnPath = (ph: number) => {
  const n = Math.floor(ph);
  const u = ph - n;
  const land = 2 * WALK_STRIDE * n + WALK_STRIDE / 2;
  if (u < 0.5) return { s: land, lift: 0, planted: true };
  const v = (u - 0.5) / 0.5;
  return { s: land + 2 * WALK_STRIDE * ease(v), lift: 15 * Math.sin(Math.PI * v) + 6 * (1 - v) * (1 - v) * (v > 0 ? 1 : 0), planted: false };
};
/** the footfalls of the walk on (path distance, side): where the prints go */
export const WALK_FOOTFALLS = Array.from({ length: 8 }, (_, n) => ({ s: WALK_STRIDE * (n + 0.5), side: n % 2 === 0 ? -1 : 1 }));
/** a foot's local offset for a figure drawn at `body` (3D), through the camera: the projected difference / his scale */
const localFoot = (P: Persp, body: [number, number, number], foot: [number, number, number], sgn: number, yaw: number): P2 => {
  const pb = P.p(body[0], body[1], body[2]);
  const pf = P.p(foot[0], foot[1], foot[2]);
  const r = P.r(body[2]);
  return [(pf[0] - pb[0]) / r - ankle0(sgn, yaw), (pf[1] - pb[1]) / r];
};

const pepysAt = (f: number, P: Persp) => {
  // --- on the stairs
  if (f <= F_CONTACT) {
    const s = stairPose(f);
    return { q: s.q, X: s.Xa, Y: s.Ya, Z: 0, sole: s.L, B0: [0, 0] as P2 };
  }
  // --- the pause, the glance, the step down, the scrape (feet keyed in world space)
  const t = f;
  const Xa = mix(AT_CONTACT.Xa, 14, ease((t - 50) / 10)) + mix(0, 18, ease((t - 70) / 12)) + mix(0, 8, ease((t - 90) / 8));
  const Ya = mix(AT_CONTACT.Ya, -6, ease((t - 50) / 10)) * (1 - ease((t - 70) / 12));
  // the right foot steps down off the tread (f70-80), an arc
  const ur = ease((t - 70) / 10);
  const R: P2 = [mix(R0[0], R1[0], ur), mix(R0[1], R1[1], ur) - 22 * Math.sin(Math.PI * ur)];
  // the left foot: sunk a hair in the patch (f50-82), then back to the step's edge and two scrapes (f84-96), then down
  const ua = ease((t - 80) / 4);
  const scr = c01((t - 84) / 12); // two strokes
  const stroke = Math.sin(scr * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0 -> 1 -> 0 -> 1 -> 0 over the two
  const ub = ease((t - 96) / 4);
  let L: P2 = [L0[0], 3 * ease((t - 50) / 4)];
  const atEdge: P2 = [SCRAPE[0] - 16 + 22 * stroke, SCRAPE[1] + 1.5 * Math.sin(scr * Math.PI * 4)];
  L = [mix(L[0], atEdge[0], ua) , mix(L[1], atEdge[1], ua) - 18 * Math.sin(Math.PI * ua) * (1 - c01((t - 84) / 2))];
  L = [mix(L[0], L2[0], ub), mix(L[1], L2[1], ub) - 16 * Math.sin(Math.PI * ub)];
  // the body: the stance pose, the head goes down to the shoe, then a look at the wall, then ahead
  const stance: FigPose = { ...BASE, crouch: 2, lean: mix(1.5, -2, ease((t - 82) / 6)) * 1 + 3 * ease((t - 84) / 4) * (1 - ub), liftL: -18 * ua * (1 - ub) };
  const lookDown = ease((t - 54) / 14) * (1 - ease((t - 66) / 10));
  const lookWall = ease((t - 66) / 9) * (1 - ease((t - 80) / 10));
  const lookShoe2 = ease((t - 82) / 6) * (1 - ease((t - 96) / 8));
  const headYaw = 0.82 + 0.12 * lookDown + 0.36 * lookWall + 0.02 * lookShoe2;
  const pitch = 9 + 14 * lookDown - 12 * lookWall + 10 * lookShoe2;
  let q: FigPose = headTurn(stance, headYaw, 0);
  q = { ...q, pitch, brow: 0.45 * lookWall, mouth: -0.22 * lookWall + 0.1 * ease((t - 98) / 10), lids: 0.25 * lookWall };
  // the candle comes down a little toward the floor while he looks, then up again
  q = { ...q, armR: { ...q.armR, w: [mix(62, 74, lookDown + lookShoe2 * 0.6), mix(-206, -170, lookDown + lookShoe2 * 0.6)] } };
  // out of the stair walk: the body eases from the contact pose into the stance (f50-60), the feet stay planted
  q = lerpFig(AT_CONTACT.q, q, ease((t - F_CONTACT) / 10));
  const stand = plantFeet(q, Xa, Ya, L, R);
  if (t < F_WALK) return { q: stand, X: Xa, Y: Ya, Z: 0, sole: L, B0: [Xa, 0] as P2 };
  // --- the walk on, into the mid-ground
  const B0: P2 = [Xa, 0];
  const d = walkDist(t);
  const X = B0[0] + WALK_DIR[0] * d;
  const Z = B0[1] + WALK_DIR[1] * d;
  const amt = ease((t - F_WALK) / 10);
  const wbase: FigPose = { ...BASE, yaw: 1.08, headYaw: 1.04, pitch: 3, mouth: 0.12, armR: { w: [64, -204], elbow: [0.4, 1], fist: 1, hand: -24 } };
  const phase = d / (2 * WALK_STRIDE);
  let w = walkPose(wbase, phase, amt, WALK_STRIDE);
  w = { ...w, armR: wbase.armR };
  const qb = lerpFig(q, w, amt);
  // the feet: on the path in 3D, blended in from where they stood
  const onPath = (ph: number, side: number, from: P2): [number, number, number] => {
    const lg = legOnPath(ph);
    const px = B0[0] + WALK_DIR[0] * lg.s + WALK_PERP[0] * side * 7;
    const pz = B0[1] + WALK_DIR[1] * lg.s + WALK_PERP[1] * side * 7;
    return [mix(from[0], px, amt), -lg.lift * amt + from[1] * (1 - amt), mix(0, pz, amt)];
  };
  const fL = onPath(phase, -1, L);
  const fR = onPath(phase + 0.5, 1, R);
  const body: [number, number, number] = [X, 0, Z];
  const q2: FigPose = { ...qb, footL: localFoot(P, body, fL, -1, qb.yaw), footR: localFoot(P, body, fR, 1, qb.yaw) };
  return { q: q2, X, Y: 0, Z, sole: L, B0 };
};

// ---------------------------------------------------------------------------
// CAMERA: following him down (f0-50), easing onto the foot of the stairs (f50-96), then a push-in and tilt down onto
// the patch and his receding shoe (f97-142). Keys on the front plane (Pepys's plane on the stairs).
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  { f: 0, k: 2.18, wx: -238, wy: -470, sy: 720 },
  { f: 30, k: 2.36, wx: stairX(30) + 30, wy: bodyY(stairX(30)) - 300, sy: 705 },
  { f: 62, k: 2.5, wx: 52, wy: -300, sy: 720 },
  { f: 96, k: 2.56, wx: 74, wy: -260, sy: 745 },
  { f: 120, k: 2.2, wx: 100, wy: 0, sy: 1010 },
  { f: 142, k: 1.98, wx: 104, wy: 0, sy: 1010 },
]);
const camOf = (f: number) => swayCam(camAt(f), f);

// ---------------------------------------------------------------------------
// THE PATCH, THE PRINTS, THE FLIES
// ---------------------------------------------------------------------------
// the seepage: an irregular dark pool from the base of the right wall to the foot of the stairs (X, Z on the floor)
// (the pool at the foot of the stairs, and the tongue it seeps along from the wall's base, behind his path)
const PATCH: P2[] = [
  [6, -26], [22, -50], [48, -58], [70, -54], [88, -60], [108, -40], [116, -12], [106, 18], [92, 40], [66, 48], [40, 56], [20, 38], [8, 14],
];
// the seep from the base of the wall to the pool: a narrow, uneven wet trail (lighter than the pool)
const SEEP: P2[] = [
  [104, -6], [150, 6], [200, 14], [250, 18], [300, 20], [300, 320], [270, 240], [236, 160], [196, 96], [150, 52], [112, 26],
];
const ringOnFloor = (P: Persp, X: number, Z: number, rx: number, rz: number) => {
  const c = P.p(X, 0, Z);
  const w = rx * P.r(Z);
  const h = Math.max(0.5, (P.p(X, 0, Z - rz)[1] - P.p(X, 0, Z + rz)[1]) / 2);
  return { c, w, h };
};
type V3 = [number, number, number];
type Fly = { seed: number; land?: [number, number, V3] };
/** five flies, always in flight on looping, jittery paths: low over the pool before he comes; they scatter up into the
 *  candlelight at the contact; while he stands they buzz round the candle and over the pool; when he walks on two
 *  follow his candle and three keep circling over the pool and the prints. Two land on the rim for a moment and lift. */
const FLIES: Fly[] = [
  { seed: 1 },
  { seed: 2, land: [63, 75, [104, 0, 8]] },
  { seed: 3 },
  { seed: 4, land: [117, 129, [26, 0, -44]] },
  { seed: 5 },
];
const flyAt = (fl: Fly, f: number, candle: V3): { at: V3; landed: number } => {
  const s = fl.seed;
  const follows = s === 1 || s === 3;
  const pool: V3 = [62, -30 - 8 * Math.sin(f * 0.05 + s), 0];
  const overPrints: V3 = [96, -34 - 10 * Math.sin(f * 0.06 + s * 2), 40];
  const nearCandle: V3 = [candle[0] + 4, candle[1] - 14, candle[2]];
  // where its loop is centred: pool -> (scatter at the contact) candle -> (when he walks on) candle or the pool/prints
  const up = ease((f - (F_CONTACT + s)) / 12);
  const back = !follows ? ease((f - (88 + 4 * s)) / 18) : 0;
  const away = !follows ? ease((f - (102 + 3 * s)) / 16) : 0;
  const midStand: V3 = s % 2 ? nearCandle : [70 + 10 * s, -70 - 6 * s, 10];
  const c0: V3 = [mix(pool[0], midStand[0], up), mix(pool[1], midStand[1], up), mix(pool[2], midStand[2], up)];
  const c1: V3 = [mix(c0[0], pool[0], back), mix(c0[1], pool[1], back), mix(c0[2], pool[2], back)];
  const c: V3 = follows && f > F_WALK ? nearCandle : [mix(c1[0], overPrints[0], away * 0.6), mix(c1[1], overPrints[1], away * 0.6), mix(c1[2], overPrints[2], away * 0.6)];
  // the loop: an uneven ellipse, the radius breathing, plus a fast jitter (the buzz)
  const ang = f * (0.21 + 0.035 * s) * (s % 2 ? 1 : -1) + s * 1.9;
  const rad = (follows && f > F_WALK ? 22 : 30) + 9 * Math.sin(f * 0.11 + s * 3);
  const jit = (k: number) => 3.2 * (Math.sin(f * 1.7 + s * k) + 0.6 * Math.sin(f * 2.9 + s * k * 2.1));
  let at: V3 = [c[0] + rad * Math.cos(ang) + jit(1), c[1] + 10 * Math.sin(ang * 1.6 + s) + jit(2), c[2] + rad * 0.7 * Math.sin(ang) + jit(3)];
  let landed = 0;
  if (fl.land) {
    const [fa, fb, spot] = fl.land;
    const w = ease((f - fa) / 4) * (1 - ease((f - (fb - 4)) / 4));
    at = [mix(at[0], spot[0], w), mix(at[1], spot[1] - 1.5, w), mix(at[2], spot[2], w)];
    landed = w;
  }
  return { at, landed };
};
const FlyEl: React.FC<{ P: Persp; at: V3; f: number; seed: number; landed: number }> = ({ P, at, f, seed, landed }) => {
  const c = P.p(at[0], at[1], at[2]);
  const r = P.r(at[2]);
  const flap = Math.abs(Math.sin(f * 2.3 + seed * 1.3));
  const open = 1 - landed;
  // a small round dark body; two pale wing flicks out to the sides and up (a beat: their angle flickers frame to
  // frame); folded back along the body when it sits
  const wa = open * (28 + 34 * flap);
  return (
    <g transform={`translate(${PP(c)}) scale(${(r * 1.7).toFixed(4)})`}>
      {[-1, 1].map((sd) => (
        <ellipse key={sd} cx={sd * (1.2 + 3.6 * open)} cy={-1.4 - 1.6 * open} rx={3.6} ry={1.25} fill="#E2D6B6" opacity={0.62 * (0.6 + 0.4 * open)} transform={`rotate(${(sd * -wa + (1 - open) * sd * 70).toFixed(1)} ${sd * 1.2} -1)`} filter="url(#cl-wing)" />
      ))}
      <circle cx={0} cy={0} r={2.2} fill={DARK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ROOM'S PLANES
// ---------------------------------------------------------------------------
const quad = (P: Persp, pts: [number, number, number][]) => `M${pts.map(([x, y, z]) => PP(P.p(x, y, z))).join("L")}Z`;
const Bricks: React.FC<{ P: Persp; wall: "R" | "L" | "B"; z0?: number; z1?: number }> = ({ P, wall, z0 = -400, z1 = BACK_Z }) => {
  // courses (constant Y) and staggered joints, in cream at a low opacity, fading with depth
  let d = "";
  let joints = "";
  const course = 26;
  const brick = 64;
  if (wall === "B") {
    for (let Y = 0; Y > CEIL; Y -= course) d += `M${PP(P.p(WALL_L, Y, BACK_Z))}L${PP(P.p(WALL_R, Y, BACK_Z))}`;
    let row = 0;
    for (let Y = 0; Y > CEIL; Y -= course, row++) for (let X = WALL_L + (row % 2) * brick * 0.5; X < WALL_R; X += brick) joints += `M${PP(P.p(X, Y, BACK_Z))}L${PP(P.p(X, Y - course, BACK_Z))}`;
    return (
      <g>
        <path d={d} fill="none" stroke={INK} strokeWidth={0.9 * P.r(BACK_Z)} strokeOpacity={0.1} />
        <path d={joints} fill="none" stroke={INK} strokeWidth={0.8 * P.r(BACK_Z)} strokeOpacity={0.08} />
      </g>
    );
  }
  const X = wall === "R" ? WALL_R : WALL_L;
  const pieces = 8;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = mix(z0, z1, i / pieces);
    const zb = mix(z0, z1, (i + 1) / pieces);
    let dd = "";
    for (let Y = 0; Y > CEIL; Y -= course) dd += `M${PP(P.p(X, Y, za))}L${PP(P.p(X, Y, zb))}`;
    const a = mix(0.2, 0.07, (za - z0) / (z1 - z0));
    els.push(<path key={i} d={dd} fill="none" stroke={INK} strokeWidth={1.1 * P.r((za + zb) / 2)} strokeOpacity={a} />);
  }
  let row = 0;
  for (let Y = 0; Y > CEIL; Y -= course, row++) {
    for (let Z = z0 + (row % 2) * brick * 0.5; Z < z1; Z += brick) joints += `M${PP(P.p(X, Y, Z))}L${PP(P.p(X, Y - course, Z))}`;
  }
  els.push(<path key="j" d={joints} fill="none" stroke={INK} strokeWidth={0.9 * P.r(200)} strokeOpacity={0.09} />);
  return <g>{els}</g>;
};

/** the stone stairs: a solid flight, one column (box) per tread from the landing down to the bottom step, each drawn
 *  with the faces the camera sees (londonDepth Box), the columns farthest from the VP first; a cream nosing line and
 *  the door's daylight on the upper treads */
const Stairs: React.FC<{ P: Persp; smear: number }> = ({ P, smear }) => {
  const [Z0, Z1] = STAIR_Z;
  const cols = Array.from({ length: N_RISERS }, (_, i) => {
    const j = i + 1;
    return { j, X0: j === 1 ? WALL_L : riserX(j - 1), X1: riserX(j), top: -RISE * N_RISERS + RISE * (j - 1) };
  });
  const vx = P.vp[0];
  const order = [...cols].sort((a, b) => Math.abs((b.X0 + b.X1) / 2 - vx) - Math.abs((a.X0 + a.X1) / 2 - vx));
  const ink = { lit: ARCH.lit, mid: ARCH.dark, dark: ARCH.mid };
  return (
    <g>
      {order.map((c) => (
        <g key={c.j}>
          <Box P={P} X0={c.X0} X1={c.X1} Y0={c.top} Y1={0} Z0={Z0} Z1={Z1} ink={ink} uid={`cl-st${c.j}`} />
          {/* daylight from the door on the upper treads, and the nosing's lit edge */}
          <path d={quad(P, [[c.X0, c.top, Z0], [c.X1, c.top, Z0], [c.X1, c.top, Z1], [c.X0, c.top, Z1]])} fill={INK} opacity={0.14 * (1 - (c.j - 1) / N_RISERS) + 0.02} />
          <path d={`M${PP(P.p(c.X0, c.top, Z0))}L${PP(P.p(c.X1, c.top, Z0))}L${PP(P.p(c.X1, c.top, Z1))}`} fill="none" stroke={INK} strokeWidth={1.2 * P.r(Z0)} strokeOpacity={0.32} />
        </g>
      ))}
      {/* the flight's side face as ONE stepped plane (no seams between the columns) */}
      <path
        d={`M${[[WALL_L, 0], [WALL_L, -RISE * N_RISERS], ...cols.flatMap((c): [number, number][] => [[c.X1, c.top], [c.X1, c.top + RISE]])].map(([x, y]) => PP(P.p(x, y, Z0))).join("L")}Z`}
        fill={ARCH.mid}
        stroke={DARK}
        strokeWidth={2.2 * P.r(Z0)}
        strokeLinejoin="round"
      />
      {/* the stone courses of the side face, cream at a low opacity */}
      <path d={Array.from({ length: N_RISERS }, (_, i) => { const Y = -RISE * (i + 1); const xr = riserX(N_RISERS - i); return `M${PP(P.p(WALL_L, Y + RISE * 0.5, Z0))}L${PP(P.p(xr, Y + RISE * 0.5, Z0))}`; }).join("")} fill="none" stroke={INK} strokeWidth={0.9 * P.r(Z0)} strokeOpacity={0.12} />
      <path d={`M${cols.flatMap((c): [number, number][] => [[c.X0, c.top], [c.X1, c.top]]).map(([x, y]) => PP(P.p(x, y, Z0))).join("L")}`} fill="none" stroke={INK} strokeWidth={1.2 * P.r(Z0)} strokeOpacity={0.3} />
      {smear > 0.01 ? <path d={quad(P, [[-30 * smear, -RISE, -14], [0, -RISE, -14], [0, -RISE, 16], [-24 * smear, -RISE, 12]])} fill={DARK} opacity={0.62} /> : null}
    </g>
  );
};

const PepysCellar: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  // the camera cranes up as it pushes in at the end (the eye rises f96 -> f142): it looks down onto the pool and the trail
  const P = perspective(cam, { ...DEPTH, eyeY: mix(DEPTH.eyeY, -760, ease((frame - 96) / 46)) });
  const pep = pepysAt(frame, P);
  const pose = idle(pep.q, frame, 1, frame > F_CONTACT && frame < F_WALK ? 0.6 : 0);
  const A = P.at(pep.X, pep.Z);
  const at: P2 = P.p(pep.X, pep.Y, pep.Z);
  const anc = castAnchors("pepys", pose, [pep.X, pep.Y], 1);
  const candle: [number, number, number] = [anc.handR[0], anc.handR[1] - 48, pep.Z];

  // the patch, glossy where the candle is near
  const patch = PATCH.map(([x, z2]) => P.p(x, 0, z2));
  const patchD = smoothD(patch);
  // the ripple from the contact (f50-64)
  const rip = c01((frame - F_CONTACT) / 14);
  const ring = ringOnFloor(P, L0[0] + 10, 0, 14 + 34 * rip, 9 + 20 * rip);
  // the wet rim round the left shoe while it stands in the patch (f50-82)
  const inPatch = frame >= F_CONTACT && frame < 82;
  const rim = ringOnFloor(P, L0[0] + 12, 0, 22, 12);
  // the prints of the walk on: where each foot comes down after he leaves the patch, fading
  // (each footfall is printed from the moment it lands; the ones still in the pool leave nothing; four fading prints)
  const prints: { X: number; Z: number; a: number }[] = [];
  if (frame > F_WALK) {
    let k = 0;
    WALK_FOOTFALLS.forEach((ff, m) => {
      if (walkDist(frame) < WALK_STRIDE * m || k >= 4) return;
      const X = pep.B0[0] + WALK_DIR[0] * ff.s + WALK_PERP[0] * ff.side * 7;
      const Z = pep.B0[1] + WALK_DIR[1] * ff.s + WALK_PERP[1] * ff.side * 7;
      if (Z < 24) return;
      prints.push({ X, Z, a: [0.66, 0.56, 0.46, 0.36][k] });
      k++;
    });
  }
  // the damp streak down the right wall from a crack (the neighbour's privy behind it)
  // the source: a crack stepping through the brick joints high on the right wall, a wet dark stain running down from
  // it to the floor and on into the pool, a few soaked bricks round it, a wet sheen on its edge
  const streak: V3[] = [
    [WALL_R, -384, 130], [WALL_R, -360, 190], [WALL_R, -300, 222], [WALL_R, -220, 250], [WALL_R, -140, 280], [WALL_R, -60, 306], [WALL_R, 0, 320],
    [WALL_R, 0, 20], [WALL_R, -50, 40], [WALL_R, -130, 62], [WALL_R, -210, 80], [WALL_R, -290, 96], [WALL_R, -350, 110],
  ];
  const crack: V3[] = [[WALL_R, -418, 150], [WALL_R, -418, 166], [WALL_R, -392, 166], [WALL_R, -392, 182], [WALL_R, -366, 182], [WALL_R, -366, 198], [WALL_R, -340, 198], [WALL_R, -340, 214]];
  const wetBricks: [number, number, number, number][] = [
    [-392, -366, 198, 262],
    [-340, -314, 150, 214],
    [-314, -288, 230, 294],
    [-366, -340, 102, 166],
    [-418, -392, 166, 230],
    [-262, -236, 280, 344],
    [-236, -210, 40, 104],
  ];
  const smear = ease((frame - 84) / 12);
  // the flame reflects in the pool while the candle is over it
  const reflect = c01(1 - Math.abs(candle[0] - 62) / 90) * c01(1 - Math.abs(candle[2] - 0) / 80);
  const lookLight = c01(1 - Math.abs(frame - 74) / 20);

  return (
    <TexcocoPage cam={cam} vignette={0.85}>
      <WorldSvg cam={cam}>
        {/* the ceiling (above the eye: its underside), its joists to the VP */}
        <path d={quad(P, [[WALL_L, CEIL, -600], [WALL_R, CEIL, -600], [WALL_R, CEIL, BACK_Z], [WALL_L, CEIL, BACK_Z]])} fill={ARCH.dark} />
        <path d={Array.from({ length: 12 }, (_, i) => { const X = WALL_L + 35 + i * 70; return `M${PP(P.p(X, CEIL, -600))}L${PP(P.p(X, CEIL, BACK_Z))}`; }).join("")} fill="none" stroke={INK} strokeWidth={2 * P.r(200)} strokeOpacity={0.08} />
        {/* the back wall, the floor, the side walls */}
        <path d={quad(P, [[WALL_L, CEIL, BACK_Z], [WALL_R, CEIL, BACK_Z], [WALL_R, 0, BACK_Z], [WALL_L, 0, BACK_Z]])} fill="#382E23" />
        <Bricks P={P} wall="B" />
        <GroundPlane P={P} kind="flags" x0={WALL_L} x1={WALL_R} z0={-700} zFar={1500} course={150} uid="cl-gp" tone={0.85} />
        <path d={quad(P, [[WALL_R, CEIL, -700], [WALL_R, CEIL, BACK_Z], [WALL_R, 0, BACK_Z], [WALL_R, 0, -700]])} fill={ARCH.mid} />
        <Bricks P={P} wall="R" z0={-700} />
        <path d={quad(P, [[WALL_L, CEIL, -700], [WALL_L, CEIL, BACK_Z], [WALL_L, 0, BACK_Z], [WALL_L, 0, -700]])} fill={ARCH.lit} />
        <Bricks P={P} wall="L" z0={-700} />
        {/* the corners, cream line */}
        <path d={[[WALL_R, 0], [WALL_R, CEIL], [WALL_L, 0], [WALL_L, CEIL]].map(([x, y]) => `M${PP(P.p(x, y, -700))}L${PP(P.p(x, y, BACK_Z))}`).join("") + `M${PP(P.p(WALL_L, CEIL, BACK_Z))}L${PP(P.p(WALL_R, CEIL, BACK_Z))}L${PP(P.p(WALL_R, 0, BACK_Z))}L${PP(P.p(WALL_L, 0, BACK_Z))}Z`} fill="none" stroke={INK} strokeWidth={1.4 * P.r(300)} strokeOpacity={0.22} />
        {/* the source: soaked bricks, the stain from the crack down to the floor, the crack, a wet sheen on the edge */}
        {wetBricks.map(([y0, y1, z0, z1], i) => (
          <path key={`wb${i}`} d={quad(P, [[WALL_R, y0, z0], [WALL_R, y0, z1], [WALL_R, y1, z1], [WALL_R, y1, z0]])} fill={POOL} opacity={0.55} />
        ))}
        <path d={quad(P, streak)} fill={POOL} opacity={0.9} />
        <path d={`M${crack.map(([x, y, z2]) => PP(P.p(x, y, z2))).join("L")}`} fill="none" stroke={DARK} strokeWidth={3.2 * P.r(180)} strokeLinejoin="round" />
        <path d={`M${streak.slice(0, 7).map(([x, y, z2]) => PP(P.p(x, y, z2 + 2))).join("L")}`} fill="none" stroke={INK} strokeWidth={1.3 * P.r(200)} strokeOpacity={0.22 + 0.2 * lookLight} />
        {/* the barrels (wine), far first */}
        {[
          { X: 60, Z: 600 },
          { X: 232, Z: 160 },
        ].map((b, i) => (
          <g key={i}>
            <ContactShadow P={P} X={b.X} Z={b.Z} w={70} d={60} uid={`cl-bcs${i}`} />
            <Cylinder P={P} X={b.X} Z={b.Z} R={52} Y0={-128} Y1={0} ink={{ lit: "#6E5A40", mid: "#57472F", dark: "#33291E" }} uid={`cl-b${i}`} />
            {[-108, -64, -20].map((Y) => {
              const e = ringOnFloor({ ...P, p: (x, _y, z2) => P.p(x, Y, z2) } as Persp, b.X, b.Z, 53, 53);
              return <path key={Y} d={`M${PP([e.c[0] - e.w, e.c[1]])}A${e.w.toFixed(2)},${e.h.toFixed(2)} 0 0 0 ${PP([e.c[0] + e.w, e.c[1]])}`} fill="none" stroke={INK} strokeWidth={1.5 * P.r(b.Z)} strokeOpacity={0.35} />;
            })}
          </g>
        ))}
        {/* the patch: a dark, slightly glossy shadow shape — never anything more */}
        <path d={smoothD(SEEP.map(([x, z2]) => P.p(x, 0, z2)))} fill={POOL} opacity={0.82} />
        <path d={patchD} fill={POOL} opacity={0.94} />
        <clipPath id="cl-pool">
          <path d={patchD} />
        </clipPath>
        {/* the flame's reflection in it while the candle is near, and a low sheen */}
        <g clipPath="url(#cl-pool)">
          <path d={patchD} fill="none" stroke={INK} strokeWidth={3 * P.r(0)} strokeOpacity={0.1} />
          {reflect > 0.02 ? <ellipse cx={P.p(candle[0], -candle[1] - 30, candle[2])[0]} cy={P.p(candle[0], -candle[1] - 30, candle[2])[1]} rx={4 * P.r(candle[2])} ry={11 * P.r(candle[2])} fill="#F2E7C8" opacity={0.42 * reflect} /> : null}
          {reflect > 0.02 ? <ellipse cx={P.p(candle[0], -candle[1] - 30, candle[2])[0]} cy={P.p(candle[0], -candle[1] - 30, candle[2])[1]} rx={22 * P.r(candle[2])} ry={9 * P.r(candle[2])} fill="#A8885C" opacity={0.14 * reflect} /> : null}
        </g>
        <path d={patchD} fill="none" stroke={INK} strokeWidth={1 * P.r(0)} strokeOpacity={0.22} />
        <path d={`M${PP(P.p(40, 0, 14))}Q${PP(P.p(76, 0, -6))} ${PP(P.p(100, 0, 6))}M${PP(P.p(160, 0, 40))}Q${PP(P.p(220, 0, 90))} ${PP(P.p(280, 0, 170))}`} fill="none" stroke={INK} strokeWidth={1.5 * P.r(20)} strokeOpacity={0.26} />
        {rip > 0 && rip < 1 ? <ellipse cx={ring.c[0]} cy={ring.c[1]} rx={ring.w} ry={ring.h} fill="none" stroke={INK} strokeWidth={1.3} strokeOpacity={0.4 * (1 - rip)} /> : null}
        {/* daylight from the door at the top of the stairs (the upper left), falling down the flight */}
        <defs>
          <radialGradient id="cl-day">
            <stop offset="0" stopColor={INK} stopOpacity={0.2} />
            <stop offset="0.5" stopColor={INK} stopOpacity={0.07} />
            <stop offset="1" stopColor={INK} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={quad(P, [[WALL_L, CEIL, STAIR_Z[1]], [riserX(1), CEIL, STAIR_Z[1]], [riserX(1), -RISE * N_RISERS, STAIR_Z[1]], [WALL_L, -RISE * N_RISERS, STAIR_Z[1]]])} fill={ARCH.mid} stroke={DARK} strokeWidth={2 * P.r(70)} />
        <path d={Array.from({ length: 10 }, (_, i) => { const Y = -RISE * N_RISERS - 26 * (i + 1); return `M${PP(P.p(WALL_L, Y, STAIR_Z[1]))}L${PP(P.p(riserX(1), Y, STAIR_Z[1]))}`; }).join("")} fill="none" stroke={INK} strokeWidth={0.9 * P.r(70)} strokeOpacity={0.12} />
        {/* the doorway: daylight beyond, its reveal, the light spilling onto the landing and down the first treads */}
        <path d={quad(P, [[DOOR[0], DOOR[2], STAIR_Z[1]], [DOOR[1], DOOR[2], STAIR_Z[1]], [DOOR[1], -RISE * N_RISERS, STAIR_Z[1]], [DOOR[0], -RISE * N_RISERS, STAIR_Z[1]]])} fill="#D8C79E" stroke={DARK} strokeWidth={2.2 * P.r(70)} />
        <path d={quad(P, [[DOOR[0], DOOR[2], STAIR_Z[1]], [DOOR[0], DOOR[2], STAIR_Z[1] + 30], [DOOR[0], -RISE * N_RISERS, STAIR_Z[1] + 30], [DOOR[0], -RISE * N_RISERS, STAIR_Z[1]]])} fill="#9C8964" />
        <path d={quad(P, [[DOOR[0] + 8, DOOR[2] + 30, STAIR_Z[1] + 30], [DOOR[1] - 8, DOOR[2] + 30, STAIR_Z[1] + 30], [DOOR[1] - 4, -RISE * N_RISERS, STAIR_Z[1] + 30], [DOOR[0] + 4, -RISE * N_RISERS, STAIR_Z[1] + 30]])} fill="#EFE4C6" opacity={0.6} />
        <ellipse cx={P.p((DOOR[0] + DOOR[1]) / 2, -380, STAIR_Z[1])[0]} cy={P.p((DOOR[0] + DOOR[1]) / 2, -380, STAIR_Z[1])[1]} rx={430} ry={380} fill="url(#cl-day)" />
        <Stairs P={P} smear={smear} />
        <path d={quad(P, [[DOOR[0], -RISE * N_RISERS, STAIR_Z[1]], [DOOR[1], -RISE * N_RISERS, STAIR_Z[1]], [DOOR[1] + 40, -RISE * N_RISERS, STAIR_Z[0]], [DOOR[0] - 20, -RISE * N_RISERS, STAIR_Z[0]]])} fill="#EFE4C6" opacity={0.22} />
        {[1, 2, 3].map((j) => {
          const top = -RISE * N_RISERS + RISE * j;
          return <path key={`dl${j}`} d={quad(P, [[riserX(j), top, STAIR_Z[1]], [riserX(j + 1), top, STAIR_Z[1]], [riserX(j + 1), top, STAIR_Z[1] - 70], [riserX(j), top, STAIR_Z[0]]])} fill="#EFE4C6" opacity={0.16 - 0.04 * j} />;
        })}
        {/* Pepys */}
        <ContactShadow P={P} X={pep.X} Z={pep.Z} Y={frame <= F_CONTACT ? treadY(pep.X + 10) : 0} uid="cl-pcs" />
        {/* the prints: wet marks on the floor (over the floor's shadows) */}
        {prints.map((pr, i) => {
          // a shoe print on the floor: the sole and the heel, along the way he walks
          const at2 = (u: number, v: number): P2 => P.p(pr.X + WALK_DIR[0] * u + WALK_PERP[0] * v, 0, pr.Z + WALK_DIR[1] * u + WALK_PERP[1] * v);
          const ell = (cu: number, ru: number, rv: number) => `M${Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return PP(at2(cu + ru * Math.cos(a), rv * Math.sin(a))); }).join("L")}Z`;
          return (
            <g key={i}>
              {/* a smudged sole (wider at the toe) and the heel: dark wet marks, no rim */}
              <path d={ell(18, 16.5, 12.5) + ell(0, 13.5, 9.5) + ell(-22, 9, 9)} fill="#0E0A07" opacity={Math.min(0.95, pr.a * 1.55)} filter="url(#cl-print)" />
            </g>
          );
        })}

        <Pepys pose={pose} at={at} scale={A.scale} uid="cl-pep" held="candle" heldIn="far" flicker={frame * 0.9} flameWobble={0.15} shade={1} />
        {/* the wet rim over his sole while it stands in the patch (the shoe "sinks" a hair) */}
        {inPatch ? <path d={`M${PP([rim.c[0] - rim.w, rim.c[1]])}A${rim.w.toFixed(2)},${rim.h.toFixed(2)} 0 0 0 ${PP([rim.c[0] + rim.w, rim.c[1]])}Z`} fill={DARK} opacity={0.85} /> : null}
        {inPatch ? <path d={`M${PP([rim.c[0] - rim.w * 0.8, rim.c[1] + rim.h * 0.5])}A${(rim.w * 0.8).toFixed(2)},${(rim.h * 0.6).toFixed(2)} 0 0 0 ${PP([rim.c[0] + rim.w * 0.6, rim.c[1] + rim.h * 0.6])}`} fill="none" stroke={INK} strokeWidth={1.2} strokeOpacity={0.3} /> : null}
        {/* the flies */}
        <defs>
          <filter id="cl-print" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={1.1} />
          </filter>
          <filter id="cl-wing" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={0.45} />
          </filter>
        </defs>
        {FLIES.map((fl) => {
          const fa = flyAt(fl, frame, candle);
          return <FlyEl key={fl.seed} P={P} at={fa.at} f={frame} seed={fl.seed} landed={fa.landed} />;
        })}
      </WorldSvg>
    </TexcocoPage>
  );
};

export default PepysCellar;
