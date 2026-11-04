// ---------------------------------------------------------------------------
// AlmostTwentyPercent (scott-nolan-fuel, cut 13). Cheeky Pint style (stout) in real 3D (scott-nolan-uranium/nuclearWorld.tsx).
// Opaque 1080x1920, 23.976 fps, 120 frames. RENDER --gl=angle.
//
// CHECK LINE: "The new reactors need uranium where about one atom in five is the U-235 kind: 19.75%, called HALEU, four times today's fuel."
//
// THE LINE: "It's all about where are we going to get the 19.75% enriched uranium, also called HALEU,"
// WORD -> FRAME: It's 1 · all 5 · about 10 · where 15 · are 19 · we/going 23 · to 26 · get 30 · the 34 · 19 39 · .75 47 · % 60 ·
//   enriched 71 · uranium 78 · also 93 · called 100 · HALEU 108 · (the edit cuts back to the speaker at 120)
// DURATION: the slot 13.889 -> 18.894 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION: a square clay tray holds 20 x 20 = 400 atoms: board-tone U-238, amber U-235 scattered through it as blue noise. It
// opens low and close across the tray, already drifting, with 20 of 400 amber and "5%" standing behind it. From "get" (f30) an
// front of cream light sweeps the tray left to right as one low wave through the atoms; every atom of the HALEU set it passes turns amber
// over 10 f, until 79 of 400 are amber, and the numeral turns with the count as whole centred strings (5% ... 19%, then an 8 f
// turn to 19.75% while the
// last three turn, ~f52-f60), landing on "%" (f60). One camera move: a drift at f0 that grows into a crane up and back to a settled
// 3/4 view at 34 deg (speed peaks ~f38), then a slow creep (push ~3.5%, yaw -3 -> -5) to the tray at ~88% of the frame width. "HALEU" slides up under the numeral f93-f106; then a slow creep to the cut.
// CAUSE: an atom's tone change starts on the frame the front's crest reaches it (hit frames from about f33 to f47; each change
// 10 f, the last lands about f57); the front is the crest lifting the atoms plus the cream light pool drawn out into a band
// under it (cream on the floor and the board atoms; amber stays the atoms' own tone, fuel only).
// The numeral is read off the summed tone of the atoms, never a parallel timer.
// AMBER = uranium fuel (U-235, the enriched part), the same meaning as the sister clip's centrifuge cutaway; U-238 is board tone.
//
// SOURCES (COMMON.md, verified by the director Nov 4): HALEU is enriched above 5% and below 20% U-235, advanced reactors mostly
// want 19.75%; today's light water reactor fuel (LEU) is up to 5%. 20/400 = 5%, 79/400 = 19.75% exactly.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { z } from "zod";
import { COLOR, FONT_NUM, Label, TRACK } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, NuclearStage, SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearMaterial, nuclearProject, nuclearTrack, withClayAttrs, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// --- the tray: 20 x 20 atoms on a pitch of P, a shallow cream clay tray -----------------------------------------------
const N = 20;
const P = 10;
const ATOM_R = 3.4; // gaps between the balls: each atom stays its own dot at phone size from the settled 3/4 view
const FLOOR_Y = 2.4; // the tray floor's top
const RIM_Y = 5.0; // the rim's top: under the atoms' centres, so a low eye still sees every atom
const INNER = (N * P) / 2 + 1.5;
const OUTER = INNER + 7;
const ATOM_Y = FLOOR_Y + ATOM_R;
const cellXZ = (c: number): [number, number] => [((c % N) - (N - 1) / 2) * P, (Math.floor(c / N) - (N - 1) / 2) * P];

