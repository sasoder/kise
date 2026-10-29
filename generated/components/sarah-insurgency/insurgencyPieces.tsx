// ---------------------------------------------------------------------------
// insurgencyPieces: the clip's ONE vocabulary, vintage WOODEN WARGAME PIECES standing on the map floor, drawn in SVG
// through the clip's one projection (insurgencyCamera.toScreen), so they stay locked to the WebGL ground. Air-lit
// as the 3D style's AirBox / AirCyl (soft form light from the upper left of the frame and a little from the lens:
// top lit, left side lit, front mid, right side dark; a cream rim on the top's front and left edges; thin outlines
// in a darker local colour; a soft contact shadow in the air's shadow colour), each fogged by ITS OWN eye distance
// with the ground's fog (orange takes half: the one glowing material). Draw them inside one full-frame <svg>
// (WorldLayer), far to near (sortFarToNear). The API is in insurgencyShared.tsx's header.
// ---------------------------------------------------------------------------
import React from "react";
import { formTone, mixHex, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { toScreen, type P2, type V3 } from "./insurgencyCamera";
import type { InsWorld } from "./insurgencyAir";
import { FLAG_H, FLAG_W, FlagArt, type FlagKind } from "./insurgencyFlags";

// ---- palette -------------------------------------------------------------------------------------------------------
export const SHADOW = "#22180F";
export const CREAM_RIM = "#F3EBDD";
/** painted wood: orange (the side on its own ground), cream / ivory (the occupier, the intervener) */
export const WOOD: Record<"orange" | "cream", Mat> = {
  orange: { lit: "#FFB000", mid: "#D98A0C", dark: "#9A5C07" },
  cream: { lit: "#F1E8D6", mid: "#D3C6A8", dark: "#8A7E66" },
};
/** the block's top face: one value step lighter than its lit side (the top catches the light) */
export const WOOD_TOP: Record<"orange" | "cream", Mat> = {
  orange: { lit: "#FFCB55", mid: "#F5A816", dark: "#B9740B" },
  cream: { lit: "#FCF8F0", mid: "#EDE4D0", dark: "#A79B82" },
};
const OUTLINE: Record<"orange" | "cream", string> = { orange: "#8A4A0E", cream: "#6B604C" };
export const HOUSE_MAT = {
  wall: { lit: "#DCCDAA", mid: "#B9A783", dark: "#6E6250" },
  roof: { lit: "#7E6B55", mid: "#5A4A3A", dark: "#2F261E" },
  brick: { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" },
} satisfies Record<string, Mat>;
export const WARM_WINDOW = "#FFC24E";

// ---- vectors -------------------------------------------------------------------------------------------------------
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);
const RAD = Math.PI / 180;
const UP: V3 = [0, 1, 0];
/** the horizontal unit vector a yaw (deg) points to: 0 north (-Z), 90 east (+X) */
export const dirOfYaw = (yaw: number): V3 => [Math.sin(yaw * RAD), 0, -Math.cos(yaw * RAD)];

const scr = (A: InsWorld, p: V3) => toScreen(A.cam, p[0], p[1], p[2]);
const polyD = (A: InsWorld, pts: V3[]) => `M${pts.map((p) => scr(A, p)).map((s) => `${f2(s.x)},${f2(s.y)}`).join("L")}Z`;
/** an outline width (screen px) that thins a little with distance */
const lwAt = (A: InsWorld, dist: number, base = 1.15) => Math.max(0.5, Math.min(2.4, base * Math.sqrt(A.D / Math.max(1e-6, dist))));

/** painter's order: items sorted far -> near by their ground point's depth along the view */
export const depthOf = (A: InsWorld, x: number, z: number) => toScreen(A.cam, x, 0, z).z;
export const sortFarToNear = <T,>(A: InsWorld, items: T[], at: (it: T) => P2) => items.slice().sort((a, b) => depthOf(A, ...at(b)) - depthOf(A, ...at(a)));
/** the full-frame SVG the pieces, labels and ground lines are drawn in */
export const WorldLayer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

// ---- the contact shadow --------------------------------------------------------------------------------------------
/** a soft contact shadow on the ground, centred on (x, z) pushed away from the light; a: half-size across the view,
 *  b: half-size along it (world units) */
export const ContactShadow: React.FC<{ A: InsWorld; x: number; z: number; a: number; b: number; amt?: number; uid: string; push?: number }> = ({ A, x, z, a, b, amt = 1, uid, push = 0.5 }) => {
  const L = A.L;
  const lh = norm([L[0], 0, L[2]]);
  const c3: V3 = [x - lh[0] * push * a, 0, z - lh[2] * push * a];
  const c = scr(A, c3);
  if (c.z <= 0) return null;
  const r = A.cam.r;
  const fh = dirOfYaw(A.cam.yaw);
  const pr = scr(A, add(c3, mul(r, a)));
  const pl = scr(A, add(c3, mul(r, -a)));
  const pf = scr(A, add(c3, mul(fh, b)));
  const pb = scr(A, add(c3, mul(fh, -b)));
  const rx = Math.hypot(pr.x - pl.x, pr.y - pl.y) / 2;
  const ry = Math.max(0.8, Math.abs(pf.y - pb.y) / 2);
  const o = amt * (1 - A.hazeAt(A.dist(x, 0, z)));
  if (o < 0.01) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={SHADOW} stopOpacity={0.78 * o} />
          <stop offset="0.55" stopColor={SHADOW} stopOpacity={0.48 * o} />
          <stop offset="1" stopColor={SHADOW} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f2(c.x)} cy={f2(c.y)} rx={f2(rx)} ry={f2(ry)} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

/** the dark contact line where a piece meets the ground: the ground-touching points' outline, grown a little, in
 *  the shadow colour (the piece covers most of it; a thin dark rim shows at its foot) */
export const FootOcclusion: React.FC<{ A: InsWorld; pts: V3[]; grow?: number; amt?: number }> = ({ A, pts, grow = 0.06, amt = 1 }) => {
  if (pts.length < 2) return null;
  const c = mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);
  // grown a little and pushed away from the light (no dark sliver on the lit side)
  const rad = Math.max(...pts.map((p) => Math.hypot(p[0] - c[0], p[2] - c[2])));
  const lh = norm([A.L[0], 0, A.L[2]]);
  const g = pts.map((p) => add(add(c, mul(sub(p, c), 1 + grow)), mul(lh, -grow * rad)));
  const S = g.map((p) => scr(A, p));
  if (S.some((q) => q.z <= 0)) return null;
  const cs = S.reduce((s, q) => ({ x: s.x + q.x / S.length, y: s.y + q.y / S.length }), { x: 0, y: 0 });
  const ord = S.slice().sort((p, q) => Math.atan2(p.y - cs.y, p.x - cs.x) - Math.atan2(q.y - cs.y, q.x - cs.x));
  const o = amt * 0.78 * (1 - A.hazeAt(A.dist(c[0], 0, c[2])));
  if (o < 0.01) return null;
  const d = pts.length === 2 ? `M${f2(ord[0].x)},${f2(ord[0].y)}L${f2(ord[1].x)},${f2(ord[1].y)}` : `M${ord.map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}Z`;
  return pts.length === 2 ? <path d={d} stroke={SHADOW} strokeOpacity={o} strokeWidth={2} strokeLinecap="round" /> : <path d={d} fill={SHADOW} fillOpacity={o * 0.85} stroke={SHADOW} strokeOpacity={o * 0.35} strokeWidth={3} strokeLinejoin="round" />;
};
/** a ring of points on the ground (radius R world units) */
const groundRing = (x: number, z: number, R: number, n = 20): V3[] => Array.from({ length: n }, (_, i) => [x + R * Math.cos((i / n) * Math.PI * 2), 0, z + R * Math.sin((i / n) * Math.PI * 2)] as V3);

