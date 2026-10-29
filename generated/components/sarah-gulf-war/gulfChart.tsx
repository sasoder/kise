// ---------------------------------------------------------------------------
// gulfChart: THE DEATH-TOLL CHART FAMILY of the clip sarah-gulf-war (cuts 6, 90, 107). Owner: the cut 6 builder
// (HardlyAnybodyDied). Read-only for everyone else; additions keep the old exports and are logged in the clip's
// animation_source/notes/SHARED_CHANGES.md. Dwarkesh 3D style (styles/dwarkesh-3d.md) carried to a FLAT 2D chart:
// clean flat bars and type on soft plates INSIDE the style's teal air (<AirStage>: graded air, shafts, motes, grain,
// vignette, a faint bloom on orange). No 3D volumes, no axes, no gridlines.
//
// UNITS: world px of a 2D camera (kits/maps/incaShared Cam {k, cx, cy}; world = screen at k 1 with the camera centred on
// (540, 960)). Draw the chart inside <WorldSvg cam> so every bar and label lives in world space and rides the camera.
// Sizes below (TYPE, GEOM) are world px; at k ~1 they are screen px of the 1080x1920 frame.
//
// API
//   FIG                       the sourced figures (CRS RL32492 etc., see SOURCES) as numbers: FIG.us.{korea, vietnam,
//                             gulf, iraq}, FIG.iraqiMil.{lo, hi}, FIG.iraqiCiv, FIG.coalitionUnder
//   COL                       the chart's colours: cream / creamLo (the other wars' bars, all type), accent / accentDeep
//                             (THE SUBJECT: America's / the coalition's dead), dead (#8A7B62, a drained bar), shadow
//                             (plates, casings), line
//   FONT                      { sc: IM Fell English SC (the title), label: Libre Caslon Text (category names, title case;
//                             rev 2: Fell SC's swash Q read "Iraq_"), num: Libre Caslon Text (every digit, lining
//                             figures), it: IM Fell English italic (a quiet sub-line) } (loaded at module scope)
//   TYPE                      the rev 1 type scale, world px: title 46, name 38, sub 28, num 48 (kept)
//   TYPE_PHONE / typeAt(k)    rev 2: the MINIMUM screen px at the settled frame (title 58, name 48, sub 40, num 62:
//                             legible at 270 px wide); typeAt(k) = those sizes in world px for a settled zoom k
//   GEOM                      cut 6's geometry (other cuts may use their own): base (baseline y), barW, gap, xs (the four
//                             bar centres), maxH (Vietnam's height), pxPer (px per death, linear, the SAME for every bar),
//                             nameDy / subDy (label baselines under the base), numGap (number baseline above a bar top)
//   barCentres(n, cx, barW, gap)   the centres of n bars laid out symmetrically about cx
//   fmt(n)                    an integer with thousands separators ("36,574")
//   countUp(value, p)         the count-up text at progress p (0..1): fmt(round(value * p)); exact value at p >= 1
//   grow(frame, f0, dur)      the bars' growth ease (0..1, a fast start that settles; bezier .3 0 .15 1)
//   enter(frame, f0, dur?)    a text entrance {o, lift}: slide up while fading in (dur 9 f, lift in TYPE-size units)
//   creep(t, endSlope=0.15)   the camera's push progress for t 0..1: starts moving, decelerates into a living creep
//                             (end slope endSlope x the mean speed, never a dead stop)
//   pushCam(f, dur, from, to, endSlope=0.15) a 2D camera that zooms log-linearly from from.k to to.k on creep(f / (dur - 1)), taking
//                             world point from.w at screen from.s to world point to.w at screen to.s (then swayCam it)
//   chartAirOf(cam, rest, frame, horizonWy?)  the medium on the 2D camera (kit airWorldOf, palette A, day): returns the
//                             AirWorld; A.v goes to <ChartStage>. horizonWy = the world row of the horizon (default 180:
//                             near the title, so the chart sits in mid-petrol air and the lower frame sinks into the
//                             dense espresso air; the light sage stays at the very top behind the title's plate)
//   <ChartStage A>            the AirStage around the chart (bloom 0.22 on orange)
//   <ChartDefs uid A>         put ONCE inside the WorldSvg before any bar or label: the soft-plate gradient, the bars'
//                             gradients and the range hatch, all keyed by uid
//   <Baseline x0 x1 y?>       rev 1's continuous floor line (kept, but rev 2 does NOT use it: a sliver on a continuous
//                             rule reads as an underline)
//   <Foot x w? base? o?>      rev 2: the short faint foot under one bar (Bar draws its own by default)
//   <Bar uid x h kind? w? base? range? rangeKind? foot? glow?>   a solid flat bar standing on the base on its own foot
//                             (foot default true), centre x, height h px (draw h >= 4 for a real sliver); glow (0..1,
//                             default 1 for accent, 0 otherwise) = a soft orange halo round the bar so a sliver reads
//                             as a bar; kind "cream" | "accent" | "dead"; range = an extra height
//                             above the solid top for an UNCERTAIN estimate (e.g. Iraqi dead 20,000 -> 35,000: solid to
//                             20,000, range to 35,000), drawn lighter: a pale fill, diagonal hatch, a dashed outline
//   <Plate uid cx cy rx ry amt?>   the soft plate: a radial halo of the air's shadow colour behind a label (TT pattern)
//   <ChartText x y size font fill? anchor? spacing? o? lift? strong?>   one line of text with the house casing (the
//                             shadow colour, paintOrder stroke); digits always in Caslon lining figures
//   <ChartTitle uid x y text o lift>   the small chart title (TYPE.title, Fell SC) on its plate; rev 2: "\n" in text stacks it
//   <CategoryLabel uid x base name sub o lift nameSize? subSize? nameDy? subDy?>   the name (FONT.label, title case)
//                             and the sub-line (years, Caslon) under a bar; defaults = TYPE / GEOM (rev 1 sizes)
//   <NumberLabel uid x y text fill? size? o? lift?>   the number above a bar on its plate (y = its baseline)
//
// THE LOOK: cream bars with a soft left-lit face (cream -> creamLo at the right edge), the subject's bar in ACCENT with
// a deeper foot, no outlines; type cream on a soft plate of the air's shadow with a firm casing (legible at 270 px
// wide); the subject's number in ACCENT. The scale is honest: linear, one px-per-death for every bar on one chart.
//
// SOURCES (COMMON.md, verified for the clip):
//   US military deaths: CRS RL32492, "American War and Military Operations Casualties: Lists and Statistics" (Jul 29
//     2020), Tables 1 / 7 / 6 / 12: Korean War 36,574 (in theater), Vietnam Conflict 58,220, Persian Gulf War
//     (1990-91) 383, Operation Iraqi Freedom (2003-10) 4,418.
//   Iraqi military deaths 20,000-35,000 (Wikipedia, Gulf War, casualty estimates; PDA 20,000-26,000); Iraqi civilians
//     killed by the bombing ~3,000 (Iraqi govt 2,300; PDA 3,664). Coalition deaths 292-379 by source: "fewer than 400".
// ---------------------------------------------------------------------------
import React from "react";
import { Easing } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { ACCENT, ACCENT_DEEP, AIR, AirStage, DEAD, airWorldOf, c01, mixHex, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

// ---- fonts and type -----------------------------------------------------------------------------------------------
const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fellIt } = loadFell("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });
export const FONT = { sc: fellSC, num: caslon, it: fellIt, label: caslon };
/** rev 1 world sizes (kept: old export) */
export const TYPE = { title: 46, name: 38, sub: 28, num: 48 };
/** rev 2 (director, Oct 29): the minimum SCREEN px at the settled frame for phone legibility (270 px wide); a cut
 *  divides by its settled zoom k for its world sizes (typeAt) */
export const TYPE_PHONE = { title: 58, name: 48, sub: 40, num: 62 };
export const typeAt = (k: number) => ({ title: TYPE_PHONE.title / k, name: TYPE_PHONE.name / k, sub: TYPE_PHONE.sub / k, num: TYPE_PHONE.num / k });

// ---- figures ------------------------------------------------------------------------------------------------------
export const FIG = {
  us: { korea: 36574, vietnam: 58220, gulf: 383, iraq: 4418 },
  iraqiMil: { lo: 20000, hi: 35000 },
  iraqiCiv: 3000,
  coalitionUnder: 400,
} as const;

// ---- colours ------------------------------------------------------------------------------------------------------
const PAL = AIR.A;
export const COL = {
  cream: PAL.cream,
  creamLo: PAL.creamLo,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  dead: DEAD,
  shadow: PAL.shadow,
  line: PAL.line,
};

// ---- geometry (cut 6) ---------------------------------------------------------------------------------------------
export const barCentres = (n: number, cx: number, barW: number, gap: number) => Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * (barW + gap));
const BAR_W = 150;
const GAP = 70;
const MAX_H = 680;
export const GEOM = {
  base: 995,
  barW: BAR_W,
  gap: GAP,
  xs: barCentres(4, 540, BAR_W, GAP),
  maxH: MAX_H,
  pxPer: MAX_H / FIG.us.vietnam,
  nameDy: 42,
  subDy: 76,
  numGap: 18,
};

