import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FeatherWipe,
  FLAG_YELLOW,
  INK,
  INK_HI,
  INK_LO,
  PAPER,
  Label,
  RED,
  RED_HI,
  RED_WET,
  WET_DRY_F,
  WetLine,
  easeOutCubic,
  enterFrom,
  flagStars,
  mixHex,
  paperShadow,
  smoothstep,
  squirclePath,
  textBlurPx,
  RISE_PX,
  Stage,
} from "./chinatalkShared";
import {
  BASE_S1,
  BASE_W,
  BASE_X0,
  BASE_X1,
  CHINA,
  CHINA_LABEL_S,
  DURATION,
  FLAG_ENTER_S,
  FLAG_GAP,
  FLAG_H,
  FLAG_W,
  FPS,
  INK_COUNTRIES,
  LABEL_MIN_PX,
  LABEL_Y,
  PILL_W,
  H_PER_T,
  REST_CAM,
  baseProgress,
  baseReachS,
  camAt,
  chinaH,
  chinaReachS,
  chinaV,
  highlightAt,
  pillReveal,
} from "./largestCreditGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// LargestCreditExpansion -- Logan Wright, "The biggest credit boom in history"
// (ChinaTalk), V2 cut 1 of 5, delivered as 1_LargestCreditExpansion.mov.
//
// LINE: "China saw the largest single-country credit expansion that the world
// has seen."
// IN = 41 (edit frame of "china", out/logan-credit/words.tsv). "seen" ends at
// edit 156 -> local 115; + 16-frame tail = DURATION 131 f (24 fps, 1080x1920,
// opaque). Local word frames: china 0 · saw 4 · largest 14 · single 26 ·
// country 41 · credit 53 · expansion 63-80 · that 80 · world 97 · has 102 ·
// seen 106-115.
//
// IDEA: the league table of national credit booms, and China breaks the scale.
// One ink baseline, five slim pills standing on it, one per country's biggest
// credit boom, labelled under it. Heights = approximate credit added in the
// boom, nominal $T, ILLUSTRATIVE (40 world px per $T):
//   JAPAN 1985-90 ~ 1.7 · SPAIN 2000-08 ~ 2.0 · UK 2000-08 ~ 2.6 ·
//   US 2000-08 ~ 13 · CHINA 2008-16 ~ 25 (bank assets added).
// Ink pills at INK_LO (solid 0.42, revealed by a feathered wipe up = ink
// soaking up); China's pill is RED (the clip's one accent = China's credit)
// with the warm paper shadow. All text is ink. Geometry, clocks and the camera
// live in largestCreditGeom.ts. Five element types: baseline, pills, labels,
// flag, the travelling highlight on the red pill.
//
// GESTURES (gesture -> word -> local frames)
// 1. "china" (0): open moving, close on the China end of the table (k 1.57).
//    The baseline (ink 0.90, ~7 screen px) is already being written left ->
//    right in wet ink with its bead (S -30..12, decelerating into its end:
//    tip at x 241 and 35 screen px/f on frame 0, under the China slot at S 5). The PRC flag (the chinaGrowthFlag drawing,
//    a world object) slides up 24 px + blurs in at the China slot, sitting on
//    the baseline where China's pill will rise (S -3..9). "CHINA" (ink 0.90)
//    lands under the slot (S 1..13).
// 2. "largest single country" (14-53): glide 1 (S -16..38) pulls back and tilts
//    up to the whole table (k 1.27, content centred). The four ink pills soak
//    up in ONE soft wave left -> right (feathered wipe up; JAPAN 20-33,
//    SPAIN 24-37, UK 27.5-41.5, US 31-55), each label (ink 0.42) landing under
//    its pill as it rises (JAPAN enters from the left edge as the camera pulls
//    back). The US pill is clearly the tallest (~660 screen px at k 1.27).
// 3. "credit expansion" (53-80): China's red pill SHOOTS up from the baseline
//    (shootEase, launch S 45, 60 f; 95 % at S 90), a wet RED_WET top + the bead
//    leading, the flag riding the top. It passes the US top at S 68.8
//    ("expansion"). Glide 2 (S 42-74, warp 0.85, k 1.27 -> 1.8, x +235,
//    y -170) pushes in and tilts up after the tip, cresting early and blending
//    into glide 3 (pass 2: one C1 turn, max |dv| 2.34); the flag runs out of the
//    top of the frame (S ~79-97, the tip itself reaches ~y 30) while the
//    baseline, labels and the small booms drop out of the bottom / left.
// 4. "that the world has seen" (80-115): glide 3 (S 68-108, warp 1.3, k -> 1.0;
//    it starts under the push-in's crest) is one long pull-back: the whole
//    table re-enters, China ~2x the US, the others stubs; the framing arrives
//    on "seen" (S ~106-110).
//    The pill settles and dries (RED_WET -> RED). The hold: one travelling
//    highlight (#F2604A) runs up the red pill (S 98-127) while a slow creep
//    (glide 4, S 92-140, k 1.0 -> 1.025) decays into the last frame. Final
//    frame: centred table (ink x 148-928, y 212-1384), China towering, flag on top.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BASE_PTS = [
  { x: BASE_X0, y: 0 },
  { x: BASE_X1, y: 0 },
];

