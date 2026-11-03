// ---------------------------------------------------------------------------
// HaveToBeNuclear (scott-nolan-wind, cut 31). Cheeky Pint style (stout) in real 3D (energyWorld on nuclearWorld). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 129 frames.
//
// CHECK LINE: "so the data center plugs into nuclear, but nuclear power costs more than every other kind."
//
// THE LINE (lead-in on camera: "So if you think that those things matter and that baseload matters, then"):
//   "it will have to be nuclear. The one thing nuclear has not done a good job of, in beating everything else, is on cost."
// WORD -> FRAME (from composition start; f0-11 is a pause): it 11 · will 16 · have 19 · to 23 · be 25 · nuclear 28 · The 38 ·
//   one 40 · thing 43 · nuclear 47 · has 55 · not 59 · done 62 · a 66 · good 69 · job 72 · of 76 · in ~84 · beating 87 ·
//   everything 92 · else 100 · is 108 · on 113 · cost 116. Next line on camera from f129.
// DURATION: the slot 31.949 -> 37.329 s = 5.380 s x 24000/1001 = 129 frames (f0..f128).
//
// THE MOTION: f0 is cut A's resolved frame (CUT_A_END_CAM, CUT_A_PLUG_END, cut A's story clock), the plug hovering over the
// row. Through the pause it turns to face the socket and sets off on one smooth swoop (a spline at one eased speed on
// screen, peak 44 px/frame at f11-12, one lobe): down the left of the cooling tower, low along the plinth fronts, onto the
// socket's axis, and on "to be nuclear" pushes home. Amber current runs from the plug back along the cable to the data
// center, whose racks then light amber. From "The one thing" one camera glide lowers the eye from the high wide to the
// front of the lineup (the data center stays at the foot of the frame), while banknote bricks are dealt from above onto
// a pile on the board just behind each plinth, centred on its plant, so every plant stands in front of its own pile. Each
// brick falls down the screen column straight above its own pile. One rate for all: wind and solar stop first, then gas,
// then coal; nuclear's pile keeps climbing, well above its cooling tower, and lands tallest by "cost".
// Last landings: wind f68.5, solar f70.4, gas f77.2, coal f86.8, nuclear f114 (first landings from f50).
// Living hold: turbine, smoke, glint, the core, the last brick settling, a slow camera creep.
// CAUSE: prong tips touch the socket face at f26 (CONTACT_F; f25 is 22 units short), the face seats flush at f27 (SEAT_F);
// first reaction (current leaves the plug) f28; the current front reaches the hall at f40 and the racks light from f40.
// No pile grows except by a brick landing on it; each brick is in frame only as it falls in from above the frame top.
// AMBER = nuclear (the core, the current, the racks it powers). Money is stoutCash's real banknotes, never gold or amber.
//
// SOURCES: stack heights from energyFacts.ts LCOE_MID (Lazard LCOE+ July 2026, unsubsidized midpoints, $/MWh):
// nuclear 215, coal 125, gas 90, solar 69, wind 68. Linear: one brick (four bundles) = BRICK_USD = $18/MWh, rounded to
// whole bricks (nuclear 12, coal 7, gas 5, solar 4, wind 4; worst error wind 0.22 brick = $4/MWh).
// No numerals on screen unless showValues (then "$<LCOE_MID>" over each stack, in world space, once it is done).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearCamAt, nuclearEye, nuclearProject, nuclearTrack, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { BUNDLE_REAL, StoutCash, type BundleItem, type BundleSize } from "../scott-nolan-uranium/stoutCash";
import {
  CUT_A_DURATION,
  CUT_A_DRAPE,
  CUT_A_END_CAM,
  CUT_A_PLUG_END,
  CUT_A_S0,
  DataCenter,
  LINEUP,
  Lineup,
  PLANTS,
  PLINTH,
  PLUG,
  PowerCable,
  THREE,
  c01,
  cutAPlugAt,
  sharedUniforms,
  smooth,
  socketOf,
  type PlantKind,
  type V3,
} from "./energyWorld";
import { LCOE_MID } from "./energyFacts";

export const FPS = 24000 / 1001;
export const DURATION = 129;
export const schema = z.object({ showValues: z.boolean() });
export const defaultProps = schema.parse({ showValues: false });

