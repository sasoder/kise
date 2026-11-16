// ---------------------------------------------------------------------------
// MarginsEvenHigher (nik-europe-worst-market, cut 11). Cheeky Pint style, the STOUT BOARD (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 158 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "High inflation lifts the whole lending rate even higher, and the bank's amber slice on top of it
// grows thickest." With the sound off: when inflation (the thermometer) climbs, the credit-rate column climbs
// past it, and the bank's margin (amber, on top) gets fatter.
//
// THE LINE (Nik Storonsky): "Then generally if inflation is high, then credit rates are even higher. [John:
// "Yes."] And then the margins are even higher."
// WORD -> FRAME (from the composition start; Whisper large-v3, may run 2-6 f early): And/Then 3 · generally 6 ·
// if 17 · inflation 26 · is 41 · high 51 · then 59 · credit 63 · rates 78 · are 85 · even 89 · higher 95
// (ends ~106) · (John) Yes 107 · And 115 · then 119 · the 126 · margins 132 · are 138 · even 143 · higher 146
// (ends ~154). The edit cuts back to the speakers at f158.
// DURATION: the slot 11.553208 -> 18.143125 s = 6.590 s x 23.976 = 158 frames (f0..f157), no tail.
//
// THE MOTION: two objects on one baseline under one light. LEFT a thermometer (glass tube and bulb, cream
// mercury) out of a cream INFLATION tile; RIGHT, bigger, the bank's glass CREDIT RATE column out of a cream
// bank tile (Lucide "landmark" in ink): a cream body with the bank's amber MARGIN slice on top. A faint cream
// hairline runs level from the mercury top to the column's left glass edge (the inflation level) and rides up
// with it. At f0 the mercury is a short thread ~22 % up the tube, so the thermometer reads from the first frame.
//   f14-50   the mercury climbs steadily (under way by "inflation" f26, lands just before "high" f51)
//   f15-50   the column's cream body follows the mercury (3-frame smoothing: it moves only once the mercury
//            moves, f14 -> f15), staying just above the hairline (13 world px; min 9.2 at f29)
//   f62-96   then the column makes its OWN climb on "credit rates are even higher" (director's note: its beat
//            must read on its own): +147 world px (~168 screen px at the time, ~184 at the final scale),
//            99.6 % by f94, still before "higher" f95; the hairline is left far below (~185 px)
//   f100-114 the thermometer recedes by tone toward board (the comparison stays in shot, dimmed)
//   f112-148 the amber slice thickens 1 -> 4 rungs (24 -> 96 world px), pushing the column top higher still;
//            98.7 % by f144, still by f148 ("higher" f146). MARGIN (ink on a cream card) slides up beside the
//            slice from f114 and rides its middle.
//   f142-153 THE ONE CLICK: a light sweep across the amber slice
//   f148-157 the living hold: the camera's tail creep, the light pool settling, grain on twos
// Camera: one continuous move. Opens on both objects across ~75 % of the width (k 1.10), a creep, then the push
// through the quiet stretch (f88-128, k -> 1.25) that ends on the column top and its amber, the thermometer
// still in shot at the left edge; a slow tail creep to the cut. Every mark stays inside the keep-in box
// (x 65-1015, y 290-1070) on every frame; tile labels above y 1075, nothing readable in the caption bands.
// AMBER = the bank's margin (what the bank keeps); nothing else is amber. Cream = the subject, board = context.
//
// SOURCES: none (no figures on screen; Nik gives none). The bank glyph is Lucide "landmark" (ISC), redrawn.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  FONT_LABEL,
  LightSweep,
  METRIC,
  STROKE,
  StoutStage,
  TRACK,
  amberBandFor,
  bloomFilter,
  clamp01,
  easeOutCubic,
  labelWidth,
  lerp,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { GLASS, GlassColumn, UnionShadow, makeClockCam, makePoolTrack, restToRest, toneFoot, toneTop, type SilItem } from "../kits/cheeky-pint/museShared";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===========================================================================
