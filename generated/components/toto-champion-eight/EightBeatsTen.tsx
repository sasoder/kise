// ---------------------------------------------------------------------------
// EightBeatsTen (toto-champion-eight, cut 23). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 114 frames. Palette B1 (the stoutShared default).
// The kart world is champShared.tsx (KartWithKid, TrackStrip, FinishLine), the same karts as cut 11.
//
// CHECK LINE: "a smaller, younger kid (8) beat the older kids (10) in the same race: that's the early sign."
//
// THE LINE: "Even with the tiny ones, you can identify the ones that are doing better than their peers. Either |
// because they are younger, you know, if someone that's eight years old beats the ones that are ten in that group,
// you | can have those very early signs..." (this cut: "because ... group, you"; the cut returns to Toto at 27.64).
// WORD -> FRAME (animation_source/notes/words_cutB.md; Whisper onsets, may sit early, so beats land ON or after):
//   because 4 · they 10 · are 16 · younger 18 · you know 27-33 · if 34 · someone 37 · that's 42 · eight 49 ·
//   years 52 · old 57 · beats 63 · the 69 · ones 73 · that are 77-85 · ten 85 · in 89 · that 94 · group 98 (-105) ·
//   you 110.
// DURATION: the slot 23.080 -> 27.640 s = 4.56 s x 25 = 114 frames (f0..f113).
//
// THE MOTION (final round; review 2: fixed camera; review 1: three lanes, lane labels, an amber number panel):
// one race, side view, three stacked lanes in y 260-1060 (10 / 8 / 10), karts facing right on one starting grid
// (noses level at x 540), a chequered finish line at x 720. The two 10-year-olds sit in board-toned karts lifted
// toward cream (dim 0.62: pods ~5.9:1, helmets >= 4.3:1, suits >= 3.2:1 on the asphalt, measured on f113); the
// 8-year-old in the middle lane (kid 0.82, kart 0.91: champShared's rule) is cream: the subject. Each lane has its
// age label at the left (x 40-188; cream card, "10" / "8" over YEARS in ink), entering in place as one group with
// the stout entrance (blur in + a 24 px rise, f0-16), whole on every frame. The light pool eases from the grid's
// middle onto the 8's lane on "younger" (f18-30). On "if" (f34) all three roll off together at one pace; on "eight"
// (f49-59) the 8's label, his kart's nose number panel and his helmet stripe take the amber (the talent you can see
// in a kid). On "beats" (f63) the 8 surges (f63-73, leaning forward into it): the 10s are well short of the line on
// "ten" (f85); his helmet crosses it ~f96 ("that ... group") at speed, he brakes firmly f102-111 and stops with his
// whole kart past the chequer (nose x ~1058). The 10s, beaten, ease to a stop by f105, ~90 px short (they cover
// ~90 px; the 8 ~480 px after "beats"); f105-113 is a settled, living frame (idle bob, the 8 coming to rest).
// Speed is sold by motion: wheel spin, the lean, and short soft streaks in a dark board tone trailing every moving
// kart, growing with speed and draining as it slows. Camera: fixed.
// AMBER = the talent / potential you can see in a kid (the 8's label, number panel and helmet stripe only);
// cream = the subject, board = context.
// CAUSE -> EFFECT: the karts move only under their own drive (wheels turn by the distance rolled, the kids lean
// forward into each acceleration and back as they brake, streaks follow speed). Amber is the beat "eight", on the 8.
//
// SOURCES: none (no real figures; ages from the spoken line).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  EDGE,
  GEO,
  Label,
  METRIC,
  Numeral,
  StoutStage,
  AmberGradient,
  amberBandFor,
  camFor,
  mixHex,
  bloomFilter,
  clamp01,
  easeOutCubic,
  lerp,
  numeralWidth,
  labelWidth,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { FinishLine, KART, KID, KartWithKid, M, TrackStrip, kartScaleFor, type HelmetTone } from "./champShared";

export const FPS = 25;
export const DURATION = 114;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the frame ------------------------------------------------------------------------------------------------
/** camera k: a 10-year-old's kart (1.80 m = 720 world px) is ~338 px wide on screen, the 8's ~308 px */
export const K0 = 0.47;
/** world px of a screen px under the opening camera */
const W = (s: number) => s / K0;

