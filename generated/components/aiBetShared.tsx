// AIBET_SHARED_READY
import React, { useId } from "react";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  GEO,
  STROKE,
  TNUM_ADV,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  numeralWidth,
  rectPath,
  smoothstep,
  type Elevation,
  type Silhouette,
} from "./stoutShared";

// ===========================================================================
// aiBetShared — the world of the "what frontier AI training costs" clip (Cheeky Pint S4E03, Meta;
// Mark Zuckerberg), in the stout system (stoutShared.tsx, palette B1). API notes: SHARED_READY.md.
//
// CLIP-WIDE COLOUR RULE: amber = money committed / compute that is live. Cream = hardware and
// neutral things. Nothing black.
//
// WHAT IS HERE
//   Cluster      a compact block of server-rack cabinets standing on a plinth: ONE object, one union
//                shadow, the stout slot joint (each column of racks stands in a slot of the plinth's
//                top edge and can rise out of it). A rack is a cream card with three fat vent slats;
//                unlit = a dim kraft card with dark-brown slats, lit = cream with glowing amber slats.
//   FreeRack     one rack on its own (a rack that travels between columns), with its own lifted shadow.
//   CostColumn   a low tile with a slot; out of it a solid amber bar (a plain cost) and / or a glass
//                column with an amber fill, an optional lighter band on top (a range) and rungs.
//   CostReadout  the odometer numeral "$NNB", or the range "$NN–MMB" (the second number revealed out
//                of the first), right-aligned; rolls with a vertical blur.
//   COST_U, costH(), RACK, BASE, clusterW(), clusterH(), rackBox(), softMax()
//
// UNITS: world px for geometry (drawn inside StoutStage under the camera); SCREEN px for type,
// hairlines, edges, slot lines and bloom (divide by the camera k). No Meta mark is drawn here: the
// cream Meta infinity lives in fourThingsScene1.tsx (META_D) if a cut needs it.
// ===========================================================================

export const FPS = 24000 / 1001;
/** The stout floor: where plinths and tiles stand (their bottom edge). */
export const FLOOR = GEO.FLOOR; // 1296

// --- money: ONE scale for the clip (world px per $1B) ---------------------------------------------
export const COST_U = 11.5;
/** Height (world px, above a tile's top edge) of `billions` dollars. */
export const costH = (billions: number) => billions * COST_U;

