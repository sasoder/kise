// ---------------------------------------------------------------------------
// MineDrainageWheels (kyle-rome-slavery, cut 14). Dwarkesh map style (styles/dwarkesh-map.md) in the clip's 3D
// depth manner (COMMON.md; London's DEPTH.md and londonDepth, imported read-only). Opaque 1080x1920, 29.97 fps,
// 129 frames. World, camera and kinematics in mineDrainagePlan.ts.
//
// CHECK LINE: "Rome's most advanced machinery — the great drainage wheels in its Spanish silver mines — was worked
//   by slaves, one on every wheel."
//
// THE LINE: "(But the good version of that argument would just be that) the Roman Empire is using, in fact, slaves
//   in many of the most forward elements of the economy."
// WORD -> FRAME: the 1 · Roman 3 · Empire 8 · is 16 · using 27 · in 39 · fact 44 · slaves 48 · and 58 · many 64 ·
//   of 71 · the 74 · most 76 · forward 81 · elements 91 · of 101 · the 108 · economy 110 (next sentence at 127)
// DURATION: the slot 14.815 -> 19.119 s = 4.304 s x 29.97 = 129 frames (f0..f128).
//
// THE MOTION: a cutaway of the rock: a stair of six orange water-lifting wheels zig-zagging up a central rib, each in
// its own cut chamber, a cream slave treading the rim of every one. f0 the camera is close on the lowest wheel, its
// treader already stepping (he fills the frame, head ~y 760), and it is already rising; one continuous crane rise with
// a pull-back climbs past chambers 0-2 (each with its treader, different stride phases) so that by "slaves" (f48) three
// treaders are in shot, by "many" (f64) four wheels, and by "forward elements" (f91) the pull-back has stopped on ~4
// wheels in full with the next ones cropped by the frame edges (the stair runs on beyond the frame; treaders ~200 px,
// heads and fists in the caption-band gaps); it settles there alive to f128 (every wheel turning, the water stepping
// up from launder to tank, a slow creep).
// CAUSE BEFORE EFFECT: each wheel's angle is the integral of its treader's stride (mineDrainagePlan rimArc): his planted
// foot rides its cleat down the rim and the rim's speed surges after each footfall (contact = the footfall frame, first
// reaction the same frame: the rim under a planted foot never slides).
// Orange = the machine (the clip rule): the wheels (rims, compartments, spokes, hubs). Rock, timber, water and people
// cream / umber; the lamps' flames cream. No text.
//
// DEPTH: londonDepth's model with the eye on the camera's own centre line (a crane: VP at the frame centre, horizon =
// the frame's middle line), dRef 2550 at kRef 0.372, dolly 0.4. Depths: the section plane (rock face) Z 0, front
// bearing / post 52-100, tank 96-276, wheel 150-214 (treader and handrail 182), launder 252-318, back wall 520.
// Light from the upper left: floors and right-hand walls lit, ceilings and left-hand walls dark, the back wall mid.
//
// SOURCES (illustrative; nothing on screen): reverse overshot water wheel (Wikipedia, "Reverse overshot water-wheel";
//   Vitruvius X.4 on the tympanum / compartmented wheel); Rio Tinto, Spain: a sequence of 16 such wheels working in
//   pairs, each pair lifting ~3.5 m, ~30 m in all, turned by men treading the rim (Wikipedia, citing Oleson, Greek and
//   Roman Mechanical Water-Lifting Devices, 1984); British Museum 1889,0622.1, a Roman drainage wheel from the Rio Tinto
//   mines, 1st-2nd c. AD, original diameter ~4.60 m. Roman mines were worked largely by slaves and the condemned
//   (damnatio ad metalla). Six wheels drawn (one per stage) so the treaders stay above the phone floor in the wide.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { ACCENT, ACCENT_DEEP, INK, SEA, hash, swayCam, type P2 } from "../kits/maps/incaShared";
import { Box, DARK, perspective, type Persp, type VolInk } from "../kyle-london/londonDepth";
import { POSES as RomePoses, Slave, mirrorPose, type FigPose } from "./romeCast";
import {
  ADIT,
  CAVITIES,
  CLEAT_DA,
  DEPTH,
  DURATION as PLAN_DURATION,
  FPS as PLAN_FPS,
  N_CLEATS,
  N_STAGES,
  OUTER_WALL,
  R,
  RC,
  RIN,
  SUMP_Y,
  TREADERS,
  TREAD_Z,
  U,
  WZ0,
  WZ1,
  ZB,
  beamOf,
  camAt,
  chamberOf,
  cleatPhase,
  footAt,
  inward,
  launderOf,
  rimPoint,
  side,
  tankOf,
  wheelAngle,
  wheelC,
  DRIFT,
  FIG,
  TREAD_CYCLE,
  TREAD_RAIL,
  TREAD_RAIL_FAR,
  treaderAt,
} from "./mineDrainagePlan";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// TONES
// ---------------------------------------------------------------------------
const ROCK = "#4A3D2E"; // the cut face of the rock (the section)
const BACK = "#30271C"; // the chambers' back walls
const LIT_FACE = "#4E412F"; // floors and right-hand walls (turned to the light)
const MID_FACE = "#3B3025";
const DARK_FACE = "#2A2219"; // ceilings and left-hand walls
const TIMBER: VolInk = { lit: "#9C8664", mid: "#776448", dark: "#4A3E2F" };
const WHEEL_INK: VolInk = { lit: ACCENT, mid: ACCENT_DEEP, dark: "#9A5C07" };
const IRON = "#2A2420";
const LIGHT: P2 = [-0.55, -0.83]; // toward the light (upper left)

