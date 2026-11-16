import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  Numeral,
  METRIC,
  SPACE,
  TRACK,
  TYPE,
  bloomFilter,
  clamp01,
  labelWidth,
  lerp,
  numeralWidth,
  rectPath,
  snapLen,
  type Elevation,
} from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, type Cam, type Glide, type PoolKey } from "../kits/cheeky-pint/museShared";
import { PersonPeg, PegShadows, pegGeometry } from "../kits/cheeky-pint/talentShared";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "../nik-trend-friend/revolutMark";

// ===========================================================================
// wealthWorld — the shared growth world of "nik - my job is detecting bullshit" (Cheeky Pint S4E06, Nik
// Storonsky), cuts B `GrewSixtyToEighty` (32.407-36.662 s) and C (46.004-51.426 s, another builder). Stout
// board, palette B1, every colour / edge / shadow / bloom a stoutShared token. API + B's end state:
// animation_source/notes/WEALTH_READY.md (clip notes folder). After WEALTH_READY no export's name or
// geometry changes; additions are logged in animation_source/notes/SHARED_CHANGES.md.
//
//   THE PRODUCT TILE  one wide cream card = Revolut's Wealth & Trading product: the real R (revolutMark,
//                     Commons "Revolut_logo.svg", public-domain text logo) stamped in ink + "WEALTH &
//                     TRADING" in ink Kräftig caps on its face. Along its top edge, left: the product
//                     team (TEAM_OLD, board-tone PersonPegs in cream peg slots, ONE shadow layer);
//                     right: three bar SLOTS (SLOT_X: last year, this year, cut C's).
//   THE BARS          rise out of their slots (slot joint, never stickers). A bar is cream up to `cream`
//                     (world px above the tile top) and AMBER above it (band gradient from amberBandFor,
//                     fixed bloom, 2 px hot top edge): the amber is the growth. An empty slot is a dark
//                     open pocket in the top edge; it closes to the 2 px joint line as a bar fills it.
//   THE CLOCK         S = cut B's frame (0..B_LAST_S = 101). Cut C opens on B's last frame, so C's
//                     S = B_LAST_S + its own frame (the 9.342 s of speaker between the cuts is NOT on
//                     the clock: ground drift, sway and grain on twos continue from B's last frame).
//   THE CAMERA        makeWealthCam(extraGlides, fEnd): B's glides + any C appends (f0 >= B_LAST_S), the
//                     house superposed glides + damped follower (museShared makeClockCam: look = the
//                     frame's middle). The track is identical through S = B_LAST_S whatever C appends,
//                     and B's last creep glide runs on past B's end into C.
//                     The light pool: makeWealthPool(extraKeys, fEnd), same rule.
// ===========================================================================

export const FPS = 24000 / 1001;
/** Cut B: 32.407 -> 36.662 s = 4.255 s x 23.976 = 102 frames (S 0..101). */
export const B_DURATION = 102;
export const B_LAST_S = B_DURATION - 1; // 101
/** Cut C's slot starts 46.004 s, 9.342 s after B's (36.662): not on the clock (C's S = B_LAST_S + f). */
export const C_GAP_S = 46.004 - 36.662;

// --- geometry (WORLD px) ------------------------------------------------------------------------------
/** The product tile: centre x, top edge, width, height. It stands on FLOOR. */
export const TILE = { X: 540, TOP: 1200, W: 476, H: 60 } as const;
export const TILE_X0 = TILE.X - TILE.W / 2; // 302
export const TILE_X1 = TILE.X + TILE.W / 2; // 778
export const FLOOR = TILE.TOP + TILE.H; // 1260
/** Every bar's width (chunky: 144 screen px at REST_K). */
export const BAR_W = 80;
/** One unit of growth = last year's bar (world px). B: last 1.0, this 1.7; C: next 6.8. */
export const BAR_UNIT = 88;
/** The k all data heights are snapped at (snapLen): B's resting framing. */
export const REST_K = 1.8;
/** Slot centres along the tile's top edge: [last year, this year, cut C's]. */
export const SLOT_X = [512, 616, 720] as const;
/** The team pegs' size (= height = shoulder width, world px). */
export const PEG_SIZE = 40;
/** The product team in B (board tone, feet on the tile's top edge, left of the slots). C swaps them. */
export const TEAM_OLD: { x: number; y: number; size: number }[] = [340, 384, 428].map((x) => ({ x, y: TILE.TOP, size: PEG_SIZE }));

