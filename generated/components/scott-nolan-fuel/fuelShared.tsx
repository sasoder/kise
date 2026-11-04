// FUEL_SHARED
// ===================================================================================================================
// fuelShared: the reactors of scott-nolan-fuel (Cheeky Pint S4E04, Scott Nolan), on nuclearWorld's stage (scott-nolan-uranium)
// and the energy world's clay (scott-nolan-wind/energyCore). RENDER WITH --gl=angle.
//
// WORLD: X right, Y up (board = 0), Z away. Sizes below are at scale 1; every prop scales with `scale`.
//   <SmrModule at y? scale? rise? dim? yaw? shadow? slot?>  one small modular reactor (a low drum under a shallow dome, no door), SMR_TOP tall
//   <GigawattPlant at y? scale? rise? dim? yaw? shadow? S steam? steamFrom?>   containment + dome, one cooling tower
//   smrShadowItems(at, {scale, rise}), gigawattShadowItems(at, {scale, rise, yaw})   their board shadows (+ the slot ring)
//   smrPortOf(at, {y, scale}), gigawattPortOf(at, {y, scale, rise, yaw})            the dome crown (world); no port is drawn since v3
//   URANIUM FUEL (added Nov 4, see SHARED_CHANGES.md): <UraniumPellet pose>, <PelletGlow cam poses> (overlay), pelletRowPoses(...),
//   pelletShadowItems(poses), <FuelRod mouth dir len>, fuelRodShadowItems(...), PELLET
// rise 0..1: the object comes up out of a slot in the surface it stands on (the slot opens as a dark ring first; the surface
// hides the sunk part). dim 0..1: tone to the board (never opacity). Nothing in here is amber.
// ===================================================================================================================
import React, { useId, useMemo } from "react";
import { COLOR, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearProject, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { EW_COLOR, THREE, c01, energyClay, flipZ, hash01, lathe, merge, mesh, paint, sharedUniforms, smooth, vec3Of, type Any, type V3 } from "../scott-nolan-wind/energyCore";

const D2R = Math.PI / 180;
const rotXZ = (x: number, z: number, deg: number): [number, number] => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return [x * c - z * s, x * s + z * c];
};
const RISE_SINK = 1.03;

// ===================================================================================================================
// THE SHALLOW DOME (look v3, user's review Nov 4: a tall hemispherical dome with a dark port in its crown read as phallic).
// A spherical cap of base radius r and rise h, closed at the crown: real containments are a wide drum under a low dome, and
// nothing on a roof is open. Profile points from the eave (rr = r) to the crown (rr = 0), standing on y0.
// ===================================================================================================================
const capProfile = (r: number, h: number, y0: number, n: number): [number, number][] => {
  const rs = (r * r + h * h) / (2 * h);
  const out: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    const rr = r * (1 - i / n);
    out.push([Math.max(0.0001, rr), y0 + Math.sqrt(rs * rs - rr * rr) - (rs - h)]);
  }
  return out;
};

// ===================================================================================================================
// THE SLOT: an opaque dark disc a hair above the surface, a little wider than the foot (prop `slot`, default off). It is there
// before the object comes up through it, so a rising object reads as coming out of a hole, and it stays as a dark ring round
// the standing foot.
// ===================================================================================================================
export const SLOT_COLOR = "#35241A";
const slotGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const c = new THREE.CircleGeometry(1, 64);
    c.rotateX(-Math.PI / 2);
    g = paint(c, SLOT_COLOR);
    return g;
  };
})();
// flat and unlit (the clay's grazing cream rim would light a floor-level disc), fogged like the board
const SLOT_FRAG = /* glsl */ `
uniform vec3 uC;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
varying vec3 vW;
void main() {
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(uC, uFogCol, fg), 1.0);
}`;
const SLOT_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const useSlots = (n: number) =>
  useMemo(() => {
    const u = sharedUniforms();
    const mat = new THREE.ShaderMaterial({ vertexShader: SLOT_VERT, fragmentShader: SLOT_FRAG, uniforms: { uC: { value: vec3Of(SLOT_COLOR) }, uFogRange: u.uFogRange, uFogCol: u.uFogCol } });
    return { mat, discs: Array.from({ length: n }, () => mesh(slotGeo(), mat, 1)) };
  }, [n]);
const placeSlot = (m: Any, x: number, y: number, z: number, r: number) => {
  m.position.set(x, y + 0.05, -z);
  m.scale.set(r, 1, r);
};

// ===================================================================================================================
// SMR MODULE (look v3, user's review Nov 4: the v2 tall drum + hemisphere + crown hatch read as phallic). A small reactor
// building in the same family as the gigawatt containment: a wide low drum under a shallow dome, about 0.7:1 (height :
// diameter), a footing ring and a slim eave, the roof closed. Plain cream. (No door: a dark door made the small domes read as
// igloos or huts. SMR.PORT_R / DOOR_W / DOOR_H stay exported but nothing draws them.)
// ===================================================================================================================
export const SMR = { H: 18.3, R: 12.5, WALL: 12, CAP: 5.5, PORT_R: 2.3, DOOR_W: 4.4, DOOR_H: 7 } as const;
const smrGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const { R, WALL: Wl, CAP } = SMR;
    const prof: [number, number][] = [[0.0001, 0], [R + 1.1, 0], [R + 1.1, 1.8], [R + 0.5, 2.4], [R, 2.6], [R, Wl]];
    // the slim eave
    prof.push([R + 0.35, Wl + 0.15], [R + 0.35, Wl + 0.6], [R, Wl + 0.75]);
    prof.push(...capProfile(R, CAP, Wl + 0.75, 24));
    g = flipZ(lathe(prof, 64, EW_COLOR.cream));
    return g;
  };
})();
/** the module's true top (the dome's crown), scale 1 */
export const SMR_TOP = SMR.WALL + 0.75 + SMR.CAP;

