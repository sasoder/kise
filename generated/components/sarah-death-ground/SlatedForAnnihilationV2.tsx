// SlatedForAnnihilationV2: the cold-review pass copy of SlatedForAnnihilation.tsx
// (composition id SlatedForAnnihilationV2, delivered as graphics/14_SlatedForAnnihilation_V2.mov;
// the V1 file and graphic stay untouched).
// ---------------------------------------------------------------------------
// SlatedForAnnihilation (file 14_SlatedForAnnihilation; Dwarkesh Patel with
// Sarah Paine, "Death ground: why regime change is brutal"). Dwarkesh map
// style, the umber page (no map); Sun Tzu's world, Warring States China.
// Opaque 1080x1920, 24 fps.
//
// CHECK LINE: "In an unlimited war the target is the ruler himself: the king
// and his court end up ringed by spears in their own palace, with nowhere to go."
//
// THE LINE: "that means at minimum the regime that's ... on the receiving end
// of this is slated for annihilation."
// WORD -> FRAME: that 2 · means 6 · at 14 · minimum 21 · the 32 · regime 49 ·
//   that's 72 · (pause 76-104) · on 105 · the 108 · receiving 110 · end 118 ·
//   of 126 · this 129 · is 134 · slated 140 · for 146 · annihilation 151.
// DURATION: sequence 14.417 - 21.292 s = 6.875 s x 24 = 165 frames (f0..f164).
//
// THE MOTION r3 (same camera/rise): the same close-to-wide regime reveal, with a non-mirrored
// cream army arriving in disciplined lanes through the pause. The central lanes
// finish closing f129-139; weapons level f130-151 while the king rises f129-148.
// The nearest ranks approach the stair foot, and a keyed push keeps king and
// threatening spear tips together through f164. The king remains alive.
//
// HOW: the palace is drawn here (the page manner: umber planes, cream line
// and hatch, dark hatch for shadow) on a ground plane seen from high up (a point at
// depth s lies at y = YH + DEPTH s, px per unit = s). The soldiers are sprites
// (AllAdultMales' technique): every man of a column runs the same local
// timeline, so a few dozen states drawn once by the figure module are blitted
// on a canvas far to near.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, INK, LAND, hash, mixColor, smootherstep, smoothstep } from "../kits/maps/incaShared";
import { TexcocoPage, WorldSvg, idle, makeCamera, track, walkPose, type P2 } from "../kits/maps/texcocoShared";
import { Banner, CREAM, GRIP_AT, King, Minister, ORANGE, POSES, Soldier, aimWeapon, dgAnchors, lerpFig, mirrorPose, onShaft, throneSeat, type FigPose } from "./dgFigures";

export const FPS = 24;
export const DURATION = 165;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const FRAME_W = 1080;
const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures' / CaptivesToTenochtitlan's)
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const ln = (w = 1, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const poly = (pts: P2[]) => `M${pts.map(P).join("L")}Z`;
const pline = (pts: P2[]) => `M${pts.map(P).join("L")}`;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
type Seg = [P2, P2];
const segD = (segs: Seg[]) => segs.map(([a, b]) => `M${P(a)}L${P(b)}`).join("");
/** hand-cut hatching: parallel strokes at `ang` deg filling the rect, each a hair off its place, ragged at both ends */
const hatchSegs = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const out: Seg[] = [];
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
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
    if (span < 2) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => segD(hatchSegs(x0, y0, x1, y1, ang, gap, seed, rag));
const bboxOf = (pts: P2[]) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};

type St = [P2, number];
const vsub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const vadd = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const vmul = (a: P2, k: number): P2 => [a[0] * k, a[1] * k];
const vlen = (a: P2) => Math.hypot(a[0], a[1]);
const vnorm = (a: P2): P2 => {
  const l = vlen(a) || 1;
  return [a[0] / l, a[1] / l];
};
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
/** a tapered form through stations [point, width] (the figure module's limbD) */
const bandD = (st: St[]) => {
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const dv = vsub(st[Math.min(n - 1, i + 1)][0], st[Math.max(0, i - 1)][0]);
    const u = vlen(dv) > 0.5 ? vnorm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    L.push(vadd(st[i][0], vmul(nr, st[i][1] / 2)));
    R.push(vadd(st[i][0], vmul(nr, -st[i][1] / 2)));
  }
  const u0 = vnorm(vsub(st[1][0], st[0][0]));
  const u1 = vnorm(vsub(st[n - 1][0], st[n - 2][0]));
  return smoothClosed([...L, vadd(st[n - 1][0], vmul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), vadd(st[0][0], vmul(u0, -st[0][1] * 0.42))]);
};

// ---------------------------------------------------------------------------
// THE GROUND PLANE (world px = screen px of the wide at k = 1). A point X units
// off the axis, at depth s (= px per unit there), H units up, lies at pr(X, s, H).
// ---------------------------------------------------------------------------
const XC = 540;
const YH = -1555;
const DEPTH = 4417;
const pr = (X: number, s: number, H = 0): P2 => [XC + X * s, YH + DEPTH * s - H * s];

// the terrace (units): half-width, front and back depth, height
const TW = 480;
const S_F = 0.627;
const S_B = 0.6;
const H_T = 343;
// the steps down the middle of its front
const SW = 150;
const CHEEK = 26;
const N_ST = 9;
const S_S = 0.6441;
const ST_DS = (S_S - S_F) / (N_ST - 1);
const ST_RISE = H_T / N_ST;
// the balustrade (units above the floor)
const BAL = { panel: 40, rail0: 60, rail1: 73, post: 96, head: 116 };

// the architecture in the map's page manner: umber planes (a little lighter than the page where lit, darker in
// shadow), cream LINE for edges, tiles, lattice and balustrade, cream highlights only on small things
const tone = (t: number) => (t >= 0 ? mixColor(LAND, INK, t) : mixColor(LAND, DARK, -t));
const edge = (w: number, a = 0.8) => ({ stroke: INK, strokeWidth: w, strokeOpacity: a, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });
const cl = (w = 1, a = 0.5) => ({ fill: "none", ...edge(w, a) });
const ROOF = tone(-0.32);
const ROOF_EDGE = tone(0.1);
const SHADOW = tone(-0.55);
const FACE = tone(-0.12);
const FACE_DEEP = tone(-0.36);
const LIT = tone(0.1);
const LIT2 = tone(0.17);
const RAIL = tone(0.14);
const BRIGHT = tone(0.5);

