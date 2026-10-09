import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BEAD_RATIO,
  Bead,
  EDGE_SAFE,
  FONT_SANS,
  FRAME_H,
  FRAME_W,
  HAIR,
  INK_HI,
  INK_LO,
  InkPath,
  Label,
  PHOTO_BORDER,
  RED,
  RISE_PX,
  RedGroup,
  Seal,
  VStage,
  V_INK,
  VintagePhoto,
  WetLine,
  clamp01,
  cumLen,
  easeOutCubic,
  enterFrom,
  enterU,
  labelPx,
  labelWidth,
  pointAtLen,
  redW,
  smoothstep,
  useVStageView,
  vCam,
  worldBlur,
} from "./chinatalkVintage";
import type { Cam, PhotoBox, Pt, StageView } from "./chinatalkVintage";

/**
 * SovietEconomicDecline — cut A of Logan Wright, "Brezhnev chose decay"
 * (ChinaTalk, slightly vintage). Delivered as 1_SovietEconomicDecline.mov.
 *
 * CHECK LINE: by its last decade the Soviet economy was growing about a third
 * as fast as in the 1950s (5.2 % a year down to 1.8 %), and a shop queue is
 * what that looked like from the street.
 *
 * SPOKEN: "…three years ago to answer this question of how did the Soviets
 * internalize their economic decline?"
 * IN = edit frame 26 (1.083 s). Duration: the slot is edit frames 26-130 =
 * 104 f, plus a 12 f living tail (handle for the editor) = 116 frames. 24 fps,
 * 1080x1920, opaque. Local word frames: the Soviets 51-59 · internalize 59-75
 * · their 75-79 · economic 79-88 · decline 88-97 · slot ends 104.
 *
 * MOTION (local frames): ONE camera move, f0 -> f115, to the right and pulling
 * back (k 1.45 -> 1) on one time curve, cubic-bezier(0.87, 0, 0.17, 1) between
 * keys at f-7 and f119 (outside the clip, so both ends still creep). It starts
 * inside the full-bleed photograph of the shop queue and creeps right along it
 * (1 -> 20 px/frame, f0-40), bursts across on "the Soviets internalize" (peak
 * 128 px/frame at f58; horizontal-only motion blur, sigma = 0.22 x the px per
 * frame, none while it creeps) and creeps to rest on the chart. The print's
 * right edge comes into frame at f59-60 with the red line already out from
 * BEHIND it: a wet bead tip writes it at one steady pace (33.4 world px/frame)
 * through the six real points (5.2 % f61, 4.8 % f67, 4.9 % f71, 3.0 % f82,
 * 1.9 % f89, 1.8 % f93 on "decline"), a seal left at each as the bead clears
 * it, the wash soaking down behind it, the zero baseline written beneath it.
 * f93 -> f115: settled and living (the wash finishes soaking, the wet stretch
 * dries, the bead rests on the last point, the camera still creeps).
 *
 * RED = Soviet growth (the line). Nothing else is red.
 *
 * THE CHART (real data). Soviet GNP, average annual growth, CIA estimates at
 * 1982 factor cost: CIA (1990), "Measures of Soviet Gross National Product in
 * 1982 Prices", as tabulated in Mark Harrison, "Economic growth and slowdown",
 * in Bacon & Sandle (eds), Brezhnev Reconsidered (2002), Table 1.
 *
 *   period     1950-60  1960-65  1965-70  1970-75  1975-80  1980-85
 *   % a year     5.2      4.8      4.9      3.0      1.9      1.8
 *
 * Each period is plotted at its midpoint (1955, 1962.5, 1967.5, 1972.5,
 * 1977.5, 1982.5) on a LINEAR time axis and a linear value axis whose zero is
 * the drawn baseline; straight segments between the points (period averages,
 * not smoothed). The level lead-in from the print's edge to the first point
 * lies inside 1950-60, where the average was 5.2 %.
 *
 * THE PHOTOGRAPH. public/brezhnev/irkutsk_queue_1981.jpg: shoppers queueing at
 * a street stall of the department store («Универмаг»), Irkutsk, summer 1981.
 * Wikimedia Commons, "Irkutsk-1981-0045.JPG", by CTHOE, CC BY-SA 3.0.
 *
 * LAYERING. The whole world (chart, then the print over it) lives in VStage's
 * HTML world layer as ONE plane: the chart is an <svg> drawn UNDER the
 * VintagePhoto, so the print (and its contact shadow) really covers the
 * line's origin, and one horizontal Gaussian on that plane blurs photograph
 * and drawing together during the burst. World px = screen px at the final
 * framing (camera 540, 960, k = 1).
 */