export type SmrProps = {
  at: [number, number];
  /** the surface it stands on (board 0, land slabTop()) */
  y?: number;
  scale?: number;
  /** 0 sunk in its slot .. 1 standing */
  rise?: number;
  /** 0 lit cream .. 1 receded to the board tone */
  dim?: number;
  /** turn about its axis (degrees); the module is round, so this only turns its seams */
  yaw?: number;
  /** draw its own shadow and slot (false when the cut gathers a group's into one SoftShadows) */
  shadow?: boolean;
  /** draw the dark slot disc it rises out of (added after FUEL_SHARED_READY; default off) */
  slot?: boolean;
};
export const smrShadowItems = (at: [number, number], o: { scale?: number; rise?: number; alpha?: number } = {}): ShadowItem[] => {
  const s = o.scale ?? 1;
  const r = o.rise ?? 1;
  if (r <= 0) return [];
  const a = o.alpha ?? 1;
  return [
    // the slot opens as a dark ring a little wider than the vessel before the vessel clears it
    { x: at[0], z: at[1], len: 0.001, r: SMR.R * 1.28 * s * smooth(0, 0.1, r), soft: SMR.R * 0.2 * s, alpha: a },
    { x: at[0], z: at[1], len: (SMR_TOP * r + 1) * s * SHADOW_LEN, r: SMR.R * 1.02 * s, soft: SMR.R * 0.6 * s, alpha: a * smooth(0, 0.08, r) },
  ];
};
/** the dome's crown (world) and the old port radius (nothing is open there since look v3) */
export const smrPortOf = (at: [number, number], o: { y?: number; scale?: number; rise?: number } = {}) => {
  const s = o.scale ?? 1;
  const sink = (1 - (o.rise ?? 1)) * SMR_TOP * RISE_SINK * s;
  return { pos: [at[0], (o.y ?? 0) + (SMR_TOP - 0.3) * s - sink, at[1]] as V3, r: SMR.PORT_R * s };
};
export const SmrModule: React.FC<SmrProps> = ({ at, y = 0, scale = 1, rise = 1, dim = 0, yaw = 0, shadow = true, slot = false }) => {
  const o = useMemo(() => {
    const mat = energyClay([], 0);
    return { me: mesh(smrGeo(), mat, 1), mat };
  }, []);
  const sl = useSlots(1);
  placeSlot(sl.discs[0], at[0], y, at[1], SMR.R * 1.22 * scale);
  o.mat.uniforms.uDim.value = c01(dim);
  o.me.scale.setScalar(scale);
  o.me.rotation.set(0, yaw * D2R, 0);
  o.me.position.set(at[0], y - (1 - rise) * SMR_TOP * RISE_SINK * scale, -at[1]);
  o.me.visible = rise > 0.0005;
  return (
    <>
      {shadow ? <SoftShadows items={smrShadowItems(at, { scale, rise })} y={y + 0.02} /> : null}
      {slot ? <primitive object={sl.discs[0]} /> : null}
      <primitive object={o.me} />
    </>
  );
};

