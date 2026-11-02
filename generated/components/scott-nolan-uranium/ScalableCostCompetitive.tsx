// ---------------------------------------------------------------------------
// ScalableCostCompetitive (scott-nolan-uranium, cut 39). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 152 frames.
//
// CHECK LINE: "One machine is easy. The hard part is that as the hall multiplies, the cost of each unit has to fall."
//
// THE LINE: "so I think the hard thing is not simply doing enrichment. It's doing it in a way that can be scalable and highly cost competitive."
// WORD -> FRAME: think 4 · hard 11 · thing 15 · not 24 · simply 28 · doing 38 · enrichment 46 · It's 63 · doing 72 · it 77 · way 85 · scalable 100 · and 109 · highly 121 · cost 126 · competitive 134
// DURATION: the slot 39.873 -> 46.213 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION: one continuous crane-up pull-back. It opens tight on the spinning rotor of one glass centrifuge, amber gathering on its
// axis, and pulls back and arcs right: the whole machine comes into frame and a stack of banknote bundles its own height comes in from
// frame right, reading fully by "enrichment" (f47), the arc still running. From "It's doing it" (f63) machines rise
// out of slots in a wave running outward, and pipes follow the wave with amber running along them, while the camera climbs over
// them to a hall running to the horizon. Over the same span the stack is dealt away off its top, one bundle after another along
// its long axis and off frame right, never fading; the last lift clears at about f128, before "competitive" (f134). Then a slow
// creep: hall running, amber flowing, cash low.
// CAUSE: no bundle moves until the first neighbour starts to rise (f64); amber enters a pipe only behind that pipe's moving tip,
// and a tip reaches a machine only after the machine has finished rising.
// AMBER = uranium fuel only (the strap on the cash is cream paper here for that reason).
//
// SOURCES: no figures on screen. Machine proportions from nuclearWorld. The small "100" on the note face is the note's own print
// (the sam-gigawatt-cost cash look), not a claim.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { Centrifuge, CENTRIFUGE, CentrifugeField, KEY_LIGHT, NuclearStage, SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearMaterial, nuclearProject, nuclearTrack, withClayAttrs, type FieldMachine, type NuclearCam, type ShadowItem, type V3 } from "./nuclearWorld";
import { BUNDLE_REAL, StoutCash, type BundleItem, type BundleSize } from "./stoutCash";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// --- the cash: one stack beside the first machine, its near foot the framing anchor ---------------------------------
const CASH_L = 45;
const CASH: BundleSize = { L: CASH_L, W: (CASH_L * BUNDLE_REAL.W) / BUNDLE_REAL.L, H: (CASH_L * BUNDLE_REAL.H) / BUNDLE_REAL.L };
const STACK_AT: [number, number] = [36, -18];
const STACK_HEADING = 8;
const STACK_N = 23;
const STACK_KEEP = 5;
const AXIS: [number, number] = [Math.cos(STACK_HEADING * D2R), -Math.sin(STACK_HEADING * D2R)];
const FOOT_NEAR: V3 = [STACK_AT[0], 0, STACK_AT[1] - CASH.W / 2];
/** bundle i (0 at the foot) lifts at liftAt(i); the top one first, the rate tapering in and out. */
const LIFT_F0 = 64;
const LIFT_F1 = 114;
const FLIGHT = 28;
const liftAt = (i: number) => {
  const u = (STACK_N - 1 - i) / (STACK_N - 1 - STACK_KEEP);
  return LIFT_F0 + (LIFT_F1 - LIFT_F0) * (0.82 * u + 0.18 * (u * u * (3 - 2 * u)));
};
const BUNDLE_JIT = Array.from({ length: STACK_N }, (_, i) => ({
  x: (random(`scc-x${i}`) - 0.5) * 0.024 * CASH.L,
  z: (random(`scc-z${i}`) - 0.5) * 0.024 * CASH.W,
  h: (random(`scc-h${i}`) - 0.5) * 1.1,
  s: random(`scc-s${i}`),
}));
const stackItems = (f: number): BundleItem[] =>
  BUNDLE_JIT.map((j, i) => {
    const y0 = i * CASH.H;
    const hd = STACK_HEADING + j.h;
    const x0 = STACK_AT[0] + j.x;
    const z0 = STACK_AT[1] + j.z;
    if (i < STACK_KEEP || f <= liftAt(i)) return { at: [x0, y0, z0] as V3, heading: hd, seed: j.s };
    // one family of speeds: the same lift, the same run along the long axis, constant speed past the end of the ease
    const t = (f - liftAt(i)) / FLIGHT;
    const lift = 7 * smooth(0, 0.45, t) + 9 * Math.max(0, t - 0.45);
    const run = t < 1 ? 300 * t * t : 300 + 600 * (t - 1);
    return { at: [x0 + AXIS[0] * run, y0 + lift, z0 + AXIS[1] * run] as V3, heading: hd, seed: j.s };
  });
