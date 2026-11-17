// ---------------------------------------------------------------------------
// MarginsEvenHigher (nik-europe-worst-market, cut 11), REV 1. Cheeky Pint style, the STOUT BOARD
// (styles/cheeky-pint.md). Opaque 1080x1920, 23.976 fps, 158 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "High inflation lifts the whole lending rate even higher, and the bank's amber slice on top of it
// grows thickest." With the sound off: when inflation climbs, the credit-rate column climbs past it, and the
// bank's margin (amber, on top) gets fatter.
//
// THE LINE (Nik Storonsky): "Then generally if inflation is high, then credit rates are even higher. [John:
// "Yes."] And then the margins are even higher."
// WORD -> FRAME (from the composition start; Whisper large-v3, may run 2-6 f early): And/Then 3 · generally 6 ·
// if 17 · inflation 26 · is 41 · high 51 · then 59 · credit 63 · rates 78 · are 85 · even 89 · higher 95
// (ends ~106) · (John) Yes 107 · And 115 · then 119 · the 126 · margins 132 · are 138 · even 143 · higher 146
// (ends ~154). The edit cuts back to the speakers at f158.
// DURATION: the slot 11.553208 -> 18.143125 s = 6.590 s x 23.976 = 158 frames (f0..f157), no tail.
//
// REV 1 (the user's notes on V1): both objects are the same object now (no thermometer): two glass columns
// rising out of slots in cream tiles, text only ("INFLATION", "CREDIT RATE"; the landmark icon is gone), and
// a more dynamic camera that opens close on inflation and hands off to the credit rate.
//
// THE MOTION: LEFT the INFLATION column (cream fill only), RIGHT 440 world px away the CREDIT RATE column (a
// cream body with the bank's amber MARGIN slice on top). A faint cream hairline runs level from the inflation
// fill's top to the credit column's left glass edge (the inflation level) and rides up with it.
//   f10-47   the inflation fill climbs steadily (under way by "inflation" f26, lands just before "high" f51)
//   f11-48   the credit body follows it (3-frame smoothing: it moves only once inflation moves, f10 -> f11),
//            staying just above the hairline (12 world px), off screen right at first
//   f62-96   the credit column's OWN climb on "credit rates are even higher": +135 world px (~170 screen px
//            at the time, ~190 at the final scale), 99.6 % by f94, before "higher" f95
//   f100-114 the inflation column recedes by tone toward board (its tile stays whole in shot at the left)
//   f112-148 the amber slice thickens 1 -> 4 rungs (24 -> 96 world px), pushing the column top higher still;
//            98.7 % by f144, still by f148 ("higher" f146). MARGIN (ink on a cream card) slides up beside the
//            slice from f114 and rides its middle.
//   f142-153 THE ONE CLICK: a light sweep across the amber slice
//   f148-157 the living hold: the camera's tail tilt, the light pool settling, grain on twos
// CAMERA: one continuous move. Opens close (k 1.9) and centred on the inflation column, creeping in and up
// while it fills; from ~f38 (the fill nearly landed) a lateral pan with a pull to k 1.24 hands off to the pair,
// framed whole by ~f70 with credit right of centre, so the credit climb (f62-96) plays out in a near-settled
// frame (~125 px of visible rise f66-96), the hairline carrying across; then a slow tilt up toward the amber with
// a hint of push (k -> 1.26) that keeps both tiles whole (INFLATION's left edge >= x 71, CREDIT RATE's right
// edge <= x 1011 from f75 on). Tile labels stay above y 1075 on every camera state.
// AMBER = the bank's margin (what the bank keeps); nothing else is amber. Cream = the subject, board = context.
//
// SOURCES: none (no figures on screen; Nik gives none).
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
import { GlassColumn, UnionShadow, makeClockCam, makePoolTrack, restToRest, toneFoot, toneTop, type SilItem } from "../kits/cheeky-pint/museShared";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===========================================================================
// THE WORLD (world px)
// ===========================================================================
const Y0 = 1000; // the slot line: both tiles' top edge
const TILE_H = 68;
const R_TILE = 10;
const FONT_W = 38; // tile and card labels, WORLD px (72 screen px at the open, 48 at the end)
const SHADOW_S = 2.4; // the elevation recipe's scale for objects this size
const TILE_W = 304; // both tiles: one size, one style, text only (CREDIT RATE is 261 wide)
export const XI = 300; // the inflation column's axis
export const XC = XI + 440; // the credit column's axis (its tile just off screen at the open)
const PAIR_X = (XI + XC) / 2; // the pair's middle: both tiles whole from the hand-off on