// ---- a convex polyhedron, air-lit ------------------------------------------------------------------------------------
type Face = { idx: number[]; mat: Mat; key: string; soft?: boolean };
type PolyOut = { els: React.ReactNode[]; visible: Map<string, { n: V3; ndl: number; pts: V3[] }> };
/** draws the visible faces of a convex polyhedron (vertices V, faces with any winding) with the form light; returns
 *  the elements and the visible faces (for stickers, windows, the rim) */
const polyhedron = (A: InsWorld, V: V3[], faces: Face[], o: { uid: string; orange?: boolean; line: string; dist: number; rim?: number; lw?: number }): PolyOut => {
  const ctr = mul(V.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / V.length);
  const C = A.cam.C;
  const tone = (hex: string) => (o.orange ? A.toneO(hex, o.dist) : A.tone(hex, o.dist));
  const lw = o.lw ?? lwAt(A, o.dist);
  const fz = A.hazeAt(o.dist);
  const els: React.ReactNode[] = [];
  const visible = new Map<string, { n: V3; ndl: number; pts: V3[] }>();
  const info = faces.map((f) => {
    const pts = f.idx.map((i) => V[i]);
    const c = mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, sub(c, ctr)) < 0) n = mul(n, -1);
    return { f, pts, c, n, vis: dot(n, sub(C, c)) > 1e-6 };
  });
  for (const q of info) {
    if (!q.vis) continue;
    const ndl = dot(q.n, A.L);
    visible.set(q.f.key, { n: q.n, ndl, pts: q.pts });
    const fill = tone(formTone(q.f.mat, ndl, SHADOW, 0.28));
    const d = polyD(A, q.pts);
    els.push(<path key={q.f.key} d={d} fill={fill} stroke={tone(o.line)} strokeWidth={f2(lw)} strokeLinejoin="round" />);
    // a vertical face: a soft occlusion toward its foot (light from above)
    if (q.f.soft !== false && Math.abs(q.n[1]) < 0.5) {
      const ys = q.pts.map((p) => scr(A, p).y);
      const ya = Math.min(...ys);
      const yb = Math.max(...ys);
      if (yb - ya > 2) {
        const gid = `${o.uid}-${q.f.key}-g`;
        els.push(
          <g key={`${q.f.key}-g`}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={f2(ya)} x2="0" y2={f2(yb)}>
                <stop offset="0" stopColor={CREAM_RIM} stopOpacity={0.1 * (1 - fz)} />
                <stop offset="0.35" stopColor={SHADOW} stopOpacity={0} />
                <stop offset="1" stopColor={SHADOW} stopOpacity={0.24 * (1 - fz)} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} />
          </g>,
        );
      }
    }
  }
  // the cream rim: the up-most visible face's edges shared with visible faces that face left or toward the lens
  const rim = (o.rim ?? 1) * 0.62 * (1 - fz);
  if (rim > 0.01) {
    const vis = info.filter((q) => q.vis);
    const top = vis.reduce((b, q) => (q.n[1] > b.n[1] ? q : b), vis[0]);
    if (top && top.n[1] > 0.3) {
      const fh = dirOfYaw(A.cam.yaw);
      const left = mul(A.cam.r, -1);
      let d = "";
      const ti = top.f.idx;
      for (let k = 0; k < ti.length; k++) {
        const a = ti[k];
        const b = ti[(k + 1) % ti.length];
        const nb = vis.find((q) => q !== top && q.f.idx.includes(a) && q.f.idx.includes(b));
        if (!nb) continue;
        if (dot(nb.n, left) > 0.25 || dot(nb.n, mul(fh, -1)) > 0.25) {
          const sa = scr(A, V[a]);
          const sb = scr(A, V[b]);
          d += `M${f2(sa.x)},${f2(sa.y)}L${f2(sb.x)},${f2(sb.y)}`;
        }
      }
      if (d) els.push(<path key="rim" d={d} fill="none" stroke={CREAM_RIM} strokeOpacity={rim} strokeWidth={f2(lw * 1.15)} strokeLinecap="round" />);
    }
  }
  return { els, visible };
};
const BOX_FACES = (mat: Mat, top: Mat = mat): Face[] => [
  { idx: [0, 1, 2, 3], mat, key: "bottom", soft: false },
  { idx: [4, 5, 6, 7], mat: top, key: "top", soft: false },
  { idx: [0, 1, 5, 4], mat, key: "back" },
  { idx: [3, 2, 6, 7], mat, key: "front" },
  { idx: [0, 3, 7, 4], mat, key: "left" },
  { idx: [1, 2, 6, 5], mat, key: "right" },
];
/** a quad on a face, mapped affinely onto an art box [0, w] x [0, h] (corners: top-left, top-right, bottom-left) */
const affineOf = (A: InsWorld, tl: V3, tr: V3, bl: V3, w: number, h: number) => {
  const o = scr(A, tl);
  const u = scr(A, tr);
  const v = scr(A, bl);
  return `matrix(${[(u.x - o.x) / w, (u.y - o.y) / w, (v.x - o.x) / h, (v.y - o.y) / h, o.x, o.y].map((q) => q.toFixed(5)).join(",")})`;
};

// ===================================================================================================================
// BLOCK: an upright wooden wargame block standing on its edge
// ===================================================================================================================
/** a block's placement and size (world units). face: the yaw (deg) its sticker face points to (180 = south, toward a
 *  camera that looks north). w across the face, h tall, d thick. */
export type BlockSpec = { x: number; z: number; w: number; h: number; d: number; face: number; lift?: number };
/** the default proportions of a block of width w: a square face, ~0.42 w thick */
export const blockSpec = (x: number, z: number, w: number, face = 180, h = w, d = 0.42 * w): BlockSpec => ({ x, z, w, h, d, face });
/** the topple's angle (deg) from a 0..1 drive: falls slowly off the vertical, fast to the ground, a small rebound */
export const toppleAngle = (u: number) => {
  const v = c01(u);
  const hit = 0.78;
  if (v <= hit) return 90 * Math.pow(v / hit, 2.2);
  const t = (v - hit) / (1 - hit);
  return 90 - 7 * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t) * (t < 0.625 ? 1 : 0.4);
};
/** the block's 8 corners after the topple (forward: about its front-bottom edge, the sticker face goes to the ground;
 *  back: about its back-bottom edge, the sticker face ends up facing the sky) */
