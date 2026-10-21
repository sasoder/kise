// ---------------------------------------------------------------------------
// romeCast: the engraved ROMAN cast of the Kyle Harper clip "Slavery didn't stop Rome from industrializing"
// (Dwarkesh Patel, Oct 2026). Dwarkesh map style "People and crowds" in londonCastV2's manner (the approved London
// cast): heads drawn here (three-quarter faces, hair volumes that turn with the head's yaw), the V2 hand, cream form
// on a dark casing, a firm dark outline, hatching, light from the upper left, the `shade` form shadow (default 0).
// Built ON the texcoco rig (figureRig / figureAnchors only; the rig is neither edited nor forked). Helpers that
// londonCastV2 does not export are COPIED here (its file is read-only for this clip).
//
// WHO (read at a glance, on a phone):
//   Slave     cropped hair (some bearded), a coarse short tunic belted at the waist with a ragged hem, bare arms
//             and BARE FEET. garb "tunic" | "exomis" (one shoulder bare, heavy labour) | "loincloth" (the mine).
//             fetters (iron rings at both ankles + a sagging chain that follows the feet every frame), collar (an
//             iron neck ring). variant 0..4 (3 = a woman: long belted tunic, hair tied back).
//   Freeman   a free artisan / shopkeeper: knee tunic, leather apron (apron), the felt pilleus cap (pilleus, on by
//             default), sandals. variant 0..3 (3 = a woman shopkeeper: long tunic, no cap).
//   Dominus   a rich Roman: the toga over a tunic (the balteus across the chest, the umbo, the sinus swag over the
//             thighs, the broad vertical folds to the ankle), the left arm wrapped, curly short hair, a ring, closed
//             shoes. stripe = the senator's broad stripe. variant 0 (prime), 1 (older, heavier), 2 (younger).
//   Overseer  a knee tunic with a short dark cloak pinned at the right shoulder, sandals strapped up the shin, a
//             vine rod (tool "rod", default) or a whip in his fist. variant 0..2.
// (A buyer is a Dominus, an auctioneer an Overseer variant.)
//
// UNITS: figure-local, feet at (0, 0), up is - y, a man ~310 units from the soles to the top of the skull (the
// pilleus adds ~16). scale = world px per unit (scaleForPx(px)). Draw inside the cut's WorldSvg; under a figure put
// londonDepth's ContactShadow. Inks: `ink` = skin, hair, everything (CREAM default; shadeInk(t) / tintInk to dim);
// `cloth` = the garments (default CREAM); `tone` = opacity.
//
// POSES (POSES.*, dir 1 = facing screen right, -1 = left; pure functions; mirrorPose turns any of them):
//   front stand walk gesture point push tread carry grind strike potter recline haul stoop raiseRod
//   (phase-driven ones loop on phase 0..1: walk, push, tread, carry, grind, strike, potter, haul).
// GRIPS: pass `grip={{ L?: worldPt, R?: worldPt }}` (or gripTo) and the figure's own arms are solved so its HAND
//   GRIPS land exactly on those points (a bar, a rail, a handle, a rope). romeAnchors(...) gives the world anchors
//   (headC, headTop, hands, wrists, shoulders, ankles, chest, hip, feet, toolHead, load).
// The props: Amphora, Sack, Basket, Chain, CoinHeap, Couch, PotterWheel, RotaryQuern, Stool, Hammer, Pick, Rod.
// Probe sheets: romeCastProbe.tsx (src/Root.RomeCast.tsx). The cut builders' contract: <notes>/ROME_CAST_READY.md.
// ---------------------------------------------------------------------------
import React from "react";
import { hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { figureAnchors, figureRig, type Spec } from "../kits/maps/texcocoFigures";
import {
  CREAM,
  DARK,
  FPS,
  MAN_UNITS,
  ORANGE,
  STAND,
  WALK,
  WALK_CYCLE,
  headTurn,
  idle,
  lerpFig,
  mirrorPose,
  mixInk,
  poseTrack,
  scaleForPx,
  shadeInk,
  track,
  walkAdvance,
  walkPose,
  type ArmPose,
  type FigPose,
  type Ink,
} from "../kyle-london/londonCastV2";

export { CREAM, DARK, FPS, MAN_UNITS, ORANGE, STAND, WALK, WALK_CYCLE, headTurn, idle, lerpFig, mirrorPose, mixInk, poseTrack, scaleForPx, shadeInk, track, walkAdvance, walkPose };
export type { ArmPose, FigPose, Ink };

// ---------------------------------------------------------------------------
// the engraver's helpers (copied from londonCastV2.tsx, which does not export them)
// ---------------------------------------------------------------------------
const hexRgb = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return r ? [1, 2, 3].map((i) => Number(r[i])) : [0, 0, 0];
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = Math.max(0, Math.min(1, t));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
// ---------------------------------------------------------------------------
// the engraver's helpers (as pearlFiguresV2's / dgFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const ID: Map = (p) => p;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const segD = (segs: Seg[], m: Map = ID) =>
  segs
    .map(([a, b]) => {
      const p = m(a);
      const q = m(b);
      return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 0.8 ? "" : `M${P(p)}L${P(q)}`;
    })
    .join("");
const polyD = (pts: P2[], close = true) => (pts.length ? `M${pts.map(P).join("L")}${close ? "Z" : ""}` : "");
/** (Revision 1) hand-cut hatching ANCHORED: line k lies at offset k * gap from the anchor (default the box's top-left
 *  corner) along the hatch normal, its jitter and ragged ends seeded by k. A moving or resizing box slides its lines
 *  continuously instead of re-indexing them every frame (the old centred version re-seeded and flickered). */
const hatchSegs = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28, ax = x0, ay = y0): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const nx = -dy;
  const ny = dx;
  const R = Math.hypot(x1 - x0, y1 - y0) + 2;
  const offs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => (x - ax) * nx + (y - ay) * ny);
  const k0 = Math.ceil(Math.min(...offs) / gap) - 1;
  const k1 = Math.floor(Math.max(...offs) / gap) + 1;
  const out: Seg[] = [];
  for (let i = k0; i <= k1; i++) {
    const hi = i + 4096;
    const oo = i * gap + (hash(hi, seed) - 0.5) * gap * 0.5;
    const px = ax + nx * oo;
    const py = ay + ny * oo;
    let t0 = -1e9;
    let t1 = 1e9;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (!(span > 0.5) || span > 4 * R) continue;
    t0 += hash(hi, seed + 7) * rag * span;
    t1 -= hash(hi, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28, ax = x0, ay = y0) => segD(hatchSegs(x0, y0, x1, y1, ang, gap, seed, rag, ax, ay));
const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return `${d}Z`;
};
type St = [P2, number];
const tightEnds = (st0: St[]): St[] => {
  if (st0.length < 2) return st0;
  const out: St[] = [st0[0]];
  for (let i = 1; i < st0.length; i++) {
    const a = st0[i - 1];
    const b = st0[i];
    const n = Math.max(1, Math.ceil(vlen(sub(b[0], a[0])) / 12));
    for (let j = 1; j <= n; j++) out.push([mix2(a[0], b[0], j / n), mix(a[1], b[1], j / n)]);
  }
  return out;
};
const limbD = (st0: St[]) => {
  const st = tightEnds(st0);
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const a = st[Math.max(0, i - 1)][0];
    const b = st[Math.min(n - 1, i + 1)][0];
    const dv = sub(b, a);
    const u = vlen(dv) > 0.5 ? norm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    const h = st[i][1] / 2;
    L.push(add(st[i][0], mul(nr, h)));
    R.push(add(st[i][0], mul(nr, -h)));
  }
  const d0 = sub(st[1][0], st[0][0]);
  const d1 = sub(st[n - 1][0], st[n - 2][0]);
  const u0: P2 = vlen(d0) > 0.5 ? norm(d0) : [0, 1];
  const u1: P2 = vlen(d1) > 0.5 ? norm(d1) : [0, 1];
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
const braceletD = (a: P2, b: P2, wa: number, wb: number, seed: number, gap = 3.1, reach = 1) => {
  const L = vlen(sub(b, a));
  if (L < 9) return "";
  const u = norm(sub(b, a));
  let n: P2 = [-u[1], u[0]];
  if (n[0] + n[1] * 0.6 < 0) n = [-n[0], -n[1]];
  let d = "";
  let i = 0;
  for (let t = 4; t < L - 3; t += gap, i++) {
    const tt = t / L;
    const c = mix2(a, b, tt);
    const w = mix(wa, wb, tt);
    const p0 = add(c, mul(n, w * (0.5 - reach * (0.44 - 0.2 * hash(i, seed)))));
    const p1 = add(c, mul(n, w / 2 - 0.7));
    d += `M${P(p0)}Q${P(add(mix2(p0, p1, 0.5), mul(u, 1.7)))} ${P(p1)}`;
  }
  return d;
};
const quad = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);
const foldHatchSegs = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.045): Seg[] => {
  const out: Seg[] = [];
  let i = 0;
  for (let t = 0.16; t < 0.97; t += step, i++) {
    const p = quad(a, c, b, t);
    const l = (2.5 + len * t) * (0.55 + 0.75 * hash(i, seed));
    out.push([p, [p[0] + l * 0.86, p[1] + l * 0.5]]);
  }
  return out;
};
const blendYaw = (front: P2[], prof: P2[], yaw: number): P2[] => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  return front.map((f, i) => {
    const p = mix2(f, prof[i], t);
    return s < 0 ? [-p[0], p[1]] : p;
  });
};
/** a dark casing round a form, so it reads on the umber page */
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.6, children }) => (
  <>
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.42} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.68} />
      <feComposite in2="soft" operator="in" result="case" />
      <feMerge>
        <feMergeNode in="case" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g filter={`url(#${id})`}>{children}</g>
  </>
);
/** the body as a turned elliptical column (texcocoFigures' surface) */
const surface = (theta: number, A: number, B: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const wf = Math.hypot(A * c, B * s) / A;
  const term = Math.atan2(A * c, B * s);
  const flat = Math.abs(s) < 1e-6;
  const mF: Map = (p) => {
    if (flat) return p;
    const xc = clamp1(p[0] / A) * A;
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    return [A * Math.sin(ph) * c + B * Math.cos(ph) * s + (p[0] - xc) * wf, p[1]];
  };
  const side: Map = (p) => [p[0] * wf, p[1]];
  return { c, s, wf, mF, side };
};
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const circ = (c: P2, r: number, n = 10): P2[] => Array.from({ length: n }, (_, i): P2 => [c[0] + r * Math.cos((i * 2 * Math.PI) / n), c[1] + r * Math.sin((i * 2 * Math.PI) / n)]);
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const closestOnSeg = (p: P2, a: P2, b: P2): P2 => {
  const d = sub(b, a);
  const L2 = dot(d, d) || 1e-9;
  return add(a, mul(d, c01(dot(sub(p, a), d) / L2)));
};
type Bone = { a: P2; b: P2; r: number };
const bottomAt = (poly: P2[], x: number) => {
  let y = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) y = Math.max(y, mix(a[1], b[1], (x - a[0]) / (b[0] - a[0])));
  }
  return y;
};

// ---------------------------------------------------------------------------
// FACE BUILDS AND HAIR COLOURS
// ---------------------------------------------------------------------------
/** plain / full (round, a soft second chin) / lean (long jaw) / soft (a woman's: a narrower, rounder chin) */
type FaceBuild = "plain" | "full" | "lean" | "soft";
/** small per-man differences: nose length, a hooked bridge, the brow's arch and weight */
type FaceCut = { nose: number; hook: number; arch: number; browW: number };
/** a hair colour: the lit band, the body of the mass, the shadow (full-strength hex; dimmed with the ink) */
type HairTone = { light: string; base: string; deep: string };
const HAIR_TONES = {
  darkBrown: { light: "#977B5C", base: "#6F5640", deep: "#4A3828" },
  blackBrown: { light: "#7E6650", base: "#58463A", deep: "#3A2E24" },
  chestnut: { light: "#B78E62", base: "#8C6745", deep: "#5F4430" },
  midBrown: { light: "#B59C77", base: "#8E7555", deep: "#64513A" },
  fair: { light: "#E2D0A6", base: "#C6AF82", deep: "#98835C" },
  grey: { light: "#DAD4C3", base: "#B3AC9B", deep: "#857F70" },
  greyBrown: { light: "#D2C9B0", base: "#A99E86", deep: "#7A715E" },
} satisfies Record<string, HairTone>;
const HEAD_F: P2[] = [[0, -33], [11, -31], [18, -24.5], [20.5, -15], [21, -5], [20.6, 3], [19.4, 11], [16.4, 18.5], [11.5, 24.5], [5.5, 27.6], [0, 28.2], [-5.5, 27.6], [-11.5, 24.5], [-16.4, 18.5], [-19.4, 11], [-20.6, 3], [-21, -5], [-20.5, -15], [-18, -24.5], [-11, -31]];
const HEAD_P: P2[] = [[-2, -34], [9, -32.5], [16, -27], [19, -18], [20.2, -9], [18.6, -1.5], [19, 8], [19.6, 14.2], [18.6, 19.6], [18.4, 24.4], [14.5, 28.6], [6.5, 28.4], [-1, 24.5], [-6.5, 18.5], [-9.5, 11], [-13.5, 4], [-20.5, -4], [-23.5, -15], [-21, -26], [-12, -32.5]];
/** the face outline of a build: Pepys's fuller jaw and soft second chin, the lean man's long jaw */
const headPts = (build: FaceBuild, yaw: number): P2[] => {
  // the jaw and chin (front points 5..15) drawn toward a rounded curve: a soft jaw, never a box; the full face
  // wider and rounder through the cheeks, the lean face narrower toward a longer chin
  const [rx, ry, taper, k] = build === "full" ? [22.4, 27.6, 0, 0.75] : build === "lean" ? [20, 28.6, 0.16, 0.55] : build === "soft" ? [19.4, 26.2, 0.2, 0.7] : [20.8, 27, 0.06, 0.6];
  const f = HEAD_F.map((p, i): P2 => {
    if (i < 5 || i > 15) return build === "soft" ? [p[0] * 0.96, p[1]] : build === "full" ? [p[0] * (i === 4 || i === 16 ? 1.04 : 1), p[1]] : build === "lean" ? [p[0] * 0.97, p[1]] : p;
    const th = ((i - 5) / 10) * Math.PI;
    const e: P2 = [rx * Math.cos(th) * (1 - taper * Math.sin(th)), 2 + ry * Math.sin(th)];
    return mix2(p, e, k);
  });
  const pr = HEAD_P.map((p, i): P2 => {
    // the full face: a rounder chin and a soft second chin under the jaw
    if (build === "full") return [p[0] + ([9, 10].includes(i) ? 0.6 : i === 11 ? -1 : i === 12 ? -1.5 : 0), p[1] + ([9, 10].includes(i) ? 1.2 : i === 11 ? 2.6 : i === 12 ? 2.8 : 0)];
    if (build === "lean") return [p[0] + ([11, 12].includes(i) ? 1 : 0), p[1] + ([8, 9, 10, 11].includes(i) ? 2.4 : 0)];
    return [p[0] + (i === 10 ? -0.8 : 0), p[1] + (i === 10 ? 0.6 : 0)];
  });
  return blendYaw(f, pr, yaw);
};

/** the ink's level between the page (0) and full cream (1): hair colours dim with the figure */
const lum = (h: string) => {
  const [r, g, b] = hexRgb(h);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};
const LAND_HEX = "#3F3428";
const inkLevel = (ink: Ink) => c01((lum(ink.main) - lum(LAND_HEX)) / (lum(CREAM.main) - lum(LAND_HEX)));
const dimTone = (t: HairTone, lv: number): HairTone => ({ light: mixHex(LAND_HEX, t.light, lv), base: mixHex(LAND_HEX, t.base, lv), deep: mixHex(LAND_HEX, t.deep, lv) });
/** (addition, DEPTH) the form shadow of one part, light from the upper left: the part minus a copy of itself shifted
 *  toward the light leaves the crescent on its right / lower side; it gets a flat darker tone and hatching. Works at
 *  every yaw because it follows the drawn outline. */
const RimShade: React.FC<{ id: string; d: string; off: [number, number]; box: [number, number, number, number]; col: string; amt: number; seed: number }> = ({ id, d, off, box, col, amt, seed }) =>
  amt <= 0 ? null : (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={box[0] - 60} y={box[1] - 60} width={box[2] - box[0] + 120} height={box[3] - box[1] + 120}>
        <path d={d} fill="white" />
        <path d={d} fill="black" transform={`translate(${(-off[0]).toFixed(2)} ${(-off[1]).toFixed(2)})`} />
      </mask>
      <g mask={`url(#${id})`}>
        <path d={d} fill={col} opacity={Math.min(1, 0.92 * amt)} />
        <path d={hatchD(box[0], box[1], box[2], box[3], 112, 2.7, seed, 0.12)} {...ln(0.85, 0.42 * amt)} />
      </g>
    </>
  );
