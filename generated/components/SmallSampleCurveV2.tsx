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
  METRIC,
  Numeral,
  SPACE,
  STROKE,
  StoutStage,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  numeralWidth,
  subWidth,
  type Silhouette,
} from "./stoutShared";
import { makeClockCam, makePoolTrack, restToRest, type Cam } from "./museShared";
import { HOP_ASPECT, HopCone, hopSilhouette } from "./guinnessShared";

// ---------------------------------------------------------------------------
// SmallSampleCurveV2 — the cold-review copy of SmallSampleCurve (delivered Oct 15 2026). Cut 2 of 3, Cheeky Pint S4E02 "will - guinness invented the t-test" (Will O'Brien),
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
//   f111-148 "or the mean if you know the standard deviation": the bracket stays locked; the bell (post and
//            MEAN with it) eases 70 world px off-centre (f111-125), then slides back and seats at the
//            bracket's centre (f131-148); the camera follows a little. No light sweep in this version.
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
const STACK = 0.86 * HOP; // honest, equal stack pitch: each tip tucks onto the stem of the hop under it
const P = 450; // the curve's peak height
const RULER = { x0: -460, x1: 460, h: 40 }; // the cream ruler tile (its top edge is the axis)
const GLASS = { x0: -440, x1: 440 }; // the bell's base, standing in the ruler's slot
const POST_W = 12; // the mean post
/** The post floats: from just above the middle column's top hop (a small gap) up to the peak. */
const POST_BOT = -(STACK + HOP) - 14;
/** Strokes drawn in WORLD px so they keep their weight at phone size: the bell's edge and the bracket. */
const CURVE_W = 5;
const BRACKET_W = 6;
/** The chart's labels (SCREEN px): cap 44.5 px, so they read at phone width after the pull-back (blind review). */
const LABEL_PX = Math.ceil(56 / METRIC.cap); // 78: caps 56 px at rest

/** The sample, in the order the hops drop (bin numbers). Counts: -2:1, -1:2, 0:2, +1:3, +2:1 (n = 9). */
const DROPS = [-2, 0, 1, -1, 1, 0, 2, -1, 1] as const; // the -2 hop first: it has landed before "n =" stands in its path
const N = DROPS.length;
const MEAN_BINS = DROPS.reduce<number>((a, b) => a + b, 0) / N;
const S_BINS = Math.sqrt(DROPS.reduce<number>((a, b) => a + (b - MEAN_BINS) ** 2, 0) / (N - 1));
const DF = N - 1;
const XBAR = MEAN_BINS * BIN;
const S = S_BINS * BIN;
/** Student t pdf (df 8, location XBAR, scale S) relative to its peak. */
const tRel = (x: number, mu = XBAR) => Math.pow(1 + ((x - mu) / S) ** 2 / DF, -(DF + 1) / 2);
/** The spread bracket: a little under where the bell's flanks cross mean ± s. */
const BRACKET_Y = -P * tRel(XBAR + S); // ON the curve at mean ± s: the bracket's ends touch it (an honest reading)
const SERIF = 30;

// --- timing --------------------------------------------------------------------------------------------
const FALL_V = 70; // world px per frame, constant until contact
const FIRST_CONTACT = 10; // the first hop leaves the mouth on f0 (its fall takes ~10.6 f)
const CONTACT_STEP = 2.5; // the ninth lands on f30
const SETTLE_F = 4;
/** The weight of a landing: on the contact frame the hop squashes a touch about its tip and recovers over
 *  SQUASH_F frames (no overshoot, no rebound). */
const SQUASH = { x: 0.06, y: 0.08, f: 3 } as const;
const HOPS = DROPS.map((bin, i) => {
  const level = DROPS.slice(0, i).filter((b) => b === bin).length;
  const restY = -level * STACK - HOP / 2; // the glyph box's centre at rest
  return { i, bin, level, x: bin * BIN, restY, contact: FIRST_CONTACT + i * CONTACT_STEP };
});
const RISE: [number, number] = [34, 60]; // the bell rises out of the slot, once n reads 9 (last roll ends f32.2)
/** THE FIRST CLAUSE, in logical order ("derive the standard deviation if you know the mean"): the MEAN post rises
 *  and locks amber first (the known value), then the STD DEV bracket, drawn lo, grows out of the post to ±s and
 *  seats to full cream on "mean" (f103). */
