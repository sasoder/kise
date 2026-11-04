// ---------------------------------------------------------------------------
// AlmostTwentyPercent (scott-nolan-fuel, cut 13). Cheeky Pint style (stout) in real 3D (scott-nolan-uranium/nuclearWorld.tsx,
// the same board, haze and light as cut A). Opaque 1080x1920, 23.976 fps, 120 frames. RENDER --gl=angle.
//
// CHECK LINE: "Where would the new reactors get their fuel? They need 19.75% uranium, called HALEU, and there is none to find."
//
// THE LINE: "It's all about where are we going to get the 19.75% enriched uranium, also called HALEU,"
// WORD -> FRAME: It's 1 · all 5 · about 10 · where 15 · are 19 · we/going 23 · to 26 · get 30 · the 34 · 19 39 · .75 47 · % 60 ·
//   enriched 71 · uranium 78 · also 93 · called 100 · HALEU 108 · (the edit cuts back to the speaker at 120)
// DURATION: the slot 13.889 -> 18.894 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION: one continuous camera push, already moving at f0, low down a dark fuel store: an aisle of cream clay pads, each
// with an empty dark socket made for one upright fuel pellet, staggered left and right. A search light (a soft haze shaft from
// above and behind the camera down to a pool on the board) runs ahead of the camera and lands on empty socket after empty socket
// (left f0, right f9, left f18, right f27) on "where are we going to get"; in each, a weak dashed amber ghost of the missing
// pellet shows while the light is on it and fades as the light moves on. Then it
// swings ahead (f32-f42) onto the one pad at the aisle's end, the spot made for it. Its tag types in on its words: "19" (f39),
// ".75" (f47), "%" (f60). The push arrives over that pad (f71-f85): its dashed amber ghost shows first (f66-f74), then the real
// uranium pellet, solid and glowing in cut 5's palette (fuelShared UraniumPellet + PelletGlow), rises up out of the socket into
// that outline on "uranium" (f74-f90) and the ghost goes (f80-f88): the search found it (rev Nov 4, user: "the same orange
// palette thing like we shown earlier"). "HALEU" lands under the tag (f100-f108). A slow creep in to the cut, no hold.
// CAUSE: a pad brightens, and its ghost shows, only while the light's pool is on it (the store is dark round the light); the
// house light pool rides the search light's spot. The end pad's pellet comes up only once the light and the push are on it.
// AMBER = uranium fuel only: the ghosts of the missing pellets and the found pellet are the only amber in the cut. Pads cream, dimmed to board in the dark.
// PELLET: the found pellet is cut A's shared pellet and every ghost is drawn to it (fuelShared PELLET: diameter = height, chamfer 0.06 of the height), upright.
//
// SOURCES (COMMON.md, verified by the director Nov 4): HALEU is enriched above 5% and below 20% U-235; advanced reactors mostly
// want 19.75%.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { COLOR, FONT_NUM, Label, TRACK } from "../kits/cheeky-pint/stoutShared";
import { PELLET, PelletGlow, UraniumPellet, type PelletPose } from "./fuelShared";
import { KEY_LIGHT, NuclearStage, SHADOW_LEN, SoftShadows, nuclearProject, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// --- the store: an aisle of square clay pads along Z (away), staggered left and right, and the one pad at its end -----------
const AISLE_X = 37;
const PAD_HALF = 12.5;
const PAD_H = 7;
const SOCK_D = 2.8;
type Pad = { x: number; z: number };
const LEFT: Pad[] = [40, 84, 128, 172, 216].map((z) => ({ x: -AISLE_X, z }));
const RIGHT: Pad[] = [62, 106, 150, 194, 238].map((z) => ({ x: AISLE_X, z }));
const PADS = [...LEFT, ...RIGHT];
// the pad made for it: wider, on a low step, standing across the aisle's end
const DEST: Pad = { x: 0, z: 300 };
const DEST_HALF = 16.5;
const DEST_STEP_HALF = 21;
const DEST_STEP_H = 2.4;
const DEST_H = DEST_STEP_H + 8.6; // its top
// the fuel that should stand in it: one upright uranium pellet, cut A's (fuelShared PELLET: diameter = height, 45-degree chamfers)
const PEL_H = 14;
const PEL_R = (PEL_H * PELLET.ASPECT) / 2;
const PEL_C = PELLET.CHAMFER * PEL_H;
const SOCK_R = PEL_R + 1.1; // every socket is made for that pellet
const PEL_Y0 = DEST_H - SOCK_D;

// --- the pads' geometry: a bevelled rounded-square block (cream) with a round hole, and a dark socket in the hole -------------
const roundRect = (half: number, r: number) => {
  const sh = new THREE.Shape();
  const h = half;
  sh.moveTo(-h + r, -h);
  sh.lineTo(h - r, -h);
  sh.quadraticCurveTo(h, -h, h, -h + r);
  sh.lineTo(h, h - r);
  sh.quadraticCurveTo(h, h, h - r, h);
  sh.lineTo(-h + r, h);
  sh.quadraticCurveTo(-h, h, -h, h - r);
  sh.lineTo(-h, -h + r);
  sh.quadraticCurveTo(-h, -h, -h + r, -h);
  return sh;
};
const block = (half: number, y0: number, y1: number, hole: boolean) => {
  const BEV = 1.2;
  const sh = roundRect(half - BEV, 3.2);
  if (hole) {
    const c = new THREE.Path();
    c.absarc(0, 0, SOCK_R + BEV, 0, Math.PI * 2, true);
    sh.holes.push(c);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0 - 2 * BEV, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, 0, BEV + y0);
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
};
const socketGeo = (H: number) => {
  const pts: [number, number][] = [[SOCK_R - 0.05, H - 0.3], [SOCK_R - 0.05, H - SOCK_D + 0.02], [SOCK_R - 0.07, H - SOCK_D], [0.0001, H - SOCK_D]];
  const g = new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(q[0], q[1])), 48);
  g.computeVertexNormals();
  return g;
};

