// ---------------------------------------------------------------------------
// LethalAdversary (44_LethalAdversary; Sarah Paine on Dwarkesh, "Death ground:
// why regime change is brutal"). Dwarkesh map style, the non-map umber page;
// Sun Tzu's world (Warring States China). Opaque 1080x1920, 24 fps.
//
// CHECK LINE: Corner a broken, scattered people and they arm and close ranks:
// the failed state becomes a dense host that throws the invader back.
//
// THE LINE: "But executing them is really difficult because you put people on
// death ground and they fight with incredible desperation. And you can
// transform a failed state into a lethal adversary."
// WORD -> FRAME: But 2 · executing 7 · them 20 · is 25 · really 29 · difficult 34 ·
//   because 42 · you 48 · put 51 · people 55 · on 60 · death 64 · ground 69 ·
//   and 73 · they 77 · fight 80 · with 86 · incredible 92 · desperation 102 ·
//   And 115 · you 123 · can 127 · transform 131 · a 143 · failed 151 · state 158 ·
//   into 167 · a 179 · lethal 198 · adversary 205.
// DURATION: sequence 44.042 s - 53.375 s at 24 fps = frames 1057-1281 = 224.
//
// THE MOTION (one transformation + one continuous pull-back, rising):
//   0-75    a ruined rammed-earth town wall, its gate broken into the breach, the
//           old army's weapons and its banner lying in the rubble; dim people
//           slumped and drifting. Cream columns (three files a side) march in from
//           both edges at constant speed; the people run ahead of them into the
//           middle, backs to the breach; the heads of the files level their ge.
//   75-134  the man at the front takes up the fallen banner and heaves it up,
//           orange; the change runs out from him: each man stoops, takes the
//           weapon at his feet, turns orange (the vest wipes on) and turns to face
//           out in guard: a hedge of points both ways.
//   134-205 the two halves press outward and the cream files recoil and give
//           ground; armed men come over the rubble of the breach from behind the
//           wall; all along the wall armed men rise onto the wall walk behind the
//           parapet (ge first), and the rising camera shows the whole town behind
//           the wall up in arms.
//   205-224 settled and alive: the banner waving, points bobbing, the host rocking.
// BEATS: columns halt 50-70; banner gripped 85, upright ~97; arming 75-134;
//   push 134-199 (first recoil ~134-140); host over the crest from ~115;
//   wall walk manned 134-185; men through the breach 96-206.
// Orange = the people put on death ground (once armed); dim = before; cream =
//   the invaders and everything else. No text.
//
// HOW: a real 3D billboard camera (dolly back + crane up, keyed, pchip), so the
// wall's crest sinks past the ranks behind it as the camera rises: they rise
// into view from behind the wall, never from nothing. The near cast (people,
// invaders, the men from the breach) is live SVG from the figure module; the
// host behind the wall (thousands) and the men on the wall walk are sprites of
// the same figures on two canvases, AllAdultMales' technique (one timeline per
// man on his own start frame, so only a few dozen states, rasterised on demand);
// the wall walk's canvas sits between the wall's top and its face, so the face
// and parapet hide a man until he has climbed up behind them.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, INK, LAND, clamp01, hash, pchip, type P2 } from "./incaShared";
import { Banner, CREAM, DgFigure, GRIP_AT, Ge, ORANGE, POSES as DP, Spear, aimWeapon, dgAnchors, idle, lerpFig, mirrorPose, onShaft, poseTrack, runLegs, track, type FigPose, type Ink } from "./dgFigures";
import { TexcocoPage, walkPose } from "./texcocoShared";

export const FPS = 24;
export const DURATION = 224;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const FRAME_W = 1080;
const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// COLOUR
// ---------------------------------------------------------------------------
const rgbOf = (c: string): number[] => {
  if (c.charAt(0) === "#") return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const m = c.match(/[\d.]+/g) || ["0", "0", "0"];
  return [Number(m[0]), Number(m[1]), Number(m[2])];
};
const hex2 = (v: number) => {
  const s = Math.round(Math.max(0, Math.min(255, v))).toString(16);
  return s.length < 2 ? `0${s}` : s;
};
const mixC = (a: string, b: string, t: number) => {
  const pa = rgbOf(a);
  const pb = rgbOf(b);
  const u = clamp01(t);
  return `#${pa.map((v, i) => hex2(v + (pb[i] - v) * u)).join("")}`;
};
const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ main: mixC(a.main, b.main, t), deep: mixC(a.deep, b.deep, t), hair: mixC(a.hair, b.hair, t) });
const PAGE_INK: Ink = { main: LAND, deep: LAND, hair: LAND };
/** a man not yet committed: the cream sunk toward the page (shadeInk) */
const DIM: Ink = mixInk(PAGE_INK, CREAM, 0.4);
/** the weapons lying in the rubble */
const DULL: Ink = mixInk(PAGE_INK, CREAM, 0.42);
/** the ruins: cream sunk toward the page */
/** the ruins in the map's page manner: umber planes (a little lighter than the page where lit, darker in
 *  shadow), cream LINE for edges, courses, crenels and cracks, engraved hatch for shade; no light fills */
const tone = (t: number) => (t >= 0 ? mixC(LAND, INK, t) : mixC(LAND, DARK, -t));
const WALL_FACE = tone(0.06);
const WALL_TOP = tone(0.15);
const WALL_JAMB = tone(-0.42);
const RUBBLE = tone(-0.22);
const RUBBLE_LIT = tone(0.03);
const TIMBER = tone(-0.08);
const STUD = tone(0.18);
/** a cream edge (for filled shapes) and a cream line */
const ce = (w: number, a: number) => ({ stroke: INK, strokeWidth: w, strokeOpacity: a, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });
const cl = (w: number, a: number) => ({ fill: "none", ...ce(w, a) });
/** engraved (dark) hatch */
const dl = (w: number, a: number) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });

const c01 = clamp01;
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const sgn = (v: number): 1 | -1 => (v < 0 ? -1 : 1);

// ---------------------------------------------------------------------------
// THE CAST: dgFigures (Commoner -> armed, Soldier), imported read-only.
// Figure-local units: feet at (0, 0), a man ~310 units tall. The ge is held in
// the NEAR fist (gripAt 175 from the butt); a man who turns round keeps it in
// the same fist, which is then his far one (gripAt 279: the same shaft line).
// ---------------------------------------------------------------------------
type Kind = "commoner" | "soldier";
type Pole = "ge" | "spear" | "banner";
type ManState = {
  kind: Kind;
  pose: FigPose;
  /** 0 = the plain belted robe, 1 = the lamellar vest */
  armed: number;
  ink: Ink;
  gear: Ink;
  weapon: Pole | "none";
  /** the banner's phase (cycles) */
  wave?: number;
  /** turn the weapon fist so the ge stands at this angle (deg, 0 = tip up, 90 = pointing screen right) */
  angle?: number;
  weaponArm?: "near" | "far";
  gripAt?: number;
  /** a ge lying at his feet (figure-local grip, angle, blade side), for the sprites */
  lying?: { at: P2; angle: number; dir: 1 | -1 };
  lyingW?: Pole;
  seed: number;
};
/** the near (rear) fist's place on the shaft, and the far (front) fist's: 104 units further up */
const gripNear = (w: Pole) => GRIP_AT[w];
const gripFar = (w: Pole) => GRIP_AT[w] + 104;
const ManArt: React.FC<{ m: ManState; at: P2; scale: number; uid: string }> = ({ m, at, scale, uid }) => {
  const o = { weapon: m.weapon, weaponArm: m.weaponArm, gripAt: m.gripAt };
  const pose = m.weapon !== "none" && m.angle !== undefined ? aimWeapon(m.pose, m.angle, m.kind, o) : m.pose;
  return (
    <>
      {m.lying ? (
        <LyingWeapon w={m.lyingW ?? "ge"} at={[at[0] + m.lying.at[0] * scale, at[1] + m.lying.at[1] * scale]} angle={m.lying.angle} dir={m.lying.dir} scale={scale} uid={`${uid}-l`} ink={m.gear} />
      ) : null}
      <DgFigure kind={m.kind} pose={pose} at={at} scale={scale} uid={uid} ink={m.ink} armed={m.armed} weapon={m.weapon} weaponArm={m.weaponArm} gripAt={m.gripAt} gearInk={m.gear} wave={m.wave} seed={m.seed} />
    </>
  );
};
/** where the weapon's grip is (figure-local units) when he holds it at `deg` in his near fist */
const gripAt = (kind: Kind, q: FigPose, deg: number, w: Pole = "ge"): P2 => dgAnchors(kind, aimWeapon(q, deg, kind, { weapon: w }), [0, 0], 1, { weapon: w }).grip;
/** a weapon lying on the ground (its grip at `at`, world px): the same art the man will hold; dir = the way he faces */
const LyingWeapon: React.FC<{ w: Pole; at: P2; angle: number; dir: 1 | -1; scale: number; uid: string; ink?: Ink }> = ({ w, at, angle, dir, scale, uid, ink = DULL }) =>
  w === "spear" ? <Spear at={at} angle={angle} dir={dir} scale={scale} ink={ink} uid={uid} /> : w === "banner" ? <Banner at={at} angle={angle} dir={dir} scale={scale} ink={ink} uid={uid} /> : <Ge at={at} angle={angle} dir={dir} scale={scale} ink={ink} uid={uid} />;

