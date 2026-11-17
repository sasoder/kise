// ---------------------------------------------------------------------------
// hfWorld — THE SHARED WORLD of paul-hugging-face (look C "Graphite air", approved Nov 17), promoted from the hero
// round (heroC/graphiteLook.tsx, kept untouched as the record). The air medium (kits/dwarkesh-3d AirStage: shafts from
// the upper left, motes, film grade, grain, vignette) recoloured to a warm GRAPHITE; the faint Dwarkesh grid on the
// floor melting into the haze; matte clay volumes with cream rims; orange (#FFB000) the one glowing material.
// The objects (task block, padlock, HF box, card, thread, grader, racks, badge, robots, crowd) are in hfProps.tsx.
// Full API, units and rules: <clip>/animation_source/notes/HF_WORLD_READY.md.
//
// Units: METRES, a true pinhole camera (yaw + pitch), x right, y UP, z away from the camera at yaw 0.
// MOTION: const W = worldAt(KEYS, frame)  (KEYS: CamKey[]; every channel pchip-eased, no steps, seek-safe).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import { AirStage, MOODS, c01, pchip, formTone, hexRgb, lerp, mixHex, mixRgb, rgbHex, type AirPalette, type AirView, type Mat, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";
import { HUGGINGFACE } from "../kits/dwarkesh/brandGlyphs";
import { Bot, type BotPose } from "../rsi-ten-earths/tenEarthsBot";

const RC = loadFont("normal", { weights: ["700", "500"], subsets: ["latin"] });
export const FONT = RC.fontFamily;

export const W_PX = 1080;
export const H_PX = 1920;
/** REV2 (Nov 17): every cut's picture sits this many px lower than its camera keys say (added to sy in makeWorld) */
export const SCREEN_DY = 190;
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const ORANGE_LINE = "#8A4A0E";

// ===================================================================================================================
// THE PALETTE
// ===================================================================================================================
export const GRAPHITE: AirPalette = {
  label: "C graphite-air",
  ramp: [
    [0, "#DAD5CC"],
    [0.03, "#C7C2B9"],
    [0.077, "#AEA9A1"],
    [0.138, "#97928B"],
    [0.215, "#827E78"],
    [0.308, "#716D68"],
    [0.423, "#625F5A"],
    [0.554, "#55524E"],
    [0.708, "#4A4744"],
    [1, "#403D3A"],
  ],
  eyeT: 0.1,
  cream: "#F4EEE3",
  creamLo: "#DCD4C6",
  shadow: "#221F1C",
  line: "#2C2926",
  vignette: "30,27,24",
  grade: { top: "rgba(244,236,222,0.5)", mid: "rgba(140,132,122,0.14)", bottom: "rgba(52,46,40,0.5)" },
  orange: ACCENT,
  orangeDeep: ACCENT_DEEP,
  orangeHot: "#FFE7A8",
  ground: { lit: "#8C8881", mid: "#7A766F", dark: "#55514C" },
  stone: { lit: "#A39E96", mid: "#85807A", dark: "#4E4A46" },
  body: { lit: "#F0EBE2", mid: "#D7D1C6", dark: "#8F897F" },
};
/** clay materials (local colours before fog) */
export const MATS = {
  clay: { lit: "#F3EEE6", mid: "#D6D0C5", dark: "#ACA59A" },
  clayWarm: { lit: "#EAE3D7", mid: "#CBC3B6", dark: "#A0988B" },
  greige: { lit: "#ADA79E", mid: "#8E8981", dark: "#57534E" },
  graphite: { lit: "#77736D", mid: "#5E5B56", dark: "#3A3734" },
  slate: { lit: "#666360", mid: "#4D4A47", dark: "#2E2C2A" },
  orange: { lit: "#FFC233", mid: "#FFB000", dark: "#C27406" },
} satisfies Record<string, Mat>;

const rampAt = (t: number): RGB => {
  const R = GRAPHITE.ramp;
  if (t <= R[0][0]) return hexRgb(R[0][1]);
  for (let i = 1; i < R.length; i++) if (t <= R[i][0]) return mixRgb(hexRgb(R[i - 1][1]), hexRgb(R[i][1]), (t - R[i - 1][0]) / (R[i][0] - R[i - 1][0]));
  return hexRgb(R[R.length - 1][1]);
};

// ===================================================================================================================
// VECTORS AND THE CAMERA
// ===================================================================================================================
export type V3 = [number, number, number];
export type P2 = [number, number];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => mul(a, 1 / Math.max(1e-9, len(a)));
export const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const Pt = (p: P2) => `${n2(p[0])},${n2(p[1])}`;
export const polyD = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
export const lineD = (q: P2[]) => `M${q.map(Pt).join("L")}`;
export const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

