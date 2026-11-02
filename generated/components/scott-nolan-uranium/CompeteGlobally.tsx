// ---------------------------------------------------------------------------
// CompeteGlobally (scott-nolan-uranium, cut 31). Cheeky Pint style (stout) in real 3D (nuclearWorld.tsx). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 168 frames.
//
// CHECK LINE: "Russia, Europe and China hold the world's enrichment capacity and the US owns almost none. It wants to rise to meet them."
//
// THE LINE: "We want to make it globally competitive. We want the U.S. capability to be truly commercial, be able to compete with Europe, Russia, China over time."
// WORD -> FRAME: globally 15 · competitive 23 · U.S. 48 · capability 53 · truly 70 · commercial 76 · compete 98 · with 105 · Europe 117 · Russia 127 · China 139 · over 150 · time 157
// DURATION: the slot 31.323 -> 38.330 s = 7.007 s x 23.976 = 168 frames (f0..f167).
//
// THE MOTION: one continuous camera over cut C's map. It opens tight and low on the thin amber film at the foot of a glass at
// Paducah, Kentucky, cranes up the whole empty height while arcing round it, then pulls back and trucks east over the bare
// Atlantic as the map grows out from under it (the land's plan zoom falls to the true map by f82), and as it glides three
// glasses come up out of slots in the land and fill to their real heights in one overlapping wave. On "over time" it pulls
// back until all four share the frame and amber climbs the US glass, still rising on the last frame, its goal unlabelled.
// AMBER = uranium fuel capacity, one job; glass = room to hold it; cream = land, the sea is the bare board.
//
// SOURCES: heights to scale from CAPACITY_MSWU in nuclearFacts.ts (WNA "Uranium Enrichment", 27 Oct 2026, citing Nuclear
// Fuel Report 2025): Russia 29.133, Europe 20.5, China 13.789 (China is WNA's assumption). No number on screen. The US film
// stands for US_OWNED_MSWU 0.04; to scale it is under a pixel, so it is drawn as a thin film (FILM), thicker still in the f0-60 close-up. The final climb is the
// speaker's ambition, not data. Sites: PADUCAH (nuclearFacts), Novouralsk, Lanzhou, and France/Germany for Europe's two
// groups: real places, one column per rival. Land: world-atlas countries-50m (Natural Earth), the tall Miller slab cut C uses (mapProjectTall).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { z } from "zod";
import { COLOR, FONT_LABEL } from "../kits/cheeky-pint/stoutShared";
import { CAPACITY_MSWU, PADUCAH } from "./nuclearFacts";
import { NuclearStage, SoftShadows, SHADOW_LEN, WorldSlab, mapProjectTall, nuclearMaterial, nuclearProject, nuclearTrack, slabTop, type NuclearCam, type ShadowItem } from "./nuclearWorld";

export const FPS = 24000 / 1001;
export const DURATION = 168;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// --- the columns: one glass for all four, so the levels compare. World units per million SWU/yr.
const UNIT = 20;
const GLASS_H = 650;
const R = 48;
const RUNG = 5 * UNIT;
const FILM = 3;
const BASE_Y = slabTop();
const PAD = mapProjectTall(PADUCAH.lon, PADUCAH.lat);
const EU = mapProjectTall(6, 47.5);
const RU = mapProjectTall(60.1, 57.3);
const CN = mapProjectTall(103.8, 36.1);
const H_EU = CAPACITY_MSWU.europe * UNIT;
const H_RU = CAPACITY_MSWU.russia * UNIT;
const H_CN = CAPACITY_MSWU.china * UNIT;

