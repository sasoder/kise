// SURVIVED_WORLD
// ===================================================================================================================
// survivedWorld: ThreeOrFourSurvived's bank tiles on nik-revolut-ipo's Europe slab (revolutWorld + nuclearWorld's
// NuclearStage, both imported unchanged). Put <BankField> in NuclearStage's `world` beside <RevolutWorld>.
//
//   a bank tile: a phone (portrait ~1:2.5, one small corner radius, a darker screen inset by a thin bezel, a small
//     camera pill under the screen's top edge), the same soft clay and key light as the slab; the style's dark tone by default
//     (ground mixed toward board, so the crowd stands out on the lit map), cream for a survivor, amber for Revolut's
//     payoff; the Revolut phone carries the real R (nik-trend-friend/revolutMark) in ink on its screen.
//   sinking: the tile drops straight down through a slot in the slab (the slab's top face hides what is below it),
//     darkening toward the dark tone as it goes; the slot opens under it and closes behind it (no hole left).
//   shadows: nuclearWorld's SoftShadows (MAX-blended alpha: a touching group casts one shadow), a contact strip along
//     the base plus a cast toward SHADOW_DIR that shortens with the visible height; a lifted tile's shadow slides out
//     along SHADOW_DIR and softens.
// ===================================================================================================================
import React, { useMemo } from "react";
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_DIR, SHADOW_LEN, SoftShadows, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "../nik-trend-friend/revolutMark";
import { SINK_DEPTH, SINK_GONE, SLAB_TOP, TILE, type PlacedBank } from "./survivedGeo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const col3 = (h: string) => new THREE.Vector3(...hex3(h));
const mixHex3 = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  return new THREE.Vector3(...A.map((v, i) => v + (B[i] - v) * t));
};