// both columns: glass, a cream fill; the credit column carries the amber margin on top
const COL = { w: 140, glass: 440, inset: 6 } as const;
const FILL_W = COL.w - 2 * COL.inset;
const UNIT = 24; // one rung of the margin slice

// the levels (world px above the slot)
const INFL = { from: 64, to: 168 } as const; // the inflation fill's top
const BODY = { lead: 12, to: 315 } as const; // the credit body: just over inflation while it rises, then its own climb
const SLICE = { from: UNIT, to: 4 * UNIT } as const; // the amber margin: 1 -> 4 rungs (the column top ends at 411)

// ===========================================================================
// THE TIMELINE (frames)
// ===========================================================================
const T = {
  INFL: [10, 47, 12, 9] as const, // the inflation climb: [f0, f1, ease-in, ease-out]
  DIM: [100, 14, 0.45] as const, // the inflation column recedes by tone: [f0, frames, depth]
  CLIMB: [62, 96, 2.4] as const, // the credit column's own climb ("credit rates are even higher"): [f0, f1, power]
  SLICE: [112, 148, 2.4] as const, // the margin thickens: [f0, f1, restToRest power]
  MARGIN_IN: 114, // MARGIN slides up + fades in over 12 f
  SWEEP: [142, 153] as const, // the one click
};
const ENTER_F = 12;

