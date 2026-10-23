// ---------------------------------------------------------------------------
// LockThatDoor (kyle-covid, cut 56; the clip's last graphic). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 175 frames. The set: lockDoorSet.tsx; where every microbe is: lockDoorSwarm.ts; the
// organisms are the clip's covidMicrobes.tsx (cut 48's module: drawMicrobe for the ones at the door and the orange
// virion, the baked swarm for the air).
//
// CHECK LINE: "The air around us is full of microbes; shut the door on them and they swarm every crack, looking for a
// way in — and one finds it."
//
// THE LINE: "[this] room, and they're constantly seeing if you manage to lock that door, and they're just looking for a
// way to break in." (before it, on the speaker: "It's because there are billions and billions and billions of microbes
// in this")
// WORD -> FRAME (f0 = 56.8902 s): ROOM 4 · and 11 · they're 18 · CONSTANTLY 25 · SEEING 32 · if 43 · you 50 · manage 54 ·
// to 61 · LOCK 67 · that 72 · DOOR 78 · and 85 · they're 90 · just 94 · LOOKING 97 · for 105 · a 113 · WAY 116 · to 121 ·
// BREAK 125 · IN 138 (ends f147); f147-174 a living hold.
// DURATION: the slot 56.890 -> 62.729 s = 5.839 s x 29.97 = 175 frames (f0..f174).
//
// THE MOTION: the front of a small house at night, the door standing ajar with the hall's cream light spilling across
// the porch's stone flags, the lantern's cone and all the air full of cream microbes (far ones small, near ones big and
// soft; every visible one a featured kind: spiky, hairy, tailed, coiled). They drift toward the light; from SEEING a
// stream of them converges on the lit crack while a hand comes round the door's edge from inside (four fingers out
// f19-24, lit by the crack's light) and pulls it shut (f27-61), letting go as it closes (f48-53). LOCK: the door reaches
// the stop with a sliver of light left at the latch side (CONTACT f61, FIRST REACTION f62: a small knock back); the
// lever is lifted from inside (f59-63), the bolt crosses the sliver (f63-67, home on LOCK f67) while the keyhole blinks
// (the lock turning), and the sliver goes out as the door is drawn tight (f67-71); the lever drops back (f68-73). The
// stream arrives just too late and BUMPS the shut door (each one's contact f62-72, first reaction the next frame: a hard
// stop, a small rebound, a squash), piling up at the latch side. THAT DOOR / LOOKING: now the hall's light leaks only
// at the keyhole, the slit under the door and the hinge-side seam; the microbes spread over the door to them like moths
// (f76-128) and search, each gap its one smooth activity: a row pressed along the slit (mixed featured kinds, all
// thicker than the slit is tall) with a wave running along it, circling and probing round the keyhole, climbing the
// seams, one walking the lever's bar (the lever gives a little at the tip); crawlers cross the flags toward the door,
// and a steady inflow (one every ~5 frames from f78) flies in out of the dark at the frame's sides, low to the
// threshold or high to the door's face. The ORANGE one (the clip's virion, the only orange thing) comes out of the dark
// at the left (f76, off frame until ~f84), swims along the threshold and slows into the one free place in the row
// (f122); BREAK: CONTACT f124 (it touches the door's foot), FIRST REACTION f125 (it flattens into the slit); from the
// low eye the slit is a lit slot with depth (the hall's floorboards running in under the door): on IN (f138) its front
// half is under the door's bottom edge, squashed flat in the slot and lit by the hall's light (drawn only inside the
// slot, behind the edge), its back half still bulging round and orange on our side; two pushes (f138-149) and a final
// heave (f149-155) carry the last of it under the door; THROUGH at f155: it stands up again on the hall's floor
// (f155-164) and moves a little way in, seen only through the slot with its orange glow on the lit floor, while the
// row closes in on the gap it used and the swarm keeps pressing.
// CAMERA: one continuous move: a push-in (zoom 2.8 -> 4.85, one lobe of speed peaking at f100, a creep at the end) and
// a CRANE DOWN (eye 116 -> 20 units above the threshold, one lobe of speed peaking at f78, nearly down by f120, then a
// creep), so the flags in front become a foreshortened ramp in one-point perspective leading to the gap, its nearest
// band sinking into the dense low air. The slit under the door is the anchor: its projected row goes 1050 -> 932 (above
// the caption bands on every frame), the keyhole above it (y 605 -> 160), the orange virion ~65 px as it enters, ~100
// px at the end (y 916). The door's top leaves the frame.
// THE AIR: palette A's ramp by height (sage-petrol high, espresso low), dimmed for night; every surface and microbe is
// fogged toward it by the eye's distance (local colour kept near) and a petrol veil hangs in the high air over the house
// front; the cream lights and the orange virion are unfogged, so they stand out of it.
// Orange = THE virus only (the one virion). Interior light, window, lantern: cream #F3EBDD; the door timber, plaster,
// stone and iron (no brass); the hand in the cast's skin.
//
// DEPTH: the porch flags Y 0 (running out past the camera), the threshold FL -6; the eye from FL - 116 to FL - 20 (the
// crane); dRef 700 at kRef 2.8, dolly 0.6; fog by the eye's distance (the night air above). The wall's face Z 0; the
// door leaf Z 8-16 (recessed in the opening, hinged on the left, opening inward); the sill Z -14..30; the lantern Z -26;
// air microbes Z -330..-16 (three depth bands); the ones at the door Z ~0-4; crawlers on the flags Z -500..-20.
// Painter's order: the set, then the microbes at the door (Z > -9, clipped to the doorway's opening when in its
// recess; the virion's inner half clipped to the slot under the door's edge), the lever and the lantern, then the
// nearer microbes (any that pass behind the lantern go under it).
//
// SOURCES: none on screen. The virion is the clip's SARS-CoV-2 drawing (covidMicrobes GENOMES.virion); the other
// microbes are illustrative.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airRamp, airWorldOf, c01, mixHex, rgbHex, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENOMES, MicrobeCanvas, SWARM_KINDS, bakeSwarm, blitSwarm, drawMicrobe, inkOf, mixInk, shapeOf, span, wobble } from "./covidMicrobes";
import { F_ANCHOR, buildSwarm, floorAt, leverWalk, micAt, type V3 } from "./lockDoorSwarm";
import {
  Bolt,
  CrackSpill,
  DH,
  DW,
  DZ,
  DoorLeaf,
  FL,
  GAP,
  HouseFront,
  IN_LIGHT,
  Interior,
  Jambs,
  KeyGlow,
  LAMP,
  Lever,
  LowAir,
  LampPool,
  Lantern,
  SeamLights,
  SlitGlow,
  SlitSpill,
  SliverGlow,
  Steps,
  leaf3,
  leafP,
  openingD,
} from "./lockDoorSet";

