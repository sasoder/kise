import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { ALPHA, COLOR, EDGE, ElevationShadow, STROKE, StoutStage, bloomFilter, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, viewOf } from "../kits/cheeky-pint/museShared";
import { HopCone, HopConeLite, hopSilhouette, type HopTone } from "./guinnessShared";

// ---------------------------------------------------------------------------
// HundredsOfHops — cut 3 of 3 of the Cheeky Pint S4E02 clip "will - guinness invented the t-test" (Will
// O'Brien), in the stout system (stoutShared.tsx, palette B1) with the clip's HopCone (guinnessShared.tsx).
// 1080x1920, 23.976 fps, opaque. No text. Revision 1 (director): glass jars on a production line.
//
// CHECK LINE: "to check quality they had to pull hundreds of hops out of every batch, so every batch came up
// a few percent short."
//
// THE ONE MOTION: sampling eats the batch. A glass jar of packed amber hops stands at the sampling point,
// filled to the cream "full" line etched on its glass. ~148 hops lift off its top in one arcing stream up into
// a cream testing dish on a stand beside the line; the level visibly sinks below the full line and an amber
// bracket on the jar's side spans the gap; in the dish the tested hops turn spent (amber -> kraft, by tone).
// Then the line moves (right to left, one constant speed): the short jar travels out, the next full jar comes
// in from the right edge, stops under the sampling point and gives up the same top band to the same dish; then
// the third. Every jar ends the same 32 px (7.8 % of its 410 px fill) short of its line; one kraft pile.
//
// THE LINE (edited): "they were having to take up like hundreds of hops to see, quality batch or not? And they
// were losing, you know, a few percent per batch."
// WORD -> FRAME (from f0): they 4 · were 10 · having 14 · to 18 · take 21 · up 25 · like 30 · hundreds 33-43 ·
// of 43 · hops 50-55 · to 55 · see 59-67 · quality 72-82 · batch 82-92 · or 92 · not 96-100 · And 102 · they 106
// · were 115 · losing 118-125 · you know 126-142 · a 142 · few 143 · percent 147-154 · per 154 · batch 162-172 ·
// out (cut back to the speaker) 176.
// DURATION: sequence 35.452 -> 42.793 s = 7.341 s = round(7.341 x 23.976) = 176 frames, + a 16-frame living tail
// = 192.
//
//   f 0-4      jar 1 + the whole dish (k 1.5), the camera already easing back to the medium framing (k 1 by f 50)
//   f 4-46     ~148 hops lift off jar 1's top (highest level first, the side nearest the dish first), ease into a
//              constant-speed arc into the dish beside it (18 f flights; landings f 22-64); the level sinks two
//              layers (32 px) below the etched full line, the amber I-bracket growing with it
//   f 44-120   THE TEST ("to see, quality batch or not?"): a cream magnifying glass (Lucide "search") comes in off
//              the right edge, makes one slow pass right-to-left across the pile (f 72-90) and leaves up and away;
//              each hop it passes over turns spent (amber -> light kraft, 12 f): the lens causes the change
//   f 92-116   the line moves 820 px (6 f ramps, 45 px/f): jar 1 out left, jar 2 in from the right edge to the
//              sampling point (jars rest only at 0 / 620 / -620 / -820, never at the dish's pole, x 270)
//   f 117-129  jar 2 gives up the same ~148 (11 f flights), each turning spent on landing
//   f 130-150  the line moves 620 px: jar 2 out, jar 3 in
//   f 151-163  jar 3 gives up its ~148 (10 f flights, landings by f 173)
//   f 138-192  "... a few percent per batch": the camera pushes in to k ~1.95 on jar 3's top, the pile beside it;
//              the 32 px band is ~62 px on screen at y ~860-920; settled from ~f 186, the push decaying
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const SPAN_FRAMES = 176;
export const DURATION = SPAN_FRAMES + 16;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// --- the world (world px = screen px at the medium framing, k 1) ------------------------------------------------
const HS = 30; // a hop's size (cone + stem)
/** The jar: a glass cylinder (seen from the front and a little above: ellipses ry = Q rx) with a cream collar at
 *  its mouth and a cream foot, standing on the line. The full line is etched at FULL_Y. */
const JAR = { R: 150, Q: 0.1, WALL: 8, TOP: 630, COLLAR: 24, BOT: 1072, FOOT: 18, FULL_Y: 662 } as const;
const RAIL = { y: 1090, top: 22, front: 26 } as const; // the line: a cream tile, its top face then its front
/** The heap lattice inside a jar: across, rows in depth, one level (hop TOPS). Two levels gone = 32 px of the
 *  410 px fill = 7.8 %. The full line sits 32 px under the collar, so it reads as a line of its own. */
const LAT = { dx: 20, nj: 7, dl: 16 } as const;
const DROP_LEVELS = 2;
const RI = JAR.R - JAR.WALL; // the inner radius
const FILL_H = JAR.BOT - JAR.FULL_Y;
const N_LEVELS = Math.floor(FILL_H / LAT.dl);
/** The testing dish, on a cream stand behind the line, its rim above the jars' mouths. */
/** The testing dish: beside the sampling point, its rim above the jars' mouths, its pole BEHIND the line at a
 *  place no jar ever rests (jars rest at 0, 620, -620, -820 only). */
