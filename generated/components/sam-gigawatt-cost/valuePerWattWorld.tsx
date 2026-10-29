// ---------------------------------------------------------------------------
// valuePerWattWorld — the 3D pieces of cut 3, MoreValuePerWatt (sam-gigawatt-cost), for aircraftShared's <AirStage
// world>: the plinth, the chip (a cream ceramic package on pins, a board-toned die, the two outlet slots in its right
// face, the plug boot on its top behind the die), the power pole behind-left (post, crossarm, braces, insulators, transformer box), the
// cable from its insulator with the light pulses, the gold bars (two lanes), and ONE ground shadow layer for all of
// them (a canvas redrawn per frame: the union of every object's cast shadow).
// Lit by aircraftShared's side key light (upper left, a little in front), no fog (everything is within 30 m).
// Three.js frame: X right, Y up, three z = -world Z (aircraftShared's convention).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, LIGHT } from "../scott-aircraft-order/aircraftShared";
import {
  BARS,
  CABLE,
  CABLE_LEN,
  CROSS,
  DIE,
  INGOT,
  INSULATORS,
  PIN,
  PKG,
  PKG_TOP,
  PLINTH,
  PLUG,
  POLE,
  PULSE,
  PULSE_KS,
  ROW_Z,
  SLOT,
  barAt,
  cablePoints,
  cableS,
  contactFrame,
  crossAt,
} from "./valuePerWattPlan";

type V3 = [number, number, number];
const hex3 = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** the cut's materials */
export const VPW_COLOR = {
  cream: COLOR.cream,
  creamFoot: COLOR.creamFoot,
  plinth: "#E2D5BE",
  pin: "#CDBDA2",
  die: "#9C7D60",
  dieRim: "#B79B7C",
  recess: "#4A3122",
  cable: "#EDE3D0",
  light: "#FFFBF2",
  amberTop: COLOR.amberTop,
  amberFoot: COLOR.amberFoot,
  amberHot: COLOR.amberHot,
} as const;

