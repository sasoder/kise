// ---------------------------------------------------------------------------
// NewTeamThreeHundred (nik-detecting-bullshit, cut 46). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 130 frames. Palette B1 (the stoutShared default).
// World: ./wealthWorld.tsx (cut B's, read only). This cut opens on B's last frame pixel for pixel: the story
// clock continues as S = B_LAST_S + f (WEALTH_READY.md), the camera and light pool are B's tracks with this
// cut's glides / keys appended (all at S >= 101, so B's track is untouched).
//
// CHECK LINE: "they swapped the product's team, and the next bar shot up to four times the last one: +300 %,
// dwarfing the old +60–80 %."
//
// THE LINE (sequence 46.004-51.426 s): "Yeah, then we changed the team and now it's growing 300%. So,"
// WORD -> FRAME: yeah f8 · then f32 · we f34 · changed f38 · the f47 · team f57 · and f63 · now f67 · it's f72 ·
// growing f76 · 300 % f84 (said to ~f105-113) · So f127 · slot ends f130.
// DURATION: the slot 46.004 -> 51.426 s = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE MOTION: f0 = B's last frame (the tile with its board-tone team, last year's cream bar, this year's bar
// with its amber +60–80 % slice and label, the empty third slot); the camera drifts in toward the team. On
// "then we changed the team" the old team sinks one by one down into its slots behind the tile's top edge
// (f34-50) and a new team, in CREAM (the line is about them), rises up out of the same slots (f44-61): one
// swap wave left to right, nothing fades or scales. Then, as the camera pulls back and tilts up in one move
// (f52-~100), the old growth recedes by tone (the +60–80 % slice amber -> board, its label amber -> lo and
// down from SECONDARY to the LABEL token beside its bar, f52-68) and the third bar rises out of the empty
// slot in ONE decelerating rise (f64-94): cream to this year's 1.7 units, then on as an amber growth slice to
// 6.8 units (= 4x, +300 %); "+300%" (SECONDARY, amber) comes in whole on the stout entrance riding the bar's
// top, landed on f90 (after "300" f84, before the f92 limit), and a light sweep clicks across the tall slice
// as it settles (f95-105). Then a living hold to f129 (creep, sway, grain): the tall bar, the cream team, the
// small dimmed bars beside it.
// Contacts: each old peg is in its slot until it is gone (sink clipped at the slot line); each new peg starts
// in the same slot on the frame after its predecessor is gone (old i gone at f44+3i, new i from f44+3i). The
// third bar is in its slot from its first frame (the open pocket closes over its first 6 screen px); the
// amber starts where its top passes this year's height (1.7 units).
// AMBER = growth / the KPI going up (COMMON.md): here the +300 % slice and its label; the old +60–80 % amber
// dims to board / lo. Cream = the subject (the product, its bars, the new team); board = context.
//
// SOURCES: the 300 % is the speaker's own figure about his company; Revolut's 2024 annual report (CFO review,
// p13, "wealth revenues grew 298% YoY"; note 6: Wealth £506.3m vs £127.1m) bears it out (director's data note
// animation_source/notes/revolut_wealth_data.md). The bar is drawn at exactly 4x this year's (6.8 vs 1.7
// units). "+60–80%" is his own recollection (cut B). Revolut R: revolutMark.ts (via wealthWorld).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  EDGE,
  LightSweep,
  METRIC,
  Numeral,
  SPACE,
  StoutStage,
  TYPE,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  numeralWidth,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { camCheck, type Glide, type PoolKey } from "../kits/cheeky-pint/museShared";
import { PegShadows, PegSlot, sinkDepth } from "../kits/cheeky-pint/talentShared";
import {
  BAR_CREAM,
  BAR_H,
  BAR_W,
  B_END,
  B_LABEL,
  B_LAST_S,
  BarShadow,
  FLOOR,
  FPS as WORLD_FPS,
  KEEP_IN,
  PEG_SIZE,
  SLOT_X,
  SX,
  SY,
  SlotBar,
  TEAM_OLD,
  TILE,
  TILE_X0,
  TILE_X1,
  Team,
  WEALTH_REST,
  WealthTile,
  bLabelY,
  makeWealthCam,
  makeWealthPool,
  riseCurve,
  riseLift,
  type BarSpec,
  type PegSpec,
} from "./wealthWorld";