// --- the search light: its spot on the board (world X, Z) runs through a quick spring from pad to pad ------------------------
type Stop = { f: number; at: [number, number]; r: number };
const STOPS: Stop[] = [
  { f: -99, at: [LEFT[1].x, LEFT[1].z], r: 15 },
  { f: 5, at: [RIGHT[1].x, RIGHT[1].z], r: 15 },
  { f: 14, at: [LEFT[2].x, LEFT[2].z], r: 15 },
  { f: 23, at: [RIGHT[2].x, RIGHT[2].z], r: 15.5 },
  { f: 31, at: [DEST.x, DEST.z], r: 23 },
];
const BEAM_K = 0.21;
const BEAM_C = 0.62;
const BEAM: { x: number; z: number; r: number }[] = (() => {
  const out: { x: number; z: number; r: number }[] = [];
  const s = { x: STOPS[0].at[0], z: STOPS[0].at[1], r: STOPS[0].r };
  const v = { x: 0, z: 0, r: 0 };
  for (let f = -20; f <= DURATION + 2; f++) {
    let tg = STOPS[0];
    for (const st of STOPS) if (f >= st.f) tg = st;
    const t = { x: tg.at[0], z: tg.at[1], r: tg.r };
    for (const k of ["x", "z", "r"] as const) {
      v[k] += (t[k] - s[k]) * BEAM_K - v[k] * BEAM_C;
      s[k] += v[k];
    }
    if (f >= 0) out.push({ ...s });
  }
  return out;
})();
const beamAt = (f: number) => BEAM[Math.max(0, Math.min(BEAM.length - 1, f))];

