// ===================================================================================================================
// stackParts: the parts of OwnTheWholeStack (nik-neobanks-us, cut 44) on nuclearWorld's stage. RENDER --gl=angle.
//  - the amber layer slabs of the one-company stack (TECH, COMPLIANCE, BANK LICENSE), each with an ink glyph and an ink
//    Söhne Kräftig caps label printed on its front face;
//  - the cream paper reams of the application pile (visible sheet edges, a few binder clips, an embossed seal on the top
//    sheet of the last one).
// World units as nuclearWorld: X right, Y up (board = 0), Z away from the camera; three's z = -Z.
// ===================================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender } from "remotion";
import { COLOR, FONT_LABEL, METRIC, TRACK } from "../kits/cheeky-pint/stoutShared";
import { SHADOW_DIR, SHADOW_LEN, nuclearMaterial, withClayAttrs, type V3 } from "../scott-nolan-uranium/nuclearWorld";
import { COMMON_GLSL, THREE, energyClay, flipZ, merge, rbox, sharedUniforms, vec3Of } from "../scott-nolan-wind/energyCore";
// @ts-expect-error untyped module
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;

// ===================================================================================================================
// THE LAYER SLABS
// ===================================================================================================================
/** one slab: W across (X), D deep (Z), H tall, R its edge radius (the seam between two slabs is two such radii) */
export const SLAB = { W: 100, D: 70, H: 30, R: 1.4 } as const;
export type LayerKind = "tech" | "compliance" | "license";
export const LAYER_TEXT: Record<LayerKind, string> = { tech: "TECH", compliance: "COMPLIANCE", license: "BANK LICENSE" };
/** the face print, in slab units: glyph box height, label cap height, the gap between them */
export const FACE = { GLYPH: 17, CAP: 5.9, GAP: 5 } as const;