export type World = {
  pos: V3;
  f: V3;
  r: V3;
  u: V3;
  F: number;
  cx: number;
  cy: number;
  horizon: number;
  frame: number;
  /** toward the key light (upper left, a little in front) */
  L: V3;
  /** the shadow's direction along the floor (away from the light) */
  shadowDir: V3;
  v: AirView;
  depth: (p: V3) => number;
  project: (p: V3) => P2;
  /** screen px per metre at p */
  scaleAt: (p: V3) => number;
  fog: (p: V3) => number;
  airHex: (p: V3) => string;
  tone: (hex: string, p: V3) => string;
  toneO: (hex: string, p: V3) => string;
  screenAir: (sy: number) => string;
};

export type WorldOpts = {
  target: V3;
  dist: number;
  yaw: number;
  pitch: number;
  F: number;
  /** the target's screen row (before SCREEN_DY) */
  sy?: number;
  /** override the shared screen-space offset (default SCREEN_DY) */
  dy?: number;
  sx?: number;
  frame?: number;
  fog?: { near?: number; vis?: number; max?: number };
  sun?: number;
  /** the camera at the cut's start (worldAt fills it): motes and shafts drift with the camera's travel from it */
  rest?: { pos: V3; yaw: number };
};
export const makeWorld = (o: WorldOpts): World => {
  const { yaw, pitch, F } = o;
  const f: V3 = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const r: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const u: V3 = cross(f, r).map((x) => -x) as V3;
  const uu: V3 = dot(u, [0, 1, 0]) < 0 ? mul(u, -1) : u;
  const pos = sub(o.target, mul(f, o.dist));
  const cx = o.sx ?? 540;
  // REV2: the whole composed picture sits SCREEN_DY lower (a principal-point shift: subjects, shadows, light, grid and
  // horizon move down together; AirStage's sky is painted from airAtScreen over the full frame, so the top fills)
  const cy = (o.sy ?? 700) + (o.dy ?? SCREEN_DY);
  const horizon = cy - F * Math.tan(pitch);
  const fh = norm([f[0], 0, f[2]]);
  const L = norm(add(add(mul(r, -0.7), [0, 0.8, 0]), mul(fh, -0.16)));
  const shadowDir = norm([-L[0], 0, -L[2]]);
  const frame = o.frame ?? 0;
  const fogNear = o.fog?.near ?? 6;
  const fogVis = o.fog?.vis ?? 18;
  const fogMax = o.fog?.max ?? 0.88;
  const mood = { ...MOODS.day, sun: { ...MOODS.day.sun, a: o.sun ?? 0.3 } };
  // the camera's travel since the cut's start, camera-local metres (+ a yaw term so a pan slides the near motes)
  const dp = o.rest ? sub(pos, o.rest.pos) : ([0, 0, 0] as V3);
  const travel = { x: dot(dp, r) + (o.rest ? (yaw - o.rest.yaw) * 10 : 0), y: dp[1], z: dot(dp, norm([f[0], 0, f[2]])) };
  const eyeT = GRAPHITE.eyeT;
  const airAtScreen = (sy: number) => rampAt(eyeT + (mood.gain * (sy - horizon)) / 1250);
  const fogAtD = (d: number) => fogMax * (1 - Math.exp(-Math.max(0, d - fogNear) / fogVis));
  const hLow = 0;
  const hHigh = 5;
  const airAtD = (d: number, h = 0) => {
    const hn = c01((h - hLow) / (hHigh - hLow));
    const tH = lerp(eyeT + 0.22, eyeT - 0.18, hn);
    const w = 1 - Math.exp(-Math.max(0, d) / (2.5 * fogVis + fogNear));
    return rampAt(lerp(tH, eyeT, w));
  };
  const v: AirView = {
    scene: { look: "A", mood: "day", F, fogNear, fogVis, fogMax, hLow, hHigh, moteUnit: 1 },
    pal: GRAPHITE,
    mood,
    frame,
    horizon,
    eyeT,
    travel,
    airAtScreen,
    airAt: airAtD,
    fogAt: fogAtD,
  };
  const depth = (p: V3) => dot(sub(p, pos), f);
  const project = (p: V3): P2 => {
    const d = sub(p, pos);
    const z = Math.max(0.05, dot(d, f));
    return [cx + (F * dot(d, r)) / z, cy - (F * dot(d, uu)) / z];
  };
  const scaleAt = (p: V3) => F / Math.max(0.05, depth(p));
  const distOf = (p: V3) => len(sub(p, pos));
  const fog = (p: V3) => c01(fogAtD(distOf(p)));
  const airHex = (p: V3) => rgbHex(airAtD(distOf(p), p[1]));
  const tone = (hex: string, p: V3) => rgbHex(mixRgb(hexRgb(hex), airAtD(distOf(p), p[1]), fog(p)));
  const toneO = (hex: string, p: V3) => rgbHex(mixRgb(hexRgb(hex), airAtD(distOf(p), p[1]), 0.5 * fog(p)));
  return { pos, f, r, u: uu, F, cx, cy, horizon, frame, L, shadowDir, v, depth, project, scaleAt, fog, airHex, tone, toneO, screenAir: (sy) => rgbHex(airAtScreen(sy)) };
};