/** The bars' heights in units, and in world px (snapped at REST_K). `cream` = the cream part's height;
 *  above it the bar is amber (the growth). */
export const UNITS = { last: 1.0, now: 1.7, next: 6.8 } as const;
export const BAR_H = {
  last: snapLen(UNITS.last * BAR_UNIT, REST_K), // 88
  now: snapLen(UNITS.now * BAR_UNIT, REST_K), // 149.6 -> 149.444
  next: snapLen(UNITS.next * BAR_UNIT, REST_K), // 598.4 -> 598.333 (C's suggestion: +300 %)
} as const;
export const BAR_CREAM = {
  last: BAR_H.last, // all cream
  now: BAR_H.last, // cream up to last year's height, the +0.7 above it amber
  next: BAR_H.now, // C: cream up to this year's 1.7, the 5.1 above it amber
} as const;

// --- the tile's face (WORLD px; it is printed on the card, so it scales with the world) ---------------
export const FACE = { R_H: 27, GAP: 10, FS: 22, TEXT: "Wealth & Trading" } as const;

// --- B's beats (cut-B frames = S) ---------------------------------------------------------------------
// think f7 · two f10 · or f16 · three f19 · years f21 · ago f27 · it f32 · grew f40 · up f45 · 60 % f50 ·
// or f62 · 80 % f66 · year f75 · on f81 · year f83 · (speech ends ~f86) · and f88 · slot ends f102.
export const B_T = {
  RISE1: [-4, 26], // last year's bar, rest to rest, already emerging on f0 (two or three years ago)
  RISE2: [32, 66], // this year's bar, ONE rise: cream to 1.0 (~f47), amber on to 1.7, lands on "80" (f66)
  LABEL_IN: 56, // "+60–80%" blurs in + slides up 24 px over 12 f: in f56-68 (60 f50 .. 80 f66)
  SWEEP: 66, // the click: a light sweep across the amber slice as the bar lands, 10 f
} as const;
/** ONE decelerating curve from rest to rest: p(t) = 1 - (1-t)^b (1 + b t), velocity ∝ t (1-t)^(b-1). */
export const RISE_SHAPE = 3;
export const riseCurve = (t: number, b: number = RISE_SHAPE) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, b) * (1 + b * u);
};
const winT = (S: number, [a, b]: readonly [number, number] | readonly number[]) => (S - a) / (b - a);
/** B's bar heights at story time S (world px): last year's, this year's. Constant after B (S > 101). */
export const bBars = (S: number) => ({
  last: BAR_H.last * riseCurve(winT(S, B_T.RISE1)),
  now: BAR_H.now * riseCurve(winT(S, B_T.RISE2)),
});
/** The lifted share of a rising bar's shadow: up to LIFT_PEAK mid-rise, rest (0) on landing. */
export const LIFT_PEAK = 0.5;
export const riseLift = (S: number, win: readonly number[]) => {
  const t = winT(S, win);
  return t <= 0 || t >= 1 ? 0 : LIFT_PEAK * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
};

// --- the label "+60–80%" (the speaker's own range), Dreiviertelfett SECONDARY, amber ------------------
export const B_LABEL = { text: "+60–80%", px: TYPE.SECONDARY } as const;
/** Its baseline (world y) under camera k: SPACE.CLEAR screen px above this year's bar top. */
export const bLabelY = (k: number) => TILE.TOP - BAR_H.now - SPACE.CLEAR / k;