// --- clay pads lit by the search light: the store is dark round the light (cream sinks toward board, then darker) -----------
const PAD_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BEAM_GLSL = /* glsl */ `
uniform vec3 uBeam;   // x, z (world, Z away), radius
uniform float uDark;
float beamAt(vec3 w) {
  float d = length(vec2(w.x, -w.z) - uBeam.xy) / uBeam.z;
  return 1.0 - smoothstep(0.55, 1.0, d);
}`;
const PAD_FRAG = /* glsl */ `
uniform vec3 uL; uniform vec3 uShade; uniform vec3 uCream; uniform vec3 uFoot; uniform vec3 uBoard; uniform vec3 uG; uniform vec2 uFog;
uniform vec3 uLight; uniform vec3 uWall; uniform float uKind;
${BEAM_GLSL}
varying vec3 vW; varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float m = beamAt(vW);
  float dk = uDark * (1.0 - m);
  vec3 col;
  if (uKind < 0.5) {
    // clay: wrapped key, warm terminator, a cream rim on upward edges (nuclearWorld's clayShade), toned to board in the dark
    vec3 base = mix(uFoot, uCream, smoothstep(0.0, 6.0, vW.y));
    base = mix(base, uBoard, 0.9 * dk);
    float ndl = dot(n, uL);
    float lit = smoothstep(-0.42, 0.86, ndl);
    col = mix(base * uShade, base * 1.02, lit);
    col += base * vec3(0.10, 0.055, 0.02) * (1.0 - lit) * (0.45 - 0.45 * n.y);
    col += base * 0.07 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
    col = mix(col, uCream, (0.4 - 0.3 * dk) * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0) * smoothstep(0.05, 0.7, n.y));
    col *= 1.0 - 0.46 * dk;
    col = mix(col, uLight, 0.07 * m * smoothstep(-0.2, 0.6, n.y));
  } else {
    // the socket: a dark wall, a ground-dark floor; the light shows its floor bare
    col = mix(uWall, uG, smoothstep(0.5, 0.9, n.y));
    col = mix(col, col * 1.5, 0.6 * m);
    col *= 1.0 - 0.25 * dk;
  }
  gl_FragColor = vec4(mix(col, uG, smoothstep(uFog.x, uFog.y, length(vW - cameraPosition))), 1.0);
}`;
// the board in the dark: one big decal a hair over the board, ground-dark round the light, the light's pool cream in it
const DARK_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const DARK_FRAG = /* glsl */ `
uniform vec3 uG; uniform vec3 uLight; uniform vec2 uFog;
${BEAM_GLSL}
varying vec3 vW;
void main() {
  float m = beamAt(vW);
  float d = length(vec2(vW.x, -vW.z) - uBeam.xy) / uBeam.z;
  float core = 1.0 - smoothstep(0.0, 0.8, d);
  float fog = smoothstep(uFog.x, uFog.y, length(vW - cameraPosition));
  vec3 col = mix(uG, uLight, m);
  float a = mix(uDark, 0.26 + 0.16 * core, m) * mix(1.0, 0.0, fog * m);
  gl_FragColor = vec4(col, a);
}`;
const LIGHT = "#FFFAF0";
const DARK = 0.8;

