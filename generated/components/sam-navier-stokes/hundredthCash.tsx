// ---------------------------------------------------------------------------
// hundredthCash (sam-navier-stokes, cut 1, Rev 3): the cost as giant banknote bundles standing in the vortex sky
// (vortexSky.tsx's world), drawn in three.js so they sit in the same light, fog and cloud as the vortex. The bundle is
// hundredthMoney.tsx's (cream-sage notes after will-drone-cost/ShipDayRate.tsx, ONE amber bank strap round the middle,
// the note's engraving: border, portrait oval, seal, corner figures), here a box per STACK with its faces drawn in the
// fragment shader: the top note face up, the long sides (the notes' edges, a dark seam under each bundle, the strap
// running down), the ends (edges and seams, no strap).
// The deck swallows a stack the way it hides the vortex's foot: the fragment ray-march toward the eye through the
// deck's heaps (a COPY of vortexSky's CLOUD_GLSL, itself wifiSky's deck shader ported; vortexSky does not export it),
// the foot dissolving into the cloud's tone. So a stack sinks by moving DOWN into the heap it stands in: height and
// fog, never opacity. Light, bounce, the cloud tone and the distance fog follow vortexSky's VORTEX_FRAG.
// WORLD: aircraftShared's metres, X right, Y up, Z away from the camera (three's z = -Z). Render --gl=angle.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { LIGHT, horizonRow, type AirCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { DECK } from "../scott-free-wifi/wifiSky";
import { VORTEX_AIR, VORTEX_FOG } from "./vortexSky";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const glv = (h: string) => `vec3(${hex3(h).map((c) => c.toFixed(4)).join(", ")})`;

/** a bundle in metres: the note face w x d (ShipDayRate's 150 : 64), t thick, the strap's share of the width */
export type Bundle = { w: number; d: number; t: number; strap: number };
/** hundredthMoney's note colours */
const NOTE = { hi: "#DCDFC6", mid: "#C3CAAC", lo: "#9AA287", edgeHi: "#EEEBDA", strapLo: "#C98600", strapInk: "#6E4A10", print: "#4F6250" } as const;
const SEAM = "#3A2A1C";
const mixh = (a: string, b: string, t: number) => {
  const x = hex3(a);
  const y = hex3(b);
  return "#" + x.map((c, i) => Math.round(255 * (c + (y[i] - c) * t)).toString(16).padStart(2, "0")).join("");
};

// --- vortexSky's CLOUD_GLSL, copied verbatim (the deck's heaps; it is not exported there) ---------------------------------
const CLOUD_GLSL = /* glsl */ `
uniform float uTime;
float h21(vec2 p) {
  p = mod(p, 4096.0);
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 h22(vec2 p) {
  p = mod(p, 4096.0);
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
float heaps(vec2 x, float empty, float k) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float acc = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 id = n + g;
      vec2 o = h22(id);
      float keep = step(empty, h21(id + 3.17));
      vec2 c = g + 0.2 + 0.6 * o;
      float r = (0.72 + 0.28 * h21(id + 7.31)) * (1.0 + 0.03 * sin(uTime * 0.045 + 6.283 * o.x));
      vec2 d = f - c;
      float q = 1.0 - dot(d, d) / (r * r);
      float hh = q > 0.0 ? sqrt(q) * r * (0.55 + 0.45 * o.y) * keep : 0.0;
      acc = smax(acc, hh, k);
    }
  }
  return acc;
}
float cloudH(vec2 p) {
  float big = heaps(p / 3600.0, 0.22, 0.22);
  float on = smoothstep(0.05, 0.35, big);
  float mid = heaps(p / 1400.0 + 3.7, 0.1, 0.2) * on;
  float sm = heaps(p / 550.0 + 9.1, 0.0, 0.18) * on;
  return 0.62 * (3600.0 * big + 1400.0 * mid + 240.0 * sm);
}
`;