const bboxOf = (pts: P2[], pad: number): [number, number, number, number] => [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];
type FaceState = { brow: number; lids: number; mouth: number };
/** the face: outline, shading, brows, eyes, nose, mouth, the build's lines; the near ear when no hair covers it */
const FaceArt: React.FC<{ yaw: number; nod: number; face: FaceState; build: FaceBuild; cut: FaceCut; aged: boolean; ears: boolean; ink: Ink; uid: string; shade?: number; beard?: React.ReactNode; moustache?: React.ReactNode; female?: boolean }> = ({ yaw, nod, face, build, cut, aged, ears, ink, uid, shade = 0, beard, moustache, female = false }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  /** how much of a far-side feature is still seen */
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.18) / 0.3) : 1);
  const pts = headPts(build, yaw);
  const HEAD = smoothClosed(pts);
  const xR = Math.max(...pts.map((p) => p[0]));
  const open = 1 - face.lids;
  const b = face.brow;
  const m = face.mouth;
  const full = build === "full";
  const lean = build === "lean";
  const eye = (sd: number) => {
    const v = vis(sd);
    if (v < 0.04) return null;
    const o = pr(sd * 14.2, -0.6, 8.2);
    const mid = pr(sd * 8.4, -1 - 4.4 * open + 2.4 * face.lids, 13.2);
    const inn = pr(sd * 3.3, 0, 14.6);
    const w = Math.abs(inn[0] - o[0]) / 10.9;
    const pu = pr(sd * 8.2, -0.3 + 0.9 * face.lids, 12.8 + 1.4 * t);
    // a calm arch at rest (the inner end level with the outer, never lower); `brow` > 0 knits it
    const bo = pr(sd * 14.8, -8.2 - 0.5 * cut.arch + 2.4 * nod - 1.4 * b, 8.4);
    const bm = pr(sd * 9, -11.4 - 1.3 * cut.arch + nod - 0.5 * Math.abs(b), 13.6);
    const bi = pr(sd * 3, -8.6 - 3 * nod + 2.8 * b, 16.6);
    const lo0 = pr(sd * 12.6, 1.6, 9.4);
    const lo1 = pr(sd * 8, 3.6, 13);
    const lo2 = pr(sd * 4.6, 1.8, 14.2);
    // the upper lid's crease (a little hooded; heavier on the older man)
    const cr0 = pr(sd * 12.8, -3.6, 9.4);
    const cr1 = pr(sd * 8.2, -6.4, 13.4);
    const cr2 = pr(sd * 4.4, -4.2, 14.6);
    return (
      <g key={sd} opacity={v}>
        {/* the far brow, foreshortened, keeps only its inner half (a whole arch folds into a caret) */}
        <path
          d={sd * sg > 0 && t > 0.02 ? `M${P(mix2(bo, bm, 0.55))}Q${P(mix2(bm, bi, 0.35))} ${P(bi)}` : `M${P(bo)}Q${P(bm)} ${P(bi)}`}
          {...ln(2.25 * cut.browW, 0.9 * (sd * sg > 0 && t > 0.02 ? c01((c - 0.68) / 0.15) : 1))}
        />
        <path d={`M${P(cr0)}Q${P(cr1)} ${P(cr2)}`} {...ln(0.85, 0.32)} />
        <path d={`M${P(o)}Q${P(mid)} ${P(inn)}`} {...ln(2, 0.95)} />
        {open > 0.3 ? (
          <>
            <path d={`M${P(lo0)}Q${P(lo1)} ${P(lo2)}`} {...ln(0.95, 0.5 * open)} />
            <ellipse cx={pu[0]} cy={pu[1]} rx={2.5 * Math.max(0.45, Math.min(1, w))} ry={2.5 * (0.55 + 0.45 * open)} fill={DARK} opacity={0.94} />
          </>
        ) : (
          <path d={`M${P(pr(sd * 11, 1.6, 10))}l${-sd * 1.4},1.9M${P(pr(sd * 7.4, 2.3, 13))}l0,2.2`} {...ln(0.9, 0.6)} />
        )}
      </g>
    );
  };
  // the nose: the ridge leaves the face's line as he turns; a nostril wing and its shadow
  const RF = 19;
  const o = -2.4 * clamp1(1 - yaw * 8);
  const nl = cut.nose * (lean ? 1.06 : 1);
  const nRoot: P2 = [RF * s * 0.94 + o * c, -4.2 + fy];
  const nTip: P2 = [(RF + 8.8 * nl) * s + o * 1.55 * c, 9 * nl + fy];
  const nUnder: P2 = [(RF + 4.8) * s - o * 0.1 * c, 11.8 * nl + fy];
  const nWing: P2 = [(RF - 3.2) * s - o * 2.3 * c, 9 * nl + 1.6 * t + fy];
  const nWingIn: P2 = [(RF - 1.8) * s - o * 1.4 * c, 6.2 * nl + t + fy];
  const nBack: P2 = [(RF - 3.2) * s + o * 0.2 * c, -2 + fy];
  const nC1: P2 = [nTip[0] + 0.2 + 0.4 * s, 11.6 * nl + 0.3 * t + fy];
  const nC2: P2 = [mix(nUnder[0], nWing[0], 0.75 - 0.25 * t), 11.8 * nl + 0.4 * t + fy];
  const nC3: P2 = [nWing[0] - 0.2 * (1 - t) - 1.4 * s, 6.8 * nl + 1.3 * t + fy];
  // the bridge: straight, or a little hooked (it shows as he turns)
  const nHook: P2 = add(mix2(nRoot, nTip, 0.45), [cut.hook * 2.2 * s, -cut.hook * 0.6 * t]);
  // the mouth: two halves from the middle, the far one closing; the corners lift with `mouth`
  const my = 17.4 + (lean ? 1 : 0);
  const mc = pr(0, my - 0.5 * nod, 20.2, 0.7);
  const mm = m + 0.12;
  const half = (sd: number) => {
    const far = sd * sg > 0 && t > 0.02;
    const v = far ? c01((c - 0.42) / 0.4) : 1;
    if (v < 0.04) return null;
    const q1 = pr(sd * 3.8, my - 1.1, 18.8, 0.7);
    const q2 = pr(sd * (far ? 7.4 : 8.4), my - 0.4 - 2.4 * mm, 15.2, 0.7);
    const l1 = pr(sd * 4.4, my + 3.6, 16.2, 0.6);
    const l0 = pr(0, my + 5.2, 19.2, 0.6);
    // the smile line from the nose wing round the mouth corner: with the smile; a trace on the fuller face; on the
    // older man these are his two age lines
    const sm = c01(m * 2.2) * 0.75 + (full ? 0.14 : 0) + (aged ? 0.55 : 0);
    const s0 = pr(sd * 6.8, 8.6, 15.8);
    const s1 = pr(sd * 11.6, my - 1.6, 12);
    const s2 = pr(sd * 11, my + 4.4, 11.6);
    return (
      <g key={sd} opacity={v}>
        <path d={`M${P(mc)}Q${P(q1)} ${P(q2)}`} {...ln(2, 0.92)} />
        <path d={`M${P(l0)}Q${P(mix2(l0, l1, 0.6))} ${P(l1)}`} {...ln(female ? 1.5 : 1.2, female ? 0.75 : 0.6)} />
        {sm > 0.05 ? <path d={`M${P(s0)}Q${P(s1)} ${P(s2)}`} {...ln(1.15, Math.min(0.75, sm * 0.7))} /> : null}
      </g>
    );
  };
  const ear = () => {
    // the near ear comes round onto the side of the head as he turns (the far one goes behind)
    const sd = -sg;
    if (!ears || t < 0.12) return null;
    const e = pr(sd * 21, 2.5, -4, 0);
    const w = mix(0.4, 1, t);
    return (
      <g opacity={c01((t - 0.12) * 5)}>
        <ellipse cx={e[0]} cy={e[1]} rx={4.6 * w} ry={7.4} fill={ink.main} {...OUT} strokeWidth={2} />
        <path d={`M${(e[0] - sd * 1.8 * w).toFixed(1)},${(e[1] - 3.6).toFixed(1)}q${(sd * 3.6 * w).toFixed(1)},2.8 ${(sd * 0.8 * w).toFixed(1)},6.8`} {...ln(1.1, 0.65)} />
      </g>
    );
  };
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={HEAD} />
      </clipPath>
      <path d={HEAD} fill={ink.main} {...OUT} strokeWidth={2.5} />
      <RimShade id={`${uid}-rsf`} d={HEAD} off={[11, 4]} box={[-30, -40, 30, 36]} col={ink.deep} amt={shade * 0.9} seed={951} />
      <g clipPath={`url(#${uid}-face)`}>
        {/* the shadow side (screen right, away from the upper-left light): a crescent of hatching, under the jaw */}
        <path d={hatchD(xR - 6.5 + 2 * t, -24, xR + 2, 30, 112, 2.4, 24, 0.18)} {...ln(0.9, 0.5 * (1 - 0.5 * t))} />
        <path d={hatchD(xR - 9, 8, xR + 2, 30, 58, 3, 25, 0.25)} {...ln(0.8, 0.32 * (1 - 0.5 * t))} />
        <path d={hatchD(-16 + 10 * s, 25 + (lean ? 2 : 0), 18 + 10 * s, 32, 4, 2.4, 26, 0.3)} {...ln(0.8, 0.28)} />
        {/* the eye sockets under the brows, the cheekbone's plane */}
        {[-1, 1].map((sd) => {
          const a = pr(sd * 14.6, -4.6, 9);
          const bb = pr(sd * 4.6, -3.4, 15);
          return <path key={`so${sd}`} d={`M${P(a)}Q${P(pr(sd * 9.6, -6.2, 13.4))} ${P(bb)}`} {...ln(5, 0.07 * vis(sd))} />;
        })}
        {t > 0.3 ? <path d={hatchD(sg * -30, -4, sg * -30 + sg * 15, 24, sg > 0 ? 62 : 118, 2.6, 39, 0.3)} {...ln(0.85, 0.3 * c01((t - 0.3) * 3))} /> : null}
      </g>
      <g clipPath={`url(#${uid}-face)`}>{[-1, 1].map(eye)}</g>
      {t > 0.12 ? <path d={`M${P(nRoot)}Q${P(nHook)} ${P(nTip)}L${P(nUnder)}L${P(nWing)}L${P(nBack)}Z`} fill={ink.main} /> : null}
      <path d={`M${P(nRoot)}Q${P(nHook)} ${P(nTip)}Q${P(nC1)} ${P(nUnder)}Q${P(nC2)} ${P(nWing)}Q${P(nC3)} ${P(nWingIn)}`} {...ln(1.9, 0.92)} />
      <path d={[0.25, 0.5, 0.72].map((u) => `M${P(add(mix2(nRoot, nTip, u), [-o * 1.5 * c - 3 * s, 0.6]))}l${(-o * 1.1 * c - 1.6 * s).toFixed(1)},1.4`).join("")} {...ln(0.85, 0.45)} />
      {beard}
      <g clipPath={`url(#${uid}-face)`}>
      {[-1, 1].map(half)}
      {/* the chin: a short arc under the lower lip; the fuller face's second chin; the lean face's hollow cheek */}
      <path d={`M${P(pr(-3.4, my + 9.4, 17.6, 0.4))}Q${P(pr(0, my + 8, 19, 0.4))} ${P(pr(3.4, my + 9.4, 17.6, 0.4))}`} {...ln(1, 0.5)} />
      {full ? <path d={`M${P(pr(-8, 27.2, 13, 0.3))}Q${P(pr(0, 30.4, 16.6, 0.3))} ${P(pr(8, 27.2, 13, 0.3))}`} {...ln(1.1, 0.5)} /> : null}
      {lean && !aged
        ? [-1, 1].map((sd) => <path key={`hc${sd}`} d={`M${P(pr(sd * 15, 5, 9))}Q${P(pr(sd * 16, 12, 8))} ${P(pr(sd * 14, 17, 9.6))}`} {...ln(0.9, 0.3 * vis(sd))} />)
        : null}
      </g>
      {moustache}
      {ear()}
    </g>
  );
};
/** a closed polygon's outline drawn as a scalloped edge: every edge between samples bulges outward (the curls) */
const scallopD = (poly: P2[], bump: (i: number) => number) => {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1];
  const sgn = area > 0 ? -1 : 1;
  let d = `M${P(poly[0])}`;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const e = sub(b, a);
    const L = vlen(e);
    if (L < 0.3) continue;
    const nr: P2 = [(sgn * e[1]) / L, (-sgn * e[0]) / L];
    const h = bump(i) * Math.min(1, L / 6) * 1.33;
    d += `C${P(add(add(a, mul(e, 0.05)), mul(nr, h)))} ${P(add(add(b, mul(e, -0.05)), mul(nr, h)))} ${P(b)}`;
  }
  return `${d}Z`;
};
// ---------------------------------------------------------------------------
// THE HAND (V2): a palm and the four fingers as ONE mass (finger lines inside it), a separate thumb on the body's
// side; open (fist 0) the fingers lie long and a little curled, closed (fist 1) they fold to a knuckled block with
// the thumb across them. Figure-local units at the rig's wrist W, along the rig's hand direction.
// ---------------------------------------------------------------------------
type ArmRigV2 = ReturnType<typeof figureRig>["armL"];
/** (Revision 1) the thumb's side from the arm itself: fixed by the side of the shoulder->wrist line the IK put the
 *  elbow on (the pose's hint picks that side, as in the rig's ik2), so the thumb turns with the forearm and changes
 *  side only when the elbow does. Returns +1 / -1 like the rig's rule. */
const thumbSide = (a: ArmRigV2, hint: P2) => {
  const c = sub(a.W, a.S);
  return -c[1] * hint[0] + c[0] * hint[1] >= 0 ? -1 : 1;
};
const HandV2: React.FC<{ a: ArmRigV2; k: number; ink: Ink; ring?: boolean; hint?: P2 }> = ({ a, k: k0, ink, ring = false, hint }) => {
  // a little larger than V1's hand (x1.1), a slim palm; the relaxed hand curls, its four fingertips separate
  const k = k0 * 1.1;
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const fc = c01(f);
  const open = 1 - fc;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along * k), mul(n, across * k)));
  // the thumb's side (the body's side of the hand; up when the hand lies level) - the rig's rule
  // (Revision 1) with the pose's elbow hint: the thumb on the side away from the elbow (stable through a motion; the
  // rig's angle rule flipped the hand when a level forearm tipped past ~15 deg)
  const ts = hint ? thumbSide(a, hint) : Math.abs(n[0]) > 0.25 ? (n[0] * -sgn >= 0 ? 1 : -1) : n[1] < 0 ? 1 : -1;
  // the fingers curl toward the palm (away from the thumb's back): a relaxed hand already bends at the knuckles
  const curl = mix(30, 82, fc) * -ts;
  const kn = 13; // the knuckles along the hand
  const fd = rot(d, curl * 0.5);
  const fd2 = rot(d, curl);
  const K = (across: number): P2 => at(kn, across);
  // four fingers, the middle ones longest; each tip a small rounded lobe, a notch between them
  const lens = [0.86, 1, 0.97, 0.8];
  const fl = mix(7.5, 14, open);
  const across = [-5.4, -1.8, 1.8, 5.4].map((v) => v * (ts > 0 ? 1 : -1));
  const tipOf = (i: number): P2 => add(add(K(across[i] * 0.95), mul(fd, fl * 0.5 * lens[i] * k)), mul(fd2, fl * 0.5 * lens[i] * k));
  const tn: P2 = [-fd2[1], fd2[0]];
  const order = [0, 1, 2, 3].sort((p, q) => across[p] - across[q]);
  const tipPts: P2[] = [];
  order.forEach((i, idx) => {
    const t = tipOf(i);
    tipPts.push(add(t, mul(tn, -1.5 * k)), add(t, mul(fd2, 1.6 * k)), add(t, mul(tn, 1.5 * k)));
    if (idx < 3) {
      const t2 = tipOf(order[idx + 1]);
      tipPts.push(add(mix2(t, t2, 0.5), mul(fd2, -mix(1.2, 2.4, open) * k)));
    }
  });
  const mass = smoothClosed([at(-1, -6.4), at(6, -7.4), K(-7.6), ...tipPts, K(7.4), at(6, 7.2), at(-1, 6.2)]);
  // the separations: from each notch back toward the knuckles
  const lines = order
    .slice(0, 3)
    .map((i, idx) => {
      const t = tipOf(i);
      const t2 = tipOf(order[idx + 1]);
      const nt = add(mix2(t, t2, 0.5), mul(fd2, -mix(1.2, 2.4, open) * k));
      const back = add(nt, mul(fd, -mix(3, 6.5, open) * k));
      return `M${P(nt)}L${P(back)}`;
    })
    .join("");
  const knuck = fc > 0.5 ? [-0.5, 0, 0.5].map((v) => `M${P(K(v * 7.4 - 2))}q${P(mul(fd, 1.4 * k))} ${P(mul(n, 4 * k))}`).join("") : "";
  // the thumb: from the base of the palm on its own side, out and forward (open), across the fingers (closed)
  const tb = at(4.5, ts * 6.4);
  const tdir = rot(d, ts * mix(-18, 26, open));
  const tl = mix(8, 10, open);
  const tTip = add(add(tb, mul(tdir, tl * k)), mul(n, -ts * mix(3.5, 0, open) * k));
  const thumb = limbD([
    [add(tb, mul(tdir, -2.5 * k)), 5.6 * k],
    [add(tb, mul(tdir, tl * 0.5 * k)), 4.9 * k],
    [tTip, 3.7 * k],
  ]);
  return (
    <g>
      <path d={mass} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={lines} {...ln(1.05, 0.75)} />
      {knuck ? <path d={knuck} {...ln(1.1, 0.6 * (fc - 0.5) * 2)} /> : null}
      {/* the shadow side of the hand */}
      <path d={braceletD(at(1, 0), at(kn, 0), 14 * k, 14 * k, 91, 2.8, 0.5)} {...ln(0.8, 0.4)} />
      {/* (rome) a ring on the fourth finger, at the knuckle */}
      {ring ? <path d={`M${P(add(K(across[ts > 0 ? 2 : 1] * 0.95 - 2.4), mul(fd, 2.6 * k)))}L${P(add(K(across[ts > 0 ? 2 : 1] * 0.95 + 2.4), mul(fd, 2.6 * k)))}`} fill="none" stroke={DARK} strokeWidth={2.6 * k} strokeLinecap="round" /> : null}
      <path d={thumb} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={`M${P(add(tb, mul(tdir, tl * 0.6 * k)))}l${P(mul(rot(tdir, 90 * ts), 2 * k))}`} {...ln(0.9, 0.45)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// (Revision 1) CONTINUOUS CLOTH: the drape and the resample are continuous functions of the pose
// ---------------------------------------------------------------------------
const sstep01 = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
/** cloth lies ON what holds it up, continuously: every upward-facing edge is subdivided and pulled onto the nearest
 *  bone surface with a weight that fades in with how much the edge faces up and how long it is (no toggles), the
 *  bones blended by a soft minimum (no jump when two bones are equally near) */
const drapeC = (poly: P2[], bns: Bone[], up = -0.25, step = 5): P2[] => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) area += poly[i][0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * poly[i][1];
  const sgn = area > 0 ? 1 : -1;
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a);
    const d = sub(b, a);
    const L = vlen(d);
    if (L < 0.5) continue;
    // the outward normal from the polygon's orientation
    const n: P2 = [(sgn * d[1]) / L, (-sgn * d[0]) / L];
    const w = sstep01((up - n[1]) / 0.3) * sstep01((L - 3) / 8);
    if (w <= 0) continue;
    const m = Math.max(2, Math.ceil(L / step));
    for (let j = 1; j < m; j++) {
      const p = mix2(a, b, j / m);
      let dmin = Infinity;
      const cand = bns.map((bn) => {
        const qq = closestOnSeg(p, bn.a, bn.b);
        const v = sub(p, qq);
        const dd = vlen(v) - bn.r;
        dmin = Math.min(dmin, dd);
        return { dd, t: add(qq, mul(vlen(v) > 1e-6 ? norm(v) : [0, -1], bn.r)) };
      });
      let ws = 0;
      let acc: P2 = [0, 0];
      let dsum = 0;
      for (const c of cand) {
        const e = Math.exp(-(c.dd - dmin) / 3);
        ws += e;
        acc = add(acc, mul(c.t, e));
        dsum += c.dd * e;
      }
      const tgt = mul(acc, 1 / ws);
      out.push(mix2(p, tgt, w * c01(dsum / ws / 3)));
    }
  }
  return out;
};
/** a closed polygon resampled to n points evenly along its perimeter, starting at the point of it nearest to `start`
 *  (continuous), then lightly smoothed */
const resampleClosed = (poly: P2[], n: number, start: P2): P2[] => {
  const m = poly.length;
  let bi = 0;
  let bt = 0;
  let bd = Infinity;
  for (let i = 0; i < m; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % m];
    const qq = closestOnSeg(start, a, b);
    const dd = vlen(sub(start, qq));
    if (dd < bd) {
      bd = dd;
      bi = i;
      const L = vlen(sub(b, a));
      bt = L > 1e-9 ? vlen(sub(qq, a)) / L : 0;
    }
  }
  const ring: P2[] = [mix2(poly[bi], poly[(bi + 1) % m], bt)];
  for (let i = 1; i <= m; i++) ring.push(poly[(bi + i) % m]);
  ring.push(ring[0]);
  const cum: number[] = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + vlen(sub(ring[i], ring[i - 1])));
  const tot = cum[cum.length - 1] || 1;
  const out: P2[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const sv = (i / n) * tot;
    while (j < ring.length - 1 && cum[j] < sv) j++;
    const f = (sv - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]);
    out.push(mix2(ring[j - 1], ring[j], c01(f)));
  }
  let sm = out;
  for (let pass = 0; pass < 2; pass++) sm = sm.map((p, i) => mix2(mix2(sm[(i - 1 + n) % n], sm[(i + 1) % n], 0.5), p, 0.5));
  return sm;
};

// ---------------------------------------------------------------------------
// THE ROMAN BUILDS AND LOOKS
// ---------------------------------------------------------------------------
export type RomeKind = "slave" | "freeman" | "dominus" | "overseer";
type HairKind = "crop" | "close" | "curly" | "bun" | "receding";
type BeardKind = "none" | "stubble" | "short" | "full";
type Look = { spec: Spec; hair: HairKind; tone: HairTone; beard: BeardKind; build: FaceBuild; cut: FaceCut; faceW: number; female: boolean };
/** the London V2 head size (headScale x1.06) */
const HEADK = 1.06;
const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08 * HEADK, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
const WOMAN: Spec = { ...MAN, a: 47, hw: 39, H: 89, hipY: -147, limb: 0.9, headScale: 1.03 * HEADK, arm: [55, 52], leg: [68, 66] };
const L = (spec: Spec, hair: HairKind, tone: HairTone, beard: BeardKind, build: FaceBuild, cut: [number, number, number, number], faceW = 1, female = false): Look => ({
  spec,
  hair,
  tone,
  beard,
  build,
  cut: { nose: cut[0], hook: cut[1], arch: cut[2], browW: cut[3] },
  faceW,
  female,
});
const LOOKS: Record<RomeKind, Look[]> = {
  slave: [
    L({ ...MAN, a: 52, hw: 44, limb: 1.02 }, "crop", HAIR_TONES.darkBrown, "stubble", "plain", [1, 0.2, 0.7, 1.1]),
    L({ ...MAN, a: 58, hw: 48, H: 95, hipY: -154, limb: 1.1, arm: [59, 56], leg: [71, 69] }, "close", HAIR_TONES.blackBrown, "short", "plain", [0.92, 0, 0.5, 1.2], 1.05),
    L({ ...MAN, a: 50, hw: 42, H: 93, limb: 0.96 }, "crop", HAIR_TONES.midBrown, "none", "lean", [1.08, 0, 1.2, 0.9]),
    L(WOMAN, "bun", HAIR_TONES.darkBrown, "none", "soft", [0.9, 0, 1.4, 0.75], 0.95, true),
    L({ ...MAN, a: 54, hw: 45, hipY: -150, aged: true }, "receding", HAIR_TONES.grey, "full", "lean", [1.06, 0.8, 1, 0.95]),
  ],
  freeman: [
    L({ ...MAN, a: 56, hw: 46, limb: 1.04 }, "crop", HAIR_TONES.chestnut, "short", "plain", [0.96, 0.3, 0.9, 1]),
    L({ ...MAN, a: 52, hw: 44 }, "crop", HAIR_TONES.midBrown, "none", "lean", [1.1, 0, 1.3, 0.9]),
    L({ ...MAN, a: 60, hw: 47, hipY: -150, aged: true }, "receding", HAIR_TONES.greyBrown, "stubble", "full", [1, 0.5, 0.8, 1], 1.04),
    L(WOMAN, "bun", HAIR_TONES.chestnut, "none", "soft", [0.94, 0.1, 1.3, 0.8], 0.96, true),
  ],
  dominus: [
    L({ ...MAN, a: 60, hw: 48, H: 95, hipY: -154, arm: [59, 56], leg: [71, 69] }, "curly", HAIR_TONES.darkBrown, "none", "plain", [1.04, 0.6, 0.9, 1]),
    L({ ...MAN, a: 66, hw: 50, limb: 1.06, aged: true, headScale: 1.1 * HEADK }, "receding", HAIR_TONES.grey, "none", "full", [1, 0.4, 1, 1], 1.08),
    L({ ...MAN, a: 56, hw: 46, H: 96, hipY: -156, arm: [59, 56], leg: [72, 70] }, "curly", HAIR_TONES.blackBrown, "none", "lean", [1.1, 0.2, 1.2, 0.95]),
  ],
  overseer: [
    L({ ...MAN, a: 60, hw: 49, limb: 1.1 }, "close", HAIR_TONES.blackBrown, "full", "plain", [0.95, 0.6, 0.5, 1.25], 1.04),
    L({ ...MAN, a: 52, hw: 44 }, "crop", HAIR_TONES.midBrown, "stubble", "lean", [1.12, 0.3, 0.9, 1.1]),
    L({ ...MAN, a: 56, hw: 46, aged: true }, "receding", HAIR_TONES.greyBrown, "short", "full", [1, 0.3, 1.1, 1]),
  ],
};
/** how many variants each character has */
export const ROME_VARIANTS: Record<RomeKind, number> = { slave: LOOKS.slave.length, freeman: LOOKS.freeman.length, dominus: LOOKS.dominus.length, overseer: LOOKS.overseer.length };
/** the women: Slave variant 3, Freeman variant 3 */
export const isFemale = (kind: RomeKind, variant = 0) => lookOf(kind, variant).female;
const lookOf = (kind: RomeKind, variant = 0): Look => {
  const a = LOOKS[kind];
  return a[((Math.round(variant) % a.length) + a.length) % a.length];
};
/** the rig build of a cast member (use with figureRig / figureAnchors) */
export const romeSpec = (kind: RomeKind, variant = 0) => lookOf(kind, variant).spec;

