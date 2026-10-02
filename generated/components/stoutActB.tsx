import React from "react";
import {
  ALPHA,
  COLOR,
  FONT_NUM,
  GEO,
  METRIC,
  MONEY,
  SPACE,
  STROKE,
  TILE_TOP,
  TRACK,
  TYPE,
  Label,
  LightSweep,
  Numeral,
  Pillar,
  RUNG_F,
  StoutStage,
  amberBandFor,
  camFor,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  smoothstep,
  snapLen,
  type Figure,
  type Pool,
} from "./stoutShared";
import { cameraTrack, type Cam, type Glide } from "./outgrowShared";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF } from "./fieldShared";
import type { CrestId } from "./wolffLogos";
import {
  BAR_IN_F,
  BAR_IN_S,
  COL_IN_S,
  COL_WAVE,
  CTX_S,
  CUT3,
  CUT4,
  FILL_F,
  FILL_IN_S,
  FILL_WAVE,
  MERC_OUTLINE_S,
  OUTLINE_AT,
  SIX_B_IN_S,
  STRETCH_S1,
  STRETCH_SETTLE_F,
  S_END,
  TILE_IN_F,
  TILE_IN_S,
  TILE_WAVE,
  W,
  mercM,
} from "./wolffActB";

// ===========================================================================
// stoutActB — ACT B of the Toto Wolff "Mercedes F1 financials" clip in the STOUT
// system (stoutShared.tsx; out/wolff/briefs/STOUT.md + STOUT_MOTION.md).
// Builder B. One world on Act B's story clock S_B, two windows:
//   cut 3 ConservativeMultiplesStout  S_B 0-96    "These multiples are actually on the conservative side."
//   cut 4 SomeHaveFundamentalsStout   S_B 94-233  "When you look at the valuations of the US teams, you
//                                                  have fundamentals for some of the teams."
// Words, beats, story and the 3->4 join (cut 4 f0 = cut 3 f94, 0 px) are V1/V2's
// (wolffActB.tsx, wolffActB2.tsx — imported for the clock, never edited); the
// look, scale and finish are stout's. The delivered V1/V2 files stay as they are.
//
// THE SET. Act B draws money at MONEY.B = 42 px / $1B (stout's act-B scale). The
// Mercedes "now" pillar is the same object as in cut 1 (tile + $1B bar + $300M
// slice), seen in its own establishing shot at this scale. Every pillar is ONE
// stout Pillar (one union shadow, the slot joint, one amber band per frame).
//
// RESTS = THE STYLE FRAMES (StoutFrames.tsx, out/wolff/stout/frames/):
//   cut 3 rests on c3_end: k 2.0, the floor at screen (540, 1368), pool at
//     TILE_TOP - 140, "$6B" (SECONDARY, cream) over "20x" (HERO, amber, glow)
//   cut 4 rests on c4_end: k 1.5625, the floor at (540, 1368), pool at TILE_TOP -
//     220, five pillars at PITCH, "$6B" (SECONDARY, creamLo) over "20x" (SECONDARY)
//   Heights at rest are snapLen'd at the rest k, as the frames do (pixel care);
//   Mercedes eases from its cut-3 snap to its cut-4 snap with the camera.
//
// ONE MOTION PER CUT (unchanged):
//   cut 3 — ONE STRETCH: the profit slice's copy pulls upward to twenty times its
//     height; the camera rides its top from the now pillar's establishing shot to
//     the 20x column; the counter rolls 1x -> 20x; "$6B" arrives on the landing.
//   cut 4 — THE SAME YARDSTICK ACROSS FOUR REAL US TEAMS: their crests arrive,
//     their valuations rise tall beside Mercedes, then each team's own operating
//     income stretched x20 fills one, most of another, and falls far short in two.
//
// GESTURES -> word -> S_B (cut 4 frame = S_B - 94)
//  cut 3
//   1. THE STRETCH: glass + fill grow together from the slice's lower edge, m 1 ->
//      20 on V1's ease (smoothstep(u^1.35) over S -6..58, already separating on f0),
//      a rung left behind per slice-height -> "these multiples are actually" ->
//      lands S 58, 4 f before "conservative"; zero-sloped settle S 58-64
//   2. THE ESTABLISHING SHOT: the now pillar on the axis at k 3.25, "$1B"/"REVENUE"
//      left of the bar and "30%"/"PROFIT" right of it on shared baselines -> "these"
//      -> S 0-8; both lockups leave together (the reverse entrance) -> S 8-20
//   3. THE COUNTER (Numeral, HERO, amber, glow) arrives in their wake riding the top
//      and ROLLS as an odometer (rollBlur = a 180-degree shutter's sigma) to "20x"
//      -> "multiples ... actually" -> in S 10-22, rolling to S 58
//   4. CAMERA: the zoom leads (S 0-46, k 3.25 -> 2.0), the tilt follows (S 0-52),
//      riding the top (the counter only ever rises on screen, y 659 -> 589) to
//      c3_end's camera (within 0.06 px through S 64-74)
//   5. THE CLICK: one LightSweep across the stretched amber on the "20x" landing,
//      S 58-68 -> "conservative" (62)
//   6. "$6B" (SECONDARY, cream) slides up + blurs in over "20x" -> S 52-64
//   7. the glass hairline eases lo -> hi as the column completes (fully backed)
//      -> S 56-68
//   8. the pull-back toward c4_end starts in the tail (zoom S 74-120, tilt S 90-200),
//      C1 across the join -> "on the conservative side" + tail
//  cut 4
//   9. "$6B" eases cream -> creamLo by TONE (context now) -> "when you look" -> S 98-110;
//      "20x" eases HERO -> SECONDARY with the camera's progress (at rest: a token)
//  10. the four crest pillars rise into their slots, a wave outward from Mercedes
//      (inner S 98, outer S 101, 13 f), each LIFTED while it travels and settling
//      onto its contact shadow; the pull-back has them inside the frame as they rise
//      (outer edges >= 13 px from it, 63 at rest) -> "look at the"
//  11. their bars rise out of the slots, the amber slice first -> "valuations"
//  12. their valuation glass stretches up, tallest last (S 114/117 -> 155) with a
//      zero-sloped settle -> "valuations of the US teams"
//  13. breath: the tilt carries on as a creep -> "teams" -> S 155-170
//  14. THE YARDSTICK: every team's own profit x20 fills its glass at once (inner S
//      170, outer S 172, 34 f), rungs at that team's slice -> "you have fundamentals
//      for some" -> lands S 204-206 on "of the teams"
//  15. a glass whose fill reaches its top eases lo -> hi (the Cowboys only, S 201-213)
//  16. tail: the camera lands exactly on c4_end, the pool settles -> "teams" + tail
//  No click in cut 4 (group arrivals never click).
//
// DATA (out/wolff/briefs/data.md): Mercedes $1B revenue / $300M profit (Toto),
// $6B = the Kurtz deal, Nov 2025 (GBP 4.57B / $5.97B; CNBC 20 Nov 2025, BlackBook 21
// Nov 2025) = 20 x the $300M. The US cast is the "Cut 4 V2" table (Forbes team
// pages: NBA list Oct 2025, NFL 2025 list), kept in ONE swappable table, CAST_B.
//
// WRITTEN HERE FROM stoutShared TOKENS (stoutShared has no continuous form of
// these two): GlassHairlineTone (the glass hairline eased lo -> hi by tone over
// RUNG_F frames) and TonedNumeral (a static Numeral whose ink eases between the
// cream and creamLo tones).
// ===========================================================================