// --- the rival wave: glass out of its slot, amber overlapping it; each landing settles just before its word
const RIVALS = [
  { key: "eu", at: EU, h: H_EU, label: "EUROPE", glass: [80, 110], amber: [90, 116], lab: [106, 116] },
  { key: "ru", at: RU, h: H_RU, label: "RUSSIA", glass: [90, 120], amber: [100, 126], lab: [116, 126] },
  { key: "cn", at: CN, h: H_CN, label: "CHINA", glass: [102, 130], amber: [112, 138], lab: [128, 138] },
] as const;
const usLevel = (f: number) => {
  const e = smooth(140, 186, f);
  return FILM + (H_CN * 1.08 - FILM) * (1 - Math.pow(1 - e, 2.2));
};
const filmExtra = (f: number) => 7 * (1 - glide(14, 60, f));
const footH = (f: number) => 9 * (1 - glide(18, 60, f));
const FOOT_R = R * 1.12;
const glide = (a: number, b: number, f: number) => {
  const t = c01((f - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// --- the camera: the target sits on the land, so (cx, cy) says where that ground point lands on screen
const TRACK = nuclearTrack(
  { tx: PAD[0], ty: 0, tz: PAD[1], d: 1333, yaw: -22, pitch: 16, f: 1800, cy: 1050, cx: 520 },
  [
    { f0: -14, f1: 66, to: { yaw: 10, cx: 470 } },
    { f0: 40, f1: 122, to: { tx: -70, tz: (EU[1] + PAD[1]) / 2, pitch: 28, d: 1650, f: 2200, cy: 1030 } },
    { f0: 94, f1: 142, to: { tx: 135, tz: (RU[1] + CN[1]) / 2, d: 1600, cx: 480 } },
    { f0: 124, f1: 168, to: { tx: (PAD[0] + CN[0]) / 2 - 8, tz: (RU[1] + PAD[1]) / 2 - 8, yaw: -3, d: 3035, f: 3400, pitch: 28, cx: 540, cy: 970 } },
  ],
  DURATION,
);
// the opening: a crane up the empty glass, arcing round it, its own damped track. It hands over to TRACK on one quintic, f44-85:
// from f85 on the camera is exactly TRACK.
const OPEN = nuclearTrack(
  { tx: PAD[0], ty: 10, tz: PAD[1], d: 260, yaw: -25, pitch: 20, f: 1400, cy: 880, cx: 540 },
  [{ f0: -10, f1: 52, to: { ty: 300, d: 900, f: 1500, pitch: 22, yaw: 28, cy: 690, cx: 470 } }],
  DURATION,
);
const JOIN = [44, 85] as const;
const camAt = (f: number): NuclearCam => {
  const i = Math.max(0, Math.min(TRACK.length - 1, f));
  const w = glide(JOIN[0], JOIN[1], f);
  if (w >= 1) return TRACK[i];
  // close up we look at the film from nearly side on, so it reads as liquid in a tube; gone by f58, f60 on is untouched
  const a = { ...OPEN[i], pitch: OPEN[i].pitch - 13 * (1 - glide(22, 58, f)) } as Record<string, number>;
  const b = TRACK[i] as Record<string, number>;
  const o: Record<string, number> = {};
  for (const k of Object.keys(a)) o[k] = k === "d" || k === "f" ? Math.exp(Math.log(a[k]) * (1 - w) + Math.log(b[k]) * w) : a[k] * (1 - w) + b[k] * w;
  return o as NuclearCam;
};
// the land starts magnified in plan about Paducah, so a tight low shot has a big surface under it, and falls to the true map by f82
const landZoom = (f: number) => 1 + 3.6 * (1 - glide(0, 80, f)) + 2.4 * (1 - glide(0, 44, f));

// --- glass and amber: own shaders on the world's shared light and fog uniforms
const SHARED_GLSL = /* glsl */ `
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uCream;
uniform vec3 uBoardTone;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uL;
uniform float uF;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
`;
const VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
void main() {
  vL = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// a constant-width hairline in screen px at the silhouette: cream, backed by a warm line that holds it on the cream land
const GLASS_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uR;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float nv = abs(dot(n, V));
  float px = length(cameraPosition - vW) / uF;
  float wall = smoothstep(0.25, 0.6, 1.0 - abs(n.y));
  float edge = uR * (1.0 - sqrt(max(0.0, 1.0 - nv * nv))) / px;
  float hair = wall * (1.0 - smoothstep(1.3, 2.5, edge));
  float back = wall * (1.0 - smoothstep(2.5, 5.0, edge)) * (1.0 - hair);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), V));
  float s = dot(n, right);
  // the streak belongs to the wide shots: close up it would read as a beam of light
  float streak = wall * smoothstep(0.58, 0.68, -s) * (1.0 - smoothstep(0.76, 0.84, -s)) * (1.0 - smoothstep(1.8, 3.2, 1.0 / px));
  float rim = (1.0 - wall) * pow(1.0 - nv, 2.0);
  vec3 col = mix(uCream, uBoardTone * 0.72, back);
  float a = 0.03 + 0.1 * streak + 0.9 * hair + 0.42 * back + 0.22 * rim;
  float fg = fogAt(vW);
  gl_FragColor = vec4(mix(col, uFogCol, fg), a * (1.0 - fg));
}`;
const AMBER_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uH;
uniform float uBase;
uniform float uRung;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float px = length(cameraPosition - vW) / uF;
  float y = vW.y - uBase;
  float top = smoothstep(0.5, 0.95, n.y);
  float lit = smoothstep(-0.55, 0.95, dot(n, uL));
  float band = clamp(y / max(uH, 1.0), 0.0, 1.0);
  vec3 col = mix(uAmberFoot, uAmberTop, 0.3 + 0.7 * mix(lit, band, 0.35));
  // rungs: a hairline tick every unit up the lit side only, whole rings read as a stack of coins
  float dr = abs(y / uRung - floor(y / uRung + 0.5)) * uRung / px;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), V));
  float side = smoothstep(0.1, 0.2, -dot(n, right));
  float rung = (1.0 - smoothstep(0.8, 1.7, dr)) * step(uRung * 0.5, y) * (1.0 - smoothstep(uH - px * 10.0, uH - px * 5.0, y)) * (1.0 - top) * side;
  col = mix(col, uAmberFoot * 0.7, 0.6 * rung);
  // the hot top edge: the rim of the level, the surface a shade under it
  float hotWall = smoothstep(uH - px * 2.6, uH - px * 0.6, y) * (1.0 - top);
  col = mix(col, uAmberHot, hotWall);
  // close up the level shows its meniscus: a hot rim, no gradient across the surface (one reads as a yolk)
  float close = smoothstep(2.2, 4.0, 1.0 / px);
  float rr = length(vL.xz) / ${(R * 0.965).toFixed(3)};
  float hotTop = 0.45 + close * 0.5 * smoothstep(0.93, 0.995, rr);
  col = mix(col, mix(uAmberTop, uAmberHot, clamp(hotTop, 0.0, 1.0)), top);
  float fg = fogAt(vW);
  gl_FragColor = vec4(mix(col, uFogCol, fg), 1.0);
}`;
const glassGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const corner = 10;
    const pts: Any[] = [new THREE.Vector2(R, 0), new THREE.Vector2(R, GLASS_H - corner)];
    for (let i = 1; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(R - corner + corner * Math.cos(a), GLASS_H - corner + corner * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(0.001, GLASS_H));
    g = new THREE.LatheGeometry(pts, 96);
    return g;
  };
})();
const amberGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    g = new THREE.CylinderGeometry(R * 0.965, R * 0.965, 1, 96, 1, false);
    g.translate(0, 0.5, 0);
    return g;
  };
})();
const GlassAmberColumn: React.FC<{ at: [number, number]; rise: number; level: number; f: number; order: number; lift?: number }> = ({ at, rise, level, f, order, lift = 0 }) => {
  const o = useMemo(() => {
    const shared = nuclearMaterial("glass").uniforms;
    const glassU = { ...shared, uF: { value: 1 }, uR: { value: R } };
    const back = new THREE.Mesh(glassGeo(), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: glassU }));
    const front = new THREE.Mesh(glassGeo(), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.FrontSide, uniforms: glassU }));
    const amberMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: AMBER_FRAG, uniforms: { ...shared, uF: { value: 1 }, uH: { value: 1 }, uBase: { value: 0 }, uRung: { value: RUNG } } });
    const amber = new THREE.Mesh(amberGeo(), amberMat);
    for (const m of [back, front, amber]) m.frustumCulled = false;
    return { back, front, amber, glassU, amberMat };
  }, []);
  o.glassU.uF.value = f;
  o.amberMat.uniforms.uF.value = f;
  o.back.renderOrder = 3 + order;
  o.amber.renderOrder = 2;
  o.front.renderOrder = 12 + order;
  const sink = (1 - rise) * (GLASS_H + 8);
  o.back.position.set(at[0], BASE_Y + lift - sink, -at[1]);
  o.front.position.set(at[0], BASE_Y + lift - sink, -at[1]);
  const h = Math.max(0.01, level);
  o.amber.scale.set(1, h, 1);
  o.amber.position.set(at[0], BASE_Y + lift, -at[1]);
  o.amber.visible = level > 0.02;
  o.amberMat.uniforms.uH.value = h;
  o.amberMat.uniforms.uBase.value = BASE_Y + lift;
  return (
    <>
      <primitive object={o.back} />
      <primitive object={o.amber} />
      <primitive object={o.front} />
    </>
  );
};