/** swoop waypoints (world): down the left of the cooling tower, then low in front of the plinths; prongs square by PLUG_TURN_F */
const PLUG_WAYS: [V3, V3] = [[-250, 320, -400], [-110, 70, -310]];
const PLUG_TURN_F = 8;
/** story clock: cut A's clock carried on, so f0 is cut A's last frame */
const S0 = CUT_A_S0 + CUT_A_DURATION - 1;

// --- the camera: cut A's resolved wide, a slow creep while the plug seats, then one glide down to the front of the row ------
/** distances are set for f 2200 and scaled by cut A's focal length, so the framing holds if cut A changes lens */
const FK = CUT_A_END_CAM.f / 2200;
const END_CAM: Partial<NuclearCam> = { tx: 0, ty: 200, tz: -66, d: 2300 * FK, yaw: 0, pitch: 18, cy: 861 };
const TRACK = nuclearTrack(
  CUT_A_END_CAM,
  [
    { f0: -10, f1: 46, to: { d: CUT_A_END_CAM.d * 0.975 } },
    { f0: 30, f1: 118, to: END_CAM },
    // the hold's creep: a little closer and a little higher together, so the data center keeps clear of the lower caption band
    { f0: 104, f1: 220, to: { d: 2250 * FK, pitch: 18.8 } },
  ],
  DURATION,
);
export const camAt = (f: number): NuclearCam => nuclearCamAt(TRACK, f);

// --- the plug: hover (cut A's drift carried on), then ONE smooth swoop along a spline at an eased arc-length speed: down the
// left of the cooling tower (clear of it on screen), along in front of the plinth fronts, onto the socket's axis, push home.
const SOCK = socketOf("nuclear");
const TRAVEL_F0 = 0;
export const SEAT_F = 27;
/** prong tips touch the socket face when the plug's face is PLUG.PRONG short of it: CONTACT_F (see PRONG_TIP_Z) */
export const CONTACT_F = 26;
const hover = (f: number) => cutAPlugAt(CUT_A_DURATION - 1 + f);
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const P_START = hover(TRAVEL_F0).end;
const D_START = norm(hover(TRAVEL_F0).dir);
/** the swoop's spline: the last three points lie on the socket's axis, so the final run is straight along it */
const SWOOP_PTS: V3[] = [P_START, PLUG_WAYS[0], PLUG_WAYS[1], [SOCK.pos[0], SOCK.pos[1], SOCK.pos[2] - 92], [SOCK.pos[0], SOCK.pos[1], SOCK.pos[2] - 46], SOCK.pos];
const SWOOP = new THREE.CatmullRomCurve3(
  SWOOP_PTS.map((q) => new THREE.Vector3(q[0], q[1], q[2])),
  false,
  "centripetal",
);
SWOOP.arcLengthDivisions = 2000;
/** speed along the path: eases in from rest, peaks early, then slows steadily into the seat (a firm stop when flush) */
const SPEED_IN = 0.42;
const SPEED_POW = 0.38;
const speedShape = (t: number) => smooth(0, SPEED_IN, t) * Math.pow(Math.max(0, 1 - t), SPEED_POW);
const SPEED_CUM = (() => {
  const n = 4000;
  const a = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) a[i] = a[i - 1] + (speedShape((i - 0.5) / n) / n);
  for (let i = 0; i <= n; i++) a[i] /= a[n];
  return a;
})();
/** path fraction -> spline u, by a metric that is mostly SCREEN distance (the camera barely moves during the swoop), so the
 *  plug's speed on screen follows speedShape: the steep descent no longer races and the push along the axis no longer crawls */