// ---------------------------------------------------------------------------
// THE TERRACE: a stepped stone base (xumizuo mouldings), the floor, the steps
// with their carved middle slab, the marble balustrade
// ---------------------------------------------------------------------------
const MOULD = [0, 34, 56, 252, 276, 300, H_T];
const TERRACE = (() => {
  const face = poly([pr(-TW, S_F, 0), pr(TW, S_F, 0), pr(TW, S_F, H_T), pr(-TW, S_F, H_T)]);
  const sideL = poly([pr(-TW, S_F, 0), pr(-TW, S_B, 0), pr(-TW, S_B, H_T), pr(-TW, S_F, H_T)]);
  const sideR = poly([pr(TW, S_F, 0), pr(TW, S_B, 0), pr(TW, S_B, H_T), pr(TW, S_F, H_T)]);
  const floor = poly([pr(-TW, S_F, H_T), pr(TW, S_F, H_T), pr(TW, S_B - 0.02, H_T), pr(-TW, S_B - 0.02, H_T)]);
  // the mouldings' lines round the front and both sides
  let mould = "";
  MOULD.slice(1, -1).forEach((h) => {
    mould += pline([pr(-TW, S_B, h), pr(-TW, S_F, h), pr(TW, S_F, h), pr(TW, S_B, h)]);
  });
  // the waist (recessed): its posts, the shadow under the upper moulding and the lower one
  const waist = poly([pr(-TW, S_F, MOULD[2]), pr(TW, S_F, MOULD[2]), pr(TW, S_F, MOULD[3]), pr(-TW, S_F, MOULD[3])]);
  let posts = "";
  const postX: number[] = [];
  for (let X = -TW + 70; X < TW - 40; X += 150) postX.push(X);
  postX.forEach((X) => {
    posts += poly([pr(X - 11, S_F, MOULD[2]), pr(X + 11, S_F, MOULD[2]), pr(X + 11, S_F, MOULD[3]), pr(X - 11, S_F, MOULD[3])]);
  });
  // shadow strokes: under each projecting moulding, short slanted strokes
  const shadeUnder = (h0: number, h1: number, seed: number, gapU = 7) => {
    let d = "";
    for (let X = -TW + 2, i = 0; X < TW - 2; X += gapU, i++) {
      const a = pr(X + 2 * hash(i, seed), S_F, h0);
      const L = (h0 - h1) * (0.55 + 0.45 * hash(i, seed + 1));
      const b = pr(X - 4 + 2 * hash(i, seed), S_F, h0 - L);
      d += `M${P(a)}L${P(b)}`;
    }
    return d;
  };
  const shade = shadeUnder(MOULD[3], MOULD[3] - 60, 301, 5.5) + shadeUnder(MOULD[5], MOULD[5] - 14, 303, 6) + shadeUnder(MOULD[1], MOULD[1] - 12, 305, 7);
  // a carved lozenge in each waist panel
  let carve = "";
  for (let i = 0; i < postX.length - 1; i++) {
    const xa = postX[i] + 11;
    const xb = postX[i + 1] - 11;
    const m = (xa + xb) / 2;
    const hm = (MOULD[2] + MOULD[3]) / 2;
    const w = (xb - xa) * 0.34;
    const hh = (MOULD[3] - MOULD[2]) * 0.3;
    carve += poly([pr(m - w, S_F, hm), pr(m, S_F, hm + hh), pr(m + w, S_F, hm), pr(m, S_F, hm - hh)]);
    carve += poly([pr(m - w * 0.55, S_F, hm), pr(m, S_F, hm + hh * 0.55), pr(m + w * 0.55, S_F, hm), pr(m, S_F, hm - hh * 0.55)]);
  }
  // the dark right flank, hatched
  const bR = bboxOf([pr(TW, S_F, 0), pr(TW, S_B, 0), pr(TW, S_B, H_T), pr(TW, S_F, H_T)]);
  const sideHatch = hatchD(bR.x0 - 2, bR.y0, bR.x1 + 2, bR.y1, 72, 3.2, 311, 0.1);
  // the floor's paving: courses across and joints running back
  let paving = "";
  for (let j = 1; j < 7; j++) {
    const s = 1 / mix(1 / S_F, 1 / (S_B - 0.02), j / 7);
    paving += pline([pr(-TW + 6, s, H_T), pr(TW - 6, s, H_T)]);
    const off = (j % 2) * 55;
    for (let X = -TW + 40 + off; X < TW - 30; X += 110) {
      const s2 = 1 / mix(1 / S_F, 1 / (S_B - 0.02), (j - 1) / 7);
      paving += pline([pr(X, s, H_T), pr(X, s2, H_T)]);
    }
  }
  return { face, sideL, sideR, floor, mould, waist, posts, shade, carve, sideHatch, paving };
})();

const STEPS = (() => {
  let risers = "";
  let treads = "";
  let riserShade = "";
  for (let i = 0; i < N_ST; i++) {
    const s = S_F + i * ST_DS;
    const hTop = H_T - i * ST_RISE;
    const hBot = hTop - ST_RISE;
    risers += poly([pr(-SW, s, hTop), pr(SW, s, hTop), pr(SW, s, hBot), pr(-SW, s, hBot)]);
    if (i < N_ST - 1) treads += poly([pr(-SW, s, hBot), pr(SW, s, hBot), pr(SW, s + ST_DS, hBot), pr(-SW, s + ST_DS, hBot)]);
    // the shadow under each nosing
    for (let X = -SW + 4, q = 0; X < SW - 2; X += 6.5, q++) {
      const a = pr(X, s, hTop - 2);
      const b = pr(X - 3, s, hTop - 2 - ST_RISE * (0.35 + 0.3 * hash(q + i * 71, 321)));
      riserShade += `M${P(a)}L${P(b)}`;
    }
  }
  // the carved middle slab (the "dragon carriageway") lying on the nosings
  const slab = poly([pr(-40, S_F, H_T), pr(40, S_F, H_T), pr(40, S_S, ST_RISE * 0.4), pr(-40, S_S, ST_RISE * 0.4)]);
  const sb = bboxOf([pr(-40, S_F, H_T), pr(40, S_S, 0)]);
  // cloud scrolls on the slab: little arcs climbing it
  let clouds = "";
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const s = mix(S_F, S_S, t);
    const h = mix(H_T, ST_RISE * 0.4, t) + 8;
    const sideX = i % 2 ? 12 : -12;
    const c = pr(sideX, s, h);
    const r = 7.5;
    clouds += `M${P([c[0] - r, c[1]])}a${r},${r * 0.7} 0 1 1 ${r * 1.4},${-r * 0.4}a${r * 0.5},${r * 0.4} 0 1 0 ${-r * 0.7},${r * 0.3}`;
  }
  const slabHatch = hatchD(sb.x0, sb.y0, sb.x1, sb.y1, 115, 4.2, 331, 0.2);
  // the cheek walls with their sloping railings
  const cheek = (sg: number) => {
    const x0 = sg * SW;
    const x1 = sg * (SW + CHEEK);
    const hTop = H_T;
    const hBot = 0;
    const top = poly([pr(x0, S_F - 0.001, hTop), pr(x1, S_F - 0.001, hTop), pr(x1, S_S, hBot + ST_RISE), pr(x0, S_S, hBot + ST_RISE)]);
    const end = poly([pr(x0, S_S, hBot + ST_RISE), pr(x1, S_S, hBot + ST_RISE), pr(x1, S_S, 0), pr(x0, S_S, 0)]);
    const xm = sg * (SW + CHEEK / 2);
    const rail = (u: number, h: number) => pr(xm, mix(S_F, S_S, u), mix(hTop, ST_RISE, u) + h);
    const n = 5;
    let postsD = "";
    let headsD = "";
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = rail(u, 0);
      const b = rail(u, i === n ? BAL.post + 14 : BAL.post);
      const w = 8.5 * mix(S_F, S_S, u);
      postsD += poly([[a[0] - w, a[1]], [a[0] + w, a[1]], [b[0] + w, b[1]], [b[0] - w, b[1]]]);
      const hr = (i === n ? 13 : 10.5) * mix(S_F, S_S, u);
      headsD += `M${P([b[0] - hr, b[1]])}a${hr},${hr * 1.15} 0 1 1 ${2 * hr},0Z`;
    }
    const railD = poly([rail(0, BAL.rail0), rail(1, BAL.rail0), rail(1, BAL.rail1), rail(0, BAL.rail1)]);
    const panelD = poly([rail(0, 6), rail(1, 6), rail(1, BAL.panel), rail(0, BAL.panel)]);
    return { top, end, postsD, headsD, railD, panelD };
  };
  return { risers, treads, riserShade, slab, clouds, slabHatch, cheekL: cheek(-1), cheekR: cheek(1) };
})();

/** the balustrade along the floor's edge: posts with round heads, a handrail, carved panels below it */
const BALUSTRADE = (() => {
  const runs: { a: [number, number]; b: [number, number] }[] = [
    // front, left and right of the stair; then down each side (X fixed, s varies)
    { a: [-TW, S_F], b: [-SW - CHEEK, S_F] },
    { a: [SW + CHEEK, S_F], b: [TW, S_F] },
    { a: [-TW, S_B - 0.003], b: [-TW, S_F] },
    { a: [TW, S_B - 0.003], b: [TW, S_F] },
  ];
  let posts = "";
  let heads = "";
  let rails = "";
  let panels = "";
  let vases = "";
  let shade = "";
  runs.forEach(({ a, b }, r) => {
    const at = (u: number, h: number) => pr(mix(a[0], b[0], u), mix(a[1], b[1], u), H_T + h);
    const along = r < 2 ? Math.abs(b[0] - a[0]) : 220;
    const n = Math.max(2, Math.round(along / 74));
    rails += poly([at(0, BAL.rail0), at(1, BAL.rail0), at(1, BAL.rail1), at(0, BAL.rail1)]);
    panels += poly([at(0, 5), at(1, 5), at(1, BAL.panel), at(0, BAL.panel)]);
    for (let i = 0; i < n; i++) {
      // a vase-shaped support midway between two posts, holding up the rail
      const u = (i + 0.5) / n;
      const lo = at(u, BAL.panel);
      const hi = at(u, BAL.rail0);
      const s = mix(a[1], b[1], u);
      const w = (r < 2 ? 9 : 4) * s;
      const m = mix2(lo, hi, 0.45);
      vases += `M${P([lo[0] - w * 0.6, lo[1]])}C${P([m[0] - w * 1.6, m[1]])} ${P([m[0] - w * 0.2, m[1] - 2])} ${P([hi[0] - w, hi[1]])}L${P([hi[0] + w, hi[1]])}C${P([m[0] + w * 0.2, m[1] - 2])} ${P([m[0] + w * 1.6, m[1]])} ${P([lo[0] + w * 0.6, lo[1]])}Z`;
      // the panel's carved frame
      if (r < 2) {
        const p0 = at(i / n + 0.06, 11);
        const p1 = at((i + 1) / n - 0.06, BAL.panel - 6);
        shade += poly([p0, [p1[0], p0[1]], p1, [p0[0], p1[1]]]);
      }
    }
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const s = mix(a[1], b[1], u);
      const p0 = at(u, 0);
      const p1 = at(u, BAL.post);
      const w = 8.5 * s;
      posts += poly([[p0[0] - w, p0[1]], [p0[0] + w, p0[1]], [p1[0] + w, p1[1]], [p1[0] - w, p1[1]]]);
      const hr = 10.5 * s;
      heads += `M${P([p1[0] - hr, p1[1]])}C${P([p1[0] - hr, p1[1] - hr * 1.7])} ${P([p1[0] + hr, p1[1] - hr * 1.7])} ${P([p1[0] + hr, p1[1]])}Z`;
    }
  });
  return { posts, heads, rails, panels, vases, shade };
})();

