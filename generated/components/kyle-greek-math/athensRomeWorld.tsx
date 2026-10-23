// ---------------------------------------------------------------------------
// athensRomeWorld: THE ATHENS-AND-ROME WORLD of the Kyle Harper clip (kyle-greek-math), built with cut E
// (AthensNotMassive, 61.695 s) and used by cut F (RomansHadThePeople, 74.074 s), which opens on E's last frame and
// pans right to the Romans. One wide plain in palette A's air, mood day (styles/dwarkesh-3d.md):
//   LEFT   the Acropolis: a mesa of warm stone (cliff, talus with boulders, broken strata, the citadel wall on the
//          plateau's edge) with the Parthenon on it, on a low terrace
//          (marble volumes: three steps, 8 x 17 Doric columns as AirCyl, the dark cella behind them, the entablature
//          with its triglyph rhythm, the pediment); in front of it on the plain the Athenians: a modest crowd (223
//          greekFolk crowd sprites in a loose oval), eight scholars among them with small ORANGE tablets (the only
//          orange in the world), a few heads turning
//   EMPTY  the plain: sparse scrub tufts and stones, soft tonal patches, a dirt track from the Athenians' right flank
//          bending back toward the far right haze (left of the Romans), the horizon a haze zone
//   RIGHT  the Romans beyond ~29 m of empty ground: a vast crowd of romeFolk crowd sprites filling the plain to the
//          horizon (16k figures, culled per frame; rows spaced wider with depth so they stay a carpet on screen), the
//          Colosseum in the haze behind them; no orange anywhere
// Data and camera: ./athensRomePlan.ts (React-free; re-exported here). Its header has the units and the Cam3 model.
//
// API (for cut F; ATHENS_READY.md in the clip's notes is the contract)
//   cameraE(f) / cameraPathE(f) / E_KEYS / E_END     E's camera (with / without the hand-held sway) and its last frame
//   swayCam3(c, life)                                 the hand-held sway E uses (3 / 5 px, incaShared's sway)
//   athensAirOf(c: Cam3, life) -> AirWorld            the kit's AirWorld on this camera (fog by depth behind the front
//                                                     line Z = -4200; motes and shafts parallax against E's f0 camera)
//   <AthensRomeScene cam={c} life={life} reqs={R} />  the whole world in its painter's order inside <AirStage>
//   athensSpriteReqs([{cam, life}...])                every crowd sprite a camera path shows: compute R ONCE over all
//                                                     the cut's frames at module load (baked once per render tab)
//   assertJoinE(camF(0), lifeF(0))                    throws unless F opens exactly on E's last frame
//   project(c, X, Y, Z), kitCamOf(c)                  a world point on screen; the kit's 2D camera + DepthOpts
//   LIFE: everything alive (sway, head turns, motes, shafts, grain) runs on the LIFE frame: E passes its frame, F
//   passes E_END.life + its own frame, so F's first frame is E's last frame pixel for pixel.
// ---------------------------------------------------------------------------
import React from "react";
import {
  AIR,
  AirCyl,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  PandemicFolk,
  WorldSvg,
  fogHex,
  lineOf,
  makeAirView,
  mixHex,
  perspective,
  rgbHex,
  type AirScene,
  type AirWorld,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import * as GF from "./greekFolk";
import { buildGreekFolk, type GShape } from "./greekFolkBody";
import type { Shape } from "../kyle-pandemics/pandemicFolkPaint";
import {
  ALT_HEAD_YAW,
  ATHENIANS,
  ATHENS_FRONT_Z,
  COLOSSEUM,
  COL_FLANK,
  COL_FRONT,
  ERECHTHEION,
  HOUSES,
  OLIVES,
  PROPYLAEA,
  RAMP,
  ROCK_BOULDERS,
  TERRACES,
  TERRACE_WALL,
  WALL_COURSES,
  rockSurface,
  ROCK_RINGS,
  ROCK_SHOULDER,
  TEMPLE_LIFT,
  WALL,
  ROCK_H,
  ROCK_LEDGES,
  ROMANS,
  TEMPLE,
  TRACK,
  TRACK_W,
  TUFTS,
  cameraE as cameraPathE,
  hash,
  headTurnOf,
  kitCamOf,
  project,
  swayOf,
  type Cam3,
  type CrowdMan,
} from "./athensRomePlan";

export * from "./athensRomePlan";
export { cameraPathE };

const PAL = AIR.A;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// THE CAMERA WITH THE HAND-HELD SWAY, AND THE AIR
// ===================================================================================================================
/** the house hand-held drift (incaShared's sway: 3 px across, 5 px up and down), on the life frame: a truck of 3 px
 *  at the Athenian crowd's depth and a 5 px lens shift */
export const swayCam3 = (c: Cam3, life: number): Cam3 => {
  const dx = 3 * Math.sin(life / 23);
  const dy = 5 * Math.sin(life / 19);
  const sCrowd = c.F / Math.max(500, -2560 - c.z);
  return { ...c, x: c.x + dx / sCrowd, hy: c.hy - dy };
};
export const cameraE = (f: number): Cam3 => swayCam3(cameraPathE(f), f);
/** E's last frame: cut F opens on it exactly. cam = with the sway (the picture), path = without it; life = the life
 *  frame its crowd, motes, shafts and grain run on (F passes E_END.life + its own frame); the fog and the crowd state
 *  are functions of (cam, life) with the constants below (ATHENS_SCENE, FOG_Z0, ATHENS_FIG_FOG; ATHENIANS, ROMANS) */
export const E_END = { f: 132, cam: cameraE(132), path: cameraPathE(132), life: 132 };

/** the scene: palette A, mood day; fog by depth behind the front line (FOG_Z0), none nearer than fogNear behind it, so
 *  the crowd and the Acropolis keep their local colour and only the far plain, the Romans' back rows and the Colosseum
 *  sink into the air. moteUnit x4: the 34 m pull-back moves the motes like ~8 m (a drift, not a stream). */
export const ATHENS_SCENE: AirScene = { look: "A", mood: "day", F: 1100, fogNear: 4200, fogVis: 17000, fogMax: 0.9, hLow: 0, hHigh: 5200, moteUnit: 178 * 4 };
export const FOG_Z0 = -4200;
/** the people's fog by stage depth (behind FOG_Z0): none for the first 3500, then toward 0.8 */
export const ATHENS_FIG_FOG = { near: 3500, vis: 16000, max: 0.8 };
const REST = cameraPathE(0);
export const athensAirOf = (c: Cam3, life: number, scene?: Partial<AirScene>): AirWorld => {
  const { cam, depth } = kitCamOf(c);
  const P = perspective(cam, depth);
  const v = makeAirView({
    scene: { ...ATHENS_SCENE, ...scene, F: c.F },
    frame: life,
    horizon: c.hy,
    cam: { x: c.x, y: c.h, z: c.z },
    rest: { x: REST.x, y: REST.h, z: REST.z },
  });
  const dist = (Z: number) => Math.max(0, Z - FOG_Z0);
  const fog = (Z: number) => c01(v.fogAt(dist(Z)));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, dist(Z), h);
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const ff = ATHENS_FIG_FOG;
  const figFog = (Z: number) => ff.max * (1 - Math.exp(-Math.max(0, dist(Z) - ff.near) / ff.vis));
  const folkFog = (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  const workerInks = (Z: number, feetH = 0) => {
    const air = airHex(Z, feetH + 160);
    const t = figFog(Z);
    return Object.fromEntries(Object.entries(PandemicFolk.WORKER_INKS).map(([key, col]) => [key, key === "orange" ? col : mixHex(col, air, t)])) as typeof PandemicFolk.WORKER_INKS;
  };
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  return {
    v,
    P,
    cam,
    Dc: P.Dc,
    k: cam.k,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))),
    figFog,
    folkFog,
    workerInks,
    // outlines ~0.9 screen px at every zoom (this world's zooms run far below the kit's)
    lw: (b = 1.1) => (0.8 * b) / cam.k,
  };
};

/** F's join check: throws unless F's first camera (with the sway) and life frame are E's last ones (call it at module load
 *  with F's camera at f0: assertJoinE(cameraF(0), lifeF(0))) */
export const assertJoinE = (cam0: Cam3, life0: number) => {
  const e = E_END.cam;
  const d = Math.max(Math.abs(cam0.x - e.x), Math.abs(cam0.h - e.h), Math.abs(cam0.z - e.z), Math.abs(cam0.F - e.F), Math.abs(cam0.hy - e.hy));
  if (d > 1e-6 || life0 !== E_END.life) throw new Error(`athensRomeWorld: cut F does not open on E's last frame (camera off by ${d}, life ${life0} vs ${E_END.life})`);
};

// ===================================================================================================================
// MATERIALS
// ===================================================================================================================
/** the Acropolis rock: warm grey-umber stone, a little warmer and lighter than the medium's stone (limestone) */
const ROCK: Mat = { lit: "#A39079", mid: "#7A6A57", dark: "#433A30" };
const PLATEAU: Mat = { lit: "#9C8C72", mid: "#857659", dark: "#5A4F3E" };
/** the citadel wall: dressed limestone, a touch lighter than the rock */
const WALL_STONE: Mat = { lit: "#B9A88C", mid: "#95856C", dark: "#5B4F40" };
/** marble (revision 1: a touch warmer in the light) */
const MARBLE: Mat = { lit: "#F2E5CB", mid: "#D7C6A3", dark: "#908369" };
const MARBLE_SHADE: Mat = { lit: "#CFC2A6", mid: "#A89C82", dark: "#6E6554" };
/** the circuit wall's dressed ashlar on the upper cliff (revision 1) */
const ASHLAR = "#B4A286";
/** small houses: lime plaster walls, roofs of muted red-brown tile (never near the accent) */
const PLASTER: Mat = { lit: "#CBBDA2", mid: "#A99B80", dark: "#665B4B" };
const ROOF_TILE: Mat = { lit: "#8C6E5C", mid: "#6F5546", dark: "#43322A" };
const OLIVE_LEAF = { lit: "#A3A585", mid: "#7F8668", dark: "#525B47" };
const OLIVE_WOOD = "#5E4C3E";
/** the Colosseum: warm travertine (Roman warm stone), no orange */
const TRAVERTINE: Mat = { lit: "#C2B192", mid: "#9C8B6E", dark: "#5B4F3E" };
const TUFT_INKS = [
  { lit: "#9C9269", mid: "#7A7451", dark: "#4E4A35" },
  { lit: "#A39570", mid: "#82765A", dark: "#544B39" },
  { lit: "#8F8D66", mid: "#6C6C4C", dark: "#454632" },
];
const STONE_INK: Mat = { lit: "#A8998A", mid: "#7E7264", dark: "#4A4239" };
/** light from the upper left and a little toward us (X, up, Z) */
const LIGHT = (() => {
  const v = [-0.52, 0.74, -0.42];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((q) => q / n) as [number, number, number];
})();
const shadeOf = (m: Mat, ndl: number) => {
  // soft form light: shade side sinks toward the medium's shadow (pandemicAir formTone)
  const t = Math.max(0, Math.min(1, (ndl + 0.45) / 1.3));
  const u = t * t * (3 - 2 * t);
  const shade = mixHex(m.dark, PAL.shadow, 0.25);
  return u < 0.5 ? mixHex(shade, m.mid, u * 2) : mixHex(m.mid, m.lit, (u - 0.5) * 2);
};

