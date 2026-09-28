import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { clamp, clamp01, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// NotConveyingAnything: an underline under everything is just the line.
//
// Sarah Paine, Russo-Japanese War clip "Almost no battle is actually
// decisive". She has just said she uses "decisive" to mean a war-winning
// battle:
//   "...because if you use it to mean 'important', you're actually not
//    conveying anything."
//
// IN-POINT 18.82 s = f0. 24 fps, f = round((t - 18.82) * 24):
//   because f0 · if you f9 · use it f18 · to f27 · mean f31 ·
//   important f37 (-f61) · you're f61 · actually f66 · not f72 ·
//   conveying f77 · anything f88 (line ends f104 = 23.16 s)
// DURATION = 104 + 16 (tail) = 120 frames = 5.00 s.
//
// THE WORLD. The whole war as a row of its battles on a time axis:
//   8 Feb 1904 (start cap, the attack on Port Arthur) -> 5 Sep 1905 (end cap,
//   Treaty of Portsmouth) = 575 days, 80 world px per month (2.628 px/day,
//   1511 px). Each battle is the Lucide `swords` glyph (70 world px, ~46
//   screen px in the wide) centred on its real date (span midpoint). Land
//   battles stand above the axis, naval ones hang below. Crowded neighbours
//   (< 1.15 glyph widths on the same side) stack one tier further out with a
//   thin stem back to the axis at their date, by a greedy pass in date order
//   (max 2 tiers, asserted box-free): Nanshan and Sandepu sit on tier 2. Names, years and months are NEVER on screen; this list is the source.
//     naval (below): Port Arthur attack 8-9 Feb 1904 · Yellow Sea 10 Aug 1904
//                    · Tsushima 27-28 May 1905
//     land (above):  Yalu 30 Apr-1 May 1904 · Nanshan 25-26 May 1904 ·
//                    Te-li-ssu 14-15 Jun 1904 · Liaoyang 24 Aug-4 Sep 1904 ·
//                    Shaho 5-17 Oct 1904 · fall of Port Arthur 2 Jan 1905
//                    (end of the siege) · Sandepu 25-29 Jan 1905 ·
//                    Mukden 20 Feb-10 Mar 1905
//   The word IMPORTANT (43 world px, ~610 screen px wide at k 1.6: the tag,
//   not the subject) sits over the war's midpoint (22 Nov 1904), 44 world px
//   above the top tier, the only text in the piece. The group (word top ->
//   naval ink) is centred on y835 at every zoom. Cream only, at 1.0 and 0.5: no orange (orange is
//   Japan / "pivotal" later in the clip).
//   Shaho (-41.5 d) and the fall of Port Arthur (+41.5 d) sit exactly
//   symmetric about the midpoint, so those two light on the same frame (f47.7):
//   the dates, not a timer, decide it.
//
// THE GESTURES, each with its word:
//   1. "because if you use it" f0-33: the camera travels the dim row at
//      k 1.6, one eased glide right (pre-rolled from f-30, already moving on
//      f0 over the Yellow Sea / Liaoyang stretch), easing to rest f33 with
//      the war's midpoint centred and the group on y835.          — f-30..33
//   2. "important" f29-37: IMPORTANT slides up 24 px while fading in,
//      landing f37 centred above the row.                            — f29-37
//   3. "important" -> "conveying" f41-84: the emphasis front. From the axis
//      under the word's centre the axis brightens to full cream and thickens
//      to 1.6x, both ends outward at equal speed in one eased spread,
//      reaching the two caps together f84. Each glyph lights 0.5 -> 1 with a
//      1 -> 1.06 -> 1 settle (10 f) the moment a front end reaches its ink,
//      so the lights run outward in date order, never in unison. — f41-84
//   4. The pull-back f39-86: one continuous zoom-out k 1.6 -> the wide
//      (axis + caps 975 px, x ~52-1028, k 0.645) on the midpoint, group held
//      on y835, paced so the frame edge runs 76-87 world px ahead of the
//      front when it lights each glyph the pull-back reveals (Te-li-ssu,
//      Nanshan, Tsushima, Yalu, Port Arthur attack). Eased at both ends, no
//      velocity jumps. Port Arthur attack lights f77, done f87.     — f39-86
//   5. "anything" f88-104: it all settles back. The emphasis thins and dims
//      into the plain 0.5 axis; every glyph, both caps and IMPORTANT go
//      1.0 -> 0.5 in one eased crossfade. The row is the row it was before
//      the word came.                                               — f88-104
//   6. Tail f104-120: ~2% creep in on the midpoint (from f90, still moving on
//      the last frame; the axis ends ~995 px wide) and the house sway.
//      Nothing new.                                                 — f90-120
//
// STYLE: PriorYearRecessionV2's page: the umber land backdrop (screen space,
// <= 5% parallax scale, never zoomed with k; its grain is baked in), cream
// ink #E9DDBF with a dark halo, IM Fell English SC, the house vignette. One
// glyph stroke (2.6 screen px, non-scaling), one axis stroke (2.2), the
// emphasis 1.6x the axis (3.52), tier stems 1.4 riding their glyph's opacity.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 120;
export const W = 1080;
export const H = 1920;

export const INK = "#E9DDBF";
const SHADE = "#140F0A";

export const schema = z.object({
  ink: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
  word: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.32,
  word: "IMPORTANT",
});

// ---------------------------------------------------------------------------
// The war on a time axis (world units == screen px at k 1, camera on the
// midpoint). Days are counted from 8 Feb 1904.
// ---------------------------------------------------------------------------
const MS_DAY = 86400000;
const day = (y: number, m: number, d: number) => (Date.UTC(y, m - 1, d) - Date.UTC(1904, 1, 8)) / MS_DAY;
const span = (a: number, b: number) => (a + b) / 2;

const WAR_DAYS = day(1905, 9, 5); // 575
const MID_DAY = WAR_DAYS / 2; // 287.5 = 22 Nov 1904, noon
const PX_PER_DAY = 80 / 30.4375; // 80 px per month

export const X_MID = W / 2;
const xOfDay = (d: number) => X_MID + (d - MID_DAY) * PX_PER_DAY;
export const HALF = MID_DAY * PX_PER_DAY; // 755.6, midpoint -> either cap

// V2 (director): the battles are the subject, so the glyphs are big (70
// world px = ~46 screen px in the wide) and crowded neighbours stack in tiers.
export const GLYPH = 70; // swords box, world px
const INK_PAD = (GLYPH * 3) / 24; // Lucide swords ink spans 3..21 of 24
const INK_HALF = GLYPH / 2 - INK_PAD;
const GLYPH_GAP = 16; // axis -> tier-1 box
const TIER_GAP = 6; // tier-1 box -> tier-2 box
const TIER_PITCH = GLYPH + TIER_GAP;
const MIN_PITCH = 1.15 * GLYPH; // same-side, same-tier centre gap
const MAX_TIERS = 2;
const CAP_HALF = 14;

type Battle = { name: string; d: number; naval: boolean };
const BATTLES: Battle[] = [
  { name: "Port Arthur attack", d: span(day(1904, 2, 8), day(1904, 2, 9)), naval: true },
  { name: "Yalu", d: span(day(1904, 4, 30), day(1904, 5, 1)), naval: false },
  { name: "Nanshan", d: span(day(1904, 5, 25), day(1904, 5, 26)), naval: false },
  { name: "Te-li-ssu", d: span(day(1904, 6, 14), day(1904, 6, 15)), naval: false },
  { name: "Yellow Sea", d: day(1904, 8, 10), naval: true },
  { name: "Liaoyang", d: span(day(1904, 8, 24), day(1904, 9, 4)), naval: false },
  { name: "Shaho", d: span(day(1904, 10, 5), day(1904, 10, 17)), naval: false },
  { name: "Port Arthur falls", d: day(1905, 1, 2), naval: false },
  { name: "Sandepu", d: span(day(1905, 1, 25), day(1905, 1, 29)), naval: false },
  { name: "Mukden", d: span(day(1905, 2, 20), day(1905, 3, 10)), naval: false },
  { name: "Tsushima", d: span(day(1905, 5, 27), day(1905, 5, 28)), naval: true },
];

// Tiers: each glyph keeps its true date x. A deterministic greedy pass in
// date order puts it on the lowest tier (1 = next to the axis) whose last
// glyph is >= 1.15 glyph widths away; tier 2 stands one box further out (land
// up, naval down) with a thin stem back to the axis at its date.
const TIER: number[] = (() => {
  const tiers = new Array<number>(BATTLES.length).fill(0);
  for (const naval of [true, false]) {
    const last: number[] = [];
    BATTLES.map((b, i) => ({ b, i }))
      .filter(({ b }) => b.naval === naval)
      .sort((a, c) => a.b.d - c.b.d)
      .forEach(({ b, i }) => {
        const x = xOfDay(b.d);
        let t = 0;
        while (t < MAX_TIERS && last[t] !== undefined && x - last[t] < MIN_PITCH) t++;
        if (t >= MAX_TIERS) throw new Error(`NotConveyingAnything: ${b.name} needs a tier ${t + 1}`);
        last[t] = x;
        tiers[i] = t + 1;
      });
  }
  return tiers;
})();

// offsets from the axis (positive = away from it, land up / naval down)
const boxNear = (tier: number) => GLYPH_GAP + (tier - 1) * TIER_PITCH;
const LAND_TOP = boxNear(Math.max(...BATTLES.map((b, i) => (b.naval ? 1 : TIER[i])))) + GLYPH - INK_PAD;
const NAVAL_BOTTOM = boxNear(Math.max(...BATTLES.map((b, i) => (b.naval ? TIER[i] : 1)))) + GLYPH - INK_PAD;

// the word: ~620 screen px at k 1.6, >= 40 world px of air over the top tier
const WORD_SIZE = 43;
const WORD_TRACK = 0.3; // em
const WORD_AIR = 44;
const WORD_CAP = 0.7 * WORD_SIZE; // IM Fell SC cap height, measured on the still
const WORD_ABOVE = LAND_TOP + WORD_AIR; // axis -> word baseline

// The group (word top -> naval ink bottom) is centred on world y 835, which
// the camera holds on screen y 835 at every zoom.
export const CY = 835;
export const AXIS_Y = CY + (WORD_ABOVE + WORD_CAP - NAVAL_BOTTOM) / 2;
const WORD_BASE = AXIS_Y - WORD_ABOVE;

// --- Lucide `swords` (lucide-static, ISC), as in WinAllTheBattles ----------
const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];

