// ---------------------------------------------------------------------------
// notTotallyWrongGround — the cut-local ground paint of NotTotallyWrong (scott-aircraft-order, cut 37): the runway
// as cut 5 needs it (60 m wide, ICAO piano keys / centreline / edge lines; no aiming-point or touchdown-zone bars),
// the one target (a bullseye), the zone's four corner brackets, the edge lights, the desert's life and dim, the tyre
// marks and the tyre smoke. three.js meshes for <AirStage world> (plan view: no distance fog), so they sit
// on the world's ground, UNDER the jet's shadow and the jet (the stage's amber bloom catches the amber).
// Coordinates: x across (m, + right), s along the runway (m, = world Z, + up the screen); three.js z = -s.
// The world (aircraftShared.tsx) is read-only; nothing here restates its exports.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR } from "./aircraftShared";
import { RWY } from "./notTotallyWrongPlan";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));

/** The ground paint's own tones (before the stage's grade). */
export const GROUND_TONE = {
  asphalt: AIR_COLOR.asphalt, // the world's runway asphalt
  asphaltLo: "#5F5246",
  rubber: "#4A3E35", // tyre rubber on the asphalt (warm, never black)
  paint: AIR_COLOR.paint,
  /** the target and the zone's corners: the stout amber */
  barHi: COLOR.amberTop,
  hot: COLOR.amberHot,
  dim: "#33220F", // what the desert recedes toward
  scrub: "#6A5532", // low brush (olive-brown, never green)
  drift: "#D6BC93", // pale wind-blown sand
  dust: "#CDB491", // the dust along the shoulders
  lightOff: "#D8CCB6",
  smoke: "#EDE5D6",
  smokeLo: "#B9AE9C",
} as const;