const SLOT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform vec3 uC;
uniform float uA;
uniform float uIn;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uC, uA * (1.0 - smoothstep(uIn, 1.0, r)));
}`;
const SLOT_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
/** The dark slot under a glass: one soft disc on the land. */
const Slot: React.FC<{ at: [number, number]; rise: number; alpha?: number; soft?: number; radius?: number }> = ({ at, rise, alpha = 0.42, soft = 0.86, radius = R * 1.15 }) => {
  const m = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    const c = new THREE.Color().setRGB(0x22 / 255, 0x15 / 255, 0x0b / 255, THREE.LinearSRGBColorSpace);
    const me = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: SLOT_VERT, fragmentShader: SLOT_FRAG, transparent: true, depthWrite: false, uniforms: { uC: { value: new THREE.Vector3(c.r, c.g, c.b) }, uA: { value: 0.42 }, uIn: { value: 0.86 } } }));
    me.frustumCulled = false;
    me.renderOrder = 1;
    return me;
  }, []);
  const size = radius * 2 * smooth(0, 0.04, rise);
  m.material.uniforms.uA.value = alpha;
  m.material.uniforms.uIn.value = soft;
  m.scale.set(size, 1, size);
  m.position.set(at[0], BASE_Y + 0.5, -at[1]);
  return <primitive object={m} />;
};

const FOOT_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uH;
uniform float uBase;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float px = length(cameraPosition - vW) / uF;
  float side = 1.0 - smoothstep(0.4, 0.8, abs(n.y));
  float y = vW.y - uBase;
  float hairTop = side * (1.0 - smoothstep(1.2, 2.4, (uH - y) / px));
  float hairBot = side * (1.0 - smoothstep(1.0, 2.2, y / px));
  float nv = abs(dot(n, V));
  // thick glass on cream: a warm rim that holds on the land, a bright line just inside it, a milky body darker at its foot
  vec3 warm = uBoardTone * 0.62;
  float bright = side * (1.0 - smoothstep(2.4, 3.8, (uH - y) / px)) * (1.0 - hairTop);
  float t = clamp(y / uH, 0.0, 1.0);
  vec3 body = mix(warm, uCream, 0.45 + 0.55 * t);
  vec3 col = mix(body, uCream, bright);
  col = mix(col, warm, max(hairTop, hairBot));
  float a = side * (0.42 + 0.3 * pow(1.0 - nv, 1.5));
  a = max(a, max(hairTop * 0.95, hairBot * 0.8));
  a = max(a, bright * 0.9);
  a += (1.0 - side) * 0.16;
  gl_FragColor = vec4(mix(col, uCream, 1.0 - side), a);
}`;
/** The thick glass foot of the US tube, in close-ups only: a clear disc with a hairline rim, flattening away by f60. */
const GlassFoot: React.FC<{ at: [number, number]; h: number; f: number }> = ({ at, h, f }) => {
  const o = useMemo(() => {
    const g = new THREE.CylinderGeometry(FOOT_R, FOOT_R, 1, 96, 1, false);
    g.translate(0, 0.5, 0);
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FOOT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...nuclearMaterial("glass").uniforms, uF: { value: 1 }, uH: { value: 1 }, uBase: { value: 0 } } });
    const me = new THREE.Mesh(g, mat);
    me.frustumCulled = false;
    me.renderOrder = 11;
    return { me, mat };
  }, []);
  o.me.scale.set(1, h, 1);
  o.me.position.set(at[0], BASE_Y, -at[1]);
  o.mat.uniforms.uF.value = f;
  o.mat.uniforms.uH.value = h;
  o.mat.uniforms.uBase.value = BASE_Y;
  return <primitive object={o.me} />;
};

