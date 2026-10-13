import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import {
  COLOR,
  ElevationShadow,
  FONT_LABEL,
  GEO,
  Label,
  LightSweep,
  METRIC,
  StoutStage,
  TRACK,
  amberBandFor,
  camFor,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
} from "./stoutShared";
import { BASE, Cluster, CostColumn, CostReadout, FLOOR, RACK, clusterH, clusterW, costH, rackBox } from "./aiBetShared";

// ---------------------------------------------------------------------------
// OthersWantOurCompute — "what frontier AI training costs" clip (Cheeky Pint S4E03, Meta; Mark
// Zuckerberg), Cheeky Pint S4 "stout" style (stoutShared.tsx, palette B1; world: aiBetShared.tsx,
// the same Cluster and CostColumn as CapexUpFront / AllTheOtherParts).
// 1080x1920, 23.976 fps, opaque, 187 frames.
//
// CHECK LINE: If Meta's own product never fills the cluster, other companies will take every rack,
// so the money is not stranded.
//
// THE LINE (frames from composition start): "Well(4), I think the other(18) piece is(23), I don't(43)
// actually think(50) it's quite(58) as risky(68) as this(86). One is(97) if AI(109) works(115)
// overall(124), plenty(136) of other people(146) want(151) all(158) our compute(165), right?(182)"
//
// COLOUR: amber = money committed / compute that is live. Cream = hardware, and here also the outside
// customers. Nothing black.
//
// ONE SENTENCE OF MOTION: the camera leaves the full cost column for the dark cluster, and outside
// customers (cream dots) come in from all four sides, take a rack each (the rack comes on when its
// dot has landed) until every rack is live, and the rest queue in one closed ring around it.
//
// FRAME TABLE (see DOCKS, QUEUE, T)
//   f 0        settled and alive: the 6x2 cluster (622 px wide), every rack dark, its standby lamps
//              blinking slowly (META'S COMPUTE on its plinth), beside the full glass column with
//              $50-60B at its 50-60 band (cut 1's lockup). The camera is already moving.
//   f 0-84     the camera travels from the column to the cluster and closes in (the floor rises from
//              screen y 1300 to 1075); the figure is anchored to the column and travels off with it
//              (no fade); the column is out of frame by ~f 60
//   f ~60-72   the first outside dots are in frame (top edge, left edge), on their lanes
//   f 90-102   OTHER BUYERS slides up under the cluster, below the caption strip: no lane runs
//              through it (the bottom rank walks in from the sides, above it)
//   f 92       the first dot lands on a rack (contact f 92, the rack comes on f 92-99)
//   f 92-156   twelve landings, slow then quick: 92 102 110 117 123 129 134 139 144 148 152 156, from
//              the left, the top, the right and from below (the two bottom-corner racks: their dots
//              come up past the plinth's ends and turn in, never over the plinth); inner racks first
//   f 149-172  more dots than racks: the latecomers stop short and close one ring around the cluster:
//              the top rank comes down as one arc (f 149-153), the bottom rank walks in from both
//              sides as two evenly spaced files and halts together (f 160), the two side ranks
//              come in from the frame edges as formed ranks (f 163-165); a slow ripple runs along the queue
//   f 163      every rack is live -> "all our compute"
//   f 164-176  the one light sweep, across the live racks
//   f 176-186  settled: the queue ripples, slow camera creep, sway, grain
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 187;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (WORLD px) ----------------------------------------------------------------------------
const COLS = 6;
const ROWS = 2;
const XC = 400; // the cluster (= CapexUpFront's X_CLUSTER)
const GAP = 140; // cluster to column: wider than cut 1's 32, so the column clears the frame when the cluster is centred
const XCOL = XC + clusterW(COLS) / 2 + GAP + BASE.TILE_W / 2; // 744
const TILE_TOP = FLOOR - BASE.H;
const CLUSTER_TOP = TILE_TOP - clusterH(ROWS); // 1080
const RUN_H = costH(15);
const LO_H = costH(50);
const HI_H = costH(60);

