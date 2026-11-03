// energyPlants: the lineup of scott-nolan-wind: five power plants, each on its own low cream plinth with a socket on its
// front face. One mesh per plinth+plant (one object, one board shadow; its parts throw analytic contact shadows on the
// plinth top), plus the moving parts: coal smoke, gas haze, the turbine's rotor, the glint on the panels, the amber core.
// Proportions are real within each plant (see the notes per plant); across the row the footprints are normalised.
import React, { useMemo } from "react";
import { SHADOW_LEN, SoftShadows, nuclearMaterial, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import {
  COMMON_GLSL,
  D2R,
  EW_COLOR,
  LINEUP,
  PLINTH,
  SOCKET,
  THREE,
  c01,
  cyl,
  energyClay,
  flipZ,
  hash01,
  lathe,
  merge,
  mesh,
  paint,
  rbox,
  sharedUniforms,
  smooth,
  vec3Of,
  type Any,
  type PlantKind,
  type ShadowCap,
  type V3,
} from "./energyCore";

// ===================================================================================================================
// PLANT DIMENSIONS (local to the plinth: x across, y up from the plinth top, z away, origin at the plinth's centre)
// ===================================================================================================================
/** coal: a boiler house, a turbine-hall annex, one tall chimney (about 1:15), a conveyor up from a coal heap */
export const COAL = { CHIMNEY: { x: 76, z: 80, r0: 15, r1: 10, h: 400 }, HEAP: { x: -60, z: -4, r: 40, h: 30 }, BOILER: { x: -30, z: 56, w: 84, h: 112, d: 78 } } as const;
/** gas: a low turbine hall and two heat-recovery boilers, each with a short stack */
export const GAS = { STACKS: [{ x: 26, z: 92 }, { x: 66, z: 92 }], STACK: { r0: 10, r1: 8.5, h: 172 } } as const;
/** nuclear: a hyperboloid cooling tower (base r ~0.32 H, throat at 0.76 H, open top) beside a cutaway containment dome */
export const NUCLEAR = {
  TOWER: { x: -24, z: 40, h: 220, rBase: 70, rThroat: 44, yThroat: 168, legs: 13 },
  DOME: { x: 66, z: -6, r: 30, wall: 40, openDir: 184, openHalf: 50 },
  CORE: { r: 12.5, y0: 7, h: 20 },
} as const;
/** wind: hub height 300, rotor diameter 300 (about the hub height, as on a real modern turbine), three slim blades */
export const WIND = { x: 6, z: 50, hub: 300, blade: 150, yaw: 18, R0: 8.5, R1: 4.8 } as const;
/** solar: four rows of tilted panels facing the camera (south), modules on short legs */
export const SOLAR = { rows: [92, 60, 28, -4], len: 178, slope: 28, tilt: 25, y0: 6 } as const;

const hyper = (y: number) => {
  const T = NUCLEAR.TOWER;
  const b = T.yThroat / Math.sqrt((T.rBase / T.rThroat) ** 2 - 1);
  return T.rThroat * Math.sqrt(1 + ((y - T.yThroat) / b) ** 2);
};
/** the cooling tower's outside radius at height y above the plinth top */
export const coolingTowerRadius = hyper;

// ===================================================================================================================
// THE PLINTH (rounded block, socket on the front face)
// ===================================================================================================================
const socketGeo = () => {
  const r = SOCKET.r;
  // profile (radius, height out of the face); the lathe's axis turns to -Z (out of the front face)
  const rim = lathe([[r + 5, -0.2], [r + 5, 0.8], [r + 3.8, 2.3], [r + 1.8, 2.9], [r + 0.4, 2.2], [r, 0.6], [r, -3.4]], 48, EW_COLOR.plinth);
  const floor = lathe([[r, -3.4], [0.0001, -3.4]], 48, EW_COLOR.hollow);
  const holes = [-1, 1].map((s) => {
    const h = new THREE.CylinderGeometry(SOCKET.PIN_R, SOCKET.PIN_R, 0.6, 20);
    h.translate(s * SOCKET.PIN_DX, -3.2, 0);
    return paint(h, EW_COLOR.well);
  });
  const g = merge([rim, floor, ...holes]);
  g.rotateX(-Math.PI / 2);
  g.translate(0, SOCKET.y, -PLINTH.D / 2);
  return g;
};
const plinthGeo = () => [rbox(PLINTH.W, PLINTH.H, PLINTH.D, 0, 0, 0, PLINTH.R, EW_COLOR.plinth, 4), socketGeo()];

// ===================================================================================================================
// THE FIVE PLANTS: geometry (local, y = 0 at the plinth top), contact casters on the plinth top, board casters
// ===================================================================================================================
type Built = { parts: Any[]; occ: ShadowCap[]; board: { x: number; z: number; h: number; r: number }[] };
const T = PLINTH.H;
const up = (g: Any) => {
  g.translate(0, T, 0);
  return g;
};
const gridCaps = (cx: number, cz: number, w: number, d: number, h: number, r: number): ShadowCap[] => {
  const out: ShadowCap[] = [];
  const nx = Math.max(1, Math.round(w / (r * 1.4)));
  const nz = Math.max(1, Math.round(d / (r * 1.4)));
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = cx - w / 2 + r * 0.7 + (nx === 1 ? (w - r * 1.4) / 2 : (i * (w - r * 1.4)) / (nx - 1));
      const z = cz - d / 2 + r * 0.7 + (nz === 1 ? (d - r * 1.4) / 2 : (j * (d - r * 1.4)) / (nz - 1));
      out.push({ x, z, len: h * SHADOW_LEN, r });
    }
  return out;
};