const columnShadows = (at: [number, number], rise: number, level: number): ShadowItem[] => {
  if (rise <= 0) return [];
  const out: ShadowItem[] = [];
  out.push({ x: at[0], z: at[1], len: GLASS_H * rise * SHADOW_LEN, r: R * 0.95, soft: R * 0.5, alpha: 0.26 * smooth(0, 0.05, rise) });
  // a film casts nothing: its alpha comes in with the level, and a shadow shorter than its penumbra would step at its root
  if (level > 0.02) out.push({ x: at[0], z: at[1], len: Math.max(level * SHADOW_LEN, 30), r: R * 0.92, soft: R * 0.45, alpha: 0.9 * smooth(0, 60, level) });
  return out;
};

// --- labels live in world space: a billboard pinned to the column, scaled by the camera
const LABEL_SIZE = 40;
const WorldLabel: React.FC<{ cam: NuclearCam; p: [number, number, number]; text: string; t: number; align?: "center" | "left"; scale?: number }> = ({ cam, p, text, t, align = "center", scale = 1 }) => {
  if (t <= 0) return null;
  const e = 1 - (1 - t) * (1 - t);
  const q = nuclearProject(cam, [p[0], p[1] - (1 - e) * 26, p[2]]);
  const size = LABEL_SIZE * scale * q.s;
  return (
    <div
      style={{
        position: "absolute",
        left: q.x,
        top: q.y,
        transform: `translate(${align === "center" ? "-50%" : "0"}, -50%)`,
        fontFamily: FONT_LABEL,
        fontSize: size,
        letterSpacing: "0.06em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: COLOR.cream,
        opacity: e,
        textShadow: `0 ${size * 0.03}px ${size * 0.22}px rgba(34,21,11,0.6)`,
      }}
    >
      {text}
    </div>
  );
};