const DISH = { x: 270, y: 540, R: 110, LIP: 8, WALL: 36, Q: 0.16, STAND: 24 } as const;
const PILE = { dx: 20, nj: 6, dl: 12, slope: 12.4 } as const;
/** The sampling point (world x): every jar is sampled standing here. */
const STATION = 0;

// --- the line: jars, their start positions, the two moves ---------------------------------------------------------
/** A trapezoid move: `dist` px from f0, ramping over RAMP f to the line's one speed V and back. */
const V = 45;
const RAMP = 6;
const moveAt = (f: number, f0: number, dist: number) => {
  const T = dist / V + RAMP; // total frames
  const t = Math.max(0, Math.min(T, f - f0));
  const a = V / RAMP;
  if (t < RAMP) return 0.5 * a * t * t;
  if (t < T - RAMP) return 0.5 * a * RAMP * RAMP + V * (t - RAMP);
  const r = T - t;
  return dist - 0.5 * a * r * r;
};
const MOVES = [
  { f0: 92, dist: 820 },
  { f0: 130, dist: 620 },
] as const;
const lineAt = (f: number) => MOVES.reduce((s, m) => s + moveAt(f, m.f0, m.dist), 0);
type JarSpec = { x0: number; win: [number, number]; flight: number };
const JARS: JarSpec[] = [
  { x0: STATION, win: [4, 46], flight: 18 },
  { x0: STATION + 820, win: [117, 129], flight: 11 },
  { x0: STATION + 820 + 620, win: [151, 163], flight: 10 },
];
const jarX = (j: number, f: number) => JARS[j].x0 - lineAt(f);

// --- the hops in a jar -----------------------------------------------------------------------------------------------
type Col = { x: number; z: number; front: boolean };
const COLS: Col[] = (() => {
  const raw: { x: number; z: number }[] = [];
  for (let j = 0; j < LAT.nj; j++) {
    const zz = -1 + (2 * j + 1) / LAT.nj;
    const off = j % 2 ? LAT.dx / 2 : 0;
    for (let i = -10; i <= 10; i++) {
      const x = i * LAT.dx + off;
      if ((x / (RI - 9)) ** 2 + zz * zz > 1) continue;
      raw.push({ x, z: zz });
    }
  }
  // the front-most column at each x shows its whole height through the glass
  return raw.map((c) => ({ ...c, front: !raw.some((o) => Math.abs(o.x - c.x) < 0.1 && o.z > c.z + 1e-6) }));
})();
/** A jar hop's centre, relative to the jar's centre x: level l (0 = the BACK row's tops at the full line, so the
 *  amber's top edge seen through the glass is the level; negative below). */
const hopPos = (c: Col, l: number) => ({ x: c.x, y: JAR.FULL_Y - l * LAT.dl + (c.z + 1) * RI * JAR.Q + HS * 0.3 });
const hopRot = (seed: number) => {
  const a = hash(seed);
  const b = hash(seed + 0.37);
  // mostly lying (stem left or right), some turned further so a stem shows
  return (a < 0.5 ? -90 : 90) + (b - 0.5) * 150;
};

// --- the pile in the dish --------------------------------------------------------------------------------------------
const PI_R = DISH.R - DISH.LIP - 8;
const pileCols = (() => {
  const out: { x: number; z: number; rho: number }[] = [];
  for (let j = 0; j < PILE.nj; j++) {
    const zz = -1 + (2 * j + 1) / PILE.nj;
    const off = j % 2 ? PILE.dx / 2 : 0;
    for (let i = -10; i <= 10; i++) {
      const x = i * PILE.dx + off;
      const rho = Math.sqrt((x / PI_R) ** 2 + zz * zz);
      if (rho > 1) continue;
      out.push({ x, z: zz, rho });
    }
  }
  return out;
})();
type Slot = { col: number; l: number; x: number; y: number; rot: number; z: number };
const PILE_FLOOR = DISH.y + 14;
const SLOTS: Slot[] = (() => {
  const out: (Slot & { p: number })[] = [];
  pileCols.forEach((c, ci) => {
    for (let l = 0; l < 40; l++) {
      out.push({
        col: ci,
        l,
        // odd levels sit half a step over (a pile is bricked, never stacked in towers), a little height jitter
        x: DISH.x + c.x + (l % 2 ? PILE.dx / 2 : 0) * (c.x > 0 ? -1 : 1),
        y: PILE_FLOOR + c.z * PI_R * DISH.Q - l * PILE.dl + HS * 0.3 + (hash(ci * 7.3 + l * 1.9) - 0.5) * 5,
        rot: hopRot(1000 + ci * 41 + l * 7),
        z: c.z,
        p: l + PILE.slope * c.rho + 0.002 * ci,
      });
    }
  });
  return out.sort((a, b) => a.p - b.p);
})();


// --- the lens (testing): a cream magnifying glass (Lucide "search" grammar) --------------------------------------------
/** Its path (the lens centre, world px): in from the right edge, a slow pass right-to-left across the pile, then up and
 *  away off the right edge. Keys (f, x, y), a Catmull-Rom through them (C1). */