const coalParts = (): Built => {
  const C = COAL;
  const B = C.BOILER;
  const parts: Any[] = [];
  parts.push(rbox(B.w, B.h, B.d, B.x, 0, B.z, 3, EW_COLOR.cream));
  parts.push(rbox(B.w - 30, 14, B.d - 30, B.x - 4, B.h - 1, B.z + 4, 2, EW_COLOR.cream));
  // the turbine-hall annex with a low gable roof
  parts.push(rbox(52, 58, 66, 34, 0, 52, 3, EW_COLOR.cream));
  const gable = new THREE.CylinderGeometry(36, 36, 52, 3, 1, false);
  gable.rotateZ(Math.PI / 2);
  gable.rotateX(-Math.PI / 2);
  gable.scale(1, 0.3, 1.02);
  gable.translate(34, 58 + 5.4 - 0.5, 52);
  parts.push(paint(gable, EW_COLOR.creamFoot));
  // the chimney: tapered, a corbelled lip, open top with a dark throat
  const K = C.CHIMNEY;
  const prof: [number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    prof.push([K.r0 + (K.r1 - K.r0) * t, 3 + (K.h - 16) * t]);
  }
  const chim = lathe([[K.r0 + 2.5, 0], [K.r0 + 2.5, 3], ...prof, [K.r1 + 1.6, K.h - 12], [K.r1 + 1.6, K.h - 3], [K.r1 + 0.6, K.h], [K.r1 - 1.6, K.h]], 40, EW_COLOR.cream);
  chim.translate(K.x, 0, K.z);
  parts.push(chim);
  const throat = lathe([[K.r1 - 1.6, K.h], [K.r1 - 1.6, K.h - 30], [0.001, K.h - 30]], 32, EW_COLOR.well);
  throat.translate(K.x, 0, K.z);
  parts.push(throat);
  // a ring band near the top (reads as the chimney's real banding, in tone)
  const band = lathe([[K.r1 + 0.95, K.h - 44], [K.r1 + 0.95, K.h - 30]], 40, EW_COLOR.creamFoot, 0, Math.PI * 2);
  band.translate(K.x, 0, K.z);
  parts.push(band);
  // the coal heap: a lumpy low mound, deep brown
  const H = C.HEAP;
  const heap = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = heap.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const lump = 1 + 0.07 * Math.sin(a * 5 + 1.3) + 0.05 * Math.sin(a * 9 + 0.4) + 0.06 * Math.sin(y * 7 + a * 3);
    const ry = Math.pow(Math.max(0, y), 0.85);
    p.setXYZ(i, x * H.r * lump * 1.15, ry * H.h * (0.94 + 0.08 * Math.sin(a * 4)), z * H.r * lump * 0.82);
  }
  heap.computeVertexNormals();
  heap.translate(H.x, 0, H.z);
  parts.push(paint(heap, EW_COLOR.coal));
  // the conveyor: a slim gantry from the heap up into the boiler house
  const a0 = new THREE.Vector3(H.x + 10, 20, H.z + 10);
  const a1 = new THREE.Vector3(B.x - 6, 86, B.z - B.d / 2 + 2);
  const len = a0.distanceTo(a1);
  const conv = new THREE.BoxGeometry(9, 6, len);
  conv.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), a1.clone().sub(a0).normalize()));
  conv.translate((a0.x + a1.x) / 2, (a0.y + a1.y) / 2, (a0.z + a1.z) / 2);
  parts.push(paint(conv, EW_COLOR.creamFoot));
  // its one leg
  parts.push(cyl(2.2, 2.2, 46, (a0.x + a1.x) / 2 + 4, 0, (a0.z + a1.z) / 2 - 2, EW_COLOR.creamFoot, 10));
  const occ: ShadowCap[] = [
    ...gridCaps(B.x, B.z, B.w, B.d, B.h, 26),
    ...gridCaps(34, 52, 52, 66, 66, 22),
    { x: K.x, z: K.z, len: K.h * SHADOW_LEN, r: K.r0 },
    { x: H.x, z: H.z, len: H.h * SHADOW_LEN * 0.8, r: H.r * 0.8 },
  ];
  return { parts, occ, board: [{ x: K.x, z: K.z, h: T + K.h, r: K.r0 * 1.05 }, { x: B.x, z: B.z, h: T + B.h, r: 40 }] };
};

