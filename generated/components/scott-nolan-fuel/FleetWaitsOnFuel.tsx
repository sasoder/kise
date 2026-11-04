// ---------------------------------------------------------------------------
// FleetWaitsOnFuel (scott-nolan-fuel, cut 5). Cheeky Pint style (stout) in real 3D (nuclearWorld + fuelShared). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 133 frames.
//
// CHECK LINE: "However many reactors we want to build, small modular or gigawatt-sized, they are all waiting on one thing: fuel."
//
// THE LINE (after "What is the one thing that could prevent all" on camera): "the reactors from scaling, all the SMRs or gigawatt
// scale light water reactors? And it's fuel."
// WORD -> FRAME: the 5 · reactors 9 · from 18 · scaling 24 · all 32 · the 39 · SMRs 42 · or 56 · gigawatt 62 · scale 74 · light 81 ·
// water 96 · reactors 101 · And 110 · it's 120 · fuel 125 (the edit cuts back to the speaker at f133)
// DURATION: the slot 5.547 -> 11.094 s = 5.547 s x 23.976 = 133 frames (f0..f132).
//
// THE MOTION: one continuous camera move. It opens already dollying along one row of ten small modular reactors (small domed
// buildings) as they rise out of their dark slots one after another, the rising wave running a little ahead of the camera while it
// eases back; by "SMRs" (f42) a long run of them stands in shot. The row ends in a gigawatt light water plant that is already
// standing: the camera lifts and pulls back and the plant comes in from frame right (first edge about f50), its cooling tower's top
// from the frame top, fully in shot by about f90, dwarfing the modules. From f90 the camera tilts down: one amber fuel pellet comes
// straight up from the frame's bottom edge (f97), the light pool slides onto it and the whole fleet recedes to board dim
// (f105-f117). Settled by f122: the lone pellet in the light (about 320 px tall, centre near y 900), the dimmed fleet and plant
// whole above it; then a slow creep in while the tower steams.
// CAUSE: a module rises out of its slot only when the wave running along the row reaches it; the fleet dims as the pool leaves it.
// AMBER = uranium fuel only: the pellet is the only amber in the cut. Reactors cream, dimmed to board.
//
// SOURCES: no figures on screen. SMR: NuScale-like power module (fuelShared). Plant: AP1000-like containment + natural-draught tower.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { COLOR, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SHADOW_LEN, SoftShadows, nuclearProject, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { THREE, sharedUniforms, type Any } from "../scott-nolan-wind/energyCore";
import { GigawattPlant, SmrModule, gigawattShadowItems, smrShadowItems } from "./fuelShared";

export const FPS = 24000 / 1001;
export const DURATION = 133;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the world: one row of modules along X, the plant at its end set a little back, the pellet on the board in front --------
export const ROW_PITCH = 32;
export const ROW_N = 10;
const modAt = (i: number): [number, number] => [i * ROW_PITCH, 0];
export const PLANT_AT: [number, number] = [(ROW_N - 1) * ROW_PITCH + 66, 50];
export const PELLET_AT: [number, number] = [160, -500];
const PELLET_H = 12;

