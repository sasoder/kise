// ---------------------------------------------------------------------------
// FortyTwoPercent (toto-female-fans, cut 55). Cheeky Pint style, the STOUT BOARD setting (styles/cheeky-pint.md:
// numbers go on the board). Opaque 1080x1920, 25 fps, 65 frames. Palette B1 (the stoutShared default).
// Revision 1 (user, Nov 18: "maybe the easiest thing is a pie chart to show the fan distribution"): rebuilt as a pie
// chart; it no longer uses the grandstand world (fansWorld.tsx).
//
// CHECK LINE: "Women are 42% of F1's fans: almost half the pie."
//
// THE LINE: "And | we have 42% female fans, | which is an awesome..."
// WORD -> FRAME (from the composition start, notes/words.json): we 1 · have 21 · 42 25 · % 33 · female 39 ·
// fans 48 (ends ~58) · which 62.
// DURATION: the slot 55.400 -> 58.000 s = 2.60 s x 25 = 65 frames (f0..f64).
//
// THE MOTION: a big cream card disc (760 px) rises into place from below the frame edge (f0 -> f16: whole, at full
// size, one eased move with a soft settle; f0 is the bare board, so nothing parks at the edge; its shadow travels at
// 'lifted' and lands to 'rest' as it settles) under a slow push-in (k 1.00 -> 1.10 across the cut, leaning a little
// toward the amber). Then an AMBER slice sweeps open clockwise from 12 o'clock (f18 -> f33, 0 -> 151.2 deg = 42 %,
// landing on "%"), drawn by its leading radius, and "42%" rolls up on it as an odometer read off the slice's own
// angle (value = angle / 3.6; two ink drums, Dreiviertelfett TYPE.HERO, the "%" at TYPE.SECONDARY so the readout fits
// the wedge): the drums read 40.6 on f31 and 41.6 on f32, mid-turn both, so no frame holds a whole "41", and land
// with the slice on f33. On "female fans" the slice lifts one elevation out of the disc
// (f39 -> f48: 30 world px out along its bisector, its own shadow easing rest -> lifted, the ground showing in the gap)
// and its label FEMALE / FANS (Kräftig caps, ink, 64 px) slides up in on the slice above the number (f39 -> f49). The
// one LightSweep crosses the lifted amber slice f50 -> f60. It ends settled and alive: the push, the sway, the grain.
// CAUSE: the slice is drawn by its moving leading edge (no fade); the number is the slice's angle; the lift's gap and
// shadow show it leaving the disc.
// AMBER = F1's fans, here the women: the one amber thing is the 42 % slice. Cream = the rest of the fans (the 58 %, no
// label). Nothing black.
//
// SOURCES: 42 % female fans: F1 / Motorsport Network 2025 Global F1 Fan Survey (100,000+ respondents in 186
// countries; women are 42 % of F1's fans), as given in the brief.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  Label,
  LightSweep,
  SPACE,
  StoutStage,
  TNUM_ADV,
  TYPE,
  amberBandFor,
  bloomFilter,
  camFor,
  clamp01,
  lerp,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";

export const FPS = 25;
export const DURATION = 65;
export const schema = z.object({});
export const defaultProps = schema.parse({});

export const BEAT = {
  riseTo: 16, // the disc rises in from below the frame f0 -> f16
  sweepFrom: 18, // just after the disc settles, ahead of "42" (f25)
  sweepTo: 33, // the slice and the drums land together, on "%"
  readIn: 18, // the readout slides up in with the first turn
  readInF: 6,
  liftFrom: 39, // "female"
  liftTo: 48, // "fans"
  labelFrom: 39,
  labelF: 10,
  shineFrom: 50,
  shineTo: 60,
} as const;

// --- the world (world px; at k 1 the composition sits in the keep-in box, then StoutStage dy 190) ----------------
const CX = 540;
const CY = 680; // the middle of the keep-in box (y 290-1070)
const R = 380; // the disc: 760 px across at f0
const SHARE = 0.42;
const THETA = 360 * SHARE; // 151.2 deg
const BIS = (THETA / 2) * (Math.PI / 180); // the slice's bisector (clockwise from 12 o'clock)
const LIFT_D = 30; // how far the slice lifts out along its bisector
const DY = 190; // "move it down slightly like we usually do"