const gasParts = (): Built => {
  const parts: Any[] = [];
  // turbine hall with a low vault
  parts.push(rbox(108, 48, 72, -36, 0, 52, 3, EW_COLOR.cream));
  const vault = new THREE.CylinderGeometry(58, 58, 104, 40, 1, false, -0.66, 1.32);
  vault.rotateZ(Math.PI / 2);
  vault.rotateX(-Math.PI / 2);
  vault.translate(-36, 48 - 58 * Math.cos(0.66) + 0.5, 52);
  parts.push(paint(vault, EW_COLOR.cream));
  // the two heat-recovery boilers, each with its stack behind
  for (const s of GAS.STACKS) {
    parts.push(rbox(30, 96, 60, s.x, 0, 52, 2.5, EW_COLOR.cream));
    // the duct from the hall into the boiler
    parts.push(rbox(14, 26, 34, s.x - 19, 14, 50, 2, EW_COLOR.creamFoot));
    const K = GAS.STACK;
    const st = lathe([[K.r0 + 1.8, 0], [K.r0 + 1.8, 3], [K.r0, 5], [K.r1, K.h - 6], [K.r1 + 1.4, K.h - 5], [K.r1 + 1.4, K.h - 1], [K.r1 + 0.4, K.h], [K.r1 - 1.4, K.h]], 32, EW_COLOR.cream);
    st.translate(s.x, 0, s.z);
    parts.push(st);
    const th = lathe([[K.r1 - 1.4, K.h], [K.r1 - 1.4, K.h - 20], [0.001, K.h - 20]], 24, EW_COLOR.well);
    th.translate(s.x, 0, s.z);
    parts.push(th);
  }
  // the gas line: a pipe on two low supports, in from the plinth's left edge to the hall
  const pipe = new THREE.CylinderGeometry(4.2, 4.2, 26, 16);
  pipe.rotateZ(Math.PI / 2);
  pipe.translate(-PLINTH.W / 2 + 13, 12, 6);
  parts.push(paint(pipe, EW_COLOR.creamFoot));
  const occ: ShadowCap[] = [...gridCaps(-36, 52, 108, 72, 56, 24)];
  for (const s of GAS.STACKS) occ.push(...gridCaps(s.x, 52, 30, 60, 96, 15), { x: s.x, z: s.z, len: GAS.STACK.h * SHADOW_LEN, r: GAS.STACK.r0 });
  return { parts, occ, board: GAS.STACKS.map((s) => ({ x: s.x, z: s.z, h: T + GAS.STACK.h, r: GAS.STACK.r0 })) };
};