export const PB = MONEY.B; // 42 world px per $1B in act B
export const X_NOW = GEO.X_NOW;
export const FLOOR = GEO.FLOOR;
export const PITCH = GEO.PITCH;

// --- the cast: ONE swappable table ----------------------------------------------------------------
// Left to right; Mercedes in the middle slot. Figures in $B. To swap the cast or its
// numbers, edit this table only (data.md "Cut 4 V2"; the user may still change them).
export type CastMember = {
  id: "MERCEDES" | CrestId;
  name: string;
  rev: number; // revenue
  profit: number; // operating income
  val: number; // valuation
};
export const CAST_B: CastMember[] = [
  { id: "LAKERS", name: "LA Lakers", rev: 0.551, profit: 0.17, val: 10.0 },
  { id: "WARRIORS", name: "Golden State Warriors", rev: 0.88, profit: 0.409, val: 11.0 },
  { id: "MERCEDES", name: "Mercedes", rev: 1.0, profit: 0.3, val: 6.0 },
  { id: "KNICKS", name: "New York Knicks", rev: 0.532, profit: 0.098, val: 9.75 },
  { id: "COWBOYS", name: "Dallas Cowboys", rev: 1.2, profit: 0.629, val: 13.0 },
];
export const MULTIPLE = 20; // Mercedes' own multiple, $6B / $300M: the yardstick
const MID = Math.floor(CAST_B.length / 2);
export const slotX = (i: number) => X_NOW + (i - MID) * PITCH;
export const MERC_I = CAST_B.findIndex((c) => c.id === "MERCEDES");
export const US_I = CAST_B.map((_, i) => i).filter((i) => i !== MERC_I);
/** The wave outward from Mercedes: 0 for the inner pair, 1 for the outer pair. */
export const ringOf = (i: number) => Math.abs(i - MID) - 1;
export const figureOf = (c: CastMember): Figure => (c.id === "MERCEDES" ? { kind: "mercedes" } : { kind: "crest", id: c.id });