export const FPS = 24;
export const SLOT = 104;
export const TAIL = 12;
export const DURATION = SLOT + TAIL;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE CHART
// ---------------------------------------------------------------------------
/** Soviet GNP, average annual growth, % a year (CIA 1990 via Harrison 2002, Table 1). */
export const DATA = [
  { from: 1950, to: 1960, pct: 5.2 },
  { from: 1960, to: 1965, pct: 4.8 },
  { from: 1965, to: 1970, pct: 4.9 },
  { from: 1970, to: 1975, pct: 3.0 },
  { from: 1975, to: 1980, pct: 1.9 },
  { from: 1980, to: 1985, pct: 1.8 },
] as const;
/** the zero baseline, world y */
export const BASE_Y = 1370;
/** world px per percentage point (linear, from the baseline) */
export const PX_PER_PCT = 187.5;
/** world x of the first and last period midpoints (linear time axis between them) */
const X_FIRST = 200;
const X_LAST = 900;
const MID = (d: { from: number; to: number }) => (d.from + d.to) / 2;
export const PX_PER_YEAR = (X_LAST - X_FIRST) / (MID(DATA[DATA.length - 1]) - MID(DATA[0]));
export const xOfYear = (year: number) => X_FIRST + (year - MID(DATA[0])) * PX_PER_YEAR;
export const yOfPct = (pct: number) => BASE_Y - pct * PX_PER_PCT;
/** the six plotted points, world px */
export const POINTS: Pt[] = DATA.map((d) => ({ x: xOfYear(MID(d)), y: yOfPct(d.pct) }));

// ---------------------------------------------------------------------------
// THE PRINT
// ---------------------------------------------------------------------------
const PHOTO_SRC = "brezhnev/irkutsk_queue_1981.jpg";
const PHOTO_NATURAL = { w: 3128, h: 2088 };
const PRINT_H = 1500;
const PRINT_W = (PRINT_H * PHOTO_NATURAL.w) / PHOTO_NATURAL.h;
/** the picture window's right edge at the final framing (a ~100 px sliver stays in frame) */
const PRINT_RIGHT = 100;
/** the picture window (the whole photograph, uncropped), world px */
export const PRINT: PhotoBox = { x: PRINT_RIGHT - PRINT_W, y: FRAME_H / 2 - PRINT_H / 2, w: PRINT_W, h: PRINT_H };
/** the print's outer right edge (picture + border): what occludes the line's origin */
export const PRINT_EDGE = PRINT_RIGHT + PHOTO_BORDER;