const nuclearParts = (): { built: Built; glass: Any; core: Any } => {
  const parts: Any[] = [];
  const TW = NUCLEAR.TOWER;
  // the shell: outside up from the legs, over the lip, inside back down (the inside in the hollow tone)
  const N = 40;
  const outer: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const y = TW.legs + ((TW.h - TW.legs) * i) / N;
    outer.push([hyper(y), y]);
  }
  const t = 2.6;
  const shellOut = lathe([[hyper(TW.legs) + 1.2, TW.legs], [hyper(TW.legs) + 1.2, TW.legs + 2.5], ...outer.slice(1), [hyper(TW.h) - 0.4, TW.h + 0.6]], 96, EW_COLOR.cream);
  const inner = outer.map(([r, y]): [number, number] => [r - t, y]).reverse();
  const shellIn = lathe([[hyper(TW.h) - t, TW.h + 0.6], ...inner], 96, EW_COLOR.hollow);
  const legs: Any[] = [];
  const nLegs = 36;
  for (let i = 0; i < nLegs; i++) {
    for (const s of [-1, 1]) {
      const a0 = ((i + 0.5 * s * 0.5) / nLegs) * Math.PI * 2;
      const a1 = ((i + 0.5 + 0.5 * s * 0.5) / nLegs) * Math.PI * 2;
      const r0 = hyper(0) + 1.5;
      const r1 = hyper(TW.legs) - 0.5;
      const p0 = new THREE.Vector3(Math.sin(a0) * r0, 0, Math.cos(a0) * r0);
      const p1 = new THREE.Vector3(Math.sin(a1) * r1, TW.legs + 1, Math.cos(a1) * r1);
      const g = new THREE.CylinderGeometry(1.5, 1.5, p0.distanceTo(p1), 6);
      g.translate(0, p0.distanceTo(p1) / 2, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
      g.applyQuaternion(q);
      g.translate(p0.x, p0.y, p0.z);
      legs.push(paint(g, EW_COLOR.cream));
    }
  }
  const basin = lathe([[0.001, 0.6], [hyper(0) - 2, 0.6]], 64, EW_COLOR.hollow);
  for (const g of [shellOut, shellIn, ...legs, basin]) {
    g.translate(TW.x, 0, TW.z);
    parts.push(g);
  }
  // the containment: a wall and a hemispherical dome, a wedge cut toward the camera (glazed), the core inside
  const D = NUCLEAR.DOME;
  const prof = (r: number): [number, number][] => {
    const pts: [number, number][] = [[r, 0], [r, D.wall]];
    for (let i = 1; i <= 16; i++) {
      const a = (i / 16) * (Math.PI / 2);
      pts.push([r * Math.cos(a), D.wall + r * Math.sin(a)]);
    }
    return pts;
  };
  const ro = D.r;
  const ri = D.r - 3;
  const c = D.openDir * D2R;
  const h = D.openHalf * D2R;
  const p0 = c + h;
  const pl = Math.PI * 2 - 2 * h;
  const domeOut = lathe(prof(ro), 72, EW_COLOR.cream, p0, pl);
  const domeIn = lathe(prof(ri), 72, EW_COLOR.hollow, p0, pl);
  const ring = lathe([[ro + 2.2, 0], [ro + 2.2, 4], [ro, 5]], 72, EW_COLOR.cream);
  const cutFace = (phi: number) => {
    const po = prof(ro);
    const pi = prof(ri);
    const pos: number[] = [];
    const idx: number[] = [];
    const s = Math.sin(phi);
    const cc = Math.cos(phi);
    for (let i = 0; i < po.length; i++) {
      pos.push(po[i][0] * s, po[i][1], po[i][0] * cc, pi[i][0] * s, pi[i][1], pi[i][0] * cc);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return paint(g, EW_COLOR.creamFoot);
  };
  const floorD = lathe([[0.001, 0.8], [ri, 0.8]], 48, EW_COLOR.hollow);
  const C = NUCLEAR.CORE;
  const pedestal = lathe([[C.r + 3, 0.8], [C.r + 3, C.y0 - 1], [C.r + 1.5, C.y0], [0.001, C.y0]], 40, EW_COLOR.creamFoot);
  // a ring of the vessel's lower shell round the core, so the amber sits in something
  const cup = lathe([[C.r + 2.2, C.y0], [C.r + 2.2, C.y0 + 7], [C.r + 1.2, C.y0 + 7], [C.r + 1.2, C.y0 + 1]], 40, EW_COLOR.cream);
  for (const g of [domeOut, domeIn, ring, cutFace(p0), cutFace(p0 + pl), floorD, pedestal, cup]) {
    g.translate(D.x, 0, D.z);
    parts.push(g);
  }
  const glass = lathe(prof(ro + 0.25), 48, EW_COLOR.cream, c - h, 2 * h);
  glass.translate(D.x, T, D.z);
  // the amber core: fuel assemblies as a square lattice inside a circle (reactorVessel's look, at this scale)
  const cells: Any[] = [];
  const CELL = 4.4;
  const n = Math.ceil(C.r / CELL) + 1;
  let k = 0;
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const x = i * CELL;
      const z = j * CELL;
      if (Math.hypot(Math.abs(x) + CELL * 0.3, Math.abs(z) + CELL * 0.3) > C.r) continue;
      const b = new THREE.BoxGeometry(CELL - 0.35, C.h, CELL - 0.35);
      b.translate(D.x + x, T + C.y0 + C.h / 2, D.z + z);
      b.setAttribute("aPh", new THREE.BufferAttribute(new Float32Array(b.attributes.position.count).fill(hash01(k++ + 7)), 1));
      cells.push(b);
    }
  const core = mergeCore(cells);
  const occ: ShadowCap[] = [
    { x: TW.x, z: TW.z, len: TW.h * SHADOW_LEN, r: TW.rBase * 0.86 },
    { x: D.x, z: D.z, len: (D.wall + D.r) * SHADOW_LEN, r: D.r * 0.95 },
  ];
  return {
    built: { parts, occ, board: [{ x: TW.x, z: TW.z, h: T + TW.h, r: TW.rBase * 0.8 }, { x: D.x, z: D.z, h: T + D.wall + D.r, r: D.r }] },
    glass: flipZ(glass),
    core: flipZ(core),
  };
};
const mergeCore = (cells: Any[]) => {
  // keep position, normal, uv and aPh (BoxGeometry carries all four)
  const list = cells.map((c) => c.toNonIndexed());
  const total = list.reduce((s: number, g: Any) => s + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2], ["aPh", 1]] as const) {
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of list) {
      arr.set(g.attributes[name].array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
};

const windParts = (): Built => {
  const W = WIND;
  const parts: Any[] = [];
  parts.push(cyl(24, 24, 3, W.x, 0, W.z, EW_COLOR.creamFoot, 40));
  const prof: [number, number][] = [[W.R0 + 2.5, 0], [W.R0 + 2.5, 3], [W.R0, 4.5]];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    prof.push([W.R0 + (W.R1 - W.R0) * t, 4.5 + (W.hub - 4.5) * t]);
  }
  prof.push([W.R1 - 0.4, W.hub + 0.4], [0.001, W.hub + 0.4]);
  const tower = lathe(prof, 32, EW_COLOR.cream);
  tower.translate(W.x, 0, W.z);
  parts.push(tower);
  return {
    parts,
    occ: [{ x: W.x, z: W.z, len: W.hub * SHADOW_LEN * 0.6, r: W.R0 }, { x: W.x, z: W.z, len: 6, r: 24 }],
    board: [{ x: W.x, z: W.z, h: T + W.hub, r: W.R0 * 1.2 }],
  };
};