export const blockCorners = (s: BlockSpec, toppleDeg = 0, dir: "forward" | "back" = "forward"): V3[] => {
  const nf = dirOfYaw(s.face);
  const rb = norm(cross(UP, nf)); // the viewer's right when facing the sticker
  const base: V3 = [s.x, s.lift ?? 0, s.z];
  const th = toppleDeg * RAD;
  const sg = dir === "forward" ? 1 : -1;
  const up2 = add(mul(UP, Math.cos(th)), mul(nf, sg * Math.sin(th)));
  const nf2 = add(mul(UP, -sg * Math.sin(th)), mul(nf, Math.cos(th)));
  const pivot = add(base, mul(nf, (sg * s.d) / 2));
  const P = (lx: number, ly: number, lz: number) => add(add(add(pivot, mul(rb, lx)), mul(up2, ly)), mul(nf2, lz - (sg * s.d) / 2));
  const xs = [-s.w / 2, s.w / 2];
  const zs = [-s.d / 2, s.d / 2];
  // 0..3 bottom (back-left, back-right, front-right, front-left), 4..7 the same on top
  return [P(xs[0], 0, zs[0]), P(xs[1], 0, zs[0]), P(xs[1], 0, zs[1]), P(xs[0], 0, zs[1]), P(xs[0], s.h, zs[0]), P(xs[1], s.h, zs[0]), P(xs[1], s.h, zs[1]), P(xs[0], s.h, zs[1])];
};
/** SPLIT / MERGE: n sub-blocks that tile the parent exactly (cols across its width x rows up its height), the same
 *  thickness. Animate each from its tile (t 0) to a target spec with lerpBlock; merging is the reverse. */
export const splitBlock = (s: BlockSpec, cols: number, rows = 1): BlockSpec[] => {
  const nf = dirOfYaw(s.face);
  const rb = norm(cross(UP, nf));
  const out: BlockSpec[] = [];
  const w = s.w / cols;
  const h = s.h / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const lx = -s.w / 2 + w * (c + 0.5);
      out.push({ x: s.x + rb[0] * lx, z: s.z + rb[2] * lx, w, h, d: s.d, face: s.face, lift: (s.lift ?? 0) + r * h });
    }
  return out;
};
export const lerpBlock = (a: BlockSpec, b: BlockSpec, t: number): BlockSpec => {
  const m = (p: number, q: number) => p + (q - p) * t;
  return { x: m(a.x, b.x), z: m(a.z, b.z), w: m(a.w, b.w), h: m(a.h, b.h), d: m(a.d, b.d), face: m(a.face, b.face), lift: m(a.lift ?? 0, b.lift ?? 0) };
};
/** ground spots for n pieces round a point (a sunflower spiral), spacing world units apart: where a block's men go */
export const clusterSpots = (x: number, z: number, n: number, spacing: number): P2[] => {
  const out: P2[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const r = spacing * 0.62 * Math.sqrt(i + 0.5);
    out.push([x + r * Math.cos(i * g), z + r * Math.sin(i * g)]);
  }
  return out;
};

export type BlockProps = {
  A: InsWorld;
  spec: BlockSpec;
  color: "orange" | "cream";
  /** the face sticker (a period flag) */
  sticker?: FlagKind | null;
  /** 0..1: falls flat (with weight: toppleAngle) */
  topple?: number;
  toppleDir?: "forward" | "back";
  uid: string;
  /** contact shadow strength (default 1) */
  shadow?: number;
  /** a dust puff where it lands (default true) */
  dust?: boolean;
  /** 0..1: SINKS INTO THE PAGE (upright or lying): a tear opens round its footprint (pale lip, a soft umber inside),
   *  the block goes down through it (clipped by the opening swept upward), the tear closes over it; gone at 1.
   *  sinkState(u) gives the schedule. */
  sink?: number;
};
/** the sink's schedule from the 0..1 drive: the tear (0..1), the opening's scale (0.86 -> 1 as it tears, -> 0 as it
 *  closes), its lip, the descent (0..1 of the depth), the closing (0..1) */