const stackTop = (f: number) => {
  let n = STACK_KEEP;
  for (let i = STACK_KEEP; i < STACK_N; i++) n += 1 - smooth(0, 11, f - liftAt(i));
  return n * CASH.H;
};
const cashShadows = (f: number): ShadowItem[] => {
  const r = CASH.W * 0.5;
  const a: [number, number] = [STACK_AT[0] - AXIS[0] * (CASH.L / 2 - r), STACK_AT[1] - AXIS[1] * (CASH.L / 2 - r)];
  const top = stackTop(f);
  const out: ShadowItem[] = [
    { x: a[0], z: a[1], len: CASH.L - 2 * r, r, soft: 2.2, alpha: 1, dirX: AXIS[0], dirZ: AXIS[1] },
    { x: STACK_AT[0], z: STACK_AT[1], len: CASH.L / 2 - r + top * SHADOW_LEN, r, soft: 4.5, alpha: 0.95 },
  ];
  for (let i = STACK_KEEP; i < STACK_N; i++) {
    const t = (f - liftAt(i)) / FLIGHT;
    // a dealt bundle's own soft shadow, thrown along the key from its height; it leaves the frame with it
    const y = i * CASH.H;
    const run = t <= 0 ? 0 : t < 1 ? 300 * t * t : 300 + 600 * (t - 1);
    out.push({
      x: STACK_AT[0] + AXIS[0] * run + SHADOW_DIR[0] * y * SHADOW_LEN,
      z: STACK_AT[1] + AXIS[1] * run + SHADOW_DIR[1] * y * SHADOW_LEN,
      len: CASH.L * 0.5,
      r: CASH.W * 0.5,
      soft: 6,
      alpha: 0.55 * smooth(0.02, 0.2, t),
      dirX: AXIS[0],
      dirZ: AXIS[1],
    });
  }
  return out;
};

// --- the camera: one damped track; the vertical framing is solved from the stack's near foot, so no zoom can carry it into band 1
const TRACK = nuclearTrack(
  { tx: 26, ty: 40, tz: -6, d: 255, yaw: 15, pitch: 3.5, f: 2600, cy: 610, cx: 540 },
  [
    { f0: -8, f1: 64, to: { yaw: 4 } },
    { f0: 56, f1: 134, to: { tx: 20, ty: 0, tz: -10, d: 455, yaw: -5, f: 1480 }, warp: 0.92 },
    // the eye gets over the machine tops early: from below them the columns merge into pale walls
    { f0: 56, f1: 118, to: { pitch: 21 }, warp: 0.72 },
    { f0: 130, f1: 230, to: { d: 440, yaw: -6.2 } },
  ],
  DURATION,
);
const craneAt = (f: number): NuclearCam => {
  const c = TRACK[Math.max(0, Math.min(TRACK.length - 1, f))];
  const foot = nuclearProject({ ...c, cy: 960 }, FOOT_NEAR).y;
  // the near foot eases from just above band 1 to its resting line as the stack becomes the small thing at the bottom of the frame
  return { ...c, cy: 960 + 1062 - 26 * smooth(50, 134, f) - foot };
};
// the opening: tight on the rotor, the eye off to the left, so the stack lies out past frame right. It is an offset on the crane that
// dies away with zero speed at OPEN_F (one ease, moving from f0), so the two join with the same camera state and the same speed.
const OPEN_F = 62;
const OPEN: NuclearCam = { tx: 0, ty: 48, tz: 0, d: 33, yaw: 46, pitch: 4, f: 2000, cy: 960, cx: 540 };
const OPEN_FROM = craneAt(0);
const openLeft = (f: number) => {
  const u = c01(f / OPEN_F);
  const v = Math.pow(u, 0.85);
  // a small start speed (moving from f0), the whole machine in frame by about f33, the stack by about f47, zero speed at the join
  return 1 - (0.12 * u * (2 - u) + 0.88 * (v * v * (3 - 2 * v)));
};
// the eye rises over the top of the tall stack so the top note's face says "cash" on "enrichment", then settles back to the crane's
// own height with zero speed at the join (the crane is low there, under the stack's top)
const LOOK_OVER = 17;
const lookOver = (f: number) => LOOK_OVER * smooth(20, 42, f) * (1 - smooth(44, OPEN_F, f));
const camAt = (f: number): NuclearCam => {
  const c = craneAt(f);
  if (f >= OPEN_F) return c;
  const a = openLeft(f);
  const off = (k: "tx" | "ty" | "tz" | "yaw" | "pitch" | "cy" | "cx") => c[k] + (OPEN[k] - OPEN_FROM[k]) * a;
  const o: NuclearCam = {
    tx: off("tx"),
    ty: off("ty"),
    tz: off("tz"),
    yaw: off("yaw"),
    pitch: off("pitch") + lookOver(f),
    cy: off("cy"),
    cx: off("cx"),
    d: c.d * Math.pow(OPEN.d / OPEN_FROM.d, a),
    f: c.f * Math.pow(OPEN.f / OPEN_FROM.f, a),
  };
  // once the stack is whole, lift it clear of the caption bands onto the crane's foot line (the same line at the join)
  const over = nuclearProject(o, FOOT_NEAR).y - (1062 - 26 * smooth(50, 134, f));
  return { ...o, cy: o.cy - Math.max(0, over) * smooth(38, 54, f) };
};