/** a blade in rotor-local three space: span along +Y from the hub, chord along X, thickness along Z */
const bladeGeo = (len: number) => {
  const NS = 22;
  const NC = 14;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS;
    const r = 5 + (len - 5) * t;
    const root = 1 - smooth(0.03, 0.16, t);
    const chord = root * 7.6 + (1 - root) * (t < 0.22 ? 7.6 + (14 - 7.6) * smooth(0.06, 0.22, t) : 14 - (14 - 3.0) * ((t - 0.22) / 0.78));
    const thick = root * 7.6 + (1 - root) * (4.2 - 3.0 * t);
    const tw = (16 - 15 * t) * D2R * (1 - root);
    for (let j = 0; j < NC; j++) {
      const a = (j / NC) * Math.PI * 2;
      // leading edge rounder than the trailing edge
      const cx = Math.cos(a);
      const x = (chord / 2) * cx + (cx > 0 ? 0 : 0.18 * chord * cx * (1 - root));
      const z = (thick / 2) * Math.sin(a) * (cx > 0 ? 1 : 0.7 + 0.3 * root);
      pos.push(x * Math.cos(tw) - z * Math.sin(tw), r, x * Math.sin(tw) + z * Math.cos(tw));
      if (i > 0) {
        const a0 = (i - 1) * NC + j;
        const a1 = (i - 1) * NC + ((j + 1) % NC);
        const b0 = i * NC + j;
        const b1 = i * NC + ((j + 1) % NC);
        idx.push(a0, b0, b1, a0, b1, a1);
      }
    }
  }
  // tip cap
  const tip = pos.length / 3;
  pos.push(0, len + 1.2, 0);
  for (let j = 0; j < NC; j++) idx.push(NS * NC + j, tip, NS * NC + ((j + 1) % NC));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return paint(g, EW_COLOR.cream);
};
/** the head in head-local three space (+z toward the camera before the yaw): nacelle, then the rotor (spins about z) */
const headGeos = () => {
  const nac = rbox(15, 16, 50, 0, -8, -14, 5, EW_COLOR.cream, 3);
  const spinner = lathe([[8.4, 0], [8.2, 5], [6.6, 10], [3.6, 14], [0.001, 15.6]], 32, EW_COLOR.cream);
  spinner.rotateX(Math.PI / 2);
  spinner.translate(0, 0, 11);
  const blades: Any[] = [];
  for (let i = 0; i < 3; i++) {
    const b = bladeGeo(WIND.blade);
    b.rotateZ((i * 2 * Math.PI) / 3);
    b.translate(0, 0, 15);
    blades.push(b);
  }
  return { nacelle: merge([nac]), rotor: merge([spinner, ...blades]) };
};

// ---- solar: the frames are clay, the cells their own shader (modules, cells, one travelling glint) ----------------
const solarParts = (): { built: Built; cells: Any } => {
  const S = SOLAR;
  const parts: Any[] = [];
  const cellGeos: Any[] = [];
  const occ: ShadowCap[] = [];
  const tilt = S.tilt * D2R;
  const dz = (S.slope / 2) * Math.cos(tilt);
  const dy = (S.slope / 2) * Math.sin(tilt);
  for (const rz of S.rows) {
    const yc = S.y0 + dy;
    // frame slab, tilted about X so its face looks toward -Z and up
    const slab = new THREE.BoxGeometry(S.len, 2.4, S.slope);
    slab.rotateX(-tilt);
    slab.translate(0, yc, rz);
    parts.push(paint(slab, EW_COLOR.cream));
    // the cells: a plane on the slab's face, inset by the frame
    const pl = new THREE.PlaneGeometry(S.len - 4, S.slope - 4);
    pl.rotateX(-Math.PI / 2);
    pl.translate(0, 1.25, 0);
    pl.rotateX(-tilt);
    pl.translate(0, yc, rz);
    cellGeos.push(pl);
    // legs: a front and a back post at three stations
    for (const lx of [-S.len * 0.38, 0, S.len * 0.38]) {
      parts.push(cyl(1.6, 1.6, S.y0 + 0.5, lx, 0, rz - dz * 0.8, EW_COLOR.creamFoot, 8));
      parts.push(cyl(1.6, 1.6, S.y0 + dy * 2 - 0.5, lx, 0, rz + dz * 0.8, EW_COLOR.creamFoot, 8));
    }
    for (let i = 0; i < 7; i++) occ.push({ x: -S.len / 2 + 13 + (i * (S.len - 26)) / 6, z: rz + dz * 0.4, len: (S.y0 + dy * 2) * SHADOW_LEN * 1.6, r: 11 });
  }
  const cells = merge(cellGeos.map((g: Any) => paint(g, EW_COLOR.cell)));
  return { built: { parts, occ, board: [] }, cells };
};
const CELL_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CELL_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uCell; uniform vec3 uFrame; uniform vec3 uGlintC; uniform float uGlint; uniform float uDim; uniform float uX0; uniform float uX1;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
float lineAt(float v, float n, float w) { float f = abs(fract(v * n + 0.5) - 0.5) / n; return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(v) * 1.2, f); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 cell = uCell * mix(0.86, 1.0, smoothstep(-0.2, 0.9, dot(n, uL)));
  // modules: 8 along the row, 2 up the slope; cells 4 x 3 per module
  float mod1 = max(lineAt(vU.x, 8.0, 0.006), lineAt(vU.y, 2.0, 0.035));
  float cellL = max(lineAt(vU.x, 32.0, 0.0022), lineAt(vU.y, 6.0, 0.016));
  vec3 col = mix(cell, mix(cell, uFrame, 0.32), cellL);
  col = mix(col, uFrame * 0.94, mod1);
  // a faint sky sheen, stronger at grazing
  col += vec3(0.05, 0.04, 0.03) * pow(1.0 - abs(dot(n, V)), 2.0);
  // the glint: one soft diagonal band travelling along the plot
  float x = (vW.x - uX0) / (uX1 - uX0) + 0.35 * vU.y;
  float g = exp(-pow((x - uGlint) / 0.075, 2.0));
  col = mix(col, uGlintC, 0.62 * g * (1.0 - mod1 * 0.5));
  col = mix(col, uBoardTone * 0.62, uDim * 0.5);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;

