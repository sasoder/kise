// WIFISKY_READY
// ===================================================================================================================
// wifiSky — THE CRUISE SKY of scott-free-wifi (Cheeky Pint S4E05, Scott Kirby, "free wifi is basically dial-up").
// The sister clips' world (scott-aircraft-order/aircraftShared: a warm hazy golden-hour medium, lit cream machines,
// one amber = United, Söhne, stout grain, brown vignette, nothing black) lifted to CRUISE ALTITUDE: no airfield; a soft
// golden cumulus deck far below fading into the horizon haze; the sky deepening upward to espresso dusk; Starlink
// satellites passing high above in a train; cream links of light from a satellite down to a jet's Starlink radome;
// contrails. Built ON aircraftShared (AirStage side mode, Jet, airTrack, airProject), imported read-only.
// RENDER EVERY CUT WITH --gl=angle (WebGL).
//
// WORLD UNITS: aircraftShared's. Metres. X right, Y up (sea level 0), Z AWAY from the camera. Heading -90 = nose LEFT.
// The jets cruise at Y = CRUISE (their `alt`); the cloud deck's tops are DECK.top, ~8 km below them.
//
// THE HONEST CHEATS (say so if asked): Starlink flies at ~550 km and a V2 Mini spans ~30 m. Here the satellite layer
// is drawn SAT.height (~0.5 km) above the jets and each satellite at SAT.scale (4x) its size, so "low orbit" reads as
// "right above our air" and a satellite reads at phone size. The radome is drawn ~2x its real size (RADOME) so it
// reads as a bump on the crown. Contrails and the cloud deck are at real scale.
//
// API
//   <CruiseStage cam S rest? world overlay? deck? air? ...AirStageProps>   the frame. aircraftShared's <AirStage> in
//                          side mode with no ground (ground={null}), the golden cloud deck mounted under `world`, dust
//                          motes off by default (they do not follow a tilt), and the wifiSky context (cam, S, air) that
//                          every component below reads: they must sit inside its `world`.
//                          deck: true | false | DeckSpec (default DECK). air: the air's velocity in the world (m/frame,
//                          default AIR_JET_FRAME = the jet-fixed frame: a jet at a fixed `at` cruising nose LEFT at
//                          JET_SPEED, the air, deck and contrails sliding past it to the right). Pass [0, 0, 0] when
//                          the cut moves its jets through still air instead.
//   <CloudDeck spec?>      the deck alone (CruiseStage mounts it): a ray-marched cumulus sea: big rolling heaps
//                          (3.6 km) carrying heads (1.4 km) and billows (0.55 km), each about as tall as it is wide,
//                          blended softly (no creases), clear gaps showing deeper haze below, under a soft cream aerial veil that
//                          thickens with distance; lit by the key light
//                          (near-cream tops from the upper left, warm grey-brown hollows, soft self-shadow, a little
//                          light through the edges), fogged softly into the horizon haze, drifting with `air`, the
//                          heads swelling and settling slowly (billowing).
//   <StarlinkSat at scale? heading? roll? drain? glint? phase?>  one satellite (V2 Mini): a flat cream bus (four phased-array tiles on
//                          its earth face) and two long thin solar-array wings of warm dark-brown cells with a cream
//                          frame, which mirror the golden deck below and catch a sun glint. heading = the direction of
//                          travel [dx, dz] (the wings stand across it); roll = the arrays' tilt about their span (deg).
//                          Lit by the key light, fogged by distance into the sky colour behind it (never black).
//   <SatTrain train>       a line of satellites gliding at constant speed (no easing: they orbit), evenly spaced, the
//                          far ones fogging into the dusk. TrainSpec { origin, dir, speed, spacing, count, scale?,
//                          roll?, first? }: sat i is at origin + dir * (speed * S - (i - first) * spacing).
//   trainSat(train, i, S) -> [X, Y, Z]   satellite i's centre at frame S (fractional S fine)
//                          The sun glint passes slowly down a train, one or two satellites lit at a time (TrainSpec
//                          glint { start, gap, dur, period }; trainGlint(train, i, S)).
//   satLinkPoint(at, scale?) -> [X, Y, Z]   the centre of a satellite's earth face (where a link leaves it)
//   <Radome type at heading? alt? pitch? glow?>  the Starlink radome on a jet's crown, over / just aft of the wing,
//                          the fuselage's cream. Mount it beside the <Jet> with the SAME type, at, heading, alt and
//                          pitch. glow 0..1: connected (a small cream glow on it and a soft halo that stays).
//   radomePoint(type, at, heading?, alt?, pitch?) -> [X, Y, Z]   the top of the radome (a link's end), exact to the
//                          jet mesh's own pitch pivot (aircraftShared's jetPoint pivots about the centre instead).
//   <StarlinkLink from to progress S? width? halo? cone? fade?>  the link: a soft cone of cream light from `from` (a
//                          satellite's satLinkPoint, narrow) to `to` (a radomePoint, about the radome's width there),
//                          a brighter thin core, data pulses travelling DOWN it at a steady rate, a soft pool of light
//                          on the crown where it lands; drawn by a moving bright tip: progress 0..1 is the tip's place
//                          along the beam's screen length (0 = nothing yet; never fades in). Both ends may move every
//                          frame: pass the current points. width = the core's half-width (px), halo = the glow round
//                          the cone (px), cone = the cone's scale at the jet (1; ~0.5 where many links share a frame).
//                          fade 0..1 drains it (exits).
//   <Contrail type path S age? spread? width? lag?>  the jet's contrails: one per engine, soft cream trails drawn out
//                          behind it, widening, merging and diffusing with age, lit like the deck (top cream, belly
//                          warm grey), fogged by distance, carried by the air. path(t) -> { at, alt?, heading?, pitch? }
//                          = where the jet was at frame t (a constant for a jet that sits still in the jet frame).
//                          age = how many frames of trail (its length = age x the jet's speed through the air).
//   <GlowSprite at radius color? alpha?>   a soft round glow of constant screen size at a world point
//   skyAt(cam, y) -> "#rrggbb"   the sky's colour at screen row y (the AirStage sky ramp + sun glow), for fog colours
//   Cameras (starting points, check them in your own stills; the jet = CRUISE_JET):
//     CAM_LINK_CLOSE  cut 1's end: the United 787-9 ~60 % of the frame width, nose left, at y ~950; the link's
//                     satellite in the upper frame; the deck below the horizon (~y 1080)
//     CAM_TRAIN_UP    cut 1's start: tilted up 36 deg into the dusk at the passing train
//     CAM_CRUISE_WIDE a wide of the cruise sky: jets ~250-400 px long over the deck, the train above
//   Constants: CRUISE, DECK, SAT, LINK, RADOME, JET_SPEED, AIR_JET_FRAME, CRUISE_JET (cut 1's jet), TRAIN_CUT1.
//
// PERFORMANCE: see WIFISKY_READY.md (ms per frame). The deck is ray-marched in its fragment shader (40 steps on two
// octaves, normals and shadow on four); it costs only where it is on screen. Everything renders twice (AirStage's
// amber-keep copy), so keep `world` pure.
// ===================================================================================================================
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AirStage, LIGHT, airProject, horizonRow, type AirCam, type AirStageProps, type JetType, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { SPECS, crownAt } from "../scott-aircraft-order/aircraftModels";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const toHex = (c: [number, number, number]) => `#${c.map((v) => Math.round(c01(v) * 255).toString(16).padStart(2, "0")).join("")}`;
const mixHex3 = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  return toHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]);
};
/** world [X, Y, Z] -> three.js (Z flips) */
const to3 = (p: V3) => new THREE.Vector3(p[0], p[1], -p[2]);
const L3 = (L: V3) => new THREE.Vector3(L[0], L[1], -L[2]);