const PXU = 16; // canvas px per world unit on the face texture
const FONT_PX = FACE.CAP / METRIC.cap * PXU; // canvas font size for the cap height
const FONT_CSS = `500 ${FONT_PX.toFixed(2)}px ${FONT_LABEL}`;
const INK = COLOR.inkDark;
/** the glyphs, drawn in Lucide grammar (24-unit box, 2.6 stroke, round caps and joins) */
const drawGlyph = (g: CanvasRenderingContext2D, kind: LayerKind) => {
  g.strokeStyle = INK;
  g.fillStyle = INK;
  g.lineWidth = 2.6;
  g.lineCap = "round";
  g.lineJoin = "round";
  if (kind === "tech") {
    // code: six indented lines of different lengths (a block opened, nested, closed)
    const rows: [number, number][] = [
      [2.5, 12],
      [7.5, 19],
      [12.5, 21.5],
      [7.5, 14],
      [2.5, 6.5],
    ];
    rows.forEach(([x0, x1], i) => {
      const y = 3.2 + i * 4.4;
      g.beginPath();
      g.moveTo(x0, y);
      g.lineTo(x1, y);
      g.stroke();
    });
  } else if (kind === "compliance") {
    // Lucide shield-check (ISC)
    g.stroke(new Path2D("M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"));
    g.stroke(new Path2D("m9 12 2 2 4-4"));
  } else {
    // a certificate: a landscape document with two lines of text, a round seal over its lower right corner, two ribbon tails
    const r = 1.6;
    g.beginPath();
    g.moveTo(1.5 + r, 3);
    g.arcTo(22.5, 3, 22.5, 17.5, r);
    g.arcTo(22.5, 17.5, 1.5, 17.5, r);
    g.arcTo(1.5, 17.5, 1.5, 3, r);
    g.arcTo(1.5, 3, 22.5, 3, r);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.moveTo(5.5, 7.6);
    g.lineTo(18.5, 7.6);
    g.moveTo(5.5, 11.6);
    g.lineTo(11.5, 11.6);
    g.stroke();
    // the seal's clearance ring (the document line stops short of it), then the tails and the seal
    const sx = 17.2;
    const sy = 15.2;
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(sx, sy, 5.4, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const tail = (s: number) => {
      g.beginPath();
      g.moveTo(sx - s * 1.2, sy + 2.2);
      g.lineTo(sx - s * 3.1, sy + 8.4);
      g.lineTo(sx - s * 1.9, sy + 7.6);
      g.lineTo(sx - s * 1.0, sy + 8.9);
      g.lineTo(sx + s * 0.6, sy + 2.9);
      g.closePath();
      g.fill();
    };
    tail(1);
    tail(-1);
    g.beginPath();
    g.arc(sx, sy, 4.1, 0, Math.PI * 2);
    g.fill();
    // the seal's inner ring, in the slab's own colour
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(sx, sy, 2.5, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
};
const labelWidth = (g: CanvasRenderingContext2D, text: string) => {
  const track = TRACK.label * FONT_PX;
  return [...text].reduce((a, ch) => a + g.measureText(ch).width, 0) + track * (text.length - 1);
};
type FaceTex = { tex: Any };
/** the face print of one slab: glyph left, label right, the group centred on the face; ink on transparent */
const drawFace = (kind: LayerKind): FaceTex => {
  const cv = document.createElement("canvas");
  cv.width = Math.round(SLAB.W * PXU);
  cv.height = Math.round(SLAB.H * PXU);
  const g = cv.getContext("2d") as CanvasRenderingContext2D;
  g.font = FONT_CSS;
  const text = LAYER_TEXT[kind];
  const lw = labelWidth(g, text) / PXU;
  const gw = FACE.GLYPH;
  const total = gw + FACE.GAP + lw;
  const x0 = (SLAB.W - total) / 2;
  const cy = SLAB.H / 2;
  // glyph: the 24 box scaled to FACE.GLYPH units, centred on the face's mid line
  g.save();
  g.translate(x0 * PXU, (cy - gw / 2) * PXU);
  g.scale((gw / 24) * PXU, (gw / 24) * PXU);
  drawGlyph(g, kind);
  g.restore();
  // label: caps, house tracking, the cap block centred on the mid line
  g.fillStyle = INK;
  g.font = FONT_CSS;
  g.textBaseline = "alphabetic";
  let x = (x0 + gw + FACE.GAP) * PXU;
  const base = (cy + FACE.CAP / 2) * PXU;
  for (const ch of text) {
    g.fillText(ch, x, base);
    x += g.measureText(ch).width + TRACK.label * FONT_PX;
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return { tex };
};

// ThreeCanvas renders with frameloop "never": once the faces are drawn, draw the frame again before releasing the render
// (the energyLabels pattern), so no frame goes out without its print.
const useFaces = () => {
  const [faces, setFaces] = useState<Record<LayerKind, FaceTex> | null>(null);
  const [handle] = useState(() => delayRender("stackParts: font"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!faces) return;
    advance(performance.now());
    requestAnimationFrame(() => continueRender(handle));
  }, [faces, advance, handle]);
  useEffect(() => {
    let live = true;
    document.fonts
      .load(FONT_CSS, "TECHCOMPLIANCEBANKLICENSE")
      .then(() => {
        if (!live) return;
        setFaces({ tech: drawFace("tech"), compliance: drawFace("compliance"), license: drawFace("license") });
      })
      .catch(() => continueRender(handle));
    return () => {
      live = false;
    };
  }, [handle]);
  return faces;
};

const FACE_VERT = /* glsl */ `
varying vec3 vW;
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FACE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uMap;
uniform vec3 uInk;
uniform float uA;
uniform float uSlide;
varying vec3 vW;
varying vec2 vUv;
void main() {
  // the print slides up into place while it fades in (uSlide: face units still to travel, as a uv offset)
  float a = texture2D(uMap, vec2(vUv.x, vUv.y + uSlide)).a * uA;
  if (a < 0.004) discard;
  vec3 n = vec3(0.0, 0.0, 1.0);
  float lit = smoothstep(-0.42, 0.86, dot(n, uL));
  vec3 col = uInk * mix(0.86, 1.06, lit);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), a);
}`;

export type SlabItem = {
  kind: LayerKind;
  /** the slab's centre on the board [X, Z] and its base height */
  at: [number, number];
  y: number;
  /** the face print: 0 blank .. 1 in place (slides up a little while it fades in) */
  print?: number;
};
const slabGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    g = new RoundedBoxGeometry(SLAB.W, SLAB.H, SLAB.D, 3, SLAB.R);
    g.translate(0, SLAB.H / 2, 0);
    withClayAttrs(g, 1, 0);
    return g;
  };
})();
const OneSlab: React.FC<{ it: SlabItem; face: FaceTex | null }> = ({ it, face }) => {
  const o = useMemo(() => {
    const body = new THREE.Mesh(slabGeo(), nuclearMaterial("amberFuel"));
    body.frustumCulled = false;
    body.renderOrder = 2;
    const pg = new THREE.PlaneGeometry(SLAB.W, SLAB.H);
    pg.translate(0, SLAB.H / 2, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: FACE_VERT,
      fragmentShader: FACE_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { ...sharedUniforms(), uMap: { value: null }, uInk: { value: vec3Of(INK) }, uA: { value: 1 }, uSlide: { value: 0 } },
    });
    const print = new THREE.Mesh(pg, mat);
    print.frustumCulled = false;
    print.renderOrder = 3;
    return { body, print, mat };
  }, []);
  const p = Math.max(0, Math.min(1, it.print ?? 1));
  o.body.position.set(it.at[0], it.y, -it.at[1]);
  // the print sits a hair in front of the front face (three's +z is toward the camera)
  o.print.position.set(it.at[0], it.y, -it.at[1] + SLAB.D / 2 + 0.06);
  o.mat.uniforms.uMap.value = face ? face.tex : null;
  o.mat.uniforms.uA.value = p;
  o.mat.uniforms.uSlide.value = (1 - p) * (1 - p) * 0.12;
  o.print.visible = !!face && p > 0.002;
  return (
    <>
      <primitive object={o.body} />
      <primitive object={o.print} />
    </>
  );
};
/** the amber layer slabs (items in any order); mount inside the stage's world */
export const StackSlabs: React.FC<{ items: SlabItem[] }> = ({ items }) => {
  const faces = useFaces();
  return (
    <>
      {items.map((it) => (
        <OneSlab key={it.kind} it={it} face={faces ? faces[it.kind] : null} />
      ))}
    </>
  );
};