// --- camera (museShared makeClockCam: look = world point on the frame's middle) ------------------------
/** The look and k before the pre-roll (the opening creep is already moving on f0). */
export const B_CAM_START = { x: 541.5, y: 1296, k: 1.66 } as const;
export const B_CAM_GLIDES: Glide[] = [
  { f0: -12, f1: 74, dx: 6, dy: -66, k: 1.775, warp: 1 }, // already drifting in on f0 (the tile + team centred, top y ~803), and tilting up with the bars (two or three years ago .. 80 %): the tile ends low (top y ~903)
  { f0: 40, f1: 170, dx: 4, dy: 3.8, k: 1.86, warp: 1 }, // the creep: carries on through B's hold and past its end (into C)
];
export const makeWealthCam = (extra: Glide[] = [], fEnd: number = B_LAST_S) => makeClockCam(B_CAM_START, [...B_CAM_GLIDES, ...extra], Math.max(fEnd, B_LAST_S));
export const B_CAM = makeWealthCam();
/** B's last frame's camera (S = 101), at full precision. C's f0 renders this. */
export const B_END_CAM: Cam = B_CAM.at(B_LAST_S);
/** The ground's parallax origin (StoutStage `rest`) for B and C. */
export const WEALTH_REST: Cam = B_CAM.rest;
/** A SUGGESTION for C's wide: the 6.8-unit bar + tile inside the keep-in box (tile bottom y ~1045, the
 *  tall bar's top y ~420, the tile centred). C owns its camera. */
export const C_TALL_CAM: Cam = { x: TILE.X + 40, y: FLOOR - (1045 - 960) / 0.95, k: 0.95 };

// --- the light pool (museShared makePoolTrack: eased keys + the pool's damped follower) -----------------
export const B_POOL_START = { x: 470, y: TILE.TOP - 30, strength: 1.5 } as const;
export const B_POOL_KEYS: PoolKey[] = [
  { f0: 0, f1: 24, x: SLOT_X[0], y: TILE.TOP - 60 }, // onto last year's bar
  { f0: 34, f1: 66, x: SLOT_X[1] - 10, y: TILE.TOP - 100 }, // up onto this year's bar as it grows
  { f0: 66, f1: 120, x: (SLOT_X[0] + SLOT_X[1]) / 2 + 20, y: TILE.TOP - 96 }, // settles between the two
];
export const makeWealthPool = (extra: PoolKey[] = [], fEnd: number = B_LAST_S) => makePoolTrack(B_POOL_START, [...B_POOL_KEYS, ...extra], Math.max(fEnd, B_LAST_S));
export const B_POOL = makeWealthPool();

// --- B's END state (S = 101), for C ----------------------------------------------------------------------
export const B_END = {
  S: B_LAST_S,
  cam: B_END_CAM,
  pool: B_POOL(B_LAST_S),
  bars: [
    { x: SLOT_X[0], h: BAR_H.last, cream: BAR_CREAM.last },
    { x: SLOT_X[1], h: BAR_H.now, cream: BAR_CREAM.now },
  ],
  team: TEAM_OLD,
  label: { text: B_LABEL.text, px: B_LABEL.px, x: SLOT_X[1], y: bLabelY(B_END_CAM.k) },
} as const;