// ===================================================================================================================
// GIGAWATT PLANT. A large light water reactor station: the containment (a wide cylinder under a shallow closed dome, a ring
// girder at the eave; look v3, Nov 4: the tall hemisphere with a crown port read as phallic) in front, one natural-draught cooling tower (hyperboloid on crossed columns)
// behind and to the right. Real-leaning proportions: a PWR containment is ~40 m across and ~60-70 m tall, a tower
// ~150 m; the SMR building stands at SMR_TOP. The tower here is a little short of true scale, so a frame can hold both.
// ===================================================================================================================
export const GIGA = {
  CONT: { x: 0, z: 0, r: 36, wall: 54, cap: 15 },
  TOWER: { x: 132, z: 108, h: 250, rBase: 100, rThroat: 62.5, yThroat: 170, legs: 22 },
} as const;
const GIGA_CONT_TOP = GIGA.CONT.wall + 1.8 + GIGA.CONT.cap;
const GIGA_PORT_R = 7.5;
const hyper = (y: number) => {
  const T = GIGA.TOWER;
  const b = T.yThroat / Math.sqrt((T.rBase / T.rThroat) ** 2 - 1);
  return T.rThroat * Math.sqrt(1 + ((y - T.yThroat) / b) ** 2);
};
/** the tower's outside radius at height y above its foot */
export const gigaTowerRadius = hyper;
export const GIGA_SIZE = {
  /** footprint, scale 1: x from the containment's left edge to the tower's right edge, z from the containment's front to the tower's back */
  X0: GIGA.CONT.x - GIGA.CONT.r,
  X1: GIGA.TOWER.x + GIGA.TOWER.rBase,
  Z0: GIGA.CONT.z - GIGA.CONT.r,
  Z1: GIGA.TOWER.z + GIGA.TOWER.rBase,
  CONT_TOP: GIGA_CONT_TOP,
  TOWER_H: GIGA.TOWER.h,
  TOWER_RIM: hyper(GIGA.TOWER.h),
} as const;
const contGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const { r, wall, cap } = GIGA.CONT;
    const prof: [number, number][] = [[0.0001, 0], [r + 2.6, 0], [r + 2.6, 4.2], [r + 1.4, 5.2], [r, 5.6], [r, wall - 4.2]];
    // the ring girder at the eave
    prof.push([r + 0.9, wall - 3.8], [r + 1.5, wall - 3], [r + 1.5, wall + 0.8], [r + 0.8, wall + 1.6], [r, wall + 1.8]);
    prof.push(...capProfile(r, cap, wall + 1.8, 30));
    // a faint banding of the wall (the concrete lifts), as lathe rings in the foot tone
    const bands: Any[] = [];
    for (const yb of [wall * 0.36, wall * 0.68]) bands.push(lathe([[r + 0.05, yb - 0.5], [r + 0.4, yb - 0.25], [r + 0.4, yb + 0.25], [r + 0.05, yb + 0.5]], 72, EW_COLOR.creamFoot));
    g = flipZ(merge([lathe(prof, 96, EW_COLOR.cream), ...bands]));
    return g;
  };
})();
const towerGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const TW = GIGA.TOWER;
    const N = 44;
    const outer: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const y = TW.legs + ((TW.h - TW.legs) * i) / N;
      outer.push([hyper(y), y]);
    }
    const t = 3;
    // the shell: outside up from the legs, a rounded lip, inside back down in the hollow tone
    const shellOut = lathe([[hyper(TW.legs) + 1.2, TW.legs], [hyper(TW.legs) + 1.2, TW.legs + 2.8], ...outer.slice(1), [hyper(TW.h) - 0.2, TW.h + 0.9], [hyper(TW.h) - t * 0.5, TW.h + 1.2]], 120, EW_COLOR.cream);
    const inner = outer.map(([r, y]): [number, number] => [r - t, y]).reverse();
    const shellIn = lathe([[hyper(TW.h) - t * 0.5, TW.h + 1.2], [hyper(TW.h) - t, TW.h + 0.6], ...inner], 120, EW_COLOR.hollow);
    // the crossed columns of the open base
    const legs: Any[] = [];
    const nLegs = 40;
    for (let i = 0; i < nLegs; i++) {
      for (const s of [-1, 1]) {
        const a0 = ((i + 0.25 * s) / nLegs) * Math.PI * 2;
        const a1 = ((i + 0.5 + 0.25 * s) / nLegs) * Math.PI * 2;
        const r0 = hyper(0) + 1.5;
        const r1 = hyper(TW.legs) - 0.5;
        const p0 = new THREE.Vector3(Math.sin(a0) * r0, 0, Math.cos(a0) * r0);
        const p1 = new THREE.Vector3(Math.sin(a1) * r1, TW.legs + 1, Math.cos(a1) * r1);
        const c = new THREE.CylinderGeometry(1.7, 1.7, p0.distanceTo(p1), 6);
        c.translate(0, p0.distanceTo(p1) / 2, 0);
        c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()));
        c.translate(p0.x, p0.y, p0.z);
        legs.push(paint(c, EW_COLOR.creamFoot));
      }
    }
    const basin = lathe([[0.0001, 0.6], [hyper(0) - 2, 0.6]], 72, EW_COLOR.hollow);
    g = flipZ(merge([shellOut, shellIn, ...legs, basin]));
    return g;
  };
})();
/** the containment rises first, the tower a beat behind it (one object, one slot each) */
const contRise = (r: number) => smooth(0, 0.78, r);
const towerRise = (r: number) => smooth(0.16, 1, r);

export const gigawattShadowItems = (at: [number, number], o: { scale?: number; rise?: number; yaw?: number; alpha?: number } = {}): ShadowItem[] => {
  const s = o.scale ?? 1;
  const r = o.rise ?? 1;
  const a = o.alpha ?? 1;
  const yaw = o.yaw ?? 0;
  const C = GIGA.CONT;
  const T = GIGA.TOWER;
  const rc = contRise(r);
  const rt = towerRise(r);
  const [cx, cz] = rotXZ(C.x, C.z, yaw);
  const [tx, tz] = rotXZ(T.x, T.z, yaw);
  const out: ShadowItem[] = [];
  if (rc > 0) {
    out.push({ x: at[0] + cx * s, z: at[1] + cz * s, len: 0.001, r: (C.r + 4.5) * s * smooth(0, 0.1, rc), soft: 2.4 * s, alpha: a });
    out.push({ x: at[0] + cx * s, z: at[1] + cz * s, len: GIGA_CONT_TOP * rc * s * SHADOW_LEN, r: C.r * 0.98 * s, soft: C.r * 0.55 * s, alpha: a * smooth(0, 0.06, rc) });
  }
  if (rt > 0) {
    out.push({ x: at[0] + tx * s, z: at[1] + tz * s, len: 0.001, r: (T.rBase + 5) * s * smooth(0, 0.08, rt), soft: 3 * s, alpha: a });
    out.push({ x: at[0] + tx * s, z: at[1] + tz * s, len: T.h * rt * s * SHADOW_LEN * 0.9, r: T.rBase * 0.86 * s, soft: T.rBase * 0.35 * s, alpha: a * smooth(0, 0.05, rt) });
  }
  return out;
};
/** the containment's crown (world) and the old port radius (nothing is open there since look v3) */
export const gigawattPortOf = (at: [number, number], o: { y?: number; scale?: number; rise?: number; yaw?: number } = {}) => {
  const s = o.scale ?? 1;
  const [cx, cz] = rotXZ(GIGA.CONT.x, GIGA.CONT.z, o.yaw ?? 0);
  const sink = (1 - contRise(o.rise ?? 1)) * GIGA_CONT_TOP * RISE_SINK * s;
  return { pos: [at[0] + cx * s, (o.y ?? 0) + (GIGA_CONT_TOP - 0.5) * s - sink, at[1] + cz * s] as V3, r: GIGA_PORT_R * s };
};
/** the tower's mouth centre (world) at rise 1 */
export const gigawattMouthOf = (at: [number, number], o: { y?: number; scale?: number; yaw?: number } = {}): V3 => {
  const s = o.scale ?? 1;
  const [tx, tz] = rotXZ(GIGA.TOWER.x, GIGA.TOWER.z, o.yaw ?? 0);
  return [at[0] + tx * s, (o.y ?? 0) + GIGA.TOWER.h * s, at[1] + tz * s];
};