const SCREEN_W = 0.75;
const SWOOP_MAP = (() => {
  const n = 1200;
  const c = nuclearCamAt(TRACK, 14);
  const us: number[] = [];
  const ms: number[] = [0];
  let prev = SWOOP.getPointAt(0);
  let prevS = nuclearProject(c, [prev.x, prev.y, prev.z]);
  us.push(0);
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const q = SWOOP.getPointAt(u);
    const qs = nuclearProject(c, [q.x, q.y, q.z]);
    const dw = q.distanceTo(prev) * qs.s;
    const dsc = Math.hypot(qs.x - prevS.x, qs.y - prevS.y);
    ms.push(ms[i - 1] + SCREEN_W * dsc + (1 - SCREEN_W) * dw);
    us.push(u);
    prev = q;
    prevS = qs;
  }
  return { us, ms: ms.map((m) => m / ms[n]) };
})();
const swoopU = (f: number) => {
  const t = c01((f - TRAVEL_F0) / (SEAT_F - TRAVEL_F0));
  const x = t * (SPEED_CUM.length - 1);
  const i = Math.min(SPEED_CUM.length - 2, Math.floor(x));
  const m = SPEED_CUM[i] + (SPEED_CUM[i + 1] - SPEED_CUM[i]) * (x - i);
  const { us, ms } = SWOOP_MAP;
  let lo = 0;
  let hi = ms.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ms[mid] <= m) lo = mid;
    else hi = mid;
  }
  const k = (m - ms[lo]) / Math.max(1e-9, ms[hi] - ms[lo]);
  return us[lo] + (us[hi] - us[lo]) * k;
};
const slerp = (a: V3, b: V3, t: number): V3 => {
  const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(d);
  if (om < 1e-4) return b;
  const s = Math.sin(om);
  const wa = Math.sin((1 - t) * om) / s;
  const wb = Math.sin(t * om) / s;
  return norm([a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb]);
};
/** the cable keeps cut A's drape throughout (it only shapes the hanging run, which shrinks to nothing as the plug seats) */
export const plugAt = (f: number): { end: V3; dir: V3; roll: number; drape: [number, number] } => {
  if (f <= TRAVEL_F0) return hover(f);
  const u = swoopU(f);
  // the plug turns to face the socket as it sets off (by time, so the turn leads the travel): its tail, and so the cable's
  // straight lead out of it, swings toward the camera before the plug moves far, and the cable never sweeps the tower
  const turn = smooth(TRAVEL_F0 + 1, PLUG_TURN_F, f);
  const dir = slerp(D_START, norm(SOCK.dir), turn);
  const q = SWOOP.getPointAt(u);
  return { end: [q.x, q.y, q.z], dir, roll: 90 * (1 - turn), drape: CUT_A_DRAPE };
};
/** current: 0 until the face seats, then the front runs at one speed from the plug to the hall (there by f40) */
const CURRENT_T = 13;
const currentAt = (f: number) => c01((f - SEAT_F) / CURRENT_T);
const litAt = (f: number) => c01((f - (SEAT_F + CURRENT_T)) / 14);



// joined cuts: f0 is cut A's last frame, camera and plug (CRAFT.md, Joined cuts)
{
  const p0 = plugAt(0);
  const c0 = camAt(0) as Record<string, number>;
  const ca = CUT_A_END_CAM as Record<string, number>;
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const ok = [0, 1, 2].every((i) => near(p0.end[i], CUT_A_PLUG_END.end[i]) && near(p0.dir[i], CUT_A_PLUG_END.dir[i])) && p0.roll === CUT_A_PLUG_END.roll && p0.drape === CUT_A_PLUG_END.drape && Object.keys(ca).every((k) => near(c0[k], ca[k]));
  if (!ok) throw new Error("HaveToBeNuclear: f0 no longer matches cut A's last frame");
}

// --- the cash: bricks of two real bundles, dealt from above onto each apron, one brick = BRICK_USD $/MWh ----------------
const CASH_L = 170;
const CASH: BundleSize = { L: CASH_L, W: (CASH_L * BUNDLE_REAL.W) / BUNDLE_REAL.L, H: (CASH_L * BUNDLE_REAL.H) / BUNDLE_REAL.L };
const BRICK_USD = 18;
const PER_BRICK = 4;
const BRICK_H = CASH.H * PER_BRICK;
export const BRICKS: Record<PlantKind, number> = {
  coal: Math.round(LCOE_MID.coal / BRICK_USD),
  gas: Math.round(LCOE_MID.gas / BRICK_USD),
  nuclear: Math.round(LCOE_MID.nuclear / BRICK_USD),
  wind: Math.round(LCOE_MID.wind / BRICK_USD),
  solar: Math.round(LCOE_MID.solar / BRICK_USD),
};
/** each pile stands on the board just behind its plinth's back edge, centred on the plant's X: the plant stays in front */
const STACK_GAP = 10;
const STACK_Z = PLINTH.D / 2 + CASH.W / 2 + STACK_GAP;
const STACK_BASE = 0;
const stackAt = (k: PlantKind): [number, number] => [LINEUP[k][0], LINEUP[k][1] + STACK_Z];
/** the deal: every stack gets a brick each DEAL_DT frames (one rate for all), each stack on its own phase */
const DEAL_F0 = 50;
const DEAL_LAST = 114;
const DEAL_DT = (DEAL_LAST - DEAL_F0) / (BRICKS.nuclear - 1);
const PHASE: Record<PlantKind, number> = { coal: 1.9, gas: 3.9, nuclear: 0, wind: 1.0, solar: 2.9 };
const landAt = (k: PlantKind, i: number) => DEAL_F0 + PHASE[k] + i * DEAL_DT;
/** falling: one speed (units per frame) from far above the frame, braking over the last BRAKE frames */
const V_FALL = 64;
const BRAKE = 2;
/** a brick waiting to fall waits here: always far above the frame top and always in front of the camera (a higher wait
 *  crosses the camera plane on the high opening camera) */