// ---------------------------------------------------------------------------
// THE HALL: a double-eaved hall on the back of the terrace (columns, lattice
// doors, a beam; the lower roof, a band of brackets, the upper roof, the ridge
// with its curled ends), tiles in rows down the slopes, the corners swept up
// ---------------------------------------------------------------------------
const S_H = S_B;
const COL_X = [-400, -250, -100, 100, 250, 400];
const HALL_X = 450;
const COL_R = 25;
const COL_TOP = H_T + 540;
type Roof = { eaveS: number; eaveH: number; eaveX: number; lift: number; flick: number; topS: number; topH: number; topX: number };
const LOWER: Roof = { eaveS: 0.613, eaveH: 960, eaveX: 600, lift: 90, flick: 52, topS: 0.6, topH: 1165, topX: 440 };
const UPPER: Roof = { eaveS: 0.606, eaveH: 1235, eaveX: 505, lift: 84, flick: 48, topS: 0.592, topH: 1500, topX: 290 };
/** the eave line at u -1..1: it sags in the middle and sweeps up at the corners */
const eaveAt = (r: Roof, u: number): P2 => {
  const a = Math.abs(u);
  const X = Math.sign(u) * (r.eaveX * a + r.flick * Math.pow(a, 8));
  const H = r.eaveH + r.lift * Math.pow(a, 5);
  return pr(X, r.eaveS, H);
};
const topAt = (r: Roof, u: number): P2 => pr(u * r.topX, r.topS, r.topH);
/** a point on the roof's slope: v 0 = the top edge, 1 = the eave (a concave sweep) */
const roofAt = (r: Roof, u: number, v: number): P2 => {
  const e = eaveAt(r, u);
  const t = topAt(r, u);
  // concave: it falls steeply under the top, then runs out flatter to the eave
  const vv = 1 - Math.pow(1 - v, 1.35);
  return [mix(t[0], e[0], v), mix(t[1], e[1], vv)];
};
const roofArt = (r: Roof, seed: number) => {
  const N = 80;
  const outline: P2[] = [];
  for (let i = 0; i <= N; i++) outline.push(eaveAt(r, -1 + (2 * i) / N));
  const body = `M${P(topAt(r, -1))}L${P(topAt(r, 1))}` + Array.from({ length: 11 }, (_, i) => `L${P(roofAt(r, 1, i / 10))}`).join("") + outline.reverse().map((p) => `L${P(p)}`).join("") + Array.from({ length: 11 }, (_, i) => `L${P(roofAt(r, -1, 1 - i / 10))}`).join("") + "Z";
  // the tile rows: pairs of lines down the slope, a disc at each eave end
  const rows = Math.round(r.eaveX / 11);
  let tiles = "";
  let ends = "";
  for (let i = 1; i < rows * 2; i++) {
    const u = -1 + i / rows;
    if (Math.abs(u) > 0.985) continue;
    const pts = Array.from({ length: 9 }, (_, q) => roofAt(r, u, q / 8));
    tiles += pline(pts);
    const e = eaveAt(r, u);
    const rr = 3.6 * r.eaveS;
    if (i % 2 === 0) ends += `M${P([e[0] - rr, e[1]])}a${rr},${rr} 0 1 0 ${2 * rr},0a${rr},${rr} 0 1 0 ${-2 * rr},0`;
  }
  // the courses of tiles across: faint lines
  let courses = "";
  for (let q = 1; q < 9; q++) {
    const v = q / 9;
    courses += pline(Array.from({ length: 41 }, (_, i) => roofAt(r, -0.97 + (1.94 * i) / 40, v)));
  }
  // shading: the slope darkens toward its top under the next eave, and the hips
  const bb = bboxOf([...outline, topAt(r, -1), topAt(r, 1)]);
  const hatch = hatchD(bb.x0, bb.y0, bb.x1, mix(bb.y0, bb.y1, 0.42), 104, 3.6, seed, 0.35);
  // the hip ridges: thick bands from the top corners down to the swept eave corners
  const hip = (sg: number) => {
    const pts = Array.from({ length: 13 }, (_, q) => roofAt(r, sg, q / 12));
    const L: P2[] = pts.map((p, q) => [p[0] - sg * (6 + 2 * (q / 12)) * r.eaveS, p[1] - 3]);
    return { line: pline(pts), band: poly([...pts, ...L.reverse()]) };
  };
  // the band along the eave edge (the eave board) and its rafter ends
  const lip: P2[] = Array.from({ length: N + 1 }, (_, i) => eaveAt(r, -1 + (2 * i) / N));
  const lipD = poly([...lip, ...lip.map((p): P2 => [p[0], p[1] + 9 * r.eaveS]).reverse()]);
  let rafters = "";
  for (let i = 1; i < 60; i++) {
    const p = eaveAt(r, -1 + (2 * i) / 60);
    const w = 3.2 * r.eaveS;
    rafters += `M${P([p[0] - w, p[1] + 9 * r.eaveS])}l0,${(8 * r.eaveS).toFixed(1)}l${(2 * w).toFixed(1)},0l0,${(-8 * r.eaveS).toFixed(1)}`;
  }
  return { body, tiles, ends, courses, hatch, hipL: hip(-1), hipR: hip(1), lipD, rafters, bbox: bb };
};
const HALL = (() => {
  // the facade: a dark band of lattice doors between the columns
  const facade = poly([pr(-HALL_X, S_H + 0.0005, H_T), pr(HALL_X, S_H + 0.0005, H_T), pr(HALL_X, S_H + 0.0005, COL_TOP + 40), pr(-HALL_X, S_H + 0.0005, COL_TOP + 40)]);
  let lattice = "";
  let doorFrames = "";
  const bays: [number, number][] = [[-HALL_X, COL_X[0]], ...COL_X.slice(0, -1).map((x, i): [number, number] => [x, COL_X[i + 1]]), [COL_X[5], HALL_X]];
  bays.forEach(([xa, xb], b) => {
    const inner = b === 0 || b === bays.length - 1;
    const x0 = xa + COL_R + 4;
    const x1 = xb - COL_R - 4;
    const leaves = inner ? 2 : 4;
    for (let q = 0; q < leaves; q++) {
      const la = mix(x0, x1, q / leaves);
      const lb = mix(x0, x1, (q + 1) / leaves);
      doorFrames += poly([pr(la + 2, S_H, H_T + 6), pr(lb - 2, S_H, H_T + 6), pr(lb - 2, S_H, COL_TOP - 30), pr(la + 2, S_H, COL_TOP - 30)]);
      // lattice in the upper two thirds: a grid of small squares
      const h0 = H_T + 200;
      const h1 = COL_TOP - 40;
      for (let h = h0; h <= h1; h += 24) lattice += pline([pr(la + 8, S_H, h), pr(lb - 8, S_H, h)]);
      const n = Math.max(2, Math.round((lb - la - 16) / 22));
      for (let k = 0; k <= n; k++) {
        const X = mix(la + 8, lb - 8, k / n);
        lattice += pline([pr(X, S_H, h0), pr(X, S_H, h1)]);
      }
      // the solid lower panel, with a waist rail
      lattice += poly([pr(la + 10, S_H, H_T + 30), pr(lb - 10, S_H, H_T + 30), pr(lb - 10, S_H, H_T + 160), pr(la + 10, S_H, H_T + 160)]);
      lattice += pline([pr(la + 4, S_H, H_T + 180), pr(lb - 4, S_H, H_T + 180)]);
    }
  });
  const fb = bboxOf([pr(-HALL_X, S_H, H_T), pr(HALL_X, S_H, COL_TOP + 40)]);
  // the deep shadow under the eaves over the top of the facade
  const eaveShade = hatchD(fb.x0, fb.y0, fb.x1, fb.y0 + 70, 62, 2.6, 401, 0.15) + hatchD(fb.x0, fb.y0, fb.x1, fb.y0 + 34, 118, 3, 402, 0.1);
  const cols = COL_X.map((X) => ({
    body: poly([pr(X - COL_R, S_H, H_T), pr(X + COL_R, S_H, H_T), pr(X + COL_R, S_H, COL_TOP), pr(X - COL_R, S_H, COL_TOP)]),
    shade: (() => {
      const a = pr(X + COL_R * 0.15, S_H, COL_TOP);
      const b = pr(X + COL_R, S_H, H_T);
      return hatchD(a[0], a[1], b[0], b[1], 90, 2.4, 410 + X, 0.04);
    })(),
    base: poly([pr(X - COL_R - 9, S_H + 0.001, H_T), pr(X + COL_R + 9, S_H + 0.001, H_T), pr(X + COL_R + 6, S_H + 0.001, H_T + 22), pr(X - COL_R - 6, S_H + 0.001, H_T + 22)]),
  }));
  const beam = poly([pr(-HALL_X - 20, S_H + 0.001, COL_TOP - 6), pr(HALL_X + 20, S_H + 0.001, COL_TOP - 6), pr(HALL_X + 20, S_H + 0.001, COL_TOP + 40), pr(-HALL_X - 20, S_H + 0.001, COL_TOP + 40)]);
  // the band of brackets under the upper eave (between the two roofs)
  const band = poly([pr(-UPPER.eaveX + 60, LOWER.topS - 0.002, LOWER.topH - 20), pr(UPPER.eaveX - 60, LOWER.topS - 0.002, LOWER.topH - 20), pr(UPPER.eaveX - 60, LOWER.topS - 0.002, UPPER.eaveH + 40), pr(-UPPER.eaveX + 60, LOWER.topS - 0.002, UPPER.eaveH + 40)]);
  let brackets = "";
  const sB = LOWER.topS - 0.002;
  for (let X = -UPPER.eaveX + 90; X <= UPPER.eaveX - 90; X += 64) {
    const h = LOWER.topH - 4;
    // a stacked bracket set: block, arms out, block, arms out
    brackets += poly([pr(X - 9, sB, h), pr(X + 9, sB, h), pr(X + 9, sB, h + 18), pr(X - 9, sB, h + 18)]);
    brackets += `M${P(pr(X - 26, sB, h + 34))}Q${P(pr(X - 24, sB, h + 18))} ${P(pr(X, sB, h + 20))}Q${P(pr(X + 24, sB, h + 18))} ${P(pr(X + 26, sB, h + 34))}`;
    brackets += poly([pr(X - 30, sB, h + 34), pr(X - 18, sB, h + 34), pr(X - 18, sB, h + 46), pr(X - 30, sB, h + 46)]);
    brackets += poly([pr(X + 18, sB, h + 34), pr(X + 30, sB, h + 34), pr(X + 30, sB, h + 46), pr(X + 18, sB, h + 46)]);
    brackets += poly([pr(X - 8, sB, h + 34), pr(X + 8, sB, h + 34), pr(X + 8, sB, h + 46), pr(X - 8, sB, h + 46)]);
  }
  const bandB = bboxOf([pr(-UPPER.eaveX + 60, sB, LOWER.topH - 20), pr(UPPER.eaveX - 60, sB, UPPER.eaveH + 40)]);
  const bandShade = hatchD(bandB.x0, bandB.y0, bandB.x1, bandB.y1, 60, 3.2, 420, 0.1);
  // the main ridge and its curled ends (chiwen)
  const rS = UPPER.topS;
  const ridge = poly([pr(-UPPER.topX - 10, rS, UPPER.topH - 6), pr(UPPER.topX + 10, rS, UPPER.topH - 6), pr(UPPER.topX + 10, rS, UPPER.topH + 46), pr(-UPPER.topX - 10, rS, UPPER.topH + 46)]);
  let ridgeLines = "";
  for (let X = -UPPER.topX; X < UPPER.topX; X += 22) ridgeLines += pline([pr(X, rS, UPPER.topH + 6), pr(X + 10, rS, UPPER.topH + 38)]);
  const chiwen = (sg: number) => {
    // a tall tail rising from the ridge's end: up the outside, curling inward over the ridge into a scroll
    const b = (X: number, H: number): P2 => pr(sg * (UPPER.topX + X), rS, UPPER.topH + H);
    const st: St[] = [
      [b(-8, 30), 44],
      [b(6, 66), 38],
      [b(14, 104), 30],
      [b(6, 136), 23],
      [b(-14, 150), 17],
      [b(-34, 142), 13],
      [b(-40, 122), 10],
      [b(-30, 108), 7],
      [b(-20, 115), 4.5],
    ].map(([p, w]) => [p as P2, (w as number) * rS] as St);
    const fins = Array.from({ length: 5 }, (_, i) => {
      const p = b(12 + 5 * Math.sin(i), 56 + i * 17);
      return `M${P(p)}l${(sg * 9 * rS).toFixed(1)},${(-5 * rS).toFixed(1)}`;
    }).join("");
    return { body: bandD(st), fins, eye: b(-34, 160) };
  };
  return { facade, lattice, doorFrames, eaveShade, cols, beam, band, brackets, bandShade, ridge, ridgeLines, chiwenL: chiwen(-1), chiwenR: chiwen(1), lower: roofArt(LOWER, 440), upper: roofArt(UPPER, 450) };
})();