const P = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(P).join("L")}Z`;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
/** a stroke that thins less than the zoom (world units for ~base px at k 1) */
const sw = (k: number, base: number) => base / Math.pow(k, 0.6);

// ---------------------------------------------------------------------------
// THE CAVITIES: boundary segments of the union of the cut rects (static)
// ---------------------------------------------------------------------------
type Seg = { kind: "ceil" | "floor" | "lwall" | "rwall"; a: number; b: number; at: number };
const subtract = (a: number, b: number, cuts: [number, number][]) => {
  let parts: [number, number][] = [[a, b]];
  for (const [c0, c1] of cuts) {
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (c1 <= p0 || c0 >= p1) next.push([p0, p1]);
      else {
        if (c0 > p0) next.push([p0, c0]);
        if (c1 < p1) next.push([c1, p1]);
      }
    }
    parts = next;
  }
  return parts.filter(([p0, p1]) => p1 - p0 > 0.5);
};
const SEGS: Seg[] = (() => {
  const out: Seg[] = [];
  CAVITIES.forEach((A, i) => {
    const others = CAVITIES.filter((_, j) => j !== i);
    const push = (kind: Seg["kind"], at: number, a: number, b: number, cuts: [number, number][]) => subtract(a, b, cuts).forEach(([p0, p1]) => out.push({ kind, at, a: p0, b: p1 }));
    push("ceil", A.y0, A.x0, A.x1, others.filter((B) => B.y0 < A.y0 - 0.1 && B.y1 >= A.y0).map((B) => [B.x0, B.x1]));
    push("floor", A.y1, A.x0, A.x1, others.filter((B) => B.y0 <= A.y1 && B.y1 > A.y1 + 0.1).map((B) => [B.x0, B.x1]));
    push("lwall", A.x0, A.y0, A.y1, others.filter((B) => B.x0 < A.x0 - 0.1 && B.x1 >= A.x0).map((B) => [B.y0, B.y1]));
    push("rwall", A.x1, A.y0, A.y1, others.filter((B) => B.x0 <= A.x1 && B.x1 > A.x1 + 0.1).map((B) => [B.y0, B.y1]));
  });
  return out;
})();
const segEnds = (s: Seg): [P2, P2] => (s.kind === "ceil" || s.kind === "floor" ? [[s.a, s.at], [s.b, s.at]] : [[s.at, s.a], [s.at, s.b]]);

const BackWalls: React.FC<{ pp: Persp; k: number }> = ({ pp, k }) => {
  const r = pp.r(ZB);
  const vx = pp.vp[0];
  const vy = pp.vp[1];
  // rough chisel strokes on the back walls, in the back plane's own coordinates (they move with it)
  return (
    <g>
      {CAVITIES.map((c, i) => {
        const a = pp.p(c.x0, c.y0, ZB);
        const b = pp.p(c.x1, c.y1, ZB);
        return <rect key={i} x={a[0]} y={a[1]} width={b[0] - a[0]} height={b[1] - a[1]} fill={BACK} />;
      })}
      <g transform={`matrix(${r} 0 0 ${r} ${vx * (1 - r)} ${vy * (1 - r)})`}>
        <path d={CHISEL} fill="none" stroke={DARK} strokeWidth={sw(k, 1.3) / r} strokeOpacity={0.45} strokeLinecap="round" />
        <path d={CHISEL_LIT} fill="none" stroke={INK} strokeWidth={sw(k, 0.9) / r} strokeOpacity={0.07} strokeLinecap="round" />
      </g>
    </g>
  );
};
// short slanted pick marks scattered over every cavity's back wall (static, world space of the back plane)
const CHISEL = (() => {
  let d = "";
  CAVITIES.forEach((c, ci) => {
    const area = Math.max(0, Math.min(c.x1, 4200) - Math.max(c.x0, -4200)) * (c.y1 - c.y0);
    const n = Math.min(260, Math.floor(area / 9000));
    for (let i = 0; i < n; i++) {
      const x = c.x0 + hash(i, 11 + ci) * (c.x1 - c.x0);
      const y = c.y0 + hash(i, 31 + ci) * (c.y1 - c.y0);
      const l = 14 + 22 * hash(i, 41 + ci);
      const ang = -0.5 + 0.35 * (hash(i, 51 + ci) - 0.5);
      d += `M${x.toFixed(1)},${y.toFixed(1)}l${(Math.cos(ang) * l).toFixed(1)},${(Math.sin(ang) * l).toFixed(1)}`;
    }
  });
  return d;
})();
const CHISEL_LIT = (() => {
  let d = "";
  CAVITIES.forEach((c, ci) => {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const x = c.x0 + hash(i, 71 + ci) * (c.x1 - c.x0);
      const y = c.y0 + hash(i, 81 + ci) * (c.y1 - c.y0);
      d += `M${x.toFixed(1)},${y.toFixed(1)}l${(10 + 12 * hash(i, 91 + ci)).toFixed(1)},-4`;
    }
  });
  return d;
})();

/** the chambers' side faces (ceilings, floors, walls) seen from the eye, far from the VP first */
const SideFaces: React.FC<{ pp: Persp; k: number }> = ({ pp, k }) => {
  const [ex, ey] = pp.vp;
  const vis = SEGS.filter((s) => (s.kind === "ceil" ? ey > s.at : s.kind === "floor" ? ey < s.at : s.kind === "lwall" ? ex > s.at : ex < s.at));
  const dist = (s: Seg) => {
    const [a, b] = segEnds(s);
    // the nearest point of the segment to the VP
    const t = c01(((ex - a[0]) * (b[0] - a[0]) + (ey - a[1]) * (b[1] - a[1])) / Math.max(1e-6, (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2));
    return Math.hypot(a[0] + t * (b[0] - a[0]) - ex, a[1] + t * (b[1] - a[1]) - ey);
  };
  const sorted = vis.map((s) => ({ s, d: dist(s) })).sort((u, v) => v.d - u.d);
  return (
    <g>
      {sorted.map(({ s }, i) => {
        const [a, b] = segEnds(s);
        const q = [pp.p(a[0], a[1], 0), pp.p(b[0], b[1], 0), pp.p(b[0], b[1], ZB), pp.p(a[0], a[1], ZB)];
        const fill = s.kind === "floor" ? LIT_FACE : s.kind === "rwall" ? MID_FACE : DARK_FACE;
        // depth strokes (chisel runs toward the VP) every ~70 units along the face
        let d = "";
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const m = Math.floor(len / 70);
        for (let j = 1; j < m; j++) {
          const t = (j + 0.4 * (hash(j, i + 3) - 0.5)) / m;
          const x = a[0] + (b[0] - a[0]) * t;
          const y = a[1] + (b[1] - a[1]) * t;
          const z0 = 40 + 120 * hash(j, i + 7);
          d += `M${P(pp.p(x, y, z0))}L${P(pp.p(x, y, z0 + 140 + 160 * hash(j, i + 9)))}`;
        }
        return (
          <g key={i}>
            <path d={poly(q)} fill={fill} stroke={fill} strokeWidth={0.8} />
            {d ? <path d={d} fill="none" stroke={DARK} strokeWidth={sw(k, 1.1)} strokeOpacity={0.4} /> : null}
            {/* the far corner line where the face meets the back wall */}
            <path d={`M${P(q[2])}L${P(q[3])}`} stroke={DARK} strokeWidth={sw(k, 1.4)} strokeOpacity={0.4} />
          </g>
        );
      })}
    </g>
  );
};

// the lip: a jagged line just inside every cut edge (static, world space); its fill is rock, its line the cut edge
const LIP = (() => {
  let fill = "";
  let line = "";
  let lit = "";
  SEGS.forEach((s, si) => {
    const [a, b] = segEnds(s);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    const into: P2 = s.kind === "ceil" ? [0, 1] : s.kind === "floor" ? [0, -1] : s.kind === "lwall" ? [1, 0] : [-1, 0];
    const m = Math.max(2, Math.round(len / 24));
    const pts: P2[] = [];
    for (let i = 0; i <= m; i++) {
      const t = i / m;
      const end = Math.min(1, Math.min(t, 1 - t) * len / 30);
      const dd = (3 + 15 * hash(i, si * 3 + 7) * hash(i + 1, si)) * end;
      const jt = i > 0 && i < m ? (hash(i, si + 5) - 0.5) * 10 : 0;
      pts.push([a[0] + ux * (t * len + jt) + into[0] * dd, a[1] + uy * (t * len + jt) + into[1] * dd]);
    }
    fill += `M${P(a)}L${pts.map(P).join("L")}L${P(b)}Z`;
    const pl = `M${pts.map(P).join("L")}`;
    line += pl;
    if (s.kind === "floor" || s.kind === "rwall") {
      lit += `M${pts.map((q) => P([q[0] + into[0] * 2.4, q[1] + into[1] * 2.4])).join("L")}`;
    }
  });
  return { fill, line, lit };
})();
const LIP_FILL = LIP.fill;
const LIP_LINE = LIP.line;
const LIP_LIT = LIP.lit;

/** the cut rock (the section plane): everything but the cavities, hatched, with the cut edges */
const FrontRock: React.FC<{ pp: Persp; k: number; uid: string }> = ({ pp, k, uid }) => {
  const cx = pp.cam.cx;
  const cy = pp.cam.cy;
  const W = 1100 / k;
  const H = 1100 / k;
  const gap = 15;
  return (
    <g>
      <defs>
        <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x={cx - W} y={cy - H * 1.9} width={2 * W} height={3.8 * H}>
          <rect x={cx - W} y={cy - H * 1.9} width={2 * W} height={3.8 * H} fill="#fff" />
          {CAVITIES.map((c, i) => (
            <rect key={i} x={c.x0} y={c.y0} width={c.x1 - c.x0} height={c.y1 - c.y0} fill="#000" />
          ))}
        </mask>
        <pattern id={`${uid}-h`} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={gap} stroke={DARK} strokeWidth={sw(k, 1.05)} strokeOpacity={0.5} />
        </pattern>
      </defs>
      <g mask={`url(#${uid}-m)`}>
        <rect x={cx - W} y={cy - H * 1.9} width={2 * W} height={3.8 * H} fill={ROCK} opacity={0.82} />
        <rect x={cx - W} y={cy - H * 1.9} width={2 * W} height={3.8 * H} fill={`url(#${uid}-h)`} />
        <path d={STRATA} fill="none" stroke={DARK} strokeWidth={sw(k, 1.6)} strokeOpacity={0.55} strokeLinecap="round" />
        <path d={STRATA_LIT} fill="none" stroke={INK} strokeWidth={sw(k, 1.0)} strokeOpacity={0.16} strokeLinecap="round" />
      </g>
      {/* the rough lip of the cut (rock teeth into the openings) and the cut edges: dark all round, a cream lit line
          on the edges facing up and left */}
      <path d={LIP_FILL} fill={ROCK} />
      <path d={LIP_FILL} fill={`url(#${uid}-h)`} />
      <path d={LIP_LINE} fill="none" stroke={DARK} strokeWidth={sw(k, 3)} strokeLinejoin="round" />
      <path d={LIP_LIT} fill="none" stroke={INK} strokeWidth={sw(k, 1.2)} strokeOpacity={0.45} strokeLinejoin="round" />
    </g>
  );
};
// rock strata in the section: long wavy lines across the rock, broken (static, world space)
const STRATA = (() => {
  let d = "";
  for (let i = 0; i < 70; i++) {
    const y = -4600 + i * 82 + 30 * hash(i, 3);
    let x = -2600 + 400 * hash(i, 5);
    while (x < 2600) {
      const l = 120 + 260 * hash(Math.floor(x), i + 7);
      const yy = y + 18 * Math.sin(x / 300 + i);
      d += `M${x.toFixed(0)},${yy.toFixed(0)}q${(l / 2).toFixed(0)},${(14 * (hash(i, Math.floor(x)) - 0.5)).toFixed(0)} ${l.toFixed(0)},${(10 * (hash(Math.floor(x), i) - 0.5)).toFixed(0)}`;
      x += l + 60 + 200 * hash(i, Math.floor(x) + 1);
    }
  }
  return d;
})();
const STRATA_LIT = (() => {
  let d = "";
  for (let i = 0; i < 160; i++) {
    const x = -2600 + 5200 * hash(i, 13);
    const y = -4600 + 5600 * hash(i, 17);
    d += `M${x.toFixed(0)},${y.toFixed(0)}l${(20 + 30 * hash(i, 19)).toFixed(0)},${(-6 * hash(i, 23)).toFixed(0)}`;
  }
  return d;
})();