export const FPS = 30000 / 1001;
export const DURATION = 175;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const lin = (f: number, a: number, b: number) => c01((f - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const eio = (u: number, p = 2) => {
  const v = c01(u);
  return v < 0.5 ? Math.pow(2 * v, p) / 2 : 1 - Math.pow(2 * (1 - v), p) / 2;
};
const D2R = Math.PI / 180;
const f2 = (v: number) => v.toFixed(2);

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous push-in (zoom: one lobe of speed, peak f100) with a CRANE DOWN (eye height: one lobe of
// speed, peak f78): from 0.65 m above the threshold at f0 to just above it (20 units) by ~f120, then a creep; the
// slit under the door is the anchor (its projected row is placed on screen every frame), kept above the caption bands
// ---------------------------------------------------------------------------
const DREF = 700;
const KREF = 2.8;
const DOLLY = 0.6;
const EYE0 = FL - 116;
const EYE1 = FL - 20;
/** the slit's row (world Y at the door's face) */
const SLIT_Y = FL - GAP / 2;
const tableOf = (vel: (f: number) => number) => {
  const t = [0];
  for (let f = 1; f <= DURATION + 2; f++) t.push(t[f - 1] + 0.5 * (vel(f - 1) + vel(f)));
  const total = t[DURATION - 1];
  return t.map((v) => v / total);
};
const sampleOf = (T: number[]) => (f: number) => {
  if (f <= 0) return T[1] * f;
  const i = Math.max(0, Math.min(DURATION, Math.floor(f)));
  return T[i] + (T[i + 1] - T[i]) * (f - i);
};
// the zoom: a slow push from f0 (0.45 of the peak) through LOCK, the peak at f100, easing to a creep (0.15)
const camV = (f: number) => {
  const base = f < 100 ? 0.45 : 0.45 - 0.27 * sstep((f - 100) / 74);
  const sg = f < 100 ? 44 : 30;
  return base + Math.exp(-Math.pow((f - 100) / sg, 2));
};
const camS = sampleOf(tableOf(camV));
// the crane: slow from f0, the peak at f78 (as the door is locked and they spread over it), nearly down by f120,
// then a creep to the end
const craneV = (f: number) => 0.05 + Math.exp(-Math.pow((f - 78) / (f < 78 ? 36 : 24), 2));
export const craneS = sampleOf(tableOf(craneV));
export const eyeAt = (f: number) => EYE0 + (EYE1 - EYE0) * craneS(f);
export const depthAt = (f: number): DepthOpts => ({ eyeY: eyeAt(f), dRef: DREF, kRef: KREF, dolly: DOLLY });
const DcOf = (k: number) => DREF * Math.pow(KREF / k, DOLLY);
const K0 = 2.8;
const K1 = 4.85;
const camAt = (f: number): Cam => {
  const u = camS(f);
  const k = K0 * Math.pow(K1 / K0, u);
  const wx = 4 - 4 * u;
  const sy = 1050 - 118 * u;
  const Dc = DcOf(k);
  const eye = eyeAt(f);
  const wySlit = eye + (SLIT_Y - eye) * (Dc / (Dc + DZ));
  return { k, cx: wx, cy: wySlit - (sy - 960) / k };
};
export const camOf = (f: number): Cam => swayCam(camAt(f), f);
const REST = camOf(0);
/** world -> screen at frame f (the camera's own perspective) */
export const screenAt = (q: V3, f: number): P2 => {
  const cam = camOf(f);
  const Dc = DcOf(cam.k);
  const eye = eyeAt(f);
  const r = Dc / (Dc + q[2]);
  const wx = cam.cx + (q[0] - cam.cx) * r;
  const wy = eye + (q[1] - eye) * r;
  return [540 + (wx - cam.cx) * cam.k, 960 + (wy - cam.cy) * cam.k];
};
/** the porch point (Y 0) under a screen point at frame f */
const floorUnder = (sx: number, sy: number, f: number): V3 => {
  const cam = camOf(f);
  const Dc = DcOf(cam.k);
  const eye = eyeAt(f);
  const wx = cam.cx + (sx - 540) / cam.k;
  const wy = cam.cy + (sy - 960) / cam.k;
  const r = Math.max(1.0001, (wy - eye) / (0 - eye));
  return [cam.cx + (wx - cam.cx) / r, 0, Dc / r - Dc];
};

// ---------------------------------------------------------------------------
// THE ORANGE ONE: out of the dark at the left (f84), swimming at a steady pace down along the threshold to the one
// free place in the row at the slit (f122); CONTACT f124 (it touches the door's bottom edge), FIRST REACTION f125
// (it flattens into the slit); half through on "IN" (f138); still squeezing to the end (0.68 at f174)
// ---------------------------------------------------------------------------
export const V_SPAN = 21;
const F_V0 = 76;
const F_V1 = 122;
export const F_V_CONTACT = 124;
const V_REST: V3 = [-9, FL - 6.6, DZ - 7.2];
const bez = (a: V3, b: V3, c: V3, t: number): V3 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
};
const V_A: V3 = [-178, FL - 92, -70];
const V_B: V3 = [-70, FL - 58, -26];
/** the squeeze (0 outside .. 1 through): CONTACT f124, half through on IN (f138), two pushes (f138-149), then a final
 *  heave carries the last of it under the door (f149-155) */
export const squeezeAt = (f: number) => {
  if (f < F_V_CONTACT) return 0;
  if (f < 138) return 0.5 * eio(lin(f, F_V_CONTACT, 138), 1.4);
  if (f < 149) {
    const t = f - 138;
    const P = 5.5;
    return 0.5 + 0.22 * ((t - (P / (2 * Math.PI)) * Math.sin((2 * Math.PI * t) / P)) / 11);
  }
  return 0.72 + 0.28 * eio(lin(f, 149, F_THROUGH), 1.6);
};
/** through under the door (f155); then it stands up again inside (re-inflating f155-164) */
export const F_THROUGH = 155;
export const insideAt = (f: number) => sstep(lin(f, F_THROUGH, F_THROUGH + 9));
export const virAt = (f: number): V3 => {
  // a steady swim, then a smooth slowing into its place (C1)
  const t = c01((f - F_V0) / (F_V1 - F_V0));
  const t1 = 0.7;
  const vv = 1 / (t1 + (1 - t1) / 2);
  const w = t < t1 ? vv * t : vv * t1 + vv * (t - t1) - (vv / (2 * (1 - t1))) * (t - t1) * (t - t1);
  const p = bez(V_A, V_B, V_REST, w);
  const sq = squeezeAt(f);
  const swimY = 1.4 * Math.sin(f * 0.21) * (1 - lin(f, F_V1 - 6, F_V_CONTACT));
  // inside: from rest it moves a little way into the hall, along its floor
  const away = f > F_THROUGH ? eio(lin(f, F_THROUGH, DURATION + 6), 1.5) : 0;
  return [p[0] + 0.6 * Math.sin(f * 0.13) * sq - 3 * away, p[1] + swimY, p[2] + 2 * lin(f, F_V1, F_V_CONTACT) + 9 * sq + 44 * away];
};
/** the payoff's clear zone: no air microbe may cross the slit's row, the keyhole or the orange one late in the cut */
const keepClear = (q: V3, f: number, s: number) => {
  const [x, y] = screenAt(q, f);
  // the big out-of-focus ones near the lens keep to the frame's edges late in the cut
  const cam = camOf(f);
  const Dc = DcOf(cam.k);
  const px = ((s * Dc) / (Dc + q[2])) * cam.k;
  if (f >= 105 && px > 46 && x > 170 && x < 910 && y > 120 && y < 1060) return false;
  const sy = screenAt([0, FL - 3.5, DZ], f)[1];
  if (f >= 96 && Math.abs(y - sy) < 75 && x > 40 && x < 1040) return false;
  const kq = screenAt([-82 + 149, FL - 7 - 158, DZ], f);
  if (Math.hypot(x - kq[0], y - kq[1]) < 95) return false;
  if (f >= F_V0) {
    const vq = screenAt(virAt(f), f);
    if (Math.hypot(x - vq[0], y - vq[1]) < 150) return false;
  }
  return true;
};
/** a screen point at depth Z on frame f, in world units (for the inflow's entry points just off frame) */
const unprojAt = (sx: number, sy: number, Z: number, f: number): V3 => {
  const cam = camOf(f);
  const Dc = DcOf(cam.k);
  const eye = eyeAt(f);
  const wx = cam.cx + (sx - 540) / cam.k;
  const wy = cam.cy + (sy - 960) / cam.k;
  const r = Dc / (Dc + Z);
  return [cam.cx + (wx - cam.cx) / r, eye + (wy - eye) / r, Z];
};
export const SWARM = buildSwarm(REST, depthAt(0), SWARM_KINDS.length, keepClear, (sx, sy) => floorUnder(sx, sy, F_ANCHOR), unprojAt);
/** the lever's tester: when it reaches the bar's tip the lever gives a little under it (and springs back) */
const TESTER = SWARM.find((m) => m.gap === "lever");
const testerDip = (f: number) => {
  if (!TESTER) return 0;
  const sL = leverWalk(f, TESTER.fg as number);
  const at = c01((f - (TESTER.fg as number) + 4) / 12);
  return 5 * Math.pow(c01((sL - 0.75) / 0.17), 2) * at;
};
/** each microbe's resting heading (screen rad) */
const yaw0 = (seed: number) => 6.2832 * ((Math.sin(seed * 91.7 + 3.1) * 43758.5453) % 1);
/** microbes nearer than this are drawn above the lever and the lantern (the lever stands 8 proud of the leaf) */
const Z_SPLIT = -9;

// ---------------------------------------------------------------------------
// THE DOOR: ajar 26 deg; the hand comes round its edge (f18-23), pulls it shut (f27-61), lets go (f48-53); the door
// coasts to the stop leaving a sliver (contact f61, a small knock back); the bolt crosses the sliver (f63-67, LOCK
// f67); the door is drawn tight and the sliver goes out (f67-71)
// ---------------------------------------------------------------------------
const TH0 = 26 * D2R;
const TH_S = 2.4 * D2R;
const F_PULL = 27;
const F_CONTACT = 61;
const F_LOCK = 67;
export const thetaAt = (f: number) => {
  if (f < F_PULL) return TH0 + 0.35 * D2R * Math.sin(f / 9);
  if (f < F_CONTACT) {
    const u = (f - F_PULL) / (F_CONTACT - F_PULL);
    // a slow start under the pull, speed, then the coast into the stop
    const e = u < 0.55 ? 0.55 * Math.pow(u / 0.55, 2.1) : 0.55 + 0.45 * (1 - Math.pow(1 - (u - 0.55) / 0.45, 1.6));
    return TH0 + 0.35 * D2R * Math.sin(F_PULL / 9) * (1 - u) + (TH_S - TH0) * e;
  }
  // the knock at the stop, then the sliver held, then pulled tight
  const knock = 0.9 * D2R * Math.exp(-(f - F_CONTACT) / 1.6) * Math.sin((f - F_CONTACT) * 1.4);
  const tight = sstep(lin(f, F_LOCK, F_LOCK + 4));
  return Math.max(0, TH_S * (1 - tight) + knock * (1 - tight));
};
/** the bolt's travel (0..1): out of the leaf's edge across the sliver */
const boltAt = (f: number) => eio(lin(f, F_LOCK - 4, F_LOCK), 1.6);
/** the latch-side sliver's light: on while the crack is open; gone as the door is drawn tight */
const sliverAt = (f: number) => 1 - sstep(lin(f, F_LOCK, F_LOCK + 4));
/** the light through the open crack (0..1, by the angle) */
const crackAt = (f: number) => c01(thetaAt(f) / TH0);
/** the gaps' lights once shut (keyhole, slit, hinge seam): they carry the hall's light all along, but read once the
 *  crack's light is gone */
const gapsAt = (f: number) => 0.55 + 0.45 * sstep(lin(f, 50, F_LOCK + 6));
/** the keyhole blinks as the lock turns (the cam crossing it inside) */
const keyAt = (f: number) => {
  const blink = 1 - 0.85 * Math.exp(-Math.pow((f - (F_LOCK - 1.5)) / 1.4, 2));
  return blink;
};
/** the lever (deg; - = up): lifted from inside to engage the lock (f59-63), dropped back as the bolt is home (f68-73) */
const leverAt = (f: number) => -38 * eio(lin(f, 59, 63), 1.5) * (1 - eio(lin(f, 68, 73), 1.5));
/** the hand on the leaf's edge: how far the fingers have come round it (0..1) */
const handAt = (f: number) => eio(lin(f, 18, 23), 1.6) * (1 - eio(lin(f, 48, 53), 1.6));

/** the hand: four fingers curled round the leaf's free edge from inside (picture-book: no outline; warm skin lit from
 *  behind by the crack's light, a cream rim on each finger's crack side, a nail, the knuckle where it bends round the
 *  edge, a dark crease between fingers, a soft shadow on the door's face under them); they slide out from behind the
 *  edge one after another and back again (no fade) */
const Hand: React.FC<{ A: AirWorld; th: number; h: number; f: number }> = ({ A, th, h, f }) => {
  if (h < 0.005) return null;
  const L = (u: number, v: number, w = -2.6) => leafP(A, th, u, v, w);
  const P2s = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
  const skin = "#E2B996";
  const shade = "#9A6E55";
  const rim = "#F7E3C9";
  const crease = "#6E4A39";
  const fingers = [
    { v: 252, len: 22, w: 10.6, lag: 0 },
    { v: 241, len: 25, w: 11.2, lag: 0.08 },
    { v: 229.8, len: 24, w: 11, lag: 0.16 },
    { v: 219.2, len: 19, w: 9.8, lag: 0.24 },
  ];
  const rk = A.P.r(DZ);
  const els: React.ReactNode[] = [];
  // the shadow of the hand on the door's face (down and to the left of the fingers)
  const sh0 = L(167 - 20 * h, 214, -0.5);
  const sh1 = L(168, 258, -0.5);
  els.push(
    <ellipse
      key="sh"
      cx={f2((sh0[0] + sh1[0]) / 2 - 3 * rk)}
      cy={f2((sh0[1] + sh1[1]) / 2 + 4 * rk)}
      rx={f2(Math.abs(sh1[0] - sh0[0]) * 0.55 + 4 * rk)}
      ry={f2(Math.abs(sh1[1] - sh0[1]) * 0.55)}
      fill="#140E09"
      opacity={0.32 * h}
    />,
  );
  fingers.forEach((fg, i) => {
    const e = c01((h - fg.lag) / (1 - fg.lag));
    if (e <= 0.002) return;
    // a small grip: the fingers press a little as the door is pulled (f27-48)
    const grip = 0.7 * Math.sin(f * 0.4 + i) * lin(f, 27, 32) * (1 - lin(f, 44, 48));
    const len = fg.len * e;
    const uT = 169 - len + grip;
    const r = fg.w / 2;
    const pts: P2[] = [];
    const N = 12;
    for (let j = 0; j <= N; j++) {
      const a = Math.PI / 2 + (Math.PI * j) / N;
      pts.push(L(uT + r + r * Math.cos(a), fg.v + r * 0.96 * Math.sin(a)));
    }
    // round the edge into the crack (the curled part, in the crack's light)
    pts.push(L(170, fg.v - r * 0.92, 3.5), L(170, fg.v + r * 0.92, 3.5));
    const d = `M${pts.map(P2s).join("L")}Z`;
    const seg = (u0: number, u1: number, vv: number) => `M${P2s(L(u0, vv))}L${P2s(L(u1, vv))}`;
    const uA = Math.min(167, uT + r);
    els.push(
      <g key={i}>
        <path d={d} fill={skin} />
        {/* the crescent shadow along the finger's lower side */}
        <path d={seg(uA, 168, fg.v - r * 0.55)} stroke={shade} strokeWidth={f2(r * 0.8 * rk)} strokeOpacity={0.6} strokeLinecap="round" />
        {/* the crease against the next finger down */}
        <path d={seg(uA - r * 0.4, 169, fg.v - r * 0.98)} stroke={crease} strokeWidth={f2(0.9 * rk)} strokeOpacity={0.75 * e} strokeLinecap="round" />
        {/* the crack's light on its upper side */}
        <path d={seg(uA, 169, fg.v + r * 0.62)} stroke={rim} strokeWidth={f2(r * 0.42 * rk)} strokeOpacity={0.7} strokeLinecap="round" />
        {/* the knuckle where it bends round the edge */}
        <path d={`M${P2s(L(164.5, fg.v + r * 0.75))}L${P2s(L(164.5, fg.v - r * 0.7))}`} stroke={shade} strokeWidth={f2(0.9 * rk)} strokeOpacity={0.55 * e} strokeLinecap="round" />
        {/* the nail */}
        {len > 8 ? (
          <ellipse
            cx={f2(L(uT + r * 1.15, fg.v + r * 0.1)[0])}
            cy={f2(L(uT + r * 1.15, fg.v + r * 0.1)[1])}
            rx={f2(r * 0.62 * rk)}
            ry={f2(r * 0.42 * rk)}
            fill="#F2D6BE"
            opacity={0.85}
          />
        ) : null}
      </g>,
    );
  });
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// THE NIGHT AIR: palette A's ramp by height (petrol-teal high, espresso low and deep), dimmed for night, and the fog by
// the eye's distance that pulls every surface and microbe toward it (local colour kept near; the cream lights and the
// orange virion are not fogged, so they stand out of it)
// ---------------------------------------------------------------------------
const nightAirOf = (A: AirWorld): AirWorld => {
  const airRgb = (h: number) => {
    const hn = c01(h / 380);
    // (harmony pass: the low air leans petrol, not espresso, so the shadows sit in the clip's medium)
    const c = airRamp("A", lerp(0.4, 0.1, Math.pow(hn, 0.75)));
    const dim = lerp(0.72, 0.9, hn);
    return rgbHex([c[0] * dim, c[1] * dim, c[2] * dim]);
  };
  const fog = (Z: number) => 0.6 * (1 - Math.exp(-Math.max(0, A.Dc + Z - 150) / 850));
  const airHex = (_Z: number, h = 0) => airRgb(h);
  const tone = (hex: string, Z: number, h = 0) => mixHex(hex, airRgb(h), fog(Z));
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airRgb(h), 0.5 * fog(Z));
  return { ...A, fog, airHex, tone, toneO, screenAir: (wy: number) => airRgb(-wy) };
};
/** the high air over the house front: palette A's petrol-teal (#466C66) hanging in the air by height, strongest high
 *  up and thinning toward the threshold; masked off the light sources (the hall seen through the doorway, the window's
 *  glass, the keyhole's glow), which stay unfogged */
const HighAir: React.FC<{ A: AirWorld; uid: string; th: number }> = ({ A, uid, th }) => {
  const c = rgbHex(airRamp("A", 0.138));
  const leaf = [leafP(A, th, 0, 0), leafP(A, th, DW, 0), leafP(A, th, DW, DH), leafP(A, th, 0, DH)];
  const kc = leafP(A, th, 149, 160, -1);
  const kr = 9 * A.P.r(DZ);
  const wq = [A.P.p(118, FL - 338, 9), A.P.p(156, FL - 338, 9), A.P.p(156, FL - 74, 9), A.P.p(118, FL - 74, 9)];
  const D = (q: P2[]) => `M${q.map((p) => `${f2(p[0])},${f2(p[1])}`).join("L")}Z`;
  const cam = A.cam;
  const top = cam.cy - 980 / cam.k;
  const bot = cam.cy + (760 - 960) / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-ha`} gradientUnits="userSpaceOnUse" x1="0" y1={FL - 470} x2="0" y2={FL - 20}>
          <stop offset="0" stopColor={c} stopOpacity={0.74} />
          <stop offset="0.35" stopColor={c} stopOpacity={0.46} />
          <stop offset="0.7" stopColor={c} stopOpacity={0.2} />
          <stop offset="1" stopColor={c} stopOpacity={0.06} />
        </linearGradient>
        <linearGradient id={`${uid}-hs`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(bot)}>
          <stop offset="0" stopColor={c} stopOpacity={0.36} />
          <stop offset="0.5" stopColor={c} stopOpacity={0.14} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </linearGradient>
        <mask id={`${uid}-hm`} maskUnits="userSpaceOnUse" x={-1600} y={FL - 1400} width={3200} height={1420}>
          <rect x={-1600} y={FL - 1400} width={3200} height={1420} fill="#fff" />
          <path d={openingD} fill="#000" />
          <path d={D(leaf)} fill="#fff" />
          <path d={D(wq)} fill="#000" />
          <circle cx={f2(kc[0])} cy={f2(kc[1])} r={f2(kr)} fill="#000" />
        </mask>
      </defs>
      <rect x={-1600} y={FL - 1400} width={3200} height={1400} fill={`url(#${uid}-ha)`} mask={`url(#${uid}-hm)`} />
      {/* and the air seen against the upper frame on every camera state (the screen's top rows down to ~y 760) */}
      <rect x={f2(cam.cx - 600 / cam.k)} y={f2(top)} width={f2(1200 / cam.k)} height={f2(Math.max(0, Math.min(FL, bot) - top))} fill={`url(#${uid}-hs)`} mask={`url(#${uid}-hm)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const LockThatDoor: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = nightAirOf(airWorldOf({ cam, rest: REST, depth: depthAt(frame), frame, scene: { mood: "night", fogNear: 200, fogVis: 2600, fogMax: 0.9, hHigh: 800 } }));
  const P = A.P;
  const th = thetaAt(frame);
  const toScreen = (p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  const lp = toScreen(P.p(LAMP[0], LAMP[1] + 14, LAMP[2]));
  const tg = toScreen(P.p(40, FL - 40, -60));
  const lamp = { x: lp[0], y: lp[1], angle: Math.atan2(tg[1] - lp[1], tg[0] - lp[0]), spread: 0.4, reach: 2300 };
  const gaps = gapsAt(frame);
  const sc = (q: V3): P2 => toScreen(P.p(q[0], q[1], q[2]));
  const items = SWARM.map((m) => ({ m, st: micAt(m, frame) })).sort((a, b) => b.st.p[2] - a.st.p[2]);
  // ---- the light on each microbe: the lantern's cone, the crack's sheet of light (while open), the gaps (once shut)
  const lampLit = (x: number, y: number) => {
    const an = Math.atan2(y - lamp.y, x - lamp.x);
    let d = Math.abs(an - lamp.angle);
    if (d > Math.PI) d = 2 * Math.PI - d;
    return c01(1 - d / (lamp.spread * 1.25)) * c01(1 - Math.hypot(x - lamp.x, y - lamp.y) / lamp.reach);
  };
  const fe = leaf3(th, DW, 0, 0);
  const crackX0 = IN_LIGHT[0] + ((fe[0] - IN_LIGHT[0]) * (0 - IN_LIGHT[2])) / (fe[2] - IN_LIGHT[2]);
  const crackA = crackAt(frame);
  const crackLit = (q: V3) => {
    if (crackA < 0.01 || q[2] > 0) return 0;
    const t = (0 - q[2]) / (IN_LIGHT[2] - q[2]);
    const x = q[0] + t * (IN_LIGHT[0] - q[0]);
    const y = q[1] + t * (IN_LIGHT[1] - q[1]);
    const inX = c01((x - crackX0 + 3) / 6) * c01((84 + 3 - x) / 6);
    const inY = c01((FL - y) / 6);
    return crackA * inX * inY * Math.exp(q[2] / 420);
  };
  const keyW: V3 = leaf3(0, 149, 158, 0);
  const gapLit = (q: V3) => {
    if (gaps < 0.56) return 0;
    const g = (gaps - 0.55) / 0.45;
    const dk = Math.hypot(q[0] - keyW[0], q[1] - keyW[1], q[2] - keyW[2]);
    const ds = Math.hypot(Math.max(0, Math.abs(q[0]) - 80), q[1] - (FL - 3.5), q[2] - DZ);
    const dh = Math.hypot(q[0] - (-83), Math.max(0, Math.abs(q[1] - (FL - 180)) - 175), q[2] - DZ);
    return g * Math.max(Math.exp(-dk / 16), Math.exp(-ds / 15), 0.7 * Math.exp(-dh / 12));
  };
  // ---- draw order: far to near; the door's own (z > Z_SPLIT) under the lever and lantern, the rest above
  const vP = virAt(frame);
  const sq = squeezeAt(frame);
  const o0 = toScreen(P.p(-84, FL, 0));
  const o1 = toScreen(P.p(84, FL - 360, 0));
  const slitTop = toScreen(leafP(A, th, 0, 0));
  const slitR = toScreen(leafP(A, th, DW, 0));
  const slitBot = toScreen(P.p(0, FL, DZ));
  // the heading follows the travel over a wide window, so a hard stop turns it over ~12 frames, not in a snap
  const velOf = (m: (typeof SWARM)[number]) => {
    const a = sc(micAt(m, frame - 6).p);
    const b = sc(micAt(m, frame + 6).p);
    return [(b[0] - a[0]) / 12, (b[1] - a[1]) / 12];
  };
  const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) => {
    if (a < 0.01) return;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(243,235,221,${(0.42 * a).toFixed(3)})`);
    gr.addColorStop(0.5, `rgba(243,235,221,${(0.14 * a).toFixed(3)})`);
    gr.addColorStop(1, "rgba(243,235,221,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  const drawVirion = (ctx: CanvasRenderingContext2D) => {
    const g = GENOMES.virion;
    const q = sc(vP);
    const spanPx = V_SPAN * P.r(vP[2]) * cam.k;
    const px = spanPx / span(g);
    const w = wobble(frame, 7, 0.7);
    // heading: the way it swims, settling as it presses in
    const v0 = sc(virAt(frame - 1));
    const v1 = sc(virAt(frame + 1));
    const hv: P2 = [v1[0] - v0[0], v1[1] - v0[1]];
    const yaw = Math.atan2(0.4 * Math.sin(0.9) + hv[1] * 0.2, 0.4 * Math.cos(0.9) + hv[0] * 0.2) + w.yaw;
    const shape = shapeOf(g, { yaw, pitch: w.pitch * (1 - Math.min(1, sq)), roll: w.roll }, w.wave);
    const lit = Math.max(0.35, lampLit(q[0], q[1]), gapLit(vP));
    void lit;
    const inkOut = inkOf({ orange: 1 });
    const inkIn = inkOf({ orange: 1 });
    const slitMid = (slitTop[1] + slitBot[1]) / 2;
    const slotH = slitBot[1] - slitTop[1];
    const flatY = slotH / spanPx;
    const clipSlot = () => {
      ctx.beginPath();
      ctx.rect(slitTop[0], slitTop[1], slitR[0] - slitTop[0], slotH);
      ctx.clip();
    };
    // the flattened body in the slot: its width spreads as more of it is under the door
    const wIn = (0.45 + 0.55 * Math.min(1, sq * 4)) * (1 + 0.35 * sq);
    // the final heave (f149-155): the outside parts flatten into the same drawing as the part inside
    const fh = c01((sq - 0.72) / 0.28);
    const ins = insideAt(frame);
    if (frame < F_THROUGH) {
      // the slit's light round it as it reaches the door
      glow(ctx, q[0], q[1] + spanPx * 0.15, spanPx * 1.1, gapLit(vP) * 0.8 * (1 - fh));
      if (sq > 0) {
        // the half already through: flattened in the slot, behind the door's edge (only seen through the slot)
        ctx.save();
        clipSlot();
        ctx.translate(q[0], slitMid);
        ctx.scale(wIn, flatY);
        drawMicrobe(ctx, [{ s: shape, x: 0, y: 0 }], px, inkIn);
        ctx.restore();
        // the neck: squeezed to the slit's height on our side of the door
        const shrink = 1 - 0.42 * Math.min(sq, 0.72);
        ctx.save();
        ctx.translate(q[0], slitMid);
        ctx.scale(lerp(shrink * (0.5 + 0.5 * Math.min(1, sq * 4)) * (1 + 0.12 * sq), wIn, fh), flatY);
        drawMicrobe(ctx, [{ s: shape, x: 0, y: 0 }], px, mixInk(inkOut, inkIn, fh));
        ctx.restore();
      }
      // the half still outside: a round bulge on our side, shrinking as it goes in; in the final heave it flattens
      // into the slot and slips under the door's edge
      const shrink = 1 - 0.42 * Math.min(sq, 0.72);
      const bulgeY0 = lerp(q[1], slitMid - (spanPx / 2) * shrink * 0.1, Math.min(1, sq * 2));
      ctx.save();
      ctx.translate(q[0], lerp(bulgeY0, slitMid, fh));
      ctx.scale(lerp(shrink, wIn, fh), lerp(shrink * (1 - 0.1 * sq), flatY, fh));
      drawMicrobe(ctx, [{ s: shape, x: 0, y: 0 }], px, mixInk(inkOut, inkIn, fh));
      ctx.restore();
      if (sq > 0) {
        // lit by the hall's light: a warm-cream wash over whatever of it is in the slot
        ctx.save();
        clipSlot();
        ctx.globalCompositeOperation = "screen";
        glow(ctx, q[0], slitMid - slotH * 0.25, spanPx * 0.9, 0.55);
        ctx.restore();
      }
      return;
    }
    // THROUGH: it stands up again on the hall's floor and moves a little way in; seen only through the slot, its
    // orange glow on the lit floor round it (its top half is behind the door)
    const floorY = sc([vP[0], FL, vP[2]])[1];
    ctx.save();
    clipSlot();
    const og = ctx.createRadialGradient(q[0], floorY - slotH * 0.3, 0, q[0], floorY - slotH * 0.3, spanPx * 1.4);
    og.addColorStop(0, `rgba(255,176,0,${(0.62 * ins).toFixed(3)})`);
    og.addColorStop(0.45, `rgba(255,176,0,${(0.26 * ins).toFixed(3)})`);
    og.addColorStop(1, "rgba(255,176,0,0)");
    ctx.fillStyle = og;
    ctx.fillRect(q[0] - spanPx * 1.5, slitTop[1], spanPx * 3, slotH);
    const hy = lerp(flatY, 1, ins);
    ctx.translate(q[0], floorY - (spanPx / 2) * hy * 0.94);
    ctx.scale(lerp(wIn, 1, ins), hy);
    drawMicrobe(ctx, [{ s: shape, x: 0, y: 0 }], px, inkIn);
    ctx.globalCompositeOperation = "screen";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    glow(ctx, q[0], slitMid - slotH * 0.25, spanPx * 0.9, 0.55);
    ctx.restore();
  };
  // the lantern's box on screen (with its bracket and cap)
  const lanS = sc([LAMP[0], LAMP[1] - 8, LAMP[2]]);
  const lanW = 20 * P.r(LAMP[2]) * cam.k;
  const lanH = 52 * P.r(LAMP[2]) * cam.k;
  const drawMicrobes = (ctx: CanvasRenderingContext2D, layer: "back" | "front") => {
    const small = bakeSwarm({ key: "ltd-s", span: 56 });
    const big = bakeSwarm({ key: "ltd-b", span: 120 });
    const inLayer = (z: number) => (layer === "back" ? z > Z_SPLIT : z <= Z_SPLIT);
    const behindLantern = (q: V3, x: number, y: number, r: number) =>
      q[2] > LAMP[2] - 12 && Math.abs(x - lanS[0]) < lanW + r && y > lanS[1] - lanH - r && y < lanS[1] + lanH * 0.7 + r;
    let vDone = frame < F_V0 || !inLayer(vP[2]);
    for (const { m, st } of items) {
      const xy = sc(st.p);
      const rr = 0.5 * m.s * P.r(st.p[2]) * cam.k;
      const under = m.role === "air" && behindLantern(st.p, xy[0], xy[1], rr);
      const inFront = m.top || (inLayer(st.p[2]) && layer === "front" && !under) || false;
      const inBack = !m.top && ((layer === "back" && inLayer(st.p[2])) || under);
      if (layer === "back" ? !inBack : !inFront) continue;
      if (!vDone && st.p[2] < vP[2]) {
        drawVirion(ctx);
        vDone = true;
      }
      const [x, y] = sc(st.p);
      const spanPx = m.s * P.r(st.p[2]) * cam.k;
      if (x < -spanPx || x > 1080 + spanPx || y < -spanPx || y > 1920 + spanPx) continue;
      const vel = velOf(m);
      const b = yaw0(m.seed);
      const wob = wobble(frame, m.seed % 97, 0.6);
      // crawlers on the flags lie across the floor (their travel is into the picture, so it does not turn them)
      const lying = m.role === "ground" || m.gap === "slit" || m.gap === "lever";
      const yaw = lying ? (m.gap === "slit" || m.gap === "lever" ? 0.12 : 0.45) * Math.sin(b) + wob.yaw * (m.gap === "slit" ? 0.5 : 1) : Math.atan2(Math.sin(b) + 0.45 * vel[1], Math.cos(b) + 0.45 * vel[0]) + wob.yaw;
      const lit = Math.max(0.55, lampLit(x, y), crackLit(st.p), gapLit(st.p));
      const air = A.airHex(st.p[2], -st.p[1]);
      const fog = Math.min(0.7, 0.32 * (1 - lit) + A.fog(st.p[2]));
      // the nearest are a little out of focus
      const blur = m.role === "air" ? 2.6 * c01((-st.p[2] - 230) / 120) : m.gap === "near" ? 2.4 : 0;
      const back = gapLit(st.p);
      ctx.save();
      if (st.p[2] > -1) {
        ctx.beginPath();
        ctx.rect(o0[0], o1[1], o1[0] - o0[0], o0[1] - o1[1]);
        ctx.clip();
      }
      // resting on the ground, the step or the threshold: a soft contact shadow under it
      // (only as it comes down onto the surface: the shadow grows as the gap between them closes)
      const fy = floorAt(st.p[0], st.p[2]);
      const above = fy - (st.p[1] + 0.45 * m.s);
      const touch = c01(1 - above / 10);
      if ((m.role === "ground" || m.gap === "step" || m.gap === "slit") && touch > 0.01) {
        const c = sc([st.p[0] + 0.1 * m.s, fy, st.p[2]]);
        const rx = 0.55 * m.s * P.r(st.p[2]) * cam.k;
        const ry = Math.max(2, rx * 0.22);
        const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        sh.addColorStop(0, `rgba(34,24,15,${(0.5 * touch).toFixed(3)})`);
        sh.addColorStop(0.6, `rgba(34,24,15,${(0.22 * touch).toFixed(3)})`);
        sh.addColorStop(1, "rgba(34,24,15,0)");
        ctx.save();
        ctx.translate(c[0], c[1]);
        ctx.scale(rx, ry);
        ctx.fillStyle = sh;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      glow(ctx, x, y, spanPx * 0.78, back * 0.6);
      if (m.role !== "air") {
        const g = SWARM_KINDS[m.kind];
        const shape = shapeOf(g, { yaw, pitch: wob.pitch, roll: wob.roll }, wob.wave);
        ctx.translate(x, y);
        ctx.scale(1 / Math.sqrt(st.squash), st.squash);
        if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
        drawMicrobe(ctx, [{ s: shape, x: 0, y: 0 }], spanPx / span(g), inkOf({ tone: g.tone, fog, air }));
      } else {
        if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(2)}px)`;
        // the bake is fixed per microbe (the far, small ones from the small bake), so none switches as the camera pushes in
        blitSwarm(ctx, m.s > 8.6 ? big : small, m.kind, x, y, spanPx, { yaw, wave: frame * 0.21 + m.seed, fog, air });
      }
      ctx.restore();
    }
    if (!vDone) drawVirion(ctx);
  };
  // the lantern is in shot beside the door: its glow in the air is kept small, or it lifts the whole night
  const v = { ...A.v, mood: { ...A.v.mood, sun: { ...A.v.mood.sun, r: 480, a: 0.13 } } };
  return (
    <AirStage v={v} bloom={0.22} lamp={lamp} shafts={0.8} grade={0.45}>
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="ltd-open">
            <path d={openingD} />
          </clipPath>
        </defs>
        {/* inside the doorway: the hall, the reveals, the slit's light, the leaf, the hand, the bolt, the seams */}
        <g clipPath="url(#ltd-open)">
          <Interior A={A} uid="ltd-in" />
          <Jambs A={A} latchLit={sliverAt(frame)} part="back" />
          <SlitGlow A={A} th={th} a={1} />
          <DoorLeaf A={A} th={th} uid="ltd-lf" keyLight={gaps * keyAt(frame)} />
          <Jambs A={A} latchLit={sliverAt(frame)} part="front" />
          <SliverGlow A={A} th={th} a={sliverAt(frame) * sstep(lin(frame, 44, 56))} uid="ltd-sv" />
          <Bolt A={A} th={th} e={boltAt(frame)} lit={sliverAt(frame)} />
          <KeyGlow A={A} th={th} a={gaps * keyAt(frame) * sstep(lin(frame, 55, 75))} uid="ltd-kg" />
          <Hand A={A} th={th} h={handAt(frame)} f={frame} />
          <SeamLights A={A} th={th} a={sstep(lin(frame, 58, 72))} uid="ltd-sm" />
        </g>
        <HouseFront A={A} uid="ltd-hf" />
        <HighAir A={A} uid="ltd-ha" th={th} />
        <Steps A={A} uid="ltd-gr" />
        <LowAir A={A} uid="ltd-la" y0={1280} yEnd={toScreen(P.p(0, 0, P.zNear + 4))[1]} color={mixHex(A.airHex(0, 0), rgbHex(A.v.airAtScreen(1900)), 0.35)} a={0.45 + 0.55 * craneS(frame)} />
        <LampPool A={A} uid="ltd-pool" a={0.45} />
        <CrackSpill A={A} th={th} a={crackAt(frame)} uid="ltd-cs" />
        <SlitSpill A={A} a={gaps * 0.9} uid="ltd-ss" />
      </WorldSvg>
      <MicrobeCanvas draw={(ctx) => drawMicrobes(ctx, "back")} />
      <WorldSvg cam={cam}>
        <Lever A={A} th={th} lever={leverAt(frame) + testerDip(frame)} />
        <Lantern A={A} uid="ltd-ln" frame={frame} />
      </WorldSvg>
      <MicrobeCanvas draw={(ctx) => drawMicrobes(ctx, "front")} />
    </AirStage>
  );
};

export default LockThatDoor;