const FALL_CAP = 2400;
const SETTLE_DEG = 3.2;
const SETTLE_TAU = 3.2;
const fallOf = (s: number) => (s <= 0 ? 0 : s <= BRAKE ? (V_FALL * s * s) / (2 * BRAKE) : (V_FALL * BRAKE) / 2 + V_FALL * (s - BRAKE));
type Bundle = { k: PlantKind; i: number; b: number; x: number; z: number; h: number; s: number; spin: number };
const BUNDLES: Bundle[] = PLANTS.flatMap((k) =>
  Array.from({ length: BRICKS[k] * PER_BRICK }, (_, n) => {
    const i = Math.floor(n / PER_BRICK);
    const b = n % PER_BRICK;
    const sd = `htbn-${k}-${n}`;
    return {
      k,
      i,
      b,
      x: (random(`${sd}x`) - 0.5) * 2.2,
      z: (random(`${sd}z`) - 0.5) * 1.4,
      h: (random(`${sd}h`) - 0.5) * 2.4,
      s: random(`${sd}s`),
      spin: random(`htbs-${k}-${i}`) < 0.5 ? -1 : 1,
    };
  }),
);
/** a brick's lift above its resting height and its extra heading at frame f */
const brickState = (k: PlantKind, i: number, sign: number, f: number) => {
  const s = landAt(k, i) - f;
  if (s > 0) return { y: Math.min(FALL_CAP, fallOf(s)), dh: sign * (SETTLE_DEG + 1.6 * c01(s / 24)) };
  return { y: 0, dh: sign * SETTLE_DEG * Math.exp(s / SETTLE_TAU) };
};
/** a falling brick keeps to the screen column straight above its own pile: in flight its X is pulled toward the eye's X by
 *  the depth ratio (looking down, a true vertical fans outward toward the frame top); 1 at landing, so nothing jumps */
const columnX = (cam: NuclearCam, sx: number, sz: number, y: number, yLand: number) => {
  const ex = nuclearEye(cam)[0];
  const dy = nuclearProject(cam, [sx, y, sz]).d;
  const dl = nuclearProject(cam, [sx, yLand, sz]).d;
  return ex + (sx - ex) * (dy / dl);
};
const cashItems = (f: number, cam: NuclearCam): BundleItem[] =>
  BUNDLES.map((u) => {
    const [sx, sz] = stackAt(u.k);
    const st = brickState(u.k, u.i, u.spin, f);
    const y0 = STACK_BASE + u.i * BRICK_H + u.b * CASH.H;
    const y = y0 + st.y;
    const x = st.y > 0 ? columnX(cam, sx, sz, y, y0) : sx;
    return { at: [x + u.x, y, sz + u.z] as V3, heading: u.h + st.dh, seed: u.s };
  });
/** landed bricks (with the one braking counted by how far it has come down) */
const landedOf = (k: PlantKind, f: number) => {
  let n = 0;
  for (let i = 0; i < BRICKS[k]; i++) if (f >= landAt(k, i)) n++;
  return n;
};
const stackTopOf = (k: PlantKind, f: number) => STACK_BASE + landedOf(k, f) * BRICK_H;