const NOISE_GLSL = /* glsl */ `
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
  return s;
}`;
const VERT = /* glsl */ `
attribute float aKind;
varying vec2 vP;
varying vec2 vUv;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = vec2(wp.x, -wp.z);
  vUv = uv;
  vKind = aKind;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

/** quads on the ground: [x0, s0, x1, s1] boxes at height y, with a kind per quad */
const boxGeo = (boxes: { b: [number, number, number, number]; kind?: number }[], y: number) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const kind: number[] = [];
  const idx: number[] = [];
  for (const { b, kind: k = 0 } of boxes) {
    const base = pos.length / 3;
    const [x0, s0, x1, s1] = b;
    for (const [x, s, u, v] of [
      [x0, s0, 0, 0],
      [x1, s0, 1, 0],
      [x1, s1, 1, 1],
      [x0, s1, 0, 1],
    ]) {
      pos.push(x, y, -s);
      uv.push(u, v);
      kind.push(k);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(kind), 1));
  g.setIndex(idx);
  return g;
};
const mat = (frag: string, uniforms: Record<string, { value: Any }>, transparent: boolean) =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    transparent,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
const meshOf = (g: Any, m: Any, order: number) => {
  const o = new THREE.Mesh(g, m);
  o.frustumCulled = false;
  o.renderOrder = order;
  return o;
};

// ===========================================================================
// THE DESERT: a sheet over the world's ground (under the runway). Always: a little life in the sand (scrub patches,
// pale drifts, the dust the jets have blown along the shoulders). From the flood: the "totally wrong" zone recedes
// by tone, so the lit runway is the brightest broad shape in the frame.
// ===========================================================================
const DESERT_FRAG = /* glsl */ `
uniform vec3 uDim;
uniform float uDimA;
uniform vec3 uScrub;
uniform vec3 uDrift;
uniform vec3 uDust;
uniform float uHalfW;
varying vec2 vP;
${NOISE_GLSL}
void main() {
  vec2 p = vP;
  vec2 dp = fwidth(p);
  float px = max(dp.x, dp.y);
  // scrub: clumped patches of low brush, dotted where the camera is close enough to resolve them
  float clump = smoothstep(0.52, 0.72, fbm(p * 0.03 + 4.0));
  float dots = smoothstep(0.7, 0.86, vnoise(p * 0.55)) * (1.0 - smoothstep(0.15, 0.45, px));
  float scrub = clamp(clump * (0.2 + 0.4 * dots) + dots * 0.1, 0.0, 0.5);
  // pale wind drifts, long across the wind
  float drift = smoothstep(0.55, 0.78, fbm(vec2(p.x * 0.012 + p.y * 0.004, p.y * 0.03))) * 0.22;
  // the dust blown out along the shoulders by the landings (pale, streaked along the runway)
  float sd = abs(p.x) - uHalfW;
  float dust = exp(-pow((sd - 9.0) / 9.0, 2.0)) * (0.55 + 0.45 * fbm(vec2(p.x * 0.2, p.y * 0.012))) * step(0.0, sd) * 0.3;
  // compose (premultiplied): drift, dust, scrub, then the dim over everything
  vec3 c = vec3(0.0);
  float a = 0.0;
  c = uDrift * drift + c * (1.0 - drift); a = drift + a * (1.0 - drift);
  c = uDust * dust + c * (1.0 - dust); a = dust + a * (1.0 - dust);
  c = uScrub * scrub + c * (1.0 - scrub); a = scrub + a * (1.0 - scrub);
  c = uDim * uDimA + c * (1.0 - uDimA); a = uDimA + a * (1.0 - uDimA);
  gl_FragColor = vec4(c / max(a, 1e-4), a);
}`;
export const DesertDim: React.FC<{ amount: number }> = ({ amount }) => {
  const o = useMemo(
    () =>
      meshOf(
        boxGeo([{ b: [-6000, -6000, 6000, 9000] }], 0.012),
        mat(
          DESERT_FRAG,
          {
            uDim: { value: v3(GROUND_TONE.dim) },
            uDimA: { value: 0 },
            uScrub: { value: v3(GROUND_TONE.scrub) },
            uDrift: { value: v3(GROUND_TONE.drift) },
            uDust: { value: v3(GROUND_TONE.dust) },
            uHalfW: { value: RWY.W / 2 },
          },
          true,
        ),
        -2.9,
      ),
    [],
  );
  o.material.uniforms.uDimA.value = 0.6 * amount;
  return <primitive object={o} />;
};

// ===========================================================================
// THE RUNWAY SURFACE: asphalt (aggregate, broad tone, rubber in the wheel tracks)
// ===========================================================================
const SURF_FRAG = /* glsl */ `
uniform vec3 uAs;
uniform vec3 uAsLo;
uniform vec3 uRub;
uniform float uHalfW;
varying vec2 vP;
${NOISE_GLSL}
void main() {
  vec2 p = vP;
  vec2 dp = fwidth(p);
  float px = max(dp.x, dp.y);
  // asphalt: broad tone, fine aggregate (faded out before it aliases), slab seams across every 25 m
  float broad = fbm(p * vec2(0.05, 0.012));
  vec3 col = mix(uAsLo, uAs, 0.45 + 0.55 * broad);
  float agg = vnoise(p * 3.1) * (1.0 - smoothstep(0.08, 0.35, px));
  col *= 0.96 + 0.08 * agg;
  // rubber in the wheel tracks of the touchdown zone (soft, longitudinal)
  float tracks = exp(-pow((abs(p.x) - 4.9) / 2.4, 2.0)) + 0.5 * exp(-pow(p.x / 1.6, 2.0));
  float tz = smoothstep(120.0, 260.0, p.y) * (1.0 - smoothstep(700.0, 1100.0, p.y));
  float streak = fbm(vec2(p.x * 0.9, p.y * 0.02));
  col = mix(col, uRub, clamp(tracks * tz * (0.25 + 0.5 * streak), 0.0, 0.55));
  // edge softening into the shoulder
  float e = smoothstep(uHalfW + 0.6, uHalfW - 0.2, abs(p.x));
  gl_FragColor = vec4(col, e);
}`;
export const RunwaySurface: React.FC = () => {
  const o = useMemo(
    () =>
      meshOf(
        boxGeo([{ b: [-RWY.W / 2 - 1, -40, RWY.W / 2 + 1, RWY.LEN + 60] }], 0.02),
        mat(
          SURF_FRAG,
          {
            uAs: { value: v3(GROUND_TONE.asphalt) },
            uAsLo: { value: v3(GROUND_TONE.asphaltLo) },
            uRub: { value: v3(GROUND_TONE.rubber) },
            uHalfW: { value: RWY.W / 2 },
          },
          true,
        ),
        -2.6,
      ),
    [],
  );
  return <primitive object={o} />;
};

// ===========================================================================
// THE PAINT: piano keys, centreline, edge lines (cream and quiet; no aiming-point bars: the target replaces them)
// ===========================================================================
const PAINT_FRAG = /* glsl */ `
uniform vec3 uPaint;
varying vec2 vP;
${NOISE_GLSL}
void main() {
  // worn paint: a little of the asphalt's tone breaks through
  float wear = smoothstep(0.62, 0.8, fbm(vP * vec2(0.9, 0.25)));
  gl_FragColor = vec4(uPaint * (0.97 - 0.1 * wear), 1.0 - 0.28 * wear);
}`;
const paintBoxes = (): { b: [number, number, number, number]; kind?: number }[] => {
  const out: { b: [number, number, number, number]; kind?: number }[] = [];
  const hw = RWY.W / 2;
  // edge lines (inside the edges)
  out.push({ b: [-hw + 0.4, 0, -hw + 0.4 + RWY.EDGE.w, RWY.LEN] });
  out.push({ b: [hw - 0.4 - RWY.EDGE.w, 0, hw - 0.4, RWY.LEN] });
  // piano keys: 8 a side, 3 m in from the edges, a wider gap at the centre
  const K = RWY.KEYS;
  const pitch = 3.3;
  for (let i = 0; i < K.n / 2; i++) {
    const xo = hw - 3 - i * pitch;
    out.push({ b: [xo - K.w, K.s0, xo, K.s0 + K.len] });
    out.push({ b: [-xo, K.s0, -xo + K.w, K.s0 + K.len] });
  }
  // centreline dashes (and none across the aiming bars' start, as on the real thing they do not overlap)
  for (let s = RWY.CL.s0; s < RWY.LEN - 60; s += RWY.CL.dash + RWY.CL.gap) out.push({ b: [-RWY.CL.w / 2, s, RWY.CL.w / 2, s + RWY.CL.dash] });
  return out;
};
export const RunwayPaint: React.FC = () => {
  const o = useMemo(
    () =>
      meshOf(
        boxGeo(paintBoxes(), 0.04),
        mat(
          PAINT_FRAG,
          {
            uPaint: { value: v3(GROUND_TONE.paint) },
          },
          true,
        ),
        -2.4,
      ),
    [],
  );
  return <primitive object={o} />;
};

// ===========================================================================
// THE TARGET: one bullseye (ring + dot) on the centreline at the ideal touchdown spot. Cream paint until its light
// runs out from the dot over the ring; then the hottest amber in the picture (hot core, the stage's fixed bloom).
// ===========================================================================
const RING_FRAG = /* glsl */ `
uniform vec2 uC;      // centre (x, s)
uniform float uR;     // ring centre radius
uniform float uW;     // ring width
uniform float uDot;   // dot radius
uniform float uFront; // the light's radius (m)
uniform vec3 uPaint;
uniform vec3 uAmber;
uniform vec3 uHot;
varying vec2 vP;
void main() {
  float r = length(vP - uC);
  float aa = max(fwidth(r), 1e-4) * 0.8;
  float ringD = abs(r - uR) - uW * 0.5;
  float dotD = r - uDot;
  float d = min(ringD, dotD);
  float a = 1.0 - smoothstep(-aa, aa, d);
  if (a < 0.002) discard;
  float lit = 1.0 - smoothstep(uFront - 1.2, uFront, r);
  // the hot core: the ring's centre line and the dot's middle
  float core = max(1.0 - smoothstep(0.0, uW * 0.32, abs(r - uR)), 1.0 - smoothstep(0.0, uDot * 0.6, r));
  vec3 amber = mix(uAmber, uHot, 0.55 * core);
  gl_FragColor = vec4(mix(uPaint * 0.97, amber, lit), a * mix(0.85, 1.0, lit));
}`;
export const RingTarget: React.FC<{ front: number }> = ({ front }) => {
  const R = RWY.RING;
  const o = useMemo(() => {
    const h = R.R + R.w + 1;
    return meshOf(
      boxGeo([{ b: [-h, R.s - h, h, R.s + h] }], 0.05),
      mat(
        RING_FRAG,
        {
          uC: { value: new THREE.Vector2(0, R.s) },
          uR: { value: R.R },
          uW: { value: R.w },
          uDot: { value: R.dot },
          uFront: { value: 0 },
          uPaint: { value: v3(GROUND_TONE.paint) },
          uAmber: { value: v3(GROUND_TONE.barHi) },
          uHot: { value: v3(GROUND_TONE.hot) },
        },
        true,
      ),
      -2.35,
    );
  }, [R.R, R.dot, R.s, R.w]);
  o.material.uniforms.uFront.value = front;
  return <primitive object={o} />;
};

// ===========================================================================
// THE ZONE: four thick amber L corners (the Will clip's lock-on bracket: amber, a hot core, the fixed bloom) that grow
// out of the target's box and open out to the zone, with a faint warm wash inside them
// ===========================================================================
const ZONE_FRAG = /* glsl */ `
uniform vec4 uBox;    // x half-width, s0, s1, arm
uniform float uSw;    // stroke (m)
uniform float uHotW;  // the hot core (m)
uniform float uWash;  // 0..~0.12
uniform vec3 uAmber;
uniform vec3 uHot;
varying vec2 vP;
float boxD(vec2 p, vec2 lo, vec2 hi) {
  vec2 c = (lo + hi) * 0.5;
  vec2 e = (hi - lo) * 0.5;
  vec2 q = abs(p - c) - e;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
void main() {
  vec2 p = vP;
  float hx = uBox.x;
  float s0 = uBox.y;
  float s1 = uBox.z;
  float arm = uBox.w;
  float h = uSw * 0.5;
  float d = 1e9;
  float dc = 1e9; // to the arms' centre lines (the hot core)
  for (int i = 0; i < 4; i++) {
    float sx = (i == 0 || i == 3) ? -1.0 : 1.0;
    float ss = (i < 2) ? -1.0 : 1.0;
    vec2 c = vec2(sx * hx, ss < 0.0 ? s0 : s1);
    // the arm along x (toward the inside) and the arm along s (toward the inside)
    vec2 ax0 = vec2(min(c.x, c.x - sx * arm), c.y - h);
    vec2 ax1 = vec2(max(c.x, c.x - sx * arm), c.y + h);
    vec2 as0 = vec2(c.x - h, min(c.y, c.y - ss * arm));
    vec2 as1 = vec2(c.x + h, max(c.y, c.y - ss * arm));
    // square caps: the arms overlap at the corner
    ax0.x -= h * (sx > 0.0 ? 0.0 : 1.0); ax1.x += h * (sx > 0.0 ? 1.0 : 0.0);
    as0.y -= h * (ss > 0.0 ? 0.0 : 1.0); as1.y += h * (ss > 0.0 ? 1.0 : 0.0);
    if (arm > 0.01) {
      d = min(d, min(boxD(p, ax0, ax1), boxD(p, as0, as1)));
      dc = min(dc, min(boxD(p, vec2(ax0.x, c.y), vec2(ax1.x, c.y)), boxD(p, vec2(c.x, as0.y), vec2(c.x, as1.y))));
    }
  }
  float aa = max(fwidth(p.x), 1e-4) * 0.8;
  float a = 1.0 - smoothstep(-aa, aa, d);
  float core = 1.0 - smoothstep(uHotW * 0.5 - aa, uHotW * 0.5 + aa, dc);
  vec3 col = mix(uAmber, uHot, 0.8 * core * a);
  // the wash inside the box
  float inside = (1.0 - smoothstep(-aa, aa, boxD(p, vec2(-hx, s0), vec2(hx, s1)))) * uWash;
  float A = max(a, inside);
  if (A < 0.002) discard;
  gl_FragColor = vec4(mix(uAmber, col, a), A);
}`;
export const ZoneBrackets: React.FC<{ x: number; s0: number; s1: number; arm: number; wash: number; k: number }> = ({ x, s0, s1, arm, wash, k }) => {
  const o = useMemo(
    () =>
      meshOf(
        boxGeo([{ b: [-RWY.ZONE.x - 6, RWY.RING.s - 30, RWY.ZONE.x + 6, RWY.ZONE.s1 + 8] }], 0.055),
        mat(
          ZONE_FRAG,
          {
            uBox: { value: new THREE.Vector4(0, 0, 0, 0) },
            uSw: { value: 1.6 },
            uHotW: { value: 0.45 },
            uWash: { value: 0 },
            uAmber: { value: v3(GROUND_TONE.barHi) },
            uHot: { value: v3(GROUND_TONE.hot) },
          },
          true,
        ),
        -2.3,
      ),
    [],
  );
  const u = o.material.uniforms;
  u.uBox.value.set(x, s0, s1, arm);
  // the stroke and the hot core in SCREEN px (the Will bracket: 7 / 2 px at its size; here a touch heavier)
  u.uSw.value = 9 / k;
  u.uHotW.value = 2.4 / k;
  u.uWash.value = wash;
  o.visible = arm > 0.01;
  return <primitive object={o} />;
};

// ===========================================================================
// THE EDGE LIGHTS: one every 60 m each side; they come on (amber) as the runway's front passes them
// ===========================================================================
const LIGHT_FRAG = /* glsl */ `
uniform vec3 uOff;
uniform vec3 uOn;
uniform vec3 uHot;
uniform float uFront;
uniform float uLo;
varying vec2 vP;
varying vec2 vUv;
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q);
  // the light's own centre (the quad is centred on it): on when the zone's far corners have passed it
  float sc = vP.y - q.y * 3.2;
  float on = (1.0 - smoothstep(-2.0, 2.0, sc - uFront)) * step(uLo, sc);
  // the fitting (a small disc), and when on a hot core with a soft halo on the ground
  float disc = 1.0 - smoothstep(0.17, 0.24, r);
  float halo = exp(-r * r * 9.0) * on;
  vec3 col = mix(uOff, mix(uOn, uHot, smoothstep(0.2, 0.0, r)), on);
  float a = max(disc, halo * 0.75);
  gl_FragColor = vec4(mix(uOn, col, disc), a);
}`;
export const EdgeLights: React.FC<{ front: number; lo: number }> = ({ front, lo }) => {
  const o = useMemo(() => {
    const boxes: { b: [number, number, number, number] }[] = [];
    const R = 3.2; // the quad's half size (the halo); the fitting is ~0.7 m across
    const x = RWY.W / 2 + RWY.LIGHTS.off;
    for (let s = 0; s <= RWY.LEN; s += RWY.LIGHTS.pitch) {
      boxes.push({ b: [-x - R, s - R, -x + R, s + R] });
      boxes.push({ b: [x - R, s - R, x + R, s + R] });
    }
    return meshOf(boxGeo(boxes, 0.06), mat(LIGHT_FRAG, { uOff: { value: v3(GROUND_TONE.lightOff) }, uOn: { value: v3(GROUND_TONE.barHi) }, uHot: { value: v3(GROUND_TONE.hot) }, uFront: { value: -1e4 }, uLo: { value: 0 } }, true), -2.25);
  }, []);
  o.material.uniforms.uFront.value = front;
  o.material.uniforms.uLo.value = lo;
  return <primitive object={o} />;
};

// ===========================================================================
// THE TYRE MARKS: drawn by the main-gear tyres from the contact point (the spin-up), never longer than `len`
// ===========================================================================
const MARK_FRAG = /* glsl */ `
uniform vec3 uRub;
uniform float uS0;
uniform float uReach;
uniform float uLen;
varying vec2 vP;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  if (vP.y > uReach) discard;
  float t = clamp((vP.y - uS0) / uLen, 0.0, 1.0);
  float a = (0.85 - 0.55 * t) * (0.7 + 0.3 * vnoise(vP * vec2(4.0, 0.6)));
  a *= smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
  gl_FragColor = vec4(uRub, a);
}`;
export const TyreMarks: React.FC<{ s0: number; reach: number; xs: number[]; len: number }> = ({ s0, reach, xs, len }) => {
  const o = useMemo(
    () =>
      meshOf(
        boxGeo(
          xs.map((x) => ({ b: [x - 0.26, s0, x + 0.26, s0 + len] as [number, number, number, number] })),
          0.07,
        ),
        mat(MARK_FRAG, { uRub: { value: v3(GROUND_TONE.rubber) }, uS0: { value: s0 }, uReach: { value: s0 }, uLen: { value: len } }, true),
        -2.2,
      ),
    [xs, s0, len],
  );
  o.material.uniforms.uReach.value = reach;
  o.visible = reach > s0;
  return <primitive object={o} />;
};

// ===========================================================================
// THE TYRE SMOKE: soft puffs born at the tyres on contact, growing and thinning where they were left (under the
// jet: the wing and the tailplane pass over them)
// ===========================================================================
const SMOKE_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform vec3 uLo;
uniform float uA;
uniform float uSeed;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  // a billow: a soft core and four lumps around it, their edges broken by noise
  float d = exp(-dot(q, q) / 0.22);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float ang = h2(vec2(uSeed, fi)) * 6.2832;
    vec2 c = vec2(cos(ang), sin(ang)) * (0.3 + 0.18 * h2(vec2(fi, uSeed)));
    vec2 e = q - c;
    d = max(d, 0.85 * exp(-dot(e, e) / (0.08 + 0.05 * h2(vec2(uSeed + 3.0, fi)))));
  }
  float n = fbm(q * 2.6 + uSeed * 5.1);
  d *= 0.75 + 0.45 * n;
  float a = smoothstep(0.12, 0.7, d) * uA;
  // lit from the upper left: each lump's lower right a little darker
  float sh = smoothstep(-0.7, 0.8, q.x - q.y);
  vec3 col = mix(uCol, uLo, 0.5 * sh + 0.25 * (1.0 - n));
  gl_FragColor = vec4(col, a);
}`;
export type Puff = { x: number; s: number; r: number; a: number; seed: number };
export const TyreSmoke: React.FC<{ puffs: Puff[] }> = ({ puffs }) => {
  const n = puffs.length;
  const objs = useMemo(
    () =>
      Array.from({ length: n }, (_, i) =>
        meshOf(boxGeo([{ b: [-1, -1, 1, 1] }], 0), mat(SMOKE_FRAG, { uCol: { value: v3(GROUND_TONE.smoke) }, uLo: { value: v3(GROUND_TONE.smokeLo) }, uA: { value: 0 }, uSeed: { value: i } }, true), -0.5),
      ),
    [n],
  );
  puffs.forEach((p, i) => {
    const o = objs[i];
    o.position.set(p.x, 0.6 + i * 0.01, -p.s);
    o.scale.set(p.r, 1, p.r);
    o.material.uniforms.uA.value = p.a;
    o.material.uniforms.uSeed.value = p.seed;
    o.visible = p.a > 0.003 && p.r > 0.01;
  });
  return (
    <>
      {objs.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </>
  );
};
