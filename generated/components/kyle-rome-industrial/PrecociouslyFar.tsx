// ---------------------------------------------------------------------------
// PrecociouslyFar (kyle-rome-industrial, cut 77). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 220 frames. On cut 4's shared world ./takeoffWorld.tsx (imported, unchanged); this file
// is the camera, the two witnesses and the dashed ramp.
//
// CHECK LINE: "Rome climbed further than any pre-industrial society — its plateau is the high point of the old flat
// ground — but without research and engineering the climb could not continue: the slope that would have carried it on
// up exists only as a dashed line."
//
// THE LINE: "[They] don't have research and engineering that drives continuous productivity gain. So I think they go
// like precociously far in a pre-industrial setting [where you take trade really far]."
// WORD -> FRAME (the brief's Whisper table, heard ~6 frames later): don't have 0-8 · research 8-24 · and engineering
//   24-53 · that drives 53-89 · continuous 89-112 · productivity 112-124 · gain. 124-137 · So I think they 139-150 ·
//   go like 150-174 · precociously 174-199 · far 199-205 · in [a pre-industrial…] 205-220
// DURATION: the slot 77.144 -> 84.484 s = 7.340 s x 29.97 = 220 frames (f0..f219).
//
// THE MOTION (rev 2, director's review: "choose recognition"): one crane, up and back, landing on cut 4's world.
// f0-53 "don't have research and engineering": on Rome's plateau by the town's last house, at the edge where the
// ground starts to fall away, cut 4's freeman and the slave with his amphora stand looking right, the temple and the
// aqueduct behind them; the camera barely drifts up and back. f53-137 "that drives continuous productivity gain": from
// the ground beside them ONE moving tip draws Rome's own takeoff that never happened: a bold DASHED ORANGE ground
// profile continuing the plateau upward, concave up (flat, then ever steeper: a hockey stick of its own, an echo of
// the real one), at an even screen pace, one bold glowing line (rev 3: no strata). The two look up after the tip (head pitch); the
// camera pulls back in one lobe (log distance) so the growing ridge stays in frame, and the real road under it is seen
// curving down off the plateau to the flat. f137-219 "So I think they go precociously far": the pull-back settles,
// by ~f200, on cut 4's settled profile view (its f130 camera, the eye 59 m further left so clear air opens between
// Rome and the climb; Rome's town exactly where cut 4 left it): Rome small on its plateau at the lower left, the
// dashed ridge rising from its edge and stopping in clear air at about 2/3 of the industrial column's height, the
// flat and the road, "1800", the beam engine and the whole lit climb with its chimneys and plumes at the right.
// The opening's foot sinks into the dense low air (LowAir), clearing as the view reaches cut 4's profile.
// Orange = technology / growth that never happened (the dashed ridge) and the real industry of cut 4's world; Rome
// itself has none. People never orange.
// CAUSE BEFORE EFFECT: the tip starts on the ground at the plateau's edge (no dot in the air); the witnesses' heads lift
// 4-9 frames after it leaves.
//
// DEPTH: metres (takeoffWorld). Anchor S0 = the ridge's foot (30, 8, -10) on the plateau by house 3: the eye sits D in
// front of it (D 11 -> 263 m, log), offset (ox, oy) x D across and up (eye 10.4 m -> 45.8 m), focal 2600 -> 1100 px,
// S0 from (800, 1040) on screen to where cut 4's camera puts it (~275, 1539). The ridge: along +X, 58 m, height
// 23.4 (e^(t/30.5) - 1) (rises 133 m). End sizes: as cut 4's f130 (Rome ~110 px wide at the lower left); the ridge
// from (275, 1539) to (518, 981). Dashes: 50 screen px period while drawing, frozen into the world at f137;
// 8.5 px wide while drawing, settling to ~7 px.
//
// SOURCES: none on screen beyond cut 4's world (its header: the Maddison-style profile, Scheidel & Friesen 2009 on
// Roman income somewhat above subsistence). The ramp is illustrative, not data.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { ACCENT, AirShadow, AirStage, RomeFolk, lerp, smoothstep } from "../kits/dwarkesh-3d/dwarkesh3d";
import { sway } from "../kits/maps/incaShared";
import { camAt as cut4Cam } from "./CatalyzeTheTakeoff";
import { FIG_M, TakeoffWorld, airOf, project, rOf, terrainH, type Item, type TAir, type TCam } from "./takeoffWorld";