export type GigawattProps = {
  at: [number, number];
  y?: number;
  scale?: number;
  rise?: number;
  dim?: number;
  /** turn the layout about `at` (degrees; + carries the tower from behind-right toward the front-right) */
  yaw?: number;
  shadow?: boolean;
  /** story clock (frames): the steam */
  S: number;
  /** steam density 0..1 (0: none) */
  steam?: number;
  /** the story time the tower starts to steam (puffs born before it never exist); default: steaming long before f0 */
  steamFrom?: number;
  /** draw the dark slot discs the containment and tower rise out of (added after FUEL_SHARED_READY; default off) */
  slot?: boolean;
};
export const GigawattPlant: React.FC<GigawattProps> = ({ at, y = 0, scale = 1, rise = 1, dim = 0, yaw = 0, shadow = true, S, steam = 1, steamFrom = -1e9, slot = false }) => {
  const o = useMemo(() => {
    const mc = energyClay([], 0);
    const mt = energyClay([], 0);
    return { cont: mesh(contGeo(), mc, 1), tower: mesh(towerGeo(), mt, 1), mc, mt };
  }, []);
  const rc = contRise(rise);
  const rt = towerRise(rise);
  const [cx, cz] = rotXZ(GIGA.CONT.x, GIGA.CONT.z, yaw);
  const [tx, tz] = rotXZ(GIGA.TOWER.x, GIGA.TOWER.z, yaw);
  o.mc.uniforms.uDim.value = c01(dim);
  o.mt.uniforms.uDim.value = c01(dim);
  o.cont.scale.setScalar(scale);
  o.tower.scale.setScalar(scale);
  o.cont.position.set(at[0] + cx * scale, y - (1 - rc) * GIGA_CONT_TOP * RISE_SINK * scale, -(at[1] + cz * scale));
  o.tower.position.set(at[0] + tx * scale, y - (1 - rt) * GIGA.TOWER.h * RISE_SINK * scale, -(at[1] + tz * scale));
  o.cont.visible = rc > 0.0005;
  o.tower.visible = rt > 0.0005;
  const mouth = gigawattMouthOf(at, { y, scale, yaw });
  const sl = useSlots(2);
  placeSlot(sl.discs[0], at[0] + cx * scale, y, at[1] + cz * scale, (GIGA.CONT.r + 3.6) * scale);
  placeSlot(sl.discs[1], at[0] + tx * scale, y, at[1] + tz * scale, (GIGA.TOWER.rBase + 4) * scale);
  return (
    <>
      {shadow ? <SoftShadows items={gigawattShadowItems(at, { scale, rise, yaw })} y={y + 0.02} /> : null}
      {slot ? <primitive object={sl.discs[0]} /> : null}
      {slot ? <primitive object={sl.discs[1]} /> : null}
      <primitive object={o.cont} />
      <primitive object={o.tower} />
      {steam > 0 && rt >= 0.999 ? <TowerSteam mouth={mouth} scale={scale} S={S} amount={steam} from={steamFrom} dim={dim} /> : null}
    </>
  );
};