/** A steady climb: velocity eases in over `up`, holds, eases out over `down`; integrated, 0..1 on [f0, f1]. */
const climbTable = (() => {
  const [f0, f1, up, down] = T.INFL;
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
/** The inflation fill's progress 0..1. */
export const inflU = (f: number) => tableAt(climbTable, f);
/** Inflation smoothed over FOLLOW_WIN frames (causal Hann window): what the credit body follows. */
const FOLLOW_WIN = 3;
const followTable = (() => {
  const n = FOLLOW_WIN * 8;
  const w = Array.from({ length: n + 1 }, (_, i) => Math.pow(Math.sin((Math.PI * i) / n), 2));
  const sum = w.reduce((a, b) => a + b, 0);
  const out: number[] = [];
  for (let j = 0; j <= (DURATION + 4) * 8; j++) {
    const f = j / 8;
    let acc = 0;
    for (let i = 0; i <= n; i++) acc += w[i] * inflU(f - (i * FOLLOW_WIN) / n);
    out.push(acc / sum);
  }
  return out;
})();
/** The credit body follows inflation while it rises (it moves only once inflation moves, just above it), then
 *  makes its own climb on "credit rates are even higher" (T.CLIMB, the director's beat). */
export const followU = (f: number) => tableAt(followTable, f, 8);
export const climbU = (f: number) => restToRest((f - T.CLIMB[0]) / (T.CLIMB[1] - T.CLIMB[0]), T.CLIMB[2]);
export const sliceU = (f: number) => restToRest((f - T.SLICE[0]) / (T.SLICE[1] - T.SLICE[0]), T.SLICE[2]);

export const levelsAt = (f: number) => {
  const infl = lerp(INFL.from, INFL.to, inflU(f));
  const body = lerp(INFL.from, INFL.to, followU(f)) + BODY.lead + (BODY.to - INFL.to - BODY.lead) * climbU(f);
  const slice = lerp(SLICE.from, SLICE.to, sliceU(f));
  return { infl, body, slice, top: body + slice };
};

// ===========================================================================
// THE CAMERA (look = the world point on the frame's middle) and the light pool
// ===========================================================================
/** The look that puts world (wx, Y0) at screen (sx, sy) at zoom k. */
const lookFor = (wx: number, sx: number, sy: number, k: number) => ({ x: wx - (sx - 540) / k, y: Y0 - (sy - 960) / k, k });
// the camera's keys: where a column's axis and the slot line sit on screen
export const KEYS = {
  open: lookFor(XI, 540, 940, 1.9), // close and centred on inflation, tile feet ~y 1069
  fill: lookFor(XI, 540, 926, 1.97), // creeping in and up as it fills
  hand: lookFor(PAIR_X, 540, 952, 1.24), // the hand-off: the pair framed whole, credit right of centre
  end: lookFor(PAIR_X, 540, 980, 1.262), // a slow tilt up toward the amber with a hint of push; INFLATION stays whole
};
const dOf = (a: { x: number; y: number }, b: { x: number; y: number; k: number }) => ({ dx: b.x - a.x, dy: b.y - a.y, k: b.k });
export const CAM = makeClockCam(
  KEYS.open,
  [
    { f0: -24, f1: 52, ...dOf(KEYS.open, KEYS.fill) }, // the creep in and up while inflation fills (already moving on f0)
    { f0: 34, f1: 72, ...dOf(KEYS.fill, KEYS.hand) }, // the hand-off: pan right with a pull (then credit ...)
    { f0: 60, f1: 176, ...dOf(KEYS.hand, KEYS.end), warp: 0.85 }, // the slow tilt up toward the amber (from its climb on), still moving at the cut
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: XI, y: Y0 - 120, strength: 1.6 },
  [
    { f0: 46, f1: 92, x: XC - 60, y: Y0 - 240 },
    { f0: 96, f1: 160, x: XC - 40, y: Y0 - 330, strength: 1.75 },
  ],
  DURATION,
);

// ===========================================================================
// PIECES
// ===========================================================================
/** Ink caps in a card, world px (a part of the card: it scales with it). Baseline y. */
const InkText: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <text
    x={f3(x + (TRACK.label * FONT_W) / 2)}
    y={f3(y)}
    fontFamily={FONT_LABEL}
    fontWeight={500}
    fontSize={FONT_W}
    letterSpacing={`${TRACK.label}em`}
    textAnchor="middle"
    fill={COLOR.inkDark}
    style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
  >
    {text}
  </text>
);
const capBaseline = (cy: number) => cy + (FONT_W * METRIC.cap) / 2;

/** A cream tile (its gradient by tone), the lit top edge broken by the slot, the slot line, its label in ink. */
const Tile: React.FC<{ id: string; cx: number; k: number; dim: number; label: string }> = ({ id, cx, k, dim, label }) => {
  const x = cx - TILE_W / 2;
  const r = R_TILE;
  const ey = Y0 + EDGE.CREAM / k / 2;
  const sx0 = cx - COL.w / 2 - EDGE.SLOT_LIP / k;
  const sx1 = cx + COL.w / 2 + EDGE.SLOT_LIP / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={Y0} x2="0" y2={Y0 + TILE_H}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x, Y0, TILE_W, TILE_H, r)} fill={`url(#${id})`} />
      <path
        d={`M${f3(x + r)} ${f3(ey)}H${f3(sx0)}M${f3(sx1)} ${f3(ey)}H${f3(x + TILE_W - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      <rect x={f3(sx0)} y={f3(Y0 - EDGE.SLOT / k / 2)} width={f3(sx1 - sx0)} height={f3(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
      <InkText x={cx} y={capBaseline(Y0 + TILE_H / 2)} text={label} />
    </g>
  );
};

/** A column's back: its one shadow (tile + glass + fill) and the glass tint. */
const ColumnBack: React.FC<{ cx: number; k: number; fill: number }> = ({ cx, k, fill }) => {
  const sil: SilItem[] = [
    { d: rectPath(cx - TILE_W / 2, Y0, TILE_W, TILE_H, R_TILE) },
    { d: rectPath(cx - COL.w / 2, Y0 - COL.glass, COL.w, COL.glass, 8, true, false), a: 0.3 },
    { d: rectPath(cx - FILL_W / 2, Y0 - fill, FILL_W, fill, 4, true, false) },
  ];
  return (
    <g>
      <UnionShadow sil={sil} s={SHADOW_S} contact={{ x: cx, y: Y0 + TILE_H, w: TILE_W }} />
      <GlassColumn x={cx} baseY={Y0} w={COL.w} h={COL.glass} k={k} shadow={0} part="back" />
    </g>
  );
};

/** A column's front: the cream fill (lit top edge when it is the top), the amber margin if any (bloom, rungs,
 *  hot edge, the sweep), the tile, the glass. */
const ColumnFront: React.FC<{ uid: string; cx: number; k: number; body: number; slice: number; dim: number; band: [number, number]; sweep: number; label: string }> = ({
  uid,
  cx,
  k,
  body,
  slice,
  dim,
  band,
  sweep,
  label,
}) => {
  const x0 = cx - FILL_W / 2;
  const bodyTop = Y0 - body;
  const sliceTop = bodyTop - slice;
  const r = 4;
  const rungs: number[] = [];
  for (let i = 1; i < 12 && slice > 0; i++) {
    const y = bodyTop - i * UNIT;
    if (y > sliceTop + (EDGE.HOT + 3) / k) rungs.push(y);
  }
  const fall = EDGE.HOT_FALL / k;
  const ao = Math.min(body, EDGE.FOOT_AO / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(bodyTop)} x2="0" y2={Y0}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
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
      {/* the cream fill, out of the slot */}
      <path d={rectPath(x0, bodyTop, FILL_W, body, slice > 0 ? 0 : r, slice <= 0, false)} fill={`url(#${uid}b)`} />
      {slice <= 0 ? (
        <path d={`M${f3(x0 + r)} ${f3(bodyTop + EDGE.CREAM / k / 2)}H${f3(x0 + FILL_W - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)} strokeWidth={f3(EDGE.CREAM / k)} />
      ) : null}
      <rect x={f3(x0)} y={f3(Y0 - ao)} width={f3(FILL_W)} height={f3(ao)} fill={`url(#${uid}o)`} />
      {/* the margin: one glow pass, its rungs, its hot top edge, the one sweep */}
      {slice > 0 ? (
        <>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(x0, sliceTop, FILL_W, slice, r, true, false)} fill={`url(#${uid}a)`} />
          </g>
          {rungs.length ? (
            <g stroke={COLOR.rung} strokeWidth={f3(STROKE.HAIRLINE / k)}>
              {rungs.map((y) => (
                <line key={y} x1={f3(x0)} x2={f3(x0 + FILL_W)} y1={f3(y)} y2={f3(y)} />
              ))}
            </g>
          ) : null}
          <path d={rectPath(x0, sliceTop, FILL_W, Math.min(fall, slice), r, true, false)} fill={`url(#${uid}h)`} />
          <path d={`M${f3(x0 + r)} ${f3(sliceTop + EDGE.HOT / k / 2)}H${f3(x0 + FILL_W - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
          <LightSweep x={x0} y={sliceTop} w={FILL_W} h={slice} k={k} t={sweep} on="amber" r={r} />
        </>
      ) : null}
      <Tile id={`${uid}t`} cx={cx} k={k} dim={dim} label={label} />
      <GlassColumn x={cx} baseY={Y0} w={COL.w} h={COL.glass} k={k} role={dim > 0.3 ? "lo" : "hi"} shadow={0} part="front" />
    </g>
  );
};

/** The inflation level: a faint cream hairline from the inflation fill's top to the credit column's left glass edge. */
const LevelLine: React.FC<{ k: number; level: number }> = ({ k, level }) => {
  const y = Y0 - level;
  const x0 = XI + FILL_W / 2;
  const x1 = XC - COL.w / 2;
  return <rect x={f3(x0)} y={f3(y - 1.25 / k)} width={f3(x1 - x0)} height={f3(2.5 / k)} fill={COLOR.inkCream} fillOpacity={0.62} />;
};

/** MARGIN in ink on a small cream card beside the slice (left of the glass), riding the slice's middle. */
const MARGIN_W = Math.ceil(labelWidth("MARGIN", FONT_W) + 2 * 22);
const MARGIN_H = 60;
const MarginCard: React.FC<{ k: number; cy: number; enter: number }> = ({ k, cy, enter }) => {
  if (enter <= 0.001) return null;
  const a = easeOutCubic(enter);
  const lift = ((1 - a) * 24) / k;
  const blur = 6 * (1 - a);
  const x1 = XC - COL.w / 2 - 16;
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
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <ColumnBack cx={XI} k={k} fill={L.infl} />
      <ColumnFront uid={`${uid}i`} cx={XI} k={k} body={L.infl} slice={0} dim={dim} band={band} sweep={0} label="INFLATION" />
      <ColumnBack cx={XC} k={k} fill={L.top} />
      <LevelLine k={k} level={L.infl} />
      <ColumnFront uid={`${uid}c`} cx={XC} k={k} body={L.body} slice={L.slice} dim={0} band={band} sweep={sweep} label="CREDIT RATE" />
      <MarginCard k={k} cy={Y0 - L.body - L.slice / 2} enter={marginIn} />
    </StoutStage>
  );
};

export default MarginsEvenHigher;