/** clip a 3D polygon to depth >= near (Sutherland-Hodgman on the camera's near plane) */
export const clipNear = (W: World, poly: V3[], near = 0.4): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = W.depth(a) - near;
    const db = W.depth(b) - near;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) out.push(add(a, mul(sub(b, a), da / (da - db))));
  }
  return out;
};
/** a 3D segment clipped to depth >= near, projected (null when wholly behind) */
export const segNear = (W: World, a: V3, b: V3, near = 0.4): [P2, P2] | null => {
  const da = W.depth(a) - near;
  const db = W.depth(b) - near;
  if (da < 0 && db < 0) return null;
  let A = a;
  let B = b;
  if (da < 0) A = add(a, mul(sub(b, a), da / (da - db)));
  if (db < 0) B = add(a, mul(sub(b, a), da / (da - db)));
  return [W.project(A), W.project(B)];
};

// ===================================================================================================================
// LAYERS
// ===================================================================================================================
/** a full-frame SVG layer in screen px; glow = the faint orange-only bloom (per layer: white and HF yellow stay
 *  unbloomed, only orange glows). id is optional (a stable one is made with useId). */
export const Svg: React.FC<{ glow?: number; id?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ glow = 0, id, style, children }) => {
  const auto = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fid = `gl_${id ?? auto}`;
  return (
    <svg width={W_PX} height={H_PX} viewBox={`0 0 ${W_PX} ${H_PX}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
      {glow > 0 ? (
        <defs>
          <filter id={fid} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W_PX + 400} height={H_PX + 400} colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0.8 0 0 0  0 0 0.3 0 0  1.25 0 -1.7 0 -0.3" result="o" />
            <feComposite in="o" in2="SourceAlpha" operator="in" result="oa" />
            <feGaussianBlur in="oa" stdDeviation="10" result="b1" />
            <feGaussianBlur in="oa" stdDeviation="36" result="b2" />
            <feComponentTransfer in="b1" result="b1a">
              <feFuncA type="linear" slope={0.75 * glow} />
            </feComponentTransfer>
            <feComponentTransfer in="b2" result="b2a">
              <feFuncA type="linear" slope={0.5 * glow} />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="b2a" />
              <feMergeNode in="b1a" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}
      <g filter={glow > 0 ? `url(#${fid})` : undefined}>{children}</g>
    </svg>
  );
};

// ===================================================================================================================
// OUTLINES
// ===================================================================================================================
/** a rounded rectangle, CCW (x right, y up), centred */
export const rrect = (w: number, h: number, r: number, seg = 7, cx = 0, cy = 0): P2[] => {
  const rr = Math.min(r, w / 2, h / 2);
  const out: P2[] = [];
  const cs: [number, number, number][] = [
    [w / 2 - rr, -h / 2 + rr, -90],
    [w / 2 - rr, h / 2 - rr, 0],
    [-w / 2 + rr, h / 2 - rr, 90],
    [-w / 2 + rr, -h / 2 + rr, 180],
  ];
  for (const [x, y, a0] of cs)
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 + (90 * i) / seg) * Math.PI) / 180;
      out.push([cx + x + rr * Math.cos(a), cy + y + rr * Math.sin(a)]);
    }
  return out;
};
export const circleOutline = (rad: number, seg = 28): P2[] => Array.from({ length: seg }, (_, i) => [rad * Math.cos((i / seg) * 2 * Math.PI), rad * Math.sin((i / seg) * 2 * Math.PI)] as P2);