// ---- timing helpers -----------------------------------------------------------------------------------------------
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const countUp = (value: number, p: number) => fmt(p >= 1 ? value : Math.round(value * c01(p)));
const GROW = Easing.bezier(0.3, 0, 0.15, 1);
export const grow = (frame: number, f0: number, dur: number) => GROW(c01((frame - f0) / dur));
const OUT3 = (u: number) => 1 - Math.pow(1 - c01(u), 3);
export const enter = (frame: number, f0: number, dur = 9) => {
  const u = c01((frame - f0) / dur);
  return { o: u * u * (3 - 2 * u), lift: 0.55 * (1 - OUT3(u)) };
};
export const creep = (t: number, endSlope = 0.15) => {
  const u = c01(t);
  return (1 - endSlope) * (1 - (1 - u) * (1 - u)) + endSlope * u;
};
type CamEnd = { k: number; w: [number, number]; s: [number, number] };
export const pushCam = (f: number, dur: number, from: CamEnd, to: CamEnd, endSlope = 0.15): Cam => {
  const p = creep(f / (dur - 1), endSlope);
  const k = Math.exp(Math.log(from.k) + (Math.log(to.k) - Math.log(from.k)) * p);
  const wx = from.w[0] + (to.w[0] - from.w[0]) * p;
  const wy = from.w[1] + (to.w[1] - from.w[1]) * p;
  const sx = from.s[0] + (to.s[0] - from.s[0]) * p;
  const sy = from.s[1] + (to.s[1] - from.s[1]) * p;
  return { k, cx: wx - (sx - 540) / k, cy: wy - (sy - 960) / k };
};