export const FPS = 24000 / 1001;
export const DURATION = 130;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- beats (this cut's frames f; S = B_LAST_S + f) -------------------------------------------------------------
export const C_T = {
  OLD_SINK: (i: number) => [34 + 3 * i, 44 + 3 * i] as const, // "then we changed": peg i sinks into its slot
  NEW_RISE: (i: number) => [44 + 3 * i, 55 + 3 * i] as const, // "... the team": its successor rises out of it
  RECEDE: [56, 70] as const, // the old slice and label recede by tone (and the label to the LABEL token)
  RISE3: [64, 98] as const, // the third bar, ONE rise ("and now it's growing 300")
  LABEL_IN: 78, // "+300%" enters over 12 f, landed f90
  SWEEP: [95, 105] as const, // the click, on the tall amber slice once it has settled
} as const;
const ENTER_F = 12;
const S_OF = (f: number) => B_LAST_S + f;

// --- the camera: B's track (its creep runs on to S 170) + this cut's two moves --------------------------------
// The end framing (k 0.94): the tile's foot at screen y ~1048, its top ~992; the 6.8-unit bar's top ~400 and
// "+300%" above it from y ~305; the tile + tall bar + label centred as one column (tile x ~260-710, the bar at
// x ~650, "+300%" x ~435-870). Solved from the bar's height:
// (FLOOR - bar top) * k + CLEAR + figure height must fit y ~305..1048.
export const C_END_LOOK = { x: 600, y: FLOOR - (1048 - 960) / 0.94, k: 0.94 } as const;
const B_TARGET = { x: 541.5 + 6 + 4, y: 1296 - 66 + 3.8 }; // B_CAM_START + B's glide deltas (wealthWorld)
const DRIFT = { dx: 0, dy: 18, k: 1.815 }; // f0-60: the board drifts up toward the focus, B's creep-in stopped (the tile already spans x 93-954 of the 955 button column)
export const C_GLIDES: Glide[] = [
  { f0: S_OF(0), f1: S_OF(60), dx: DRIFT.dx, dy: DRIFT.dy, k: DRIFT.k, warp: 1 },
  {
    // f44-92: ONE pull-back + tilt up that leads the third bar (it must outpace it: checked below)
    f0: S_OF(44),
    f1: S_OF(92),
    dx: C_END_LOOK.x - (B_TARGET.x + DRIFT.dx),
    dy: C_END_LOOK.y - (B_TARGET.y + DRIFT.dy),
    k: C_END_LOOK.k,
    warp: 1,
  },
  { f0: S_OF(96), f1: S_OF(180), dx: 7, dy: -6, k: 0.944, warp: 1 }, // the living creep through the hold
];
export const C_CAM = makeWealthCam(C_GLIDES, S_OF(DURATION + 2));

// --- the light pool: B's keys + onto the swap, then up the tall bar ---------------------------------------------
export const C_POOL_KEYS: PoolKey[] = [
  { f0: S_OF(20), f1: S_OF(56), x: 420, y: TILE.TOP - 40 }, // toward the team as it is swapped
  { f0: S_OF(60), f1: S_OF(100), x: SLOT_X[2] - 30, y: TILE.TOP - 300, strength: 1.6 }, // up the tall bar
];
export const C_POOL = makeWealthPool(C_POOL_KEYS, S_OF(DURATION + 2));

// --- what is where, at this cut's frame f ------------------------------------------------------------------------
const winT = (f: number, [a, b]: readonly number[]) => (f - a) / (b - a);
/** The third bar's height (world px above the tile top). */
export const bar3H = (f: number) => BAR_H.next * riseCurve(winT(f, C_T.RISE3));
/** The old growth receding: 0 = as in B, 1 = board / lo, LABEL token. */
export const recede = (f: number) => smoothstep(winT(f, C_T.RECEDE));
/** The old label: its size (SCREEN px, SECONDARY -> LABEL token) and centre x (it steps left a little so it
 *  stays clear of the third bar: centred over this year's bar's left half at the LABEL size). */
const OLD_X_END = 600;
export const oldLabel = (f: number, k: number) => {
  const r = recede(f);
  const px = lerp(B_LABEL.px, TYPE.LABEL, r);
  const x = lerp(SLOT_X[1], OLD_X_END, r);
  const y = bLabelY(k);
  const w = numeralWidth(B_LABEL.text, px) / k;
  return { px, x, y, w, x0: x - w / 2, x1: x + w / 2, top: y - (px * METRIC.fig) / k, r };
};
/** "+300%" rides the third bar's top: baseline CLEAR screen px above it. */
export const NEW_LABEL = { text: "+300%", px: TYPE.SECONDARY } as const;
const newLabelY = (f: number, k: number) => TILE.TOP - bar3H(f) - SPACE.CLEAR / k;
/** The tile's printed face counter-scales as the camera pulls back (1 at f0 = B's, FACE_END in the wide), on
 *  the camera's own progress (ln k), so "WEALTH & TRADING" stays readable at k 0.94. */
const FACE_END = 1.3;
export const faceScaleAt = (k: number) => lerp(1, FACE_END, clamp01((Math.log(B_END.cam.k) - Math.log(k)) / (Math.log(B_END.cam.k) - Math.log(C_END_LOOK.k))));
/** The swap: old peg i's sink, new peg i's sink (1 = all the way down, behind the tile's top edge). */
const swapEase = (t: number) => smoothstep(t);
export const oldSink = (f: number, i: number) => swapEase(winT(f, C_T.OLD_SINK(i)));
export const newSink = (f: number, i: number) => 1 - swapEase(winT(f, C_T.NEW_RISE(i)));

// ===========================================================================
// DRAWN PIECES OF THIS CUT (new names only; the world's pieces are used as they are)
// ===========================================================================
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `nt${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** wealthWorld's hot edge (private there), the same recipe. */
const HotEdge: React.FC<{ x: number; y: number; w: number; h: number; k: number; on: number }> = ({ x, y, w, h, k, on }) => {
  const uid = uidOf(useId());
  const r = 4;
  const fall = Math.max(0.01, Math.min(EDGE.HOT_FALL / k, h));
  if (on <= 0.002) return null;
  return (
    <g opacity={on < 1 ? f2(on) : undefined}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${uid})`} />
      <path d={`M${f2(x + r)} ${f2(y + EDGE.HOT / k / 2)}H${f2(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
    </g>
  );
};

/** wealthWorld's SlotBar with one addition: `dim` 0..1 takes its amber slice to board by TONE (the amber body,
 *  its bloom and hot edge give way to a board slice with a board's lit edge). At dim 0 it draws exactly what
 *  SlotBar draws (same elements, same order). */
const DimBar: React.FC<{ bar: BarSpec; k: number; band: [number, number]; dim: number }> = ({ bar, k, band, dim }) => {
  const uid = uidOf(useId());
  const h = bar.h;
  if (h * k <= 0.05) return null;
  const r = 4;
  const x0 = bar.x - BAR_W / 2;
  const top = TILE.TOP - h;
  const amberH = Math.max(0, h - bar.cream);
  const creamH = h - amberH;
  const amberOn = clamp01((amberH * k) / 6);
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  const d = clamp01(dim);
  const lit = 1 - d;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(band[0])} x2="0" y2={f2(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(top + amberH)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {amberH > 0 ? (
        <path d={rectPath(x0, TILE.TOP - creamH, BAR_W, creamH, 0, false, false)} fill={`url(#${uid}c)`} />
      ) : (
        <path d={rectPath(x0, top, BAR_W, h, r, true, false)} fill={`url(#${uid}c)`} />
      )}
      {amberH > 0 && d > 0.001 ? <path d={rectPath(x0, top, BAR_W, amberH, r, true, false)} fill={`url(#${uid}b)`} /> : null}
      {amberH > 0 && lit > 0.001 ? (
        <g style={{ filter: bloomFilter(k) }} opacity={d > 0.001 ? f2(lit) : undefined}>
          <path d={rectPath(x0, top, BAR_W, amberH, r, true, false)} fill={`url(#${uid}a)`} />
        </g>
      ) : null}
      {amberOn < 1 ? (
        <path
          d={`M${f2(x0 + r)} ${f2(top + EDGE.CREAM / k / 2)}H${f2(x0 + BAR_W - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={f2(ALPHA.edge * (1 - amberOn))}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
      ) : null}
      {amberH > 0 && d > 0.001 ? (
        <path
          d={`M${f2(x0 + r)} ${f2(top + EDGE.CREAM / k / 2)}H${f2(x0 + BAR_W - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={f2(ALPHA.edgeBoard * d)}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
      ) : null}
      {amberH > 0 ? <HotEdge x={x0} y={top} w={BAR_W} h={amberH} k={k} on={amberOn * lit} /> : null}
      <rect x={f2(x0)} y={f2(TILE.TOP - ao)} width={f2(BAR_W)} height={f2(ao)} fill={`url(#${uid}o)`} />
    </g>
  );
};

// --- the cream peg: talentShared's PersonPeg figure (the same 429-unit bust), in CREAM card ----------------------
// (PersonPeg has kraft and amber tones only; the geometry below is its head / shoulders, copied verbatim.)
const PU = 429;
const P_HEAD = { cy: 327, r: 102 };
const P_SH_H = 204;
const pegHead = (x: number, y: number, size: number, inset = 0) => {
  const u = size / PU;
  const r = P_HEAD.r * u - inset / 2;
  const cy = y - P_HEAD.cy * u + inset / 2;
  return `M${f2(x + r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x - r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x + r)} ${f2(cy)}Z`;
};
const pegShoulders = (x: number, y: number, size: number, inset = 0) => {
  const u = size / PU;
  const q = (P_SH_H * u - inset) / (P_SH_H * u);
  const X = (a: number) => f2(x + (a - 255.5) * u);
  const Y = (b: number) => f2(y + (b - 470) * u * q);
  return (
    `M${X(41)} ${Y(458)}C${X(41)} ${Y(352)} ${X(126)} ${Y(266)} ${X(232)} ${Y(266)}L${X(279)} ${Y(266)}` +
    `C${X(385)} ${Y(266)} ${X(470)} ${Y(352)} ${X(470)} ${Y(458)}L${X(470)} ${Y(462)}Q${X(470)} ${Y(470)} ${X(462)} ${Y(470)}` +
    `L${X(49)} ${Y(470)}Q${X(41)} ${Y(470)} ${X(41)} ${Y(462)}Z`
  );
};
/** A cream peg standing in a slot on the tile's top edge (feet x, y), `sink` 0..1 down into it (clipped at
 *  the slot line, as PersonPeg). Lit cream card: top-to-foot cream gradient, the cream lit rim on head and
 *  shoulders, the foot occlusion. Its shadow is drawn by the group (PegShadows); its slot by PegSlot. */
const CreamPeg: React.FC<{ x: number; y: number; size: number; k: number; sink: number }> = ({ x, y, size, k, sink }) => {
  const uid = uidOf(useId());
  const s = clamp01(sink);
  if (s >= 0.995) return null;
  const feet = y + sinkDepth(s, size);
  const top = feet - size;
  const e = EDGE.CREAM / k;
  const rim = mixHex(COLOR.cream, COLOR.edge, ALPHA.edge);
  const ao = Math.min(EDGE.FOOT_AO / k, 0.2 * size);
  return (
    <g clipPath={s > 0 ? `url(#${uid}c)` : undefined}>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(feet)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y - ao)} x2="0" y2={f2(y)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO * 1.6} />
        </linearGradient>
        <clipPath id={`${uid}s`}>
          <path d={pegHead(x, feet, size) + pegShoulders(x, feet, size)} />
        </clipPath>
        {s > 0 ? (
          <clipPath id={`${uid}c`}>
            <rect x={f2(x - size)} y={f2(y - 2 * size)} width={f2(2 * size)} height={f2(2 * size)} />
          </clipPath>
        ) : null}
      </defs>
      <path d={pegHead(x, feet, size)} fill={rim} />
      <path d={pegShoulders(x, feet, size)} fill={rim} />
      <path d={pegHead(x, feet, size, e)} fill={`url(#${uid}b)`} />
      <path d={pegShoulders(x, feet, size, e)} fill={`url(#${uid}b)`} />
      <rect x={f2(x - size / 2 + (8 * size) / PU)} y={f2(y - ao)} width={f2(size * (1 - 16 / PU))} height={f2(ao)} fill={`url(#${uid}ao)`} clipPath={`url(#${uid}s)`} />
    </g>
  );
};

