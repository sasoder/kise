// ---------------------------------------------------------------------------
// PrecociouslyFar (kyle-rome-industrial, cut 77). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 220 frames. On cut 4's shared world ./takeoffWorld.tsx (Rev 1, imported unchanged);
// this file adds Rome's watermills on its rise, the castellum and leat, the dashed curl, and the camera.
//
// CHECK LINE: "Rome climbed further than anyone before it, but without research and engineering driving continuous
// productivity gain its rise levelled off into a plateau: the climb that would have carried on is only a dashed
// line that fades into nothing."
//
// THE LINE: "[They] don't have research and engineering that drives continuous productivity gain. So I think they go
// like precociously far in a pre-industrial setting [where you take trade really far]."
// WORD -> FRAME (Rev 1 table): don't 0 · research 8 · engineering 37 · drives 76 · continuous 89 · productivity 112 ·
//   gain 124 · So 139 · think 144 · go 150 · precociously 174 · far 199 · in 205
// DURATION: the slot 77.144 -> 84.484 s = 7.340 s x 29.97 = 220 frames (f0..f219).
//
// THE MOTION (Rev 1, the user's notes + the director's review: a new picture, no replay of cut 4's shots): Rome is a
// cut-local raised TABLE drawn over cut 4's world (whose own town, industry and milestones are hidden here; the far
// 1800 climb stays out of frame): the plain at its foot with three low pre-Roman huts, a ramp climbing 70 m worked by
// a cascade of five watermills (after Barbegal) fed from a castellum at the aqueduct's west end, then a long flat
// top carrying the town (houses, a temple) and the aqueduct, running on flat to the right, with a solid earth front
// face grounded by a sloped earth toe and a soft contact shadow (no ruled foot line), so the profile reads as a step. f0-40 "don't have research and engineering": close on a turning wheel. f40-174:
// one pull-back, up and out (log distance), down the cascade to the side-on profile: low plain, ramp, flat top.
// f80-150 "that drives continuous productivity gain": from the point where the ramp flattens one moving tip draws a
// bold DASHED ORANGE curl that carries the climb on, ever steeper, dissolving over its last part into nothing, while
// the real top runs on flat under it. f174 "precociously far": the profile is settled; a calm, living hold to the end
// (wheels turning, motes). Orange = growth that never happened (the dashed curl) only. No people.
//
// DEPTH: metres (takeoffWorld's frame). TABLE: front face Z -64, top 70 m at X >= -50, the ramp a smooth S from the
// plain at X -140; mills at X -58 .. -113 on stepped stone bases, wheels R 1.75 m at Z -60.4 (0.075 rad/frame);
// huts (daub wall ~ roof height, dark door, conical thatch with overhang, a smoke wisp on one) R 3.8-4.6 m at
// X -100 .. -79, Z -91 .. -105. The leat's main channel runs behind the mills; short feeders reach each wheel. Camera: the anchor moves from the second wheel to the curl's foot
// S0 (-50, 70, -62.5): the eye D in front of it (15 -> 121 m, log), offset (ox, oy) x D (eye ~75 m at the end, just
// above the top), focal 1500 -> 840 px, the anchor from (520, 900) to (700, 960). The curl: along +X, 42 m,
// h = 70 + 8 (e^(t/16) - 1) (+102 m), leaving at slope 0.5; dashes 46 screen px while drawing, frozen at f150; fades
// from 60 % of its length.
//
// SOURCES: the Barbegal watermill complex near Arles (2nd c. AD): 16 overshot wheels in two rows stepped down a
// hillside, fed by an aqueduct (the standard description of the site) — drawn as a small cascade of four. The
// plateau and the curl are illustrative (cut 4's header: the long-run profile of income per head), not data.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { ACCENT, AirCyl, AirShadow, AirStage, MAT, formTone, lerp, lineOf, mixHex, smoothstep, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { sway } from "../kits/maps/incaShared";
import { LAND, MARBLE_T, PLASTER, STONE_T, Solid, TILE, TakeoffWorld, airOf, boxFaces, gableFaces, lwAt, project, rOf, terrainH, type Item, type TAir, type TCam } from "./takeoffWorld";

const { fontFamily: cinzel } = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });

export const FPS = 30000 / 1001;
export const DURATION = 220;
export const schema = z.object({
  /** probe only: a camera as JSON (TCam) to hold */
  probeCam: z.string().default(""),
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: the curl's drawn fraction (-1 = the cut's) */
  probeU: z.number().default(-1),
  /** probe only: curl overrides as JSON */
  probeRamp: z.string().default(""),
  /** probe only: the air's fogVis (0 = the cut's) */
  probeVis: z.number().default(0),
});
export const defaultProps = schema.parse({});

const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
type V3 = [number, number, number];
type P2 = [number, number];