// ---------------------------------------------------------------------------
// THE HAIR (head-local units, before headScale): a dome of short hair round the skull, its hairline projected with
// the head's yaw (a turn is continuous); cropped / close-cut / curly / receding; a woman's hair parted and drawn
// back to a bun at the nape. Drawn after the face (the ears show below it).
// ---------------------------------------------------------------------------
const hairArt = (look: Look, yaw: number, ink: Ink, uid: string) => {
  const kind = look.hair;
  const tone = dimTone(look.tone, inkLevel(ink));
  const hc = Math.cos(yaw);
  const hs = Math.sin(yaw);
  const bun = kind === "bun";
  const curly = kind === "curly";
  const R = kind === "close" ? 23.8 : curly ? 25.8 : bun ? 25.4 : 24.6;
  const cy = bun ? -11.5 : -10.5;
  const cz = -1.5;
  const ccx = cz * hs;
  const rho = (y: number) => Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
  const hyDeg = (yaw * 180) / Math.PI;
  // the hairline round the head (phi from the front, deg)
  const yh = (phiDeg: number) => {
    const a = Math.abs(phiDeg);
    if (kind === "receding") return a < 30 ? mix(-31, -29, a / 30) : a < 62 ? mix(-29, -20, (a - 30) / 32) : a < 84 ? mix(-20, -9, (a - 62) / 22) : a < 100 ? mix(-9, -2, (a - 84) / 16) : a < 124 ? mix(-2, 4, (a - 100) / 24) : mix(4, 14, c01((a - 124) / 40));
    if (bun) return a < 6 ? -24 : a < 60 ? mix(-23, -18, (a - 6) / 54) : a < 90 ? mix(-18, -7, (a - 60) / 30) : a < 120 ? mix(-7, 0, (a - 90) / 30) : 2;
    return a < 50 ? mix(-24, -21, a / 50) : a < 80 ? mix(-21, -9, (a - 50) / 30) : a < 96 ? mix(-9, -2, (a - 80) / 16) : a < 120 ? mix(-2, 4, (a - 96) / 24) : mix(4, 14, c01((a - 120) / 40));
  };
  const crown: P2[] = [];
  for (let ph = -90 - hyDeg; ph <= 90 - hyDeg + 0.01; ph += 3) {
    const y = yh(ph);
    const rr = rho(y);
    const a = ((ph + hyDeg) * Math.PI) / 180;
    crown.push([ccx + rr * Math.sin(a) * 1.01, y]);
  }
  const yr = crown[crown.length - 1][1];
  const yl = crown[0][1];
  const a0 = Math.atan2(yr - cy, rho(yr));
  let a1 = Math.atan2(yl - cy, -rho(yl));
  if (a1 > a0) a1 -= 2 * Math.PI;
  const outer: P2[] = [];
  const NO = 44;
  for (let i = 1; i < NO; i++) {
    const a = mix(a0, a1, i / NO);
    const up = Math.max(0, -Math.sin(a));
    const rr = R + 1;
    outer.push([ccx + rr * Math.cos(a) * (1 + 0.05 * up), cy + rr * Math.sin(a) * (1 - 0.06 * up)]);
  }
  const crownPoly = [...crown, ...outer];
  const nCr = crown.length;
  const crBump = (i: number) => (i < nCr - 1 ? (curly ? 1.9 : bun ? 0.5 : 1.3) : curly ? 2.8 : bun ? 0.9 : kind === "close" ? 1 : 1.6) * (0.6 + 0.8 * hash(i, 501));
  const CROWN = scallopD(crownPoly, crBump);
  // ---- texture
  let strokes = "";
  let curls = "";
  if (kind === "crop" || kind === "close" || kind === "receding") {
    // short strokes combed down and forward from the crown, in tufts along the edge
    strokes =
      crown
        .filter((_, i) => i % 2 === 0)
        .map((p, i) => {
          const dx = (ccx - p[0]) * 0.18;
          return `M${P([p[0] + dx, p[1] - 6 - 2 * hash(i, 521)])}L${P([p[0] + dx * 0.2, p[1] - 1])}`;
        })
        .join("") + outer.filter((_, i) => i % 3 === 0).map((p) => `M${P(mix2(p, [ccx, cy], 0.26))}L${P(mix2(p, [ccx, cy], 0.05))}`).join("");
  }
  if (curly || kind === "receding") {
    // tight curls: rows of small crescents over the dome, following it (3D, so they turn with him)
    const rows = curly ? 4 : 2;
    for (let r2 = 0; r2 < rows; r2++) {
      const nIn = curly ? 8 : 6;
      for (let j = 0; j < nIn * 2; j++) {
        const phi = (j / (nIn * 2)) * 360 + r2 * 13;
        const pol = (curly ? 0.4 : 1.1) + r2 * (curly ? 0.32 : 0.3) + 0.06 * hash(j, 7 + r2);
        const y = cy - R * Math.cos(pol);
        const rh = R * Math.sin(pol);
        const X = rh * Math.sin((phi * Math.PI) / 180);
        const Z = rh * Math.cos((phi * Math.PI) / 180) + cz;
        const dep = (Z - cz) * hc - X * hs;
        if (dep < 3) continue;
        // keep the receding man's curls off his bare crown
        if (kind === "receding" && y < -28) continue;
        const p: P2 = [X * hc + Z * hs, y];
        const w = 3.4 * Math.min(1, dep / 14 + 0.35);
        curls += `M${P([p[0] - w, p[1] - 0.6])}C${P([p[0] - w, p[1] + 3])} ${P([p[0] + w, p[1] + 3])} ${P([p[0] + w, p[1] - 1])}`;
      }
    }
  }
  let parting = "";
  if (bun) {
    // the parting from the forehead back over the crown, and strands sweeping from it to the sides and the bun
    const pts: P2[] = [];
    for (let k = 0; k <= 10; k++) {
      const pol = mix(1.2, -0.3, k / 10);
      const y = cy - R * Math.cos(pol);
      const Z = R * Math.sin(pol) + cz;
      if ((Z - cz) * hc < -1) break;
      pts.push([Z * hs, y + 0.6]);
    }
    parting = pts.length > 1 ? `M${pts.map(P).join("L")}` : "";
    for (const sd of [-1, 1]) {
      for (let j = 0; j < 6; j++) {
        const th = mix(0.25, 1.05, j / 5);
        const seg: P2[] = [];
        for (let k = 0; k <= 12; k++) {
          const u = k / 12;
          const phi = sd * mix(8 + j * 4, 128 + j * 6, u);
          const pol = mix(th, 1.7, u);
          const y = cy - R * Math.cos(pol);
          const rh = R * Math.sin(pol);
          const X = rh * Math.sin((phi * Math.PI) / 180);
          const Z = rh * Math.cos((phi * Math.PI) / 180) + cz;
          const dep = (Z - cz) * hc - X * hs;
          if (dep < -2) {
            if (seg.length > 1) strokes += `M${seg.map(P).join("L")}`;
            seg.length = 0;
            continue;
          }
          seg.push([X * hc + Z * hs, y]);
        }
        if (seg.length > 1) strokes += `M${seg.map(P).join("L")}`;
      }
    }
  }
  const yTop = cy - R - 6;
  const crownEl = (
    <>
      <path d={CROWN} fill="none" {...OUT} strokeWidth={2.4} />
      <clipPath id={`${uid}-cr`}>
        <path d={CROWN} />
      </clipPath>
      <path d={CROWN} fill={tone.base} />
      <g clipPath={`url(#${uid}-cr)`}>
        <ellipse cx={ccx - R * 0.28} cy={cy - R * 0.5} rx={R * 0.62} ry={R * 0.42} transform={`rotate(-24 ${(ccx - R * 0.28).toFixed(1)} ${(cy - R * 0.5).toFixed(1)})`} fill={tone.light} opacity={0.9} />
        <path d={hatchD(ccx + R * 0.25, yTop, ccx + R + 8, cy + 30, 112, 2.5, 701, 0.18)} {...ln(0.9, 0.45)} />
        {strokes ? <path d={strokes} {...ln(1, bun ? 0.55 : 0.6)} /> : null}
        {curls ? <path d={curls} {...ln(1.15, 0.72)} /> : null}
        {parting ? <path d={parting} {...ln(1.4, 0.8)} /> : null}
      </g>
    </>
  );
  // the bun at the nape: a ball of hair behind the head, bound with a band (seen as he turns away)
  const bunEl = bun
    ? (() => {
        const bx = -24 * hs;
        const by = -4;
        const rx = 10.5 + 1.5 * Math.abs(hs);
        return (
          <g>
            <ellipse cx={bx} cy={by} rx={rx} ry={10} fill={tone.base} {...OUT} strokeWidth={2.2} />
            <path d={`M${(bx - rx * 0.7).toFixed(1)},${by - 4}Q${bx.toFixed(1)},${by + 5} ${(bx + rx * 0.7).toFixed(1)},${by - 5}M${(bx - rx * 0.6).toFixed(1)},${by + 3}Q${bx.toFixed(1)},${by + 10} ${(bx + rx * 0.6).toFixed(1)},${by + 2}`} {...ln(1, 0.6)} />
            <path d={`M${bx.toFixed(1)},${by - 10}L${(bx - hs * 3).toFixed(1)},${by + 10}`} fill="none" stroke={DARK} strokeWidth={3.4} strokeOpacity={0.7} />
          </g>
        );
      })()
    : null;
  return { crownEl, bunEl, CROWN };
};

// ---- the beard (head-local, drawn over the face and under the mouth; the moustache over the mouth) ---------------
const BEARD_F: P2[] = [[-20, 4], [-19, 15], [-14, 26.5], [-5.5, 33], [0, 34.5], [5.5, 33], [14, 26.5], [19, 15], [20, 4], [15.5, 11], [9.5, 19.4], [0, 22.6], [-9.5, 19.4], [-15.5, 11]];
const BEARD_P: P2[] = [[-8.5, 3], [-9.5, 14], [-5.5, 23.5], [3.5, 30.5], [11.5, 33.5], [17.5, 32.5], [21, 28], [21.6, 23.5], [20.6, 21.2], [18.2, 21.4], [15, 21], [11.5, 19.2], [5.5, 13.5], [-1.5, 7]];
const beardArt = (kind: BeardKind, yaw: number, nod: number, ink: Ink, tone: HairTone, uid: string) => {
  if (kind === "none") return { under: null, over: null };
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.18) / 0.3) : 1);
  const len = kind === "full" ? 1.22 : kind === "short" ? 0.78 : 0.62;
  const pts = blendYaw(BEARD_F, BEARD_P, yaw).map((p): P2 => [p[0], (p[1] > 21 ? 21 + (p[1] - 21) * len : p[1]) + fy * 0.6]);
  const BEARD = kind === "stubble" ? smoothClosed(pts) : scallopD(pts, (i) => (kind === "full" ? 1.8 : 0.9) * (0.6 + 0.8 * hash(i, 611)));
  const tn = dimTone(tone, inkLevel(ink));
  if (kind === "stubble") {
    // a shadow of stubble on the jaw and the upper lip, inside the face
    return {
      under: (
        <g>
          <clipPath id={`${uid}-st`}>
            <path d={BEARD} />
          </clipPath>
          <g clipPath={`url(#${uid}-st)`}>
            <path d={BEARD} fill={tn.base} opacity={0.22} />
            <path d={hatchD(-24, 0, 26, 40, 96, 1.7, 613, 0.55)} {...ln(0.7, 0.35)} />
          </g>
        </g>
      ),
      over: null,
    };
  }
  const mo = (sd: number) => limbD([[pr(0, 14.6, 21, 0.7), 4.4], [pr(sd * 5.6, 15, 18, 0.7), 4.6], [pr(sd * 10.2, 18.6, 13.6, 0.7), 2.4]]);
  return {
    under: (
      <g>
        <clipPath id={`${uid}-bd`}>
          <path d={BEARD} />
        </clipPath>
        <path d={BEARD} fill={tn.base} {...OUT} strokeWidth={2.1} />
        <g clipPath={`url(#${uid}-bd)`}>
          <path d={hatchD(-26, 0, 26, 44, 84, 2.2, 73, 0.12)} {...ln(1.05, 0.7)} />
          <path d={hatchD(4, 8, 30, 44, 112, 2.6, 74, 0.2)} {...ln(0.9, 0.45)} />
          <ellipse cx={-6 + 6 * s} cy={27 + fy} rx={7} ry={4} fill={tn.light} opacity={0.55} />
        </g>
      </g>
    ),
    over: (
      <g>
        {[-1, 1].map((sd) => (
          <path key={sd} d={mo(sd)} fill={tn.base} {...OUT} strokeWidth={1.5} opacity={vis(sd)} />
        ))}
      </g>
    ),
  };
};