// --- the camera: an eye and a look point, each on the house damped follower (pre-rolled, so it is moving at f0) ---------------
type Rig = { ex: number; ey: number; ez: number; lx: number; ly: number; lz: number; f: number; cy: number };
type RigGlide = { f0: number; f1: number; to: Partial<Rig>; warp?: number };
const orbit = (l: [number, number, number], d: number, yaw: number, pitch: number) => {
  const sy = Math.sin(yaw * D2R);
  const cyw = Math.cos(yaw * D2R);
  const sp = Math.sin(pitch * D2R);
  const cp = Math.cos(pitch * D2R);
  return { ex: l[0] - sy * cp * d, ey: l[1] + sp * d, ez: l[2] - cyw * cp * d, lx: l[0], ly: l[1], lz: l[2] };
};
const PRE = 40;
const rigTrack = (start: Rig, glides: RigGlide[], frames: number): Rig[] => {
  const keys = Object.keys(start) as (keyof Rig)[];
  const lg = (k: string, v: number) => (k === "f" ? Math.log(v) : v);
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
      o[k] = k === "f" ? Math.exp(pos[k]) : pos[k];
    }
    if (f >= 0) out.push(o as Rig);
  }
  return out;
};
const START: Rig = { ...orbit([40, 16, 0], 165, 28, 20), f: 2300, cy: 650 };
// the plant phase: the eye stands back and up on nearly the final line of sight, so the crane down brings the pellet straight up
const PLANT_EYE: [number, number, number] = [113, 300, -832];
const lookFrom = (e: [number, number, number], yaw: number, pitch: number, d: number) => ({
  lx: e[0] + Math.sin(yaw * D2R) * Math.cos(pitch * D2R) * d,
  ly: e[1] - Math.sin(pitch * D2R) * d,
  lz: e[2] + Math.cos(yaw * D2R) * Math.cos(pitch * D2R) * d,
});
const PELLET_C: [number, number, number] = [PELLET_AT[0], PELLET_H / 2, PELLET_AT[1]];
const FINAL = orbit(PELLET_C, 43, 8, 16);
const RIG = rigTrack(
  START,
  [
    // the dolly along the row, slow while the camera is close, under way before f0 ...
    { f0: -10, f1: 66, to: orbit([190, 16, 0], 165, 27, 20) },
    // ... and the ease back as the run of standing modules grows
    { f0: -8, f1: 64, to: orbit([190, 16, 0], 440, 18, 20) },
    // lift and pull back: the standing plant comes in from frame right, its tower's top from the frame top
    { f0: 46, f1: 98, to: { ...lookFrom(PLANT_EYE, 15, 13, 900), ex: PLANT_EYE[0], ey: PLANT_EYE[1], ez: PLANT_EYE[2], f: 2600, cy: 620 } },
    // crane down and in onto the pellet in front of the row
    { f0: 90, f1: 115, to: { ...FINAL, f: 1000, cy: 890 } },
    // the living hold: a slow creep in
    { f0: 112, f1: 210, to: orbit(PELLET_C, 41.5, 8.3, 16) },
  ],
  DURATION,
);
export const camAt = (f: number): NuclearCam => {
  const k = RIG[Math.max(0, Math.min(RIG.length - 1, f))];
  const dx = k.lx - k.ex;
  const dy = k.ly - k.ey;
  const dz = k.lz - k.ez;
  const d = Math.hypot(dx, dy, dz);
  return { tx: k.lx, ty: k.ly, tz: k.lz, d, yaw: Math.atan2(dx, dz) / D2R, pitch: Math.asin(-dy / d) / D2R, f: k.f, cy: k.cy, cx: 540 };
};

// --- the rising wave: it runs along the row a little faster than the camera, so the run of standing modules in shot grows ------
const WAVE_X0 = 100; // the wave front at f0 (modules behind it are already up, module 2 is mid-rise)
const WAVE_V = 5.3; // units per frame: the last slot opens about f35
const MOD_RISE = 15;
const modStart = Array.from({ length: ROW_N }, (_, i) => (modAt(i)[0] - WAVE_X0) / WAVE_V);
const modRise = (i: number, f: number) => smooth(0, 1, (f - modStart[i]) / MOD_RISE);
// the fleet recedes to board dim as the pool leaves it for the pellet
// fog fixed in world units from the eye (not in multiples of d): the far fleet stays in shot behind the close pellet
const FOG_UNITS: [number, number] = [1350, 3600];
const DIM_F0 = 105;
const DIM_F1 = 117;