const Store: React.FC<{ f: number; fog: [number, number] }> = ({ f, fog }) => {
  const o = useMemo(() => {
    const uni = {
      uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
      uShade: { value: hex("#A88A6E") },
      uCream: { value: hex(COLOR.cream) },
      uFoot: { value: hex(COLOR.creamFoot) },
      uBoard: { value: hex(COLOR.board) },
      uG: { value: hex(COLOR.ground) },
      uFog: { value: new THREE.Vector2(1e5, 2e5) },
      uLight: { value: hex(LIGHT) },
      uWall: { value: hex("#553A27") },
      uBeam: { value: new THREE.Vector3(0, 0, 15) },
      uDark: { value: DARK },
    };
    const mat = (kind: number) =>
      new THREE.ShaderMaterial({ vertexShader: PAD_VERT, fragmentShader: PAD_FRAG, side: THREE.DoubleSide, uniforms: { ...uni, uKind: { value: kind } } });
    const body = mat(0);
    const sock = mat(1);
    const padBody = block(PAD_HALF, 0, PAD_H, true);
    const padSock = socketGeo(PAD_H);
    const destStep = block(DEST_STEP_HALF, 0, DEST_STEP_H, false);
    const destBody = block(DEST_HALF, DEST_STEP_H - 0.2, DEST_H, true);
    const destSock = socketGeo(DEST_H);
    const meshes: object[] = [];
    const put = (g: unknown, m: unknown, p: Pad) => {
      const me = new THREE.Mesh(g, m);
      me.position.set(p.x, 0, -p.z);
      me.frustumCulled = false;
      me.renderOrder = 1;
      meshes.push(me);
    };
    for (const p of PADS) {
      put(padBody, body, p);
      put(padSock, sock, p);
    }
    put(destStep, body, DEST);
    put(destBody, body, DEST);
    put(destSock, sock, DEST);
    const dark = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2).translate(0, 0.06, -200),
      new THREE.ShaderMaterial({ vertexShader: DARK_VERT, fragmentShader: DARK_FRAG, transparent: true, depthWrite: false, uniforms: uni }),
    );
    dark.renderOrder = -60;
    dark.frustumCulled = false;
    return { meshes, dark, uni };
  }, []);
  const b = beamAt(f);
  o.uni.uBeam.value.set(b.x, b.z, b.r);
  o.uni.uFog.value.set(fog[0], fog[1]);
  return (
    <>
      <primitive object={o.dark} />
      {o.meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
};

/** a square block's one shadow: its plan filled with short casters thrown along the key (MAX-blended into one) */
const squareCasters = (p: Pad, half: number, h: number): ShadowItem[] => {
  const out: ShadowItem[] = [];
  const r = half * 0.42;
  for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) out.push({ x: p.x + i * (half - r), z: p.z + j * (half - r), len: h * SHADOW_LEN, r, soft: 2.4, alpha: 1 });
  return out;
};
// --- the board's floor plane: nuclearWorld draws it as one 200000-unit quad, and over triangles that size the interpolated world
// position (hence the board texture's coordinates) loses precision: on a slow push the board's texture jumps on single frames
// (measured: frames 96, 102, 112 of v3 each differ from both neighbours across the whole board). Here the stage's own floor mesh
// gets a subdivided 7200-unit plane under the store instead (same material, same draw order), so it samples smoothly.
const FLOOR_GEO = (() => {
  let g: unknown = null;
  return () => {
    if (g) return g;
    const pg = new THREE.PlaneGeometry(7200, 7200, 72, 72);
    pg.rotateX(-Math.PI / 2);
    pg.translate(0, 0, -150);
    g = pg;
    return g;
  };
})();
type FloorMesh = { isMesh?: boolean; renderOrder: number; geometry: { parameters?: { width?: number } } };
const FineFloor: React.FC = () => {
  const { scene } = useThree();
  const swap = () =>
    scene.traverse((o: FloorMesh) => {
      if (o.isMesh && o.renderOrder === -100 && o.geometry?.parameters?.width === 200000) o.geometry = FLOOR_GEO() as FloorMesh["geometry"];
    });
  swap();
  React.useLayoutEffect(swap);
  return null;
};

const SHADOWS: ShadowItem[] = [
  ...PADS.flatMap((p) => squareCasters(p, PAD_HALF, PAD_H)),
  ...squareCasters(DEST, DEST_STEP_HALF, DEST_H),
];