// ===================================================================================================================
// CONSTANTS
// ===================================================================================================================
/** the jets' cruise altitude (their `alt`, m): ~35,000 ft */
export const CRUISE = 10700;
/** the golden cumulus deck: its floor and the tops' ceiling (m), the heads' sizes, its haze (fog visibility, m) */
export const DECK = { base: 0, top: 3700, vis: 42000 } as const;
export type DeckSpec = { base: number; top: number; vis: number };
/** 250 m/s (~485 kt true airspeed) at 23.976 fps */
export const JET_SPEED = 250 / (24000 / 1001);
/** the air's velocity in the jet-fixed frame (a jet heading -90, nose LEFT, held still: the air goes right) */
export const AIR_JET_FRAME: V3 = [JET_SPEED, 0, 0];
/** the satellite layer: height above CRUISE (m, drawn), the drawn size factor (a V2 Mini x scale), default speed */
export const SAT = { height: 520, y: CRUISE + 520, scale: 4, speed: 17, spacing: 230, span: 31 * 4 } as const;
/** the link: its bright core's half-width and the soft glow round the cone (screen px at full res), the data pulses'
 *  spacing (px) and speed (px a frame, down the beam), the cone's radius at the satellite and at the jet (m) */
export const LINK = { core: 2.6, halo: 8, wave: 120, flow: 8, coneStart: 0.3, coneEnd: 3.0 } as const;
/** the Starlink radome (drawn ~2x real): length, width, height (m) and its centre's place along the fuselage (0 nose,
 *  1 tail): over / just aft of the wing */
export const RADOME = { length: 6.2, width: 2.7, height: 0.8, s: 0.53 } as const;

// ===================================================================================================================
// THE STAGE + CONTEXT
// ===================================================================================================================
type WifiCtxT = { cam: AirCam; S: number; air: V3 };
const WifiCtx = React.createContext<WifiCtxT | null>(null);
const useWifi = () => {
  const c = React.useContext(WifiCtx);
  if (!c) throw new Error("wifiSky: a world component was used outside <CruiseStage world>");
  return c;
};

export type CruiseStageProps = Omit<AirStageProps, "ground"> & { deck?: boolean | DeckSpec; air?: V3 };
/** The cruise sky: AirStage side mode, no airfield, the golden deck below, the wifiSky context for `world`. */
export const CruiseStage: React.FC<CruiseStageProps> = ({ cam, S, world, deck = true, air = AIR_JET_FRAME, motes = 0, shimmer = 0, ...rest }) => {
  const spec = deck === true ? DECK : deck === false ? null : deck;
  return (
    <AirStage
      {...rest}
      cam={cam}
      S={S}
      ground={null}
      motes={motes}
      shimmer={shimmer}
      world={
        <WifiCtx.Provider value={{ cam, S, air }}>
          {spec ? <CloudDeck spec={spec} /> : null}
          {world}
        </WifiCtx.Provider>
      }
    />
  );
};

// ===================================================================================================================
// THE SKY'S COLOUR AT A SCREEN ROW (AirStage's Sky ramp + its sun glow), for fogging things that hang in the sky
// ===================================================================================================================
const SKY_STOPS: [number, string][] = [
  [0, SKY.top],
  [0.24, SKY.upper],
  [0.46, SKY.amber],
  [0.66, SKY.mid],
  [0.83, SKY.low],
  [0.93, SKY.glow],
  [1, SKY.haze],
];
export const skyAt = (cam: AirCam, x: number, y: number) => {
  if (cam.mode !== "side") return SKY.haze;
  const hor = horizonRow(cam);
  const u = (y - (hor - 1250)) / 1250;
  let col: string = SKY.haze;
  if (u <= 0) col = SKY.top;
  else if (u < 1) {
    for (let i = 1; i < SKY_STOPS.length; i++) {
      if (u <= SKY_STOPS[i][0]) {
        const [o0, c0] = SKY_STOPS[i - 1];
        const [o1, c1] = SKY_STOPS[i];
        col = mixHex3(c0, c1, (u - o0) / (o1 - o0));
        break;
      }
    }
  }
  // the sun's glow (upper left)
  const yawPx = (cam.yaw ?? 0) * D2R * cam.f;
  const r = Math.hypot(x - (230 - yawPx * 0.9), y - (hor - 320)) / 780;
  const a = r < 0.35 ? lerp(0.72, 0.24, r / 0.35) : r < 1 ? lerp(0.24, 0, (r - 0.35) / 0.65) : 0;
  return y < hor + 22 ? mixHex3(col, SKY.sun, a) : col;
};

