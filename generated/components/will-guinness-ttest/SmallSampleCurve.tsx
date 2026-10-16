import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  Label,
  LightSweep,
  METRIC,
  Numeral,
  SPACE,
  STROKE,
  StoutStage,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  mixHex,
  rectPath,
  smoothstep,
  subWidth,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest } from "../kits/cheeky-pint/museShared";
import { HOP_ASPECT, HopCone, hopSilhouette } from "./guinnessShared";

// ---------------------------------------------------------------------------
// SmallSampleCurve — cut 2 of 3, Cheeky Pint S4E02 "will - guinness invented the t-test" (Will O'Brien),
// in the Cheeky Pint S4 stout system (stoutShared.tsx, palette B1) with the clip's hop (guinnessShared.tsx).
// 1080x1920, 23.976 fps, opaque. Delivered as 19_SmallSampleCurve.mov.
//
// CHECK LINE (what the viewer can say after this cut): "From just a handful of hops you can still pin down
// a whole batch's average and its spread — that's the t-test's trick."
//
// THE MOTION: nine amber hops drop one after another onto a long cream ruler and stack into a dot plot; out
// of a slot along the ruler's top a glass bell — Student's t curve fitted to those nine (df 8, centred on
// their mean, scaled by their s) — rises around them, a spread bracket (mean ± s) reaches out to its flanks
// and a cream mean post rises to its peak. The nine came out of the mouth of a cream hopper above the chart
// (its mouth at the top of the frame from f0); on "from a small sample" the camera pulls back and the heap in
// it comes into view: several hundred dim kraft hops up top, nine lit amber ones on the ruler below.
//
// THE LINE: "This is how do you derive either the standard deviation if you know the mean, or the mean if
// you know the standard deviation, from a small sample, less than 30."
// WORDS (f, from this composition's f0): This 1 · is 10 · how 12 · do 19 · you 27 · derive 31-45 · either 45 ·
// the 54 · standard 59 · deviation 70-80 · if 88 · you know the 95-103 · mean 103-108 · or 111 · the 121 ·
// mean 124-129 · if 131 · you know the 134-139 · standard 139 · deviation 144-150 · from 154 · a 160 ·
// small 162 · sample 169-178 · less 181 · than 184 · 30 188-196. Out at f200.
// DURATION: sequence 19.520 -> 27.861 s = 8.341 s = 200 f at 23.976, + a 16-frame living tail = 216.
//
//   f0-30    the drops: from a close shot on the hopper's mouth, nine hops leave it one by one (f0-19) at
//            constant speed; the camera tilts down after them (damped) and widens onto the dot plot by ~f38.
//            Each lands (contact frame = the odometer's roll) with a one-frame squash about its tip that
//            recovers over 3 f, its shadow tightening to rest over 4 f; stacks -2:1 -1:2 0:2 +1:3 +2:1;
//            "n = 1" blurs in on the first contact (f10) and rolls to "n = 9" (f30)
//   f34-60   "derive": the glass bell is driven up out of the ruler's slot (a long ease-out); the camera
//            pushes in about the ruler (k 1.1 -> 1.3)
//   f62-82   "standard deviation": the spread bracket grows out from the mean to mean ± s; STD DEV blurs in;
//            the camera slides along the arm toward it
//   f88-106  "if you know the mean": the cream mean post rises out of the slot behind the stacks to the
//            bell's peak; the camera tilts up with it and MEAN arrives as it gets there
//   f104-118 THE ONE CLICK: a light sweep crosses the glass bell as the post meets its peak
//   f100-158 "or the mean if you know …": nothing new; a slow slide back across the finished chart
//   f128-204 "… the standard deviation, from a small sample, less than 30": the long pull-back (k ~1.33 ->
//            0.75) up to the heap in the hopper above the chart; the ruler ends at screen y ~1000
//   f200-215 tail: the pull-back's creep, the pool, sway and grain
//
// DATA (computed below from the nine positions, in bins): mean = 1/9 = 0.111, s = sqrt((13 - 1/9) / 8) =
// 1.269 (n - 1), the curve = Student t pdf, df = n - 1 = 8, location mean, scale s, its peak drawn at P
// world px (shape true; its height is the chart's own scale, no axis numbers).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const SPAN_FRAMES = 200;
export const DURATION = SPAN_FRAMES + 16;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `ssc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the chart (WORLD px; the axis line is y = 0, bin 0 at x = 0) -------------------------------------
const BIN = 100; // one bin's width
const HOP = 78; // a hop's glyph height (stem to tip)
const HOP_W = HOP * HOP_ASPECT;
const STACK = 0.86 * HOP; // honest, equal stack pitch: each tip tucks onto the stem of the hop under it
const P = 450; // the curve's peak height
const RULER = { x0: -460, x1: 460, h: 40 }; // the cream ruler tile (its top edge is the axis)
const GLASS = { x0: -440, x1: 440 }; // the bell's base, standing in the ruler's slot
const POST_W = 8; // the mean post
/** The chart's labels (SCREEN px): cap 44.5 px, so they read at phone width after the pull-back (blind review). */
const LABEL_PX = Math.ceil(44.5 / METRIC.cap); // 62

/** The sample, in the order the hops drop (bin numbers). Counts: -2:1, -1:2, 0:2, +1:3, +2:1 (n = 9). */
const DROPS = [0, 1, -1, 1, 0, 2, -1, -2, 1] as const;
const N = DROPS.length;
const MEAN_BINS = DROPS.reduce<number>((a, b) => a + b, 0) / N;
const S_BINS = Math.sqrt(DROPS.reduce<number>((a, b) => a + (b - MEAN_BINS) ** 2, 0) / (N - 1));
const DF = N - 1;
const XBAR = MEAN_BINS * BIN;
const S = S_BINS * BIN;
/** Student t pdf (df 8, location XBAR, scale S) relative to its peak. */
const tRel = (x: number) => Math.pow(1 + ((x - XBAR) / S) ** 2 / DF, -(DF + 1) / 2);
/** The spread bracket: a little under where the bell's flanks cross mean ± s. */
const BRACKET_Y = -(P * tRel(XBAR + S) - 10);
const SERIF = 16;

// --- timing --------------------------------------------------------------------------------------------
const FALL_V = 70; // world px per frame, constant until contact
const FIRST_CONTACT = 10; // the first hop leaves the mouth on f0 (its fall takes ~10.6 f)
const CONTACT_STEP = 2.5; // the ninth lands on f30
const SETTLE_F = 4;
const ROLL_F = 2.2;
/** The weight of a landing: on the contact frame the hop squashes a touch about its tip and recovers over
 *  SQUASH_F frames (no overshoot, no rebound). */
const SQUASH = { x: 0.06, y: 0.08, f: 3 } as const;
const HOPS = DROPS.map((bin, i) => {
  const level = DROPS.slice(0, i).filter((b) => b === bin).length;
  const restY = -level * STACK - HOP / 2; // the glyph box's centre at rest
  return { i, bin, level, x: bin * BIN, restY, contact: FIRST_CONTACT + i * CONTACT_STEP };
});
const RISE: [number, number] = [34, 60]; // the bell rises out of the slot, once n reads 9 (last roll ends f32.2)
const ARMS: [number, number] = [62, 82]; // the spread bracket grows out from the mean
const SD_LABEL = 74;
const POST: [number, number] = [88, 106]; // the mean post rises to the peak
const MEAN_LABEL = 100;
const SWEEP: [number, number] = [104, 118]; // the one click: the post meets the peak

// --- the source: an open cream hopper above the chart, a heap of kraft hops in it (WORLD px) ----------
/** Its front face: a funnel from the rim down to the mouth; the hops leave through the mouth (a slit). */
const HOPPER = { rimY: -870, botY: -740, rimHalf: 460, botHalf: 300, mouthHalf: 236, mouthH: 7, dim: 0.45 } as const;
/** A hop leaves the heap here: its box wholly behind the hopper's front face, just above the mouth. */
const START_Y = HOPPER.botY - HOP / 2 - 6;
const hopAt = (h: (typeof HOPS)[number], f: number) => {
  const dt = h.contact - f;
  const y = dt > 0 ? h.restY - FALL_V * dt : h.restY;
  const settle = smoothstep((f - h.contact) / SETTLE_F);
  const squash = dt <= 0 && f - h.contact < SQUASH.f ? 1 - smoothstep((f - h.contact) / SQUASH.f) : 0;
  return { y, out: y >= START_Y, falling: dt > 0, lift: dt > 0 ? 1 : 1 - settle, settled: f >= h.contact + SETTLE_F, squash };
};
/** The odometer: n = 1 at the first contact, then one roll per contact (starting on the contact frame). */
const nAt = (f: number) => {
  let v = 1;
  let blur = 0;
  for (const h of HOPS.slice(1)) {
    const u = clamp01((f - h.contact) / ROLL_F);
    v += u;
    if (u > 0 && u < 1) blur = 3 * Math.sin(Math.PI * u);
  }
  return { v, blur };
};

// --- the camera (LOOK = the world point on the frame's middle) and the light pool ------------------------
// The camera is in it: close on the hopper's mouth as the first hop leaves, a damped tilt down after the
// falling hops that widens onto the dot plot by f32; a push in with the rising bell (zooming about the ruler,
// which stays at screen y ~1000); a slide along the bracket; a tilt up with the post to MEAN; a slow slide
// back across the finished chart; then the long pull-back up to the heap. Checked: max screen speed 36 px/f
// (f16, the tilt down), max |dv| 2.45 px/f^2 (f1) (house hints: <= 45 and <= 2.5).
const CAM = makeClockCam(
  { x: 0, y: -585, k: 2.2 },
  [
    { f0: -8, f1: 38, dy: 548.6, k: 1.1 }, // down after the hops, out onto the dot plot
    { f0: 30, f1: 68, dy: 5.6, k: 1.3 }, // in with the rising bell
    { f0: 58, f1: 88, dx: 45 }, // along the bracket's arm toward STD DEV
    { f0: 84, f1: 110, dy: -30, k: 1.36 }, // up with the post to the peak and MEAN
    { f0: 100, f1: 158, dx: -60, dy: 25, k: 1.3 }, // a slow slide back across the finished chart
    { f0: 128, f1: 204, dx: 21, dy: -24.3, k: 0.75 }, // the pull-back: the heap comes into view
    { f0: 196, f1: 290, dy: -1.5, k: 0.73 }, // the tail's creep
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: 0, y: -640, strength: 1.0 },
  [
    { f0: -10, f1: 30, x: 0, y: -110, strength: 1.0 },
    { f0: 30, f1: 72, x: XBAR, y: -210, strength: 1.35 },
    { f0: 128, f1: 202, x: XBAR, y: -300, strength: 1.6 },
  ],
  DURATION,
);

/** The heap: dense overlapping rows of kraft hops mounded over the rim (back rows first, front rows last). */
const HEAP = { h: 290, base: 452, row: 25, px: 32, shade: 0.26 } as const;
const hash01 = (n: number) => {
  const v = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const HEAP_HOPS = (() => {
  const rows: { x: number; y: number; r: number }[][] = [];
  for (let r = 0; r * HEAP.row <= HEAP.h - HOP * 0.45; r++) {
    const rise = r * HEAP.row;
    const hw = HEAP.base * Math.pow(Math.max(0, 1 - Math.pow(rise / HEAP.h, 1.8)), 0.6) - HOP_W * 0.35;
    const row: { x: number; y: number; r: number }[] = [];
    const n = Math.max(1, Math.floor((2 * hw) / HEAP.px) + 1);
    for (let i = 0; i < n; i++) {
      const seed = r * 101 + i * 7;
      const x = -hw + (n === 1 ? hw : (2 * hw * i) / (n - 1)) + (hash01(seed) - 0.5) * 10;
      const feet = HOPPER.rimY + 22 - rise + (hash01(seed + 3) - 0.5) * 8;
      row.push({ x, y: feet - HOP / 2, r: Math.round((hash01(seed + 5) - 0.5) * 56) });
    }
    rows.push(row);
  }
  return rows.reverse().flat();
})();
const HOPPER_D = `M${-HOPPER.rimHalf} ${HOPPER.rimY}L${HOPPER.rimHalf} ${HOPPER.rimY}L${HOPPER.botHalf} ${HOPPER.botY}L${-HOPPER.botHalf} ${HOPPER.botY}Z`;
/** The heap's edge at the mouth: a few kraft hops caught in it, their tips hanging below the mouth (between
 *  the bins, so the falling nine pass clear of them). Static, there from f0: the hopper reads as full of hops. */
const PEEK = [
  { x: -218, drop: 24, r: -14 },
  { x: -150, drop: 32, r: 9 },
  { x: -52, drop: 20, r: -6 },
  { x: 50, drop: 30, r: 12 },
  { x: 150, drop: 22, r: -10 },
  { x: 220, drop: 30, r: 7 },
].map((p) => ({ x: p.x, y: HOPPER.botY + p.drop - HOP / 2, r: p.r }));
const HEAP_SIL: Silhouette = [{ d: HOPPER_D }, ...[...HEAP_HOPS, ...PEEK].map((h) => ({ d: hopSilhouette(h.x, h.y, HOP, h.r) }))];

/** Context taken down BY TONE: every channel of what it wraps scaled toward the dark by `shade` (0..1).
 *  (HopCone has no shade prop; this keeps the shared module untouched.) Shadows stay outside it. */
const Shade: React.FC<{ id: string; shade: number; children: React.ReactNode }> = ({ id, shade, children }) => (
  <g>
    <defs>
      <filter id={id} x="0" y="0" width="1" height="1">
        <feComponentTransfer>
          <feFuncR type="linear" slope={1 - shade} />
          <feFuncG type="linear" slope={1 - shade} />
          <feFuncB type="linear" slope={1 - shade} />
        </feComponentTransfer>
      </filter>
    </defs>
    <g filter={`url(#${id})`}>{children}</g>
  </g>
);