/** the courtyard's side walls running out from the terrace, under a tiled coping */
const WALL_S = 0.596;
const WALLS = (() => {
  const wall = (sg: number) => {
    const xa = sg * (TW + 4);
    const xb = sg * 2200;
    const body = poly([pr(xa, WALL_S, 0), pr(xb, WALL_S, 0), pr(xb, WALL_S, 300), pr(xa, WALL_S, 300)]);
    const cope = poly([pr(xa, WALL_S + 0.004, 292), pr(xb, WALL_S + 0.004, 292), pr(xb, WALL_S - 0.002, 352), pr(xa, WALL_S - 0.002, 352)]);
    let tiles = "";
    for (let X = Math.min(xa, xb) + 6; X < Math.max(xa, xb); X += 13) tiles += pline([pr(X, WALL_S + 0.004, 294), pr(X, WALL_S - 0.002, 350)]);
    const bb = bboxOf([pr(xa, WALL_S, 0), pr(xb, WALL_S, 300)]);
    const shade = hatchD(bb.x0, bb.y0, bb.x1, bb.y0 + 36, 64, 3.2, 460 + sg, 0.15) + hatchD(bb.x0, bb.y0, bb.x1, bb.y1, 104, 7, 462 + sg, 0.45);
    return { body, cope, tiles, shade };
  };
  return { L: wall(-1), R: wall(1) };
})();