// ===================================================================================================================
// GLSL: noise + the cloud deck
// ===================================================================================================================
const NOISE_GLSL = /* glsl */ `
// hashes without sine: a sin hash amplifies the last-bit differences an unrolled loop makes between neighbouring
// cells' sums (n + g), so one cell gets two different random draws and the deck shows straight cliffs at cell edges
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
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.07 + vec2(13.7, 5.1); a *= 0.5; }
  return s / 0.875;
}
// cumulus heads: the union of sphere caps, one per cell, of varied radius and height (1 at a tall head's top)
float domes(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float best = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = h22(n + g);
      vec2 c = g + 0.18 + 0.64 * o;
      float r = 0.62 + 0.38 * h21(n + g + 7.31);
      vec2 d = f - c;
      float q = 1.0 - dot(d, d) / (r * r);
      if (q > 0.0) best = max(best, sqrt(q) * r * (0.62 + 0.38 * o.y));
    }
  }
  return best;
}
`;
const DECK_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DECK_FRAG = /* glsl */ `
uniform float uBase;
uniform float uTop;
uniform float uVis;
uniform vec2 uDrift;
uniform float uPx;       // radians per screen px (1 / f)
uniform float uHalf;     // the plane's half size (m)
uniform float uTime;     // story clock (frames): the heads billow slowly
uniform vec3 uL;
uniform vec3 uLit;
uniform vec3 uMid;
uniform vec3 uShade;
uniform vec3 uDeep;
uniform vec3 uGap;
uniform vec3 uVeil;
uniform vec3 uGlowC;
uniform vec3 uHaze;
uniform vec3 uSun;
varying vec3 vW;
${NOISE_GLSL}
float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
// cumulus heaps: sphere caps blended with a smooth max (no creases), some cells empty (clear gaps), each head
// swelling and settling a little with time (billowing)
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
float lod(float cell, float fp) { return 1.0 - smoothstep(cell * 0.1, cell * 0.3, fp); }
// metres above the deck's floor: big rolling heaps (3.6 km across), heads on them (1.4 km), billows on those
// (0.55 km); each cap about as tall as it is wide, like cumulus; the smaller ride on the bigger so the gaps stay clear
float cloudH(vec2 p, float fp) {
  float big = heaps(p / 3600.0, 0.22, 0.22);
  float on = smoothstep(0.05, 0.35, big);
  float mid = heaps(p / 1400.0 + 3.7, 0.1, 0.2) * on;
  float sm = heaps(p / 550.0 + 9.1, 0.0, 0.18) * on * lod(550.0, fp);
  return 0.62 * (3600.0 * big + 1400.0 * mid + 240.0 * sm);
}
void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vW - ro);
  if (rd.y > -1e-5) discard;
  float thick = uTop - uBase;
  float t0 = (uTop - ro.y) / rd.y;
  float t1 = (uBase - ro.y) / rd.y;
  float tp = t0;
  float th = t1;
  float fp0 = t0 * uPx;
  for (int i = 1; i <= 48; i++) {
    float u = float(i) / 48.0;
    float t = t0 + (t1 - t0) * u * sqrt(u);
    vec3 p = ro + rd * t;
    if (p.y <= uBase + cloudH(p.xz - uDrift, fp0)) {
      float a = tp;
      float b = t;
      for (int k = 0; k < 6; k++) {
        float m = 0.5 * (a + b);
        vec3 pm = ro + rd * m;
        if (pm.y <= uBase + cloudH(pm.xz - uDrift, fp0)) b = m; else a = m;
      }
      th = 0.5 * (a + b);
      break;
    }
    tp = t;
  }
  vec3 P = ro + rd * th;
  vec2 q = P.xz - uDrift;
  float fp = th * uPx;
  float h = cloudH(q, fp) / thick;
  // soft normals: a wide difference step (no crisp rims)
  float e = max(160.0, fp * 5.0);
  float hx = cloudH(q + vec2(e, 0.0), fp) - cloudH(q - vec2(e, 0.0), fp);
  float hz = cloudH(q + vec2(0.0, e), fp) - cloudH(q - vec2(0.0, e), fp);
  vec3 n = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
  // soft self-shadow toward the sun
  float sh = 1.0;
  for (int k = 1; k <= 5; k++) {
    float s = 220.0 * float(k * k);
    vec3 ps = P + uL * s;
    float d = ps.y - (uBase + cloudH(ps.xz - uDrift, fp * 2.0));
    sh = min(sh, clamp(0.5 + d / 700.0, 0.0, 1.0));
  }
  float ndl = dot(n, uL);
  vec3 V = -rd;
  // wrapped light (a cloud is lit through its edges), then the shadow
  float lit = smoothstep(-0.6, 0.85, ndl) * mix(0.66, 1.0, sh);
  vec3 col = mix(uShade, uMid, smoothstep(0.0, 0.55, lit));
  col = mix(col, uLit, smoothstep(0.5, 1.0, lit));
  // hollows and low flanks sink into warm shade; the clear gaps show the deeper haze below
  float ao = smoothstep(0.0, 0.5, h);
  col = mix(uDeep, col, mix(0.35, 1.0, ao));
  // the lower in the deck, the more of the warm haze lies over it (the gaps read as deeper haze below)
  col = mix(col, uGap, 0.75 * pow(1.0 - smoothstep(0.0, 0.6, h), 2.0));
  // translucent edges: where the surface turns away from us, the sun glows through a little
  float edge = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 2.0);
  col = mix(col, uLit, 0.25 * edge * smoothstep(0.1, 0.5, h));
  col += uSun * 0.06 * pow(max(dot(reflect(-V, n), uL), 0.0), 4.0) * sh;
  // a soft cream aerial veil over the whole deck, thickening with distance (the near heads look a little misty too)
  float veil = 0.1 + 0.5 * (1.0 - exp(-th / (uVis * 0.5)));
  col = mix(col, uVeil, veil);
  float fg = 1.0 - exp(-th / uVis);
  fg = max(fg, 1.0 - smoothstep(0.035, 0.2, -rd.y));
  fg = max(fg, smoothstep(0.45, 0.92, length(P.xz - ro.xz) / uHalf));
  vec3 fc = mix(uGlowC, uHaze, smoothstep(0.3, 0.85, fg));
  gl_FragColor = vec4(mix(col, fc, fg), 1.0);
}`;

const DECK_SIZE = 170000;
/** the deck takes the key light's direction a little lower (a golden-hour sun models the heads more) */
const DECK_LIGHT: V3 = (() => {
  const l: V3 = [LIGHT.side[0] * 1.25, LIGHT.side[1] * 0.62, LIGHT.side[2] * 1.25];
  const n = Math.hypot(l[0], l[1], l[2]);
  return [l[0] / n, l[1] / n, l[2] / n];
})();
/** The golden cumulus deck far below the jets (CruiseStage mounts it). */
export const CloudDeck: React.FC<{ spec?: DeckSpec }> = ({ spec = DECK }) => {
  const { cam, S, air } = useWifi();
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(DECK_SIZE, DECK_SIZE, 1, 1);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: DECK_VERT,
      fragmentShader: DECK_FRAG,
      depthWrite: false,
      uniforms: {
        uBase: { value: 0 },
        uTop: { value: 0 },
        uVis: { value: 1 },
        uDrift: { value: new THREE.Vector2(0, 0) },
        uPx: { value: 1 / 1500 },
        uHalf: { value: DECK_SIZE / 2 },
        uTime: { value: 0 },
        uL: { value: L3(DECK_LIGHT) },
        uLit: { value: v3("#FFFAF0") },
        uMid: { value: v3("#F2DFBF") },
        uShade: { value: v3("#9E7D5D") },
        uDeep: { value: v3("#8F7055") },
        uGap: { value: v3("#D8BC94") },
        uVeil: { value: v3("#F4E6CB") },
        uGlowC: { value: v3(SKY.glow) },
        uHaze: { value: v3(SKY.haze) },
        uSun: { value: v3(SKY.sun) },
      },
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    return { mesh, m };
  }, []);
  const u = o.m.uniforms;
  u.uBase.value = spec.base;
  u.uTop.value = spec.top;
  u.uVis.value = spec.vis;
  // the deck drifts with the air (three's z = -Z)
  u.uDrift.value.set(air[0] * S, -air[2] * S);
  u.uTime.value = S;
  u.uPx.value = cam.mode === "side" ? 1 / cam.f : 1 / 1500;
  o.mesh.position.set(cam.x, spec.top, cam.mode === "side" ? -cam.z : -cam.z);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// PARTS MATERIAL (satellites, radome): lit card, panel cells, mirror sheen, per-object fog toward the sky behind it
