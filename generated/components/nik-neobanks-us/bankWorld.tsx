// BANK_WORLD
// ===================================================================================================================
// bankWorld: the shared 3D world of nik-neobanks-us (Cheeky Pint S4E06, Nik Storonsky / John Collison, "why neobanks failed
// in the US"). Built on scott-nolan-uranium/nuclearWorld's stage, camera, materials and shadows (imported, never copied).
// RENDER EVERY CUT WITH --gl=angle.
//
// WORLD UNITS: as nuclearWorld: X right (east), Y up (board = 0), Z away from a yaw-0 camera (north on the map).
//   LegacyBank: BANK.W 30 wide x BANK.H 20.6 tall x BANK.D 26 deep at scale 1 (a 1.46 : 1 front).
//   NeobankPhone: PHONE.H 50 tall x PHONE.W 24.2 wide x PHONE.T 3.8 thick at scale 1 (a real phone's 0.48 : 1, thickness x1.4).
//   UsSlab: the contiguous 48 states, US_SLAB.W 1000 units west to east (about 629 north to south), US_SLAB.T 7 thick.
//
// API (details beside each export; summary in BANK_WORLD_READY.md beside the clip's briefs):
//   <LegacyBank at y? scale? yaw? rise? dim? frieze? shadow?>          one classic bank, facing -Z (south) at yaw 0
//   <BankField items={[{at, scale?, yaw?, rise?, dim?, y?}]} y? frieze? shadow?>   hundreds, instanced, one shadow layer
//   bankRoofOf(at, {y?, scale?, yaw?, rise?}) -> [X, Y, Z]  the centre of the flat roof deck behind the pediment
//   bankShadowItems(at, {scale?, yaw?, rise?, alpha?}) -> ShadowItem[]
//   <NeobankPhone at y? scale? yaw? rise? lift? shadow? slot?>          the neobank: an amber phone, a cream screen, an ink card
//   phoneShadowItems(at, {...}), PHONE_CARD (the card glyph's place on the screen, fractions of the phone's height)
//   <UsSlab dim? shadow? tone?>, usProject(lon, lat) -> [X, Z], usSlabTop(), usContains(X, Z, inset?), usBankSites({...}) -> [{at, scale}]
// ===================================================================================================================
import React, { useMemo } from "react";
import { continueRender, delayRender, random } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-expect-error untyped module
import { geoAlbers } from "d3-geo";
import { COLOR, FONT_LABEL } from "../kits/cheeky-pint/stoutShared";
import { SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearMaterial, withClayAttrs, type ShadowItem, type V3 } from "../scott-nolan-uranium/nuclearWorld";
import { SLOT_COLOR } from "../scott-nolan-fuel/fuelShared";
import { US48_ALBERS, US48_BOX, US48_POLYS } from "./us48Data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex3 = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mixHex = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(A[0] + (B[0] - A[0]) * t)}${h(A[1] + (B[1] - A[1]) * t)}${h(A[2] + (B[2] - A[2]) * t)}`;
};
const vec3Of = (h: string) => new THREE.Vector3(...hex3(h));
const HAS_DOM = typeof document !== "undefined";

// ===================================================================================================================
// MATERIALS. Derived from nuclearWorld's clay (same shader source, same shared light and fog uniforms), with one change: the
// tone runs continuously from cream (0) to board (1) by uKind + the per-instance aPhase, so a bank can dim by tone (never by
// opacity) and a field can dim bank by bank.
// ===================================================================================================================
const CLAY_BASE_LINE = "vec3 base = uKind > 0.5 ? uBoardTone : mix(uCreamFoot, uCream, vTone);";
const derivedClay = (inst: boolean) => {
  const src = nuclearMaterial(inst ? "clayInst" : "clay");
  if (src.fragmentShader.indexOf(CLAY_BASE_LINE) < 0) throw new Error("bankWorld: nuclearWorld's clay shader changed; update derivedClay");
  return new THREE.ShaderMaterial({
    vertexShader: src.vertexShader,
    fragmentShader: src.fragmentShader.replace(CLAY_BASE_LINE, "vec3 base = mix(mix(uCreamFoot, uCream, vTone), uBoardTone, clamp(uKind + vPh, 0.0, 1.0));"),
    side: THREE.DoubleSide,
    // the shared uniform objects (light, fog range, palette) stay linked to the stage; only uKind / uSpin are this material's own
    uniforms: { ...src.uniforms, uKind: { value: 0 }, uSpin: { value: 0 } },
  });
};
const sharedU = () => nuclearMaterial("clay").uniforms;

// flat decals (door, windows, the engraved frieze, the phone's screen marks): their own colours from a texture, fogged like the
// clay, dimmed toward the board by the same dim
const DECAL_VERT = /* glsl */ `
attribute float aPhase;
varying vec2 vUv;
varying vec3 vW;
varying float vDim;
uniform float uDim;
void main() {
  mat4 m = modelMatrix;
  vDim = uDim;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  vDim = clamp(uDim + aPhase, 0.0, 1.0);
#endif
  vec4 wp = m * vec4(position, 1.0);
  vW = wp.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DECAL_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uDimCol;
uniform float uText;
varying vec2 vUv;
varying vec3 vW;
varying float vDim;
void main() {
  vec4 t = texture2D(uTex, vUv);
  float a = t.a * (vUv.x < 0.8 ? uText : 1.0);
  if (a < 0.003) discard;
  vec3 col = mix(t.rgb, uDimCol, vDim * 0.85);
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(col, uFogCol, fg), a);
}`;
const decalMat = (tex: Any, dimCol: string) => {
  const u = sharedU();
  return new THREE.ShaderMaterial({
    vertexShader: DECAL_VERT,
    fragmentShader: DECAL_FRAG,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
    uniforms: { uTex: { value: tex }, uFogRange: u.uFogRange, uFogCol: u.uFogCol, uDimCol: { value: vec3Of(dimCol) }, uDim: { value: 0 }, uText: { value: 1 } },
  });
};