// --- the two rests (the style frames' cameras) ----------------------------------------------------
export const K3 = 2.0; // c3_end (StoutFrames K3)
export const K4 = 1.5625; // c4_end (StoutFrames K4)
export const CAM3 = camFor(X_NOW, FLOOR, 540, 1368, K3);
export const CAM4 = camFor(X_NOW, FLOOR, 540, 1368, K4);
export const POOL3: { x: number; y: number } = { x: X_NOW, y: TILE_TOP - 140 }; // c3_end's pool
export const POOL4: { x: number; y: number } = { x: X_NOW, y: TILE_TOP - 220 }; // c4_end's pool

/** A cast member's money at rest, snapped at a rest k (the style frames' pixel care). */
export const restGeom = (c: CastMember, k: number) => {
  const bar = snapLen(c.rev * PB, k);
  const slice = snapLen(c.profit * PB, k);
  const glass = snapLen(c.val * PB, k);
  const fill = Math.min(glass, snapLen(c.profit * MULTIPLE * PB, k));
  return { bar, slice, glass, fill, backed: fill / glass >= OUTLINE_AT };
};
const MERC = CAST_B[MERC_I];
const M3 = restGeom(MERC, K3);
const M4 = restGeom(MERC, K4);

// --- cut 3: the establishing shot of the now pillar ------------------------------------------------
// Act B's own shot of the now pillar (42 px/$B): the tile at c1_end's size (k 3.25), the
// pillar on the axis, its two lockups flanking it on shared baselines (STOUT.md: "labels
// aligned to shared baselines") — "$1B" over "REVENUE" left of the bar, "30%" over
// "PROFIT" right of it, both centred on the slice as c1_end centres "30%" — so the space
// above the bar is clear for the stretch and its counter. Composed with the counter's
// slot (HERO, riding the top) so that slot + pillar are centred on y 835.
export const K_OPEN = 3.25;
const counterAbove = SPACE.CLEAR + TYPE.HERO * METRIC.fig; // above the stretch's top, screen px
export const OPEN_FLOOR_Y = (() => {
  const h = counterAbove + (M3.bar + GEO.TILE) * K_OPEN + 6; // + the contact shadow
  return Math.round(835 + h / 2 - 6);
})();
export const CAM_OPEN = camFor(X_NOW, FLOOR, 540, OPEN_FLOOR_Y, K_OPEN);
export const POOL_OPEN: { x: number; y: number } = { x: X_NOW, y: TILE_TOP - M3.bar / 2 };

// --- cut 3: the stretch -------------------------------------------------------------------------------
export const STRETCH_OVER = 1.5; // world px past the top and back (3 screen px at k 2)
/** Mercedes' glass = fill height while it stretches (cut 3), then at rest. */
export const mercStretch = (S: number) => {
  const m = mercM(S);
  const t = S - STRETCH_S1;
  const bump = t <= 0 || t >= STRETCH_SETTLE_F ? 0 : STRETCH_OVER * Math.pow(Math.sin((Math.PI * t) / STRETCH_SETTLE_F), 2);
  return M3.slice + ((M3.fill - M3.slice) * (m - 1)) / (MULTIPLE - 1) + bump;
};
/** The counter's odometer value: the multiple the top has reached. */
export const counterValue = (S: number) => mercM(S);
/** Its roll speed (SCREEN px/f of a rolling digit) -> rollBlur. Numeral's rollBlur is a Gaussian
 *  SIGMA, so a 180-degree shutter (a streak half the frame's travel long) is sigma = 0.29 x 0.5 x
 *  speed ~ 0.15 x speed; capped at a tenth of the line so a digit never smears past its own height. */