// --- the shader ----------------------------------------------------------------------------------------------
// aKind: 0 lit card (cream, board), 1 amber (the gold), 2 recess (the slot's dark inside), 3 die, 4 cable
const VERT = /* glsl */ `
attribute vec3 aCol;
attribute float aKind;
attribute float aS;
attribute float aLoc;
varying float vLoc;
uniform float uPulse[16];
uniform float uPulseLen;
uniform float uBulge;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying float vKind;
varying float vGlow;
float pulseGlow(float s) {
  float g = 0.0;
  for (int i = 0; i < 16; i++) {
    float d = (s - uPulse[i]) / (uPulseLen * 0.5);
    g += exp(-d * d * 1.6);
  }
  return min(g, 1.0);
}
void main() {
  vec3 p = position;
  float glow = 0.0;
  if (aKind > 3.5) {
    glow = pulseGlow(aS);
    p += normal * uBulge * glow;
  }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vCol = aCol;
  vKind = aKind;
  vGlow = glow;
  vLoc = aLoc;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform vec3 uCream;
uniform vec3 uLight;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform float uCrossX;
uniform float uCrossAmt;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying float vKind;
varying float vGlow;
varying float vLoc;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.38, 0.8, ndl);
  vec3 col;
  if (vKind > 0.5 && vKind < 1.5) {
    // the gold: lit faces amberTop, the shade side amberFoot, the top face toward the hot edge colour
    col = mix(uAmberFoot * 0.8, uAmberTop, smoothstep(-0.3, 0.9, ndl));
    col = mix(col, mix(uAmberTop, uAmberHot, 0.42), smoothstep(0.85, 0.99, n.y));
    float sheen = pow(max(dot(n, normalize(uL + V)), 0.0), 18.0);
    col = mix(col, uAmberHot, 0.18 * sheen);
    // each bar's sides deepen toward its foot (the joint to the bar below reads), the top rim runs hot
    float side = 1.0 - smoothstep(0.6, 0.9, n.y);
    col *= mix(1.0, mix(0.8, 1.0, smoothstep(0.0, 0.45, vLoc)), side);
    col = mix(col, uAmberHot, side * 0.5 * smoothstep(0.9, 1.0, vLoc));
  } else if (vKind > 1.5 && vKind < 2.5) {
    col = vCol * mix(0.85, 1.05, lit);
  } else {
    col = mix(vCol * uShade, vCol * 1.03, lit);
    col *= 1.0 + 0.04 * max(n.y, 0.0);
    col = mix(col, col * uBounce, 0.3 * max(-n.y, 0.0));
    float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
    col = mix(col, uCream, 0.4 * fres * smoothstep(0.05, 0.7, n.y));
    if (vKind > 2.5 && vKind < 3.5) {
      // the light crossing the die after each contact (left to right)
      float d = (vW.x - uCrossX) / 0.55;
      col = mix(col, uLight, uCrossAmt * (0.25 + 0.75 * exp(-d * d)));
    }
    if (vKind > 3.5) {
      col = mix(col, uLight * 1.04, vGlow);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const makeMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uL: { value: new THREE.Vector3(LIGHT.side[0], LIGHT.side[1], -LIGHT.side[2]) },
      uShade: { value: v3(AIR_COLOR.shadeMul) },
      uBounce: { value: v3(AIR_COLOR.bounce) },
      uCream: { value: v3(COLOR.cream) },
      uLight: { value: v3(VPW_COLOR.light) },
      uAmberTop: { value: v3(VPW_COLOR.amberTop) },
      uAmberFoot: { value: v3(VPW_COLOR.amberFoot) },
      uAmberHot: { value: v3(VPW_COLOR.amberHot) },
      uCrossX: { value: -99 },
      uCrossAmt: { value: 0 },
      uPulse: { value: new Array(16).fill(-999) },
      uPulseLen: { value: PULSE.len },
      uBulge: { value: CABLE.r * 0.75 },
    },
  });

// --- geometry builders -----------------------------------------------------------------------------------------
type Face = "px" | "nx" | "py" | "ny" | "pz" | "nz";
type BoxSpec = { c: V3; s: V3; col: string; kind?: number; faces?: Partial<Record<Face, { col: string; kind: number }>> };
type Acc = { pos: number[]; nor: number[]; col: number[]; kind: number[]; s: number[]; loc: number[]; idx: number[] };
const acc = (): Acc => ({ pos: [], nor: [], col: [], kind: [], s: [], loc: [], idx: [] });
/** world [X, Y, Z] -> three */
const T = (p: V3): V3 => [p[0], p[1], -p[2]];
const quad = (a: Acc, P: V3[], n: V3, col: string, kind: number) => {
  const b = a.pos.length / 3;
  const c = hex3(col);
  for (const p of P) {
    a.pos.push(...T(p));
    a.nor.push(n[0], n[1], -n[2]);
    a.col.push(...c);
    a.kind.push(kind);
    a.s.push(-1);
    a.loc.push(kind === 1 ? p[1] / INGOT.H : 0);
  }
  a.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
};
const addBox = (a: Acc, b: BoxSpec) => {
  const [cx, cy, cz] = b.c;
  const [hx, hy, hz] = [b.s[0] / 2, b.s[1] / 2, b.s[2] / 2];
  const x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
  const F = (f: Face) => b.faces?.[f] ?? { col: b.col, kind: b.kind ?? 0 };
  quad(a, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], F("px").col, F("px").kind);
  quad(a, [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]], [-1, 0, 0], F("nx").col, F("nx").kind);
  quad(a, [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], F("py").col, F("py").kind);
  quad(a, [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]], [0, -1, 0], F("ny").col, F("ny").kind);
  quad(a, [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]], [0, 0, 1], F("pz").col, F("pz").kind);
  quad(a, [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1], F("nz").col, F("nz").kind);
};
const toGeo = (a: Acc) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(a.pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(a.nor), 3));
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(a.col), 3));
  g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(a.kind), 1));
  g.setAttribute("aS", new THREE.BufferAttribute(new Float32Array(a.s), 1));
  g.setAttribute("aLoc", new THREE.BufferAttribute(new Float32Array(a.loc.length ? a.loc : new Array(a.s.length).fill(0)), 1));
  g.setIndex(a.idx);
  return g;
};

/** The plinth, the package (with the outlet slot cut into its right face), its pins, the die and the plug. */
const chipGeo = () => {
  const a = acc();
  const C = VPW_COLOR;
  // plinth
  addBox(a, { c: [0, PLINTH.h / 2, 0], s: [PLINTH.w, PLINTH.h, PLINTH.d], col: C.plinth });
  // package: solid left part, then the slots' surround (floor, ceiling, outer walls and the wall between the two
  // outlets) with dark inner faces
  const xR = PKG.w / 2;
  const xB = xR - SLOT.depth; // the slots' back wall
  const yTop = PKG_TOP;
  const sy0 = SLOT.y0;
  const sy1 = SLOT.y0 + SLOT.h;
  const dark = { col: C.recess, kind: 2 };
  const cx = (xB + xR) / 2;
  addBox(a, { c: [(-xR + xB) / 2, PKG.y0 + PKG.t / 2, 0], s: [xB + xR, PKG.t, PKG.d], col: C.cream, faces: { px: dark } });
  addBox(a, { c: [cx, (PKG.y0 + sy0) / 2, 0], s: [SLOT.depth, sy0 - PKG.y0, PKG.d], col: C.cream, faces: { py: dark } });
  addBox(a, { c: [cx, (sy1 + yTop) / 2, 0], s: [SLOT.depth, yTop - sy1, PKG.d], col: C.cream, faces: { ny: dark } });
  // the walls in Z: outer front, the divider, outer back (each slot spans ROW_Z +- SLOT.zw / 2)
  const zIn = ROW_Z - SLOT.zw / 2; // the divider's half thickness
  const zOut = ROW_Z + SLOT.zw / 2;
  const wallO = PKG.d / 2 - zOut;
  addBox(a, { c: [cx, (sy0 + sy1) / 2, -(zOut + wallO / 2)], s: [SLOT.depth, SLOT.h, wallO], col: C.cream, faces: { pz: dark } });
  addBox(a, { c: [cx, (sy0 + sy1) / 2, zOut + wallO / 2], s: [SLOT.depth, SLOT.h, wallO], col: C.cream, faces: { nz: dark } });
  addBox(a, { c: [cx, (sy0 + sy1) / 2, 0], s: [SLOT.depth, SLOT.h, zIn * 2], col: C.cream, faces: { pz: dark, nz: dark } });
  // the die: a board-toned slab with a lighter rim, set on the package top
  addBox(a, { c: [0, yTop + 0.015, 0], s: [DIE.w + 0.16, 0.03, DIE.d + 0.16], col: C.dieRim });
  addBox(a, { c: [0, yTop + DIE.h / 2, 0], s: [DIE.w, DIE.h, DIE.d], col: C.die, kind: 3 });
  // pins: along the front and back faces, out from the package side and down to the plinth
  const pitch = (PKG.w - 0.5) / (PIN.n - 1);
  for (const side of [-1, 1]) {
    for (let i = 0; i < PIN.n; i++) {
      const x = -PKG.w / 2 + 0.25 + i * pitch;
      const zo = side * (PKG.d / 2 + PIN.out / 2);
      addBox(a, { c: [x, PKG.y0 + 0.09, zo], s: [PIN.w, PIN.t, PIN.out], col: C.pin });
      const zv = side * (PKG.d / 2 + PIN.out - PIN.t / 2);
      addBox(a, { c: [x, PLINTH.h + (PKG.y0 + 0.09 - PLINTH.h) / 2, zv], s: [PIN.w, PKG.y0 + 0.09 - PLINTH.h + PIN.t / 2, PIN.t], col: C.pin });
    }
  }
  // the plug on the top, behind the die: a short square boot standing on a flange, the cable runs down into it
  addBox(a, { c: [PLUG.x, PLUG.y + PLUG.len / 2, PLUG.z], s: [PLUG.r * 2, PLUG.len, PLUG.r * 2], col: C.creamFoot });
  addBox(a, { c: [PLUG.x, PLUG.y + 0.03, PLUG.z], s: [PLUG.r * 2 + 0.1, 0.06, PLUG.r * 2 + 0.1], col: C.creamFoot });
  return toGeo(a);
};

/** The power pole: a cream post, a crossarm, two insulators; the cable hangs from the right-hand one. */
const poleGeo = () => {
  const a = acc();
  const C = VPW_COLOR;
  addBox(a, { c: [POLE.x, POLE.h / 2, POLE.z], s: [POLE.post, POLE.h, POLE.post], col: C.plinth });
  addBox(a, { c: [POLE.x, POLE.armY, POLE.z], s: [POLE.arm, POLE.armT, POLE.armT * 1.2], col: C.plinth });
  // two braces under the arm
  for (const sx of [-1, 1]) {
    const L = 0.62;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      addBox(a, { c: [POLE.x + sx * (0.1 + t * 0.42), POLE.armY - 0.08 - (1 - t) * 0.42, POLE.z], s: [L / n + 0.04, 0.07, 0.07], col: C.pin });
    }
  }
  for (const [x, y, z] of INSULATORS) {
    addBox(a, { c: [x, y + POLE.ins * 0.5, z], s: [POLE.insR * 2, POLE.ins, POLE.insR * 2], col: C.creamFoot });
    addBox(a, { c: [x, y + POLE.ins * 0.35, z], s: [POLE.insR * 2.8, 0.05, POLE.insR * 2.8], col: C.creamFoot });
    addBox(a, { c: [x, y + POLE.ins * 0.7, z], s: [POLE.insR * 2.8, 0.05, POLE.insR * 2.8], col: C.creamFoot });
  }
  // a small box on the post (the transformer), cream, at two thirds height
  addBox(a, { c: [POLE.x + 0.26, POLE.h * 0.6, POLE.z], s: [0.36, 0.62, 0.42], col: C.cream });
  addBox(a, { c: [POLE.x + 0.26, POLE.h * 0.6 + 0.34, POLE.z], s: [0.42, 0.06, 0.48], col: C.creamFoot });
  return toGeo(a);
};

/** One gold bar: a cast bar's frustum (the top face inset), bottom-centre at the origin. */
const ingotGeo = () => {
  const a = acc();
  const { W, L, H, insetX: ix, insetZ: iz } = INGOT;
  const b: V3[] = [[-W / 2, 0, -L / 2], [W / 2, 0, -L / 2], [W / 2, 0, L / 2], [-W / 2, 0, L / 2]];
  const t: V3[] = [[-W / 2 + ix, H, -L / 2 + iz], [W / 2 - ix, H, -L / 2 + iz], [W / 2 - ix, H, L / 2 - iz], [-W / 2 + ix, H, L / 2 - iz]];
  const nrm = (p: V3[]): V3 => {
    const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    const v = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]];
    const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n);
    return [n[0] / l, n[1] / l, n[2] / l];
  };
  const face = (p: V3[], want: V3) => {
    let n = nrm(p);
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) n = [-n[0], -n[1], -n[2]];
    quad(a, p, n, VPW_COLOR.amberTop, 1);
  };
  face([t[0], t[1], t[2], t[3]], [0, 1, 0]);
  face([b[0], b[3], b[2], b[1]], [0, -1, 0]);
  face([b[0], b[1], t[1], t[0]], [0, 0, -1]); // front (toward the camera, world -Z)
  face([b[2], b[3], t[3], t[2]], [0, 0, 1]);
  face([b[1], b[2], t[2], t[1]], [1, 0, 0]);
  face([b[3], b[0], t[0], t[3]], [-1, 0, 0]);
  return toGeo(a);
};

/** The cable: a tube along the plan's Bezier, with arc length per vertex (aS) for the pulses. */
const cableGeo = () => {
  const pts = cablePoints();
  const S = cableS();
  const RAD = 10;
  const a = acc();
  const c = hex3(VPW_COLOR.cable);
  // a parallel-transport frame along the polyline
  let prevN: V3 = [0, 1, 0];
  const rings: { p: V3; n: V3; b: V3 }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const o = pts[Math.max(0, i - 1)];
    let tg: V3 = [q[0] - o[0], q[1] - o[1], q[2] - o[2]];
    const tl = Math.hypot(...tg);
    tg = [tg[0] / tl, tg[1] / tl, tg[2] / tl];
    const dp = prevN[0] * tg[0] + prevN[1] * tg[1] + prevN[2] * tg[2];
    let n: V3 = [prevN[0] - dp * tg[0], prevN[1] - dp * tg[1], prevN[2] - dp * tg[2]];
    const nl = Math.hypot(...n);
    n = [n[0] / nl, n[1] / nl, n[2] / nl];
    const b: V3 = [tg[1] * n[2] - tg[2] * n[1], tg[2] * n[0] - tg[0] * n[2], tg[0] * n[1] - tg[1] * n[0]];
    rings.push({ p, n, b });
    prevN = n;
  }
  for (let i = 0; i < rings.length; i++) {
    for (let j = 0; j <= RAD; j++) {
      const ang = (j / RAD) * Math.PI * 2;
      const { p, n, b } = rings[i];
      const d: V3 = [n[0] * Math.cos(ang) + b[0] * Math.sin(ang), n[1] * Math.cos(ang) + b[1] * Math.sin(ang), n[2] * Math.cos(ang) + b[2] * Math.sin(ang)];
      a.pos.push(...T([p[0] + d[0] * CABLE.r, p[1] + d[1] * CABLE.r, p[2] + d[2] * CABLE.r]));
      a.nor.push(d[0], d[1], -d[2]);
      a.col.push(...c);
      a.kind.push(4);
      a.s.push(S[i]);
      a.loc.push(0);
    }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < RAD; j++) {
      const A = i * (RAD + 1) + j;
      const B = A + RAD + 1;
      a.idx.push(A, B, A + 1, B, B + 1, A + 1);
    }
  }
  return toGeo(a);
};

// --- the ground shadow (one canvas: the union of every object's cast shadow) --------------------------------------
const SH = { x0: -6, x1: 16, z0: -5, z1: 10, px: 44 } as const;
/** ground offset per metre of height along the key light (shadows fall right and back) */
const OFF = { x: -LIGHT.side[0] / LIGHT.side[1], z: -LIGHT.side[2] / LIGHT.side[1] };
const hull = (pts: [number, number][]) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** a box's cast shadow on the ground: the hull of its footprint lifted to its bottom and to its top */
const boxShadow = (x0: number, x1: number, z0: number, z1: number, yb: number, yt: number) => {
  const pts: [number, number][] = [];
  for (const h of [yb, yt]) for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) pts.push([x + OFF.x * h, z + OFF.z * h]);
  return hull(pts);
};

const ShadowLayer: React.FC<{ f: number }> = ({ f }) => {
  const o = useMemo(() => {
    const cw = Math.round((SH.x1 - SH.x0) * SH.px);
    const ch = Math.round((SH.z1 - SH.z0) * SH.px);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.flipY = false; // canvas row 0 = SH.z0, as the uv corners say
    const g = new THREE.BufferGeometry();
    const P = [
      [SH.x0, SH.z0],
      [SH.x1, SH.z0],
      [SH.x1, SH.z1],
      [SH.x0, SH.z1],
    ];
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P.flatMap(([x, z]) => [x, 0.015, -z])), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTex: { value: tex }, uCol: { value: v3(COLOR.shadow) }, uOp: { value: 0.62 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uTex; uniform vec3 uCol; uniform float uOp; varying vec2 vUv; void main(){ float a = texture2D(uTex, vUv).r; gl_FragColor = vec4(uCol, a * uOp); }`,
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    return { canvas, tex, mesh };
  }, []);
  const ctx = o.canvas.getContext("2d") as CanvasRenderingContext2D;
  const W = o.canvas.width;
  const Hh = o.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, Hh);
  ctx.globalCompositeOperation = "lighten";
  const toPx = (x: number, z: number): [number, number] => [(x - SH.x0) * SH.px, (z - SH.z0) * SH.px];
  const poly = (pts: [number, number][], level: number, blur: number) => {
    ctx.filter = blur > 0 ? `blur(${blur.toFixed(2)}px)` : "none";
    const g = Math.round(255 * level);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [u, v] = toPx(p[0], p[1]);
      if (i === 0) ctx.moveTo(u, v);
      else ctx.lineTo(u, v);
    });
    ctx.closePath();
    ctx.fill();
  };
  // the plinth + chip (one touching group: one shadow)
  poly(boxShadow(-PLINTH.w / 2, PLINTH.w / 2, -PLINTH.d / 2, PLINTH.d / 2, 0, PLINTH.h), 0.75, 5);
  poly(boxShadow(-PKG.w / 2, PKG.w / 2, -PKG.d / 2, PKG.d / 2, 0, PKG_TOP + DIE.h), 0.75, 7);
  poly(boxShadow(-PLINTH.w / 2 - 0.02, PLINTH.w / 2 + 0.02, -PLINTH.d / 2 - 0.02, PLINTH.d / 2 + 0.02, 0, 0.05), 1, 3);
  // the pole, its arm and box
  poly(boxShadow(POLE.x - POLE.post / 2, POLE.x + POLE.post / 2, POLE.z - POLE.post / 2, POLE.z + POLE.post / 2, 0, POLE.h), 0.7, 3);
  poly(boxShadow(POLE.x - POLE.arm / 2, POLE.x + POLE.arm / 2, POLE.z - 0.1, POLE.z + 0.1, POLE.armY - 0.08, POLE.armY + 0.08), 0.6, 4);
  poly(boxShadow(POLE.x + 0.08, POLE.x + 0.44, POLE.z - 0.21, POLE.z + 0.21, POLE.h * 0.6 - 0.31, POLE.h * 0.6 + 0.37), 0.65, 4);
  // the bars: resting ones as one union; travelling ones softer, lighter and wider the higher they are
  for (const b of BARS) {
    if (f < b.t0) continue;
    const p = barAt(b, f);
    if (p.x < PKG.w / 2) continue; // still inside the chip
    const x0 = p.x - INGOT.W / 2;
    const x1 = p.x + INGOT.W / 2;
    const zc = b.lane === 0 ? -ROW_Z : ROW_Z;
    const z0 = zc - INGOT.L / 2;
    const z1 = zc + INGOT.L / 2;
    if (p.state === "rest") {
      poly(boxShadow(x0, x1, z0, z1, p.y, p.y + INGOT.H), 0.75, 5);
      if (p.y < 0.01) poly(boxShadow(x0 - 0.02, x1 + 0.02, z0 - 0.02, z1 + 0.02, 0, 0.04), 1, 3);
    } else {
      const h = p.y;
      const level = 0.75 * (1 - c01(h / 7) * 0.5);
      poly(boxShadow(x0, x1, z0, z1, h, h + INGOT.H), level, 5 + h * 3.5);
    }
  }
  o.tex.needsUpdate = true;
  return <primitive object={o.mesh} />;
};