// ===================================================================================================================
// THE GROUND: the floor (one tone by distance, no joints), soft tonal patches, the horizon haze
// ===================================================================================================================
type Patch = { X: number; Z: number; rx: number; rz: number; light: boolean; a: number };
const PATCHES: Patch[] = (() => {
  const out: Patch[] = [];
  for (let i = 0; i < 140; i++) {
    const Z = -14000 + Math.pow(hash(i, 21), 1.5) * 70000;
    const X = -30000 + hash(i, 22) * 95000;
    const sc = 1 + Z / 9000;
    out.push({ X, Z, rx: (900 + hash(i, 23) * 2600) * Math.max(1, sc * 0.6), rz: (500 + hash(i, 24) * 1300) * Math.max(1, sc * 0.6), light: hash(i, 25) < 0.5, a: 0.18 + 0.16 * hash(i, 26) });
  }
  return out.sort((p, q) => q.Z - p.Z);
})();
const GroundPatches: React.FC<{ A: AirWorld; c: Cam3; uid: string }> = ({ A, c, uid }) => {
  const els: React.ReactNode[] = [];
  PATCHES.forEach((p, i) => {
    const q = project(c, p.X, 0, p.Z);
    if (!q) return;
    const rx = p.rx * q.s;
    const qa = project(c, p.X, 0, p.Z - p.rz);
    const qb = project(c, p.X, 0, p.Z + p.rz);
    if (!qa || !qb) return;
    const ry = Math.abs(qa.y - qb.y) / 2;
    const sy = (qa.y + qb.y) / 2;
    if (q.x + rx < -40 || q.x - rx > 1120 || sy + ry < c.hy || sy - ry > 1960 || rx < 2) return;
    const col = A.tone(p.light ? "#958566" : "#5C5040", p.Z, 0);
    const a = p.a * (1 - 0.8 * A.fog(p.Z));
    // world px for the WorldSvg: invert the 2D camera
    const wx = A.cam.cx + (q.x - 540) / A.k;
    const wy = A.cam.cy + (sy - 960) / A.k;
    els.push(
      <g key={i}>
        <defs>
          <radialGradient id={`${uid}${i}`}>
            <stop offset="0" stopColor={col} stopOpacity={a} />
            <stop offset="0.55" stopColor={col} stopOpacity={a * 0.6} />
            <stop offset="1" stopColor={col} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={wx} cy={wy} rx={rx / A.k} ry={Math.max(0.5, ry) / A.k} fill={`url(#${uid}${i})`} />
      </g>,
    );
  });
  return <g>{els}</g>;
};

/** the dirt track: a dusty band on the ground (a soft wide verge and a core with two faint ruts), segment by segment
 *  so each takes the fog of its own depth */
const TRACK_PTS: [number, number][] = (() => {
  const P = TRACK;
  const n = P.length;
  const out: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(n - 1, i + 2)];
    const SUB = 10;
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[n - 1]);
  return out;
})();
export const Track: React.FC<{ A: AirWorld; c: Cam3 }> = ({ A, c }) => {
  const P = A.P;
  const pts = TRACK_PTS;
  const side = (i: number, off: number): P2 => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    return P.p(pts[i][0] + (tz / l) * off, 0, pts[i][1] - (tx / l) * off);
  };
  const els: React.ReactNode[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const Zm = (pts[i][1] + pts[i + 1][1]) / 2;
    if (Zm < c.z + 400) continue;
    const fz = A.fog(Zm);
    const near = c01(1 - (Zm + 3000) / 26000);
    // the end of the track melts into the haze
    const fade = 1 - c01((Zm - 22000) / 20000);
    const wide = [side(i, TRACK_W * 1.6), side(i + 1, TRACK_W * 1.6), side(i + 1, -TRACK_W * 1.6), side(i, -TRACK_W * 1.6)];
    const core = [side(i, TRACK_W * 0.85), side(i + 1, TRACK_W * 0.85), side(i + 1, -TRACK_W * 0.85), side(i, -TRACK_W * 0.85)];
    const verge = A.tone("#8C7C5E", Zm, 0);
    const dust = A.tone("#A08F70", Zm, 0);
    els.push(<path key={`w${i}`} d={poly(wide)} fill={verge} opacity={0.32 * fade} stroke={verge} strokeOpacity={0.32 * fade} strokeWidth={A.lw(0.6)} />);
    els.push(<path key={`c${i}`} d={poly(core)} fill={dust} opacity={0.5 * fade} stroke={dust} strokeOpacity={0.5 * fade} strokeWidth={A.lw(0.6)} />);
    if (near > 0.02) {
      const r = A.tone("#6F6149", Zm, 0);
      const a1 = side(i, TRACK_W * 0.42);
      const b1 = side(i + 1, TRACK_W * 0.42);
      const a2 = side(i, -TRACK_W * 0.42);
      const b2 = side(i + 1, -TRACK_W * 0.42);
      els.push(<path key={`r${i}`} d={`M${Pt(a1)}L${Pt(b1)}M${Pt(a2)}L${Pt(b2)}`} stroke={r} strokeWidth={A.lw(0.9)} strokeOpacity={0.4 * near * (1 - fz)} strokeLinecap="round" />);
    }
  }
  return <g>{els}</g>;
};
/** the dense low air at the bottom of the frame (the height ramp): the near plain sinks into it (screen space, under
 *  every standing thing) */
export const LowAirSink: React.FC<{ A: AirWorld; strength?: number }> = ({ A, strength = 0.3 }) => {
  const y0 = 1250;
  const wy0 = A.cam.cy + (y0 - 960) / A.k;
  const wy1 = A.cam.cy + (1930 - 960) / A.k;
  const col = rgbHex(A.v.airAtScreen(1920));
  return (
    <g>
      <defs>
        <linearGradient id="ar-sink" gradientUnits="userSpaceOnUse" x1="0" y1={wy0} x2="0" y2={wy1}>
          <stop offset="0" stopColor={col} stopOpacity={0} />
          <stop offset="0.6" stopColor={col} stopOpacity={0.45 * strength} />
          <stop offset="1" stopColor={col} stopOpacity={strength} />
        </linearGradient>
      </defs>
      <rect x={A.cam.cx - 600 / A.k} y={wy0} width={1200 / A.k} height={wy1 - wy0} fill="url(#ar-sink)" />
    </g>
  );
};

// ===================================================================================================================
// SCRUB TUFTS AND STONES (in three depth layers so the crowds and the rock overlap them correctly)
// ===================================================================================================================
export const TuftLayer: React.FC<{ A: AirWorld; c: Cam3; zMin: number; zMax: number; uid: string }> = ({ A, c, zMin, zMax, uid }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (const t of TUFTS) {
    if (t.Z < zMin || t.Z >= zMax) continue;
    const q = project(c, t.X, 0, t.Z);
    if (!q) continue;
    const rpx = t.r * q.s;
    if (rpx < 0.6 || q.x < -60 || q.x > 1140 || q.y < c.hy - 2 || q.y - 2 * rpx > 1960) continue;
    const [bx, by] = P.p(t.X, 0, t.Z);
    const R = t.r * P.r(t.Z);
    const fz = A.fog(t.Z);
    // the soft contact shadow, to the lower right
    const qa = project(c, t.X, 0, t.Z - t.r * 0.7);
    const qb = project(c, t.X, 0, t.Z + t.r * 0.7);
    const shRy = qa && qb ? Math.max(0.3, Math.abs(qa.y - qb.y) / 2) / A.k : R * 0.3;
    const sh = <ellipse cx={bx + R * 0.35} cy={by + shRy * 0.1} rx={R * 1.25} ry={shRy} fill={PAL.shadow} opacity={0.28 * (1 - fz)} />;
    if (t.kind === 1) {
      // a stone: a rounded lump, lit top, a cream rim
      const m = STONE_INK;
      const h = R * (0.55 + 0.25 * hash(t.seed, 8));
      const w = R * 0.95;
      const d = `M${bx - w},${by} C${bx - w},${by - h * 0.9} ${bx - w * 0.3},${by - h * 1.1} ${bx + w * 0.15},${by - h} C${bx + w * 0.8},${by - h * 0.85} ${bx + w},${by - h * 0.3} ${bx + w},${by} Z`;
      els.push(
        <g key={t.seed}>
          {sh}
          <path d={d} fill={A.tone(m.mid, t.Z, 0)} />
          <path d={`M${bx - w * 0.85},${by - h * 0.55} C${bx - w * 0.6},${by - h * 1.02} ${bx + w * 0.1},${by - h * 1.05} ${bx + w * 0.55},${by - h * 0.8}`} fill="none" stroke={PAL.cream} strokeWidth={Math.max(0.6 / A.k, R * 0.09)} strokeOpacity={0.35 * (1 - fz)} strokeLinecap="round" />
          <path d={`M${bx + w * 0.2},${by} C${bx + w * 0.7},${by - h * 0.2} ${bx + w * 0.95},${by - h * 0.4} ${bx + w},${by} Z`} fill={A.tone(m.dark, t.Z, 0)} opacity={0.5} />
        </g>,
      );
      continue;
    }
    // a scrub tuft: three or four soft overlapping clumps, lit on top, darker at the base
    const m = TUFT_INKS[t.seed % TUFT_INKS.length];
    const n = 3 + (t.seed % 2);
    const blobs: React.ReactNode[] = [];
    for (let j = 0; j < n; j++) {
      const ox = (j - (n - 1) / 2) * R * 0.62 + (hash(t.seed, 30 + j) - 0.5) * R * 0.3;
      const rr = R * (0.42 + 0.22 * hash(t.seed, 40 + j));
      const oy = -rr * (0.75 + 0.3 * hash(t.seed, 50 + j)) - (j === 1 ? R * 0.18 : 0);
      blobs.push(<ellipse key={`d${j}`} cx={bx + ox} cy={by + oy} rx={rr * 1.05} ry={rr * 0.86} fill={A.tone(m.mid, t.Z, 0)} />);
      blobs.push(<ellipse key={`l${j}`} cx={bx + ox - rr * 0.18} cy={by + oy - rr * 0.22} rx={rr * 0.68} ry={rr * 0.5} fill={A.tone(m.lit, t.Z, 0)} opacity={0.75} />);
    }
    els.push(
      <g key={t.seed}>
        {sh}
        <ellipse cx={bx} cy={by - R * 0.12} rx={R * 0.95} ry={R * 0.22} fill={A.tone(m.dark, t.Z, 0)} opacity={0.8} />
        {blobs}
      </g>,
    );
  }
  void uid;
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE ACROPOLIS ROCK: facets between the plateau's edge and the foot, back-face culled against the eye, soft form
// light, ledges (a dark seam and a cream lip above it), a cream rim along the plateau's lit edge, the plateau on top
// ===================================================================================================================
const eyeOf = (c: Cam3): [number, number, number] => [c.x, -c.h, c.z];
type V3 = [number, number, number];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a: V3): V3 => {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};
// ===================================================================================================================
// REVISION 1: THE DETAIL ON THE ACROPOLIS (footprint unchanged): the ramp, terrace walls, the Erechtheion and the
// Propylaea on the rock, a handful of houses and olives at its foot behind the crowd line
// ===================================================================================================================
/** a quad's outward test against the eye (the outward side is the one away from `inside`) */
const seenFrom = (E: V3, q: V3[], inside: V3) => {
  const nn = norm3(cross3(sub3(q[1], q[0]), sub3(q[3], q[0])));
  const mid: V3 = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2];
  const out: V3 = dot3(nn, sub3(inside, mid)) > 0 ? [-nn[0], -nn[1], -nn[2]] : nn;
  return { out, mid, seen: dot3(out, sub3(E, mid)) > 0 };
};
/** the ramp up the west end of the rock: a dusty band on the faces, its outer edge a thin retaining line */
const Ramp: React.FC<{ A: AirWorld; c: Cam3 }> = ({ A, c }) => {
  const P = A.P;
  const pts: V3[] = [];
  for (let k = 0; k < RAMP.length - 1; k++) {
    const [i0, s0] = RAMP[k];
    const [i1, s1] = RAMP[k + 1];
    const n = 14;
    for (let j = 0; j < n; j++) pts.push(rockSurface(i0 + ((i1 - i0) * j) / n, s0 + ((s1 - s0) * j) / n));
  }
  pts.push(rockSurface(RAMP[RAMP.length - 1][0], RAMP[RAMP.length - 1][1]));
  const Zm = pts.reduce((a, q) => a + q[2], 0) / pts.length;
  if (Zm < c.z + 600) return null;
  const fz = A.fog(Zm);
  const r = P.r(Zm);
  // a path cut into the face: the shadow it throws under each run, its outer lip, then the lit tread
  const line = (dy: number, dz: number) => `M${pts.map((q) => Pt(P.p(q[0], q[1] + dy, q[2] + dz))).join("L")}`;
  return (
    <g>
      <path d={line(55, -25)} fill="none" stroke={A.tone(mixHex(ROCK.dark, PAL.shadow, 0.35), Zm, ROCK_H / 2)} strokeWidth={115 * r} strokeOpacity={0.45 * (1 - fz)} strokeLinejoin="round" strokeLinecap="butt" />
      <path d={line(18, -40)} fill="none" stroke={A.tone(ROCK.mid, Zm, ROCK_H / 2)} strokeWidth={115 * r} strokeOpacity={0.9} strokeLinejoin="round" strokeLinecap="butt" />
      <path d={line(-14, -20)} fill="none" stroke={A.tone(mixHex(ROCK.lit, "#C2B091", 0.5), Zm, ROCK_H / 2)} strokeWidth={82 * r} strokeOpacity={0.9} strokeLinejoin="round" strokeLinecap="butt" />
    </g>
  );
};
/** a low wall from a to b on a level (Y), its outer face where seen and a lit top */
const LowWall: React.FC<{ A: AirWorld; c: Cam3; a: [number, number]; b: [number, number]; Y: number; h: number; t: number; mat: Mat }> = ({ A, c, a, b, Y, h, t, mat }) => {
  const P = A.P;
  const E = eyeOf(c);
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  const nx = dz / l;
  const nz = -dx / l;
  const o0: V3 = [a[0], Y, a[1]];
  const o1: V3 = [b[0], Y, b[1]];
  const i0: V3 = [a[0] - nx * t, Y, a[1] - nz * t];
  const i1: V3 = [b[0] - nx * t, Y, b[1] - nz * t];
  const up = (v: V3): V3 => [v[0], v[1] - h, v[2]];
  const Zm = (a[1] + b[1]) / 2;
  const w = A.lw(1);
  const els: React.ReactNode[] = [];
  const midIn: V3 = [(i0[0] + i1[0]) / 2 - nx * 10, Y - h / 2, (i0[2] + i1[2]) / 2 - nz * 10];
  for (const [f0, f1, key] of [[o0, o1, "o"], [i1, i0, "i"]] as [V3, V3, string][]) {
    const q: V3[] = [up(f0), up(f1), f1, f0];
    const ctr: V3 = key === "o" ? midIn : [(o0[0] + o1[0]) / 2 + nx * 10, Y - h / 2, (o0[2] + o1[2]) / 2 + nz * 10];
    const f = seenFrom(E, q, ctr);
    if (!f.seen) continue;
    const ndl = f.out[0] * LIGHT[0] - f.out[1] * LIGHT[1] + f.out[2] * LIGHT[2];
    const col = A.tone(shadeOf(mat, ndl), Zm, -Y + h / 2);
    els.push(<path key={key} d={poly(q.map((v) => P.p(v[0], v[1], v[2])))} fill={col} stroke={col} strokeWidth={w} strokeLinejoin="round" />);
  }
  const tq = [up(o0), up(o1), up(i1), up(i0)].map((v) => P.p(v[0], v[1], v[2]));
  const tc = A.tone(mat.lit, Zm, -Y + h);
  els.push(<path key="t" d={poly(tq)} fill={tc} stroke={tc} strokeWidth={w} strokeLinejoin="round" />);
  els.push(<path key="r" d={`M${Pt(tq[0])}L${Pt(tq[1])}`} stroke={PAL.cream} strokeWidth={w * 1.1} strokeOpacity={0.4 * (1 - A.fog(Zm))} strokeLinecap="round" />);
  return <g>{els}</g>;
};
/** a small Doric / Ionic temple front facing us (the Erechtheion, the Propylaea's hall): steps, the dark cella with
 *  its door, a row of columns, the entablature (front and seen flank), the pediment and the roof where seen */