// ---- the pilleus: the free man's brimless felt cap, a rounded cone sitting low on the brow, a rolled edge --------
const pilleusArt = (yaw: number, ink: Ink, uid: string) => {
  const hs = Math.sin(yaw);
  const R = 25.6;
  const cy = -11;
  const cz = -1.5;
  const ccx = cz * hs;
  const hyDeg = (yaw * 180) / Math.PI;
  const brimY = (phi: number) => mix(-14.5, -21, c01(Math.abs(phi) / 170));
  const rim: P2[] = [];
  for (let ph = -90 - hyDeg; ph <= 90 - hyDeg + 0.01; ph += 6) {
    const y = brimY(ph);
    const rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
    rim.push([ccx + rr * Math.sin(((ph + hyDeg) * Math.PI) / 180) * 1.04, y]);
  }
  const yr = rim[rim.length - 1][1];
  const yl = rim[0][1];
  const a0 = Math.atan2(yr - cy, Math.sqrt(Math.max(0, R * R - (yr - cy) ** 2)));
  let a1 = Math.atan2(yl - cy, -Math.sqrt(Math.max(0, R * R - (yl - cy) ** 2)));
  if (a1 > a0) a1 -= 2 * Math.PI;
  const dome: P2[] = [...rim];
  // the felt rises over the crown to a soft, rounded point leaning a little back
  const back = -hs * 0.6;
  for (let i = 1; i < 34; i++) {
    const a = mix(a0, a1, i / 34);
    const up = Math.max(0, -Math.sin(a));
    const rr = R + 2.2;
    dome.push([ccx + rr * Math.cos(a) * (1 - 0.1 * up * up) + back * 5 * up ** 3, cy + rr * Math.sin(a) * (1 + 0.02 * up) - 8 * up ** 2.6]);
  }
  const DOME = smoothClosed(dome);
  const felt = mixHex(ink.deep, ink.hair, 0.5);
  const topY = Math.min(...dome.map((p) => p[1]));
  const band = rim.length > 2 ? `M${rim.map((p) => P(add(p, [0, -3.2]))).join("L")}` : "";
  return (
    <>
      <clipPath id={`${uid}-pl`}>
        <path d={DOME} />
      </clipPath>
      <path d={DOME} fill={felt} {...OUT} strokeWidth={2.5} />
      <g clipPath={`url(#${uid}-pl)`}>
        <ellipse cx={ccx - 9} cy={topY + 16} rx={10} ry={15} transform={`rotate(-20 ${(ccx - 9).toFixed(1)} ${(topY + 16).toFixed(1)})`} fill={mixHex(felt, ink.main, 0.35)} opacity={0.85} />
        <path d={hatchD(ccx + 4, topY - 2, ccx + 34, -6, 112, 2.4, 731)} {...ln(0.95, 0.55)} />
        <path d={hatchD(ccx + 12, topY + 10, ccx + 34, -6, 62, 3, 732)} {...ln(0.85, 0.4)} />
        <path d={`M${P([ccx - 6 * hs, topY + 3])}Q${P([ccx - 14 + 4 * hs, topY + 18])} ${P([ccx - 16, -14])}`} {...ln(1, 0.4)} />
      </g>
      {band ? <path d={band} {...ln(1.2, 0.6)} /> : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE FOOT: bare (a slave), sandalled (a free man; the overseer's straps run up the shin), a closed calceus (the
// rich). texcocoFigures' foot outline, toes where he faces.
// ---------------------------------------------------------------------------
type FootKind = "bare" | "sandal" | "caliga" | "shoe";
const FOOT_F: P2[] = [[-6, 1], [6, 1], [10, 6.5], [12.5, 10.5], [12.6, 14], [11, 16.8], [0, 17.8], [-11, 16.8], [-12.6, 13], [-10, 6.5]];
const FOOT_P: P2[] = [[-6, 1], [6, 1], [14, 7.4], [24.5, 10.6], [28.5, 13.6], [26.5, 16.8], [8, 17.6], [-8.5, 16.8], [-10.6, 11], [-8.4, 4]];
const Foot: React.FC<{ A: P2; sgn: number; yaw: number; lift: number; k: number; ink: Ink; kind: FootKind; leather: string }> = ({ A, sgn, yaw, lift, k, ink, kind, leather }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const out = sgn * 4.5 * c;
  const pts = blendYaw(FOOT_F, FOOT_P, yaw).map((p, i): P2 => (i < 2 ? p : [p[0] + out, p[1]]));
  const toe: P2 = [mix(out, sg * 26, t), 15.6];
  const tw = mix(4.6, 1.6, t);
  const shoe = kind === "shoe";
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
      {kind !== "bare" && !shoe ? <path d={`M${P([pts[7][0] - 1, pts[7][1] + 1.6])}Q${P([pts[6][0], pts[6][1] + 2.6])} ${P([pts[5][0] + 1, pts[5][1] + 1.6])}`} fill="none" stroke={DARK} strokeWidth={4.4} strokeLinecap="round" /> : null}
      <path d={smoothClosed(pts)} fill={shoe ? leather : ink.main} {...OUT} strokeWidth={2.1} />
      {shoe ? (
        <>
          <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.4])} ${P(pts[5])}`} {...ln(1.3, 0.75)} />
          <path d={`M-6.2,2Q${(toe[0] * 0.3).toFixed(1)},7 ${(toe[0] * 0.55 + 5 * (1 - t)).toFixed(1)},${(5 + 4 * t).toFixed(1)}`} {...ln(1.2, 0.7)} />
          <path d={`M-6,-4L6,0M6,-4L-6,0`} {...ln(1.1, 0.65)} />
          <path d={hatchD(0, 0, 30, 18, 112, 2.4, 741)} {...ln(0.8, 0.4)} />
        </>
      ) : (
        <>
          {c > 0.3 ? <path d={[-1.5, -0.5, 0.5, 1.5].map((j) => `M${(out + j * tw).toFixed(1)},16.4l0,-4.4`).join("")} {...ln(1, 0.7 * c01((c - 0.3) * 3))} /> : null}
          {t > 0.35 ? <path d={`M${P([toe[0] - sg * 2, 15.4])}l${-sg * 4},-2.4`} {...ln(1, 0.6 * c01((t - 0.35) * 4))} /> : null}
          {kind === "bare" ? (
            // the ankle bone and the arch: a bare foot
            <>
              <path d={`M${P([mix(-2, -sg * 4, t), 6])}q${(sg * 3).toFixed(1)},2 ${(sg * 1).toFixed(1)},5`} {...ln(0.9, 0.5)} />
              <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3])} ${P(pts[5])}`} {...ln(1, 0.45)} />
            </>
          ) : (
            <>
              <path d={`M-6.4,3.4L${P([toe[0] * 0.82, mix(10.8, 11.6, t)])}L6.4,3.4`} fill="none" stroke={DARK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M-6.4,3.4L${P([toe[0] * 0.82, mix(10.8, 11.6, t)])}L6.4,3.4`} fill="none" stroke={leather} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M-6.6,-1.5h13.2" fill="none" stroke={DARK} strokeWidth={3.4} strokeLinecap="round" />
              <path d="M-6.6,-1.5h13.2" fill="none" stroke={leather} strokeWidth={1.6} strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// IRON: the fetters' chain (between two points, sagging, lying on the ground where it reaches it) and rings
// ---------------------------------------------------------------------------
const ironOf = (ink: Ink) => mixHex(ink.hair, DARK, 0.38);
/** a sagging chain from a to b of length len (same units), clamped above y = ground; sized by `link` */
const chainPts = (a: P2, b: P2, len: number, ground: number): P2[] => {
  const d = vlen(sub(b, a));
  const h = d >= len ? 0 : Math.sqrt((3 * d * Math.max(0, len - d)) / 8) + (d < 4 ? (len - d) / 2.2 : 0);
  const n = Math.max(6, Math.ceil(len / 3));
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = mix2(a, b, u);
    out.push([p[0], Math.min(ground, p[1] + 4 * h * u * (1 - u))]);
  }
  return out;
};
const ChainArt: React.FC<{ pts: P2[]; link: number; ink: Ink; seed?: number; count?: number }> = ({ pts, link, ink, seed = 0, count }) => {
  // walk the curve placing links every `link` units: face-on ovals and edge-on bars, alternating
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + vlen(sub(pts[i], pts[i - 1])));
  const total = cum[cum.length - 1];
  const at = (sv: number): { p: P2; u: P2 } => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < sv) i++;
    const f = (sv - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return { p: mix2(pts[i - 1], pts[i], c01(f)), u: norm(sub(pts[i], pts[i - 1])) };
  };
  const iron = ironOf(ink);
  const links: React.ReactNode[] = [];
  // (Revision 1) a fixed number of links (from the chain's nominal length): links never appear / vanish as it sags
  const nL = count ?? Math.max(2, Math.round(total / link));
  for (let j = 0; j <= nL; j++) {
    const { p, u } = at((j / nL) * total);
    const ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    links.push(
      j % 2 === 0 ? (
        <g key={j} transform={`translate(${P(p)}) rotate(${ang.toFixed(1)})`}>
          <ellipse cx={0} cy={0} rx={link * 0.78} ry={link * 0.46} fill="none" stroke={DARK} strokeWidth={link * 0.5} />
          <ellipse cx={0} cy={0} rx={link * 0.78} ry={link * 0.46} fill="none" stroke={iron} strokeWidth={link * 0.24} />
          <path d={`M${(-link * 0.5).toFixed(2)},${(-link * 0.4).toFixed(2)}Q0,${(-link * 0.56).toFixed(2)} ${(link * 0.4).toFixed(2)},${(-link * 0.42).toFixed(2)}`} fill="none" stroke={ink.deep} strokeWidth={link * 0.14} strokeOpacity={0.85} strokeLinecap="round" />
        </g>
      ) : (
        <g key={j} transform={`translate(${P(p)}) rotate(${ang.toFixed(1)})`}>
          <path d={`M${(-link * 0.72).toFixed(2)},0L${(link * 0.72).toFixed(2)},0`} stroke={DARK} strokeWidth={link * 0.52} strokeLinecap="round" />
          <path d={`M${(-link * 0.6).toFixed(2)},${(-link * 0.04).toFixed(2)}L${(link * 0.6).toFixed(2)},${(-link * 0.04).toFixed(2)}`} stroke={iron} strokeWidth={link * 0.22} strokeLinecap="round" />
        </g>
      ),
    );
  }
  void seed;
  return <g>{links}</g>;
};
/** an iron ring round a limb or the neck: a band (ellipse rx, ry) with a lit top edge */
const IronRing: React.FC<{ c: P2; rx: number; ry: number; w: number; ink: Ink; half?: "front" | "back" | "both" }> = ({ c, rx, ry, w, ink, half = "both" }) => {
  const iron = ironOf(ink);
  const arc = (front: boolean) => `M${(c[0] - rx).toFixed(2)},${c[1].toFixed(2)}A${rx.toFixed(2)},${ry.toFixed(2)} 0 0 ${front ? 0 : 1} ${(c[0] + rx).toFixed(2)},${c[1].toFixed(2)}`;
  return (
    <g>
      {half !== "front" ? (
        <>
          <path d={arc(false)} fill="none" stroke={DARK} strokeWidth={w * 1.5} />
          <path d={arc(false)} fill="none" stroke={mixHex(iron, DARK, 0.3)} strokeWidth={w * 0.7} />
        </>
      ) : null}
      {half !== "back" ? (
        <>
          <path d={arc(true)} fill="none" stroke={DARK} strokeWidth={w * 1.7} strokeLinecap="round" />
          <path d={arc(true)} fill="none" stroke={iron} strokeWidth={w * 0.95} strokeLinecap="round" />
          <path d={`M${(c[0] - rx * 0.86).toFixed(2)},${(c[1] + ry * 0.3).toFixed(2)}Q${(c[0] - rx * 0.4).toFixed(2)},${(c[1] + ry * 0.92).toFixed(2)} ${c[0].toFixed(2)},${(c[1] + ry * 0.94).toFixed(2)}`} fill="none" stroke={ink.deep} strokeWidth={w * 0.32} strokeOpacity={0.9} strokeLinecap="round" />
        </>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// HELD THINGS: tools (one fist: rod, whip; two fists: hammer, pick) and shoulder loads (sack, amphora, basket).
// Art in local units: the tool's grip at (0, 0), its shaft along +x; a load centred at (0, 0).
// ---------------------------------------------------------------------------
export type RomeTool = "none" | "rod" | "whip" | "hammer" | "pick";
export type RomeLoad = "none" | "sack" | "amphora" | "basket";
/** shaft lengths from the lower grip, units */
export const TOOL_LEN: Record<Exclude<RomeTool, "none">, number> = { rod: 112, whip: 40, hammer: 118, pick: 116 };
const RodArt: React.FC<{ ink: Ink; len?: number }> = ({ ink, len = TOOL_LEN.rod }) => (
  <g>
    {/* the vine rod: a knotted stick, thicker at the grip */}
    <path d={limbD([[[-14, 0], 7], [[len * 0.4, 0], 6], [[len, 0], 4.6]])} fill={mixHex(ink.hair, ink.deep, 0.35)} {...OUT} strokeWidth={2} />
    <path d={[0.25, 0.5, 0.74].map((u) => `M${(len * u).toFixed(1)},-3.2l1.6,6.2`).join("")} {...ln(1.1, 0.7)} />
    <path d={`M-10,-1.6L${(len - 4).toFixed(1)},-1.2`} fill="none" stroke={ink.main} strokeWidth={1} strokeOpacity={0.5} />
  </g>
);
const WhipArt: React.FC<{ ink: Ink; sway?: number; ang?: number }> = ({ ink, sway = 0, ang = 0 }) => {
  const h = TOOL_LEN.whip;
  // the lash hangs from the handle's end and swings a little; (Revision 1) it hangs DOWN in the figure's space
  // whatever the handle's angle (its points are counter-rotated by the handle's angle `ang`, deg)
  const g = (p: P2): P2 => add([h, 0], rot(sub(p, [h, 0]), -ang));
  const p1: P2 = g([h + 26, 30 + 8 * Math.sin(sway)]);
  const p2: P2 = g([h + 18 + 12 * Math.sin(sway * 1.3 + 1), 82]);
  const p3: P2 = g([h + 34 + 16 * Math.sin(sway + 2), 128]);
  return (
    <g>
      <path d={`M${h},0C${P(p1)} ${P(p2)} ${P(p3)}`} fill="none" stroke={DARK} strokeWidth={4.6} strokeLinecap="round" />
      <path d={`M${h},0C${P(p1)} ${P(p2)} ${P(p3)}`} fill="none" stroke={mixHex(ink.hair, ink.deep, 0.2)} strokeWidth={2.2} strokeLinecap="round" />
      <path d={limbD([[[-12, 0], 8], [[h * 0.6, 0], 7], [[h, 0], 5.4]])} fill={mixHex(ink.hair, DARK, 0.2)} {...OUT} strokeWidth={2} />
      <path d={[0.15, 0.35, 0.55, 0.75].map((u) => `M${(h * u).toFixed(1)},-3.4l2,6.8`).join("")} {...ln(1, 0.6)} />
    </g>
  );
};
const HeadedTool: React.FC<{ ink: Ink; kind: "hammer" | "pick"; uid: string }> = ({ ink, kind, uid }) => {
  const L0 = TOOL_LEN[kind];
  const wood = mixHex(ink.hair, ink.deep, 0.35);
  const iron = ironOf(ink);
  return (
    <g>
      <path d={limbD([[[-10, 0], 7.4], [[L0 * 0.5, 0], 7], [[L0 + 6, 0], 7.6]])} fill={wood} {...OUT} strokeWidth={2} />
      <path d={`M-6,-1.8L${L0},-1.8`} fill="none" stroke={ink.main} strokeWidth={1} strokeOpacity={0.45} />
      {kind === "hammer" ? (
        <g>
          {/* the sledge's iron head: a block across the shaft's end, lit on its upper left face */}
          <path d={`M${L0 - 12},-24L${L0 + 14},-24L${L0 + 14},24L${L0 - 12},24Z`} fill={iron} {...OUT} strokeWidth={2.2} />
          <path d={`M${L0 - 12},-24L${L0 - 4},-30L${L0 + 20},-30L${L0 + 14},-24Z`} fill={mixHex(iron, ink.main, 0.45)} {...OUT} strokeWidth={1.8} />
          <path d={`M${L0 + 14},-24L${L0 + 20},-30L${L0 + 20},18L${L0 + 14},24Z`} fill={mixHex(iron, DARK, 0.4)} {...OUT} strokeWidth={1.8} />
          <clipPath id={`${uid}-hh`}>
            <path d={`M${L0 - 12},-24L${L0 + 14},-24L${L0 + 14},24L${L0 - 12},24Z`} />
          </clipPath>
          <path d={hatchD(L0 - 2, -26, L0 + 16, 26, 100, 2.4, 751)} clipPath={`url(#${uid}-hh)`} {...ln(0.9, 0.5)} />
        </g>
      ) : (
        <g>
          {/* the pick's iron head: a curved bar, one end a point, the other a narrow chisel */}
          <path d={`M${L0 - 4},-6Q${L0 + 8},-30 ${L0 + 2},-58L${L0 + 8},-56Q${L0 + 18},-30 ${L0 + 10},-4L${L0 + 10},6Q${L0 + 18},28 ${L0 + 14},46L${L0 + 2},46Q${L0 + 8},26 ${L0 - 4},6Z`} fill={iron} {...OUT} strokeWidth={2.2} />
          <path d={`M${L0 + 6},-50Q${L0 + 12},-28 ${L0 + 5},-6`} fill="none" stroke={ink.deep} strokeWidth={1.4} strokeOpacity={0.8} />
          <rect x={L0 - 6} y={-8} width={18} height={16} rx={2} fill={mixHex(iron, DARK, 0.25)} {...OUT} strokeWidth={1.8} />
        </g>
      )}
    </g>
  );
};
/** (addition) a shallow wine cup (kylix) held by its stem: the stem at (0, 0), the bowl above it, upright; a dark
 *  wine surface, two handles, the lit side upper left. Units: ~40 wide, ~30 tall. */
const CupArt: React.FC<{ ink: Ink; uid: string }> = ({ ink, uid }) => {
  const rimY = -24;
  const BOWL = `M-19,${rimY}Q-17,${rimY + 13} 0,${rimY + 15}Q17,${rimY + 13} 19,${rimY}Z`;
  const metal = mixHex(ink.main, ink.deep, 0.35);
  return (
    <g>
      {/* the stem and the foot (the fist hides most of the stem) */}
      <path d={limbD([[[0, rimY + 13], 5], [[0, 4], 4], [[0, 9], 5]])} fill={metal} {...OUT} strokeWidth={1.8} />
      <ellipse cx={0} cy={10} rx={8} ry={2.6} fill={metal} {...OUT} strokeWidth={1.8} />
      {/* the handles */}
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${sd * 16},${rimY + 3}C${sd * 26},${rimY + 1} ${sd * 27},${rimY + 9} ${sd * 18},${rimY + 8}`} fill="none" stroke={DARK} strokeWidth={4.4} strokeLinecap="round" />
      ))}
      {[-1, 1].map((sd) => (
        <path key={`h${sd}`} d={`M${sd * 16},${rimY + 3}C${sd * 26},${rimY + 1} ${sd * 27},${rimY + 9} ${sd * 18},${rimY + 8}`} fill="none" stroke={metal} strokeWidth={2} strokeLinecap="round" />
      ))}
      <clipPath id={`${uid}-b`}>
        <path d={BOWL} />
      </clipPath>
      <path d={BOWL} fill={metal} {...OUT} strokeWidth={2} />
      <g clipPath={`url(#${uid}-b)`}>
        <path d={hatchD(2, rimY, 22, rimY + 16, 112, 2.2, 991)} {...ln(0.85, 0.55)} />
        <path d={`M-14,${rimY + 3}Q-10,${rimY + 10} -2,${rimY + 12}`} fill="none" stroke={ink.main} strokeWidth={2.2} strokeOpacity={0.8} strokeLinecap="round" />
      </g>
      {/* the rim and the wine in it */}
      <ellipse cx={0} cy={rimY} rx={19} ry={4.6} fill={ink.main} {...OUT} strokeWidth={2} />
      <ellipse cx={0.5} cy={rimY + 0.6} rx={15.5} ry={3.2} fill={mixHex(ink.hair, DARK, 0.55)} />
      <path d={`M-9,${rimY - 0.4}Q-4,${rimY - 1.6} 2,${rimY - 1}`} fill="none" stroke={ink.main} strokeWidth={1} strokeOpacity={0.6} />
    </g>
  );
};
/** a load's art, centred at (0, 0), its long axis along +x (the amphora's mouth at +x) */
const LoadArt: React.FC<{ kind: Exclude<RomeLoad, "none">; ink: Ink; uid: string; lying?: boolean }> = ({ kind, ink, uid, lying = true }) => {
  if (kind === "amphora") {
    // a transport amphora (Dressel 20-ish): pointed toe, a full body, a short neck, two handles; lit upper left
    const body: P2[] = [[-62, 0], [-56, -9], [-36, -21], [-4, -24], [24, -20], [36, -10], [42, -6], [58, -6], [64, -8], [66, 0], [64, 8], [58, 6], [42, 6], [36, 10], [24, 20], [-4, 24], [-36, 21], [-56, 9]];
    const D = smoothClosed(body);
    const fill = mixHex(ink.main, ink.deep, 0.55);
    return (
      <g>
        <clipPath id={`${uid}-am`}>
          <path d={D} />
        </clipPath>
        {[-1, 1].map((sd) => (
          <path key={sd} d={`M40,${sd * 6}C34,${sd * 22} 24,${sd * 24} 18,${sd * 20}`} fill="none" stroke={DARK} strokeWidth={6.4} strokeLinecap="round" />
        ))}
        {[-1, 1].map((sd) => (
          <path key={`h${sd}`} d={`M40,${sd * 6}C34,${sd * 22} 24,${sd * 24} 18,${sd * 20}`} fill="none" stroke={fill} strokeWidth={3.2} strokeLinecap="round" />
        ))}
        <path d={D} fill={fill} {...OUT} strokeWidth={2.3} />
        <g clipPath={`url(#${uid}-am)`}>
          <path d={limbD([[[-50, -6], 7], [[-10, -14], 12], [[22, -12], 8]])} fill={ink.main} opacity={0.75} />
          <path d={hatchD(-66, 4, 70, 26, 112, 2.5, 761)} {...ln(0.9, 0.55)} />
          <path d={hatchD(-66, 12, 70, 26, 62, 3, 762)} {...ln(0.85, 0.4)} />
          <path d={`M36,-10Q39,0 36,10M-30,-20Q-26,0 -30,20`} {...ln(1, 0.45)} />
        </g>
        <ellipse cx={65} cy={0} rx={2.4} ry={7} fill={DARK} opacity={0.8} />
      </g>
    );
  }
  if (kind === "basket") {
    // a wicker basket: a deep tapered body, the weave, a rim; lying = on its side on a shoulder
    const B = "M-30,-26L30,-26L24,26L-24,26Z";
    const fill = mixHex(ink.main, ink.hair, 0.3);
    return (
      <g transform={lying ? "rotate(90)" : undefined}>
        <clipPath id={`${uid}-bk`}>
          <path d={B} />
        </clipPath>
        <path d={B} fill={fill} {...OUT} strokeWidth={2.3} />
        <g clipPath={`url(#${uid}-bk)`}>
          <path d={[-18, -8, 2, 12, 22].map((y, i) => `M-32,${y}Q0,${y + 4} 32,${y}` + (i % 2 ? "" : "")).join("")} {...ln(1.3, 0.7)} />
          <path d={Array.from({ length: 9 }, (_, i) => `M${-28 + i * 7},-26L${-22 + i * 5.5},26`).join("")} {...ln(1, 0.45)} />
          <path d={hatchD(6, -28, 34, 28, 112, 2.6, 771)} {...ln(0.9, 0.5)} />
        </g>
        <path d={limbD([[[-32, -27], 7], [[0, -25], 7.4], [[32, -27], 7]])} fill={ink.deep} {...OUT} strokeWidth={2} />
      </g>
    );
  }
  // the sack: a lumpy filled bag tied at one end; lying over a shoulder it droops at both ends
  const S2: P2[] = lying
    ? [[-50, -6], [-40, -20], [-10, -24], [20, -21], [42, -14], [52, -2], [50, 14], [38, 22], [10, 18], [-14, 22], [-40, 20], [-52, 8]]
    : [[-26, 30], [-32, 6], [-28, -18], [-14, -30], [-6, -34], [6, -34], [14, -30], [28, -18], [32, 6], [26, 30], [0, 34]];
  const D = smoothClosed(S2);
  const fill = mixHex(ink.main, ink.deep, 0.45);
  return (
    <g>
      <clipPath id={`${uid}-sk`}>
        <path d={D} />
      </clipPath>
      <path d={D} fill={fill} {...OUT} strokeWidth={2.3} />
      <g clipPath={`url(#${uid}-sk)`}>
        <ellipse cx={lying ? -12 : -8} cy={lying ? -10 : -6} rx={lying ? 24 : 14} ry={lying ? 8 : 18} fill={ink.main} opacity={0.6} />
        <path d={hatchD(-56, lying ? 2 : -40, 56, 40, 112, 2.6, 781)} {...ln(0.9, 0.5)} />
        <path d={lying ? "M-30,-18Q-24,0 -32,16M8,-20Q14,0 6,18" : "M-14,-26Q-8,0 -16,28M10,-28Q16,0 8,30"} {...ln(1.1, 0.5)} />
      </g>
      {lying ? (
        <path d="M50,-4L60,-8L62,4L52,6Z" fill={fill} {...OUT} strokeWidth={1.8} />
      ) : (
        <>
          <path d="M-6,-34L-10,-44L10,-44L6,-34Z" fill={fill} {...OUT} strokeWidth={1.8} />
          <path d="M-8,-36L8,-36" fill="none" stroke={DARK} strokeWidth={3} />
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAST MEMBER
// ---------------------------------------------------------------------------
export type Garb = "tunic" | "exomis" | "loincloth";
export type RomeFigureProps = {
  kind: RomeKind;
  pose: FigPose;
  /** his feet (world px) and world px per unit (scaleForPx(px), or a perspective's scale) */
  at: P2;
  scale: number;
  uid: string;
  /** 0..ROME_VARIANTS[kind]-1 (face, build, hair, beard); Slave 3 and Freeman 3 are women */
  variant?: number;
  /** skin, hair, iron, leather: the whole figure's inks (default CREAM; shadeInk(t) / tintInk to dim) */
  ink?: Ink;
  /** the garments (default CREAM) */
  cloth?: Ink;
  tone?: number;
  /** the form shadow 0 (default) .. 1, light from the upper left */
  shade?: number;
  /** solve the arms so the HAND GRIPS land on these world points (a bar, a rail, a handle, a rope) */
  grip?: { L?: P2; R?: P2 };
  /** Slave: the garment (default "tunic"; the women always wear the long tunic) */
  garb?: Garb;
  /** Slave: iron rings at both ankles joined by a sagging chain (follows the feet) */
  fetters?: boolean;
  /** the chain's length between the ankles, units (default 74) */
  chainLen?: number;
  /** Slave: an iron neck ring */
  collar?: boolean;
  /** Freeman: the leather apron (default: on for the men, off for the woman) */
  apron?: boolean;
  /** Freeman: the felt pilleus cap (default: on for the men; never on the woman) */
  pilleus?: boolean;
  /** Dominus: the senator's broad stripe on the tunic and the toga's border */
  stripe?: boolean;
  /** Dominus: the ring on his hand (default true) */
  ring?: boolean;
  /** what the hands hold (Overseer default "rod"; others "none"). rod / whip: one fist; hammer / pick: both fists */
  tool?: RomeTool;
  /** which fist holds a rod or whip: "near" (default) or "far" */
  toolIn?: "near" | "far";
  /** the whip's lash swing (pass the frame / 6 or so) */
  toolSway?: number;
  /** (addition) something small in the NEAR hand: "cup" = a shallow wine cup (kylix) held upright by its stem */
  held?: "none" | "cup";
  /** a load on the near shoulder (with POSES.carry): sack, amphora, basket */
  load?: RomeLoad;
  /** draw ONLY this arm (with its sleeve, hand and what it holds), or leave it out */
  onlyArm?: "L" | "R";
  hideArm?: "L" | "R";
};

type RigT = ReturnType<typeof figureRig>;
type ArmRig = RigT["armL"];
type LegRig = RigT["legL"];
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);

/** the drawn tool's geometry (figure-local): the lower grip, the shaft's direction, the far end / head */
const toolGeom = (r: RigT, tool: RomeTool, G: number, toolIn: "near" | "far", limb: number, q?: FigPose) => {
  if (tool === "none") return null;
  const near = G > 0 ? r.armL : r.armR;
  const far = G > 0 ? r.armR : r.armL;
  const thumbDir = (a: ArmRig): P2 => {
    const d = a.dir;
    const n: P2 = [-d[1], d[0]];
    const hint = q ? (a.sgn < 0 ? q.armL.elbow : q.armR.elbow) : null;
    const ts = hint ? thumbSide(a, hint) : Math.abs(n[0]) > 0.25 ? (n[0] * -a.sgn >= 0 ? 1 : -1) : n[1] < 0 ? 1 : -1;
    return mul(n, ts);
  };
  if (tool === "rod" || tool === "whip") {
    const a = toolIn === "far" ? far : near;
    const base = add(a.W, mul(a.dir, 9.5 * limb));
    const u = thumbDir(a);
    return { base, u, head: add(base, mul(u, TOOL_LEN[tool])), two: false, arm: a };
  }
  // two fists: the far fist at the end of the handle, the near fist up the shaft
  const gEnd = add(far.W, mul(far.dir, 9.5 * limb));
  const gUp = add(near.W, mul(near.dir, 9.5 * limb));
  let u = sub(gUp, gEnd);
  u = vlen(u) > 8 ? norm(u) : thumbDir(near);
  return { base: gEnd, u, head: add(gEnd, mul(u, TOOL_LEN[tool] + 2)), two: true, arm: near };
};
/** the load's centre and angle (figure-local) on the near shoulder */
const loadGeom = (r: RigT, G: number) => {
  const near = G > 0 ? r.armL : r.armR;
  const c = add(near.S, [-G * 30, -26]);
  return { c, ang: G * 22 };
};

// ---------------------------------------------------------------------------
// THE LOWER GARMENT (Revision 1: one pure function of the pose, used by the figure and by the pop probes): a hull
// round the legs from the belt to the hem (leg fraction: 0 hip, 1 knee, 2 ankle), continuously draped and resampled
// ---------------------------------------------------------------------------
const legPtOf = (l: LegRig, f: number): P2 => (f <= 1 ? mix2(l.H, l.K, f) : mix2(l.K, l.A, Math.min(1, f - 1)));
const legRadOf = (f: number) => (f <= 1 ? mix(25, 19.5, f) : mix(19.5, 14, Math.min(1, f - 1)));
/** the tunic / toga / loincloth outline in figure-local units (exported for the pop probes) */
export const skirtOutlineOf = (kind: RomeKind, variant: number, q: FigPose, garbProp?: Garb): P2[] => {
  const look = lookOf(kind, variant);
  const sp = look.spec;
  const female = look.female;
  const slave = kind === "slave";
  const toga = kind === "dominus";
  const overseer = kind === "overseer";
  const freeman = kind === "freeman";
  const garb: Garb = slave && !female ? (garbProp ?? "tunic") : "tunic";
  const r = figureRig(sp, q);
  const k = sp.limb;
  const { side } = surface(q.yaw, sp.hw * 0.94, sp.hw * 0.94 * 0.58);
  const wst = female ? 25 : sp.a * 0.56;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;
  const skirtHull = (len: number, flare: number, waistW: number) => {
    const waist = [-waistW, waistW].map((x) => r.toFig(side([x, -14])));
    const pts: P2[] = [...waist];
    for (const l of [r.legL, r.legR]) {
      const n = Math.max(2, Math.ceil(len / 0.25));
      for (let i = 0; i <= n; i++) {
        const f = (i / n) * len;
        pts.push(...circ(add(legPtOf(l, f), [hdx * 0.3 * (f / len), 0]), (legRadOf(f) + flare * (f / len)) * k, 16));
      }
      const hm = legPtOf(l, len);
      const rr = (legRadOf(len) + flare) * k;
      pts.push(add(hm, [-rr - 3 + hdx, 6]), add(hm, [rr + 3 + hdx, 6]), add(hm, [hdx, 8]));
    }
    const bns = [r.legL, r.legR].flatMap((l): Bone[] => [
      { a: l.H, b: l.K, r: 24 * k },
      { a: l.K, b: l.A, r: 17 * k },
    ]);
    // (Revision 1) a continuous drape, then a fixed-count resample from the waist: the outline is a continuous
    // function of the pose (no vertex re-indexing, no draped / not-draped toggles)
    return resampleClosed(drapeC(hull(pts.map((p): P2 => [p[0], Math.min(p[1], -1.5)])), bns), 260, waist[0]);
  };
  const skLen = toga ? 1.8 : female ? 1.86 : garb === "loincloth" ? 0.3 : overseer ? 0.92 : freeman ? 1.0 : 0.74;
  const skFlare = toga ? 9 : female ? 5 : garb === "loincloth" ? 0 : 3;
  const skHull0 = skirtHull(skLen, skFlare, toga ? wst + 9 : wst + 3);
  // the slave's ragged hem: torn teeth along the lower edge, fixed in the figure's own space (a function of x from
  // the hip, never of a vertex index), fading in over the last 16 units of the hem
  const skHull = slave
    ? (() => {
        const yMax = Math.max(...skHull0.map((p) => p[1]));
        return skHull0.map((p): P2 => {
          const u = (p[0] - r.hip[0]) / 11 + variant * 0.37;
          const cell = Math.floor(u);
          const tooth = 1 - Math.abs(2 * (u - cell) - 1);
          return [p[0], p[1] + tooth * (3.4 + 3.4 * hash(cell + 999, 811)) * c01((p[1] - yMax + 16) / 9)];
        });
      })()
    : skHull0;
  return skHull;
};

export const RomeFigure: React.FC<RomeFigureProps> = (props) => {
  const { kind, at, scale, uid, tone = 1 } = props;
  const variant = props.variant ?? 0;
  const look = lookOf(kind, variant);
  const sp = look.spec;
  const q = props.grip ? gripTo(kind, variant, props.pose, props.grip, at, scale) : props.pose;
  const shadeAmt = props.shade ?? 0;
  const ink = props.ink ?? CREAM;
  const cloth = props.cloth ?? CREAM;
  const female = look.female;
  const slave = kind === "slave";
  const freeman = kind === "freeman";
  const dominus = kind === "dominus";
  const overseer = kind === "overseer";
  const garb: Garb = slave && !female ? (props.garb ?? "tunic") : "tunic";
  const toga = dominus;
  const tool: RomeTool = props.tool ?? (overseer ? "rod" : "none");
  const load: RomeLoad = props.load ?? "none";
  const apron = freeman && (props.apron ?? !female);
  const pilleus = freeman && !female && (props.pilleus ?? true);
  const fetters = slave && !!props.fetters;
  const collar = slave && !!props.collar;
  const r = figureRig(sp, q);
  const { s } = r;
  const k = sp.limb;
  const hw = sp.hw;
  const shY = r.shY;
  const sfT = surface(q.yaw, hw * 0.94, hw * 0.94 * 0.58);
  const { side } = sfT;
  const mT = sfT.mF;
  const tf = `translate(${at[0].toFixed(3)} ${at[1].toFixed(3)}) scale(${scale.toFixed(5)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`;
  const shL: P2 = [-hw, shY];
  const shR: P2 = [hw, shY];
  const neck: P2 = [0, shY];
  const wst = female ? 25 : sp.a * 0.56;
  // (Revision 1) the far arm goes behind the body from |sin yaw| 0.3 (it hangs beside the body there, so the layer
  // change is invisible; at 0.5 it crossed the chest in three-quarter work poses and popped)
  const profile = Math.abs(s) > 0.3;
  const G = s >= 0 ? 1 : -1;
  const leather = mixHex(ink.hair, ink.deep, 0.22);
  const skin = ink.main;
  const skinDeep = ink.deep;
  // the slave's coarse undyed wool is a step down from the free cream; the toga the brightest, fullest cloth
  const coarse = mixHex(cloth.deep, cloth.hair, 0.3);
  const tunicFill = slave ? coarse : cloth.main;
  const tunicDeep = slave ? mixHex(cloth.deep, cloth.hair, 0.35) : cloth.deep;
  const feet: FootKind = slave ? "bare" : dominus ? "shoe" : overseer ? "caliga" : "sandal";
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;

  // ---- the lower garment: a hull round the legs from the belt to the hem (leg fraction: 0 hip, 1 knee, 2 ankle) ----
  const legPt = legPtOf;
  const skHull = skirtOutlineOf(kind, variant, q, props.garb);
  const SK = polyD(skHull);
  const skX0 = Math.min(...skHull.map((p) => p[0]));
  const skX1 = Math.max(...skHull.map((p) => p[0]));
  const skY0 = Math.min(...skHull.map((p) => p[1]));
  const skY1 = Math.max(...skHull.map((p) => p[1]));
  const nFold = toga ? 7 : 4;
  const folds = Array.from({ length: nFold }, (_, i) => {
    const t = (i + 0.5) / nFold;
    const hx = mix(skX0 + 8, skX1 - 8, t) + 4 * (hash(i, 801) - 0.5);
    const hy = bottomAt(skHull, hx) - 3;
    const wx = mix(skX0 + 10, skX1 - 10, mix(0.2, 0.8, t));
    const wy = skY0 + 14 + 8 * hash(i, 802);
    const cc: P2 = [mix(wx, hx, 0.35) + (t - 0.5) * 10 + hdx * 0.3, mix(wy, hy, 0.55)];
    return { a: [wx, wy] as P2, b: [hx, hy] as P2, c: cc, i };
  });
  const skFill = toga ? cloth.main : garb === "loincloth" ? coarse : tunicFill;
  const skDeep = toga ? cloth.deep : tunicDeep;
  const skirtEl = (
    <>
      <clipPath id={`${uid}-sk`}>
        <path d={SK} />
      </clipPath>
      <path d={SK} fill={skFill} {...OUT} />
      <RimShade id={`${uid}-rssk`} d={SK} off={[24, 6]} box={[skX0, skY0, skX1, skY1 + 10]} col={skDeep} amt={shadeAmt} seed={965} />
      <g clipPath={`url(#${uid}-sk)`}>
        <path d={hatchD(mix(skX0, skX1, 0.62), skY0, skX1 + 4, skY1 + 4, 111, slave ? 2.6 : 3, 811, 0.28, r.hip[0], r.hip[1])} {...ln(0.95, slave ? 0.62 : 0.55)} />
        <path d={hatchD(mix(skX0, skX1, 0.78), skY0 + 14, skX1 + 4, skY1 + 4, 62, 3.6, 812, 0.28, r.hip[0], r.hip[1])} {...ln(0.9, 0.42)} />
        {slave ? <path d={hatchD(skX0, skY0, skX1, skY1, 20, 5.5, 813, 0.6, r.hip[0], r.hip[1])} {...ln(0.8, 0.28)} /> : null}
        {toga
          ? folds.map((f) => <path key={`v${f.i}`} d={limbD([[add(f.a, [2.5, 6]), 2], [add(f.c, [3, 0]), 6], [add(f.b, [3, -2]), 7]])} fill={cloth.deep} opacity={0.8} />)
          : null}
        {folds.map((f) => (
          <path key={f.i} d={segD(foldHatchSegs(f.a, f.c, f.b, 820 + f.i, 8 + 4 * hash(f.i, 821)))} {...ln(0.9, 0.5)} />
        ))}
        <path d={folds.map((f) => `M${P(f.a)}Q${P(f.c)} ${P(f.b)}`).join("")} {...ln(toga ? 1.6 : 1.4, 0.75)} />
        {/* the hem: a turned edge */}
        {!slave ? <path d={`M${P([skX0, skY1 - 9])}Q${P([(skX0 + skX1) / 2 + hdx * 0.3, skY1 - 2])} ${P([skX1, skY1 - 11])}`} {...ln(1.1, 0.45)} /> : null}
        {props.stripe && toga ? <path d={`M${P([skX0, skY1 - 4])}Q${P([(skX0 + skX1) / 2 + hdx * 0.3, skY1 + 3])} ${P([skX1, skY1 - 6])}`} fill="none" stroke={mixHex(cloth.hair, DARK, 0.25)} strokeWidth={7} /> : null}
      </g>
    </>
  );
  // the toga's end falling from the left shoulder to the hem down his left side (torso frame, carried round the body)
  const togaEnd = toga
    ? (() => {
        const yB = skY1 - r.hip[1] - 4;
        const pts: P2[] = [
          [hw * 0.42, shY + 6],
          [hw * 0.98, shY - 2],
          [hw * 1.06, shY + 60],
          [hw * 1.12, yB - 6],
          [hw * 0.95, yB + 2],
          [hw * 0.78, yB - 8],
          [hw * 0.6, yB + 1],
          [hw * 0.46, yB - 10],
          [hw * 0.4, shY + 70],
        ];
        const D = smoothClosed(pts.map((p) => r.toFig(mT(p))));
        const fold = (x0: number, x1: number) => `M${P(r.toFig(mT([hw * x0, shY + 14])))}Q${P(r.toFig(mT([hw * ((x0 + x1) / 2 + 0.03), shY + 90])))} ${P(r.toFig(mT([hw * x1, yB - 12])))}`;
        const bx = pts.map((p) => r.toFig(mT(p)));
        return (
          <g>
            <clipPath id={`${uid}-te`}>
              <path d={D} />
            </clipPath>
            <path d={D} fill={cloth.main} {...OUT} />
            <g clipPath={`url(#${uid}-te)`}>
              <path d={hatchD(Math.min(...bx.map((p) => p[0])) + 14, Math.min(...bx.map((p) => p[1])), Math.max(...bx.map((p) => p[0])) + 4, Math.max(...bx.map((p) => p[1])) + 4, 112, 2.6, 871, 0.15)} {...ln(0.9, 0.5)} />
              <path d={fold(0.6, 0.62) + fold(0.8, 0.86) + fold(0.95, 1.02)} {...ln(1.5, 0.75)} />
              {props.stripe ? <path d={`M${P(r.toFig(mT([hw * 0.48, shY + 10])))}L${P(r.toFig(mT([hw * 0.5, yB - 10])))}`} fill="none" stroke={mixHex(cloth.hair, DARK, 0.25)} strokeWidth={5} /> : null}
            </g>
          </g>
        );
      })()
    : null;
  // the loincloth's front flap, between the thighs
  const flapEl =
    garb === "loincloth"
      ? (() => {
          const w0 = r.toFig(mT([-12, 4]));
          const w1 = r.toFig(mT([12, 4]));
          const lo = add(mix2(legPt(r.legL, 0.42), legPt(r.legR, 0.42), 0.5), [hdx * 0.2, 4]);
          const F = `M${P(w0)}L${P(w1)}L${P(add(lo, [9, 0]))}Q${P(add(lo, [0, 4]))} ${P(add(lo, [-9, 0]))}Z`;
          return (
            <g>
              <path d={F} fill={coarse} {...OUT} strokeWidth={2.1} />
              <path d={`M${P(mix2(w0, w1, 0.65))}L${P(add(lo, [4, -2]))}`} {...ln(1, 0.5)} />
            </g>
          );
        })()
      : null;
  // the toga's sinus: the swag of cloth hanging in a curve across the front of the thighs, from the right hip
  // (Revision 1) lying down is a continuous blend (0 upright .. 1 reclined), never a switch
  const lie = sstep01((Math.abs(q.lean) - 30) / 14);
  const sinusStand = toga && lie < 0.999
    ? (() => {
        const L0 = r.toFig(mT([-wst - 8, -6]));
        const R0 = r.toFig(mT([wst * 0.75, -16]));
        const kneeY = (r.legL.K[1] + r.legR.K[1]) / 2;
        const bot: P2 = [mix(L0[0], R0[0], 0.45) + hdx * 0.4, Math.max(L0[1], R0[1]) + Math.max(40, (kneeY - Math.max(L0[1], R0[1])) * 0.82)];
        const out: P2 = add(bot, [0, 0]);
        const inn: P2 = add(bot, [4, -26]);
        const SIN = `M${P(L0)}Q${P([L0[0] - 6, out[1]])} ${P(out)}Q${P([R0[0] + 10, out[1] + 4])} ${P(R0)}L${P(add(R0, [-6, -2]))}Q${P([R0[0] - 6, inn[1]])} ${P(inn)}Q${P([L0[0] + 8, inn[1] - 6])} ${P(add(L0, [8, -2]))}Z`;
        const ring = (u: number) => {
          const o = mix2(out, inn, u);
          return `M${P(mix2(L0, add(L0, [8, -2]), u))}Q${P([mix(L0[0] - 6, L0[0] + 8, u), o[1] - 2])} ${P(o)}Q${P([mix(R0[0] + 10, R0[0] - 6, u), o[1] + 2])} ${P(mix2(R0, add(R0, [-6, -2]), u))}`;
        };
        return (
          <g>
            <path d={`M${P(add(L0, [-4, 8]))}Q${P([L0[0] - 6, out[1] + 8])} ${P(add(out, [4, 8]))}Q${P([R0[0] + 12, out[1] + 10])} ${P(add(R0, [6, 8]))}`} fill="none" stroke={DARK} strokeWidth={9} strokeOpacity={0.28} />
            <clipPath id={`${uid}-sn`}>
              <path d={SIN} />
            </clipPath>
            <path d={SIN} fill={cloth.main} {...OUT} />
            <g clipPath={`url(#${uid}-sn)`}>
              <path d={[0.3, 0.55, 0.8].map(ring).join("")} {...ln(1.3, 0.7)} />
              <path d={hatchD(bot[0] - 10, bot[1] - 30, R0[0] + 14, bot[1] + 6, 112, 2.6, 841)} {...ln(0.9, 0.5)} />
              <path d={hatchD(L0[0] - 10, bot[1] - 12, R0[0] + 14, bot[1] + 6, 60, 3.2, 842)} {...ln(0.85, 0.35)} />
            </g>
          </g>
        );
      })()
    : null;
  const sinusLie = toga && lie > 0.001
      ? (() => {
          // (addition) lying down: a simplified swag from the waist sagging along the thighs (the toga still reads)
          const W0 = r.toFig(mT([-wst - 6, -4]));
          const W1 = r.toFig(mT([wst * 0.7, -18]));
          const T = mix2(legPt(r.legL, 0.55), legPt(r.legR, 0.55), 0.5);
          const M = mix2(W0, W1, 0.5);
          const cOut = add(T, mul(norm(sub(T, M)), 14));
          const cIn = mix2(M, T, 0.5);
          const SW = `M${P(W0)}Q${P(cOut)} ${P(W1)}L${P(mix2(W1, M, 0.18))}Q${P(cIn)} ${P(mix2(W0, M, 0.18))}Z`;
          const ring = (u: number) => `M${P(mix2(W0, mix2(W0, M, 0.18), u))}Q${P(mix2(cOut, cIn, u))} ${P(mix2(W1, mix2(W1, M, 0.18), u))}`;
          const xs = [W0[0], W1[0], cOut[0]];
          const ys = [W0[1], W1[1], cOut[1]];
          return (
            <g>
              <path d={`M${P(add(W0, [2, 7]))}Q${P(add(cOut, [3, 8]))} ${P(add(W1, [4, 7]))}`} fill="none" stroke={DARK} strokeWidth={8} strokeOpacity={0.26} />
              <clipPath id={`${uid}-sl`}>
                <path d={SW} />
              </clipPath>
              <path d={SW} fill={cloth.main} {...OUT} />
              <g clipPath={`url(#${uid}-sl)`}>
                <path d={[0.3, 0.58, 0.82].map(ring).join("")} {...ln(1.3, 0.7)} />
                <path d={hatchD(Math.min(...xs) - 10, Math.min(...ys), Math.max(...xs) + 10, Math.max(...ys) + 10, 112, 2.6, 843)} {...ln(0.85, 0.42)} />
              </g>
            </g>
          );
        })()
      : null;
  const sinusEl = (
    <>
      {sinusStand ? <g opacity={1 - lie}>{sinusStand}</g> : null}
      {sinusLie ? <g opacity={lie}>{sinusLie}</g> : null}
    </>
  );

  // ---- the legs: bare, with their feet; the fetters' rings ----------------------------------------------------
  const legSt = (l: LegRig): St[] => {
    const calf = mix2(l.K, l.A, 0.34);
    return [
      [l.H, 22 * k],
      [mix2(l.H, l.K, 0.5), 19.5 * k],
      [l.K, 15.5 * k],
      [[calf[0] - r.s * 2 * k + l.sgn * 1.2 * r.c, calf[1]], 17.5 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
  };
  const legEl = (l: LegRig) => {
    const D = limbD(legSt(l));
    const u = norm(sub(l.A, l.K));
    const n: P2 = [-u[1], u[0]];
    return (
      <g key={l.sgn}>
        <path d={D} fill={skin} {...OUT} />
        <RimShade id={`${uid}-rsl${l.sgn}`} d={D} off={[7, 2]} box={bboxOf([l.H, l.K, l.A], 16)} col={skinDeep} amt={shadeAmt} seed={961 + l.sgn} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + l.sgn, 3)} {...ln(0.95, 0.58)} />
        <path d={braceletD(l.H, l.K, 21 * k, 16 * k, 83 + l.sgn, 3.2, 0.7)} {...ln(0.9, 0.45)} />
        <path d={`M${P([l.K[0] - 5, l.K[1] + 1])}Q${P([l.K[0] + 2 * r.s, l.K[1] + 5])} ${P([l.K[0] + 5, l.K[1] + 1])}`} {...ln(1, 0.5)} />
        {feet === "caliga" ? (
          // the straps of the soldier's boot-sandal laced up the shin
          <path d={[0.62, 0.72, 0.82].map((f) => `M${P(add(mix2(l.K, l.A, f), mul(n, -8.5 * k)))}L${P(add(mix2(l.K, l.A, f + 0.06), mul(n, 8.5 * k)))}`).join("")} fill="none" stroke={DARK} strokeWidth={3.4} strokeLinecap="round" />
        ) : null}
        {feet === "caliga" ? <path d={[0.62, 0.72, 0.82].map((f) => `M${P(add(mix2(l.K, l.A, f), mul(n, -8.5 * k)))}L${P(add(mix2(l.K, l.A, f + 0.06), mul(n, 8.5 * k)))}`).join("")} fill="none" stroke={leather} strokeWidth={1.6} strokeLinecap="round" /> : null}
        <Foot A={l.A} sgn={l.sgn} yaw={q.yaw} lift={l.lift} k={k} ink={ink} kind={feet} leather={feet === "shoe" ? mixHex(leather, DARK, 0.25) : leather} />
        {fetters ? <IronRing c={add(l.A, mul(u, -7 * k))} rx={12.5 * k} ry={4.2 * k} w={3.4} ink={ink} /> : null}
      </g>
    );
  };
  const legsSorted = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const chainEl = fetters
    ? (() => {
        const a = add(r.legL.A, mul(norm(sub(r.legL.A, r.legL.K)), -5 * k));
        const b = add(r.legR.A, mul(norm(sub(r.legR.A, r.legR.K)), -5 * k));
        return <ChainArt pts={chainPts(a, b, props.chainLen ?? 74, 4)} link={5.4} ink={ink} count={Math.round((props.chainLen ?? 74) / 5.4)} />;
      })()
    : null;

  // ---- the torso -----------------------------------------------------------------------------------------------
  /** the torso's outline, from the shoulders to y = tb (torso-local; -12 = at the belt, hidden under it) */
  const torsoPath = (tb: number) =>
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 3, shY + 26]))} ${P(side([wst + 4, -52]))} ${P(side([wst + 1, -26]))}C${P(side([wst, -20]))} ${P(side([wst + 2, tb - 6]))} ${P(side([wst + 3, tb]))}L${P(side([-wst - 3, tb]))}` +
    `C${P(side([-wst - 2, tb - 6]))} ${P(side([-wst, -20]))} ${P(side([-wst - 1, -26]))}C${P(side([-wst - 4, -52]))} ${P(side([-hw - 3, shY + 26]))} ${P(side(add(shL, [1, -4])))}Z`;
  const TORSO = torsoPath(-11);
  const bareTorso = garb === "loincloth" || garb === "exomis";
  // the bare chest: the clavicles, the pectorals, the sternum, the ribs on the shadow side, the navel
  const chestLines = (
    <>
      <path d={[-1, 1].map((sd) => `M${P(mT([sd * 4, shY + 5]))}Q${P(mT([sd * 18, shY + 3]))} ${P(mT([sd * (hw - 10), shY + 4]))}`).join("")} {...ln(1.1, 0.55)} />
      <path d={[-1, 1].map((sd) => `M${P(mT([sd * 3, shY + 30]))}Q${P(mT([sd * 18, shY + 42]))} ${P(mT([sd * (hw - 9), shY + 26]))}`).join("")} {...ln(1.3, 0.72)} />
      <path d={`M${P(mT([0, shY + 14]))}L${P(mT([0, shY + 34]))}`} {...ln(1, 0.4)} />
      <path d={[0, 1, 2].map((i) => `M${P(mT([4, shY + 50 + i * 11]))}Q${P(mT([16, shY + 47 + i * 11]))} ${P(mT([wst - 2, shY + 52 + i * 11]))}`).join("")} {...ln(0.9, 0.38)} />
      <path d={`M${P(mT([-2, -10]))}q2,2.4 4,0`} {...ln(1.1, 0.6)} />
    </>
  );
  // the neckline of a tunic: a round opening showing the throat
  const necklineEl = (
    <>
      <path d={`M${P(mT([-13, shY - 3]))}Q${P(mT([0, shY + 13]))} ${P(mT([13, shY - 3]))}Z`} fill={skin} {...OUT} strokeWidth={1.8} />
      <path d={`M${P(mT([-9, shY + 1]))}Q${P(mT([0, shY + 8]))} ${P(mT([9, shY + 1]))}`} {...ln(0.9, 0.35)} />
    </>
  );
  const torsoShade = (d: string, col: string, seed: number) => <RimShade id={`${uid}-rst${seed}`} d={d} off={[22, 5]} box={[-hw - 12, shY - 12, hw + 12, 14]} col={col} amt={shadeAmt} seed={seed} />;
  const torsoHatch = (
    <>
      <path d={segD(hatchSegs(hw * 0.34, shY + 4, hw + 8, 10, 113, 2.8, 831), side)} {...ln(1, 0.6)} />
      <path d={segD(hatchSegs(hw * 0.55, shY + 34, hw + 8, 10, 60, 3.4, 832), side)} {...ln(0.9, 0.42)} />
    </>
  );
  // the exomis: the tunic pinned on the left shoulder only, the right shoulder and chest bare
  const EXO = `M${P(side([-wst - 2, shY + 46]))}Q${P(mT([-10, shY + 22]))} ${P(mT([hw * 0.42, shY - 3]))}L${P(side(add(shR, [-1, -4])))}C${P(side([hw + 3, shY + 26]))} ${P(side([wst + 4, -52]))} ${P(side([wst + 1, -26]))}C${P(side([wst, -20]))} ${P(side([wst + 2, -17]))} ${P(side([wst + 3, -11]))}L${P(side([-wst - 3, -11]))}C${P(side([-wst - 2, -17]))} ${P(side([-wst, -20]))} ${P(side([-wst - 1, -26]))}Z`;
  // the toga over the torso: over the left shoulder, the balteus running from it down across the chest to under the
  // right arm; the tunic shows on the right of the chest
  const TOGA_UP = `M${P(side(add(shR, [4, -8])))}Q${P(side(add(neck, [12, -8])))} ${P(mT([5, shY - 5]))}Q${P(mT([-10, shY + 30]))} ${P(mT([-wst - 4, -18]))}L${P(side([-wst - 7, -4]))}L${P(side([wst + 8, -4]))}C${P(side([wst + 6, -16]))} ${P(side([wst + 8, -50]))} ${P(side([hw + 8, shY + 30]))}Q${P(side([hw + 8, shY + 2]))} ${P(side(add(shR, [4, -8])))}Z`;
  const balteus = limbD([
    [mT([7, shY - 4]), 11],
    [mT([-3, shY + 22]), 15],
    [mT([-16, shY + 54]), 16],
    [mT([-wst - 3, -20]), 14],
  ]);
  const beltEl = (
    <>
      <path d={limbD([[mT([-wst - 3, -14]), 7], [mT([0, -12]), 7], [mT([wst + 3, -14]), 7]])} fill={slave ? mixHex(cloth.hair, cloth.deep, 0.3) : leather} {...OUT} strokeWidth={2} />
      {slave ? <path d={[-0.7, -0.35, 0, 0.35, 0.7].map((u) => `M${P(mT([u * wst - 2, -16]))}l3,4`).join("")} {...ln(1, 0.6)} /> : <path d={`M${P(mT([-wst, -12.5]))}Q${P(mT([0, -10.8]))} ${P(mT([wst, -12.5]))}`} fill="none" stroke={ink.main} strokeWidth={0.9} strokeOpacity={0.45} />}
      {/* the cloth bloused over the belt */}
      <path d={`M${P(mT([-wst, -20]))}Q${P(mT([-wst * 0.5, -16]))} ${P(mT([0, -19]))}Q${P(mT([wst * 0.5, -16]))} ${P(mT([wst, -20]))}`} {...ln(1, 0.5)} />
    </>
  );
  const torsoEl = (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-tor`}>
        <path d={TORSO} />
      </clipPath>
      {bareTorso ? (
        <>
          <path d={TORSO} fill={skin} {...OUT} />
          {torsoShade(TORSO, skinDeep, 967)}
          <g clipPath={`url(#${uid}-tor)`}>
            {torsoHatch}
            {chestLines}
          </g>
          {garb === "loincloth" ? <path d={limbD([[mT([-wst - 4, -8]), 13], [mT([0, -5]), 13], [mT([wst + 4, -8]), 13]])} fill={coarse} {...OUT} strokeWidth={2.1} /> : null}
        </>
      ) : null}
      {garb === "exomis" ? (
        <>
          <clipPath id={`${uid}-exo`}>
            <path d={EXO} />
          </clipPath>
          <path d={EXO} fill={tunicFill} {...OUT} />
          {torsoShade(EXO, tunicDeep, 968)}
          <g clipPath={`url(#${uid}-exo)`}>
            {torsoHatch}
            <path d={hatchD(-hw, shY, hw, 10, 20, 5.5, 833, 0.6)} {...ln(0.8, 0.28)} />
            <path d={[-1, 1].map((sd) => `M${P(mT([sd * 6 + 6, shY + 4]))}Q${P(mT([sd * 10, shY + 50]))} ${P(mT([sd * 14, -20]))}`).join("")} {...ln(1.1, 0.5)} />
          </g>
          {/* the knot on the left shoulder */}
          <circle cx={side(add(shR, [-14, -2]))[0]} cy={shY - 2} r={5.4} fill={tunicDeep} {...OUT} strokeWidth={1.9} />
          {beltEl}
        </>
      ) : null}
      {!bareTorso ? (
        <>
          <path d={TORSO} fill={tunicFill} {...OUT} />
          {torsoShade(TORSO, tunicDeep, 969)}
          <g clipPath={`url(#${uid}-tor)`}>
            {torsoHatch}
            {slave ? <path d={hatchD(-hw, shY, hw, 10, 20, 5.5, 834, 0.6)} {...ln(0.8, 0.28)} /> : null}
            {/* the drape from the shoulders to the belt */}
            <path d={[-1, 1].map((sd) => `M${P(mT([sd * (hw - 12), shY + 12]))}Q${P(mT([sd * 20, shY + 50]))} ${P(mT([sd * 13, -20]))}`).join("")} {...ln(1.1, 0.5)} />
            {female ? <path d={`M${P(mT([-22, shY + 36]))}Q${P(mT([-11, shY + 44]))} ${P(mT([0, shY + 38]))}Q${P(mT([11, shY + 44]))} ${P(mT([22, shY + 36]))}`} {...ln(1.1, 0.5)} /> : null}
            {/* the senator's broad stripes (clavi) down the tunic */}
            {props.stripe && toga ? <path d={[-15, 15].map((x) => `M${P(mT([x, shY - 4]))}L${P(mT([x, 10]))}`).join("")} fill="none" stroke={mixHex(cloth.hair, DARK, 0.25)} strokeWidth={7} /> : null}
          </g>
          {necklineEl}
          {!toga ? beltEl : null}
        </>
      ) : null}
      {toga ? (
        <>
          <clipPath id={`${uid}-tg`}>
            <path d={TOGA_UP} />
          </clipPath>
          <path d={TOGA_UP} fill={cloth.main} {...OUT} />
          {torsoShade(TOGA_UP, cloth.deep, 970)}
          <g clipPath={`url(#${uid}-tg)`}>
            {torsoHatch}
            {/* the cloth wrapped across the body: swags falling from the left shoulder diagonally to the right hip */}
            {[0, 1, 2, 3, 4].map((i) => {
              const a = mT([hw - 2 - i * 3, shY + 10 + i * 17]);
              const b = mT([-wst + 4 + i * 11, -6]);
              const c = mT([mix(hw - 2 - i * 3, -wst + 4 + i * 11, 0.45), mix(shY + 10 + i * 17, -6, 0.62)]);
              return (
                <g key={`sw${i}`}>
                  <path d={segD(foldHatchSegs(add(a, [2, 4]), add(c, [2, 5]), add(b, [2, 4]), 850 + i, 6))} {...ln(0.85, 0.45)} />
                  <path d={`M${P(a)}Q${P(c)} ${P(b)}`} {...ln(1.3, 0.66)} />
                </g>
              );
            })}
          </g>
          {/* the balteus: the rolled edge of the toga across the chest */}
          <clipPath id={`${uid}-bl`}>
            <path d={balteus} />
          </clipPath>
          <path d={balteus} fill={cloth.main} {...OUT} />
          <g clipPath={`url(#${uid}-bl)`}>
            <path d={`M${P(mT([2, shY - 2]))}Q${P(mT([-8, shY + 26]))} ${P(mT([-wst - 6, -16]))}M${P(mT([12, shY]))}Q${P(mT([0, shY + 34]))} ${P(mT([-wst + 6, -24]))}`} {...ln(1.2, 0.6)} />
            <path d={hatchD(-wst - 10, shY - 6, 14, 0, 30, 3, 861, 0.3)} {...ln(0.85, 0.35)} />
          </g>
          {props.stripe ? <path d={`M${P(mT([10, shY - 3]))}Q${P(mT([1, shY + 26]))} ${P(mT([-12, shY + 58]))}T${P(mT([-wst - 1, -15]))}`} fill="none" stroke={mixHex(cloth.hair, DARK, 0.25)} strokeWidth={4} /> : null}
          {/* the umbo: a pouch of the toga pulled out over the balteus (a soft bulge of folds) */}
          <path d={`M${P(mT([-22, shY + 54]))}Q${P(mT([-18, shY + 76]))} ${P(mT([-2, shY + 74]))}Q${P(mT([8, shY + 66]))} ${P(mT([4, shY + 50]))}`} {...ln(1.5, 0.75)} />
          <path d={`M${P(mT([-15, shY + 60]))}Q${P(mT([-12, shY + 70]))} ${P(mT([-3, shY + 69]))}`} {...ln(1, 0.5)} />
        </>
      ) : null}
      {/* the collar's back, round the neck */}
      {!bareTorso ? <path d={limbD([[side([-15, shY - 1]), 6.5], [side([0, shY - 6.5]), 6.5], [side([15, shY - 1]), 6.5]])} fill={toga ? cloth.deep : tunicDeep} {...OUT} strokeWidth={1.9} /> : null}
    </g>
  );
  // the overseer's short cloak: behind him (wider than his body) and over his left shoulder, pinned on the right
  const cloakCol = mixHex(cloth.deep, cloth.hair, 0.55);
  const cloakBack = overseer ? (
    <g transform={`${tf} ${torsoTf}`}>
      <path d={`M${P(side(add(shL, [-4, -2])))}L${P(side(add(shR, [6, -4])))}C${P(side([hw + 14, shY + 40]))} ${P(side([hw + 16, 20]))} ${P(side([hw + 12, 52]))}L${P(side([-hw - 6, 44]))}C${P(side([-hw - 8, 10]))} ${P(side([-hw - 8, shY + 40]))} ${P(side(add(shL, [-4, -2])))}Z`} fill={mixHex(cloakCol, DARK, 0.25)} {...OUT} />
      <path d={hatchD(-hw - 10, shY, hw + 18, 56, 100, 3, 871)} {...ln(0.8, 0.35)} />
    </g>
  ) : null;
  const CLOAK_F = `M${P(side(add(shL, [10, -6])))}Q${P(side(add(neck, [4, -9])))} ${P(side(add(shR, [8, -6])))}C${P(side([hw + 12, shY + 30]))} ${P(side([hw + 13, 0]))} ${P(side([hw + 9, 36]))}Q${P(mT([hw - 20, 42]))} ${P(mT([hw * 0.2, 14]))}Q${P(mT([-hw * 0.3, shY + 46]))} ${P(side(add(shL, [10, -6])))}Z`;
  const fib = side(add(shL, [10, -4]));
  const cloakFront = overseer ? (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-ck`}>
        <path d={CLOAK_F} />
      </clipPath>
      <path d={CLOAK_F} fill={cloakCol} {...OUT} />
      {torsoShade(CLOAK_F, mixHex(cloakCol, DARK, 0.3), 971)}
      <g clipPath={`url(#${uid}-ck)`}>
        <path d={hatchD(0, shY - 10, hw + 16, 36, 112, 2.7, 872)} {...ln(0.95, 0.55)} />
        <path d={[0, 1, 2, 3].map((i) => `M${P(add(fib, [4, 2]))}Q${P(mT([-4 + i * 12, shY + 36 + i * 4]))} ${P(mT([hw * 0.2 + i * 12, 16 + i * 6]))}`).join("")} {...ln(1.2, 0.62)} />
      </g>
      {/* the fibula: a round brooch on the right shoulder */}
      <circle cx={fib[0]} cy={fib[1]} r={6.4} fill={mixHex(ink.hair, ink.main, 0.4)} {...OUT} strokeWidth={2} />
      <circle cx={fib[0] - 1.4} cy={fib[1] - 1.4} r={2} fill={ink.main} opacity={0.8} />
    </g>
  ) : null;
  // the freeman's leather apron, from the chest to the knee, a strap round the neck
  const apronEl = (() => {
    if (!apron) return null;
    const top = r.toFig(mT([0, shY + 36]));
    const kn = add(mix2(r.legL.K, r.legR.K, 0.5), [hdx * 0.3, 10]);
    const ax = norm(sub(kn, top));
    const len = Math.max(60, vlen(sub(kn, top)));
    const n: P2 = [-ax[1], ax[0]];
    const wf = sfT.wf;
    const bot = add(top, mul(ax, len));
    const pts: P2[] = [add(top, mul(n, 17 * wf)), add(mix2(top, bot, 0.35), mul(n, 25 * wf)), add(bot, mul(n, 27 * wf)), add(bot, mul(n, -27 * wf)), add(mix2(top, bot, 0.35), mul(n, -25 * wf)), add(top, mul(n, -17 * wf))];
    const AP = polyD(pts);
    const strapA = r.toFig(side([-14, shY - 3]));
    const strapB = r.toFig(side([14, shY - 3]));
    return (
      <g transform={tf}>
        <Cased id={`${uid}-apc`}>
          <path d={`M${P(pts[0])}L${P(strapB)}M${P(pts[5])}L${P(strapA)}`} fill="none" stroke={DARK} strokeWidth={4.6} strokeLinecap="round" />
          <path d={`M${P(pts[0])}L${P(strapB)}M${P(pts[5])}L${P(strapA)}`} fill="none" stroke={leather} strokeWidth={2.4} strokeLinecap="round" />
          <clipPath id={`${uid}-ap`}>
            <path d={AP} />
          </clipPath>
          <path d={AP} fill={leather} {...OUT} />
          <g clipPath={`url(#${uid}-ap)`}>
            <path d={hatchD(Math.min(...pts.map((p) => p[0])) - 4, Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])) + 4, Math.max(...pts.map((p) => p[1])), 104, 2.8, 891)} {...ln(0.9, 0.55)} />
            <path d={[0.3, 0.55, 0.8].map((t) => `M${P(add(mix2(top, bot, t * 0.4), mul(n, (t - 0.55) * 30 * wf)))}Q${P(add(mix2(top, bot, t * 0.7), mul(n, (t - 0.55) * 34 * wf)))} ${P(add(bot, mul(n, (t - 0.55) * 46 * wf)))}`).join("")} {...ln(1.2, 0.6)} />
          </g>
          <path d={`M${P(add(top, mul(n, -15 * wf)))}L${P(add(top, mul(n, 15 * wf)))}`} {...ln(1.4, 0.75)} />
        </Cased>
      </g>
    );
  })();

  // ---- the arms: bare skin from shoulder to hand, a sleeve over the upper arm (short tunic sleeve; a woman's to the
  // elbow; none on the exomis' bare side or with the loincloth; the toga wraps the left arm to the forearm) ---------
  type SleeveKind = "none" | "short" | "elbow" | "toga";
  const sleeveOf = (ar: ArmRig): SleeveKind => {
    if (garb === "loincloth") return "none";
    if (garb === "exomis" && ar.sgn < 0) return "none";
    if (toga && ar.sgn > 0) return "toga";
    return female ? "elbow" : "short";
  };
  const armArt = (ar: ArmRig) => {
    const uu = norm(sub(ar.E, ar.S));
    const fu = norm(sub(ar.W, ar.E));
    const un: P2 = [-uu[1], uu[0]];
    const fn: P2 = [-fu[1], fu[0]];
    const sk = sleeveOf(ar);
    const skinSt: St[] = [
      [ar.S, 25 * k],
      [mix2(ar.S, ar.E, 0.42), 23 * k],
      [ar.E, 17.5 * k],
      [mix2(ar.E, ar.W, 0.36), 18 * k],
      [add(ar.W, mul(fu, -1)), 12.5 * k],
    ];
    const SKIN = limbD(skinSt);
    const sleeveEnd = sk === "elbow" ? mix2(ar.S, ar.E, 0.96) : mix2(ar.S, ar.E, 0.5);
    const SLV = sk === "short" || sk === "elbow" ? limbD([[add(ar.S, mul(uu, 6)), 27 * k], [mix2(ar.S, sleeveEnd, 0.6), 25.5 * k], [sleeveEnd, 25 * k]]) : "";
    const tEnd = mix2(ar.E, ar.W, 0.55);
    const tw = [31, 29, 27, 25].map((v, i) => mix(v, [23, 21.5, 19.5, 18][i], lie));
    const TSLV = sk === "toga" ? limbD([[add(ar.S, mul(uu, 5)), tw[0] * k], [mix2(ar.S, ar.E, 0.5), tw[1] * k], [ar.E, tw[2] * k], [tEnd, tw[3] * k]]) : "";
    // the toga's end hanging from the wrapped forearm (straight down: gravity, in figure space)
    const hangA = mix2(ar.E, ar.W, 0.08);
    const hangB = mix2(ar.E, ar.W, 0.5);
    const hDrop = 74 * (1 - lie);
    const HANG = sk === "toga" && lie < 0.98 ? `M${P(hangA)}L${P(hangB)}Q${P(add(hangB, [3, hDrop * 0.5]))} ${P(add(hangB, [6, hDrop]))}L${P(add(mix2(hangA, hangB, 0.5), [0, hDrop + 8]))}L${P(add(hangA, [-6, hDrop - 2]))}Q${P(add(hangA, [-4, hDrop * 0.5]))} ${P(hangA)}Z` : "";
    return (
      <>
        {HANG ? (
          <g>
            <path d={HANG} fill={cloth.main} {...OUT} />
            <path d={`M${P(mix2(hangA, hangB, 0.35))}L${P(add(mix2(hangA, hangB, 0.35), [0, hDrop]))}M${P(mix2(hangA, hangB, 0.7))}L${P(add(mix2(hangA, hangB, 0.7), [3, hDrop - 2]))}`} {...ln(1.2, 0.6)} />
            <path d={hatchD(Math.min(hangA[0], hangB[0]), hangA[1], Math.max(hangA[0], hangB[0]) + 8, hangA[1] + hDrop + 8, 112, 2.6, 881)} {...ln(0.85, 0.42)} clipPath={undefined} />
          </g>
        ) : null}
        <path d={SKIN} fill={skin} {...OUT} />
        <RimShade id={`${uid}-rsa${ar.sgn}`} d={SKIN} off={[8, 2]} box={bboxOf([ar.S, ar.E, ar.W], 18)} col={skinDeep} amt={shadeAmt} seed={973 + ar.sgn} />
        <path d={braceletD(ar.S, ar.E, 24 * k, 18 * k, 851 + ar.sgn, 3.1) + braceletD(ar.E, ar.W, 18 * k, 12.5 * k, 853 + ar.sgn, 3.1, 0.8)} {...ln(0.95, 0.55)} />
        {SLV ? (
          <>
            <path d={SLV} fill={tunicFill} {...OUT} />
            <RimShade id={`${uid}-rsv${ar.sgn}`} d={SLV} off={[9, 3]} box={bboxOf([ar.S, sleeveEnd], 22)} col={tunicDeep} amt={shadeAmt} seed={975 + ar.sgn} />
            <path d={braceletD(ar.S, sleeveEnd, 26 * k, 25 * k, 855 + ar.sgn, 3.1, 0.7)} {...ln(0.95, 0.5)} />
            <path d={`M${P(add(sleeveEnd, mul(un, -12 * k)))}Q${P(add(sleeveEnd, mul(uu, 2.4)))} ${P(add(sleeveEnd, mul(un, 12 * k)))}`} {...ln(1.2, 0.6)} />
          </>
        ) : null}
        {TSLV ? (
          <>
            <path d={TSLV} fill={cloth.main} {...OUT} />
            <RimShade id={`${uid}-rsv${ar.sgn}`} d={TSLV} off={[10, 3]} box={bboxOf([ar.S, ar.E, tEnd], 24)} col={cloth.deep} amt={shadeAmt} seed={977 + ar.sgn} />
            <path d={braceletD(ar.S, ar.E, tw[0] * k, tw[2] * k, 857 + ar.sgn, 3.2, 0.8)} {...ln(0.95, 0.5)} />
            <path d={[0.25, 0.55, 0.85].map((t) => `M${P(add(mix2(ar.S, tEnd, t), mul(un, -tw[1] * 0.48 * k)))}Q${P(add(mix2(ar.S, tEnd, t + 0.05), mul(un, 0)))} ${P(add(mix2(ar.S, tEnd, t + 0.12), mul(un, tw[1] * 0.48 * k)))}`).join("")} {...ln(1.15, 0.55)} />
            <path d={`M${P(add(tEnd, mul(fn, -tw[3] * 0.54 * k)))}Q${P(add(tEnd, mul(fu, 2.6)))} ${P(add(tEnd, mul(fn, tw[3] * 0.54 * k)))}`} {...ln(1.2, 0.6)} />
          </>
        ) : null}
        <HandV2 a={ar} k={k} ink={ink} ring={dominus && (props.ring ?? true) && ar.sgn > 0} hint={ar.sgn < 0 ? q.armL.elbow : q.armR.elbow} />
      </>
    );
  };
  // ---- the tool and the load --------------------------------------------------------------------------------------
  const tg = toolGeom(r, tool, G, props.toolIn ?? "near", k, q);
  const toolEl = tg ? (
    <g transform={`${tf} translate(${P(tg.base)}) rotate(${((Math.atan2(tg.u[1], tg.u[0]) * 180) / Math.PI).toFixed(2)})`}>
      <Cased id={`${uid}-tl`} r={1.2}>
        {tool === "rod" ? <RodArt ink={ink} /> : tool === "whip" ? <WhipArt ink={ink} sway={props.toolSway ?? 0} ang={(Math.atan2(tg.u[1], tg.u[0]) * 180) / Math.PI} /> : <HeadedTool ink={ink} kind={tool as "hammer" | "pick"} uid={`${uid}-ht`} />}
      </Cased>
    </g>
  ) : null;
  const lg = loadGeom(r, G);
  const loadEl =
    load !== "none" ? (
      <g transform={`${tf} translate(${P(lg.c)}) rotate(${lg.ang.toFixed(2)}) scale(${(-G).toFixed(0)} 1)`}>
        <Cased id={`${uid}-ld`} r={1.3}>
          <LoadArt kind={load} ink={ink} uid={`${uid}-la`} />
        </Cased>
      </g>
    ) : null;
  // (addition) the wine cup in the near fist: drawn behind the hand, so the fingers close round its stem
  const nearArm = G > 0 ? r.armL : r.armR;
  const cupEl =
    (props.held ?? "none") === "cup" ? (
      <g transform={`${tf} translate(${P(add(nearArm.W, mul(nearArm.dir, 9 * k)))}) scale(${k.toFixed(3)})`}>
        <Cased id={`${uid}-cup`} r={1.2}>
          <CupArt ink={ink} uid={`${uid}-cp`} />
        </Cased>
      </g>
    ) : null;
  const armEl = (w: "L" | "R") => {
    const ar = w === "L" ? r.armL : r.armR;
    const holds = tg && !tg.two && tg.arm === ar;
    return (
      <g key={w}>
        {ar === nearArm ? cupEl : null}
        {holds && tool === "whip" ? toolEl : null}
        <g transform={tf}>
          <Cased id={`${uid}-ar${w}`}>{armArt(ar)}</Cased>
        </g>
        {holds && tool !== "whip" ? toolEl : null}
      </g>
    );
  };

  // ---- the head: the face (copied FaceArt), the beard, the hair, the pilleus -------------------------------------
  const nod = Math.max(0, r.nodF);
  const hy = q.headYaw;
  const headLocal = `${tf} ${headTf}`;
  const faceScale = look.faceW !== 1 ? `scale(${look.faceW} 1)` : undefined;
  const hair = hairArt(look, hy, ink, `${uid}-hr`);
  const beard = beardArt(look.beard, hy, nod, ink, look.tone, `${uid}-bd`);
  const headEl = (
    <g transform={headLocal}>
      <Cased id={`${uid}-hdc`} r={1.3}>
        {hair.bunEl}
        <g transform={faceScale}>
          <FaceArt yaw={hy} nod={nod} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} build={look.build} cut={look.cut} aged={sp.aged} ears={true} ink={ink} uid={`${uid}-fc`} shade={shadeAmt} beard={beard.under} moustache={beard.over} female={female} />
        </g>
        {hair.crownEl}
        {pilleus ? pilleusArt(hy, ink, `${uid}-pl`) : null}
      </Cased>
    </g>
  );

  // ---- assembly -----------------------------------------------------------------------------------------------
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 17 * k]]);
  const collarC = r.toFig([0, shY - 7]);
  const collarRx = 16 * k * (0.75 + 0.25 * sfT.wf);
  if (props.onlyArm) return <g opacity={tone}>{armEl(props.onlyArm)}</g>;
  const armOn = (w: "L" | "R") => (props.hideArm === w ? null : armEl(w));
  const nearKey: "L" | "R" = G > 0 ? "L" : "R";
  const farKey: "L" | "R" = G > 0 ? "R" : "L";
  const twoHanded = tg && tg.two;
  return (
    <g opacity={tone}>
      {cloakBack}
      {profile ? armOn(farKey) : null}
      {twoHanded && profile ? toolEl : null}
      <g transform={tf}>
        <Cased id={`${uid}-bd`}>
          {legEl(legsSorted[0])}
          {chainEl}
          {legEl(legsSorted[1])}
          {skirtEl}
          {flapEl}
        </Cased>
      </g>
      <g transform={tf}>
        <Cased id={`${uid}-tc`}>
          {collar ? <IronRing c={collarC} rx={collarRx} ry={5.6} w={3.4} ink={ink} half="back" /> : null}
          <path d={NECK} fill={skin} {...OUT} />
          <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
          {torsoEl}
          {cloakFront}
          {collar ? (
            <>
              <IronRing c={collarC} rx={collarRx} ry={5.6} w={3.4} ink={ink} half="front" />
              <circle cx={collarC[0] + 1} cy={collarC[1] + 9} r={3.6} fill="none" stroke={DARK} strokeWidth={4} />
              <circle cx={collarC[0] + 1} cy={collarC[1] + 9} r={3.6} fill="none" stroke={ironOf(ink)} strokeWidth={1.8} />
            </>
          ) : null}
        </Cased>
      </g>
      {toga ? (
        <g transform={tf}>
          <Cased id={`${uid}-sn2`}>
            {sinusEl}
            {togaEnd}
          </Cased>
        </g>
      ) : null}
      {apronEl}
      {loadEl}
      {headEl}
      {profile ? armOn(nearKey) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => armOn(ar.sgn < 0 ? "L" : "R"))}
      {twoHanded && !profile ? toolEl : null}
    </g>
  );
};