// --- the camera: a slow push-in from f0, leaning a little toward the slice ----------------------------------------
const K0 = 1.0;
const K1 = 1.1;
export const camAt = (f: number): Cam => {
  const u = clamp01(f / (DURATION - 1));
  const e = 0.35 * u + 0.65 * smoothstep(u); // moving on f0, still creeping on f64
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * e);
  return camFor(CX + 22 * e, CY - 8 * e, 540, 680, k);
};
/** type is printed on the card (world px): exactly its TYPE token at f38 (the approved print size, kept when the
 *  sweep moved earlier so f39+ is unchanged) */
const K_TYPE = camAt(38).k;

// --- the rise: the whole disc comes up from below the frame edge -----------------------------------------------------
/** world px the disc sits below its place; f0: its top just under the frame's bottom edge (screen y 490 -> 1930) */
const RISE_D = 1440;
const riseE = (f: number) => {
  const p = clamp01(f / BEAT.riseTo);
  return 0.25 * smoothstep(p) + 0.75 * (1 - Math.pow(1 - p, 3)); // moving on entry (no sliver parks), soft settle
};
export const riseAt = (f: number) => RISE_D * (1 - riseE(f));
/** 1 -> 0: the shadow rides at 'lifted' while the disc travels and lands to 'rest' as it settles (f9 -> f16) */
export const landAt = (f: number) => 1 - smoothstep((f - 9) / (BEAT.riseTo - 9));

// --- the sweep: the slice's angle, and the readout read off it ------------------------------------------------------
/** 0..1: half smoothstep, half ease-out (opens decisively on "42", lands soft; mid-turn 41 -> 42 on f37) */
const sweepE = (f: number) => {
  const p = clamp01((f - BEAT.sweepFrom) / (BEAT.sweepTo - BEAT.sweepFrom));
  return 0.5 * smoothstep(p) + 0.5 * (1 - (1 - p) * (1 - p));
};
export const valueAt = (f: number) => 100 * SHARE * sweepE(f);
export const angleAt = (f: number) => valueAt(f) * 3.6; // degrees, clockwise from 12 o'clock
/** the sweep band's travel mapped so it is over the slice (not its bounding box's empty corners) f50 -> f60 */
const shineT = (f: number) => {
  const p = (f - BEAT.shineFrom) / (BEAT.shineTo - BEAT.shineFrom);
  return p <= 0 || p >= 1 ? 0 : 0.03 + 0.6 * smoothstep(p);
};
export const liftAt = (f: number) => smoothstep((f - BEAT.liftFrom) / (BEAT.liftTo - BEAT.liftFrom));

// --- geometry helpers (degrees clockwise from 12 o'clock) -----------------------------------------------------------
const r3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const pt = (a: number, r = R) => {
  const t = (a * Math.PI) / 180;
  return [CX + r * Math.sin(t), CY - r * Math.cos(t)] as const;
};
/** the sector a0 -> a1 (clockwise), a1 - a0 < 360 */
const sector = (a0: number, a1: number) => {
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  return `M${CX} ${CY}L${r3(x0)} ${r3(y0)}A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${r3(x1)} ${r3(y1)}Z`;
};
const DISC = `M${CX - R} ${CY}A${R} ${R} 0 1 1 ${CX + R} ${CY}A${R} ${R} 0 1 1 ${CX - R} ${CY}Z`;
const SLICE_FULL = sector(0, THETA);

// --- the readout and the label (world px, printed on the slice) ----------------------------------------------------
const FS_NUM = TYPE.HERO / K_TYPE;
const FS_PCT = TYPE.SECONDARY / K_TYPE;
const FS_LAB = 64 / K_TYPE; // FEMALE / FANS: readable on a phone (16 px at 270 wide)
const ADV = TNUM_ADV * FS_NUM;
const NUM_X = CX + 30; // the readout's left edge (inside the slice's 12 o'clock edge)
const NUM_BASE = CY + 26; // the numerals' baseline
const PCT_X = NUM_X + 2 * ADV + 0.03 * FS_NUM;
const FANS_BASE = NUM_BASE - 0.729 * FS_NUM - SPACE.LOCKUP / K_TYPE;
const FEMALE_BASE = FANS_BASE - 0.718 * FS_LAB - 16 / K_TYPE;
const LAB_X = NUM_X + 0.05 * FS_NUM; // optically flush with the "4"'s stem side