// THE WORLD (world px; at the end camera k 1.25, ~1.25 screen px each)
// ===========================================================================
const Y0 = 1000; // the slot line: both tiles' top edge
const TILE_H = 68;
const R_TILE = 10;
const FONT_W = 38; // tile and card labels, WORLD px (44 screen px at the open, 48 at the end)
const SHADOW_S = 2.6; // the elevation recipe's scale for objects this size at k ~1.2 (screen offsets as the reference cuts)

// the thermometer's tile (left) and the bank's tile (right), one baseline, 64 apart, centred on x 540
const T_TILE_W = 272;
const B_TILE_W = 400;
const GAP = 64;
const X_LEFT = 540 - (T_TILE_W + GAP + B_TILE_W) / 2; // 172
const TX = X_LEFT + T_TILE_W / 2; // 308: the thermometer's axis
const BX = X_LEFT + T_TILE_W + GAP + B_TILE_W / 2; // 708: the column's axis

// the thermometer: a glass tube and bulb, cream mercury, rising out of the slot in its tile
const THERMO = {
  tubeHW: 27, // outer glass half-width
  merHW: 13, // the mercury thread's half-width
  bulbRO: 52, // the bulb's outer glass radius
  bulbRI: 44, // its mercury
  sink: 26, // the bulb's centre sits this far above the slot (its foot is in the tile)
  top: 330, // the tube's top above the slot
} as const;
const BULB_Y = Y0 - THERMO.sink;

// the bank's column: glass, a cream body, the amber margin slice on top
const COL = { w: 140, glass: 480, inset: 6 } as const;
const FILL_W = COL.w - 2 * COL.inset;
const UNIT = 24; // one rung of the margin slice

// the levels (world px above the slot)
const MERC = { from: 120, to: 184 } as const; // the mercury's top: a thread ~19 % up the tube at the open
const BODY = { lead: 13, to: 344 } as const; // the column's cream body: just over the mercury while it rises, then its own climb to 344
const SLICE = { from: UNIT, to: 4 * UNIT } as const; // the amber margin: 1 -> 4 rungs (the column top ends where it did: 440)

// ===========================================================================
// THE TIMELINE (frames)
// ===========================================================================
const T = {
  MERC: [14, 50, 12, 9] as const, // the mercury's climb: [f0, f1, ease-in, ease-out]
    DIM: [100, 14, 0.45] as const, // the thermometer recedes by tone: [f0, frames, depth]
  CLIMB: [62, 96, 2.4] as const, // the column's own climb on "credit rates are even higher": [f0, f1, restToRest power]
  SLICE: [112, 148, 2.4] as const, // the margin thickens: [f0, f1, restToRest power]
  MARGIN_IN: 114, // MARGIN slides up + fades in over 12 f
  SWEEP: [142, 153] as const, // the one click
};
const ENTER_F = 12;

/** A steady climb: velocity eases in over `up`, holds, eases out over `down`; integrated, 0..1 on [f0, f1]. */
const climbTable = (() => {
  const [f0, f1, up, down] = T.MERC;
  const step = 1 / 16;
  const vel = (f: number) => smoothstep((f - f0) / up) * (1 - smoothstep((f - (f1 - down)) / down));
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (DURATION + 4) * 16; i++) {
    const f = i * step;
    if (i > 0) acc += ((vel(f - step) + vel(f)) / 2) * step;
    out.push(acc);
  }
  return out.map((v) => v / acc);
})();
const tableAt = (tab: number[], f: number, per = 16) => {
  if (f <= 0) return tab[0];
  const i = Math.min(tab.length - 2, Math.floor(f * per));
  return lerp(tab[i], tab[i + 1], clamp01(f * per - i));
};
/** The mercury's progress 0..1. */
export const mercU = (f: number) => tableAt(climbTable, f);
/** The mercury smoothed over FOLLOW_WIN frames (causal Hann window): what the column follows. */
const FOLLOW_WIN = 3;
const hannTable = (L: number, src: (f: number) => number) => {
  const n = L * 8;
  const w = Array.from({ length: n + 1 }, (_, i) => Math.pow(Math.sin((Math.PI * i) / n), 2));
  const sum = w.reduce((a, b) => a + b, 0);
  const out: number[] = [];
  for (let j = 0; j <= (DURATION + 4) * 8; j++) {
    const f = j / 8;
    let acc = 0;
    for (let i = 0; i <= n; i++) acc += w[i] * src(f - (i * L) / n);
    out.push(acc / sum);
  }
  return out;
};
const followTable = hannTable(FOLLOW_WIN, mercU);
/** The column follows the mercury while it rises (a 3-frame smoothing: it moves only once the mercury moves,
 *  just above it), then makes its own climb on "credit rates are even higher" (T.CLIMB, the director's beat). */