const LENS_KEYS: [number, number, number][] = [
  [44, 1120, 330],
  [58, 800, 390],
  [72, 430, 455],
  [90, 150, 470],
  [100, 250, 250],
  [110, 760, 90],
  [120, 1200, -60],
];
const LENS = { box: 200, f0: 56, f1: 110 } as const; // the Lucide box: the ring ~150 px across at k 1
const LENS_U = LENS.box / 24; // Lucide units -> world px
const LENS_R = 9 * LENS_U; // the ring's outer radius
export const lensAt = (f: number): { x: number; y: number } => {
  const K = LENS_KEYS;
  let i = 0;
  while (i < K.length - 2 && f > K[i + 1][0]) i++;
  const p0 = K[Math.max(0, i - 1)];
  const p1 = K[i];
  const p2 = K[i + 1];
  const p3 = K[Math.min(K.length - 1, i + 2)];
  const t = Math.max(0, Math.min(1, (f - p1[0]) / (p2[0] - p1[0])));
  const cr = (a: number, b: number, c: number, d: number) => {
    // non-uniform tangents scaled by the segment's own duration (velocity continuous in frames)
    const m1 = ((c - a) / (p2[0] - p0[0] || 1)) * (p2[0] - p1[0]);
    const m2 = ((d - b) / (p3[0] - p1[0] || 1)) * (p2[0] - p1[0]);
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * c + (t3 - t2) * m2;
  };
  return { x: cr(p0[1], p1[1], p2[1], p3[1]), y: cr(p0[2], p1[2], p2[2], p3[2]) };
};
/** The frame the lens first passes over a point of the pile: inside its ring, or (for the low hops the ring rides
 *  over) the frame its centre crosses the point's x on the slow pass. */
const lensReaches = (x: number, y: number) => {
  for (let f = LENS.f0; f <= LENS.f1; f += 0.25) {
    const L = lensAt(f);
    if (Math.hypot(L.x - x, L.y - y) < LENS_R * 0.95 || (f >= 72 && f <= 90 && L.x <= x + 6)) return f;
  }
  return LENS.f1;
};
/** The lens as world paths: the ring (a hole by winding) and the handle (a capsule), centre (x, y). */
const lensPaths = (x: number, y: number) => {
  const ro = 9 * LENS_U;
  const ri = 7 * LENS_U;
  const ring = `M${f2(x + ro)} ${f2(y)}A${f2(ro)} ${f2(ro)} 0 1 1 ${f2(x - ro)} ${f2(y)}A${f2(ro)} ${f2(ro)} 0 1 1 ${f2(x + ro)} ${f2(y)}Z` +
    `M${f2(x + ri)} ${f2(y)}A${f2(ri)} ${f2(ri)} 0 1 0 ${f2(x - ri)} ${f2(y)}A${f2(ri)} ${f2(ri)} 0 1 0 ${f2(x + ri)} ${f2(y)}Z`;
  // handle: from 5.65 to 10 units along the diagonal from the centre, 2 units wide, round ends
  const w = LENS_U;
  const a = 6.2 * LENS_U / Math.SQRT2;
  const b = 10 * LENS_U / Math.SQRT2;
  const n = w / Math.SQRT2;
  const handle = `M${f2(x + a + n)} ${f2(y + a - n)}L${f2(x + b + n)} ${f2(y + b - n)}A${f2(w)} ${f2(w)} 0 0 1 ${f2(x + b - n)} ${f2(y + b + n)}L${f2(x + a - n)} ${f2(y + a + n)}Z`;
  const glass = `M${f2(x + ri)} ${f2(y)}A${f2(ri)} ${f2(ri)} 0 1 1 ${f2(x - ri)} ${f2(y)}A${f2(ri)} ${f2(ri)} 0 1 1 ${f2(x + ri)} ${f2(y)}Z`;
  return { ring, handle, glass, ro, ri };
};
const Lens: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => {
  const uid = `ln${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const P = lensPaths(x, y);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1={f2(x - P.ro)} y1={f2(y - P.ro)} x2={f2(x + 10 * LENS_U)} y2={f2(y + 10 * LENS_U)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d: P.ring + P.handle }, { d: P.glass, a: 0.25 }]} elevation="float" />
      <path d={P.glass} fill={COLOR.glass} fillOpacity={ALPHA.glassTint * 1.5} />
      <path d={P.handle} fill={`url(#${uid}c)`} />
      <path d={P.ring} fill={`url(#${uid}c)`} />
      {/* the lit top edge of the ring (the key from above-left) */}
      <path
        d={`M${f2(x - P.ro * 0.96 * Math.cos(0.35))} ${f2(y - P.ro * 0.96 * Math.sin(0.35))}A${f2(P.ro * 0.96)} ${f2(P.ro * 0.96)} 0 0 1 ${f2(x + P.ro * 0.96 * Math.cos(1.25))} ${f2(y - P.ro * 0.96 * Math.sin(1.25))}`}
        fill="none"
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={f2(EDGE.CREAM / k)}
        strokeLinecap="round"
      />
      {/* a glint on the lens glass */}
      <path
        d={`M${f2(x - P.ri * 0.62)} ${f2(y - P.ri * 0.1)}A${f2(P.ri * 0.62)} ${f2(P.ri * 0.62)} 0 0 1 ${f2(x - P.ri * 0.1)} ${f2(y - P.ri * 0.62)}`}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.35}
        strokeWidth={f2(3 / k)}
        strokeLinecap="round"
      />
    </g>
  );
};