// three lanes in y 260-1060 (screen px at the opening camera): band tops, ground lines 200 px below each top
const LANES = 3;
const LANE_H = 800 / LANES;
const laneTop = (i: number) => 260 + i * LANE_H;
const LANE_GROUND = [0, 1, 2].map((i) => laneTop(i) + 200);
const EIGHT_LANE = 1; // the middle lane

type Racer = { kid: number; helmet: HelmetTone; stripe: HelmetTone; suit: HelmetTone; m: number; age: string };
const RACERS: Racer[] = [
  { kid: 1, helmet: "oat", stripe: "rust", suit: "plum", m: 0.97, age: "10" },
  { kid: KID.eight, helmet: "cream", stripe: "terracotta", suit: "denim", m: 1, age: "8" },
  { kid: 1, helmet: "sage", stripe: "oat", suit: "denim", m: 1.02, age: "10" },
];

// --- the age labels (fixed in each lane at the left, the start-line side) -------------------------------------------
// A cream card: the age numeral (Dreiviertelfett) over YEARS (Kräftig caps), ink on cream, sized to read at 270 px
// wide. Screen px at the cut's one k.
const TAG = { left: 40, w: 148, h: 148, num: 108, sub: 36, gap: 14, lift: 80 } as const;
const TAG_R = (GEO.RADIUS * 1.5) / K0; // the house corner (4 world px at the kit's k 1.5), at this world's scale
const TAG_IN = { f0: 0, f1: 16 } as const; // the stout entrance in place, one group: blur in + a 24 px rise
/** the 10s: board-toned context, lifted toward cream so the dimmed card is >= 3:1 on the asphalt and the helmets read */
const DIM_10 = 0.62;

// --- the race (world px, world px / frame) -------------------------------------------------------------------------
const KART_GAP = 14; // the label's right edge to a 10's rear bumper on the grid (screen px)
const NOSE0 = W(TAG.left + TAG.w + KART_GAP) + KART.length * M; // the starting grid: every nose on one line
export const LINE_X = W(720); // the finish line's centre
const V0 = W(1.55); // the common pace (all three, "if someone that's eight years old")
const V8 = W(12.25); // the 8's pace from "beats"
const SUB = 8;
const ss = smoothstep;
const v10 = (f: number, m: number) => {
  const mm = 1 + (m - 1) * ss((f - 60) / 14); // the 10s drift a hair apart after the pull
  return V0 * mm * ss((f - 34) / 9) * (1 - ss((f - 88) / 17)); // roll off on "if", beaten: ease to a stop by f105
};
const v8 = (f: number) => {
  const base = V0 * ss((f - 34) / 9);
  const up = ss((f - 63) / 10); // "beats" (f63): the surge, never before its onset
  const brake = 1 - ss((f - 102) / 9); // over the line (~f96) at speed, then a firm brake f102-111 to a stop
  return (base + (V8 - V0) * up) * brake;
};
/** distance rolled per frame 0..DURATION+2 (sub-stepped integral of the velocity) */
const integrate = (v: (f: number) => number) => {
  const out = [0];
  let x = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    for (let s = 0; s < SUB; s++) x += v(f + (s + 0.5) / SUB) / SUB;
    out.push(x);
  }
  return out;
};
const VEL = RACERS.map((r, i) => (i === EIGHT_LANE ? v8 : (f: number) => v10(f, r.m)));
const DIST = VEL.map(integrate);
const sample = (arr: number[], f: number) => {
  const a = Math.max(0, Math.min(arr.length - 2, Math.floor(f)));
  return lerp(arr[a], arr[a + 1], clamp01(f - a));
};
const kartScaleOf = (r: Racer) => kartScaleFor(r.kid);
/** the ground point below the helmet (KartWithKid's x) at the start: nose on the grid */
const x0Of = (r: Racer) => NOSE0 - KART.nose * M * kartScaleOf(r);
export const racerAt = (i: number, f: number) => {
  const r = RACERS[i];
  const d = sample(DIST[i], f);
  const v = VEL[i](f);
  const acc = VEL[i](f + 0.5) - VEL[i](f - 0.5);
  const x = x0Of(r) + d;
  const ks = kartScaleOf(r);
  return { x, d, v, acc, ks, nose: x + KART.nose * M * ks, rear: x + KART.rear * M * ks, ground: W(LANE_GROUND[i]) };
};