/** A pill standing on the baseline (y = 0) at x, h tall: rounded top, flat foot. */
const pillD = (x: number, h: number, w = PILL_W) => {
  const r = w / 2;
  const x0 = x - r;
  const x1 = x + r;
  if (h <= 0.01) return "";
  if (h < r) {
    return `M${x0.toFixed(2)} 0A${r.toFixed(2)} ${h.toFixed(2)} 0 0 1 ${x1.toFixed(2)} 0Z`;
  }
  const yc = -h + r;
  return `M${x0.toFixed(2)} 0L${x0.toFixed(2)} ${yc.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${yc.toFixed(2)}L${x1.toFixed(2)} 0Z`;
};

/** The PRC flag as a world object (FlagWorld's drawing from chinatalkShared,
 *  copied WITHOUT the label edge-fade: it rides the red pill and physically
 *  leaves through the top of the frame, it does not fade out at the edge). */
const RidingFlag: React.FC<{ x0: number; y0: number; w: number; k: number; opacity: number; blurPx: number }> = ({
  x0,
  y0,
  w,
  k,
  opacity,
  blurPx,
}) => {
  if (opacity <= 0.002) return null;
  const h = (w * 2) / 3;
  const wS = w * k;
  const hS = h * k;
  const outline = squirclePath(wS, hS);
  const filter = (blurPx > 0.01 ? `blur(${(blurPx / k).toFixed(3)}px) ` : "") + paperShadow(k);
  return (
    <g opacity={opacity.toFixed(4)} style={{ filter }}>
      <g transform={`translate(${x0.toFixed(3)} ${y0.toFixed(3)}) scale(${(1 / k).toFixed(6)})`}>
        <defs>
          <clipPath id="lce-flag-clip">
            <path d={outline} />
          </clipPath>
        </defs>
        <path d={outline} fill={RED} />
        <g clipPath="url(#lce-flag-clip)">
          {flagStars(wS).map((d, i) => (
            <path key={i} d={d} fill={FLAG_YELLOW} />
          ))}
        </g>
      </g>
    </g>
  );
};

/** The red tip's bead: chinatalkShared's Bead (bloom 2.6x at 0.22, the dot)
 *  with a subtler specular for this wide pill (radius 0.16 r at 0.25, was
 *  0.28 r at 0.5), so the tip reads wet, not as a glossy ball. */
const PillBead: React.FC<{ x: number; y: number; r: number; opacity: number }> = ({ x, y, r, opacity }) => (
  <g opacity={opacity < 1 ? opacity.toFixed(4) : undefined}>
    <defs>
      <radialGradient id="lce-bead-bloom">
        <stop offset={0} stopColor={RED_WET} stopOpacity={0.22} />
        <stop offset={0.45} stopColor={RED_WET} stopOpacity={0.11} />
        <stop offset={1} stopColor={RED_WET} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={(2.6 * r).toFixed(3)} fill="url(#lce-bead-bloom)" />
    <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={r.toFixed(3)} fill={RED_WET} />
    <circle cx={(x - 0.36 * r).toFixed(3)} cy={(y - 0.36 * r).toFixed(3)} r={(0.16 * r).toFixed(3)} fill={PAPER} opacity={0.25} />
  </g>
);

/** China's red pill: grows from the baseline; its freshest WET world px are
 *  RED_WET, drying back to RED over WET_DRY_F frames; a bead bloom leads the
 *  tip while it moves; the travelling highlight in the hold. */