// --- the world -----------------------------------------------------------------------------------------------------
export const ValueWorld: React.FC<{ f: number }> = ({ f }) => {
  const o = useMemo(() => {
    const mat = makeMat();
    const chip = new THREE.Mesh(chipGeo(), mat);
    const pole = new THREE.Mesh(poleGeo(), mat);
    const cable = new THREE.Mesh(cableGeo(), mat);
    const ig = ingotGeo();
    const bars = BARS.map(() => {
      const m = new THREE.Mesh(ig, mat);
      m.visible = false;
      return m;
    });
    for (const m of [chip, pole, cable, ...bars]) m.frustumCulled = false;
    const group = new THREE.Group();
    group.add(chip, pole, cable, ...bars);
    return { mat, group, bars };
  }, []);
  // pulses on the cable (arc length of each pulse's centre; inside the plug they are hidden by the plug)
  const pul = o.mat.uniforms.uPulse.value as number[];
  let pi = 0;
  for (const k of PULSE_KS) {
    const s = CABLE_LEN + (f - contactFrame(k)) * PULSE.speed - PULSE.len * 0.5;
    if (pi < 16) pul[pi++] = s;
  }
  while (pi < 16) pul[pi++] = -999;
  // the light crossing the die after the most recent contact
  let cx = -99;
  let ca = 0;
  for (const k of PULSE_KS) {
    const u = crossAt(k, f);
    if (u === null) continue;
    cx = -PKG.w / 2 + (PKG.w + 0.4) * u;
    ca = Math.min(1, u * 4 + 0.25) * (1 - c01((u - 1) / 0.6));
  }
  o.mat.uniforms.uCrossX.value = cx;
  o.mat.uniforms.uCrossAmt.value = ca;
  void CROSS;
  // the bars
  BARS.forEach((b, i) => {
    const m = o.bars[i];
    if (f < b.t0) {
      m.visible = false;
      return;
    }
    const p = barAt(b, f);
    m.visible = true;
    m.position.set(p.x, p.y, b.lane === 0 ? ROW_Z : -ROW_Z); // three z = -world Z
  });
  return (
    <>
      <ShadowLayer f={f} />
      <primitive object={o.group} />
    </>
  );
};