// --- the camera: one pre-rolled damped push down the aisle onto the pad at its end, then a slow creep in -------------------
type Rig = { tx: number; ty: number; tz: number; d: number; yaw: number; pitch: number; f: number; cy: number };
type RigGlide = { f0: number; f1: number; to: Partial<Rig>; warp?: number };
const LOGF = ["d", "f"];
const PRE = 40;
const rigTrack = (start: Rig, glides: RigGlide[], frames: number): Rig[] => {
  const keys = Object.keys(start) as (keyof Rig)[];
  const lg = (k: string, v: number) => (LOGF.includes(k) ? Math.log(v) : v);
  const pos: Record<string, number> = {};
  const vel: Record<string, number> = {};
  for (const k of keys) {
    pos[k] = lg(k, start[k]);
    vel[k] = 0;
  }
  const out: Rig[] = [];
  for (let f = -PRE; f <= frames + 2; f++) {
    const o: Record<string, number> = {};
    for (const k of keys) {
      let v = lg(k, start[k]);
      let prev = v;
      for (const g of glides) {
        const t = g.to[k];
        if (t === undefined) continue;
        v += (lg(k, t) - prev) * camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
        prev = lg(k, t);
      }
      vel[k] = vel[k] + (v - pos[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
      pos[k] += vel[k];
      o[k] = LOGF.includes(k) ? Math.exp(pos[k]) : pos[k];
    }
    if (f >= 0) out.push(o as Rig);
  }
  return out;
};
const RIG = rigTrack(
  { tx: 0, ty: 6, tz: 40, d: 190, yaw: 4, pitch: 11, f: 1500, cy: 880 },
  [
    // the push: down the aisle and up a little, onto the pad at its end (under way well before f0, arriving f71-f85)
    { f0: -30, f1: 84, to: { tx: 0, ty: 14, tz: DEST.z, d: 152, yaw: 0, pitch: 26, f: 1700, cy: 788 }, warp: 0.85 },
    // the living creep to the cut
    { f0: 66, f1: 200, to: { d: 130, yaw: -2.5, pitch: 27.5 } },
  ],
  DURATION,
);
export const camAt = (f: number): NuclearCam => {
  const k = RIG[Math.max(0, Math.min(RIG.length - 1, f))];
  return { ...k, cx: 540 };
};
const FOG_UNITS: [number, number] = [520, 1500];

// --- the tag: world-space type standing over the pad at the aisle's end; it types in on its words ---------------------------
const NUM_AT: [number, number, number] = [0, 32, DEST.z + 8];
const NUM_WORLD = 15.0; // world units of type size: HERO (184 px) on the arrived camera
const LAB_WORLD = 8.1; // HALEU: 100 px
const LAB_DROP = 9.1;
const PARTS: { t: string; f: number }[] = [
  { t: "19", f: 39 },
  { t: ".75", f: 47 },
  { t: "%", f: 60 },
];
const PART_IN = 7;
const easeOut3 = (u: number) => 1 - Math.pow(1 - c01(u), 3);

// the ghost of the missing stack: each pellet's outline (its chamfered silhouette and its top rim) in faint amber
const ellipsePath = (cam: NuclearCam, cx: number, cz: number, y: number, r: number, from = 0, to = Math.PI * 2, n = 48) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const p = nuclearProject(cam, [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return "M" + pts.join("L");
};
const hullOf = (pts: [number, number][]) => {
  const q = [...pts].sort((p, r) => p[0] - r[0] || p[1] - r[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const p of q) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const hi: [number, number][] = [];
  for (let i = q.length - 1; i >= 0; i--) {
    const p = q[i];
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
  return "M" + hull.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z";
};
/** the pellet's silhouette above `cut` (the socket's rim: below it the pellet is inside the pad) */
const hullPath = (cam: NuclearCam, cx: number, cz: number, y0: number, cut: number) => {
  const pts: [number, number][] = [];
  const yb = Math.max(y0, cut);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    for (const [r, y] of [[PEL_R, yb], [PEL_R, y0 + PEL_H - PEL_C], [PEL_R - PEL_C, y0 + PEL_H]] as const) {
      const p = nuclearProject(cam, [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
      pts.push([p.x, p.y]);
    }
  }
  return hullOf(pts);
};
/** one dashed amber ghost of the pellet that should stand in a socket (its silhouette and its top rim) */
const Ghost: React.FC<{ cam: NuclearCam; at: Pad; y0: number; top: number; opacity: number }> = ({ cam, at, y0, top, opacity }) => {
  if (opacity <= 0.003) return null;
  const sw = Math.max(1.6, 0.26 * nuclearProject(cam, [at.x, y0, at.z]).s);
  const dash = `${(sw * 3.2).toFixed(1)} ${(sw * 2.4).toFixed(1)}`;
  return (
    <g opacity={opacity.toFixed(3)} fill="none" stroke={COLOR.amberTop} strokeLinejoin="round" strokeLinecap="round">
      <path d={hullPath(cam, at.x, at.z, y0, top)} strokeWidth={sw} strokeOpacity={0.9} fill={COLOR.amberTop} fillOpacity={0.13} strokeDasharray={dash} />
      {/* its foot: where it would go down into the socket (the near half of the ring) */}
      <path d={ellipsePath(cam, at.x, at.z, Math.max(y0, top), PEL_R, Math.PI, Math.PI * 2, 24)} strokeWidth={sw} strokeOpacity={0.9} strokeDasharray={dash} />
      <path d={ellipsePath(cam, at.x, at.z, y0 + PEL_H, PEL_R - PEL_C)} strokeWidth={sw} strokeOpacity={0.9} strokeDasharray={dash} />
    </g>
  );
};
// the aisle's ghosts: each empty socket shows its missing pellet, weakly, while the light's spot is on it: quick in as the spot
// arrives, a few frames' fade as it moves on
const PAD_GHOST = 0.55;
const nearOf = (p: Pad, b: { x: number; z: number; r: number }) => 1 - smooth(0.22, 0.75, Math.hypot(p.x - b.x, p.z - b.z) / b.r);
const PAD_GHOSTS: number[][] = (() => {
  const lv = PADS.map((p) => nearOf(p, beamAt(0)));
  const out: number[][] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const b = beamAt(f);
    PADS.forEach((p, i) => {
      const on = nearOf(p, b);
      lv[i] += (on - lv[i]) * (on > lv[i] ? 0.6 : 0.28);
    });
    out.push(lv.map((v) => PAD_GHOST * v));
  }
  return out;
})();
const padGhostOf = (i: number, f: number) => PAD_GHOSTS[Math.max(0, Math.min(PAD_GHOSTS.length - 1, f))][i];

// --- the search light's shaft: a soft haze cone from above and behind the camera (fixed in the frame, the light rides with the
// eye) down to its spot on the board
const APEX: [number, number] = [650, -520];
const APEX_W = 70;
const Shaft: React.FC<{ cam: NuclearCam; b: { x: number; z: number; r: number } }> = ({ cam, b }) => {
  const ring: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const q = nuclearProject(cam, [b.x + Math.cos(a) * b.r * 0.72, 0.3, b.z + Math.sin(a) * b.r * 0.72]);
    ring.push([q.x, q.y]);
  }
  const c = nuclearProject(cam, [b.x, 0.3, b.z]);
  const d = hullOf([[APEX[0] - APEX_W, APEX[1]], [APEX[0] + APEX_W, APEX[1]], ...ring]);
  const pool = "M" + ring.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L") + "Z";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="atpShaft" gradientUnits="userSpaceOnUse" x1={APEX[0]} y1={APEX[1]} x2={c.x} y2={c.y}>
          <stop offset="0" stopColor={LIGHT} stopOpacity={0} />
          <stop offset="0.45" stopColor={LIGHT} stopOpacity={0.035} />
          <stop offset="1" stopColor={LIGHT} stopOpacity={0.11} />
        </linearGradient>
        <filter id="atpShaftBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <g filter="url(#atpShaftBlur)">
        <path d={d} fill="url(#atpShaft)" />
        <path d={pool} fill={LIGHT} fillOpacity={0.05} />
      </g>
    </svg>
  );
};

const GHOST_F0 = 66;
const GHOST_F1 = 74;
// the found pellet: up out of the socket (its top starts below the socket floor, inside the pad) into its seat, ease-out
const FOUND_F0 = 74;
const FOUND_F1 = 90;
const GHOST_OUT0 = 80;
const GHOST_OUT1 = 88;
const foundPose = (f: number): PelletPose => {
  const u = easeOut3((f - FOUND_F0) / (FOUND_F1 - FOUND_F0));
  const y0 = PEL_Y0 - (1 - u) * (PEL_H + 0.5);
  const c: [number, number, number] = [DEST.x, y0 + PEL_H / 2, DEST.z];
  // the glow only above the pad's top: below it the pellet is inside the socket
  return { c, h: PEL_H, hideBelow: DEST_H - c[1] };
};

const Overlay: React.FC<{ cam: NuclearCam; f: number }> = ({ cam, f }) => {
  const p = nuclearProject(cam, NUM_AT);
  const px = NUM_WORLD * p.s;
  const lab = nuclearProject(cam, [NUM_AT[0], NUM_AT[1] - LAB_DROP, NUM_AT[2]]);
  const labPx = LAB_WORLD * lab.s;
  const g = smooth(GHOST_F0, GHOST_F1, f) * (1 - smooth(GHOST_OUT0, GHOST_OUT1, f));
  const gLift = (1 - easeOut3((f - GHOST_F0) / (GHOST_F1 - GHOST_F0))) * -2.5;
  // each part of the tag keeps its place in the whole centred string and comes up into it on its word
  let prevOff = 0;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {PADS.map((q, i) => (
        <Ghost key={i} cam={cam} at={q} y0={PAD_H - SOCK_D} top={PAD_H} opacity={padGhostOf(i, f)} />
      ))}
      <Ghost cam={cam} at={DEST} y0={PEL_Y0 + gLift} top={DEST_H} opacity={g} />
      <text x={p.x + (TRACK.numeral * px) / 2} y={p.y} fontFamily={FONT_NUM} fontWeight={700} fontSize={px} letterSpacing={`${TRACK.numeral}em`} textAnchor="middle" fill={COLOR.inkCream} style={{ fontFeatureSettings: '"lnum" 1' }}>
        {PARTS.map((q, i) => {
          const u = (f - q.f + 2) / PART_IN;
          const a = easeOut3(u);
          const off = (1 - a) * 0.28 * px;
          const dy = off - prevOff;
          prevOff = off;
          return (
            <tspan key={i} dy={dy.toFixed(2)} opacity={c01(u * 1.4).toFixed(3)}>
              {q.t}
            </tspan>
          );
        })}
      </text>
      <Label x={lab.x} y={lab.y} k={1} px={labPx} text="HALEU" tone="cream" enter={c01((f - 98) / 11)} />
    </svg>
  );
};

const AlmostTwentyPercent: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 400;
  const cam = camAt(f);
  const b = beamAt(f);
  const bp = nuclearProject(cam, [b.x, 4, b.z]);
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={[FOG_UNITS[0] / cam.d, FOG_UNITS[1] / cam.d]}
      boardUnits={170}
      pool={{ x: bp.x, y: bp.y - 60, strength: 1 }}
      world={
        <>
          <FineFloor />
          <SoftShadows items={SHADOWS} />
          <Store f={f} fog={FOG_UNITS} />
          {f >= FOUND_F0 ? <UraniumPellet pose={foundPose(f)} /> : null}
        </>
      }
      overlay={
        <>
          <Shaft cam={cam} b={b} />
          {f >= FOUND_F0 + 2 ? <PelletGlow cam={cam} poses={[foundPose(f)]} /> : null}
          <Overlay cam={cam} f={f} />
        </>
      }
    />
  );
};

export default AlmostTwentyPercent;

// for the probe scripts: the rig and the beam are pure
export const __probe = { camAt, beamAt, NUM_AT, DEST, D2R, PADS, padGhostOf };