// --- every hop that goes ---------------------------------------------------------------------------------------------
type Flight = {
  jar: number;
  col: number;
  l: number;
  x0: number;
  y0: number;
  rot0: number;
  dep: number;
  land: number;
  slot: number;
  rot1: number;
  pts: [number, number][];
  cum: number[];
  L: number;
  shift: number;
};
const FLIGHTS: Flight[] = (() => {
  const raw: Omit<Flight, "slot" | "rot1" | "pts" | "cum" | "L" | "shift">[] = [];
  JARS.forEach((J, ji) => {
    const list: { col: number; l: number; key: number }[] = [];
    COLS.forEach((c, ci) => {
      for (let l = 0; l >= 1 - DROP_LEVELS; l--) list.push({ col: ci, l, key: l * 1e4 + c.x - c.z * 10 });
    });
    list.sort((a, b) => b.key - a.key);
    const N = list.length;
    list.forEach((h, n) => {
      const p = hopPos(COLS[h.col], h.l);
      const dep = J.win[0] + ((J.win[1] - J.win[0]) * n) / N;
      raw.push({ jar: ji, col: h.col, l: h.l, x0: STATION + p.x, y0: p.y, rot0: hopRot(ji * 977 + h.col * 13 + h.l * 3), dep, land: dep + J.flight });
    });
  });
  raw.sort((a, b) => a.land - b.land);
  // ONE arc for the whole sampling: both inner control points are the station's own (a rope in the middle,
  // fanning only where it leaves the jar and where it lands on the pile)
  const apex = DISH.y - 170;
  const C1: [number, number] = [STATION + 50, apex];
  const C2: [number, number] = [DISH.x - 20, apex];
  return raw.map((r, si) => {
    const s = SLOTS[si];
    const P = [[r.x0, r.y0], C1, C2, [s.x, s.y]];
    const pts: [number, number][] = [];
    const cum: number[] = [0];
    const NS = 40;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS;
      const u = 1 - t;
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      pts.push([w[0] * P[0][0] + w[1] * P[1][0] + w[2] * P[2][0] + w[3] * P[3][0], w[0] * P[0][1] + w[1] * P[1][1] + w[2] * P[2][1] + w[3] * P[3][1]]);
      if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    // jar 1's hops are tested by the lens: each turns spent as the lens passes over it; the later jars' as they land
    const shift = r.jar === 0 ? Math.max(r.land + 2, lensReaches(s.x, s.y)) : r.land + 1;
    return { ...r, slot: si, rot1: s.rot, pts, cum, L: cum[NS], shift };
  });
})();
const SHIFT_F = 12;
/** How many hops each jar gives up (all three the same). */
export const HOPS_PER_JAR = FLIGHTS.filter((F) => F.jar === 0).length;

/** Where a hop in flight is at frame f: a 4-frame ease into constant speed, then on to its slot. */
const flightAt = (F: Flight, f: number) => {
  const T = F.land - F.dep;
  const t = f - F.dep;
  const v = F.L / (T - 2);
  const d = t < 4 ? (v * t * t) / 8 : v * (t - 2);
  const s = Math.min(F.L, Math.max(0, d));
  let i = 1;
  while (i < F.cum.length - 1 && F.cum[i] < s) i++;
  const a = F.cum[i - 1];
  const u = (s - a) / Math.max(1e-6, F.cum[i] - a);
  return { x: lerp(F.pts[i - 1][0], F.pts[i][0], u), y: lerp(F.pts[i - 1][1], F.pts[i][1], u), rot: lerp(F.rot0, F.rot1, smoothstep(s / F.L)) };
};
const BY_COL: Flight[][][] = JARS.map((_, ji) => COLS.map((_, ci) => FLIGHTS.filter((F) => F.jar === ji && F.col === ci).sort((a, b) => a.dep - b.dep)));
const BY_JAR: Flight[][] = JARS.map((_, ji) => FLIGHTS.filter((F) => F.jar === ji));
const BY_PILE_COL: Flight[][] = pileCols.map((_, ci) => FLIGHTS.filter((F) => SLOTS[F.slot].col === ci).sort((a, b) => SLOTS[a.slot].l - SLOTS[b.slot].l));

// --- the camera ------------------------------------------------------------------------------------------------------
// close on jar 1 (k 2.2, its full line at screen y ~700), back to the medium framing (k 1, look x 100: jar 1 +
// the dish, jar 2 still off the right edge), a slow drift left with the line (look x -10: jars 2 + 3 + the
// dish), then from f 146 a damped push in toward the jar tops (k ~1.3 at the end; the rail leaves the bottom).
const CAM0 = { x: 150, y: JAR.FULL_Y + 200 / 1.5, k: 1.5 }; // jar 1 + the whole dish, the full line at y ~760
const END = { x: 112, y: JAR.FULL_Y + 100 / 1.95, k: 1.95 }; // jar 3's top + the pile, the band at y ~860-920
const CAM = makeClockCam(
  CAM0,
  [
    // already easing back on f0 (the glide starts before the cut): jar 1 + the dish, then the medium framing
    { f0: -14, f1: 50, dx: 110 - CAM0.x, dy: 960 - CAM0.y, k: 1.0 },
    { f0: 50, f1: 140, k: 1.03 },
    // "... a few percent per batch": push in on the top of the last sampled jar, the pile beside it
    { f0: 138, f1: 184, dx: END.x - 110, dy: END.y - 960, k: END.k },
  ],
  DURATION,
);
export const camAt = (f: number): Cam => CAM.at(f);