// strokes, screen px (vector-effect: non-scaling-stroke)
const SW_GLYPH = 2.6; // PYR2's secondary weight; clean now the wide glyphs are ~46 px
const SW_AXIS = 2.2;
const SW_STEM = 1.4;
const SW_EMPH = SW_AXIS * 1.6;
const HALO = 3; // extra width of the dark halo under the axis and emphasis
const HALO_GLYPH = 2; // lighter under the glyphs and stems
const HALO_OP = 0.45;
const DIM = 0.5;


// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  glide: [-30, 33] as const,
  word: [29, 37] as const,
  front: [41, 84] as const,
  pull: [39, 86] as const,
  light: 10,
  settle: [88, 104] as const,
  creep: [90, 130] as const,
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
// Front and camera eases were fitted together so the frame edge leads the
// front by 76-87 world px at each revealed glyph (see header, gesture 4).
const EASE_FRONT = Easing.bezier(0.25, 0, 0.5, 1);
const EASE_PULL = Easing.bezier(0.65, 0, 0.4, 1);

// the emphasis front: distance from the midpoint to either front end
export const front = (f: number) => HALF * EASE_FRONT(clamp01((f - T.front[0]) / (T.front[1] - T.front[0])));

// the frame on which a front end first reaches world distance `dist`
const hitFrame = (dist: number) => {
  let lo: number = T.front[0];
  let hi: number = T.front[1];
  if (front(hi) < dist) return hi;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (front(m) < dist) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

export type Placed = Battle & { x: number; y: number; tier: number; stem: [number, number] | null; hit: number };
export const PLACED: Placed[] = BATTLES.map((b, i) => {
  const x = xOfDay(b.d);
  const dir = b.naval ? 1 : -1;
  const tier = TIER[i];
  const near = boxNear(tier);
  const y = AXIS_Y + dir * (near + GLYPH / 2);
  // tier 2: a thin stem from the axis to just short of the glyph's ink
  const stem: [number, number] | null = tier > 1 ? [AXIS_Y + dir * 4, AXIS_Y + dir * (near + INK_PAD - 4)] : null;
  // lit when a front end touches the glyph's ink
  return { ...b, x, y, tier, stem, hit: hitFrame(Math.max(0, Math.abs(x - X_MID) - INK_HALF)) };
});
const CAP_HIT = hitFrame(HALF - INK_HALF);

// No two glyph boxes may intersect, and no stem may pass through a box.
(() => {
  const box = (p: Placed) => [p.x - GLYPH / 2, p.y - GLYPH / 2, p.x + GLYPH / 2, p.y + GLYPH / 2];
  for (let a = 0; a < PLACED.length; a++) {
    const A = box(PLACED[a]);
    for (let c = 0; c < PLACED.length; c++) {
      if (a === c) continue;
      const B = box(PLACED[c]);
      if (c > a && A[0] < B[2] && B[0] < A[2] && A[1] < B[3] && B[1] < A[3]) {
        throw new Error(`NotConveyingAnything: ${PLACED[a].name} and ${PLACED[c].name} collide`);
      }
      const st = PLACED[a].stem;
      if (st && PLACED[a].x > B[0] && PLACED[a].x < B[2] && Math.max(st[0], st[1]) > B[1] && Math.min(st[0], st[1]) < B[3]) {
        throw new Error(`NotConveyingAnything: ${PLACED[a].name}'s stem crosses ${PLACED[c].name}`);
      }
    }
  }
})();

// the camera. Wide: the axis + caps span 975 screen px on landing, ~995
// after the tail creep (x ~42-1038), so the whole war uses the width.
const K_CLOSE = 1.6;
export const K_WIDE = 487.5 / HALF;
const HW_CLOSE = W / 2 / K_CLOSE;
const HW_WIDE = W / 2 / K_WIDE;
const GLIDE_FROM = -454; // world px left of the midpoint at f-30
const CREEP_K = 1.025;

export const camCX = (f: number) => X_MID + GLIDE_FROM * (1 - smoothstep((f - T.glide[0]) / (T.glide[1] - T.glide[0])));
// The pull-back is eased in visible half-width (world px), so the frame edge
// can be paced against the front; k = 540 / halfwidth.
export const camK = (f: number) => {
  const hw = HW_CLOSE + (HW_WIDE - HW_CLOSE) * EASE_PULL(clamp01((f - T.pull[0]) / (T.pull[1] - T.pull[0])));
  const creep = Math.pow(CREEP_K, smoothstep((f - T.creep[0]) / (T.creep[1] - T.creep[0])));
  return (W / 2 / hw) * creep;
};

const lightOf = (f: number, hit: number) => clamp01((f - hit) / T.light);

// ---------------------------------------------------------------------------
const NotConveyingAnything: React.FC<Props> = ({ ink, backdropSrc, vignette, word }) => {
  const frame = useCurrentFrame();

  // camera: world (cx, CY) -> screen (540, 835), plus the house sway
  const k = camK(frame);
  const cx = camCX(frame);
  const drift = sway(frame);
  const tx = X_MID - cx * k + drift.dx * 0.6;
  const ty = CY - CY * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  // backdrop: screen space, <= 5% parallax scale with the pull-back, a light
  // drift with the glide
  const zoomU = clamp01((K_CLOSE - camK(Math.min(frame, T.pull[1]))) / (K_CLOSE - K_WIDE));
  const bgScale = 1.05 - 0.05 * zoomU;
  const bgX = 0.05 * (X_MID - cx) * k + drift.dx * 0.3;
  const bgY = drift.dy * 0.25;

  // the settle, "anything"
  const S = smoothstep((frame - T.settle[0]) / (T.settle[1] - T.settle[0]));

  // the word
  const wordOp = interpolate(frame, [T.word[0], T.word[1] - 1], [0, 1], clamp) * (1 - DIM * S);
  const wordDy = interpolate(frame, [T.word[0], T.word[1]], [24, 0], { easing: EASE_LAND, ...clamp }) / k;
  const track = WORD_SIZE * WORD_TRACK;

  // the emphasis: one segment on the axis, both ends at `fr` from the midpoint
  const fr = front(frame);
  const emphOp = 1 - S;
  const emphW = SW_EMPH + (SW_AXIS - SW_EMPH) * S;
  // soft ends, ~18 screen px, closing up as the fronts meet the caps
  const tip = Math.min(18 / k, fr * 0.45) * clamp01((HALF - fr) / (40 / k));
  const eL = X_MID - fr;
  const eR = X_MID + fr;
  const tipOff = fr > 0.5 ? tip / (2 * fr) : 0.5;
  const capLit = (1 - Math.pow(1 - lightOf(frame, CAP_HIT), 3)) * (1 - S);

  const ns = { vectorEffect: "non-scaling-stroke" as const };

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* backdrop, screen space, oversized 10%, light parallax only */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: `${X_MID}px ${CY}px`,
          transform: `translate(${bgX.toFixed(3)}px, ${bgY.toFixed(3)}px) scale(${bgScale.toFixed(5)})`,
        }}
      >
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }}
        />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ncaEmph" gradientUnits="userSpaceOnUse" x1={eL} y1={0} x2={eR} y2={0}>
            <stop offset={0} stopColor={ink} stopOpacity={0} />
            <stop offset={tipOff} stopColor={ink} stopOpacity={1} />
            <stop offset={1 - tipOff} stopColor={ink} stopOpacity={1} />
            <stop offset={1} stopColor={ink} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ncaEmphHalo" gradientUnits="userSpaceOnUse" x1={eL} y1={0} x2={eR} y2={0}>
            <stop offset={0} stopColor={SHADE} stopOpacity={0} />
            <stop offset={tipOff} stopColor={SHADE} stopOpacity={HALO_OP} />
            <stop offset={1 - tipOff} stopColor={SHADE} stopOpacity={HALO_OP} />
            <stop offset={1} stopColor={SHADE} stopOpacity={0} />
          </linearGradient>
        </defs>

        <g transform={camT}>
          {/* the war: the plain axis with its two caps, at 0.5 */}
          <g opacity={DIM}>
            {[
              [SHADE, HALO_OP, SW_AXIS + HALO],
              [ink, 1, SW_AXIS],
            ].map(([c, o, w]) => (
              <path
                key={`ax-${c}`}
                d={`M${X_MID - HALF},${AXIS_Y}H${X_MID + HALF}M${X_MID - HALF},${AXIS_Y - CAP_HALF}V${AXIS_Y + CAP_HALF}M${
                  X_MID + HALF
                },${AXIS_Y - CAP_HALF}V${AXIS_Y + CAP_HALF}`}
                fill="none"
                stroke={c as string}
                strokeOpacity={o as number}
                strokeWidth={w as number}
                strokeLinecap="round"
                {...ns}
              />
            ))}
          </g>

          {/* the emphasis: the axis brightening and thickening outward */}
          {fr > 0.5 && emphOp > 0.001 ? (
            <g opacity={emphOp}>
              <path d={`M${eL},${AXIS_Y}H${eR}`} fill="none" stroke="url(#ncaEmphHalo)" strokeWidth={emphW + HALO} {...ns} />
              <path d={`M${eL},${AXIS_Y}H${eR}`} fill="none" stroke="url(#ncaEmph)" strokeWidth={emphW} {...ns} />
            </g>
          ) : null}

          {/* the caps, lit when the fronts arrive */}
          {capLit > 0.001 ? (
            <g opacity={capLit}>
              {[
                [SHADE, HALO_OP, emphW + HALO],
                [ink, 1, emphW],
              ].map(([c, o, w]) => (
                <path
                  key={`cap-${c}`}
                  d={`M${X_MID - HALF},${AXIS_Y - CAP_HALF}V${AXIS_Y + CAP_HALF}M${X_MID + HALF},${AXIS_Y - CAP_HALF}V${AXIS_Y + CAP_HALF}`}
                  fill="none"
                  stroke={c as string}
                  strokeOpacity={o as number}
                  strokeWidth={w as number}
                  strokeLinecap="round"
                  {...ns}
                />
              ))}
            </g>
          ) : null}

          {/* the battles */}
          {PLACED.map((b) => {
            const u = lightOf(frame, b.hit);
            const lit = 1 - Math.pow(1 - u, 3);
            const op = DIM + (1 - DIM) * lit * (1 - S);
            const s = 1 + 0.06 * Math.sin(Math.PI * smoothstep(u));
            const g = (GLYPH / 24) * s;
            return (
              <g key={b.name} opacity={op}>
                {b.stem
                  ? [
                      [SHADE, HALO_OP, SW_STEM + HALO_GLYPH],
                      [ink, 1, SW_STEM],
                    ].map(([c, o, w]) => (
                      <path
                        key={`st-${c}`}
                        d={`M${b.x.toFixed(3)},${b.stem![0]}V${b.stem![1]}`}
                        fill="none"
                        stroke={c as string}
                        strokeOpacity={o as number}
                        strokeWidth={w as number}
                        {...ns}
                      />
                    ))
                  : null}
                <g transform={`translate(${b.x.toFixed(3)} ${b.y}) scale(${g.toFixed(5)}) translate(-12 -12)`}>
                {SWORDS.map((d) => (
                  <path
                    key={`h-${d}`}
                    d={d}
                    fill="none"
                    stroke={SHADE}
                    strokeOpacity={HALO_OP}
                    strokeWidth={SW_GLYPH + HALO_GLYPH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    {...ns}
                  />
                ))}
                {SWORDS.map((d) => (
                  <path
                    key={`i-${d}`}
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={SW_GLYPH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    {...ns}
                  />
                ))}
                </g>
              </g>
            );
          })}

          {/* the word */}
          {wordOp > 0.001 ? (
            <text
              x={X_MID + track / 2}
              y={WORD_BASE + wordDy}
              textAnchor="middle"
              fill={ink}
              opacity={wordOp}
              stroke={SHADE}
              strokeOpacity={0.5}
              strokeWidth={4 / k}
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: WORD_SIZE, letterSpacing: track }}
            >
              {word}
            </text>
          ) : null}
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(
            3,
          )}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default NotConveyingAnything;