export const sinkState = (u: number) => {
  const v = c01(u);
  const tear = sstep(0, 0.18, v);
  const closing = sstep(0.76, 1, v);
  const q = c01((v - 0.12) / 0.7);
  const down = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
  const open = v <= 0 ? 0 : closing > 0 ? 1 - closing : 0.86 + 0.14 * tear;
  return { tear, open, lip: tear * (1 - closing), down, closing };
};
/** convex hull of screen points (monotone chain) */
const hull2 = (pts: { x: number; y: number }[]) => {
  const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof p = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: typeof p = [];
  for (const q of p.slice().reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
export const Block: React.FC<BlockProps> = ({ A, spec: spec0, color, sticker, topple = 0, toppleDir = "forward", uid, shadow: shadow0 = 1, dust = true, sink = 0 }) => {
  const ang = toppleAngle(topple);
  // THE SINK: the footprint (from the un-sunk corners), the descent, the opening
  const sk = sinkState(sink);
  const sinking = sink > 0;
  if (sink >= 1) return null;
  const V0 = blockCorners(spec0, ang, toppleDir);
  const nf0 = dirOfYaw(spec0.face);
  const rb0 = norm(cross(UP, nf0));
  const along0 = V0.map((p) => (p[0] - spec0.x) * nf0[0] + (p[2] - spec0.z) * nf0[2]);
  const across0 = V0.map((p) => (p[0] - spec0.x) * rb0[0] + (p[2] - spec0.z) * rb0[2]);
  const fhs = (Math.max(...along0) - Math.min(...along0)) / 2;
  const fht = (Math.max(...across0) - Math.min(...across0)) / 2;
  const fa = (Math.max(...along0) + Math.min(...along0)) / 2;
  const fc = (Math.max(...across0) + Math.min(...across0)) / 2;
  const fcx = spec0.x + nf0[0] * fa + rb0[0] * fc;
  const fcz = spec0.z + nf0[2] * fa + rb0[2] * fc;
  const maxY = Math.max(...V0.map((p) => p[1])) - (spec0.lift ?? 0);
  const pad = 0.08 * (fhs + fht);
  const depth = maxY * 1.6 + pad;
  const spec: BlockSpec = sinking ? { ...spec0, lift: (spec0.lift ?? 0) - depth * sk.down } : spec0;
  const shadow = shadow0 * (sinking ? 1 - sstep(0.06, 0.3, sink) : 1);
  /** the torn opening: a jagged rounded rectangle round the footprint, scaled k about its centre */
  const openingPts = (k: number, grow: number, sd: number): V3[] => {
    const out: V3[] = [];
    const n = 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const ux = Math.sign(c) * Math.pow(Math.abs(c), 0.28);
      const uy = Math.sign(sn) * Math.pow(Math.abs(sn), 0.28);
      const jag = 1 + 0.06 * (hashN(sd * 31 + i) - 0.5) + 0.03 * Math.sin(a * 7 + sd);
      const la = ux * (fhs + pad) * grow * jag * k;
      const lc = uy * (fht + pad) * grow * jag * k;
      out.push([fcx + nf0[0] * la + rb0[0] * lc, 0, fcz + nf0[2] * la + rb0[2] * lc]);
    }
    return out;
  };
  const V = blockCorners(spec, ang, toppleDir);
  const mat = WOOD[color];
  const dist = A.dist(spec.x, spec.h * 0.4, spec.z);
  const P = polyhedron(A, V, BOX_FACES(mat, WOOD_TOP[color]), { uid, orange: color === "orange", line: OUTLINE[color], dist });
  // the shadow follows the footprint: upright -> lying
  const lie = ang / 90;
  const nf = dirOfYaw(spec.face);
  const sg = toppleDir === "forward" ? 1 : -1;
  const sx = spec.x + nf[0] * sg * (spec.d / 2 + (spec.h / 2) * lie) * lie;
  const sz = spec.z + nf[2] * sg * (spec.d / 2 + (spec.h / 2) * lie) * lie;
  const half = Math.max(spec.w, spec.d + (spec.h - spec.d) * lie) * 0.72;
  // the sticker on the face (front: corners 3 front-left, 2 front-right, 7 / 6 on top)
  let stickerEl: React.ReactNode = null;
  const fr = P.visible.get("front");
  if (sticker && fr) {
    const sw = 0.74 * spec.w;
    const shh = (sw * FLAG_H) / FLAG_W;
    const hc = spec.h * 0.56;
    const at = (u: number, v: number): V3 => {
      // u, v in the sticker's art box; bilinear on the face's corners (front-left-bottom 3, front-right-bottom 2,
      // front-left-top 7)
      const lx = (spec.w - sw) / 2 + (sw * u) / FLAG_W;
      const ly = hc + shh / 2 - (shh * v) / FLAG_H;
      const ex = norm(sub(V[2], V[3]));
      const ey = norm(sub(V[7], V[3]));
      const off = mul(fr.n, 0.002 * spec.d);
      return add(add(add(V[3], mul(ex, lx)), mul(ey, ly)), off);
    };
    const tl = at(0, 0);
    const tr = at(FLAG_W, 0);
    const bl = at(0, FLAG_H);
    const br = at(FLAG_W, FLAG_H);
    const shade = 0.45 * (1 - sstep(-0.45, 0.85, fr.ndl));
    const quad = polyD(A, [tl, tr, br, bl]);
    const fogC = A.airAt(dist);
    stickerEl = (
      <g key="st">
        <g transform={affineOf(A, tl, tr, bl, FLAG_W, FLAG_H)}>
          <FlagArt kind={sticker} id={`${uid}-f`} />
        </g>
        <path d={quad} fill={SHADOW} fillOpacity={shade} />
        <path d={quad} fill={`rgb(${fogC.map((q) => Math.round(q)).join(",")})`} fillOpacity={A.hazeAt(dist)} />
      </g>
    );
  }
  // the landing puff (cause: the block hits the ground at topple ~0.78): the specks behind the block (farther along
  // the view than its footprint's centre) are drawn before its faces, those in front after
  const puffBack: React.ReactNode[] = [];
  const puffFront: React.ReactNode[] = [];
  if (dust && topple > 0.76 && topple < 1) {
    const t = (topple - 0.76) / 0.24;
    const tip: V3 = [spec.x + nf[0] * sg * (spec.d / 2 + spec.h), 0, spec.z + nf[2] * sg * (spec.d / 2 + spec.h)];
    const rb = norm(cross(UP, nf));
    const fh = dirOfYaw(A.cam.yaw);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4;
      const alongQ = Math.cos(a) * spec.w * (0.55 + 0.5 * t);
      const out = Math.sin(a) * spec.h * 0.35 * (0.6 + 0.8 * t) * sg;
      const p = add(add(tip, mul(rb, alongQ)), mul(nf, out - sg * spec.h * 0.4));
      const lift = spec.h * 0.12 * Math.sin(Math.PI * t) * (0.6 + 0.4 * Math.cos(i * 2.1));
      const sp = scr(A, [p[0], lift, p[2]]);
      const r = Math.max(0.8, spec.w * 0.05 * sp.s * (1 + t));
      const el = <circle key={i} cx={f2(sp.x)} cy={f2(sp.y)} r={f2(r)} fill={A.tone(i % 3 === 0 ? "#D9CDB4" : "#8F7D62", dist)} opacity={(1 - t) * 0.75} />;
      const behind = (p[0] - fcx) * fh[0] + (p[2] - fcz) * fh[2] > 0;
      (behind ? puffBack : puffFront).push(el);
    }
  }
  const body = (
    <>
      {sinking ? null : <FootOcclusion A={A} pts={V.filter((p) => p[1] <= 0.03 * spec.h + (spec.lift ?? 0))} amt={shadow} />}
      {P.els}
      {stickerEl}
    </>
  );
  if (!sinking) {
    return (
      <g>
        <ContactShadow A={A} x={sx} z={sz} a={half} b={half * (0.6 + 0.4 * lie)} amt={shadow} uid={`${uid}-sh`} push={0.8} />
        {puffBack.length ? <g key="pb">{puffBack}</g> : null}
        {body}
        {puffFront.length ? <g key="pf">{puffFront}</g> : null}
      </g>
    );
  }
  // sinking: the opening (pale lip, a soft umber inside, the far wall's earth), the block clipped by the opening
  // swept upward, then a soft umber shade over the opening as the block goes under
  const cam = A.cam;
  const fdist = A.dist(fcx, 0, fcz);
  const fz = A.hazeAt(fdist);
  const kc = sk.closing > 0 ? Math.max(sk.open, 0.001) : 1;
  const base = openingPts(kc, 1, 5).map((p) => toScreen(cam, p[0], 0, p[2]));
  const top = openingPts(kc, 1, 5).map((p) => toScreen(cam, p[0], maxY * 3 + 10, p[2]));
  const clipD = `M${hull2([...base, ...top])
    .map((p) => `${f2(p.x)},${f2(p.y)}`)
    .join("L")}Z`;
  const dOf = (q: { x: number; y: number }[]) => `M${q.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
  let opening: React.ReactNode = null;
  let shade: React.ReactNode = null;
  if (sk.open > 0.005) {
    const inner = openingPts(sk.open, 1, 5).map((p) => toScreen(cam, p[0], 0, p[2]));
    const outer = openingPts(sk.open, 1.09 + 0.05 * sk.lip, 9).map((p) => toScreen(cam, p[0], 0, p[2]));
    const cy = inner.reduce((q, p) => q + p.y, 0) / inner.length;
    const far = inner.filter((p) => p.y <= cy + 2);
    opening = (
      <g>
        <path d={`${dOf(outer)}${dOf(inner.slice().reverse())}`} fill={A.tone("#CDBB94", fdist)} fillOpacity={0.7 * sk.lip * (1 - fz)} fillRule="evenodd" />
        <path d={dOf(inner)} fill={A.tone("#3B2D21", fdist)} />
        {far.length > 2 ? <path d={dOf(hull2(far))} fill={A.tone("#5E4A36", fdist)} opacity={0.45} /> : null}
        <path d={dOf(inner)} fill="none" stroke={A.tone("#2A1F16", fdist)} strokeWidth={1.4} strokeOpacity={0.6 * sk.lip} strokeLinejoin="round" />
      </g>
    );
    // the soft umber shade once the block is going under (modest: not a black pit)
    const deep = 0.55 * sstep(0.35, 0.95, sk.down);
    if (deep > 0.01) shade = <path d={dOf(inner)} fill={A.tone("#2E2219", fdist)} fillOpacity={deep} />;
  }
  const cid = `${uid}-snk`;
  return (
    <g>
      <defs>
        <clipPath id={cid}>
          <path d={clipD} />
        </clipPath>
      </defs>
      <ContactShadow A={A} x={sx} z={sz} a={half} b={half * (0.6 + 0.4 * lie)} amt={shadow} uid={`${uid}-sh`} push={0.8} />
      {opening}
      {puffBack.length ? <g key="pb">{puffBack}</g> : null}
      <g clipPath={`url(#${cid})`}>{body}</g>
      {shade}
      {puffFront.length ? <g key="pf">{puffFront}</g> : null}
    </g>
  );
};
/** a small cream block at a town */
export const Garrison: React.FC<{ A: InsWorld; x: number; z: number; size: number; face?: number; uid: string; topple?: number; color?: "cream" | "orange" }> = ({ A, x, z, size, face = 180, uid, topple = 0, color = "cream" }) => (
  <Block A={A} spec={{ x, z, w: size, h: size * 0.72, d: size * 0.62, face }} color={color} uid={uid} topple={topple} />
);

