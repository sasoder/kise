import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bead,
  type Cam,
  DATA_W,
  DOT_R,
  FONT_SERIF,
  FeatherWipe,
  type Glide,
  HatchFill,
  INK,
  INK_HI,
  INK_LO,
  InkDiffuse,
  Label,
  type Pt,
  PAPER,
  RED,
  RED_HI,
  RED_WET,
  RISE_PX,
  Stage,
  WASH_FILL,
  WASH_HATCH,
  WetLine,
  camFromTrack,
  clamp01,
  easeInCubic,
  easeOutCubic,
  edgeFactor,
  enterFrom,
  enterU,
  glideTargetAt,
  labelPx,
  lerp,
  paperShadow,
  polyD,
  rungAt,
  runFollower,
  shootEase,
  smoothstep,
  sz,
  textBlurPx,
  useStageView,
  worldBlur,
} from "./chinatalkShared";

// ---------------------------------------------------------------------------
// AThirdOfGlobalGDP — Logan Wright, "the biggest credit boom in history"
// (ChinaTalk), V2 cut 2 of 5, delivered as 10_AThirdOfGlobalGDP.mov.
//
// LINE: "China added a third of global GDP to its bank assets in just eight years."
// IN = 242 (edit-timeline frame of "china"). The last word "years" ends at 375,
// so 375 - 242 = 133, + a 16-frame tail = DURATION 149 f at 24 fps.
// Local word frames: china 0 · added 4 · a 10 · third 15 · of 20 · global 25 ·
// gdp(to) 37–68 · its 68 · bank 78 · assets 84–98 · in 98 · just 110 · eight 116 ·
// years 121–133.
//
// IDEA: a slice of the world economy poured into China's banks, one year at a
// time. Top: the world economy as a disc (ink edge, ink wash + fine hatch).
// Below: China's BANK ASSETS as a vessel (a tall pill outline in ink). The
// bottom third of the disc slides out, turns red over the vessel's mouth and
// drains into it; the vessel fills in eight layers. RED = China's credit only.
//
// DATA: the eight layers are the real yearly increments of Chinese banking-
// system assets, RMB trillion added per year 2009–2016 ≈ 16, 16, 18, 21, 17,
// 21, 27, 33 (PBoC / CBRC aggregates, rounded; ~RMB 62T end-2008 → ~232T
// end-2016, ≈ +169T ≈ US$25T, about a third of world GDP). Each layer's AREA is
// its share of the total, so they are unequal; the year odometer ticks as each
// layer's seam lands. The vessel's area equals the wedge's area (conserved).
//
// GESTURES (local frames; nothing else moves except the camera and the house sway):
// 1. "China added" (0–22): the disc is being written — two wet-ink tips run from
//    the top down both sides (already 42 % round on f0) and meet at the bottom
//    on f20; the wash + hatch soak in top-down behind them (feathered wipe).
//    Camera: pre-rolled push-in on the disc, disc ≈ 640 screen px wide.
// 2. "a third" (11–30): two radii write from the centre (11–22); the 120°
//    bottom wedge separates with one eased slide (shoot-and-settle, 18–66) that
//    carries on as the drift toward the vessel; "1/3" blurs in on it (lands 24).
// 3. "global GDP" (25–68): "GLOBAL GDP" lands ABOVE the disc on 29 (see open
//    question: under the disc is where the wedge travels); the vessel's ink
//    outline writes in (two tips from the lips down to the bottom, 34–62) while
//    the camera glides down and out (24–90, k 1.39 → 1.13) so disc and vessel
//    share the frame, still close on the pour;
//    the wedge drifts on toward the mouth.
// 4. "to its bank assets" (60–98): the wedge reaches the mouth and red soaks up
//    through it from its lowest point (60–74; "1/3" diffuses 64–80, the ink
//    hatch fades under the red); a red stream with a wet bead head falls from
//    the wedge's lowest point into the vessel (68–84); red pools at the bottom
//    (84 on). "BANK ASSETS" lands under the vessel on 84. The wedge drains as
//    it pours (its surface falls: 70–120).
// 5. "in just eight years" (84–125): the pour accelerates (credit boom) and the
//    vessel fills in eight layers, each landing with a fine paper seam; the
//    year odometer under BANK ASSETS (lands 92) rolls 2008 → 2016, one tick per
//    seam (ticks ≈ 98, 102, 105, 109, 111, 114, 118, 125 — the 8th on "years").
//    The disc's remaining 2/3 and GLOBAL GDP ease to ink 0.42 (100–112).
//    Camera: holds close on the pour, then one slow pull-back to the wide
//    (100–152, k 1.13 → 1.0) for the payoff.
// 6. Tail (120–149): the stream's tail lets go and falls in (120–127), the
//    empty wedge outline diffuses like ink (122–140), one last drip falls
//    (130–137), a travelling highlight runs up the full red vessel (131–148).
//    Final frame: the disc missing its third above, the full red vessel below,
//    BANK ASSETS / 2016 under it, centred; nothing below y 1400.
// WEIGHTS (director's phone note): ink lines LINE_W 6.2 world at K_REF (≈ 7–9
// screen px), the red stream DATA_W x 1.05 (≈ 10 px); all text ink.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 242;
export const DURATION = 149;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- geometry (world px) ---------------------------------------------------------
const CX = 540;
const CY = 600; // disc centre
const R = 230; // disc radius
const DEG = Math.PI / 180;
const A_R = 30 * DEG; // the wedge's right edge (SVG angle, y down)
const A_L = 150 * DEG; // its left edge
const D_MAX = 80; // how far the wedge slides out of the disc
const SPOUT_GAP = 44; // the wedge's lowest point -> the vessel's mouth
const VW = 190; // vessel width
const V_TOP = CY + D_MAX + R + SPOUT_GAP; // the mouth

