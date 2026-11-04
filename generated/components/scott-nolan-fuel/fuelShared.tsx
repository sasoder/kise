// FUEL_SHARED
// ===================================================================================================================
// fuelShared: the reactors of scott-nolan-fuel (Cheeky Pint S4E04, Scott Nolan), on nuclearWorld's stage (scott-nolan-uranium)
// and the energy world's clay (scott-nolan-wind/energyCore). RENDER WITH --gl=angle.
//
// WORLD: X right, Y up (board = 0), Z away. Sizes below are at scale 1; every prop scales with `scale`.
//   <SmrModule at y? scale? rise? dim? yaw? shadow? slot?>  one small modular reactor (a small domed reactor building, no door), SMR_TOP tall
//   <GigawattPlant at y? scale? rise? dim? yaw? shadow? S steam? steamFrom?>   containment + dome, one cooling tower
//   smrShadowItems(at, {scale, rise}), gigawattShadowItems(at, {scale, rise, yaw})   their board shadows (+ the slot ring)
//   smrPortOf(at, {y, scale}), gigawattPortOf(at, {y, scale, rise, yaw})            the dark fuel port's centre (world) and radius
// rise 0..1: the object comes up out of a slot in the surface it stands on (the slot opens as a dark ring first; the surface
// hides the sunk part). dim 0..1: tone to the board (never opacity). The fuel port is ground-dark: nothing in here is amber.
// ===================================================================================================================
import React, { useMemo } from "react";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_LEN, SoftShadows, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { EW_COLOR, THREE, c01, energyClay, flipZ, hash01, lathe, merge, mesh, paint, sharedUniforms, smooth, vec3Of, type Any, type V3 } from "../scott-nolan-wind/energyCore";

const D2R = Math.PI / 180;
const rotXZ = (x: number, z: number, deg: number): [number, number] => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return [x * c - z * s, x * s + z * c];
};
const RISE_SINK = 1.03;

// ===================================================================================================================
// THE FUEL PORT: a collar standing on a crown, a dark socket inside it (the empty fuel opening), ground-toned floor
// ===================================================================================================================
/** the socket's inner wall: a step above the ground, so the opening reads dark but not as a flat black disc */
const PORT_WALL = "#553A27";
const portParts = (r: number, y0: number): Any[] => {
  // a thin low lip, so the port reads as a socket in the head rather than a bottle's neck
  const t = r * 0.2;
  const collar = lathe([[r + t, y0 - t * 1.6], [r + t, y0 + t * 0.2], [r + t * 0.5, y0 + t * 0.65], [r, y0 + t * 0.65], [r, y0 + t * 0.2]], 40, EW_COLOR.creamFoot);
  const wall = lathe([[r, y0 + t * 0.2], [r, y0 - t * 2.2]], 40, PORT_WALL);
  const floor = lathe([[r, y0 - t * 2.2], [0.0001, y0 - t * 2.2]], 40, COLOR.ground);
  return [collar, wall, floor];
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
// SMR MODULE (look v2, director's review Nov 4: the v1 capsule read as a salt shaker). A small reactor building in the same
// family as the gigawatt containment: a short cylinder with a hemispherical dome, about 1.25:1 (height : diameter), a footing
// ring and a springline band, and a small dark fuel hatch in the dome's crown. Plain cream. (v2.1, Nov 4: no door; a dark
// door made the small domes read as igloos or huts. SMR.DOOR_W / DOOR_H stay exported but nothing draws them.)
// ===================================================================================================================
export const SMR = { H: 31.6, R: 12.5, WALL: 18, PORT_R: 2.3, DOOR_W: 4.4, DOOR_H: 7 } as const;
const smrGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const { R, WALL: Wl } = SMR;
    const portR = SMR.PORT_R;
    const collarR = portR * 1.2;
    const prof: [number, number][] = [[0.0001, 0], [R + 1.1, 0], [R + 1.1, 1.8], [R + 0.5, 2.4], [R, 2.6], [R, Wl - 1.4]];
    // the springline band
    prof.push([R + 0.45, Wl - 1.2], [R + 0.6, Wl - 0.8], [R + 0.6, Wl + 0.3], [R + 0.3, Wl + 0.7], [R, Wl + 0.8]);
    for (let i = 1; i <= 26; i++) {
      const a = (i / 26) * (Math.PI / 2);
      const rr = R * Math.cos(a);
      if (rr < collarR) break;
      prof.push([rr, Wl + 0.8 + R * Math.sin(a)]);
    }
    const crownY = Wl + 0.8 + R * Math.sqrt(Math.max(0, 1 - (collarR / R) ** 2));
    prof.push([collarR, crownY]);
    const shell = lathe(prof, 64, EW_COLOR.cream);
    g = flipZ(merge([shell, ...portParts(portR, crownY)]));
    return g;
  };
})();
/** the module's true top (the hatch lip), scale 1 */
export const SMR_TOP = SMR.WALL + 0.8 + SMR.R;

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
/** the fuel port's centre (world) and radius */
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
// GIGAWATT PLANT. A large light water reactor station: the containment (a cylinder with a hemispherical dome, a ring girder
// at the springline, the fuel port on the crown) in front, one natural-draught cooling tower (hyperboloid on crossed columns)
// behind and to the right. Real-leaning proportions: an AP1000-like containment is ~40 m across and ~65 m tall, a tower
// ~150 m; the SMR building stands at SMR_TOP. The tower here is a little short of true scale, so a frame can hold both.
// ===================================================================================================================
export const GIGA = {
  CONT: { x: 0, z: 0, r: 36, wall: 80 },
  TOWER: { x: 132, z: 108, h: 250, rBase: 100, rThroat: 62.5, yThroat: 170, legs: 22 },
} as const;
const GIGA_CONT_TOP = GIGA.CONT.wall + GIGA.CONT.r;
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
    const { r, wall } = GIGA.CONT;
    const portR = GIGA_PORT_R;
    const collarR = portR * 1.2;
    const prof: [number, number][] = [[0.0001, 0], [r + 2.6, 0], [r + 2.6, 4.2], [r + 1.4, 5.2], [r, 5.6], [r, wall - 4.2]];
    // the ring girder at the springline
    prof.push([r + 0.9, wall - 3.8], [r + 1.5, wall - 3], [r + 1.5, wall + 0.8], [r + 0.8, wall + 1.6], [r, wall + 1.8]);
    for (let i = 1; i <= 30; i++) {
      const a = (i / 30) * (Math.PI / 2);
      const rr = r * Math.cos(a);
      if (rr < collarR) break;
      prof.push([rr, wall + 1.8 + (r - 1.8) * Math.sin(a)]);
    }
    const crownY = wall + 1.8 + (r - 1.8) * Math.sqrt(Math.max(0, 1 - (collarR / r) ** 2));
    prof.push([collarR, crownY]);
    // a faint banding of the wall (the concrete lifts), as lathe rings in the foot tone
    const bands: Any[] = [];
    for (const yb of [wall * 0.36, wall * 0.68]) bands.push(lathe([[r + 0.05, yb - 0.5], [r + 0.4, yb - 0.25], [r + 0.4, yb + 0.25], [r + 0.05, yb + 0.5]], 72, EW_COLOR.creamFoot));
    g = flipZ(merge([lathe(prof, 96, EW_COLOR.cream), ...bands, ...portParts(portR, crownY)]));
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
/** the containment's fuel port: centre (world) and radius */
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