const WET = 90;
const ChinaPill: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const h = chinaH(S);
  if (h <= 0.05) return null;
  const x = CHINA.x;
  const r = PILL_W / 2;
  const top = -h;
  // wet gradient over the top WET px: wetness by the age of each height
  const stops: React.ReactNode[] = [];
  const N = 8;
  const span = Math.min(WET, h);
  for (let i = 0; i <= N; i++) {
    const d = (span * i) / N;
    const age = S - chinaReachS(h - d);
    const wet = (1 - smoothstep(age / WET_DRY_F)) * (1 - smoothstep(d / WET));
    stops.push(<stop key={i} offset={(i / N).toFixed(4)} stopColor={mixHex(RED, RED_WET, wet)} />);
  }
  const v = chinaV(S);
  const bead = smoothstep(v / 6);
  const hl = highlightAt(S);
  const d = pillD(x, h);
  return (
    <g>
      <defs>
        <linearGradient id="lce-wet" gradientUnits="userSpaceOnUse" x1={0} y1={top.toFixed(2)} x2={0} y2={(top + span).toFixed(2)}>
          {stops}
        </linearGradient>
        {hl ? (
          <linearGradient id="lce-hl" gradientUnits="userSpaceOnUse" x1={0} y1={(hl.y - 110).toFixed(2)} x2={0} y2={(hl.y + 110).toFixed(2)}>
            <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
            <stop offset={0.3} stopColor={RED_HI} stopOpacity={(0.55 * hl.op).toFixed(4)} />
            <stop offset={0.5} stopColor={RED_HI} stopOpacity={(0.95 * hl.op).toFixed(4)} />
            <stop offset={0.7} stopColor={RED_HI} stopOpacity={(0.55 * hl.op).toFixed(4)} />
            <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
          </linearGradient>
        ) : null}
      </defs>
      <g style={{ filter: paperShadow(k) }}>
        <path d={d} fill={RED} />
        <path d={d} fill="url(#lce-wet)" />
        {hl ? <path d={d} fill="url(#lce-hl)" /> : null}
      </g>
      {bead > 0.01 && h > r ? <PillBead x={x} y={top + r} r={r} opacity={bead} /> : null}
    </g>
  );
};

const LargestCreditExpansion: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const S = frame;
  const cam = camAt(S);
  const k = cam.k;

  // the baseline, written in wet ink
  const baseLen = (BASE_X1 - BASE_X0) * baseProgress(S);
  const baseBead = 1 - smoothstep((S - BASE_S1 + 2) / 8);

  // the flag: lands on "china" at the China slot, then rides the red pill
  const fa = enterFrom(S, FLAG_ENTER_S);
  const flagLift = (1 - easeOutCubic(fa)) * (RISE_PX / k);
  const flagY0 = -chinaH(S) - FLAG_GAP - FLAG_H + flagLift;

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* the four ink booms, soaking up in one wave */}
      {INK_COUNTRIES.map((c, i) => {
        const h = c.t * H_PER_T;
        const u = pillReveal(c, S);
        if (u <= 0) return null;
        const feather = Math.min(44, h * 0.55);
        return (
          <FeatherWipe
            key={c.name}
            id={`lce-pill-${i}`}
            box={{ x0: c.x - PILL_W / 2 - 2, y0: -h - 2, x1: c.x + PILL_W / 2 + 2, y1: 1 }}
            u={smoothstep(u)}
            feather={feather}
            dir="up"
          >
            <path d={pillD(c.x, h)} fill={INK} opacity={INK_LO} />
          </FeatherWipe>
        );
      })}

      {/* China's red pill */}
      <ChinaPill S={S} k={k} />

      {/* the baseline over the pills' feet */}
      <WetLine
        id="lce-base"
        points={BASE_PTS}
        len={baseLen}
        k={k}
        ink
        rung={INK_HI}
        width={BASE_W}
        bead={baseBead}
        ageAt={(s) => S - baseReachS(s)}
      />

      {/* country labels */}
      {INK_COUNTRIES.map((c) => (
        <Label
          key={c.name}
          text={c.name}
          x={c.x}
          y={LABEL_Y}
          k={k}
          size="word"
          rung={INK_LO}
          appear={enterFrom(S, c.start + 1)}
          minPx={LABEL_MIN_PX}
        />
      ))}
      <Label text={CHINA.name} x={CHINA.x} y={LABEL_Y} k={k} size="word" rung={INK_HI} appear={enterFrom(S, CHINA_LABEL_S)} minPx={LABEL_MIN_PX} />

      {/* the flag */}
      <RidingFlag
        x0={CHINA.x - FLAG_W / 2}
        y0={flagY0}
        w={FLAG_W}
        k={k}
        opacity={smoothstep(fa)}
        blurPx={textBlurPx(fa, 0)}
      />
    </Stage>
  );
};

export default LargestCreditExpansion;