// --- the hall: a grid on row and column pitches behind and beside the first machine; only what the widest camera sees ---------
const COL = 30;
const ROW = 36;
const FIRST: [number, number] = [0, 0];
const END = TRACK[DURATION - 1];
const inView = (x: number, zz: number) => Math.abs(x - END.tx) < ((zz + END.d) * 540) / END.f + 130;
type Hall = { at: [number, number]; r: number; t0: number };
const NEAR_ROWS = 28;
const FAR_ROWS = 56;
const RISE = 18;
const WAVE_SPAN = 52;
const WAVE_R = 3000;
const waveAt = (r: number) => 64 + WAVE_SPAN * Math.sqrt(r / WAVE_R);
const tipAt = (f: number) => (f <= 84 ? 0 : WAVE_R * Math.pow((f - 84) / WAVE_SPAN, 2));
const build = (j0: number, j1: number) => {
  const out: Hall[] = [];
  for (let j = j0; j < j1; j++) {
    const zz = j * ROW;
    for (let i = -70; i <= 70; i++) {
      // the main aisle: nothing stands behind the first machine, so its glass and amber stay on the dark board to the horizon
      if (j === 0 ? i === 0 : i === 0 || i === -1) continue;
      const x = i * COL;
      if (!inView(x, zz)) continue;
      const r = Math.hypot(x, zz);
      out.push({ at: [x, zz], r, t0: waveAt(r) });
    }
  }
  return out;
};
const NEAR = build(0, NEAR_ROWS);
const FAR = build(NEAR_ROWS, FAR_ROWS);
const riseOf = (m: Hall, f: number) => Math.max(1e-4, smooth(0, 1, (f - m.t0) / RISE));

// the far tier: the same silhouette with few segments (nothing thin to strobe), one instanced draw with its own shadow layer
const H = CENTRIFUGE.H;
const farGeo = (n: number) => {
  const R = CENTRIFUGE.R;
  const lathe = (p: [number, number][], tone: number) => withClayAttrs(new THREE.LatheGeometry(p.map((q) => new THREE.Vector2(q[0], q[1])), 10), tone, 0);
  const g = mergeGeometries(
    [
      lathe([[0.0001, 0], [R * 1.5, 0], [R * 1.56, 0.016], [R * 1.14, 0.024], [R * 1.1, 0.05], [R, 0.053]], 0.45),
      lathe([[R, 0.053], [R, 0.905]], 1),
      lathe([[R, 0.905], [R * 1.14, 0.911], [R * 1.14, 0.927], [R * 0.9, 0.941], [R * 0.34, 0.954], [0.0001, 0.955]], 1),
    ],
    false,
  );
  g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n)), 1));
  return g;
};
const FarField: React.FC<{ f: number }> = ({ f }) => {
  const o = useMemo(() => {
    const me = new THREE.InstancedMesh(farGeo(FAR.length), nuclearMaterial("clayInst"), Math.max(1, FAR.length));
    me.frustumCulled = false;
    me.renderOrder = 1;
    return me;
  }, []);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Sc = new THREE.Vector3(H, H, H);
  const P = new THREE.Vector3();
  const sh: ShadowItem[] = [];
  FAR.forEach((m, i) => {
    const r = riseOf(m, f);
    P.set(m.at[0], -(1 - r) * H * 1.03, -m.at[1]);
    M.compose(P, Q, Sc);
    o.setMatrixAt(i, M);
    const a = smooth(0, 0.05, r);
    sh.push({ x: m.at[0], z: m.at[1], len: H * r * SHADOW_LEN, r: H * CENTRIFUGE.R * 1.2, soft: H * CENTRIFUGE.R * 0.7, alpha: a });
  });
  o.instanceMatrix.needsUpdate = true;
  return (
    <>
      <SoftShadows items={sh} />
      <primitive object={o} />
    </>
  );
};