// --- the customers -------------------------------------------------------------------------------------
const DOT_R = 13; // a customer (about 50 screen px across at the settled camera)
const SPEED = 12; // world px per frame on a lane (constant; about 24 screen px / f)
const DECEL = 10; // frames of slowing into a landing
const LIT_F = 7; // a rack comes on over this many frames, from the contact frame
type Side = "L" | "T" | "R" | "B";
type Dot = { id: string; tx: number; ty: number; dx: number; dy: number; T: number; queue: boolean; phase: number; bend?: 1 | -1 };
const DIR: Record<Side, [number, number]> = { L: [1, 0], T: [0, 1], R: [-1, 0], B: [0, -1] };
const rackCentre = (col: number, row: number) => {
  const b = rackBox(XC, FLOOR, COLS, col, row);
  return { x: b.x + RACK.W / 2, y: b.y + RACK.H / 2 };
};
/** The twelve landings: [side, col, row (0 = bottom), contact frame]. Inner racks first on every lane. */
const DOCKS: [Side, number, number, number][] = [
  ["L", 1, 0, 92],
  ["T", 2, 0, 102],
  ["R", 4, 1, 110],
  ["T", 3, 0, 117],
  ["L", 1, 1, 123],
  ["R", 4, 0, 129],
  ["T", 2, 1, 134],
  ["T", 3, 1, 139],
  ["B", 0, 0, 144],
  ["R", 5, 1, 148],
  ["L", 0, 1, 152],
  ["B", 5, 0, 156],
];
const dockT = (col: number, row: number) => DOCKS.find((d) => d[1] === col && d[2] === row)![3];

/** The queue: ONE closed ring, a full rank on each of the four sides. The bottom rank stands below the
 *  caption strip (screen y >= 1270) and the side ranks run down to it. */
const RING = 35; // slot pitch and the first rank's distance from the racks
const RX = clusterW(COLS) / 2 - BASE.OVER + RING - 1; // 210: the side ranks' x offset
const Y_TOP = CLUSTER_TOP - RING + 1; // 1046
const Y_BOT = FLOOR + 112; // 1408: screen y ~1300 at the settled camera
const SIDE_N = 9;
const SIDE_PITCH = (Y_BOT - (CLUSTER_TOP + 1)) / SIDE_N; // ~36.3
const QUEUE: Dot[] = (() => {
  const out: Dot[] = [];
  // top rank: 13 slots, from above, as one symmetric arc (the middle leads)
  for (let i = 0; i < 13; i++) {
    out.push({ id: `t${i}`, tx: XC + (i - 6) * RING, ty: Y_TOP, dx: 0, dy: 1, T: 149 + 0.11 * (i - 6) * (i - 6), queue: true, phase: i * 0.55 });
  }
  // bottom rank: 13 slots; two files walk in along the rank from the left and the right, one slot
  // pitch apart, and halt together
  for (let i = 0; i < 13; i++) {
    out.push({ id: `b${i}`, tx: XC + (i - 6) * RING, ty: Y_BOT, dx: i <= 6 ? 1 : -1, dy: 0, T: 160, queue: true, phase: 14 - i * 0.55 });
  }
  // the two sides: each comes in from its frame edge as one formed rank, a shallow arc (after the
  // last landing has used the side lanes)
  for (let j = 0; j < SIDE_N; j++) {
    const y = CLUSTER_TOP + 1 + j * SIDE_PITCH;
    out.push({ id: `l${j}`, tx: XC - RX, ty: y, dx: 1, dy: 0, T: 163 + 0.09 * (j - 4) * (j - 4), queue: true, phase: -1 - j * 0.55 });
    out.push({ id: `r${j}`, tx: XC + RX, ty: y, dx: -1, dy: 0, T: 163 + 0.09 * (j - 4) * (j - 4), queue: true, phase: 7.6 + j * 0.55 });
  }
  return out;
})();
/** A bottom-corner landing: up a lane past the plinth's end, a quarter turn, then in to the rack. */
const BEND = { lane: 55, r: 30 } as const; // the lane's distance outside the rack's centre; the turn's radius
const bendPos = (tx: number, ty: number, sign: 1 | -1, rem: number) => {
  const a = BEND.lane - BEND.r;
  const arc = (Math.PI / 2) * BEND.r;
  if (rem <= a) return { x: tx - sign * rem, y: ty };
  if (rem <= a + arc) {
    const th = (rem - a) / BEND.r;
    return { x: tx - sign * (a + BEND.r * Math.sin(th)), y: ty + BEND.r - BEND.r * Math.cos(th) };
  }
  return { x: tx - sign * BEND.lane, y: ty + BEND.r + (rem - a - arc) };
};
const DOTS: Dot[] = [
  ...DOCKS.map(([side, col, row, T], i) => {
    const c = rackCentre(col, row);
    return { id: `d${i}`, tx: c.x, ty: c.y, dx: DIR[side][0], dy: DIR[side][1], T, queue: false, phase: 0, bend: side === "B" ? ((col < COLS / 2 ? 1 : -1) as 1 | -1) : undefined };
  }),
  ...QUEUE,
];
/** How far a dot still has to go at frame f (constant speed, then DECEL frames of slowing to rest). */
const remaining = (f: number, T: number) => {
  if (f >= T) return 0;
  if (f >= T - DECEL) return (SPEED * (T - f) * (T - f)) / (2 * DECEL);
  return SPEED * (T - DECEL - f) + (SPEED * DECEL) / 2;
};

