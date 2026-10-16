import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { ALPHA, COLOR, EDGE, ElevationShadow, STROKE, StoutStage, bloomFilter, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, viewOf } from "../kits/cheeky-pint/museShared";
import { HopCone, HopConeLite, hopSilhouette, type HopTone } from "./guinnessShared";

// ---------------------------------------------------------------------------
// HundredsOfHopsV2 (cold-review pass on a copy of HundredsOfHops; the delivered cut stays as is) — cut 3 of 3 of the Cheeky Pint S4E02 clip "will - guinness invented the t-test" (Will
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
//   V2 ROUND 4 (finish pass on r2; the r3 trays were reverted). Open-mouth jars; the cream ladle dips INTO the mouth
//   from straight above and pours into ONE wide dish high over the row, where every sample piles into one heap.
//   f 4-60     "hundreds": three heaped dips in an accelerating rhythm (in at f 12 / 31 / 48, pours f 21-27 / 38-43 /
//              53-57), each overlapping the last's stream; the level sinks two layers below the etched full line
//   f 40-70    a push in on the dish (k 1.85: the cones read)
//   f 52-112   the loupe: in from the right, one slow pass over the sample f 62-90 (each hop it covers is crushed:
//              flat, spent), held to "not" (f 96), then out sideways to the left over 16 f
//   f 91-118   the line (left to right): jar 1 into the row under the dish, jar 2 in from the left, fully formed
//   f 108-140  jar 2's dip on "losing" (in at f 119), pour f 130-136, crushed into the heap on landing
//   f 132-153  the line again: jar 3 in; f 149-172 its dip and pour
//   THE LOSS: the removed band is clear empty glass under the cream full line, the lit level edge below it; as each
//   band finishes emptying a warm glow eases in and out inside it once (12 f)
//   f 132-166  the pull back to the row of three (k 1.03: bands at y ~820) with the one heap above; calm from ~f 172
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

// arcPts is used by the scoop's outline before the drawing helpers are declared
type P2 = [number, number];
function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 36): P2[] {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

// --- the world (world px = screen px at k 1) -------------------------------------------------------------------------
const HS = 30; // a hop's size (cone + stem)
/** The jar: a glass cylinder (seen from the front and a little above: ellipses ry = Q rx), OPEN at the mouth with a
 *  thin cream rim, a cream foot, standing on the line. The full line is etched at FULL_Y. */
const JAR = { R: 150, Q: 0.1, WALL: 8, TOP: 616, COLLAR: 10, BOT: 1072, FOOT: 18, FULL_Y: 662 } as const;
const RAIL = { y: 1090, top: 22, front: 26 } as const;
/** The heap lattice inside a jar: across, rows in depth, one level (hop TOPS). Two levels gone = 32 px of the
 *  410 px fill = 7.8 %. */
const LAT = { dx: 20, nj: 9, dl: 16 } as const;
const DROP_LEVELS = 2;
const DROP = DROP_LEVELS * LAT.dl;
const RI = JAR.R - JAR.WALL;
const FILL_H = JAR.BOT - JAR.FULL_Y;
const N_LEVELS = Math.floor(FILL_H / LAT.dl);
/** The testing dish on a cream arm from the right, its foot above the jars' rims. */
const DISH = { x: 330, y: 440, R: 150, LIP: 10, WALL: 36, Q: 0.16, ARM: 16 } as const; // r4: wide, high over the row: ONE shared heap
/** The pile: fresh (as poured) and crushed (after the loupe / on landing) level steps; the cone's slope. */
const PILE = { dx: 18, nj: 6, dlF: 12, dlC: 11, slope: 15 } as const;
const STATION = 0;

// --- the line: an accumulating conveyor ---------------------------------------------------------------------------
// Every jar on the belt moves at one speed; a tested jar stops at its place in the row (pitch ROW), the next comes in
// from WAIT (past the right edge). Ramps of RAMP f at each start and stop.
const ROW = 330;
const WAIT = 600;
const RAMP = 6;
const moveAt = (f: number, f0: number, dist: number, v: number) => {
  if (dist <= 0) return 0;
  const T = dist / v + RAMP;
  const t = Math.max(0, Math.min(T, f - f0));
  const a = v / RAMP;
  if (t < RAMP) return 0.5 * a * t * t;
  if (t < T - RAMP) return 0.5 * a * RAMP * RAMP + v * (t - RAMP);
  const r = T - t;
  return dist - 0.5 * a * r * r;
};
const MOVES = [
  { f0: 91, v: 28, dist: [ROW, WAIT, WAIT] }, // jar 1 -> the row; jar 2 in (by f 118); jar 3 up to WAIT
  { f0: 132, v: 40, dist: [ROW, ROW, WAIT] }, // jar 1, jar 2 along the row; jar 3 in (by f 153)
] as const;
// r4: the line runs left to right: new jars come in from the left, tested jars stand in a row to the right, under
// the dish (so the end frame is the row of three with the one heap above it)
const X0 = [STATION, STATION - WAIT, STATION - 2 * WAIT];
const jarX = (j: number, f: number) => X0[j] + MOVES.reduce((s, m) => s + moveAt(f, m.f0, m.dist[j], m.v), 0);

// --- the hops in a jar ----------------------------------------------------------------------------------------------
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
  return raw.map((c) => ({ ...c, front: !raw.some((o) => Math.abs(o.x - c.x) < 0.1 && o.z > c.z + 1e-6) }));
})();
const hopPos = (c: Col, l: number) => ({ x: c.x, y: JAR.FULL_Y - l * LAT.dl + (c.z + 1) * RI * JAR.Q + HS * 0.3 });
const hopRot = (seed: number) => {
  const a = hash(seed);
  const b = hash(seed + 0.37);
  return (a < 0.5 ? -90 : 90) + (b - 0.5) * 150;
};