/** the courtyard's paving (cream, faint): courses of slabs in running bond, the imperial way down the middle */
const PAVING = (() => {
  let d = "";
  let way = "";
  const sMin = WALL_S;
  const sMax = 0.82;
  const n = 18;
  for (let j = 0; j <= n; j++) {
    const s = 1 / mix(1 / sMin, 1 / sMax, j / n);
    const sNext = 1 / mix(1 / sMin, 1 / sMax, (j + 1) / n);
    const inFront = s > S_S;
    // the course line; beside the terrace only out past it
    if (inFront) d += pline([pr(-1500, s), pr(-130, s)]) + pline([pr(130, s), pr(1500, s)]);
    else if (s < S_F) d += pline([pr(-1500, s), pr(-TW - 10, s)]) + pline([pr(TW + 10, s), pr(1500, s)]);
    if (j === n) continue;
    const off = (j % 2) * 0.5;
    for (let X = -1500 + (off + hash(j, 471) * 0.3) * 150; X < 1500; X += 150) {
      if (Math.abs(X) < 140 && sNext > S_S) continue;
      if (Math.abs(X) < TW + 12 && sNext <= S_F + 0.002) continue;
      if (Math.abs(X) < SW + CHEEK + 6 && s < S_S + 0.002 && sNext > S_F) continue;
      d += pline([pr(X, s), pr(X, sNext)]);
    }
  }
  // the way: double borders, and slabs laid across it
  [-130, -118, 118, 130].forEach((X) => {
    way += pline([pr(X, S_S + 0.001), pr(X, sMax)]);
  });
  for (let j = 0; j < 30; j++) {
    const s = 1 / mix(1 / (S_S + 0.001), 1 / sMax, j / 30);
    way += pline([pr(-118, s), pr(118, s)]);
  }
  return { d, way };
})();

const Architecture: React.FC = () => (
  <>
    {/* the courtyard */}
    <path d={PAVING.d} {...cl(1.5, 0.17)} />
    <path d={PAVING.way} {...cl(1.5, 0.24)} />
    {[WALLS.L, WALLS.R].map((w, i) => (
      <g key={i}>
        <path d={w.body} fill={FACE_DEEP} {...edge(1.4, 0.6)} />
        <path d={w.shade} {...ln(0.9, 0.42)} />
        <path d={w.cope} fill={ROOF} {...edge(1.4, 0.75)} />
        <path d={w.tiles} {...cl(0.8, 0.4)} />
      </g>
    ))}
    {/* the hall: dark roofs under cream tile lines, a dark facade with cream lattice */}
    <path d={HALL.upper.body} fill={ROOF} {...edge(1.6, 0.85)} />
    <path d={HALL.upper.courses} {...cl(0.7, 0.16)} />
    <path d={HALL.upper.tiles} {...cl(0.85, 0.42)} />
    <path d={HALL.upper.hatch} {...ln(1, 0.45)} />
    <path d={HALL.upper.hipL.band} fill={ROOF_EDGE} {...edge(1.3, 0.8)} />
    <path d={HALL.upper.hipR.band} fill={ROOF_EDGE} {...edge(1.3, 0.8)} />
    {[HALL.chiwenL, HALL.chiwenR].map((c, i) => (
      <g key={i}>
        <path d={c.body} fill={ROOF_EDGE} {...edge(1.5, 0.9)} />
        <path d={c.fins} {...cl(1, 0.6)} />
      </g>
    ))}
    <path d={HALL.ridge} fill={ROOF_EDGE} {...edge(1.5, 0.85)} />
    <path d={HALL.ridgeLines} {...cl(0.8, 0.35)} />
    <path d={HALL.band} fill={SHADOW} {...edge(1.2, 0.5)} />
    <path d={HALL.brackets} fill={FACE} {...edge(0.9, 0.55)} />
    <path d={HALL.bandShade} {...ln(0.8, 0.45)} />
    <path d={HALL.upper.lipD} fill={RAIL} {...edge(1.2, 0.85)} />
    <path d={HALL.upper.rafters} {...cl(0.8, 0.45)} />
    <path d={HALL.upper.ends} fill={BRIGHT} {...edge(0.7, 0.9)} />
    <path d={HALL.facade} fill={SHADOW} {...edge(1.4, 0.6)} />
    <path d={HALL.doorFrames} fill={FACE_DEEP} {...edge(1, 0.45)} />
    <path d={HALL.lattice} {...cl(0.8, 0.36)} />
    <path d={HALL.eaveShade} {...ln(1, 0.6)} />
    {HALL.cols.map((c, i) => (
      <g key={i}>
        <path d={c.body} fill={FACE} {...edge(1.3, 0.75)} />
        <path d={c.shade} {...ln(0.9, 0.55)} />
        <path d={c.base} fill={LIT} {...edge(1.1, 0.7)} />
      </g>
    ))}
    <path d={HALL.beam} fill={FACE} {...edge(1.3, 0.75)} />
    <path d={HALL.lower.body} fill={ROOF} {...edge(1.6, 0.85)} />
    <path d={HALL.lower.courses} {...cl(0.7, 0.16)} />
    <path d={HALL.lower.tiles} {...cl(0.85, 0.42)} />
    <path d={HALL.lower.hatch} {...ln(1, 0.45)} />
    <path d={HALL.lower.hipL.band} fill={ROOF_EDGE} {...edge(1.3, 0.8)} />
    <path d={HALL.lower.hipR.band} fill={ROOF_EDGE} {...edge(1.3, 0.8)} />
    <path d={HALL.lower.lipD} fill={RAIL} {...edge(1.2, 0.85)} />
    <path d={HALL.lower.rafters} {...cl(0.8, 0.45)} />
    <path d={HALL.lower.ends} fill={BRIGHT} {...edge(0.7, 0.9)} />
    {/* the terrace's floor */}
    <path d={TERRACE.floor} fill={LIT} {...edge(1.2, 0.6)} />
    <path d={TERRACE.paving} {...cl(0.8, 0.22)} />
  </>
);

/** the terrace's front, its steps and the balustrade: drawn over the court, under the soldiers */
const TerraceFront: React.FC = () => (
  <>
    <path d={TERRACE.sideL} fill={FACE} {...edge(1.4, 0.7)} />
    <path d={TERRACE.sideR} fill={SHADOW} {...edge(1.4, 0.6)} />
    <path d={TERRACE.sideHatch} {...ln(0.8, 0.5)} />
    <path d={TERRACE.face} fill={FACE} {...edge(1.6, 0.85)} />
    <path d={TERRACE.waist} fill={FACE_DEEP} />
    <path d={TERRACE.posts} fill={FACE} {...edge(1, 0.5)} />
    <path d={TERRACE.carve} {...cl(0.9, 0.35)} />
    <path d={TERRACE.mould} {...cl(1.2, 0.7)} />
    <path d={TERRACE.shade} {...ln(0.85, 0.55)} />
    {/* the steps: lit treads, dark risers, a cream line on every nosing */}
    <path d={STEPS.risers} fill={FACE_DEEP} {...edge(1, 0.5)} />
    <path d={STEPS.riserShade} {...ln(0.8, 0.45)} />
    <path d={STEPS.treads} fill={LIT2} {...edge(1, 0.75)} />
    <path d={STEPS.slab} fill={LIT} {...edge(1.2, 0.8)} />
    <path d={STEPS.slabHatch} {...ln(0.7, 0.35)} />
    <path d={STEPS.clouds} {...cl(0.9, 0.6)} />
    {[STEPS.cheekL, STEPS.cheekR].map((c, i) => (
      <g key={i}>
        <path d={c.top} fill={LIT} {...edge(1.2, 0.75)} />
        <path d={c.end} fill={FACE} {...edge(1.2, 0.7)} />
        <path d={c.panelD} fill={FACE} {...edge(1, 0.6)} />
        <path d={c.railD} fill={RAIL} {...edge(1, 0.85)} />
        <path d={c.postsD} fill={RAIL} {...edge(1, 0.85)} />
        <path d={c.headsD} fill={BRIGHT} {...edge(1, 0.9)} />
      </g>
    ))}
    {/* the balustrade round the floor: cream-lined, its post heads the small highlights */}
    <path d={BALUSTRADE.panels} fill={FACE} {...edge(1, 0.6)} />
    <path d={BALUSTRADE.shade} {...cl(0.8, 0.35)} />
    <path d={BALUSTRADE.vases} fill={RAIL} {...edge(0.8, 0.7)} />
    <path d={BALUSTRADE.rails} fill={RAIL} {...edge(1, 0.85)} />
    <path d={BALUSTRADE.posts} fill={RAIL} {...edge(1, 0.85)} />
    <path d={BALUSTRADE.heads} fill={BRIGHT} {...edge(1, 0.9)} />
  </>
);

