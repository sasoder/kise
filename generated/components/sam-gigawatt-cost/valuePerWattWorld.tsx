// ---------------------------------------------------------------------------
// valuePerWattWorld — the 3D pieces of cut 3, MoreValuePerWatt (sam-gigawatt-cost), rev 3, for aircraftShared's
// <AirStage world>: the cream cash pedestal (a plinth with a shallow tray), the cream "1 W" power tile, the plug boots,
// the cable along the apron with its steady current, the stack of banknote bundles (cashBundle.tsx's <CashBundles>,
// imported read-only; a plain placeholder box until CASH_READY), and ONE ground shadow layer for all of them (a canvas
// redrawn per frame: the union of every object's cast shadow).
// Lit by aircraftShared's side key light (upper left, a little in front). Three.js frame: X right, Y up, three z =
// -world Z (aircraftShared's convention).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, LIGHT } from "../scott-aircraft-order/aircraftShared";
import { CashBundles, type BundleItem } from "./cashBundle";
import { BOOT, BUNDLE, BUNDLES, CABLE_R, CURRENT, PED, PLUG_IN, PLUG_OUT, TILE, beadsAt, bundleAt, cablePoints, cableS } from "./valuePerWattPlan";

type V3 = [number, number, number];
const hex3 = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** true once animation_source/notes/CASH_READY.md exists: the real bundles; until then a plain box of the same size */
export const USE_CASH = true;

/** the cut's materials */
export const VPW_COLOR = {
  cream: COLOR.cream,
  creamFoot: COLOR.creamFoot,
  plinth: "#EDE3D1",
  tray: "#E2D6C0",
  boot: "#DDD0B8",
  cable: "#CDBB9E",
  light: "#FFFBF2",
  /** placeholder note paper */
  paper: "#B9C3A4",
} as const;