// --- shared uniforms (the slab's light and palette) ------------------------------------------------------------------
const U = {
  uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
  uFogRange: { value: new THREE.Vector2(1e5, 2e5) },
  uFogCol: { value: col3(COLOR.ground) },
  uShade: { value: col3("#A88A6E") },
  uCream: { value: col3(COLOR.cream) },
  uCreamFoot: { value: col3(COLOR.creamFoot) },
  uAmberTop: { value: col3(COLOR.amberTop) },
  uAmberFoot: { value: col3(COLOR.amberFoot) },
  uAmberHot: { value: col3(COLOR.amberHot) },
  uBoardTone: { value: col3(COLOR.board) },
  uBoardFoot: { value: col3(COLOR.boardFoot) },
  /** the dark rung of the tone ladder: ground mixed toward board */
  uDarkTone: { value: mixHex3(COLOR.ground, COLOR.board, 0.36) },
  uInk: { value: col3(COLOR.inkDark) },
};
const COMMON_GLSL = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uShade;
uniform vec3 uCream;
uniform vec3 uCreamFoot;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uBoardTone;
uniform vec3 uBoardFoot;
uniform vec3 uDarkTone;
uniform vec3 uInk;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
vec3 clayShade(vec3 base, vec3 n, vec3 V) {
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.42, 0.86, ndl);
  vec3 col = mix(base * uShade, base * 1.02, lit);
  col += base * vec3(0.10, 0.055, 0.02) * (1.0 - lit) * (0.45 - 0.45 * n.y);
  float graze = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 1.5);
  col *= 1.0 - 0.16 * graze * (1.0 - smoothstep(0.05, 0.7, n.y));
  col += base * 0.07 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
  col = mix(col, uCream, 0.4 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0) * smoothstep(0.05, 0.7, n.y));
  return col;
}
`;

// --- the tile geometry: a rounded rect extruded with a soft bevel; base at y 0, centred in x and z, front = +z -------
const BEVEL = 0.26;
let tileGeo: Any = null;
const tileGeometry = () => {
  if (tileGeo) return tileGeo;
  const w = TILE.W - 2 * BEVEL;
  const h = TILE.H - 2 * BEVEL;
  const r = TILE.R - BEVEL;
  const x0 = -w / 2;
  const y0 = BEVEL;
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
  const depth = TILE.D - 2 * BEVEL;
  const raw = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 14 });
  raw.translate(0, 0, -depth / 2);
  // smooth clay: weld the faces so the bevel and the rounded corners shade as one surface
  raw.deleteAttribute("uv");
  raw.deleteAttribute("normal");
  const g = mergeVertices(raw, 1e-4);
  g.computeVertexNormals();
  tileGeo = g;
  return g;
};

// --- the R: the real mark as an ink alpha texture, drawn once ----------------------------------------------------------
let rTex: Any = null;
const rTexture = () => {
  if (rTex) return rTex;
  const N = 512;
  const cv = document.createElement("canvas");
  cv.width = N;
  cv.height = N;
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, N, N);
  // the R fills R_FILL of the screen's width (a square at the screen's middle), optically centred (a hair right: its bowl carries the weight)
  const R_FILL = 0.64;
  const sc = (N * R_FILL) / REVOLUT_R_BOX.h;
  ctx.translate(N / 2 - (REVOLUT_R_BOX.w * sc) / 2 + N * 0.012, N / 2 - (REVOLUT_R_BOX.h * sc) / 2);
  ctx.scale(sc, sc);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(REVOLUT_R_D), "evenodd");
  const t = new THREE.CanvasTexture(cv);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  rTex = t;
  return t;
};

const TILE_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec3 vP;
varying vec3 vNl;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vP = position;
  vNl = normal;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const TILE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uCr;     // dark 0 .. cream 1
uniform float uAmb;    // amber 0..1
uniform float uDark;   // sinking: 0 .. the deep tone 1
uniform float uSweep;  // the light sweep's position across the tile, -0.25 .. 1.25 (off below -0.5)
uniform float uHasR;
uniform sampler2D uR;
uniform vec4 uScreen;  // screen half width, half height, centre y, corner radius
uniform vec3 uNotch;   // camera pill half width, half height, centre y
uniform float uH;
uniform float uHalfW;
uniform vec3 uDeep;    // where a sinking phone darkens to
varying vec3 vW;
varying vec3 vN;
varying vec3 vP;
varying vec3 vNl;
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float hy = clamp(vP.y / uH, 0.0, 1.0);
  vec3 dark = uDarkTone * (0.92 + 0.12 * hy);
  vec3 cream = mix(uCreamFoot, uCream, 0.3 + 0.7 * hy);
  vec3 base = mix(dark, cream, uCr);
  vec3 col = clayShade(base, n, V);
  // a soft fill on the front: the phone's face toward us reads at its own tone
  float fz = clamp(vNl.z, 0.0, 1.0);
  col = mix(col, base, 0.5 * fz);
  if (uAmb > 0.001) {
    float lit = smoothstep(-0.5, 0.9, dot(n, uL));
    vec3 amb = mix(uAmberFoot, uAmberTop, 0.3 + 0.7 * lit);
    amb = mix(amb, uAmberHot, 0.55 * pow(max(n.y, 0.0), 5.0));
    amb = mix(amb, mix(uAmberFoot, uAmberTop, 0.75), 0.5 * fz);
    col = mix(col, amb, uAmb);
  }
  // the screen: a darker rounded rect inside a thin bezel, a small camera pill just under its top edge
  float front = smoothstep(0.82, 0.97, vNl.z);
  if (front > 0.0) {
    vec2 q = vec2(vP.x, vP.y - uScreen.z);
    float sd = sdRound(q, uScreen.xy, uScreen.w);
    float sn = sdRound(vec2(vP.x, vP.y - uNotch.z), uNotch.xy, uNotch.y);
    float aa = fwidth(sd) * 0.9;
    vec3 face = col;
    float inside = (1.0 - smoothstep(-aa, aa, sd)) * front;
    // the screen sits a step darker than the phone's own face in every tone (a dark phone's screen deepest)
    float lightTone = max(uCr, uAmb);
    vec3 scr = col * mix(0.56, 0.9, lightTone);
    // a faint sheen across the glass, upper left, so it reads as a screen
    float sheen = smoothstep(0.35, 0.0, abs((q.x / uScreen.x) * 0.55 + (q.y / uScreen.y) * 0.8 - 0.55)) * 0.05;
    scr += sheen * mix(vec3(1.0), vec3(0.6), lightTone);
    col = mix(col, scr, inside);
    // the pill: the bezel's own tone on a dark phone (a lighter slot in the dark glass), near-ink on a light one
    vec3 pill = mix(face * 1.08, mix(scr, uInk, 0.8), lightTone);
    float pa = (1.0 - smoothstep(-fwidth(sn), fwidth(sn), sn)) * inside;
    col = mix(col, pill, pa);
    if (uHasR > 0.5) {
      vec2 uv = q / (2.0 * uScreen.x) + 0.5;
      float a = texture2D(uR, uv).a * inside;
      col = mix(col, uInk, a);
    }
  }
  // the light sweep (on amber only): a soft skewed band crossing the phone left to right
  if (uSweep > -0.5 && uAmb > 0.5) {
    float u = (vP.x / (2.0 * uHalfW) + 0.5) + 0.4 * (vP.y / uH - 0.5);
    float b = 1.0 - smoothstep(0.0, 0.16, abs(u - uSweep));
    col = mix(col, uAmberHot, 0.5 * b);
  }
  col = mix(col, uDeep * mix(0.85, 1.0, hy), uDark);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;

// --- the slot: a dark rounded rect in the slab top that opens under a sinking tile and closes behind it --------------
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
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uSlotCol;
uniform vec2 uHalf;
uniform float uOpen;
varying vec2 vQ;
varying vec3 vW;
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 hb = uHalf * vec2(mix(0.35, 1.0, uOpen), uOpen);
  float sd = sdRound(vQ, hb, min(hb.x, hb.y) * 0.9);
  float aa = fwidth(sd) * 1.2 + 0.05;
  float a = (1.0 - smoothstep(-aa, aa, sd)) * smoothstep(0.0, 0.12, uOpen);
  float fog = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(uSlotCol, uFogCol, fog), a * 0.86);
}`;
/** the slot is exactly the tile's footprint: it shows only as the opening the tile stands in */
const SLOT_HALF: [number, number] = [TILE.W / 2, TILE.D / 2];