// --- which atoms are U-235: one deterministic best-candidate (blue noise) run; its first 20 are today's fuel, its first 79 HALEU
const LEU_N = 20; // 20 / 400 = 5%
const HALEU_N = 79; // 79 / 400 = 19.75%
const PICKS: number[] = (() => {
  const chosen: number[] = [];
  for (let n = 0; n < HALEU_N; n++) {
    let best = -1;
    let bs = -1e9;
    for (let c = 0; c < N * N; c++) {
      if (chosen.includes(c)) continue;
      const i = c % N;
      const j = Math.floor(c / N);
      let m = Math.min(i + 0.5, N - 0.5 - i, j + 0.5, N - 0.5 - j) * 2 + 0.9;
      for (const o of chosen) m = Math.min(m, Math.hypot(i - (o % N), j - Math.floor(o / N)));
      const s = m + 0.7 * random(`a20-${n}-${c}`);
      if (s > bs) {
        bs = s;
        best = c;
      }
    }
    chosen.push(best);
  }
  return chosen;
})();
const LEU = new Set(PICKS.slice(0, LEU_N));
const TURNS = PICKS.slice(LEU_N);

// --- the front: a crest line travelling along U (left to right, a little away), eased; it lifts the atoms it passes ----------
const U: [number, number] = (() => {
  const l = Math.hypot(1, 0.3);
  return [1 / l, 0.3 / l];
})();
const sOf = (c: number) => {
  const [x, zz] = cellXZ(c);
  return x * U[0] + zz * U[1];
};
const FRONT_F0 = 27;
const FRONT_F1 = 53;
const FRONT_S0 = -150;
const FRONT_S1 = 150;
const frontAt = (f: number) => FRONT_S0 + (FRONT_S1 - FRONT_S0) * smooth(FRONT_F0, FRONT_F1, f);
const WAVE_W = 16; // the crest's width (world units): a broad swell that falls off smoothly
// how far it lifts an atom: never more than the rim's height above the floor, so a lifted ball's foot never clears the rim and
// no atom ever shows daylight under it against the board (the far row seen from low)
const WAVE_A = RIM_Y - FLOOR_Y;
const TONE_F = 10; // one atom's tone change
const BAND_W = 34; // the cream light under the crest: a broad, soft swell rolling across, not a stripe
const LIGHT = "#FFFAF0"; // its light: the stage's cream pool, a step brighter than the cream card
const hitFrame = (s: number) => {
  let lo = FRONT_F0;
  let hi = FRONT_F1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (frontAt(m) < s) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const HIT = new Map<number, number>(TURNS.map((c) => [c, hitFrame(sOf(c))]));
const toneOf = (c: number, f: number) => (LEU.has(c) ? 1 : HIT.has(c) ? smooth(0, TONE_F, f - (HIT.get(c) as number)) : 0);
const liftOf = (c: number, f: number) => {
  const d = (frontAt(f) - sOf(c)) / WAVE_W;
  return WAVE_A * Math.exp(-d * d);
};
/** amber atoms counted off the tray itself (a turning atom counts by its tone) */
const amberCount = (f: number) => LEU_N + TURNS.reduce((a, c) => a + toneOf(c, f), 0);

// --- the atoms: one instanced draw; tone 0 = U-238 (board clay), 1 = U-235 (amber fuel) --------------------------------
const ATOM_VERT = /* glsl */ `
attribute float aAmb;
uniform vec2 uU; uniform float uFront; uniform float uBandW;
varying vec3 vW; varying vec3 vN; varying float vAmb; varying float vBand;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xyz; vAmb = aAmb;
  vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float b = (uFront - dot(vec2(c.x, -c.z), uU)) / uBandW;
  vBand = exp(-b * b);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const ATOM_FRAG = /* glsl */ `
uniform vec3 uL; uniform vec3 uDim; uniform vec3 uShade; uniform vec3 uCream;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uHot; uniform vec3 uG; uniform vec2 uFog; uniform vec3 uLight;
varying vec3 vW; varying vec3 vN; varying float vAmb; varying float vBand;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  // board clay: wrapped key, a warm bounce off the cream tray from below, a cream rim on the upward edge
  float lit = smoothstep(-0.42, 0.86, ndl);
  vec3 dim = mix(uDim * uShade, uDim * 1.03, lit);
  dim += uDim * vec3(0.12, 0.08, 0.04) * (1.0 - lit) * max(0.0, -n.y);
  float graze = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 3.0);
  dim = mix(dim, uCream, 0.32 * graze * smoothstep(0.05, 0.7, n.y));
  dim += uDim * 0.06 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
  // the front: a crest of cream light that washes over each board atom as it passes (amber is only ever the atoms' own tone)
  dim = mix(dim, uLight * mix(0.86, 1.0, lit), 0.36 * vBand);
  // amber fuel: the band gradient, a hot top
  vec3 amb = mix(uB, uA, smoothstep(-0.5, 0.9, ndl));
  amb = mix(amb, uHot, 0.5 * pow(max(n.y, 0.0), 6.0));
  vec3 col = mix(dim, amb, vAmb);
  gl_FragColor = vec4(mix(col, uG, smoothstep(uFog.x, uFog.y, length(vW - cameraPosition))), 1.0);
}`;

// --- the tray floor: cream clay with each atom's contact shadow and its short cast shadow along the key ---------------------
const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FLOOR_FRAG = /* glsl */ `
uniform vec3 uCream; uniform vec3 uFoot; uniform vec3 uSh; uniform vec3 uG; uniform vec2 uFog; uniform vec3 uLight; uniform float uBandW;
uniform vec2 uDir; uniform vec2 uU; uniform float uFront; uniform float uWaveW; uniform float uWaveA;
uniform float uP; uniform float uN; uniform float uR; uniform float uCast; uniform float uInner;
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);                 // world X, Z
  vec2 g = p / uP + uN * 0.5 - 0.5;            // cell coordinates
  vec2 c0 = floor(g + 0.5);
  float sh = 0.0;
  for (int dx = -1; dx <= 1; dx++) {
    for (int dz = -1; dz <= 1; dz++) {
      vec2 c = c0 + vec2(float(dx), float(dz));
      if (c.x < 0.0 || c.y < 0.0 || c.x > uN - 1.0 || c.y > uN - 1.0) continue;
      vec2 q = (c - uN * 0.5 + 0.5) * uP;
      float w = (uFront - dot(q, uU)) / uWaveW;
      float lift = uWaveA * exp(-w * w);
      // contact: a tight dark ring under the ball, opening as it lifts
      float dc = length(p - q);
      float contact = (1.0 - smoothstep(uR * 0.25, uR * (0.85 + 0.12 * lift), dc)) * (1.0 - 0.5 * lift / uWaveA);
      // cast: the ball's disc thrown along the key from its height
      vec2 qc = q + uDir * (uR + lift) * uCast;
      float soft = uR * (0.45 + 0.12 * lift);
      float thrown = 1.0 - smoothstep(uR * 0.9 - soft, uR * 0.9 + soft, length(p - qc));
      sh = max(sh, max(0.75 * contact, 0.4 * thrown));
    }
  }
  // the rim's foot: the floor darkens a little against the walls
  vec2 a = abs(p);
  float edge = uInner - max(a.x, a.y);
  float wall = 1.0 - smoothstep(0.0, 4.0, edge);
  vec3 col = mix(uFoot, uCream, 0.55 + 0.45 * smoothstep(0.0, 14.0, edge));
  // the front itself: the cream light pool drawn out into a band crossing the floor under the crest; it washes the shadows out
  float bw = (uFront - dot(p, uU)) / uBandW;
  float band = exp(-bw * bw);
  col = mix(col, uSh, 0.5 * max(sh, 0.6 * wall) * (1.0 - 0.35 * band));
  col = mix(col, uLight, 0.32 * band);
  gl_FragColor = vec4(mix(col, uG, smoothstep(uFog.x, uFog.y, length(vW - cameraPosition))), 1.0);
}`;

const roundRect = (half: number, r: number, hole = false) => {
  const s = hole ? new THREE.Path() : new THREE.Shape();
  const h = half;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  return s;
};

const Tray: React.FC<{ f: number; fog: [number, number] }> = ({ f, fog }) => {
  const o = useMemo(() => {
    // the rim: one ring of clay, its edges rounded by the bevel; shape (x, y) = world (X, Z)
    const BEV = 1.4;
    const ring = roundRect(OUTER - BEV, 9);
    ring.holes.push(roundRect(INNER + BEV, 3, true));
    const rg = new THREE.ExtrudeGeometry(ring, { depth: RIM_Y - 2 * BEV, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 4, curveSegments: 10 });
    rg.translate(0, 0, BEV);
    rg.rotateX(-Math.PI / 2);
    rg.computeVertexNormals();
    const rim = new THREE.Mesh(withClayAttrs(rg, 0.9, 0), nuclearMaterial("clay"));
    rim.frustumCulled = false;
    rim.renderOrder = 1;
    const fg = new THREE.ShapeGeometry(roundRect(INNER + 1, 3), 8);
    fg.rotateX(-Math.PI / 2);
    fg.translate(0, FLOOR_Y, 0);
    const fm = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      side: THREE.DoubleSide,
      uniforms: {
        uCream: { value: hex(COLOR.cream) },
        uFoot: { value: hex(COLOR.creamFoot) },
        uSh: { value: hex("#8C7258") },
        uLight: { value: hex(LIGHT) },
        uBandW: { value: BAND_W },
        uG: { value: hex(COLOR.ground) },
        uFog: { value: new THREE.Vector2(1e5, 2e5) },
        uDir: { value: new THREE.Vector2(SHADOW_DIR[0], SHADOW_DIR[1]) },
        uU: { value: new THREE.Vector2(U[0], U[1]) },
        uFront: { value: -1e4 },
        uWaveW: { value: WAVE_W },
        uWaveA: { value: WAVE_A },
        uP: { value: P },
        uN: { value: N },
        uR: { value: ATOM_R },
        uCast: { value: SHADOW_LEN / 0.72 },
        uInner: { value: INNER },
      },
    });
    const floor = new THREE.Mesh(fg, fm);
    floor.frustumCulled = false;
    floor.renderOrder = 1;
    // the atoms
    const ag = new THREE.SphereGeometry(ATOM_R, 28, 18);
    const amb = new THREE.InstancedBufferAttribute(new Float32Array(N * N), 1);
    ag.setAttribute("aAmb", amb);
    const am = new THREE.ShaderMaterial({
      vertexShader: ATOM_VERT,
      fragmentShader: ATOM_FRAG,
      uniforms: {
        uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uDim: { value: hex(COLOR.board) },
        uShade: { value: hex("#A88A6E") },
        uCream: { value: hex(COLOR.cream) },
        uA: { value: hex(COLOR.amberTop) },
        uB: { value: hex(COLOR.amberFoot) },
        uHot: { value: hex(COLOR.amberHot) },
        uG: { value: hex(COLOR.ground) },
        uFog: { value: new THREE.Vector2(1e5, 2e5) },
        uLight: { value: hex(LIGHT) },
        uU: { value: new THREE.Vector2(U[0], U[1]) },
        uFront: { value: -1e4 },
        uBandW: { value: BAND_W },
      },
    });
    const atoms = new THREE.InstancedMesh(ag, am, N * N);
    atoms.frustumCulled = false;
    atoms.renderOrder = 2;
    return { rim, floor, fm, atoms, amb, am };
  }, []);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Sc = new THREE.Vector3(1, 1, 1);
  const Pp = new THREE.Vector3();
  for (let c = 0; c < N * N; c++) {
    const [x, zz] = cellXZ(c);
    Pp.set(x, ATOM_Y + liftOf(c, f), -zz);
    M.compose(Pp, Q, Sc);
    o.atoms.setMatrixAt(c, M);
    o.amb.setX(c, toneOf(c, f));
  }
  o.atoms.instanceMatrix.needsUpdate = true;
  o.amb.needsUpdate = true;
  o.fm.uniforms.uFront.value = frontAt(f);
  o.am.uniforms.uFront.value = frontAt(f);
  o.fm.uniforms.uFog.value.set(fog[0], fog[1]);
  o.am.uniforms.uFog.value.set(fog[0], fog[1]);
  return (
    <>
      <primitive object={o.rim} />
      <primitive object={o.floor} />
      <primitive object={o.atoms} />
    </>
  );
};

// the tray's one shadow on the board: its plan filled with short casters thrown along the key, MAX-blended into one
const TRAY_SHADOW: ShadowItem[] = (() => {
  const out: ShadowItem[] = [];
  const step = 9;
  const r = 7;
  const n = Math.ceil((2 * (OUTER - r)) / step);
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const x = -OUTER + r + ((2 * (OUTER - r)) * i) / n;
      const zz = -OUTER + r + ((2 * (OUTER - r)) * j) / n;
      out.push({ x, z: zz, len: (ATOM_Y + ATOM_R) * SHADOW_LEN, r, soft: 3.2, alpha: 1 });
    }
  }
  // the soft ambient skirt that seats the tray on the board (the same one shadow layer)
  for (let i = 0; i <= n; i++) {
    const t = -OUTER + r + ((2 * (OUTER - r)) * i) / n;
    for (const [x, zz] of [[t, -OUTER + 3], [t, OUTER - 3], [-OUTER + 3, t], [OUTER - 3, t]] as [number, number][]) {
      out.push({ x, z: zz, len: (ATOM_Y + ATOM_R) * SHADOW_LEN, r: 5, soft: 6, alpha: 0.75 });
    }
  }
  return out;
})();

// --- the camera: one damped track, already drifting at f0; one eased crane up and back over the sweep, then a slow creep ------
const CAM_TRACK = nuclearTrack(
  { tx: -30, ty: 8, tz: -30, d: 265, yaw: 10, pitch: 14, f: 1700, cx: 540, cy: 748 },
  [
    // one move: a slow drift already running at f0 that grows into the crane up and back over the sweep (its speed peaks ~f38, settled ~f66)
    { f0: -10, f1: 60, to: { tx: 0, tz: 0, ty: 6, d: 498.0, yaw: -3, pitch: 34, cy: 750.7, cx: 575.4 }, warp: 1.3 },
    // the living creep: it takes over as the crane slows, so the yaw never stops (push ~4% and yaw -3 -> -5.5 by f119)
    { f0: 48, f1: 200, to: { d: 448.2, yaw: -9 } },
  ],
  DURATION,
);
const camAt = (f: number): NuclearCam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, f))];

// --- the numeral and its label: world-space type standing behind the tray, cream on the ground -------------------------
const NUM_AT: [number, number, number] = [-23.48, 47.95, OUTER + 14];
const NUM_WORLD = 60.17; // world units of type size: HERO (184 px) on the settled camera
const LAB_WORLD = 33.84; // HALEU: 100 px at f119
const LAB_DROP = 34.73; // world units from the numeral's baseline to the label's
const FOG: [number, number] = [1.6, 6];

// the last turn, 19% -> 19.75%: never before the tray holds 76 amber atoms (19%); a short turn (each string fades for at most
// 3 frames at the reading line), 19.75% crisp from f59, on "%" (f60)
const DRUM_LEN = 4;
const DRUM_F = (() => {
  let f = 0;
  while (amberCount(f) < 76 - 1e-6) f += 0.05;
  return Math.max(f, 55.5);
})();
/** the numeral's text state: an odometer 5% .. 19% on the whole percent, then a drum to 19.75% on the last three atoms */
const readout = (f: number) => {
  const n = amberCount(f);
  const v = n / 4;
  const vPrev = amberCount(f - 1) / 4;
  const speed = Math.abs(v - vPrev);
  return { v, speed, drum: smooth(DRUM_F, DRUM_F + DRUM_LEN, f) };
};

const Readout: React.FC<{ cam: NuclearCam; f: number }> = ({ cam, f }) => {
  const p = nuclearProject(cam, NUM_AT);
  const px = NUM_WORLD * p.s;
  const r = readout(f);
  const lab = nuclearProject(cam, [NUM_AT[0], NUM_AT[1] - LAB_DROP, NUM_AT[2]]);
  const labPx = LAB_WORLD * lab.s;
  const enter = c01((f - 93) / 13);
  let roll: { a: string; b: string; t: number; blur: number };
  if (r.drum <= 0) {
    // the count: whole centred strings, one per whole percent, each step eased; blur in proportion to the count's speed
    const v = Math.min(19, r.v);
    const k = Math.floor(v + 1e-9);
    const fr = v - k;
    roll = { a: `${k}%`, b: `${k + 1}%`, t: k >= 19 ? 0 : ease2(fr), blur: Math.min(10, r.speed * 8) };
  } else {
    const dt = r.drum - smooth(DRUM_F, DRUM_F + DRUM_LEN, f - 1);
    roll = { a: "19%", b: "19.75%", t: ease2(c01((f - DRUM_F) / DRUM_LEN)), blur: Math.min(6, dt * 14) };
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <WholeDrum x={p.x} y={p.y} px={px} {...roll} />
      {enter > 0 ? <Label x={lab.x} y={lab.y} k={1} px={labPx} text="HALEU" tone="cream" enter={enter} /> : null}
    </svg>
  );
};
/** A drum of whole, centred strings (proportional figures, house tracking): `a` turns up and out as `b` turns up into place,
 *  t 0..1. The strings sit a line apart (more than a cap height), so they never overlap; each fades by its distance from the
 *  reading line and is gone 0.62 of a line away, so no frame ever shows both and nothing is ever clipped into a sliver. */
const DRUM_LINE = 0.86; // em
/** each turn eased twice: the strings spend little time half way, so a fast count reads as crisp whole values */
const ease2 = (u: number) => {
  const a = c01(u) * c01(u) * (3 - 2 * c01(u));
  return a * a * (3 - 2 * a);
};
const WholeDrum: React.FC<{ x: number; y: number; px: number; a: string; b: string; t: number; blur: number }> = ({ x, y, px, a, b, t: tIn, blur }) => {
  const L = px * DRUM_LINE;
  const op = (off: number) => c01(1 - (Math.abs(off) / L) * 1.6);
  // the half-way stretch where both strings would show faintly is stepped over: one string is always the one being read
  const t = tIn < 0.5 ? Math.min(tIn, 0.375) : Math.max(tIn, 0.625);
  const id = "atp-roll";
  const strings: [string, number][] = [
    [a, -t * L],
    [b, (1 - t) * L],
  ];
  return (
    <g>
      {blur > 0.05 ? (
        <defs>
          <filter id={id} x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
          </filter>
        </defs>
      ) : null}
      <g filter={blur > 0.05 ? `url(#${id})` : undefined}>
        {strings.map(([text, off], i) => {
          const o = op(off);
          return o <= 0.002 ? null : <DrumLine key={i} x={x} y={y + off} px={px} text={text} opacity={o} />;
        })}
      </g>
    </g>
  );
};
const DrumLine: React.FC<{ x: number; y: number; px: number; text: string; opacity: number }> = ({ x, y, px, text, opacity }) => (
  <text x={x + (TRACK.numeral * px) / 2} y={y} opacity={opacity} fontFamily={FONT_NUM} fontWeight={700} fontSize={px} letterSpacing={`${TRACK.numeral}em`} textAnchor="middle" fill={COLOR.inkCream} style={{ fontFeatureSettings: '"lnum" 1' }}>
    {text}
  </text>
);

const AlmostTwentyPercent: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 400;
  const cam = camAt(f);
  const fogUnits: [number, number] = [cam.d * FOG[0], cam.d * FOG[1]];
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={FOG}
      boardUnits={320}
      pool={{ x: 470, y: 760, strength: 1 }}
      world={
        <>
          <SoftShadows items={TRAY_SHADOW} />
          <Tray f={f} fog={fogUnits} />
        </>
      }
      overlay={<Readout cam={cam} f={f} />}
    />
  );
};

export default AlmostTwentyPercent;