// --- the hero pellet: a real UO2 pellet (8 mm across, 10 mm long), crisp 45-degree chamfers and shallowly dished ends, in
// the house amber: amberFoot -> amberTop by the key light, a 2 px amberHot edge round the top land (the top face's rim where
// it meets the chamfer) and the fixed house bloom (bloomFilter(1)) round its screen silhouette. Normals are analytic per
// profile region so the chamfers and the dish read as facets, not as a smooth can.
const PEL_R = 0.4;
const PEL_C = 0.055; // chamfer, of the length
const PEL_LAND = 0.29; // the dish starts inside the flat land
const PEL_PROFILE: [number, number][] = [
  [0.0001, 0.022], [0.1, 0.019], [0.2, 0.011], [PEL_LAND, 0], [PEL_R - PEL_C, 0], [PEL_R, PEL_C],
  [PEL_R, 1 - PEL_C], [PEL_R - PEL_C, 1], [PEL_LAND, 1], [0.2, 0.989], [0.1, 0.981], [0.0001, 0.978],
];
const pelletGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    g = new THREE.LatheGeometry(PEL_PROFILE.map((p) => new THREE.Vector2(p[0], p[1])), 96);
    return g;
  };
})();
const PEL_VERT = /* glsl */ `
varying vec3 vP;
void main() { vP = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const PEL_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform float uHotPx;
varying vec3 vP;
const float R = ${PEL_R.toFixed(3)};
const float C = ${PEL_C.toFixed(3)};
const float LAND = ${PEL_LAND.toFixed(3)};
void main() {
  float rr = length(vP.xz);
  vec2 rd = rr > 1e-4 ? vP.xz / rr : vec2(0.0);
  float y = vP.y;
  float top = step(0.5, y);
  float ys = top > 0.5 ? 1.0 - y : y;        // distance from the nearer end
  float sg = top > 0.5 ? 1.0 : -1.0;
  vec3 n;
  float face = 0.0;   // 1 on an end face
  float cham = 0.0;   // 1 on a chamfer
  float dishK = 0.0;
  if (ys < C - 0.0006 && rr > R - C - 0.0012) {
    n = normalize(vec3(rd.x, sg, rd.y));
    cham = 1.0;
  } else if (ys < 0.03 && rr <= R - C - 0.0012) {
    face = 1.0;
    // the dish: a shallow spherical cup inside the land (its slope drawn a little steeper than the geometry, so it reads)
    float q = clamp(rr / LAND, 0.0, 1.0);
    dishK = rr < LAND ? 0.3 * q : 0.0;
    n = normalize(vec3(-rd.x * dishK, sg, -rd.y * dishK));
  } else {
    n = vec3(rd.x, 0.0, rd.y);
  }
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 col = mix(uAmberFoot, uAmberTop, lit);
  col = mix(col, uAmberHot, 0.5 * pow(max(n.y, 0.0), 6.0));
  // the chamfers read as their own bands: the top one in the wall's amber (so the hot land edge above it pops), the bottom one in the foot
  col = top > 0.5 ? mix(col, mix(uAmberFoot, uAmberTop, 0.35 + 0.65 * lit), cham) : mix(col, uAmberFoot, cham * 0.55);
  // the dish: its far inner slope turns to the light, its near slope away (a cup, not a dome)
  if (face > 0.5 && top > 0.5 && rr < LAND) {
    float dl = dot(-rd, normalize(uL.xz)) * (rr / LAND);
    col = dl > 0.0 ? mix(col, uAmberHot, 0.3 * dl) : mix(col, uAmberTop, -0.42 * dl);
  }
  // the 2 px hot edge round the top land, on the crease where the top face meets the chamfer
  float w = max(fwidth(rr), 1e-5);
  float hot = top * step(1.0 - C - 0.002, y) * (1.0 - smoothstep(uHotPx * 0.5 - 0.5, uHotPx * 0.5 + 0.5, abs(rr - (R - C)) / w));
  col = mix(col, uAmberHot, hot);
  gl_FragColor = vec4(col, 1.0);
}`;
const HeroPellet: React.FC<{ at: [number, number]; h: number }> = ({ at, h }) => {
  const me = useMemo(() => {
    const u = sharedUniforms();
    const mat = new THREE.ShaderMaterial({
      vertexShader: PEL_VERT,
      fragmentShader: PEL_FRAG,
      extensions: { derivatives: true },
      uniforms: { uL: u.uL, uAmberTop: u.uAmberTop, uAmberFoot: u.uAmberFoot, uAmberHot: u.uAmberHot, uHotPx: { value: 2 } },
    });
    const m = new THREE.Mesh(pelletGeo(), mat);
    m.frustumCulled = false;
    m.renderOrder = 2;
    return m;
  }, []);
  // the line is 2 px at full resolution (a half-res preview draws it at half the pixel count)
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  me.material.uniforms.uHotPx.value = 2 * dpr;
  me.scale.setScalar(h);
  me.position.set(at[0], 0, -at[1]);
  return (
    <>
      <SoftShadows items={[{ x: at[0], z: at[1], len: h * SHADOW_LEN, r: h * 0.42, alpha: 1 }]} />
      <primitive object={me} />
    </>
  );
};
// the pellet's screen silhouette (convex: the hull of its projected rims), for the house bloom drawn round it
const pelletHull = (cam: NuclearCam, at: [number, number], h: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    for (const [r, y] of [[PEL_R, PEL_C], [PEL_R, 1 - PEL_C], [PEL_R - PEL_C, 1], [PEL_R - PEL_C, 0]] as const) {
      const p = nuclearProject(cam, [at[0] + Math.cos(a) * r * h, y * h, at[1] + Math.sin(a) * r * h]);
      pts.push([p.x, p.y]);
    }
  }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const p of pts) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const hi: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
  return "M" + hull.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z";
};
const PelletBloom: React.FC<{ cam: NuclearCam }> = ({ cam }) => {
  const d = pelletHull(cam, PELLET_AT, PELLET_H);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <mask id="fleetPelletOut" maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill="#fff" />
          <path d={d} fill="#000" />
        </mask>
      </defs>
      {/* the glow only: the pellet itself is the 3D body under it */}
      <g mask="url(#fleetPelletOut)">
        <path d={d} fill={COLOR.amberTop} style={{ filter: bloomFilter(1) }} />
      </g>
    </svg>
  );
};