// --- the pipes. A tip runs from the first machine's top pipe along row 0 and up a spine, and branches along every row. Each pipe is a
// cream tube; amber runs inside it behind the tip. A little thicker with distance, so a far pipe never thins enough to strobe.
const FRONT_Z = -CENTRIFUGE.R * 1.6 * H;
const FRONT_Y = (CENTRIFUGE.CASING_Y1 + 0.04 + 0.044) * H;
const STUB_X = -CENTRIFUGE.R * 0.34 * H;
const SPINE_X = 15;
const SPINE_L = -45;
const AMBER_LAG = 6;
const ROW_X = (j: number) => {
  const xs = (j < NEAR_ROWS ? NEAR : FAR).filter((m) => m.at[1] === j * ROW).map((m) => m.at[0]);
  return [Math.min(...xs, 0) - COL, Math.max(...xs, 0) + COL];
};
type PipeRun = { from: V3; dir: "x" | "z"; sign: number; len: number; d0: number; r: number; amber: boolean };
const RUNS: PipeRun[] = (() => {
  const out: PipeRun[] = [];
  const pipeR = (zz: number) => 0.56 * (1 + zz / 1500);
  for (let j = 0; j < FAR_ROWS; j++) {
    const zz = j * ROW;
    const [x0, x1] = ROW_X(j);
    // nothing crosses the main aisle: right rows branch off the right spine, left rows off the left one
    const startR = j === 0 ? STUB_X : SPINE_X;
    const startL = j === 0 ? STUB_X : SPINE_L;
    const d0R = j === 0 ? 0 : SPINE_X - STUB_X + zz;
    const d0L = j === 0 ? 0 : STUB_X - SPINE_L + zz;
    // a header on every second row near, every fourth far: the machines stay readable between them
    if (j % (j < 14 ? 2 : 4)) continue;
    out.push({ from: [startR, FRONT_Y, zz + FRONT_Z], dir: "x", sign: 1, len: x1 - startR, d0: d0R, r: pipeR(zz), amber: true });
    out.push({ from: [startL, FRONT_Y, zz + FRONT_Z], dir: "x", sign: -1, len: startL - x0, d0: d0L, r: pipeR(zz), amber: true });
  }
  out.push({ from: [SPINE_X, FRONT_Y, FRONT_Z], dir: "z", sign: 1, len: (FAR_ROWS - 1) * ROW, d0: SPINE_X - STUB_X, r: 0.9, amber: true });
  out.push({ from: [SPINE_L, FRONT_Y, FRONT_Z], dir: "z", sign: 1, len: (FAR_ROWS - 1) * ROW, d0: STUB_X - SPINE_L, r: 0.9, amber: true });
  return out;
})();
const AMBER_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const AMBER_FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uHot; uniform vec3 uG; uniform vec3 uL;
uniform vec2 uFog; uniform float uS; uniform float uSpineX;
varying vec3 vW; varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  vec3 col = mix(uB, uA, smoothstep(-0.5, 0.9, dot(n, uL)));
  // slow brighter slugs carried along the pipe, away from the first machine; they dissolve before they could strobe
  float s = abs(vW.x - uSpineX) - vW.z;
  float c = s / 120.0 - uS * 0.016;
  float w = fwidth(c);
  float slug = (1.0 - smoothstep(0.0, 0.16, abs(fract(c) - 0.5))) * (1.0 - smoothstep(0.08, 0.3, w));
  col = mix(col, uHot, 0.55 * slug);
  float fg = smoothstep(uFog.x, uFog.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(col, uG, fg), 1.0);
}`;
const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const unitPipe = (n: number) => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
  g.rotateZ(-Math.PI / 2);
  g.translate(0.5, 0, 0);
  withClayAttrs(g, 0.82, 0);
  g.setAttribute("aPhase", new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
  return g;
};
const Pipes: React.FC<{ f: number; S: number; fog: [number, number] }> = ({ f, S, fog }) => {
  const o = useMemo(() => {
    const clay = new THREE.InstancedMesh(unitPipe(RUNS.length), nuclearMaterial("clayInst"), RUNS.length);
    clay.frustumCulled = false;
    clay.renderOrder = 1;
    const am = RUNS.filter((r) => r.amber);
    const mat = new THREE.ShaderMaterial({
      vertexShader: AMBER_VERT,
      fragmentShader: AMBER_FRAG,
      side: THREE.DoubleSide,
      uniforms: {
        uA: { value: hex(COLOR.amberTop) },
        uB: { value: hex(COLOR.amberFoot) },
        uHot: { value: hex(COLOR.amberHot) },
        uG: { value: hex(COLOR.ground) },
        uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uFog: { value: new THREE.Vector2(1e5, 2e5) },
        uS: { value: 0 },
        uSpineX: { value: SPINE_X },
      },
    });
    const amber = new THREE.InstancedMesh(unitPipe(am.length), mat, am.length);
    amber.frustumCulled = false;
    amber.renderOrder = 1;
    return { clay, amber, am, mat };
  }, []);
  const M = new THREE.Matrix4();
  const P = new THREE.Vector3();
  const Sc = new THREE.Vector3();
  const QX = new THREE.Quaternion();
  const QZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const put = (mesh: Any, i: number, run: PipeRun, tip: number, rScale: number) => {
    const L = Math.min(run.len, tip - run.d0);
    const on = L > 0.01;
    P.set(run.from[0], run.from[1], -run.from[2]);
    Sc.set(on ? L * run.sign : 0.001, on ? run.r * rScale : 0.0001, on ? run.r * rScale : 0.0001);
    M.compose(P, run.dir === "x" ? QX : QZ, Sc);
    mesh.setMatrixAt(i, M);
  };
  const tip = tipAt(f);
  const amberTip = tipAt(f - AMBER_LAG);
  RUNS.forEach((r, i) => put(o.clay, i, r, tip, 1));
  o.am.forEach((r, i) => put(o.amber, i, r, amberTip, 1.22));
  o.clay.instanceMatrix.needsUpdate = true;
  o.amber.instanceMatrix.needsUpdate = true;
  o.mat.uniforms.uS.value = S;
  o.mat.uniforms.uFog.value.set(fog[0], fog[1]);
  return (
    <>
      <primitive object={o.clay} />
      <primitive object={o.amber} />
    </>
  );
};

// --- the amber trickle up the first machine's top pipe, the same path as nuclearWorld's front pipe, a hair thicker --------------
const TRICKLE_FRAG = /* glsl */ `
uniform vec3 uA; uniform vec3 uHot; uniform float uS;
varying vec2 vU;
void main() {
  float a = fract(vU.x * 2.6 - uS * 0.034);
  if (a > 0.62) discard;
  gl_FragColor = vec4(mix(uA, uHot, 0.35 * (1.0 - a / 0.62)), 1.0);
}`;
const Trickle: React.FC<{ S: number }> = ({ S }) => {
  const o = useMemo(() => {
    const R = CENTRIFUGE.R;
    const py = CENTRIFUGE.CASING_Y1 + 0.04;
    const pts: V3[] = [[-R * 0.25, py, R * 0.38], [-R * 0.25, py + 0.016, R * 0.38], [-R * 0.25, py + 0.032, R * 0.38], [-R * 0.3, py + 0.042, R * 0.8], [-R * 0.34, py + 0.044, R * 1.6]];
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, "catmullrom", 0.1);
    const g = new THREE.TubeGeometry(curve, 24, R * 0.13, 8, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: TRICKLE_FRAG,
      uniforms: { uA: { value: hex(COLOR.amberTop) }, uHot: { value: hex(COLOR.amberHot) }, uS: { value: 0 } },
    });
    const me = new THREE.Mesh(g, mat);
    me.frustumCulled = false;
    me.renderOrder = 2;
    me.scale.setScalar(H);
    me.position.set(FIRST[0], 0, -FIRST[1]);
    return { me, mat };
  }, []);
  o.mat.uniforms.uS.value = S;
  return <primitive object={o.me} />;
};

const FOG: [number, number] = [1.5, 5.6];
const ScalableCostCompetitive: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 900;
  const cam = camAt(f);
  const fogUnits: [number, number] = [cam.d * 1.25, cam.d * 4.4];
  const items: FieldMachine[] = NEAR.map((m) => ({ at: m.at, rise: riseOf(m, f) }));
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={FOG}
      boardUnits={300}
      pool={{ x: 440, y: 680, strength: 1 }}
      world={
        <>
          <SoftShadows items={cashShadows(f)} />
          <FarField f={f} />
          <CentrifugeField items={items} S={S} />
          <Centrifuge at={FIRST} mode="cutaway" S={S} />
          <Trickle S={S} />
          <Pipes f={f} S={S} fog={fogUnits} />
          <StoutCash items={stackItems(f)} size={CASH} />
        </>
      }
    />
  );
};

export default ScalableCostCompetitive;