// the poses (facing screen right; face() mirrors). Right-facing: armL is the near arm.
const face = (q: FigPose, d: 1 | -1) => (d === 1 ? q : mirrorPose(q));
const R_STAND = DP.stand(1);
const R_SLUMP: FigPose = { ...R_STAND, pitch: 18, lean: 7, crouch: 10, roll: 3, brow: -0.3, lids: 0.5, mouth: -0.7, armL: { w: [14, -124], elbow: [-0.4, 1], fist: 0.1, hand: 0 }, armR: { w: [26, -122], elbow: [-0.4, 1], fist: 0.1, hand: 0 } };
const R_HUNCH: FigPose = { ...R_SLUMP, crouch: 66, lean: 28, pitch: 12, footL: [-18, 0], footR: [22, 0], armL: { w: [56, -84], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [64, -82], elbow: [-0.3, 1], fist: 0.3, hand: 0 } };
/** cornered: standing tense, fists half closed */
const R_STOOD: FigPose = { ...R_STAND, pitch: 3, crouch: 5, brow: 0.6, mouth: -0.5, armL: { w: [-2, -148], elbow: [-0.5, 1], fist: 0.6, hand: 0 }, armR: { w: [22, -146], elbow: [-0.5, 1], fist: 0.6, hand: 0 } };
const R_FLEE: FigPose = { ...R_STAND, lean: 9, pitch: 2, brow: 0.7, mouth: -0.6, headYaw: 0.4, armL: { w: [30, -160], elbow: [-0.6, 1], fist: 0.7, hand: 0 }, armR: { w: [-10, -150], elbow: [-0.6, 1], fist: 0.7, hand: 0 } };
const R_REACH: FigPose = { ...DP.reach(1), lean: 60, crouch: 82, pitch: 4, armL: { w: [78, -26], elbow: [-0.4, 1], fist: 0, hand: 0 }, armR: { w: [96, -30], elbow: [-0.4, 1], fist: 0.1, hand: 0 } };
const R_GRIP: FigPose = { ...R_REACH, lean: 61, crouch: 83, armL: { ...R_REACH.armL, fist: 1 }, armR: { ...R_REACH.armR, fist: 0.9 } };
const R_CARRY = DP.carry(1);
/** both fists at his chest, facing us: the middle of the turn (the ge held upright between them) */
const TURN: FigPose = { ...DP.front(), brow: 0.7, mouth: -0.4, armL: { w: [-6, -200], elbow: [-1, 0.6], fist: 1, hand: 0 }, armR: { w: [8, -200], elbow: [1, 0.6], fist: 1, hand: 0 } };
const R_GUARD = DP.guard(1);
const R_RECOIL = DP.recoil(1);
const CARRY_ANG = 3;
const GUARD_ANG = 76;
const WALK_STRIDE = 44;
/** units per run cycle (runLegs: the planted foot travels RUN.stride in 40% of a cycle) */
const RUN_LEN = 160;
/** the far fist closes on the shaft as the ge comes down (lerp the hand onto it) */
const levelled = (q: FigPose, kind: Kind, deg: number, onIt: number, o: { weapon: Pole; weaponArm?: "near" | "far"; gripAt?: number } = { weapon: "ge" }) => {
  const a = aimWeapon(q, deg, kind, o);
  // the other fist goes 104 units up the shaft from the rear (near) fist, or back from the front (far) one
  return onIt <= 0.001 ? a : lerpFig(a, onShaft(a, o.weaponArm === "far" ? -104 : 104, kind, o), sstep(onIt));
};

// ---------------------------------------------------------------------------
// THE CAMERA: a pinhole at (0, hc, zc) looking along +Z, the image plane
// upright (so the wall's face, an upright plane, keeps its shape), the
// horizon at screen y yh. World units = figure units (a man ~310).
// Keys: zc (dolly), hc (crane), yF = the screen y of the ground at Z = ZF.
// ---------------------------------------------------------------------------
const F = 2167;
const ZF = -550;
type C3 = { zc: number; hc: number; yh: number };
const CAM: [number, number, number, number][] = [
  [0, -2717, 560, 1190],
  [75, -3480, 840, 1120],
  [130, -4150, 1550, 1110],
  [205, -5150, 3300, 1165],
  [223, -5270, 3470, 1162],
];
const camZ = pchip(CAM.map((k) => [k[0], k[1]] as [number, number]));
const camH = pchip(CAM.map((k) => [k[0], k[2]] as [number, number]));
const camY = pchip(CAM.map((k) => [k[0], k[3]] as [number, number]));
const camAt = (f: number): C3 => {
  const zc = camZ(f);
  const hc = camH(f);
  return { zc, hc, yh: camY(f) - (F / (ZF - zc)) * hc };
};
const sOf = (Z: number, c: C3) => F / (Z - c.zc);
const proj = (X: number, Y: number, Z: number, c: C3): P2 => {
  const s = sOf(Z, c);
  return [540 + s * X, c.yh + s * (c.hc - Y)];
};
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
/** an upright plane at depth Z, local svg coords (x = X, y = -Y) */
const planeTf = (Z: number, c: C3) => {
  const s = sOf(Z, c);
  return `translate(540 ${(c.yh + s * c.hc).toFixed(2)}) scale(${s.toFixed(5)})`;
};

// ---------------------------------------------------------------------------
// THE WALL: a rammed-earth town wall (face at Z = 0, WALL_T thick), its crest
// broken, a breach where the gate stood, the gate's wreck heaped in it.
// ---------------------------------------------------------------------------
const WALL_H = 1080;
const WALL_T = 380;
const WALL_X = 9000;
/** chunks broken out of the crest: [centre X, half-width, depth] (flat-bottomed, steep broken sides) */
const NOTCHES: [number, number, number][] = [
  [-905, 70, 120],
  [-1520, 130, 230],
  [-2380, 60, 90],
  [-3150, 160, 260],
  [-4300, 90, 150],
  [-5400, 140, 200],
  [820, 95, 160],
  [1660, 60, 85],
  [2280, 150, 240],
  [3350, 80, 120],
  [4500, 170, 260],
];
const LIP_L = -362;
const LIP_R = 348;
const crestAt = (X: number) => {
  const i = Math.round(X / 55);
  let h = WALL_H - 22 * hash(i, 31) - 8 * Math.sin(X / 173);
  for (const [cx, hw, d] of NOTCHES) {
    const u = (hw - Math.abs(X - cx)) / 34;
    if (u > 0) h -= d * sstep(u) * (0.8 + 0.35 * hash(i, 33));
  }
  // the crest crumbles a little toward the breach
  const toLip = X < 0 ? LIP_L - X : X - LIP_R;
  if (toLip < 160) h -= 70 * Math.pow(1 - Math.max(0, toLip) / 160, 1.4);
  return h;
};
const crestRun = (side: -1 | 1): P2[] => {
  const pts: P2[] = [];
  const lip = side < 0 ? -LIP_L : LIP_R;
  for (let x = lip; x <= WALL_X; x += 55) pts.push([side * x, crestAt(side * x)]);
  return pts;
};
const CREST_L = crestRun(-1);
const CREST_R = crestRun(1);
/** the breach's broken edges, lip (crest) to ground, wall-local (X, Y) */
const EDGE_L: P2[] = [[LIP_L, crestAt(LIP_L)], [-336, 940], [-350, 880], [-306, 836], [-318, 752], [-286, 704], [-294, 610], [-266, 540], [-276, 446], [-250, 376], [-258, 270], [-238, 196], [-246, 96], [-232, 0]];
const EDGE_R: P2[] = [[LIP_R, crestAt(LIP_R)], [324, 930], [338, 862], [300, 812], [310, 720], [282, 668], [290, 580], [262, 520], [272, 420], [248, 350], [256, 240], [236, 170], [244, 80], [230, 0]];
const FACE: P2[] = [[-WALL_X, 0], ...CREST_L.slice().reverse(), ...EDGE_L.slice(1), ...EDGE_R.slice().reverse().slice(0, -1), ...CREST_R, [WALL_X, 0]];
const svgPts = (pts: P2[]) => pts.map(([x, y]) => `${x.toFixed(1)},${(-y).toFixed(1)}`).join(" ");
const FACE_D = `M${svgPts(FACE)}Z`;
/** the putlog holes left by the tamping frames, wall-local (X, Y) */
const PUTLOGS: P2[] = [];
[180, 450, 720].forEach((y, r) => {
  for (let x = -WALL_X + 120 * r; x < WALL_X; x += 236) {
    if (x > LIP_L - 80 && x < LIP_R + 80) continue;
    if (y > crestAt(x) - 70) continue;
    PUTLOGS.push([x + 30 * (hash(Math.round(x), 40 + r) - 0.5), y + 14 * (hash(Math.round(x), 50 + r) - 0.5)]);
  }
});
const CRACKS: P2[][] = [
  [[-276, 446], [-360, 420], [-446, 372], [-500, 300], [-590, 276], [-640, 200], [-730, 170]],
  [[-306, 836], [-400, 860], [-470, 920], [-520, 1000]],
  [[310, 720], [400, 742], [480, 800], [540, 880], [620, 900]],
  [[272, 420], [350, 380], [420, 320], [520, 300]],
  [[-1520, 840], [-1490, 760], [-1530, 660], [-1500, 560]],
  [[2280, 830], [2310, 740], [2270, 650], [2300, 560], [2280, 480]],
  [[-905, 950], [-880, 880], [-910, 800]],
  [[820, 910], [850, 830], [820, 750]],
];

/** the parapet's merlons on the intact stretches of the crest: [X, crest height, width, height] */
const MERLONS: [number, number, number, number][] = [];
for (let x = -WALL_X + 20; x < WALL_X; x += 78) {
  if (x > LIP_L - 70 && x < LIP_R + 70) continue;
  const h = crestAt(x);
  const hl = crestAt(x - 22);
  const hr = crestAt(x + 22);
  if (Math.min(h, hl, hr) < WALL_H - 95) continue;
  const i = Math.round(x / 78);
  // some are broken off
  if (hash(i, 37) < 0.18) continue;
  const top = 58 - (hash(i, 38) < 0.25 ? 26 * hash(i, 39) : 0);
  MERLONS.push([x, Math.min(hl, hr) - 4, 42, top]);
}
/** the front face of the wall (an upright plane: one transform) */
const WallFace: React.FC<{ c: C3 }> = ({ c }) => {
  const s = sOf(0, c);
  const px = (v: number) => v / s;
  const x0 = (-540 - 60) / s;
  const x1 = (540 + 60) / s;
  const courses: string[] = [];
  for (let y = 26; y < WALL_H; y += 30) {
    let d = "";
    for (let x = Math.floor(x0 / 140) * 140; x <= x1 + 140; x += 140) d += `${d ? "L" : "M"}${x},${(-(y + 2.4 * Math.sin(x / 97 + y))).toFixed(1)}`;
    courses.push(d);
  }
  const hatch: string[] = [];
  const g = 15;
  const k = Math.tan((24 * Math.PI) / 180);
  for (let x = Math.floor((x0 - WALL_H * k) / g) * g; x <= x1; x += g) hatch.push(`M${x},0L${(x + WALL_H * k).toFixed(1)},${-WALL_H}`);
  // the darker shading inside the breach's broken edges and under the crumbling lips
  const shade: string[] = [];
  for (let x = -620; x <= 600; x += 7) {
    if (x > -240 && x < 240) continue;
    shade.push(`M${x},0L${(x + WALL_H * k).toFixed(1)},${-WALL_H}`);
  }
  const holes = PUTLOGS.filter(([x]) => x > x0 - 40 && x < x1 + 40);
  const merl = MERLONS.filter(([x]) => x > x0 - 60 && x < x1 + 60);
  return (
    <g transform={planeTf(0, c)}>
      <clipPath id="la-face">
        <path d={FACE_D} />
      </clipPath>
      <path d={FACE_D} fill={WALL_FACE} />
      <g clipPath="url(#la-face)">
        <path d={hatch.join("")} {...dl(px(0.9), 0.32)} />
        <path d={courses.join("")} {...cl(px(0.9), 0.22)} />
        <path d={shade.join("")} {...dl(px(0.8), 0.3)} />
        {holes.map(([x, y], i) => (
          <rect key={i} x={x - 9} y={-y - 7} width={18} height={13} fill={DARK} fillOpacity={0.75} stroke={INK} strokeOpacity={0.35} strokeWidth={px(0.7)} />
        ))}
        <path d={CRACKS.map((cr) => `M${svgPts(cr).replace(/ /g, "L")}`).join("")} {...cl(px(1.1), 0.5)} />
        {/* the wall's foot: a darker band of fallen earth */}
        <path d={`M${x0},-40L${x1},-40`} stroke={DARK} strokeOpacity={0.3} strokeWidth={80} />
      </g>
      <path d={FACE_D} {...cl(px(1.4 + 1.4 * s), 0.85)} />
      {merl.map(([x, y, w, h], i) => {
        const tilt = 3 * (hash(i, 41) - 0.5);
        const d = `M${x - w / 2},${-y}L${x - w / 2 + tilt},${-(y + h)}L${x + w / 2 + tilt},${-(y + h - 3 * hash(i, 42))}L${x + w / 2},${-y}Z`;
        return (
          <g key={`m${i}`}>
            <path d={d} fill={tone(0.1)} {...ce(px(1 + 1.1 * s), 0.8)} />
            <path d={`M${x - w / 2 + 6},${-y - 3}L${x - w / 2 + 6 + tilt},${-(y + h - 4)}M${x - w / 2 + 13},${-y - 3}L${x - w / 2 + 13 + tilt},${-(y + h - 4)}`} {...dl(px(0.8), 0.45)} />
          </g>
        );
      })}
    </g>
  );
};