export const followU = (f: number) => tableAt(followTable, f, 8);
export const climbU = (f: number) => restToRest((f - T.CLIMB[0]) / (T.CLIMB[1] - T.CLIMB[0]), T.CLIMB[2]);
export const sliceU = (f: number) => restToRest((f - T.SLICE[0]) / (T.SLICE[1] - T.SLICE[0]), T.SLICE[2]);

export const levelsAt = (f: number) => {
  const merc = lerp(MERC.from, MERC.to, mercU(f));
  const body = lerp(MERC.from, MERC.to, followU(f)) + BODY.lead + (BODY.to - MERC.to - BODY.lead) * climbU(f);
  const slice = lerp(SLICE.from, SLICE.to, sliceU(f));
  return { merc, body, slice, top: body + slice };
};

// ===========================================================================
// THE CAMERA (look = the world point on the frame's middle) and the light pool
// ===========================================================================
// Open: tile tops at screen y ~994 (tiles' feet 1070), the pair centred, k 1.12. End: k ~1.25, tile tops
// ~983, the column top ~y 430; the whole pair (736 world) inside x 65-1015.
const K0 = 1.1;
const LOOK0 = { x: 540, y: Y0 - (994 - 960) / K0, k: K0 };
export const CAM = makeClockCam(
  LOOK0,
  [
    { f0: -30, f1: 100, k: 1.14, dy: 3 }, // the opening creep, already moving on f0
    { f0: 88, f1: 128, k: 1.245, dy: 7.5 }, // the push, through the quiet stretch (higher ... yes ... and)
    { f0: 112, f1: 200, k: 1.262, dy: 1.5 }, // the tail creep, still moving at the cut
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: 540, y: Y0 - 170, strength: 1.5 },
  [
    { f0: 30, f1: 96, x: 600, y: Y0 - 250 },
    { f0: 96, f1: 160, x: BX - 40, y: Y0 - 340, strength: 1.7 },
  ],
  DURATION,
);

// ===========================================================================
// PIECES
// ===========================================================================
/** Lucide "landmark" (ISC; the classic form): a pediment, four columns, the ground line. 24-unit box. */
const LANDMARK = ["M12 2.6 20 7H4Z", "M6 18v-7", "M10 18v-7", "M14 18v-7", "M18 18v-7", "M3 22h18"];
const GLYPH_H = 36; // world px for the glyph's 20-unit ink height (2..22): a touch taller than the caps
const GLYPH_SC = GLYPH_H / 20;
const GLYPH_W = 18 * GLYPH_SC; // ink width (3..21)
const GLYPH_GAP = 16;
const GLYPH_STROKE_U = 2.5; // units: the house glyph weight (stoutShared's sport glyphs, 2.6 in a 24 box)

/** Ink caps in a card, world px (a part of the card: it scales with it). Baseline y. */
const InkText: React.FC<{ x: number; y: number; text: string; anchor?: "start" | "middle"; color?: string }> = ({ x, y, text, anchor = "middle", color = COLOR.inkDark }) => {
  const comp = anchor === "middle" ? (TRACK.label * FONT_W) / 2 : 0;
  return (
    <text
      x={f3(x + comp)}
      y={f3(y)}
      fontFamily={FONT_LABEL}
      fontWeight={500}
      fontSize={FONT_W}
      letterSpacing={`${TRACK.label}em`}
      textAnchor={anchor}
      fill={color}
      style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
    >
      {text}
    </text>
  );
};
const capBaseline = (cy: number) => cy + (FONT_W * METRIC.cap) / 2;