// ---- the amber core (reactorVessel's look: assemblies with dark seams, a hot top, a slow soft shimmer) -----------
const CORE_VERT = /* glsl */ `
attribute float aPh;
varying vec3 vW; varying vec3 vN; varying vec2 vU; varying float vPh;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv; vPh = aPh;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CORE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uS;
varying vec3 vW; varying vec3 vN; varying vec2 vU; varying float vPh;
void main() {
  vec3 n = normalize(vN);
  float lit = smoothstep(-0.55, 0.85, dot(n, uL));
  vec3 col = mix(uAmberFoot, uAmberTop, lit);
  float side = 1.0 - step(0.5, abs(n.y));
  float ex = min(vU.x, 1.0 - vU.x);
  float ey = min(vU.y, 1.0 - vU.y);
  float seam = side > 0.5 ? ex : min(ex, ey);
  col *= mix(0.72, 1.0, smoothstep(0.0, 0.14, seam));
  col = mix(col, uAmberHot, 0.42 * (1.0 - side));
  float sh = 0.5 + 0.5 * sin(uS * 0.17 - vW.y * 0.2 + vPh * 6.28318);
  col = mix(col, uAmberHot, 0.08 * sh * sh);
  gl_FragColor = vec4(col, 1.0);
}`;

// ===================================================================================================================
// SMOKE AND HAZE: soft lit puffs born at a stack's mouth, a pure function of the story clock
// ===================================================================================================================
const SMOKE_VERT = /* glsl */ `
attribute vec4 aC;   // centre xyz (three), radius
attribute vec2 aA;   // alpha, seed
varying vec2 vQ; varying float vA; varying float vSeed; varying vec3 vW;
void main() {
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 wp = aC.xyz + (right * position.x + upv * position.y) * aC.w;
  vQ = position.xy; vA = aA.x; vSeed = aA.y; vW = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const SMOKE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uLitC; uniform vec3 uShadeC; uniform float uS;
varying vec2 vQ; varying float vA; varying float vSeed; varying vec3 vW;
void main() {
  float r = length(vQ);
  if (r > 1.0) discard;
  float nz = vn(vQ * 2.2 + vec2(vSeed * 17.0, uS * 0.004)) * 0.6 + vn(vQ * 4.6 - vec2(vSeed * 9.0, 0.0)) * 0.4;
  float edge = 1.0 - smoothstep(0.36, 1.0, r + (nz - 0.5) * 0.55);
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 fwd = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  vec3 nrm = normalize(right * vQ.x + upv * vQ.y + fwd * sqrt(max(0.0, 1.0 - r * r)));
  float lit = smoothstep(-0.55, 0.85, dot(nrm, uL));
  vec3 col = mix(uShadeC, uLitC, lit);
  float fg = fogAt(vW);
  gl_FragColor = vec4(mix(col, uFogCol, fg), edge * vA * (1.0 - fg));
}`;
export type SmokeKind = "coal" | "gas";
const SMOKE_LOOK: Record<SmokeKind, { life: number; n: number; r0: number; grow: number; rise: number; wind: [number, number]; alpha: number; lit: string; shade: string }> = {
  coal: { life: 120, n: 26, r0: 10, grow: 3.6, rise: 1.25, wind: [0.75, 0.55], alpha: 0.82, lit: EW_COLOR.smokeLit, shade: EW_COLOR.smokeShade },
  gas: { life: 64, n: 12, r0: 7, grow: 2.2, rise: 1.05, wind: [0.55, 0.4], alpha: 0.22, lit: EW_COLOR.hazeLit, shade: EW_COLOR.hazeShade },
};
export type SmokeProps = { at: V3; S: number; kind?: SmokeKind; amount?: number; seed?: number };
/** a plume out of the stack mouth `at` (world). amount 0..~1.6 scales its density and size. */
export const Smoke: React.FC<SmokeProps> = ({ at, S, kind = "coal", amount = 1, seed = 0 }) => {
  const L = SMOKE_LOOK[kind];
  const o = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const C = new THREE.InstancedBufferAttribute(new Float32Array(L.n * 4), 4);
    const A = new THREE.InstancedBufferAttribute(new Float32Array(L.n * 2), 2);
    g.setAttribute("aC", C);
    g.setAttribute("aA", A);
    const m = new THREE.ShaderMaterial({
      vertexShader: SMOKE_VERT,
      fragmentShader: SMOKE_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { ...sharedUniforms(), uLitC: { value: vec3Of(L.lit) }, uShadeC: { value: vec3Of(L.shade) }, uS: { value: 0 } },
    });
    const me = mesh(g, m, 30);
    return { me, g, C, A, m };
  }, [L]);
  const dt = L.life / L.n;
  const k0 = Math.floor(S / dt);
  let w = 0;
  for (let j = L.n - 1; j >= 0; j--) {
    const k = k0 - j;
    const age = S - k * dt;
    const u = age / L.life;
    const h = hash01(k * 3.1 + seed * 11.7);
    const h2 = hash01(k * 7.3 + seed * 5.1 + 2);
    const rise = L.rise * age * (1 - 0.3 * u) * (0.9 + 0.2 * h);
    const drift = Math.pow(age, 1.15) * (0.85 + 0.3 * h2);
    const wob = Math.sin(age * 0.045 + h * 6.28) * 7 * u;
    const x = at[0] + L.wind[0] * drift + wob;
    const y = at[1] + rise + 2;
    const z = at[2] + L.wind[1] * drift + wob * 0.6;
    const r = L.r0 * (1 + L.grow * Math.pow(u, 0.75)) * (0.85 + 0.3 * h2) * (0.75 + 0.25 * Math.min(1.6, amount));
    const a = L.alpha * Math.min(1, amount) * smooth(0, 0.07, u) * (1 - smooth(0.5, 1, u)) * (0.8 + 0.2 * h);
    o.C.setXYZW(w, x, y, -z, r);
    o.A.setXY(w, a, h * 10);
    w++;
  }
  o.g.instanceCount = amount > 0 ? L.n : 0;
  o.C.needsUpdate = o.A.needsUpdate = true;
  o.m.uniforms.uS.value = S;
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE PLANT COMPONENT
// ===================================================================================================================
type PlantMeshes = { body: Any; mat: Any; board: ShadowItem[]; extra: Any[]; cellMat?: Any; coreMat?: Any; head?: Any; rotor?: Any };
const cache = new Map<PlantKind, { geo: Any; occ: ShadowCap[]; board: Built["board"]; glass?: Any; core?: Any; cells?: Any; head?: { nacelle: Any; rotor: Any } }>();
const plantGeo = (kind: PlantKind) => {
  const have = cache.get(kind);
  if (have) return have;
  let b: Built;
  let glass: Any;
  let core: Any;
  let cells: Any;
  let head: { nacelle: Any; rotor: Any } | undefined;
  if (kind === "coal") b = coalParts();
  else if (kind === "gas") b = gasParts();
  else if (kind === "nuclear") {
    const n = nuclearParts();
    b = n.built;
    glass = n.glass;
    core = n.core;
  } else if (kind === "wind") {
    b = windParts();
    head = headGeos();
  } else {
    const s = solarParts();
    b = s.built;
    cells = flipZ(up(s.cells));
  }
  const geo = flipZ(merge([...plinthGeo(), ...b.parts.map(up)]));
  const entry = { geo, occ: b.occ, board: b.board, glass, core, cells, head };
  cache.set(kind, entry);
  return entry;
};
/** the board shadow items of a plinth and its plant (world), for one SoftShadows layer */
export const plantShadowItems = (kind: PlantKind, alpha = 1): ShadowItem[] => {
  const [X, Z] = LINEUP[kind];
  const out: ShadowItem[] = [];
  // the plinth: discs inset from its footprint, thrown by its height
  const r = 34;
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      if (i > 0 && i < 4 && j > 0 && j < 4) continue;
      out.push({ x: X - PLINTH.W / 2 + 26 + (i * (PLINTH.W - 52)) / 4, z: Z - PLINTH.D / 2 + 26 + (j * (PLINTH.D - 52)) / 4, len: PLINTH.H * SHADOW_LEN, r, soft: 12, alpha });
    }
  for (const c of plantGeo(kind).board) out.push({ x: X + c.x, z: Z + c.z, len: c.h * SHADOW_LEN, r: c.r, alpha: alpha * 0.9 });
  return out;
};