type CastProps = Omit<RomeFigureProps, "kind" | "uid"> & { uid?: string };
/** a slave: cropped hair, coarse short tunic (garb), bare feet; fetters, collar; variant 3 = a woman */
export const Slave: React.FC<CastProps> = ({ uid = "slv", ...p }) => <RomeFigure kind="slave" uid={uid} {...p} />;
/** a free artisan / shopkeeper: knee tunic, leather apron, pilleus, sandals; variant 3 = a woman shopkeeper */
export const Freeman: React.FC<CastProps> = ({ uid = "frm", ...p }) => <RomeFigure kind="freeman" uid={uid} {...p} />;
/** a rich Roman in a toga (stripe, ring); variant 0 prime, 1 older and heavier, 2 younger */
export const Dominus: React.FC<CastProps> = ({ uid = "dom", ...p }) => <RomeFigure kind="dominus" uid={uid} {...p} />;
/** the overseer: tunic, short dark cloak, a vine rod (tool="whip" for a whip) */
export const Overseer: React.FC<CastProps> = ({ uid = "ovs", ...p }) => <RomeFigure kind="overseer" uid={uid} {...p} />;

// ---------------------------------------------------------------------------
// GRIPS AND ANCHORS
// ---------------------------------------------------------------------------
/** the pose with its arms solved so the hand grips land on world points (each a few IK passes on this build) */
export const gripTo = (kind: RomeKind, variant: number, pose: FigPose, grip: { L?: P2; R?: P2 }, at: P2, scale: number): FigPose => {
  const sp = romeSpec(kind, variant);
  let q = pose;
  for (let it = 0; it < 6; it++) {
    const r = figureRig(sp, q);
    const solve = (T: P2 | undefined, ar: ArmRig, ap: ArmPose): ArmPose => {
      if (!T) return ap;
      const t: P2 = [(T[0] - at[0]) / scale, (T[1] - at[1]) / scale];
      return { ...ap, w: sub(t, mul(ar.dir, 11 * sp.limb)) };
    };
    q = { ...q, armL: solve(grip.L, r.armL, q.armL), armR: solve(grip.R, r.armR, q.armR) };
  }
  return q;
};
/** world anchors of a cast member: headC, headTop, shoulders, wrists, handL / handR (the grips), chest, hip, feet,
 *  ankleL / ankleR, the near hand (`handNear`), the tool's head (toolHead; for a rod / whip its tip) and the load's
 *  centre (load). Pass the same grip / tool / toolIn the figure gets. */