// ===================================================================================================================
const PART_VERT = /* glsl */ `
attribute vec3 aCol;
attribute float aKind;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying float vKind;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vCol = aCol;
  vUv = uv;
  vKind = aKind;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PART_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform vec3 uCream;
uniform float uFog;
uniform vec3 uFogCol;
uniform float uGlow;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uEnvDeck;
uniform vec3 uEnvHaze;
uniform vec3 uEnvSky;
uniform vec3 uEnvTop;
uniform vec4 uCells;    // major u, major v, minor per major, frame width (uv)
uniform vec3 uCellCol;
uniform vec3 uLineCol;
uniform vec3 uFrameCol;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
varying float vKind;
vec3 envAt(vec3 R) {
  if (R.y < 0.0) return mix(uEnvHaze, uEnvDeck, smoothstep(0.0, 0.35, -R.y));
  return mix(uEnvHaze, mix(uEnvSky, uEnvTop, smoothstep(0.25, 0.8, R.y)), smoothstep(0.0, 0.3, R.y));
}
float gridLine(vec2 g, float w) {
  vec2 fw = max(fwidth(g), vec2(1e-4));
  vec2 d = abs(fract(g + 0.5) - 0.5);
  vec2 l = 1.0 - smoothstep(w - fw, w + fw, d);
  float fade = 1.0 - smoothstep(0.18, 0.45, max(fw.x, fw.y));   // fade before it aliases
  return max(l.x, l.y) * fade;
}
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  vec3 base = vCol;
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.38, 0.85, ndl);
  vec3 col;
  if (vKind > 0.5 && vKind < 1.5) {
    // a solar array: warm dark-brown cells in a fine grid, a cream frame; it mirrors the golden deck and catches the sun
    vec2 g = vUv * uCells.xy;
    float major = gridLine(g, 0.055);
    float minor = gridLine(g * uCells.z, 0.06) * 0.35;
    vec2 eu = min(vUv, 1.0 - vUv);
    float fw = max(fwidth(vUv.x), fwidth(vUv.y));
    float frame = 1.0 - smoothstep(uCells.w - fw, uCells.w + fw, min(eu.x * 3.0, eu.y));
    // the earth faces take the bright golden deck's bounce: a warm red-brown that separates from the espresso dusk
    vec3 cellC = uCellCol * mix(vec3(1.0), vec3(1.55, 1.36, 1.15), max(-n.y, 0.0));
    vec3 cell = mix(cellC, uLineCol, max(major, minor));
    vec3 c = mix(cell * mix(0.82, 1.06, lit), uFrameCol * mix(0.7, 1.04, lit), frame);
    vec3 R = reflect(-V, n);
    float fres = 0.04 + 0.45 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 4.0);
    c = mix(c, envAt(R), fres * (1.0 - frame));
    float gl = max(dot(R, uSunDir), 0.0);
    c = mix(c, uSunCol * 1.06, clamp(0.95 * pow(gl, 2400.0) + 0.3 * pow(gl, 260.0), 0.0, 1.0) * (1.0 - frame * 0.6));
    col = c;
  } else {
    col = mix(base * uShade, base * 1.03, lit);
    col = mix(col, col * uBounce, 0.32 * max(-n.y, 0.0));
    float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
    col = mix(col, uCream, 0.5 * fres * smoothstep(0.05, 0.7, n.y));
    col += base * 0.08 * pow(max(dot(n, normalize(uL + V)), 0.0), 14.0);
  }
  // connected: a small cream glow on it
  col = mix(col, uCream * 1.04, uGlow * 0.55);
  gl_FragColor = vec4(mix(col, uFogCol, uFog), 1.0);
}`;
const makePartMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: PART_VERT,
    fragmentShader: PART_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uL: { value: L3(LIGHT.side) },
      uShade: { value: v3("#8C7E70") },
      uBounce: { value: v3("#E9CFA6") },
      uCream: { value: v3(COLOR.cream) },
      uFog: { value: 0 },
      uFogCol: { value: v3(SKY.haze) },
      uGlow: { value: 0 },
      // the low sun, upper left and a little toward the camera (three coords)
      uSunDir: { value: new THREE.Vector3(-0.86, 0.28, 0.42).normalize() },
      uSunCol: { value: v3(SKY.sun) },
      uEnvDeck: { value: v3("#C9AE88") },
      uEnvHaze: { value: v3(SKY.haze) },
      uEnvSky: { value: v3(SKY.mid) },
      uEnvTop: { value: v3(SKY.upper) },
      uCells: { value: new THREE.Vector4(12, 4, 3, 0.035) },
      uCellCol: { value: v3("#4A2D1A") },
      uLineCol: { value: v3("#A9845C") },
      uFrameCol: { value: v3("#E2D2B4") },
    },
  });

// --- a small mesh builder: boxes and grids with vertex colour, kind and uv ---------------------------------------
class MeshB {
  p: number[] = [];
  n: number[] = [];
  t: number[] = [];
  c: number[] = [];
  k: number[] = [];
  i: number[] = [];
  vert(p: V3, n: V3, uv: [number, number], col: [number, number, number], kind: number) {
    this.p.push(...p);
    this.n.push(...n);
    this.t.push(...uv);
    this.c.push(...col);
    this.k.push(kind);
    return this.p.length / 3 - 1;
  }
  /** an axis-aligned box (centre, size); uv on its ±Y faces spans the face 0..1 (u along X, v along Z) */
  box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, col: string, kind = 0) {
    const C = hex3(col);
    const hx = sx / 2;
    const hy = sy / 2;
    const hz = sz / 2;
    const faces: { n: V3; u: V3; v: V3 }[] = [
      { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
      { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
      { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
      { n: [-1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
      { n: [0, 0, 1], u: [-1, 0, 0], v: [0, 1, 0] },
      { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
    ];
    for (const f of faces) {
      const h = (a: V3) => [a[0] * hx, a[1] * hy, a[2] * hz] as V3;
      const N = h(f.n);
      const U = h(f.u);
      const Vv = h(f.v);
      const corner = (su: number, sv: number): V3 => [cx + N[0] + U[0] * su + Vv[0] * sv, cy + N[1] + U[1] * su + Vv[1] * sv, cz + N[2] + U[2] * su + Vv[2] * sv];
      // face uv: on ±Y faces map world x / z to 0..1 so panel grids run along the array
      const uvOf = (q: V3): [number, number] => (f.n[1] !== 0 ? [(q[0] - (cx - hx)) / sx, (q[2] - (cz - hz)) / sz] : [0.5, 0.5]);
      const k = f.n[1] !== 0 ? kind : kind === 1 ? 3 : kind; // array edges: plain frame colour (kind 3)
      const a = corner(-1, -1);
      const b = corner(1, -1);
      const c = corner(1, 1);
      const d = corner(-1, 1);
      const ia = this.vert(a, f.n, uvOf(a), k === 3 ? hex3("#BFAA8B") : C, k === 3 ? 0 : k);
      const ib = this.vert(b, f.n, uvOf(b), k === 3 ? hex3("#BFAA8B") : C, k === 3 ? 0 : k);
      const ic = this.vert(c, f.n, uvOf(c), k === 3 ? hex3("#BFAA8B") : C, k === 3 ? 0 : k);
      const id = this.vert(d, f.n, uvOf(d), k === 3 ? hex3("#BFAA8B") : C, k === 3 ? 0 : k);
      this.i.push(ia, ib, ic, ia, ic, id);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(this.t), 2));
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(this.k), 1));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(this.i), 1));
    g.computeBoundingSphere();
    return g;
  }
}