// --- the rack and the bases (WORLD px) -------------------------------------------------------------
export const RACK = {
  W: 52,
  H: 84,
  GAP: 8, // between racks, both ways
  PITCH_X: 60,
  PITCH_Y: 92,
  SLAT_W: 40, // three vent slats per rack
  SLAT_H: 18,
  SLAT_GAP: 6,
  SLAT_TOP: 9,
} as const;
/** Plinths and cost tiles share one height; a plinth overhangs its racks by OVER each side. */
export const BASE = { H: 40, OVER: 8, TILE_W: 80, BAR_W: 56 } as const;
/** An unlit rack's tone: this far from cream toward the kraft board (a tone, never an opacity). */
export const UNLIT_DIM = 1;
/** A cluster's plinth width for `cols` columns. */
export const clusterW = (cols: number) => cols * RACK.PITCH_X - RACK.GAP + 2 * BASE.OVER;
/** The height of `rows` racks above the plinth's top edge. */
export const clusterH = (rows: number) => rows * RACK.PITCH_Y - RACK.GAP;
/** Where rack (col, row) of a cluster stands: row 0 is the BOTTOM row. Top-left corner + size. */
export const rackBox = (x: number, floor: number, cols: number, col: number, row: number) => ({
  x: x - (cols * RACK.PITCH_X - RACK.GAP) / 2 + col * RACK.PITCH_X,
  y: floor - BASE.H - (row + 1) * RACK.PITCH_Y + RACK.GAP,
  w: RACK.W as number,
  h: RACK.H as number,
});
/** A smooth maximum of a and b (blend width w): something at rest that is picked up by a riser. */
export const softMax = (a: number, b: number, w = 40) => {
  const d = a - b;
  return 0.5 * (a + b + Math.sqrt(d * d + w * w)); // = max far from the crossover, max + w/2 at it
};

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ab${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
/** An unlit rack's card: the kraft board pulled a little toward the ground (cool and switched off, never warm). */
const UNLIT_TOP = mixHex(COLOR.board, COLOR.ground, 0.22);
const UNLIT_FOOT = mixHex(COLOR.boardFoot, COLOR.ground, 0.22);
/** The dark slat of an unlit rack: a deep kraft brown (never black). */
const SLAT_DARK = mixHex(COLOR.boardFoot, COLOR.ground, 0.82);

type PerRack = number | ((col: number, row: number) => number);
type PerCol = number | number[] | ((col: number) => number);
const perRack = (v: PerRack | undefined, col: number, row: number, d: number) => (v === undefined ? d : typeof v === "number" ? v : v(col, row));
const perCol = (v: PerCol | undefined, col: number, d: number) =>
  v === undefined ? d : typeof v === "number" ? v : Array.isArray(v) ? v[col] ?? d : (v as (c: number) => number)(col);

/** The three slats of a rack whose top-left corner is (x, y). */
const slatRects = (x: number, y: number) =>
  [0, 1, 2].map((i) => ({
    x: x + (RACK.W - RACK.SLAT_W) / 2,
    y: y + RACK.SLAT_TOP + i * (RACK.SLAT_H + RACK.SLAT_GAP),
    w: RACK.SLAT_W as number,
    h: RACK.SLAT_H as number,
  }));

/** One rack's body (no shadow): card by tone, dark slats, lit top edge. Amber is drawn by the caller. */
const RackBody: React.FC<{ x: number; y: number; lit: number; k: number; id: string }> = ({ x, y, lit, k, id }) => {
  const dim = UNLIT_DIM * (1 - clamp01(lit));
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(COLOR.cream, UNLIT_TOP, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, UNLIT_FOOT, dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, RACK.W, RACK.H, GEO.RADIUS)} fill={`url(#${id})`} />
      {slatRects(x, y).map((s, i) => (
        <rect key={i} x={f2(s.x)} y={f2(s.y)} width={s.w} height={s.h} rx={2} fill={SLAT_DARK} />
      ))}
      <path
        d={`M${f2(x + GEO.RADIUS)} ${f2(y + EDGE.CREAM / k / 2)}H${f2(x + RACK.W - GEO.RADIUS)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim / UNLIT_DIM)}
        strokeWidth={f2(EDGE.CREAM / k)}
      />
    </g>
  );
};
/** One rack's amber: the three slats, at opacity `lit` (light switching on). Draw inside a bloom group. */
const RackAmber: React.FC<{ x: number; y: number; lit: number; fill: string }> = ({ x, y, lit, fill }) =>
  lit <= 0.003 ? null : (
    <g opacity={lit < 1 ? f2(clamp01(lit)) : undefined}>
      {slatRects(x, y).map((s, i) => (
        <rect key={i} x={f2(s.x)} y={f2(s.y)} width={s.w} height={s.h} rx={2} fill={fill} />
      ))}
    </g>
  );

// ===========================================================================
// CLUSTER
// ===========================================================================
export type ClusterProps = {
  /** centre x, world px */
  x: number;
  /** the plinth's bottom edge, world px (default FLOOR) */
  floor?: number;
  /** camera zoom (for the SCREEN-px tokens) */
  k: number;
  /** columns and rows of racks (default 6 x 2: the clip's cluster) */
  cols?: number;
  rows?: number;
  /** racks per column, when the columns differ (a ladder: [1, 2, 3]); default `rows` everywhere */
  heights?: number[];
  /** 0..1 per rack: 0 = unlit (dim kraft, dark slats), 1 = live (cream, glowing amber slats).
   *  A number, or (col, row) => number; row 0 is the bottom row. Default 0. */
  lit?: PerRack;
  /** 0..1 per column: how far the column has risen out of its slot in the plinth (1 = standing).
   *  A number, an array, or (col) => number. Default 1. */
  rise?: PerCol;
  /** true = leave this rack out (it is travelling as a FreeRack) */
  hidden?: (col: number, row: number) => boolean;
  /** the house entrance of the whole object, 0..1 over ~12 f: slide up 24 SCREEN px + fade (default 1) */
  enter?: number;
  /** the plinth's tone, 0 = cream .. 1 = board (default: follows the racks, dim while they are unlit) */
  plinthDim?: number;
  /** extra vertical offset of the whole object (world px) */
  dy?: number;
  elevation?: Elevation;
  /** 0..1 toward the next elevation (while the object travels) */
  lift?: number;
  /** [y0, y1] world: the frame's amber gradient span (amberBandFor(cam)) */
  amberBand?: [number, number];
  /** draw no plinth (racks only; their shadow has no contact line) */
  noPlinth?: boolean;
};

/**
 * Cluster — a block of server racks on its plinth, ONE object with ONE union shadow. Its box:
 * clusterW(cols) wide; the plinth BASE.H tall on `floor`; the racks clusterH(rows) tall above it.
 * World top edge = floor - BASE.H - clusterH(rows).
 */
export const Cluster: React.FC<ClusterProps> = (p) => {
  const uid = uidOf(useId());
  const k = p.k;
  const cols = p.cols ?? 6;
  const rows = p.rows ?? 2;
  const floor = (p.floor ?? FLOOR) + (p.dy ?? 0);
  const en = p.enter === undefined ? 1 : easeOutCubic(p.enter);
  if (en <= 0.001) return null;
  const W = clusterW(cols);
  const left = p.x - W / 2;
  const top = floor - BASE.H; // the plinth's top edge: racks stand here
  const r = GEO.RADIUS;
  const band = p.amberBand ?? [top - clusterH(rows), floor];

  type R = { col: number; row: number; x: number; y: number; lit: number };
  const columns: { col: number; n: number; rise: number; off: number; racks: R[] }[] = [];
  let litSum = 0;
  let litN = 0;
  for (let c = 0; c < cols; c++) {
    const n = Math.max(0, Math.round(p.heights?.[c] ?? rows));
    const rise = clamp01(perCol(p.rise, c, 1));
    const colH = n * RACK.PITCH_Y; // the racks and the gaps under each
    const racks: R[] = [];
    for (let row = 0; row < n; row++) {
      if (p.hidden?.(c, row)) continue;
      const b = rackBox(p.x, floor, cols, c, row);
      const lit = clamp01(perRack(p.lit, c, row, 0));
      racks.push({ col: c, row, x: b.x, y: b.y, lit });
      litSum += lit;
      litN += 1;
    }
    columns.push({ col: c, n, rise, off: (1 - rise) * colH, racks });
  }
  const plinthDim = p.plinthDim ?? UNLIT_DIM * 0.55 * (1 - (litN ? litSum / litN : 0));

  // the union silhouette: the plinth and whatever of each rack stands above it
  const sil: Silhouette = p.noPlinth ? [] : [{ d: rectPath(left, top, W, BASE.H, r) }];
  columns.forEach((c) =>
    c.racks.forEach((q) => {
      const y = q.y + c.off;
      const h = Math.min(RACK.H, top - y);
      if (h > 0.5) sil.push({ d: rectPath(q.x, y, RACK.W, h + (y + RACK.H >= top - 0.01 ? r : 0), r, true, false) });
    }),
  );
  const slotH = EDGE.SLOT / k;
  const slotW = RACK.W + (2 * EDGE.SLOT_LIP) / k;
  const ao = EDGE.FOOT_AO / k;
  const edgeY = top + EDGE.CREAM / k / 2;
  return (
    <g opacity={en < 1 ? f2(en) : undefined} transform={en < 1 ? `translate(0 ${fx(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}p`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(floor)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, plinthDim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, plinthDim)} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        {/* everything of a rack shows only above the plinth's top edge (it rises out of its slot) */}
        <clipPath id={`${uid}up`}>
          <rect x={f2(left - 400)} y={f2(top - 6000)} width={f2(W + 800)} height={6000} />
        </clipPath>
      </defs>

      {/* 1. the one shadow */}
      <ElevationShadow
        silhouette={sil}
        elevation={p.elevation ?? "rest"}
        lift={p.lift ?? 0}
        contact={!p.noPlinth && (p.elevation ?? "rest") === "rest" ? { x: p.x, y: floor, w: W } : null}
      />

      {/* 2. the racks: bodies, then the amber of the live ones in one glow pass */}
      <g clipPath={`url(#${uid}up)`}>
        {columns.map((c) => (
          <g key={c.col} transform={c.off > 0.001 ? `translate(0 ${fx(c.off)})` : undefined}>
            {c.racks.map((q) => (
              <RackBody key={q.row} x={q.x} y={q.y} lit={q.lit} k={k} id={`${uid}r${q.col}_${q.row}`} />
            ))}
          </g>
        ))}
        <g style={{ filter: bloomFilter(k) }}>
          {columns.map((c) => (
            <g key={c.col} transform={c.off > 0.001 ? `translate(0 ${fx(c.off)})` : undefined}>
              {c.racks.map((q) => (
                <RackAmber key={q.row} x={q.x} y={q.y} lit={q.lit} fill={`url(#${uid}a)`} />
              ))}
            </g>
          ))}
        </g>
        {/* the foot occlusion of each standing column */}
        {columns.map((c) =>
          c.n > 0 && c.rise > 0.001 && c.racks.some((q) => q.row === 0) ? (
            <rect key={c.col} x={f2(c.racks[0].x)} y={f2(top - ao)} width={RACK.W} height={f2(ao)} fill={`url(#${uid}ao)`} />
          ) : null,
        )}
      </g>

      {/* 3. the plinth, its lit edge, and the slot line under every column that has left it */}
      {p.noPlinth ? null : (
        <>
          <path d={rectPath(left, top, W, BASE.H, r)} fill={`url(#${uid}p)`} />
          <path d={`M${f2(left + r)} ${f2(edgeY)}H${f2(left + W - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, plinthDim / UNLIT_DIM)} strokeWidth={f2(EDGE.CREAM / k)} />
          {columns.map((c) => {
            if (c.n <= 0) return null;
            const open = smoothstep(c.rise / 0.08); // the slot opens as the column starts
            if (open <= 0.001) return null;
            const cx = rackBox(p.x, floor, cols, c.col, 0).x + RACK.W / 2;
            return <rect key={c.col} x={f2(cx - (slotW * open) / 2)} y={f2(top - slotH / 2)} width={f2(slotW * open)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />;
          })}
        </>
      )}
    </g>
  );
};

/**
 * FreeRack — one rack on its own, travelling: (x, y) = its top-left corner, world px. Its own shadow
 * at `elevation` (default lifted; `lift` 0..1 toward the next level).
 */
export const FreeRack: React.FC<{ x: number; y: number; k: number; lit?: number; elevation?: Elevation; lift?: number; amberBand?: [number, number] }> = ({
  x,
  y,
  k,
  lit = 0,
  elevation = "lifted",
  lift = 0,
  amberBand,
}) => {
  const uid = uidOf(useId());
  const band = amberBand ?? [y, y + RACK.H];
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      <ElevationShadow silhouette={[{ d: rectPath(x, y, RACK.W, RACK.H, GEO.RADIUS) }]} elevation={elevation} lift={lift} />
      <RackBody x={x} y={y} lit={lit} k={k} id={`${uid}r`} />
      <g style={{ filter: bloomFilter(k) }}>
        <RackAmber x={x} y={y} lit={clamp01(lit)} fill={`url(#${uid}a)`} />
      </g>
    </g>
  );
};

// ===========================================================================
// COST COLUMN
// ===========================================================================
export type CostColumnProps = {
  /** centre x, world px */
  x: number;
  /** the tile's bottom edge (default FLOOR) */
  floor?: number;
  k: number;
  tileW?: number; // default BASE.TILE_W
  tileH?: number; // default BASE.H
  barW?: number; // default BASE.BAR_W
  /** a SOLID amber bar out of the slot, its height above the tile's top edge (a plain cost) */
  bar?: number;
  /** the glass column's height above the tile's top edge */
  glass?: number;
  /** the amber fill inside the glass, its height */
  fill?: number;
  /** a lighter amber band on top of the fill (a range: fill .. fill + band), its height */
  band?: number;
  /** rung spacing on the fill (world px), 0 = none */
  rung?: number;
  /** the slot in the tile's top edge, 0 = closed .. 1 = open (default: open when anything stands in it) */
  slot?: number;
  /** the glass hairline, 0 = lo (air) .. 1 = hi (backed by money) */
  glassHi?: number;
  /** the house entrance of the whole object, 0..1 */
  enter?: number;
  amberBand?: [number, number];
};
/** The lighter amber of a range band (a tone of the amber, never a transparency). */
export const AMBER_RANGE = { top: mixHex(COLOR.amberTop, COLOR.amberHot, 0.62), foot: mixHex(COLOR.amberFoot, COLOR.amberHot, 0.5) } as const;

/** The parts of a cost column as world rects (for labels and sweeps). */
export const costColumnGeometry = (p: CostColumnProps) => {
  const tileW = p.tileW ?? BASE.TILE_W;
  const tileH = p.tileH ?? BASE.H;
  const barW = p.barW ?? BASE.BAR_W;
  const floor = p.floor ?? FLOOR;
  const tileTop = floor - tileH;
  const bar = Math.max(0, p.bar ?? 0);
  const glass = Math.max(0, p.glass ?? 0);
  const fill = Math.max(0, Math.min(glass > 0 ? glass : Infinity, p.fill ?? 0));
  const band = Math.max(0, Math.min(glass > 0 ? glass - fill : Infinity, p.band ?? 0));
  const x0 = p.x - barW / 2;
  return {
    tileW,
    tileH,
    barW,
    floor,
    tileTop,
    x0,
    tile: { x: p.x - tileW / 2, y: tileTop, w: tileW, h: tileH },
    bar: bar > 0.05 ? { x: x0, y: tileTop - bar, w: barW, h: bar } : null,
    glass: glass > 0.05 ? { x: x0, y: tileTop - glass, w: barW, h: glass } : null,
    fill: fill > 0.05 ? { x: x0, y: tileTop - fill, w: barW, h: fill } : null,
    band: band > 0.05 ? { x: x0, y: tileTop - fill - band, w: barW, h: band } : null,
  };
};

/**
 * CostColumn — a tile with a slot; out of it a solid amber bar and / or a glass column with an amber
 * fill (+ a lighter range band, + rungs). ONE object, one union shadow; amber blooms (fixed).
 */
export const CostColumn: React.FC<CostColumnProps> = (p) => {
  const uid = uidOf(useId());
  const k = p.k;
  const g = costColumnGeometry(p);
  const en = p.enter === undefined ? 1 : easeOutCubic(p.enter);
  if (en <= 0.001) return null;
  const r = GEO.RADIUS;
  const anything = !!(g.bar || g.glass);
  const slot = clamp01(p.slot ?? (anything ? 1 : 0));
  const bandSpan = p.amberBand ?? [g.tileTop - Math.max(g.bar?.h ?? 0, g.glass?.h ?? 0), g.floor];
  const topOfAmber = g.band ? g.band.y : g.fill ? g.fill.y : null;
  const full = !!(g.glass && topOfAmber !== null && topOfAmber <= g.glass.y + 0.5);
  const sil: Silhouette = [{ d: rectPath(g.tile.x, g.tile.y, g.tile.w, g.tile.h, r) }];
  if (g.bar) sil.push({ d: rectPath(g.bar.x, g.bar.y, g.bar.w, g.bar.h + r, r, true, false) });
  if (g.glass) sil.push({ d: rectPath(g.glass.x, g.glass.y, g.glass.w, g.glass.h, r, true, false), a: 0.3 });
  if (g.fill) sil.push({ d: rectPath(g.fill.x, g.fill.y - (g.band?.h ?? 0), g.fill.w, g.fill.h + (g.band?.h ?? 0), 0) });
  const slotW = (g.barW + (2 * EDGE.SLOT_LIP) / k) * slot;
  const slotH = EDGE.SLOT / k;
  const edgeY = g.tileTop + EDGE.CREAM / k / 2;
  const ao = EDGE.FOOT_AO / k;
  const fall = EDGE.HOT_FALL / k;
  const rungs: number[] = [];
  if (g.fill && (p.rung ?? 0) > 0.5) {
    const n = Math.floor(g.fill.h / (p.rung as number) + 1e-6);
    for (let i = 1; i <= n; i++) {
      const y = g.tileTop - i * (p.rung as number);
      if (y > g.fill.y + (EDGE.HOT + 2) / k) rungs.push(y);
    }
  }
  const hot = (x: number, y: number, w: number, h: number, round: boolean, key: string) => (
    <g key={key}>
      <path d={rectPath(x, y, w, Math.min(fall, h), r, round, false)} fill={`url(#${uid}hf)`} />
      <path d={`M${f2(x + (round ? r : 0))} ${f2(y + EDGE.HOT / k / 2)}H${f2(x + w - (round ? r : 0))}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
    </g>
  );
  const standing = g.bar ? g.bar.h : g.fill ? g.fill.h + (g.band?.h ?? 0) : 0;
  return (
    <g opacity={en < 1 ? f2(en) : undefined} transform={en < 1 ? `translate(0 ${fx(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={bandSpan[0]} y1={bandSpan[1]} />
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(g.tileTop)} x2="0" y2={f2(g.floor)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}rg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={AMBER_RANGE.top} />
          <stop offset="1" stopColor={AMBER_RANGE.foot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. the one shadow */}
      <ElevationShadow silhouette={sil} elevation="rest" contact={{ x: p.x, y: g.floor, w: g.tileW }} />

      {/* 2. the glass body (behind the fill) */}
      {g.glass ? <path d={rectPath(g.glass.x, g.glass.y, g.glass.w, g.glass.h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}

      {/* 3. the tile and its lit edge (it stops at the slot) */}
      <path d={rectPath(g.tile.x, g.tile.y, g.tile.w, g.tile.h, r)} fill={`url(#${uid}t)`} />
      <path
        d={
          slot > 0.001
            ? `M${f2(g.tile.x + r)} ${f2(edgeY)}H${f2(p.x - slotW / 2)}M${f2(p.x + slotW / 2)} ${f2(edgeY)}H${f2(g.tile.x + g.tile.w - r)}`
            : `M${f2(g.tile.x + r)} ${f2(edgeY)}H${f2(g.tile.x + g.tile.w - r)}`
        }
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={f2(EDGE.CREAM / k)}
      />

      {/* 4. amber: the bar, the fill, the range band — one glow pass */}
      <g style={{ filter: bloomFilter(k) }}>
        {g.bar ? <path d={rectPath(g.bar.x, g.bar.y, g.bar.w, g.bar.h, r, true, false)} fill={`url(#${uid}a)`} /> : null}
        {g.fill ? <path d={rectPath(g.fill.x, g.fill.y, g.fill.w, g.fill.h, r, full && !g.band, false)} fill={`url(#${uid}a)`} /> : null}
        {g.band ? <path d={rectPath(g.band.x, g.band.y, g.band.w, g.band.h, r, full, false)} fill={`url(#${uid}rg)`} /> : null}
      </g>
      {rungs.length ? (
        <g stroke={COLOR.rung} strokeWidth={f2(STROKE.HAIRLINE / k)}>
          {rungs.map((y) => (
            <line key={y} x1={f2(g.x0)} x2={f2(g.x0 + g.barW)} y1={f2(y)} y2={f2(y)} />
          ))}
        </g>
      ) : null}
      {/* hot edges: the true top surface; the fill's top stays a line under a range band */}
      {g.bar ? hot(g.bar.x, g.bar.y, g.bar.w, g.bar.h, true, "hb") : null}
      {g.fill && !g.band ? hot(g.fill.x, g.fill.y, g.fill.w, g.fill.h, full, "hf") : null}
      {g.band ? hot(g.band.x, g.band.y, g.band.w, g.band.h, full, "hr") : null}
      {g.fill && g.band ? <line x1={f2(g.x0)} x2={f2(g.x0 + g.barW)} y1={f2(g.fill.y)} y2={f2(g.fill.y)} stroke={COLOR.rung} strokeWidth={f2(STROKE.HAIRLINE / k)} /> : null}

      {/* 5. the joint: the foot occlusion and the slot line */}
      {standing > 0.05 ? <rect x={f2(g.x0)} y={f2(g.tileTop - Math.min(standing, ao))} width={f2(g.barW)} height={f2(Math.min(standing, ao))} fill={`url(#${uid}ao)`} /> : null}
      {slot > 0.001 ? <rect x={f2(p.x - slotW / 2)} y={f2(g.tileTop - slotH / 2)} width={f2(slotW)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} /> : null}

      {/* 6. the glass hairline: sides and top, open at its base */}
      {g.glass
        ? (() => {
            const s = STROKE.HAIRLINE / k / 2;
            const xa = g.glass.x + s;
            const xb = g.glass.x + g.glass.w - s;
            const ya = g.glass.y + s;
            const rr = Math.min(r, g.glass.h);
            return (
              <path
                d={`M${f2(xa)} ${f2(g.tileTop)}V${f2(ya + rr)}A${rr} ${rr} 0 0 1 ${f2(xa + rr)} ${f2(ya)}H${f2(xb - rr)}A${rr} ${rr} 0 0 1 ${f2(xb)} ${f2(ya + rr)}V${f2(g.tileTop)}`}
                fill="none"
                stroke={COLOR.glass}
                strokeOpacity={lerp(ALPHA.glassLo, ALPHA.glassHi, clamp01(p.glassHi ?? 0))}
                strokeWidth={f2(STROKE.HAIRLINE / k)}
              />
            );
          })()
        : null}
    </g>
  );
};

// ===========================================================================
// COST READOUT — "$NNB" counting, or the range "$NN–MMB"
// ===========================================================================
const DASH_ADV = 0.542; // Söhne Dreiviertelfett en dash (fontTools)
/** The advance width (SCREEN px) of a settled readout: "$50B", or "$50–60B" with `hi`. */
export const readoutWidth = (px: number, lo: number, hi?: number) =>
  numeralWidth(`$${Math.round(lo)}`, px) + (hi === undefined ? 0 : DASH_ADV * px + numeralWidth(`${Math.round(hi)}`, px) + 2 * TRACK.numeral * px) + TRACK.numeral * px + numeralWidth("B", px);

/** A whole number rolling as an odometer: every digit that differs between floor(v) and floor(v)+1
 *  rolls by the eased fraction. Right edge at xr; returns its advance through `onWidth`-free layout. */
const RollDigits: React.FC<{ xr: number; y: number; fs: number; value: number; prefix?: string; blurId: string | null }> = ({ xr, y, fs, value, prefix = "", blurId }) => {
  const v = Math.max(0, value);
  const lo = Math.floor(v + 1e-9);
  const frac = clamp01(v - lo);
  const a = `${prefix}${lo}`;
  const b0 = `${prefix}${lo + 1}`;
  const n = Math.max(a.length, b0.length);
  const A = a.padStart(n, " ");
  const B = (frac > 1e-6 ? b0 : a).padStart(n, " ");
  const roll = smoothstep(frac);
  const adv = (c: string) => (c === " " ? 0 : /\d/.test(c) ? TNUM_ADV * fs : numeralWidth(c, fs));
  const track = TRACK.numeral * fs;
  let right = xr;
  const cells: { c: string; d: string; cx: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const w = lerp(adv(A[i]), adv(B[i]), roll);
    const here = lerp(A[i] === " " ? 0 : 1, B[i] === " " ? 0 : 1, roll);
    cells.unshift({ c: A[i], d: B[i], cx: right - w / 2 });
    right -= w + track * here;
  }
  return (
    <g textAnchor="middle">
      {cells.map((q, i) => {
        if (q.c === q.d) return q.c === " " ? null : <text key={i} x={f2(q.cx)} y={f2(y)}>{q.c}</text>;
        const off = roll * fs;
        return (
          <g key={i} filter={blurId ? `url(#${blurId})` : undefined}>
            {q.c !== " " ? <text x={f2(q.cx)} y={f2(y - off)}>{q.c}</text> : null}
            {q.d !== " " ? <text x={f2(q.cx)} y={f2(y + fs - off)}>{q.d}</text> : null}
          </g>
        );
      })}
    </g>
  );
};
/** The advance (world px) of "$" + a rolling whole number at value v (tabular digits). */
const rollWidth = (fs: number, value: number, prefix: string) => {
  const lo = Math.floor(Math.max(0, value) + 1e-9);
  const frac = clamp01(Math.max(0, value) - lo);
  const w = (s: string) => [...s].reduce((acc, c) => acc + (/\d/.test(c) ? TNUM_ADV * fs : numeralWidth(c, fs)), 0) + TRACK.numeral * fs * (s.length - 1);
  return lerp(w(`${prefix}${lo}`), w(`${prefix}${lo + 1}`), frac > 1e-6 ? smoothstep(frac) : 0);
};

/**
 * CostReadout — Söhne Dreiviertelfett, cream, RIGHT-ALIGNED at world x (its "B" never moves), y = the
 * baseline. `value` (billions, any float) rolls as an odometer. With `hi` and `reveal` > 0 it becomes
 * the range "$<value>–<hi>B": the "–<hi>" part is revealed out of the "B" (a clip that opens to the
 * left, 0..1) while "$<value>" slides left to make room; `hi` rolls too. `rollBlur` = SCREEN px of
 * vertical blur on rolling digits (pass it proportional to the roll speed, 0 at rest). `enter` /
 * `exit` 0..1 = the house entrance (slide up 24 SCREEN px + fade + blur).
 */
export const CostReadout: React.FC<{
  x: number;
  y: number;
  k: number;
  px: number;
  value: number;
  hi?: number;
  reveal?: number;
  rollBlur?: number;
  enter?: number;
  exit?: number;
  color?: string;
}> = ({ x, y, k, px, value, hi, reveal = 0, rollBlur = 0, enter = 1, exit = 0, color = COLOR.inkCream }) => {
  const uid = uidOf(useId());
  const a = easeOutCubic(enter);
  const e = 1 - Math.pow(1 - clamp01(exit), 3);
  const opacity = a * (1 - e);
  if (opacity <= 0.002) return null;
  const blur = 6 * (1 - a) + 6 * e;
  const fs = px / k;
  const yy = y + ((1 - a) * 24 + e * 24) / k;
  const track = TRACK.numeral * fs;
  const wB = numeralWidth("B", fs);
  const rev = hi === undefined ? 0 : clamp01(reveal);
  const xB = x - wB; // the left edge of "B"
  const wHi = hi === undefined ? 0 : DASH_ADV * fs + track + rollWidth(fs, hi, "") + track;
  const xLo = xB - track - rev * wHi; // the right edge of "$<value>"
  const wLo = rollWidth(fs, value, "$");
  const blurId = rollBlur > 0.05 ? `${uid}v` : null;
  return (
    <g opacity={f2(opacity)} style={{ filter: blur > 0.05 ? `blur(${f2(blur / k)}px)` : undefined }}>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f2(xLo - wLo - fs)} y={f2(yy - fs * 0.9)} width={f2(x - xLo + wLo + 2 * fs)} height={f2(fs * 1.06)} />
        </clipPath>
        <clipPath id={`${uid}h`}>
          <rect x={f2(xB - rev * wHi)} y={f2(yy - fs * 0.9)} width={f2(rev * wHi)} height={f2(fs * 1.06)} />
        </clipPath>
        {blurId ? (
          <filter id={blurId} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f2(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${uid}c)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} fill={color} style={{ fontFeatureSettings: '"lnum" 1' }}>
        <RollDigits xr={xLo} y={yy} fs={fs} value={value} prefix="$" blurId={blurId} />
        {hi !== undefined && rev > 0.001 ? (
          <g clipPath={`url(#${uid}h)`}>
            {/* the "–<hi>" rides on the right of "$<value>" and comes out from behind the "B" */}
            <RollDigits xr={xLo + wHi - track} y={yy} fs={fs} value={hi} blurId={blurId} />
            <text x={f2(xLo + (DASH_ADV * fs) / 2 + track)} y={f2(yy)} textAnchor="middle">
              –
            </text>
          </g>
        ) : null}
        <text x={f2(xB)} y={f2(yy)} textAnchor="start">
          B
        </text>
      </g>
    </g>
  );
};