export const ROLL_SHUTTER = 0.15;
export const counterBlur = (S: number, px: number) => {
  const v = counterValue(S);
  const dv = Math.abs(counterValue(S + 0.5) - counterValue(S - 0.5));
  const frac = v - Math.floor(v);
  const speed = px * 6 * frac * (1 - frac) * dv;
  return v >= MULTIPLE ? 0 : Math.min(px / 10, ROLL_SHUTTER * speed);
};

// --- cut 4: the cast's tracks -----------------------------------------------------------------------
const H_MAX = Math.max(...US_I.map((i) => restGeom(CAST_B[i], K4).glass));
export const COL_F_MAX = 38; // the tallest glass rises in 38 f (V2's law: duration ~ sqrt(height))
export const COL_OVER = 1.5; // world px
export const tileIn = (i: number, S: number) => clamp01((S - (TILE_IN_S + TILE_WAVE * ringOf(i))) / TILE_IN_F);
export const barH = (i: number, S: number) =>
  restGeom(CAST_B[i], K4).bar * smoothstep((S - (BAR_IN_S + TILE_WAVE * ringOf(i))) / BAR_IN_F);
export const colStart = (i: number) => COL_IN_S + COL_WAVE * ringOf(i);
export const colDur = (i: number) => Math.round(COL_F_MAX * Math.sqrt(restGeom(CAST_B[i], K4).glass / H_MAX));
export const glassH = (i: number, S: number) => {
  const g = restGeom(CAST_B[i], K4);
  const t0 = colStart(i);
  const d = colDur(i);
  const t = S - t0 - d;
  const bump = t <= 0 || t >= STRETCH_SETTLE_F ? 0 : COL_OVER * Math.pow(Math.sin((Math.PI * t) / STRETCH_SETTLE_F), 2);
  return g.glass * smoothstep((S - t0) / d) + bump;
};
export const fillStart = (i: number) => FILL_IN_S + FILL_WAVE * ringOf(i);
export const fillH = (i: number, S: number) => {
  if (S < fillStart(i)) return 0;
  const g = restGeom(CAST_B[i], K4);
  const m = 1 + (MULTIPLE - 1) * smoothstep((S - fillStart(i)) / FILL_F);
  return g.slice + ((g.fill - g.slice) * (m - 1)) / (MULTIPLE - 1);
};
/** The frame a fill passes OUTLINE_AT of its glass (its glass then eases lo -> hi), or null. */
export const backedS = (i: number): number | null => {
  const g = restGeom(CAST_B[i], K4);
  if (!g.backed) return null;
  for (let S = fillStart(i); S <= fillStart(i) + FILL_F; S += 0.25) if (fillH(i, S) >= OUTLINE_AT * g.glass) return Math.round(S);
  return null;
};

// --- the camera: the house rig (superposed glides + the damper), solved for the rests ----------------
// `look` = the camera centre - CAM_LIFT / k (cameraTrack's convention).
const lookOf = (c: Cam) => ({ x: c.x, y: c.y - CAM_LIFT / c.k });
const L_OPEN = lookOf(CAM_OPEN);
const L3 = lookOf(CAM3);
const L4 = lookOf(CAM4);
export const GLIDES_S: Glide[] = [
  // cut 3, the ride (solved): the zoom leads (k 3.25 -> 2.0), the tilt follows the stretch's
  // top, so the counter only ever rises on screen (y 659 -> 589) and the camera sits on
  // c3_end's to 0.06 px through S 66-76
  { f0: 0, f1: 46, k: K3, warp: 0.75 },
  { f0: 0, f1: 52, dx: L3.x - L_OPEN.x, dy: L3.y - L_OPEN.y, warp: 1.2 },
  // the pull-back to c4_end (solved): it starts in cut 3's tail (the brief's "slow pull-back
  // that cut 4 continues"), the zoom first, so the outer crests rise inside the frame (their
  // outer edges >= 16 px from it as they enter, 65 at rest); the tilt carries on as the
  // creep and lands on c4_end at S 233
  { f0: 74, f1: 120, k: K4, warp: 0.8 },
  { f0: 90, f1: 200, dy: L4.y - L3.y, warp: 1 },
];
export const CAM_S: Cam[] = cameraTrack({ x: L_OPEN.x, y: L_OPEN.y, k: K_OPEN }, GLIDES_S, S_END + 2);
export const camS = (S: number) => CAM_S[Math.max(0, Math.min(CAM_S.length - 1, Math.round(S)))];
/** Cut 4's camera progress, 0 at c3_end's k .. 1 at c4_end's (type eases between tokens with it). */
export const p4 = (S: number) => clamp01((K3 - camS(S).k) / (K3 - K4));