// --- drawing helpers -------------------------------------------------------------------------------------------------
type P2 = [number, number];
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 36): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
};
const poly = (pts: P2[], close = true) => pts.map((p, i) => `${i ? "L" : "M"}${f2(p[0])} ${f2(p[1])}`).join("") + (close ? "Z" : "");
const UPPER = [Math.PI, 2 * Math.PI] as const; // left -> right over the top
const LOWER = [Math.PI, 0] as const; // left -> right under the bottom
/** A band of a cylinder between two heights (its front face), radius r, ellipse ratio q. */
const band = (cx: number, y0: number, y1: number, r: number, q: number) => poly([...arc(cx, y0, r, r * q, LOWER[0], LOWER[1]), ...arc(cx, y1, r, r * q, 0, Math.PI)]);

/** One hop, full or lite by its screen size (the switch dithered per hop over 16-22 px). */
const Hop: React.FC<{ id: number; x: number; y: number; rot: number; k: number; mix?: number; to?: HopTone }> = ({ id, x, y, rot, k, mix = 0, to = "spent" }) => {
  const lite = HS * k < 16 + 6 * hash(id * 3.1);
  const props = { x, y, size: HS, rotate: rot, k, tone: "amber" as HopTone, toTone: to, mix };
  return lite ? <HopConeLite {...props} /> : <HopCone {...props} />;
};

/** The jar's outline (collar to foot) for its ONE union shadow (the contents are inside it). */
const jarSilhouette = (cx: number) =>
  poly([...arc(cx, JAR.TOP - JAR.COLLAR, JAR.R, JAR.R * JAR.Q, UPPER[0], UPPER[1]), ...arc(cx, JAR.BOT + JAR.FOOT, JAR.R, JAR.R * JAR.Q, 0, Math.PI)]);

/** A jar, back pass: its shadow, the glass's far wall (tint + far hairline), the collar's far half. */
const JarBack: React.FC<{ cx: number; k: number }> = ({ cx, k }) => {
  const top = JAR.TOP - JAR.COLLAR;
  return (
    <g>
      <ElevationShadow silhouette={[{ d: jarSilhouette(cx) }]} elevation="rest" contact={{ x: cx, y: JAR.BOT + JAR.FOOT + JAR.R * JAR.Q * 0.7, w: 2 * JAR.R * 0.92 }} />
      {/* the glass body: the one transparent material (a faint tint) */}
      <path d={band(cx, JAR.TOP, JAR.BOT, JAR.R, JAR.Q)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      <path d={poly(arc(cx, JAR.TOP, JAR.R, JAR.R * JAR.Q, 0, 2 * Math.PI, 48))} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      {/* the far side of the collar's mouth (its inside, in shade) */}
      <path d={poly([...arc(cx, top, JAR.R, JAR.R * JAR.Q, UPPER[0], UPPER[1]), ...arc(cx, top, JAR.R - 7, (JAR.R - 7) * JAR.Q, UPPER[1], UPPER[0])])} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.4)} />
      <path d={poly(arc(cx, top, JAR.R - 7, (JAR.R - 7) * JAR.Q, UPPER[0], UPPER[1]), false)} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.7)} strokeWidth={f2(EDGE.CREAM / k)} />
    </g>
  );
};

/** A jar, front pass: the near glass (hairlines, a reflection), the etched full line + tick, the collar, the foot,
 *  and the amber bracket from the full line down to the hops' level (`gap` px, growing as the level sinks). */