/** The new team: ONE shadow layer, the cream pegs, then their slots on top (as PersonPeg draws its slot). */
const NewTeam: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const pegs = TEAM_OLD.map((p, i) => ({ ...p, sink: newSink(f, i) }));
  if (pegs.every((p) => p.sink >= 0.995)) return null;
  return (
    <g>
      <PegShadows pegs={pegs.map((p) => ({ x: p.x, y: p.y, size: p.size, sink: p.sink }))} />
      {pegs.map((p, i) => (
        <CreamPeg key={i} x={p.x} y={p.y} size={p.size} k={k} sink={p.sink} />
      ))}
      {pegs.map((p, i) => (p.sink < 0.995 ? <PegSlot key={`s${i}`} x={p.x} y={p.y} size={p.size} k={k} on="cream" /> : null))}
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const NewTeamThreeHundred: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = S_OF(f);
  const cam = C_CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const r = recede(f);
  const h3 = bar3H(f);
  const bars: BarSpec[] = [
    { key: "last", ...B_END.bars[0] },
    { key: "now", ...B_END.bars[1] },
    { key: "next", x: SLOT_X[2], h: h3, cream: BAR_CREAM.next, lift: riseLift(f, C_T.RISE3) },
  ];
  const oldTeam: PegSpec[] = TEAM_OLD.map((p, i) => ({ ...p, sink: oldSink(f, i) }));
  const ol = oldLabel(f, k);
  const sweepT = winT(f, C_T.SWEEP);
  return (
    <StoutStage S={S} cam={cam} rest={WEALTH_REST} pool={C_POOL(S)}>
      {/* the board, in WealthBoard's order: bar shadows, tile, bars, team */}
      {bars.map((b) => (
        <BarShadow key={b.key} bar={b} />
      ))}
      <WealthTile k={k} slotFill={bars.map((b) => b.h)} faceScale={faceScaleAt(k)} />
      <SlotBar bar={bars[0]} k={k} band={band} />
      <DimBar bar={bars[1]} k={k} band={band} dim={r} />
      <SlotBar bar={bars[2]} k={k} band={band} />
      <Team team={oldTeam} k={k} band={band} />
      <NewTeam f={f} k={k} />
      {/* the old label: amber -> lo by tone (lo under, amber over at 1 - r), SECONDARY -> the LABEL token */}
      {r > 0.001 ? <Numeral x={ol.x} y={ol.y} k={k} px={ol.px} text={B_LABEL.text} tone="creamLo" /> : null}
      <g opacity={r > 0.001 ? f2(1 - r) : undefined}>
        {r < 0.999 ? <Numeral x={ol.x} y={ol.y} k={k} px={ol.px} text={B_LABEL.text} tone="amber" glow /> : null}
      </g>
      {/* the click on the tall slice, once it has settled */}
      <LightSweep x={SLOT_X[2] - BAR_W / 2} y={TILE.TOP - h3} w={BAR_W} h={h3 - BAR_CREAM.next} k={k} t={sweepT} on="amber" r={4} />
      <Numeral
        x={SLOT_X[2]}
        y={newLabelY(f, k)}
        k={k}
        px={NEW_LABEL.px}
        text={NEW_LABEL.text}
        tone="amber"
        glow
        enter={clamp01((f - C_T.LABEL_IN) / ENTER_F)}
      />
    </StoutStage>
  );
};