const MiniTemple: React.FC<{ A: AirWorld; c: Cam3; X: number; Z: number; W: number; L: number; colR: number; colS: number; n: number; colH: number; ent: number; ped: number; step: number; Y: number; uid: string }> = (p) => {
  const { A, c, X, Z, W, L, colR, colS, n, colH, ent, ped, step, Y, uid } = p;
  const P = A.P;
  const E = eyeOf(c);
  const w = A.lw(1);
  const hw = W / 2;
  const yS = Y - step * 2;
  const yCap = yS - colH;
  const yEnt = yCap - ent;
  const els: React.ReactNode[] = [];
  els.push(<Box3 key="s0" A={A} X0={X - hw - step} X1={X + hw + step} Y0={Y - step} Y1={Y} Z0={Z - step} Z1={Z + L + step} mat={MARBLE} uid={`${uid}s0`} rim={0.6} />);
  els.push(<Box3 key="s1" A={A} X0={X - hw} X1={X + hw} Y0={yS} Y1={Y - step} Z0={Z} Z1={Z + L} mat={MARBLE} uid={`${uid}s1`} rim={0.6} />);
  const cz = Z + colS * 1.1;
  els.push(<Box3 key="ce" A={A} X0={X - hw + colS * 0.55} X1={X + hw - colS * 0.55} Y0={yCap} Y1={yS} Z0={cz} Z1={Z + L - 60} mat={MARBLE_SHADE} uid={`${uid}ce`} rim={0} skip={["tp"]} frontTone={A.tone(mixHex(MARBLE_SHADE.dark, PAL.shadow, 0.2), cz, -yCap)} />);
  // the door
  {
    const a = P.p(X - colS * 0.42, yS - colH * 0.66, cz - 2);
    const b = P.p(X + colS * 0.42, yS, cz - 2);
    els.push(<path key="door" d={`M${a[0]},${a[1]}L${b[0]},${a[1]}L${b[0]},${b[1]}L${a[0]},${b[1]}Z`} fill={A.tone(mixHex(PAL.shadow, MARBLE_SHADE.dark, 0.35), cz, -yS)} opacity={0.8} />);
  }
  for (let k = 0; k < n; k++) {
    const cx = X + (k - (n - 1) / 2) * colS;
    els.push(<AirCyl key={`c${k}`} A={A} X={cx} Z={Z + colR * 1.6} R={colR} Y0={yCap + 24} Y1={yS} mat={MARBLE} uid={`${uid}c${k}`} flutes={5} lw={w} />);
    els.push(<Box3 key={`k${k}`} A={A} X0={cx - colR * 1.35} X1={cx + colR * 1.35} Y0={yCap} Y1={yCap + 26} Z0={Z + colR * 0.3} Z1={Z + colR * 2.9} mat={MARBLE} uid={`${uid}k${k}`} rim={0.4} />);
  }
  els.push(<Box3 key="ent" A={A} X0={X - hw} X1={X + hw} Y0={yEnt} Y1={yCap} Z0={Z} Z1={Z + L} mat={MARBLE} uid={`${uid}e`} rim={0.8} skip={["tp"]} />);
  const zf = Z - 6;
  const eL: V3 = [X - hw - 10, yEnt, zf];
  const eR: V3 = [X + hw + 10, yEnt, zf];
  const ap: V3 = [X, yEnt - ped, zf];
  for (const [ea, key, tn] of [[eL, "rl", MARBLE.lit], [eR, "rr", MARBLE_SHADE.mid]] as [V3, string, string][]) {
    const q: V3[] = [ea, ap, [ap[0], ap[1], Z + L + 6], [ea[0], ea[1], Z + L + 6]];
    const f = seenFrom(E, q, [X, yEnt + 50, Z + L / 2]);
    if (!f.seen) continue;
    els.push(<path key={key} d={poly(q.map((v) => P.p(v[0], v[1], v[2])))} fill={A.tone(tn, Z + L / 2, -yEnt)} stroke={A.tone(lineOf(MARBLE), Z + L / 2, -yEnt)} strokeWidth={w} strokeLinejoin="round" />);
  }
  const pf = [P.p(eL[0], eL[1], zf), P.p(ap[0], ap[1], zf), P.p(eR[0], eR[1], zf)];
  els.push(<path key="ped" d={poly(pf)} fill={A.tone(MARBLE.mid, zf, -yEnt)} stroke={A.tone(lineOf(MARBLE), zf, -yEnt)} strokeWidth={w} strokeLinejoin="round" />);
  els.push(<path key="pr" d={`M${Pt(pf[0])}L${Pt(pf[1])}`} stroke={PAL.cream} strokeWidth={w * 1.2} strokeOpacity={0.5 * (1 - A.fog(zf))} strokeLinecap="round" />);
  return <g>{els}</g>;
};
/** the Propylaea: the central hall (six columns) between two lower wings with dark openings */
const Propylaea: React.FC<{ A: AirWorld; c: Cam3; uid: string }> = ({ A, c, uid }) => {
  const Q = PROPYLAEA;
  const Y = -ROCK_H;
  const P = A.P;
  const wing = (x0: number, key: string) => {
    const z0 = Q.Z + 260;
    const els: React.ReactNode[] = [<Box3 key={`${key}b`} A={A} X0={x0} X1={x0 + Q.wingW} Y0={Y - Q.wingH} Y1={Y} Z0={z0} Z1={z0 + Q.wingL} mat={MARBLE} uid={`${uid}${key}`} rim={0.7} />];
    let d = "";
    for (let k = 0; k < 3; k++) {
      const xa = x0 + Q.wingW * (0.14 + k * 0.28);
      const a = P.p(xa, Y - Q.wingH * 0.72, z0 - 2);
      const b = P.p(xa + Q.wingW * 0.16, Y - Q.wingH * 0.06, z0 - 2);
      d += `M${a[0]},${a[1]}L${b[0]},${a[1]}L${b[0]},${b[1]}L${a[0]},${b[1]}Z`;
    }
    els.push(<path key={`${key}o`} d={d} fill={A.tone(mixHex(PAL.shadow, MARBLE_SHADE.dark, 0.4), z0, ROCK_H)} opacity={0.75} />);
    return els;
  };
  // the wing on the eye's far side first
  const left = wing(Q.X - Q.W / 2 - Q.wingW - 120, "wl");
  const right = wing(Q.X + Q.W / 2 + 120, "wr");
  return (
    <g>
      {c.x > Q.X ? left : right}
      <MiniTemple A={A} c={c} X={Q.X} Z={Q.Z} W={Q.W} L={Q.L} colR={Q.colR} colS={Q.colS} n={6} colH={Q.colH} ent={Q.ent} ped={Q.ped} step={Q.step} Y={Y} uid={`${uid}h`} />
      {c.x > Q.X ? right : left}
    </g>
  );
};
/** a small house: lime-plastered walls (the lit side and the shade side), a door and a window, a low tiled roof
 *  (ridge along X), the gable on the side the eye sees */