// ---------------------------------------------------------------------------
// WATER
// ---------------------------------------------------------------------------
/** a horizontal water surface (x0..x1, at y, z0..z1) with drifting glints */
const WaterSurface: React.FC<{ pp: Persp; k: number; x0: number; x1: number; y: number; z0: number; z1: number; f: number; seed: number; flow?: number }> = ({ pp, k, x0, x1, y, z0, z1, f, seed, flow = 0.6 }) => {
  if (pp.vp[1] >= y) return null; // seen from below: hidden
  const q = [pp.p(x0, y, z0), pp.p(x1, y, z0), pp.p(x1, y, z1), pp.p(x0, y, z1)];
  let d = "";
  const n = Math.max(4, Math.floor((Math.min(x1, 2600) - Math.max(x0, -2600)) / 40));
  for (let i = 0; i < n; i++) {
    const zz = z0 + (z1 - z0) * (0.12 + 0.76 * hash(i, seed));
    const span = x1 - x0;
    const xx = x0 + ((hash(i, seed + 1) * span + f * flow * (0.6 + 0.8 * hash(i, seed + 2))) % span);
    const l = 10 + 18 * hash(i, seed + 3);
    if (xx + l > x1) continue;
    d += `M${P(pp.p(xx, y, zz))}L${P(pp.p(xx + l, y, zz))}`;
  }
  return (
    <g>
      <path d={poly(q)} fill={SEA} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <path d={d} stroke={INK} strokeWidth={sw(k, 1.5)} strokeOpacity={0.55} strokeLinecap="round" />
    </g>
  );
};