// --- the scoop: the cause of every take-out ---------------------------------------------------------------------------
/** Its bowl (rim rx x ry, depth), handle (up-left from the left lip), in its own frame: (0, 0) = the rim's centre. */
const SC = { rx: 100, ry: 22, depth: 64, hw: 18 } as const;
const SC_HANDLE: [P2, P2] = [
  [-90, -2],
  [-205, -150],
];
const REST = { x: 110, y: 365, a: 0 };
/** Straight above the jar's mouth (the bowl's foot clears the rim): every dip comes down INTO the mouth from here. */
const ABOVE = { x: 0, y: 515, a: 0 };
const IN = { x: 0, y: 678, a: 0 };
const UP = { x: 0, y: 515, a: 0 };
const POUR = { x: 250, y: 230, a: 55 };
type ScoopKey = [number, { x: number; y: number; a: number }];
/** One dip: from T, above the mouth at tIn - 2, in at tIn (takes its share over tIn - 2 .. tFull), up, to the pour,
 *  pours tPour .. tEnd; `next` = the next dip follows straight from the pour (no rest between). */
type Dip = { jar: number; share: [number, number]; T: number; a: number; h: number; u: number; c: number; P: number; r: number; flight: number; next?: boolean };
const DIPS: Dip[] = [
  // "take up like hundreds of hops": three heaped scoops, an accelerating rhythm, each overlapping the last's stream
  { jar: 0, share: [0, 1 / 3], T: 4, a: 8, h: 2, u: 3, c: 5, P: 6, r: 0, flight: 10, next: true },
  { jar: 0, share: [1 / 3, 2 / 3], T: 26, a: 5, h: 2, u: 2, c: 4, P: 5, r: 0, flight: 10, next: true },
  { jar: 0, share: [2 / 3, 1], T: 44, a: 4, h: 2, u: 2, c: 3, P: 4, r: 9, flight: 10 },
  { jar: 1, share: [0, 1], T: 108, a: 11, h: 2, u: 3, c: 5, P: 6, r: 8, flight: 8 },
  { jar: 2, share: [0, 1], T: 149, a: 5, h: 2, u: 3, c: 4, P: 3, r: 6, flight: 4 },
];
const dipTimes = (B: Dip) => {
  const tIn = B.T + B.a;
  const tFull = tIn + B.h;
  const tUp = tFull + B.u;
  const tPour = tUp + B.c;
  const tEnd = tPour + B.P;
  const tRest = tEnd + B.r;
  return { tIn, tFull, tUp, tPour, tEnd, tRest, take0: tIn - 2, take1: tFull };
};
const SCOOP_KEYS: ScoopKey[] = (() => {
  const out: ScoopKey[] = [[-100, REST]];
  DIPS.forEach((B, i) => {
    const t = dipTimes(B);
    if (!(i > 0 && DIPS[i - 1].next)) out.push([B.T, REST]);
    out.push([t.tIn - 2, ABOVE], [t.tIn, IN], [t.tFull, IN], [t.tUp, UP], [t.tPour, POUR], [t.tEnd, POUR]);
    if (!B.next) out.push([t.tRest, REST]);
  });
  out.push([400, REST]);
  return out;
})();
/** The frame each jar's band has finished emptying (its glow eases in and out once from here). */
const BAND_DONE = [0, 1, 2].map((j) => Math.max(...DIPS.filter((d) => d.jar === j).map((d) => dipTimes(d).take1)));
const GLOW_F = 12;
/** The scoop at frame f: eased from key to key (a real hand stops at each key). */
const scoopAt = (f: number) => {
  const K = SCOOP_KEYS;
  let i = 0;
  while (i < K.length - 2 && f >= K[i + 1][0]) i++;
  const [fa, A] = K[i];
  const [fb, B] = K[i + 1];
  const e = smoothstep((f - fa) / Math.max(1e-6, fb - fa));
  return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), a: lerp(A.a, B.a, e) };
};
const rotPt = (p: P2, s: { x: number; y: number; a: number }): P2 => {
  const r = (s.a * Math.PI) / 180;
  return [s.x + p[0] * Math.cos(r) - p[1] * Math.sin(r), s.y + p[0] * Math.sin(r) + p[1] * Math.cos(r)];
};
const spoutAt = (f: number) => rotPt([SC.rx - 4, -4], scoopAt(f));
/** The scoop's outline (bowl + handle) in its own frame, for its one shadow. */
const SC_BOWL_OUT: P2[] = [...arcPts(0, 0, SC.rx, SC.ry, Math.PI, 2 * Math.PI, 20), ...arcPts(0, 0, SC.rx, SC.depth, 0, Math.PI, 24)];
const SC_HANDLE_PTS: P2[] = (() => {
  const [A, B] = SC_HANDLE;
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const L = Math.hypot(dx, dy);
  const nx = (-dy / L) * (SC.hw / 2);
  const ny = (dx / L) * (SC.hw / 2);
  const end = arcPts(B[0], B[1], SC.hw / 2, SC.hw / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) - Math.PI, 8);
  return [[A[0] + nx, A[1] + ny], ...end, [A[0] - nx, A[1] - ny]];
})();
/** The heaped scoopful (its own frame): rows above the rim, bottom row first. */
const SC_HEAP: { x: number; y: number; rot: number }[] = (() => {
  const rows: [number, number][] = [
    [-4, 7],
    [-17, 6],
    [-29, 5],
    [-40, 3],
    [-49, 1],
  ];
  const out: { x: number; y: number; rot: number }[] = [];
  rows.forEach(([y, n], ri) => {
    for (let i = 0; i < n; i++) out.push({ x: (i - (n - 1) / 2) * 26 + (ri % 2 ? 5 : -5), y, rot: hopRot(3000 + ri * 17 + i * 5) });
  });
  return out;
})();

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
type Slot = { col: number; l: number; x: number; yF: number; yC: number; rot: number; z: number };
const PILE_FLOOR = DISH.y + 12;
const SLOTS: Slot[] = (() => {
  const out: (Slot & { p: number })[] = [];
  pileCols.forEach((c, ci) => {
    for (let l = 0; l < 60; l++) {
      const base = PILE_FLOOR + c.z * PI_R * DISH.Q + HS * 0.3;
      const j = (hash(ci * 7.3 + l * 1.9) - 0.5) * 4;
      out.push({
        col: ci,
        l,
        x: DISH.x + c.x + (l % 2 ? PILE.dx / 2 : 0) * (c.x > 0 ? -1 : 1),
        yF: base - l * PILE.dlF + j,
        yC: base - l * PILE.dlC + j * 0.5,
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
  [52, 1000, 290],
  [62, 570, 370],
  // over the sample through "to see, quality batch or not?": one slow pass right to left, crushing what it covers
  [90, 200, 392],
  [96, 186, 388],
  // then out sideways (left), in frame until it has gone
  [112, -430, 360],
];
const LENS = { box: 176, f0: 60, f1: 92 } as const; // the Lucide box: the ring ~130 px across at k 1
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
    if (Math.hypot(L.x - x, L.y - y) < LENS_R * 0.95 || (f >= 62 && f <= 90 && L.x <= x + 6)) return f;
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

// --- every hop that goes ----------------------------------------------------------------------------------------------
type Flight = {
  jar: number;
  col: number;
  l: number;
  take: number; // the frame it goes into the scoop (it leaves the jar)
  dep: number; // the frame it leaves the scoop's lip
  land: number;
  slot: number;
  rot0: number;
  rot1: number;
  pts: [number, number][];
  cum: number[];
  L: number;
  crush: number; // the frame its crush starts (the loupe for batch 1; landing for 2 and 3)
  landY: number; // where it lands (fresh pile for batch 1; on top of the crushed heap for 2 and 3)
};
const CRUSH_F = 8;
const CRUSH_F2 = 6; // batches 2 and 3: crushed on landing, so the last (f 170) is done by f 176
const FLIGHTS: Flight[] = (() => {
  type Raw = { jar: number; col: number; l: number; take: number; dep: number; land: number; rot0: number; lane: number };
  const raw: Raw[] = [];
  [0, 1, 2].forEach((ji) => {
    const list: { col: number; l: number; key: number }[] = [];
    COLS.forEach((c, ci) => {
      for (let l = 0; l >= 1 - DROP_LEVELS; l--) list.push({ col: ci, l, key: l * 1e4 + c.x - c.z * 10 });
    });
    list.sort((a, b) => b.key - a.key);
    const N = list.length;
    list.forEach((h, n) => {
      const u = n / N;
      const B = DIPS.find((d) => d.jar === ji && u >= d.share[0] - 1e-9 && u < d.share[1] - 1e-9) as Dip;
      const t = dipTimes(B);
      const v = (u - B.share[0]) / (B.share[1] - B.share[0]);
      const take = t.take0 + (t.take1 - t.take0) * v;
      const dep = t.tPour - 1 + (t.tEnd - t.tPour + 1) * v;
      raw.push({ jar: ji, col: h.col, l: h.l, take, dep, land: dep + B.flight, rot0: hopRot(ji * 977 + h.col * 13 + h.l * 3), lane: (n % 5) - 2 });
    });
  });
  raw.sort((a, b) => a.land - b.land);
  return raw.map((r, si) => {
    const s = SLOTS[si];
    const sp = spoutAt(r.dep);
    const landY = r.jar === 0 ? s.yF : s.yC - 7;
    const P = [
      [sp[0] + r.lane * 5, sp[1] + r.lane * 3],
      [sp[0] + 16 + r.lane * 5, sp[1] - 16],
      [s.x, landY - 46],
      [s.x, landY],
    ];
    const pts: [number, number][] = [];
    const cum: number[] = [0];
    const NS = 30;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS;
      const u = 1 - t;
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      pts.push([w[0] * P[0][0] + w[1] * P[1][0] + w[2] * P[2][0] + w[3] * P[3][0], w[0] * P[0][1] + w[1] * P[1][1] + w[2] * P[2][1] + w[3] * P[3][1]]);
      if (i) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    // batch 1: the loupe crushes it; 2 and 3 are crushed into the heap on contact (the landing frame)
    const crush = r.jar === 0 ? Math.max(r.land + 2, lensReaches(s.x, s.yF)) : r.land;
    return { jar: r.jar, col: r.col, l: r.l, take: r.take, dep: r.dep, land: r.land, slot: si, rot0: r.rot0, rot1: s.rot, pts, cum, L: cum[NS], crush, landY };
  });
})();
/** How many hops each jar gives up (all three the same). */
export const HOPS_PER_JAR = FLIGHTS.filter((F) => F.jar === 0).length;
const flightAt = (F: Flight, f: number) => {
  const T = F.land - F.dep;
  const t = f - F.dep;
  const v = F.L / (T - 1);
  const d = t < 2 ? (v * t * t) / 4 : v * (t - 1);
  const s = Math.min(F.L, Math.max(0, d));
  let i = 1;
  while (i < F.cum.length - 1 && F.cum[i] < s) i++;
  const a = F.cum[i - 1];
  const u = (s - a) / Math.max(1e-6, F.cum[i] - a);
  return { x: lerp(F.pts[i - 1][0], F.pts[i][0], u), y: lerp(F.pts[i - 1][1], F.pts[i][1], u), rot: lerp(F.rot0, F.rot1, smoothstep(s / F.L)) };
};
const BY_COL: Flight[][][] = [0, 1, 2].map((_, ji) => COLS.map((_, ci) => FLIGHTS.filter((F) => F.jar === ji && F.col === ci).sort((a, b) => a.take - b.take)));
const BY_JAR: Flight[][] = [0, 1, 2].map((_, ji) => FLIGHTS.filter((F) => F.jar === ji));
const BY_PILE_COL: Flight[][] = pileCols.map((_, ci) => FLIGHTS.filter((F) => SLOTS[F.slot].col === ci).sort((a, b) => SLOTS[a.slot].l - SLOTS[b.slot].l));

// --- the camera ------------------------------------------------------------------------------------------------------
// One medium framing (k 1.65, the full line at y ~720, the dish and the scoop's pour in the upper half), a creep from
// f0; on "And they were losing" a push in on jar 2's top + the dish (k 1.9: the band ~61 px); on "a few percent per
// batch" a pull back to the row of three jars (k 0.86, each ~258 px wide) with the pile.
const START = { x: 165, y: JAR.FULL_Y + 80 / 1.6, k: 1.6 };
const MID = { x: 165, y: JAR.FULL_Y + 80 / 1.65, k: 1.65 };
/** r4: a short push in on the dish (the cones read) as the loupe arrives; held on the test. */
const DISHCAM = { x: 250, y: 505, k: 1.85 };
const PUSH = { x: 165, y: JAR.FULL_Y + 60 / 1.7, k: 1.7 };
/** The end: the row of three (x -150..810) with the heap above it, the bands at y ~820. */
const ROWCAM = { x: 330, y: JAR.FULL_Y - (820 - 960) / 1.03, k: 1.03 };
const CAM = makeClockCam(
  START,
  [
    { f0: -10, f1: 46, dy: MID.y - START.y, k: MID.k },
    { f0: 40, f1: 70, dx: DISHCAM.x - MID.x, dy: DISHCAM.y - MID.y, k: DISHCAM.k },
    { f0: 92, f1: 122, dx: PUSH.x - DISHCAM.x, dy: PUSH.y - DISHCAM.y, k: PUSH.k },
    { f0: 130, f1: 158, dx: ROWCAM.x - PUSH.x, dy: ROWCAM.y - PUSH.y, k: ROWCAM.k }, // settled by ~f 166: the last glow lands on a calm frame
  ],
  DURATION,
);
export const camAt = (f: number): Cam => CAM.at(f);

// --- drawing helpers -------------------------------------------------------------------------------------------------
const arc = arcPts;
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

const clampB = (v: number) => Math.max(0, Math.min(1, v));
/** A jar, front pass: the near glass (hairlines, a reflection), the etched full line + tick, the collar, the foot,
 *  and the amber bracket from the full line down to the hops' level (`gap` px, growing as the level sinks). */
const JarFront: React.FC<{ cx: number; k: number; gap: number; lit: number; glow: number }> = ({ cx, k, gap, lit, glow }) => {
  const uid = `jf${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const R = JAR.R;
  const q = JAR.Q;
  const hw = STROKE.HAIRLINE / k;
  const top = JAR.TOP - JAR.COLLAR;
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
      {/* THE EMPTY BAND: clear glass (the ground shows through); as it finishes emptying a warm glow eases in and
          out inside it once (GLOW_F frames), so the eye goes there */}
      {glow > 0.01 && gap > 1 ? (
        <g>
          <defs>
            <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(JAR.FULL_Y)} x2="0" y2={f2(levelY)}>
              <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f2(0.18 * glow)} />
              <stop offset="1" stopColor={COLOR.amberHot} stopOpacity={f2(0.62 * glow)} />
            </linearGradient>
          </defs>
          <rect x={f2(cx - RI)} y={f2(JAR.FULL_Y)} width={f2(2 * RI)} height={f2(gap)} fill={`url(#${uid}g)`} style={{ filter: `blur(${f2(3 / k)}px)` }} />
        </g>
      ) : null}
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
          <path d={`M${f2(cx - RI)} ${f2(levelY + EDGE.HOT / k / 2)}H${f2(cx + RI)}`} stroke={COLOR.amberHot} strokeWidth={f2(3.5)} />
        </g>
      ) : null}
      {/* the etched full line across the whole front face (the near half of its ring), and its tick on the right */}
      <path d={poly(arc(cx, JAR.FULL_Y, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.inkCream} strokeWidth={f2(5.5)} strokeLinecap="round" />
      <path d={`M${f2(cx + R - 4)} ${f2(JAR.FULL_Y)}H${f2(cx + R + 18)}`} stroke={COLOR.inkCream} strokeWidth={f2(5.5)} strokeLinecap="round" />
      {/* the rim (an open mouth: a thin cream lip, lit top edge) and the foot */}
      <path d={band(cx, top, JAR.TOP, R, q)} fill={`url(#${uid}c)`} />
      <path d={poly(arc(cx, top, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      <path d={poly([...arc(cx, top, R, R * q, LOWER[0], LOWER[1]), ...arc(cx, top, R - 7, (R - 7) * q, LOWER[1], LOWER[0])])} fill={mixHex(COLOR.cream, COLOR.edge, 0.3)} />
      <path d={band(cx, JAR.BOT, JAR.BOT + JAR.FOOT, R, q)} fill={`url(#${uid}c)`} />
      <path d={poly(arc(cx, JAR.BOT, R, R * q, LOWER[0], LOWER[1]), false)} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge * 0.8} strokeWidth={f2(EDGE.CREAM / k)} />
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
    armX0: x - rb * 0.5,
    armTop: baseY + rb * Q * 0.6,
    innerFrontEdge: poly(arc(x, y, ri, ri * Q, LOWER[0], LOWER[1]), false),
    // the arm: from under the dish's foot out past the right edge, its top just under the foot
    arm: poly([[x - rb * 0.5, baseY + rb * Q * 0.6], [x + 3000, baseY + rb * Q * 0.6], [x + 3000, baseY + rb * Q * 0.6 + DISH.ARM], [x - rb * 0.5, baseY + rb * Q * 0.6 + DISH.ARM]]),
  };
};
const DG = dishGeo();

/** The scoop: a cream ladle (bowl + handle), its one shadow, and its heaped scoopful (`heap` 0..1 of a full one). */
const Scoop: React.FC<{ st: { x: number; y: number; a: number }; k: number; heap: number }> = ({ st, k, heap }) => {
  const uid = `sc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const world = (pts: P2[]) => poly(pts.map((p) => rotPt(p, st)));
  const n = Math.round(clampB(heap) * SC_HEAP.length);
  return (
    <g>
      <ElevationShadow silhouette={[{ d: world(SC_BOWL_OUT) }, { d: world(SC_HANDLE_PTS) }]} elevation="float" />
      <g transform={`translate(${f2(st.x)} ${f2(st.y)}) rotate(${f2(st.a)})`}>
        <defs>
          <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1={f2(-SC.rx)} y1="0" x2={f2(SC.rx)} y2="0">
            <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.creamFoot, 0.6)} />
            <stop offset="0.3" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.board, 0.45)} />
          </linearGradient>
        </defs>
        <path d={poly(SC_HANDLE_PTS)} fill={`url(#${uid}c)`} />
        {/* the bowl's inside (in shade), the heaped scoopful, then the bowl's outside and its lit rim */}
        <path d={poly(arcPts(0, 0, SC.rx, SC.ry, 0, 2 * Math.PI, 40))} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.55)} />
        {n > 0 ? (
          <g style={{ filter: bloomFilter(k) }}>
            {SC_HEAP.slice(0, n).map((h, i) => (
              <HopCone key={i} x={h.x} y={h.y} size={HS} rotate={h.rot} k={k} tone="amber" />
            ))}
          </g>
        ) : null}
        <path d={poly([...arcPts(0, 0, SC.rx, SC.ry, Math.PI, 0, 24), ...arcPts(0, 0, SC.rx, SC.depth, 0, Math.PI, 24)])} fill={`url(#${uid}c)`} />
        <path d={poly(arcPts(0, 0, SC.rx, SC.ry, Math.PI, 0, 24), false)} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      </g>
    </g>
  );
};

/** A pile hop, crushed by `c` 0..1: squashed flat, a little finer, dulled to spent (all by tone and shape). */
const PileHop: React.FC<{ id: number; x: number; y: number; rot: number; k: number; c: number }> = ({ id, x, y, rot, k, c }) => {
  const sx = 1 + 0.12 * c;
  const sy = 1 - 0.5 * c;
  const sc = 1 - 0.14 * c;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(sx * sc)} ${f2(sy * sc)}) translate(${f2(-x)} ${f2(-y)})`}>
      <Hop id={id} x={x} y={y} rot={rot} k={k} mix={c} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
const HundredsOfHopsV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const view = viewOf(cam);
  const uid = `hh${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const pool = { x: lerp(160, 330, smoothstep((frame - 132) / 34)), y: 560, strength: 1.35 };

  // --- the jars at this frame
  const jars = [0, 1, 2].map((ji) => {
    const dips = DIPS.filter((d) => d.jar === ji).map(dipTimes);
    const t = { take0: dips[0].take0, tUp: dips[dips.length - 1].tUp };
    const cx = jarX(ji, frame);
    const vis = cx + JAR.R + 40 > view.x0 && cx - JAR.R - 40 < view.x1;
    const hops: { id: number; x: number; y: number; rot: number; z: number; l: number }[] = [];
    let minTop = 0;
    if (vis) {
      COLS.forEach((c, ci) => {
        const gone = BY_COL[ji][ci].filter((F) => F.take <= frame).length;
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
    const taken = BY_JAR[ji].filter((F) => F.take <= frame).length;
    const gap = (DROP * taken) / BY_JAR[ji].length;
    const bulkY = JAR.FULL_Y - (minTop - 1.2) * LAT.dl + RI * JAR.Q;
    const bulk = poly([...arc(cx, bulkY, RI, RI * JAR.Q, Math.PI, 2 * Math.PI), [cx + RI, JAR.BOT + 30], [cx - RI, JAR.BOT + 30]]);
    // the lit level edge rests on a settled surface: it lets go while the scoop is in, returns after
    const lit = 1 - smoothstep((frame - (t.take0 - 3)) / 4) * (1 - smoothstep((frame - (t.tUp - 1)) / 8));
    const levelY = JAR.FULL_Y + gap;
    const clipTop = levelY - (1 - lit) * 200;
    const clip = poly([[cx - RI, clipTop], [cx + RI, clipTop], ...arc(cx, JAR.BOT, RI, RI * JAR.Q, 0, Math.PI)]);
    const g = (frame - BAND_DONE[ji]) / GLOW_F;
    const glow = g > 0 && g < 1 ? Math.sin(Math.PI * g) ** 2 : 0;
    return { ji, cx, vis, hops, gap, bulk, clip, lit, glow };
  });

  // --- the scoop: where it is, how full, and whether it is inside the jar at the sampling point
  const st = scoopAt(frame);
  const takenAll = FLIGHTS.filter((F) => F.take <= frame).length;
  const poured = FLIGHTS.filter((F) => F.dep <= frame).length;
  const heap = Math.min(1, (takenAll - poured) / (HOPS_PER_JAR / 3)); // a heaped scoop = a third of a jar's band
  const stationJar = jars.find((j) => Math.abs(j.cx - STATION) < 30);
  const scoopInside = !!stationJar && st.y + SC.depth > JAR.TOP - JAR.COLLAR && Math.abs(st.x - STATION) < JAR.R;

  // --- the pile in the dish: each hop where it landed, slumping to the crushed heap as it is crushed
  const pileHops: { id: number; x: number; y: number; rot: number; z: number; l: number; c: number }[] = [];
  const colTop: number[] = [];
  const pileSil: string[] = [];
  let cSum = 0;
  let cN = 0;
  BY_PILE_COL.forEach((list, ci) => {
    const landed = list.filter((F) => F.land <= frame);
    const n = landed.length;
    colTop[ci] = Infinity;
    for (let q = Math.max(0, n - 3); q < n; q++) {
      const F = landed[q];
      const s = SLOTS[F.slot];
      const c = smoothstep((frame - F.crush) / (F.jar === 0 ? CRUSH_F : CRUSH_F2));
      const y = lerp(F.landY, s.yC, c);
      pileHops.push({ id: 50000 + F.slot, x: s.x, y, rot: s.rot, z: s.z, l: s.l, c });
      colTop[ci] = Math.min(colTop[ci], y);
      cSum += c;
      cN++;
      if (q === n - 1 && y < DISH.y) pileSil.push(hopSilhouette(s.x, y, HS, s.rot));
    }
  });
  pileHops.sort((a, b) => a.z - b.z || a.l - b.l);
  const pileC = cN ? cSum / cN : 0;
  const pileBulk = (() => {
    const top: P2[] = [];
    const foot: P2[] = [];
    let any = false;
    for (let x = -PI_R; x <= PI_R + 0.1; x += 8) {
      let yt = Infinity;
      let yf = -Infinity;
      pileCols.forEach((c, ci) => {
        if (!Number.isFinite(colTop[ci])) return;
        yt = Math.min(yt, colTop[ci] + 7 + 1.4 * Math.max(0, Math.abs(c.x - x) - PILE.dx * 0.3));
        if (Math.abs(c.x - x) < PILE.dx * 0.9) yf = Math.max(yf, PILE_FLOOR + c.z * PI_R * DISH.Q + 4);
      });
      if (Number.isFinite(yf)) any = true;
      const base = Number.isFinite(yf) ? yf : PILE_FLOOR;
      top.push([DISH.x + x, Math.min(Number.isFinite(yt) ? yt : base, base)]);
      foot.push([DISH.x + x, base]);
    }
    return any ? { d: poly([...top, ...foot.reverse()]), top: poly(top.filter((pt, i) => pt[1] < foot[i][1] - 2), false) } : null;
  })();

  // --- poured from the lip, in flight
  const flying = FLIGHTS.filter((F) => F.dep <= frame && frame < F.land).map((F) => ({ F, ...flightAt(F, frame) }));

  const scoopEl = <Scoop st={st} k={k} heap={heap} />;
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

        {/* the testing dish on its arm */}
        <ElevationShadow silhouette={[{ d: DG.front }, { d: DG.outer }, { d: DG.arm }, ...pileSil.map((d) => ({ d }))]} elevation="rest" />
        <path d={DG.arm} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.3)} />
        <path d={`M${f2(DG.armX0)} ${f2(DG.armTop + EDGE.CREAM / k / 2)}H${f2(DISH.x + 3000)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge * 0.7} strokeWidth={f2(EDGE.CREAM / k)} />
        <path d={DG.inner} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.5)} />
        <path d={DG.ringBack} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.35)} />
        <g clipPath={`url(#${uid}cd)`}>
          {pileBulk ? <path d={pileBulk.d} fill={mixHex(mixHex(COLOR.amberFoot, COLOR.rung, 0.55), mixHex(COLOR.boardFoot, COLOR.board, 0.3), pileC)} /> : null}
          <g style={{ filter: bloomFilter(k) }}>
            {pileHops
              .filter((h) => h.c < 0.999)
              .map((h) => (
                <PileHop key={h.id} id={h.id} x={h.x} y={h.y} rot={h.rot} k={k} c={h.c} />
              ))}
          </g>
          {pileHops
            .filter((h) => h.c >= 0.999)
            .map((h) => (
              <PileHop key={h.id} id={h.id} x={h.x} y={h.y} rot={h.rot} k={k} c={1} />
            ))}
          {pileBulk ? (
            <path d={pileBulk.top} fill="none" stroke={mixHex(COLOR.amberHot, COLOR.cream, pileC)} strokeOpacity={0.5} strokeWidth={f2(5 / k)} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `blur(${f2(2 / k)}px)` }} transform={`translate(0 ${f2(-5)})`} />
          ) : null}
        </g>
        <path d={DG.front} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.4)} />
        <path d={DG.ringFront} fill={mixHex(COLOR.cream, COLOR.edge, 0.3)} />
        <path d={DG.innerFrontEdge} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.6)} strokeWidth={f2(EDGE.CREAM / k)} />

        {/* the line */}
        <ElevationShadow silhouette={[{ d: railD }]} elevation="rest" />
        <path d={`M${view.x0 - 200} ${RAIL.y - RAIL.top}H${view.x1 + 200}V${RAIL.y}H${view.x0 - 200}Z`} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.3)} />
        <path d={`M${view.x0 - 200} ${RAIL.y}H${view.x1 + 200}V${RAIL.y + RAIL.front}H${view.x0 - 200}Z`} fill={mixHex(COLOR.creamFoot, COLOR.board, 0.45)} />
        <path d={`M${view.x0 - 200} ${RAIL.y - RAIL.top + EDGE.CREAM / k / 2}H${view.x1 + 200}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />

        {/* the jars (the scoop inside the one at the sampling point when it is dipped in) */}
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
              {scoopInside && stationJar && stationJar.ji === j.ji ? scoopEl : null}
              <JarFront cx={j.cx} k={k} gap={j.gap} lit={j.lit} glow={j.glow} />
            </g>
          ) : null,
        )}
        {scoopInside ? null : scoopEl}

        {/* the stream from the scoop's lip */}
        {flying.length ? <ElevationShadow silhouette={flying.map((h) => ({ d: hopSilhouette(h.x, h.y, HS, h.rot) }))} elevation="float" /> : null}
        <g style={{ filter: bloomFilter(k) }}>
          {flying.map((h) => (
            <Hop key={h.F.slot} id={60000 + h.F.slot} x={h.x} y={h.y} rot={h.rot} k={k} />
          ))}
        </g>
        {/* the loupe: tests (crushes) the pile on "to see, quality batch or not?" */}
        {frame >= LENS_KEYS[0][0] && frame <= LENS_KEYS[LENS_KEYS.length - 1][0] ? <Lens {...lensAt(frame)} k={k} /> : null}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default HundredsOfHopsV2;