// ===================================================================================================================
// GEOMETRY HELPERS (three's frame: x right, y up, z = -Z, so a front facing -Z, south, faces +z here)
// ===================================================================================================================
const finish = (g: Any, tone: number) => {
  const h = g.index ? g.toNonIndexed() : g;
  if (h.attributes.uv) h.deleteAttribute("uv");
  if (h.attributes.uv1) h.deleteAttribute("uv1");
  return withClayAttrs(h, tone, 0);
};
/** a soft-edged box (corners pulled onto a rounded shell), centred at (x, y, z) */
const rbox = (w: number, h: number, d: number, x: number, y: number, z: number, r: number, tone: number, seg = 4) => {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const hd = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const cx = Math.max(-hw, Math.min(hw, v.x));
    const cy = Math.max(-hh, Math.min(hh, v.y));
    const cz = Math.max(-hd, Math.min(hd, v.z));
    const dx = v.x - cx;
    const dy = v.y - cy;
    const dz = v.z - cz;
    const l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, cx + (dx / l) * r, cy + (dy / l) * r, cz + (dz / l) * r);
  }
  g.computeVertexNormals();
  g.translate(x, y, z);
  return finish(g, tone);
};
const latheAt = (pts: [number, number][], x: number, y: number, z: number, tone: number, seg = 28) => {
  const g = new THREE.LatheGeometry(
    pts.map((p) => new THREE.Vector2(p[0], p[1])),
    seg,
  );
  g.translate(x, y, z);
  return finish(g, tone);
};
/** a fluted, slightly tapering column shaft */
const shaft = (r0: number, r1: number, h: number, x: number, y: number, z: number, flutes: number, tone: number) => {
  const seg = flutes * 5;
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i);
    const pz = p.getZ(i);
    const a = Math.atan2(pz, px);
    const k = 1 - 0.075 * Math.pow(Math.max(0, Math.cos(a * flutes)), 1.6);
    p.setX(i, px * k);
    p.setZ(i, pz * k);
  }
  g.computeVertexNormals();
  g.translate(x, y + h / 2, z);
  return finish(g, tone);
};
const quad = (w: number, h: number, x: number, y: number, z: number, uv: [number, number, number, number]) => {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(x, y, z);
  const a = g.attributes.uv;
  // PlaneGeometry uv: (0,1) (1,1) (0,0) (1,0)
  a.setXY(0, uv[0], uv[3]);
  a.setXY(1, uv[2], uv[3]);
  a.setXY(2, uv[0], uv[1]);
  a.setXY(3, uv[2], uv[1]);
  return g.toNonIndexed();
};

// ===================================================================================================================
// THE LEGACY BANK. A classic US bank front: three wide steps across the whole front, six fluted columns, an entablature
// (architrave, a frieze that can carry an engraved BANK, a cornice), a triangular pediment with raking cornices, a solid
// block behind with a dark door and windows behind the columns, and a flat roof deck behind the pediment.
// ===================================================================================================================
export const BANK = {
  W: 30,
  H: 20.6,
  D: 26,
  /** the roof deck: height, and its extent front to back in three's z (front = +z) */
  ROOF_Y: 16.75,
  ROOF_Z0: -12.2,
  ROOF_Z1: 5.0,
} as const;
const COL_X = [-11.5, -6.9, -2.3, 2.3, 6.9, 11.5];
const COL_Z = 9.3;
let bankGeoCache: { body: Any; marks: Any } | null = null;
const bankGeo = () => {
  if (bankGeoCache) return bankGeoCache;
  const parts: Any[] = [];
  // the steps: three tiers, each set back at the front and sides
  parts.push(rbox(30, 0.6, 26, 0, 0.3, 0, 0.12, 0.55, 2));
  parts.push(rbox(28.8, 0.6, 24.7, 0, 0.9, -0.05, 0.12, 0.62, 2));
  parts.push(rbox(27.6, 0.6, 23.4, 0, 1.5, -0.1, 0.12, 0.7, 2));
  // the block behind the portico (its front wall carries the door), up to the entablature
  parts.push(rbox(26.4, 11.4, 18.6, 0, 1.8 + 5.7, -2.9, 0.25, 0.72, 2));
  // the columns: base, fluted shaft, capital (echinus + abacus)
  for (const x of COL_X) {
    parts.push(latheAt([[0.0001, 0], [1.32, 0], [1.34, 0.12], [1.22, 0.24], [1.08, 0.33], [1.02, 0.45]], x, 1.8, COL_Z, 0.8, 24));
    parts.push(shaft(1.02, 0.9, 9.95, x, 2.25, COL_Z, 16, 0.95));
    parts.push(latheAt([[0.9, 0], [0.98, 0.1], [1.2, 0.3], [1.28, 0.42], [0.0001, 0.42]], x, 12.2, COL_Z, 1, 24));
    parts.push(rbox(2.7, 0.5, 2.7, x, 12.62 + 0.25, COL_Z, 0.08, 1, 2));
  }
  // the entablature: architrave, frieze (a hair recessed), cornice (overhanging)
  const back = -12.2;
  const archF = 10.75;
  parts.push(rbox(29.0, 1.2, archF - back, 0, 13.12 + 0.6, (archF + back) / 2, 0.08, 0.92, 2));
  parts.push(rbox(28.8, 1.5, archF - 0.12 - back, 0, 14.32 + 0.75, (archF - 0.12 + back) / 2, 0.06, 0.96, 2));
  parts.push(rbox(30.2, 0.95, 11.45 - back + 0.4, 0, 15.82 + 0.475, (11.45 + back - 0.4) / 2, 0.22, 1, 2));
  // the pediment: a gable block from the cornice's top, its front (the tympanum) set back behind the frieze, framed by raking
  // cornices that project as far as the horizontal cornice, so the triangle reads as a framed face and not a roof slope
  const PH = 3.85;
  const PW = 14.6;
  const TYMP = 10.0;
  const tri = new THREE.Shape([new THREE.Vector2(-PW, 0), new THREE.Vector2(PW, 0), new THREE.Vector2(0, PH)]);
  const ped = new THREE.ExtrudeGeometry(tri, { depth: 5.4, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2, steps: 1 });
  ped.translate(0, BANK.ROOF_Y, TYMP - 5.4 - 0.12);
  parts.push(finish(ped, 0.82));
  const L = Math.hypot(PH, PW);
  const slope = Math.atan2(PH, PW);
  const th = 0.8;
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(L + 0.5, th, 1.6, 1, 1, 1);
    g.rotateZ(-s * slope);
    // centred on the slope's midpoint, lifted along the slope's outward normal so its top runs just above the gable's
    g.translate((s * PW) / 2 + s * (PH / L) * th * 0.32, BANK.ROOF_Y + PH / 2 + (PW / L) * th * 0.32, 11.45 - 0.8);
    parts.push(finish(g, 1));
  }
  const body = mergeGeometries(parts, false);
  // marks: atlas u < 0.8 is the engraved BANK, u 0.86..0.98 the solid dark of the door and windows
  const solid: [number, number, number, number] = [0.87, 0.2, 0.97, 0.8];
  const z0 = 6.42;
  const marks = mergeGeometries(
    [
      quad(12, 1.5, 0, 14.32 + 0.75, archF - 0.12 + 0.03, [0, 0, 0.8, 1]),
      quad(2.6, 6.6, 0, 1.8 + 3.3, z0, solid),
      quad(1.7, 4.6, -4.6, 4.2 + 2.3, z0, solid),
      quad(1.7, 4.6, 4.6, 4.2 + 2.3, z0, solid),
      quad(1.7, 4.6, -9.2, 4.2 + 2.3, z0, solid),
      quad(1.7, 4.6, 9.2, 4.2 + 2.3, z0, solid),
    ],
    false,
  );
  bankGeoCache = { body, marks };
  return bankGeoCache;
};