// ===================================================================================================================
// STARLINK SATELLITE (V2 Mini, drawn SAT.scale x)
// Local frame (real metres before scale): x along the span (the wings), y up (the earth face is -y), z along travel.
// ===================================================================================================================
const SAT_GEO = {
  bus: { x: 2.9, y: 0.42, z: 4.1 },
  boom: { len: 0.9, t: 0.16 },
  array: { len: 12.6, w: 4.2, t: 0.07 },
};
const satGeoCache: Record<string, { bus: Any; arrays: Any }> = {};
const satGeos = () => {
  const have = satGeoCache.k;
  if (have) return have;
  const b = new MeshB();
  const G = SAT_GEO;
  b.box(0, 0, 0, G.bus.x, G.bus.y, G.bus.z, "#E7DDCA");
  // the earth face: four phased-array tiles (a touch darker card), proud of the bus
  for (const [ux, uz] of [[-0.62, -0.95], [0.62, -0.95], [-0.62, 0.95], [0.62, 0.95]])
    b.box(ux, -G.bus.y / 2 - 0.03, uz, 1.05, 0.06, 1.6, "#C9BBA3");
  // a thin edge band on the bus top (reads the slab's thickness)
  b.box(0, G.bus.y / 2 + 0.02, 0, G.bus.x * 0.82, 0.04, G.bus.z * 0.86, "#EFE7D6");
  // booms
  for (const s of [-1, 1]) b.box(s * (G.bus.x / 2 + G.boom.len / 2), 0, 0, G.boom.len, G.boom.t, G.boom.t, "#A8977F");
  const a = new MeshB();
  // the arrays are built flat around x = 0 per side, rolled about x in the shader-free way: two meshes (L/R)
  a.box(G.bus.x / 2 + G.boom.len + G.array.len / 2, 0, 0, G.array.len, G.array.t, G.array.w, "#4B3426", 1);
  satGeoCache.k = { bus: b.geo(), arrays: a.geo() };
  return satGeoCache.k;
};
/** the centre of a satellite's earth face (where its link leaves), world */
export const satLinkPoint = (at: V3, scale: number = SAT.scale): V3 => [at[0], at[1] - (SAT_GEO.bus.y / 2 + 0.07) * scale, at[2]];

export type SatProps = {
  at: V3;
  /** the direction of travel [dx, dz] (world); the wings stand across it */
  heading?: [number, number];
  scale?: number;
  /** the arrays' roll about their span (deg) */
  roll?: number;
  /** 0..1 drained toward the sky behind it (on top of the distance fog) */
  drain?: number;
  /** where along its wings the sun glint sits (radians of a slow sweep), when `glint` is not given */
  phase?: number;
  /** the sun glint's pass: 0 -> 1 slides it across the wings from one tip to the other; outside 0..1 it is off them */
  glint?: number;
};
/** the distance fog of things in the high sky: none nearer than `near`, then toward the sky colour behind them */
const SAT_FOG = { near: 350, vis: 2600, max: 0.96 };
export const StarlinkSat: React.FC<SatProps> = ({ at, heading = [0, 1], scale = SAT.scale, roll = 22, drain = 0, phase = 0, glint }) => {
  const { cam, S } = useWifi();
  const o = useMemo(() => {
    const g = satGeos();
    const mat = makePartMat();
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    const bus = new THREE.Mesh(g.bus, mat);
    const aR = new THREE.Mesh(g.arrays, mat);
    const aL = new THREE.Mesh(g.arrays, mat);
    aL.scale.set(-1, 1, 1);
    for (const m of [bus, aR, aL]) {
      m.frustumCulled = false;
      group.add(m);
    }
    return { group, mat, aR, aL };
  }, []);
  // basis: z = travel, y = up, x = across (three coords)
  const z = new THREE.Vector3(heading[0], 0, -heading[1]).normalize();
  const y = new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  o.group.matrix.makeBasis(x, y, z);
  o.group.matrix.scale(new THREE.Vector3(scale, scale, scale));
  o.group.matrix.setPosition(at[0], at[1], -at[2]);
  o.group.matrixWorldNeedsUpdate = true;
  o.aR.rotation.set(roll * D2R, 0, 0);
  o.aL.rotation.set(roll * D2R, 0, 0);
  const pr = airProject(cam, at);
  const d = Math.hypot(at[0] - cam.x, at[1] - (cam.mode === "side" ? cam.y : 0), at[2] - cam.z);
  const fog = SAT_FOG.max * (1 - Math.exp(-Math.max(0, d - SAT_FOG.near) / SAT_FOG.vis));
  const u = o.mat.uniforms;
  u.uFog.value = 1 - (1 - fog) * (1 - c01(drain));
  // the sun glint: the low sun's mirror image in the arrays, placed on a wing and sliding slowly along it as the
  // satellite moves (the mirror direction at the satellite's centre, nudged along the span)
  if (cam.mode === "side") {
    const I = new THREE.Vector3(at[0] - cam.x, at[1] - cam.y, -at[2] + cam.z);
    const dist = I.length();
    I.normalize();
    const n = new THREE.Vector3().copy(y).multiplyScalar(Math.cos(roll * D2R)).addScaledVector(z, Math.sin(roll * D2R)).normalize();
    if (n.dot(I) > 0) n.multiplyScalar(-1);
    const R = new THREE.Vector3().copy(I).addScaledVector(n, -2 * I.dot(n));
    // the wing's half-span as an angle from here: a pass sweeps the mirror image from beyond one tip to beyond the other
    const hw = ((SAT_GEO.bus.x / 2 + SAT_GEO.boom.len + SAT_GEO.array.len) * scale) / dist;
    const a = glint !== undefined ? (2 * glint - 1) * 1.6 * hw : 0.3 * Math.sin(S * 0.06 + phase);
    u.uSunDir.value.copy(R).addScaledVector(x, a).normalize();
  }
  u.uFogCol.value.set(...hex3(skyAt(cam, pr.x, pr.y)));
  return <primitive object={o.group} />;
};

// ===================================================================================================================
// THE SATELLITE TRAIN
// ===================================================================================================================
export type TrainSpec = {
  /** sat `first`'s centre at S = 0 (world) */
  origin: V3;
  /** the direction of travel (world, unit; level: dir[1] = 0) */
  dir: V3;
  /** m per frame (constant: they orbit) */
  speed: number;
  /** m between neighbours along the line */
  spacing: number;
  count: number;
  scale?: number;
  roll?: number;
  /** the index at `origin` (sats with lower indices lead, ahead of it) */
  first?: number;
  /** the sun glint passing down the train: it crosses the tail's wings first (centred at frame `start`), then each
   *  satellite ahead `gap` frames later, each pass taking `dur` frames, repeating every `period` frames */
  glint?: { start?: number; gap?: number; dur?: number; period?: number };
};
const GLINT = { start: 5, gap: 13, dur: 26, period: 96 };
/** satellite i's glint pass (0..1 = crossing its wings) at frame S */
export const trainGlint = (t: TrainSpec, i: number, S: number) => {
  const g = { ...GLINT, ...(t.glint ?? {}) };
  const tt = S - g.start + g.dur / 2 - (t.count - 1 - i) * g.gap;
  const m = (((tt + 0.3 * g.period) % g.period) + g.period) % g.period - 0.3 * g.period;
  return m / g.dur;
};
export const trainSat = (t: TrainSpec, i: number, S: number): V3 => {
  const s = t.speed * S - (i - (t.first ?? 0)) * t.spacing;
  return [t.origin[0] + t.dir[0] * s, t.origin[1] + t.dir[1] * s, t.origin[2] + t.dir[2] * s];
};
export const SatTrain: React.FC<{ train: TrainSpec }> = ({ train }) => {
  const { S } = useWifi();
  const sats: React.ReactNode[] = [];
  for (let i = 0; i < train.count; i++) {
    sats.push(<StarlinkSat key={i} at={trainSat(train, i, S)} heading={[train.dir[0], train.dir[2]]} scale={train.scale ?? SAT.scale} roll={train.roll ?? 22} glint={trainGlint(train, i, S)} />);
  }
  return <>{sats}</>;
};