// ===========================================================================
// DRAWN PIECES
// ===========================================================================
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ww${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** A bar in a slot: centre x, total height h above the tile top, cream up to `cream`, amber above. */
export type BarSpec = { x: number; h: number; cream: number; lift?: number; key?: string };
/** A team member: feet (x, y) on the tile top (y default TILE.TOP); PersonPeg's tone controls. */
export type PegSpec = { x: number; y?: number; size?: number; blend?: number; shade?: number; sink?: number; elevation?: Elevation; lift?: number };

/** The slot opening's width (world): the bar + a lip each side (SCREEN px). */
export const slotWidth = (k: number) => BAR_W + (2 * EDGE.SLOT_LIP) / k;
/** An open (empty) slot's pocket depth (SCREEN px). */
export const POCKET_PX = 7;

/** The hot top edge of an amber body (stoutShared's recipe: 2 px line + 12 px falloff, SCREEN px). */
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

/** One bar's body: cream from the tile top up to `cream`, amber above (one bloom pass), its top edge
 *  (cream lit edge, or the hot edge once the amber is a few screen px tall: they cross over, no pop),
 *  the foot occlusion over the slot. Its shadow is BarShadow. */
export const SlotBar: React.FC<{ bar: BarSpec; k: number; band: [number, number] }> = ({ bar, k, band }) => {
  const uid = uidOf(useId());
  const h = bar.h;
  if (h * k <= 0.05) return null;
  const r = 4;
  const x0 = bar.x - BAR_W / 2;
  const top = TILE.TOP - h;
  const amberH = Math.max(0, h - bar.cream);
  const creamH = h - amberH;
  const amberOn = clamp01((amberH * k) / 6); // the edge crossover over the first 6 screen px of amber
  const ao = Math.min(h, EDGE.FOOT_AO / k);
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
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {/* cream: rounded top while it is the top, square under the amber */}
      {amberH > 0 ? (
        <path d={rectPath(x0, TILE.TOP - creamH, BAR_W, creamH, 0, false, false)} fill={`url(#${uid}c)`} />
      ) : (
        <path d={rectPath(x0, top, BAR_W, h, r, true, false)} fill={`url(#${uid}c)`} />
      )}
      {amberH > 0 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <path d={rectPath(x0, top, BAR_W, amberH, r, true, false)} fill={`url(#${uid}a)`} />
        </g>
      ) : null}
      {/* the top edge: the cream's lit edge fades as the hot edge comes up (amberOn) */}
      {amberOn < 1 ? (
        <path
          d={`M${f2(x0 + r)} ${f2(top + EDGE.CREAM / k / 2)}H${f2(x0 + BAR_W - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={f2(ALPHA.edge * (1 - amberOn))}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
      ) : null}
      {amberH > 0 ? <HotEdge x={x0} y={top} w={BAR_W} h={amberH} k={k} on={amberOn} /> : null}
      <rect x={f2(x0)} y={f2(TILE.TOP - ao)} width={f2(BAR_W)} height={f2(ao)} fill={`url(#${uid}o)`} />
    </g>
  );
};

/** A bar's one shadow (its own silhouette; rest, or lifted by `bar.lift` while it rises). */
export const BarShadow: React.FC<{ bar: BarSpec }> = ({ bar }) =>
  bar.h <= 0.02 ? null : (
    <ElevationShadow silhouette={[{ d: rectPath(bar.x - BAR_W / 2, TILE.TOP - bar.h, BAR_W, bar.h + 4, 4, true, false) }]} elevation="rest" lift={bar.lift ?? 0} />
  );

/** A slot in the tile's top edge: an open dark pocket while empty, closing to the stout joint line as a
 *  bar fills it (over its first 6 screen px). `fill` = the bar's height in it (world px). */
export const Slot: React.FC<{ x: number; k: number; fill: number }> = ({ x, k, fill }) => {
  const w = slotWidth(k);
  const u = clamp01((fill * k) / 6);
  const hOpen = POCKET_PX / k;
  const hJoint = EDGE.SLOT / k;
  const h = lerp(hOpen, hJoint, u);
  const y0 = lerp(TILE.TOP, TILE.TOP - hJoint / 2, u);
  return (
    <rect
      x={f2(x - w / 2)}
      y={f2(y0)}
      width={f2(w)}
      height={f2(h)}
      rx={f2(lerp(Math.min(h / 2, 2 / k), 0, u))}
      fill={COLOR.inkDark}
      fillOpacity={f2(lerp(0.9, ALPHA.slot, u))}
    />
  );
};

/** The R stamp + "WEALTH & TRADING" on the tile's face, centred (WORLD px). `scale` > 1 only if a cut
 *  must counter-scale the face to stay readable in a wide (default 1). */
export const tileFace = (scale = 1) => {
  const rh = FACE.R_H * scale;
  const rw = (rh * REVOLUT_R_BOX.w) / REVOLUT_R_BOX.h;
  const fs = FACE.FS * scale;
  const tw = labelWidth(FACE.TEXT, fs) - TRACK.label * fs; // the advance minus the trailing track
  const gap = FACE.GAP * scale;
  const total = rw + gap + tw;
  const cy = TILE.TOP + TILE.H / 2;
  const x0 = TILE.X - total / 2;
  return { rx: x0, ry: cy - rh / 2, rw, rh, tx: x0 + rw + gap, ty: cy + (METRIC.cap * fs) / 2, fs, total };
};

/** The product tile: one cream card on its one shadow (+ contact), the R stamp and the name in ink on
 *  its face, the lit top edge (broken at every bar slot), the slots. */
export const WealthTile: React.FC<{ k: number; slotFill: number[]; faceScale?: number }> = ({ k, slotFill, faceScale = 1 }) => {
  const uid = uidOf(useId());
  const r = 4;
  const face = tileFace(faceScale);
  const sw = slotWidth(k);
  const y = TILE.TOP + EDGE.CREAM / k / 2;
  // the lit edge, in segments between the slot openings
  const cuts = SLOT_X.map((x) => [x - sw / 2, x + sw / 2]);
  let d = `M${f2(TILE_X0 + r)} ${f2(y)}`;
  for (const [a, b] of cuts) d += `H${f2(a)}M${f2(b)} ${f2(y)}`;
  d += `H${f2(TILE_X1 - r)}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(TILE.TOP)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow
        silhouette={[{ d: rectPath(TILE_X0, TILE.TOP, TILE.W, TILE.H, r) }]}
        elevation="rest"
        contact={{ x: TILE.X, y: FLOOR, w: (TILE.W + 16) / 1.16 }}
      />
      <path d={rectPath(TILE_X0, TILE.TOP, TILE.W, TILE.H, r)} fill={`url(#${uid}c)`} />
      {/* the R, an ink stamp (evenodd), and the product's name in ink Kräftig caps */}
      <path
        d={REVOLUT_R_D}
        transform={`translate(${fx(face.rx)} ${fx(face.ry)}) scale(${fx(face.rh / REVOLUT_R_BOX.h)})`}
        fill={COLOR.inkDark}
        fillRule="evenodd"
      />
      <text
        x={f2(face.tx)}
        y={f2(face.ty)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f2(face.fs)}
        letterSpacing={`${TRACK.label}em`}
        fill={COLOR.inkDark}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        {FACE.TEXT.toUpperCase()}
      </text>
      <path d={d} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      {SLOT_X.map((x, i) => (
        <Slot key={i} x={x} k={k} fill={slotFill[i] ?? 0} />
      ))}
    </g>
  );
};

/** The team: ONE shadow layer (PegShadows), then the board-tone pegs in their cream slots. */
export const Team: React.FC<{ team: PegSpec[]; k: number; band: [number, number]; elevation?: Elevation; lift?: number }> = ({ team, k, band, elevation = "rest", lift = 0 }) => (
  <g>
    <PegShadows pegs={team.map((p) => ({ x: p.x, y: p.y ?? TILE.TOP, size: p.size ?? PEG_SIZE, sink: p.sink ?? 0 }))} elevation={elevation} lift={lift} />
    {team.map((p, i) => (
      <PersonPeg
        key={i}
        x={p.x}
        y={p.y ?? TILE.TOP}
        size={p.size ?? PEG_SIZE}
        k={k}
        blend={p.blend ?? 0}
        shade={p.shade ?? 0}
        sink={p.sink ?? 0}
        elevation={p.elevation ?? "rest"}
        lift={p.lift ?? 0}
        shadow={false}
        slot="cream"
        amberBand={band}
      />
    ))}
  </g>
);

/** The whole board object at one moment: tile (+ slots filled by `bars`), bar shadows, bars, team. */
export const WealthBoard: React.FC<{ k: number; band: [number, number]; bars: BarSpec[]; team: PegSpec[]; faceScale?: number }> = ({ k, band, bars, team, faceScale }) => {
  const slotFill = SLOT_X.map((x) => bars.filter((b) => Math.abs(b.x - x) < 1).reduce((a, b) => Math.max(a, b.h), 0));
  return (
    <g>
      {bars.map((b, i) => (
        <BarShadow key={b.key ?? i} bar={b} />
      ))}
      <WealthTile k={k} slotFill={slotFill} faceScale={faceScale} />
      {bars.map((b, i) => (
        <SlotBar key={b.key ?? i} bar={b} k={k} band={band} />
      ))}
      <Team team={team} k={k} band={band} />
    </g>
  );
};

/** B's bars at story time S (with their rise lifts), as WealthBoard takes them. At S >= 66 = B_END.bars. */
export const bBarSpecs = (S: number): BarSpec[] => {
  const h = bBars(S);
  return [
    { key: "last", x: SLOT_X[0], h: h.last, cream: BAR_CREAM.last, lift: riseLift(S, B_T.RISE1) },
    { key: "now", x: SLOT_X[1], h: h.now, cream: BAR_CREAM.now, lift: riseLift(S, B_T.RISE2) },
  ];
};
/** "+60–80%" over this year's bar: amber Dreiviertelfett SECONDARY with the bloom, the stout entrance
 *  (`enter` 0..1 over 12 f) and its reverse (`exit`). Baseline bLabelY(k): it keeps SPACE.CLEAR screen px
 *  over the bar at any k. */
export const BLabel: React.FC<{ k: number; enter?: number; exit?: number }> = ({ k, enter = 1, exit = 0 }) => (
  <Numeral x={SLOT_X[1]} y={bLabelY(k)} k={k} px={B_LABEL.px} text={B_LABEL.text} tone="amber" glow enter={enter} exit={exit} />
);

// --- small screen helpers ------------------------------------------------------------------------------------
export const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
export const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
/** The keep-in box (CRAFT.md / COMMON.md, 9:16): everything that matters inside it on every frame. */
export const KEEP_IN = { x0: 65, x1: 1015, y0: 290, y1: 1070 } as const;
/** The label's screen box (approx: Söhne advances; the top is the figures' height). */
export const labelBox = (c: Cam, y: number = bLabelY(c.k)) => {
  const w = numeralWidth(B_LABEL.text, B_LABEL.px);
  const cx = SX(c, SLOT_X[1]);
  return { x0: cx - w / 2, x1: cx + w / 2, y0: SY(c, y) - B_LABEL.px * METRIC.fig, y1: SY(c, y) };
};

// --- load-time checks (B's geometry; C's suggestion fits) -----------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`wealthWorld: ${m}`);
  };
  if (Math.abs(BAR_CREAM.now - BAR_H.last) > 1e-9) fail("this year's cream must end at last year's height");
  if (SLOT_X[0] - BAR_W / 2 <= Math.max(...TEAM_OLD.map((p) => pegGeometry(p.x, p.y, p.size).right)) + 8) fail("the team crowds the first slot");
  if (SLOT_X[2] + BAR_W / 2 > TILE_X1 - 8) fail("the third slot runs off the tile");
  for (let i = 1; i < SLOT_X.length; i++) if (SLOT_X[i] - SLOT_X[i - 1] < BAR_W + 16) fail("slots too close");
  const face = tileFace();
  if (face.total > TILE.W - 40) fail("the face runs off the tile");
  // C's suggested wide: the 6.8-unit bar and the tile inside the keep-in box
  const c = C_TALL_CAM;
  if (SY(c, FLOOR) > KEEP_IN.y1 || SY(c, TILE.TOP - BAR_H.next) < KEEP_IN.y0 + 100) fail("C_TALL_CAM does not fit the tall bar");
  if (SX(c, TILE_X0) < KEEP_IN.x0 || SX(c, TILE_X1) > KEEP_IN.x1) fail("C_TALL_CAM: the tile runs out of the keep-in box");
}