export const romeAnchors = (
  kind: RomeKind,
  pose: FigPose,
  at: P2,
  scale: number,
  opts: { variant?: number; grip?: { L?: P2; R?: P2 }; tool?: RomeTool; toolIn?: "near" | "far" } = {},
) => {
  const variant = opts.variant ?? 0;
  const sp = romeSpec(kind, variant);
  const q = opts.grip ? gripTo(kind, variant, pose, opts.grip, at, scale) : pose;
  const a = figureAnchors(sp, q, at, scale);
  const r = a.rig;
  const w = (v: P2): P2 => add(at, mul(v, scale));
  const G = r.s >= 0 ? 1 : -1;
  const tool = opts.tool ?? (kind === "overseer" ? "rod" : "none");
  const tg = toolGeom(r, tool, G, opts.toolIn ?? "near", sp.limb, q);
  const pil = kind === "freeman" && !lookOf(kind, variant).female;
  return {
    ...a,
    /** the top of what he wears on his head (the pilleus adds ~16 units) */
    headTop: pil ? add(a.headTop, rot([0, -16 * sp.headScale * scale], r.headAngle)) : a.headTop,
    ankleL: w(r.legL.A),
    ankleR: w(r.legR.A),
    handNear: G > 0 ? a.handL : a.handR,
    handFar: G > 0 ? a.handR : a.handL,
    toolHead: tg ? w(tg.head) : null,
    load: w(loadGeom(r, G).c),
  };
};