const POST: [number, number] = [59, 72]; // the mean post rises from the middle column, LOCKED (amber)
const MEAN_LABEL = 69; // rises out of the post's top as the post arrives
const ARMS: [number, number] = [76, 98]; // the bracket grows out of the post, both arms, to ±s (lo: being found)
const SD_LABEL = 84;
/** THE SECOND CLAUSE as a search ("or the mean if you know the standard deviation"): on "or" the bracket locks
 *  amber and the post unlocks (lo); the post and its bell SEARCH: out to the right of the stacks, a sweep back
 *  across them that slows into a slight overshoot, and a snap onto the bracket's centre on "deviation" (f144),
 *  turning full cream on contact. Keys (offset of the mean, world px; rest to rest between keys). */
const SWAP = { lock: [111, 118] as [number, number], seat: [143, 148] as [number, number] } as const;
const SEARCH: [number, number][] = [
  [111, 0],
  [122, 150],
  [139, -12],
  [144, 0],
];
const B_SEAT: [number, number] = [100, 106];
/** Where the (centred) bell's left flank is at height h above the ruler (STD DEV stands outside it). */
const flankAt = (h: number) => XBAR - S * Math.sqrt(DF * (Math.pow(clamp01(h / P), -2 / (DF + 1)) - 1));
/** The hopper's mount: two cream struts from far above the frame down to its rim (one object with it). */
const STRUT = { x: 404, w: 18, top: -4000 } as const;
const win = (f: number, w: [number, number]) => smoothstep((f - w[0]) / (w[1] - w[0]));
const meanShift = (f: number) => {
  for (let i = 1; i < SEARCH.length; i++) {
    const [f0, x0] = SEARCH[i - 1];
    const [f1, x1] = SEARCH[i];
    if (f < f1) return f <= f0 ? x0 : lerp(x0, x1, smoothstep((f - f0) / (f1 - f0)));
  }
  return 0;
};

// --- the source: an open cream hopper above the chart, a heap of kraft hops in it (WORLD px) ----------
/** Its front face: a funnel from the rim down to the mouth; the hops leave through the mouth (a slit). */
const HOPPER = { rimY: -690, botY: -600, rimHalf: 460, botHalf: 320, mouthHalf: 236, mouthH: 7, dim: 0.45 } as const;
/** The heap's hops: the same glyph, drawn bigger so each cone reads at phone size, in the sample's amber taken
 *  most of the way to kraft and down by tone (the same thing, unlit). */
const HEAP_HOP = 120;
const HEAP_HOP_W = HEAP_HOP * HOP_ASPECT;
const HEAP_TONE = { mix: 0.6 } as const;
/** A hop leaves the heap here: its box wholly behind the hopper's front face, just above the mouth. */
const START_Y = HOPPER.botY - HOP / 2 - 6;
const hopAt = (h: (typeof HOPS)[number], f: number) => {
  const dt = h.contact - f;
  const y = dt > 0 ? h.restY - FALL_V * dt : h.restY;
  const settle = smoothstep((f - h.contact) / SETTLE_F);
  const squash = dt <= 0 && f - h.contact < SQUASH.f ? 1 - smoothstep((f - h.contact) / SQUASH.f) : 0;
  return { y, out: y >= START_Y, falling: dt > 0, lift: dt > 0 ? 1 : 1 - settle, settled: f >= h.contact + SETTLE_F, squash };
};
/** The count: n = 1 at the first contact, then the digit changes ON each contact frame (whole digits, no roll). */
const nAt = (f: number) => ({ v: HOPS.filter((h) => f >= h.contact).length, blur: 0 });