// ===================================================================================================================
// THE RADOME (on a jet's crown) + its connected glow
// ===================================================================================================================
/** world <- jet local (x forward, y up, z starboard), with the jet mesh's own pitch pivot (the main gear) */
const jetLocal = (type: JetType, at: [number, number], heading: number, alt: number, pitch: number, local: V3): V3 => {
  const sp = SPECS[type];
  const px = sp.L / 2 - sp.gear.main[0].s * sp.L;
  const pr = pitch * D2R;
  const lx0 = local[0] - px;
  const lx = px + lx0 * Math.cos(pr) - local[1] * Math.sin(pr);
  const ly = lx0 * Math.sin(pr) + local[1] * Math.cos(pr);
  const h = heading * D2R;
  return [at[0] + Math.sin(h) * lx + Math.cos(h) * local[2], alt + ly, at[1] + Math.cos(h) * lx - Math.sin(h) * local[2]];
};
const radomeLocal = (type: JetType) => {
  const sp = SPECS[type];
  const s = RADOME.s * sp.L;
  return { x: sp.L / 2 - s, y: crownAt(sp, s), R: sp.W / 2 };
};
/** the top of the radome (a link's end), world */
export const radomePoint = (type: JetType, at: [number, number], heading = -90, alt = CRUISE, pitch = 0): V3 => {
  const r = radomeLocal(type);
  return jetLocal(type, at, heading, alt, pitch, [r.x, r.y + RADOME.height - 0.04, 0]);
};
const radomeGeoCache: Record<string, Any> = {};
const radomeGeo = (type: JetType) => {
  if (radomeGeoCache[type]) return radomeGeoCache[type];
  const r = radomeLocal(type);
  const b = new MeshB();
  const NA = 48;
  const NR = 10;
  const a2 = RADOME.length / 2;
  const b2 = RADOME.width / 2;
  const col = hex3("#F0E9DB");
  // a low pill: superelliptic footprint, a flat top rounding over at the rim; its foot follows the crown's curve
  const at = (ri: number, ai: number): { p: V3; uv: [number, number] } => {
    const rn = ri / NR;
    const th = (ai / NA) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const e = 2.6;
    const sx = Math.sign(c) * Math.pow(Math.abs(c), 2 / e);
    const sz = Math.sign(s) * Math.pow(Math.abs(s), 2 / e);
    // a touch fuller aft (teardrop)
    const taper = 0.9 + 0.1 * -sx;
    const x = sx * a2 * rn;
    const z = sz * b2 * rn * taper;
    const foot = Math.sqrt(Math.max(0, r.R * r.R - z * z)) - r.R;
    const hgt = RADOME.height * Math.pow(Math.max(0, 1 - Math.pow(rn, 5)), 0.5);
    return { p: [r.x + x, r.y + foot + hgt - 0.05, z], uv: [rn, ai / NA] };
  };
  const idx: number[][] = [];
  for (let ri = 0; ri <= NR; ri++) {
    idx.push([]);
    for (let ai = 0; ai <= NA; ai++) {
      const q = at(ri, ai);
      idx[ri].push(b.vert(q.p, [0, 1, 0], q.uv, col, 0));
    }
  }
  for (let ri = 0; ri < NR; ri++)
    for (let ai = 0; ai < NA; ai++) {
      const A = idx[ri][ai];
      const B = idx[ri + 1][ai];
      const C = idx[ri + 1][ai + 1];
      const D = idx[ri][ai + 1];
      b.i.push(A, B, C, A, C, D);
    }
  const g = b.geo();
  g.computeVertexNormals();
  radomeGeoCache[type] = g;
  return g;
};
export type RadomeProps = { type: JetType; at: [number, number]; heading?: number; alt?: number; pitch?: number; glow?: number };
export const Radome: React.FC<RadomeProps> = ({ type, at, heading = -90, alt = CRUISE, pitch = 0, glow = 0 }) => {
  const o = useMemo(() => {
    const mat = makePartMat();
    const group = new THREE.Group();
    const inner = new THREE.Group();
    group.add(inner);
    const mesh = new THREE.Mesh(radomeGeo(type), mat);
    mesh.frustumCulled = false;
    inner.add(mesh);
    return { group, inner, mesh, mat };
  }, [type]);
  const sp = SPECS[type];
  const px = sp.L / 2 - sp.gear.main[0].s * sp.L;
  o.group.position.set(at[0], alt, -at[1]);
  o.group.rotation.set(0, (90 - heading) * D2R, 0);
  o.inner.position.set(px, 0, 0);
  o.inner.rotation.set(0, 0, pitch * D2R);
  o.mesh.position.set(-px, 0, 0);
  o.mat.uniforms.uGlow.value = c01(glow);
  const top = radomePoint(type, at, heading, alt, pitch);
  return (
    <>
      <primitive object={o.group} />
      {glow > 0 ? <GlowSprite at={top} radius={46} alpha={0.75 * c01(glow)} /> : null}
    </>
  );
};