// ---------------------------------------------------------------------------
// PROPS (world px; `at` = where it stands on the floor, scale = px per unit like a man's). Volumes lit from the upper
// left: the lit face toward the upper left, the right side and undersides darker and hatched; a dark casing.
// ---------------------------------------------------------------------------
type PropBase = { at: P2; scale: number; ink?: Ink; uid: string; tone?: number };
const PropG: React.FC<{ at: P2; scale: number; tone?: number; rot?: number; children?: React.ReactNode }> = ({ at, scale, tone = 1, rot: rr = 0, children }) => (
  <g transform={`translate(${P(at)}) rotate(${rr.toFixed(2)}) scale(${scale.toFixed(5)})`} opacity={tone}>
    {children}
  </g>
);
/** a transport amphora standing on its toe (as if set in sand), ~132 units tall; angle tilts it (deg) */
export const Amphora: React.FC<PropBase & { angle?: number }> = ({ at, scale, ink = CREAM, uid, tone, angle = 0 }) => (
  <PropG at={at} scale={scale} tone={tone} rot={angle}>
    <Cased id={`${uid}-c`} r={1.4}>
      <g transform="translate(0 -66) rotate(-90)">
        <LoadArt kind="amphora" ink={ink} uid={`${uid}-a`} />
      </g>
    </Cased>
  </PropG>
);
/** a full sack standing on the floor, ~78 units tall */
export const Sack: React.FC<PropBase> = ({ at, scale, ink = CREAM, uid, tone }) => (
  <PropG at={at} scale={scale} tone={tone}>
    <Cased id={`${uid}-c`} r={1.4}>
      <g transform="translate(0 -34)">
        <LoadArt kind="sack" ink={ink} uid={`${uid}-a`} lying={false} />
      </g>
    </Cased>
  </PropG>
);
/** a wicker basket standing on the floor, ~56 units tall; `full` heaps grain / ore in it (0..1) */
export const Basket: React.FC<PropBase & { full?: number }> = ({ at, scale, ink = CREAM, uid, tone, full = 0.7 }) => (
  <PropG at={at} scale={scale} tone={tone}>
    <Cased id={`${uid}-c`} r={1.4}>
      <g transform="translate(0 -26)">
        {full > 0 ? <path d={`M-28,-26Q0,${(-26 - 22 * full).toFixed(1)} 28,-26Z`} fill={mixHex(ink.deep, ink.hair, 0.5)} {...OUT} strokeWidth={2} /> : null}
        <LoadArt kind="basket" ink={ink} uid={`${uid}-a`} lying={false} />
      </g>
    </Cased>
  </PropG>
);
/** an iron chain between two world points, sagging (length = slack x the distance, or len in world px), lying on the
 *  floor where it reaches groundY (world y); link = the link size in world px */
export const Chain: React.FC<{ a: P2; b: P2; len?: number; slack?: number; groundY?: number; link?: number; ink?: Ink; uid: string; tone?: number }> = ({ a, b, len, slack = 1.15, groundY = Infinity, link = 6, ink = CREAM, uid, tone = 1 }) => {
  const L0 = len ?? vlen(sub(b, a)) * slack;
  return (
    <g opacity={tone}>
      <Cased id={`${uid}-c`} r={1.1}>
        <ChainArt pts={chainPts(a, b, L0, groundY)} link={link} ink={ink} count={len !== undefined ? Math.max(2, Math.round(len / link)) : undefined} />
      </Cased>
    </g>
  );
};
/** a heap of coins (cream: extracted wealth). amount 0..1 grows it from the base by adding coins on top (never a
 *  scale); the next coin drops in from above. Full: ~220 units wide, ~100 tall. */
const COIN_N = 320;
const heapW = (amt: number) => 104 * Math.min(1, Math.sqrt(c01(amt) * 5)) + 6;
const heapH = (amt: number) => 100 * Math.pow(c01(amt), 1.25);
const COINS = (() => {
  const out: { x: number; y: number; z: number; t: number }[] = [];
  for (let i = 0; i < COIN_N; i++) {
    // each coin lands somewhere on the heap as it is when it falls (so the heap grows from its base upward)
    const am = i / COIN_N;
    const W = heapW(am);
    const rho = W * Math.sqrt(hash(i, 902)) * 0.96;
    const a = hash(i, 901) * Math.PI * 2;
    const x = Math.cos(a) * rho;
    const z = Math.sin(a) * rho * 0.3;
    const y = -heapH(am) * Math.pow(Math.max(0, 1 - (x / W) ** 2), 0.7) - 2;
    out.push({ x, z, y, t: i });
  }
  return out;
})();
export const CoinHeap: React.FC<PropBase & { amount: number }> = ({ at, scale, ink = CREAM, uid, tone, amount }) => {
  const n = COIN_N * c01(amount);
  const whole = Math.floor(n);
  const f = n - whole;
  const shown = COINS.slice(0, Math.min(COIN_N, whole + (f > 0.02 ? 1 : 0)));
  // painter's order: back to front, then low to high
  const order = shown.map((cn, i) => ({ ...cn, drop: i === whole ? (1 - ease(f)) * 60 : 0 })).sort((p, q2) => p.t - q2.t);
  // the body of the heap under its surface coins: a dome as high as the coins reach, as wide as their base
  const Wb = heapW(amount);
  const H = heapH(amount);
  const dome: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = -1 + (2 * i) / 24;
    dome.push([u * Wb, -H * Math.pow(Math.max(0, 1 - u * u), 0.7) - 2]);
  }
  for (let i = 1; i < 12; i++) {
    const u = 1 - (2 * i) / 12;
    dome.push([u * Wb, Wb * 0.3 * Math.sqrt(Math.max(0, 1 - u * u)) - 2]);
  }
  return (
    <PropG at={at} scale={scale} tone={tone}>
      <Cased id={`${uid}-c`} r={1.2}>
        {shown.length > 6 ? (
          <g>
            <path d={smoothClosed(dome)} fill={ink.deep} {...OUT} strokeWidth={2} />
            <path d={hatchD(Wb * 0.1, -H - 4, Wb + 4, Wb * 0.3, 112, 2.8, 905)} {...ln(0.9, 0.5)} clipPath={`url(#${uid}-dm)`} />
            <clipPath id={`${uid}-dm`}>
              <path d={smoothClosed(dome)} />
            </clipPath>
          </g>
        ) : null}
        {order.map((cn) => {
          const cyy = cn.y + cn.z - cn.drop;
          const tilt = (hash(cn.t, 903) - 0.5) * 34 + cn.x * 0.12;
          const lit = cn.x < 20 && cn.z < 10;
          return (
            <g key={cn.t} transform={`translate(${cn.x.toFixed(2)} ${cyy.toFixed(2)}) rotate(${tilt.toFixed(1)})`}>
              <ellipse cx={0} cy={2.2} rx={9.5} ry={3.6} fill={ink.hair} stroke={DARK} strokeWidth={1.6} />
              <ellipse cx={0} cy={0} rx={9.5} ry={3.6} fill={lit ? ink.main : mixHex(ink.main, ink.deep, 0.5)} stroke={DARK} strokeWidth={1.6} />
              <ellipse cx={-1.5} cy={-0.4} rx={5} ry={1.6} fill="none" stroke={DARK} strokeWidth={0.8} strokeOpacity={0.45} />
            </g>
          );
        })}
      </Cased>
    </PropG>
  );
};
/** the lectus (dining couch): turned legs, a frame, a mattress with a cushion, the curved fulcrum at the head end.
 *  dir 1: the head end at screen LEFT (a diner reclines facing right). Units: COUCH. */