/** the breach's cut faces (the rammed earth seen edge-on, from Z = 0 to WALL_T) */
const Jambs: React.FC<{ c: C3 }> = ({ c }) => {
  const sw = 1.1 + 1.2 * sOf(0, c);
  const one = (edge: P2[], key: string) => {
    const front = edge.map(([x, y]) => proj(x, y, 0, c));
    const back = edge.map(([x, y]) => proj(x, y, WALL_T, c));
    const d = `M${front.map(P).join("L")}L${back.slice().reverse().map(P).join("L")}Z`;
    const strata: string[] = [];
    for (let y = 26; y < WALL_H + 40; y += 30) {
      // where this course meets the broken edge
      for (let i = 0; i < edge.length - 1; i++) {
        const [xa, ya] = edge[i];
        const [xb, yb] = edge[i + 1];
        if ((ya - y) * (yb - y) <= 0 && ya !== yb) {
          const xe = xa + ((y - ya) / (yb - ya)) * (xb - xa);
          strata.push(`M${P(proj(xe, y, 0, c))}L${P(proj(xe, y, WALL_T, c))}`);
          break;
        }
      }
    }
    return (
      <g key={key}>
        <clipPath id={`la-jamb-${key}`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill={WALL_JAMB} />
        <g clipPath={`url(#la-jamb-${key})`}>
          <path d={strata.join("")} {...cl(0.9, 0.22)} />
          <path d={front.map((p, i) => `M${P(p)}L${P(back[i])}`).join("")} {...dl(0.9, 0.35)} />
        </g>
        <path d={d} {...cl(sw * 0.8, 0.6)} />
      </g>
    );
  };
  return (
    <>
      {one(EDGE_L, "l")}
      {one(EDGE_R, "r")}
    </>
  );
};

/** the walk along the wall's top, seen once the camera rises over the crest */
const WallTop: React.FC<{ c: C3 }> = ({ c }) => {
  const sw = 1.1 + 1.4 * sOf(0, c);
  const x0 = (-540 - 120) / sOf(0, c);
  const x1 = (540 + 120) / sOf(0, c);
  const run = (pts: P2[], key: string) => {
    const vis = pts.filter(([x]) => x > x0 - 60 && x < x1 + 60);
    if (vis.length < 2) return null;
    const front = vis.map(([x, y]) => proj(x, y, 0, c));
    const back = vis.map(([x, y], i): P2 => {
      const b = proj(x, y, WALL_T, c);
      return [b[0], Math.min(b[1], front[i][1])];
    });
    if (!front.some((p, i) => p[1] - back[i][1] > 0.6)) return null;
    const d = `M${front.map(P).join("L")}L${back.slice().reverse().map(P).join("L")}Z`;
    const ticks = front
      .map((p, i) => (i % 2 === 0 && p[1] - back[i][1] > 2 ? `M${P(p)}L${P(back[i])}` : ""))
      .join("");
    return (
      <g key={key}>
        <path d={d} fill={WALL_TOP} />
        <path d={ticks} {...cl(0.8, 0.22)} />
        <path d={`M${back.map(P).join("L")}`} {...cl(sw * 0.7, 0.55)} />
        <path d={`M${front.map(P).join("L")}`} {...cl(sw * 0.8, 0.8)} />
      </g>
    );
  };
  return (
    <>
      {run(CREST_L, "l")}
      {run(CREST_R, "r")}
    </>
  );
};

// ---- the gate's wreck heaped in the breach (an upright billboard at HEAP_Z) ----
const HEAP_Z = 150;
const HEAP_TOP = 560;
const HEAP_W = 400;
const HEAP_D = 420;
const bump = (u: number) => {
  const a = 1 - u * u;
  return a > 0 ? a * a : 0;
};
/** the heap across the breach: broad and flat-topped (it fills the gap), tapering into the jambs */
const across = (X: number) => {
  const u = Math.min(1, Math.abs(X) / HEAP_W);
  return 1 - Math.pow(u, 3.2);
};
/** the height of the rubble under a man's feet */
const heapH = (X: number, Z: number) => HEAP_TOP * bump((Z - HEAP_Z) / HEAP_D) * across(X);
const HEAP_SIL: P2[] = Array.from({ length: 45 }, (_, i): P2 => {
  const x = -HEAP_W + (2 * HEAP_W * i) / 44;
  return [x, HEAP_TOP * across(x) + (i > 0 && i < 44 ? 14 * (hash(i, 61) - 0.5) : 0)];
});
const CHUNKS: { at: P2; r: number; rot: number; lit: boolean }[] = Array.from({ length: 30 }, (_, i) => {
  const x = -HEAP_W * 0.9 + HEAP_W * 1.8 * hash(i, 62);
  const top = HEAP_TOP * across(x);
  return { at: [x, top * (0.2 + 0.72 * hash(i, 63))] as P2, r: 28 + 38 * hash(i, 64), rot: 360 * hash(i, 65), lit: hash(i, 66) > 0.5 };
});
const chunkPts = (r: number, rot: number, seed: number): P2[] =>
  Array.from({ length: 6 }, (_, j): P2 => {
    const a = ((rot + j * 60 + 20 * hash(j, seed)) * Math.PI) / 180;
    const rr = r * (0.7 + 0.45 * hash(j, seed + 1));
    return [rr * Math.cos(a), rr * Math.sin(a) * 0.7];
  });
/** a studded plank leaf: corners a (bottom-left), b (bottom-right), d (top-left) in a plane's local (X, Y) */
const leafArt = (a: P2, b: P2, d: P2, px: (v: number) => number, sw: number, key: string) => {
  const at = (u: number, v: number): P2 => [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v];
  const q = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
  const planks: string[] = [];
  for (let u = 1 / 6; u < 0.99; u += 1 / 6) planks.push(`M${at(u, 0)[0]},${-at(u, 0)[1]}L${at(u, 1)[0]},${-at(u, 1)[1]}`);
  const bands = [0.18, 0.5, 0.82].map((v) => `M${at(0, v)[0]},${-at(0, v)[1]}L${at(1, v)[0]},${-at(1, v)[1]}`);
  const studs: P2[] = [];
  [0.18, 0.5, 0.82].forEach((v) => {
    for (let u = 0.09; u < 0.95; u += 0.165) studs.push(at(u, v));
  });
  return (
    <g key={key}>
      <polygon points={svgPts(q)} fill={TIMBER} {...ce(sw, 0.75)} />
      <path d={planks.join("")} {...cl(px(0.9), 0.3)} />
      <path d={bands.join("")} stroke={DARK} strokeOpacity={0.85} strokeWidth={px(1.2) + 7} />
      {studs.map(([x, y], i) => (
        <circle key={i} cx={x} cy={-y} r={6.5} fill={STUD} {...ce(px(0.8), 0.6)} />
      ))}
    </g>
  );
};
const beamArt = (a: P2, b: P2, w: number, px: (v: number) => number, sw: number, key: string) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const nx = (-dy / L) * w;
  const ny = (dx / L) * w;
  const q: P2[] = [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx * 0.6, b[1] - ny * 0.6], [b[0] - nx, b[1] - ny - 4], [a[0] - nx, a[1] - ny]];
  return (
    <g key={key}>
      <polygon points={svgPts(q)} fill={TIMBER} {...ce(sw, 0.75)} />
      <path d={`M${a[0] + nx * 0.3},${-(a[1] + ny * 0.3)}L${b[0] + nx * 0.3},${-(b[1] + ny * 0.3)}M${a[0] - nx * 0.45},${-(a[1] - ny * 0.45)}L${b[0] - nx * 0.45},${-(b[1] - ny * 0.45)}`} {...cl(px(0.8), 0.3)} />
    </g>
  );
};
/** roof tiles spilled on the heap: their curved ends */
const TILES: { at: P2; r: number }[] = Array.from({ length: 30 }, (_, i) => {
  const x = 40 + 300 * hash(i, 67);
  return { at: [x, HEAP_TOP * across(x) * (0.35 + 0.6 * hash(i, 68))] as P2, r: 11 + 5 * hash(i, 69) };
});
const Heap: React.FC<{ c: C3 }> = ({ c }) => {
  const s = sOf(HEAP_Z, c);
  const px = (v: number) => v / s;
  const sw = px(1.2 + 1.4 * s);
  const sil = `M${svgPts(HEAP_SIL)}Z`;
  return (
    <g transform={planeTf(HEAP_Z, c)}>
      <clipPath id="la-heap">
        <path d={sil} />
      </clipPath>
      <path d={sil} fill={RUBBLE} />
      <g clipPath="url(#la-heap)">
        <path d={Array.from({ length: 70 }, (_, i) => `M${-HEAP_W + i * 12},0l${-150},${-HEAP_TOP * 1.1}`).join("")} {...dl(px(0.9), 0.4)} />
      </g>
      {CHUNKS.map((ch, i) => (
        <polygon
          key={i}
          points={svgPts(chunkPts(ch.r, ch.rot, 70 + i).map(([x, y]): P2 => [ch.at[0] + x, ch.at[1] + y]))}
          fill={ch.lit ? RUBBLE_LIT : tone(-0.12)}
          {...ce(px(0.8 + 0.9 * s), 0.6)}
        />
      ))}
      {/* the gate: one leaf tipped back on the heap, the lintel fallen across it, the gatehouse's tiles spilled */}
      {leafArt([-330, 70], [-90, 10], [-215, 520], px, sw, "leaf")}
      {beamArt([-250, 470], [300, 540], 15, px, sw, "lintel")}
      {beamArt([120, 170], [330, 330], 10, px, sw, "post")}
      {TILES.map((t, i) => (
        <path key={`t${i}`} d={`M${t.at[0] - t.r},${-t.at[1]}a${t.r},${t.r * 0.8} 0 0 1 ${2 * t.r},0Z`} fill={tone(0.1)} {...ce(px(0.8), 0.65)} />
      ))}
      <path d={sil} {...cl(sw * 0.85, 0.7)} />
    </g>
  );
};