const FleetWaitsOnFuel: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 600;
  const cam = camAt(f);
  const dim = smooth(DIM_F0, DIM_F1, f);
  const shadows = [
    ...Array.from({ length: ROW_N }, (_, i) => smrShadowItems(modAt(i), { rise: modRise(i, f) })).flat(),
    ...gigawattShadowItems(PLANT_AT),
  ];
  // the pool: over the fleet, then onto the pellet (its screen point)
  const pel = nuclearProject(cam, [PELLET_AT[0], PELLET_H * 0.55, PELLET_AT[1]]);
  const toPel = smooth(DIM_F0 - 3, DIM_F1, f);
  const pool = { x: mix(470, pel.x, toPel), y: mix(700, pel.y - 30, toPel), strength: 1 };
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={170}
      fog={[FOG_UNITS[0] / cam.d, FOG_UNITS[1] / cam.d]}
      pool={pool}
      overlay={<PelletBloom cam={cam} />}
      world={
        <>
          <SoftShadows items={shadows} />
          {Array.from({ length: ROW_N }, (_, i) => (
            <SmrModule key={i} at={modAt(i)} rise={modRise(i, f)} dim={dim} shadow={false} slot />
          ))}
          <GigawattPlant at={PLANT_AT} dim={dim} S={S} shadow={false} />
          <HeroPellet at={PELLET_AT} h={PELLET_H} />
        </>
      }
    />
  );
};

export default FleetWaitsOnFuel;