// --- geometry ----------------------------------------------------------------------------------------
const bellPoints = (grow: number) => {
  const pts: [number, number][] = [];
  for (let x = GLASS.x0; x <= GLASS.x1 + 0.01; x += 5) pts.push([x, -P * grow * tRel(x)]);
  return pts;
};
const bellArea = (grow: number) => {
  const pts = bellPoints(grow);
  return `M${f2(GLASS.x0)} 0` + pts.map(([x, y]) => `L${f2(x)} ${f2(y)}`).join("") + `L${f2(GLASS.x1)} 0Z`;
};
const bellLine = (grow: number, inset: number) => {
  const pts = bellPoints(grow);
  return `M${f2(GLASS.x0 + inset)} 0` + pts.map(([x, y], i) => `L${f2(i === 0 ? x + inset : i === pts.length - 1 ? x - inset : x)} ${f2(y + inset)}`).join("") + `L${f2(GLASS.x1 - inset)} 0`;
};

/** "n = 9": the label tone for "n =", an odometer in the numeral face for the count; the house entrance. */
const NCount: React.FC<{ x: number; y: number; k: number; value: number; rollBlur: number; enter: number }> = ({ x, y, k, value, rollBlur, enter }) => {
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  const lift = (1 - a) * 24;
  const blur = 6 * (1 - a);
  const fs = LABEL_PX / k;
  const lead = (subWidth("n = ", LABEL_PX) + 0.2 * LABEL_PX) / k;
  return (
    <g opacity={f2(a)} style={{ filter: blur > 0.05 ? `blur(${f2(blur / k)}px)` : undefined }}>
      <text x={f2(x)} y={f2(y + lift / k)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={f2(fs)} letterSpacing={`${TRACK.label}em`} fill={COLOR.inkCreamLo}>
        n =
      </text>
      <Numeral x={x + lead} y={y + lift / k} k={k} px={LABEL_PX} value={value} rollBlur={rollBlur} tone="cream" anchor="start" />
    </g>
  );
};

const SmallSampleCurve: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const uid = uidOf(useId());
  const cam = CAM.at(frame);
  const k = cam.k;
  const pool = POOL(frame);

  const grow = 1 - Math.pow(1 - clamp01((frame - RISE[0]) / (RISE[1] - RISE[0])), 2.6); // driven out of the slot, a long ease-out
  const arms = restToRest((frame - ARMS[0]) / (ARMS[1] - ARMS[0]), 2.5);
  const post = restToRest((frame - POST[0]) / (POST[1] - POST[0]), 2.5);
  const hops = HOPS.map((h) => ({ ...h, ...hopAt(h, frame) }));
  const n = nAt(frame);

  // the chart's ONE shadow: ruler + bell (glass, faint) + the settled hops + the post
  const sil: Silhouette = [{ d: rectPath(RULER.x0, 0, RULER.x1 - RULER.x0, RULER.h) }];
  if (grow > 0.0005) sil.push({ d: bellArea(grow), a: 0.3 });
  hops.forEach((h) => {
    if (h.settled) sil.push({ d: hopSilhouette(h.x, h.y, HOP) });
  });
  if (post > 0.0005) sil.push({ d: rectPath(XBAR - POST_W / 2, -P * post, POST_W, P * post, 2, true, false) });

  const slotOn = grow > 0.0005;
  const slotH = EDGE.SLOT / k;
  const lip = EDGE.SLOT_LIP / k;
  const edgeY = EDGE.CREAM / k / 2;
  const sweepT = (frame - SWEEP[0]) / (SWEEP[1] - SWEEP[0]);
  const armL = S * arms;
  const fallBlur = FALL_V * 0.07; // world px: a vertical smear in proportion to the fall speed

  return (
    <AbsoluteFill>
      <StoutStage S={frame} cam={cam} rest={CAM.rest} pool={pool}>
        <defs>
          <linearGradient id={`${uid}ruler`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={RULER.h}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          <linearGradient id={`${uid}post`} gradientUnits="userSpaceOnUse" x1="0" y1={-P} x2="0" y2="0">
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          <linearGradient id={`${uid}hop`} gradientUnits="userSpaceOnUse" x1="0" y1={HOPPER.rimY} x2="0" y2={HOPPER.botY}>
            <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, HOPPER.dim)} />
            <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, HOPPER.dim)} />
          </linearGradient>
          <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
            <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
          </linearGradient>
          <filter id={`${uid}fall`} x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f2(fallBlur)}`} />
          </filter>
          {/* the sweep lives on the body of the glass: the bell, faded out toward its thin tails */}
          <linearGradient id={`${uid}core`} gradientUnits="userSpaceOnUse" x1={f2(XBAR - 2.6 * S)} y1="0" x2={f2(XBAR + 2.6 * S)} y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#fff" />
            <stop offset="0.7" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`${uid}bell`} maskUnits="userSpaceOnUse" x={GLASS.x0} y={-P - 10} width={GLASS.x1 - GLASS.x0} height={P + 10}>
            <path d={bellArea(1)} fill={`url(#${uid}core)`} />
          </mask>
        </defs>

        {/* THE CHART: its one shadow */}
        <ElevationShadow silhouette={sil} elevation="rest" contact={{ x: 0, y: RULER.h, w: RULER.x1 - RULER.x0 }} />

        {/* the glass body (behind the hops) */}
        {slotOn ? <path d={bellArea(grow)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}

        {/* THE ONE CLICK: a light sweep across the glass (behind the hops) as the post meets the peak */}
        <g mask={`url(#${uid}bell)`}>
          <LightSweep x={GLASS.x0} y={-P} w={GLASS.x1 - GLASS.x0} h={P} k={k} t={sweepT} on="cream" r={0} />
        </g>

        {/* the ruler: cream card, its lit top edge stopping at the slot, bin ticks on its face */}
        <path d={rectPath(RULER.x0, 0, RULER.x1 - RULER.x0, RULER.h)} fill={`url(#${uid}ruler)`} />
        <path
          d={
            slotOn
              ? `M${f2(RULER.x0 + 4)} ${f2(edgeY)}H${f2(GLASS.x0 - lip)}M${f2(GLASS.x1 + lip)} ${f2(edgeY)}H${f2(RULER.x1 - 4)}`
              : `M${f2(RULER.x0 + 4)} ${f2(edgeY)}H${f2(RULER.x1 - 4)}`
          }
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
        <g stroke={COLOR.inkDark} strokeOpacity={0.32} strokeWidth={f2(STROKE.RULE / k)}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((b) => (
            <line key={b} x1={b * BIN} x2={b * BIN} y1={f2(slotH + 3)} y2={b % 2 === 0 ? 16 : 11} />
          ))}
        </g>

        {/* the mean post: cream, out of the slot to the peak (BEHIND the stacks: the hops hide its foot) */}
        {post > 0.0005 ? (
          <g>
            <path d={rectPath(XBAR - POST_W / 2, -P * post, POST_W, P * post, 2, true, false)} fill={`url(#${uid}post)`} />
            <path
              d={`M${f2(XBAR - POST_W / 2 + 1)} ${f2(-P * post + edgeY)}H${f2(XBAR + POST_W / 2 - 1)}`}
              stroke={COLOR.edge}
              strokeOpacity={ALPHA.edge}
              strokeWidth={f2(EDGE.CREAM / k)}
            />
            <rect
              x={f2(XBAR - POST_W / 2)}
              y={f2(-Math.min(P * post, EDGE.FOOT_AO / k))}
              width={POST_W}
              height={f2(Math.min(P * post, EDGE.FOOT_AO / k))}
              fill={`url(#${uid}ao)`}
            />
          </g>
        ) : null}

        {/* THE SOURCE: the hopper + its heap, ONE shadow; the heap's hops (kraft, shaded: context) */}
        <ElevationShadow silhouette={HEAP_SIL} elevation="rest" />
        <Shade id={`${uid}shade`} shade={HEAP.shade}>
          {[...HEAP_HOPS, ...PEEK].map((h, i) => (
            <HopCone key={i} x={h.x} y={h.y} size={HOP} tone="kraft" rotate={h.r} k={k} />
          ))}
        </Shade>

        {/* the falling hops' own shadows (lifted), outside the bloom */}
        {hops.map((h) =>
          h.settled || !h.out ? null : <ElevationShadow key={h.i} silhouette={[{ d: hopSilhouette(h.x, h.y, HOP) }]} elevation="rest" lift={h.lift} />,
        )}

        {/* THE SAMPLE: nine amber hops, one bloom for the group (a hop still in the hopper is not drawn) */}
        <g style={{ filter: bloomFilter(k) }}>
          {hops.map((h) =>
            h.out ? (
              <g key={h.i} filter={h.falling ? `url(#${uid}fall)` : undefined}>
                <g
                  transform={
                    h.squash > 0
                      ? `translate(${f2(h.x)} ${f2(h.y + HOP / 2)}) scale(${f2(1 + SQUASH.x * h.squash)} ${f2(1 - SQUASH.y * h.squash)}) translate(${f2(-h.x)} ${f2(-h.y - HOP / 2)})`
                      : undefined
                  }
                >
                  <HopCone x={h.x} y={h.y} size={HOP} tone="amber" k={k} />
                </g>
              </g>
            ) : null,
          )}
        </g>

        {/* the hopper's front face (over the heap's foot and a hop leaving), its lit rim, its mouth */}
        <path d={HOPPER_D} fill={`url(#${uid}hop)`} />
        <path d={`M${-HOPPER.rimHalf + 3} ${f2(HOPPER.rimY + edgeY)}H${HOPPER.rimHalf - 3}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
        <path d={rectPath(-HOPPER.mouthHalf, HOPPER.botY - HOPPER.mouthH, 2 * HOPPER.mouthHalf, HOPPER.mouthH, 2, true, false)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />

        {/* the glass hairline: up its ends and over the bell, open at its base */}
        {slotOn ? (
          <path d={bellLine(grow, STROKE.HAIRLINE / k / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f2(STROKE.HAIRLINE / k)} strokeLinejoin="round" />
        ) : null}

        {/* the slot along the ruler's top, where the glass and the post stand */}
        {slotOn ? (
          <rect x={f2(GLASS.x0 - lip)} y={f2(-slotH / 2)} width={f2(GLASS.x1 - GLASS.x0 + 2 * lip)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        ) : null}

        {/* the spread bracket: mean ± s, grown out from the mean */}
        {arms > 0.0005 ? (
          <g stroke={COLOR.inkCream} strokeWidth={f2(STROKE.RULE / k)} fill="none">
            <path d={`M${f2(XBAR - armL)} ${f2(BRACKET_Y)}H${f2(XBAR + armL)}`} />
            <path d={`M${f2(XBAR - armL)} ${f2(BRACKET_Y - SERIF / 2)}V${f2(BRACKET_Y + SERIF / 2)}M${f2(XBAR + armL)} ${f2(BRACKET_Y - SERIF / 2)}V${f2(BRACKET_Y + SERIF / 2)}`} />
          </g>
        ) : null}

        {/* labels: STD DEV beside the bracket (outside the bell), MEAN over the peak, n = 9 by the sample */}
        <Label x={XBAR + S + (SPACE.CLEAR + SPACE.VALUE) / k} y={BRACKET_Y + (LABEL_PX * METRIC.cap) / 2 / k} k={k} px={LABEL_PX} text="STD DEV" anchor="start" enter={(frame - SD_LABEL) / 12} />
        <Label x={XBAR} y={-P - SPACE.CLEAR / k} k={k} px={LABEL_PX} text="MEAN" enter={(frame - MEAN_LABEL) / 12} />
        <NCount x={-300} y={-330} k={k} value={n.v} rollBlur={n.blur} enter={(frame - HOPS[0].contact) / 12} />
      </StoutStage>
    </AbsoluteFill>
  );
};

export default SmallSampleCurve;