const { fontFamily: cinzel } = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });

export const FPS = 30000 / 1001;
export const DURATION = 220;
export const schema = z.object({
  /** probe only: a camera as JSON (TCam) to hold */
  probeCam: z.string().default(""),
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: the ramp's drawn fraction (-1 = the cut's) */
  probeU: z.number().default(-1),
  /** probe only: ramp overrides as JSON */
  probeRamp: z.string().default(""),
  /** probe only: the air's fogVis (0 = the world's) */
  probeVis: z.number().default(0),
});
export const defaultProps = schema.parse({});

const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
type V3 = [number, number, number];
type P2 = [number, number];

// ===================================================================================================================
// ROME'S OWN TAKEOFF THAT NEVER HAPPENED: a dashed ground profile continuing Rome's plateau up from its edge (on the
// road of history, where the real ground starts to sink back to the flat): a concave-up climb of its own (an echo of
// the real hockey stick at the knee), drawn as the ridge line of a slope with a few shorter dashed strokes under it
// (the hillside), by one moving tip; it stops in mid-air, well short of the real climb
// ===================================================================================================================
/** the ridge: from (X, Z) on the plateau along `ang` (deg off +X toward +Z), T metres, height A (e^(t/L) - 1) */
export const RIDGE0 = { X: 30, Z: -10, ang: 0, T: 58, A: 23.4, L: 30.5 };
type Ridge = typeof RIDGE0;
const S0 = { X: RIDGE0.X, h: terrainH(RIDGE0.X, RIDGE0.Z), Z: RIDGE0.Z };
const ridgeAt = (R: Ridge, u: number, drop = 0): V3 => {
  const a = (R.ang * Math.PI) / 180;
  const t = u * R.T;
  return [S0.X + t * Math.cos(a), S0.h + R.A * (Math.exp(t / R.L) - 1) - drop, S0.Z + t * Math.sin(a)];
};
/** the dash pattern (screen px along a stroke from its start): drawn at a fixed screen size while the tip draws, then
 *  frozen into the world (it shrinks with the pull-back); the contours dash finer */
const DASH = { P: 50, duty: 0.6, w: 8.5, wEnd: 7 };
/** the drawing: the tip leaves the ground on "drives" and climbs at an even SCREEN pace to the ridge's end on "gain" */
export const DRAW = { a: 53, b: 137 };
/** a stroke: points for v 0..1, and how much of it is drawn when the tip is at u */
type Stroke = { at: (v: number) => V3; shown: (u: number) => number; P: number; k: number };
const strokesOf = (R: Ridge): Stroke[] => {
  const ridge: Stroke = { at: (v) => ridgeAt(R, v), shown: (u) => u, P: DASH.P, k: 1 };
  return [ridge];
};
const NS = 96;
type Poly = { pts: P2[]; vs: number[]; cum: number[] };
const strokePoly = (c: TCam, st: Stroke): Poly => {
  const pts: P2[] = [];
  const vs: number[] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= NS; i++) {
    const v = i / NS;
    const p = st.at(v);
    pts.push(project(c, p[0], p[1], p[2]));
    vs.push(v);
    if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, vs, cum };
};
/** the v at screen length L along a polyline */
const vAtLen = (q: Poly, L: number) => {
  if (L <= 0) return q.vs[0];
  for (let i = 1; i < q.cum.length; i++) {
    if (q.cum[i] >= L) {
      const t = (L - q.cum[i - 1]) / Math.max(1e-6, q.cum[i] - q.cum[i - 1]);
      return q.vs[i - 1] + (q.vs[i] - q.vs[i - 1]) * t;
    }
  }
  return q.vs[q.vs.length - 1];
};
const dashesOf = (q: Poly, P: number, upTo = Infinity): [number, number][] => {
  const tot = q.cum[q.cum.length - 1];
  const out: [number, number][] = [];
  for (let px = 0; px < Math.min(tot, upTo + P); px += P) out.push([vAtLen(q, px), vAtLen(q, Math.min(tot, px + P * DASH.duty))]);
  return out;
};
/** the sub-polyline of a stroke between v0 and v1 (screen points) */
const subPath = (c: TCam, st: Stroke, v0: number, v1: number) => {
  const n = Math.max(2, Math.ceil(NS * (v1 - v0)));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = st.at(v0 + ((v1 - v0) * i) / n);
    const q = project(c, p[0], p[1], p[2]);
    d += `${i ? "L" : "M"}${fx(q[0])},${fx(q[1])}`;
  }
  return d;
};