// ---------------------------------------------------------------------------
// THE CAMERA: one authored move (a known curve, not the damped follower).
// ---------------------------------------------------------------------------
/** opening: inside the picture, on the left-middle of the queue (fraction of the photo's width) */
const START_U = 0.3;
const START_K = 1.45;
export const CAM_START: Cam = vCam(PRINT.x + START_U * PRINT.w, FRAME_H / 2, START_K);
export const CAM_END: Cam = vCam(FRAME_W / 2, FRAME_H / 2, 1);
/** the time curve's keys lie OUTSIDE the clip, so the first and last frames are still creeping */
const KEY_A = -7;
const KEY_B = 119;
const PAN_EASE = Easing.bezier(0.87, 0, 0.17, 1);
/** progress 0..1 of the one move at (fractional) frame S */
export const panProgress = (S: number) => PAN_EASE(clamp01((S - KEY_A) / (KEY_B - KEY_A)));
export const camAt = (S: number): Cam => {
  const p = panProgress(S);
  return {
    x: CAM_START.x + (CAM_END.x - CAM_START.x) * p,
    y: CAM_START.y + (CAM_END.y - CAM_START.y) * p,
    k: Math.exp(Math.log(CAM_START.k) + (Math.log(CAM_END.k) - Math.log(CAM_START.k)) * p),
  };
};
/** screen px the world travels during frame S (at the frame centre) */
export const panSpeed = (S: number) => Math.abs(camAt(S + 0.5).x - camAt(S - 0.5).x) * camAt(S).k;
/** horizontal motion blur: sigma = MOTION_BLUR x speed on the burst, none while it creeps */
const MOTION_BLUR = 0.22;
const BLUR_V0 = 5; // px / frame: below this the picture is left sharp
const BLUR_V1 = 16; // px / frame: from here the full sigma
const BLUR_MIN = 0.3;
/** the blur's sigma at frame S, SCREEN px */
export const blurSigma = (S: number) => {
  const v = panSpeed(S);
  const s = MOTION_BLUR * v * smoothstep((v - BLUR_V0) / (BLUR_V1 - BLUR_V0));
  return s >= BLUR_MIN ? s : 0;
};

// ---------------------------------------------------------------------------
// THE LINE: written at one steady pace from behind the print to the last point.
// ---------------------------------------------------------------------------
/** the line's origin, hidden behind the print */
const LINE_X0 = PRINT_EDGE - 150;
export const LINE: Pt[] = [{ x: LINE_X0, y: POINTS[0].y }, ...POINTS];
const LINE_CUM = cumLen(LINE);
export const LINE_TOTAL = LINE_CUM[LINE_CUM.length - 1];
/** arc length at which the tip's centre crosses the print's outer edge */
const ARC_EDGE = PRINT_EDGE - LINE_X0;
/** arc length of point i */
export const arcOfPoint = (i: number) => LINE_CUM[i + 1];
/** the tip's centre crosses the print's edge on this frame, and lands on the last point on that one */
export const TIP_EDGE_F = 58;
export const TIP_END_F = 93;
/** world px of line per frame */
export const TIP_SPEED = (LINE_TOTAL - ARC_EDGE) / (TIP_END_F - TIP_EDGE_F);
/** drawn arc length at frame S */
export const tipLen = (S: number) => Math.max(0, Math.min(LINE_TOTAL, ARC_EDGE + TIP_SPEED * (S - TIP_EDGE_F)));
/** the frame on which arc length s was written */
export const drawnAt = (s: number) => TIP_EDGE_F + (s - ARC_EDGE) / TIP_SPEED;
/** the frame on which the tip's centre is on point i */
export const pointFrame = (i: number) => drawnAt(arcOfPoint(i));
export const tipAt = (S: number): Pt => pointAtLen(LINE, LINE_CUM, tipLen(S));

// ---------------------------------------------------------------------------
// THE AXIS: the zero baseline, written from behind the print: its head runs
// under the red tip across the 1960s, then on ahead while the line falls.
// ---------------------------------------------------------------------------
const AXIS_X0 = PRINT_EDGE - 60;
const AXIS_X1 = X_LAST + 75;
const AXIS_EDGE_F = TIP_EDGE_F;
const AXIS_END_F = 86;
const AXIS_SPEED = (AXIS_X1 - PRINT_EDGE) / (AXIS_END_F - AXIS_EDGE_F);
const axisHead = (S: number) => Math.max(AXIS_X0, Math.min(AXIS_X1, PRINT_EDGE + AXIS_SPEED * (S - AXIS_EDGE_F)));
/** the frame on which the baseline's head passes world x */
const axisFrame = (x: number) => AXIS_EDGE_F + (x - PRINT_EDGE) / AXIS_SPEED;

