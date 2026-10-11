// ---------------------------------------------------------------------------
// ThousandYearCyclesShared: THE CHART shared by two cuts of the plague clip
// (ThousandYearCycles and ComesAndGoes): one long engraved timeline, years
// 1 to 2100 CE, with the trace of plague pandemics in people in orange.
//
// WHAT IS DATA: the onset years and the spans of the three pandemics.
//   First pandemic (Plague of Justinian): onset 541, recurrences to about 750.
//   Second pandemic (the Black Death): onset 1347 in Europe, recurrences to
//     the 1770s (Moscow 1771).
//   Third pandemic: began in Yunnan in 1855 (a low swell here), reached Hong
//     Kong in 1894 (the sharp rise), declared over by the WHO in 1960.
// WHAT IS SCHEMATIC: every amplitude. The three peaks are drawn EQUAL, and the
//   decaying run of recurrent waves after each onset is a drawn shape (a fast
//   main decay plus a fixed number of shrinking waves), not a mortality series.
//   Between the pandemics the trace is exactly flat on the baseline.
// Sources: WHO plague fact sheet; Stenseth et al. 2008, PLoS Medicine 5(1):e3,
//   "Plague: Past, Present, and Future"; Spyrou et al. 2022, Nature 606
//   (the source of the Black Death); third-pandemic dates per the WHO (1855
//   Yunnan, 1894 Hong Kong, 1960 end).
//
// GEOMETRY. World x is linear in years: in the WIDE framing (cam x 540, kx 1)
// year 1 sits at screen x 70 and year 2100 at x 1010. The baseline is fixed at
// screen y 1030 in every framing; a peak is 730 px tall at ky 1. Each burst has
// body: the area between trace and baseline carries a fine orange hatch.
// The camera is a CHART camera { x, kx, ky }: the time axis and the height
// zoom separately (a uniform zoom close enough to read one burst would throw
// its 730 px peak out of the frame). Everything is projected to SCREEN px here
// and drawn in a plain svg, so every stroke and numeral keeps its weight at
// every zoom. MATERIAL: an engraving, not a plot: kit InkStroke lines (dark
// casing), a slight hand on the flat stretches, hatch for every tone, the ruler
// drawn as an old map's scale bar. The camera itself still runs through the kit's damped key track
// (chartCam: the kit's k channel carries kx, its y channel carries ky).
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, type CamKey, DARK, FRAME_H, FRAME_W, INK, InkStroke, Label, clamp01, fell, runCamera, smoothstep } from "./plagueShared";

export const YEAR_A = 1;
export const YEAR_B = 2100;
export const TODAY = 2026;
export const X_A = 70;
export const X_B = 1010;
export const PX_PER_YEAR = (X_B - X_A) / (YEAR_B - YEAR_A);
/** world x of a year (== screen x in the wide framing) */
export const wx = (yr: number) => X_A + (yr - YEAR_A) * PX_PER_YEAR;
export const BASE_Y = 1030;
export const PEAK_H = 730;
/** the scale bar hangs under the baseline: its depth, and the numerals' baseline */
export const BAR_H = 12;
export const NUM_Y = BASE_Y + BAR_H + 33;
/** years the sharp rise takes */
export const RISE = 6;

export type Pandemic = { onset: number; end: number; waves: number; pre: number };
export const PANDEMICS: Pandemic[] = [
  { onset: 541, end: 750, waves: 4, pre: 541 },
  { onset: 1347, end: 1771, waves: 6, pre: 1347 },
  { onset: 1894, end: 1960, waves: 2, pre: 1855 },
];
export const ONSETS = PANDEMICS.map((p) => p.onset);
const SWELL = 0.09; // the 1855-1894 low swell, as a fraction of the peak

/** one burst, 0..1: flat `base` to the onset, a straight sharp rise, then a fast main decay plus shrinking waves */
export const burstH = (yr: number, onset: number, end: number, waves: number, base = 0) => {
  if (yr <= onset) return base;
  if (yr < onset + RISE) return base + ((1 - base) * (yr - onset)) / RISE;
  if (yr >= end) return 0;
  const t = (yr - onset - RISE) / (end - onset - RISE);
  const main = Math.exp(-t * waves * 3.2) * (1 - t);
  const rec = 0.46 * Math.pow(1 - t, 1.3) * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * waves * t) ** 2, 1.3));
  return main + (1 - main) * rec;
};