// --- the frame table ----------------------------------------------------------------------------------
const T = { cam: 84, panEnd: 58, buyers: 90, sweep: [164, 176] } as const;
const ENTER_F = 12;
const smoother = (v: number) => {
  const u = clamp01(v);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

// --- the camera: one travel from the column to the cluster, then a slow creep that never stops ---------
const K0 = 1.69; // the cluster 622 px wide on f 0, the whole column in frame
const K1 = 2.0; // settled: the cluster ~745-760 px wide, every resting dot well inside the frame
const FLOOR_Y0 = 1300; // the floor's screen y on f 0 (the column's top at ~66)
const FLOOR_Y1 = 1075; // settled: the racks centred at ~y 800, the plinth above the captions
const PRE = 10; // the travel is already under way on f 0
const travelOver = (f: number, dur: number) => {
  const s = (x: number) => smoother(x / (dur + PRE));
  return clamp01((s(f + PRE) - s(PRE)) / (1 - s(PRE)));
};
const travel = (f: number) => travelOver(f, T.cam);
/** The pan finishes before the push-in, so the column crosses the frame edge at speed (no lingering sliver). */
const travelX = (f: number) => travelOver(f, T.panEnd);
const camAt = (f: number): Cam => {
  const e = travel(f);
  const k = Math.exp(lerp(Math.log(K0), Math.log(K1), e)) * (1 + 0.03 * (f / (DURATION - 1)));
  return camFor(XC, FLOOR, lerp(354, 540, travelX(f)), lerp(FLOOR_Y0, FLOOR_Y1, e), k);
};

// --- the Meta infinity (Wikimedia "Meta Platforms Inc. logo (cropped)", 287.56 x 191), as fourThingsScene1 draws it
const META_D = [
  "m31.06,125.96c0,10.98 2.41,19.41 5.56,24.51 4.13,6.68 10.29,9.51 16.57,9.51 8.1,0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07,0 41.14,12.21 56.5,35.11 16.81,25.08 24.97,56.67 24.97,89.27 0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75l0-31.02c17.63,0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16.05c-18.2,32.27-22.81,39.62-31.91,51.75-15.95,21.24-29.57,29.29-47.5,29.29-21.27,0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z",
  "m24.49,37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65,0 27.22,4.04 41.39,15.61 15.5,12.65 32.02,33.48 52.63,67.81l7.39,12.32c17.84,29.72 27.99,45.01 33.93,52.22 7.64,9.26 12.99,12.02 19.94,12.02 17.63,0 22.03-16.2 22.03-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27,0-22.69,8.61-31.41,21.78z",
  "m82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78-12.33,18.61-19.88,46.33-19.88,72.95 0,10.98 2.41,19.41 5.56,24.51l-26.48,17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z",
];
const META_BOX = { w: 287.56, h: 191 };

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `ow${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const circle = (x: number, y: number, r: number) => `M${f2(x - r)} ${f2(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** The plate on the plinth: the Meta mark and META'S COMPUTE, in ink, at a fixed WORLD size (it is
 *  part of the object, so it grows with it). Centred on the plinth. */
const PLATE = { font: 26, mark: 24, gap: 10, textEm: 9.15 } as const; // textEm: the caps line's advance in em (tracked)
const Plate: React.FC = () => {
  const markW = (PLATE.mark * META_BOX.w) / META_BOX.h;
  const textW = PLATE.textEm * PLATE.font;
  const x0 = XC - (markW + PLATE.gap + textW) / 2;
  const cy = FLOOR - BASE.H / 2 + 0.5;
  const s = PLATE.mark / META_BOX.h;
  return (
    <g fill={COLOR.inkDark}>
      <g transform={`translate(${f2(x0)} ${f2(cy - PLATE.mark / 2)}) scale(${f2(s)})`}>
        {META_D.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <text
        x={f2(x0 + markW + PLATE.gap)}
        y={f2(cy + (METRIC.cap * PLATE.font) / 2)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={PLATE.font}
        letterSpacing={`${TRACK.label}em`}
        style={{ fontFeatureSettings: '"case" 1' }}
      >
        META’S COMPUTE
      </text>
    </g>
  );
};

const OthersWantOurCompute: React.FC<Props> = () => {
  const uid = uidOf(useId());
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const e = travel(f);

  // --- the racks: each comes on from its own contact frame
  const lit = (col: number, row: number) => smoothstep((f - dockT(col, row)) / LIT_F);

  // --- the dots at f
  const viewL = cam.x - 560 / k;
  const viewR = cam.x + 560 / k;
  const viewT = cam.y - 980 / k;
  const viewB = cam.y + 980 / k;
  const dots = DOTS.map((d) => {
    const rem = remaining(f, d.T);
    // a queued dot never quite stands still: a small shuffle along its lane
    const settle = d.queue && f > d.T ? 1.8 * Math.sin(f / 7 - d.phase) * smoothstep((f - d.T) / 12) : 0;
    const q = d.bend ? bendPos(d.tx, d.ty, d.bend, rem) : { x: d.tx - d.dx * (rem + settle), y: d.ty - d.dy * (rem + settle) };
    return { ...d, x: q.x, y: q.y, lift: smoothstep(rem / 50) };
  }).filter((d) => d.x > viewL - 40 && d.x < viewR + 40 && d.y > viewT - 40 && d.y < viewB + 40);

  // --- the column's figure, as cut 1 left it: caps centred on the 50-60 band, anchored to the column
  //     at a fixed WORLD size, so it travels off with the column
  const COUNT_PX = (120 * k) / K0;
  const capH = (METRIC.fig * COUNT_PX) / k;
  const countX = XCOL - BASE.BAR_W / 2 - 28 / K0;
  const countY = TILE_TOP - (LO_H + (HI_H - LO_H) / 2 - capH / 2);

  const racks = Array.from({ length: COLS * ROWS }, (_, i) => rackBox(XC, FLOOR, COLS, i % COLS, Math.floor(i / COLS)));
  const sweep = (f - T.sweep[0]) / (T.sweep[1] - T.sweep[0]);
  // OTHER BUYERS stands under the bottom rank's place (below the caption strip): no lane runs through it
  const BUYERS_PX = 80;
  const buyersY = Y_BOT + DOT_R + (30 + METRIC.cap * BUYERS_PX) / k;
  // the standby lamp of a dark rack: a slow blink, by tone; it goes out as the rack comes on
  const LAMP_OFF = mixHex(COLOR.boardFoot, COLOR.ground, 0.62);
  const lampOn = (col: number, row: number) => {
    const u = (((f + col * 19 + row * 31) % 54) + 54) % 54;
    return smoothstep(u / 5) * (1 - smoothstep((u - 13) / 6));
  };

  return (
    <StoutStage
      S={f}
      cam={cam}
      rest={camAt(0)}
      pool={{ x: lerp(XCOL - 150, XC, e), y: lerp(TILE_TOP - 330, CLUSTER_TOP + 60, e) }}
    >
      <defs>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <clipPath id={`${uid}r`}>
          {racks.map((b, i) => (
            <path key={i} d={rectPath(b.x, b.y, b.w, b.h, GEO.RADIUS)} />
          ))}
        </clipPath>
      </defs>

      {/* the money, spent: the full column and its figure (the camera leaves them) */}
      <CostColumn x={XCOL} k={k} glass={HI_H} fill={LO_H} band={HI_H - LO_H} rung={RUN_H} glassHi={1} amberBand={band} />
      <CostReadout x={countX} y={countY} k={k} px={COUNT_PX} value={50} hi={60} reveal={1} />

      {/* Meta's cluster */}
      <Cluster x={XC} k={k} cols={COLS} rows={ROWS} lit={lit} amberBand={band} />
      <Plate />
      {racks.map((b, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const l = lit(col, row);
        return l >= 0.999 ? null : (
          <circle key={i} cx={f2(b.x + RACK.W - 9)} cy={f2(b.y + 4.8)} r={2.9} fill={mixHex(LAMP_OFF, COLOR.cream, 0.08 + 0.92 * lampOn(col, row))} opacity={l > 0 ? f2(1 - l) : undefined} />
        );
      })}
      <g clipPath={`url(#${uid}r)`}>
        <LightSweep x={XC - clusterW(COLS) / 2} y={CLUSTER_TOP} w={clusterW(COLS)} h={clusterH(ROWS)} k={k} t={sweep} on="cream" r={0} />
      </g>

      <Label x={XC} y={buyersY} k={k} text="OTHER BUYERS" px={BUYERS_PX} tone="cream" enter={clamp01((f - T.buyers) / ENTER_F)} />

      {/* the outside customers: every dot its own object, lifted while it travels, at rest once landed */}
      {dots.map((d) => (
        <g key={d.id}>
          <ElevationShadow silhouette={[{ d: circle(d.x, d.y, DOT_R) }]} elevation="rest" lift={d.lift} />
          <path d={circle(d.x, d.y, DOT_R)} fill={`url(#${uid}d)`} />
        </g>
      ))}
    </StoutStage>
  );
};

export default OthersWantOurCompute;