// --- the camera (LOOK = the world point on the frame's middle) and the light pool ------------------------
// The camera is in it: close on the hopper's mouth as the first hop leaves, a damped tilt down after the
// falling hops that widens onto the dot plot (k ~0.92-0.98 through the chart, so the hopper and its heap stay in
// view above and the 56 px labels stay in frame); a calm push with the bell and the post; a small follow of the
// search; then the pull-back (k 0.77) until hopper and heap are whole above the nine.
const CAM_TRACK = makeClockCam(
  { x: 0, y: -460, k: 2.2 },
  [
    { f0: -8, f1: 38, dx: -42, dy: 416.5, k: 0.92 }, // down after the hops, out onto the dot plot (framed a touch right of centre so STD DEV keeps a 40 px margin on the left)
    { f0: 34, f1: 74, dy: 1.8, k: 0.96 }, // a calm push in with the rising bell and the post
    { f0: 70, f1: 104, dy: -10, k: 0.98 }, // up a little with the post and the bracket
    { f0: 108, f1: 126, dx: 10 }, // after the post as it searches out …
    { f0: 126, f1: 148, dx: -10, dy: 10 }, // … and back as it snaps on
    { f0: 150, f1: 218, dx: 42, dy: -11, k: 0.77 }, // "from a small sample": back until hopper and heap are whole above the nine (still easing at the cut)
    { f0: 204, f1: 300, k: 0.76 }, // the tail's creep
  ],
  DURATION,
);
/** The chart sits higher in the frame than the track was built for: every camera is moved so the ruler's top
 *  lands at screen y ~900 instead of ~1000 (a fixed SCREEN offset, so it holds at any zoom). */
const LIFT_PX = 100;
const lifted = (c: Cam): Cam => ({ x: c.x, y: c.y + LIFT_PX / c.k, k: c.k });
const CAM = { at: (f: number) => lifted(CAM_TRACK.at(f)), rest: lifted(CAM_TRACK.rest) };
const POOL = makePoolTrack(
  { x: 0, y: -520, strength: 1.0 },
  [
    { f0: -10, f1: 30, x: 0, y: -110, strength: 1.0 },
    { f0: 30, f1: 72, x: XBAR, y: -210, strength: 1.35 },
    { f0: 110, f1: 124, x: XBAR + 110, y: -260, strength: 1.35 },
    { f0: 124, f1: 146, x: XBAR, y: -240, strength: 1.35 },
    { f0: 150, f1: 200, x: XBAR, y: -330, strength: 1.6 },
  ],
  DURATION,
);