// --- the camera ----------------------------------------------------------------------------------------------------
// fixed (review 2): the frame is the opening camera on every frame; the labels stay whole at the left
const CAM = camFor(W(540), W(960), 540, 960, K0);

// --- the label -----------------------------------------------------------------------------------------------------
const AgeTag: React.FC<{ left: number; ground: number; k: number; age: string; amber: number; band: [number, number] }> = ({ left, ground, k, age, amber, band }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const w = TAG.w / k;
  const h = TAG.h / k;
  const x = left;
  const y = ground - TAG.lift / k - h / 2;
  const d = rectPath(x, y, w, h, TAG_R);
  // type: the numeral's figure height + gap + YEARS' cap height, centred in the card
  const stack = TAG.num * METRIC.fig + TAG.gap + TAG.sub * METRIC.cap;
  const top = (TAG.h - stack) / 2;
  const numY = y + (top + TAG.num * METRIC.fig) / k;
  const subY = y + (top + TAG.num * METRIC.fig + TAG.gap + TAG.sub * METRIC.cap) / k;
  const a = clamp01(amber);
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={y} x2="0" y2={y + h}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <UnionShadow sil={[{ d }]} s={2.2} elevation="lifted" />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${x + TAG_R} ${y + EDGE.CREAM / k / 2}H${x + w - TAG_R}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge * (1 - a)} strokeWidth={EDGE.CREAM / k} />
      {a > 0.002 ? (
        <g opacity={a}>
          <path d={d} fill={`url(#${uid}a)`} style={{ filter: bloomFilter(k) }} />
          <path d={rectPath(x, y, w, fall, TAG_R, true, false)} fill={`url(#${uid}h)`} />
          <path d={`M${x + TAG_R} ${y + EDGE.HOT / k / 2}H${x + w - TAG_R}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} />
        </g>
      ) : null}
      <Numeral x={x + w / 2} y={numY} k={k} px={TAG.num} text={age} tone="dark" />
      <Label x={x + w / 2} y={subY} k={k} px={TAG.sub} text="years" tone="dark" />
    </g>
  );
};

// --- the 8's amber number panel ---------------------------------------------------------------------------------------
// champShared draws a blank number panel on every kart's nose; its box is not exported, so it is restated here from
// champShared's kartGeom (`plate`: top-left at kart metres (0.93, 0.185), 0.15 x 0.10 m, corner 0.022 m, riding the
// bob) and drawn OVER the shared kart, in the amber band with the kit bloom. Nothing of the kart is drawn after the
// panel there (the front tyre ends at 0.85 m), so the overlay sits exactly where the shared panel is.
const PLATE = { x: 0.93, y: 0.185, w: 0.15, h: 0.1, r: 0.022 } as const;
const AmberPlate: React.FC<{ x: number; y: number; ks: number; bob: number; k: number; amber: number; band: [number, number] }> = ({ x, y, ks, bob, k, amber, band }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  if (amber <= 0.002) return null;
  const s = M * ks;
  const px = x + PLATE.x * s;
  const py = y - PLATE.y * s - bob;
  const d = rectPath(px, py, PLATE.w * s, PLATE.h * s, PLATE.r * s);
  return (
    <g opacity={clamp01(amber)}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      <path d={d} fill={`url(#${uid}a)`} style={{ filter: bloomFilter(k) }} />
      <path d={`M${px + PLATE.r * s} ${py + EDGE.HOT / k / 2}H${px + (PLATE.w - PLATE.r) * s}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} />
    </g>
  );
};

// --- speed streaks (review 2): the speed sold by motion, not distance ------------------------------------------------
// Three short soft streaks trailing each moving kart, in a dark board tone (never amber, never cream), each fading
// along its length; their length and strength follow the kart's own speed, so they grow on the surge and drain away
// as the kart slows (the stopped 8 has none). Rows in kart metres (x from the helmet's ground point, y up): the side
// pod, the seat back, the helmet's back. They never reach back over the lane's label.
const STREAK = {
  tone: mixHex(COLOR.board, COLOR.ground, 0.45),
  width: 5, // screen px
  gap: 10, // screen px behind the body
  perSpeed: 12, // screen px of streak per screen px / frame
  rows: [
    { x: KART.rear, y: 0.12, len: 1 },
    { x: -0.34, y: 0.33, len: 0.7 },
    { x: -0.2, y: 0.58, len: 0.45 },
  ],
} as const;
const SpeedStreaks: React.FC<{ rear: number; ground: number; ks: number; v: number; bob: number; k: number; seed: number }> = ({ ground, ks, v, bob, k, rear }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const vs = v * k; // screen px / frame
  const a = clamp01((vs - 0.4) / 2.0) * 0.9;
  if (a <= 0.01) return null;
  const hx = rear - KART.rear * M * ks; // the helmet's ground point
  const minX = W(TAG.left + TAG.w + 10);
  return (
    <g>
      {STREAK.rows.map((r, j) => {
        const x1 = hx + r.x * M * ks - STREAK.gap / k;
        const x0 = Math.max(minX, x1 - (STREAK.perSpeed * vs * r.len) / k);
        if (x1 - x0 < 6 / k) return null;
        const y = ground - r.y * M * ks - bob;
        return (
          <g key={j}>
            <defs>
              <linearGradient id={`${uid}s${j}`} gradientUnits="userSpaceOnUse" x1={x0} y1="0" x2={x1} y2="0">
                <stop offset="0" stopColor={STREAK.tone} stopOpacity="0" />
                <stop offset="1" stopColor={STREAK.tone} stopOpacity={a} />
              </linearGradient>
            </defs>
            <path d={`M${x0} ${y}H${x1}`} stroke={`url(#${uid}s${j})`} strokeWidth={STREAK.width / k} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

// --- the cut -------------------------------------------------------------------------------------------------------
const EightBeatsTen: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = CAM;
  const k = cam.k;
  const band = amberBandFor(cam);
  const amber = ss((f - 49) / 10); // "eight" (f49): the 8 takes the amber
  const tagIn = easeOutCubic((f - TAG_IN.f0) / (TAG_IN.f1 - TAG_IN.f0));
  const tagLeft = W(TAG.left);
  const bandTop = W(laneTop(0));
  const bandBottom = W(laneTop(LANES));
  const eight = racerAt(EIGHT_LANE, Math.max(0, f - 6)); // the light follows the 8 with a little lag
  // the light pool eases from the grid's middle onto the 8's lane on "younger" (f18-30), then follows him
  const onto = ss((f - 18) / 12);
  const pool = { x: lerp(W(540), eight.x, onto), y: lerp(W(660), eight.ground - W(80), onto), strength: lerp(0.6, 1, onto) };
  return (
    <StoutStage S={f} cam={cam} pool={pool}>
      {LANE_GROUND.map((_, i) => (
        <TrackStrip key={`t${i}`} x0={W(-600)} x1={W(2600)} top={W(laneTop(i))} bottom={W(laneTop(i + 1))} k={k} soft={i === LANES - 1} />
      ))}
      <FinishLine x={LINE_X} top={bandTop} bottom={bandBottom} rows={Math.round((bandBottom - bandTop) / (0.12 * M))} />
      {RACERS.map((r, i) => {
        const p = racerAt(i, f);
        const is8 = i === EIGHT_LANE;
        const bob = 3.5 * Math.sin(f * 0.9 + i * 1.7);
        return (
          <g key={`r${i}`}>
            <SpeedStreaks rear={p.rear} ground={p.ground} ks={p.ks} v={p.v} bob={bob} k={k} seed={i} />
            <g opacity={tagIn} transform={`translate(0 ${(24 * (1 - tagIn)) / k})`} style={{ filter: tagIn < 0.995 ? `blur(${(6 * (1 - tagIn)) / k}px)` : undefined }}>
              <AgeTag left={tagLeft} ground={p.ground} k={k} age={r.age} amber={is8 ? amber : 0} band={band} />
            </g>
            <KartWithKid
              x={p.x}
              y={p.ground}
              scale={r.kid}
              dim={is8 ? 0 : DIM_10}
              helmet={r.helmet}
              stripe={r.stripe}
              suit={r.suit}
              wheelSpin={p.d}
              wheelSpeed={p.v}
              lean={Math.max(-7, Math.min(6, -p.acc * 2.6))}
              bob={bob}
              amber={is8 ? amber : 0}
              k={k}
            />
            {is8 ? <AmberPlate x={p.x} y={p.ground} ks={p.ks} bob={bob} k={k} amber={amber} band={band} /> : null}
          </g>
        );
      })}
    </StoutStage>
  );
};

export default EightBeatsTen;

// --- load-time checks ----------------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`EightBeatsTen: ${m}`);
  };
  if (numeralWidth("10", TAG.num) > TAG.w - 24 || labelWidth("years", TAG.sub) > TAG.w - 16) fail("label type overflows its card");
  const scr = (wx: number) => 540 + (wx - CAM.x) * CAM.k;
  const others = [0, 1, 2].filter((i) => i !== EIGHT_LANE);
  const helmetX = (f: number) => racerAt(EIGHT_LANE, f).x; // KartWithKid's x is the ground point below the helmet centre
  // the beats: the 10s short of the line on "ten" (f85); the 8's helmet over it around f97 (f95-99); stopped by f111
  for (const i of others) if (racerAt(i, 85).nose >= LINE_X - W(40)) fail(`10 in lane ${i + 1} at the line on "ten"`);
  if (helmetX(95) >= LINE_X || helmetX(99) <= LINE_X) fail("the 8's helmet does not cross the line around f97");
  if (racerAt(EIGHT_LANE, 111).v > 1e-6) fail("the 8 is still rolling at f111");
  // the end frame: the 8's helmet well past the line, the 10s just short of it, the 8's nose <= 1040
  // the end frame: the 8's whole kart past the chequer (rear bumper beyond its right edge), the 10s ~90 px short
  // (noses), the 8's nose <= ~1060; the 10s stopped by f105 (a settled frame f105-113)
  if (racerAt(EIGHT_LANE, DURATION - 1).rear <= LINE_X + 0.12 * M + W(4)) fail("the 8's kart does not clear the line at the end");
  for (const i of others) if (racerAt(i, DURATION - 1).nose >= LINE_X - W(80)) fail(`10 in lane ${i + 1} ends near the line`);
  if (scr(racerAt(EIGHT_LANE, DURATION - 1).nose) > 1062) fail("the 8's nose passes x 1060");
  for (const i of others) if (racerAt(i, 105).v * K0 > 0.05) fail(`10 in lane ${i + 1} still rolling at f105`);
  // the travel (screen px): the 10s ~90 (they lose), the 8 far more after "beats"
  const t10 = (racerAt(0, DURATION - 1).d + racerAt(2, DURATION - 1).d) / 2;
  const t8 = racerAt(EIGHT_LANE, DURATION - 1).d - racerAt(EIGHT_LANE, 63).d;
  if (t10 * K0 < 70 || t8 < 2 * t10) fail(`travel: 10s ${(t10 * K0).toFixed(0)} px, 8 after beats ${(t8 * K0).toFixed(0)} px`);
  // the labels whole in frame (fixed camera): >= 40 px from the left edge once landed
  if (scr(W(TAG.left)) < 40) fail("the labels sit too near the left edge");
  // lanes never touch: a helmet top stays under its own kerb; the lowest lane's label stays above the caption band
  if (KID.helmetTop * M * K0 >= 200 - 8) fail("a helmet reaches the kerb of its lane");
  if (LANE_GROUND[LANES - 1] + TAG.h / 2 - TAG.lift + 12 >= 1080) fail("the lowest label sits in the caption band");
  // every frame: no kart rolls backward, noses level until "beats", the 8 in front from f70 on, every kart in frame,
  // no kart (or its streaks) reaches back into its lane's label (they only roll away from it)
  for (let f = 0; f < DURATION; f++) {
    const p = [0, 1, 2].map((i) => racerAt(i, f));
    if (p.some((q) => q.v < -1e-9)) fail(`a kart rolls backward at f${f}`);
    if (f <= 60 && Math.max(...p.map((q) => q.nose)) - Math.min(...p.map((q) => q.nose)) > W(2)) fail(`noses not level at f${f}`);
    if (f >= 70 && others.some((i) => p[i].nose >= p[EIGHT_LANE].nose)) fail(`the 8 is not in front at f${f}`);
    if (p.some((q) => scr(q.nose) > 1058)) fail(`a kart leaves the frame at f${f}`);
    if (p.some((q) => q.rear < W(TAG.left + TAG.w + 12))) fail(`a kart touches its label at f${f}`);
  }
}