// --- shadows. Each pile's one soft shadow is on the board (with the lineup's in one SoftShadows layer, so they never double);
// an in-coming brick's shadow lands first on the board, then on its pile's top (a decal on the clay's own contact-shadow
// formula, energyCore's capsule, clipped to the top face).
type Cap = { x: number; z: number; len: number; r: number; a: number };
const discsOf = (k: PlantKind, len: number, a: number, lift = 0): Cap[] => {
  const [sx, sz] = stackAt(k);
  const r = CASH.W * 0.48;
  const n = 4;
  const out: Cap[] = [];
  for (let j = 0; j < n; j++) {
    const x = sx - CASH.L / 2 + r + (j * (CASH.L - 2 * r)) / (n - 1);
    out.push({ x: x + SHADOW_DIR[0] * lift * SHADOW_LEN, z: sz + SHADOW_DIR[1] * lift * SHADOW_LEN, len, r, a });
  }
  return out;
};
/** the in-coming brick's shadow on whatever it is about to land on: grows in and sharpens over its last LAND_SHADOW units */
const LAND_SHADOW = 160;
const landingCaps = (k: PlantKind, f: number): { caps: Cap[]; onBoard: boolean } => {
  const n = landedOf(k, f);
  if (n >= BRICKS[k]) return { caps: [], onBoard: false };
  const s = landAt(k, n) - f;
  const dy = fallOf(s);
  const a = 1 - smooth(0, LAND_SHADOW, dy);
  if (a <= 0) return { caps: [], onBoard: n === 0 };
  return { caps: discsOf(k, BRICK_H * SHADOW_LEN, a, dy), onBoard: n === 0 };
};
const MAX_CAPS = 16;
const DECAL_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const DECAL_FRAG = /* glsl */ `
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uShadowCol;
uniform vec2 uShDir;
uniform vec4 uCap[${MAX_CAPS}];
uniform float uCapA[${MAX_CAPS}];
uniform float uN;
uniform vec4 uClip;
varying vec3 vW;
float capsule(vec2 p, vec4 o) {
  vec2 d = uShDir; vec2 s = vec2(-d.y, d.x);
  vec2 r = p - o.xy;
  vec2 q = vec2(dot(r, d), dot(r, s));
  float t = clamp(q.x / max(o.z, 0.0001), 0.0, 1.0);
  float soft = o.w * 0.6 * (0.35 + 3.0 * t);
  float rad = o.w * (1.0 + 0.25 * t);
  vec2 c = vec2(q.x - clamp(q.x, 0.0, o.z), q.y);
  float a = 1.0 - smoothstep(rad - soft, rad + soft, length(c));
  return a * mix(1.0, 0.55, t);
}
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  if (p.x < uClip.x || p.x > uClip.y || p.y < uClip.z || p.y > uClip.w) discard;
  float a = 0.0;
  for (int i = 0; i < ${MAX_CAPS}; i++) {
    if (float(i) < uN) a = max(a, capsule(p, uCap[i]) * uCapA[i]);
  }
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(uShadowCol, 0.46 * 0.85 * a * (1.0 - fg));
}`;
type Surface = { clip: [number, number, number, number]; y: number; caps: Cap[] };
const ShadowDecals: React.FC<{ surfaces: Surface[] }> = ({ surfaces }) => {
  const n = surfaces.length;
  const o = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.PlaneGeometry(1, 1);
      g.rotateX(-Math.PI / 2);
      const u = sharedUniforms();
      const mat = new THREE.ShaderMaterial({
        vertexShader: DECAL_VERT,
        fragmentShader: DECAL_FRAG,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -4,
        uniforms: {
          uFogRange: u.uFogRange,
          uFogCol: u.uFogCol,
          uShadowCol: { value: new THREE.Vector3(0x22 / 255, 0x15 / 255, 0x0b / 255) },
          uShDir: { value: new THREE.Vector2(SHADOW_DIR[0], SHADOW_DIR[1]) },
          uCap: { value: Array.from({ length: MAX_CAPS }, () => new THREE.Vector4()) },
          uCapA: { value: new Array(MAX_CAPS).fill(0) },
          uN: { value: 0 },
          uClip: { value: new THREE.Vector4() },
        },
      });
      const me = new THREE.Mesh(g, mat);
      me.frustumCulled = false;
      me.renderOrder = 6;
      out.push({ me, mat });
    }
    return out;
  }, [n]);
  surfaces.forEach((s, i) => {
    const { me, mat } = o[i];
    const [x0, x1, z0, z1] = s.clip;
    me.position.set((x0 + x1) / 2, s.y, -(z0 + z1) / 2);
    me.scale.set(x1 - x0, 1, z1 - z0);
    mat.uniforms.uClip.value.set(x0, x1, z0, z1);
    const caps = s.caps.slice(0, MAX_CAPS);
    caps.forEach((c, j) => {
      mat.uniforms.uCap.value[j].set(c.x, c.z, c.len, c.r);
      mat.uniforms.uCapA.value[j] = c.a;
    });
    mat.uniforms.uN.value = caps.length;
    me.visible = caps.length > 0;
  });
  return (
    <>
      {o.map((x, i) => (
        <primitive key={i} object={x.me} />
      ))}
    </>
  );
};
const stackClip = (k: PlantKind): [number, number, number, number] => {
  const [sx, sz] = stackAt(k);
  // inset past the top bundle's heading jitter and settle, so no shadow ever overhangs its edge
  return [sx - CASH.L / 2 + 4, sx + CASH.L / 2 - 4, sz - CASH.W / 2 + 4, sz + CASH.W / 2 - 4];
};
const surfacesAt = (f: number): Surface[] =>
  PLANTS.map((k) => {
    const land = landingCaps(k, f);
    return { clip: stackClip(k), y: stackTopOf(k, f) + 0.12, caps: land.onBoard ? [] : land.caps };
  });