// ---------------------------------------------------------------------------
// THE COURT (dgFigures): the king on his throne a little behind the floor's
// front edge, at a court scale (hieratic: about half again his depth), a
// minister kneeling at each side, his banner behind the throne
// ---------------------------------------------------------------------------
const S_K = 0.611;
const KING_SCALE = 0.95;
const THRONE_AT = pr(0, S_K, H_T);
const KING_AT = throneSeat(THRONE_AT, KING_SCALE);
const KING_DIR: 1 | -1 = 1;
const MIN_S = 0.599;
const MIN_SCALE = 0.58;
const MIN_AT: [P2, P2] = [pr(-220, MIN_S, H_T), pr(220, MIN_S, H_T)];
const BANNER_SCALE = 0.8;
const BANNER_FOOT = pr(-205, 0.604, H_T);
const BANNER_GRIP: P2 = [BANNER_FOOT[0], BANNER_FOOT[1] - GRIP_AT.banner * BANNER_SCALE];
/** the throne in the page manner (dgFigures' THRONE geometry, so throneSeat seats the king on it): a low dais,
 *  a three-leaf screen behind; dark planes, cream lines, cream lattice */
const TH = { w: 150, h: 46, d: 30, screenH: 300 };
const THRONE_ART = (() => {
  const o = THRONE_AT;
  const sc = KING_SCALE;
  const q = (x: number, y: number): P2 => [o[0] + x * sc, o[1] + y * sc];
  const yt = -TH.h - TH.d;
  const front = poly([q(-TH.w, 0), q(TH.w, 0), q(TH.w, -TH.h), q(-TH.w, -TH.h)]);
  const top = poly([q(-TH.w, -TH.h), q(TH.w, -TH.h), q(TH.w - 12, yt), q(-TH.w + 12, yt)]);
  // the dais' carved panels and its feet
  let carve = "";
  [-1, 0, 1].forEach((i) => {
    const x0 = i * 96 - 42;
    carve += poly([q(x0, -10), q(x0 + 84, -10), q(x0 + 84, -36), q(x0, -36)]);
    carve += `M${P(q(x0 + 12, -23))}C${P(q(x0 + 30, -33))} ${P(q(x0 + 42, -13))} ${P(q(x0 + 60, -23))}S${P(q(x0 + 74, -27))} ${P(q(x0 + 76, -23))}`;
  });
  const leaf = (pts: P2[], inset: P2[], seed: number) => {
    const bb = bboxOf(inset.map((p) => q(p[0], p[1])));
    const lat = hatchD(bb.x0, bb.y0, bb.x1, bb.y1, 58, 16 * sc, seed, 0) + hatchD(bb.x0, bb.y0, bb.x1, bb.y1, 122, 16 * sc, seed + 1, 0);
    return { outer: poly(pts.map((p) => q(p[0], p[1]))), inner: poly(inset.map((p) => q(p[0], p[1]))), lat };
  };
  const yb = yt;
  const H = TH.screenH;
  const leaves = [
    leaf([[-150, yb - 8], [-150, yb - H + 46], [-76, yb - H + 22], [-76, yb]], [[-139, yb - 20], [-139, yb - H + 58], [-87, yb - H + 38], [-87, yb - 12]], 701),
    leaf([[150, yb - 8], [150, yb - H + 46], [76, yb - H + 22], [76, yb]], [[139, yb - 20], [139, yb - H + 58], [87, yb - H + 38], [87, yb - 12]], 703),
    leaf([[-76, yb], [-76, yb - H], [76, yb - H], [76, yb]], [[-64, yb - 12], [-64, yb - H + 12], [64, yb - H + 12], [64, yb - 12]], 705),
  ];
  const cap = poly([q(-84, yb - H + 2), q(84, yb - H + 2), q(84, yb - H - 14), q(-84, yb - H - 14)]);
  return { front, top, carve, leaves, cap };
})();
const ThroneArt: React.FC = () => (
  <>
    {THRONE_ART.leaves.map((l, i) => (
      <g key={i}>
        <path d={l.outer} fill={FACE} {...edge(1.5, 0.85)} />
        <clipPath id={`thr-l${i}`}>
          <path d={l.inner} />
        </clipPath>
        <path d={l.inner} fill={SHADOW} {...edge(1, 0.6)} />
        <g clipPath={`url(#thr-l${i})`}>
          <path d={l.lat} {...cl(0.9, 0.42)} />
        </g>
      </g>
    ))}
    <path d={THRONE_ART.cap} fill={RAIL} {...edge(1.2, 0.85)} />
    <path d={THRONE_ART.top} fill={LIT2} {...edge(1.3, 0.85)} />
    <path d={THRONE_ART.front} fill={FACE} {...edge(1.4, 0.85)} />
    <path d={THRONE_ART.carve} {...cl(0.9, 0.5)} />
  </>
);

const T = {
  /** the last gap shuts at the foot of the steps ("receiving"); the wave runs out from that rank ("end" .. "this") */
  lastClose: 139,
  wave: 130,
  rise0: 129,
  rise1: 148,
};
const kingRise = (f: number) => smootherstep((f - T.rise0) / (T.rise1 - T.rise0));

/** the court sees them come: the king's head turns from his court down to the courtyard; each minister looks
 *  round at the column coming in on his side, then bows his head low as the ge come down */
const kingLook = track([[60, 0], [100, 1]]);
const minLook = track([[56, 0], [82, 1], [112, 0.55]]);
const minBow = track([[118, 0], [136, 1]]);
const kingPose = (f: number): FigPose => {
  const q = POSES.rise(KING_DIR, kingRise(f));
  const l = kingLook(f);
  return idle({ ...q, headYaw: mix(q.headYaw, KING_DIR * 0.32, l), pitch: q.pitch + 8 * l }, f, 1);
};
const ministerPose = (dir: 1 | -1, f: number): FigPose => {
  const q = POSES.seatedHu(dir);
  const l = minLook(f);
  const b = minBow(f);
  return idle({ ...q, headYaw: mix(q.headYaw, -dir * 0.35, l), pitch: q.pitch + 6 * l + 12 * b, crouch: q.crouch + 5 * b }, f, dir === 1 ? 2 : 3);
};

const Court: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Banner at={BANNER_GRIP} scale={BANNER_SCALE} ink={ORANGE} wave={0.035 * f} uid="ban" />
    <ThroneArt />
    <King pose={kingPose(f)} at={KING_AT} scale={KING_SCALE} ink={ORANGE} uid="king" />
    <Minister pose={ministerPose(1, f)} at={MIN_AT[0]} scale={MIN_SCALE} ink={ORANGE} uid="minL" />
    <Minister pose={ministerPose(-1, f)} at={MIN_AT[1]} scale={MIN_SCALE} ink={ORANGE} uid="minR" />
  </>
);

// ---------------------------------------------------------------------------
// THE SOLDIERS. One man's timeline (figure-local; he faces dir):
//   WALK  w 0..CYC-1   the march, one per frame of the cycle
//   HALT  h 0..HALT    the last steps of the column's halt (h = HALT: stood, ge upright)
//   LEVEL v, l 0..LV   the ge brought down to point at the terrace at angle variant v
// ---------------------------------------------------------------------------
const CYC = 18;
const STRIDE = 110;
const HALT = 10;
const LV = 9;
/** they march with the ge slanted forward at the port, both fists on the shaft (deg off the vertical, the tip ahead) */
const MARCH_TILT = 35;
/** the ge's levelled angles above the horizontal, deg (variant 0: the flanks, at the terrace's sides; 1: every rank
 *  in front of it, so each half's ge are parallel diagonals and the two halves converge on the terrace) */
// The lead figures alone level, with individually targeted trajectories.
const AIMS = [40, 45, 52, 35, 52, 35];
const SUPPORT_INK = {
  main: mixColor(LAND, CREAM.main, 0.47),
  deep: mixColor(LAND, CREAM.deep, 0.47),
  hair: mixColor(LAND, CREAM.hair, 0.47),
};
/** px per frame a column marches at depth s (the planted foot does not slide) */
const speedAt = (s: number) => (2 * STRIDE * s) / CYC;