/** a falling stream from a to b (3D, falling in Y), with glints running down it */
const Stream: React.FC<{ pp: Persp; k: number; a: [number, number, number]; b: [number, number, number]; w: number; f: number; seed: number }> = ({ pp, k, a, b, w, f, seed }) => {
  const steps = 8;
  const L: P2[] = [];
  const Rr: P2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // a short throw outward then down (gravity): x eases out, y quadratic
    const x = a[0] + (b[0] - a[0]) * Math.sqrt(t);
    const y = a[1] + (b[1] - a[1]) * t;
    const zz = a[2] + (b[2] - a[2]) * t;
    const ww = w * (1 - 0.35 * t);
    L.push(pp.p(x - ww / 2, y, zz));
    Rr.push(pp.p(x + ww / 2, y, zz));
  }
  const d = `M${L.map(P).join("L")}L${Rr.reverse().map(P).join("L")}Z`;
  // glints: short dashes moving down
  let g = "";
  for (let j = 0; j < 3; j++) {
    const t = ((f * 0.09 + j / 3 + hash(j, seed)) % 1) * 0.85;
    const x = a[0] + (b[0] - a[0]) * Math.sqrt(t) + (hash(j, seed + 1) - 0.5) * w * 0.4;
    const y = a[1] + (b[1] - a[1]) * t;
    const zz = a[2] + (b[2] - a[2]) * t;
    g += `M${P(pp.p(x, y, zz))}L${P(pp.p(x, y + 12, zz))}`;
  }
  return (
    <g>
      <path d={d} fill={SEA} stroke={DARK} strokeWidth={sw(k, 1)} />
      <path d={g} stroke={INK} strokeWidth={sw(k, 1.4)} strokeOpacity={0.6} strokeLinecap="round" />
    </g>
  );
};

/** stage n's launder: a sloping timber channel behind its wheel, drawn open-fronted (cut away) so its water shows
 *  from any eye height, flowing inward along it */
