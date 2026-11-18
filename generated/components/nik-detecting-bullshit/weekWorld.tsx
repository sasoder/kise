import React, { useId } from "react";
import { random } from "remotion";
import { ALPHA, COLOR, EDGE, ElevationShadow, FONT_LABEL, METRIC, STROKE, TRACK, clamp01, labelWidth, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { bustPaths, restToRest, winU } from "../kits/cheeky-pint/museShared";
import { FaceInk } from "./kpiWorld";

// ===========================================================================
// weekWorld — the world of cut 5 `HyperScheduledWeek` (nik-detecting-bullshit, Cheeky Pint S4E06). The stout
// board of the clip's other board cuts (kpiWorld: cream cards, one key light, one contact shadow per object, ink
// print on the face with the house ink entrance). Nothing here is imported from another cut except kpiWorld's
// FaceInk (the clip's ink entrance) and SHIFT_Y (in the cut).
//
//   THE HEADER   one cream strip across the week, MON TUE WED THU FRI in ink Kräftig caps over the five
//                columns, a slot line in its bottom edge over each column (the blocks come out of it).
//   THE COLUMNS  five lanes (a faint board inlay) with thin hour rules across the week behind them, the
//                quarter-hour grid U: a 15-min block is one slot, a 30-min block two (each slot keeps G/2 of
//                gap top and bottom, so blocks stack edge to edge with an even gap G and sit on the hour rules).
//   THE BLOCKS   cream meeting cards. Each slides down out of the header's slot and falls to rest on the one
//                below (gravity: a column fills from the bottom up; its top block lands last). One eased move
//                each (rest to rest, no bounce), lifted while it travels. The schedule (start frame per block)
//                is solved at load so a block never touches the one under it on any sub-frame.
// All geometry in WORLD px. The wide state is k ~0.97 (world ~ screen); the close state k ~2.4.
// ===========================================================================

// --- geometry (WORLD px) ------------------------------------------------------------------------------
export const COL_W = 162;
export const GUTTER = 14;
export const PITCH = COL_W + GUTTER;
export const N_COLS = 5;
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
/** Column i's centre x; WED (i = 2) sits on x 540. */
export const colX = (i: number) => 540 + (i - 2) * PITCH;
export const WEEK_X0 = colX(0) - COL_W / 2;
export const WEEK_X1 = colX(N_COLS - 1) + COL_W / 2;
/** The header strip: its top, height, its overhang past the outer columns, the day names' size. */
export const HEAD = { TOP: 300, H: 56, OVER: 6, FS: 34 } as const;
export const HEAD_BOT = HEAD.TOP + HEAD.H;
export const HEAD_X0 = WEEK_X0 - HEAD.OVER;
export const HEAD_X1 = WEEK_X1 + HEAD.OVER;
/** The quarter-hour slot, the gap between blocks, the slots per column (24 = six hours). REV 1: U is sized so
 *  WED's header + its five labelled blocks (1 + 2 + 3 x 2 slots) fit the keep-in box at the close k ~2.4. */
export const U = 28;
export const G = 5;
export const N_SLOTS = 24;
export const COL_TOP = HEAD_BOT;
export const COL_BOT = COL_TOP + N_SLOTS * U;
export const RADIUS = 4;
/** A block's world box from its first slot and its length in slots. */
export const slotTop = (s0: number) => COL_TOP + s0 * U + G / 2;
export const slotH = (n: number) => n * U - G;

// --- the week's blocks ---------------------------------------------------------------------------------
/** WED's top five, top down: the 15-min, the 30-min, then the three named meetings (30 min each). */
export const WED_TOP = [1, 2, 2, 2, 2] as const;
export const WED_KIND = ["15", "30", "business", "product", "oneonone"] as const;
export type Kind = (typeof WED_KIND)[number];
/** Each column's blocks top down, in slots (1 = 15 min, 2 = 30 min); seeded, summing to N_SLOTS. */
const pattern = (c: number): number[] => {
  const out: number[] = c === 2 ? [...WED_TOP] : [];
  let sum = out.reduce((a, b) => a + b, 0);
  let i = 0;
  while (sum < N_SLOTS) {
    let n = random(`hsw-${c}-${i++}`) < 0.5 ? 1 : 2;
    if (sum + n > N_SLOTS) n = 1;
    out.push(n);
    sum += n;
  }
  return out;
};

export type Block = {
  key: string;
  c: number;
  /** index top down in its column (0 = the top block, under the header) */
  i: number;
  n: number;
  /** resting top, height (world) */
  top: number;
  h: number;
  /** hidden start: its bottom edge on the header's bottom edge */
  startTop: number;
  t0: number;
  D: number;
  kind?: Kind;
};

/** The fall: rest to rest (P 2 = smoothstep: a slide out of the slot, an eased landing, no bounce). */
export const FALL_P = 2.0;
/** Fall duration: D0 + distance / FALL_SPEED (frames). */
export const D0 = 7;
export const FALL_SPEED = 50;
/** The cascade: column c's bottom block starts at T0 + c x STAGGER; the next block in a column leaves the
 *  slot no sooner than MIN_STEP after the one before, and later if needed to stay a full gap G above it. */
export const T0 = -51;
export const STAGGER = 4;
export const MIN_STEP = 2.0;

export const blockTopAt = (b: Block, S: number) => b.startTop + (b.top - b.startTop) * restToRest(winU(S, b.t0, b.t0 + b.D), FALL_P);
/** The lift while travelling (0..0.5, the house sin^2 envelope). */
export const blockLift = (b: Block, S: number) => {
  const t = winU(S, b.t0, b.t0 + b.D);
  return t <= 0 || t >= 1 ? 0 : 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
};
export const landedAt = (b: Block) => b.t0 + b.D;

const scheduleColumn = (c: number): Block[] => {
  const pat = pattern(c);
  const blocks: Block[] = [];
  let s0 = 0;
  pat.forEach((n, i) => {
    const top = slotTop(s0);
    const h = slotH(n);
    const startTop = HEAD_BOT - h;
    const D = D0 + (top - startTop) / FALL_SPEED;
    blocks.push({ key: `${c}-${i}`, c, i, n, top, h, startTop, t0: 0, D, kind: c === 2 && i < WED_KIND.length ? WED_KIND[i] : undefined });
    s0 += n;
  });
  // bottom up: the lowest block leaves first
  let prev: Block | null = null;
  for (let j = blocks.length - 1; j >= 0; j--) {
    const b = blocks[j];
    if (!prev) {
      b.t0 = T0 + c * STAGGER;
    } else {
      const p: Block = prev;
      let t = p.t0 + MIN_STEP;
      const clear = (t0: number) => {
        for (let s = t0; s <= t0 + b.D + 0.01; s += 0.125) {
          const bot = blockTopAt({ ...b, t0 }, s) + b.h;
          if (bot > blockTopAt(p, s) - G + 1e-6) return false;
        }
        return true;
      };
      while (!clear(t)) t += 0.125;
      b.t0 = t;
    }
    prev = b;
  }
  return blocks;
};
export const COLUMNS: Block[][] = Array.from({ length: N_COLS }, (_, c) => scheduleColumn(c));
export const BLOCKS: Block[] = COLUMNS.flat();
export const WED: Block[] = COLUMNS[2];
/** The frame the whole week is packed (the last block lands). */
export const PACKED_AT = Math.max(...BLOCKS.map(landedAt));

// ===========================================================================
// DRAWN PIECES
// ===========================================================================
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `hw${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** The lanes: a faint board inlay per column (no shadow: it is in the board), the hour rules across the week. */
export const WeekBed: React.FC<{ k: number }> = ({ k }) => (
  <g>
    {DAYS.map((_, i) => (
      <path key={i} d={rectPath(colX(i) - COL_W / 2, COL_TOP, COL_W, COL_BOT - COL_TOP, RADIUS)} fill={mixHex(COLOR.ground, COLOR.board, 0.14)} />
    ))}
    {[1, 2, 3, 4].map((h) => {
      const y = COL_TOP + h * 4 * U;
      return <path key={h} d={`M${f2(HEAD_X0)} ${f2(y)}H${f2(HEAD_X1)}`} stroke={COLOR.inkCreamLo} strokeOpacity={0.32} strokeWidth={f2(STROKE.HAIRLINE / k)} />;
    })}
  </g>
);

/** Shadows of the column's resting blocks as one union silhouette (a touching group is one object; the
 *  stack is one crowd sharing a shadow layer); moving blocks cast their own, lifted. */
export const BlockShadows: React.FC<{ blocks: Block[]; S: number }> = ({ blocks, S }) => {
  const rest: string[] = [];
  const moving: { b: Block; d: string; lift: number }[] = [];
  for (const b of blocks) {
    if (S <= b.t0) continue;
    const top = blockTopAt(b, S);
    if (top + b.h <= HEAD_BOT + 0.01) continue;
    const d = rectPath(colX(b.c) - COL_W / 2, top, COL_W, b.h, RADIUS);
    if (S >= landedAt(b)) rest.push(d);
    else moving.push({ b, d, lift: blockLift(b, S) });
  }
  return (
    <g>
      {rest.length ? <ElevationShadow silhouette={rest.map((d) => ({ d }))} elevation="rest" /> : null}
      {moving.map((m) => (
        <ElevationShadow key={m.b.key} silhouette={[{ d: m.d }]} elevation="rest" lift={m.lift} />
      ))}
    </g>
  );
};

/** One column's cream gradient (top of the column -> its foot), toned toward board by `dim`. */
export const ColumnGradient: React.FC<{ id: string; dim: number }> = ({ id, dim }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f2(COL_TOP)} x2="0" y2={f2(COL_BOT)}>
    <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, clamp01(dim))} />
    <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, clamp01(dim))} />
  </linearGradient>
);

/** A block's body: the column's gradient, its lit top edge, its print clipped to it. */
export const BlockBody: React.FC<{ b: Block; S: number; k: number; grad: string; dim: number; children?: React.ReactNode }> = ({ b, S, k, grad, dim, children }) => {
  const uid = uidOf(useId());
  if (S <= b.t0) return null;
  const top = blockTopAt(b, S);
  if (top + b.h <= HEAD_BOT + 0.01) return null;
  const x0 = colX(b.c) - COL_W / 2;
  const d = rectPath(x0, top, COL_W, b.h, RADIUS);
  const edgeA = ALPHA.edge + (ALPHA.edgeBoard - ALPHA.edge) * clamp01(dim);
  return (
    <g>
      <path d={d} fill={`url(#${grad})`} />
      <path d={`M${f2(x0 + RADIUS)} ${f2(top + EDGE.CREAM / k / 2)}H${f2(x0 + COL_W - RADIUS)}`} stroke={COLOR.edge} strokeOpacity={f2(edgeA)} strokeWidth={f2(EDGE.CREAM / k)} />
      {children ? (
        <g>
          <defs>
            <clipPath id={`${uid}k`}>
              <path d={d} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}k)`}>
            <g transform={`translate(0 ${fx(top - b.top)})`}>{children}</g>
          </g>
        </g>
      ) : null}
    </g>
  );
};

/** The header strip: one cream card on its shadow, the day names in ink, a slot line over each column. */
export const WeekHeader: React.FC<{ k: number }> = ({ k }) => {
  const uid = uidOf(useId());
  const d = rectPath(HEAD_X0, HEAD.TOP, HEAD_X1 - HEAD_X0, HEAD.H, RADIUS);
  const cy = HEAD.TOP + HEAD.H / 2;
  const fs = HEAD.FS;
  const sh = Math.max(EDGE.SLOT / k, 1.6);
  const lip = EDGE.SLOT_LIP / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(HEAD.TOP)} x2="0" y2={f2(HEAD_BOT)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation="rest" />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f2(HEAD_X0 + RADIUS)} ${f2(HEAD.TOP + EDGE.CREAM / k / 2)}H${f2(HEAD_X1 - RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      {DAYS.map((name, i) => (
        <text
          key={name}
          x={f2(colX(i) + (TRACK.label * fs) / 2)}
          y={f2(cy + (METRIC.cap * fs) / 2)}
          fontFamily={FONT_LABEL}
          fontWeight={500}
          fontSize={f2(fs)}
          letterSpacing={`${TRACK.label}em`}
          textAnchor="middle"
          fill={COLOR.inkDark}
          style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
        >
          {name.toUpperCase()}
        </text>
      ))}
      {DAYS.map((_, i) => (
        <rect key={i} x={f2(colX(i) - COL_W / 2 - lip)} y={f2(HEAD_BOT - sh)} width={f2(COL_W + 2 * lip)} height={f2(sh)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
      ))}
    </g>
  );
};

// --- the print on WED's blocks -----------------------------------------------------------------------------
/** Print sizes (WORLD px). The time labels: FS (cap ~28 SCREEN px at the close k 2.38). REV 2: the meeting
 *  names on ONE line each, one size for all three (NAME_FS, the largest that fits BUSINESS REVIEW inside the
 *  block's inset at a slightly narrower tracking NAME_TRACK; cap ~25.5 px at k 2.38), the glyph ABOVE the name,
 *  left-aligned with it, its ink GLYPH_K x the name's cap tall, VGAP between them; PAD_X the left inset. */
export const PRINT = { FS: 16.4, NAME_FS: 15.5, NAME_TRACK: 0.03, GLYPH_K: 1.3, VGAP: 7.5, PAD_X: 11 } as const;
const GLYPH_W = 2.4; // the glyphs' stroke in their 24-unit box (Lucide 2, a hair heavier to sit with the caps)
const CAP = METRIC.cap * PRINT.FS;
const NAME_CAP = METRIC.cap * PRINT.NAME_FS;
const GLYPH_H = PRINT.GLYPH_K * NAME_CAP;
/** The names' rendered INK width / capsWidth (measured on the REV 2 render: BUSINESS REVIEW at 14.9 inked
 *  ~133.2 world of an estimated 139.1; the table's advances carry the last letter's side bearing + tracking). */
const NAME_INK = 0.958;
/** A caps line's advance width at `fs` and `track` em (labelWidth at another tracking). */
const capsWidth = (text: string, fs: number, track: number) => labelWidth(text, fs) + (track - TRACK.label) * fs * Math.max(0, text.length - 1);

const capsText = (x: number, y: number, fs: number, text: string, track: number = TRACK.label) => (
  <text
    x={f2(x)}
    y={f2(y)}
    fontFamily={FONT_LABEL}
    fontWeight={500}
    fontSize={f2(fs)}
    letterSpacing={`${track}em`}
    textAnchor="start"
    fill={COLOR.inkDark}
    style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
  >
    {text}
  </text>
);

/** A Lucide-grammar glyph: its 24-unit box `size` wide with its top-left at (x, y). */
const StrokeGlyph: React.FC<{ x: number; y: number; size: number; els: string[] }> = ({ x, y, size, els }) => {
  const sc = size / 24;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(sc)})`} fill="none" stroke={COLOR.inkDark} strokeWidth={GLYPH_W} strokeLinecap="round" strokeLinejoin="round">
      {els.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};
/** Lucide "chart-column": the axis corner and three bars (ink x 3..21, y 3..21 of 24). */
const CHART_COLUMN = ["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"];
/** Lucide "smartphone": the phone body and its home dot (ink x 5..19, y 2..22 of 24). */
const SMARTPHONE = ["M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z", "M12 18h.01"];

/** Two ink busts side by side (the clip's TeamBusts, two figures), `h` tall, centred on (cx, cy). */
const BUST_PITCH = 1.12;
export const twoBustsW = (h: number) => h * (1 + BUST_PITCH);
const TwoBusts: React.FC<{ cx: number; cy: number; h: number }> = ({ cx, cy, h }) => (
  <g fill={COLOR.inkDark}>
    {[-0.5, 0.5].map((o) => bustPaths(cx + o * BUST_PITCH * h, cy, h, "plain").map((d, j) => <path key={`${o}-${j}`} d={d} />))}
  </g>
);

export const KIND_TEXT: Record<Kind, string> = { "15": "15 MIN", "30": "30 MIN", business: "BUSINESS REVIEW", product: "PRODUCT REVIEW", oneonone: "ONE-ON-ONE" };
const isTime = (k: Kind) => k === "15" || k === "30";

/** Where a block's print sits (WORLD, at the block's resting place): the text's x and baseline, the glyph's
 *  top (glyph over name, the pair centred in the block). */
const layout = (b: Block) => {
  const x0 = colX(b.c) - COL_W / 2 + PRINT.PAD_X;
  if (isTime(b.kind as Kind)) {
    // centred in a 15-min block; the 30-min block's label sits at the same height from its top (a calendar event)
    return { tx: x0, base: b.top + (slotH(1) + CAP) / 2, gTop: 0 };
  }
  const gTop = b.top + (b.h - (GLYPH_H + PRINT.VGAP + NAME_CAP)) / 2;
  return { tx: x0, base: gTop + GLYPH_H + PRINT.VGAP + NAME_CAP, gTop };
};

/** The print's box (WORLD, at the block's resting place) for the checks: [x0, y0, x1, y1] (glyph included). */
export const printBox = (b: Block): [number, number, number, number] => {
  const L = layout(b);
  const kind = b.kind as Kind;
  if (isTime(kind)) return [L.tx, L.base - CAP, L.tx + labelWidth(KIND_TEXT[kind], PRINT.FS), L.base];
  const w = Math.max(capsWidth(KIND_TEXT[kind], PRINT.NAME_FS, PRINT.NAME_TRACK), kind === "oneonone" ? twoBustsW(GLYPH_H) : GLYPH_H);
  return [L.tx, L.gTop, L.tx + w, L.base];
};

/** The print of one of WED's top blocks, entering on its word (enter 0..1, the clip's ink entrance). */
export const BlockPrint: React.FC<{ b: Block; enter: number; k: number }> = ({ b, enter, k }) => {
  const kind = b.kind as Kind;
  const L = layout(b);
  if (isTime(kind)) {
    return (
      <FaceInk enter={enter} k={k}>
        {capsText(L.tx, L.base, PRINT.FS, KIND_TEXT[kind])}
      </FaceInk>
    );
  }
  const g = GLYPH_H;
  // each glyph's INK box (not its 24-unit box) sits left-aligned on tx, top on gTop, g tall
  const chart = g / 18; // chart-column ink: x 3..21, y 3..21
  const phone = g / 20; // smartphone ink: x 5..19, y 2..22
  return (
    <FaceInk enter={enter} k={k}>
      {kind === "business" ? <StrokeGlyph x={L.tx - 3 * chart} y={L.gTop - 3 * chart} size={24 * chart} els={CHART_COLUMN} /> : null}
      {kind === "product" ? <StrokeGlyph x={L.tx - 5 * phone} y={L.gTop - 2 * phone} size={24 * phone} els={SMARTPHONE} /> : null}
      {kind === "oneonone" ? <TwoBusts cx={L.tx + twoBustsW(g) / 2} cy={L.gTop + g / 2} h={g} /> : null}
      {capsText(L.tx, L.base, PRINT.NAME_FS, KIND_TEXT[kind], PRINT.NAME_TRACK)}
    </FaceInk>
  );
};

// --- load-time checks ---------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`weekWorld: ${m}`);
  };
  COLUMNS.forEach((col, c) => {
    if (col.reduce((a, b) => a + b.n, 0) !== N_SLOTS) fail(`column ${c} does not fill its ${N_SLOTS} slots`);
  });
  if (WED.slice(0, WED_TOP.length).some((b, i) => b.n !== WED_TOP[i])) fail("WED's top blocks are not 15 / 30 / 30 / 30 / 30");
  for (const b of WED.slice(0, 5)) {
    const [x0, y0, x1, y1] = printBox(b);
    if (x0 + (x1 - x0) * (b.kind === "15" || b.kind === "30" ? 1 : NAME_INK) > colX(2) + COL_W / 2 - PRINT.PAD_X + 0.5) fail(`${KIND_TEXT[b.kind as Kind]} runs to the block's edge (${(x1 - x0).toFixed(1)} wide)`);
    if (y0 < b.top + 4 || y1 > b.top + b.h - 4) fail(`${KIND_TEXT[b.kind as Kind]} crowds its block's top or foot`);
  }
  if (labelWidth("WED", HEAD.FS) > COL_W - 24) fail("the day names crowd their columns");
  if (NAME_CAP * 2.38 < 24) fail(`the meeting names' cap is ${(NAME_CAP * 2.38).toFixed(1)} px at k 2.38`);
}