// ---------------------------------------------------------------------------
// LABELS (they only identify)
// ---------------------------------------------------------------------------
/** two flush columns: everything on the left starts at LEFT_X, everything on the right ends at RIGHT_X */
const LEFT_X = POINTS[0].x - 14;
const RIGHT_X = POINTS[5].x + 36;
const FIRST_VALUE_Y = POINTS[0].y - 72;
const TITLE_Y = FIRST_VALUE_Y - 80;
const LAST_VALUE_Y = POINTS[5].y - 88;
const YEAR_Y = BASE_Y + 55;
/** approximate width of a year label, world px (only to time its entrance off the baseline's head) */
const YEAR_W = 124;

// ---------------------------------------------------------------------------
// YEAR LABELS. The kit's Label upper-cases its text ("1950S"); a decade reads
// "1950s". This is the kit's WORD label copied without the upper-casing: the
// same face (Source Sans 3 SemiBold), size (labelPx "word"), tracking, ink and
// rung, the same entrance (it slides up RISE_PX while it fades and un-blurs
// over 12 f) and the same fade within EDGE_SAFE of a frame edge.
// ---------------------------------------------------------------------------
const WORD_TRACK = 0.12;
const WORD_CAP = 0.669;
/** advance width, world px: lining figures 0.51 em, a lower-case s 0.43 em, tracked */
const yearWidth = (text: string, fs: number) => {
  let em = 0;
  for (const ch of text) em += (ch === "s" ? 0.43 : 0.51) + WORD_TRACK;
  return (em - WORD_TRACK) * fs;
};
/** 1 when the world box sits >= EDGE_SAFE screen px inside every frame edge, 0 when it touches one (the kit's edgeFactor) */
const edgeFade = (view: StageView | null, x0: number, y0: number, x1: number, y1: number) => {
  if (!view) return 1;
  const { cam, dx, dy } = view;
  const sx0 = FRAME_W / 2 + (x0 - cam.x) * cam.k + dx;
  const sx1 = FRAME_W / 2 + (x1 - cam.x) * cam.k + dx;
  const sy0 = FRAME_H / 2 + (y0 - cam.y) * cam.k + dy;
  const sy1 = FRAME_H / 2 + (y1 - cam.y) * cam.k + dy;
  return smoothstep(Math.min(sx0, FRAME_W - sx1, sy0, FRAME_H - sy1) / EDGE_SAFE);
};
/** The chart's title: the kit's WORD label (caps, tracked) at the HIGH rung, simply there on the paper where the
 *  camera arrives. The kit fades a WHOLE label by its distance from the frame edge; this title is long enough to
 *  stand half in frame while the camera is still arriving (it would then come on all at once), so the same
 *  EDGE_SAFE fade is applied ACROSS it: a soft frame edge the title slides in under, with everything else. */