// --- the light pool: follows the subject with a lag (the camera's own damper) ------------------------
const poolTarget = (S: number): { x: number; y: number } => {
  // cut 3: from the now pillar's bar up the column as the stretch grows; cut 4: up
  // to the group's centre as the US glasses rise
  const q3 = clamp01((mercStretch(S) - M3.slice) / (M3.fill - M3.slice));
  const q4 =
    US_I.reduce((a, i) => a + clamp01(glassH(i, S) / restGeom(CAST_B[i], K4).glass), 0) / US_I.length;
  const y = lerp(lerp(POOL_OPEN.y, POOL3.y, q3), POOL4.y, q4);
  return { x: X_NOW, y };
};
export const POOL_S: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let c = poolTarget(0);
  let v = { x: 0, y: 0 };
  for (let S = 0; S <= S_END + 2; S++) {
    if (S > 0) {
      const t = poolTarget(S);
      v = { x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP };
      c = { x: c.x + v.x, y: c.y + v.y };
    }
    out.push({ ...c });
  }
  return out;
})();
export const poolS = (S: number): Pool => POOL_S[Math.max(0, Math.min(POOL_S.length - 1, Math.round(S)))];

// --- type layout (SCREEN px, the style frames' lockups) -------------------------------------------------
const sy = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
const sx = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
const wAt = (c: Cam, x: number, y: number) => ({ x: c.x + (x - 540) / c.k, y: c.y + (y - 960) / c.k });
/** The establishing shot's lockups: "$1B" over "REVENUE" left of the bar (right-aligned), "30%"
 *  over "PROFIT" right of it, on shared baselines, the pair centred on the slice (c1_end's rule). */
export const nowLockup = (c: Cam) => {
  const barTop = sy(c, TILE_TOP - M3.bar);
  const sliceH = M3.slice * c.k;
  const lock = TYPE.SECONDARY * METRIC.fig + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap;
  const numY = barTop + (sliceH - lock) / 2 + TYPE.SECONDARY * METRIC.fig;
  const wordY = numY + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap;
  return {
    numY,
    wordY,
    leftX: sx(c, X_NOW - GEO.BAR / 2) - SPACE.CLEAR,
    rightX: sx(c, X_NOW + GEO.BAR / 2) + SPACE.CLEAR,
    top: numY - TYPE.SECONDARY * METRIC.dollarTop,
  };
};
/** "$6B" over "20x" on Mercedes' glass (c3_end / c4_end's SixTwenty), at sizes twentyPx / sixPx. */
export const sixTwenty = (c: Cam, glassTopWorld: number, twentyPx: number, sixPx: number) => {
  const twentyY = sy(c, glassTopWorld) - SPACE.CLEAR;
  const sixY = twentyY - twentyPx * METRIC.fig - SPACE.LOCKUP;
  return { x: sx(c, X_NOW), twentyY, sixY, sixTop: sixY - sixPx * METRIC.dollarTop };
};

// The handover: the establishing shot holds its two lockups through "these multiples" while the
// stretch starts, then they leave together (the reverse entrance) and the counter arrives in their
// wake, so "$1B", the counter and "30%" never stand in one row (at 270 px that row read as one
// sentence). They cross over around S 12-13: lockups 30 % / counter 40 % visible.
export const NOW_EXIT_S = 8;
export const COUNTER_IN_S = 10;
export const ENTER_F = 12;
export const SWEEP_S = STRETCH_S1; // the one click: the "20x" landing
export const SWEEP_F = 10;
export const MERC_HI_S = MERC_OUTLINE_S; // Mercedes' glass hairline lo -> hi