const JarFront: React.FC<{ cx: number; k: number; gap: number; lit: number }> = ({ cx, k, gap, lit }) => {
  const uid = `jf${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const R = JAR.R;
  const q = JAR.Q;
  const hw = STROKE.HAIRLINE / k;
  const top = JAR.TOP - JAR.COLLAR;
  const bx = cx + R + 26; // the bracket's spine: on the jar's right side, the full line's tick runs into its top serif
  const serif = 12; // half a serif (24 px wide)
  const levelY = JAR.FULL_Y + gap;
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1={f2(cx - R)} y1="0" x2={f2(cx + R)} y2="0">
          <stop offset="0.1" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.2" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="0.27" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.86" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.91" stopColor="#FFFFFF" stopOpacity="0.07" />
          <stop offset="0.95" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1={f2(cx - R)} y1="0" x2={f2(cx + R)} y2="0">
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.creamFoot, 0.7)} />
          <stop offset="0.3" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.board, 0.45)} />
        </linearGradient>
      </defs>
      {/* the near glass: a reflection band down the lit side, the side and base hairlines */}
      <path d={band(cx, JAR.TOP, JAR.BOT, R, q)} fill={`url(#${uid}r)`} />
      <g fill="none" stroke={COLOR.glass} strokeWidth={f2(hw)}>
        <path d={`M${f2(cx - R + hw / 2)} ${f2(JAR.TOP)}V${f2(JAR.BOT)}M${f2(cx + R - hw / 2)} ${f2(JAR.TOP)}V${f2(JAR.BOT)}`} strokeOpacity={ALPHA.glassHi} />
      </g>
      {/* the hops' level: a crisp lit top edge on the packed amber (the hot edge + its falloff), at rest only */}
      {lit > 0.01 ? (
        <g opacity={f2(lit)}>
          <defs>
            <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(levelY)} x2="0" y2={f2(levelY + fall)}>
              <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
              <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={f2(cx - RI)} y={f2(levelY)} width={f2(2 * RI)} height={f2(fall)} fill={`url(#${uid}h)`} />
          <path d={`M${f2(cx - RI)} ${f2(levelY + EDGE.HOT / k / 2)}H${f2(cx + RI)}`} stroke={COLOR.amberHot} strokeWidth={f2(2.5 / k)} />
        </g>
      ) : null}
      {/* the etched full line across the whole front face (the near half of its ring), and its tick on the right */}
      <path d={poly(arc(cx, JAR.FULL_Y, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.inkCream} strokeWidth={f2(4.5 / k)} strokeLinecap="round" />
      <path d={`M${f2(cx + R - 4)} ${f2(JAR.FULL_Y)}H${f2(bx - serif)}`} stroke={COLOR.inkCream} strokeWidth={f2(4.5 / k)} strokeLinecap="round" />
      {/* the collar (cream card, lit top edge) and the foot */}
      <path d={band(cx, top, JAR.TOP, R, q)} fill={`url(#${uid}c)`} />
      <path d={poly(arc(cx, top, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      <path d={poly([...arc(cx, top, R, R * q, LOWER[0], LOWER[1]), ...arc(cx, top, R - 7, (R - 7) * q, LOWER[1], LOWER[0])])} fill={mixHex(COLOR.cream, COLOR.edge, 0.3)} />
      <path d={band(cx, JAR.BOT, JAR.BOT + JAR.FOOT, R, q)} fill={`url(#${uid}c)`} />
      <path d={poly(arc(cx, JAR.BOT, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge * 0.8} strokeWidth={f2(EDGE.CREAM / k)} />
      {/* the bracket: amber, a spine with 24 px serifs from the full line to the level, on the jar's right side */}
      {gap > 0.5 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <path
            d={`M${f2(bx - serif)} ${f2(JAR.FULL_Y)}H${f2(bx + serif)}M${f2(bx)} ${f2(JAR.FULL_Y)}V${f2(levelY)}M${f2(bx - serif)} ${f2(levelY)}H${f2(bx + serif)}`}
            fill="none"
            stroke={COLOR.amberTop}
            strokeWidth={f2(6.5 / k)}
            strokeLinecap="butt"
          />
        </g>
      ) : null}
    </g>
  );
};

/** The testing dish (cream, shallow, lit inside), back or front pass, and its stand. */
const dishGeo = () => {
  const { x, y, R, LIP, WALL, Q } = DISH;
  const ri = R - LIP;
  const rb = R * 0.92;
  const baseY = y + WALL;
  return {
    ri,
    baseY,
    rb,
    front: poly([...arc(x, y, R, R * Q, LOWER[0], LOWER[1]), ...arc(x, baseY, rb, rb * Q, 0, Math.PI)]),
    outer: poly(arc(x, y, R, R * Q, 0, 2 * Math.PI, 64)),
    inner: poly(arc(x, y, ri, ri * Q, 0, 2 * Math.PI, 64)),
    ringFront: poly([...arc(x, y, R, R * Q, LOWER[0], LOWER[1]), ...arc(x, y, ri, ri * Q, LOWER[1], LOWER[0])]),
    ringBack: poly([...arc(x, y, R, R * Q, UPPER[0], UPPER[1]), ...arc(x, y, ri, ri * Q, UPPER[1], UPPER[0])]),
    contents: poly([[x - ri, y - 2000], [x + ri, y - 2000], ...arc(x, y, ri, ri * Q, 0, Math.PI)]),
    innerFrontEdge: poly(arc(x, y, ri, ri * Q, LOWER[0], LOWER[1]), false),
    stand: poly([[x - DISH.STAND / 2, baseY], [x + DISH.STAND / 2, baseY], [x + DISH.STAND / 2, RAIL.y], [x - DISH.STAND / 2, RAIL.y]]),
  };
};
const DG = dishGeo();

// ---------------------------------------------------------------------------------------------------------------------
const HundredsOfHops: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const view = viewOf(cam);
  const uid = `hh${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const pool = { x: lerp(STATION, 170, smoothstep((frame - 10) / 50)), y: 720, strength: 1.35 };

  // --- the jars at this frame
  const jars = JARS.map((J, ji) => {
    const cx = jarX(ji, frame);
    const vis = cx + JAR.R + 40 > view.x0 && cx - JAR.R - 40 < view.x1;
    const hops: { id: number; x: number; y: number; rot: number; z: number; l: number }[] = [];
    let minTop = 0;
    if (vis) {
      COLS.forEach((c, ci) => {
        const gone = BY_COL[ji][ci].filter((F) => F.dep <= frame).length;
        const top = -gone;
        minTop = Math.min(minTop, top);
        const lo = c.front ? -N_LEVELS + 1 : top - 1;
        for (let l = lo; l <= top; l++) {
          const p = hopPos(c, l);
          hops.push({ id: ji * 100000 + ci * 100 + (l + 50), x: cx + p.x, y: p.y, rot: hopRot(ji * 977 + ci * 13 + l * 3), z: c.z, l });
        }
      });
      hops.sort((a, b) => a.z - b.z || a.l - b.l);
    }
    const removed = BY_JAR[ji].filter((F) => F.dep <= frame).length;
    const gap = (DROP_LEVELS * LAT.dl * removed) / BY_JAR[ji].length;
    // the bulk behind the hops: from a level and a half under the lowest top down to the floor
    const bulkY = JAR.FULL_Y - (minTop - 1.2) * LAT.dl + RI * JAR.Q;
    const bulk = poly([...arc(cx, bulkY, RI, RI * JAR.Q, Math.PI, 2 * Math.PI), [cx + RI, JAR.BOT + 30], [cx - RI, JAR.BOT + 30]]);
    // the lit level edge rests on a settled surface only: it lets go as sampling starts, returns as it ends
    const lit = 1 - smoothstep((frame - (J.win[0] - 4)) / 8) * (1 - smoothstep((frame - (J.win[1] + 2)) / 12));
    // at rest the packed hops are cut flat at the level (a crisp surface); while sampling, the surface is free
    const levelY = JAR.FULL_Y + gap;
    const clipTop = levelY - (1 - lit) * 200;
    const clip = poly([[cx - RI, clipTop], [cx + RI, clipTop], ...arc(cx, JAR.BOT, RI, RI * JAR.Q, 0, Math.PI)]);
    return { ji, cx, vis, hops, gap, bulk, clip, lit };
  });

  // --- the pile in the dish
  const pileHops: { id: number; x: number; y: number; rot: number; z: number; l: number; mix: number }[] = [];
  const colTop: number[] = [];
  const pileSil: string[] = [];
  let mixSum = 0;
  let mixN = 0;
  BY_PILE_COL.forEach((list, ci) => {
    const landed = list.filter((F) => F.land <= frame);
    const n = landed.length;
    colTop[ci] = n ? SLOTS[landed[n - 1].slot].y : Infinity;
    for (let q = Math.max(0, n - 3); q < n; q++) {
      const F = landed[q];
      const s = SLOTS[F.slot];
      const m = smoothstep((frame - F.shift) / SHIFT_F);
      pileHops.push({ id: 50000 + F.slot, x: s.x, y: s.y, rot: s.rot, z: s.z, l: s.l, mix: m });
      mixSum += m;
      mixN++;
      if (q === n - 1 && s.y < DISH.y) pileSil.push(hopSilhouette(s.x, s.y, HS, s.rot));
    }
  });
  pileHops.sort((a, b) => a.z - b.z || a.l - b.l);
  const pileMix = mixN ? mixSum / mixN : 0;
  // the pile's body under its visible hops: each landed column's top spreads down at the angle of repose, bounded
  // below by the foot of the front-most landed column near each x (never paint in front of the hops)
  const pileBulk = (() => {
    const top: P2[] = [];
    const foot: P2[] = [];
    let any = false;
    for (let x = -PI_R; x <= PI_R + 0.1; x += 8) {
      let yt = Infinity;
      let yf = -Infinity;
      pileCols.forEach((c, ci) => {
        if (!Number.isFinite(colTop[ci])) return;
        yt = Math.min(yt, colTop[ci] + 8 + 1.5 * Math.max(0, Math.abs(c.x - x) - PILE.dx * 0.3));
        if (Math.abs(c.x - x) < PILE.dx * 0.9) yf = Math.max(yf, PILE_FLOOR + c.z * PI_R * DISH.Q + 4);
      });
      if (Number.isFinite(yf)) any = true;
      const base = Number.isFinite(yf) ? yf : PILE_FLOOR;
      top.push([DISH.x + x, Math.min(Number.isFinite(yt) ? yt : base, base)]);
      foot.push([DISH.x + x, base]);
    }
    return any ? { d: poly([...top, ...foot.reverse()]), top: poly(top.filter((pt, i) => pt[1] < foot[i][1] - 2), false) } : null;
  })();

  // --- in flight
  // a hop still below its jar's mouth is inside the jar (behind the near glass and the collar's front); once it is
  // wholly above the collar it flies in front of everything
  const MOUTH_Y = JAR.TOP - JAR.COLLAR - JAR.R * JAR.Q;
  const flyingAll = FLIGHTS.filter((F) => F.dep <= frame && frame < F.land).map((F) => ({ F, ...flightAt(F, frame) }));
  const flying = flyingAll.filter((h) => h.y + HS * 0.55 < MOUTH_Y || Math.abs(h.x - STATION) > JAR.R);
  const rising = flyingAll.filter((h) => !flying.includes(h));

  const railD = `M${view.x0 - 200} ${RAIL.y - RAIL.top}H${view.x1 + 200}V${RAIL.y + RAIL.front}H${view.x0 - 200}Z`;
  return (
    <AbsoluteFill>
      <StoutStage S={frame} cam={cam} rest={camAt(0)} pool={pool}>
        <defs>
          {jars.map((j) => (
            <clipPath key={j.ji} id={`${uid}c${j.ji}`}>
              <path d={j.clip} />
            </clipPath>
          ))}
          <clipPath id={`${uid}cd`}>
            <path d={DG.contents} />
          </clipPath>
        </defs>

        {/* the testing dish on its stand, behind the line */}
        <ElevationShadow silhouette={[{ d: DG.front }, { d: DG.outer }, { d: DG.stand }, ...pileSil.map((d) => ({ d }))]} elevation="rest" />
        <path d={DG.stand} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.35)} />
        <path d={DG.inner} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.5)} />
        <path d={DG.ringBack} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.35)} />
        <g clipPath={`url(#${uid}cd)`}>
          {pileBulk ? <path d={pileBulk.d} fill={mixHex(mixHex(COLOR.amberFoot, COLOR.rung, 0.55), mixHex(COLOR.boardFoot, COLOR.board, 0.3), pileMix)} /> : null}
          <g style={{ filter: bloomFilter(k) }}>
            {pileHops
              .filter((h) => h.mix < 0.999)
              .map((h) => (
                <Hop key={h.id} id={h.id} x={h.x} y={h.y} rot={h.rot} k={k} mix={h.mix} />
              ))}
          </g>
          {pileHops
            .filter((h) => h.mix >= 0.999)
            .map((h) => (
              <Hop key={h.id} id={h.id} x={h.x} y={h.y} rot={h.rot} k={k} mix={1} />
            ))}
          {/* the pile's lit top (the key from above): a soft light along its crest */}
          {pileBulk ? (
            <path d={pileBulk.top} fill="none" stroke={mixHex(COLOR.amberHot, COLOR.cream, pileMix)} strokeOpacity={0.5} strokeWidth={f2(5 / k)} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `blur(${f2(2 / k)}px)` }} transform={`translate(0 ${f2(-6)})`} />
          ) : null}
        </g>
        <path d={DG.front} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.4)} />
        <path d={DG.ringFront} fill={mixHex(COLOR.cream, COLOR.edge, 0.3)} />
        <path d={DG.innerFrontEdge} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.6)} strokeWidth={f2(EDGE.CREAM / k)} />

        {/* the line: one cream tile, its lit top face then its front */}
        <ElevationShadow silhouette={[{ d: railD }]} elevation="rest" />
        <path d={`M${view.x0 - 200} ${RAIL.y - RAIL.top}H${view.x1 + 200}V${RAIL.y}H${view.x0 - 200}Z`} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.3)} />
        <path d={`M${view.x0 - 200} ${RAIL.y}H${view.x1 + 200}V${RAIL.y + RAIL.front}H${view.x0 - 200}Z`} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.45)} />
        <path d={`M${view.x0 - 200} ${RAIL.y - RAIL.top + EDGE.CREAM / k / 2}H${view.x1 + 200}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />

        {/* the jars: shadow + far glass, the packed hops behind the near glass, the near glass + bracket */}
        {jars.map((j) =>
          j.vis ? (
            <g key={j.ji}>
              <JarBack cx={j.cx} k={k} />
              <g clipPath={`url(#${uid}c${j.ji})`}>
                <path d={j.bulk} fill={mixHex(COLOR.amberFoot, COLOR.rung, 0.55)} />
                <g style={{ filter: bloomFilter(k) }}>
                  {j.hops.map((h) => (
                    <Hop key={h.id} id={h.id} x={h.x} y={h.y} rot={h.rot} k={k} />
                  ))}
                </g>
              </g>
              {/* hops on their way up out of this jar, still inside it */}
              <g style={{ filter: bloomFilter(k) }}>
                {rising
                  .filter((h) => h.F.jar === j.ji)
                  .map((h) => (
                    <Hop key={h.F.slot} id={60000 + h.F.slot} x={h.x} y={h.y} rot={h.rot} k={k} />
                  ))}
              </g>
              <JarFront cx={j.cx} k={k} gap={j.gap} lit={j.lit} />
            </g>
          ) : null,
        )}

        {/* the stream: one float shadow for every hop in the air, then the hops */}
        {flying.length ? <ElevationShadow silhouette={flying.map((h) => ({ d: hopSilhouette(h.x, h.y, HS, h.rot) }))} elevation="float" /> : null}
        <g style={{ filter: bloomFilter(k) }}>
          {flying.map((h) => (
            <Hop key={h.F.slot} id={60000 + h.F.slot} x={h.x} y={h.y} rot={h.rot} k={k} />
          ))}
        </g>
        {/* the lens: tests the pile on "to see, quality batch or not?" */}
        {frame >= LENS_KEYS[0][0] && frame <= LENS_KEYS[LENS_KEYS.length - 1][0] ? <Lens {...lensAt(frame)} k={k} /> : null}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default HundredsOfHops;