// --- the shader (lit card + the cable's current + the placeholder bundle) ----------------------------------------------
// aKind: 0 lit card, 4 cable, 5 placeholder bundle (sage paper with an amber strap round its middle)
const VERT = /* glsl */ `
attribute vec3 aCol;
attribute float aKind;
attribute float aS;
attribute vec3 aLoc;
uniform float uBead[24];
uniform float uBeadLen;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying float vKind;
varying float vGlow;
varying vec3 vLoc;
float beadGlow(float s) {
  float g = 0.0;
  for (int i = 0; i < 24; i++) {
    float d = (s - uBead[i]) / (uBeadLen * 0.5);
    g += exp(-d * d * 1.8);
  }
  return min(g, 1.0);
}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vCol = aCol;
  vKind = aKind;
  vGlow = aKind > 3.5 && aKind < 4.5 ? beadGlow(aS) : 0.0;
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
uniform float uGlowAmt;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying float vKind;
varying float vGlow;
varying vec3 vLoc;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.38, 0.8, ndl);
  vec3 base = vCol;
  float amber = 0.0;
  if (vKind > 4.5) {
    float strap = 1.0 - step(0.1, abs(vLoc.x));
    amber = strap * step(abs(n.x), 0.5);
    base = mix(base, mix(uAmberFoot, uAmberTop, 0.6), amber);
  }
  vec3 col = mix(base * uShade, base * 1.03, lit);
  col *= 1.0 + 0.04 * max(n.y, 0.0);
  col = mix(col, col * uBounce, 0.3 * max(-n.y, 0.0));
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
  col = mix(col, uCream, 0.35 * fres * smoothstep(0.05, 0.7, n.y) * (1.0 - amber));
  if (vKind > 4.5) {
    // the placeholder's contact: darker toward its foot on the sides
    float side = 1.0 - step(0.5, abs(n.y));
    col *= 1.0 - side * 0.25 * (1.0 - smoothstep(-0.5, -0.3, vLoc.y));
    col = mix(col, mix(uAmberFoot, uAmberTop, lit), amber * 0.7);
  }
  if (vKind > 3.5 && vKind < 4.5) col = mix(col, uLight * 1.04, vGlow * uGlowAmt);
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
      uAmberTop: { value: v3(COLOR.amberTop) },
      uAmberFoot: { value: v3(COLOR.amberFoot) },
      uBead: { value: new Array(24).fill(-999) },
      uBeadLen: { value: CURRENT.len },
      uGlowAmt: { value: CURRENT.glow },
    },
  });

// --- geometry builders -----------------------------------------------------------------------------------------
type Acc = { pos: number[]; nor: number[]; col: number[]; kind: number[]; s: number[]; loc: number[]; idx: number[] };
const acc = (): Acc => ({ pos: [], nor: [], col: [], kind: [], s: [], loc: [], idx: [] });
/** world [X, Y, Z] -> three */
const T = (p: V3): V3 => [p[0], p[1], -p[2]];
const quad = (a: Acc, P: V3[], n: V3, col: string, kind: number, loc?: (p: V3) => V3) => {
  const b = a.pos.length / 3;
  const c = hex3(col);
  for (const p of P) {
    a.pos.push(...T(p));
    a.nor.push(n[0], n[1], -n[2]);
    a.col.push(...c);
    a.kind.push(kind);
    a.s.push(-1);
    a.loc.push(...(loc ? loc(p) : [0, 0, 0]));
  }
  a.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
};
/** an axis box by its min / max corners (world) */
const addBox = (a: Acc, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, col: string, kind = 0, loc?: (p: V3) => V3) => {
  quad(a, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], col, kind, loc);
  quad(a, [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]], [-1, 0, 0], col, kind, loc);
  quad(a, [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], col, kind, loc);
  quad(a, [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]], [0, -1, 0], col, kind, loc);
  quad(a, [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]], [0, 0, 1], col, kind, loc);
  quad(a, [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1], col, kind, loc);
};
const toGeo = (a: Acc) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(a.pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(a.nor), 3));
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(a.col), 3));
  g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(a.kind), 1));
  g.setAttribute("aS", new THREE.BufferAttribute(new Float32Array(a.s), 1));
  g.setAttribute("aLoc", new THREE.BufferAttribute(new Float32Array(a.loc), 3));
  g.setIndex(a.idx);
  return g;
};

/** The pedestal (a plinth with a shallow tray: a lip round an inset floor), the tile and the two plug boots. */
const propsGeo = () => {
  const a = acc();
  const C = VPW_COLOR;
  const { w, d, h, lip, rim } = PED;
  // plinth body, then a foot band (a hair proud) so the base reads as a separate course
  addBox(a, -w / 2, 0, -d / 2, w / 2, h, d / 2, C.plinth);
  addBox(a, -w / 2 - 0.03, 0, -d / 2 - 0.03, w / 2 + 0.03, 0.07, d / 2 + 0.03, C.tray);
  // the tray lip: four rails round the top
  addBox(a, -w / 2, h, -d / 2, w / 2, h + lip, -d / 2 + rim, C.tray);
  addBox(a, -w / 2, h, d / 2 - rim, w / 2, h + lip, d / 2, C.tray);
  addBox(a, -w / 2, h, -d / 2 + rim, -w / 2 + rim, h + lip, d / 2 - rim, C.tray);
  addBox(a, w / 2 - rim, h, -d / 2 + rim, w / 2, h + lip, d / 2 - rim, C.tray);
  // the socket plate on the pedestal's front, and its boot (pointing at the camera)
  addBox(a, PLUG_IN.x - 0.14, PLUG_IN.y - 0.12, PLUG_IN.z - 0.012, PLUG_IN.x + 0.14, PLUG_IN.y + 0.12, PLUG_IN.z, C.tray);
  addBox(a, PLUG_IN.x - BOOT.r, PLUG_IN.y - BOOT.r, PLUG_IN.z - BOOT.len, PLUG_IN.x + BOOT.r, PLUG_IN.y + BOOT.r, PLUG_IN.z - 0.012, C.boot);
  // the tile: a cream block; a slightly proud cap course on top
  const tx0 = TILE.x - TILE.w / 2;
  const tx1 = TILE.x + TILE.w / 2;
  const tz0 = TILE.z - TILE.d / 2;
  const tz1 = TILE.z + TILE.d / 2;
  addBox(a, tx0, 0, tz0, tx1, TILE.h, tz1, C.cream);
  addBox(a, tx0 - 0.02, 0, tz0 - 0.02, tx1 + 0.02, 0.05, tz1 + 0.02, C.tray);
  // its boot on the right face
  addBox(a, PLUG_OUT.x, PLUG_OUT.y - BOOT.r, PLUG_OUT.z - BOOT.r, PLUG_OUT.x + BOOT.len, PLUG_OUT.y + BOOT.r, PLUG_OUT.z + BOOT.r, C.boot);
  return toGeo(a);
};

/** The cable: a tube along the plan's spline, with arc length per vertex (aS) for the current. */
const cableGeo = () => {
  const pts = cablePoints();
  const S = cableS();
  const RAD = 10;
  const a = acc();
  const c = hex3(VPW_COLOR.cable);
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
      a.pos.push(...T([p[0] + d[0] * CABLE_R, p[1] + d[1] * CABLE_R, p[2] + d[2] * CABLE_R]));
      a.nor.push(d[0], d[1], -d[2]);
      a.col.push(...c);
      a.kind.push(4);
      a.s.push(S[i]);
      a.loc.push(0, 0, 0);
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

/** placeholder bundle: a unit box (foot at y 0), local coords in aLoc (x, y in -0.5..0.5) for the strap */
const placeholderGeo = () => {
  const a = acc();
  addBox(a, -0.5, 0, -0.5, 0.5, 1, 0.5, VPW_COLOR.paper, 5, (p) => [p[0], p[1] - 0.5, p[2]]);
  return toGeo(a);
};

// --- the ground shadow (one canvas: the union of every object's cast shadow) --------------------------------------
const SH = { x0: -3.2, x1: 7.5, z0: -3.2, z1: 6.5, px: 64 } as const;
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
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P.flatMap(([x, z]) => [x, 0.012, -z])), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTex: { value: tex }, uCol: { value: v3(COLOR.shadow) }, uOp: { value: 0.6 } },
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
  // the pedestal and the landed stack: one touching group, one shadow (its height grows with the stack)
  const rest: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }[] = [];
  for (const b of BUNDLES) {
    const p = bundleAt(b, f);
    if (p.state !== "rest") continue;
    rest.push({ x0: p.x - p.L / 2, x1: p.x + p.L / 2, z0: p.z - p.W / 2, z1: p.z + p.W / 2, y0: p.y, y1: p.y + p.H });
  }
  poly(boxShadow(-PED.w / 2, PED.w / 2, -PED.d / 2, PED.d / 2, 0, PED.h + PED.lip), 0.78, 6);
  for (const r of rest) poly(boxShadow(r.x0, r.x1, r.z0, r.z1, r.y0, r.y1), 0.78, 6);
  // the contact line under the plinth
  poly(boxShadow(-PED.w / 2 - 0.05, PED.w / 2 + 0.05, -PED.d / 2 - 0.05, PED.d / 2 + 0.05, 0, 0.03), 1, 4);
  // the tile and its contact
  poly(boxShadow(TILE.x - TILE.w / 2, TILE.x + TILE.w / 2, TILE.z - TILE.d / 2, TILE.z + TILE.d / 2, 0, TILE.h), 0.74, 5);
  poly(boxShadow(TILE.x - TILE.w / 2 - 0.04, TILE.x + TILE.w / 2 + 0.04, TILE.z - TILE.d / 2 - 0.04, TILE.z + TILE.d / 2 + 0.04, 0, 0.02), 1, 3);
  // the cable: a thin dark line under it (its contact with the apron)
  {
    const pts = cablePoints();
    ctx.filter = "blur(2px)";
    ctx.strokeStyle = "rgb(170,170,170)";
    ctx.lineWidth = CABLE_R * 2.6 * SH.px;
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [u, v] = toPx(p[0] + OFF.x * p[1], p[2] + OFF.z * p[1]);
      if (i === 0) ctx.moveTo(u, v);
      else ctx.lineTo(u, v);
    });
    ctx.stroke();
  }
  // bundles in the air: softer, lighter and wider the higher they are (and none before they come into the frame)
  for (const b of BUNDLES) {
    const p = bundleAt(b, f);
    if (p.state !== "air" || p.above > 3.2) continue;
    const h = p.y;
    const level = 0.7 * (1 - c01(p.above / 3.2) * 0.7);
    poly(boxShadow(p.x - p.L / 2, p.x + p.L / 2, p.z - p.W / 2, p.z + p.W / 2, h, h + p.H), level, 5 + p.above * 5);
  }
  o.tex.needsUpdate = true;
  return <primitive object={o.mesh} />;
};

// --- the ground haze -------------------------------------------------------------------------------------------------
/** The scene is small (metres), so aircraftShared's distance fog (from 80 m) never reaches the near ground under the
 *  horizon and the apron's far edge reads as a hard band. A sheet of the horizon's haze lies on the ground, clear near
 *  the pedestal and thickening with distance from the eye, so the far apron and desert melt into the air at the
 *  horizon as in the Scott cuts. It draws over the ground and its shadows only (depth-tested under everything). */
const HAZE = { near: 9, far: 70, max: 0.97 } as const;
const GroundHaze: React.FC = () => {
  const mesh = useMemo(() => {
    const g = new THREE.PlaneGeometry(4000, 4000);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.02, 0);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uCol: { value: v3(SKY.haze) }, uLo: { value: v3(SKY.glow) } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uCol; uniform vec3 uLo; varying vec3 vW; void main(){
        float d = length(vW.xz - cameraPosition.xz);
        float t = smoothstep(${HAZE.near.toFixed(2)}, ${HAZE.far.toFixed(2)}, d);
        float a = ${HAZE.max.toFixed(3)} * pow(t, 0.8);
        gl_FragColor = vec4(mix(uLo, uCol, t), a); }`,
    });
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    m.renderOrder = -0.5;
    return m;
  }, []);
  return <primitive object={mesh} />;
};