// ===================================================================================================================
// THE STEAM: coolingTower.tsx's plume (uranium clip), placed and scaled to this tower. Overlapping camera-facing puffs with a
// lit-sphere shading under the one key, condensing inside the mouth, rising, swelling, leaning left and thinning away. A pure
// function of the story clock; it never writes the canvas alpha (the shadows live there); it dims with the plant.
// ===================================================================================================================
const PUFFS = 56;
const LIFE = 96;
const PERIOD = LIFE / PUFFS;
const PLUME_RISE = 1.15; // a column a little over the tower's own height
const LEAN: [number, number] = [-0.42, -0.05];
type Puff = { p: V3; r: number; a: number };
const steamAt = (S: number, from: number): Puff[] => {
  // unit tower: height 1, rim radius from the real shape
  const rim = hyper(GIGA.TOWER.h) / GIGA.TOWER.h;
  const out: Puff[] = [];
  const k0 = Math.floor((S - LIFE) / PERIOD);
  for (let k = k0; k <= k0 + PUFFS + 1; k++) {
    const born = k * PERIOD;
    if (born < from) continue;
    const age = S - born;
    if (age < 0 || age > LIFE) continue;
    const u = age / LIFE;
    const rise = PLUME_RISE * (1 - Math.pow(1 - u, 1.55)) - 0.1;
    const v = Math.max(0, rise) / PLUME_RISE;
    const jx = (hash01(k + 0.31) - 0.5) * rim * 0.5;
    const jz = (hash01(k + 50.7) - 0.5) * rim * 0.5;
    const curl = (0.12 + 0.5 * v) * rim;
    const ph = hash01(k + 9.3) * 6.28 + u * 3.1;
    const lean = PLUME_RISE * v * v;
    out.push({
      p: [jx + LEAN[0] * lean + Math.cos(ph) * curl, rise, jz + LEAN[1] * lean + Math.sin(ph) * curl * 0.6],
      r: rim * (0.5 + 1.1 * v + 0.1 * hash01(k + 3.7)) * (1 + 0.08 * Math.sin(u * 8 + hash01(k + 4.1) * 6.28)),
      a: smooth(0, 0.12, u) * (1 - smooth(0.5, 1, u)) * (0.55 + 0.16 * hash01(k + 7.9)),
    });
  }
  return out;
};
const STEAM_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec2 aRA;
varying vec2 vQ;
varying float vA;
varying vec3 vW;
void main() {
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 w = aPos + (right * position.x + up * position.y) * aRA.x;
  vQ = position.xy;
  vA = aRA.y;
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const STEAM_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uLit;
uniform vec3 uShadeC;
uniform vec3 uDimLit;
uniform vec3 uDimShade;
uniform float uDim;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
varying vec2 vQ;
varying float vA;
varying vec3 vW;
void main() {
  float d = length(vQ);
  if (d > 1.0) discard;
  vec3 n = vec3(vQ, sqrt(max(0.0, 1.0 - d * d)));
  vec3 L = normalize((viewMatrix * vec4(uL, 0.0)).xyz);
  float lit = smoothstep(-0.42, 0.86, dot(n, L));
  vec3 col = mix(mix(uShadeC, uDimShade, uDim), mix(uLit, uDimLit, uDim), lit);
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  float a = vA * (1.0 - smoothstep(0.3, 1.0, d)) * 0.9 * (1.0 - fg);
  gl_FragColor = vec4(mix(col, uFogCol, fg), a);
}`;
const TowerSteam: React.FC<{ mouth: V3; scale: number; S: number; amount: number; from: number; dim: number }> = ({ mouth, scale, S, amount, from, dim }) => {
  const o = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const P = new THREE.InstancedBufferAttribute(new Float32Array((PUFFS + 4) * 3), 3);
    const RA = new THREE.InstancedBufferAttribute(new Float32Array((PUFFS + 4) * 2), 2);
    g.setAttribute("aPos", P);
    g.setAttribute("aRA", RA);
    const u = sharedUniforms();
    const m = new THREE.ShaderMaterial({
      vertexShader: STEAM_VERT,
      fragmentShader: STEAM_FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uLit: { value: vec3Of(COLOR.cream) },
        uShadeC: { value: vec3Of("#D2C2AA") },
        uDimLit: { value: vec3Of(COLOR.board) },
        uDimShade: { value: vec3Of("#8F735A") },
        uDim: { value: 0 },
        uFogRange: u.uFogRange,
        uFogCol: u.uFogCol,
      },
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = 8;
    return { me, g, P, RA, m };
  }, []);
  const H = GIGA.TOWER.h * scale;
  const puffs = steamAt(S, from);
  // back to front for an eye above and in front: lower and farther puffs first
  puffs.sort((a, b) => a.p[1] - b.p[1] || b.p[2] - a.p[2]);
  puffs.forEach((q, i) => {
    o.P.setXYZ(i, mouth[0] + q.p[0] * H, mouth[1] + q.p[1] * H, -(mouth[2] + q.p[2] * H));
    o.RA.setXY(i, q.r * H, q.a * Math.min(1, amount));
  });
  o.g.instanceCount = puffs.length;
  o.P.needsUpdate = o.RA.needsUpdate = true;
  o.m.uniforms.uDim.value = c01(dim);
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// URANIUM FUEL (added Nov 4 for cut A's landing; cut B uses it too). A real UO2 fuel pellet: height about its diameter,
// 45-degree chamfers on both ends, shallowly dished end faces, a ceramic sheen; the house amber (amberFoot -> amberTop by the
// key, a 2 px amberHot hot edge along its top, the fixed house bloom round its screen silhouette via <PelletGlow>). Normals
// are analytic per profile region, so the chamfers and the dish read as facets at any orientation (standing or lying).
// A FuelRod is the open zirconium cladding tube the pellets slide into: cream clay, a dark bore, the far end closed.
// World X/Y/Z as everywhere here; a pose's axis is a world unit vector along the pellet's length.
// ===================================================================================================================
export const PELLET = { ASPECT: 1, CHAMFER: 0.06, LAND: 0.72, DISH: 0.025 } as const; // ASPECT = diameter / height; CHAMFER, DISH of the height; LAND = dish radius / pellet radius
export type PelletPose = {
  /** the pellet's centre (world) */
  c: V3;
  /** unit world vector along its length (default up: standing) */
  axis?: V3;
  /** height (length) in world units */
  h: number;
  /** diameter (default h * PELLET.ASPECT) */
  d?: number;
  /** the part with axial coordinate (from c, along axis) below this is inside something: no glow is drawn there */
  hideBelow?: number;
};
const pelletGeoCache = new Map<string, Any>();
const pelletGeo = (aspect: number) => {
  const key = aspect.toFixed(3);
  const have = pelletGeoCache.get(key);
  if (have) return have;
  const R = aspect / 2;
  const C = PELLET.CHAMFER;
  const land = (R - C) * PELLET.LAND;
  const dish: [number, number][] = [];
  for (let i = 0; i <= 5; i++) {
    const rr = (land * i) / 5;
    dish.push([Math.max(0.0001, rr), PELLET.DISH * (1 - (rr / land) ** 2)]);
  }
  const prof: [number, number][] = [...dish, [R - C, 0], [R, C], [R, 1 - C], [R - C, 1], ...dish.slice().reverse().map(([r, y]) => [r, 1 - y] as [number, number])];
  const g = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 96);
  g.translate(0, -0.5, 0);
  pelletGeoCache.set(key, g);
  return g;
};
const PELLET_VERT = /* glsl */ `
varying vec3 vP;
varying vec3 vW;
varying vec3 vX;
varying vec3 vY;
varying vec3 vZ;
void main() {
  vP = position + vec3(0.0, 0.5, 0.0);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  mat3 m = mat3(modelMatrix);
  vX = normalize(m * vec3(1.0, 0.0, 0.0));
  vY = normalize(m * vec3(0.0, 1.0, 0.0));
  vZ = normalize(m * vec3(0.0, 0.0, 1.0));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PELLET_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform float uHotPx;
uniform float uR;
uniform float uC;
uniform float uLand;
varying vec3 vP;
varying vec3 vW;
varying vec3 vX;
varying vec3 vY;
varying vec3 vZ;
void main() {
  float rr = length(vP.xz);
  vec2 rd = rr > 1e-4 ? vP.xz / rr : vec2(0.0);
  float y = vP.y;
  float topEnd = step(0.5, y);
  float ys = topEnd > 0.5 ? 1.0 - y : y;
  float sg = topEnd > 0.5 ? 1.0 : -1.0;
  vec3 n;
  float face = 0.0;
  float cham = 0.0;
  float dishK = 0.0;
  if (ys < uC - 0.0006 && rr > uR - uC - 0.0012) {
    n = normalize(vec3(rd.x, sg, rd.y));
    cham = 1.0;
  } else if (ys < uC && rr <= uR - uC - 0.0012) {
    face = 1.0;
    // the dish: a shallow cup inside the land (its slope drawn a little steeper than the geometry, so it reads)
    dishK = rr < uLand ? 0.3 * rr / uLand : 0.0;
    n = normalize(vec3(-rd.x * dishK, sg, -rd.y * dishK));
  } else {
    n = vec3(rd.x, 0.0, rd.y);
  }
  vec3 nW = normalize(vX * n.x + vY * n.y + vZ * n.z);
  vec3 nF = normalize(vY * sg);              // this end's flat face normal
  float endUp = nF.y;                        // how much this end faces up
  float lying = 1.0 - step(0.7, abs(vY.y));
  vec3 V = normalize(cameraPosition - vW);
  float lit = smoothstep(-0.5, 0.9, dot(nW, uL));
  vec3 col = mix(uAmberFoot, uAmberTop, lit);
  col = mix(col, uAmberHot, 0.5 * pow(max(nW.y, 0.0), 6.0));
  // chamfers read as their own bands: an up-facing one in the wall's amber (so the hot land edge above it pops), others a groove
  if (cham > 0.5) col = endUp > 0.5 ? mix(uAmberFoot, uAmberTop, 0.35 + 0.65 * lit) : mix(col, uAmberFoot, endUp < -0.5 ? 0.55 : 0.3);
  // the dish: the slope that turns to the light lifts, the one turned away settles (a cup, not a dome)
  // an end face that does not face up stays a light, solid face (darker than its chamfer it would read as a hole)
  if (face > 0.5 && endUp <= 0.5) col = mix(col, mix(uAmberTop, uAmberHot, 0.22), 0.75);
  if (face > 0.5 && rr < uLand) {
    // (kept faint: a strong dish on an end facing us reads as the open end of a tube)
    float dl = dot(nW - nF, uL) / 0.3;
    float dk = endUp > 0.5 ? 0.45 : 0.4;
    col = dl > 0.0 ? mix(col, uAmberHot, 0.3 * dk * dl) : mix(col, uAmberFoot, -0.35 * dk * dl);
  }
  // the ceramic sheen: a soft specular lobe of the key
  float spec = pow(max(dot(nW, normalize(uL + V)), 0.0), 30.0);
  col = mix(col, uAmberHot, 0.45 * spec);
  // hot edges, 2 px: round an up-facing end's land, and along the top of a lying pellet with its falloff
  float w = max(fwidth(rr), 1e-5);
  float ring = step(ys, uC + 0.002) * (1.0 - smoothstep(uHotPx * 0.5 - 0.5, uHotPx * 0.5 + 0.5, abs(rr - (uR - uC)) / w));
  col = mix(col, uAmberHot, ring * (endUp > 0.5 ? 1.0 : 0.0));
  if (face < 0.5 && cham < 0.5) {
    float a = acos(clamp(nW.y, -1.0, 1.0));
    float wa = max(fwidth(a), 1e-5);
    float px = a / wa;
    float line = 1.0 - smoothstep(uHotPx * 0.5 - 0.5, uHotPx * 0.5 + 0.5, px);
    float fall = 1.0 - smoothstep(0.0, uHotPx * 6.0, px);
    col = mix(col, uAmberHot, lying * max(line, 0.3 * fall));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const pelletMatCache = new Map<string, Any>();
const pelletMat = (aspect: number) => {
  const key = aspect.toFixed(3);
  const have = pelletMatCache.get(key);
  if (have) return have;
  const u = sharedUniforms();
  const R = aspect / 2;
  const m = new THREE.ShaderMaterial({
    vertexShader: PELLET_VERT,
    fragmentShader: PELLET_FRAG,
    extensions: { derivatives: true },
    uniforms: {
      uL: u.uL,
      uAmberTop: u.uAmberTop,
      uAmberFoot: u.uAmberFoot,
      uAmberHot: u.uAmberHot,
      uHotPx: { value: 2 },
      uR: { value: R },
      uC: { value: PELLET.CHAMFER },
      uLand: { value: (R - PELLET.CHAMFER) * PELLET.LAND },
    },
  });
  pelletMatCache.set(key, m);
  return m;
};
const UP: V3 = [0, 1, 0];
const norm3 = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
/** one uranium fuel pellet (a child of NuclearStage `world`); its shadow comes from pelletShadowItems */
export const UraniumPellet: React.FC<{ pose: PelletPose }> = ({ pose }) => {
  const d = pose.d ?? pose.h * PELLET.ASPECT;
  const aspect = d / pose.h;
  const me = useMemo(() => {
    const m = new THREE.Mesh(pelletGeo(aspect), pelletMat(aspect));
    m.frustumCulled = false;
    m.renderOrder = 2;
    return m;
  }, [aspect]);
  // 2 px at full resolution (a half-res preview draws the same line in half the pixels)
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  me.material.uniforms.uHotPx.value = 2 * dpr;
  const ax = norm3(pose.axis ?? UP);
  me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ax[0], ax[1], -ax[2]));
  me.scale.setScalar(pose.h);
  me.position.set(pose.c[0], pose.c[1], -pose.c[2]);
  return <primitive object={me} />;
};
/** a row of pellets lying end to end along `dir` (horizontal unit vector, the way they travel) from `mouth` (the row's
 *  leading end, e.g. a rod's open end, centre height = the pellets' axis); `slide` (world units) moves the row along dir.
 *  Each pose's hideBelow is set to the mouth plane, so a pellet that has passed the mouth glows only outside it. */
export const pelletRowPoses = (o: { mouth: V3; dir: V3; n: number; h: number; d?: number; gap?: number; slide?: number }): PelletPose[] => {
  const dir = norm3(o.dir);
  const gap = o.gap ?? o.h * 0.06;
  const out: PelletPose[] = [];
  for (let k = 0; k < o.n; k++) {
    const a = (k + 0.5) * (o.h + gap) - (o.slide ?? 0); // the centre's distance back from the mouth
    out.push({ c: [o.mouth[0] - dir[0] * a, o.mouth[1] - dir[1] * a, o.mouth[2] - dir[2] * a], axis: [-dir[0], -dir[1], -dir[2]], h: o.h, d: o.d, hideBelow: -a });
  }
  return out;
};
/** the poses' soft shadows (gather them into the cut's one SoftShadows) */
export const pelletShadowItems = (poses: PelletPose[], alpha = 1): ShadowItem[] =>
  poses.map((p) => {
    const ax = norm3(p.axis ?? UP);
    const d = p.d ?? p.h * PELLET.ASPECT;
    const top = p.c[1] + Math.abs(ax[1]) * p.h * 0.5 + (1 - Math.abs(ax[1])) * d * 0.5;
    if (Math.abs(ax[1]) > 0.7) return { x: p.c[0], z: p.c[2], len: top * SHADOW_LEN, r: d * 0.5, alpha };
    const hx = Math.hypot(ax[0], ax[2]) || 1;
    const dx = ax[0] / hx;
    const dz = ax[2] / hx;
    const off = top * SHADOW_LEN * 0.5;
    return { x: p.c[0] - dx * p.h * 0.5 + SHADOW_DIR[0] * off, z: p.c[2] - dz * p.h * 0.5 + SHADOW_DIR[1] * off, len: p.h, r: d * 0.5, dirX: dx, dirZ: dz, alpha };
  });
// the pellet's screen silhouette (convex: the hull of its projected rims), clipped at hideBelow
const pelletHull = (cam: NuclearCam, p: PelletPose) => {
  const ax = norm3(p.axis ?? UP);
  const ref: V3 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm3([ax[1] * ref[2] - ax[2] * ref[1], ax[2] * ref[0] - ax[0] * ref[2], ax[0] * ref[1] - ax[1] * ref[0]]);
  const e2: V3 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
  const h = p.h;
  const r = (p.d ?? h * PELLET.ASPECT) / 2;
  const c = PELLET.CHAMFER * h;
  const lo = Math.max(-h / 2, p.hideBelow ?? -1e9);
  if (lo >= h / 2 - 0.01) return null;
  const rings: [number, number][] = ([[-h / 2, r - c], [-h / 2 + c, r], [h / 2 - c, r], [h / 2, r - c]] as [number, number][]).filter((q) => q[0] >= lo);
  if (lo > -h / 2) rings.unshift([lo, r]);
  const pts: [number, number][] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (const [t, rr] of rings) {
      const w: V3 = [0, 1, 2].map((j) => p.c[j] + ax[j] * t + (e1[j] * ca + e2[j] * sa) * rr) as V3;
      const s = nuclearProject(cam, w);
      pts.push([s.x, s.y]);
    }
  }
  pts.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: [number, number][]) => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    return out.slice(0, -1);
  };
  const hull = chain(pts).concat(chain(pts.slice().reverse()));
  return "M" + hull.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L") + "Z";
};
/** the fixed house bloom (bloomFilter(1)) round the pellets' screen silhouettes: pass it as NuclearStage's `overlay`
 *  (or inside it). It draws the glow only, outside the bodies; the 3D pellets are the bodies. */