// ===================================================================================================================
// THE PRISM (a convex outline extruded: rounded boxes, slabs, plates, pucks)
// ===================================================================================================================
export type PrismProps = {
  W: World;
  outline: P2[];
  /** the outline's plane: o + u * x + v * y (u, v unit vectors) */
  o: V3;
  u: V3;
  v: V3;
  /** the extrusion direction (unit) and length */
  n: V3;
  depth: number;
  mat: Mat;
  /** the two caps' material (default mat) */
  capMat?: Mat;
  uid: string;
  orange?: boolean;
  rim?: number;
  /** occlusion toward the floor on the faces (0..1) */
  ao?: number;
  /** the floor y the occlusion runs to (default 0) */
  aoFloor?: number;
  /** a faint outline in a darker local colour */
  line?: number;
  /** the light's strength on the faces (soft form light) */
  sink?: number;
  /** a soft form-light sheen across the caps (upper left light -> lower right shade) */
  sheen?: number;
  /** lit-emissive: a glowing orange surface (bright, little shade) */
  emissive?: number;
};
type Face = { q: P2[]; fill: string; mid: V3; key: string; cap?: boolean; capNormal?: V3; edges?: { a: P2; b: P2; s: number }[] };
export const prismFaces = (p: PrismProps) => {
  const { W, outline, o, u, v, n, depth, mat } = p;
  const cm = p.capMat ?? mat;
  const P0 = outline.map(([x, y]) => add(o, add(mul(u, x), mul(v, y))));
  const P1 = P0.map((q) => add(q, mul(n, depth)));
  const cen0 = mul(P0.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / P0.length);
  const N = P0.length;
  const sideN: V3[] = [];
  const sideVis: boolean[] = [];
  const faces: Face[] = [];
  const shadeOf = (m: Mat, nn: V3) => {
    const ndl = dot(nn, W.L);
    if (p.emissive) return mixHex(formTone(m, ndl, GRAPHITE.shadow, 0.1), m.lit, p.emissive * 0.5);
    return formTone(m, ndl, GRAPHITE.shadow, p.sink ?? 0.16);
  };
  const tn = (hex: string, at: V3) => (p.orange ? W.toneO(hex, at) : W.tone(hex, at));
  for (let i = 0; i < N; i++) {
    const a = P0[i];
    const b = P0[(i + 1) % N];
    let nn = norm(cross(sub(b, a), n));
    const mid = mul(add(add(a, b), mul(n, depth)), 0.5);
    if (dot(nn, sub(mul(add(a, b), 0.5), cen0)) < 0) nn = mul(nn, -1);
    sideN.push(nn);
    const vis = dot(nn, sub(W.pos, mid)) > 0;
    sideVis.push(vis);
    if (!vis) continue;
    const q = [a, b, P1[(i + 1) % N], P1[i]].map(W.project);
    faces.push({ q, fill: tn(shadeOf(mat, nn), mid), mid, key: `s${i}` });
  }
  const caps: { pts: V3[]; nn: V3 }[] = [
    { pts: P0, nn: mul(n, -1) },
    { pts: P1, nn: n },
  ];
  caps.forEach((c, ci) => {
    const cc = mul(c.pts.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / N);
    if (dot(c.nn, sub(W.pos, cc)) <= 0) return;
    const q = c.pts.map(W.project);
    const edges = c.pts.map((a, i) => {
      const s = sst(0.05, 0.7, dot(sideN[i], W.L));
      return { a: q[i], b: q[(i + 1) % N], s };
    });
    faces.push({ q, fill: tn(shadeOf(cm, c.nn), cc), mid: cc, key: `c${ci}`, cap: true, capNormal: c.nn, edges });
  });
  return { faces, P0, P1, cen: cen0 };
};
export const Prism: React.FC<PrismProps> = (p) => {
  const { W, uid } = p;
  const { faces, P0, P1 } = prismFaces(p);
  const all = [...P0, ...P1];
  const ys = all.map((q) => W.project(q)[1]);
  const fl = p.aoFloor ?? 0;
  const top = Math.min(...ys);
  const cen = mul(all.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / all.length);
  const bot = W.project([cen[0], fl, cen[2]])[1];
  const yb = Math.max(...ys);
  const fz = W.fog(cen);
  const k = W.scaleAt(cen);
  const rimW = 0.011 * k;
  const ao = (p.ao ?? 1) * (1 - fz);
  const lineC = W.tone(mixHex(p.mat.dark, GRAPHITE.shadow, 0.35), cen);
  const sideFaces = faces.filter((f) => !(f.cap && f.capNormal && f.capNormal[1] > 0.7));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(top)} x2="0" y2={n2(Math.max(yb, bot))}>
          <stop offset="0" stopColor={GRAPHITE.cream} stopOpacity={0.07 * ao} />
          <stop offset="0.45" stopColor={GRAPHITE.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={GRAPHITE.shadow} stopOpacity={0.3 * ao} />
        </linearGradient>
      </defs>
      {faces.map((f) => (
        <path key={f.key} d={polyD(f.q)} fill={f.fill} stroke={f.fill} strokeWidth={0.9} strokeLinejoin="round" />
      ))}
      {(p.sheen ?? 1) > 0 && !p.emissive
        ? faces
            .filter((f) => f.cap)
            .map((f) => {
              const xs = f.q.map((q) => q[0]);
              const ys2 = f.q.map((q) => q[1]);
              const gx0 = Math.min(...xs);
              const gy0 = Math.min(...ys2);
              const gx1 = Math.max(...xs);
              const gy1 = Math.max(...ys2);
              return (
                <g key={`sh${f.key}`}>
                  <defs>
                    <linearGradient id={`${uid}sh${f.key}`} gradientUnits="userSpaceOnUse" x1={n2(gx0)} y1={n2(gy0)} x2={n2(gx1)} y2={n2(gy1)}>
                      <stop offset="0" stopColor={GRAPHITE.cream} stopOpacity={0.16 * (p.sheen ?? 1) * (1 - fz)} />
                      <stop offset="0.55" stopColor={GRAPHITE.cream} stopOpacity={0} />
                      <stop offset="1" stopColor={GRAPHITE.shadow} stopOpacity={0.1 * (p.sheen ?? 1) * (1 - fz)} />
                    </linearGradient>
                  </defs>
                  <path d={polyD(f.q)} fill={`url(#${uid}sh${f.key})`} />
                </g>
              );
            })
        : null}
      {ao > 0.01 && !p.emissive
        ? <path d={sideFaces.map((f) => polyD(f.q)).join("")} fill={`url(#${uid}ao)`} fillRule="nonzero" />
        : null}
      {p.line ? (
        <g>
          {faces.map((f) => (
            <path key={`ln${f.key}`} d={polyD(f.q)} fill="none" stroke={lineC} strokeOpacity={p.line} strokeWidth={Math.max(0.6, 0.004 * k)} strokeLinejoin="round" />
          ))}
        </g>
      ) : null}
      {(p.rim ?? 1) > 0
        ? faces
            .filter((f) => f.cap)
            .map((f) => (
              <g key={`r${f.key}`}>
                {(f.edges ?? []).map((e, i) =>
                  e.s > 0.02 ? <path key={i} d={`M${Pt(e.a)}L${Pt(e.b)}`} stroke={GRAPHITE.cream} strokeOpacity={0.78 * e.s * (p.rim ?? 1) * (1 - fz)} strokeWidth={rimW} strokeLinecap="round" fill="none" /> : null,
                )}
              </g>
            ))
        : null}
    </g>
  );
};