// ===================================================================================================================
// PAWN: a turned wooden pawn (base disc, waisted body, collar, ball head) that RISES out of the ground
// ===================================================================================================================
/** the turned profile, height 1: [y, r] rings of the body (a lathe), then the collar and the head */
const PAWN = {
  base: { y0: 0, y1: 0.1, r: 0.36 },
  body: [
    [0.1, 0.3],
    [0.14, 0.255],
    [0.24, 0.215],
    [0.36, 0.175],
    [0.47, 0.142],
    [0.565, 0.13],
  ] as [number, number][],
  collar: { y0: 0.565, y1: 0.64, r: 0.25 },
  neck: { y0: 0.64, y1: 0.69, r0: 0.125, r1: 0.12 },
  head: { y: 0.855, r: 0.19 },
};
type Ring = { cx: number; cy: number; rx: number; ry: number; z: number };
const ringOf = (A: InsWorld, x: number, y: number, z: number, R: number): Ring => {
  const c = toScreen(A.cam, x, y, z);
  const fh = dirOfYaw(A.cam.yaw);
  const pf = toScreen(A.cam, x + fh[0] * R, y, z + fh[2] * R);
  const pb = toScreen(A.cam, x - fh[0] * R, y, z - fh[2] * R);
  return { cx: c.x, cy: c.y, rx: R * c.s, ry: Math.max(0.3, Math.abs(pf.y - pb.y) / 2), z: c.z };
};
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** the pawn's turned radius at a height y (units of its size, 0 foot .. ~1.045 the head's top) */
const pawnRadiusAt = (y: number) => {
  if (y < PAWN.base.y1) return PAWN.base.r;
  const B = PAWN.body;
  if (y < B[B.length - 1][0]) {
    for (let i = 1; i < B.length; i++) if (y <= B[i][0]) return B[i - 1][1] + ((B[i][1] - B[i - 1][1]) * (y - B[i - 1][0])) / (B[i][0] - B[i - 1][0]);
  }
  if (y < PAWN.collar.y1) return PAWN.collar.r;
  const hd = Math.abs(y - PAWN.head.y);
  const head = hd < PAWN.head.r ? Math.sqrt(PAWN.head.r * PAWN.head.r - hd * hd) : 0;
  if (y < PAWN.neck.y1) return Math.max(PAWN.neck.r0, head);
  return head;
};
const PAWN_TOP = PAWN.head.y + PAWN.head.r;
/** the widest section of the pawn at or above a height: what has already come up through the ground */
const widestAbove = (y: number) => {
  let m = 0;
  for (let i = 0; i <= 48; i++) {
    const q = y + ((PAWN_TOP - y) * i) / 48;
    if (q >= 0 && q <= PAWN_TOP) m = Math.max(m, pawnRadiusAt(q));
  }
  return y <= 0 ? PAWN.base.r : m;
};
/** the rise's schedule from the 0..1 drive. The TEAR GROWS WITH THE PAWN: it opens over the first 0.06 at the head's
 *  size as the head breaks the surface, then is always as wide as the widest part that has come up through it; it
 *  closes under the foot over 0.84..1. Run backwards (a pawn sinking back) it reads in order too: the tear opens round
 *  the foot, the pawn goes down, the head goes under and then the tear closes over it.
 *  hole: the tear's openness 0..1 (holeR / its full radius); holeR: its radius in units of the pawn's size; sink: how
 *  far below the ground the foot is (units of size); up: the emergence 0..1 (fast out of the ground, settling). */