/** the trace, 0..1 of the peak height */
export const traceH = (yr: number) => {
  for (const p of PANDEMICS) {
    if (yr < p.pre || yr > p.end) continue;
    const base = p.pre < p.onset ? SWELL * smoothstep((yr - p.pre) / 30) : 0;
    return burstH(yr, p.onset, p.end, p.waves, base);
  }
  return 0;
};

// ---------------------------------------------------------------------------
// The chart camera.
// ---------------------------------------------------------------------------
export type ChartCam = { x: number; kx: number; ky: number };
/** the wide framing: the whole ruler across the frame */
export const WIDE: ChartCam = { x: FRAME_W / 2, kx: 1, ky: 1 };
/** where cut 1 ends its creep and cut 2 opens */
export const WIDE_HELD: ChartCam = { x: FRAME_W / 2, kx: 1.02, ky: 1.02 };
/** keys: x = world x on the frame centre, k = kx, y = ky; damped by the kit */
export const chartCam = (keys: CamKey[], frame: number): ChartCam => {
  const c = runCamera(keys, frame);
  return { x: c.x, kx: c.k, ky: c.y };
};
export const sx = (cam: ChartCam, yr: number) => FRAME_W / 2 + (wx(yr) - cam.x) * cam.kx;
/** the trace's zero line rides a few px above the scale bar's top rule, so the bar's century blocks show under it */
export const TRACE_LIFT = 4;
export const sy = (cam: ChartCam, h: number) => BASE_Y - TRACE_LIFT - h * PEAK_H * cam.ky;

// ---------------------------------------------------------------------------
// Paths (screen px).
// ---------------------------------------------------------------------------
const STEP = 0.5;
/** the curve h(yr) from yrA to yrB as path data, sampled every half year */
export const pathBetween = (cam: ChartCam, h: (yr: number) => number, yrA: number, yrB: number, wobble?: (yr: number) => number) => {
  if (yrB <= yrA) return "";
  const y = (yr: number) => (sy(cam, h(yr)) + (wobble ? wobble(yr) : 0)).toFixed(2);
  let d = `M${sx(cam, yrA).toFixed(2)},${y(yrA)}`;
  for (let yr = Math.floor(yrA / STEP + 1) * STEP; yr < yrB; yr += STEP) d += `L${sx(cam, yr).toFixed(2)},${y(yr)}`;
  d += `L${sx(cam, yrB).toFixed(2)},${y(yrB)}`;
  return d;
};

/**
 * The graver's hand: a slow wobble (screen px) on the FLAT stretches only, zero inside every burst and eased out
 * 15 years either side of one, so the data shape is untouched. It is a function of the YEAR (the kit's `roughen`
 * works along screen arc length, which would shimmer under a moving chart camera), same two-sine recipe.
 */
export const handWobble = (yr: number, amp = 1.6) => {
  let gap = Infinity;
  for (const p of PANDEMICS) {
    if (yr >= p.pre && yr <= p.end) return 0;
    gap = Math.min(gap, yr < p.pre ? p.pre - yr : yr - p.end);
  }
  return (amp * Math.min(1, gap / 15) * (Math.sin(yr / 27 + 1.3) + 0.6 * Math.sin(yr / 11 + 4.1))) / 1.6;
};

/**
 * Draw parameter -> year. p runs like years, except that each sharp rise is
 * given `riseEq` extra p (so a tip moving at constant p per frame spends
 * riseEq / speed frames climbing instead of popping up in one).
 */
export const drawYear = (p: number, riseEq: number, onsets: number[] = ONSETS) => {
  let shift = 0;
  for (const o of onsets) {
    const p0 = o + shift;
    if (p <= p0) break;
    if (p < p0 + RISE + riseEq) return o + ((p - p0) * RISE) / (RISE + riseEq);
    shift += riseEq;
  }
  return p - shift;
};