// --- the world -----------------------------------------------------------------------------------------------------
const PlaceholderCash: React.FC<{ items: BundleItem[] }> = ({ items }) => {
  const o = useMemo(() => {
    const mat = makeMat();
    const geo = placeholderGeo();
    const meshes = BUNDLES.map(() => {
      const m = new THREE.Mesh(geo, mat);
      m.frustumCulled = false;
      return m;
    });
    const group = new THREE.Group();
    group.add(...meshes);
    return { group, meshes };
  }, []);
  items.forEach((it, i) => {
    const m = o.meshes[i];
    const s = it.size ?? BUNDLE;
    m.position.set(it.at[0], it.at[1], -it.at[2]);
    m.rotation.set(0, -((it.heading ?? 0) * Math.PI) / 180, 0);
    m.scale.set(s.L, s.H, s.W);
  });
  return <primitive object={o.group} />;
};

/** the bundles as cashBundle items: every one every frame (the count never changes); those still waiting above the
 *  frame stay at their drop height */
export const bundleItems = (f: number): BundleItem[] =>
  BUNDLES.map((b) => {
    const p = bundleAt(b, f);
    return { at: [p.x, p.y, p.z] as V3, heading: p.heading, size: { L: p.L, W: p.W, H: p.H }, seed: b.seed };
  });

export const ValueWorld: React.FC<{ f: number }> = ({ f }) => {
  const o = useMemo(() => {
    const mat = makeMat();
    const props = new THREE.Mesh(propsGeo(), mat);
    const cable = new THREE.Mesh(cableGeo(), mat);
    for (const m of [props, cable]) m.frustumCulled = false;
    const group = new THREE.Group();
    group.add(props, cable);
    return { mat, group };
  }, []);
  // the current: soft light beads along the cable at one constant speed and spacing
  const beads = o.mat.uniforms.uBead.value as number[];
  const bs = beadsAt(f);
  for (let i = 0; i < 24; i++) beads[i] = i < bs.length ? bs[i] : -999;
  const items = bundleItems(f);
  return (
    <>
      <ShadowLayer f={f} />
      <GroundHaze />
      <primitive object={o.group} />
      {USE_CASH ? <CashBundles items={items} size={BUNDLE} fog={0} /> : <PlaceholderCash items={items} />}
    </>
  );
};