export const riseState = (u: number) => {
  const v = c01(u);
  // the head breaks the surface ~1 frame (of a 15-frame rise) after the tear starts: run backwards, the head goes
  // under and the tear then closes over it
  const t = c01((v - 0.05) / 0.79);
  const up = 1 - Math.pow(1 - t, 2.4);
  const sink = PAWN_TOP * (1 - up) + 0.002;
  const close = sstep(0.84, 1, v);
  const tear = Math.max(widestAbove(sink), PAWN.head.r * 1.05 * sstep(0, 0.08, v) * (sink > PAWN.neck.y1 ? 1 : 0));
  const holeR = 1.18 * tear * sstep(0, 0.04, v) * (1 - close);
  const full = 1.18 * PAWN.base.r;
  return { hole: holeR / full, holeR, sink: v >= 0.84 ? 0 : sink, dust: sstep(0.02, 0.12, v) * (1 - sstep(0.8, 1, v)), up };
};
export type PawnProps = { A: InsWorld; x: number; z: number; size: number; color?: "orange" | "cream"; rise?: number; uid: string; seed?: number; shadow?: number };
export const Pawn: React.FC<PawnProps> = ({ A, x, z, size, color = "orange", rise = 1, uid, seed = 1, shadow = 1 }) => {
  const st = riseState(rise);
  const off = -st.sink * size;
  const mat = WOOD[color];
  const orange = color === "orange";
  const dist = A.dist(x, size * 0.4, z);
  const tone = (hex: string) => (orange ? A.toneO(hex, dist) : A.tone(hex, dist));
  const fz = A.hazeAt(dist);
  const lw = lwAt(A, dist, 1.05);
  const line = tone(OUTLINE[color]);
  const air = A.airAt(dist);
  const refl = mixHex(mat.mid, `#${air.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`, 0.4);
  const shade = mixHex(mat.dark, SHADOW, 0.15);
  const grad = (id: string, x0: number, x1: number) => (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(x0)} y1="0" x2={f2(x1)} y2="0">
      <stop offset="0" stopColor={tone(mat.mid)} />
      <stop offset="0.24" stopColor={tone(mat.lit)} />
      <stop offset="0.52" stopColor={tone(mixHex(mat.lit, mat.mid, 0.6))} />
      <stop offset="0.84" stopColor={tone(shade)} />
      <stop offset="1" stopColor={tone(refl)} />
    </linearGradient>
  );
  const R = (r: number) => r * size;
  const Y = (y: number) => off + y * size;
  const parts: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  // a frustum stack (the lathe) from rings [y, r] (y in world units, already offset)
  const lathe = (key: string, rings: [number, number][], topCap: boolean) => {
    const E = rings.map(([y, r]) => ringOf(A, x, y, z, r));
    const b = E[0];
    const t = E[E.length - 1];
    const xs = E.flatMap((e) => [e.cx - e.rx, e.cx + e.rx]);
    const gid = `${uid}-${key}`;
    defs.push(<React.Fragment key={gid}>{grad(gid, Math.min(...xs), Math.max(...xs))}</React.Fragment>);
    const left = E.slice().reverse().map((e) => `${f2(e.cx - e.rx)},${f2(e.cy)}`);
    const right = E.map((e) => `${f2(e.cx + e.rx)},${f2(e.cy)}`);
    const d = `M${left.join("L")}A${f2(b.rx)},${f2(b.ry)} 0 0 0 ${right[0]}L${right.slice(1).join("L")}Z`;
    parts.push(<path key={key} d={d} fill={`url(#${gid})`} stroke={line} strokeWidth={f2(lw)} strokeLinejoin="round" />);
    // the rim light down the lit (left) side
    parts.push(
      <path key={`${key}-rl`} d={`M${E.map((e) => `${f2(e.cx - e.rx * 0.9)},${f2(e.cy)}`).join("L")}`} fill="none" stroke={CREAM_RIM} strokeWidth={f2(lw * 1.1)} strokeOpacity={0.4 * (1 - fz)} strokeLinecap="round" />,
    );
    if (topCap && A.cam.C[1] > rings[rings.length - 1][0]) {
      parts.push(<ellipse key={`${key}-cap`} cx={f2(t.cx)} cy={f2(t.cy)} rx={f2(t.rx)} ry={f2(t.ry)} fill={tone(mat.lit)} stroke={line} strokeWidth={f2(lw)} />);
      // the cap's front-left edge catches the light
      parts.push(
        <path
          key={`${key}-cr`}
          d={`M${f2(t.cx - t.rx)},${f2(t.cy)}A${f2(t.rx)},${f2(t.ry)} 0 0 0 ${f2(t.cx + t.rx * 0.2)},${f2(t.cy + t.ry * 0.98)}`}
          fill="none"
          stroke={CREAM_RIM}
          strokeWidth={f2(lw * 1.1)}
          strokeOpacity={0.55 * (1 - fz)}
          strokeLinecap="round"
        />,
      );
    }
  };
  lathe("base", [[Y(PAWN.base.y0), R(PAWN.base.r)], [Y(PAWN.base.y1), R(PAWN.base.r)]], true);
  lathe("body", PAWN.body.map(([y, r]) => [Y(y), R(r)] as [number, number]), false);
  lathe("collar", [[Y(PAWN.collar.y0), R(PAWN.collar.r)], [Y(PAWN.collar.y1), R(PAWN.collar.r)]], true);
  lathe("neck", [[Y(PAWN.neck.y0), R(PAWN.neck.r0)], [Y(PAWN.neck.y1), R(PAWN.neck.r1)]], false);
  // the ball head
  const hc = toScreen(A.cam, x, Y(PAWN.head.y), z);
  const hr = R(PAWN.head.r) * hc.s;
  const hid = `${uid}-hd`;
  defs.push(
    <radialGradient key={hid} id={hid} cx="0.5" cy="0.5" r="0.5" fx="0.34" fy="0.3">
      <stop offset="0" stopColor={tone(mixHex(mat.lit, "#FFF3D6", orange ? 0.25 : 0.35))} />
      <stop offset="0.35" stopColor={tone(mat.lit)} />
      <stop offset="0.75" stopColor={tone(mat.mid)} />
      <stop offset="0.93" stopColor={tone(shade)} />
      <stop offset="1" stopColor={tone(refl)} />
    </radialGradient>,
  );
  parts.push(<circle key="head" cx={f2(hc.x)} cy={f2(hc.y)} r={f2(hr)} fill={`url(#${hid})`} stroke={line} strokeWidth={f2(lw)} />);
  parts.push(
    <path
      key="head-r"
      d={`M${f2(hc.x - hr * 0.86)},${f2(hc.y + hr * 0.3)}A${f2(hr * 0.92)},${f2(hr * 0.92)} 0 0 1 ${f2(hc.x + hr * 0.2)},${f2(hc.y - hr * 0.9)}`}
      fill="none"
      stroke={CREAM_RIM}
      strokeWidth={f2(lw * 1.1)}
      strokeOpacity={0.5 * (1 - fz)}
      strokeLinecap="round"
    />,
  );
  // THE HOLE (the map surface parting): a torn opening a little wider than the base, dark inside, the far wall's
  // earth catching light, a dust lip; it opens before the head arrives and closes under the base after
  const rising = rise < 1;
  let hole: React.ReactNode = null;
  let clip: string | null = null;
  const Rh = st.holeR * size;
  if (rising && st.holeR > 0.004) {
    const n = 28;
    const fh = dirOfYaw(A.cam.yaw);
    const rv = A.cam.r;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const jag = 1 + 0.13 * (hashN(seed * 31 + i) - 0.5) + 0.07 * Math.sin(a * 5 + seed);
      const rr = Rh * jag;
      const p = toScreen(A.cam, x + (rv[0] * Math.cos(a) + fh[0] * Math.sin(a)) * rr, 0, z + (rv[2] * Math.cos(a) + fh[2] * Math.sin(a)) * rr);
      pts.push(p);
    }
    const hd = `M${pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    const g = toScreen(A.cam, x, 0, z);
    // the clip: the frame above the hole's centre row UNION the opening (same winding, so nonzero fill adds them)
    const area = (q: { x: number; y: number }[]) => q.reduce((s, p, i) => s + p.x * q[(i + 1) % q.length].y - q[(i + 1) % q.length].x * p.y, 0);
    const rect = [
      { x: -50, y: -50 },
      { x: 1130, y: -50 },
      { x: 1130, y: g.y },
      { x: -50, y: g.y },
    ];
    const hpts = Math.sign(area(pts)) === Math.sign(area(rect)) ? pts : pts.slice().reverse();
    // only while part of the pawn is still under the ground (standing on it, nothing is hidden)
    if (st.sink > 0.001) clip = `M${rect.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}ZM${hpts.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    const inner = A.tone("#140E09", dist);
    const wall = A.tone("#4A3A2A", dist);
    // the far wall: the back half of the opening, a little earth catching light
    const back = pts.filter((_, i) => i >= n / 2 || i === 0);
    const wallD = `M${back.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    // the torn lip: the map's paper lifts round the tear and shows its pale back (a ragged band outside the edge)
    const lipA = (1 - fz) * st.hole;
    const outer = pts.map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const w = 1.1 + 0.16 * hashN(seed * 53 + i);
      const rr = Rh * (1 + 0.13 * (hashN(seed * 31 + i) - 0.5) + 0.07 * Math.sin(a * 5 + seed)) * w;
      return toScreen(A.cam, x + (rv[0] * Math.cos(a) + fh[0] * Math.sin(a)) * rr, 0, z + (rv[2] * Math.cos(a) + fh[2] * Math.sin(a)) * rr);
    });
    const lipD = `M${outer.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}ZM${pts
      .slice()
      .reverse()
      .map((p) => `${f2(p.x)},${f2(p.y)}`)
      .join("L")}Z`;
    // a few specks of dust thrown out as it opens
    const specks: React.ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      const a = hashN(seed * 7 + i) * Math.PI * 2;
      const rr = Rh * (1.2 + 0.7 * hashN(seed * 13 + i) * (0.3 + 0.7 * st.dust));
      const p = toScreen(A.cam, x + (rv[0] * Math.cos(a) + fh[0] * Math.sin(a)) * rr, 0, z + (rv[2] * Math.cos(a) + fh[2] * Math.sin(a)) * rr);
      const r = Math.max(0.6, R(0.02 + 0.025 * hashN(seed * 17 + i)) * p.s);
      specks.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(r)} fill={A.tone(i % 2 === 0 ? "#CDBF9F" : "#2E2318", dist)} opacity={0.6 * st.dust} />);
    }
    hole = (
      <g key="hole">
        <path d={lipD} fill={A.tone("#CDBB94", dist)} fillOpacity={0.75 * lipA} fillRule="evenodd" />
        <path d={hd} fill={inner} />
        <path d={wallD} fill={wall} opacity={0.6} />
        <path d={hd} fill="none" stroke={A.tone("#1E150D", dist)} strokeWidth={f2(lw * 0.9)} strokeOpacity={0.8 * lipA} strokeLinejoin="round" />
        {specks}
      </g>
    );
  } else if (rising && st.sink > 0.001) {
    // no tear yet (or already closed) but the foot is still under: the ground still hides what is below it
    const g = toScreen(A.cam, x, 0, z);
    clip = `M-50,-50H1130V${f2(g.y)}H-50Z`;
  }
  const shadowEl =
    st.up > 0.6 ? (
      <g>
        <ContactShadow A={A} x={x} z={z} a={R(0.5)} b={R(0.42)} amt={shadow * sstep(0.6, 1, st.up)} uid={`${uid}-sh`} />
        <FootOcclusion A={A} pts={groundRing(x, z, R(PAWN.base.r))} grow={0.1} amt={shadow * sstep(0.85, 1, st.up)} />
      </g>
    ) : null;
  if (!rising) {
    return (
      <g>
        <defs>{defs}</defs>
        {shadowEl}
        {parts}
      </g>
    );
  }
  const cid = `${uid}-clip`;
  return (
    <g>
      <defs>
        {defs}
        {clip ? (
          <clipPath id={cid}>
            <path d={clip} />
          </clipPath>
        ) : null}
      </defs>
      {hole}
      {shadowEl}
      <g clipPath={clip ? `url(#${cid})` : undefined}>{off <= -size * PAWN_TOP ? null : parts}</g>
    </g>
  );
};