export default NewTeamThreeHundred;

// --- load-time checks: the join, every frame, every camera state --------------------------------------------------
export const C_CHECK = (() => {
  const fail = (m: string) => {
    throw new Error(`NewTeamThreeHundred: ${m}`);
  };
  if (FPS !== WORLD_FPS) fail("FPS differs from wealthWorld's");
  if (DURATION !== Math.round((51.426 - 46.004) * FPS)) fail("DURATION is not the slot");
  // the join: f0 is B's last frame (camera, pool; bars and team as B_END; nothing has started)
  const c0 = C_CAM.at(S_OF(0));
  for (const key of ["x", "y", "k"] as const) if (Math.abs(c0[key] - B_END.cam[key]) > 1e-9) fail(`f0 camera ${key} differs from B_END_CAM`);
  const p0 = C_POOL(S_OF(0));
  if (Math.abs(p0.x - B_END.pool.x) > 1e-9 || Math.abs(p0.y - B_END.pool.y) > 1e-9) fail("f0 pool differs from B's");
  if (bar3H(0) !== 0 || recede(0) !== 0 || oldSink(0, 0) !== 0 || newSink(0, 0) !== 1) fail("something has started on f0");
  // the swap: each seat's successor rises only once its predecessor is gone
  for (let i = 0; i < TEAM_OLD.length; i++) if (C_T.NEW_RISE(i)[0] < C_T.OLD_SINK(i)[1]) fail(`seat ${i}: the new peg rises before the old one is gone`);
  // pegs never meet a bar (the team stands left of the first slot)
  const pegRight = Math.max(...TEAM_OLD.map((p) => p.x + PEG_SIZE / 2));
  if (pegRight + 8 > SLOT_X[0] - BAR_W / 2) fail("the team touches the first bar");
  const stats = { minTop: Infinity, maxFoot: 0, minX: Infinity, maxX: 0, minGap: Infinity, bar3TopUpUntil: 0 };
  let prevTop = Infinity;
  const sway = 5;
  for (let f = 0; f < DURATION; f++) {
    const c = C_CAM.at(S_OF(f));
    const k = c.k;
    const h3 = bar3H(f);
    // the tile in the keep-in box, clear of the button column below y 900
    const tx0 = SX(c, TILE_X0);
    const tx1 = SX(c, TILE_X1);
    const foot = SY(c, FLOOR);
    if (tx0 < KEEP_IN.x0 || tx1 > 955.5) fail(`f${f}: the tile spans x ${tx0.toFixed(0)}-${tx1.toFixed(0)}`);
    if (foot + sway > KEEP_IN.y1) fail(`f${f}: the tile's foot at y ${foot.toFixed(0)}`);
    stats.maxFoot = Math.max(stats.maxFoot, foot);
    stats.minX = Math.min(stats.minX, tx0);
    stats.maxX = Math.max(stats.maxX, tx1);
    // the tall bar's top (and "+300%" once it is entering) inside the box
    const top3 = SY(c, TILE.TOP - h3);
    if (top3 - sway < KEEP_IN.y0) fail(`f${f}: the third bar's top at y ${top3.toFixed(0)}`);
    stats.minTop = Math.min(stats.minTop, top3);
    if (f >= C_T.LABEL_IN) {
      const y = SY(c, newLabelY(f, k));
      const w = numeralWidth(NEW_LABEL.text, NEW_LABEL.px);
      const x = SX(c, SLOT_X[2]);
      const lt = y - NEW_LABEL.px * METRIC.fig;
      if (lt - sway < KEEP_IN.y0 || x - w / 2 < KEEP_IN.x0 || x + w / 2 > KEEP_IN.x1) fail(`f${f}: "+300%" box x ${(x - w / 2).toFixed(0)}-${(x + w / 2).toFixed(0)}, top ${lt.toFixed(0)}`);
      stats.minTop = Math.min(stats.minTop, lt);
    }
    // growth outpaces the pull-back: the tall bar's top climbs on screen every frame of its rise
    if (f > C_T.RISE3[0] + 2 && f <= C_T.RISE3[1] - 6) {
      if (top3 > prevTop - 0.5) fail(`f${f}: the third bar's top does not climb on screen (${prevTop.toFixed(1)} -> ${top3.toFixed(1)})`);
      stats.bar3TopUpUntil = f;
    }
    prevTop = top3;
    // the old label: inside the box, and never over the third bar (world: its right edge vs the bar's left
    // edge, while the bar's top is above the label's foot)
    const ol = oldLabel(f, k);
    const lx0 = SX(c, ol.x0);
    const lx1 = SX(c, ol.x1);
    if (lx0 < KEEP_IN.x0 || lx1 > KEEP_IN.x1 || SY(c, ol.top) - sway < KEEP_IN.y0) fail(`f${f}: the old label leaves the keep-in box`);
    if (TILE.TOP - h3 < ol.y + 4) {
      const gap = (SLOT_X[2] - BAR_W / 2 - ol.x1) * k;
      stats.minGap = Math.min(stats.minGap, gap);
      if (gap < 8) fail(`f${f}: the old label is ${gap.toFixed(1)} px from the third bar`);
    }
  }
  const cc = camCheck((s) => C_CAM.at(s), S_OF(0), S_OF(DURATION - 1));
  return { ...stats, cam: cc };
})();