/** arc length along the trace in a given metric (screen px at kx, ky), year <-> s */
export const arcTable = (kx: number, ky: number) => {
  const n = Math.round((TODAY - YEAR_A) / STEP);
  const s = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) {
    const y0 = YEAR_A + (i - 1) * STEP;
    const y1 = YEAR_A + i * STEP;
    s[i] = s[i - 1] + Math.hypot(STEP * PX_PER_YEAR * kx, (traceH(y1) - traceH(y0)) * PEAK_H * ky);
  }
  const flat = PX_PER_YEAR * kx;
  return {
    total: s[n],
    sOfYear: (yr: number) => {
      const u = (yr - YEAR_A) / STEP;
      if (u >= n) return s[n] + (yr - TODAY) * flat;
      const i = Math.max(0, Math.floor(u));
      return s[i] + (s[i + 1] - s[i]) * (u - i);
    },
    /** past today the line runs on flat */
    yearOfS: (v: number) => {
      if (v >= s[n]) return TODAY + (v - s[n]) / flat;
      if (v <= 0) return YEAR_A;
      let lo = 0;
      let hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (s[mid] <= v) lo = mid;
        else hi = mid;
      }
      return YEAR_A + (lo + (v - s[lo]) / Math.max(1e-9, s[hi] - s[lo])) * STEP;
    },
  };
};

// ---------------------------------------------------------------------------
// The pieces.
// ---------------------------------------------------------------------------
export const TRACE_W = 8;
const NUMERALS = [1, 500, 1000, 1500, 2000];
const BLOCKS = Array.from({ length: 21 }, (_, i) => [Math.max(YEAR_A, i * 100), (i + 1) * 100]);

/**
 * the ruler, as the scale bar of an old map: a double cream rule 1-2100 with alternately hatched and blank century
 * blocks between the rules, ticks and five numerals under it, and an unlabelled tick at today
 */
export const Ruler: React.FC<{ cam: ChartCam }> = ({ cam }) => {
  const xa = sx(cam, YEAR_A);
  const xb = sx(cam, YEAR_B);
  const y1 = BASE_Y + BAR_H;
  const rules = `M${xa},${BASE_Y}H${xb}M${xa},${y1}H${xb}`;
  const walls = [YEAR_A, ...BLOCKS.map((b) => b[1])].map((yr) => `M${sx(cam, yr).toFixed(2)},${BASE_Y}V${y1}`).join("");
  const ticks = NUMERALS.map((yr) => `M${sx(cam, yr).toFixed(2)},${y1}V${y1 + 8}`).join("");
  const xt = sx(cam, TODAY);
  return (
    <g>
      <defs>
        <pattern id="tycBarHatch" patternUnits="userSpaceOnUse" width={5} height={5} patternTransform={`translate(${xa.toFixed(2)} ${BASE_Y}) rotate(45)`}>
          <line x1={0} y1={0} x2={0} y2={5} stroke={INK} strokeWidth={2.4} />
        </pattern>
      </defs>
      <rect x={xa} y={BASE_Y} width={xb - xa} height={BAR_H} fill={DARK} fillOpacity={0.45} />
      {BLOCKS.filter((_, i) => i % 2 === 0).map(([a, b]) => {
        const x0 = sx(cam, a);
        const x1 = sx(cam, b);
        if (x1 < -4 || x0 > FRAME_W + 4) return null;
        return <rect key={a} x={x0} y={BASE_Y} width={x1 - x0} height={BAR_H} fill="url(#tycBarHatch)" opacity={0.6} />;
      })}
      <InkStroke d={rules} width={3} />
      <path d={walls} fill="none" stroke={INK} strokeWidth={2} />
      <path d={ticks} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <InkStroke d={`M${xt.toFixed(2)},${BASE_Y - 28}V${y1}`} width={4} />
      {NUMERALS.map((yr) => (
        <text
          key={yr}
          x={sx(cam, yr)}
          y={NUM_Y}
          textAnchor="middle"
          fontFamily={fell}
          fontSize={30}
          letterSpacing="0.04em"
          fill={INK}
          stroke={DARK}
          strokeOpacity={0.5}
          strokeWidth={4}
          paintOrder="stroke"
          style={{ textRendering: "geometricPrecision" }}
        >
          {yr}
        </text>
      ))}
    </g>
  );
};