// ===================================================================================================================
// VALUE COLUMN: an upright column (AirCyl's light) whose height is the value; orange glows faintly (the stage's
// bloom), cream is dull
// ===================================================================================================================
export const ValueColumn: React.FC<{ A: InsWorld; x: number; z: number; r: number; height: number; color?: "orange" | "cream"; uid: string; shadow?: number }> = ({ A, x, z, r, height, color = "orange", uid, shadow = 1 }) => {
  if (height <= 0) return null;
  const mat = color === "orange" ? WOOD.orange : { lit: "#E6DCC6", mid: "#C3B696", dark: "#7E735E" };
  const orange = color === "orange";
  const dist = A.dist(x, 0, z);
  const tone = (hex: string) => (orange ? A.toneO(hex, dist) : A.tone(hex, dist));
  const fz = A.hazeAt(dist);
  const lw = lwAt(A, dist);
  const line = tone(OUTLINE[color]);
  const shade = mixHex(mat.dark, SHADOW, 0.15);
  const air = A.airAt(dist);
  const refl = mixHex(mat.mid, `#${air.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`, 0.4);
  // a TURNED column: a plinth ring at the foot, the shaft, a bead and a capital ring at the top (a made object)
  const baseH = Math.min(r * 0.42, height * 0.12);
  const capH = Math.min(r * 0.62, height * 0.18);
  const beadH = Math.min(r * 0.18, height * 0.05);
  const segs: [number, number, number][] = [
    [0, baseH, r * 1.2],
    [baseH, height - capH - beadH, r],
    [height - capH - beadH, height - capH, r * 1.08],
    [height - capH, height, r * 1.24],
  ];
  const els: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  segs.forEach(([y0, y1, R], i) => {
    if (y1 - y0 <= 1e-6) return;
    const bt = ringOf(A, x, y0, z, R);
    const tp = ringOf(A, x, y1, z, R);
    const x0 = Math.min(tp.cx - tp.rx, bt.cx - bt.rx);
    const x1 = Math.max(tp.cx + tp.rx, bt.cx + bt.rx);
    const gid = `${uid}-g${i}`;
    defs.push(
      <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={f2(x0)} y1="0" x2={f2(x1)} y2="0">
        <stop offset="0" stopColor={tone(mat.mid)} />
        <stop offset="0.24" stopColor={tone(mat.lit)} />
        <stop offset="0.52" stopColor={tone(mixHex(mat.lit, mat.mid, 0.6))} />
        <stop offset="0.84" stopColor={tone(shade)} />
        <stop offset="1" stopColor={tone(refl)} />
      </linearGradient>,
    );
    const body = `M${f2(tp.cx - tp.rx)},${f2(tp.cy)}L${f2(bt.cx - bt.rx)},${f2(bt.cy)}A${f2(bt.rx)},${f2(bt.ry)} 0 0 0 ${f2(bt.cx + bt.rx)},${f2(bt.cy)}L${f2(tp.cx + tp.rx)},${f2(tp.cy)}Z`;
    els.push(<path key={`b${i}`} d={body} fill={`url(#${gid})`} stroke={line} strokeWidth={f2(lw)} strokeLinejoin="round" />);
    els.push(<path key={`r${i}`} d={`M${f2(tp.cx - tp.rx * 0.9)},${f2(tp.cy)}L${f2(bt.cx - bt.rx * 0.9)},${f2(bt.cy)}`} stroke={CREAM_RIM} strokeWidth={f2(lw * 1.2)} strokeOpacity={0.45 * (1 - fz)} />);
    // each ring's top ledge (seen from above): a lit ellipse, its front-left edge catching the light
    if (A.cam.C[1] > y1) {
      els.push(<ellipse key={`t${i}`} cx={f2(tp.cx)} cy={f2(tp.cy)} rx={f2(tp.rx)} ry={f2(tp.ry)} fill={tone(mixHex(mat.lit, "#FFF0CC", orange ? 0.25 : 0.12))} stroke={line} strokeWidth={f2(lw)} />);
      els.push(
        <path
          key={`e${i}`}
          d={`M${f2(tp.cx - tp.rx)},${f2(tp.cy)}A${f2(tp.rx)},${f2(tp.ry)} 0 0 0 ${f2(tp.cx + tp.rx * 0.3)},${f2(tp.cy + tp.ry * 0.96)}`}
          fill="none"
          stroke={CREAM_RIM}
          strokeWidth={f2(lw * 1.15)}
          strokeOpacity={0.6 * (1 - fz)}
          strokeLinecap="round"
        />,
      );
    }
  });
  return (
    <g>
      <defs>{defs}</defs>
      <ContactShadow A={A} x={x} z={z} a={r * 1.7} b={r * 1.5} amt={shadow} uid={`${uid}-sh`} />
      <FootOcclusion A={A} pts={groundRing(x, z, r * 1.2)} grow={0.1} amt={shadow} />
      {els}
    </g>
  );
};