export const PelletGlow: React.FC<{ cam: NuclearCam; poses: PelletPose[] }> = ({ cam, poses }) => {
  const id = `pg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const paths = poses.map((p) => pelletHull(cam, p)).filter((d): d is string => !!d);
  if (!paths.length) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill="#fff" />
          {paths.map((d, i) => (
            <path key={i} d={d} fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${id})`} style={{ filter: bloomFilter(1) }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={COLOR.amberTop} />
        ))}
      </g>
    </svg>
  );
};
// --- the fuel rod: an open zirconium cladding tube lying on the board ------------------------------------------------
// Metal, not card: a cool board-friendly grey with a crisp specular streak along its length, a thin lighter wall rim at the
// open mouth and a dark bore, so it reads as a tube (rev3 Nov 4: the cream rod read as a cigarette with an amber filter).
export const ROD_COLOR = { zirc: "#ABABA6", rim: "#D9D7D0", bore: "#3A2A20" } as const;
const ROD_VERT = /* glsl */ `
attribute vec3 aCol;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vC = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const ROD_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uBoardTone;
uniform float uDim;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 col = vC * mix(0.58, 1.02, lit);
  col *= 1.0 - 0.14 * max(-n.y, 0.0);                       // the board's warm dark reflected low on the tube
  float metal = smoothstep(0.35, 0.5, dot(vC, vec3(0.333)));  // the bore stays matte
  float h = max(dot(n, normalize(uL + V)), 0.0);
  col += vec3(1.0, 0.99, 0.96) * metal * (0.85 * pow(h, 70.0) + 0.12 * pow(h, 8.0));
  col = mix(col, uBoardTone, 0.85 * uDim);
  gl_FragColor = vec4(mix(col, uFogCol, smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition))), 1.0);
}`;
const rodGeoCache = new Map<string, Any>();
const rodGeo = (len: number, r: number, bore: number) => {
  const key = `${len}:${r}:${bore}`;
  const have = rodGeoCache.get(key);
  if (have) return have;
  // local frame: +Y runs from the open mouth (y 0) into the rod; the far end is closed
  const rim = lathe([[bore, 0], [r, 0]], 72, ROD_COLOR.rim);
  const shell = lathe([[r, 0], [r, len], [0.0001, len]], 72, ROD_COLOR.zirc);
  const wall = lathe([[bore, len - 1], [bore, 0]], 72, ROD_COLOR.bore);
  const floor = lathe([[0.0001, len - 1], [bore, len - 1]], 72, ROD_COLOR.bore);
  const g = merge([rim, shell, wall, floor]);
  rodGeoCache.set(key, g);
  return g;
};
/** an open fuel rod lying along `dir` (horizontal unit vector, into the rod) from its open `mouth` (the axis centre at the
 *  mouth; mouth y = the axis height, usually the pellets' radius, so it rests on the board). r = outer radius, bore = inner. */