// ---- the air ------------------------------------------------------------------------------------------------------
/** a flat chart in the air: the eye at the horizon row, the camera 1800 in front at k 1, half of a zoom a dolly
 *  (motes and shafts parallax with the push) */
export const chartAirOf = (cam: Cam, rest: Cam, frame: number, horizonWy = 180): AirWorld => {
  const depth: DepthOpts = { eyeY: horizonWy, dRef: 1800, kRef: 1, dolly: 0.5 };
  return airWorldOf({ cam, rest, depth, frame });
};
export const ChartStage: React.FC<{ A: AirWorld; children?: React.ReactNode }> = ({ A, children }) => (
  <AirStage v={A.v} bloom={0.22}>
    {children}
  </AirStage>
);

// ---- defs ---------------------------------------------------------------------------------------------------------
export const ChartDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <radialGradient id={`${uid}-plate`}>
      <stop offset="0" stopColor={COL.shadow} stopOpacity={0.6} />
      <stop offset="0.55" stopColor={COL.shadow} stopOpacity={0.42} />
      <stop offset="1" stopColor={COL.shadow} stopOpacity={0} />
    </radialGradient>
    {/* the bars' faces: light from the upper left, a soft darkening to the right edge and to the foot */}
    <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={COL.cream} />
      <stop offset="0.62" stopColor={mixHex(COL.cream, COL.creamLo, 0.35)} />
      <stop offset="1" stopColor={COL.creamLo} />
    </linearGradient>
    <linearGradient id={`${uid}-accent`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={mixHex(COL.accent, "#FFE7A8", 0.18)} />
      <stop offset="0.62" stopColor={COL.accent} />
      <stop offset="1" stopColor={mixHex(COL.accent, COL.accentDeep, 0.7)} />
    </linearGradient>
    <linearGradient id={`${uid}-dead`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={mixHex(COL.dead, COL.cream, 0.15)} />
      <stop offset="1" stopColor={mixHex(COL.dead, COL.shadow, 0.2)} />
    </linearGradient>
    <linearGradient id={`${uid}-foot`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={COL.shadow} stopOpacity={0} />
      <stop offset="1" stopColor={COL.shadow} stopOpacity={0.16} />
    </linearGradient>
    <radialGradient id={`${uid}-glow`}>
      <stop offset="0" stopColor={COL.accent} stopOpacity={0.62} />
      <stop offset="0.4" stopColor={COL.accent} stopOpacity={0.3} />
      <stop offset="1" stopColor={COL.accent} stopOpacity={0} />
    </radialGradient>
    {(["cream", "accent", "dead"] as const).map((kd) => (
      <pattern key={kd} id={`${uid}-hatch-${kd}`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect x={0} y={0} width={5} height={14} fill={kd === "accent" ? COL.accent : kd === "dead" ? COL.dead : COL.cream} opacity={0.52} />
      </pattern>
    ))}
  </defs>
);

// ---- pieces -------------------------------------------------------------------------------------------------------
export const Baseline: React.FC<{ x0: number; x1: number; y?: number; o?: number }> = ({ x0, x1, y = GEOM.base, o = 1 }) => (
  <rect x={x0} y={y} width={x1 - x0} height={2.6} fill={COL.creamLo} opacity={0.62 * o} />
);

/** rev 2: each bar stands on its own short foot (no continuous rule across the chart, so a sliver never reads as an
 *  underline): a faint creamLo segment a little wider than the bar, under it */
export const Foot: React.FC<{ x: number; w?: number; base?: number; o?: number }> = ({ x, w = GEOM.barW, base = GEOM.base, o = 1 }) => (
  <rect x={x - w / 2 - 6} y={base} width={w + 12} height={2.4} fill={COL.creamLo} opacity={0.42 * o} />
);

export type BarKind = "cream" | "accent" | "dead";
export const Bar: React.FC<{ uid: string; x: number; h: number; kind?: BarKind; w?: number; base?: number; range?: number; rangeKind?: BarKind; foot?: boolean; glow?: number }> = ({
  uid,
  x,
  h,
  kind = "cream",
  w = GEOM.barW,
  base = GEOM.base,
  range = 0,
  rangeKind,
  foot = true,
  glow,
}) => {
  const ft = foot ? <Foot x={x} w={w} base={base} /> : null;
  if (h <= 0 && range <= 0) return ft;
  const x0 = x - w / 2;
  const gl = glow ?? (kind === "accent" ? 1 : 0);
  const rk = rangeKind ?? kind;
  const rc = rk === "accent" ? COL.accent : rk === "dead" ? COL.dead : COL.cream;
  return (
    <g>
      {ft}
      {gl > 0 && h > 0 ? <ellipse cx={x} cy={base - h / 2} rx={w * 0.85} ry={Math.max(38, h * 0.75 + 30)} fill={`url(#${uid}-glow)`} opacity={c01(gl)} /> : null}
      {range > 0 ? (
        <g>
          <rect x={x0} y={base - h - range} width={w} height={range} fill={rc} opacity={0.18} />
          <rect x={x0} y={base - h - range} width={w} height={range} fill={`url(#${uid}-hatch-${rk})`} />
          <rect x={x0 + 1.2} y={base - h - range + 1.2} width={w - 2.4} height={Math.max(0, range - 1.2)} fill="none" stroke={rc} strokeWidth={2.4} strokeDasharray="11 8" opacity={0.85} />
        </g>
      ) : null}
      {h > 0 ? (
        <g>
          <rect x={x0} y={base - h} width={w} height={h} fill={`url(#${uid}-${kind})`} />
          {h > 40 ? <rect x={x0} y={base - Math.min(h, 160)} width={w} height={Math.min(h, 160)} fill={`url(#${uid}-foot)`} /> : null}
        </g>
      ) : null}
    </g>
  );
};

export const Plate: React.FC<{ uid: string; cx: number; cy: number; rx: number; ry: number; amt?: number }> = ({ uid, cx, cy, rx, ry, amt = 1 }) =>
  amt > 0 ? <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-plate)`} opacity={c01(amt)} /> : null;

export const ChartText: React.FC<{
  x: number;
  y: number;
  size: number;
  font: string;
  text: string;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  spacing?: number;
  strong?: boolean;
}> = ({ x, y, size, font, text, fill = COL.cream, anchor = "middle", spacing = 0, strong = true }) => (
  <text
    x={x + (anchor === "middle" ? spacing * size * 0.5 : 0)}
    y={y}
    textAnchor={anchor}
    fill={fill}
    stroke={COL.shadow}
    strokeOpacity={strong ? 0.9 : 0.78}
    strokeWidth={size * (strong ? 0.2 : 0.15)}
    strokeLinejoin="round"
    paintOrder="stroke"
    style={{ fontFamily: font, fontSize: size, letterSpacing: spacing * size, fontVariantNumeric: "lining-nums tabular-nums" }}
  >
    {/* digits always in Caslon's lining figures (Fell's old-style 1 reads as a letter) */}
    {text.split(/([\d,–-]+)/).map((run, k) =>
      /\d/.test(run) && font !== caslon ? (
        <tspan key={k} style={{ fontFamily: caslon, letterSpacing: 0.02 * size }} fontSize={size * 0.86}>
          {run}
        </tspan>
      ) : (
        run
      ),
    )}
  </text>
);

/** rev 2: text may hold "\n" for a stacked title (lines 1.12 x size apart; y = the FIRST line's baseline) */
export const ChartTitle: React.FC<{ uid: string; x: number; y: number; text: string; o: number; lift: number; size?: number }> = ({ uid, x, y, text, o, lift, size = TYPE.title }) => {
  if (o <= 0) return null;
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const lead = size * 1.12;
  const span = (lines.length - 1) * lead;
  return (
    <g opacity={o} transform={`translate(0 ${(lift * size).toFixed(3)})`}>
      <Plate uid={uid} cx={x} cy={y - size * 0.32 + span / 2} rx={size * 0.36 * longest * 0.62 + 60} ry={size * 0.95 + span * 0.6} amt={0.9} />
      {lines.map((l, i) => (
        <ChartText key={i} x={x} y={y + i * lead} size={size} font={FONT.sc} text={l} spacing={0.06} />
      ))}
    </g>
  );
};

/** rev 2: the name in FONT.label (Caslon, title case: no swash Q), sizes and baselines as props (defaults = rev 1) */
export const CategoryLabel: React.FC<{ uid: string; x: number; base?: number; name: string; sub?: string; o: number; lift: number; nameSize?: number; subSize?: number; nameDy?: number; subDy?: number }> = ({
  uid,
  x,
  base = GEOM.base,
  name,
  sub,
  o,
  lift,
  nameSize = TYPE.name,
  subSize = TYPE.sub,
  nameDy = GEOM.nameDy,
  subDy = GEOM.subDy,
}) => {
  if (o <= 0) return null;
  const bottom = sub ? subDy : nameDy;
  const half = Math.max(nameSize * 0.27 * name.length, sub ? subSize * 0.3 * sub.length : 0);
  return (
    <g opacity={o} transform={`translate(0 ${(lift * nameSize).toFixed(3)})`}>
      <Plate uid={uid} cx={x} cy={base + bottom * 0.56} rx={half + 44} ry={bottom * 0.62 + 18} amt={0.85} />
      <ChartText x={x} y={base + nameDy} size={nameSize} font={FONT.label} text={name} />
      {sub ? <ChartText x={x} y={base + subDy} size={subSize} font={FONT.num} text={sub} fill={COL.creamLo} strong={false} /> : null}
    </g>
  );
};

export const NumberLabel: React.FC<{ uid: string; x: number; y: number; text: string; fill?: string; size?: number; o?: number; lift?: number; plate?: number }> = ({
  uid,
  x,
  y,
  text,
  fill = COL.cream,
  size = TYPE.num,
  o = 1,
  lift = 0,
  plate = 0.75,
}) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0 ${(lift * size).toFixed(3)})`}>
      <Plate uid={uid} cx={x} cy={y - size * 0.36} rx={size * 0.34 * text.length + 34} ry={size * 0.78} amt={plate} />
      <ChartText x={x} y={y} size={size} font={FONT.num} text={text} fill={fill} />
    </g>
  );