/** the dashed orange ridge and its hillside contours, each drawn as far as the tip has reached; a soft glow under the
 *  ridge; the tip a warm head */
const DashedRidge: React.FC<{ A: TAir; R: Ridge; dashes: [number, number][][]; u: number; w: number; tipGlow: number; uid: string }> = ({ A, R, dashes, u, w, tipGlow, uid }) => {
  const c = A.c;
  if (u <= 0) return null;
  const strokes = strokesOf(R);
  const tip = ridgeAt(R, u);
  const tp = project(c, tip[0], tip[1], tip[2]);
  const mid = ridgeAt(R, u / 2);
  const col = A.toneOH(ACCENT, mid[2], mid[1]);
  const els: React.ReactNode[] = [];
  strokes.forEach((st, j) => {
    const top = st.shown(u);
    if (top <= 0) return;
    let d = "";
    for (const [v0, v1raw] of dashes[j]) {
      if (v0 >= top) break;
      const v1 = Math.min(top, v1raw);
      if (v1 > v0 + 1e-4) d += subPath(c, st, v0, v1);
    }
    if (d) els.push(<path key={j} d={d} stroke={col} strokeWidth={w * st.k} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={j ? 0.85 : 1} />);
  });
  return (
    <g>
      <defs>
        <filter id={`${uid}-gl`} x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
          <feGaussianBlur stdDeviation={w * 0.9} />
        </filter>
        <radialGradient id={`${uid}-tip`}>
          <stop offset="0" stopColor="#FFEBC0" stopOpacity={0.95} />
          <stop offset="0.28" stopColor={ACCENT} stopOpacity={0.6} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={subPath(c, strokes[0], 0, u)} stroke={col} strokeWidth={w * 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.2} filter={`url(#${uid}-gl)`} fill="none" />
      {els}
      {tipGlow > 0.01 ? <circle cx={fx(tp[0])} cy={fx(tp[1])} r={fx(w * 3.2)} fill={`url(#${uid}-tip)`} opacity={tipGlow} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE WITNESSES at the plateau's edge, on the road of history: cut 4's freeman and the slave with his amphora
// ===================================================================================================================
export const WITNESS = [
  { kind: "Slave" as const, variant: 1, X: S0.X - 0.9, Z: S0.Z + 0.5, load: "amphora" as const },
  { kind: "Freeman" as const, variant: 0, X: S0.X - 2.75, Z: S0.Z + 1.3 },
];
const witnessItems = (A: TAir, frame: number): Item[] =>
  WITNESS.map((f, i) => {
    const c = A.c;
    const g = terrainH(f.X, f.Z);
    const at = project(c, f.X, g, f.Z);
    const scale = rOf(c, f.Z) * FIG_M;
    const base = f.load ? RomeFolk.POSES.carry(1, 0, 0) : RomeFolk.idle(RomeFolk.POSES.stand(1), frame + i * 31, i);
    // they look up after the tip as it leaves the ground (the freeman a few frames after the slave)
    const look = smoothstep(DRAW.a + 4 + 5 * i, DRAW.a + 40 + 5 * i, frame);
    const pose = { ...base, pitch: base.pitch - 15 * look };
    const Fig = RomeFolk[f.kind];
    return {
      d: f.Z,
      key: `wit${i}`,
      el: (
        <g key={`wit${i}`}>
          <AirShadow A={A} X={f.X} Z={f.Z} w={0.36} d={0.2} uid={`wits${i}`} amt={0.8} Y={-g} />
          <Fig pose={pose} variant={f.variant} at={at} scale={scale} uid={`wit${i}`} fog={A.folkFogH(f.Z, g)} unitPx={1} {...(f.load ? { load: f.load } : {})} />
        </g>
      ),
    };
  });

// ===================================================================================================================
// THE CAMERA: one crane up and back from beside the witnesses to the profile view of the road of history. The ramp's
// start S0 is the anchor (held near the frame's middle); the eye sits at depth D in front of it, offset across and
// up by (ox, oy) x D; D, the focal length and the offsets ride one progress curve (log D, so the pull-back reads even)
// ===================================================================================================================
/** cut 4's settled profile view (its f130 camera, without its sway): the cut lands on it at the end */
export const CUT4_END: TCam = cut4Cam(130);
/** the landing: cut 4's camera, the eye moved a little left along X (more clear air between Rome and the climb for
 *  the dashed ridge), the lens shift keeping Rome's town exactly where cut 4 left it */
export const END_X = 45;
const CAM_END: TCam = (() => {
  const c = { ...CUT4_END, X: END_X };
  const t = project(CUT4_END, 5, 8, 6);
  const r = project(c, 5, 8, 6);
  return { ...c, sx: c.sx + t[0] - r[0], hr: c.hr + t[1] - r[1] };
})();
const Q_END = project(CAM_END, S0.X, S0.h, S0.Z);
export const CAMK = {
  D: [11, S0.Z - CAM_END.Z] as [number, number],
  F: [2600, CAM_END.F] as [number, number],
  ox: [0.42, (CAM_END.X - S0.X) / (S0.Z - CAM_END.Z)] as [number, number],
  oy: [0.22, (CAM_END.H - S0.h) / (S0.Z - CAM_END.Z)] as [number, number],
  q0: [800, 1040] as P2,
  q1: [Q_END[0], Q_END[1]] as P2,
};
const SPEED = (f: number) => 0.035 + 0.965 * smoothstep(20, 66, f) * (1 - smoothstep(92, 196, f));
export const PROG = (() => {
  const acc: number[] = [0];
  for (let f = 1; f <= DURATION; f++) acc.push(acc[f - 1] + (SPEED(f - 1) + SPEED(f)) / 2);
  const tot = acc[DURATION - 1];
  return (f: number) => {
    const g = Math.max(0, Math.min(DURATION - 1, f));
    const i = Math.floor(g);
    const v = acc[i] + (acc[Math.min(DURATION - 1, i + 1)] - acc[i]) * (g - i);
    return v / tot;
  };
})();
const logLerp = (a: number, b: number, t: number) => a * Math.pow(b / a, t);
export const camAt = (f: number): TCam => {
  const p = PROG(f);
  const D = logLerp(CAMK.D[0], CAMK.D[1], p);
  const F = logLerp(CAMK.F[0], CAMK.F[1], p);
  const ox = lerp(CAMK.ox[0], CAMK.ox[1], p);
  const oy = lerp(CAMK.oy[0], CAMK.oy[1], p);
  const X = S0.X + ox * D;
  const H = S0.h + oy * D;
  const Z = S0.Z - D;
  const qx = lerp(CAMK.q0[0], CAMK.q1[0], smoothstep(0, 1, p));
  const qy = lerp(CAMK.q0[1], CAMK.q1[1], smoothstep(0.4, 1, p));
  return { X, H, Z, F, sx: qx - 540 - (F * (S0.X - X)) / D, hr: qy - (F * (H - S0.h)) / D };
};
const withSway = (c: TCam, f: number): TCam => {
  const s = sway(f);
  return { ...c, sx: c.sx + s.dx, hr: c.hr + s.dy };
};
export const CAM_F0 = camAt(0);

/** the dashes (v ranges per stroke) and the tip's u at frame f (deterministic from the cut's camera) */
const ridgeState = (R: Ridge, f: number) => {
  const strokes = strokesOf(R);
  const cB = camAt(DRAW.b);
  const ridgeB = strokePoly(cB, strokes[0]);
  const lenB = ridgeB.cum[ridgeB.cum.length - 1];
  if (f >= DRAW.b) return { u: 1, dashes: strokes.map((st) => dashesOf(strokePoly(cB, st), st.P)), drawing: false };
  if (f <= DRAW.a) return { u: 0, dashes: strokes.map(() => [] as [number, number][]), drawing: true };
  const c = camAt(f);
  const ridge = strokePoly(c, strokes[0]);
  const target = (lenB / (DRAW.b - DRAW.a)) * (f - DRAW.a);
  const u = vAtLen(ridge, target);
  return { u, dashes: strokes.map((st, j) => (j ? dashesOf(strokePoly(c, st), st.P) : dashesOf(ridge, st.P, target))), drawing: true };
};

/** the opening's foot sinks into the dense low air (the style's height ramp); it clears as the pull-back reaches cut 4's
 *  profile view, whose plain and road fill the lower frame */
export const LOW_AIR = { y0: 1120, y1: 1920, amt: 0.62 };
const LowAir: React.FC<{ A: TAir; amt: number }> = ({ A, amt }) => {
  if (amt < 0.005) return null;
  const col = A.screenAir(2300);
  return (
    <g>
      <defs>
        <linearGradient id="pf-low" gradientUnits="userSpaceOnUse" x1={0} y1={LOW_AIR.y0} x2={0} y2={LOW_AIR.y1}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <stop key={t} offset={t} stopColor={col} stopOpacity={fx(amt * t * t * (3 - 2 * t))} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-20} y={LOW_AIR.y0} width={1120} height={LOW_AIR.y1 - LOW_AIR.y0 + 20} fill="url(#pf-low)" />
    </g>
  );
};

const PrecociouslyFar: React.FC<z.infer<typeof schema>> = ({ probeCam, camFrame, probeU, probeRamp, probeVis }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const c: TCam = probeCam ? { ...CAM_F0, ...JSON.parse(probeCam) } : withSway(camAt(cf), cf);
  const A = airOf(c, frame, CAM_F0, probeVis > 0 ? { fogVis: probeVis } : {});
  const R: Ridge = probeRamp ? { ...RIDGE0, ...JSON.parse(probeRamp) } : RIDGE0;
  const st = ridgeState(R, probeU >= 0 ? (probeU >= 1 ? DRAW.b : lerp(DRAW.a, DRAW.b, probeU)) : frame);
  // the line's weight: bold while drawing, settling a little as the pull-back shrinks it
  const rB = rOf(camAt(DRAW.b), S0.Z);
  const w = st.drawing ? DASH.w : Math.max(DASH.wEnd, Math.min(DASH.w, DASH.w * Math.pow(rOf(c, S0.Z) / rB, 0.5)));
  const tipGlow = smoothstep(0, 0.05, st.u) * (st.drawing ? 1 : 0.55 + 0.45 * (1 - smoothstep(DRAW.b, DRAW.b + 24, frame)));
  const extras: Item[] = [...witnessItems(A, frame), { d: S0.Z - 1.5, key: "ridge", el: <DashedRidge key="ridge" A={A} R={R} dashes={st.dashes} u={st.u} w={w} tipGlow={tipGlow} uid="rp" /> }];
  const lowAmt = LOW_AIR.amt * (1 - smoothstep(0.45, 0.92, PROG(cf)));
  return (
    <AirStage v={A.v} bloom={0.25}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
          <TakeoffWorld A={A} frame={frame} font={cinzel} extras={extras} hide={{ figures: true }} />
          <LowAir A={A} amt={lowAmt} />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

export default PrecociouslyFar;