/** The heap: dense overlapping rows of kraft hops mounded over the rim (back rows first, front rows last). */
const HEAP = { h: 250, base: 452, row: 44, px: 50, shade: 0.3 } as const;
const hash01 = (n: number) => {
  const v = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const HEAP_HOPS = (() => {
  const rows: { x: number; y: number; r: number }[][] = [];
  for (let r = 0; r * HEAP.row <= HEAP.h - HEAP_HOP * 0.45; r++) {
    const rise = r * HEAP.row;
    const hw = HEAP.base * Math.pow(Math.max(0, 1 - Math.pow(rise / HEAP.h, 1.8)), 0.6) - HEAP_HOP_W * 0.35;
    const row: { x: number; y: number; r: number }[] = [];
    const n = Math.max(1, Math.floor((2 * hw) / HEAP.px) + 1);
    for (let i = 0; i < n; i++) {
      const seed = r * 101 + i * 7;
      const x = -hw + (n === 1 ? hw : (2 * hw * i) / (n - 1)) + (hash01(seed) - 0.5) * 14;
      const feet = HOPPER.rimY + 34 - rise + (hash01(seed + 3) - 0.5) * 10;
      row.push({ x, y: feet - HEAP_HOP / 2, r: Math.round((hash01(seed + 5) - 0.5) * 56) });
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
].map((p) => ({ x: p.x, y: HOPPER.botY + p.drop - HEAP_HOP / 2, r: p.r }));
const STRUT_D = [-1, 1].map((sd) => rectPath(sd * STRUT.x - STRUT.w / 2, STRUT.top, STRUT.w, HOPPER.rimY - STRUT.top + 2, 0));
const HEAP_SIL: Silhouette = [{ d: HOPPER_D }, ...STRUT_D.map((d) => ({ d })), ...[...HEAP_HOPS, ...PEEK].map((h) => ({ d: hopSilhouette(h.x, h.y, HEAP_HOP, h.r) }))];

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
const bellPoints = (grow: number, mu: number) => {
  const pts: [number, number][] = [];
  // while the bell is off-centre its far tail tapers into the slot's end (at rest: none, the true curve)
  const off = clamp01(Math.abs(mu - XBAR) / 60);
  for (let x = GLASS.x0; x <= GLASS.x1 + 0.01; x += 5) {
    const taper = 1 - off * (1 - smoothstep((GLASS.x1 - Math.abs(x)) / 140));
    pts.push([x, -P * grow * tRel(x, mu) * taper]);
  }
  return pts;
};
const bellArea = (grow: number, mu: number) => {
  const pts = bellPoints(grow, mu);
  return `M${f2(GLASS.x0)} 0` + pts.map(([x, y]) => `L${f2(x)} ${f2(y)}`).join("") + `L${f2(GLASS.x1)} 0Z`;
};
const bellLine = (grow: number, mu: number, inset: number) => {
  const pts = bellPoints(grow, mu);
  return `M${f2(GLASS.x0 + inset)} 0` + pts.map(([x, y], i) => `L${f2(i === 0 ? x + inset : i === pts.length - 1 ? x - inset : x)} ${f2(y + inset)}`).join("") + `L${f2(GLASS.x1 - inset)} 0`;
};

/** "n = 9": "n =" in the label face and the count in the numeral face (whole digits), cream. It slides up into
 *  place (40 px, ease-out over 8 f); its opacity only comes up over the first 2 frames of that. */
const NCount: React.FC<{ x: number; y: number; k: number; value: number; enter: number }> = ({ x, y, k, value, enter }) => {
  if (enter <= 0 || value < 1) return null;
  const fs = LABEL_PX / k;
  const rise = (1 - easeOutCubic(enter)) * (40 / k);
  const a = clamp01(enter * 4);
  const lead = (subWidth("n = ", LABEL_PX) + 0.2 * LABEL_PX) / k;
  return (
    <g opacity={a < 1 ? f2(a) : undefined}>
      <text x={f2(x)} y={f2(y + rise)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={f2(fs)} letterSpacing={`${TRACK.label}em`} fill={COLOR.inkCream}>
        n =
      </text>
      <Numeral x={x + lead} y={y + rise} k={k} px={LABEL_PX} text={`${value}`} tone="cream" anchor="start" />
    </g>
  );
};

/** A label whose tone follows its element: lo cream underneath, full cream and amber layered over it by weight
 *  (a top layer at weight w over a full base = a mix of the two by tone). */
const ToneLabel: React.FC<{
  x: number;
  y: number;
  k: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  enter: number;
  cream: number;
  amber: number;
  /** "up": the house entrance (blur-in + 24 px slide up); "left": the same, sliding out leftward from its mark */
  from?: "up" | "left";
}> = ({ x, y, k, text, anchor = "middle", enter, cream, amber, from = "up" }) => {
  const e = easeOutCubic(clamp01(enter));
  if (enter <= 0) return null;
  const inner = from === "up" ? enter : 1;
  const layers = (
    <g>
      <Label x={x} y={y} k={k} px={LABEL_PX} tone="creamLo" text={text} anchor={anchor} enter={inner} />
      {cream > 0.002 ? (
        <g opacity={f2(cream)}>
          <Label x={x} y={y} k={k} px={LABEL_PX} tone="cream" text={text} anchor={anchor} enter={inner} />
        </g>
      ) : null}
      {amber > 0.002 ? (
        <g opacity={f2(amber)}>
          <Label x={x} y={y} k={k} px={LABEL_PX} tone="amber" text={text} anchor={anchor} enter={inner} />
        </g>
      ) : null}
    </g>
  );
  if (from === "up" || e >= 0.999) return layers;
  return (
    <g opacity={f2(e)} transform={`translate(${f2(((1 - e) * 24) / k)} 0)`} style={{ filter: `blur(${f2((6 * (1 - e)) / k)}px)` }}>
      {layers}
    </g>
  );
};

const SmallSampleCurveV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const uid = uidOf(useId());
  const cam = CAM.at(frame);
  const k = cam.k;
  const pool = POOL(frame);

  const grow = 1 - Math.pow(1 - clamp01((frame - RISE[0]) / (RISE[1] - RISE[0])), 2.6); // driven out of the slot, a long ease-out
  const arms = restToRest((frame - ARMS[0]) / (ARMS[1] - ARMS[0]), 2.2);
  const post = restToRest((frame - POST[0]) / (POST[1] - POST[0]), 2.5);
  // the states: bracket lo -> cream (seated) -> amber (locked); post amber (locked) -> lo -> cream (seated)
  const bSeat = win(frame, B_SEAT);
  const bLock = win(frame, SWAP.lock) * (1 - win(frame, [150, 160])); // amber only during its own clause; cream again once the mean has seated
  const pAmber = 1 - win(frame, SWAP.lock);
  const pSeat = win(frame, SWAP.seat);
  const glow = win(frame, [160, 188]); // the nine light up against the dim heap, fully lit by "30" (f188)
  const postLen = (P + POST_BOT) * post;
  const postTop = POST_BOT - postLen;
  const hops = HOPS.map((h) => ({ ...h, ...hopAt(h, frame) }));
  const n = nAt(frame);
  const mu = XBAR + meanShift(frame); // the bell's (and the post's) centre

  // the chart's ONE shadow: ruler + bell (glass, faint) + the settled hops + the post
  const sil: Silhouette = [{ d: rectPath(RULER.x0, 0, RULER.x1 - RULER.x0, RULER.h) }];
  if (grow > 0.0005) sil.push({ d: bellArea(grow, mu), a: 0.3 });
  hops.forEach((h) => {
    if (h.settled) sil.push({ d: hopSilhouette(h.x, h.y, HOP) });
  });
  if (post > 0.0005) sil.push({ d: rectPath(mu - POST_W / 2, postTop, POST_W, postLen, 3) });

  const slotOn = grow > 0.0005;
  // STD DEV stands left of the curve's left stroke with clear air, measured at the label's lowest point (where the
  // flank is furthest out) and allowing for the search's small overshoot to the left
  const sdX = flankAt(-(BRACKET_Y + (LABEL_PX * METRIC.cap) / 2 / k)) - 12 - CURVE_W - 32 / k;
  // "n = 9" stands centred under the ruler, under the sample it counts (clear of the search and of MEAN)
  const nW = (subWidth("n = ", LABEL_PX) + 0.2 * LABEL_PX + numeralWidth(`${n.v}`, LABEL_PX)) / k;
  const slotH = EDGE.SLOT / k;
  const lip = EDGE.SLOT_LIP / k;
  const edgeY = EDGE.CREAM / k / 2;
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
        </defs>

        {/* THE CHART: its one shadow */}
        <ElevationShadow silhouette={sil} elevation="rest" contact={{ x: 0, y: RULER.h, w: RULER.x1 - RULER.x0 }} />

        {/* the glass body (behind the hops) */}
        {slotOn ? <path d={bellArea(grow, mu)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}


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

        {/* the mean post: floating from just above the middle column to the peak; amber while LOCKED, lo cream
            while being found, full cream once seated */}
        {post > 0.0005 ? (
          <g>
            <path d={rectPath(mu - POST_W / 2, postTop, POST_W, postLen, 3)} fill={mixHex(COLOR.inkCreamLo, COLOR.cream, pSeat)} />
            {pAmber > 0.002 ? (
              <g opacity={f2(pAmber)} style={{ filter: bloomFilter(k) }}>
                <path d={rectPath(mu - POST_W / 2, postTop, POST_W, postLen, 3)} fill={COLOR.amberTop} />
              </g>
            ) : null}
            <path
              d={`M${f2(mu - POST_W / 2 + 2)} ${f2(postTop + edgeY)}H${f2(mu + POST_W / 2 - 2)}`}
              stroke={pAmber > 0.5 ? COLOR.amberHot : COLOR.edge}
              strokeOpacity={ALPHA.edge}
              strokeWidth={f2(EDGE.CREAM / k)}
            />
          </g>
        ) : null}

        {/* THE SOURCE: the hopper + its heap, ONE shadow; the heap's hops (kraft, shaded: context) */}
        <ElevationShadow silhouette={HEAP_SIL} elevation="rest" />
        {/* the hopper's mount: two struts from above the frame to its rim (behind the heap, one shadow with it) */}
        {STRUT_D.map((d, i) => (
          <path key={i} d={d} fill={mixHex(COLOR.cream, COLOR.board, HOPPER.dim)} />
        ))}
        {[-1, 1].map((sd) => (
          <path
            key={sd}
            d={`M${f2(sd * STRUT.x - STRUT.w / 2 + EDGE.CREAM / k / 2)} ${STRUT.top}V${HOPPER.rimY}`}
            stroke={COLOR.edge}
            strokeOpacity={ALPHA.edgeBoard}
            strokeWidth={f2(EDGE.CREAM / k)}
          />
        ))}
        <Shade id={`${uid}shade`} shade={HEAP.shade}>
          {[...HEAP_HOPS, ...PEEK].map((h, i) => (
            <HopCone key={i} x={h.x} y={h.y} size={HEAP_HOP} tone="amber" toTone="kraft" mix={HEAP_TONE.mix} rotate={h.r} k={k} />
          ))}
        </Shade>

        {/* the falling hops' own shadows (lifted), outside the bloom */}
        {hops.map((h) =>
          h.settled || !h.out ? null : <ElevationShadow key={h.i} silhouette={[{ d: hopSilhouette(h.x, h.y, HOP) }]} elevation="rest" lift={h.lift} />,
        )}

        {/* THE SAMPLE: nine amber hops, one bloom for the group (a hop still in the hopper is not drawn) */}
        <g style={{ filter: glow > 0.002 ? `brightness(${f2(1 + 0.14 * glow)}) ${bloomFilter(k)} drop-shadow(0 0 ${f2(18 / k)}px rgba(255,190,40,${f2(0.9 * glow)})) drop-shadow(0 0 ${f2(48 / k)}px rgba(255,160,0,${f2(0.5 * glow)}))` : bloomFilter(k) }}>
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
          <path d={bellLine(grow, mu, CURVE_W / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={CURVE_W} strokeLinejoin="round" />
        ) : null}

        {/* the slot along the ruler's top, where the glass and the post stand */}
        {slotOn ? (
          <rect x={f2(GLASS.x0 - lip)} y={f2(-slotH / 2)} width={f2(GLASS.x1 - GLASS.x0 + 2 * lip)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        ) : null}

        {/* the spread bracket: mean ± s, grown out from the mean */}
        {arms > 0.0005
          ? (() => {
              const d =
                `M${f2(XBAR - armL)} ${f2(BRACKET_Y)}H${f2(XBAR + armL)}` +
                `M${f2(XBAR - armL)} ${f2(BRACKET_Y)}V${f2(BRACKET_Y + SERIF * 0.6)}M${f2(XBAR + armL)} ${f2(BRACKET_Y)}V${f2(BRACKET_Y + SERIF * 0.6)}`;
              return (
                <g fill="none" strokeWidth={BRACKET_W} strokeLinecap="butt">
                  <path d={d} stroke={mixHex(COLOR.inkCreamLo, COLOR.inkCream, bSeat)} />
                  {bLock > 0.002 ? (
                    <g opacity={f2(bLock)} style={{ filter: bloomFilter(k) }}>
                      <path d={d} stroke={COLOR.amberTop} />
                    </g>
                  ) : null}
                </g>
              );
            })()
          : null}

        {/* labels: STD DEV beside the bracket (outside the bell), MEAN over the peak, n = 9 by the sample */}
        <ToneLabel x={sdX} y={BRACKET_Y + (LABEL_PX * METRIC.cap) / 2 / k} k={k} text="STD DEV" anchor="end" enter={(frame - SD_LABEL) / 12} cream={bSeat} amber={bLock} from="left" />
        <ToneLabel x={mu} y={-P - SPACE.CLEAR / k} k={k} text="MEAN" enter={(frame - MEAN_LABEL) / 12} cream={pSeat} amber={pAmber} />
        <NCount x={XBAR - nW / 2} y={RULER.h + (SPACE.CLEAR + LABEL_PX * METRIC.cap) / k} k={k} value={n.v} enter={(frame - HOPS[0].contact) / 8} />
      </StoutStage>
    </AbsoluteFill>
  );
};

export default SmallSampleCurveV2;