// ===================================================================================================================
// GLOW SPRITE (constant screen size), LINK and CONTRAIL ribbons (camera-facing, built in the vertex shader)
// ===================================================================================================================
const SPRITE_VERT = /* glsl */ `
uniform vec3 uAt;
uniform float uR;
uniform float uAsp;
varying vec2 vQ;
void main() {
  vQ = position.xy;
  vec4 c = viewMatrix * vec4(uAt, 1.0);
  float f = projectionMatrix[1][1] * 960.0;
  float s = uR * -c.z / f;
  c.xy += position.xy * vec2(uAsp, 1.0) * s;
  gl_Position = projectionMatrix * c;
}`;
const SPRITE_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform float uA;
varying vec2 vQ;
void main() {
  float r = length(vQ);
  float a = exp(-r * r * 4.2) * (1.0 - smoothstep(0.85, 1.0, r));
  gl_FragColor = vec4(uCol, a * uA);
}`;
/** aspect stretches it sideways (a pool of light lying on a crown) */
export const GlowSprite: React.FC<{ at: V3; radius: number; color?: string; alpha?: number; aspect?: number }> = ({ at, radius, color = "#FFF6E2", alpha = 0.6, aspect = 1 }) => {
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(2, 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: SPRITE_VERT,
      fragmentShader: SPRITE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: { uAt: { value: new THREE.Vector3() }, uR: { value: 1 }, uAsp: { value: 1 }, uCol: { value: new THREE.Vector3() }, uA: { value: 1 } },
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 20;
    return { mesh, m };
  }, []);
  o.m.uniforms.uAt.value.copy(to3(at));
  o.m.uniforms.uR.value = radius;
  o.m.uniforms.uAsp.value = aspect;
  o.m.uniforms.uCol.value.set(...hex3(color));
  o.m.uniforms.uA.value = alpha;
  return <primitive object={o.mesh} />;
};

const LINK_SEG = 160;
const LINK_VERT = /* glsl */ `
attribute float aT;
attribute float aSide;
uniform vec3 uA;
uniform vec3 uB;
uniform float uP;
uniform float uConeA;    // the cone's radius at the satellite (m)
uniform float uConeB;    // and at the jet (m)
uniform float uMinPx;    // its least half-width on screen (px)
uniform float uGlowPx;   // the soft glow round it (px)
varying float vX;        // px across the beam from its axis
varying float vCone;     // the cone's half-width here (px)
varying float vPx;       // px along the beam from the satellite
varying float vTipPx;
vec2 scr(vec3 w) {
  vec4 c = projectionMatrix * viewMatrix * vec4(w, 1.0);
  return c.xy / c.w * vec2(540.0, 960.0);
}
void main() {
  float g = aT * uP;
  vec3 c = mix(uA, uB, g);
  vec3 T = normalize(uB - uA);
  vec3 V = normalize(cameraPosition - c);
  vec3 side = normalize(cross(T, V));
  vec4 vc = viewMatrix * vec4(c, 1.0);
  float f = projectionMatrix[1][1] * 960.0;
  float d = -vc.z;
  float cone = max(mix(uConeA, uConeB, g) * f / d, uMinPx);
  float H = cone * 1.5 + uGlowPx;
  vec2 sa = scr(uA);
  vPx = length(scr(c) - sa);
  vTipPx = length(scr(mix(uA, uB, uP)) - sa);
  vX = aSide * H;
  vCone = cone;
  gl_Position = projectionMatrix * viewMatrix * vec4(c + side * aSide * H * d / f, 1.0);
}`;
const LINK_FRAG = /* glsl */ `
uniform float uCorePx;
uniform float uGlowPx;
uniform float uS;
uniform float uWave;     // pulse spacing (screen px)
uniform float uFlow;     // pulse speed (screen px per frame, down the beam)
uniform float uFade;
uniform vec3 uCoreCol;
uniform vec3 uHaloCol;
varying float vX;
varying float vCone;
varying float vPx;
varying float vTipPx;
void main() {
  float x = abs(vX);
  // a soft cone of cream light around a brighter thin core
  float core = 1.0 - smoothstep(uCorePx * 0.45, uCorePx, x);
  float body = 1.0 - smoothstep(vCone * 0.3, vCone * 1.1, x);
  float glow = exp(-pow(x / (vCone * 1.2 + uGlowPx), 2.0) * 2.2);
  // data pulses: short brighter packets travelling DOWN the beam at a steady rate
  float ph = fract((vPx - uS * uFlow) / uWave);
  float pk = smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.12, 0.24, ph));
  float pkB = pk * (1.0 - smoothstep(vCone * 0.25, vCone * 0.8 + 1.5, x));
  // the beam leaves the satellite cleanly; a bright head at the moving tip
  float start = smoothstep(0.0, 5.0, vPx);
  float toTip = vTipPx - vPx;
  float tip = exp(-toTip * toTip / 144.0) * (1.0 - smoothstep(0.0, vCone + 6.0, x));
  float a = (core * 0.92 + body * 0.52 + glow * 0.2 + pkB * 0.6) * start;
  a = min(1.0, a + tip * 0.45);
  vec3 col = mix(uHaloCol, uCoreCol, clamp(core + pkB + tip + 0.5 * body, 0.0, 1.0));
  gl_FragColor = vec4(col, a * (1.0 - uFade));
}`;
const linkGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const pos: number[] = [];
    const t: number[] = [];
    const sd: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= LINK_SEG; i++) {
      for (const s of [-1, 1]) {
        pos.push(0, 0, 0);
        t.push(i / LINK_SEG);
        sd.push(s);
      }
      if (i < LINK_SEG) {
        const a = i * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(t), 1));
    g.setAttribute("aSide", new THREE.BufferAttribute(new Float32Array(sd), 1));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    return g;
  };
})();
/** the 3D place (0..1 from -> to) of the point at screen fraction p of the beam (perspective: a beam that dives toward
 *  the camera covers most of its screen length near its low end) */
export const linkT = (cam: AirCam, from: V3, to: V3, p: number) => {
  if (p <= 0 || p >= 1) return c01(p);
  const A = airProject(cam, from);
  const B = airProject(cam, to);
  const tot = Math.hypot(B.x - A.x, B.y - A.y);
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    const P = airProject(cam, [lerp(from[0], to[0], m), lerp(from[1], to[1], m), lerp(from[2], to[2], m)]);
    if (Math.hypot(P.x - A.x, P.y - A.y) < p * tot) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
export type LinkProps = {
  from: V3;
  to: V3;
  progress: number;
  S?: number;
  /** the bright core's half-width (screen px) */
  width?: number;
  /** the soft glow round the cone (screen px) */
  halo?: number;
  /** scales the cone's radius at the jet (1 = about the radome's width; ~0.5 where many links share a frame) */
  cone?: number;
  fade?: number;
};
/** The Starlink link: a soft cone of cream light from the satellite (narrow) to the radome (about its width), a brighter
 *  thin core, data pulses travelling down it, a soft pool of light on the crown where it lands. Drawn down from `from`
 *  by a moving tip (progress 0..1 of its screen length, so an eased progress reads as an eased draw on screen). */
export const StarlinkLink: React.FC<LinkProps> = ({ from, to, progress, S, width = LINK.core, halo = LINK.halo, cone = 1, fade = 0 }) => {
  const ctx = useWifi();
  const o = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: LINK_VERT,
      fragmentShader: LINK_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uA: { value: new THREE.Vector3() },
        uB: { value: new THREE.Vector3() },
        uP: { value: 0 },
        uConeA: { value: LINK.coneStart },
        uConeB: { value: LINK.coneEnd },
        uMinPx: { value: 2.5 },
        uGlowPx: { value: LINK.halo },
        uCorePx: { value: LINK.core },
        uS: { value: 0 },
        uWave: { value: LINK.wave },
        uFlow: { value: LINK.flow },
        uFade: { value: 0 },
        uCoreCol: { value: v3("#FFF9EE") },
        uHaloCol: { value: v3(COLOR.cream) },
      },
    });
    const mesh = new THREE.Mesh(linkGeo(), m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    return { mesh, m };
  }, []);
  const p = c01(progress);
  const t = linkT(ctx.cam, from, to, p);
  const u = o.m.uniforms;
  u.uA.value.copy(to3(from));
  u.uB.value.copy(to3(to));
  u.uP.value = Math.max(1e-4, t);
  u.uConeA.value = LINK.coneStart * Math.max(0.3, cone);
  u.uConeB.value = LINK.coneEnd * cone;
  u.uMinPx.value = Math.max(1.5, 2.5 * Math.min(1, cone + 0.3));
  u.uGlowPx.value = halo;
  u.uCorePx.value = width;
  u.uS.value = S ?? ctx.S;
  u.uFade.value = c01(fade);
  if (p <= 0) return null;
  const tip: V3 = [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  // the pool of light on the crown: it spreads as the tip arrives (the last ~40 px of its travel) and stays
  const B = airProject(ctx.cam, to);
  const Tp = airProject(ctx.cam, tip);
  const pool = 1 - Math.min(1, Math.hypot(B.x - Tp.x, B.y - Tp.y) / 40);
  const poolR = Math.max(10, LINK.coneEnd * cone * B.s * 1.25);
  const live = 1 - c01(fade);
  return (
    <>
      <primitive object={o.mesh} />
      <GlowSprite at={from} radius={16} alpha={0.45 * live} />
      {p < 1 ? <GlowSprite at={tip} radius={24} alpha={0.75 * live} /> : null}
      {pool > 0 ? <GlowSprite at={to} radius={poolR} aspect={2.1} alpha={0.62 * pool * pool * (3 - 2 * pool) * live} /> : null}
    </>
  );
};

// --- contrails ---------------------------------------------------------------------------------------------------
const TRAIL_N = 90;
const TRAIL_VERT = /* glsl */ `
attribute vec3 aC;       // the trail's centre at this sample (three coords)
attribute vec3 aTan;     // its direction
attribute vec2 aQ;       // x: side -1..1, y: age 0..1
attribute float aW;      // half width (m)
attribute float aA;      // opacity
varying vec2 vQ;
varying float vA;
varying float vUp;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - aC);
  vec3 side = normalize(cross(normalize(aTan), V));
  vec3 p = aC + side * aQ.x * aW;
  vQ = aQ;
  vA = aA;
  vUp = side.y * aQ.x;          // + toward the sky side of the ribbon
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const TRAIL_FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBelly;
uniform vec3 uFogCol;
uniform float uSeed;
varying vec2 vQ;
varying float vA;
varying float vUp;
varying vec3 vW;
${NOISE_GLSL}
void main() {
  float s = abs(vQ.x);
  // soft round profile; with age it frays into puffs along its length
  float prof = exp(-s * s * 3.2) * (1.0 - smoothstep(0.82, 1.0, s));
  float n = fbm3(vec2(vQ.y * 34.0 + uSeed, vQ.x * 1.6));
  float puff = mix(1.0, 0.45 + 0.9 * n, smoothstep(0.08, 0.6, vQ.y));
  float a = prof * puff * vA;
  vec3 col = mix(uBelly, uTop, smoothstep(-0.6, 0.6, vUp));
  float d = length(vW - cameraPosition);
  float fg = 0.9 * (1.0 - exp(-max(0.0, d - 120.0) / 4200.0));
  gl_FragColor = vec4(mix(col, uFogCol, fg), a);
}`;
export type ContrailPose = { at: [number, number]; alt?: number; heading?: number; pitch?: number };
export type ContrailProps = {
  type: JetType;
  /** where the jet was at frame t */
  path: (t: number) => ContrailPose;
  S?: number;
  /** frames of trail */
  age?: number;
  /** half width at the engine and how much it grows (m at the trail's end) */
  width?: number;
  spread?: number;
  /** frames between the engine and the first visible vapour */
  lag?: number;
  /** 0..1 overall opacity */
  opacity?: number;
};
/** Two contrails (one per engine) drawn out behind a jet, widening, merging and diffusing with age. */
export const Contrail: React.FC<ContrailProps> = ({ type, path, S, age = 70, width = 1.1, spread = 16, lag = 3, opacity = 0.85 }) => {
  const ctx = useWifi();
  const now = S ?? ctx.S;
  const air = ctx.air;
  const o = useMemo(() => {
    const mk = (seed: number) => {
      const n = (TRAIL_N + 1) * 2;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aC", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aTan", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aQ", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      g.setAttribute("aW", new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(n), 1));
      const idx: number[] = [];
      for (let i = 0; i < TRAIL_N; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
      const m = new THREE.ShaderMaterial({
        vertexShader: TRAIL_VERT,
        fragmentShader: TRAIL_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uTop: { value: v3("#F7EEDD") }, uBelly: { value: v3("#C2AE93") }, uFogCol: { value: v3(SKY.glow) }, uSeed: { value: seed } },
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      return { g, mesh };
    };
    return [mk(1.7), mk(23.1)];
  }, []);
  const sp = SPECS[type];
  const eng = sp.engines[0];
  const ws = sp.wing;
  // the engine's exhaust in jet-local coords (x forward, y up, z starboard)
  const exX = sp.L / 2 - ws.x0 * sp.L + eng.ahead - eng.len - 0.5;
  const exY = sp.belly + sp.H / 2 + ws.y0 - eng.drop;
  for (let e = 0; e < 2; e++) {
    const side = e === 0 ? -1 : 1;
    const g = o[e].g;
    const C = g.attributes.aC.array as Float32Array;
    const Tn = g.attributes.aTan.array as Float32Array;
    const Q = g.attributes.aQ.array as Float32Array;
    const Wd = g.attributes.aW.array as Float32Array;
    const A = g.attributes.aA.array as Float32Array;
    const pts: V3[] = [];
    for (let i = 0; i <= TRAIL_N; i++) {
      const a = lag + (age - lag) * (i / TRAIL_N);
      const pose = path(now - a);
      const u = i / TRAIL_N;
      // the two trails drift together as they age (the wake's vortices pull them in)
      const zIn = eng.z * side * (1 - 0.55 * Math.pow(u, 0.7));
      const w = jetLocal(type, pose.at, pose.heading ?? -90, pose.alt ?? CRUISE, pose.pitch ?? 0, [exX, exY, zIn]);
      // carried by the air since it left the engine; it sinks a little as it ages
      pts.push([w[0] + air[0] * a, w[1] + air[1] * a - 0.04 * a, w[2] + air[2] * a]);
    }
    for (let i = 0; i <= TRAIL_N; i++) {
      const u = i / TRAIL_N;
      const p = pts[i];
      const q = pts[Math.min(TRAIL_N, i + 1)];
      const r = pts[Math.max(0, i - 1)];
      const tx = q[0] - r[0];
      const ty = q[1] - r[1];
      const tz = q[2] - r[2];
      const hw = width + spread * Math.pow(u, 0.65);
      const al = opacity * smoothFade(u) * (1 - 0.55 * u);
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k;
        C[j * 3] = p[0];
        C[j * 3 + 1] = p[1];
        C[j * 3 + 2] = -p[2];
        Tn[j * 3] = tx;
        Tn[j * 3 + 1] = ty;
        Tn[j * 3 + 2] = -tz;
        Q[j * 2] = k === 0 ? -1 : 1;
        Q[j * 2 + 1] = u;
        Wd[j] = hw;
        A[j] = al;
      }
    }
    for (const k of ["aC", "aTan", "aQ", "aW", "aA"]) g.attributes[k].needsUpdate = true;
  }
  return (
    <>
      <primitive object={o[0].mesh} />
      <primitive object={o[1].mesh} />
    </>
  );
};
/** a trail's opacity along its age: forms over the first stretch, thins out to nothing at its end */
const smoothFade = (u: number) => {
  const a = c01(u / 0.06);
  const b = c01((1 - u) / 0.35);
  return a * a * (3 - 2 * a) * (b * b * (3 - 2 * b));
};

// ===================================================================================================================
// CUT 1's JET AND TRAIN, CAMERAS
// ===================================================================================================================
/** cut 1's United 787-9 (jet-fixed frame: it stays here; the air goes by). Cuts 2 and 4 may reuse it. */
export const CRUISE_JET = { type: "B787_9" as JetType, at: [0, 145] as [number, number], heading: -90, alt: CRUISE, pitch: 1.5 };
/** cut 1's end: the jet ~60 % of the width, nose left, at y ~950; the link's satellite upper frame; deck below */
export const CAM_LINK_CLOSE: SideCam = { mode: "side", x: 2, y: CRUISE - 7, z: 0, f: 1500, horizon: 1040, pitch: -1.2 };
/** cut 1's start: tilted up into the dusk at the passing train */
export const CAM_TRAIN_UP: SideCam = { mode: "side", x: 2, y: CRUISE - 7, z: 0, f: 1500, horizon: 1040, pitch: -36 };
/** a wide of the cruise sky: jets 250-400 px long over the deck, the train above */
export const CAM_CRUISE_WIDE: SideCam = { mode: "side", x: 0, y: CRUISE + 20, z: 150, f: 1350, horizon: 1100, pitch: -6 };
/** cut 1's train: six satellites gliding left and away into the dusk; sat 5 is the tail (the nearest, the one that
 *  links), sat 4 sits at `origin` at S = 0 */
export const TRAIN_CUT1: TrainSpec = { origin: [36.8, SAT.y, 744.7], dir: [-0.36, 0, 0.933], speed: 10, spacing: SAT.spacing, count: 6, first: 4, scale: SAT.scale, roll: 22 };