/** A cream tile (its gradient by tone), the lit top edge broken by the slot, the slot line and its lips. */
const Tile: React.FC<{ id: string; cx: number; w: number; k: number; dim: number; slotW: number; children?: React.ReactNode }> = ({ id, cx, w, k, dim, slotW, children }) => {
  const x = cx - w / 2;
  const r = R_TILE;
  const ey = Y0 + EDGE.CREAM / k / 2;
  const sx0 = cx - slotW / 2 - EDGE.SLOT_LIP / k;
  const sx1 = cx + slotW / 2 + EDGE.SLOT_LIP / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={Y0} x2="0" y2={Y0 + TILE_H}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x, Y0, w, TILE_H, r)} fill={`url(#${id})`} />
      <path
        d={`M${f3(x + r)} ${f3(ey)}H${f3(sx0)}M${f3(sx1)} ${f3(ey)}H${f3(x + w - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      <rect x={f3(sx0)} y={f3(Y0 - EDGE.SLOT / k / 2)} width={f3(sx1 - sx0)} height={f3(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
      {children}
    </g>
  );
};

// --- the thermometer --------------------------------------------------------------------------------------
const TH_TOP = Y0 - THERMO.top;
const JUNCTION_DY = Math.sqrt(THERMO.bulbRO * THERMO.bulbRO - THERMO.tubeHW * THERMO.tubeHW);
/** The glass outline: up the tube's left side, over its round top, down the right side, round the bulb. */
const THERMO_GLASS_D = (() => {
  const { tubeHW: h, bulbRO: R } = THERMO;
  const jy = BULB_Y - JUNCTION_DY;
  return `M${f3(TX - h)} ${f3(jy)}V${f3(TH_TOP + h)}A${h} ${h} 0 0 1 ${f3(TX + h)} ${f3(TH_TOP + h)}V${f3(jy)}A${R} ${R} 0 1 1 ${f3(TX - h)} ${f3(jy)}Z`;
})();
/** Where the bulb's glass meets the slot: the chord across the bulb at Y0. */
const BULB_CHORD = 2 * Math.sqrt(THERMO.bulbRO * THERMO.bulbRO - THERMO.sink * THERMO.sink);
const circleD = (cx: number, cy: number, r: number) => `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx + r)} ${f3(cy)}Z`;
const mercD = (level: number) => {
  const w = THERMO.merHW;
  const top = Y0 - level;
  return rectPath(TX - w, top, 2 * w, BULB_Y - top, w, true, false);
};

const Thermometer: React.FC<{ uid: string; k: number; level: number; dim: number }> = ({ uid, k, level, dim }) => {
  const hair = Math.max(STROKE.HAIRLINE, GLASS.hairline) / k;
  const sil: SilItem[] = [
    { d: rectPath(X_LEFT, Y0, T_TILE_W, TILE_H, R_TILE) },
    { d: THERMO_GLASS_D, a: 0.3 },
    { d: circleD(TX, BULB_Y, THERMO.bulbRI) },
    { d: mercD(level) },
  ];
  const sx = TX - THERMO.tubeHW + 6;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}m`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(Y0 - level)} x2="0" y2={Y0}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <UnionShadow sil={sil} s={SHADOW_S} contact={{ x: TX, y: Y0 + TILE_H, w: T_TILE_W }} />
      {/* glass body (tint), then the mercury: the bulb and its thread */}
      <path d={THERMO_GLASS_D} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      <g fill={`url(#${uid}m)`}>
        <path d={circleD(TX, BULB_Y, THERMO.bulbRI)} />
        <path d={mercD(level)} />
      </g>
      {/* the glass: hairline over tube and bulb, one soft streak down the lit (left) side of the tube */}
      <path d={THERMO_GLASS_D} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
      <rect x={f3(sx)} y={f3(TH_TOP + THERMO.tubeHW + 4)} width={5} height={f3(BULB_Y - JUNCTION_DY - TH_TOP - THERMO.tubeHW - 10)} rx={2.5} fill={COLOR.glass} fillOpacity={0.14} />
      {/* the tile (over the bulb's foot), INFLATION in ink */}
      <Tile id={`${uid}t`} cx={TX} w={T_TILE_W} k={k} dim={dim} slotW={BULB_CHORD}>
        <InkText x={TX} y={capBaseline(Y0 + TILE_H / 2)} text="INFLATION" />
      </Tile>
    </g>
  );
};