type SoldierState = { pose: FigPose; aim: number | null };
/** the march: the carry with the weapon fist a little higher and the ge slanted forward, the other fist up the shaft */
const MARCH_R: FigPose = (() => {
  const c = POSES.carry(1);
  return onShaft(aimWeapon({ ...c, armL: { ...c.armL, w: [c.armL.w[0] + 2, c.armL.w[1] - 16] } }, MARCH_TILT), 96);
})();
const carryPose = (dir: 1 | -1): FigPose => (dir === 1 ? MARCH_R : mirrorPose(MARCH_R));
/** the walk's legs and bob at the column's stride; the arms keep the pose (the carried ge) */
const marchLegs = (base: FigPose, phase: number, amount: number): FigPose => ({ ...walkPose(base, phase, amount, STRIDE), armL: base.armL, armR: base.armR });
const N_DIR_STATES = CYC + (HALT + 1) + AIMS.length * (LV + 1);
const stateIndex = {
  walk: (dirI: number, w: number) => dirI * N_DIR_STATES + w,
  halt: (dirI: number, h: number) => dirI * N_DIR_STATES + CYC + h,
  level: (dirI: number, v: number, l: number) => dirI * N_DIR_STATES + CYC + HALT + 1 + v * (LV + 1) + l,
};
const N_STATES = 2 * N_DIR_STATES;
const STATES: SoldierState[] = (() => {
  const out: SoldierState[] = [];
  ([1, -1] as const).forEach((dir) => {
    const face = (q: FigPose) => (dir === 1 ? q : mirrorPose(q));
    const base = carryPose(dir);
    for (let w = 0; w < CYC; w++) out.push({ pose: marchLegs(base, w / CYC, 1), aim: null });
    for (let h = 0; h <= HALT; h++) out.push({ pose: marchLegs(base, h / CYC, 1 - smoothstep(h / HALT)), aim: null });
    AIMS.forEach((aim, variant) => {
      // the body and arms blend into the hedge stance while the ge's angle is led down monotonically (no lift first)
      const g = POSES.guard(1);
      // Outer leaders hold at shoulder height so the attached shaft clears
      // their inner comrade's head instead of crossing his face.
      const raised = variant === 3 || variant === 5;
      const target = raised ? { ...g, armL: { ...g.armL, w: [g.armL.w[0], g.armL.w[1] - 60] as P2 } } : g;
      const guard = onShaft(aimWeapon(target, 90 - aim), 104);
      for (let l = 0; l <= LV; l++) {
        const t = smootherstep(l / LV);
        const q = onShaft(aimWeapon(lerpFig(MARCH_R, guard, t), mix(MARCH_TILT, 90 - aim, t)), mix(96, 104, t));
        out.push({ pose: face(q), aim });
      }
    });
  });
  return out;
})();

/** Quiet support keeps its weapon attached to both fists and at a fixed port.
 * No alpha layer, no animated disappearance, and no synchronous weapon fan. */
const poseFor = (st: number, quiet: boolean): FigPose => {
  const q = STATES[st].pose;
  if (!quiet) return q;
  const dir: 1 | -1 = st < N_DIR_STATES ? 1 : -1;
  const base = dir === 1 ? MARCH_R : mirrorPose(MARCH_R);
  return onShaft(aimWeapon({ ...q, armL: base.armL, armR: base.armR }, dir * 14), 96);
};
const SoldierArt: React.FC<{ st: number; at: P2; scale: number; uid: string; quiet?: boolean }> = ({ st, at, scale, uid, quiet = false }) => <Soldier pose={poseFor(st, quiet)} at={at} scale={scale} uid={uid} ink={quiet ? SUPPORT_INK : CREAM} />;

// ---- the host: rows across the courtyard in front of the terrace, two short rows on each flank
type Man = { lead: boolean; x1: number; y: number; s: number; dir: 1 | -1; tClose: number; tLevel: number; v: number; ph: number };
const FRONT_ROWS = [0.652, 0.68, 0.712, 0.746, 0.781];
const FLANK_ROWS = [0.606, 0.622];
const FILE_U = 168;
const FLANK_FILE_U = 135;
const HOST: Man[] = (() => {
  const men: Man[] = [];
  // Separate lane grids: unequal depth, spacing, file offsets and timing.
  // Every row remains a compact rank; no per-man spatial scatter.
  ([1, -1] as const).forEach((dir) => {
    const side = dir === 1 ? 0 : 1;
    FRONT_ROWS.forEach((baseS, r) => {
      if (r === 1 || r === 3) return; // remove redundant whole ranks from initial existence
      const s = baseS + (side ? 0.0035 : 0);
      const dx = (FILE_U + side * 11) * s;
      const off = side ? [0.26, 0.72, 0.16, 0.57, 0.32][r] : [0.47, 0.10, 0.62, 0.25, 0.73][r];
      const tClose = T.lastClose - r * 7 - side * (3 + r % 2);
      for (let j = 0; j < (side ? 7 : 8); j++) {
        const x1 = XC - dir * (j + off) * dx;
        const i = men.length;
        const tLevel = Math.max(tClose, Math.round(T.wave + r * 1.4 + j * 0.7 + side * 2));
        men.push({ lead: false, x1, y: pr(0, s)[1], s, dir, tClose, tLevel, v: 1, ph: 6.283 * hash(i, 503 + 23 * side) });
      }
    });
    FLANK_ROWS.forEach((baseS, r) => {
      // The same side approach, its leading terrace-side rank kept whole
      // above captions. Its feet remain outside the terrace side wall.
      const s = (r === 0 ? 0.596 : baseS) + (side ? (r === 0 ? 0.002 : 0.004) : 0);
      const tClose = 98 + r * 13 + side * 5;
      for (let j = 0; j < (side ? 3 : 4); j++) {
        const X = -dir * (TW + 113 + j * (r === 0 ? 100 : FLANK_FILE_U + side * 12) + r * (side ? 23 : 46));
        const x1 = pr(X, s)[0];
        const i = men.length;
        men.push({lead: r === 0 && j < 2, x1, y: pr(0, s)[1], s, dir, tClose, tLevel: 132 + r * 3 + side * 2 + j, v: r === 0 && j < 2 ? 2 + side * 2 + j : 0, ph: 6.283 * hash(i, 527 + side)});
      }
    });
  });
  return men.sort((a, b) => a.y - b.y || a.x1 - b.x1);
})();
/** the column's remaining walk to its halt, in frames of full pace */
const remaining = (f: number, tClose: number) => {
  if (f >= tClose) return 0;
  const h0 = tClose - HALT;
  if (f < h0) return h0 - f + HALT / 2;
  const a = (f - h0) / HALT;
  return HALT * (0.5 - a + a * a * a - (a * a * a * a) / 2);
};
const manAt = (m: Man, f: number) => {
  const x = m.x1 - m.dir * speedAt(m.s) * remaining(f, m.tClose) + (m.v !== 1 ? m.dir * 60 * smootherstep((f - 105) / 59) : 0);
  // After the horizontal lane closes, the nearest rank finishes its approach
  // toward the stair foot. Its feet stop beyond S_S, never inside the steps.
  const approach = m.v === 1 && m.s < 0.66 ? smootherstep((f - 105) / 59) : 0;
  const y = m.y - approach * 30;
  const dirI = m.dir === 1 ? 0 : 1;
  const h0 = m.tClose - HALT;
  let st: number;
  if (f < h0) st = stateIndex.walk(dirI, (((f - h0) % CYC) + CYC) % CYC);
  else if (f < m.tClose) st = stateIndex.halt(dirI, f - h0);
  else if (f < m.tLevel) st = stateIndex.halt(dirI, HALT);
  else st = stateIndex.level(dirI, m.v, Math.min(LV, f - m.tLevel));
  return { x, y, st, settled: f >= m.tClose };
};