const CASH_VERT = /* glsl */ `
uniform vec3 uO;          // the stack's front-left-bottom corner (three coords)
varying vec3 vW;
varying vec3 vL;
varying vec3 vN;
varying vec2 vScr;
void main() {
  vL = position;
  vN = normal;
  vec3 w = uO + vec3(position.x, position.y, -position.z);
  vW = w;
  vec4 clip = projectionMatrix * viewMatrix * vec4(w, 1.0);
  gl_Position = clip;
  vScr = vec2(540.0 + 540.0 * clip.x / clip.w, 960.0 - 960.0 * clip.y / clip.w);
}`;
const CASH_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uSize;       // w, H, d (m)
uniform float uT;         // one bundle's thickness (m)
uniform float uStrap;     // the strap's share of the width
uniform float uGlow;      // 0..1: the strap lit (the one that stays)
uniform vec3 uFogP;
uniform float uHor;
uniform vec3 uSky[7];
uniform float uSkyO[7];
uniform vec2 uSunC;
uniform vec3 uSunCol;
uniform float uDeckBase;
uniform float uDeckTop;
uniform vec2 uDrift;
uniform vec3 uCloud;
uniform vec3 uCloudShade;
varying vec3 vW;
varying vec3 vL;
varying vec3 vN;
varying vec2 vScr;
${CLOUD_GLSL}
vec3 skyCol(vec2 sp) {
  float u = (sp.y - (uHor - 1250.0)) / 1250.0;
  vec3 col = uSky[6];
  if (u <= 0.0) col = uSky[0];
  else if (u < 1.0) {
    for (int i = 1; i < 7; i++) {
      if (u <= uSkyO[i]) {
        col = mix(uSky[i - 1], uSky[i], (u - uSkyO[i - 1]) / (uSkyO[i] - uSkyO[i - 1]));
        break;
      }
    }
  }
  float r = length(sp - uSunC) / 780.0;
  float a = r < 0.35 ? mix(0.72, 0.24, r / 0.35) : (r < 1.0 ? mix(0.24, 0.0, (r - 0.35) / 0.65) : 0.0);
  if (sp.y < uHor + 22.0) col = mix(col, uSunCol, a);
  return col;
}
float aaw(float x) { return fwidth(x) * 0.75 + 1e-5; }
float inside(float sd) { float w = aaw(sd); return 1.0 - smoothstep(-w, w, sd); }
float line1(float sd, float hw) { float w = aaw(sd); return 1.0 - smoothstep(hw - w, hw + w, abs(sd)); }
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
// the note's face in ShipDayRate's units (150 x 64); st = how much of it is the strap
vec3 noteFace(vec2 p, out float st) {
  vec3 c = mix(${glv(NOTE.hi)}, ${glv(NOTE.mid)}, 0.75 * smoothstep(0.0, 64.0, p.y));
  vec3 ink = ${glv(NOTE.print)};
  c = mix(c, ink, 0.85 * line1(sdBox(p - vec2(75.0, 32.0), vec2(70.0, 28.0)), 0.8));
  c = mix(c, mix(ink, ${glv(NOTE.mid)}, 0.5), 0.8 * line1(sdBox(p - vec2(75.0, 32.0), vec2(67.0, 25.0)), 0.4));
  float e = (length((p - vec2(36.0, 32.0)) / vec2(12.0, 19.2)) - 1.0) * 12.0;
  c = mix(c, mix(${glv(NOTE.mid)}, ink, 0.3), inside(e));
  c = mix(c, ink, 0.85 * line1(e, 0.6));
  c = mix(c, mix(ink, ${glv(NOTE.mid)}, 0.35), 0.85 * line1(length(p - vec2(120.0, 32.0)) - 12.2, 0.55));
  vec3 fig = mix(ink, ${glv(NOTE.mid)}, 0.4);
  c = mix(c, fig, inside(sdBox(p - vec2(15.5, 11.5), vec2(4.5, 2.5)) - 0.6));
  c = mix(c, fig, inside(sdBox(p - vec2(134.5, 11.5), vec2(4.5, 2.5)) - 0.6));
  c = mix(c, fig, inside(sdBox(p - vec2(15.5, 52.5), vec2(4.5, 2.5)) - 0.6));
  c = mix(c, fig, inside(sdBox(p - vec2(134.5, 52.5), vec2(4.5, 2.5)) - 0.6));
  st = inside(abs(p.x - 75.0) - 75.0 * uStrap);
  return c;
}
void main() {
  // --- the deck's heads hide what is in them: march from here toward the eye while below the deck's ceiling
  float occ = 1.0;
  float inCloud = 0.0;
  if (vW.y < uDeckTop + 20.0) {
    vec3 rd = normalize(cameraPosition - vW);
    float m = vW.y - (uDeckBase + cloudH(vW.xz - uDrift));
    float tMax = rd.y > 1e-3 ? min((uDeckTop - vW.y) / rd.y, 5000.0) : 5000.0;
    tMax = min(tMax, length(cameraPosition - vW));
    for (int i = 1; i <= 18; i++) {
      float t = tMax * (float(i) / 18.0) * (float(i) / 18.0);
      vec3 p = vW + rd * t;
      if (p.y > uDeckTop) break;
      m = min(m, p.y - (uDeckBase + cloudH(p.xz - uDrift)));
    }
    occ = smoothstep(-10.0, 140.0, m);
    inCloud = 1.0 - occ;
    if (occ < 0.04) discard;
  }
  vec3 nl = normalize(vN);
  vec3 n = vec3(nl.x, nl.y, -nl.z);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.55, 0.7, ndl);
  float s = fract(vL.y / uT);                       // within a bundle: 0 at its foot, 1 at its top
  float st = 0.0;
  vec3 base;
  if (nl.y > 0.5) {
    // the top note, face up (its portrait toward -X)
    base = noteFace(vec2(vL.x / uSize.x * 150.0, (1.0 - vL.z / uSize.z) * 64.0), st);
  } else if (nl.y < -0.5) {
    base = ${glv(NOTE.lo)};
  } else {
    // a side: the notes' edges, sheet lines, a dark seam under each bundle, a lit lip at its top
    vec3 edge = mix(${glv(NOTE.edgeHi)}, ${glv(NOTE.mid)}, 0.3);
    base = mix(edge, mix(edge, ${glv(NOTE.mid)}, 0.55), smoothstep(0.9, 0.15, s));
    float sh = 0.0;
    sh = max(sh, line1(s - 0.26, 0.018));
    sh = max(sh, line1(s - 0.44, 0.018));
    sh = max(sh, line1(s - 0.62, 0.018));
    sh = max(sh, line1(s - 0.8, 0.018));
    base = mix(base, mix(${glv(NOTE.mid)}, ${glv(NOTE.lo)}, 0.6), 0.55 * sh);
    float seam = 1.0 - smoothstep(0.085 - aaw(s), 0.085 + aaw(s), s);
    base = mix(base, mix(${glv(NOTE.lo)}, ${glv(SEAM)}, 0.62), seam);
    base = mix(base, ${glv("#F6F3E6")}, smoothstep(0.955 - aaw(s), 0.955 + aaw(s), s));
    // the strap runs down the long sides only
    if (abs(nl.z) > 0.5) st = inside(abs(vL.x / uSize.x - 0.5) - 0.5 * uStrap) * (1.0 - seam);
  }
  vec3 col = mix(base * ${glv("#B49A7A")}, base * vec3(1.03, 1.0, 0.94), lit);
  col = mix(col, col * ${glv("#E9CFA6")}, 0.3 * max(-n.y, 0.0));
  // the bank strap: the cost's amber, lit like the vortex's amber; lit hotter on the one that stays
  if (st > 0.001) {
    float g = nl.y > 0.5 ? 0.0 : s;
    vec3 am = mix(${glv(COLOR.amberFoot)}, ${glv(COLOR.amberTop)}, nl.y > 0.5 ? 0.85 : 0.35 + 0.5 * g);
    am = mix(${glv(COLOR.amberFoot)} * 0.66, am * 1.03, lit);
    vec3 hot = mix(${glv(COLOR.amberTop)}, ${glv(COLOR.amberHot)}, 0.35 + 0.4 * lit);
    am = mix(am, hot, uGlow);
    if (nl.y < 0.5) am = mix(am, ${glv(NOTE.strapLo)} * 0.8, 0.5 * (1.0 - smoothstep(0.0, 0.4, s)) * (1.0 - 0.6 * uGlow));
    col = mix(col, am, st);
    // the strap's dark label, on the top note
    if (nl.y > 0.5) {
      vec2 p = vec2(vL.x / uSize.x * 150.0, (1.0 - vL.z / uSize.z) * 64.0);
      col = mix(col, ${glv(mixh(NOTE.strapInk, NOTE.strapLo, 0.3))}, st * inside(sdBox(p - vec2(75.0, 32.0), vec2(75.0 * uStrap - 4.0, 2.5))));
    }
  }
  // --- into the cloud: the foot dissolves into the deck's tone
  // (all the way to the cloud's own tone, so a stack's last sinking corner never ghosts its amber through the deck)
  col = mix(col, mix(uCloudShade, uCloud, lit * 0.6 + 0.4), smoothstep(0.0, 0.85, inCloud));
  // --- distance fog toward the sky behind this fragment (a little less on the lit strap, like the vortex's amber)
  vec3 sky = skyCol(vScr);
  float d = length(vW - cameraPosition);
  float f = uFogP.z * (1.0 - exp(-max(0.0, d - uFogP.x) / uFogP.y));
  f *= 1.0 - 0.5 * st * uGlow;
  gl_FragColor = vec4(mix(col, sky, f), 1.0);
}`;
const SKY_O = [0, 0.24, 0.46, 0.66, 0.83, 0.93, 1];
const SKY_C = [SKY.top, SKY.upper, SKY.amber, SKY.mid, SKY.low, SKY.glow, SKY.haze];
const makeCashMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: CASH_VERT,
    fragmentShader: CASH_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uO: { value: new THREE.Vector3() },
      uL: { value: new THREE.Vector3(LIGHT.side[0], LIGHT.side[1], -LIGHT.side[2]) },
      uSize: { value: new THREE.Vector3(1, 1, 1) },
      uT: { value: 1 },
      uStrap: { value: 0.2 },
      uGlow: { value: 0 },
      uFogP: { value: new THREE.Vector3(VORTEX_FOG.near, VORTEX_FOG.vis, VORTEX_FOG.max) },
      uHor: { value: 960 },
      uSky: { value: SKY_C.map((c) => v3(c)) },
      uSkyO: { value: SKY_O },
      uSunC: { value: new THREE.Vector2(230, 640) },
      uSunCol: { value: v3(SKY.sun) },
      uDeckBase: { value: DECK.base },
      uDeckTop: { value: DECK.top },
      uDrift: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uCloud: { value: v3("#F7EEDD") },
      uCloudShade: { value: v3("#C9AE8C") },
    },
  });
const geoCache = new Map<string, Any>();
const boxGeo = (w: number, h: number, d: number) => {
  const key = `${w.toFixed(2)}x${h.toFixed(2)}x${d.toFixed(2)}`;
  const have = geoCache.get(key);
  if (have) return have;
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(w / 2, h / 2, d / 2);
  geoCache.set(key, g);
  return g;
};

export type CashStackProps = {
  cam: AirCam;
  /** story clock (the deck's drift and billow) */
  S: number;
  /** the stack's front-left foot, world [X, Y, Z] (Z = its near face) */
  at: V3;
  /** bundles in the stack */
  n: number;
  bundle: Bundle;
  /** 0..1: the strap lit (the one that stays) */
  glow?: number;
  air?: V3;
};
/** One stack of n bundles (in a VortexStage's `world`). Sink it by lowering `at[1]` into the heap it stands in. */
export const CashStack: React.FC<CashStackProps> = ({ cam, S, at, n, bundle, glow = 0, air = VORTEX_AIR }) => {
  const H = n * bundle.t;
  const o = useMemo(() => {
    const mat = makeCashMat();
    const mesh = new THREE.Mesh(boxGeo(bundle.w, H, bundle.d), mat);
    mesh.frustumCulled = false;
    return { mesh, mat };
  }, [bundle.w, bundle.d, H]);
  const u = o.mat.uniforms;
  u.uO.value.set(at[0], at[1], -at[2]);
  u.uSize.value.set(bundle.w, H, bundle.d);
  u.uT.value = bundle.t;
  u.uStrap.value = bundle.strap;
  u.uGlow.value = c01(glow);
  u.uDrift.value.set(air[0] * S, -air[2] * S);
  u.uTime.value = S;
  u.uHor.value = horizonRow(cam);
  const yawPx = cam.mode === "side" ? (cam.yaw ?? 0) * D2R * cam.f : 0;
  u.uSunC.value.set(230 - yawPx * 0.9, horizonRow(cam) - 320);
  return <primitive object={o.mesh} />;
};