// the atlas: the engraved BANK (Söhne Kräftig caps, wide tracking) and a solid block of door dark
const DOOR_DARK = "#4A3426";
const ENGRAVE = "#76604E";
let atlasTex: Any = null;
const atlasCanvas = HAS_DOM ? document.createElement("canvas") : null;
const drawAtlas = () => {
  if (!atlasCanvas) return;
  atlasCanvas.width = 1024;
  atlasCanvas.height = 128;
  const c = atlasCanvas.getContext("2d") as CanvasRenderingContext2D;
  c.clearRect(0, 0, 1024, 128);
  c.fillStyle = DOOR_DARK;
  c.fillRect(870, 10, 140, 108);
  c.font = `500 88px ${FONT_LABEL}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  (c as Any).letterSpacing = "26px";
  // the cut: a pale lower lip, then the recess
  c.fillStyle = "rgba(255,250,240,0.55)";
  c.fillText("BANK", 409 + 13, 69);
  c.fillStyle = ENGRAVE;
  c.fillText("BANK", 409 + 13, 66);
  if (atlasTex) atlasTex.needsUpdate = true;
};
if (HAS_DOM) {
  const h = delayRender("bankWorld: BANK frieze font");
  const done = () => {
    drawAtlas();
    continueRender(h);
  };
  document.fonts.load(`500 88px ${FONT_LABEL}`).then(done, done);
}
const getAtlas = () => {
  if (atlasTex) return atlasTex;
  drawAtlas();
  atlasTex = new THREE.CanvasTexture(atlasCanvas);
  atlasTex.generateMipmaps = true;
  atlasTex.minFilter = THREE.LinearMipmapLinearFilter;
  atlasTex.magFilter = THREE.LinearFilter;
  atlasTex.anisotropy = 8;
  atlasTex.needsUpdate = true;
  return atlasTex;
};
const DIM_INK = mixHex(COLOR.board, COLOR.ground, 0.35);

const BANK_SINK = 1.02;
/** a bank's one soft shadow (its union silhouette: footprint plus the cast along the key) */
export const bankShadowItems = (at: [number, number], o: { scale?: number; yaw?: number; rise?: number; alpha?: number } = {}): ShadowItem[] => {
  const s = o.scale ?? 1;
  const r = o.rise ?? 1;
  if (r <= 0) return [];
  const rad = BANK.D * 0.46 * s;
  const len = Math.max(0.001, BANK.W * s - 2 * rad) + BANK.H * s * r * SHADOW_LEN * 0.85;
  return [
    {
      x: at[0] - SHADOW_DIR[0] * (BANK.W * 0.5 * s - rad),
      z: at[1] - SHADOW_DIR[1] * (BANK.W * 0.5 * s - rad),
      len,
      r: rad,
      soft: BANK.D * 0.2 * s,
      alpha: (o.alpha ?? 1) * smooth(0, 0.06, r),
    },
  ];
};
/** the centre of the flat roof deck behind the pediment (something can stand there), world [X, Y, Z] */
export const bankRoofOf = (at: [number, number], o: { y?: number; scale?: number; yaw?: number; rise?: number } = {}): V3 => {
  const s = o.scale ?? 1;
  const yaw = (o.yaw ?? 0) * D2R;
  const zc = ((BANK.ROOF_Z0 + BANK.ROOF_Z1) / 2) * s; // three z of the deck centre (behind the front)
  // three: (x, z) rotated by yaw about y; world Z = -z
  const tx = Math.sin(yaw) * zc;
  const tz = Math.cos(yaw) * zc;
  return [at[0] + tx, (o.y ?? 0) - (1 - (o.rise ?? 1)) * BANK.H * s * BANK_SINK + BANK.ROOF_Y * s, at[1] - tz];
};

export type LegacyBankProps = {
  at: [number, number];
  /** the surface it stands on */
  y?: number;
  scale?: number;
  /** degrees about the vertical (three's sense, counter-clockwise from above); 0 faces -Z (south, a yaw-0 camera) */
  yaw?: number;
  /** 0 sunk in the surface .. 1 standing (an opaque surface above hides the sunk part) */
  rise?: number;
  /** 0 cream .. 1 toned to the board */
  dim?: number;
  /** the engraved BANK on the frieze */
  frieze?: boolean;
  shadow?: number;
};
/** One classic bank, cream clay, facing -Z (south) at yaw 0. */
export const LegacyBank: React.FC<LegacyBankProps> = ({ at, y = 0, scale = 1, yaw = 0, rise = 1, dim = 0, frieze = true, shadow = 1 }) => {
  const o = useMemo(() => {
    const g = bankGeo();
    const mat = derivedClay(false);
    const body = new THREE.Mesh(g.body, mat);
    body.frustumCulled = false;
    body.renderOrder = 1;
    const dm = decalMat(getAtlas(), DIM_INK);
    const marks = new THREE.Mesh(g.marks, dm);
    marks.frustumCulled = false;
    marks.renderOrder = 2;
    const grp = new THREE.Group();
    grp.add(body, marks);
    return { grp, mat, dm };
  }, []);
  o.grp.position.set(at[0], y - (1 - rise) * BANK.H * scale * BANK_SINK, -at[1]);
  o.grp.rotation.set(0, yaw * D2R, 0);
  o.grp.scale.setScalar(scale);
  o.mat.uniforms.uKind.value = c01(dim);
  o.dm.uniforms.uDim.value = c01(dim);
  o.dm.uniforms.uText.value = frieze ? 1 : 0;
  return (
    <>
      {shadow > 0 && rise > 0 ? <SoftShadows items={bankShadowItems(at, { scale, yaw, rise, alpha: shadow })} y={y} /> : null}
      <primitive object={o.grp} />
    </>
  );
};

export type FieldBank = { at: [number, number]; scale?: number; yaw?: number; rise?: number; dim?: number; y?: number };
/** Many banks in one draw (plus one for their marks) and one shared shadow layer. Mount with a fixed item count. */
export const BankField: React.FC<{ items: FieldBank[]; y?: number; frieze?: boolean; shadow?: number }> = ({ items, y = 0, frieze = false, shadow = 1 }) => {
  const n = items.length;
  const o = useMemo(() => {
    const g = bankGeo();
    const body = g.body.clone();
    const marks = g.marks.clone();
    const dimA = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n)), 1);
    const dimB = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n)), 1);
    body.setAttribute("aPhase", dimA);
    marks.setAttribute("aPhase", dimB);
    const mat = derivedClay(true);
    const me = new THREE.InstancedMesh(body, mat, Math.max(1, n));
    me.frustumCulled = false;
    me.renderOrder = 1;
    const dm = decalMat(getAtlas(), DIM_INK);
    const mk = new THREE.InstancedMesh(marks, dm, Math.max(1, n));
    mk.frustumCulled = false;
    mk.renderOrder = 2;
    return { me, mk, dimA, dimB, dm };
  }, [n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Sc = new THREE.Vector3();
  const P = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const shadows: ShadowItem[] = [];
  items.forEach((it, i) => {
    const s = it.scale ?? 1;
    const r = it.rise ?? 1;
    Sc.set(s, s, s);
    Q.setFromAxisAngle(UP, (it.yaw ?? 0) * D2R);
    P.set(it.at[0], (it.y ?? y) - (1 - r) * BANK.H * s * BANK_SINK, -it.at[1]);
    M.compose(P, Q, Sc);
    o.me.setMatrixAt(i, M);
    o.mk.setMatrixAt(i, M);
    o.dimA.setX(i, c01(it.dim ?? 0));
    o.dimB.setX(i, c01(it.dim ?? 0));
    for (const sh of bankShadowItems(it.at, { scale: s, yaw: it.yaw, rise: r, alpha: shadow })) shadows.push(sh);
  });
  o.me.count = n;
  o.mk.count = n;
  o.me.instanceMatrix.needsUpdate = true;
  o.mk.instanceMatrix.needsUpdate = true;
  o.dimA.needsUpdate = true;
  o.dimB.needsUpdate = true;
  o.dm.uniforms.uText.value = frieze ? 1 : 0;
  return (
    <>
      {shadow > 0 && shadows.length ? <SoftShadows items={shadows} y={y} /> : null}
      <primitive object={o.me} />
      <primitive object={o.mk} />
    </>
  );
};

// ===================================================================================================================
// THE NEOBANK PHONE. An upright amber phone slab (portrait, rounded corners, soft edges, thickness 1.4x a real phone's so it
// reads as an object), side buttons, a cream screen inset in the amber frame, and on the screen, in ink: the camera pill at the
// top and a bank card (rounded card, a stripe, a chip) in the screen's upper part, so it shows while the phone is still mostly
// down in its slot. The amber is the neobank (nuclearWorld's amberFuel: the one glow).
// ===================================================================================================================
export const PHONE = { H: 50, W: 24.2, T: 3.8, R: 3.4, BEZEL: 1.15 } as const;
/** the card glyph on the screen, as fractions of the phone's height (bottom, top) and of its width */
export const PHONE_CARD = { y0: 0.655, y1: 0.875, w: 0.76 } as const;
const SCREEN = { W: PHONE.W - 2 * PHONE.BEZEL, H: PHONE.H - 2 * PHONE.BEZEL, R: PHONE.R - PHONE.BEZEL * 0.55 };
const roundRect = (w: number, h: number, r: number, x0: number, y0: number) => {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r);
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h);
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
};
let phoneGeoCache: { body: Any; screen: Any; marks: Any } | null = null;
const phoneGeo = () => {
  if (phoneGeoCache) return phoneGeoCache;
  const b = 0.95;
  const bt = 0.9;
  const shape = roundRect(PHONE.W - 2 * b, PHONE.H - 2 * b, PHONE.R - b, -(PHONE.W / 2 - b), b);
  const ex = new THREE.ExtrudeGeometry(shape, { depth: PHONE.T - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: b, bevelSegments: 5, curveSegments: 12, steps: 1 });
  ex.translate(0, 0, -(PHONE.T - 2 * bt) / 2);
  const parts = [finish(ex, 1)];
  // side buttons: volume pair on the left, power on the right
  parts.push(rbox(0.7, 4.2, 1.5, -PHONE.W / 2 - 0.15, PHONE.H * 0.74, 0, 0.3, 1, 2));
  parts.push(rbox(0.7, 4.2, 1.5, -PHONE.W / 2 - 0.15, PHONE.H * 0.645, 0, 0.3, 1, 2));
  parts.push(rbox(0.7, 6.2, 1.5, PHONE.W / 2 + 0.15, PHONE.H * 0.7, 0, 0.3, 1, 2));
  const body = mergeGeometries(parts, false);
  const sg = new THREE.ShapeGeometry(roundRect(SCREEN.W, SCREEN.H, SCREEN.R, -SCREEN.W / 2, PHONE.BEZEL), 12);
  sg.translate(0, 0, PHONE.T / 2 + 0.03);
  const screen = finish(sg, 1);
  const mk = new THREE.PlaneGeometry(SCREEN.W, SCREEN.H);
  mk.translate(0, PHONE.BEZEL + SCREEN.H / 2, PHONE.T / 2 + 0.06);
  phoneGeoCache = { body, screen, marks: mk };
  return phoneGeoCache;
};
// the screen marks: the camera pill and the card (ink), its stripe (screen cream) and chip (pale gold, not amber: no glow)
const SCREEN_TEX_W = 512;
const SCREEN_TEX_H = Math.round((512 * SCREEN.H) / SCREEN.W);
let screenTex: Any = null;
const getScreenTex = () => {
  if (screenTex) return screenTex;
  const cv = document.createElement("canvas");
  cv.width = SCREEN_TEX_W;
  cv.height = SCREEN_TEX_H;
  const c = cv.getContext("2d") as CanvasRenderingContext2D;
  const u = SCREEN_TEX_W / SCREEN.W; // px per unit
  // phone height fraction -> canvas y (canvas y 0 = the screen's top)
  const yOf = (fr: number) => (PHONE.H - PHONE.BEZEL - fr * PHONE.H) * u;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  // camera pill
  c.fillStyle = COLOR.inkDark;
  const pw = SCREEN.W * 0.3 * u;
  const ph = 1.25 * u;
  rr((SCREEN_TEX_W - pw) / 2, 1.0 * u, pw, ph, ph / 2);
  c.fill();
  // the card
  const cw = PHONE.W * PHONE_CARD.w * u;
  const cy0 = yOf(PHONE_CARD.y1);
  const ch = yOf(PHONE_CARD.y0) - cy0;
  const cx0 = (SCREEN_TEX_W - cw) / 2;
  c.fillStyle = COLOR.inkDark;
  rr(cx0, cy0, cw, ch, ch * 0.11);
  c.fill();
  // stripe across the card's upper part
  c.fillStyle = COLOR.creamFoot;
  c.fillRect(cx0, cy0 + ch * 0.2, cw, ch * 0.15);
  // chip
  const chw = cw * 0.17;
  const chh = ch * 0.21;
  const chx = cx0 + cw * 0.1;
  const chy = cy0 + ch * 0.5;
  c.fillStyle = "#D8C08E";
  rr(chx, chy, chw, chh, chh * 0.22);
  c.fill();
  c.strokeStyle = "#9C8456";
  c.lineWidth = Math.max(2, chh * 0.08);
  c.beginPath();
  c.moveTo(chx + chw * 0.36, chy);
  c.lineTo(chx + chw * 0.36, chy + chh);
  c.moveTo(chx, chy + chh * 0.5);
  c.lineTo(chx + chw, chy + chh * 0.5);
  c.stroke();
  // two short number groups as cream dashes (not digits)
  c.fillStyle = "rgba(231,220,200,0.55)";
  for (let i = 0; i < 4; i++) {
    rr(cx0 + cw * (0.1 + i * 0.205), cy0 + ch * 0.8, cw * 0.15, ch * 0.055, ch * 0.027);
    c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  screenTex = t;
  return t;
};
// the screen: flat and unlit (a lit screen, not a painted panel), cream a shade under the card's own cream so the ink reads
const SCREEN_CREAM = "#EDE3D1";
const FLAT_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FLAT_FRAG = /* glsl */ `
uniform vec3 uC;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
varying vec3 vW;
void main() {
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(uC, uFogCol, fg), 1.0);
}`;
const flatMat = (col: string) => {
  const u = sharedU();
  return new THREE.ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: FLAT_FRAG, side: THREE.DoubleSide, uniforms: { uC: { value: vec3Of(col) }, uFogRange: u.uFogRange, uFogCol: u.uFogCol } });
};
// the slot: a flat, unlit dark rounded rectangle a hair above the surface, a little larger than the phone's foot
const SLOT_VERT = /* glsl */ `
varying vec2 vQ;
varying vec3 vW;
void main() {
  vQ = position.xy;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SLOT_FRAG = /* glsl */ `
uniform vec3 uC;
uniform vec2 uHalf;
uniform float uR;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
varying vec2 vQ;
varying vec3 vW;
void main() {
  vec2 q = abs(vQ) - (uHalf - vec2(uR));
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uR;
  float w = fwidth(d);
  float a = 1.0 - smoothstep(-w, w, d);
  if (a < 0.003) discard;
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(uC, uFogCol, fg), a);
}`;
const SLOT_PAD = 0.9;
export const phoneShadowItems = (at: [number, number], o: { scale?: number; yaw?: number; rise?: number; lift?: number; alpha?: number } = {}): ShadowItem[] => {
  const s = o.scale ?? 1;
  const r = o.rise ?? 1;
  const lift = o.lift ?? 0;
  if (r <= 0) return [];
  const vis = PHONE.H * s * r + lift;
  const yaw = (o.yaw ?? 0) * D2R;
  const ax = Math.cos(yaw);
  const az = Math.sin(yaw);
  const rad = PHONE.T * 0.75 * s;
  const half = PHONE.W * 0.5 * s - rad;
  // the cast runs from the left end along the key; a lifted phone's shadow loosens and lightens with height
  return [
    {
      x: at[0] - ax * half + SHADOW_DIR[0] * lift * SHADOW_LEN,
      z: at[1] - az * half + SHADOW_DIR[1] * lift * SHADOW_LEN,
      len: 2 * half + (vis - lift) * SHADOW_LEN * 0.8,
      r: rad * (1 + 0.04 * lift),
      soft: rad * 0.6 + lift * 0.12,
      alpha: (o.alpha ?? 1) * smooth(0, 0.04, r) / (1 + lift * 0.03),
    },
  ];
};
export type NeobankPhoneProps = {
  at: [number, number];
  /** the surface it stands on (or rises out of) */
  y?: number;
  scale?: number;
  /** degrees about the vertical (three's sense); 0 shows the screen to -Z (south, a yaw-0 camera) */
  yaw?: number;
  /** 0 sunk in its slot .. 1 standing on the surface */
  rise?: number;
  /** height above the surface (a lifted or carried phone), world units */
  lift?: number;
  shadow?: number;
  /** the dark slot it rises from (default: shown while rise < 1 and lift is 0) */
  slot?: boolean;
};
export const NeobankPhone: React.FC<NeobankPhoneProps> = ({ at, y = 0, scale = 1, yaw = 0, rise = 1, lift = 0, shadow = 1, slot }) => {
  const o = useMemo(() => {
    const g = phoneGeo();
    const grp = new THREE.Group();
    const body = new THREE.Mesh(g.body, nuclearMaterial("amberFuel"));
    body.frustumCulled = false;
    body.renderOrder = 1;
    const screen = new THREE.Mesh(g.screen, flatMat(SCREEN_CREAM));
    screen.frustumCulled = false;
    screen.renderOrder = 2;
    const marks = new THREE.Mesh(g.marks, decalMat(getScreenTex(), DIM_INK));
    marks.frustumCulled = false;
    marks.renderOrder = 3;
    marks.material.uniforms.uText.value = 1;
    grp.add(body, screen, marks);
    const u = sharedU();
    const sm = new THREE.ShaderMaterial({
      vertexShader: SLOT_VERT,
      fragmentShader: SLOT_FRAG,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: { uC: { value: vec3Of(SLOT_COLOR) }, uHalf: { value: new THREE.Vector2(1, 1) }, uR: { value: 0.5 }, uFogRange: u.uFogRange, uFogCol: u.uFogCol },
    });
    const sq = new THREE.PlaneGeometry(1, 1);
    const slotMesh = new THREE.Mesh(sq, sm);
    slotMesh.frustumCulled = false;
    slotMesh.renderOrder = 0;
    return { grp, slotMesh, sm, sq };
  }, []);
  const showSlot = slot ?? (rise < 1 && lift <= 0);
  const hw = (PHONE.W / 2 + SLOT_PAD) * scale;
  const hd = (PHONE.T / 2 + SLOT_PAD) * scale;
  // the plane's own xy is the slot's (width, depth): rebuild its size by scale, lie it flat, turn it with the phone
  o.sq.attributes.position.setXYZ(0, -hw, hd, 0);
  o.sq.attributes.position.setXYZ(1, hw, hd, 0);
  o.sq.attributes.position.setXYZ(2, -hw, -hd, 0);
  o.sq.attributes.position.setXYZ(3, hw, -hd, 0);
  o.sq.attributes.position.needsUpdate = true;
  o.sm.uniforms.uHalf.value.set(hw, hd);
  o.sm.uniforms.uR.value = Math.min(hd, PHONE.R * 0.5 * scale);
  o.slotMesh.rotation.order = "YXZ";
  o.slotMesh.rotation.set(-Math.PI / 2, yaw * D2R, 0);
  o.slotMesh.position.set(at[0], y + 0.04, -at[1]);
  o.slotMesh.visible = showSlot;
  o.grp.position.set(at[0], y + lift - (1 - rise) * PHONE.H * scale * 1.002, -at[1]);
  o.grp.rotation.set(0, yaw * D2R, 0);
  o.grp.scale.setScalar(scale);
  return (
    <>
      {shadow > 0 && rise > 0 ? <SoftShadows items={phoneShadowItems(at, { scale, yaw, rise, lift, alpha: shadow })} y={y} /> : null}
      <primitive object={o.slotMesh} />
      <primitive object={o.grp} />
    </>
  );
};

// ===================================================================================================================
// THE US SLAB. The contiguous 48 states (us48Data.ts: us-atlas, Great Lakes as water) as one raised slab on the board, its top
// toned to the board (darker than the cream banks, lighter than the espresso ground), soft-bevelled edges, darker walls, one
// soft shadow on the board. The material is nuclearWorld's clay with the land's bevel and mottle added.
// ===================================================================================================================
export const US_SLAB = { W: 1000, T: 7, PPU: 3.2 } as const;
export const usSlabTop = () => US_SLAB.T;
const usProj = (() => geoAlbers().scale(US48_ALBERS.scale).translate(US48_ALBERS.translate))();
/** lon, lat -> world [X, Z] on the slab */
export const usProject = (lon: number, lat: number): [number, number] => {
  const q = usProj([lon, lat]);
  return [q[0], -q[1]];
};
type Ring = [number, number][];
const RINGS: { outer: Ring; holes: Ring[] }[] = US48_POLYS.map((p) => {
  const toRing = (a: number[]): Ring => {
    const r: Ring = [];
    for (let i = 0; i < a.length; i += 2) r.push([a[i], a[i + 1]]);
    return r;
  };
  return { outer: toRing(p.outer), holes: p.holes.map(toRing) };
});
const pointIn = (pt: [number, number], r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > pt[1] !== r[j][1] > pt[1] && pt[0] < ((r[j][0] - r[i][0]) * (pt[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
  }
  return inside;
};
const segDist = (p: [number, number], a: [number, number], b: [number, number]) => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = c01(((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
};
/** is the world point (X, Z) on the slab, at least `inset` units in from every coast and lake shore? */
export const usContains = (x: number, z: number, inset = 0) => {
  const p: [number, number] = [x, z];
  let hit: (typeof RINGS)[number] | null = null;
  for (const P of RINGS) {
    if (pointIn(p, P.outer) && !P.holes.some((h) => pointIn(p, h))) {
      hit = P;
      break;
    }
  }
  if (!hit) return false;
  if (inset <= 0) return true;
  for (const P of RINGS)
    for (const r of [P.outer, ...P.holes]) {
      for (let i = 0; i < r.length; i++) if (segDist(p, r[i], r[(i + 1) % r.length]) < inset) return false;
    }
  return true;
};
/** A jittered (and by default staggered) grid of bank sites on the slab: rows `pitchZ` apart, columns `pitchX` apart, each
 *  jittered by up to `jitter` (keep it under (pitch - footprint) / 2 for a minimum spacing). A site is kept when its footprint
 *  (`foot`, default 24 x 20: the block and most of the steps) sits `inset` in from the shore, plus `north` more on its far side (a
 *  standing bank's top projects north of its foot from a camera in the south), and it is outside every `clear` circle. Where a
 *  full bank does not fit (a narrow peninsula, a ragged coast), `small` (e.g. 0.7) tries a smaller one on the same site.
 *  Returns { at, scale } per site, south rows first. */
export const usBankSites = (o: {
  pitchX: number;
  pitchZ: number;
  jitter?: number;
  inset?: number;
  north?: number;
  foot?: [number, number];
  small?: number;
  /** with `small`: a second offset pass of small banks into the gaps the grid leaves along the coasts */
  fill?: boolean;
  seed?: string;
  clear?: { at: [number, number]; r: number }[];
  stagger?: boolean;
}) => {
  const out: { at: [number, number]; scale: number }[] = [];
  const jit = o.jitter ?? 0;
  const seed = o.seed ?? "usb";
  const box = US48_BOX;
  const ins = o.inset ?? 0;
  const nor = o.north ?? 0;
  const fits = (px: number, pz: number, k: number) => {
    const hw = ((o.foot?.[0] ?? 24) / 2) * k;
    const hd = ((o.foot?.[1] ?? 20) / 2) * k;
    const pts: [number, number][] = [
      [px - hw, pz - hd],
      [px + hw, pz - hd],
      [px - hw, pz + hd + nor * k],
      [px + hw, pz + hd + nor * k],
      [px, pz],
    ];
    return pts.every((q) => usContains(q[0], q[1], ins));
  };
  let row = 0;
  for (let z = box.minZ + o.pitchZ * 0.5; z < box.maxZ; z += o.pitchZ, row++) {
    const off = o.stagger === false ? 0 : (row % 2) * 0.5 * o.pitchX;
    for (let x = box.minX + o.pitchX * 0.25 + off; x < box.maxX; x += o.pitchX) {
      const px = x + (random(`${seed}x${row}:${Math.round(x)}`) * 2 - 1) * jit;
      const pz = z + (random(`${seed}z${row}:${Math.round(x)}`) * 2 - 1) * jit;
      if (o.clear?.some((c) => Math.hypot(px - c.at[0], pz - c.at[1]) < c.r)) continue;
      if (fits(px, pz, 1)) out.push({ at: [px, pz], scale: 1 });
      else if (o.small && fits(px, pz, o.small)) out.push({ at: [px, pz], scale: o.small });
    }
  }
  if (o.fill && o.small) {
    // a second, offset pass of small banks into whatever coastal gaps the grid left (keeping clear of every site)
    const k = o.small;
    const minX = BANK.W * 0.5 * (1 + k) + 4;
    const minZ = BANK.D * 0.5 * (1 + k) + 5;
    row = 0;
    for (let z = box.minZ + o.pitchZ * 0.5 - o.pitchZ / 2; z < box.maxZ; z += o.pitchZ / 2, row++) {
      for (let x = box.minX + (row % 2) * o.pitchX * 0.25; x < box.maxX; x += o.pitchX / 2) {
        if (out.some((q) => Math.abs(q.at[0] - x) < minX && Math.abs(q.at[1] - z) < minZ)) continue;
        if (o.clear?.some((c) => Math.hypot(x - c.at[0], z - c.at[1]) < c.r)) continue;
        // only where the grid left a hole (the shore, a narrow peninsula): inland gaps are the grid's own spacing
        if (out.some((q) => q.scale === 1 && Math.abs(q.at[0] - x) < o.pitchX * 0.75 && Math.abs(q.at[1] - z) < o.pitchZ * 0.75)) continue;
        if (fits(x, z, k)) out.push({ at: [x, z], scale: k });
      }
    }
  }
  return out;
};

type SlabData = { geo: Any; mask: Any; shadow: Any; box: [number, number, number, number] };
let slabCache: SlabData | null = null;
const buildSlab = (): SlabData => {
  if (slabCache) return slabCache;
  const pos: number[] = [];
  const nor: number[] = [];
  const tone: number[] = [];
  const idx: number[] = [];
  const all: Ring[] = [];
  for (const P of RINGS) {
    const faces = THREE.ShapeUtils.triangulateShape(
      P.outer.map((p) => new THREE.Vector2(p[0], p[1])),
      P.holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1]))),
    );
    const base = pos.length / 3;
    for (const p of [P.outer, ...P.holes].flat()) {
      pos.push(p[0], US_SLAB.T, -p[1]);
      nor.push(0, 1, 0);
      tone.push(1);
    }
    for (const f of faces) idx.push(base + f[0], base + f[1], base + f[2]);
    for (const r of [P.outer, ...P.holes]) {
      all.push(r);
      const b = pos.length / 3;
      const n = r.length;
      for (let i = 0; i <= n; i++) {
        const p = r[i % n];
        const prev = r[(i - 1 + n) % n];
        const next = r[(i + 1) % n];
        const dx = next[0] - prev[0];
        const dz = next[1] - prev[1];
        const l = Math.hypot(dx, dz) || 1;
        for (const tt of [0, 1]) {
          pos.push(p[0], tt * US_SLAB.T, -p[1]);
          // outward for a counter-clockwise outer ring (X east, Z north), in three's frame (z = -Z)
          nor.push(dz / l, 0, dx / l);
          tone.push(tt);
        }
      }
      for (let i = 0; i < n; i++) {
        const a = b + i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aTone", new THREE.BufferAttribute(new Float32Array(tone), 1));
  g.setAttribute("aMark", new THREE.BufferAttribute(new Float32Array(tone.length), 1));
  g.setIndex(idx);
  const pad = 30;
  const minX = US48_BOX.minX - pad;
  const minZ = US48_BOX.minZ - pad;
  const bw = US48_BOX.maxX - US48_BOX.minX + 2 * pad;
  const bh = US48_BOX.maxZ - US48_BOX.minZ + 2 * pad;
  const raster = (ppu: number, blur: number) => {
    const cw = Math.ceil(bw * ppu);
    const ch = Math.ceil(bh * ppu);
    const a = document.createElement("canvas");
    a.width = cw;
    a.height = ch;
    const ctx = a.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (const r of all) {
      r.forEach((p, i) => {
        const x = ((p[0] - minX) / bw) * cw;
        const y = ((p[1] - minZ) / bh) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill("evenodd");
    const o = document.createElement("canvas");
    o.width = cw;
    o.height = ch;
    const oc = o.getContext("2d") as CanvasRenderingContext2D;
    oc.filter = `blur(${blur}px)`;
    oc.drawImage(a, 0, 0);
    const t = new THREE.CanvasTexture(o);
    t.flipY = false;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  slabCache = { geo: g, mask: raster(US_SLAB.PPU, US_SLAB.PPU * 1.25), shadow: raster(1.6, 1.6 * 2.6), box: [minX, minZ, bw, bh] };
  return slabCache;
};
const SLAB_N_LINE = "if (dot(n, V) < 0.0) n = -n;";
const SLAB_OUT_LINE = "gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);";
const slabMaterial = (mask: Any, box: [number, number, number, number]) => {
  const src = nuclearMaterial("clay");
  let fs: string = src.fragmentShader;
  for (const l of [CLAY_BASE_LINE, SLAB_N_LINE, SLAB_OUT_LINE]) if (fs.indexOf(l) < 0) throw new Error("bankWorld: nuclearWorld's clay shader changed; update slabMaterial");
  fs = "uniform sampler2D uMask;\nuniform vec4 uBox;\nuniform float uBevel;\nuniform vec3 uTopCol;\n" + fs;
  fs = fs.replace(
    SLAB_N_LINE,
    `${SLAB_N_LINE}
  vec2 lp = vec2(vP.x, -vP.z);
  bool isTop = vN.y > 0.5;
  if (isTop) {
    vec2 uv = (lp - uBox.xy) / uBox.zw;
    vec2 e = 1.0 / vec2(textureSize(uMask, 0));
    float mx = texture2D(uMask, uv + vec2(e.x, 0.0)).r - texture2D(uMask, uv - vec2(e.x, 0.0)).r;
    float mz = texture2D(uMask, uv + vec2(0.0, e.y)).r - texture2D(uMask, uv - vec2(0.0, e.y)).r;
    n = normalize(vec3(-mx * uBevel, 1.0, mz * uBevel));
  } else {
    // walls: lean toward the viewer and up near the top so the edge rolls over softly
    vec3 toView = normalize(vec3(V.x, 0.0, V.z));
    n = normalize(mix(n, toView, 0.7) + vec3(0.0, 0.9 * smoothstep(0.35, 1.0, vTone) + 0.05, 0.0));
  }`,
  );
  fs = fs.replace(
    CLAY_BASE_LINE,
    `vec2 mq = lp * 0.05;
    float mott = vn(mq) * 0.6 + vn(mq * 3.1) * 0.4;
    vec3 base = uTopCol * (0.94 + 0.1 * mott);
    if (!isTop) base *= mix(0.6, 0.96, smoothstep(0.0, 0.8, vTone));`,
  );
  fs = fs.replace(SLAB_OUT_LINE, "gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);");
  return new THREE.ShaderMaterial({
    vertexShader: src.vertexShader,
    fragmentShader: fs,
    side: THREE.DoubleSide,
    blending: THREE.NoBlending,
    uniforms: {
      ...src.uniforms,
      uKind: { value: 0 },
      uSpin: { value: 0 },
      uMask: { value: mask },
      uBox: { value: new THREE.Vector4(box[0], box[1], box[2], box[3]) },
      uBevel: { value: 13 },
      uTopCol: { value: vec3Of(COLOR.board) },
    },
  });
};
// the slab's soft shadow on the board: a blurred copy of the land mask offset along the key, written into the shadow alpha
// exactly as SoftShadows does (MAX blending), depth-tested so the slab's own top hides it
const SLAB_SH_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = vec2(wp.x, -wp.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SLAB_SH_FRAG = /* glsl */ `
uniform sampler2D uSh;
uniform vec4 uBox;
uniform vec2 uOff;
uniform float uA;
varying vec2 vP;
void main() {
  vec2 uv = (vP - uOff - uBox.xy) / uBox.zw;
  float s = texture2D(uSh, uv).r;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) s = 0.0;
  gl_FragColor = vec4(0.0, 0.0, 0.0, s * uA);
}`;
/** default slab top: the board tone a quarter of the way to the espresso ground */
export const US_SLAB_TONE = mixHex(COLOR.board, COLOR.ground, 0.25);
export const UsSlab: React.FC<{ dim?: number; shadow?: number; tone?: string }> = ({ dim = 0, shadow = 1, tone = US_SLAB_TONE }) => {
  const o = useMemo(() => {
    const d = buildSlab();
    const mat = slabMaterial(d.mask, d.box);
    const me = new THREE.Mesh(d.geo, mat);
    me.frustumCulled = false;
    me.renderOrder = -90;
    const sg = new THREE.PlaneGeometry(d.box[2] + 60, d.box[3] + 60);
    sg.rotateX(-Math.PI / 2);
    sg.translate(d.box[0] + d.box[2] / 2, 0.25, -(d.box[1] + d.box[3] / 2));
    const l = (US_SLAB.T + 1.5) * SHADOW_LEN * 1.5;
    const sm = new THREE.ShaderMaterial({
      vertexShader: SLAB_SH_VERT,
      fragmentShader: SLAB_SH_FRAG,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.MaxEquation,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: { uSh: { value: d.shadow }, uBox: { value: new THREE.Vector4(d.box[0], d.box[1], d.box[2], d.box[3]) }, uOff: { value: new THREE.Vector2(SHADOW_DIR[0] * l, SHADOW_DIR[1] * l) }, uA: { value: 0.62 } },
    });
    const sh = new THREE.Mesh(sg, sm);
    sh.frustumCulled = false;
    sh.renderOrder = -81;
    return { me, mat, sh, sm };
  }, []);
  o.mat.uniforms.uTopCol.value.copy(vec3Of(mixHex(tone, COLOR.ground, c01(dim) * 0.5)));
  o.sm.uniforms.uA.value = 0.62 * shadow;
  return (
    <>
      <primitive object={o.me} />
      {shadow > 0 ? <primitive object={o.sh} /> : null}
    </>
  );
};