// ===================================================================================================================
// ROME'S TABLE (cut-local, drawn over cut 4's world; the world's own town is hidden in this cut): the plain at its
// foot, a ramp climbing to a flat top that carries the town and the aqueduct and runs on flat to the right, with a
// solid earth front face so the profile reads as a clear step. Taller than the world's 8 m plateau: a picture.
// ===================================================================================================================
export const TABLE = { HT: 70, xFoot: -140, xTop: -50, xEnd: 170, zF: -64, zB: 30 };
const T6 = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** the table's height at X (the ramp: a smooth S from the plain to the flat top) */
export const tableH = (X: number) => (X <= TABLE.xFoot ? 0 : X >= TABLE.xTop ? TABLE.HT : TABLE.HT * T6((X - TABLE.xFoot) / (TABLE.xTop - TABLE.xFoot)));
const EARTH: Mat = { lit: "#937F5E", mid: "#77654A", dark: "#40352A" };
const FACE: Mat = { lit: "#8E7A5C", mid: "#6F5E47", dark: "#3A3027" };
const LIGHT: V3 = (() => {
  const v: V3 = [-0.7, 0.62, -0.32];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const SHADOW = "#22180F";
/** the table's top and ramp (one ground-like item, behind everything standing on it) */
const TableTop: React.FC<{ A: TAir }> = ({ A }) => {
  const c = A.c;
  const xs: number[] = [];
  for (let X = TABLE.xFoot - 2; X < TABLE.xTop; X += 2) xs.push(X);
  for (let X = TABLE.xTop; X <= TABLE.xEnd; X += 10) xs.push(X);
  const zs = [TABLE.zF, -56, -46, -34, -18, 0, TABLE.zB];
  const els: React.ReactNode[] = [];
  for (let j = zs.length - 2; j >= 0; j--) {
    for (let i = 0; i < xs.length - 1; i++) {
      const X0 = xs[i];
      const X1 = xs[i + 1];
      const h0 = tableH(X0);
      const h1 = tableH(X1);
      if (h0 < 0.05 && h1 < 0.05) continue;
      const m = (h1 - h0) / (X1 - X0);
      const l = Math.hypot(m, 1);
      const ndl = (-m / l) * LIGHT[0] + (1 / l) * LIGHT[1];
      const zm = (zs[j] + zs[j + 1]) / 2;
      const col = A.toneH(formTone(EARTH, ndl, SHADOW, 0.3), zm, (h0 + h1) / 2);
      const q = [project(c, X0, h0, zs[j]), project(c, X1, h1, zs[j]), project(c, X1, h1, zs[j + 1]), project(c, X0, h0, zs[j + 1])];
      els.push(<path key={`${i}_${j}`} d={`M${q.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}Z`} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />);
    }
  }
  return <g>{els}</g>;
};
/** the front face: solid earth under the profile, a darker foot, the style's cream rim along its top edge */
const TableFace: React.FC<{ A: TAir }> = ({ A }) => {
  const c = A.c;
  const Z = TABLE.zF;
  const top: P2[] = [];
  for (let X = TABLE.xFoot; X <= TABLE.xEnd; X += X < TABLE.xTop ? 1.5 : 10) top.push(project(c, X, tableH(X), Z));
  const right = project(c, TABLE.xEnd, 0, Z);
  const left = project(c, TABLE.xFoot, 0, Z);
  const d = `M${fx(left[0])},${fx(left[1])}L${top.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}L${fx(right[0])},${fx(right[1])}Z`;
  const yTop = project(c, 0, TABLE.HT, Z)[1];
  const yBot = project(c, 0, 0, Z)[1];
  const lit = A.toneH(formTone(FACE, -LIGHT[2], SHADOW, 0.3), Z, TABLE.HT * 0.7);
  const low = A.toneH(mixHex(formTone(FACE, -LIGHT[2], SHADOW, 0.3), SHADOW, 0.35), Z, 2);
  const rim = `M${top.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}`;
  const lw = Math.max(1, 0.08 * rOf(c, Z));
  // the toe: a sloped earth apron from the face's foot out onto the plain, from the face's shaded foot (a soft contact
  // shadow) into the plain's own tone, its outer edge dissolving into the plain (no ruled line)
  const toeTop: P2[] = [];
  const toeBot: P2[] = [];
  for (let X = TABLE.xFoot; X <= TABLE.xEnd; X += X < TABLE.xTop ? 1.5 : 10) {
    const th = Math.min(tableH(X), TOE.h) * smoothstep(0, 4, tableH(X));
    toeTop.push(project(c, X, th, Z));
    toeBot.push(project(c, X - TOE.d * 0.3, 0, Z - TOE.d * Math.min(1, tableH(X) / TOE.h)));
  }
  const toe = `M${[...toeTop, ...toeBot.reverse()].map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}Z`;
  const yT0 = project(c, 0, TOE.h, Z)[1];
  const yT1 = project(c, 0, 0, Z - TOE.d)[1];
  const plain = A.toneH(formTone(LAND, LIGHT[1], SHADOW, 0.3), Z - TOE.d, 0);
  const shade = A.toneH(mixHex(formTone(FACE, -LIGHT[2], SHADOW, 0.3), SHADOW, 0.5), Z, 1);
  return (
    <g>
      <defs>
        <linearGradient id="pf-face" gradientUnits="userSpaceOnUse" x1={0} y1={fx(yTop)} x2={0} y2={fx(yBot)}>
          <stop offset={0} stopColor={lit} />
          <stop offset={1} stopColor={low} />
        </linearGradient>
        <linearGradient id="pf-toe" gradientUnits="userSpaceOnUse" x1={0} y1={fx(yT0)} x2={0} y2={fx(yT1)}>
          <stop offset={0} stopColor={low} stopOpacity={1} />
          <stop offset={0.35} stopColor={shade} stopOpacity={1} />
          <stop offset={0.7} stopColor={mixHex(shade, plain, 0.6)} stopOpacity={0.85} />
          <stop offset={1} stopColor={plain} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#pf-face)" />
      <path d={toe} fill="url(#pf-toe)" />
      <path d={rim} fill="none" stroke={A.toneH(lineOf(FACE), Z, TABLE.HT)} strokeWidth={fx(lw * 1.6)} strokeLinejoin="round" />
      <path d={rim} fill="none" stroke={CREAM} strokeOpacity={0.45 * (1 - A.fogH(Z, TABLE.HT))} strokeWidth={fx(lw)} strokeLinejoin="round" />
    </g>
  );
};
const CREAM = "#F3EBDD";
/** the apron at the face's foot: its height on the face and its reach out onto the plain (m) */
const TOE = { h: 9, d: 14 };

// ===================================================================================================================
// THE TOWN ON THE TOP (cut-local: muted plaster, terracotta, marble; no orange): houses along the front, a temple,
// the aqueduct running along behind them and on to the right; a castellum at its west end feeds the mills' leat
// ===================================================================================================================
export const TOWN77 = {
  houses: [
    { X0: -44, X1: -36, Z0: -55, Z1: -47, wall: 4.6 },
    { X0: -32, X1: -25, Z0: -52, Z1: -44, wall: 5.4 },
    { X0: -6, X1: 2, Z0: -55, Z1: -47, wall: 4.4 },
    { X0: 6, X1: 15, Z0: -52, Z1: -44, wall: 5.2 },
    { X0: 22, X1: 30, Z0: -54, Z1: -46, wall: 4.2 },
  ],
  temple: { X0: -22, X1: -9, Z0: -55, Z1: -38, podium: 2, colTop: 9, cols: 6 },
  aq: { X0: -53, X1: 170, Z0: -36, Z1: -33.6, deck: 13, span: 6, pier: 1.9, spring: 8.5 },
};
const townItems = (A: TAir): Item[] => {
  const c = A.c;
  const b = TABLE.HT;
  const out: Item[] = [];
  TOWN77.houses.forEach((h, i) => {
    const doorX = (h.X0 + h.X1) / 2;
    const door = [project(c, doorX - 0.75, b, h.Z0 - 0.02), project(c, doorX + 0.75, b, h.Z0 - 0.02), project(c, doorX + 0.75, b + 2.3, h.Z0 - 0.02), project(c, doorX - 0.75, b + 2.3, h.Z0 - 0.02)];
    const socle = [project(c, h.X0, b, h.Z0 - 0.01), project(c, h.X1, b, h.Z0 - 0.01), project(c, h.X1, b + 0.9, h.Z0 - 0.01), project(c, h.X0, b + 0.9, h.Z0 - 0.01)];
    const poly = (q: P2[]) => `M${q.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}Z`;
    out.push({
      d: (h.Z0 + h.Z1) / 2,
      key: `th${i}`,
      el: (
        <g key={`th${i}`}>
          <Solid A={A} faces={boxFaces(h.X0, h.X1, b, b + h.wall, h.Z0, h.Z1, PLASTER)} />
          <path d={poly(socle)} fill={A.toneH("#7E5040", h.Z0, b)} />
          <path d={poly(door)} fill={A.toneH("#3E3226", h.Z0, b + 1)} />
          <Solid A={A} faces={gableFaces(h.X0 - 0.4, h.X1 + 0.4, b + h.wall, b + h.wall + 2.1, h.Z0 - 0.4, h.Z1 + 0.4, TILE, "x", PLASTER)} />
        </g>
      ),
    });
  });
  {
    const T = TOWN77.temple;
    const top = b + T.podium;
    const cols: React.ReactNode[] = [];
    for (let k = 0; k < T.cols; k++) {
      const X = T.X0 + 1 + ((T.X1 - T.X0 - 2) * k) / (T.cols - 1);
      cols.push(<AirCyl key={k} A={A} X={X} Z={T.Z0 + 1.2} R={0.5} Y0={-(b + T.colTop)} Y1={-top} mat={MARBLE_T} uid={`tc${k}`} flutes={5} lw={lwAt(c, T.Z0)} />);
    }
    out.push({
      d: (T.Z0 + T.Z1) / 2,
      key: "temple",
      el: (
        <g key="temple">
          <Solid A={A} faces={boxFaces(T.X0, T.X1, b, top, T.Z0, T.Z1, STONE_T, MARBLE_T)} />
          <Solid A={A} faces={boxFaces(T.X0 + 1.2, T.X1 - 1.2, top, b + T.colTop, T.Z0 + 3.4, T.Z1 - 0.6, MARBLE_T)} />
          {cols}
          <Solid A={A} faces={boxFaces(T.X0 + 0.2, T.X1 - 0.2, b + T.colTop, b + T.colTop + 1.1, T.Z0 + 0.4, T.Z1, MARBLE_T)} />
          <Solid A={A} faces={gableFaces(T.X0, T.X1, b + T.colTop + 1.1, b + T.colTop + 3.6, T.Z0 + 0.2, T.Z1 + 0.2, TILE, "z", MARBLE_T)} />
        </g>
      ),
    });
  }
  {
    const Q = TOWN77.aq;
    const n = Math.round((Q.X1 - Q.X0) / Q.span);
    const archR = (Q.span - Q.pier) / 2;
    const face = (Z: number) => {
      let d = `M${fx(project(c, Q.X0, b, Z)[0])},${fx(project(c, Q.X0, b, Z)[1])}L${fx(project(c, Q.X1, b, Z)[0])},${fx(project(c, Q.X1, b, Z)[1])}L${fx(project(c, Q.X1, b + Q.deck, Z)[0])},${fx(project(c, Q.X1, b + Q.deck, Z)[1])}L${fx(project(c, Q.X0, b + Q.deck, Z)[0])},${fx(project(c, Q.X0, b + Q.deck, Z)[1])}Z`;
      for (let i = 0; i < n; i++) {
        const xc = Q.X0 + Q.span * (i + 0.5);
        const a0 = project(c, xc - archR, b, Z);
        const a1 = project(c, xc - archR, b + Q.spring, Z);
        const a2 = project(c, xc + archR, b + Q.spring, Z);
        const a3 = project(c, xc + archR, b, Z);
        const rr = archR * rOf(c, Z);
        d += `M${fx(a0[0])},${fx(a0[1])}L${fx(a1[0])},${fx(a1[1])}A${fx(rr)},${fx(rr)} 0 0 1 ${fx(a2[0])},${fx(a2[1])}L${fx(a3[0])},${fx(a3[1])}Z`;
      }
      return d;
    };
    const hm = b + Q.deck * 0.6;
    const ln = A.toneH(lineOf(STONE_T), Q.Z0, hm);
    const lw = lwAt(c, Q.Z0);
    const topQ = [project(c, Q.X0, b + Q.deck, Q.Z0), project(c, Q.X1, b + Q.deck, Q.Z0), project(c, Q.X1, b + Q.deck, Q.Z1), project(c, Q.X0, b + Q.deck, Q.Z1)];
    out.push({
      d: (Q.Z0 + Q.Z1) / 2,
      key: "aq",
      el: (
        <g key="aq">
          <path d={face(Q.Z1)} fill={A.toneH(mixHex(STONE_T.dark, SHADOW, 0.3), Q.Z1, hm)} fillRule="evenodd" />
          {c.H > b + Q.deck ? <path d={`M${topQ.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}Z`} fill={A.toneH(STONE_T.lit, Q.Z0, b + Q.deck)} stroke={ln} strokeWidth={lw} /> : null}
          <path d={face(Q.Z0)} fill={A.toneH(formTone(STONE_T, 0.42, SHADOW), Q.Z0, hm)} fillRule="evenodd" stroke={ln} strokeWidth={lw} />
          <path d={`M${fx(project(c, Q.X0, b + Q.deck, Q.Z0)[0])},${fx(project(c, Q.X0, b + Q.deck, Q.Z0)[1])}L${fx(project(c, Q.X1, b + Q.deck, Q.Z0)[0])},${fx(project(c, Q.X1, b + Q.deck, Q.Z0)[1])}`} stroke={CREAM} strokeOpacity={0.5 * (1 - A.fogH(Q.Z0, b + Q.deck))} strokeWidth={lw * 1.1} />
        </g>
      ),
    });
  }
  return out;
};

// ===================================================================================================================
// THE LOW HUTS on the plain at the table's foot (before Rome): small round wattle huts with conical thatch
// ===================================================================================================================
export const HUTS = [
  { X: -100, Z: -100, R: 4.6 },
  { X: -89, Z: -91, R: 3.8 },
  { X: -79, Z: -105, R: 4.2 },
];
const THATCH: Mat = { lit: "#B59A5E", mid: "#8F7643", dark: "#4E3F24" };
const WATTLE: Mat = { lit: "#C9B48E", mid: "#A8916B", dark: "#5C4C38" };
const hutItems = (A: TAir, frame: number): Item[] =>
  HUTS.map((h, i) => {
    const c = A.c;
    const g = terrainH(h.X, h.Z);
    const wall = h.R * 1.15;
    const eave = g + wall;
    const apexH = eave + h.R * 1.9;
    const apex = project(c, h.X, apexH, h.Z);
    const N = 28;
    const ring: P2[] = [];
    for (let k = 0; k < N; k++) {
      const t = (k / N) * Math.PI * 2;
      ring.push(project(c, h.X + Math.cos(t) * h.R * 1.18, eave - 0.15, h.Z + Math.sin(t) * h.R * 1.18));
    }
    const hull = (pts: P2[]): P2[] => {
      const q = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo: P2[] = [];
      for (const v of q) {
        while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop();
        lo.push(v);
      }
      const hi: P2[] = [];
      for (const v of q.slice().reverse()) {
        while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], v) <= 0) hi.pop();
        hi.push(v);
      }
      return [...lo.slice(0, -1), ...hi.slice(0, -1)];
    };
    const pth = (q: P2[]) => `M${q.map((v) => `${fx(v[0])},${fx(v[1])}`).join("L")}Z`;
    void hull;
    void ring;
    // the roof: a picture-book cone over the wall, its base the eave ellipse's width plus the overhang
    const ec = project(c, h.X, eave - 0.15, h.Z);
    const rr = rOf(c, h.Z);
    const bx = h.R * 1.22 * rr;
    const by = Math.max(2, Math.abs(project(c, h.X, eave, h.Z - h.R)[1] - project(c, h.X, eave, h.Z + h.R)[1]) / 2) * 1.1;
    const roofD = `M${fx(apex[0])},${fx(apex[1])}L${fx(ec[0] + bx)},${fx(ec[1])}A${fx(bx)},${fx(by)} 0 0 1 ${fx(ec[0] - bx)},${fx(ec[1])}Z`;
    const front: P2[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = (k / 16) * Math.PI;
      front.push([ec[0] + Math.cos(t) * bx, ec[1] + Math.sin(t) * by]);
    }
    // the door: a dark opening at the wall's front
    const fb: P2 = [project(c, h.X, g, h.Z)[0] - h.R * 0.15 * rOf(c, h.Z), project(c, h.X, g, h.Z)[1] + Math.abs(project(c, h.X, g, h.Z - h.R)[1] - project(c, h.X, g, h.Z + h.R)[1]) / 2];
    const dw = h.R * 0.24 * rr;
    const dh = wall * 0.7 * rr;
    const door: P2[] = [[fb[0] - dw, fb[1]], [fb[0] + dw, fb[1]], [fb[0] + dw, fb[1] - dh * 0.8], [fb[0], fb[1] - dh], [fb[0] - dw, fb[1] - dh * 0.8]];
    const lw = lwAt(c, h.Z);
    // a thin wisp of smoke from the first hut's roof, drifting with the wind
    let wisp: React.ReactNode = null;
    if (i === 0) {
      const pts: P2[] = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        pts.push(project(c, h.X - 0.3 - t * 3.5 + Math.sin(frame / 14 + t * 4) * 0.5 * t, apexH + 0.2 + t * 9, h.Z));
      }
      wisp = <path d={`M${pts.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}`} fill="none" stroke={A.toneH("#D8CFC0", h.Z, apexH + 4)} strokeWidth={fx(Math.max(1.2, 0.5 * rOf(c, h.Z)))} strokeLinecap="round" strokeOpacity={0.35} />;
    }
    return {
      d: h.Z,
      key: `hut${i}`,
      el: (
        <g key={`hut${i}`}>
          <AirShadow A={A} X={h.X} Z={h.Z} w={h.R * 1.4} d={h.R * 1.1} uid={`hs${i}`} amt={0.75} Y={-g} />
          <AirCyl A={A} X={h.X} Z={h.Z} R={h.R} Y0={-eave} Y1={-g} mat={WATTLE} uid={`hw${i}`} lw={lw} />
          <path d={pth(door)} fill={A.toneH("#2E241B", h.Z, g + 1)} />
          <path d={roofD} fill={A.toneH(formTone(THATCH, 0.4, SHADOW), h.Z, eave + 1)} stroke={A.toneH(lineOf(THATCH), h.Z, eave)} strokeWidth={lw} strokeLinejoin="round" />
          <path d={`M${front.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}`} fill="none" stroke={A.toneH(THATCH.dark, h.Z, eave)} strokeWidth={fx(Math.max(1, 0.18 * rOf(c, h.Z)))} strokeLinecap="round" />
          {wisp}
        </g>
      ),
    };
  });