const polar = (a: number, r = R): Pt => ({ x: Math.cos(a) * r, y: Math.sin(a) * r });
const arcPts = (a0: number, a1: number, ox: number, oy: number, r = R): Pt[] => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (2 * DEG)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const p = polar(a0 + ((a1 - a0) * i) / n, r);
    return { x: ox + p.x, y: oy + p.y };
  });
};
const shoelace = (p: Pt[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
};
/** The part of a closed polygon at or below world y `yl` (Sutherland–Hodgman). */
const clipBelow = (poly: Pt[], yl: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a.y >= yl;
    const bin = b.y >= yl;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (yl - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * t, y: yl });
    }
  }
  return out;
};
/** The level y at which the part of `poly` below it holds `frac` of its area. */
const levelFor = (poly: Pt[], total: number, frac: number) => {
  let lo = Math.min(...poly.map((p) => p.y));
  let hi = Math.max(...poly.map((p) => p.y));
  if (frac >= 1) return lo;
  if (frac <= 0) return hi;
  for (let i = 0; i < 34; i++) {
    const m = (lo + hi) / 2;
    if (shoelace(clipBelow(poly, m)) > frac * total) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

/** The wedge with its apex at (0, 0). */
const WEDGE_REL: Pt[] = [{ x: 0, y: 0 }, ...arcPts(A_R, A_L, 0, 0)];
const WEDGE_AREA = shoelace(WEDGE_REL);
/** The 2/3 disc (the world economy minus the slice). */
const DISC_REST: Pt[] = [{ x: CX, y: CY }, ...arcPts(A_L, A_R + 2 * Math.PI, CX, CY)];
const DISC_FULL: Pt[] = arcPts(0, 2 * Math.PI, CX, CY).slice(0, -1);

// The vessel: a tall pill open at the mouth, its area = the wedge's (conserved).
const capsule = (h: number): Pt[] => {
  const r = VW / 2;
  return [
    { x: CX - r, y: V_TOP },
    { x: CX - r, y: V_TOP + h - r },
    ...arcPts(Math.PI, 0, CX, V_TOP + h - r, r).slice(1, -1),
    { x: CX + r, y: V_TOP + h - r },
    { x: CX + r, y: V_TOP },
  ];
};
const VH = (() => {
  let lo = VW;
  let hi = 1200;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (shoelace(capsule(m)) < WEDGE_AREA) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
const V_BOT = V_TOP + VH;
const VESSEL: Pt[] = capsule(VH);
const VESSEL_AREA = shoelace(VESSEL);
/** One side of the outline, written from the lip down to the bottom centre. */
const vesselSide = (sgn: -1 | 1): Pt[] => {
  const r = VW / 2;
  return [
    { x: CX + sgn * r, y: V_TOP },
    { x: CX + sgn * r, y: V_BOT - r },
    ...arcPts(sgn < 0 ? Math.PI : 0, Math.PI / 2, CX, V_BOT - r, r).slice(1),
  ];
};
const V_LEFT = vesselSide(-1);
const V_RIGHT = vesselSide(1);

// --- the data: RMB T added per year 2009–2016 -------------------------------------
const INCREMENTS = [16, 16, 18, 21, 17, 21, 27, 33];
const INC_TOTAL = INCREMENTS.reduce((a, b) => a + b, 0);
const CUM_FRAC = (() => {
  let c = 0;
  return INCREMENTS.map((v) => (c += v) / INC_TOTAL);
})();

// --- timing (local frames) ----------------------------------------------------------
const CIRC_T = 20; // the two circle tips meet at the bottom
const CIRC_S0 = 0.42 * Math.PI * R; // already drawn on f0 (each tip)
const CIRC_V0 = (1.5 * (Math.PI * R - CIRC_S0)) / CIRC_T;
const RADII_F0 = 11;
const RADII_F1 = 22;
const SLIDE_F0 = 18;
const SLIDE_F1 = 66;
const VES_F0 = 34;
const VES_F1 = 62;
const SOAK_F0 = 60;
const SOAK_F1 = 74;
const FALL_F0 = 68;
const FALL_F1 = 84;
const POUR_F0 = 84; // red reaches the vessel's floor
const POUR_F1 = 125; // full ("years")
const DRAIN_F0 = 70;
const DRAIN_F1 = 120;
const TAIL_F1 = 127;
const DRIP_F0 = 130;
const DRIP_F1 = 137;
const WEDGE_GONE_F0 = 122;
const WEDGE_GONE_F = 18;
const LO_F = 100; // the disc becomes context
const HL_F0 = 131;
const HL_F1 = 148;

/** Cubic Hermite from (p0, v0) to (p1, 0) over [0, T]. */
const hermiteOut = (p0: number, v0: number, p1: number, T: number, t: number) => {
  const u = clamp01(t / T);
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  return h00 * p0 + h10 * T * v0 + h01 * p1;
};
/** Arc length drawn by each circle tip at frame f (extrapolated before f0). */
const circLen = (f: number) => (f < 0 ? Math.max(0, CIRC_S0 + CIRC_V0 * f) : f >= CIRC_T ? Math.PI * R : hermiteOut(CIRC_S0, CIRC_V0, Math.PI * R, CIRC_T, f));
const radiiLen = (f: number) => R * smoothstep((f - RADII_F0) / (RADII_F1 - RADII_F0));
const SIDE_LEN = (VH - VW / 2) + (Math.PI / 2) * (VW / 2);
const vesLen = (f: number) => SIDE_LEN * smoothstep((f - VES_F0) / (VES_F1 - VES_F0));
/** Frame at which a monotone length track first reached s (bisection). */
const timeAt = (lenAt: (f: number) => number, s: number, lo: number, hi: number) => {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 28; i++) {
    const m = (a + b) / 2;
    if (lenAt(m) < s) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
const slideD = (f: number) => D_MAX * shootEase((f - SLIDE_F0) / (SLIDE_F1 - SLIDE_F0));

// The pour clock: an accelerating flow with a soft stop, v(u) ∝ u^1.8 (1-u)^0.6
// (credit accelerating through the boom). Its CDF, tabulated.
const POUR_TAB = (() => {
  const N = 2000;
  const tab = [0];
  let s = 0;
  for (let i = 1; i <= N; i++) {
    const u = (i - 0.5) / N;
    s += Math.pow(u, 1.8) * Math.pow(1 - u, 0.6);
    tab.push(s);
  }
  return tab.map((v) => v / s);
})();
const pourCdf = (u: number) => {
  const x = clamp01(u) * (POUR_TAB.length - 1);
  const i = Math.min(POUR_TAB.length - 2, Math.floor(x));
  return lerp(POUR_TAB[i], POUR_TAB[i + 1], x - i);
};
/** Fraction of the wedge's volume that has reached the vessel. */
const filled = (f: number) => pourCdf((f - POUR_F0) / (POUR_F1 - POUR_F0));
/** Fraction that has left the wedge (it leads the vessel by the fall). */
const drained = (f: number) => pourCdf((f - DRAIN_F0) / (DRAIN_F1 - DRAIN_F0));
/** The frames at which each year's layer completes (its seam lands). */
const TICKS = CUM_FRAC.map((c) => timeAt(filled, c - 1e-6, POUR_F0, POUR_F1 + 1));
const TICK_ROLL = 2.6;
const yearAt = (f: number) => 2008 + TICKS.reduce((acc, t) => acc + smoothstep((f - (t - TICK_ROLL)) / TICK_ROLL), 0);

/** Solid ink line weight, world px at K_REF (≈ 7 screen px at k 1.0–1.2; director's phone note). */
const LINE_W = 6.2;

// --- labels -----------------------------------------------------------------------------
const WORD_MIN = 44; // screen px floors (phone legibility)
const VALUE_MIN = 62;
const THIRD_MIN = 66;
const fsOf = (size: "value" | "word", k: number, minPx: number) => Math.max(labelPx(size, k), minPx / k);
const capOf = (size: "value" | "word", k: number, minPx: number) => (size === "value" ? 0.667 : 0.669) * fsOf(size, k, minPx);
const gdpLabelY = (k: number) => CY - R - 34 - capOf("word", k, WORD_MIN) / 2;
const bankLabelY = (k: number) => V_BOT + 40 + capOf("word", k, WORD_MIN) / 2;
const yearLabelY = (k: number) => bankLabelY(k) + capOf("word", k, WORD_MIN) / 2 + 30 + capOf("value", k, VALUE_MIN) / 2;

// --- the camera: three superposed C1 glides through the damped follower ---------------
const K0 = 1.39; // disc ≈ 640 screen px wide
const K_MID = 1.13;
const K_END = 1.0;
const PRE = 24; // pre-roll: the camera is already moving on f0
const START: Cam = { x: CX, y: CY - 10, k: 1.3 };
/** The look (content centre) that puts the odometer's foot at screen y 1376 at k. */
const lookFor = (k: number) => yearLabelY(k) + capOf("value", k, VALUE_MIN) / 2 - (1376 - 835) / k;
const GLIDES: Glide[] = [
  { f0: -PRE, f1: 30, dy: 10, k: K0 },
  { f0: 24, f1: 90, dy: lookFor(K_MID) - CY, k: K_MID },
  { f0: 100, f1: 152, dy: lookFor(K_END) - lookFor(K_MID), k: K_END },
];
const TRACK = runFollower((f) => glideTargetAt(START, GLIDES, f), -PRE, DURATION + 2).cams;
export const camAt = camFromTrack(TRACK, -PRE);
const REST = TRACK[PRE];

// --- a local Odometer with a screen-size floor (copied from chinatalkShared) ----------
const Odo: React.FC<{ id: string; value: number; digits: number; x: number; y: number; k: number; minPx: number; speed: number; rung: number; appear: number }> = ({
  id,
  value,
  digits,
  x,
  y,
  k,
  minPx,
  speed,
  rung,
  appear,
}) => {
  const view = useStageView();
  const a = clamp01(appear);
  const fs = fsOf("value", k, minPx);
  const lift = (1 - easeOutCubic(a)) * (RISE_PX / k);
  const dw = 0.58 * fs;
  const w = dw * digits;
  const capH = 0.667 * fs;
  const yc = y + lift;
  const x0 = x - w / 2;
  const op = rung * smoothstep(a) * edgeFactor(view, x0, yc - capH / 2, x0 + w, yc + capH / 2);
  if (op <= 0.002) return null;
  const pad = 0.1 * fs;
  const pitch = capH + 2.6 * pad;
  const base = yc + capH / 2;
  const blur = textBlurPx(a, 0);
  const v = Math.max(0, value);
  const cols: React.ReactNode[] = [];
  for (let i = 0; i < digits; i++) {
    const p = digits - 1 - i;
    const unit = Math.pow(10, p);
    const below = v % unit;
    let pos = Math.floor(v / unit) % 10;
    if (p > 0) {
      const frac = below - (unit - 1);
      if (frac > 0) pos += clamp01(frac);
    } else {
      pos = v % 10;
    }
    const d0 = Math.floor(pos) % 10;
    const fr = pos - Math.floor(pos);
    const vb = p === 0 || (p === 1 && fr > 0) ? Math.min(6, Math.max(0, (speed - 0.35) * 4)) : 0;
    const xs = x0 + i * dw + dw / 2;
    cols.push(
      <g key={i} filter={vb > 0.3 ? `url(#${id}-vb${i})` : undefined}>
        {vb > 0.3 ? (
          <defs>
            <filter id={`${id}-vb${i}`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={`0 ${(vb / k).toFixed(3)}`} />
            </filter>
          </defs>
        ) : null}
        <text x={xs.toFixed(3)} y={(base - pitch * fr).toFixed(3)} textAnchor="middle">
          {String(d0)}
        </text>
        {fr > 0.001 ? (
          <text x={xs.toFixed(3)} y={(base + pitch * (1 - fr)).toFixed(3)} textAnchor="middle">
            {String((d0 + 1) % 10)}
          </text>
        ) : null}
      </g>,
    );
  }
  return (
    <g style={{ filter: worldBlur(blur, k) }} opacity={op.toFixed(4)}>
      <defs>
        <clipPath id={`${id}-win`}>
          <rect x={(x0 - 0.2 * fs).toFixed(3)} y={(yc - capH / 2 - pad).toFixed(3)} width={(w + 0.4 * fs).toFixed(3)} height={(capH + 2 * pad).toFixed(3)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-win)`} fontFamily={FONT_SERIF} fontWeight={700} fontSize={fs.toFixed(3)} fill={INK} style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>
        {cols}
      </g>
    </g>
  );
};

// --- the circle: two tips from the top down both sides ---------------------------------
/** One tip's arc, split into the part that stays with the disc and the part
 *  that leaves with the wedge (translated by dy). sgn +1 = right side. */
const CircleTip: React.FC<{ id: string; sgn: 1 | -1; part: "disc" | "wedge"; f: number; k: number; rung: number; wedgeDy: number }> = ({ id, sgn, part, f, k, rung, wedgeDy }) => {
  const L = circLen(f);
  if (L <= 0.05) return null;
  const top = -Math.PI / 2;
  const split = sgn > 0 ? A_R : A_L - 2 * Math.PI; // where the wedge begins along this tip
  const sSplit = Math.abs(split - top) * R; // arc length from the top to the split
  const ageAt = (s: number) => f - timeAt(circLen, s, -40, CIRC_T + 0.01);
  const bead = 1 - smoothstep((f - CIRC_T) / 5);
  if (part === "disc") {
    return <WetLine id={`${id}-d`} points={arcPts(top, split, CX, CY)} len={Math.min(L, sSplit)} k={k} ink width={LINE_W} rung={rung} ageAt={ageAt} bead={L < sSplit ? bead : 0} />;
  }
  if (L <= sSplit) return null;
  return (
    <WetLine id={`${id}-w`} points={arcPts(split, sgn > 0 ? Math.PI / 2 : -1.5 * Math.PI, CX, CY + wedgeDy)} len={L - sSplit} k={k} ink width={LINE_W} rung={INK_HI} ageAt={(s) => ageAt(s + sSplit)} bead={bead} />
  );
};

// ---------------------------------------------------------------------------
const AThirdOfGlobalGDP: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const s = sz(k);

  // -- state ----------------------------------------------------------------
  const D = slideD(f);
  const apexY = CY + D;
  const spoutY = apexY + R;
  const discRung = rungAt(f, LO_F, INK_HI, INK_LO);
  const washU = clamp01(0.22 + (0.78 * f) / 22); // the disc's wash soaking in, top-down
  const goneU = clamp01((f - WEDGE_GONE_F0) / WEDGE_GONE_F); // the empty wedge diffusing away
  const soak = clamp01((f - SOAK_F0) / (SOAK_F1 - SOAK_F0));
  const inkHatchOp = 1 - smoothstep((f - (SOAK_F0 + 6)) / 10); // the wedge's ink hatch under the red
  const dr = drained(f);
  const fl = filled(f);
  const wedgePoly = WEDGE_REL.map((p) => ({ x: CX + p.x, y: apexY + p.y }));
  const wedgeLevel = levelFor(wedgePoly, WEDGE_AREA, 1 - dr);
  const vesLevel = levelFor(VESSEL, VESSEL_AREA, fl);

  // -- the stream -------------------------------------------------------------
  const fallU = clamp01((f - FALL_F0) / (FALL_F1 - FALL_F0));
  const headY = f < FALL_F1 ? spoutY + (V_BOT - spoutY) * Math.pow(fallU, 1.5) : vesLevel;
  const tailU = clamp01((f - DRAIN_F1) / (TAIL_F1 - DRAIN_F1));
  const tailY = spoutY + (headY - spoutY) * Math.pow(tailU, 1.5);
  const streamOn = f >= FALL_F0 && tailU < 1 && headY - tailY > 0.5;
  const headTime = (y: number) => timeAt((ff) => spoutY + (V_BOT - spoutY) * Math.pow(clamp01((ff - FALL_F0) / (FALL_F1 - FALL_F0)), 1.5), y, FALL_F0, FALL_F1);
  const dripU = clamp01((f - DRIP_F0) / (DRIP_F1 - DRIP_F0));
  const dripY = spoutY + (vesLevel - spoutY) * Math.pow(dripU, 1.5);

  // -- labels ------------------------------------------------------------------
  const thirdY = apexY + 0.56 * R;
  const thirdDiffuse = clamp01((f - 52) / 14);
  const odoSpeed = Math.abs(yearAt(f + 0.5) - yearAt(f - 0.5));

  return (
    <Stage S={f} cam={cam} rest={REST}>
      {/* ===== the world economy: the 2/3 that stays ===== */}
      <FeatherWipe id="discwash" box={{ x0: CX - R, y0: CY - R, x1: CX + R, y1: CY + R }} u={washU} feather={160}>
        <g opacity={(discRung / INK_HI).toFixed(4)}>
          {f < RADII_F0 ? (
            <HatchFill id="disc-full" region={DISC_FULL} k={k} fill={WASH_FILL} lineOpacity={WASH_HATCH} anchor={{ x: CX, y: CY }} />
          ) : (
            <HatchFill id="disc-rest" region={DISC_REST} k={k} fill={WASH_FILL} lineOpacity={WASH_HATCH} anchor={{ x: CX, y: CY }} />
          )}
        </g>
      </FeatherWipe>
      <CircleTip id="tipR" sgn={1} part="disc" f={f} k={k} rung={discRung} wedgeDy={D} />
      <CircleTip id="tipL" sgn={-1} part="disc" f={f} k={k} rung={discRung} wedgeDy={D} />
      {/* the disc's notch edges (the radii that stay) */}
      {[A_R, A_L].map((a, i) => {
        const L = radiiLen(f);
        if (L <= 0.05) return null;
        const p = polar(a);
        const pts = [
          { x: CX, y: CY },
          { x: CX + p.x, y: CY + p.y },
        ];
        return (
          <WetLine
            key={`rd${i}`}
            id={`rd${i}`}
            points={pts}
            len={L}
            k={k}
            ink
            width={LINE_W}
            rung={discRung}
            ageAt={(sl) => f - timeAt(radiiLen, sl, RADII_F0, RADII_F1)}
            bead={D < 2 ? 1 - smoothstep((f - RADII_F1) / 5) : 0}
          />
        );
      })}

      {/* ===== the slice ===== */}
      <InkDiffuse u={goneU} k={k} cx={CX} cy={apexY + 0.5 * R}>
        {/* its ink wash + hatch (the disc's material), fading under the red */}
        {f < RADII_F0 ? null : (
          <FeatherWipe id="wedgewash" box={{ x0: CX - R, y0: CY - R + D, x1: CX + R, y1: CY + R + D }} u={washU} feather={160}>
            <g opacity={inkHatchOp.toFixed(4)}>
              <HatchFill id="wedge-ink" region={wedgePoly} k={k} fill={WASH_FILL} lineOpacity={WASH_HATCH} anchor={{ x: CX, y: CY + D }} />
            </g>
          </FeatherWipe>
        )}
        {/* the red soaking up from its lowest point, then draining */}
        {soak > 0 && dr < 1 ? (
          <g style={{ filter: paperShadow(k) }}>
            <FeatherWipe id="soak" box={{ x0: CX - R, y0: apexY - 10, x1: CX + R, y1: spoutY + 4 }} u={easeOutCubic(soak)} feather={90} dir="up">
              <path d={polyD(clipBelow(wedgePoly, wedgeLevel), true)} fill={RED} />
            </FeatherWipe>
          </g>
        ) : null}
        {/* its edges: the bottom arc and the radii that leave with it */}
        <CircleTip id="tipR" sgn={1} part="wedge" f={f} k={k} rung={INK_HI} wedgeDy={D} />
        <CircleTip id="tipL" sgn={-1} part="wedge" f={f} k={k} rung={INK_HI} wedgeDy={D} />
        {f >= RADII_F0
          ? [A_R, A_L].map((a, i) => {
              const L = radiiLen(f);
              const p = polar(a);
              const pts = [
                { x: CX, y: apexY },
                { x: CX + p.x, y: apexY + p.y },
              ];
              return <WetLine key={`rw${i}`} id={`rw${i}`} points={pts} len={L} k={k} ink width={LINE_W} rung={INK_HI} ageAt={(sl) => f - timeAt(radiiLen, sl, RADII_F0, RADII_F1)} bead={0} />;
            })
          : null}
      </InkDiffuse>

      {/* ===== the vessel: China's bank assets ===== */}
      {fl > 0 ? (
        <g style={{ filter: paperShadow(k) }}>
          <VesselFill f={f} k={k} level={vesLevel} />
        </g>
      ) : null}
      {[V_LEFT, V_RIGHT].map((pts, i) => (
        <WetLine
          key={`v${i}`}
          id={`v${i}`}
          points={pts}
          len={vesLen(f)}
          k={k}
          ink
          width={LINE_W}
          rung={INK_HI}
          ageAt={(sl) => f - timeAt(vesLen, sl, VES_F0, VES_F1)}
          bead={1 - smoothstep((f - VES_F1) / 5)}
        />
      ))}

      {/* ===== the stream ===== */}
      {streamOn ? (
        <WetLine
          id="stream"
          points={[
            { x: CX, y: tailY },
            { x: CX, y: headY },
          ]}
          k={k}
          width={DATA_W * 1.05}
          ageAt={(sl) => (f < FALL_F1 + 8 ? f - headTime(tailY + sl) : 99)}
          bead={1 - smoothstep((f - FALL_F1) / 4)}
        />
      ) : null}
      {dripU > 0 && dripU < 1 ? <Bead id="drip" x={CX} y={dripY} r={DOT_R * 0.62 * s} color={RED} opacity={1 - smoothstep((dripU - 0.85) / 0.15)} /> : null}

      {/* ===== labels ===== */}
      <Label text="global gdp" x={CX} y={gdpLabelY(k)} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, 29)} rung={discRung} />
      <Label text="1/3" x={CX} y={thirdY} k={k} size="value" minPx={THIRD_MIN} appear={enterU(f, 24)} diffuse={thirdDiffuse} />
      <Label text="bank assets" x={CX} y={bankLabelY(k)} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, 84)} />
      <Odo id="year" value={yearAt(f)} digits={4} x={CX} y={yearLabelY(k)} k={k} minPx={VALUE_MIN} speed={odoSpeed} rung={INK_HI} appear={enterFrom(f, 82)} />
    </Stage>
  );
};

/** The red in the vessel: solid RED below the level, a wet band at the fresh
 *  surface, a fine paper seam at each completed year, and the tail's single
 *  travelling highlight. */
const VesselFill: React.FC<{ f: number; k: number; level: number }> = ({ f, k, level }) => {
  const s = sz(k);
  const region = clipBelow(VESSEL, level);
  if (region.length < 3) return null;
  const pour = clamp01((f - POUR_F0) / 4) * (1 - smoothstep((f - POUR_F1) / 10));
  const seams = CUM_FRAC.slice(0, -1).map((c, i) => {
    const y = levelFor(VESSEL, VESSEL_AREA, c);
    const land = clamp01((f - TICKS[i]) / 4);
    if (land <= 0) return null;
    const r = VW / 2;
    // the seam's half-width at y (the pill narrows in its bottom cap)
    const cy = V_BOT - r;
    const half = y <= cy ? r : Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    const hw = half * easeOutCubic(land);
    return <line key={i} x1={CX - hw} y1={y} x2={CX + hw} y2={y} stroke={PAPER} strokeWidth={(1.6 * s).toFixed(3)} strokeOpacity={0.85} strokeLinecap="round" />;
  });
  const hlU = clamp01((f - HL_F0) / (HL_F1 - HL_F0));
  const hlY = lerp(V_BOT + 40, V_TOP - 40, easeInCubic(hlU) * 0.35 + smoothstep(hlU) * 0.65);
  const hlOp = Math.sin(Math.PI * hlU) * 0.75;
  return (
    <g>
      <defs>
        <clipPath id="vfill">
          <path d={polyD(region, true)} />
        </clipPath>
        <linearGradient id="vwet" gradientUnits="userSpaceOnUse" x1={0} y1={level} x2={0} y2={level + 46}>
          <stop offset={0} stopColor={RED_WET} stopOpacity={0.9 * pour} />
          <stop offset={1} stopColor={RED_WET} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="vhl" gradientUnits="userSpaceOnUse" x1={0} y1={hlY - 60} x2={0} y2={hlY + 60}>
          <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
          <stop offset={0.5} stopColor={RED_HI} stopOpacity={hlOp} />
          <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={polyD(region, true)} fill={RED} />
      <g clipPath="url(#vfill)">
        {pour > 0.002 ? <rect x={CX - VW} y={level} width={2 * VW} height={50} fill="url(#vwet)" /> : null}
        {seams}
        {hlOp > 0.002 ? <rect x={CX - VW} y={hlY - 60} width={2 * VW} height={120} fill="url(#vhl)" /> : null}
      </g>
    </g>
  );
};

export const _debug = { VH, V_TOP, V_BOT, WEDGE_AREA, VESSEL_AREA, TICKS, lookFor, gdpLabelY, capOf, TRACK };

export default AThirdOfGlobalGDP;