const House: React.FC<{ A: AirWorld; c: Cam3; h: (typeof HOUSES)[number] }> = ({ A, c, h }) => {
  const P = A.P;
  const E = eyeOf(c);
  const w = A.lw(1);
  const X0 = h.X - h.W / 2;
  const X1 = h.X + h.W / 2;
  const Z0 = h.Z - h.D / 2;
  const Z1 = h.Z + h.D / 2;
  const yW = -h.H;
  const yR = -h.H - h.roof;
  const zc = h.Z;
  const els: React.ReactNode[] = [];
  els.push(<AirShadow key="sh" A={A} X={h.X} Z={h.Z} w={h.W * 0.62} d={h.D * 0.6} uid={`hs${h.seed}`} amt={0.55} />);
  els.push(<Box3 key="b" A={A} X0={X0} X1={X1} Y0={yW} Y1={0} Z0={Z0} Z1={Z1} mat={PLASTER} uid={`h${h.seed}`} rim={0.5} skip={["tp"]} />);
  const op = (xa: number, xb: number, ya: number, yb: number, key: string) => {
    const a = P.p(xa, ya, Z0 - 2);
    const b = P.p(xb, yb, Z0 - 2);
    els.push(<path key={key} d={`M${a[0]},${a[1]}L${b[0]},${a[1]}L${b[0]},${b[1]}L${a[0]},${b[1]}Z`} fill={A.tone(mixHex(PAL.shadow, PLASTER.dark, 0.3), Z0, h.H / 2)} opacity={0.8} />);
  };
  const dx = (hash(h.seed, 1) - 0.5) * h.W * 0.3;
  op(h.X + dx - h.W * 0.09, h.X + dx + h.W * 0.09, -h.H * 0.62, 0, "door");
  op(h.X + dx + h.W * (dx > 0 ? -0.36 : 0.2), h.X + dx + h.W * (dx > 0 ? -0.22 : 0.34), -h.H * 0.72, -h.H * 0.5, "win");
  // the roof: two slopes (front and back) and the gables where seen
  const inside: V3 = [h.X, yW + 20, zc];
  const fr: V3[] = [[X0 - 25, yW, Z0 - 25], [X1 + 25, yW, Z0 - 25], [X1 + 25, yR, zc], [X0 - 25, yR, zc]];
  const bk: V3[] = [[X1 + 25, yW, Z1 + 25], [X0 - 25, yW, Z1 + 25], [X0 - 25, yR, zc], [X1 + 25, yR, zc]];
  for (const [q, key] of [[bk, "rb"], [fr, "rf"]] as [V3[], string][]) {
    const f = seenFrom(E, q, inside);
    if (!f.seen) continue;
    const ndl = f.out[0] * LIGHT[0] - f.out[1] * LIGHT[1] + f.out[2] * LIGHT[2];
    const col = A.tone(shadeOf(ROOF_TILE, ndl + 0.15), h.Z, h.H);
    els.push(<path key={key} d={poly(q.map((v) => P.p(v[0], v[1], v[2])))} fill={col} stroke={col} strokeWidth={w} strokeLinejoin="round" />);
  }
  for (const [xg, key] of [[X0, "gl"], [X1, "gr"]] as [number, string][]) {
    const tri: V3[] = [[xg, yW, Z0], [xg, yW, Z1], [xg, yR, zc], [xg, yR, zc]];
    const f = seenFrom(E, tri, inside);
    if (!f.seen) continue;
    const ndl = f.out[0] * LIGHT[0] - f.out[1] * LIGHT[1] + f.out[2] * LIGHT[2];
    const col = A.tone(shadeOf(PLASTER, ndl), h.Z, h.H);
    els.push(<path key={key} d={poly([tri[0], tri[1], tri[2]].map((v) => P.p(v[0], v[1], v[2])))} fill={col} stroke={col} strokeWidth={w} strokeLinejoin="round" />);
  }
  const rp = [P.p(X0 - 25, yR, zc), P.p(X1 + 25, yR, zc)];
  els.push(<path key="ridge" d={`M${Pt(rp[0])}L${Pt(rp[1])}`} stroke={PAL.cream} strokeWidth={w * 1.1} strokeOpacity={0.3 * (1 - A.fog(h.Z))} strokeLinecap="round" />);
  return <g>{els}</g>;
};
/** an olive tree: a short twisted trunk and a soft grey-green crown of three or four lobes, lit at the upper left */
const OliveTree: React.FC<{ A: AirWorld; o: (typeof OLIVES)[number] }> = ({ A, o }) => {
  const P = A.P;
  const [bx, by] = P.p(o.X, o.Y, o.Z);
  const r = o.r * P.r(o.Z);
  const fz = A.fog(o.Z);
  const t = (hex: string) => A.tone(hex, o.Z, -o.Y + o.r * 1.5);
  const th = r * 1.15;
  const lean = (hash(o.seed, 1) - 0.5) * r * 0.5;
  const lobes = [0, 1, 2, 3].map((k) => ({ x: bx + lean + (k - 1.5) * r * 0.55 + (hash(o.seed, 10 + k) - 0.5) * r * 0.3, y: by - th - r * (0.45 + 0.35 * hash(o.seed, 20 + k)), rr: r * (0.5 + 0.18 * hash(o.seed, 30 + k)) }));
  return (
    <g>
      <ellipse cx={bx + r * 0.35} cy={by + r * 0.05} rx={r * 1.2} ry={r * 0.32} fill={PAL.shadow} opacity={0.32 * (1 - fz)} />
      <path d={`M${bx - r * 0.13},${by} C${bx - r * 0.2},${by - th * 0.4} ${bx + lean * 0.4 + r * 0.12},${by - th * 0.6} ${bx + lean},${by - th} L${bx + lean + r * 0.12},${by - th} C${bx + lean * 0.4 + r * 0.24},${by - th * 0.55} ${bx + r * 0.05},${by - th * 0.35} ${bx + r * 0.13},${by} Z`} fill={t(OLIVE_WOOD)} />
      {lobes.map((l, k) => (
        <ellipse key={`d${k}`} cx={l.x} cy={l.y} rx={l.rr * 1.1} ry={l.rr * 0.82} fill={t(OLIVE_LEAF.mid)} />
      ))}
      {lobes.map((l, k) => (
        <ellipse key={`s${k}`} cx={l.x + l.rr * 0.25} cy={l.y + l.rr * 0.3} rx={l.rr * 0.8} ry={l.rr * 0.45} fill={t(OLIVE_LEAF.dark)} opacity={0.55} />
      ))}
      {lobes.map((l, k) => (
        <ellipse key={`l${k}`} cx={l.x - l.rr * 0.25} cy={l.y - l.rr * 0.25} rx={l.rr * 0.6} ry={l.rr * 0.42} fill={t(OLIVE_LEAF.lit)} opacity={0.7} />
      ))}
    </g>
  );
};

type RockFace = { z: number; el: React.ReactNode };
/** the rock's faces (cliff band and talus band), its plateau and the wall: returned in pieces so the scene can put the
 *  temple between the back walls and the front walls */