// --- two pieces stoutShared has no continuous form of (written from its tokens) -----------------------
/** The glass hairline, eased from its lo to its hi rung by TONE over RUNG_F frames: drawn over a
 *  Pillar whose glassRole is "lo", it lifts the composite to exactly ALPHA.glassHi at t = 1 (then the
 *  Pillar takes glassRole "hi" on its own). Same path as Pillar's hairline (sides + top, open at base). */
const GlassHairlineTone: React.FC<{ x: number; base: number; h: number; k: number; t: number }> = ({ x, base, h, k, t }) => {
  if (t <= 0 || h <= 0.05) return null;
  const target = lerp(ALPHA.glassLo, ALPHA.glassHi, smoothstep(t));
  const a = 1 - (1 - target) / (1 - ALPHA.glassLo);
  const r = GEO.RADIUS;
  const s = STROKE.HAIRLINE / k / 2;
  const x0 = x - GEO.BAR / 2 + s;
  const x1 = x + GEO.BAR / 2 - s;
  const y0 = base - h + s;
  return (
    <path
      d={`M${x0} ${base}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${base}`}
      fill="none"
      stroke={COLOR.glass}
      strokeOpacity={a}
      strokeWidth={STROKE.HAIRLINE / k}
    />
  );
};
/** A static numeral (Numeral's static branch) whose ink is any colour — for the cream -> creamLo
 *  tone ease of "$6B". The house entrance (slide up 24 + fade + blur 6 -> 0). */
const TonedNumeral: React.FC<{ x: number; y: number; k: number; px: number; text: string; color: string; enter: number }> = ({
  x,
  y,
  k,
  px,
  text,
  color,
  enter,
}) => {
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  const fs = px / k;
  const blur = 6 * (1 - a);
  return (
    <g opacity={a} style={{ filter: blur > 0.05 ? `blur(${blur / k}px)` : undefined }}>
      <text
        x={x + (TRACK.numeral * fs) / 2}
        y={y + ((1 - a) * 24) / k}
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={fs}
        letterSpacing={`${TRACK.numeral}em`}
        textAnchor="middle"
        fill={color}
        style={{ fontFeatureSettings: '"lnum" 1' }}
      >
        {text}
      </text>
    </g>
  );
};