/** one drum: digit a turning up to digit b by fr (0..1), through its own one-digit window */
const Drum: React.FC<{ cx: number; a: string; b: string; fr: number; blur: number; id: string }> = ({ cx, a, b, fr, blur, id }) => {
  const lineH = 1.0 * FS_NUM;
  const top = NUM_BASE - 0.729 * FS_NUM - 0.12 * FS_NUM;
  const h = 0.729 * FS_NUM + 0.24 * FS_NUM;
  const rolling = a !== b && fr > 1e-4;
  const on = rolling && blur > 0.3;
  return (
    <g>
      <defs>
        <clipPath id={`${id}w`}>
          <rect x={cx - ADV / 2} y={top} width={ADV} height={h} />
        </clipPath>
        {on ? (
          <filter id={`${id}b`} x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation={`0 ${r3(blur)}`} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${id}w)`}>
        <g filter={on ? `url(#${id}b)` : undefined}>
          {!rolling ? (
            <text x={cx} y={NUM_BASE} textAnchor="middle">
              {a}
            </text>
          ) : (
            <>
              <text x={cx} y={NUM_BASE - fr * lineH} textAnchor="middle">
                {a}
              </text>
              <text x={cx} y={NUM_BASE + (1 - fr) * lineH} textAnchor="middle">
                {b}
              </text>
            </>
          )}
        </g>
      </g>
    </g>
  );
};

/** "42%": the value read off the slice's angle, tens and units on drums (carries roll as one), ink */
const Readout: React.FC<{ f: number; k: number; uid: string }> = ({ f, k, uid }) => {
  const en = clamp01((f - BEAT.readIn) / BEAT.readInF);
  if (en <= 0) return null;
  const a = 1 - Math.pow(1 - en, 3);
  const v = Math.min(42, valueAt(f));
  const lo = Math.floor(v + 1e-9);
  const fr = v >= 42 ? 0 : v - lo;
  const dv = Math.abs(valueAt(f + 0.5) - valueAt(f - 0.5));
  // a vertical roll blur in proportion to the drums' speed (screen px, capped), 0 at rest
  const blur = Math.min(4, 1.6 * dv) / k;
  const tens = (n: number) => (Math.floor(n / 10) === 0 ? "" : `${Math.floor(n / 10)}`);
  const units = (n: number) => `${n % 10}`;
  const lift = ((1 - a) * 24) / k;
  const eb = (6 * (1 - a)) / k;
  return (
    <g
      opacity={r3(a)}
      transform={`translate(0 ${r3(lift)})`}
      style={{ filter: eb > 0.05 ? `blur(${r3(eb)}px)` : undefined }}
      fontFamily={FONT_NUM}
      fontWeight={700}
      fill={COLOR.inkDark}
    >
      <g fontSize={r3(FS_NUM)} style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
        <Drum cx={NUM_X + ADV / 2} a={tens(lo)} b={tens(lo + 1)} fr={fr} blur={blur} id={`${uid}t`} />
        <Drum cx={NUM_X + 1.5 * ADV} a={units(lo)} b={units(lo + 1)} fr={fr} blur={blur} id={`${uid}u`} />
      </g>
      <text x={PCT_X} y={NUM_BASE} fontSize={r3(FS_PCT)} letterSpacing="-0.015em">
        %
      </text>
    </g>
  );
};

const FortyTwoPercent: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const uid = `ft${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const cam = camAt(S);
  const k = cam.k;
  const th = Math.min(THETA, angleAt(S));
  const t = liftAt(S);
  const lx = LIFT_D * t * Math.sin(BIS);
  const ly = -LIFT_D * t * Math.cos(BIS);
  const band = amberBandFor(cam);
  const slice = th > 0.01 ? sector(0, th) : null;
  const rest = t > 0.001 ? sector(THETA, 360) : DISC; // the cream: the whole disc until the slice leaves it
  const sliceSil = [{ d: SLICE_FULL }];
  const pool = { x: lerp(CX, CX + 150, smoothstep((S - 25) / 25)), y: lerp(CY, CY - 40, smoothstep((S - 25) / 25)) };
  const labelIn = (S - BEAT.labelFrom) / BEAT.labelF;
  const labPx = (FS_LAB * k) as number; // world-fixed: Label takes screen px
  const rise = riseAt(S);
  const land = landAt(S);
  // the hot edge / lit edge only on top-facing rim: a vertical fade from the top of the disc to just above its middle
  const topFade = (id: string) => (
    <mask id={id} maskUnits="userSpaceOnUse" x={CX - R - 40} y={CY - R - 40} width={2 * R + 80} height={2 * R + 80}>
      <rect x={CX - R - 40} y={CY - R - 40} width={2 * R + 80} height={2 * R + 80} fill={`url(#${uid}tf)`} />
    </mask>
  );
  return (
    <StoutStage S={S} cam={cam} rest={camAt(0)} pool={pool} dy={DY}>
      <defs>
        <linearGradient id={`${uid}cr`} gradientUnits="userSpaceOnUse" x1="0" y1={CY - R} x2="0" y2={CY + R}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}am`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}tf`} gradientUnits="userSpaceOnUse" x1="0" y1={CY - R} x2="0" y2={CY - 0.15 * R}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <radialGradient id={`${uid}hf`} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R}>
          <stop offset={r3(1 - EDGE.HOT_FALL / k / R)} stopColor={COLOR.amberHot} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
        </radialGradient>
        {topFade(`${uid}m1`)}
        {topFade(`${uid}m2`)}
        <clipPath id={`${uid}rc`}>
          <path d={rest} />
        </clipPath>
        <clipPath id={`${uid}sc`}>
          <path d={SLICE_FULL} />
        </clipPath>
      </defs>

      <g transform={rise > 0.001 ? `translate(0 ${r3(rise)})` : undefined}>
      {/* 1. the shadows on the board: one union shadow (the disc) while the slice is in it; as it lifts, the rest
             keeps its rest shadow and the slice's eases to lifted (a short crossfade, so nothing pops) */}
      <ElevationShadow silhouette={[{ d: DISC }]} elevation="rest" lift={land} strength={1 - t} />
      {t > 0.001 ? (
        <>
          <ElevationShadow silhouette={[{ d: sector(THETA, 360) }]} elevation="rest" strength={t} />
          <g transform={`translate(${r3(lx)} ${r3(ly)})`}>
            <ElevationShadow silhouette={sliceSil} elevation="rest" lift={t} strength={t} />
          </g>
        </>
      ) : null}

      {/* 2. the cream card (the 58 %), its lit top edge */}
      <path d={rest} fill={`url(#${uid}cr)`} />
      <g clipPath={`url(#${uid}rc)`} mask={`url(#${uid}m1)`}>
        <circle cx={CX} cy={CY} r={R - EDGE.CREAM / k / 2} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={r3(EDGE.CREAM / k)} />
      </g>
      {/* the lifted slice's shadow where it falls on the cream */}
      {t > 0.001 ? (
        <g clipPath={`url(#${uid}rc)`}>
          <g transform={`translate(${r3(lx)} ${r3(ly)})`}>
            <ElevationShadow silhouette={sliceSil} elevation="rest" lift={t} strength={t} />
          </g>
        </g>
      ) : null}

      {/* 3. the amber slice (the 42 %): drawn by its leading radius, one glow; then lifted out along its bisector */}
      <g transform={t > 0.001 ? `translate(${r3(lx)} ${r3(ly)})` : undefined}>
        {slice ? (
          <>
            <g style={{ filter: bloomFilter(k) }}>
              <path d={slice} fill={`url(#${uid}am)`} />
            </g>
            {/* the hot edge on its top-facing rim: 2 px line + 12 px falloff */}
            <g clipPath={`url(#${uid}sc)`} mask={`url(#${uid}m2)`}>
              <path d={slice} fill={`url(#${uid}hf)`} />
              <path
                d={(() => {
                  const [x0, y0] = pt(0, R - EDGE.HOT / k / 2);
                  const [x1, y1] = pt(th, R - EDGE.HOT / k / 2);
                  return `M${r3(x0)} ${r3(y0)}A${r3(R - EDGE.HOT / k / 2)} ${r3(R - EDGE.HOT / k / 2)} 0 0 1 ${r3(x1)} ${r3(y1)}`;
                })()}
                fill="none"
                stroke={COLOR.amberHot}
                strokeWidth={r3(EDGE.HOT / k)}
              />
            </g>
          </>
        ) : null}
        {/* the one click: a light sweep across the lifted slice */}
        <g clipPath={`url(#${uid}sc)`}>
          <LightSweep x={CX} y={CY - R} w={R} h={R + R * Math.cos(Math.PI - (THETA * Math.PI) / 180)} k={k} t={shineT(S)} on="amber" r={0} />
        </g>
        {/* printed on the slice, in ink */}
        <Label x={LAB_X} y={FEMALE_BASE} k={k} px={labPx} text="FEMALE" tone="dark" anchor="start" enter={labelIn} />
        <Label x={LAB_X} y={FANS_BASE} k={k} px={labPx} text="FANS" tone="dark" anchor="start" enter={labelIn} />
        <Readout f={S} k={k} uid={uid} />
      </g>
      </g>
    </StoutStage>
  );
};

export default FortyTwoPercent;