// ===================================================================================================================
// ROME'S CLIMB: a cascade of four watermills (after Barbegal) stepped up the ramp at the table's front, fed from the
// castellum at the aqueduct's west end
// ===================================================================================================================
export const MILLS = { Z: TABLE.zF + 7.2, xs: [-58, -71, -85, -99, -113], hw: 2.4, d: 2.2, wall: 3.2, rise: 1.6, R: 1.75, wheelZ: TABLE.zF + 3.6 };
const millFloor = (X: number) => Math.max(tableH(X - MILLS.hw), tableH(X + MILLS.hw)) + 0.3;
const TIMBER = MAT.timber;
const WATER = "#CFE3DC";
/** the castellum: a stone tank at the aqueduct's west end, where the water is let down to the mills */
export const CASTELLUM = { X0: -56.5, X1: -51.5, h1: TABLE.HT + 6, Z0: -40, Z1: -33 };
/** the leat: a main channel running down the ramp BEHIND the mill houses (they hide most of it), from the castellum,
 *  with a short feeder chute from it forward over each wheel (overshot) */
const LEAT_Z = MILLS.Z + MILLS.d + 1.4;
const wheelTop = (X: number) => millFloor(X) + 1.4 + MILLS.R;
const leatPts = (): V3[] => {
  const K = CASTELLUM;
  const pts: V3[] = [[K.X0 + 0.3, K.h1 - 0.8, K.Z0 + 0.5], [K.X0 - 1.0, K.h1 - 1.2, LEAT_Z]];
  MILLS.xs.forEach((X) => pts.push([X + 2.2, wheelTop(X) + 1.1, LEAT_Z]));
  return pts;
};
const feederPts = (X: number): V3[] => [
  [X + 2.2, wheelTop(X) + 1.1, LEAT_Z],
  [X + 0.8, wheelTop(X) + 0.6, MILLS.wheelZ + 0.1],
  [X + 0.1, wheelTop(X) + 0.45, MILLS.wheelZ + 0.1],
];
const Wheel: React.FC<{ A: TAir; X: number; h: number; Z: number; R: number; ang: number }> = ({ A, X, h, Z, R, ang }) => {
  const c = A.c;
  const r = rOf(c, Z);
  const p = project(c, X, h, Z);
  const col = A.toneH(TIMBER.mid, Z, h);
  const dark = A.toneH(TIMBER.dark, Z, h);
  const lit = A.toneH(TIMBER.lit, Z, h);
  const lw = Math.max(0.6, 0.12 * r);
  const spokes: string[] = [];
  const paddles: string[] = [];
  const NP = 12;
  for (let i = 0; i < NP; i++) {
    const t = ang + (i / NP) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    if (i % 2 === 0) spokes.push(`M${fx(p[0])},${fx(p[1])}L${fx(p[0] + ct * R * 0.9 * r)},${fx(p[1] + st * R * 0.9 * r)}`);
    const a0: P2 = [p[0] + ct * R * 0.86 * r, p[1] + st * R * 0.86 * r];
    const a1: P2 = [p[0] + ct * R * 1.14 * r, p[1] + st * R * 1.14 * r];
    paddles.push(`M${fx(a0[0])},${fx(a0[1])}L${fx(a1[0])},${fx(a1[1])}`);
  }
  return (
    <g>
      <circle cx={fx(p[0] + 0.12 * r)} cy={fx(p[1] - 0.05 * r)} r={fx(R * r)} fill="none" stroke={dark} strokeWidth={fx(lw * 1.2)} />
      <path d={paddles.join("")} stroke={dark} strokeWidth={fx(lw * 1.5)} strokeLinecap="round" />
      <path d={spokes.join("")} stroke={col} strokeWidth={fx(lw)} strokeLinecap="round" />
      <circle cx={fx(p[0])} cy={fx(p[1])} r={fx(R * r)} fill="none" stroke={col} strokeWidth={fx(lw * 1.3)} />
      <circle cx={fx(p[0])} cy={fx(p[1])} r={fx(R * 0.86 * r)} fill="none" stroke={lit} strokeOpacity={0.55} strokeWidth={fx(lw * 0.45)} />
      <circle cx={fx(p[0])} cy={fx(p[1])} r={fx(0.24 * r)} fill={dark} />
    </g>
  );
};
const millItems = (A: TAir, frame: number): Item[] => {
  const c = A.c;
  const out: Item[] = [];
  MILLS.xs.forEach((X, i) => {
    const g = millFloor(X);
    const gMin = Math.min(tableH(X - MILLS.hw - 0.4), tableH(X + MILLS.hw + 0.4)) - 0.6;
    const Z0 = MILLS.Z - MILLS.d;
    const Z1 = MILLS.Z + MILLS.d;
    out.push({
      d: MILLS.Z,
      key: `mh${i}`,
      el: (
        <g key={`mh${i}`}>
          <Solid A={A} faces={boxFaces(X - MILLS.hw - 0.4, X + MILLS.hw + 0.4, gMin, g, Z0 - 0.4, Z1 + 0.4, STONE_T)} />
          <Solid A={A} faces={boxFaces(X - MILLS.hw, X + MILLS.hw, g, g + MILLS.wall, Z0, Z1, PLASTER)} />
          <Solid A={A} faces={gableFaces(X - MILLS.hw - 0.3, X + MILLS.hw + 0.3, g + MILLS.wall, g + MILLS.wall + MILLS.rise, Z0 - 0.3, Z1 + 0.3, TILE, "x", PLASTER)} />
        </g>
      ),
    });
    // the wheel in its pit at the mill's front, turning with the water (overshot: the near side goes down)
    out.push({ d: MILLS.wheelZ, key: `mw${i}`, el: <Wheel key={`mw${i}`} A={A} X={X + 0.3} h={g + 1.4} Z={MILLS.wheelZ} R={MILLS.R} ang={frame * 0.075 + i * 0.7} /> });
  });
  {
    const K = CASTELLUM;
    const g = TABLE.HT;
    out.push({ d: (K.Z0 + K.Z1) / 2, key: "cast", el: <Solid key="cast" A={A} faces={boxFaces(K.X0, K.X1, g - 0.5, K.h1, K.Z0, K.Z1, STONE_T)} /> });
  }
  // the leat: the main channel behind the houses, the feeders over the wheels, water falling onto each wheel
  const Zl = MILLS.wheelZ + 0.1;
  const r = rOf(c, Zl);
  const lw = Math.max(1, 0.5 * r);
  const pl = (q: V3[]) => `M${q.map((p) => project(c, p[0], p[1], p[2])).map((v) => `${fx(v[0])},${fx(v[1])}`).join("L")}`;
  const main = pl(leatPts());
  const rb = rOf(c, LEAT_Z);
  const lwb = Math.max(0.8, 0.5 * rb);
  const feeders = MILLS.xs.map((X) => pl(feederPts(X))).join("");
  const falls = MILLS.xs
    .map((X) => {
      const a = project(c, X + 0.1, wheelTop(X) + 0.3, Zl - 0.2);
      const b = project(c, X - MILLS.R * 0.7, wheelTop(X) - MILLS.R * 0.7, Zl - 0.2);
      return `M${fx(a[0])},${fx(a[1])}Q${fx(a[0] - 0.9 * r)},${fx(a[1])} ${fx(b[0])},${fx(b[1])}`;
    })
    .join("");
  const hm = 40;
  out.push({
    d: LEAT_Z,
    key: "leatmain",
    el: (
      <g key="leatmain">
        <path d={main} fill="none" stroke={A.toneH(STONE_T.mid, LEAT_Z, hm)} strokeWidth={fx(lwb)} strokeLinejoin="round" strokeLinecap="round" />
        <path d={main} fill="none" stroke={A.toneH(STONE_T.lit, LEAT_Z, hm)} strokeWidth={fx(lwb * 0.3)} strokeLinejoin="round" strokeOpacity={0.6} transform={`translate(0,${fx(-lwb * 0.3)})`} />
      </g>
    ),
  });
  out.push({
    d: Zl - 0.3,
    key: "leat",
    el: (
      <g key="leat">
        <path d={feeders} fill="none" stroke={A.toneH(STONE_T.mid, Zl, hm)} strokeWidth={fx(lw)} strokeLinejoin="round" strokeLinecap="round" />
        <path d={feeders} fill="none" stroke={A.toneH(STONE_T.lit, Zl, hm)} strokeWidth={fx(lw * 0.3)} strokeLinejoin="round" strokeOpacity={0.6} transform={`translate(0,${fx(-lw * 0.3)})`} />
        <path d={falls} fill="none" stroke={A.toneH(WATER, Zl, hm)} strokeWidth={fx(lw * 0.42)} strokeLinecap="round" strokeOpacity={0.55 + 0.15 * Math.sin(frame / 3.3)} />
      </g>
    ),
  });
  void lwAt;
  return out;
};