const rockParts = (A: AirWorld, c: Cam3, uid: string, detail = true) => {
  const P = A.P;
  const E = eyeOf(c);
  const R = ROCK_RINGS;
  const m = R.top.length;
  const yTop = -ROCK_H;
  const ySh = -ROCK_H * ROCK_SHOULDER;
  const at = (ring: [number, number][], i: number, Y: number): V3 => [ring[(i + m) % m][0], Y, ring[(i + m) % m][1]];
  const pp = (v: V3) => P.p(v[0], v[1], v[2]);
  const w = A.lw(1);
  const faces: RockFace[] = [];
  const centre: V3 = [-1800, -ROCK_H / 2, 4800];
  const facing = (q: V3[]) => {
    const nn = norm3(cross3(sub3(q[1], q[0]), sub3(q[3], q[0])));
    const mid: V3 = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4];
    const out: V3 = dot3(nn, sub3(centre, mid)) > 0 ? [-nn[0], -nn[1], -nn[2]] : nn;
    return { out, mid, seen: dot3(out, sub3(E, mid)) > 0 };
  };
  const ndlOf = (o: V3) => o[0] * LIGHT[0] - o[1] * LIGHT[1] + o[2] * LIGHT[2];
  for (let i = 0; i < m; i++) {
    // the cliff: top -> shoulder
    const qc: V3[] = [at(R.top, i, yTop), at(R.top, i + 1, yTop), at(R.sh, i + 1, ySh), at(R.sh, i, ySh)];
    const fc = facing(qc);
    // the talus: shoulder -> foot
    const qt: V3[] = [at(R.sh, i, ySh), at(R.sh, i + 1, ySh), at(R.foot, i + 1, 0), at(R.foot, i, 0)];
    const ft = facing(qt);
    const mott = (hash(i, 61) - 0.5) * 0.16;
    if (ft.seen) {
      const Zm = ft.mid[2];
      const ndl = ndlOf(ft.out) + mott;
      const base = shadeOf(ROCK, ndl + 0.12);
      const q = qt.map(pp);
      const id = `${uid}t${i}`;
      const ya = Math.min(q[0][1], q[1][1]);
      const yb = Math.max(q[2][1], q[3][1]);
      const fillT = (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={ya.toFixed(2)} x2="0" y2={yb.toFixed(2)}>
          <stop offset="0" stopColor={A.tone(mixHex(base, ROCK.dark, 0.18), Zm, -ySh)} />
          <stop offset="0.5" stopColor={A.tone(mixHex(base, PLATEAU.lit, 0.25), Zm, -ySh / 2)} />
          <stop offset="1" stopColor={A.tone(mixHex(base, MAT.ground.mid, 0.55), Zm, 0)} />
        </linearGradient>
      );
      faces.push({ z: Zm + 1, el: <g key={`t${i}`}><defs>{fillT}</defs><path d={poly(q)} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={w * 1.2} strokeLinejoin="round" /></g> });
    }
    if (fc.seen) {
      const Zm = fc.mid[2];
      const ndl = ndlOf(fc.out) + mott;
      const base = shadeOf(ROCK, ndl);
      const fz = A.fog(Zm);
      const q = qc.map(pp);
      const id = `${uid}c${i}`;
      const ya = Math.min(q[0][1], q[1][1]);
      const yb = Math.max(q[2][1], q[3][1]);
      const extra: React.ReactNode[] = [];
      // revision 1: the circuit wall's ashlar on the upper cliff: a lighter band with its courses and staggered joints
      // (the lines fade where the band is small on screen, so a far view stays tidy)
      {
        const WB = WALL_COURSES.band;
        const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const L = (u: number, t: number) => pp(lerp3(lerp3(qc[0], qc[3], u), lerp3(qc[1], qc[2], u), t));
        const band = [L(0, 0), L(0, 1), L(WB, 1), L(WB, 0)];
        const bandPx = Math.abs(band[3][1] - band[0][1]) * A.k;
        extra.push(<path key="ash" d={poly(band)} fill={A.tone(mixHex(ASHLAR, base, 0.35), Zm, ROCK_H * 0.85)} opacity={0.55} />);
        const la = 0.32 * (1 - fz) * c01((bandPx - 14) / 40);
        if (la > 0.01) {
          const nC = WALL_COURSES.courses;
          const fwid = Math.hypot(qc[1][0] - qc[0][0], qc[1][2] - qc[0][2]);
          let dc = "";
          let dj = "";
          for (let k = 1; k <= nC; k++) {
            const u = (WB * k) / nC;
            const a0 = L(u, 0);
            const a1 = L(u, 1);
            dc += `M${Pt(a0)}L${Pt(a1)}`;
            const nJ = Math.max(1, Math.round(fwid / WALL_COURSES.joint));
            for (let j = 0; j < nJ; j++) {
              const t = (j + (k % 2 ? 0.25 : 0.75) + (hash(i * 31 + k, j) - 0.5) * 0.2) / nJ;
              if (t <= 0.02 || t >= 0.98) continue;
              const b0 = L((WB * (k - 1)) / nC, t);
              const b1 = L(u, t);
              dj += `M${Pt(b0)}L${Pt(b1)}`;
            }
          }
          const lc = A.tone(mixHex(ROCK.dark, PAL.shadow, 0.25), Zm, ROCK_H * 0.85);
          extra.push(<path key="crs" d={dc} fill="none" stroke={lc} strokeWidth={w * 0.9} strokeOpacity={la} strokeLinecap="round" />);
          extra.push(<path key="jnt" d={dj} fill="none" stroke={lc} strokeWidth={w * 0.75} strokeOpacity={la * 0.75} strokeLinecap="round" />);
          // the wall's foot on the living rock: a soft cream lip and a shadow seam
          const f0 = L(WB, 0);
          const f1 = L(WB, 1);
          extra.push(<path key="wft" d={`M${Pt(f0)}L${Pt(f1)}`} stroke={A.tone(mixHex(ROCK.dark, PAL.shadow, 0.35), Zm, ROCK_H * 0.7)} strokeWidth={w * 1.3} strokeOpacity={la * 1.3} strokeLinecap="round" />);
        }
      }
      // broken strata: a seam and a cream lip on some faces only, at a height that wanders face to face (below the wall)
      ROCK_LEDGES.forEach((u0, j) => {
        if (hash(i * 5 + j, 71) < 0.45 || u0 < WALL_COURSES.band + 0.05) return;
        const u = u0 + 0.06 * Math.sin(i * 0.7 + j * 2.1);
        const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const s0 = 0.1 + 0.3 * hash(i * 5 + j, 72);
        const s1 = 0.6 + 0.4 * hash(i * 5 + j, 73);
        const L0 = lerp3(lerp3(qc[0], qc[3], u), lerp3(qc[1], qc[2], u), s0);
        const L1 = lerp3(lerp3(qc[0], qc[3], u + 0.03), lerp3(qc[1], qc[2], u + 0.03), s1);
        const a0 = pp(L0);
        const a1 = pp(L1);
        const lift = 5 / A.k;
        extra.push(<path key={`d${j}`} d={`M${Pt(a0)}L${Pt(a1)}`} stroke={A.tone(mixHex(ROCK.dark, PAL.shadow, 0.35), Zm, -L0[1])} strokeWidth={w * 1.5} strokeOpacity={0.42 * (1 - fz)} strokeLinecap="round" />);
        extra.push(<path key={`c${j}`} d={`M${a0[0]},${a0[1] - lift}L${a1[0]},${a1[1] - lift}`} stroke={PAL.cream} strokeWidth={w * 1.1} strokeOpacity={0.14 * (1 - fz) * c01(ndl + 0.7)} strokeLinecap="round" />);
      });
      // a fissure down from the edge on some joints: a thin dark wedge
      if (hash(i, 74) < 0.38) {
        const t0 = at(R.top, i, yTop);
        const bb = at(R.sh, i, ySh);
        // (revision 1: from the foot of the circuit wall down, never through its masonry)
        const WB = WALL_COURSES.band;
        const tt: V3 = [t0[0] + (bb[0] - t0[0]) * WB, t0[1] + (bb[1] - t0[1]) * WB, t0[2] + (bb[2] - t0[2]) * WB];
        const depth = WB + (0.55 + 0.4 * hash(i, 75)) * (1 - WB);
        const lo: V3 = [t0[0] + (bb[0] - t0[0]) * depth, t0[1] + (bb[1] - t0[1]) * depth, t0[2] + (bb[2] - t0[2]) * depth];
        const a0 = pp(tt);
        const a1 = pp(lo);
        const wd = 3.2 / A.k;
        extra.push(<path key="fs" d={`M${a0[0] - wd},${a0[1]}L${a0[0] + wd},${a0[1]}L${a1[0]},${a1[1]}Z`} fill={A.tone(mixHex(ROCK.dark, PAL.shadow, 0.4), Zm, ROCK_H * 0.7)} opacity={0.55 * (1 - fz)} />);
      }
      faces.push({
        z: Zm,
        el: (
          <g key={`c${i}`}>
            <defs>
              <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={ya.toFixed(2)} x2="0" y2={yb.toFixed(2)}>
                <stop offset="0" stopColor={A.tone(mixHex(base, ROCK.lit, 0.3), Zm, ROCK_H)} />
                <stop offset="0.55" stopColor={A.tone(base, Zm, ROCK_H * 0.7)} />
                <stop offset="1" stopColor={A.tone(mixHex(base, ROCK.dark, 0.3), Zm, -ySh)} />
              </linearGradient>
            </defs>
            <path d={poly(q)} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={w * 1.2} strokeLinejoin="round" />
            {extra}
          </g>
        ),
      });
    }
  }
  faces.sort((a, b) => b.z - a.z);
  // boulders on the talus (in front of its faces)
  const boulders: RockFace[] = [];
  for (const bd of ROCK_BOULDERS) {
    const sh = at(R.sh, bd.i, ySh);
    const ft = at(R.foot, bd.i, 0);
    const X = sh[0] + (ft[0] - sh[0]) * bd.u;
    const Z = sh[2] + (ft[2] - sh[2]) * bd.u;
    const Y = ySh * (1 - bd.u) - bd.r * 0.15;
    const o = facing([at(R.sh, bd.i, ySh), at(R.sh, bd.i + 1, ySh), at(R.foot, bd.i + 1, 0), at(R.foot, bd.i, 0)]);
    if (!o.seen) continue;
    const [bx, by] = P.p(X, Y, Z);
    const r = bd.r * P.r(Z);
    const hgt = r * (0.7 + 0.3 * hash(bd.seed, 4));
    const fz = A.fog(Z);
    boulders.push({
      z: Z,
      el: (
        <g key={`b${bd.seed}`}>
          <ellipse cx={bx + r * 0.3} cy={by + r * 0.08} rx={r * 1.15} ry={r * 0.32} fill={PAL.shadow} opacity={0.3 * (1 - fz)} />
          <path d={`M${bx - r},${by} C${bx - r},${by - hgt * 0.9} ${bx - r * 0.3},${by - hgt * 1.1} ${bx + r * 0.15},${by - hgt} C${bx + r * 0.8},${by - hgt * 0.85} ${bx + r},${by - hgt * 0.3} ${bx + r},${by} Z`} fill={A.tone(mixHex(ROCK.mid, ROCK.lit, 0.25), Z, -Y)} />
          <path d={`M${bx + r * 0.15},${by} C${bx + r * 0.7},${by - hgt * 0.25} ${bx + r * 0.95},${by - hgt * 0.45} ${bx + r},${by} Z`} fill={A.tone(ROCK.dark, Z, -Y)} opacity={0.55} />
          <path d={`M${bx - r * 0.8},${by - hgt * 0.6} C${bx - r * 0.55},${by - hgt * 1.02} ${bx},${by - hgt * 1.05} ${bx + r * 0.45},${by - hgt * 0.85}`} fill="none" stroke={PAL.cream} strokeWidth={Math.max(w, r * 0.08)} strokeOpacity={0.3 * (1 - fz)} strokeLinecap="round" />
        </g>
      ),
    });
  }
  boulders.sort((a, b) => b.z - a.z);
  // the plateau (seen from above), its tone by depth along the screen
  const top = R.top.map(([X, Z]) => P.p(X, yTop, Z));
  const y0 = Math.min(...top.map((v) => v[1]));
  const y1 = Math.max(...top.map((v) => v[1]));
  const plateau =
    c.h > ROCK_H ? (
      <g key="pl">
        <defs>
          <linearGradient id={`${uid}pl`} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
            <stop offset="0" stopColor={A.tone(PLATEAU.mid, 9000, ROCK_H)} />
            <stop offset="1" stopColor={A.tone(mixHex(PLATEAU.lit, PLATEAU.mid, 0.35), 700, ROCK_H)} />
          </linearGradient>
        </defs>
        <path d={poly(top)} fill={`url(#${uid}pl)`} />
      </g>
    ) : null;
  // the citadel wall: segments along the plateau's edge (inset), an outer face where seen, a lit top, a cream rim
  const walls: RockFace[] = [];
  const inset = (i: number): [number, number] => {
    const a = R.top[(i - 1 + m) % m];
    const b = R.top[(i + 1) % m];
    const p = R.top[(i + m) % m];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    return [p[0] - (tz / l) * WALL.inset, p[1] + (tx / l) * WALL.inset];
  };
  const innerOf = (i: number): [number, number] => {
    const a = R.top[(i - 1 + m) % m];
    const b = R.top[(i + 1) % m];
    const p = inset(i);
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    return [p[0] - (tz / l) * WALL.t, p[1] + (tx / l) * WALL.t];
  };
  const yW = yTop - WALL.h;
  for (let i = 0; i < m; i++) {
    const o0 = inset(i);
    const o1 = inset(i + 1);
    const i0 = innerOf(i);
    const i1 = innerOf(i + 1);
    const front: V3[] = [[o0[0], yW, o0[1]], [o1[0], yW, o1[1]], [o1[0], yTop, o1[1]], [o0[0], yTop, o0[1]]];
    const f = facing(front);
    const Zm = (o0[1] + o1[1]) / 2;
    const fz = A.fog(Zm);
    const topQ = [P.p(o0[0], yW, o0[1]), P.p(o1[0], yW, o1[1]), P.p(i1[0], yW, i1[1]), P.p(i0[0], yW, i0[1])];
    const els: React.ReactNode[] = [];
    // the inner face (seen across the plateau on the far walls)
    const inner: V3[] = [[i0[0], yW, i0[1]], [i1[0], yW, i1[1]], [i1[0], yTop, i1[1]], [i0[0], yTop, i0[1]]];
    const fi = facing(inner);
    if (!fi.seen) els.push(<path key="in" d={poly(inner.map(pp))} fill={A.tone(mixHex(WALL_STONE.mid, WALL_STONE.dark, 0.3), Zm, ROCK_H)} stroke={A.tone(mixHex(WALL_STONE.mid, WALL_STONE.dark, 0.3), Zm, ROCK_H)} strokeWidth={w} />);
    if (f.seen) {
      const ndl = ndlOf(f.out);
      const col = A.tone(shadeOf(WALL_STONE, ndl), Zm, ROCK_H + WALL.h / 2);
      els.push(<path key="fr" d={poly(front.map(pp))} fill={col} stroke={col} strokeWidth={w} strokeLinejoin="round" />);
      // the coursing: one faint joint halfway up
      const ja = P.p(o0[0], yTop - WALL.h * 0.5, o0[1]);
      const jb = P.p(o1[0], yTop - WALL.h * 0.5, o1[1]);
      els.push(<path key="jt" d={`M${Pt(ja)}L${Pt(jb)}`} stroke={A.tone(WALL_STONE.dark, Zm, ROCK_H)} strokeWidth={w * 0.8} strokeOpacity={0.3 * (1 - fz)} />);
    }
    const tcol = A.tone(WALL_STONE.lit, Zm, ROCK_H + WALL.h);
    els.push(<path key="tp" d={poly(topQ)} fill={tcol} stroke={tcol} strokeWidth={w} strokeLinejoin="round" />);
    if (f.seen) els.push(<path key="rm" d={`M${Pt(topQ[0])}L${Pt(topQ[1])}`} stroke={PAL.cream} strokeWidth={w * 1.3} strokeOpacity={0.5 * (1 - fz)} strokeLinecap="round" />);
    walls.push({ z: Zm, el: <g key={`w${i}`}>{els}</g> });
  }
  walls.sort((a, b) => b.z - a.z);
  // the Parthenon's terrace: a low rise of the rock under the temple
  const T = TEMPLE;
  const terrace = (
    <Box3 key="ter" A={A} X0={T.X - T.W / 2 - 300} X1={T.X + T.W / 2 + 300} Y0={yTop - TEMPLE_LIFT} Y1={yTop} Z0={T.Z - 260} Z1={T.Z + T.L + 300} mat={PLATEAU} uid={`${uid}ter`} rim={0.5} />
  );
  const frontWallZ = T.Z - 100;
  // revision 1: on the plateau, far to near: terrace walls, the Erechtheion, the sacred olive
  const plateauItems: RockFace[] = [
    ...TERRACES.map((tw, k) => ({ z: (tw.a[1] + tw.b[1]) / 2, el: <LowWall key={`tw${k}`} A={A} c={c} a={tw.a} b={tw.b} Y={yTop} h={TERRACE_WALL.h} t={TERRACE_WALL.t} mat={WALL_STONE} /> })),
    {
      z: ERECHTHEION.Z + ERECHTHEION.L / 2,
      el: <MiniTemple key="er" A={A} c={c} X={ERECHTHEION.X} Z={ERECHTHEION.Z} W={ERECHTHEION.W} L={ERECHTHEION.L} colR={ERECHTHEION.colR} colS={ERECHTHEION.colS} n={6} colH={ERECHTHEION.colH} ent={ERECHTHEION.ent} ped={ERECHTHEION.ped} step={ERECHTHEION.step} Y={yTop} uid={`${uid}er`} />,
    },
    ...OLIVES.filter((o) => o.Y < 0).map((o) => ({ z: o.Z, el: <OliveTree key={`po${o.seed}`} A={A} o={o} /> })),
  ].sort((a, b) => b.z - a.z);
  return {
    body: (
      <g>
        {faces.map((f) => f.el)}
        {detail ? <Ramp A={A} c={c} /> : null}
        {boulders.map((b) => b.el)}
        {plateau}
        {walls.filter((q) => q.z >= frontWallZ).map((q) => q.el)}
        {detail ? plateauItems.map((q) => q.el) : null}
        {terrace}
      </g>
    ),
    front: <g>{walls.filter((q) => q.z < frontWallZ).map((q) => q.el)}</g>,
  };
};
/** the rock (faces, talus, plateau, the back walls and the terrace) and the front walls, with the temple between */
export const Acropolis: React.FC<{ A: AirWorld; c: Cam3; uid: string; temple?: boolean; detail?: boolean }> = ({ A, c, uid, temple = true, detail = true }) => {
  const parts = rockParts(A, c, uid, detail);
  // revision 1: at the foot, behind the crowd line: houses and olives, far to near
  const foot: RockFace[] = detail
    ? [...HOUSES.map((h) => ({ z: h.Z, el: <House key={`hs${h.seed}`} A={A} c={c} h={h} /> })), ...OLIVES.filter((o) => o.Y === 0).map((o) => ({ z: o.Z, el: <OliveTree key={`fo${o.seed}`} A={A} o={o} /> }))].sort((a, b) => b.z - a.z)
    : [];
  return (
    <g>
      {parts.body}
      {temple ? <Parthenon A={A} c={c} uid={`${uid}pt`} detail={detail} /> : null}
      {detail ? <Propylaea A={A} c={c} uid={`${uid}pr`} /> : null}
      {parts.front}
      {foot.map((f) => f.el)}
    </g>
  );
};