export type TileState = {
  /** 0 standing .. 1 gone (survivors 0) */
  sink: number;
  /** slot opening 0..1 */
  slot: number;
  cream: number;
  amber: number;
  /** lift above the slab, world units */
  lift: number;
  /** -1 off, else the sweep position 0..1 */
  sweep: number;
};

type TileObj = { mesh: Any; mat: Any; slot: Any; slotMat: Any };
/** The field of bank tiles, their slots and their shadows. `states` by bank id. */
export const BankField: React.FC<{ cam: NuclearCam; banks: PlacedBank[]; states: Record<string, TileState>; fog: [number, number] }> = ({ cam, banks, states, fog }) => {
  U.uFogRange.value.set(cam.d * fog[0], cam.d * fog[1]);
  const objs = useMemo(() => {
    const geo = tileGeometry();
    const rt = rTexture();
    const slotGeo = new THREE.PlaneGeometry(2 * SLOT_HALF[0] + 0.6, 2 * SLOT_HALF[1] + 0.6);
    const out: Record<string, TileObj> = {};
    for (const b of banks) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: TILE_VERT,
        fragmentShader: TILE_FRAG,
        side: THREE.FrontSide,
        uniforms: {
          ...U,
          uCr: { value: 0 },
          uAmb: { value: 0 },
          uDark: { value: 0 },
          uSweep: { value: -1 },
          uHasR: { value: b.revolut ? 1 : 0 },
          uR: { value: rt },
          uScreen: { value: new THREE.Vector4(TILE.W / 2 - TILE.BEZEL, TILE.H / 2 - TILE.BEZEL * 1.35, TILE.H / 2, TILE.SCREEN_R) },
          uNotch: { value: new THREE.Vector3(TILE.NOTCH_W / 2, TILE.NOTCH_H / 2, TILE.H - TILE.BEZEL * 1.35 - 0.3 - TILE.NOTCH_H / 2) },
          uH: { value: TILE.H },
          uHalfW: { value: TILE.W / 2 },
          uDeep: { value: mixHex3(COLOR.ground, COLOR.board, 0.1) },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      const slotMat = new THREE.ShaderMaterial({
        vertexShader: SLOT_VERT,
        fragmentShader: SLOT_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uFogRange: U.uFogRange,
          uFogCol: U.uFogCol,
          uSlotCol: { value: mixHex3(COLOR.ground, COLOR.board, 0.12) },
          uHalf: { value: new THREE.Vector2(SLOT_HALF[0], SLOT_HALF[1]) },
          uOpen: { value: 0 },
        },
      });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.rotation.x = -Math.PI / 2;
      slot.frustumCulled = false;
      slot.renderOrder = -60;
      out[b.id] = { mesh, mat, slot, slotMat };
    }
    return out;
  }, [banks]);

  const shadows: ShadowItem[] = [];
  for (const b of banks) {
    const s = states[b.id];
    const o = objs[b.id];
    // gone the frame its top passes below the slab surface: tile, slot and shadow all stop on that frame
    const gone = s.sink >= SINK_GONE;
    o.mesh.visible = !gone;
    o.mesh.position.set(b.x, SLAB_TOP + s.lift - s.sink * (TILE.H + SINK_DEPTH), -b.z);
    o.mat.uniforms.uCr.value = c01(s.cream);
    o.mat.uniforms.uAmb.value = c01(s.amber);
    // darkens a step as it goes (half way to the deep tone): the last stub reads as a phone going down, not a hole
    o.mat.uniforms.uDark.value = 0.5 * smooth(0.0, 0.75, s.sink);
    o.mat.uniforms.uSweep.value = s.sweep;
    o.slot.visible = !gone && s.slot > 0.001;
    o.slot.position.set(b.x, SLAB_TOP + 0.03, -b.z);
    o.slotMat.uniforms.uOpen.value = c01(s.slot);
    if (gone) continue;
    // shadows: the visible height above the slab, the lift sliding the cast out along SHADOW_DIR
    const hv = Math.max(0, TILE.H * (1 - s.sink) - SINK_DEPTH * s.sink);
    if (hv <= 0.05) continue;
    const L = hv * SHADOW_LEN;
    const off = s.lift * SHADOW_LEN * 1.6;
    const ox = SHADOW_DIR[0] * off;
    const oz = SHADOW_DIR[1] * off;
    const liftSoft = 1 + s.lift * 0.55;
    const liftA = 1 / (1 + s.lift * 0.35);
    const vis = smooth(0, 0.6, hv);
    const r = TILE.D / 2 + 0.3;
    // the contact strip along the base
    shadows.push({ x: b.x - TILE.W / 2 + r + ox, z: b.z + oz, len: TILE.W - 2 * r, r: r * liftSoft, soft: 0.3 * liftSoft, alpha: vis * liftA, dirX: 1, dirZ: 0 });
    // the cast toward SHADOW_DIR from the tile's body
    shadows.push({ x: b.x + ox, z: b.z + oz, len: L + TILE.W * 0.42, r: (TILE.D / 2 + 0.45) * liftSoft, soft: 0.6 * liftSoft, alpha: vis * 0.9 * liftA });
  }
  return (
    <>
      <SoftShadows items={shadows} y={SLAB_TOP + 0.02} />
      {banks.map((b) => (
        <React.Fragment key={b.id}>
          <primitive object={objs[b.id].slot} />
          <primitive object={objs[b.id].mesh} />
        </React.Fragment>
      ))}
    </>
  );
};