/** the orange trace from year 1 up to `toYear`: an inked line (dark casing, a slight hand on the flats), each burst hatched down to the baseline */
export const Trace: React.FC<{ cam: ChartCam; toYear: number }> = ({ cam, toYear }) => {
  const to = Math.min(TODAY, toYear);
  const d = pathBetween(cam, traceH, YEAR_A, to, handWobble);
  if (!d) return null;
  const top = sy(cam, 1) - 10;
  return (
    <g>
      {PANDEMICS.map((p) => {
        const b = Math.min(p.end, to);
        if (b <= p.pre) return null;
        const xa = sx(cam, p.pre);
        const xb = sx(cam, b);
        const area = `${pathBetween(cam, traceH, p.pre, b)}L${xb.toFixed(2)},${BASE_Y}L${xa.toFixed(2)},${BASE_Y}Z`;
        return (
          <g key={p.onset}>
            <defs>
              {/* the hatch is pinned to its own burst's onset, so it rides with the burst through every zoom */}
              <pattern id={`tycHatch${p.onset}`} patternUnits="userSpaceOnUse" width={8} height={8} patternTransform={`translate(${sx(cam, p.onset).toFixed(2)} ${BASE_Y}) rotate(45)`}>
                <line x1={0} y1={0} x2={0} y2={8} stroke={ACCENT} strokeWidth={3} />
              </pattern>
              <clipPath id={`tycArea${p.onset}`}>
                <path d={area} />
              </clipPath>
            </defs>
            <g clipPath={`url(#tycArea${p.onset})`}>
              <rect x={xa - 2} y={top} width={xb - xa + 4} height={BASE_Y - top} fill={ACCENT} fillOpacity={0.1} />
              <rect x={xa - 2} y={top} width={xb - xa + 4} height={BASE_Y - top} fill={`url(#tycHatch${p.onset})`} opacity={0.55} />
            </g>
          </g>
        );
      })}
      <InkStroke d={d} width={TRACE_W} tone={1} />
    </g>
  );
};

/** a brighter, slightly thicker stretch of the same line, centred on arc length s (tapered ends) */
export const Highlight: React.FC<{
  cam: ChartCam;
  h: (yr: number) => number;
  yearOfS: (s: number) => number;
  s: number;
  len?: number;
  maxYear?: number;
  minYear?: number;
}> = ({ cam, h, yearOfS, s, len = 120, maxYear = TODAY, minYear = YEAR_A }) => (
  <g fill="none" strokeLinejoin="round" strokeLinecap="round">
    {[
      [1, 0.45, TRACE_W + 1],
      [0.6, 0.6, TRACE_W + 2],
      [0.25, 0.9, TRACE_W + 2.5],
    ].map(([frac, o, w]) => {
      const a = Math.max(minYear, yearOfS(s - (len * frac) / 2));
      const b = Math.min(maxYear, yearOfS(s + (len * frac) / 2));
      const d = pathBetween(cam, h, a, b);
      return d ? <path key={frac} d={d} stroke="#FFE7A8" strokeOpacity={o} strokeWidth={w} /> : null;
    })}
  </g>
);

/** 1 in the frame, 0 before a centred label of this x would clip at a frame edge */
export const edgeFade = (x: number) => clamp01((x - 50) / 70) * clamp01((FRAME_W - 50 - x) / 70);

/** the three onset years (the only labels on the chart), each on a short inked leader tick above its peak */
export const PeakLabels: React.FC<{ cam: ChartCam; frame: number; appear: number[] }> = ({ cam, frame, appear }) => (
  <g>
    {PANDEMICS.map((p, i) => {
      const x = sx(cam, p.onset + RISE);
      const y = sy(cam, 1);
      const grow = smoothstep(clamp01((frame - appear[i]) / 8));
      if (grow <= 0) return null;
      return (
        <g key={p.onset} opacity={edgeFade(x)}>
          <InkStroke d={`M${x.toFixed(2)},${y - 12}V${(y - 12 - 22 * grow).toFixed(2)}`} width={3} />
          <Label x={x} y={y - 46} size={60} appear={appear[i]} frame={frame}>
            {p.onset}
          </Label>
        </g>
      );
    })}
  </g>
);

/** the full-frame screen-space svg both cuts draw into */
export const ChartSvg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
    {children}
  </svg>
);

export { clamp01, smoothstep };