// ===================================================================================================================
// FARMHOUSE: a small gabled colonial farmhouse (clapboard walls, a shingled roof, a brick chimney, a warm window)
// ===================================================================================================================
export const Farmhouse: React.FC<{ A: InsWorld; x: number; z: number; size: number; face?: number; uid: string; warm?: number; shadow?: number }> = ({ A, x, z, size, face = 180, uid, warm = 1, shadow = 1 }) => {
  const nf = dirOfYaw(face);
  const rb = norm(cross(UP, nf));
  const w = size;
  const d = 0.56 * size;
  const h = 0.4 * size;
  const ridge = h + 0.3 * size;
  const ov = 0.045 * size;
  const P = (lx: number, ly: number, lz: number): V3 => [x + rb[0] * lx + nf[0] * lz, ly, z + rb[2] * lx + nf[2] * lz];
  const dist = A.dist(x, h * 0.5, z);
  // the walls: a box (0..3 bottom back-left, back-right, front-right, front-left; 4..7 top)
  const Vw: V3[] = [P(-w / 2, 0, -d / 2), P(w / 2, 0, -d / 2), P(w / 2, 0, d / 2), P(-w / 2, 0, d / 2), P(-w / 2, h, -d / 2), P(w / 2, h, -d / 2), P(w / 2, h, d / 2), P(-w / 2, h, d / 2)];
  const walls = polyhedron(A, Vw, BOX_FACES(HOUSE_MAT.wall), { uid: `${uid}-w`, line: "#5E5240", dist, rim: 0.6 });
  // the gable ends rise above the walls: two triangles (left, right) drawn with the walls' light
  const gable = (sx: number, key: string) => {
    const tri: V3[] = [P(sx, h, -d / 2), P(sx, h, d / 2), P(sx, ridge, 0)];
    const n: V3 = mul(rb, Math.sign(sx));
    const c = P(sx, h + 0.1 * size, 0);
    if (dot(n, sub(A.cam.C, c)) <= 0) return null;
    const fill = A.tone(formTone(HOUSE_MAT.wall, dot(n, A.L), SHADOW, 0.28), dist);
    return <path key={key} d={polyD(A, tri)} fill={fill} stroke={A.tone("#5E5240", dist)} strokeWidth={f2(lwAt(A, dist))} strokeLinejoin="round" />;
  };
  // the roof: two slopes with an overhang (a prism)
  const Vr: V3[] = [
    P(-w / 2 - ov, h - ov * 0.6, -d / 2 - ov),
    P(w / 2 + ov, h - ov * 0.6, -d / 2 - ov),
    P(w / 2 + ov, h - ov * 0.6, d / 2 + ov),
    P(-w / 2 - ov, h - ov * 0.6, d / 2 + ov),
    P(-w / 2 - ov, ridge, 0),
    P(w / 2 + ov, ridge, 0),
  ];
  const roof = polyhedron(
    A,
    Vr,
    [
      { idx: [3, 2, 5, 4], mat: HOUSE_MAT.roof, key: "rfront", soft: false },
      { idx: [0, 1, 5, 4], mat: HOUSE_MAT.roof, key: "rback", soft: false },
      { idx: [0, 3, 4], mat: HOUSE_MAT.roof, key: "rleft" },
      { idx: [1, 2, 5], mat: HOUSE_MAT.roof, key: "rright" },
      { idx: [0, 1, 2, 3], mat: HOUSE_MAT.roof, key: "rbottom", soft: false },
    ],
    { uid: `${uid}-r`, line: "#241B14", dist, rim: 0.8 },
  );
  // the chimney on the ridge near one end
  const cw = 0.09 * size;
  const cx = 0.3 * w;
  const ctop = ridge + 0.12 * size;
  const Vc: V3[] = [P(cx - cw, ridge - 0.1 * size, -cw), P(cx + cw, ridge - 0.1 * size, -cw), P(cx + cw, ridge - 0.1 * size, cw), P(cx - cw, ridge - 0.1 * size, cw), P(cx - cw, ctop, -cw), P(cx + cw, ctop, -cw), P(cx + cw, ctop, cw), P(cx - cw, ctop, cw)];
  const chim = polyhedron(A, Vc, BOX_FACES(HOUSE_MAT.brick), { uid: `${uid}-c`, line: "#2E1C14", dist, rim: 0.7 });
  // the facade: clapboard lines, a door, windows (one warm), on the front wall when it faces the lens
  const fr = walls.visible.get("front");
  const facade: React.ReactNode[] = [];
  if (fr) {
    const at = (lx: number, ly: number): V3 => add(P(lx, ly, d / 2), mul(nf, 0.003 * size));
    let cl = "";
    for (let i = 1; i < 8; i++) {
      const ly = (h * i) / 8;
      const a = scr(A, at(-w / 2, ly));
      const b = scr(A, at(w / 2, ly));
      cl += `M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`;
    }
    facade.push(<path key="cl" d={cl} stroke={A.tone(HOUSE_MAT.wall.dark, dist)} strokeWidth={f2(lwAt(A, dist, 0.6))} strokeOpacity={0.35} fill="none" />);
    const rect = (key: string, lx0: number, ly0: number, lx1: number, ly1: number, fill: string, glow = 0) => {
      const q = [at(lx0, ly1), at(lx1, ly1), at(lx1, ly0), at(lx0, ly0)];
      const d0 = polyD(A, q);
      facade.push(<path key={key} d={d0} fill={fill} stroke={A.tone("#4A3A2A", dist)} strokeWidth={f2(lwAt(A, dist, 0.8))} />);
      if (glow > 0) {
        const c = scr(A, at((lx0 + lx1) / 2, (ly0 + ly1) / 2));
        const rr = Math.abs(scr(A, at(lx1, ly0)).x - scr(A, at(lx0, ly0)).x) * 1.4;
        facade.push(
          <g key={`${key}-gl`}>
            <defs>
              <radialGradient id={`${uid}-${key}-gl`}>
                <stop offset="0" stopColor="#FFE7A8" stopOpacity={0.55 * glow} />
                <stop offset="1" stopColor={WARM_WINDOW} stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(rr)} fill={`url(#${uid}-${key}-gl)`} />
            {/* the sash bars */}
            <path d={`M${polyD(A, [at((lx0 + lx1) / 2, ly0), at((lx0 + lx1) / 2, ly1)]).slice(1, -1)}M${polyD(A, [at(lx0, (ly0 + ly1) / 2), at(lx1, (ly0 + ly1) / 2)]).slice(1, -1)}`} stroke={A.tone("#5A3A1A", dist)} strokeWidth={f2(lwAt(A, dist, 0.6))} />
          </g>,
        );
      }
    };
    const dark = A.tone("#3A2E24", dist);
    rect("door", -0.06 * w, 0, 0.06 * w, 0.62 * h, A.tone("#4A3626", dist));
    rect("w1", -0.36 * w, 0.32 * h, -0.2 * w, 0.72 * h, warm > 0 ? A.toneO(mixHex("#3A2E24", WARM_WINDOW, warm), dist) : dark, warm);
    rect("w2", 0.2 * w, 0.32 * h, 0.36 * w, 0.72 * h, dark);
  }
  // shingle courses on the visible roof slope
  const rf = roof.visible.get("rfront");
  const shingles: React.ReactNode[] = [];
  if (rf) {
    let sd = "";
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const a = scr(A, [Vr[3][0] + (Vr[4][0] - Vr[3][0]) * t, Vr[3][1] + (Vr[4][1] - Vr[3][1]) * t, Vr[3][2] + (Vr[4][2] - Vr[3][2]) * t]);
      const b = scr(A, [Vr[2][0] + (Vr[5][0] - Vr[2][0]) * t, Vr[2][1] + (Vr[5][1] - Vr[2][1]) * t, Vr[2][2] + (Vr[5][2] - Vr[2][2]) * t]);
      sd += `M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`;
    }
    shingles.push(<path key="sh" d={sd} stroke={A.tone(HOUSE_MAT.roof.dark, dist)} strokeWidth={f2(lwAt(A, dist, 0.6))} strokeOpacity={0.45} fill="none" />);
  }
  // order: walls, the gables, the facade, the roof, its shingles, the chimney (on top of the ridge)
  return (
    <g>
      <ContactShadow A={A} x={x} z={z} a={w * 0.62} b={d * 0.9} amt={shadow} uid={`${uid}-sh`} />
      <FootOcclusion A={A} pts={Vw.slice(0, 4)} grow={0.05} amt={shadow} />
      {walls.els}
      {gable(-w / 2, "gl")}
      {gable(w / 2, "gr")}
      {facade}
      {roof.els}
      {shingles}
      {chim.els}
    </g>
  );
};