/** an upright slab: front face rounded rect w x h in the plane through `front` (its bottom centre on the floor),
 *  turned by yaw (radians, + = its right side away), depth t backward */
export const slabFrame = (front: V3, yaw: number, lift = 0) => {
  const u: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const n: V3 = [-Math.sin(yaw), 0, Math.cos(yaw)];
  return { u, v: [0, 1, 0] as V3, n, o: add(front, [0, lift, 0]) };
};

// ===================================================================================================================
// SHADOWS
// ===================================================================================================================
export const FloorShadow: React.FC<{ W: World; pts: V3[]; uid: string; amt?: number; soft?: number; reach?: number; tight?: number; y?: number }> = ({ W, pts, uid, amt = 1, soft = 0.22, reach = 0.35, tight = 1, y = 0 }) => {
  const cen = mul(pts.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / pts.length);
  const k = W.scaleAt(cen);
  const fz = W.fog(cen);
  const a = amt * (1 - fz);
  const grow = (s: number, off: number) => pts.map((q) => add(add(cen, mul(sub(q, cen), s)), mul(W.shadowDir, off))).map((q) => W.project([q[0], y, q[2]]));
  return (
    <g>
      <defs>
        <filter id={`${uid}fs1`} filterUnits="userSpaceOnUse" x={-400} y={-400} width={W_PX + 800} height={H_PX + 800}>
          <feGaussianBlur stdDeviation={n2(Math.max(1, soft * k))} />
        </filter>
        <filter id={`${uid}fs2`} filterUnits="userSpaceOnUse" x={-400} y={-400} width={W_PX + 800} height={H_PX + 800}>
          <feGaussianBlur stdDeviation={n2(Math.max(0.6, 0.035 * k))} />
        </filter>
      </defs>
      <path d={polyD(grow(1.12, reach))} fill={GRAPHITE.shadow} opacity={0.42 * a} filter={`url(#${uid}fs1)`} />
      {tight > 0 ? <path d={polyD(grow(1.0, 0.02))} fill={GRAPHITE.shadow} opacity={0.5 * a * tight} filter={`url(#${uid}fs2)`} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE FLOOR: one tone by distance, the faint Dwarkesh grid, melting into the haze
// ===================================================================================================================
export const GridFloor: React.FC<{ W: World; x0: number; x1: number; z0: number; z1: number; cell?: number; lines?: number; ox?: number; oz?: number; pool?: V3; poolR?: number }> = ({
  W,
  x0,
  x1,
  z0,
  z1,
  cell = 1,
  lines = 1,
  ox = 0,
  oz = 0,
  pool,
  poolR = 4,
}) => {
  const mat = GRAPHITE.ground;
  const melt0 = lerp(z0, z1, 0.45);
  const meltAt = (z: number) => Math.pow(c01((z - melt0) / (z1 - melt0)), 1.2);
  const midX = (x0 + x1) / 2;
  const colAt = (z: number) => {
    const p: V3 = [midX, 0, z];
    const near = c01(1 - (z - z0) / 6);
    const local = mixHex(mat.mid, mat.dark, 0.28 * near);
    const sy = W.project(p)[1];
    return mixHex(W.tone(local, p), W.screenAir(sy), meltAt(z));
  };
  const NB = 40;
  const zs = Array.from({ length: NB + 1 }, (_, i) => lerp(z0, z1, Math.pow(i / NB, 1.7)));
  const stops: React.ReactNode[] = [];
  // one smooth gradient by screen row (the floor is a plane: screen row <-> depth along the centre line)
  const yTop = W.project([midX, 0, z1])[1];
  const yBot = W.project([midX, 0, z0])[1];
  zs.forEach((z, i) => {
    const y = W.project([midX, 0, z])[1];
    stops.push(<stop key={i} offset={n2(c01((y - yTop) / Math.max(1, yBot - yTop)))} stopColor={colAt(z)} />);
  });
  stops.reverse();
  const quad = polyD(clipNear(W, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]]).map(W.project));
  // grid lines, cut into depth pieces that fade with the fog and the melt
  const els: React.ReactNode[] = [];
  const PIECES = 26;
  const zAt = (i: number) => lerp(z0, z1, Math.pow(i / PIECES, 1.6));
  const lineCol = mixHex(mat.dark, GRAPHITE.shadow, 0.25);
  for (let i = 0; i < PIECES; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const pm: V3 = [midX, 0, zm];
    const a = lines * (1 - W.fog(pm) * 0.9) * (1 - meltAt(zm));
    if (a < 0.02) continue;
    const k = W.scaleAt(pm);
    let d = "";
    const seg = (a: V3, b: V3) => {
      const q = segNear(W, a, b);
      if (q) d += `M${Pt(q[0])}L${Pt(q[1])}`;
    };
    for (let X = Math.ceil((x0 - ox) / cell) * cell + ox; X <= x1; X += cell) seg([X, 0, za], [X, 0, zb]);
    for (let Z = Math.ceil((za - oz) / cell) * cell + oz; Z < zb; Z += cell) seg([x0, 0, Z], [x1, 0, Z]);
    els.push(<path key={i} d={d} fill="none" stroke={W.tone(lineCol, pm)} strokeOpacity={0.34 * a} strokeWidth={Math.max(0.5, 0.014 * k)} />);
  }
  let poolEl: React.ReactNode = null;
  if (pool) {
    const c = W.project(pool);
    const k = W.scaleAt(pool);
    const ry = Math.abs(W.project([pool[0], 0, pool[2] - poolR])[1] - W.project([pool[0], 0, pool[2] + poolR])[1]) / 2;
    poolEl = (
      <g>
        <defs>
          <radialGradient id="floorPool">
            <stop offset="0" stopColor={GRAPHITE.cream} stopOpacity={0.2} />
            <stop offset="0.55" stopColor={GRAPHITE.cream} stopOpacity={0.08} />
            <stop offset="1" stopColor={GRAPHITE.cream} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={poolR * k} ry={ry} fill="url(#floorPool)" />
      </g>
    );
  }
  const nearY = W.project([midX, 0, z0 + 2.5])[1];
  const lowAir = mixHex(W.screenAir(H_PX + SCREEN_DY), GRAPHITE.shadow, 0.35);
  return (
    <g>
      <defs>
        <linearGradient id="floorNear" gradientUnits="userSpaceOnUse" x1="0" y1={n2(Math.min(nearY, 1150 + SCREEN_DY))} x2="0" y2={H_PX}>
          <stop offset="0" stopColor={lowAir} stopOpacity={0} />
          <stop offset="0.5" stopColor={lowAir} stopOpacity={0.45} />
          <stop offset="1" stopColor={lowAir} stopOpacity={0.78} />
        </linearGradient>
        <linearGradient id="floorG" gradientUnits="userSpaceOnUse" x1="0" y1={n2(yTop)} x2="0" y2={n2(yBot)}>
          {stops}
        </linearGradient>
      </defs>
      <path d={quad} fill="url(#floorG)" />
      {poolEl}
      {els}
      <rect x={-50} y={n2(Math.min(nearY, 1150))} width={W_PX + 100} height={H_PX} fill="url(#floorNear)" />
    </g>
  );
};

/** the horizon as a soft zone over the floor's far edge */
export const HorizonHaze: React.FC<{ W: World; below?: number; strength?: number }> = ({ W, below = 260, strength = 1 }) => {
  const y0 = W.horizon - 30;
  return (
    <g>
      <defs>
        <linearGradient id="hzG" gradientUnits="userSpaceOnUse" x1="0" y1={n2(y0)} x2="0" y2={n2(y0 + below)}>
          {[0, 0.2, 0.45, 0.7, 1].map((s) => (
            <stop key={s} offset={s} stopColor={W.screenAir(y0 + s * below * 0.3)} stopOpacity={n2(strength * Math.pow(1 - s, 1.7))} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-50} y={n2(y0)} width={W_PX + 100} height={below} fill="url(#hzG)" />
    </g>
  );
};

// ===================================================================================================================
// DECALS: an SVG painted on a planar face, in exact perspective (CSS matrix3d from the face's projected corners)
// ===================================================================================================================
const homography = (w: number, h: number, q: P2[]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => v.toFixed(8)).join(",")})`;
};
/** o = the face's top-left corner, u = across (right), v = DOWN the face; w, h metres; res local px per metre.
 *  Children are SVG content in local px (0..w*res, 0..h*res). */
export const Decal: React.FC<{ W: World; o: V3; u: V3; v: V3; w: number; h: number; res?: number; opacity?: number; children?: React.ReactNode }> = ({ W, o, u, v, w, h, res = 400, opacity = 1, children }) => {
  const q = [o, add(o, mul(u, w)), add(add(o, mul(u, w)), mul(v, h)), add(o, mul(v, h))].map(W.project);
  const pw = w * res;
  const ph = h * res;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph, transformOrigin: "0 0", transform: homography(pw, ph, q), opacity }}>
      <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} style={{ overflow: "visible", display: "block" }}>
        {children}
      </svg>
    </div>
  );
};

// ===================================================================================================================
// THE MOVING CAMERA: keys + frame -> a pchip-eased camera (every channel, no steps, no overshoot), seek-safe
// ===================================================================================================================
/** a camera key on frame f; channels left out carry the previous key's value (the first key must give them all,
 *  except sx / sy / sun: default 540 / 700 / 0.28) */
export type CamKey = { f: number; target?: V3; dist?: number; yaw?: number; pitch?: number; F?: number; sx?: number; sy?: number; sun?: number };
type FullKey = { f: number; target: V3; dist: number; yaw: number; pitch: number; F: number; sx: number; sy: number; sun: number };
const CH: (keyof Omit<FullKey, "f" | "target">)[] = ["dist", "yaw", "pitch", "F", "sx", "sy", "sun"];
const fillKeys = (keys: CamKey[]): FullKey[] => {
  const out: FullKey[] = [];
  let prev: FullKey | null = null;
  for (const k of [...keys].sort((a, b) => a.f - b.f)) {
    const base: FullKey = prev ?? { f: k.f, target: k.target ?? [0, 0, 0], dist: k.dist ?? 10, yaw: k.yaw ?? 0, pitch: k.pitch ?? 0.3, F: k.F ?? 1800, sx: 540, sy: 700, sun: 0.28 };
    const cur: FullKey = { ...base, ...(Object.fromEntries(Object.entries(k).filter(([, v]) => v !== undefined)) as Partial<FullKey>), f: k.f };
    out.push(cur);
    prev = cur;
  }
  return out;
};
const CAM_CACHE = new Map<string, (fr: number) => FullKey>();
/** the eased camera at a frame: every channel is a monotone pchip through the keys (no steps, no overshoot).
 *  ends "held" (default): zero speed at the first and last key, so two keys = one smooth ease-in-out lobe. To be
 *  ALREADY MOVING at f0 and STILL DRIFTING at the end, put the first key before 0 (e.g. f -14) and the last after
 *  the cut's end (e.g. N + 20): the lobe is then mid-flight at both ends. ends "moving": the end segments' slopes
 *  carry on linearly past the first / last key (two keys = a linear move). */
export const camAt = (keys: CamKey[], frame: number, ends: "moving" | "held" = "held"): FullKey => {
  const id = JSON.stringify(keys) + ends;
  let fn = CAM_CACHE.get(id);
  if (!fn) {
    const K = fillKeys(keys);
    if (K.length === 1) {
      fn = () => K[0];
    } else {
      const held = ends === "held";
      const mk = (get: (k: FullKey) => number) => pchip(K.map((k) => [k.f, get(k)] as [number, number]), held);
      const ch = CH.map((c) => mk((k) => k[c]));
      const tg = [0, 1, 2].map((i) => mk((k) => k.target[i]));
      fn = (fr: number) => {
        const o = { f: fr } as FullKey;
        CH.forEach((c, i) => ((o as unknown as Record<string, number>)[c] = ch[i](fr)));
        o.target = [tg[0](fr), tg[1](fr), tg[2](fr)];
        return o;
      };
    }
    CAM_CACHE.set(id, fn);
  }
  return fn(frame);
};
/** the World at a frame of a keyed camera (motes / shafts travel from the camera at frame `rest`, default the
 *  first key's frame). extra: fog / sun overrides. */
export const worldAt = (keys: CamKey[], frame: number, extra: { ends?: "moving" | "held"; fog?: WorldOpts["fog"]; rest?: number } = {}): World => {
  const c = camAt(keys, frame, extra.ends);
  const r0 = camAt(keys, extra.rest ?? Math.min(...keys.map((k) => k.f)), extra.ends);
  const f0: V3 = [Math.sin(r0.yaw) * Math.cos(r0.pitch), -Math.sin(r0.pitch), Math.cos(r0.yaw) * Math.cos(r0.pitch)];
  return makeWorld({ target: c.target, dist: c.dist, yaw: c.yaw, pitch: c.pitch, F: c.F, sx: c.sx, sy: c.sy, sun: c.sun, frame, fog: extra.fog, rest: { pos: sub(r0.target, mul(f0, r0.dist)), yaw: r0.yaw } });
};

// ===================================================================================================================
// TIME HELPERS (frame-driven, pure)
// ===================================================================================================================
/** 0..1 smoothstep between frames a and b (ease in-out) */
export const ramp = (frame: number, a: number, b: number) => sst(a, b, frame);
/** 0..1 ease-out (no overshoot) between frames a and b: for entrances */
export const rampOut = (frame: number, a: number, b: number) => {
  const u = c01((frame - a) / (b - a));
  return 1 - Math.pow(1 - u, 3);
};
export const lerpV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** blend two materials (e.g. clay -> orange for something being taken over) */
export const mixMat = (a: Mat, b: Mat, t: number): Mat => (t <= 0 ? a : t >= 1 ? b : { lit: mixHex(a.lit, b.lit, t), mid: mixHex(a.mid, b.mid, t), dark: mixHex(a.dark, b.dark, t) });

// ===================================================================================================================
// THE STAGE: the air medium + the floor (grid, haze, light pool) + the floor's contact shadows
// ===================================================================================================================
export type FloorOpts = { cell?: number; ox?: number; oz?: number; pool?: V3; poolR?: number; lines?: number; haze?: number; hazeBelow?: number };
/** <HfStage W floor={...} shadows={<FloorShadow .../>...}> layers back to front </HfStage>
 *  The floor follows the camera (x +-30 m, z from 1 m behind the camera to 69 m past it), the grid stays fixed in the world. */
export const HfStage: React.FC<{ W: World; floor?: FloorOpts; shadows?: React.ReactNode; shafts?: number; motes?: number; children?: React.ReactNode }> = ({ W, floor = {}, shadows, shafts = 1.1, motes = 0.7, children }) => (
  <AirStage v={W.v} bloom={0} shafts={shafts} motes={motes}>
    <Svg id="hfFloor">
      <GridFloor W={W} x0={W.pos[0] - 30} x1={W.pos[0] + 30} z0={W.pos[2] - 1} z1={W.pos[2] + 69} cell={floor.cell ?? 0.9} ox={floor.ox ?? 0.45} oz={floor.oz ?? 0} lines={floor.lines ?? 1} pool={floor.pool} poolR={floor.poolR ?? 5} />
      <HorizonHaze W={W} below={floor.hazeBelow ?? 240} strength={floor.haze ?? 0.9} />
      {shadows}
    </Svg>
    {children}
  </AirStage>
);

// ===================================================================================================================
// THE ROBOT
// ===================================================================================================================
export const ROBOT_U = 178;
export const RobotAt: React.FC<{ W: World; p: V3; pose: BotPose; uid: string; variant?: number; aura?: number; shadow?: number; lift?: number; size?: number }> = ({ W, p, pose, uid, variant = 0, aura = 0, lift = 0, size = 1 }) => {
  const feet: V3 = [p[0], lift, p[2]];
  const at = W.project(feet);
  const scale = (W.scaleAt(feet) / ROBOT_U) * size;
  const fz = W.fog(add(feet, [0, 0.7, 0]));
  return <Bot variant={variant} pose={pose} at={at} scale={scale} uid={uid} frame={W.frame} fog={{ rgb: W.airHex(add(feet, [0, 0.8, 0])), amount: fz * 0.85 }} unitPx={1} aura={aura} />;
};
/** the robot's footprint for FloorShadow */
export const robotFoot = (p: V3, r = 0.24): V3[] =>
  circleOutline(1, 16).map(([x, z]) => [p[0] + x * r, 0, p[2] + z * r * 0.75] as V3);

// ===================================================================================================================
// THE HUGGING FACE MARK with its real yellow face (24-unit box; the mono glyph over its dark features)
// ===================================================================================================================
export const HF_YELLOW = "#FFD21E";
export const HF_DARK = "#3A3B45";
export const HFMark: React.FC<{ x: number; y: number; size: number; yellow?: string; dark?: string }> = ({ x, y, size, yellow = HF_YELLOW, dark = HF_DARK }) => (
  <g transform={`translate(${n2(x - size / 2)} ${n2(y - size / 2)}) scale(${(size / 24).toFixed(5)})`}>
    <rect x={6.4} y={6.2} width={11.3} height={9.6} rx={3} fill={dark} />
    <circle cx={5.13} cy={9.09} r={1.05} fill={dark} />
    <circle cx={18.97} cy={9.09} r={1.05} fill={dark} />
    {HUGGINGFACE.paths.map((d, i) => (
      <path key={i} d={d} fill={yellow} />
    ))}
  </g>
);

export { AbsoluteFill, AirStage, c01, lerp, mixHex };
export type { Mat };
export const mixHexL = mixHex;