export const FuelRod: React.FC<{ mouth: V3; dir: V3; len: number; r: number; bore: number; dim?: number }> = ({ mouth, dir, len, r, bore, dim = 0 }) => {
  const o = useMemo(() => {
    const u = sharedUniforms();
    const mat = new THREE.ShaderMaterial({
      vertexShader: ROD_VERT,
      fragmentShader: ROD_FRAG,
      side: THREE.DoubleSide,
      uniforms: { uL: u.uL, uFogRange: u.uFogRange, uFogCol: u.uFogCol, uBoardTone: u.uBoardTone, uDim: { value: 0 } },
    });
    return { me: mesh(rodGeo(len, r, bore), mat, 1), mat };
  }, [len, r, bore]);
  const dd = norm3(dir);
  o.mat.uniforms.uDim.value = c01(dim);
  o.me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dd[0], dd[1], -dd[2]));
  o.me.position.set(mouth[0], mouth[1], -mouth[2]);
  return <primitive object={o.me} />;
};
export const fuelRodShadowItems = (mouth: V3, dir: V3, len: number, r: number, alpha = 1): ShadowItem[] => {
  const dd = norm3([dir[0], 0, dir[2]]);
  const off = (mouth[1] + r) * SHADOW_LEN * 0.5;
  return [{ x: mouth[0] + SHADOW_DIR[0] * off, z: mouth[2] + SHADOW_DIR[1] * off, len, r: r * 1.02, dirX: dd[0], dirZ: dd[2], alpha }];
};