// ===================================================================================================================
// THE PARTHENON
// ===================================================================================================================
/** an air-lit box in this world (the kit's AirBox face rules, marble, with the rim) */
/** skip: faces that another volume covers on every frame (stacked boxes: their tops and undersides), so a hidden face
 *  is never painted over a nearer one */
type BoxFace = "bt" | "tp" | "lf" | "rt";
const Box3: React.FC<{ A: AirWorld; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat; uid: string; rim?: number; frontTone?: string; skip?: BoxFace[] }> = ({ A, X0, X1, Y0, Y1, Z0, Z1, mat, uid, rim = 1, frontTone, skip = [] }) => {
  const P = A.P;
  const p = P.p;
  const w = A.lw(1);
  const Zm = (Z0 + Z1) / 2;
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string, Z = Zm) => A.tone(hex, Z, h);
  const ln = t(lineOf(mat));
  const fz = A.fog(Zm);
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, key: string) => els.push(<path key={key} d={poly(q)} fill={fill} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
  const shadeDark = mixHex(mat.dark, PAL.shadow, 0.2);
  if (Y1 < P.horizonY && !skip.includes("bt")) face([p(X0, Y1, Z0), p(X1, Y1, Z0), p(X1, Y1, Z1), p(X0, Y1, Z1)], t(mixHex(mat.mid, shadeDark, 0.55)), "bt");
  if (X0 > vx && !skip.includes("lf")) face([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], t(mixHex(mat.lit, mat.mid, 0.35)), "lf");
  if (X1 < vx && !skip.includes("rt")) face([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)], t(mixHex(mat.mid, shadeDark, 0.45)), "rt");
  const topSeen = Y0 > P.horizonY && !skip.includes("tp");
  if (topSeen) face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], t(mat.lit), "tp");
  face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)], frontTone ?? t(mat.mid, Z0), "fr");
  const ra = (1 - fz) * 0.55 * rim;
  if (ra > 0.01) {
    let d = `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X1, Y0, Z0))}`;
    if (topSeen) d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y0, Z1))}`;
    els.push(<path key="rim" d={d} fill="none" stroke={PAL.cream} strokeWidth={w * 1.2} strokeOpacity={ra} strokeLinecap="round" />);
  }
  void uid;
  return <g>{els}</g>;
};
export const Parthenon: React.FC<{ A: AirWorld; c: Cam3; uid: string; detail?: boolean }> = ({ A, c, uid, detail = true }) => {
  const P = A.P;
  const T = TEMPLE;
  const yBase = -ROCK_H - TEMPLE_LIFT;
  const yStylo = yBase - 3 * T.step;
  const yCap = yStylo - T.colH;
  const yEnt = yCap - T.ent;
  const yApex = yEnt - T.ped;
  const hw = T.W / 2;
  const w = A.lw(1);
  const E = eyeOf(c);
  const els: React.ReactNode[] = [];
  // the steps (bottom first)
  for (let k = 0; k < 3; k++) {
    const o = (2 - k) * T.stepD;
    els.push(<Box3 key={`st${k}`} A={A} X0={T.X - hw - o} X1={T.X + hw + o} Y0={yBase - (k + 1) * T.step} Y1={yBase - k * T.step} Z0={T.Z - o} Z1={T.Z + T.L + o} mat={MARBLE} uid={`${uid}st${k}`} rim={0.8} />);
  }
  // the cella and the pronaos behind the columns: in the peristyle's shade (dark marble), so the columns read
  els.push(
    <Box3 key="cella" A={A} X0={T.X - hw + T.cellaInX} X1={T.X + hw - T.cellaInX} Y0={yCap} Y1={yStylo} Z0={T.Z + T.cellaInZ} Z1={T.Z + T.L - T.cellaInZ} mat={MARBLE_SHADE} uid={`${uid}ce`} rim={0} frontTone={A.tone(mixHex(MARBLE_SHADE.dark, PAL.shadow, 0.25), T.Z + T.cellaInZ, -yCap)} />,
  );
  // revision 1: the great door in the pronaos wall (seen between the middle columns)
  if (detail) {
    const zc = T.Z + T.cellaInZ - 2;
    const a = P.p(T.X - 230, yStylo - T.colH * 0.72, zc);
    const b = P.p(T.X + 230, yStylo, zc);
    const ft = A.lw(0.9);
    els.push(<path key="door" d={`M${a[0]},${a[1]}L${b[0]},${a[1]}L${b[0]},${b[1]}L${a[0]},${b[1]}Z`} fill={A.tone(mixHex(PAL.shadow, MARBLE_SHADE.dark, 0.3), zc, -yStylo)} stroke={A.tone(MARBLE_SHADE.lit, zc, -yStylo)} strokeWidth={ft * 2} strokeOpacity={0.35} />);
  }
  const colEl = (X: number, Z: number, key: string) => (
    <g key={key}>
      <AirCyl A={A} X={X} Z={Z} R={T.colR} Y0={yCap + 40} Y1={yStylo} mat={MARBLE} uid={`${uid}${key}`} joints={[yStylo - 260, yStylo - 520, yStylo - 780]} flutes={7} lw={w} />
      {/* echinus + abacus: the Doric capital */}
      <Box3 A={A} X0={X - T.colR * 1.32} X1={X + T.colR * 1.32} Y0={yCap} Y1={yCap + 42} Z0={Z - T.colR * 1.32} Z1={Z + T.colR * 1.32} mat={MARBLE} uid={`${uid}${key}c`} rim={0.6} />
    </g>
  );
  // the flank colonnade on the side the eye sees (far to near), then the front row
  // (the eye's side: seen beside the cella, or through the front row's gaps when the eye is between the flanks)
  const side: 1 | -1 = c.x >= T.X ? 1 : -1;
  COL_FLANK(side).slice(1).reverse().forEach(([X, Z], j) => els.push(colEl(X, Z, `fl${j}`)));
  COL_FRONT.forEach(([X, Z], j) => els.push(colEl(X, Z, `fc${j}`)));
  // the entablature (architrave + frieze + cornice)
  const e0 = T.Z + 30;
  const e1 = T.Z + T.L - 30;
  // the architrave and the frieze: their tops and undersides are covered by the volumes above and below them
  els.push(<Box3 key="arch" A={A} X0={T.X - hw + 20} X1={T.X + hw - 20} Y0={yCap - T.ent * 0.42} Y1={yCap} Z0={e0 + 10} Z1={e1 - 10} mat={MARBLE} uid={`${uid}ar`} rim={0.5} skip={["tp"]} />);
  els.push(<Box3 key="frieze" A={A} X0={T.X - hw + 10} X1={T.X + hw - 10} Y0={yEnt + T.ent * 0.14} Y1={yCap - T.ent * 0.42} Z0={e0} Z1={e1} mat={MARBLE} uid={`${uid}fr`} rim={0.4} skip={["tp", "bt"]} />);
  // the triglyphs on the frieze's front: two per bay, a darker narrow panel each
  {
    const ya = yEnt + T.ent * 0.14;
    const yb = yCap - T.ent * 0.42;
    let d = "";
    const n = 8 * 2 - 1;
    for (let i = 0; i < n + 1; i++) {
      const X = T.X - 3.5 * T.colS + (i * 7 * T.colS) / n;
      const a = P.p(X - 26, ya, e0 - 1);
      const b = P.p(X + 26, yb, e0 - 1);
      d += `M${a[0]},${a[1]}L${b[0]},${a[1]}L${b[0]},${b[1]}L${a[0]},${b[1]}Z`;
    }
    els.push(<path key="trig" d={d} fill={A.tone(MARBLE_SHADE.mid, T.Z, -yCap)} opacity={0.8} />);
  }
  // the cornice: its underside only where it overhangs the frieze (front and the seen flank), seen from below
  {
    const yb = yEnt + T.ent * 0.14;
    if (yb < P.horizonY) {
      const ov = (q: [number, number][], key: string) => els.push(<path key={key} d={poly(q.map(([X, Z]) => P.p(X, yb, Z)))} fill={A.tone(mixHex(MARBLE_SHADE.mid, MARBLE_SHADE.dark, 0.3), T.Z, -yb)} stroke={A.tone(lineOf(MARBLE), T.Z, -yb)} strokeWidth={w} strokeLinejoin="round" />);
      ov([[T.X - hw - 20, e0 - 25], [T.X + hw + 20, e0 - 25], [T.X + hw + 20, e0], [T.X - hw - 20, e0]], "covF");
      if (c.x > T.X + hw + 20) ov([[T.X + hw - 10, e0], [T.X + hw + 20, e0], [T.X + hw + 20, e1 + 25], [T.X + hw - 10, e1 + 25]], "covR");
    }
  }
  els.push(<Box3 key="corn" A={A} X0={T.X - hw - 20} X1={T.X + hw + 20} Y0={yEnt} Y1={yEnt + T.ent * 0.14} Z0={e0 - 25} Z1={e1 + 25} mat={MARBLE} uid={`${uid}co`} rim={1} skip={["bt"]} />);
  // the roof's slopes (only where the eye sees them) and the pediment
  const zf = e0 - 25;
  const zb = e1 + 25;
  const eaveL: V3 = [T.X - hw - 20, yEnt, zf];
  const eaveR: V3 = [T.X + hw + 20, yEnt, zf];
  const apex: V3 = [T.X, yApex, zf];
  const slope = (a: V3, key: string, toneHex: string) => {
    const quad: V3[] = [a, apex, [apex[0], apex[1], zb], [a[0], a[1], zb]];
    const nn = norm3(cross3(sub3(quad[1], quad[0]), sub3(quad[3], quad[0])));
    const mid: V3 = [(a[0] + apex[0]) / 2, (a[1] + apex[1]) / 2, (zf + zb) / 2];
    const outward: V3 = nn[1] < 0 ? nn : [-nn[0], -nn[1], -nn[2]];
    if (dot3(outward, sub3(E, mid)) <= 0) return null;
    // revision 1: the cover-tile rows along the slope and the ridge's lit line
    let rows = "";
    for (const t of [0.34, 0.67]) {
      const r0: V3 = [a[0] + (apex[0] - a[0]) * t, a[1] + (apex[1] - a[1]) * t, zf];
      rows += `M${Pt(P.p(r0[0], r0[1], zf))}L${Pt(P.p(r0[0], r0[1], zb))}`;
    }
    return (
      <g key={key}>
        <path d={poly(quad.map((v) => P.p(v[0], v[1], v[2])))} fill={A.tone(toneHex, mid[2], -mid[1])} stroke={A.tone(lineOf(MARBLE), mid[2], -mid[1])} strokeWidth={w} strokeLinejoin="round" />
        <path d={rows} stroke={A.tone(MARBLE_SHADE.mid, mid[2], -mid[1])} strokeWidth={w * 0.9} strokeOpacity={0.35} />
        <path d={`M${Pt(P.p(apex[0], apex[1], zf))}L${Pt(P.p(apex[0], apex[1], zb))}`} stroke={PAL.cream} strokeWidth={w * 1.2} strokeOpacity={0.4 * (1 - A.fog(mid[2]))} />
      </g>
    );
  };
  els.push(slope(eaveL, "roofL", MARBLE.lit));
  els.push(slope(eaveR, "roofR", MARBLE_SHADE.mid));
  const pf = [P.p(eaveL[0], eaveL[1], zf), P.p(apex[0], apex[1], zf), P.p(eaveR[0], eaveR[1], zf)];
  const inset = 0.12;
  const pin = [
    P.p(T.X - (hw + 20) * (1 - inset * 1.6), yEnt - 22, zf + 30),
    P.p(T.X, yApex + T.ped * inset * 1.4, zf + 30),
    P.p(T.X + (hw + 20) * (1 - inset * 1.6), yEnt - 22, zf + 30),
  ];
  els.push(<path key="ped" d={poly(pf)} fill={A.tone(MARBLE.mid, zf, -yEnt)} stroke={A.tone(lineOf(MARBLE), zf, -yEnt)} strokeWidth={w} strokeLinejoin="round" />);
  els.push(<path key="tymp" d={poly(pin)} fill={A.tone(mixHex(MARBLE.mid, MARBLE_SHADE.mid, 0.6), zf, -yEnt)} />);
  if (detail) {
    const fzz = 1 - A.fog(zf);
    // the pediment's sculpture: a row of figures under the raking cornice (tallest in the middle, reclining at the
    // corners), lighter marble with a soft shade at the right
    const N = 11;
    const base = yEnt - 26;
    const span = (hw + 20) * (1 - inset * 1.6) * 0.9;
    const tym = mixHex(MARBLE.mid, MARBLE_SHADE.mid, 0.6);
    const fillF = A.tone(mixHex(tym, MARBLE.lit, 0.42), zf, -yEnt);
    const shadeF = A.tone(mixHex(tym, MARBLE_SHADE.dark, 0.3), zf, -yEnt);
    const fig: React.ReactNode[] = [];
    const sp = (X: number, Y: number) => P.p(X, Y, zf + 34);
    for (let k = 0; k < N; k++) {
      const u = (k - (N - 1) / 2) / ((N - 1) / 2);
      const Xk = T.X + u * span;
      const room = (T.ped * (1 - inset * 1.4) - 30) * (1 - Math.abs(u));
      const side = u < 0 ? -1 : 1;
      const headR = 21;
      const shapes: string[] = [];
      if (Math.abs(u) < 0.35) {
        // standing: a robe tapering to the shoulders, a head
        const hb = room - headR * 2.4;
        const [a0, a1, a2, a3] = [sp(Xk - 30, base), sp(Xk + 30, base), sp(Xk + 30, base - hb), sp(Xk - 30, base - hb)];
        shapes.push(`M${Pt(a0)}L${Pt(a1)}L${Pt(a2)}L${Pt(a3)}Z`);
        const hc = sp(Xk, base - hb - headR * 1.05);
        shapes.push(`M${hc[0] - headR * P.r(zf)},${hc[1]}a${headR * P.r(zf)},${headR * P.r(zf)} 0 1 0 ${2 * headR * P.r(zf)},0a${headR * P.r(zf)},${headR * P.r(zf)} 0 1 0 ${-2 * headR * P.r(zf)},0Z`);
      } else if (Math.abs(u) < 0.7) {
        // kneeling / seated: a lower mound leaning toward the middle, a head
        const hb = Math.max(30, room - headR * 2.4);
        const lean = -side * 18;
        const [a0, a1, a2, a3] = [sp(Xk - 40, base), sp(Xk + 40, base), sp(Xk + 28 + lean, base - hb), sp(Xk - 28 + lean, base - hb)];
        shapes.push(`M${Pt(a0)}L${Pt(a1)}L${Pt(a2)}L${Pt(a3)}Z`);
        const hc = sp(Xk + lean, base - hb - headR);
        const rr = headR * P.r(zf);
        shapes.push(`M${hc[0] - rr},${hc[1]}a${rr},${rr} 0 1 0 ${2 * rr},0a${rr},${rr} 0 1 0 ${-2 * rr},0Z`);
      } else {
        // reclining toward the corner: a long low body, the head raised toward the middle
        const len = 150;
        const hgt = Math.max(16, Math.min(34, room * 0.8));
        const x0 = Xk - side * len * 0.5;
        const x1 = Xk + side * len * 0.5;
        const [a0, a1, a2, a3] = [sp(x0, base), sp(x1, base), sp(x1, base - hgt * 0.45), sp(x0, base - hgt)];
        shapes.push(`M${Pt(a0)}L${Pt(a1)}L${Pt(a2)}L${Pt(a3)}Z`);
        const hc = sp(x0 + side * 6, base - hgt - headR * 0.6);
        const rr = headR * 0.85 * P.r(zf);
        shapes.push(`M${hc[0] - rr},${hc[1]}a${rr},${rr} 0 1 0 ${2 * rr},0a${rr},${rr} 0 1 0 ${-2 * rr},0Z`);
      }
      const d = shapes.join("");
      fig.push(<path key={`s${k}`} d={d} fill={shadeF} opacity={0.5} transform={`translate(${(6 * P.r(zf)).toFixed(2)} 0)`} />);
      fig.push(<path key={`f${k}`} d={d} fill={fillF} />);
    }
    els.push(<g key="sculpt">{fig}</g>);
    // the taenia (the architrave's crowning band) and the mutules' shadow under the cornice, front
    const ta = [P.p(T.X - hw + 20, yCap - T.ent * 0.42, e0 + 9), P.p(T.X + hw - 20, yCap - T.ent * 0.42, e0 + 9)];
    const mu = [P.p(T.X - hw - 20, yEnt + T.ent * 0.14, e0 - 26), P.p(T.X + hw + 20, yEnt + T.ent * 0.14, e0 - 26)];
    const dk = A.tone(mixHex(MARBLE_SHADE.dark, PAL.shadow, 0.2), T.Z, -yCap);
    els.push(<path key="taen" d={`M${Pt(ta[0])}L${Pt(ta[1])}`} stroke={dk} strokeWidth={w * 1.2} strokeOpacity={0.45 * fzz} />);
    els.push(<path key="mut" d={`M${Pt(mu[0])}L${Pt(mu[1])}`} stroke={dk} strokeWidth={w * 1.6} strokeOpacity={0.4 * fzz} />);
    // acroteria: a palmette at the apex and a griffin-ish knob at each corner (small, lit)
    const acro = (v: P2, r: number, key: string) => els.push(<path key={key} d={`M${v[0] - r * 0.7},${v[1]} Q${v[0] - r * 0.8},${v[1] - r * 1.6} ${v[0]},${v[1] - r * 2} Q${v[0] + r * 0.8},${v[1] - r * 1.6} ${v[0] + r * 0.7},${v[1]} Z`} fill={A.tone(MARBLE.mid, zf, -yApex)} />);
    const rA = 26 * P.r(zf);
    acro(pf[1], rA * 1.2, "acA");
    acro(pf[0], rA, "acL");
    acro(pf[2], rA, "acR");
  }
  els.push(<path key="pedRim" d={`M${Pt(pf[0])}L${Pt(pf[1])}`} fill="none" stroke={PAL.cream} strokeWidth={w * 1.4} strokeOpacity={0.6 * (1 - A.fog(zf))} strokeLinecap="round" />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE COLOSSEUM: an elliptical drum in the haze (four storeys: three arcades and the attic), its front half
// ===================================================================================================================
export const Colosseum: React.FC<{ A: AirWorld; c: Cam3; uid: string }> = ({ A, c, uid }) => {
  const P = A.P;
  const C = COLOSSEUM;
  const q0 = project(c, C.X, 0, C.Z - C.rz);
  if (!q0) return null;
  const xl = 540 + (C.X - C.rx * 1.05 - c.x) * q0.s;
  const xr = 540 + (C.X + C.rx * 1.05 - c.x) * (c.F / (C.Z - c.z));
  if (xr < -40 || xl > 1120) return null;
  const ring = (Y: number, th: number): P2 => P.p(C.X + C.rx * Math.cos(th), Y, C.Z + C.rz * Math.sin(th));
  const N = 64;
  const ths = Array.from({ length: N + 1 }, (_, i) => Math.PI + (Math.PI * i) / N);
  const wall = [...ths.map((t) => ring(-C.H, t)), ...ths.slice().reverse().map((t) => ring(0, t))];
  const Zm = C.Z - C.rz * 0.6;
  const fz = A.fog(Zm);
  const h = C.H / 2;
  const els: React.ReactNode[] = [];
  const xa = Math.min(...wall.map((v) => v[0]));
  const xb = Math.max(...wall.map((v) => v[0]));
  els.push(
    <defs key="d">
      <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={xa} y1="0" x2={xb} y2="0">
        <stop offset="0" stopColor={A.tone(TRAVERTINE.mid, Zm, h)} />
        <stop offset="0.3" stopColor={A.tone(TRAVERTINE.lit, Zm, h)} />
        <stop offset="0.75" stopColor={A.tone(TRAVERTINE.mid, Zm, h)} />
        <stop offset="1" stopColor={A.tone(mixHex(TRAVERTINE.dark, PAL.shadow, 0.2), Zm, h)} />
      </linearGradient>
    </defs>,
  );
  // grounded: a soft shadow on the plain round its foot
  {
    const fc = P.p(C.X + C.rx * 0.1, 0, C.Z - C.rz * 0.85);
    const rxs = C.rx * 1.35 * P.r(C.Z - C.rz * 0.85);
    const ys0 = P.p(C.X, 0, C.Z - C.rz * 1.25)[1];
    const ys1 = P.p(C.X, 0, C.Z - C.rz * 0.45)[1];
    els.push(
      <g key="sh">
        <defs>
          <radialGradient id={`${uid}s`}>
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.45 * (1 - fz)} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={fc[0]} cy={(ys0 + ys1) / 2} rx={rxs} ry={Math.max(1, Math.abs(ys0 - ys1) / 2)} fill={`url(#${uid}s)`} />
      </g>,
    );
  }
  els.push(<path key="w" d={poly(wall)} fill={`url(#${uid}g)`} stroke={A.tone(lineOf(TRAVERTINE), Zm, h)} strokeWidth={A.lw(1)} />);
  // the arcades: three storeys of arches, then the attic's small windows; cornices between storeys
  const storeys = [0, 0.26, 0.52, 0.78, 1];
  let arches = "";
  let cornice = "";
  for (let s = 0; s < 4; s++) {
    const y0 = -C.H * storeys[s];
    const y1 = -C.H * storeys[s + 1];
    const nA = 40;
    for (let j = 0; j < nA; j++) {
      const t = Math.PI + (Math.PI * (j + 0.5)) / nA;
      const dt = (Math.PI / nA) * (s === 3 ? 0.22 : 0.3);
      const ya = s === 3 ? y0 + (y1 - y0) * 0.35 : y0 + (y1 - y0) * 0.12;
      const yb = s === 3 ? y0 + (y1 - y0) * 0.6 : y0 + (y1 - y0) * 0.82;
      const a = ring(ya, t - dt);
      const b = ring(ya, t + dt);
      const cc = ring(yb, t + dt);
      const d = ring(yb, t - dt);
      if (s === 3) arches += `M${Pt(a)}L${Pt(b)}L${Pt(cc)}L${Pt(d)}Z`;
      else {
        const top = ring(yb - (yb - ya) * 0.16, t);
        arches += `M${Pt(a)}L${Pt(b)}L${Pt(cc)}Q${Pt(top)} ${Pt(d)}Z`;
      }
    }
    cornice += `M${ths.map((t) => Pt(ring(y1 + 30, t))).join("L")}`;
  }
  els.push(<path key="a" d={arches} fill={A.tone(mixHex(TRAVERTINE.dark, PAL.shadow, 0.4), Zm, h)} />);
  els.push(<path key="c" d={cornice} fill="none" stroke={PAL.cream} strokeWidth={A.lw(1.2)} strokeOpacity={0.3 * (1 - fz)} />);
  els.push(<path key="tr" d={`M${ths.map((t) => Pt(ring(-C.H, t))).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={A.lw(1.5)} strokeOpacity={0.45 * (1 - fz)} />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE CROWDS (sprites on a canvas, far to near, contact shadows in perspective, the medium's veils by depth band)
// ===================================================================================================================
/** the Athenian head-turners' alternative drawing (greekFolk's crowd drawing i with the head turned) */
const toSpriteShapes = (shapes: GShape[]): Shape[] =>
  shapes.map((s) => {
    if (s.gfill) return { d: s.d, fill: s.fill, sh: 0, op: s.op };
    if (s.glow !== undefined) return { d: s.d, fill: s.fill, det: 2.6, keep: true, op: s.op ?? 1 };
    return s;
  });
/** GREEK_CROWD 0..7's kind, variant and pose (greekFolk.tsx; copied so the head can turn) */
const CITIZEN_DEFS: { v: number; pose: () => GF.FigPose }[] = [
  { v: 0, pose: () => GF.POSES.front() },
  { v: 1, pose: () => GF.POSES.stand(1) },
  { v: 2, pose: () => GF.POSES.stand(-1) },
  { v: 3, pose: () => GF.POSES.front() },
  { v: 4, pose: () => GF.POSES.stand(1) },
  { v: 5, pose: () => GF.POSES.stand(-1) },
  { v: 0, pose: () => GF.POSES.stand(-1) },
  { v: 3, pose: () => GF.POSES.stand(1) },
];
const ALT_CACHE = new Map<number, Shape[]>();
const altShapes = (i: number) => {
  let s = ALT_CACHE.get(i);
  if (!s) {
    const d = CITIZEN_DEFS[i];
    const pose = GF.headTurn(d.pose(), ALT_HEAD_YAW[i]);
    const q = GF.solveGreekPose("citizen", pose, [0, 0], 1, { variant: d.v });
    s = toSpriteShapes(buildGreekFolk("citizen", d.v, q, {}).shapes);
    ALT_CACHE.set(i, s);
  }
  return s;
};
const altReq = (i: number, tier: number): GF.SpriteReq => ({ key: `athensAlt|${i}|${tier}`, shapes: altShapes(i), hPx: tier, hUnits: GF.CROWD_H_UNITS, wUnits: 150 * GF.FU });
/** the scholars (GREEK_CROWD 8..10, small orange tablets): the same drawings with the diagram's glowing lines drawn
 *  bolder at crowd sizes (a tablet is ~13 px wide on a 58 px figure: the 1 px lines vanished), so they glint */
const SCH_BOOST: Record<number, number> = { 32: 2.6, 64: 2.3, 128: 1.6, 256: 1.15, 512: 1 };
const SCH_CACHE = new Map<string, Shape[]>();
const schShapes = (i: number, tier: number) => {
  const k = `${i}|${tier}`;
  let out = SCH_CACHE.get(k);
  if (!out) {
    const b = SCH_BOOST[tier] ?? 1;
    out = GF.GREEK_CROWD[i].build().map((q) => (q.keep && q.det !== undefined ? { ...q, det: q.det * b } : q.sh === 0 && q.op !== undefined && q.op < 0.5 ? { ...q, op: Math.min(0.75, q.op * (0.5 + b * 0.6)) } : q));
    SCH_CACHE.set(k, out);
  }
  return out;
};
const isScholar = (side: "greek" | "roman" | "alt", i: number) => side === "greek" && i >= 8 && i <= 10;
const keyOf = (side: "greek" | "roman" | "alt", i: number, tier: number) => (side === "alt" ? `athensAlt|${i}|${tier}` : isScholar(side, i) ? `athensSch|${i}|${tier}` : `${side}|${i}|${tier}`);
const reqOf = (side: "greek" | "roman" | "alt", i: number, tier: number): GF.SpriteReq =>
  side === "alt" ? altReq(i, tier) : isScholar(side, i) ? { key: keyOf(side, i, tier), shapes: schShapes(i, tier), hPx: tier, hUnits: GF.CROWD_H_UNITS, wUnits: 150 * GF.FU } : GF.crowdReq(side, i, tier);
/** the size tiers and the crossfade between neighbours (a figure between T and 1.2 T blends the T sprite in over the
 *  2T one, so a figure shrinking through a tier never swaps its gouache texture in one frame) */
const TIERS = GF.CROWD_TIERS;
const tiersFor = (hPx: number): { hi: number; lo: number; w: number } => {
  const hi = GF.crowdTier(hPx);
  const lo = hi / 2;
  if (!TIERS.includes(lo) || hPx > lo * 1.2) return { hi, lo: hi, w: 0 };
  return { hi, lo, w: c01((lo * 1.2 - hPx) / (lo * 0.2)) };
};
export type DrawFig = { x: number; y: number; hPx: number; Z: number; side: "greek" | "roman"; i: number; rot: number; sy: number; alt: number; sh: { x: number; y: number; rx: number; ry: number; a: number } };
/** the visible figures of a crowd at a camera and a life frame (far to near) */
export const crowdFigs = (c: Cam3, life: number, men: CrowdMan[], side: "greek" | "roman", fogOf?: (Z: number) => number, minPx = 2.2): DrawFig[] => {
  const out: DrawFig[] = [];
  for (const m of men) {
    const p = project(c, m.X, 0, m.Z);
    if (!p) continue;
    const hPx = 325 * p.s;
    if (hPx < minPx || p.x < -hPx * 0.4 || p.x > 1080 + hPx * 0.4 || p.y - hPx * 1.05 > 1920 || p.y + 4 < 0) continue;
    const sw = swayOf(life, m.seed);
    const alt = m.turn ? headTurnOf(life, m.seed) : 0;
    // the contact shadow on the ground, offset to the lower right (light from the upper left)
    const W = 62;
    const D = 34;
    const ps = project(c, m.X + 0.2 * W, 0, m.Z - 0.2 * D);
    const pf = project(c, m.X, 0, m.Z - D);
    const pb = project(c, m.X, 0, m.Z + D);
    const sh = ps && pf && pb ? { x: ps.x, y: ps.y, rx: W * ps.s, ry: Math.max(0.6, (pf.y - pb.y) / 2), a: 1 - (fogOf ? fogOf(m.Z) : 0) } : { x: 0, y: 0, rx: 0, ry: 0, a: 0 };
    out.push({ x: p.x, y: p.y, hPx, Z: m.Z, side, i: m.i, rot: sw.rot, sy: sw.sy, alt, sh });
  }
  return out;
};
/** every sprite request a set of frames needs (bake them once per tab with GF.useFolkSprites) */
export const reqsForFigs = (figs: DrawFig[], into: Map<string, GF.SpriteReq>) => {
  for (const f of figs) {
    const t = tiersFor(f.hPx);
    const add = (side: "greek" | "roman" | "alt", tier: number) => {
      const k = keyOf(side, f.i, tier);
      if (!into.has(k)) into.set(k, reqOf(side, f.i, tier));
    };
    add(f.side, t.hi);
    if (t.w > 0) add(f.side, t.lo);
    if (f.alt > 0) {
      add("alt", t.hi);
      if (t.w > 0) add("alt", t.lo);
    }
  }
};
let SHADOW_SPRITE: { col: string; c: HTMLCanvasElement } | null = null;
const shadowSprite = (col: string) => {
  if (SHADOW_SPRITE && SHADOW_SPRITE.col === col) return SHADOW_SPRITE.c;
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 128;
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  const [r, g, b] = [1, 3, 5].map((k) => parseInt(col.slice(k, k + 2), 16));
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},0.62)`);
  gr.addColorStop(0.6, `rgba(${r},${g},${b},0.34)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 128, 128);
  SHADOW_SPRITE = { col, c: cv };
  return cv;
};
/** draw figures (far to near) with the veils between depth bands, a contact shadow each, the tier crossfade and the
 *  head-turners' crossfade to their turned drawing */
export const drawFigs = (ctx: CanvasRenderingContext2D, figs: DrawFig[], get: (key: string) => GF.Sprite | undefined, veils: GF.CrowdVeil[], shadowCol: string) => {
  const sh = shadowSprite(shadowCol);
  let band = 0;
  for (const f of figs) {
    while (band < veils.length && f.Z < veils[band].Z) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = veils[band].alpha;
      ctx.fillStyle = veils[band].color;
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      band++;
    }
    if (f.sh.a > 0.02 && f.sh.rx > 0.4) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.85 * f.sh.a;
      ctx.drawImage(sh, f.sh.x - f.sh.rx, f.sh.y - f.sh.ry, 2 * f.sh.rx, 2 * f.sh.ry);
      ctx.globalAlpha = 1;
    }
    const t = tiersFor(f.hPx);
    const o = { rot: f.rot, sy: f.sy };
    const blit = (side: "greek" | "roman" | "alt", alpha: number) => {
      if (alpha <= 0.003) return;
      GF.blitFolk(ctx, get(keyOf(side, f.i, t.hi)), f.x, f.y, f.hPx, { ...o, alpha });
      if (t.w > 0) GF.blitFolk(ctx, get(keyOf(side, f.i, t.lo)), f.x, f.y, f.hPx, { ...o, alpha: alpha * t.w });
    };
    if (f.alt < 0.999) blit(f.side, 1);
    if (f.alt > 0.001) blit("alt", f.alt >= 0.999 ? 1 : f.alt);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
/** the crowd veils toward the air of each band's depth (TuberculosisToll's crowdFogFor via greekFolk's crowdVeils) */
const VEIL_Z = [40000, 32000, 25000, 19000, 14000, 10000, 7000, 4500, 2500, 1000];
export const crowdVeilsOf = (A: AirWorld) => GF.crowdVeils((Z) => A.figFog(Z), (Z) => A.airHex(Z, 150), VEIL_Z);

/** every crowd sprite a camera path shows (both crowds) */
export const athensSpriteReqs = (shots: { cam: Cam3; life: number }[]): GF.SpriteReq[] => {
  const m = new Map<string, GF.SpriteReq>();
  for (const s of shots) {
    reqsForFigs(crowdFigs(s.cam, s.life, ATHENIANS, "greek"), m);
    reqsForFigs(crowdFigs(s.cam, s.life, ROMANS, "roman"), m);
  }
  return [...m.values()];
};

// ===================================================================================================================
// THE SCENE: the whole world in its painter's order inside the medium
// ===================================================================================================================
export type SceneHide = Partial<Record<"athenians" | "romans" | "tufts" | "patches" | "track" | "colosseum" | "rock" | "temple" | "detail", boolean>>;
/** the whole world inside the medium. `reqs`: every crowd sprite the CALLER's camera path shows (athensSpriteReqs over
 *  all its frames, computed once at module load: the sprites are baked once per render tab, on its first frame) */
export const AthensRomeScene: React.FC<{ cam: Cam3; life: number; reqs: GF.SpriteReq[]; hide?: SceneHide; bloom?: number }> = ({ cam: c, life, reqs, hide = {}, bloom = 0.22 }) => {
  const A = athensAirOf(c, life);
  const veils = crowdVeilsOf(A);
  const ath = hide.athenians ? [] : crowdFigs(c, life, ATHENIANS, "greek", A.figFog);
  const rom = hide.romans ? [] : crowdFigs(c, life, ROMANS, "roman", A.figFog);
  const get = GF.useFolkSprites(reqs);
  const shadow = PAL.shadow;
  const tufts = !hide.tufts;
  return (
    <AirStage v={A.v} bloom={bloom}>
      <WorldSvg cam={A.cam}>
        <AirFloor A={A} x0={-90000} x1={160000} z0={-30000} z1={150000} mat={MAT.ground} jointAmt={0} melt={0.5} />
        {hide.patches ? null : <GroundPatches A={A} c={c} uid="gp" />}
        {hide.track ? null : <Track A={A} c={c} />}
        <AirHorizonHazeW A={A} id="ar-haze" below={170} />
        <LowAirSink A={A} />
        {tufts ? <TuftLayer A={A} c={c} zMin={1500} zMax={1e9} uid="tA" /> : null}
        {hide.colosseum ? null : <Colosseum A={A} c={c} uid="col" />}
        {hide.rock ? null : <Acropolis A={A} c={c} uid="rk" temple={!hide.temple} detail={!hide.detail} />}
        {tufts ? <TuftLayer A={A} c={c} zMin={ATHENS_FRONT_Z + 900} zMax={1500} uid="tB" /> : null}
      </WorldSvg>
      {rom.length ? <GF.FolkCanvas draw={(ctx) => drawFigs(ctx, rom, get, veils, shadow)} /> : null}
      {ath.length ? <GF.FolkCanvas draw={(ctx) => drawFigs(ctx, ath, get, veils, shadow)} /> : null}
      {tufts ? (
        <WorldSvg cam={A.cam}>
          <TuftLayer A={A} c={c} zMin={-1e9} zMax={ATHENS_FRONT_Z + 900} uid="tC" />
        </WorldSvg>
      ) : null}
    </AirStage>
  );
};