const CompeteGlobally: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 600;
  const cam = camAt(f);
  const us = usLevel(f);
  const foot = footH(f);
  const state = RIVALS.map((r) => ({ ...r, rise: glide(r.glass[0], r.glass[1], f), level: r.h * glide(r.amber[0], r.amber[1], f) }));
  const shadows = [...columnShadows(PAD, 1, us), ...state.flatMap((r) => columnShadows(r.at as [number, number], r.rise, r.level * c01(r.rise * 4)))];
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={900}
      fog={[1.25, 1.6 + 0.5 * glide(50, 85, f)]}
      pool={{ x: 480, y: 700, strength: 0.9 }}
      world={
        <>
          <WorldSlab projection="tall" zoomAbout={{ x: PAD[0], z: PAD[1], m: landZoom(f) }} />
          <SoftShadows items={shadows} y={BASE_Y} />
          <Slot at={PAD} rise={1} alpha={0.42 - 0.3 * c01(foot / 3)} />
          {state.map((r) => (r.rise > 0 ? <Slot key={r.key} at={r.at as [number, number]} rise={r.rise} /> : null))}
          {foot > 0.01 ? <Slot at={PAD} rise={1} alpha={0.3 * c01(foot / 3)} soft={0.8} radius={FOOT_R * 1.2} /> : null}
          {foot > 0.01 ? <GlassFoot at={PAD} h={foot} f={cam.f} /> : null}
          <GlassAmberColumn at={PAD} rise={1} level={us + filmExtra(f)} f={cam.f} order={0} lift={foot} />
          {state.map((r, i) => (r.rise > 0 ? <GlassAmberColumn key={r.key} at={r.at as [number, number]} rise={r.rise} level={Math.min(r.level, r.rise * GLASS_H)} f={cam.f} order={i + 1} /> : null))}
        </>
      }
      overlay={
        <>
          <WorldLabel cam={cam} p={[PAD[0] + R + 14, 170, PAD[1]]} text="U.S." t={c01((f - 37) / 9)} align="left" scale={1.4 - 0.4 * glide(120, 150, f)} />
          {state.map((r) => (
            <WorldLabel key={r.key} cam={cam} p={[r.at[0], BASE_Y + r.h + 40, r.at[1]]} text={r.label} t={c01((f - r.lab[0]) / (r.lab[1] - r.lab[0]))} />
          ))}
        </>
      }
    />
  );
};

export default CompeteGlobally;