const TitleLabel: React.FC<{ text: string; x: number; y: number; k: number }> = ({ text, x, y, k }) => {
  const view = useVStageView();
  const fs = labelPx("word", k);
  const w = labelWidth(text, "word", k);
  // world x of the frame's right edge (the only edge this label ever meets)
  const edge = view ? view.cam.x + (FRAME_W / 2 - view.dx) / view.cam.k : x + w + 4 * fs;
  if (edge <= x) return null;
  const fade = EDGE_SAFE / k;
  const box = { x: x - fs, y: y - fs, width: w + 2 * fs, height: 2 * fs };
  return (
    <g>
      <defs>
        <linearGradient id="sed-title-fade" gradientUnits="userSpaceOnUse" x1={(edge - fade).toFixed(3)} y1={0} x2={edge.toFixed(3)} y2={0}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <stop key={t} offset={t} stopColor="#FFFFFF" stopOpacity={(1 - smoothstep(t)).toFixed(4)} />
          ))}
        </linearGradient>
        <mask id="sed-title-mask" maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="url(#sed-title-fade)" />
        </mask>
      </defs>
      <g mask="url(#sed-title-mask)" opacity={INK_HI}>
        <text
          x={x.toFixed(3)}
          y={(y + (WORD_CAP / 2) * fs).toFixed(3)}
          fontFamily={FONT_SANS}
          fontWeight={600}
          fontSize={fs.toFixed(3)}
          letterSpacing={`${WORD_TRACK}em`}
          textAnchor="start"
          fill={V_INK}
        >
          {text.toUpperCase()}
        </text>
      </g>
    </g>
  );
};
/** A year ("1950s"): (x, y) anchors the figures' box as the kit's Label does (y = their vertical centre). */
const YearLabel: React.FC<{ text: string; x: number; y: number; k: number; anchor: "start" | "end"; appear: number }> = ({
  text,
  x,
  y,
  k,
  anchor,
  appear,
}) => {
  const view = useVStageView();
  const a = clamp01(appear);
  const fs = labelPx("word", k);
  const w = yearWidth(text, fs);
  const x0 = anchor === "end" ? x - w : x;
  const op = INK_HI * smoothstep(a) * edgeFade(view, x0, y - 0.45 * fs, x0 + w, y + 0.5 * fs);
  if (op <= 0.002) return null;
  const lift = (1 - easeOutCubic(a)) * (RISE_PX / k);
  const blur = 6 * (1 - easeOutCubic(a));
  // letter-spacing also trails the last glyph: an end-anchored label is pushed back by one tracking step
  const comp = anchor === "end" ? WORD_TRACK : 0;
  return (
    <g style={{ filter: worldBlur(blur, k) }} opacity={op.toFixed(4)}>
      <text
        x={(x + comp * fs).toFixed(3)}
        y={(y + lift + (WORD_CAP / 2) * fs).toFixed(3)}
        fontFamily={FONT_SANS}
        fontWeight={600}
        fontSize={fs.toFixed(3)}
        letterSpacing={`${WORD_TRACK}em`}
        textAnchor={anchor}
        fill={V_INK}
      >
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WASH: the ChinaTalk growth wash, never a flat pink fog. Two parts, both
// clipped to the area under the drawn line: a GLOW hugging the line (the line
// itself, stroked wide and blurred: strongest at the line, gone ~200 px from
// it) and a faint TAIL that fades toward the baseline. It soaks DOWN behind
// the tip: a feathered front leaves the line when the tip passes a column and
// travels down, slowing as ink does. Both parts stop short of the last point, so
// the wash thins out toward the resting bead instead of ending in a wall.
// ---------------------------------------------------------------------------
/** wash opacity at the line */
const GLOW_ALPHA = 0.13;
const GLOW_WIDTH = 150;
const GLOW_SIGMA = 62;
const GLOW_END_GAP = 110;
/** the tail's opacity through its middle */
const TAIL_ALPHA = 0.035;
const TAIL_SIGMA = 40;
const TAIL_END_GAP = 90;
/** the tail fades to nothing over this height above the baseline */
const TAIL_FADE = 620;
/** the soak front, world px below the line `age` frames after the tip passed (it slows, as ink does), and its feather */
const soakDepth = (age: number) => (age > 0 ? 48 * Math.pow(age, 0.75) : 0);
const SOAK_FEATHER = 60;
/** the soak mask starts this far above the line, so its feather never thins the wash at the line */
const SOAK_HEAD = 2.2 * SOAK_FEATHER;
/** the centre of a stroke GLOW_WIDTH wide keeps this much after the blur */
const GLOW_CORE = 0.773;
const WASH_REGION = { x: LINE_X0 - 300, y: 0, w: X_LAST - LINE_X0 + 700, h: BASE_Y + 300 };
const subLine = (s1: number) => {
  const pts: Pt[] = [LINE[0]];
  for (let i = 1; i < LINE.length && LINE_CUM[i] < s1; i++) pts.push(LINE[i]);
  pts.push(pointAtLen(LINE, LINE_CUM, s1));
  return pts;
};
const dOf = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
const areaUnder = (pts: Pt[]) => `${dOf(pts)}L${pts[pts.length - 1].x.toFixed(2)} ${BASE_Y}L${pts[0].x.toFixed(2)} ${BASE_Y}Z`;

const GrowthWash: React.FC<{ S: number }> = ({ S }) => {
  const L = tipLen(S);
  if (L <= 1) return null;
  const region = { x: WASH_REGION.x, y: WASH_REGION.y, width: WASH_REGION.w, height: WASH_REGION.h };
  // the soak front: every vertex of the drawn line, and every 12 px between
  const arcs: number[] = [];
  for (let i = 0; i < LINE_CUM.length - 1 && LINE_CUM[i] < L; i++) {
    const a = LINE_CUM[i];
    const b = Math.min(L, LINE_CUM[i + 1]);
    const n = Math.max(1, Math.ceil((b - a) / 12));
    for (let j = 0; j < n; j++) arcs.push(a + ((b - a) * j) / n);
  }
  arcs.push(L);
  const cols = arcs.map((s) => {
    const p = pointAtLen(LINE, LINE_CUM, s);
    return { x: p.x, y: p.y, front: Math.min(BASE_Y + SOAK_HEAD - p.y, soakDepth(S - drawnAt(s))) };
  });
  let soak = cols.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(2)} ${(c.y - SOAK_HEAD).toFixed(2)}`).join("");
  for (let i = cols.length - 1; i >= 0; i--) soak += `L${cols[i].x.toFixed(2)} ${(cols[i].y + cols[i].front).toFixed(2)}`;
  const glowLen = Math.min(L, LINE_TOTAL - GLOW_END_GAP);
  const tailLen = Math.min(L, LINE_TOTAL - TAIL_END_GAP);
  return (
    <g>
      <defs>
        <filter id="sed-glow-blur" filterUnits="userSpaceOnUse" {...region} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={GLOW_SIGMA} />
        </filter>
        <filter id="sed-tail-blur" filterUnits="userSpaceOnUse" {...region} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={TAIL_SIGMA} />
        </filter>
        <filter id="sed-soak-blur" filterUnits="userSpaceOnUse" {...region} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={SOAK_FEATHER} />
        </filter>
        <linearGradient id="sed-tail-fade" gradientUnits="userSpaceOnUse" x1={0} y1={BASE_Y - TAIL_FADE} x2={0} y2={BASE_Y}>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
            <stop key={t} offset={t} stopColor="#FFFFFF" stopOpacity={(1 - Math.pow(t, 1.6)).toFixed(4)} />
          ))}
        </linearGradient>
        <mask id="sed-tail-mask" maskUnits="userSpaceOnUse" {...region}>
          <rect {...region} fill="url(#sed-tail-fade)" />
        </mask>
        <mask id="sed-soak-mask" maskUnits="userSpaceOnUse" {...region}>
          <path d={`${soak}Z`} fill="#FFFFFF" filter="url(#sed-soak-blur)" />
        </mask>
        <clipPath id="sed-under-line">
          <path d={areaUnder(subLine(L))} />
        </clipPath>
      </defs>
      <g mask="url(#sed-soak-mask)">
        <g clipPath="url(#sed-under-line)">
          {glowLen > 1 ? (
            <g opacity={(GLOW_ALPHA / GLOW_CORE).toFixed(4)}>
              <path d={dOf(subLine(glowLen))} fill="none" stroke={RED} strokeWidth={GLOW_WIDTH} strokeLinejoin="round" strokeLinecap="butt" filter="url(#sed-glow-blur)" />
            </g>
          ) : null}
          {tailLen > 1 ? (
            <g opacity={TAIL_ALPHA} mask="url(#sed-tail-mask)">
              <path d={areaUnder(subLine(tailLen))} fill={RED} filter="url(#sed-tail-blur)" />
            </g>
          ) : null}
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WORLD PLANE (chart under the print), with the burst's motion blur.
// ---------------------------------------------------------------------------
/** the chart's SVG canvas, world px (overflow is visible; this only places it) */
const CHART_BOX = { x: -200, y: 0, w: 1600, h: FRAME_H };
const BLUR_ID = "sed-pan-blur";

const Chart: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const L = tipLen(S);
  const tip = pointAtLen(LINE, LINE_CUM, L);
  const beadR = BEAD_RATIO * redW(k);
  return (
    <svg
      width={CHART_BOX.w}
      height={CHART_BOX.h}
      viewBox={`${CHART_BOX.x} ${CHART_BOX.y} ${CHART_BOX.w} ${CHART_BOX.h}`}
      style={{ position: "absolute", left: CHART_BOX.x, top: CHART_BOX.y, overflow: "visible" }}
    >
      <GrowthWash S={S} />
      <InkPath
        points={[
          { x: AXIS_X0, y: BASE_Y },
          { x: AXIS_X1, y: BASE_Y },
        ]}
        k={k}
        width={HAIR}
        rung={INK_LO}
        draw={(axisHead(S) - AXIS_X0) / (AXIS_X1 - AXIS_X0)}
      />
      <RedGroup k={k}>
        <WetLine id="sed-line" points={LINE} len={L} k={k} shadow={false} ageAt={(s) => S - drawnAt(s)} />
        {POINTS.slice(0, -1).map((p, i) => (
          // left by the bead: it starts under the bead's leading edge and is whole as the trailing edge clears it
          <Seal key={i} x={p.x} y={p.y} k={k} grow={clamp01((L - (arcOfPoint(i) - beadR)) / (2 * beadR))} />
        ))}
        <Bead id="sed-tip" x={tip.x} y={tip.y} k={k} r={beadR} />
      </RedGroup>
      <TitleLabel text="Soviet growth per year" x={LEFT_X} y={TITLE_Y} k={k} />
      <Label text="5.2%" x={LEFT_X} y={FIRST_VALUE_Y} k={k} size="value" anchor="start" appear={enterU(S, pointFrame(0))} />
      <Label text="1.8%" x={RIGHT_X} y={LAST_VALUE_Y} k={k} size="value" anchor="end" appear={enterU(S, TIP_END_F)} />
      <YearLabel text="1950s" x={LEFT_X} y={YEAR_Y} k={k} anchor="start" appear={enterFrom(S, axisFrame(LEFT_X))} />
      <YearLabel text="1980s" x={RIGHT_X} y={YEAR_Y} k={k} anchor="end" appear={enterFrom(S, axisFrame(RIGHT_X - YEAR_W))} />
    </svg>
  );
};

const WorldPlane: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const k = cam.k;
  const sigma = blurSigma(S);
  // the plane's window: the visible world plus what the blur reaches for beyond the frame's sides
  const padX = (3 * sigma + 30) / k;
  const padY = 30 / k;
  const win = {
    x: cam.x - FRAME_W / 2 / k - padX,
    y: cam.y - FRAME_H / 2 / k - padY,
    w: FRAME_W / k + 2 * padX,
    h: FRAME_H / k + 2 * padY,
  };
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={BLUR_ID} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${(sigma / k).toFixed(4)} 0`} />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          filter: sigma > 0 ? `url(#${BLUR_ID})` : undefined,
        }}
      >
        <div style={{ position: "absolute", left: -win.x, top: -win.y, width: 0, height: 0 }}>
          <Chart S={S} k={k} />
          <VintagePhoto src={PHOTO_SRC} box={PRINT} />
        </div>
      </div>
    </>
  );
};

const SovietEconomicDecline: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  return <VStage S={S} cam={cam} rest={CAM_END} photos={<WorldPlane S={S} cam={cam} />} />;
};

export default SovietEconomicDecline;