export const COUCH = { len: 340, seatY: -104, frameY: -64, depth: 80 };
export const Couch: React.FC<PropBase & { dir?: 1 | -1 }> = ({ at, scale, ink = CREAM, uid, tone, dir = 1 }) => {
  const hl = COUCH.len / 2;
  const sk = 22; // the top's back edge, shifted up-right (a view from a little above)
  const dp = COUCH.depth * 0.3;
  const wood = mixHex(ink.hair, ink.deep, 0.3);
  const leg = (x: number, back: boolean) => {
    const xx = x + (back ? sk * 0.8 : 0);
    const y0 = COUCH.frameY + (back ? -8 : 0);
    const y1 = back ? -10 : 0;
    return (
      <g key={`${x}${back}`}>
        <path d={limbD([[[xx, y0], 15], [[xx, mix(y0, y1, 0.25)], 20], [[xx, mix(y0, y1, 0.45)], 11], [[xx, mix(y0, y1, 0.7)], 17], [[xx, y1 - 4], 10], [[xx, y1], 14]])} fill={back ? mixHex(wood, DARK, 0.3) : wood} {...OUT} />
        <path d={hatchD(xx, y0, xx + 10, y1, 100, 2.6, 931 + x)} {...ln(0.85, 0.5)} />
      </g>
    );
  };
  const top: P2[] = [[-hl, COUCH.seatY], [hl, COUCH.seatY], [hl + sk, COUCH.seatY - dp], [-hl + sk, COUCH.seatY - dp]];
  const FRONT = `M${-hl},${COUCH.seatY}L${hl},${COUCH.seatY}Q${hl + 6},${(COUCH.seatY + COUCH.frameY) / 2} ${hl},${COUCH.frameY + 2}L${-hl},${COUCH.frameY + 2}Q${-hl - 6},${(COUCH.seatY + COUCH.frameY) / 2} ${-hl},${COUCH.seatY}Z`;
  return (
    <g transform={`translate(${P(at)}) scale(${(scale * dir).toFixed(5)} ${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.6}>
        {[-hl + 24, hl - 24].map((x) => leg(x, true))}
        {/* the frame rail */}
        <path d={`M${-hl - 4},${COUCH.frameY - 2}L${hl + 4},${COUCH.frameY - 2}L${hl + 4},${COUCH.frameY + 12}L${-hl - 4},${COUCH.frameY + 12}Z`} fill={wood} {...OUT} />
        <path d={hatchD(-hl, COUCH.frameY, hl + 4, COUCH.frameY + 12, 8, 3, 935, 0.1)} {...ln(0.8, 0.45)} />
        {[-hl + 24, hl - 24].map((x) => leg(x, false))}
        {/* the fulcrum: the curved head-rest rising at the head end */}
        <path d={`M${-hl + 2},${COUCH.seatY + 4}C${-hl - 6},${COUCH.seatY - 30} ${-hl + 4},${COUCH.seatY - 58} ${-hl + 34},${COUCH.seatY - 62}L${-hl + 40},${COUCH.seatY - 52}C${-hl + 18},${COUCH.seatY - 46} ${-hl + 14},${COUCH.seatY - 24} ${-hl + 18},${COUCH.seatY + 4}Z`} fill={wood} {...OUT} />
        <circle cx={-hl + 36} cy={COUCH.seatY - 57} r={6} fill={ink.deep} {...OUT} strokeWidth={1.8} />
        {/* the mattress: top face (lit) and front (mid), the striped cover */}
        <path d={polyD(top)} fill={ink.main} {...OUT} />
        <path d={FRONT} fill={ink.deep} {...OUT} />
        <clipPath id={`${uid}-mf`}>
          <path d={FRONT} />
        </clipPath>
        <g clipPath={`url(#${uid}-mf)`}>
          <path d={hatchD(-hl, COUCH.seatY, hl + 8, COUCH.frameY, 100, 3, 941)} {...ln(0.85, 0.45)} />
          <path d={[0.35, 0.65].map((u) => `M${-hl},${mix(COUCH.seatY, COUCH.frameY, u)}L${hl},${mix(COUCH.seatY, COUCH.frameY, u)}`).join("")} fill="none" stroke={DARK} strokeWidth={2.6} strokeOpacity={0.45} />
        </g>
        {/* the cushion at the head end */}
        <path d={`M${-hl + 16},${COUCH.seatY - 2}C${-hl + 10},${COUCH.seatY - 34} ${-hl + 60},${COUCH.seatY - 42} ${-hl + 96},${COUCH.seatY - 22}C${-hl + 100},${COUCH.seatY - 10} ${-hl + 90},${COUCH.seatY} ${-hl + 70},${COUCH.seatY + 2}Z`} fill={ink.main} {...OUT} />
        <path d={`M${-hl + 40},${COUCH.seatY - 30}Q${-hl + 60},${COUCH.seatY - 14} ${-hl + 84},${COUCH.seatY - 6}`} {...ln(1, 0.5)} />
        <path d={hatchD(-hl + 50, COUCH.seatY - 40, -hl + 100, COUCH.seatY + 2, 112, 2.6, 945)} clipPath={undefined} {...ln(0.8, 0.0)} />
      </Cased>
    </g>
  );
};
/** where to stand a figure in POSES.recline(dir) on a Couch at couchAt (same dir) so his hips sit on the mattress */
export const reclineAt = (couchAt: P2, scale: number, dir: 1 | -1 = 1): P2 => [couchAt[0] - dir * 40 * scale, couchAt[1] + (COUCH.seatY + 30) * scale];
/** a low stool (the potter's seat), ~56 units tall */
export const Stool: React.FC<PropBase> = ({ at, scale, ink = CREAM, uid, tone }) => {
  const wood = mixHex(ink.hair, ink.deep, 0.3);
  return (
    <PropG at={at} scale={scale} tone={tone}>
      <Cased id={`${uid}-c`} r={1.4}>
        {[-22, 22].map((x) => (
          <path key={x} d={limbD([[[x * 0.8, -48], 9], [[x, 0], 9]])} fill={x > 0 ? mixHex(wood, DARK, 0.25) : wood} {...OUT} />
        ))}
        <path d="M-32,-56L32,-56L36,-48L-28,-48Z" fill={ink.deep} {...OUT} />
        <path d="M-32,-56L32,-56L28,-61L-28,-61Z" fill={ink.main} {...OUT} strokeWidth={1.8} />
      </Cased>
    </PropG>
  );
};
/** the potter's wheel: a kick wheel at the base, a shaft, the wheel head with a lump of clay being thrown; `turn`
 *  (cycles; pass phase) turns the marks round. dir mirrors it. Clay top at POTTER.clayTop units. */
export const PotterWheel: React.FC<PropBase & { turn?: number; clay?: boolean; dir?: 1 | -1 }> = ({ at, scale, ink = CREAM, uid, tone = 1, turn = 0, clay = true, dir = 1 }) => {
  const wood = mixHex(ink.hair, ink.deep, 0.3);
  const disc = (cy: number, rx: number, th: number, key: string, fill: string) => {
    const ry = rx * 0.3;
    const marks = Array.from({ length: 8 }, (_, i) => (i / 8 + turn) * Math.PI * 2).filter((a) => Math.sin(a) > -0.05);
    return (
      <g key={key}>
        <path d={`M${-rx},${cy}L${-rx},${cy + th}A${rx},${ry} 0 0 0 ${rx},${cy + th}L${rx},${cy}Z`} fill={mixHex(fill, DARK, 0.25)} {...OUT} />
        <path d={marks.map((a) => `M${(rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}l0,${th}`).join("")} {...ln(1.2, 0.6)} />
        <ellipse cx={0} cy={cy} rx={rx} ry={ry} fill={fill} {...OUT} />
        <path d={hatchD(rx * 0.2, cy - ry, rx, cy + ry + th, 112, 2.6, 951)} {...ln(0.8, 0.0)} />
      </g>
    );
  };
  const cTop = POTTER.clayTop;
  const cBase = POTTER.headY;
  const sp = Array.from({ length: 4 }, (_, i) => frac(i / 4 + turn * 1.5));
  return (
    <g transform={`translate(${P(at)}) scale(${(scale * dir).toFixed(5)} ${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.5}>
        {disc(-16, 60, 12, "kick", wood)}
        <path d={`M-6,-16L-6,${cBase}L6,${cBase}L6,-16Z`} fill={wood} {...OUT} />
        {disc(cBase - 6, 38, 7, "head", ink.deep)}
        {clay ? (
          <g>
            <path d={`M-22,${cBase - 7}C-24,${cBase - 20} -14,${cTop + 12} -12,${cTop}L12,${cTop}C14,${cTop + 12} 24,${cBase - 20} 22,${cBase - 7}Z`} fill={mixHex(ink.main, ink.hair, 0.38)} {...OUT} />
            <ellipse cx={0} cy={cTop} rx={12} ry={3.6} fill={mixHex(ink.main, ink.hair, 0.2)} {...OUT} strokeWidth={1.8} />
            {/* the throwing rings turning round the lump */}
            <path d={sp.map((u) => { const y = mix(cBase - 10, cTop + 4, u); const w = mix(21, 12.5, u); return `M${-w},${y.toFixed(1)}Q0,${(y + 3).toFixed(1)} ${w},${y.toFixed(1)}`; }).join("")} {...ln(1, 0.5)} />
            <path d={hatchD(4, cTop, 26, cBase - 6, 100, 2.4, 955)} {...ln(0.85, 0.45)} />
          </g>
        ) : null}
      </Cased>
    </g>
  );
};
/** the potter's layout, units from his feet (facing dir): the wheel stands at wheelDX; the clay between headY and clayTop */
export const POTTER = { wheelDX: 112, headY: -70, clayTop: -104, stoolDX: -6 };
/** the rotary quern (Pompeii-type hand mill on the ground): a lower stone, the upper runner stone with its feed hole,
 *  an upright wooden handle at the rim. turn 0..1 (pass the phase) turns the runner; quernHandle gives the handle's
 *  grip (world) for the same at / scale / turn / dir. Units: QUERN. */
export const QUERN = { R: 32, r: 30, h0: 22, h1: 20, handleR: 22, peg: 26, tilt: 0.32 };
const quernHandleLocal = (turn: number): P2 => {
  const a = turn * Math.PI * 2;
  return [QUERN.handleR * Math.cos(a), -(QUERN.h0 + QUERN.h1) - QUERN.peg + 4 + QUERN.handleR * QUERN.tilt * Math.sin(a)];
};
/** the world point of the quern handle's grip */
export const quernHandle = (at: P2, scale: number, turn: number, dir: 1 | -1 = 1): P2 => {
  const p = quernHandleLocal(turn);
  return [at[0] + dir * p[0] * scale, at[1] + p[1] * scale];
};
export const RotaryQuern: React.FC<PropBase & { turn?: number; dir?: 1 | -1 }> = ({ at, scale, ink = CREAM, uid, tone = 1, turn = 0, dir = 1 }) => {
  const stone = mixHex(ink.deep, ink.hair, 0.45);
  const { R, r: rr, h0, h1, tilt } = QUERN;
  const cyl = (y0: number, y1: number, rad: number, key: string, fill: string, top: boolean) => {
    const ry = rad * tilt;
    return (
      <g key={key}>
        <path d={`M${-rad},${y0}L${-rad},${y1}A${rad},${ry} 0 0 0 ${rad},${y1}L${rad},${y0}Z`} fill={fill} {...OUT} />
        <path d={hatchD(rad * 0.25, y0, rad + 2, y1 + ry, 100, 2.5, 961 + y0)} {...ln(0.9, 0.55)} />
        <path d={`M${-rad * 0.6},${y0 + 3}L${-rad * 0.6},${y1 + ry * 0.7}`} stroke={ink.main} strokeWidth={rad * 0.12} strokeOpacity={0.35} />
        {top ? <ellipse cx={0} cy={y0} rx={rad} ry={ry} fill={mixHex(fill, ink.main, 0.4)} {...OUT} /> : null}
      </g>
    );
  };
  const yTop = -(h0 + h1);
  const a = turn * Math.PI * 2;
  const hx = QUERN.handleR * Math.cos(a);
  const hyB = yTop + QUERN.handleR * tilt * Math.sin(a);
  return (
    <g transform={`translate(${P(at)}) scale(${(scale * dir).toFixed(5)} ${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.5}>
        {cyl(-h0, 0, R, "lo", mixHex(stone, DARK, 0.15), false)}
        {/* the meal spilling at the joint */}
        <path d={`M${-R - 4},${-h0 + 4}Q0,${-h0 + 14} ${R + 4},${-h0 + 4}`} fill="none" stroke={ink.main} strokeWidth={3} strokeOpacity={0.5} />
        {cyl(yTop, -h0, rr, "up", stone, true)}
        <ellipse cx={0} cy={yTop} rx={7} ry={7 * tilt} fill={DARK} opacity={0.85} />
        {/* the turning marks on the runner */}
        <path d={[0, 0.33, 0.66].map((u) => { const b = a + u * Math.PI * 2; const ok = Math.sin(b) > 0; return ok ? `M${(rr * Math.cos(b)).toFixed(1)},${(yTop + rr * tilt * Math.sin(b)).toFixed(1)}l0,${h1 - 2}` : ""; }).join("")} {...ln(1.2, 0.55)} />
        {/* the handle */}
        <path d={limbD([[[hx, hyB + 2], 7.5], [[hx, hyB - QUERN.peg], 6.5]])} fill={mixHex(ink.hair, ink.deep, 0.3)} {...OUT} strokeWidth={2} />
      </Cased>
    </g>
  );
};
/** free tools (lying or leaning): `at` = the handle's end (world), angle deg (0 = the shaft pointing screen right) */
export const Hammer: React.FC<PropBase & { angle?: number }> = ({ at, scale, ink = CREAM, uid, tone, angle = 0 }) => (
  <PropG at={at} scale={scale} tone={tone} rot={angle}>
    <Cased id={`${uid}-c`} r={1.2}>
      <HeadedTool ink={ink} kind="hammer" uid={`${uid}-h`} />
    </Cased>
  </PropG>
);
export const Pick: React.FC<PropBase & { angle?: number }> = ({ at, scale, ink = CREAM, uid, tone, angle = 0 }) => (
  <PropG at={at} scale={scale} tone={tone} rot={angle}>
    <Cased id={`${uid}-c`} r={1.2}>
      <HeadedTool ink={ink} kind="pick" uid={`${uid}-h`} />
    </Cased>
  </PropG>
);
export const Rod: React.FC<PropBase & { angle?: number }> = ({ at, scale, ink = CREAM, uid, tone, angle = 0 }) => (
  <PropG at={at} scale={scale} tone={tone} rot={angle}>
    <Cased id={`${uid}-c`} r={1.2}>
      <RodArt ink={ink} />
    </Cased>
  </PropG>
);

// ---------------------------------------------------------------------------
// POSES. R_* face screen right; mirrorPose turns any of them to face left. When he faces right his armL is the NEAR
// arm (his own right). All loop on phase 0..1 where they have one.
// ---------------------------------------------------------------------------
const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
const F_STAND: FigPose = { ...STAND, armL: { w: [-55, -137], elbow: [-0.2, 1], fist: 0.3, hand: 0 }, armR: { w: [55, -137], elbow: [0.2, 1], fist: 0.3, hand: 0 } };
const R_STAND: FigPose = { ...STAND, yaw: 0.62, headYaw: 0.66, armL: { w: [-30, -138], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [42, -140], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-6, 0], footR: [8, -2] };
const R_WALK: FigPose = { ...STAND, yaw: 0.9, headYaw: 0.86, armL: { w: [-8, -139], elbow: [-0.6, 1], fist: 0.35, hand: 0 }, armR: { w: [16, -141], elbow: [-0.6, 1], fist: 0.35, hand: 0 } };
const R_GESTURE: FigPose = { ...R_STAND, pitch: 3, armL: { w: [64, -204], elbow: [-0.3, 1], fist: 0, hand: -16 }, brow: -0.3, mouth: 0.25 };
/** the push: the bar's grips, units from his feet (both hands; the far hand a little further and higher) */
export const PUSH = { grip: [104, -214] as P2, gripFar: [110, -219] as P2, stride: 30, cycle: 40 };
const R_PUSH: FigPose = {
  ...STAND,
  yaw: 1.05,
  headYaw: 1.0,
  lean: 24,
  crouch: 14,
  pitch: -8,
  footL: [-30, 0],
  footR: [-30, 0],
  armL: { w: [PUSH.grip[0] - 10, PUSH.grip[1] + 2], elbow: [0.1, 1], fist: 1, hand: 6 },
  armR: { w: [PUSH.gripFar[0] - 10, PUSH.gripFar[1] + 2], elbow: [0.1, 1], fist: 1, hand: 6 },
  brow: 0.75,
  mouth: -0.35,
};
/** the treadwheel: the rail's grips above him, the slope his planted foot travels down (units from his feet) */
export const TREAD = { rail: [86, -266] as P2, railFar: [92, -270] as P2, top: [24, -26] as P2, bottom: [-24, 0] as P2 };
const treadLeg = (u0: number) => {
  const u = frac(u0);
  const [x0, y0] = TREAD.top;
  const [x1, y1] = TREAD.bottom;
  if (u < 0.5) {
    const v = u / 0.5;
    return { x: mix(x0, x1, v), y: mix(y0, y1, v), lift: mix(-14, 16, v) };
  }
  const v = (u - 0.5) / 0.5;
  const e = ease(v);
  return { x: mix(x1, x0, e), y: mix(y1, y0, e) - 18 * Math.sin(Math.PI * v), lift: mix(26, -14, e) };
};
const R_TREAD: FigPose = {
  ...STAND,
  yaw: 1.0,
  headYaw: 0.96,
  lean: 13,
  crouch: 24,
  pitch: -4,
  armL: { w: [TREAD.rail[0] - 9, TREAD.rail[1] + 6], elbow: [0.2, 1], fist: 1, hand: 0 },
  armR: { w: [TREAD.railFar[0] - 9, TREAD.railFar[1] + 6], elbow: [0.2, 1], fist: 1, hand: 0 },
  brow: 0.6,
  mouth: -0.25,
};
const R_CARRY: FigPose = { ...R_WALK, lean: 7, crouch: 4, pitch: 4, armL: { w: [-30, -292], elbow: [-1, 0.25], fist: 0.6, hand: -20 }, brow: 0.5, mouth: -0.2 };
/** the quern beside a kneeling grinder: the quern's centre at quernDX units in front of his feet */
export const GRIND = { quernDX: 62 };
const R_GRIND: FigPose = {
  ...STAND,
  yaw: 0.95,
  headYaw: 0.95,
  lean: 26,
  crouch: 74,
  pitch: 16,
  footL: [-68, 4],
  footR: [-64, 4],
  liftL: 62,
  liftR: 62,
  armL: { w: [60, -84], elbow: [-0.2, 1], fist: 1, hand: 30 },
  armR: { w: [GRIND.quernDX + 4, -60], elbow: [0.2, 1], fist: 0.1, hand: 10 },
  brow: 0.45,
  lids: 0.25,
  mouth: -0.15,
};
/** the strike: the lower (far) fist circles round the far shoulder in front of him (angle deg, 90 = straight below,
 *  0 = forward, -90 = above; radius units), never passing through it (Revision 1: the old path ran through the
 *  shoulder and flipped the elbow); the shaft's screen angle (0 = forward, 90 = down). Phase 0 = the head strikes. */
const STRIKE_KEYS: [number, number, number, number][] = [
  // phase, fist angle round the far shoulder, radius, shaft angle
  [0, 85, 48, 55],
  [0.14, 74, 52, 44],
  [0.36, 0, 70, -36],
  [0.58, -100, 85, -150],
  [0.72, -110, 88, -172],
  [0.86, -10, 75, -64],
  [1, 85, 48, 55],
];
const sTrack = [1, 2, 3].map((j) => track(STRIKE_KEYS.map((kk) => [kk[0], kk[j]] as [number, number])));
const strikeRaise = track([
  [0, 0],
  [0.14, 0.05],
  [0.58, 1],
  [0.72, 1],
  [0.86, 0.45],
  [1, 0],
]);
const R_STRIKE_LO: FigPose = { ...STAND, yaw: 0.92, headYaw: 0.94, lean: 28, crouch: 30, pitch: 14, footL: [-30, 0], footR: [32, 0], brow: 0.8, mouth: -0.4 };
const R_STRIKE_HI: FigPose = { ...R_STRIKE_LO, lean: -6, crouch: 6, pitch: -8, brow: 0.9, mouth: -0.5 };
/** (Revision 1) an elbow hint that turns with the arm: perpendicular to the (approximate) shoulder -> wrist line, always
 *  on the same side (back / down when the hand is low in front, forward when it is overhead), so the IK never flips */
const perpHint = (w: P2, S: P2 = [6, -232]): P2 => {
  const u = norm(sub(w, S));
  return [-u[1], u[0]];
};
const strikePose = (phase: number): FigPose => {
  const u = frac(phase);
  const body = lerpFig(R_STRIKE_LO, R_STRIKE_HI, strikeRaise(u));
  // the shoulders of this body (a standard man's build), for the fist's path and the elbow hints
  const rb = figureRig(MAN, body);
  const al = (sTrack[0](u) * Math.PI) / 180;
  const g: P2 = add(rb.armR.S, mul([Math.cos(al), Math.sin(al)], sTrack[1](u)));
  const th = (sTrack[2](u) * Math.PI) / 180;
  const sd: P2 = [Math.cos(th), Math.sin(th)];
  const up = add(g, mul(sd, 22));
  return {
    ...body,
    // the far fist at the end of the handle, the near fist up the shaft
    armL: { w: up, elbow: perpHint(up, rb.armL.S), fist: 1, hand: 0 },
    armR: { w: g, elbow: perpHint(g, rb.armR.S), fist: 1, hand: 0 },
  };
};
const R_POTTER: FigPose = {
  ...STAND,
  yaw: 0.98,
  headYaw: 0.98,
  lean: 22,
  crouch: 90,
  pitch: 18,
  footL: [52, 0],
  footR: [58, 0],
  armL: { w: [POTTER.wheelDX - 26, -96], elbow: [-0.1, 1], fist: 0.15, hand: 10 },
  armR: { w: [POTTER.wheelDX - 6, -100], elbow: [0.1, 1], fist: 0.15, hand: -10 },
  brow: 0.3,
  lids: 0.35,
};
const R_RECLINE: FigPose = {
  ...STAND,
  yaw: 0.42,
  headYaw: 0.6,
  lean: -46,
  roll: 20,
  crouch: 104,
  pitch: 2,
  footL: [150, -26],
  footR: [126, -18],
  liftL: -62,
  liftR: -52,
  armL: { w: [-16, -100], elbow: [-0.3, 1], fist: 0.85, hand: -24 },
  armR: { w: [22, -74], elbow: [0.6, 0.8], fist: 0.2, hand: 20 },
  brow: -0.1,
  lids: 0.3,
  mouth: 0.2,
};
/** haul: the rope hangs at ropeX in front of him; the fists pull from hi to lo (hand over hand) */
export const HAUL = { ropeX: 44, hi: -364, lo: -214 };
const haulPose = (phase: number): FigPose => {
  const hand = (u0: number): ArmPose => {
    const u = frac(u0);
    if (u < 0.5) {
      const w: P2 = [HAUL.ropeX - 2, mix(HAUL.hi, HAUL.lo, u / 0.5) + 11];
      return { w, elbow: perpHint(w, [0, -240]), fist: 1, hand: -8 };
    }
    const v = (u - 0.5) / 0.5;
    const w: P2 = [HAUL.ropeX - 2 - 16 * Math.sin(Math.PI * v), mix(HAUL.lo, HAUL.hi, ease(v)) + 11];
    return { w, elbow: perpHint(w, [0, -240]), fist: mix(1, 0.2, Math.sin(Math.PI * v)), hand: -8 };
  };
  const pull = Math.abs(Math.sin(2 * Math.PI * phase));
  return { ...STAND, yaw: 0.92, headYaw: 0.9, lean: -4, crouch: 10 + 8 * pull, pitch: -10, footL: [-20, 0], footR: [20, 0], armL: hand(phase), armR: hand(phase + 0.5), brow: 0.8, mouth: -0.4 };
};
const R_STOOP: FigPose = {
  ...STAND,
  yaw: 0.14,
  headYaw: 0.1,
  pitch: 20,
  crouch: 5,
  lean: 1,
  armL: { w: [-12, -144], elbow: [-0.4, 1], fist: 0.6, hand: 10 },
  armR: { w: [10, -142], elbow: [0.4, 1], fist: 0.6, hand: -10 },
  brow: 0.4,
  lids: 0.5,
  mouth: -0.4,
};
const R_ROD_LO: FigPose = { ...R_STAND, armL: { w: [-22, -150], elbow: [-0.3, 1], fist: 1, hand: -30 }, brow: 0.6, mouth: -0.2 };
const R_ROD_HI: FigPose = { ...R_STAND, lean: -3, pitch: -4, armL: { w: [2, -350], elbow: [-0.6, 0.4], fist: 1, hand: -50 }, brow: 0.9, mouth: -0.5 };
/** the near shoulder of a man in a pose (approximate, for aiming) */
const nearShoulder = (q: FigPose): P2 => {
  const r = figureRig(MAN, q);
  return r.armL.S;
};
export const POSES = {
  /** standing, facing us */
  front: (): FigPose => F_STAND,
  /** three-quarter view, standing */
  stand: (dir: 1 | -1 = 1) => face(R_STAND, dir),
  /** the walk: phase = frames / WALK_CYCLE; advance the feet by walkAdvance(scale) px per frame */
  walk: (dir: 1 | -1 = 1, phase = 0, amount = 1) => face(walkPose(R_WALK, phase, amount), dir),
  /** t 0..1: the near hand opens forward, palm up (the master's gesture, the auctioneer's patter) */
  gesture: (dir: 1 | -1 = 1, t = 1) => face(lerpFig(R_STAND, R_GESTURE, t), dir),
  /** t 0..1: the near arm out straight at a target point (figure-local units, in the dir-facing frame: x forward) */
  point: (dir: 1 | -1 = 1, t = 1, target: P2 = [300, -330]) => {
    const S = nearShoulder(R_STAND);
    const v = sub(target, S);
    const w = add(S, mul(norm(v), Math.min(102, vlen(v))));
    const R_PT: FigPose = { ...R_STAND, headYaw: 0.7, armL: { w, elbow: [-0.2, 1], fist: 0.25, hand: 0 }, brow: 0.5 };
    return face(lerpFig(R_STAND, R_PT, t), dir);
  },
  /** pushing a mill's bar: both fists on it at chest height (PUSH.grip), leaning ~25 deg into it, walking.
   *  phase = frames / PUSH.cycle; he advances 2 * PUSH.stride * scale px per cycle (pushAdvance) */
  push: (dir: 1 | -1 = 1, phase = 0, amount = 1) => {
    const w = walkPose(R_PUSH, phase, amount, PUSH.stride);
    return face({ ...w, lean: R_PUSH.lean + 1.5 * Math.sin(4 * Math.PI * phase), armL: R_PUSH.armL, armR: R_PUSH.armR }, dir);
  },
  /** climbing in place on a treadwheel's rim, the fists on a rail above (TREAD.rail). phase 0..1 = two steps; the
   *  planted foot travels from TREAD.top to TREAD.bottom in half a cycle (the rim's surface speed) */
  tread: (dir: 1 | -1 = 1, phase = 0) => {
    const Lg = treadLeg(phase);
    const Rg = treadLeg(phase + 0.5);
    return face({ ...R_TREAD, crouch: R_TREAD.crouch + 3 * Math.cos(4 * Math.PI * phase), footL: [Lg.x, Lg.y], footR: [Rg.x, Rg.y], liftL: Lg.lift, liftR: Rg.lift }, dir);
  },
  /** walking with a load on the near shoulder (the figure's `load` prop), the near hand steadying it */
  carry: (dir: 1 | -1 = 1, phase = 0, amount = 1) => {
    const w = walkPose(R_CARRY, phase, amount);
    return face({ ...w, armL: R_CARRY.armL }, dir);
  },
  /** kneeling at a RotaryQuern standing GRIND.quernDX units in front of his feet, the near fist on the handle; phase =
   *  the quern's turn (pass the same to RotaryQuern turn and grip={{ [near]: quernHandle(...) }} for exact contact) */
  grind: (dir: 1 | -1 = 1, phase = 0) => {
    const h = quernHandleLocal(phase);
    const hp: P2 = [GRIND.quernDX + h[0], h[1]];
    const bob = Math.sin(2 * Math.PI * phase);
    return face({ ...R_GRIND, lean: R_GRIND.lean + 3 * Math.cos(2 * Math.PI * phase), headYaw: R_GRIND.headYaw + 0.05 * bob, armL: { ...R_GRIND.armL, w: [hp[0] - 2, hp[1] - 10] } }, dir);
  },
  /** raising and bringing down a hammer or pick held in both fists (tool="hammer" | "pick"); phase 0 = the strike
   *  (the head at its lowest, in front of him: romeAnchors(...).toolHead), raised ~0.58..0.72, falling fast to 1 */
  strike: (dir: 1 | -1 = 1, phase = 0) => face(strikePose(phase), dir),
  /** seated low (a Stool at POTTER.stoolDX), both hands on the clay at a PotterWheel POTTER.wheelDX in front; phase
   *  0..1 draws the hands up the clay and back */
  potter: (dir: 1 | -1 = 1, phase = 0) => {
    const v = -8 * Math.sin(2 * Math.PI * phase);
    return face({ ...R_POTTER, armL: { ...R_POTTER.armL, w: [R_POTTER.armL.w[0], R_POTTER.armL.w[1] + v] }, armR: { ...R_POTTER.armR, w: [R_POTTER.armR.w[0], R_POTTER.armR.w[1] + v] } }, dir);
  },
  /** reclining on a Couch (stand him at reclineAt(couchAt, scale, dir)): on the near elbow, the legs along it */
  recline: (dir: 1 | -1 = 1) => face(R_RECLINE, dir),
  /** two fists on a rope hanging in front (HAUL.ropeX), pulling it down hand over hand; phase 0..1 = one pull each */
  haul: (dir: 1 | -1 = 1, phase = 0) => face(haulPose(phase), dir),
  /** head bowed, shoulders down, hands clasped low: a slave on the sale platform (dir: the way he half turns) */
  stoop: (dir: 1 | -1 = 1) => face(R_STOOP, dir),
  /** the same bowed head and dropped shoulders laid over any pose */
  bowed: (q: FigPose): FigPose => ({ ...q, pitch: q.pitch + 16, crouch: q.crouch + 4, lids: Math.max(q.lids, 0.45), brow: Math.max(q.brow, 0.3), mouth: Math.min(q.mouth, -0.3) }),
  /** t 0..1: the overseer's near arm from low to raised high with the rod */
  raiseRod: (dir: 1 | -1 = 1, t = 1) => face(lerpFig(R_ROD_LO, R_ROD_HI, ease(c01(t))), dir),
};
/** px per frame the feet advance while pushing (PUSH.stride over PUSH.cycle frames) */
export const pushAdvance = (scale: number) => (2 * PUSH.stride * scale) / PUSH.cycle;