// ---------------------------------------------------------------------------
// SPRITES: state x size, rasterised from the figure module's own SVG on demand
// ---------------------------------------------------------------------------
const BOX = { x0: -440, x1: 440, y0: -600, y1: 50 };
const TIERS = [1.6, 1.25, 1.0, 0.8, 0.64, 0.5];
type Sprite = { c: HTMLCanvasElement; sc: number };
const SPRITES = new Map<number, Sprite>();
const LOADING = new Map<number, Promise<void>>();
const keyOf = (st: number, tier: number, quiet: boolean) => (st + (quiet ? N_STATES : 0)) * 8 + tier;
const tierFor = (d: number) => {
  let t = 0;
  while (t < TIERS.length - 1 && TIERS[t + 1] >= d * 0.97) t++;
  return t;
};
const spriteSize = (key: number) => {
  const sc = TIERS[key & 7];
  return { st: (key >> 3) % N_STATES, quiet: (key >> 3) >= N_STATES, sc, w: Math.ceil((BOX.x1 - BOX.x0) * sc) + 2, h: Math.ceil((BOX.y1 - BOX.y0) * sc) + 2 };
};
const SpriteSource: React.FC<{ spriteKey: number }> = ({ spriteKey }) => {
  const { st, quiet, sc, w, h } = spriteSize(spriteKey);
  return (
    <svg data-sprite={spriteKey} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <SoldierArt st={st} quiet={quiet} at={[-BOX.x0 * sc + 1, -BOX.y0 * sc + 1]} scale={sc} uid={`sl${spriteKey}`} />
    </svg>
  );
};
const loadSprite = (key: number, node: Element): Promise<void> => {
  const had = LOADING.get(key);
  if (had) return had;
  const { st, sc, w, h } = spriteSize(key);
  const svg = new XMLSerializer().serializeToString(node);
  const p = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0, w, h);
      SPRITES.set(key, { c, sc });
      resolve();
    };
    img.onerror = () => reject(new Error(`SlatedForAnnihilation: sprite ${st} at ${sc} did not rasterise`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  LOADING.set(key, p);
  return p;
};

// ---------------------------------------------------------------------------
// THE CAMERA: close on the king, one pull-back and down to the wide on
// "regime", a slow creep while the columns come in, then a slow push in on him
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  { f: 0, k: 3.1, wx: XC, wy: 895, sx: 540, sy: 960 },
  { f: 49, k: 1.24, wx: XC, wy: 1002, sx: 540, sy: 960 },
  { f: 98, k: 1.18, wx: XC, wy: 1004, sx: 540, sy: 960 },
  { f: 129, k: 1.26, wx: XC, wy: 1004, sx: 540, sy: 960 },
  { f: 151, k: 1.36, wx: XC, wy: 1006, sx: 540, sy: 960 },
  { f: 164, k: 1.40, wx: XC, wy: 1009, sx: 540, sy: 960 },
]);

type Plan = { n: number; sx: Float32Array; sy: Float32Array; d: Float32Array; key: Int32Array; rock: Float32Array; keys: number[] };
const planAt = (f: number): Plan => {
  const cam = camAt(f);
  const N = HOST.length;
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const dd = new Float32Array(N);
  const key = new Int32Array(N);
  const rock = new Float32Array(N);
  const seen = new Set<number>();
  let n = 0;
  for (let i = 0; i < N; i++) {
    const m = HOST[i];
    const a = manAt(m, f);
    const d = m.s * cam.k;
    const x = 540 + (a.x - cam.cx) * cam.k;
    const y = 960 + (a.y - cam.cy) * cam.k;
    if (x + BOX.x1 * d < 0 || x + BOX.x0 * d > FRAME_W || y + BOX.y0 * d > FRAME_H || y + BOX.y1 * d < 0) continue;
    const k = keyOf(a.st, tierFor(d), !m.lead);
    sx[n] = x;
    sy[n] = y;
    dd[n] = d;
    key[n] = k;
    // stood men rock a hair about their feet, each on his own time
    rock[n] = 0; // planted halt: no idle rocking disguising a stopped formation
    seen.add(k);
    n++;
  }
  return { n, sx, sy, d: dd, key, rock, keys: [...seen] };
};
const drawPlan = (ctx: CanvasRenderingContext2D, p: Plan) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  for (let j = 0; j < p.n; j++) {
    const sp = SPRITES.get(p.key[j]);
    if (!sp) continue;
    const q = p.d[j] / sp.sc;
    const w = sp.c.width * q;
    const h = sp.c.height * q;
    const ox = (BOX.x0 * sp.sc - 1) * q;
    const oy = (BOX.y0 * sp.sc - 1) * q;
    const c = Math.cos(p.rock[j]);
    const s = Math.sin(p.rock[j]);
    ctx.setTransform(c, s, -s, c, p.sx[j], p.sy[j]);
    ctx.drawImage(sp.c, ox, oy, w, h);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

const SlatedForAnnihilation: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const plan = useMemo(() => planAt(frame), [frame]);
  const ref = useRef<HTMLCanvasElement>(null);
  const bench = useRef<HTMLDivElement>(null);
  const waiting = useRef<number | null>(null);
  const [jobs, setJobs] = useState<number[]>([]);
  useLayoutEffect(() => {
    const missing = plan.keys.filter((k) => !SPRITES.has(k));
    if (!missing.length) {
      const ctx = ref.current?.getContext("2d");
      if (ctx) drawPlan(ctx, plan);
      if (waiting.current !== null) {
        continueRender(waiting.current);
        waiting.current = null;
      }
      return;
    }
    if (waiting.current === null) waiting.current = delayRender("SlatedForAnnihilation: rasterising the soldier sprites", { timeoutInMilliseconds: 240000 });
    const nodes = new Map<number, Element>();
    bench.current?.querySelectorAll("svg[data-sprite]").forEach((el) => nodes.set(Number(el.getAttribute("data-sprite")), el));
    if (missing.some((k) => !nodes.has(k) && !LOADING.has(k))) {
      setJobs(missing);
      return;
    }
    Promise.all(missing.map((k) => loadSprite(k, nodes.get(k) as Element)))
      .then(() => setJobs([]))
      .catch((err) => cancelRender(err));
  }, [plan, frame, jobs]);
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Architecture />
          <Court f={frame} />
          <TerraceFront />
        </WorldSvg>
        <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      </TexcocoPage>
      <div ref={bench} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
        {jobs.map((k) => (
          <SpriteSource key={k} spriteKey={k} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default SlatedForAnnihilation;

/** review sheet: the court and the soldier's states, live SVG (world = screen at k 1) */
export const SlatedSheet: React.FC = () => {
  const cam = { k: 1, cx: 540, cy: 960 };
  const picks = [stateIndex.walk(0, 0), stateIndex.walk(0, 5), stateIndex.walk(0, 10), stateIndex.walk(0, 15), stateIndex.halt(0, HALT), stateIndex.level(0, 0, LV), stateIndex.level(0, 1, LV), stateIndex.level(0, 1, 6), stateIndex.level(0, 1, 3), stateIndex.walk(1, 3), stateIndex.halt(1, HALT), stateIndex.level(1, 1, LV)];
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Banner at={[140, 330]} scale={0.8} ink={ORANGE} wave={0.4} uid="sb" />
          <King pose={POSES.seated(1)} at={throneSeat([330, 640], KING_SCALE)} scale={KING_SCALE} ink={ORANGE} uid="sk1" />
          <King pose={{ ...POSES.seated(1), yaw: 0.45, headYaw: 0.4 }} at={[640, 640]} scale={KING_SCALE} ink={ORANGE} uid="sk2" />
          <King pose={POSES.rise(1, 0.5)} at={[800, 640]} scale={KING_SCALE} ink={ORANGE} uid="sk3" />
          <King pose={POSES.rise(1, 1)} at={[960, 640]} scale={KING_SCALE} ink={ORANGE} uid="sk4" />
          <Minister pose={POSES.seatedHu(1)} at={[120, 980]} scale={MIN_SCALE} ink={ORANGE} uid="sm1" />
          <Minister pose={POSES.seatedHu(-1)} at={[300, 980]} scale={MIN_SCALE} ink={ORANGE} uid="sm2" />
          {picks.map((st, i) => (
            <SoldierArt key={i} st={st} at={[90 + (i % 6) * 175, 1420 + Math.floor(i / 6) * 440]} scale={0.66} uid={`ss${i}`} />
          ))}
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

/** the host's size and the state count (for the report) */
export const HOST_COUNT = HOST.length;
export const STATE_COUNT = N_STATES;

/** Deterministic review geometry, in full-resolution rendered coordinates. */
export const r3ReviewAt = (f: number) => {
 const c = camAt(f);
 const project = (p: P2): P2 => [540 + (p[0]-c.cx)*c.k, 960+(p[1]-c.cy)*c.k];
 const king = dgAnchors("king", kingPose(f), KING_AT, KING_SCALE);
 const mins = MIN_AT.map((at,i)=>dgAnchors("minister", ministerPose(i===0?1:-1,f),at,MIN_SCALE));
 const men = HOST.map((m)=>{const a=manAt(m,f);const an=dgAnchors("soldier",poseFor(a.st,!m.lead),[a.x,a.y],m.s);return {lead:m.lead, v:m.v, grip:project(an.grip), handL:project(an.handL), handR:project(an.handR), dir:m.dir, row:m.s, x:a.x, close:m.tClose, level:m.tLevel, tip:project(an.tip), head:project(an.headC), feet:project(an.feet), crown:project(an.crownTop)};});
 return {frame:f,camera:c, king:{crown:project(king.crownTop),head:project(king.headC),feet:project(king.feet)}, ministers:mins.map(m=>({head:project(m.headC),feet:project(m.feet)})),men};
};