const Launder: React.FC<{ pp: Persp; k: number; n: number; f: number }> = ({ pp, k, n, f }) => {
  const L = launderOf(n);
  const yAt = (x: number) => L.ya + ((x - L.xa) / (L.xb - L.xa)) * (L.yb - L.ya);
  const xa = L.xa;
  const xb = L.xb;
  const above = pp.vp[1] < Math.min(L.ya, L.yb);
  const z = L.z0;
  const wl = 7; // the water line below the launder's top
  const body = [pp.p(xa, L.ya + wl, z), pp.p(xb, L.yb + wl, z), pp.p(xb, L.yb + L.depth, z), pp.p(xa, L.ya + L.depth, z)];
  const plank = [pp.p(xa, L.ya + L.depth - 9, z), pp.p(xb, L.yb + L.depth - 9, z), pp.p(xb, L.yb + L.depth, z), pp.p(xa, L.ya + L.depth, z)];
  const under = [pp.p(xa, L.ya + L.depth, L.z0), pp.p(xb, L.yb + L.depth, L.z0), pp.p(xb, L.yb + L.depth, L.z1), pp.p(xa, L.ya + L.depth, L.z1)];
  const surf = [pp.p(xa, L.ya + wl, L.z0), pp.p(xb, L.yb + wl, L.z0), pp.p(xb, L.yb + wl, L.z1), pp.p(xa, L.ya + wl, L.z1)];
  const backWall = [pp.p(xa, L.ya, L.z1), pp.p(xb, L.yb, L.z1), pp.p(xb, L.yb + wl, L.z1), pp.p(xa, L.ya + wl, L.z1)];
  // flowing glints (inward: from xa toward xb), on the surface and in the body
  let g = "";
  const len = Math.abs(xb - xa);
  const dir = Math.sign(xb - xa);
  const span = Math.min(len, 3200);
  const nG = Math.floor(span / 46);
  for (let i = 0; i < nG; i++) {
    const s0 = (hash(i, n * 7 + 1) * span + f * 7.5) % span;
    const x = xa + dir * s0;
    const l = 14 + 16 * hash(i, n * 7 + 3);
    const yy = wl + 3 + (L.depth - wl - 14) * hash(i, n * 7 + 2) * 0.8;
    g += `M${P(pp.p(x, yAt(x) + yy, z))}L${P(pp.p(x + dir * l, yAt(x + dir * l) + yy, z))}`;
  }
  return (
    <g>
      {above ? (
        <>
          <path d={poly(backWall)} fill={TIMBER.dark} />
          <path d={poly(surf)} fill={SEA} />
        </>
      ) : (
        <path d={poly(under)} fill={TIMBER.dark} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      )}
      <path d={poly(body)} fill={SEA} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <path d={poly(plank)} fill={TIMBER.mid} stroke={DARK} strokeWidth={sw(k, 1)} />
      <path d={`M${P(body[0])}L${P(body[1])}`} stroke={INK} strokeWidth={sw(k, 1.3)} strokeOpacity={0.5} />
      <path d={g} stroke={INK} strokeWidth={sw(k, 1.5)} strokeOpacity={0.6} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WHEEL (orange: the machine). Back annulus, the inner surface of the rim (seen on the far side of the VP),
// spokes, hub, the outer surface (on the VP's side) with its cleats, the front annulus with the compartments; the
// compartments on the rising (outer) side carry water.
// ---------------------------------------------------------------------------
const N_CELLS = 24;
const N_SPOKES = 8;
const shadeOf = (nx: number, ny: number) => nx * LIGHT[0] + ny * LIGHT[1];
const tone3 = (v: number, ink: VolInk) => (v > 0.3 ? ink.lit : v > -0.35 ? ink.mid : ink.dark);

const Wheel: React.FC<{ pp: Persp; k: number; n: number; f: number }> = ({ pp, k, n, f }) => {
  const [xc, yc] = wheelC(n);
  const th = wheelAngle(n, f);
  const V: P2 = [pp.vp[0], pp.vp[1]];
  const vdx = V[0] - xc;
  const vdy = V[1] - yc;
  const ring = (rad: number, Z: number) => {
    const c = pp.p(xc, yc, Z);
    return { c, r: rad * pp.r(Z) };
  };
  const annulus = (ro: number, ri: number, Z: number) => {
    const o = ring(ro, Z);
    const i = ring(ri, Z);
    return `M${o.c[0] + o.r},${o.c[1]}a${o.r},${o.r} 0 1 0 ${-2 * o.r},0a${o.r},${o.r} 0 1 0 ${2 * o.r},0ZM${i.c[0] + i.r},${i.c[1]}a${i.r},${i.r} 0 1 1 ${-2 * i.r},0a${i.r},${i.r} 0 1 1 ${2 * i.r},0Z`;
  };
  const pt = (rad: number, a: number, Z: number) => pp.p(xc + rad * Math.cos(a), yc + rad * Math.sin(a), Z);
  const NB = 96;
  const bandOuter: React.ReactNode[] = [];
  const bandInner: React.ReactNode[] = [];
  for (let i = 0; i < NB; i++) {
    const a0 = (i / NB) * 2 * Math.PI;
    const a1 = ((i + 1) / NB) * 2 * Math.PI;
    const am = (a0 + a1) / 2;
    const nx = Math.cos(am);
    const ny = Math.sin(am);
    const dot = vdx * nx + vdy * ny;
    if (dot > R) {
      const fill = tone3(shadeOf(nx, ny), WHEEL_INK);
      bandOuter.push(<path key={i} d={poly([pt(R, a0, WZ0), pt(R, a1, WZ0), pt(R, a1, WZ1), pt(R, a0, WZ1)])} fill={fill} stroke={fill} strokeWidth={0.6} />);
    }
    if (dot < RIN) {
      const fill = tone3(-shadeOf(nx, ny), { lit: ACCENT_DEEP, mid: "#B8730A", dark: "#7E4B06" });
      bandInner.push(<path key={i} d={poly([pt(RIN, a0, WZ0), pt(RIN, a1, WZ0), pt(RIN, a1, WZ1), pt(RIN, a0, WZ1)])} fill={fill} stroke={fill} strokeWidth={0.6} />);
    }
  }
  // cleats: slats across the outer surface (on the visible band) and their ends standing proud on the silhouette
  const cp = cleatPhase(n) + th;
  let cleatEnds = "";
  let cleatSlats = "";
  for (let j = 0; j < N_CLEATS; j++) {
    const a = cp + j * CLEAT_DA;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const tx = -ny;
    const ty = nx;
    const hw = 0.035 * U;
    const q: P2[] = [
      pp.p(xc + R * nx - hw * tx, yc + R * ny - hw * ty, WZ0),
      pp.p(xc + RC * nx - hw * tx, yc + RC * ny - hw * ty, WZ0),
      pp.p(xc + RC * nx + hw * tx, yc + RC * ny + hw * ty, WZ0),
      pp.p(xc + R * nx + hw * tx, yc + R * ny + hw * ty, WZ0),
    ];
    cleatEnds += poly(q);
    if (vdx * nx + vdy * ny > R) cleatSlats += `M${P(pp.p(xc + RC * nx, yc + RC * ny, WZ0))}L${P(pp.p(xc + RC * nx, yc + RC * ny, WZ1))}`;
  }
  // spokes
  const spokes: React.ReactNode[] = [];
  for (let j = 0; j < N_SPOKES; j++) {
    const a = th + (j / N_SPOKES) * 2 * Math.PI + 0.2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const px = -uy;
    const py = ux;
    const hw = 0.075 * U;
    const r0 = 0.3 * U;
    const r1 = RIN + 4;
    const za = 166;
    const zb = 198;
    const corner = (rr: number, s: number, Z: number) => pp.p(xc + rr * ux + s * hw * px, yc + rr * uy + s * hw * py, Z);
    const mx = xc + ((r0 + r1) / 2) * ux;
    const my = yc + ((r0 + r1) / 2) * uy;
    const sideS = (V[0] - mx) * px + (V[1] - my) * py > 0 ? 1 : -1;
    const sideFill = tone3(shadeOf(sideS * px, sideS * py), WHEEL_INK);
    spokes.push(
      <g key={j}>
        <path d={poly([corner(r0, sideS, za), corner(r1, sideS, za), corner(r1, sideS, zb), corner(r0, sideS, zb)])} fill={sideFill === ACCENT ? ACCENT_DEEP : "#8E5506"} stroke={DARK} strokeWidth={sw(k, 1)} />
        <path d={poly([corner(r0, -1, za), corner(r1, -1, za), corner(r1, 1, za), corner(r0, 1, za)])} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={sw(k, 1.3)} />
        <path d={`M${P(corner(r0 + 6, -0.55, za))}L${P(corner(r1 - 6, -0.55, za))}`} stroke={ACCENT} strokeWidth={sw(k, 1.6)} strokeOpacity={0.8} />
      </g>,
    );
  }
  // hub: a short drum along Z
  const hubF = ring(0.32 * U, 140);
  const hubB = ring(0.32 * U, 224);
  const hull = (A: { c: P2; r: number }, B: { c: P2; r: number }) => {
    const dx = B.c[0] - A.c[0];
    const dy = B.c[1] - A.c[1];
    const l = Math.hypot(dx, dy) || 1;
    const qx = -dy / l;
    const qy = dx / l;
    return poly([
      [A.c[0] + A.r * qx, A.c[1] + A.r * qy],
      [B.c[0] + B.r * qx, B.c[1] + B.r * qy],
      [B.c[0] - B.r * qx, B.c[1] - B.r * qy],
      [A.c[0] - A.r * qx, A.c[1] - A.r * qy],
    ]);
  };
  // the compartments: radial walls on the front annulus; water in those on the rising (outer) side
  const s = side(n);
  const cells: React.ReactNode[] = [];
  let walls = "";
  for (let j = 0; j < N_CELLS; j++) {
    const a0 = th + (j / N_CELLS) * 2 * Math.PI;
    const a1 = th + ((j + 1) / N_CELLS) * 2 * Math.PI;
    walls += `M${P(pt(RIN, a0, WZ0))}L${P(pt(R, a0, WZ0))}`;
    const am = (a0 + a1) / 2;
    // gamma: from the top toward the outer side (+), the inner side (-)
    const g = (Math.atan2(s * Math.cos(am), -Math.sin(am)) * 180) / Math.PI;
    // loaded as it leaves the water at the bottom, full up the outer side, emptying just past the top (g 5 .. -25)
    const fill = g >= -25 ? Math.min(1, (g + 25) / 30) * c01((180 - g) / 12) : 0;
    if (fill > 0.02) {
      const rw = RIN + (R - RIN) * 0.6 * fill;
      const q: P2[] = [];
      const m = 4;
      for (let i = 0; i <= m; i++) q.push(pt(RIN + 3, a0 + ((a1 - a0) * i) / m + 0.004, WZ0));
      for (let i = m; i >= 0; i--) q.push(pt(rw, a0 + ((a1 - a0) * i) / m + 0.004, WZ0));
      cells.push(<path key={j} d={poly(q)} fill={SEA} />);
      cells.push(<path key={`g${j}`} d={`M${P(pt(rw - 6, a0 + (a1 - a0) * 0.3, WZ0))}L${P(pt(rw - 6, a0 + (a1 - a0) * 0.62, WZ0))}`} stroke={INK} strokeWidth={sw(k, 1.3)} strokeOpacity={0.55} />);
    }
  }
  return (
    <g>
      <path d={annulus(R, RIN, WZ1)} fill="#8E5506" fillRule="evenodd" stroke={DARK} strokeWidth={sw(k, 1.4)} />
      {bandInner}
      {spokes}
      <path d={hull(hubB, hubF)} fill="#B8730A" stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <circle cx={hubF.c[0]} cy={hubF.c[1]} r={hubF.r} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={sw(k, 1.6)} />
      <circle cx={hubF.c[0] - hubF.r * 0.25} cy={hubF.c[1] - hubF.r * 0.25} r={hubF.r * 0.45} fill={ACCENT} opacity={0.7} />
      {bandOuter}
      <path d={cleatSlats} stroke="#8E5506" strokeWidth={sw(k, 2.6)} strokeLinecap="butt" />
      <path d={annulus(R, RIN, WZ0)} fill={ACCENT} fillRule="evenodd" stroke={DARK} strokeWidth={sw(k, 2)} />
      {cells}
      <path d={walls} stroke={DARK} strokeWidth={sw(k, 1.3)} strokeOpacity={0.75} />
      {/* the shaded lower-right of the rim face (form, light from the upper left) */}
      <path d={annulus(R, RIN, WZ0)} fill="none" stroke="#B8730A" strokeWidth={sw(k, 1.2)} strokeOpacity={0} />
      <path d={cleatEnds} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={sw(k, 0.9)} />
    </g>
  );
};

/** the front bearing on its post (timber), the axle's iron end in it */
const Bearing: React.FC<{ pp: Persp; k: number; n: number }> = ({ pp, k, n }) => {
  const [xc, yc] = wheelC(n);
  const floor = chamberOf(n).y1;
  const ax = pp.p(xc, yc, 52);
  const axR = 0.13 * U * pp.r(52);
  const stub0 = pp.p(xc, yc, 140);
  const stubR0 = 0.13 * U * pp.r(140);
  const dx = stub0[0] - ax[0];
  const dy = stub0[1] - ax[1];
  const l = Math.hypot(dx, dy) || 1;
  const qx = -dy / l;
  const qy = dx / l;
  return (
    <g>
      <path d={poly([[ax[0] + axR * qx, ax[1] + axR * qy], [stub0[0] + stubR0 * qx, stub0[1] + stubR0 * qy], [stub0[0] - stubR0 * qx, stub0[1] - stubR0 * qy], [ax[0] - axR * qx, ax[1] - axR * qy]])} fill={IRON} stroke={DARK} strokeWidth={sw(k, 1)} />
      <Box P={pp} X0={xc - 0.11 * U} X1={xc + 0.11 * U} Y0={yc + 0.3 * U} Y1={floor} Z0={60} Z1={96} ink={TIMBER} uid={`post${n}`} />
      <Box P={pp} X0={xc - 0.26 * U} X1={xc + 0.26 * U} Y0={yc - 0.16 * U} Y1={yc + 0.3 * U} Z0={52} Z1={100} ink={TIMBER} uid={`brg${n}`} />
      <circle cx={ax[0]} cy={ax[1]} r={axR} fill={IRON} stroke={DARK} strokeWidth={sw(k, 1.4)} />
      <circle cx={ax[0] - axR * 0.3} cy={ax[1] - axR * 0.3} r={axR * 0.35} fill="#6B5E50" />
    </g>
  );
};

/** an oil lamp in a niche of the back wall (cream flame, no glow) */
const Lamp: React.FC<{ pp: Persp; k: number; n: number; f: number }> = ({ pp, k, n, f }) => {
  const s = side(n);
  const [, yc] = wheelC(n);
  const X = s * (OUTER_WALL - 0.55 * U);
  const Y = yc - 3.0 * U;
  const r = pp.r(ZB);
  const c = pp.p(X, Y, ZB);
  const w = 0.6 * U * r;
  const h = 0.56 * U * r;
  const fl = 1 + 0.12 * Math.sin(f * 0.9 + n * 2) + 0.08 * Math.sin(f * 2.3 + n);
  const lean = 0.15 * Math.sin(f * 0.7 + n * 3);
  const L = 0.085 * U * r;
  // the lamp's light on the rock round the niche: a flat lighter patch (no glow)
  const patch: P2[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 2 * Math.PI;
    const rr = (0.95 + 0.25 * hash(i, n + 61)) * w;
    patch.push([c[0] + rr * Math.cos(a) * 1.1, c[1] + rr * Math.sin(a) * 0.9]);
  }
  return (
    <g>
      <path d={poly(patch)} fill="#4A3C2C" />
      <path d={`M${c[0] - w / 2},${c[1] + h / 2}L${c[0] - w / 2},${c[1] - h * 0.1}Q${c[0]},${c[1] - h * 0.75} ${c[0] + w / 2},${c[1] - h * 0.1}L${c[0] + w / 2},${c[1] + h / 2}Z`} fill={DARK_FACE} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <path d={`M${c[0] - w / 2 + 2},${c[1] + h / 2}L${c[0] + w / 2 - 2},${c[1] + h / 2}`} stroke={INK} strokeOpacity={0.35} strokeWidth={sw(k, 1)} />
      {/* the lamp: a clay body with its nozzle */}
      <ellipse cx={c[0] - L * 0.6} cy={c[1] + h / 2 - L * 0.9} rx={L * 2} ry={L} fill={TIMBER.mid} stroke={DARK} strokeWidth={sw(k, 1)} />
      <path d={`M${c[0] + L},${c[1] + h / 2 - L * 1.3}l${L * 1.4},${-L * 0.4}l0,${L * 0.8}Z`} fill={TIMBER.mid} stroke={DARK} strokeWidth={sw(k, 0.8)} />
      <path
        d={`M${c[0] + L * 2.2},${c[1] + h / 2 - L * 1.6}q${-L * 0.9},${-L * 1.6 * fl} ${L * lean * 2},${-L * 3.6 * fl}q${L * 1.0},${L * 1.9 * fl} ${-L * lean * 2},${L * 3.6 * fl}Z`}
        fill={INK}
        stroke={DARK}
        strokeWidth={sw(k, 0.7)}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TREADER: romeCast's Slave (loincloth, fettered) in POSES.tread, facing up the rim toward his wheel's top. The
// cast's tread body is kept; his feet are replaced by the cleats they stand on (footAt: the planted foot rides its
// cleat down the rim, the other swings up to the next cleat but one) and his fists grip the handrail exactly (grip).
// ---------------------------------------------------------------------------
const TREAD_VARIANTS = [0, 1, 2, 4, 1, 0];
const treaderPose = (n: number, f: number): { pose: FigPose; at: P2 } => {
  const T = TREADERS[n];
  const dir = side(n); // he faces toward his wheel's top = outward
  const at = treaderAt(n);
  const loc = (w: P2): P2 => [(dir * (w[0] - at[0])) / FIG, (w[1] - at[1]) / FIG];
  const phase = (f + T.off * TREAD_CYCLE) / TREAD_CYCLE;
  const base = RomePoses.tread(1, phase); // facing right; turned below
  const A = footAt(n, f, 0);
  const B = footAt(n, f, 1);
  const q: FigPose = {
    ...base,
    lean: base.lean + T.lean - 15,
    crouch: base.crouch - 9 + (T.crouch - 17) * 0.5,
    footL: loc(rimPoint(n, A.d, A.lift)),
    footR: loc(rimPoint(n, B.d, B.lift)),
  };
  return { pose: dir === 1 ? q : mirrorPose(q), at };
};

const Treader: React.FC<{ pp: Persp; n: number; f: number }> = ({ pp, n, f }) => {
  const { pose, at } = treaderPose(n, f);
  const dir = side(n);
  const bm = beamOf(n);
  // his feet's place is a 3D point (X, Y) on the plane Z = TREAD_Z; the grips on the beam in the same plane
  const p2 = pp.p(at[0], at[1], TREAD_Z);
  const gNear = pp.p(at[0] + dir * TREAD_RAIL[0] * FIG, bm.y, TREAD_Z);
  const gFar = pp.p(at[0] + dir * TREAD_RAIL_FAR[0] * FIG, bm.y - 4, TREAD_Z);
  // facing right his armL is the near arm; facing left (mirrored) armR is
  const grip = dir === 1 ? { L: gNear, R: gFar } : { R: gNear, L: gFar };
  return <Slave pose={pose} at={p2} scale={pp.r(TREAD_Z) * FIG} uid={`tr${n}`} variant={TREAD_VARIANTS[n]} garb="loincloth" fetters shade={1} grip={grip} />;
};

/** the handrail beam across the chamber */
const Beam: React.FC<{ pp: Persp; n: number }> = ({ pp, n }) => {
  const b = beamOf(n);
  return <Box P={pp} X0={b.x0} X1={b.x1} Y0={b.y - b.h / 2} Y1={b.y + b.h / 2} Z0={b.z0} Z1={b.z1} ink={TIMBER} uid={`beam${n}`} />;
};

// ---------------------------------------------------------------------------
// THE TANK under stage n >= 1 (and the sump under stage 0)
// ---------------------------------------------------------------------------
const Tank: React.FC<{ pp: Persp; k: number; n: number; f: number }> = ({ pp, k, n, f }) => {
  const t = tankOf(n);
  return (
    <g>
      <Box P={pp} X0={t.x0} X1={t.x1} Y0={t.y0} Y1={t.y1} Z0={t.z0} Z1={t.z1} ink={TIMBER} uid={`tank${n}`} />
      <WaterSurface pp={pp} k={k} x0={t.x0 + 14} x1={t.x1 - 14} y={t.water} z0={t.z0 + 12} z1={t.z1 - 12} f={f} seed={n * 13 + 5} flow={0.5} />
    </g>
  );
};
/** the tank's front, cut away to show the water in it (drawn over the wheel dipping into it) */
const TankFront: React.FC<{ pp: Persp; k: number; n: number; f: number }> = ({ pp, k, n, f }) => {
  const t = tankOf(n);
  const z = t.z0;
  const a = pp.p(t.x0, t.water, z);
  const b = pp.p(t.x1, t.y1, z);
  const th = 0.06 * U * pp.r(z);
  let g = "";
  for (let i = 0; i < 6; i++) {
    const x = a[0] + (b[0] - a[0]) * ((hash(i, n + 40) + f * 0.004 * (hash(i, n + 41) - 0.5)) % 1);
    const y = a[1] + (b[1] - a[1]) * (0.2 + 0.6 * hash(i, n + 42));
    g += `M${x.toFixed(1)},${y.toFixed(1)}l${(10 * pp.r(z)).toFixed(1)},0`;
  }
  return (
    <g>
      <rect x={a[0]} y={a[1]} width={b[0] - a[0]} height={b[1] - a[1]} fill={SEA} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <path d={g} stroke={INK} strokeWidth={sw(k, 1.2)} strokeOpacity={0.4} strokeLinecap="round" />
      <path d={`M${a[0]},${a[1]}L${b[0]},${a[1]}`} stroke={INK} strokeWidth={sw(k, 1.4)} strokeOpacity={0.55} />
      <rect x={a[0]} y={b[1] - th} width={b[0] - a[0]} height={th} fill={TIMBER.mid} stroke={DARK} strokeWidth={sw(k, 1)} />
      <rect x={a[0]} y={a[1] - 0.07 * U * pp.r(z)} width={th} height={b[1] - a[1] + 0.07 * U * pp.r(z)} fill={TIMBER.lit} stroke={DARK} strokeWidth={sw(k, 1)} />
      <rect x={b[0] - th} y={a[1] - 0.07 * U * pp.r(z)} width={th} height={b[1] - a[1] + 0.07 * U * pp.r(z)} fill={TIMBER.dark} stroke={DARK} strokeWidth={sw(k, 1)} />
    </g>
  );
};

/** clip everything above a 3D horizontal line (y at depth Z) — a wheel or post dipping into water */
const clipAbove = (pp: Persp, y: number, Z: number) => {
  const a = pp.p(-6000, y, Z);
  const b = pp.p(6000, y, Z);
  return poly([[a[0], a[1]], [b[0], b[1]], [b[0], b[1] - 20000], [a[0], a[1] - 20000]]);
};

const MineDrainageWheels: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = swayCam(camAt(cf), cf);
  const k = cam.k;
  const pp = perspective(cam, { eyeY: cam.cy, dRef: DEPTH.dRef, kRef: DEPTH.kRef, dolly: DEPTH.dolly });
  const stages = Array.from({ length: N_STAGES }, (_, n) => n);
  const c0 = chamberOf(0);
  return (
    <TexcocoPage cam={cam} vignette={0.5}>
      <WorldSvg cam={cam}>
        <defs>
          {stages.map((n) => {
            const y = n === 0 ? SUMP_Y : tankOf(n).y0;
            return (
              <clipPath key={n} id={`wclip${n}`}>
                <path d={clipAbove(pp, y, n === 0 ? WZ0 : 96)} />
              </clipPath>
            );
          })}
          <clipPath id="postclip0">
            <path d={clipAbove(pp, SUMP_Y, 60)} />
          </clipPath>
        </defs>
        <BackWalls pp={pp} k={k} />
        {stages.map((n) => (
          <Lamp key={n} pp={pp} k={k} n={n} f={frame} />
        ))}
        <SideFaces pp={pp} k={k} />
        {/* the sump: the flooded bottom of the workings */}
        <WaterSurface pp={pp} k={k} x0={DRIFT.x0} x1={c0.x1} y={SUMP_Y} z0={0} z1={ZB} f={frame} seed={3} flow={0.35} />
        {/* the launders behind the wheels, the pours into them and the spills into the next tanks */}
        {stages.map((n) => (
          <Launder key={n} pp={pp} k={k} n={n} f={frame} />
        ))}
        {stages.slice(1).map((n) => (
          <Tank key={n} pp={pp} k={k} n={n} f={frame} />
        ))}
        {stages.slice(0, N_STAGES - 1).map((n) => {
          const L = launderOf(n);
          const t = tankOf(n + 1);
          const zm = (L.z0 + L.z1) / 2;
          return <Stream key={n} pp={pp} k={k} a={[L.xb, L.yb + 4, zm]} b={[L.xb + Math.sign(L.xb - L.xa) * 0.14 * U, t.water, (t.z0 + t.z1) / 2]} w={0.22 * U} f={frame + n * 5} seed={n * 3 + 1} />;
        })}
        {stages.map((n) => {
          // the pour from the emptying compartments just past the top, down into the launder behind
          const [xc, yc] = wheelC(n);
          const i = inward(n);
          const L = launderOf(n);
          const x0 = xc + i * 0.35 * U;
          return <Stream key={`p${n}`} pp={pp} k={k} a={[x0, yc - RIN + 6, 232]} b={[x0 + i * 0.25 * U, L.ya + 8, 270]} w={0.2 * U} f={frame + n * 3} seed={n * 5 + 2} />;
        })}
        {stages.map((n) => (
          <g key={n} clipPath={`url(#wclip${n})`}>
            <Wheel pp={pp} k={k} n={n} f={frame} />
          </g>
        ))}
        {stages.slice(1).map((n) => (
          <TankFront key={n} pp={pp} k={k} n={n} f={frame} />
        ))}
        {stages.map((n) => (
          <g key={n} clipPath={n === 0 ? "url(#postclip0)" : undefined}>
            <Bearing pp={pp} k={k} n={n} />
          </g>
        ))}
        {stages.map((n) => (
          <Beam key={n} pp={pp} n={n} />
        ))}
        {stages.map((n) => (
          <Treader key={n} pp={pp} n={n} f={frame} />
        ))}
        {/* the sump water in section (at the cut plane) */}
        <rect x={DRIFT.x0} y={SUMP_Y} width={c0.x1 - DRIFT.x0} height={c0.y1 - SUMP_Y} fill={SEA} />
        <path d={`M${DRIFT.x0},${SUMP_Y}L${c0.x1},${SUMP_Y}`} stroke={INK} strokeOpacity={0.45} strokeWidth={sw(k, 1.4)} />
        <FrontRock pp={pp} k={k} uid="rock" />
      </WorldSvg>
    </TexcocoPage>
  );
};

void ADIT;
void RC;
export default MineDrainageWheels;