// ===================================================================================================================
// THE CURL: the climb Rome never continued: a dashed orange line leaving the top of the rise (where the real ground
// levels into the plateau) at the rise's own slope, curling up ever steeper over the town, fading into nothing
// ===================================================================================================================
export const CURL0 = { X: TABLE.xTop, Z: TABLE.zF + 1.5, T: 42, A: 8, L: 16 };
type Curl = typeof CURL0;
const S0 = { X: CURL0.X, h: tableH(CURL0.X), Z: CURL0.Z };
const curlAt = (R: Curl, u: number): V3 => {
  const t = u * R.T;
  return [S0.X + t, S0.h + R.A * (Math.exp(t / R.L) - 1), S0.Z];
};
/** the line's opacity along it: full from the rise, dissolving over its last part */
const FADE = { from: 0.6, to: 1 };
const fadeAt = (v: number) => 1 - smoothstep(FADE.from, FADE.to, v) * 0.97;
const DASH = { P: 46, duty: 0.6, w: 8.5, wEnd: 7 };
/** the drawing: on "drives" the tip leaves the top of the rise and climbs at an even screen pace to "gain" */
export const DRAW = { a: 80, b: 150 };
const NS = 96;
type Poly = { pts: P2[]; vs: number[]; cum: number[] };
const curlPoly = (c: TCam, R: Curl): Poly => {
  const pts: P2[] = [];
  const vs: number[] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= NS; i++) {
    const v = i / NS;
    const p = curlAt(R, v);
    pts.push(project(c, p[0], p[1], p[2]));
    vs.push(v);
    if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, vs, cum };
};
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
const dashesOf = (q: Poly, upTo = Infinity): [number, number][] => {
  const tot = q.cum[q.cum.length - 1];
  const out: [number, number][] = [];
  for (let px = 0; px < Math.min(tot, upTo + DASH.P); px += DASH.P) out.push([vAtLen(q, px), vAtLen(q, Math.min(tot, px + DASH.P * DASH.duty))]);
  return out;
};
const subPath = (c: TCam, R: Curl, v0: number, v1: number) => {
  const n = Math.max(2, Math.ceil(NS * (v1 - v0)));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = curlAt(R, v0 + ((v1 - v0) * i) / n);
    const q = project(c, p[0], p[1], p[2]);
    d += `${i ? "L" : "M"}${fx(q[0])},${fx(q[1])}`;
  }
  return d;
};
export const curlTip = (f: number) => {
  const st = curlState(CURL0, f);
  const p = curlAt(CURL0, st.u);
  return project(camAt(f), p[0], p[1], p[2]);
};
const DashedCurl: React.FC<{ A: TAir; R: Curl; dashes: [number, number][]; u: number; w: number; tipGlow: number; uid: string }> = ({ A, R, dashes, u, w, tipGlow, uid }) => {
  const c = A.c;
  if (u <= 0) return null;
  const tip = curlAt(R, u);
  const tp = project(c, tip[0], tip[1], tip[2]);
  const mid = curlAt(R, u / 2);
  const col = A.toneOH(ACCENT, mid[2], mid[1]);
  const segs: React.ReactNode[] = [];
  for (const [v0, v1raw] of dashes) {
    if (v0 >= u) break;
    const v1 = Math.min(u, v1raw);
    if (v1 > v0 + 1e-4) segs.push(<path key={v0} d={subPath(c, R, v0, v1)} stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={fadeAt((v0 + v1) / 2)} />);
  }
  // the glow under it, in pieces so it dissolves with the line
  const glow: React.ReactNode[] = [];
  const NG = 8;
  for (let k = 0; k < NG; k++) {
    const v0 = (u * k) / NG;
    const v1 = (u * (k + 1)) / NG;
    glow.push(<path key={k} d={subPath(c, R, v0, v1)} stroke={col} strokeWidth={w * 3} strokeLinecap="round" opacity={0.2 * fadeAt((v0 + v1) / 2)} fill="none" />);
  }
  return (
    <g>
      <defs>
        <filter id={`${uid}-gl`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={w * 0.9} />
        </filter>
        <radialGradient id={`${uid}-tip`}>
          <stop offset="0" stopColor="#FFEBC0" stopOpacity={0.95} />
          <stop offset="0.28" stopColor={ACCENT} stopOpacity={0.6} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter={`url(#${uid}-gl)`}>{glow}</g>
      {segs}
      {tipGlow > 0.01 ? <circle cx={fx(tp[0])} cy={fx(tp[1])} r={fx(w * 3.2)} fill={`url(#${uid}-tip)`} opacity={tipGlow * fadeAt(u)} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE CAMERA: one pull-back, up and out, from the turning wheels of the cascade to the plateau seen across, low, as a
// profile: the flat of the earlier ages at the left, Rome's rise with its mills, the level top with the town
// ===================================================================================================================
/** the anchor the camera holds near the middle: the cascade's middle, then the top of the rise */
const ANCH0: V3 = [MILLS.xs[1] + 0.3, millFloor(MILLS.xs[1]) + 1.4, MILLS.wheelZ];
const ANCH1: V3 = [S0.X, S0.h, S0.Z];
export const CAMK = {
  D: [15, 121] as [number, number],
  F: [1500, 840] as [number, number],
  ox: [0.25, 0.2] as [number, number],
  oy: [0.3, 0.03] as [number, number],
  q0: [520, 900] as P2,
  q1: [700, 960] as P2,
};
/** the air's visibility, kept at the world's for the high-eye scenes it was tuned on, eased for this low eye */
export const FOG_VIS = 120;
const SPEED = (f: number) => 0.05 + 0.95 * smoothstep(14, 62, f) * (1 - smoothstep(82, 175, f));
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
  const e = smoothstep(0, 1, p);
  const an: V3 = [lerp(ANCH0[0], ANCH1[0], e), lerp(ANCH0[1], ANCH1[1], e), lerp(ANCH0[2], ANCH1[2], e)];
  const D = logLerp(CAMK.D[0], CAMK.D[1], p);
  const F = logLerp(CAMK.F[0], CAMK.F[1], p);
  const X = an[0] + lerp(CAMK.ox[0], CAMK.ox[1], p) * D;
  const H = an[1] + lerp(CAMK.oy[0], CAMK.oy[1], p) * D + 1.5;
  const Z = an[2] - D;
  const qx = lerp(CAMK.q0[0], CAMK.q1[0], e);
  const qy = lerp(CAMK.q0[1], CAMK.q1[1], e);
  return { X, H, Z, F, sx: qx - 540 - (F * (an[0] - X)) / D, hr: qy - (F * (H - an[1])) / D };
};
const withSway = (c: TCam, f: number): TCam => {
  const s = sway(f);
  return { ...c, sx: c.sx + s.dx, hr: c.hr + s.dy };
};
export const CAM_F0 = camAt(0);

const curlState = (R: Curl, f: number) => {
  const cB = camAt(DRAW.b);
  const polyB = curlPoly(cB, R);
  const lenB = polyB.cum[polyB.cum.length - 1];
  if (f >= DRAW.b) return { u: 1, dashes: dashesOf(polyB), drawing: false };
  if (f <= DRAW.a) return { u: 0, dashes: [] as [number, number][], drawing: true };
  const c = camAt(f);
  const poly = curlPoly(c, R);
  const target = (lenB / (DRAW.b - DRAW.a)) * (f - DRAW.a);
  return { u: vAtLen(poly, target), dashes: dashesOf(poly, target), drawing: true };
};

/** the frame's foot sinks into the dense low air (the style's height ramp) */
export const LOW_AIR = { y0: 1110, y1: 1920, amt: 0.72 };
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
  const A = airOf(c, frame, CAM_F0, { fogVis: probeVis > 0 ? probeVis : FOG_VIS });
  const R: Curl = probeRamp ? { ...CURL0, ...JSON.parse(probeRamp) } : CURL0;
  const st = curlState(R, probeU >= 0 ? (probeU >= 1 ? DRAW.b : lerp(DRAW.a, DRAW.b, probeU)) : frame);
  const rB = rOf(camAt(DRAW.b), S0.Z);
  const w = st.drawing ? DASH.w : Math.max(DASH.wEnd, Math.min(DASH.w, DASH.w * Math.pow(rOf(c, S0.Z) / rB, 0.5)));
  const tipGlow = smoothstep(0, 0.05, st.u) * (st.drawing ? 1 : 1 - smoothstep(DRAW.b, DRAW.b + 20, frame));
  const extras: Item[] = [
    { d: TABLE.zB + 0.5, key: "tabletop", el: <TableTop key="tabletop" A={A} /> },
    ...townItems(A),
    ...millItems(A, frame),
    ...hutItems(A, frame),
    { d: TABLE.zF - 0.02, key: "tableface", el: <TableFace key="tableface" A={A} /> },
    { d: S0.Z - 0.5, key: "curl", el: <DashedCurl key="curl" A={A} R={R} dashes={st.dashes} u={st.u} w={w} tipGlow={tipGlow} uid="pc" /> },
  ];
  return (
    <AirStage v={A.v} bloom={0.25}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
          <TakeoffWorld A={A} frame={frame} font={cinzel} extras={extras} hide={{ figures: true, town: true, industry: true, milestones: true, train: true, smoke: true }} />
          <LowAir A={A} amt={LOW_AIR.amt} />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

export default PrecociouslyFar;