// --- the bank's column -----------------------------------------------------------------------------------
const COL_X0 = BX - COL.w / 2;
const FILL_X0 = BX - FILL_W / 2;
const B_LABEL_W = labelWidth("CREDIT RATE", FONT_W);
const B_GROUP_W = GLYPH_W + GLYPH_GAP + B_LABEL_W;

/** The column's back: its one shadow and the glass tint (drawn before the inflation hairline). */
const ColumnBack: React.FC<{ k: number; body: number; slice: number }> = ({ k, body, slice }) => {
  const sil: SilItem[] = [
    { d: rectPath(BX - B_TILE_W / 2, Y0, B_TILE_W, TILE_H, R_TILE) },
    { d: rectPath(COL_X0, Y0 - COL.glass, COL.w, COL.glass, 8, true, false), a: 0.3 },
    { d: rectPath(FILL_X0, Y0 - body - slice, FILL_W, body + slice, 4, true, false) },
  ];
  return (
    <g>
      <UnionShadow sil={sil} s={SHADOW_S} contact={{ x: BX, y: Y0 + TILE_H, w: B_TILE_W }} />
      <GlassColumn x={BX} baseY={Y0} w={COL.w} h={COL.glass} k={k} shadow={0} part="back" />
    </g>
  );
};

/** The column's front: cream body, the amber margin (bloom, rungs, hot edge), the tile, the glass. */
const ColumnFront: React.FC<{ uid: string; k: number; body: number; slice: number; band: [number, number]; sweep: number }> = ({ uid, k, body, slice, band, sweep }) => {
  const bodyTop = Y0 - body;
  const sliceTop = bodyTop - slice;
  const r = 4;
  const rungs: number[] = [];
  for (let i = 1; i < 12; i++) {
    const y = bodyTop - i * UNIT;
    if (y > sliceTop + (EDGE.HOT + 3) / k) rungs.push(y);
  }
  const fall = EDGE.HOT_FALL / k;
  const ao = Math.min(body, EDGE.FOOT_AO / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(bodyTop)} x2="0" y2={Y0}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {/* the cream body, out of the slot */}
      <path d={rectPath(FILL_X0, bodyTop, FILL_W, body, 0, false, false)} fill={`url(#${uid}b)`} />
      <rect x={f3(FILL_X0)} y={f3(Y0 - ao)} width={f3(FILL_W)} height={f3(ao)} fill={`url(#${uid}o)`} />
      {/* the margin: one glow pass, its rungs, its hot top edge */}
      <g style={{ filter: bloomFilter(k) }}>
        <path d={rectPath(FILL_X0, sliceTop, FILL_W, slice, r, true, false)} fill={`url(#${uid}a)`} />
      </g>
      {rungs.length ? (
        <g stroke={COLOR.rung} strokeWidth={f3(STROKE.HAIRLINE / k)}>
          {rungs.map((y) => (
            <line key={y} x1={f3(FILL_X0)} x2={f3(FILL_X0 + FILL_W)} y1={f3(y)} y2={f3(y)} />
          ))}
        </g>
      ) : null}
      <path d={rectPath(FILL_X0, sliceTop, FILL_W, Math.min(fall, slice), r, true, false)} fill={`url(#${uid}h)`} />
      <path d={`M${f3(FILL_X0 + r)} ${f3(sliceTop + EDGE.HOT / k / 2)}H${f3(FILL_X0 + FILL_W - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
      <LightSweep x={FILL_X0} y={sliceTop} w={FILL_W} h={slice} k={k} t={sweep} on="amber" r={r} />
      {/* the bank's tile: the landmark glyph and CREDIT RATE in ink */}
      <Tile id={`${uid}t`} cx={BX} w={B_TILE_W} k={k} dim={0} slotW={COL.w}>
        <g
          transform={`translate(${f3(BX - B_GROUP_W / 2 - 3 * GLYPH_SC)} ${f3(Y0 + TILE_H / 2 - 12 * GLYPH_SC)}) scale(${f3(GLYPH_SC)})`}
          fill="none"
          stroke={COLOR.inkDark}
          strokeWidth={GLYPH_STROKE_U}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {LANDMARK.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <InkText x={BX - B_GROUP_W / 2 + GLYPH_W + GLYPH_GAP} y={capBaseline(Y0 + TILE_H / 2)} text="CREDIT RATE" anchor="start" />
      </Tile>
      {/* the glass: hairline and streak in front */}
      <GlassColumn x={BX} baseY={Y0} w={COL.w} h={COL.glass} k={k} shadow={0} part="front" />
    </g>
  );
};

/** The inflation level: a faint cream hairline from the mercury's top, level, across to the column's left glass edge. */
const LevelLine: React.FC<{ uid: string; k: number; level: number }> = ({ uid, k, level }) => {
  const y = Y0 - level;
  const x0 = TX + THERMO.merHW;
  const x1 = COL_X0;
  return (
    <g>
      <rect x={f3(x0)} y={f3(y - 1.25 / k)} width={f3(x1 - x0)} height={f3(2.5 / k)} fill={COLOR.inkCream} fillOpacity={0.62} />
    </g>
  );
};

/** MARGIN in ink on a small cream card beside the slice (left of the glass), riding the slice's middle. */
const MARGIN_W = Math.ceil(labelWidth("MARGIN", FONT_W) + 2 * 22);
const MARGIN_H = 60;
const MarginCard: React.FC<{ k: number; cy: number; enter: number }> = ({ k, cy, enter }) => {
  if (enter <= 0.001) return null;
  const a = easeOutCubic(enter);
  const lift = ((1 - a) * 24) / k;
  const blur = 6 * (1 - a);
  const x1 = COL_X0 - 16;
  const x0 = x1 - MARGIN_W;
  const y0 = cy - MARGIN_H / 2 + lift;
  const d = rectPath(x0, y0, MARGIN_W, MARGIN_H, 8);
  return (
    <g opacity={f3(a)} style={{ filter: blur > 0.05 ? `blur(${f3(blur / k)}px)` : undefined }}>
      <UnionShadow sil={[{ d }]} s={SHADOW_S * 0.8} elevation="lifted" />
      <path d={d} fill={COLOR.cream} />
      <path d={`M${f3(x0 + 8)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x1 - 8)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} />
      <InkText x={(x0 + x1) / 2} y={capBaseline(y0 + MARGIN_H / 2)} text="MARGIN" />
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const MarginsEvenHigher: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const uid = `meh${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const cam = CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const L = levelsAt(S);
  const dim = T.DIM[2] * smoothstep((S - T.DIM[0]) / T.DIM[1]);
  const marginIn = clamp01((S - T.MARGIN_IN) / ENTER_F);
  const sweep = (S - T.SWEEP[0]) / (T.SWEEP[1] - T.SWEEP[0]);
  const pool = POOL(S);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      <Thermometer uid={`${uid}th`} k={k} level={L.merc} dim={dim} />
      <ColumnBack k={k} body={L.body} slice={L.slice} />
      <LevelLine uid={`${uid}lv`} k={k} level={L.merc} />
      <ColumnFront uid={`${uid}co`} k={k} body={L.body} slice={L.slice} band={band} sweep={sweep} />
      <MarginCard k={k} cy={Y0 - L.body - L.slice / 2} enter={marginIn} />
    </StoutStage>
  );
};

export default MarginsEvenHigher;