// ===================================================================================================================
// THE PAPER REAMS. A real ream (500 sheets of letter): 8.5 x 11 in, about 2 in thick. One instanced draw; each item has its
// own height (a ream, or a single loose sheet that sticks out of the pile a little). The sides show fine sheet edges (fading
// with distance so they never strobe); a top sheet carries faint printed text lines (it is an application form), and one
// can carry the embossed seal. Item origin = the centre of the foot; W across (local x), L deep (local z), h up; yaw in
// degrees (+ turns right).
// ===================================================================================================================
export const REAM_REAL = { W: 8.5, L: 11, H: 2 } as const;
export type ReamSize = { W: number; L: number };
export type ReamItem = { at: V3; yaw: number; seed: number; h: number; seal?: number; text?: number };
/** a ream that is still falling: the soft contact shade it throws on the pile's top face (world), 0 alpha = none */
export type ReamDrop = { x: number; z: number; y: number; yaw: number; alpha: number };
/** sheet-edge lines per world unit of height */
const LINES_PER_UNIT = 3.2;
const REAM_VERT = /* glsl */ `
attribute float iSeed;
attribute float iSeal;
attribute float iText;
attribute float iH;
uniform vec3 uSize;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
varying vec3 vLN;
varying float vSeed;
varying float vSeal;
varying float vText;
varying float vH;
void main() {
  vec3 lp = position * vec3(uSize.x, iH, uSize.z);
  vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vL = vec3(lp.x, lp.y, -lp.z);
  vLN = vec3(normal.x, normal.y, -normal.z);
  vSeed = iSeed;
  vSeal = iSeal;
  vText = iText;
  vH = iH;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const REAM_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uSize;
uniform vec3 uEdgeLo;
uniform vec3 uInk;
uniform vec3 uPaperWhite;
uniform vec3 uShadowCol;
uniform vec4 uDrop;      // x, z (three), bottom y, alpha
uniform vec2 uDropRot;   // cos, sin of the falling ream's yaw
uniform vec2 uShDir;     // world SHADOW_DIR in three's x, z
uniform float uShLen;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
varying vec3 vLN;
varying float vSeed;
varying float vSeal;
varying float vText;
varying float vH;
float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
// the embossed seal: a raised disc with a scalloped rim, a sunk ring, a raised boss; r in units of the seal radius
float sealH(vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float rimR = 1.0 + 0.055 * cos(a * 28.0);
  float h = 1.0 - smoothstep(rimR - 0.06, rimR, r);
  h -= 0.55 * (smoothstep(0.66, 0.7, r) - smoothstep(0.76, 0.8, r));
  h += 0.45 * (1.0 - smoothstep(0.5, 0.54, r));
  return h;
}
const vec2 SEAL_C = vec2(0.66, 0.3);   // on the top face, sw units (x right, y = 0 front .. 1 back)
const float SEAL_R = 0.2;              // in units of the face width
// printed text: a title bar near the back, then body rows of varying length, faint ink
float textMask(vec2 sw, float seed, float seal) {
  float px = max(fwidth(sw.x), fwidth(sw.y) * 0.77);
  float fade = 1.0 - smoothstep(0.02, 0.05, px);
  if (fade <= 0.0) return 0.0;
  float m = 0.0;
  // title
  {
    float y0 = 0.86; float hh = 0.017;
    float x1 = 0.2 + 0.22 * h1(seed * 7.0);
    float dx = max(max(0.14 - sw.x, sw.x - (0.14 + x1)), 0.0);
    float dy = abs(sw.y - y0) - hh;
    m = max(m, 1.0 - smoothstep(0.0, px * 1.5 + 0.002, max(dx, dy)));
  }
  for (int i = 0; i < 11; i++) {
    float fi = float(i);
    float y0 = 0.77 - fi * 0.058;
    float hh = 0.011;
    float len = 0.45 + 0.27 * h1(seed * 13.0 + fi);
    if (i == 4 || i == 9) len *= 0.45;
    float x0 = 0.14;
    float x1 = x0 + len;
    // rows that would run into the seal stop short of it
    if (seal > 0.5 && abs(y0 - SEAL_C.y) < SEAL_R * 0.77 * 1.25 + 0.03) x1 = min(x1, SEAL_C.x - SEAL_R * 1.15);
    float dx = max(x0 - sw.x, sw.x - x1);
    float dy = abs(sw.y - y0) - hh;
    m = max(m, 1.0 - smoothstep(0.0, px * 1.5 + 0.002, max(dx, dy)));
  }
  return m * fade;
}
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec2 sw = vec2(vL.x / uSize.x + 0.5, vL.z / uSize.z + 0.5);
  float yf = vL.y / max(vH, 1e-4);
  bool top = vLN.y > 0.5;
  bool bottom = vLN.y < -0.5;
  bool thin = vH < 1.0;
  // each ream its own paper: bright white to warm cream
  float tintK = h1(vSeed * 91.0);
  vec3 paperHi = mix(uPaperWhite, uCream, tintK);
  vec3 paperLo = mix(paperHi, uCreamFoot, 0.7);
  vec3 base = paperHi;
  if (top || bottom) {
    float pe = max(fwidth(sw.x), fwidth(sw.y));
    float ed = min(min(sw.x, 1.0 - sw.x), min(sw.y, 1.0 - sw.y));
    // a softened edge: the sheet's rim rolls off a little
    float rim = 1.0 - smoothstep(0.0, 0.018 + pe * 1.5, ed);
    base = mix(paperHi, paperLo, 0.45 * rim);
    if (top && vText > 0.5) base = mix(base, uInk, 0.5 * textMask(sw, vSeed, vSeal));
    if (top && vSeal > 0.5) {
      // emboss: perturb the normal by the seal's height gradient (cream on cream; the light finds it)
      vec2 c = vec2((sw.x - SEAL_C.x) * uSize.x, (sw.y - SEAL_C.y) * uSize.z) / (SEAL_R * uSize.x);
      float e = 0.02;
      float hx = sealH(c + vec2(e, 0.0)) - sealH(c - vec2(e, 0.0));
      float hz = sealH(c + vec2(0.0, e)) - sealH(c - vec2(0.0, e));
      float fw = fwidth(c.x);
      float k = 1.5 * (1.0 - smoothstep(0.08, 0.35, fw));
      n = normalize(vec3(-hx * k * 6.0, 1.0, hz * k * 6.0));
    }
  } else if (thin) {
    base = mix(paperLo, paperHi, 0.8);
  } else {
    // sheet edges, two scales so the edge reads as many thin sheets near and far: fine single sheets (they fade out before they
    // could strobe), and under them irregular groups of sheets of slightly different tone and set (they fade later)
    float along = (abs(vLN.x) > 0.5 ? vL.z : vL.x);
    float alongF = (abs(vLN.x) > 0.5 ? sw.y : sw.x);
    float wav = 0.05 * sin(along * 0.17 + vSeed * 40.0) + 0.04 * sin(along * 0.53 + vSeed * 13.0);
    float u = vL.y * ${LINES_PER_UNIT.toFixed(3)} + wav;
    float py = fwidth(u);
    float fr = fract(u);
    float leaf = h1(floor(u) + vSeed * 31.0);
    vec3 c = mix(paperLo, paperHi, 0.45 + 0.55 * leaf);
    float seam = 1.0 - smoothstep(0.0, 0.2 + py, min(fr, 1.0 - fr));
    c = mix(c, uEdgeLo, seam * 0.5);
    float u2 = vL.y * 0.85 + wav * 2.0;
    float k2 = floor(u2);
    float g = h1(k2 + vSeed * 17.0);
    vec3 c2 = mix(paperLo, paperHi, 0.35 + 0.65 * g);
    float fr2 = fract(u2);
    float py2 = fwidth(u2);
    float seam2 = 1.0 - smoothstep(0.0, 0.1 + py2, min(fr2, 1.0 - fr2));
    c2 = mix(c2, uEdgeLo, seam2 * 0.42);
    base = mix(c, c2, smoothstep(0.16, 0.42, py));
    base = mix(base, mix(paperLo, paperHi, 0.7), smoothstep(0.3, 0.7, py2));
    // softened ream: the top edge rolls into the light, the foot tucks into a shaded seam, the vertical corners roll off
    float pyf = fwidth(yf);
    base *= 1.0 - 0.24 * (1.0 - smoothstep(0.0, 0.06 + pyf, yf));
    base = mix(base, paperHi * 1.04, 0.5 * (1.0 - smoothstep(0.0, 0.07 + pyf, 1.0 - yf)));
    float pa = fwidth(alongF);
    base *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.03 + pa, min(alongF, 1.0 - alongF)));
    base *= 1.06;
  }
  base *= 0.985 + 0.03 * vSeed;
  vec3 col;
  if (top) col = clayShade(base, n, V);
  else {
    // paper edges stay light in shade (thin sheets scatter light): a shallow warm falloff, not the clay's deep one
    float lit = smoothstep(-0.6, 0.8, dot(n, uL));
    col = mix(base * vec3(0.8, 0.76, 0.69), base * 1.03, lit);
  }
  // the falling ream's soft shade on this top face, thrown along the key and softer the higher it is
  if (top && uDrop.w > 0.001) {
    float gap = uDrop.z - vW.y;
    if (gap > -0.1) {
      vec2 p = vec2(vW.x, vW.z) - (vec2(uDrop.x, uDrop.y) + uShDir * max(gap, 0.0) * uShLen);
      vec2 q = vec2(uDropRot.x * p.x - uDropRot.y * p.y, uDropRot.y * p.x + uDropRot.x * p.y);
      vec2 hs = vec2(uSize.x, uSize.z) * 0.5;
      vec2 d = abs(q) - hs;
      float out_ = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      float soft = 1.0 + gap * 0.35;
      float m = 1.0 - smoothstep(-soft, soft, out_);
      float a = uDrop.w * m * (1.0 - smoothstep(0.0, uSize.z * 1.6, gap));
      col = mix(col, uShadowCol, 0.42 * a);
    }
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
/** Many reams (and loose sheets) of one footprint in one draw. Keep items.length fixed across frames. */
export const PaperReams: React.FC<{ items: ReamItem[]; size: ReamSize; drop?: ReamDrop }> = ({ items, size, drop }) => {
  const n = Math.max(1, items.length);
  const o = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    const attr = () => new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    const iSeed = attr();
    const iSeal = attr();
    const iText = attr();
    const iH = attr();
    g.setAttribute("iSeed", iSeed);
    g.setAttribute("iSeal", iSeal);
    g.setAttribute("iText", iText);
    g.setAttribute("iH", iH);
    const mat = new THREE.ShaderMaterial({
      vertexShader: REAM_VERT,
      fragmentShader: REAM_FRAG,
      uniforms: {
        ...sharedUniforms(),
        uSize: { value: new THREE.Vector3(1, 1, 1) },
        uEdgeLo: { value: vec3Of("#CDBFA8") },
        uInk: { value: vec3Of(COLOR.inkDark) },
        uPaperWhite: { value: vec3Of("#FBF8F2") },
        uShadowCol: { value: vec3Of(COLOR.shadow) },
        uDrop: { value: new THREE.Vector4(0, 0, 0, 0) },
        uDropRot: { value: new THREE.Vector2(1, 0) },
        uShDir: { value: new THREE.Vector2(SHADOW_DIR[0], -SHADOW_DIR[1]) },
        uShLen: { value: SHADOW_LEN },
      },
    });
    const mesh = new THREE.InstancedMesh(g, mat, n);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    return { mesh, mat, iSeed, iSeal, iText, iH };
  }, [n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  const P = new THREE.Vector3();
  items.forEach((it, i) => {
    E.set(0, -it.yaw * D2R, 0);
    Q.setFromEuler(E);
    P.set(it.at[0], it.at[1], -it.at[2]);
    M.compose(P, Q, S1);
    o.mesh.setMatrixAt(i, M);
    o.iSeed.setX(i, it.seed);
    o.iSeal.setX(i, it.seal ?? 0);
    o.iText.setX(i, it.text ?? 1);
    o.iH.setX(i, it.h);
  });
  o.mesh.count = items.length;
  o.mesh.instanceMatrix.needsUpdate = true;
  o.iSeed.needsUpdate = o.iSeal.needsUpdate = o.iText.needsUpdate = o.iH.needsUpdate = true;
  o.mat.uniforms.uSize.value.set(size.W, 1, size.L);
  if (drop && drop.alpha > 0.001) {
    o.mat.uniforms.uDrop.value.set(drop.x, -drop.z, drop.y, drop.alpha);
    // the shader turns a world offset into the falling ream's local frame (three's x, z)
    o.mat.uniforms.uDropRot.value.set(Math.cos(drop.yaw * D2R), -Math.sin(drop.yaw * D2R));
  } else o.mat.uniforms.uDrop.value.set(0, 0, 0, 0);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// BINDER CLIPS: a deep-brown clip gripping a ream's front edge (the spine on the front face, the jaw over the top sheet), its
// two wire handles folded down over the front. The jaw adds CLIP_JAW to the ream's height in the pile.
// ===================================================================================================================
export const CLIP = { W: 22, H: 10, JAW: 8, T: 2.6, WIRE: 0.8, DROP: 17 } as const;
export const CLIP_JAW = 0.5;
const CLIP_BODY = "#4A3122";
const CLIP_WIRE = "#E4DACA";
const painted = (g: Any, hex: string) => {
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color(hex);
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
  return g;
};
const clipCache: Record<string, Any> = {};
const clipGeo = (up = false) => {
  {
    const key = up ? "up" : "down";
    if (clipCache[key]) return clipCache[key];
    const { W, H, JAW, T, WIRE, DROP } = CLIP;
    // local: x along the edge, y up (0 = the ream's top), z away from the edge into the ream (world Z), front face at z = 0
    const spine = rbox(W, H, T, 0, -H + CLIP_JAW, -T / 2, 0.9, CLIP_BODY);
    const jaw = rbox(W, CLIP_JAW + 0.3, JAW + T, 0, 0, (JAW + T) / 2 - T, 0.3, CLIP_BODY);
    const parts = [spine, jaw];
    // the handles: two wire loops from the spine's top corners, folded down in front of the spine and below it, converging
    const xTop = W / 2 - 2.2;
    const xBot = W / 2 - 5.2;
    // up: the handles stand up from the spine and lean back over the top sheet (only on a ream nothing lies on)
    const endY = up ? CLIP_JAW + DROP * 0.85 : -DROP;
    const endZ = up ? 5.5 : -T - 1.3;
    for (const s of [-1, 1]) {
      const pts = up
        ? [
            new THREE.Vector3(s * xTop, CLIP_JAW - 0.6, -T - 0.1),
            new THREE.Vector3(s * xTop, CLIP_JAW + 1.2, -T - 0.9),
            new THREE.Vector3(s * (xTop + xBot) * 0.5, CLIP_JAW + DROP * 0.45, 0.6),
            new THREE.Vector3(s * xBot, endY, endZ),
          ]
        : [
            new THREE.Vector3(s * xTop, CLIP_JAW - 0.6, -T - 0.1),
            new THREE.Vector3(s * xTop, CLIP_JAW + 0.9, -T - 1.3),
            new THREE.Vector3(s * (xTop + xBot) * 0.5, -DROP * 0.5, -T - 1.5),
            new THREE.Vector3(s * xBot, -DROP, -T - 1.3),
          ];
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.3);
      parts.push(painted(new THREE.TubeGeometry(curve, 18, WIRE, 8, false), CLIP_WIRE));
    }
    const bar = new THREE.CylinderGeometry(WIRE, WIRE, xBot * 2, 8);
    bar.rotateZ(Math.PI / 2);
    bar.translate(0, endY, endZ);
    parts.push(painted(bar, CLIP_WIRE));
    clipCache[key] = flipZ(merge(parts));
    return clipCache[key];
  }
};
/** one clip: `top` = the ream's top centre (world), `edgeOff` = local x offset along the front edge, the ream's yaw and depth */
export type ClipItem = { top: V3; yaw: number; edgeOff: number; reamL: number; up?: boolean };
export const BinderClips: React.FC<{ items: ClipItem[] }> = ({ items }) => {
  const o = useMemo(() => {
    const mat = energyClay([], 0);
    return items.map((it) => {
      const me = new THREE.Mesh(clipGeo(!!it.up), mat);
      me.frustumCulled = false;
      me.renderOrder = 2;
      return me;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  items.forEach((it, i) => {
    const me = o[i];
    const a = it.yaw * D2R;
    // the front edge's midpoint, then along the edge: local x -> world (cos a, -sin a), local -z (toward camera) -> world (-sin a, -cos a)
    const fx = it.top[0] - Math.sin(a) * (it.reamL / 2) + Math.cos(a) * it.edgeOff;
    const fz = it.top[2] - Math.cos(a) * (it.reamL / 2) - Math.sin(a) * it.edgeOff;
    me.position.set(fx, it.top[1], -fz);
    me.rotation.set(0, -a, 0);
  });
  return (
    <>
      {o.map((me: Any, i: number) => (
        <primitive key={i} object={me} />
      ))}
    </>
  );
};

// ===================================================================================================================
// THE SLOT under the stack: a dark opening a hair above the board (it hides whatever is still below it, so a rising slab
// comes out of it), framed by a low board-toned kerb. w across X, d deep (Z).
// ===================================================================================================================
export const SLOT_COLOR = "#35241A";
const SLOT_FLAT_FRAG = /* glsl */ `
uniform vec3 uC;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
varying vec3 vW;
void main() {
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(uC, uFogCol, fg), 1.0);
}`;
const SLOT_FLAT_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
export const SlotPlate: React.FC<{ at: [number, number]; w: number; d: number; rim: number }> = ({ at, w, d, rim }) => {
  const o = useMemo(() => {
    const u = sharedUniforms();
    const hole = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({ vertexShader: SLOT_FLAT_VERT, fragmentShader: SLOT_FLAT_FRAG, uniforms: { uC: { value: vec3Of(SLOT_COLOR) }, uFogRange: u.uFogRange, uFogCol: u.uFogCol } }),
    );
    hole.position.y = 0.06;
    hole.renderOrder = 1;
    hole.frustumCulled = false;
    const h = rim * 0.4;
    const kerb = merge([
      rbox(w + 2 * rim, h, rim, 0, 0, d / 2 + rim / 2, h * 0.45, COLOR.board),
      rbox(w + 2 * rim, h, rim, 0, 0, -d / 2 - rim / 2, h * 0.45, COLOR.board),
      rbox(rim, h, d, w / 2 + rim / 2, 0, 0, h * 0.45, COLOR.board),
      rbox(rim, h, d, -w / 2 - rim / 2, 0, 0, h * 0.45, COLOR.board),
    ]);
    const km = new THREE.Mesh(kerb, energyClay([], 0));
    km.renderOrder = 1;
    km.frustumCulled = false;
    const grp = new THREE.Group();
    grp.add(hole, km);
    return grp;
  }, [w, d, rim]);
  o.position.set(at[0], 0, -at[1]);
  return <primitive object={o} />;
};