const boardShadows = (f: number): ShadowItem[] =>
  PLANTS.flatMap((k) => {
    const h = stackTopOf(k, f) - STACK_BASE;
    const own = h > 0 ? discsOf(k, h * SHADOW_LEN, 1) : [];
    const land = landingCaps(k, f);
    const first = land.onBoard ? land.caps : [];
    return [...own, ...first].map((c) => ({ x: c.x, z: c.z, len: c.len, r: c.r, soft: 8, alpha: 0.9 * c.a }));
  });

// --- showValues: "$<mid>" over each stack in world space, in once its stack is done -----------------------------------
const ValueLabel: React.FC<{ cam: NuclearCam; k: PlantKind; f: number }> = ({ cam, k, f }) => {
  const done = landAt(k, BRICKS[k] - 1);
  const t = c01((f - done - 2) / 10);
  if (t <= 0) return null;
  const e = 1 - (1 - t) * (1 - t);
  const [sx, sz] = stackAt(k);
  const q = nuclearProject(cam, [sx, stackTopOf(k, f) + 34 - (1 - e) * 22, sz]);
  const size = 54 * q.s;
  return (
    <div
      style={{
        position: "absolute",
        left: q.x,
        top: q.y,
        transform: "translate(-50%, -50%)",
        fontFamily: FONT_NUM,
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        color: COLOR.inkCream,
        opacity: e,
        filter: `blur(${(1 - e) * 4}px)`,
      }}
    >
      ${LCOE_MID[k]}
    </div>
  );
};

const POOL0 = { x: 520, y: 860 };
const POOL1 = { x: 540, y: 700 };
const HaveToBeNuclear: React.FC<z.infer<typeof schema>> = ({ showValues }) => {
  const f = useCurrentFrame();
  const S = S0 + f;
  const cam = camAt(f);
  const plug = plugAt(f);
  const pm = smooth(30, 118, f);
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={1000}
      pool={{ x: POOL0.x + (POOL1.x - POOL0.x) * pm, y: POOL0.y + (POOL1.y - POOL0.y) * pm, strength: 0.95 }}
      world={
        <>
          <SoftShadows items={boardShadows(f)} />
          <Lineup S={S} />
          <DataCenter S={S} lit={litAt(f)} />
          <PowerCable end={plug.end} dir={plug.dir} roll={plug.roll} drape={plug.drape} current={currentAt(f)} />
          <StoutCash items={cashItems(f, cam)} size={CASH} />
          <ShadowDecals surfaces={surfacesAt(f)} />
        </>
      }
      overlay={showValues ? <>{PLANTS.map((k) => <ValueLabel key={k} cam={cam} k={k} f={f} />)}</> : null}
    />
  );
};

export default HaveToBeNuclear;
/** the prong tips' Z (the socket face is at socketOf("nuclear").pos Z): the contact frame is where it first reaches it */
export const PRONG_TIP_Z = (f: number) => plugAt(f).end[2] + PLUG.PRONG;