// --- the scene ------------------------------------------------------------------------------------------
/** `sway` is on in both cuts; off only for probe stills compared against the (sway-off) style frames. */
export const ActBStoutScene: React.FC<{ S: number; sway?: boolean }> = ({ S, sway = true }) => {
  const cam = camS(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const q = p4(S);

  // Mercedes' pillar: the stretch in cut 3, its cut-3 rest snap easing to its cut-4 snap in cut 4
  const merc = {
    bar: lerp(M3.bar, M4.bar, q),
    slice: lerp(M3.slice, M4.slice, q),
    glass: S <= STRETCH_S1 + STRETCH_SETTLE_F ? mercStretch(S) : lerp(M3.glass, M4.glass, q),
  };
  const mercFill = S <= STRETCH_S1 + STRETCH_SETTLE_F ? merc.glass : lerp(M3.fill, M4.fill, q);
  const mercBase = TILE_TOP - merc.bar + merc.slice;
  const mercHiT = clamp01((S - MERC_HI_S) / RUNG_F);

  // the now lockup (establishing shot), leaving
  const L = nowLockup(cam);
  const nowExit = clamp01((S - NOW_EXIT_S) / ENTER_F);

  // "$6B" over "20x"
  const twentyPx = lerp(TYPE.HERO, TYPE.SECONDARY, q);
  const st = sixTwenty(cam, mercBase - merc.glass, twentyPx, TYPE.SECONDARY);
  const sixColor = mixHex(COLOR.inkCream, COLOR.inkCreamLo, smoothstep((S - CTX_S) / RUNG_F));
  const counterIn = clamp01((S - COUNTER_IN_S) / ENTER_F);
  const sixIn = clamp01((S - SIX_B_IN_S) / ENTER_F);

  return (
    <StoutStage S={S} cam={cam} rest={CAM_S[0]} pool={poolS(S)} sway={sway}>
      {/* the cast, left to right: one Pillar each */}
      {CAST_B.map((c, i) => {
        const x = slotX(i);
        if (i === MERC_I) {
          return (
            <g key={c.id}>
              <Pillar
                x={x}
                k={k}
                figure={figureOf(c)}
                bar={merc.bar}
                slice={merc.slice}
                glass={merc.glass}
                fill={mercFill}
                rung={merc.slice}
                glassRole={mercHiT >= 1 ? "hi" : "lo"}
                amberBand={band}
              />
              {mercHiT < 1 ? <GlassHairlineTone x={x} base={mercBase} h={merc.glass} k={k} t={mercHiT} /> : null}
              {/* THE CLICK: one light sweep across the stretched amber on the "20x" landing */}
              <LightSweep
                x={x - GEO.BAR / 2}
                y={mercBase - mercFill}
                w={GEO.BAR}
                h={mercFill}
                k={k}
                t={(S - SWEEP_S) / SWEEP_F}
                on="amber"
              />
            </g>
          );
        }
        const e = tileIn(i, S);
        if (e <= 0) return null;
        const g = restGeom(c, K4);
        const glass = glassH(i, S);
        const fill = Math.min(fillH(i, S), glass);
        const bS = backedS(i);
        const hiT = bS === null ? 0 : clamp01((S - bS) / RUNG_F);
        const bar = barH(i, S);
        const slice = Math.min(g.slice, bar);
        return (
          <g key={c.id}>
            <Pillar
              x={x}
              k={k}
              figure={figureOf(c)}
              bar={bar}
              slice={slice}
              glass={glass}
              fill={fill}
              rung={g.slice}
              glassRole={hiT >= 1 ? "hi" : "lo"}
              enter={e}
              lift={1 - easeOutCubic(e)}
              amberBand={band}
            />
            {hiT > 0 && hiT < 1 ? <GlassHairlineTone x={x} base={TILE_TOP - bar + slice} h={glass} k={k} t={hiT} /> : null}
          </g>
        );
      })}

      {/* the establishing shot's two lockups, handing the picture to the counter */}
      {nowExit < 1 ? (
        <>
          <Numeral {...wAt(cam, L.leftX, L.numY)} k={k} px={TYPE.SECONDARY} text="$1B" tone="cream" anchor="end" exit={nowExit} />
          <Label {...wAt(cam, L.leftX, L.wordY)} k={k} text="revenue" tone="creamLo" anchor="end" exit={nowExit} />
          <Numeral {...wAt(cam, L.rightX, L.numY)} k={k} px={TYPE.SECONDARY} text="30%" tone="amber" anchor="start" glow exit={nowExit} />
          <Label {...wAt(cam, L.rightX, L.wordY)} k={k} text="profit" tone="creamLo" anchor="start" exit={nowExit} />
        </>
      ) : null}

      {/* the counter (an odometer) riding the top, landing on "20x"; "$6B" over it */}
      <Numeral
        {...wAt(cam, st.x, st.twentyY)}
        k={k}
        px={twentyPx}
        value={counterValue(S)}
        format={(v) => `${v}×`}
        rollBlur={counterBlur(S, twentyPx)}
        tone="amber"
        glow
        enter={counterIn}
      />
      <TonedNumeral {...wAt(cam, st.x, st.sixY)} k={k} px={TYPE.SECONDARY} text="$6B" color={sixColor} enter={sixIn} />
    </StoutStage>
  );
};

// --- load-time assertions --------------------------------------------------------------------------------
const fail = (m: string) => {
  throw new Error(`stoutActB: ${m}`);
};
if (CAST_B[MID].id !== "MERCEDES") fail("Mercedes must stand in the middle slot");
if (Math.abs(MERC.profit * MULTIPLE - MERC.val) > 1e-9) fail("Mercedes' $6B is not 20 x its $300M");
if (CUT4.S0 + CUT4.DURATION - 1 !== S_END) fail("cut 4 does not end on S_END");
if (CUT3.S0 + CUT3.DURATION - 1 < CUT4.S0 + 2) fail("cut 3's last three frames are not cut 4's first three");
if (W.conservative - STRETCH_S1 < 4 || W.conservative - STRETCH_S1 > 10) fail("the stretch does not land 4-10 f before 'conservative'");
if (Math.abs(mercStretch(STRETCH_S1 + STRETCH_SETTLE_F) - M3.fill) > 1e-6) fail("the stretch does not land on the $6B fill");