// ---- the ground in front: the fallen gate leaf, the toppled banner, rubble ----
/** a point on the ground (X, Z) on screen */
const gp = (p: P2, c: C3): P2 => proj(p[0], 0, p[1], c);
const groundPoly = (pts: P2[], c: C3) => pts.map((p) => gp(p, c));
const GATE_LEAF = (() => {
  // a plank gate lying flat in front of the breach (ground X, Z)
  const cx = -120;
  const cz = -260;
  const a = (-14 * Math.PI) / 180;
  const W = 420;
  const D = 250;
  const pt = (u: number, v: number): P2 => [cx + u * W * Math.cos(a) - v * D * Math.sin(a), cz + u * W * Math.sin(a) + v * D * Math.cos(a)];
  return { pt };
})();
const GateLeaf: React.FC<{ c: C3 }> = ({ c }) => {
  const { pt } = GATE_LEAF;
  const q = groundPoly([pt(-0.5, -0.5), pt(0.5, -0.5), pt(0.5, 0.5), pt(-0.5, 0.5)], c);
  const planks: string[] = [];
  for (let u = -0.5 + 1 / 7; u < 0.49; u += 1 / 7) planks.push(`M${P(gp(pt(u, -0.5), c))}L${P(gp(pt(u, 0.5), c))}`);
  const bands = [-0.3, 0.3].map((v) => `M${P(gp(pt(-0.5, v), c))}L${P(gp(pt(0.5, v), c))}`);
  const studs: P2[] = [];
  [-0.3, 0.3].forEach((v) => {
    for (let u = -0.42; u < 0.45; u += 0.12) studs.push(gp(pt(u, v), c));
  });
  const s = sOf(-260, c);
  return (
    <g>
      <polygon points={q.map(P).join(" ")} fill={TIMBER} {...ce(1 + 1.1 * s, 0.7)} />
      <path d={planks.join("")} {...cl(0.6 + 0.5 * s, 0.3)} />
      <path d={bands.join("")} stroke={DARK} strokeOpacity={0.8} strokeWidth={2 + 3 * s} />
      {studs.map((p, i) => (
        <ellipse key={i} cx={p[0]} cy={p[1]} rx={4.2 * s} ry={2.4 * s} fill={STUD} />
      ))}
    </g>
  );
};
/** heaps of fallen wall in the foreground: centre X, Z, width, height */
const PILES: [number, number, number, number][] = [
  [-1500, -1700, 380, 140],
  [1500, -1800, 420, 130],
  [-1150, -2200, 640, 220],
  [980, -2080, 560, 190],
  [-820, -1460, 420, 120],
  [600, -1560, 360, 150],
  [330, -2420, 420, 100],
  [-180, -1950, 520, 110],
  [270, -1290, 380, 105],
  [-230, -1420, 320, 90],
].sort((a, b) => b[1] - a[1]) as [number, number, number, number][];
/** the foreground lies in shadow: dark masses, a lit edge (the engraver's repoussoir) */
const FORE_FILL = tone(-0.32);
const FORE_LIT = tone(-0.12);
const PILE_CHUNKS = PILES.map(([, , w, h], k) =>
  Array.from({ length: 9 + Math.round(w / 60) }, (_, i) => {
    const u = 2 * hash(i, 720 + k) - 1;
    const top = h * bump(u * 0.92);
    return { x: (u * w) / 2, y: top * (0.15 + 0.75 * hash(i, 740 + k)), r: 16 + 26 * hash(i, 760 + k), rot: 360 * hash(i, 780 + k), lit: hash(i, 800 + k) > 0.45 };
  }),
);
const ForeRuins: React.FC<{ c: C3 }> = ({ c }) => (
  <g>
    {PILES.map(([x, zz, w, h], k) => {
      const s = sOf(zz, c);
      const base = proj(x, 0, zz, c);
      if (base[1] - h * s > FRAME_H + 10 || base[0] + (w / 2) * s < -20 || base[0] - (w / 2) * s > FRAME_W + 20) return null;
      const px = (v: number) => v / s;
      const sw = px(1 + 1.2 * Math.min(1.4, s));
      const sil: P2[] = Array.from({ length: 25 }, (_, i): P2 => {
        const u = -1 + (2 * i) / 24;
        return [(u * w) / 2, h * bump(u) * (i > 0 && i < 24 ? 0.85 + 0.3 * hash(i, 820 + k) : 1)];
      });
      const d = `M${svgPts(sil)}Z`;
      return (
        <g key={k} transform={planeTf(zz, c).replace("translate(540 ", `translate(${(540 + s * x).toFixed(2)} `)}>
          <clipPath id={`la-pile${k}`}>
            <path d={d} />
          </clipPath>
          <path d={d} fill={FORE_FILL} />
          <g clipPath={`url(#la-pile${k})`}>
            <path d={Array.from({ length: Math.ceil(w / 9) + 14 }, (_, i) => `M${-w / 2 + i * 9},0l${-110},${-h * 1.2}`).join("")} {...dl(px(0.9), 0.45)} />
          </g>
          {PILE_CHUNKS[k].map((ch, i) => (
            <polygon key={i} points={svgPts(chunkPts(ch.r, ch.rot, 900 + k * 40 + i).map(([u, v]): P2 => [ch.x + u, ch.y + v]))} fill={ch.lit ? FORE_LIT : FORE_FILL} {...ce(sw * 0.7, 0.5)} />
          ))}
          <path d={d} {...cl(sw * 0.8, 0.65)} />
        </g>
      );
    })}
  </g>
);
/** loose rubble on the ground: (X, Z, size) */
const STONES: [number, number, number][] = Array.from({ length: 90 }, (_, i): [number, number, number] => {
  const near = i < 26;
  const x = near ? -520 + 1040 * hash(i, 91) : -2200 + 4400 * hash(i, 91);
  const zz = near ? -40 - 260 * hash(i, 92) : -60 - 2400 * hash(i, 92);
  return [x, zz, near ? 14 + 26 * hash(i, 93) : 10 + 22 * hash(i, 93)];
}).filter(([x, zz]) => !(Math.abs(x) < 300 && zz < -120 && zz > -880));
const Stones: React.FC<{ c: C3 }> = ({ c }) => (
  <g>
    {STONES.map(([x, zz, r], i) => {
      const s = sOf(zz, c);
      const p = proj(x, 0, zz, c);
      if (p[0] < -60 || p[0] > FRAME_W + 60 || p[1] > FRAME_H + 40) return null;
      const pts = chunkPts(r, 360 * hash(i, 94), 100 + i).map(([u, v]): P2 => [p[0] + u * s, p[1] - Math.abs(v) * s * 0.9 + v * s * 0.25]);
      return <polygon key={i} points={pts.map(P).join(" ")} fill={hash(i, 95) > 0.5 ? tone(-0.08) : RUBBLE} {...ce(0.6 + 0.8 * s, 0.55)} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------
// THE PEOPLE (in front of the wall): scattered, driven into the middle, armed
// ---------------------------------------------------------------------------
const ARM_N = 30;
const GRAB = 10;
/** their places in the huddle in front of the breach (X, Z) */
const SPOTS: P2[] = [];
[
  [-170, [-195, -65, 65, 195]],
  [-400, [-255, -125, 5, 135, 260]],
  [-630, [-195, -65, 65, 195]],
  [-860, [-255, -125, 5, 135, 260]],
].forEach(([zz, xs], r) => (xs as number[]).forEach((x, j) => SPOTS.push([x + 18 * (hash(r * 7 + j, 11) - 0.5), (zz as number) + 22 * (hash(r * 7 + j, 12) - 0.5)])));
type Mode = "slump" | "hunch" | "drift";
/** where they are on frame 0 (X, Z, how, which way they face) */
const STARTS: [number, number, Mode, 1 | -1][] = [
  [-330, -1010, "slump", 1],
  [270, -960, "hunch", -1],
  [40, -840, "drift", 1],
  [-210, -640, "slump", -1],
  [330, -560, "slump", -1],
  [-430, -380, "drift", -1],
  [120, -320, "hunch", 1],
  [-140, -190, "slump", 1],
  [470, -230, "hunch", -1],
  [-700, -470, "slump", 1],
  [720, -540, "slump", -1],
  [-660, -880, "drift", 1],
  [690, -880, "slump", -1],
  [-730, -210, "hunch", 1],
  [710, -330, "slump", -1],
  [-850, -690, "slump", 1],
  [860, -720, "drift", -1],
  [-560, -1020, "slump", 1],
];
type Person = { x0: number; z0: number; mode: Mode; d0: 1 | -1; xc: number; zc: number; dOut: 1 | -1; tMove: number; tArm: number; seed: number; w: Pole; tilt: number; bearer: boolean };
const MARCH_V = 4.4;
const FLEE_V = 8;
const DRIFT_V = 1.5;
const HEAD_X0 = 830;
/** the banner's bearer stands at the front of the huddle, in the middle */
const BEARER_SPOT: P2 = [5, -860];
const BEARER = 2;
const PEOPLE: Person[] = (() => {
  // when each one starts to run: when the columns come near (the middle ones are crowded in a little later)
  const tMoveOf = (i: number) => {
    const ax = Math.abs(STARTS[i][0]);
    const tNear = (HEAD_X0 - (ax + 330)) / MARCH_V;
    return Math.round(ax > 600 ? 0 : Math.max(10, Math.min(tNear, 16 + 12 * hash(i, 14))));
  };
  const arriveOf = (i: number, j: number) => tMoveOf(i) + Math.hypot(STARTS[i][0] - SPOTS[j][0], STARTS[i][1] - SPOTS[j][1]) / FLEE_V + 5;
  // start -> spot: in order across the frame, then swaps that shorten the slowest runs
  // the man drifting in the middle at the front takes up the banner
  const bearerSpot = SPOTS.map((p, j): [number, number] => [Math.hypot(p[0] - BEARER_SPOT[0], p[1] - BEARER_SPOT[1]), j]).sort((a, b) => a[0] - b[0])[0][1];
  const others = STARTS.map((_, i) => i).filter((i) => i !== BEARER);
  const byX = others.sort((p, q) => STARTS[p][0] - STARTS[q][0]);
  const spotsByX = SPOTS.map((_, j) => j).filter((j) => j !== bearerSpot).sort((p, q) => SPOTS[p][0] - SPOTS[q][0]);
  const pairOf = new Array<number>(STARTS.length).fill(-1);
  pairOf[BEARER] = bearerSpot;
  byX.forEach((i, k) => (pairOf[i] = spotsByX[k]));
  const cost = (i: number, j: number) => Math.pow(arriveOf(i, j), 3);
  for (let pass = 0; pass < 30; pass++) {
    let better = false;
    for (let i = 0; i < STARTS.length; i++)
      for (let k = i + 1; k < STARTS.length; k++) {
        if (i === BEARER || k === BEARER) continue;
        const now = cost(i, pairOf[i]) + cost(k, pairOf[k]);
        const sw = cost(i, pairOf[k]) + cost(k, pairOf[i]);
        if (sw < now - 1e-6) {
          const t = pairOf[i];
          pairOf[i] = pairOf[k];
          pairOf[k] = t;
          better = true;
        }
      }
    if (!better) break;
  }
  const dMax = Math.max(...SPOTS.map(([x, zz]) => Math.hypot(x - BEARER_SPOT[0], (zz - BEARER_SPOT[1]) * 0.7)));
  return STARTS.map(([x0, z0, mode, d00], i) => {
    const [xc, zc] = SPOTS[pairOf[i]];
    const d0: 1 | -1 = mode === "drift" ? sgn(xc - x0) : d00;
    const bearer = i === BEARER;
    const dOut: 1 | -1 = Math.abs(xc) < 20 ? (hash(i, 13) > 0.5 ? 1 : -1) : sgn(xc);
    const dist = Math.hypot(xc - BEARER_SPOT[0], (zc - BEARER_SPOT[1]) * 0.7) / dMax;
    // the wave runs out from the banner: he is first
    const wave = bearer ? 75 : Math.round(80 + 24 * dist + 2 * hash(i, 15));
    const tArm = Math.max(wave, Math.ceil(arriveOf(i, pairOf[i])) + 2);
    const w: Pole = bearer ? "banner" : hash(i, 18) < 0.4 ? "spear" : "ge";
    return { x0, z0, mode, d0, xc, zc, dOut, tMove: tMoveOf(i), tArm, seed: i, w, tilt: bearer ? 0 : 16 * (hash(i, 19) - 0.5), bearer };
  });
})();
const driftPos = (p: Person, f: number): P2 => (p.mode === "drift" ? [p.x0 + p.d0 * DRIFT_V * Math.min(f, p.tMove), p.z0] : [p.x0, p.z0]);
/** where he is and how far he has walked by frame f (the flight into the huddle) */
const fleeAt = (p: Person, f: number) => {
  const a = driftPos(p, p.tMove);
  const L = Math.hypot(p.xc - a[0], p.zc - a[1]);
  const T = L / FLEE_V;
  const t = Math.max(0, f - p.tMove);
  // constant speed, with five frames to get going and to stop
  const ramp = 5;
  const dist = L < 1 ? 0 : t <= 0 ? 0 : t >= T + ramp ? L : FLEE_V * (t < ramp ? (t * t) / (2 * ramp) : t >= T ? T - ramp / 2 + (ramp / 2 - ((T + ramp - t) * (T + ramp - t)) / (2 * ramp)) : t - ramp / 2);
  const u = L < 1 ? 1 : Math.min(1, dist / L);
  return { x: a[0] + (p.xc - a[0]) * u, z: a[1] + (p.zc - a[1]) * u, dist, moving: L > 1 && t > 0 && t < T + ramp, dir: (L < 1 ? p.d0 : sgn(p.xc - a[0])) as 1 | -1, arrive: p.tMove + T + ramp };
};
/** the push outward: how far the orange halves have pressed (world units), and their pace */
const PUSH_T0 = 134;
const PUSH_V = 4.8;
const PUSH_T1 = 199;
const pushAt = (f: number, lag = 0) => {
  const t = f - PUSH_T0 - lag;
  const T = PUSH_T1 - PUSH_T0;
  const r = 8;
  if (t <= 0) return 0;
  if (t >= T + r) return PUSH_V * (T + r / 2 - r / 2);
  if (t < r) return (PUSH_V * t * t) / (2 * r);
  if (t >= T) return PUSH_V * (T - r / 2 + (r / 2 - ((T + r - t) * (T + r - t)) / (2 * r)));
  return PUSH_V * (t - r / 2);
};
const PUSH_MAX = pushAt(999);

// the arming: one track per (facing before, facing after)
const armKeys = (dIn: 1 | -1, dOut: 1 | -1): [number, FigPose][] => {
  const k: [number, FigPose][] = [
    [0, face(R_STOOD, dIn)],
    [4, lerpFig(face(R_STOOD, dIn), face(R_REACH, dIn), 0.42)],
    [GRAB - 1, face(R_REACH, dIn)],
    [GRAB + 1, face(R_GRIP, dIn)],
    [15, lerpFig(face(R_GRIP, dIn), face(R_CARRY, dIn), 0.55)],
    [19, face(R_CARRY, dIn)],
  ];
  if (dIn !== dOut) k.push([22, TURN], [25, face(R_CARRY, dOut)]);
  else k.push([24, lerpFig(face(R_CARRY, dOut), face(R_GUARD, dOut), 0.3)]);
  k.push([ARM_N, face(R_GUARD, dOut)]);
  return k;
};
const ARM_TRACKS: Record<string, (f: number) => FigPose> = {};
const armTrack = (dIn: 1 | -1, dOut: 1 | -1) => {
  const key = `${dIn}${dOut}`;
  if (!ARM_TRACKS[key]) ARM_TRACKS[key] = poseTrack(armKeys(dIn, dOut));
  return ARM_TRACKS[key];
};
/** the weapon's angle through the arming (lying -> upright -> levelled out); tilt = how askew it lay */
const ARM_ANG: Record<string, (f: number) => number> = {};
const armAngle = (dIn: 1 | -1, dOut: 1 | -1, t: number, tilt = 0, level = true) => {
  const key = `${dIn}${dOut}${tilt.toFixed(2)}${level}`;
  const a0 = (90 + tilt) * dIn;
  if (!ARM_ANG[key])
    ARM_ANG[key] = !level
      ? track([[GRAB, a0], [19, CARRY_ANG * dIn]])
      : dIn !== dOut
        ? track([[GRAB, a0], [19, CARRY_ANG * dIn], [22, 0], [25, CARRY_ANG * dOut], [ARM_N, GUARD_ANG * dOut]])
        : track([[GRAB, a0], [19, CARRY_ANG * dIn], [ARM_N, GUARD_ANG * dOut]]);
  return ARM_ANG[key](t);
};
/** the fist that holds the ge: always the arm that was nearer when he took it up */
const heldBy = (q: FigPose, dIn: 1 | -1): "near" | "far" => {
  const near = Math.sin(q.yaw) >= 0 ? "L" : "R";
  return near === (dIn > 0 ? "L" : "R") ? "near" : "far";
};
const turnInk = track([[GRAB - 1, 0], [GRAB + 9, 1]]);
const wearArmour = track([[GRAB + 2, 0], [GRAB + 12, 1]]);
/** the far fist closes on the shaft as the ge comes level */
const graspShaft = track([[25, 0], [ARM_N, 1]]);
/** where his weapon lies before he takes it up: the grip at the moment he grips it (figure-local) */
const lyingGrip = (dIn: 1 | -1, w: Pole, tilt: number): P2 => gripAt("commoner", armTrack(dIn, dIn)(GRAB), (90 + tilt) * dIn, w);
/** the bearer: he takes up the toppled banner and stands it upright (no turn, no guard) */
const BANNER_UP = 22;
/** the banner heaved up: the near fist at his shoulder, the far fist on the shaft below it */
const BANNER_HIGH = (d: 1 | -1): FigPose => face({ ...R_CARRY, pitch: -7, brow: 0.9, mouth: -0.5, armL: { w: [30, -236], elbow: [-0.8, 1], fist: 1, hand: 0 } }, d);
/** the pole slides up through his fists as he heaves it up (units from the butt to the fist) */
const bannerGrip = track([[GRAB + 2, GRIP_AT.banner], [BANNER_UP + 2, 70]]);
const bearerTrack = ([1, -1] as const).map((d) =>
  poseTrack([
    [0, face(R_STOOD, d)],
    [4, lerpFig(face(R_STOOD, d), face(R_REACH, d), 0.42)],
    [GRAB - 1, face(R_REACH, d)],
    [GRAB + 1, face(R_GRIP, d)],
    [16, lerpFig(face(R_GRIP, d), face(R_CARRY, d), 0.6)],
    [BANNER_UP, BANNER_HIGH(d)],
  ]),
);

type Fig = { key: string; Z: number; at: P2; s: number; m: ManState };
/** the man in his arming, t frames into it */
const armingState = (dIn: 1 | -1, dOut: 1 | -1, t: number, seed: number, w: Pole = "ge", tilt = 0): ManState => {
  const q = armTrack(dIn, dOut)(t);
  const turned = dIn !== dOut;
  const wArm = turned ? heldBy(q, dIn) : "near";
  const gA = turned ? gripNear(w) + (gripFar(w) - gripNear(w)) * sstep((t - 19) / 6) : gripNear(w);
  const ang = armAngle(dIn, dOut, t, tilt);
  const o = { weapon: w, weaponArm: wArm, gripAt: gA };
  const pose = t >= GRAB ? levelled(q, "commoner", ang, graspShaft(t), o) : q;
  const tk = turnInk(t);
  return { kind: "commoner", pose, armed: wearArmour(t), ink: mixInk(DIM, ORANGE, tk), gear: mixInk(DULL, ORANGE, tk), weapon: t >= GRAB ? w : "none", weaponArm: wArm, gripAt: gA, seed };
};
/** the bearer, t frames into raising the banner (it lives from the moment he grips it) */
const bearerState = (d: 1 | -1, t: number, f: number, seed: number): ManState => {
  const q = idle(bearerTrack[d > 0 ? 0 : 1](t), f, seed, sstep((t - BANNER_UP) / 8) * 0.7);
  const tk = turnInk(t);
  const held = t >= GRAB;
  const ang = armAngle(d, d, Math.min(19, t), 0, false) + (t > 19 ? 1.2 * Math.sin(f / 13) * sstep((t - 19) / 10) : 0);
  const gA = bannerGrip(t);
  const pose = held ? aimWeapon(q, ang, "commoner", { weapon: "banner", gripAt: gA }) : q;
  return { kind: "commoner", pose, armed: wearArmour(t), ink: mixInk(DIM, ORANGE, tk), gear: mixInk(DULL, ORANGE, tk), weapon: held ? "banner" : "none", gripAt: gA, wave: held ? 0.045 * Math.max(0, t - GRAB) * sstep((t - GRAB) / 12) : 0, seed };
};

type Lying = { w: Pole; at: P2; s: number; angle: number; dir: 1 | -1 };
/** slumped among the ruins, or drifting aimlessly (before he runs) */
const prePose = (p: Person, f: number): FigPose => {
  const base = p.mode === "hunch" ? face(R_HUNCH, p.d0) : face(R_SLUMP, p.d0);
  return p.mode === "drift" ? walkPose(face(R_SLUMP, p.d0), (DRIFT_V * f) / (2 * WALK_STRIDE) + hash(p.seed, 16), 0.55) : idle(base, f, p.seed, 0.8);
};
const personAt = (p: Person, f: number, c: C3): { fig: Fig; lying: Lying | null } => {
  const fl = fleeAt(p, f);
  const dIn: 1 | -1 = fl.dir;
  let x = f < p.tMove ? driftPos(p, f)[0] : fl.x;
  const zz = fl.z;
  let m: ManState;
  const tArm = p.tArm;
  const turned = dIn !== p.dOut;
  if (f < p.tMove) {
    m = { kind: "commoner", pose: prePose(p, f), armed: 0, ink: DIM, gear: DULL, weapon: "none", seed: p.seed };
  } else if (f < tArm) {
    // fleeing into the huddle, then standing in it, cornered
    const settle = sstep((f - fl.arrive + 6) / 8);
    const base = lerpFig(face(R_FLEE, dIn), face(R_STOOD, dIn), settle);
    let pose: FigPose;
    if (fl.moving) {
      const ph = fl.dist / RUN_LEN + hash(p.seed, 16);
      const sw = Math.sin(2 * Math.PI * ph);
      const run = runLegs(face(R_FLEE, dIn), ph, Math.min(1, (f - p.tMove) / 5));
      pose = { ...run, armL: { ...run.armL, w: [run.armL.w[0] + 16 * sw * dIn, run.armL.w[1]] }, armR: { ...run.armR, w: [run.armR.w[0] - 16 * sw * dIn, run.armR.w[1]] } };
    } else pose = idle(base, f, p.seed, 0.8);
    // he turns from the way he was facing to run (through facing us)
    const tt = sstep((f - p.tMove) / 7);
    if (tt < 1) pose = lerpFig(prePose(p, p.tMove), pose, tt);
    m = { kind: "commoner", pose, armed: 0, ink: DIM, gear: DULL, weapon: "none", seed: p.seed };
  } else if (p.bearer) {
    m = bearerState(dIn, f - tArm, f, p.seed);
  } else if (f < tArm + ARM_N) {
    m = armingState(dIn, p.dOut, f - tArm, p.seed, p.w, p.tilt);
  } else {
    // in guard, facing out; from PUSH_T0 the halves press outward
    const pushed = pushAt(f, 1.5 * hash(p.seed, 17));
    x += p.dOut * pushed;
    const moving = f > PUSH_T0 && f < PUSH_T1 + 8;
    const g = face(R_GUARD, p.dOut);
    const o = { weapon: p.w, weaponArm: turned ? ("far" as const) : ("near" as const), gripAt: turned ? gripFar(p.w) : gripNear(p.w) };
    const legs = moving ? { ...walkPose(g, pushed / (2 * WALK_STRIDE) + hash(p.seed, 18), 1), armL: g.armL, armR: g.armR } : idle(g, f, p.seed, 0.7);
    const pose = levelled(legs, "commoner", GUARD_ANG * p.dOut + 1.6 * Math.sin(f / 9 + p.seed), 1, o);
    m = { kind: "commoner", pose, armed: 1, ink: ORANGE, gear: ORANGE, weapon: p.w, weaponArm: o.weaponArm, gripAt: o.gripAt, seed: p.seed };
  }
  const s = sOf(zz, c);
  const at = proj(x, 0, zz, c);
  const lg = lyingGrip(dIn, p.w, p.tilt);
  const lying = f < tArm + GRAB ? { w: p.w, at: proj(p.xc + lg[0], -lg[1], p.zc, c), s: sOf(p.zc, c), angle: (90 + p.tilt) * dIn, dir: dIn } : null;
  return { fig: { key: `p${p.seed}`, Z: zz, at, s, m }, lying };
};

// ---------------------------------------------------------------------------
// THE INVADERS: two columns from each side (three files), cream
// ---------------------------------------------------------------------------
const FILES = [-300, -585, -880];
const PER_FILE = 3;
const HALT_X = 610;
const GAP_MARCH = 165;
const GAP_HALT = 128;
type Invader = { side: 1 | -1; file: number; m: number; Z: number; x0: number; xh: number; tHalt: number; seed: number };
const INVADERS: Invader[] = [];
([-1, 1] as const).forEach((side) =>
  FILES.forEach((zz, fi) => {
    for (let m = 0; m < PER_FILE; m++) {
      const off = 26 * (hash(fi * 9 + m, side + 3) - 0.5) + (fi === 1 ? -20 : fi === 2 ? 22 : 0);
      const x0 = HEAD_X0 + m * GAP_MARCH + off + fi * 12;
      const xh = HALT_X + m * GAP_HALT + off;
      INVADERS.push({ side, file: fi, m, Z: zz + 18 * (hash(fi * 9 + m, side + 5) - 0.5), x0, xh, tHalt: (x0 - xh) / MARCH_V, seed: 200 + INVADERS.length });
    }
  }),
);
/** the frame the orange points reach a file's head and it gives ground (per side) */
/** how far ahead of his feet a levelled ge reaches (the dgFigures guard: ~360 units) */
const guardReach = 360;
const RECOIL_GAP = 40;
/** the outermost orange man of a side, before the push (|X|) */
const OUTER = Math.max(...PEOPLE.map((p) => Math.abs(p.xc)));
const recoilT = (xh: number) => {
  for (let f = PUSH_T0; f < PUSH_T1 + 8; f++) if (OUTER + pushAt(f) + guardReach >= xh - RECOIL_GAP) return f;
  return 999;
};
const BACK_V = 5.4;
/** the recoil pose's own ge angle */
const RECOIL_ANG = 50;
const invaderAt = (v: Invader, f: number, c: C3): Fig => {
  const d = (-v.side) as 1 | -1; // he faces the middle
  const headT = recoilT(INVADERS.filter((u) => u.side === v.side && u.file === v.file && u.m === 0)[0].xh);
  const tR = headT + v.m * 2;
  const levels = v.m < 2;
  let ax: number;
  let pose: FigPose;
  if (f < tR) {
    const marched = Math.min(f, v.tHalt);
    ax = v.x0 - MARCH_V * marched;
    const gait = 1 - sstep((f - v.tHalt + 2) / 7);
    const lower = levels ? sstep((f - v.tHalt - 3) / 14) : 0;
    const base = lerpFig(face(R_CARRY, d), face(R_GUARD, d), lower);
    const legs = gait > 0.001 ? { ...walkPose(base, (MARCH_V * marched) / (2 * WALK_STRIDE) + 0.5 * v.m + 0.27 * v.file, gait), armL: base.armL, armR: base.armR } : idle(base, f, v.seed, 0.7);
    pose = levelled(legs, "soldier", d * (CARRY_ANG + (GUARD_ANG - CARRY_ANG) * lower), lower);
  } else {
    // he gives ground: leans back, raises the ge across himself and backs away
    const t = f - tR;
    const back = BACK_V * Math.max(0, Math.min(t, PUSH_T1 + 6 - tR) - 3);
    ax = v.x0 - MARCH_V * v.tHalt + back;
    const rc = sstep(t / 7);
    const was = levels ? face(R_GUARD, d) : face(R_CARRY, d);
    const base = lerpFig(was, face(R_RECOIL, d), rc);
    const moving = t > 3 && f < PUSH_T1 + 6;
    const legs = moving ? { ...walkPose(base, -back / (2 * WALK_STRIDE) + 0.5 * v.m, 1), armL: base.armL, armR: base.armR } : idle(base, f, v.seed, 0.8);
    const a0 = levels ? GUARD_ANG : CARRY_ANG;
    pose = levelled(legs, "soldier", d * (a0 + (RECOIL_ANG - a0) * rc), levels ? 1 - 0.4 * rc : 0.6 * rc);
  }
  const x = v.side * ax;
  const m: ManState = { kind: "soldier", pose, armed: 1, ink: CREAM, gear: CREAM, weapon: "ge", seed: v.seed };
  return { key: `v${v.seed}`, Z: v.Z, at: proj(x, 0, v.Z, c), s: sOf(v.Z, c), m };
};

// ---------------------------------------------------------------------------
// THE MEN FROM BEHIND THE WALL: they climb over the wreck in the breach
// ---------------------------------------------------------------------------
const DESTS: P2[] = [];
[-150, -260, -370, -480].forEach((zz, r) => [-200, -70, 70, 200].forEach((x, j) => DESTS.push([x + 16 * (hash(r * 5 + j, 21) - 0.5), zz + 20 * (hash(r * 5 + j, 22) - 0.5)])));
type Climber = { xs: number; zs: number; xd: number; zd: number; d: 1 | -1; tArm: number; tGo: number; path: P2[]; len: number; seed: number };
const RUN_V = 11;
const CLIMBERS: Climber[] = DESTS.map(([xd, zd], i) => {
  const d: 1 | -1 = sgn(xd);
  const xs = xd * 0.4 - d * (40 + 70 * hash(i, 23));
  const zs = 520 + 70 * hash(i, 24);
  const mid: P2 = [xs * 0.5 + xd * 0.2, HEAP_Z - 20];
  const path: P2[] = [[xs, zs], mid, [xd, zd]];
  const len = Math.hypot(mid[0] - xs, mid[1] - zs) + Math.hypot(xd - mid[0], zd - mid[1]);
  // the ones behind go first, so they come over the crest one after another
  const order = DESTS.length - 1 - i;
  const tGo = Math.round(96 + 2.3 * order + 2 * hash(i, 26));
  // he has taken up his ge (hidden behind the heap) before he starts up it
  return { xs, zs, xd, zd, d, tArm: Math.min(Math.round(90 + 10 * hash(i, 25)), tGo - 21), tGo, path, len, seed: 300 + i };
});
const pathPt = (path: P2[], dist: number): P2 => {
  let left = dist;
  for (let i = 0; i < path.length - 1; i++) {
    const L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    if (left <= L) return [path[i][0] + ((path[i + 1][0] - path[i][0]) * left) / L, path[i][1] + ((path[i + 1][1] - path[i][1]) * left) / L];
    left -= L;
  }
  return path[path.length - 1];
};
const climberAt = (k: Climber, f: number, c: C3): Fig => {
  const T = k.len / RUN_V;
  const t = f - k.tGo;
  const r = 6;
  const dist = t <= 0 ? 0 : t >= T + r ? k.len : RUN_V * (t < r ? (t * t) / (2 * r) : t >= T ? T - r / 2 + (r / 2 - ((T + r - t) * (T + r - t)) / (2 * r)) : t - r / 2);
  const [x, zz] = pathPt(k.path, Math.min(k.len, dist));
  const y = heapH(x, zz);
  let m: ManState;
  if (f < k.tArm) {
    m = { kind: "commoner", pose: idle(face(R_HUNCH, k.d), f, k.seed, 0.8), armed: 0, ink: DIM, gear: DULL, weapon: "none", seed: k.seed };
  } else if (f < k.tArm + 19) {
    m = armingState(k.d, k.d, f - k.tArm, k.seed);
  } else if (t < T + r) {
    const run = { ...face(R_CARRY, k.d), lean: 8 * k.d };
    const pose = t > 0 ? runLegs(run, dist / RUN_LEN + hash(k.seed, 27), Math.min(1, t / 4)) : idle(face(R_CARRY, k.d), f, k.seed, 0.7);
    m = { kind: "commoner", pose: aimWeapon(pose, CARRY_ANG * k.d + 4 * k.d * Math.min(1, t / 4), "commoner", { weapon: "ge" }), armed: 1, ink: ORANGE, gear: ORANGE, weapon: "ge", seed: k.seed };
  } else {
    const lv = sstep((t - T - r) / 12);
    const base = idle(lerpFig(face(R_CARRY, k.d), face(R_GUARD, k.d), lv), f, k.seed, 0.7);
    const pose = levelled(base, "commoner", k.d * (CARRY_ANG + (GUARD_ANG - CARRY_ANG) * lv) + 1.4 * Math.sin(f / 8 + k.seed), lv);
    m = { kind: "commoner", pose, armed: 1, ink: ORANGE, gear: ORANGE, weapon: "ge", seed: k.seed };
  }
  return { key: `c${k.seed}`, Z: zz, at: proj(x, y, zz, c), s: sOf(zz, c), m };
};

// ---------------------------------------------------------------------------
// THE HOST BEHIND THE WALL (sprites). Each man runs the same short timeline on
// his own start frame: hunched dim among the ruins -> takes up the weapon at
// his feet -> stands orange, the weapon upright.
// ---------------------------------------------------------------------------
const HN = 22;
const HGRAB = 8;
const hostTracks = ([1, -1] as const).map((d) =>
  poseTrack([
    [0, face(R_HUNCH, d)],
    [5, face(R_REACH, d)],
    [HGRAB - 1, face(R_REACH, d)],
    [HGRAB + 1, face(R_GRIP, d)],
    [15, lerpFig(face(R_GRIP, d), face(R_CARRY, d), 0.6)],
    [HN, face(R_CARRY, d)],
  ]),
);
const hostInk = track([[HGRAB - 1, 0], [HGRAB + 7, 1]]);
const hostWear = track([[HGRAB + 2, 0], [HGRAB + 10, 1]]);
const hostAng = track([[HGRAB, 90], [18, CARRY_ANG]]);
const HOST_STATES: ManState[][] = ([1, -1] as const).map((d, di) =>
  Array.from({ length: HN + 1 }, (_, st): ManState => {
    const pose = hostTracks[di](st);
    const t = hostInk(st);
    const lyingAt = gripAt("commoner", hostTracks[di](HGRAB), 90 * d);
    const held = st >= HGRAB;
    return {
      kind: "commoner",
      pose: held ? aimWeapon(pose, d * hostAng(st), "commoner", { weapon: "ge" }) : pose,
      armed: hostWear(st),
      ink: mixInk(DIM, ORANGE, t),
      gear: mixInk(DULL, ORANGE, t),
      weapon: held ? "ge" : "none",
      lying: held ? undefined : { at: lyingAt, angle: 90 * d, dir: d },
      seed: di * 7 + 3,
    };
  }),
);
/** the host's standard-bearers: the same rise, a banner instead of a ge, heaved up as the pole slides through
 *  the fists (as the bearer in front does); the flag is a fixed phase, the canvas rocking keeps it alive */
const hostBannerGrip = track([[HGRAB + 2, GRIP_AT.banner], [HN, 70]]);
const HOST_BANNERS: ManState[][] = ([1, -1] as const).map((d, di) =>
  Array.from({ length: HN + 1 }, (_, st): ManState => {
    const pose = hostTracks[di](st);
    const t = hostInk(st);
    const held = st >= HGRAB;
    const gA = hostBannerGrip(st);
    return {
      kind: "commoner",
      pose: held ? aimWeapon(pose, d * hostAng(st), "commoner", { weapon: "banner", gripAt: gA }) : pose,
      armed: hostWear(st),
      ink: mixInk(DIM, ORANGE, t),
      gear: mixInk(DULL, ORANGE, t),
      weapon: held ? "banner" : "none",
      gripAt: gA,
      wave: 0.3,
      lying: held ? undefined : { at: gripAt("commoner", hostTracks[di](HGRAB), 90 * d, "banner"), angle: 90 * d, dir: d },
      lyingW: "banner",
      seed: di * 5 + 21,
    };
  }),
);
/** the men who climb onto the wall walk behind the parapet (sprites on their own canvas, between the
 *  wall's top and its face): they rise from behind the crest, the ge first, in a wave out from the breach */
const RAMPART_STATES: ManState[] = ([1, -1] as const).map(
  (d): ManState => ({ kind: "commoner", pose: aimWeapon(face(R_CARRY, d), CARRY_ANG * d, "commoner", { weapon: "ge" }), armed: 1, ink: ORANGE, gear: ORANGE, weapon: "ge", seed: d > 0 ? 11 : 12 }),
);
type Rampart = { x: number; z: number; y: number; d: 1 | -1; t0: number; ph: number };
const RAMPART: Rampart[] = (() => {
  const out: Rampart[] = [];
  [120, 260].forEach((zz, r) => {
    for (let x = -2300 + r * 52; x < 2300; x += 104) {
      const i = Math.round(x / 52) + 200 * r;
      const xx = x + 26 * (hash(i, 601) - 0.5);
      if (xx > -560 && xx < 540) continue;
      out.push({ x: xx, z: zz + 30 * (hash(i, 602) - 0.5), y: crestAt(xx), d: xx < 0 ? -1 : 1, t0: Math.round(134 + (Math.abs(xx) - 500) / 105 + 4 * r + 5 * hash(i, 603)), ph: 6.283 * hash(i, 604) });
    }
  });
  return out.sort((a, b) => b.z - a.z);
})();
const RISE = 20;
const rampY = (r: Rampart, f: number) => r.y - 540 * (1 - sstep((f - r.t0) / RISE));
/** the sprite's box round a man, units (feet at 0, 0) */
const BOX = { x0: -440, x1: 440, y0: -720, y1: 40 };
const TIERS = [0.8, 0.57, 0.4, 0.28, 0.2, 0.14, 0.1, 0.07];
const keyOf = (di: number, st: number, tier: number) => (di * 64 + st) * 16 + tier;
const tierFor = (d: number) => {
  let t = 0;
  while (t < TIERS.length - 1 && TIERS[t + 1] >= d * 0.97) t++;
  return t;
};
const spriteSize = (key: number) => {
  const tier = key & 15;
  const st = (key >> 4) & 63;
  const di = key >> 10;
  const sc = TIERS[tier];
  return { di, st, sc, w: Math.ceil((BOX.x1 - BOX.x0) * sc) + 4, h: Math.ceil((BOX.y1 - BOX.y0) * sc) + 4 };
};
type Sprite = { c: HTMLCanvasElement; sc: number };
const SPRITES = new Map<number, Sprite>();
const LOADING = new Map<number, Promise<void>>();
const SpriteSource: React.FC<{ spriteKey: number }> = ({ spriteKey }) => {
  const { di, st, sc, w, h } = spriteSize(spriteKey);
  return (
    <svg data-sprite={spriteKey} width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <ManArt m={di < 2 ? HOST_STATES[di][st] : di < 4 ? RAMPART_STATES[di - 2] : HOST_BANNERS[di - 4][st]} at={[-BOX.x0 * sc + 2, -BOX.y0 * sc + 2]} scale={sc} uid={`h${spriteKey}`} />
    </svg>
  );
};
const loadSprite = (key: number, node: Element): Promise<void> => {
  const had = LOADING.get(key);
  if (had) return had;
  const { sc, w, h } = spriteSize(key);
  const svg = new XMLSerializer().serializeToString(node);
  const p = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
      // a small man's own outline is thinner than a pixel: a dark casing keeps a mass of them separate men
      const casing = Math.max(0, 0.95 - 1.5 * sc);
      const hostish = key >> 10 < 2 || key >> 10 >= 4;
      const dimSt = hostish && ((key >> 4) & 63) < HGRAB;
      if (casing > 0.05) {
        const sil = document.createElement("canvas");
        sil.width = w;
        sil.height = h;
        const sx = sil.getContext("2d") as CanvasRenderingContext2D;
        sx.drawImage(img, 0, 0, w, h);
        sx.globalCompositeOperation = "source-in";
        sx.fillStyle = DARK;
        sx.fillRect(0, 0, w, h);
        ctx.globalAlpha = dimSt ? 0.22 : 0.55;
        for (let i = 0; i < 8; i++) ctx.drawImage(sil, casing * Math.cos((i * Math.PI) / 4), casing * Math.sin((i * Math.PI) / 4));
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // a man not yet committed is sunk toward the page (his lines too); he comes up to full ink as he turns
      const sunk = hostish ? 0.45 * (1 - hostInk((key >> 4) & 63)) : 0;
      if (sunk > 0.01) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = sunk;
        ctx.fillStyle = LAND;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      SPRITES.set(key, { c: cv, sc });
      resolve();
    };
    img.onerror = () => reject(new Error(`LethalAdversary: sprite ${key} did not rasterise`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  LOADING.set(key, p);
  return p;
};

/** the end camera: the host is laid out to fill what it will see */
const C_END = camAt(DURATION - 1);
type Host = { n: number; x: Float32Array; z: Float32Array; di: Uint8Array; t0: Int16Array; ph: Float32Array };
/** the lanes between the host's blocks (|X|), its cross streets (Z ranges) and its standards (X, Z) */
const HOST_LANES = [700, 2050, 3450, 4900, 6400];
const HOST_STREETS: [number, number][] = [[2950, 3180], [5300, 5650], [8700, 9300], [13000, 13900]];
const HOST_STANDARDS: [number, number][] = [[-1350, 2350], [1380, 2650], [40, 4300], [-2150, 4650], [2300, 6400]];
const HOST: Host = (() => {
  const ranks: number[] = [];
  for (let zz = WALL_T + 520; zz < 17000; ) {
    ranks.push(zz);
    const dd = zz - C_END.zc;
    const pxPerUnit = (C_END.hc * F) / (dd * dd);
    zz += Math.max(125, 5.5 / pxPerUnit);
  }
  const men: { x: number; z: number; di: number; t0: number; ph: number }[] = [];
  const waveAt = (x: number, z2: number, i: number) => Math.round(92 + Math.hypot(x * 0.8, z2) / 330 + 4 * hash(i, 504));
  for (let j = ranks.length - 1; j >= 0; j--) {
    const zz = ranks[j];
    const hw = (540 * (zz - C_END.zc)) / F + 200;
    const gap = 108;
    const n = Math.ceil(hw / gap);
    for (let c = -n; c <= n; c++) {
      const i = j * 1000 + c + 500;
      const x = (c + (j % 2) * 0.5 + 0.62 * (hash(i, 501) - 0.5)) * gap;
      const z2 = zz + 70 * (hash(i, 502) - 0.5);
      // the men right behind the breach are the climbers (live figures)
      if (Math.abs(x) < 420 && z2 < 1350) continue;
      // the host stands in blocks: lanes between them, and cross streets
      if (HOST_LANES.some((lx) => Math.abs(Math.abs(x) - lx) < 78)) continue;
      if (HOST_STREETS.some(([a, b]) => z2 > a && z2 < b)) continue;
      if (HOST_STANDARDS.some(([bx, bz]) => Math.abs(x - bx) < 70 && Math.abs(z2 - bz) < 80)) continue;
      men.push({ x, z: z2, di: hash(i, 503) > 0.5 ? 0 : 1, t0: waveAt(x, z2, i), ph: 6.283 * hash(i, 505) });
    }
  }
  HOST_STANDARDS.forEach(([bx, bz], k) => men.push({ x: bx, z: bz, di: 4 + (k % 2), t0: waveAt(bx, bz, 7000 + k) - 2, ph: 6.283 * hash(k, 506) }));
  men.sort((a, b) => b.z - a.z);
  return {
    n: men.length,
    x: Float32Array.from(men.map((m) => m.x)),
    z: Float32Array.from(men.map((m) => m.z)),
    di: Uint8Array.from(men.map((m) => m.di)),
    t0: Int16Array.from(men.map((m) => m.t0)),
    ph: Float32Array.from(men.map((m) => m.ph)),
  };
})();
type Plan = { n: number; idx: Int32Array; sx: Float32Array; sy: Float32Array; d: Float32Array; key: Int32Array; keys: number[] };
const planAt = (f: number, c: C3): Plan => {
  const idx = new Int32Array(HOST.n);
  const sx = new Float32Array(HOST.n);
  const sy = new Float32Array(HOST.n);
  const dd = new Float32Array(HOST.n);
  const key = new Int32Array(HOST.n);
  const seen = new Set<number>();
  // the wall hides everything whose head is below the crest's sightline (a cheap cull; the wall still draws over them)
  const sW = sOf(0, c);
  const crestLow = c.yh + sW * (c.hc - (WALL_H - 360));
  let n = 0;
  for (let i = 0; i < HOST.n; i++) {
    const s = sOf(HOST.z[i], c);
    const x = 540 + s * HOST.x[i];
    const y = c.yh + s * c.hc;
    if (x + BOX.x1 * s < 0 || x + BOX.x0 * s > FRAME_W || y + BOX.y0 * s > FRAME_H || y + BOX.y1 * s < 0) continue;
    if (y + BOX.y0 * s > crestLow + 10 && Math.abs(x - 540) > 700 * sW + 40) continue;
    const st = Math.max(0, Math.min(HN, f - HOST.t0[i]));
    const k = keyOf(HOST.di[i], st, tierFor(s));
    idx[n] = i;
    sx[n] = x;
    sy[n] = y;
    dd[n] = s;
    key[n] = k;
    seen.add(k);
    n++;
  }
  return { n, idx, sx, sy, d: dd, key, keys: Array.from(seen) };
};
const rampPlanAt = (f: number, c: C3): Plan => {
  const N = RAMPART.length;
  const idx = new Int32Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const dd = new Float32Array(N);
  const key = new Int32Array(N);
  const seen = new Set<number>();
  let n = 0;
  for (let i = 0; i < N; i++) {
    const r = RAMPART[i];
    if (f <= r.t0) continue;
    const s = sOf(r.z, c);
    const x = 540 + s * r.x;
    const y = c.yh + s * (c.hc - rampY(r, f));
    if (x + BOX.x1 * s < 0 || x + BOX.x0 * s > FRAME_W || y + BOX.y0 * s > FRAME_H || y + BOX.y1 * s < 0) continue;
    const k = keyOf(r.d > 0 ? 2 : 3, 0, tierFor(s));
    idx[n] = i;
    sx[n] = x;
    sy[n] = y;
    dd[n] = s;
    key[n] = k;
    seen.add(k);
    n++;
  }
  return { n, idx, sx, sy, d: dd, key, keys: Array.from(seen) };
};
/** the far host sinks toward the page */
const HAZE = [0.08, 0.11, 0.15, 0.2, 0.27];
const drawPlan = (ctx: CanvasRenderingContext2D, p: Plan, f: number, phOf: (i: number) => number = (i) => HOST.ph[i], haze = true) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  let band = 0;
  for (let j = 0; j < p.n; j++) {
    const i = p.idx[j];
    while (haze && band < HAZE.length && p.d[j] >= HAZE[band]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = LAND;
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      band++;
    }
    const sp = SPRITES.get(p.key[j]);
    if (!sp) continue;
    const d = p.d[j];
    const q = d / sp.sc;
    const w = sp.c.width * q;
    const h = sp.c.height * q;
    const ox = (BOX.x0 * sp.sc - 2) * q;
    const oy = (BOX.y0 * sp.sc - 2) * q;
    // alive: a hair of rocking about his feet, each on his own time
    const ph = phOf(i);
    const a = ((0.5 * Math.sin(f / 11 + ph) + 0.25 * Math.sin(f / 6.7 + 2.1 * ph)) * Math.PI) / 180;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    ctx.setTransform(cs, sn, -sn, cs, p.sx[j], p.sy[j]);
    ctx.drawImage(sp.c, ox, oy, w, h);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ---------------------------------------------------------------------------
// THE FRAME
// ---------------------------------------------------------------------------
const figVisible = (g: Fig) => g.at[0] > -360 * g.s - 40 && g.at[0] < FRAME_W + 360 * g.s + 40 && g.at[1] - 520 * g.s < FRAME_H && g.at[1] > -40;
const LethalAdversary: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = useMemo(() => camAt(frame), [frame]);
  const plan = useMemo(() => planAt(frame, c), [frame, c]);
  const ramp = useMemo(() => rampPlanAt(frame, c), [frame, c]);
  const ref = useRef<HTMLCanvasElement>(null);
  const refB = useRef<HTMLCanvasElement>(null);
  const bench = useRef<HTMLDivElement>(null);
  const waiting = useRef<number | null>(null);
  const [jobs, setJobs] = useState<number[]>([]);
  useLayoutEffect(() => {
    const missing = Array.from(new Set(plan.keys.concat(ramp.keys))).filter((k) => !SPRITES.has(k));
    if (!missing.length) {
      const ctx = ref.current?.getContext("2d");
      if (ctx) drawPlan(ctx, plan, frame);
      const ctxB = refB.current?.getContext("2d");
      if (ctxB) drawPlan(ctxB, ramp, frame, (i) => RAMPART[i].ph, false);
      if (waiting.current !== null) {
        continueRender(waiting.current);
        waiting.current = null;
      }
      return;
    }
    if (waiting.current === null) waiting.current = delayRender("LethalAdversary: rasterising the host sprites", { timeoutInMilliseconds: 240000 });
    const nodes = new Map<number, Element>();
    bench.current?.querySelectorAll("svg[data-sprite]").forEach((el) => nodes.set(Number(el.getAttribute("data-sprite")), el));
    if (missing.some((k) => !nodes.has(k) && !LOADING.has(k))) {
      setJobs(missing);
      return;
    }
    Promise.all(missing.map((k) => loadSprite(k, nodes.get(k) as Element)))
      .then(() => setJobs([]))
      .catch((err) => cancelRender(err));
  }, [plan, ramp, frame, jobs]);

  const figs = useMemo(() => {
    const out: Fig[] = [];
    const lying: (Lying & { key: string })[] = [];
    PEOPLE.forEach((p) => {
      const r = personAt(p, frame, c);
      out.push(r.fig);
      if (r.lying) lying.push({ ...r.lying, key: `w${p.seed}` });
    });
    INVADERS.forEach((v) => out.push(invaderAt(v, frame, c)));
    CLIMBERS.forEach((k) => out.push(climberAt(k, frame, c)));
    out.sort((a, b) => b.Z - a.Z);
    return { all: out.filter(figVisible), lying };
  }, [frame, c]);
  const behind = figs.all.filter((g) => g.Z >= WALL_T);
  const inBreach = figs.all.filter((g) => g.Z < WALL_T && g.Z >= HEAP_Z);
  const onHeap = figs.all.filter((g) => g.Z < HEAP_Z && g.Z >= 0);
  const front = figs.all.filter((g) => g.Z < 0);
  const draw = (g: Fig) => <ManArt key={g.key} m={g.m} at={g.at} scale={g.s} uid={g.key} />;
  const pageCam = { k: sOf(ZF, c), cx: 540, cy: 960 };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={pageCam}>
        <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {behind.map(draw)}
          <Jambs c={c} />
          {inBreach.map(draw)}
          <Heap c={c} />
          {onHeap.map(draw)}
          <WallTop c={c} />
        </svg>
        <canvas ref={refB} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <WallFace c={c} />
          <Stones c={c} />
          <GateLeaf c={c} />
          {figs.lying.map((w) => (
            <LyingWeapon key={w.key} w={w.w} at={w.at} angle={w.angle} dir={w.dir} scale={w.s} uid={w.key} />
          ))}
          {front.map(draw)}
          <ForeRuins c={c} />
        </svg>
      </TexcocoPage>
      <div ref={bench} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
        {jobs.map((k) => (
          <SpriteSource key={k} spriteKey={k} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default LethalAdversary;
/** the host's size and the beat frames (for the report) */
export const HOST_COUNT = HOST.n;
export const BEATS = { invadersHalt: Math.round(Math.min(...INVADERS.map((v) => v.tHalt))), firstArm: Math.min(...PEOPLE.map((p) => p.tArm)), lastArm: Math.max(...PEOPLE.map((p) => p.tArm)), pushStart: PUSH_T0, pushEnd: PUSH_T1, pushMax: PUSH_MAX };
/** where one of the cast is on screen (full-res px: feet x, y and px per unit), for the review sheets */
export const whereIs = (who: "p" | "v" | "c", i: number, f: number) => {
  const c = camAt(f);
  const g = who === "p" ? personAt(PEOPLE[i], f, c).fig : who === "v" ? invaderAt(INVADERS[i], f, c) : climberAt(CLIMBERS[i], f, c);
  return [Math.round(g.at[0]), Math.round(g.at[1]), Number(g.s.toFixed(3))];
};