export type PlantProps = {
  kind: PlantKind;
  /** story clock (frames): smoke, rotor, glint, core shimmer */
  S: number;
  /** 0 normal .. 1 receded to the board tone */
  dim?: number;
  /** 0 normal .. 1 lifted toward bright cream (the subject) */
  lift?: number;
  /** smoke / haze density (coal and gas; default 1) */
  smoke?: number;
  /** the rotor's angle in degrees (wind); default turns 3 deg per frame of S */
  spin?: number;
  /** the glint's position along the solar plot (0..1 crosses it); default travels with S */
  glint?: number;
  /** draw this plant's own board shadow (false when a Lineup gathers them) */
  shadow?: boolean;
};
/** one plinth with its plant, at its LINEUP place */
export const Plant: React.FC<PlantProps> = ({ kind, S, dim = 0, lift = 0, smoke = 1, spin, glint, shadow = true }) => {
  const [X, Z] = LINEUP[kind];
  const o = useMemo((): PlantMeshes => {
    const g = plantGeo(kind);
    const occW = g.occ.map((c) => ({ ...c, x: c.x + X, z: c.z + Z }));
    const mat = energyClay(occW, PLINTH.H);
    const body = mesh(g.geo, mat, 1);
    body.position.set(X, 0, -Z);
    const extra: Any[] = [];
    let cellMat: Any;
    let coreMat: Any;
    let head: Any;
    let rotor: Any;
    if (g.glass) {
      const gm = mesh(g.glass, nuclearMaterial("glass"), 7);
      gm.position.set(X, 0, -Z);
      extra.push(gm);
    }
    if (g.core) {
      coreMat = new THREE.ShaderMaterial({ vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, uniforms: { ...sharedUniforms(), uS: { value: 0 } } });
      const cm = mesh(g.core, coreMat, 2);
      cm.position.set(X, 0, -Z);
      extra.push(cm);
    }
    if (g.cells) {
      cellMat = new THREE.ShaderMaterial({
        vertexShader: CELL_VERT,
        fragmentShader: CELL_FRAG,
        extensions: { derivatives: true },
        uniforms: {
          ...sharedUniforms(),
          uCell: { value: vec3Of(EW_COLOR.cell) },
          uFrame: { value: vec3Of(EW_COLOR.cream) },
          uGlintC: { value: vec3Of("#E8D9BF") },
          uGlint: { value: 0 },
          uDim: { value: 0 },
          uX0: { value: X - SOLAR.len / 2 },
          uX1: { value: X + SOLAR.len / 2 },
        },
      });
      const cm = mesh(g.cells, cellMat, 2);
      cm.position.set(X, 0, -Z);
      extra.push(cm);
    }
    if (g.head) {
      head = new THREE.Group();
      head.position.set(X + WIND.x, PLINTH.H + WIND.hub + 4, -(Z + WIND.z));
      head.rotation.set(0, WIND.yaw * D2R, 0);
      head.add(mesh(g.head.nacelle, mat, 1));
      rotor = mesh(g.head.rotor, mat, 1);
      head.add(rotor);
      extra.push(head);
    }
    return { body, mat, board: [], extra, cellMat, coreMat, head, rotor };
  }, [kind, X, Z]);
  o.mat.uniforms.uDim.value = c01(dim);
  o.mat.uniforms.uLift.value = c01(lift);
  if (o.cellMat) {
    o.cellMat.uniforms.uGlint.value = glint ?? -0.4 + ((S / 110) % 1) * 1.9;
    o.cellMat.uniforms.uDim.value = c01(dim);
  }
  if (o.coreMat) o.coreMat.uniforms.uS.value = S;
  if (o.rotor) o.rotor.rotation.set(0, 0, -(spin ?? S * 3) * D2R);
  const smokeAt = (x: number, y: number, z: number): V3 => [X + x, PLINTH.H + y, Z + z];
  return (
    <>
      {shadow ? <SoftShadows items={plantShadowItems(kind)} /> : null}
      <primitive object={o.body} />
      {o.extra.map((e, i) => (
        <primitive key={i} object={e} />
      ))}
      {kind === "coal" && smoke > 0 ? <Smoke at={smokeAt(COAL.CHIMNEY.x, COAL.CHIMNEY.h, COAL.CHIMNEY.z)} S={S} kind="coal" amount={smoke} seed={1} /> : null}
      {kind === "gas" && smoke > 0
        ? GAS.STACKS.map((s, i) => <Smoke key={i} at={smokeAt(s.x, GAS.STACK.h, s.z)} S={S + i * 23} kind="gas" amount={smoke} seed={3 + i} />)
        : null}
    </>
  );
};

export type LineupProps = {
  S: number;
  /** which plants to draw (default all five) */
  only?: PlantKind[];
  dim?: Partial<Record<PlantKind, number>>;
  lift?: Partial<Record<PlantKind, number>>;
  smoke?: Partial<Record<"coal" | "gas", number>>;
  spin?: number;
  glint?: number;
};
/** the five plants on their plinths, in one row, with one shadow layer */
export const Lineup: React.FC<LineupProps> = ({ S, only, dim = {}, lift = {}, smoke = {}, spin, glint }) => {
  const kinds = (only ?? (["coal", "gas", "nuclear", "wind", "solar"] as PlantKind[])).slice();
  const items = kinds.flatMap((k) => plantShadowItems(k));
  return (
    <>
      <SoftShadows items={items} />
      {kinds.map((k) => (
        <Plant key={k} kind={k} S={S} dim={dim[k]} lift={lift[k]} smoke={k === "coal" || k === "gas" ? smoke[k] ?? 1 : 0} spin={spin} glint={glint} shadow={false} />
      ))}
    </>
  );
};
