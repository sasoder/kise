import React from "react";
import {
  Bead,
  DOT_R,
  INK,
  INK_HI,
  INK_LO,
  InkPath,
  Label,
  Odometer,
  RED,
  clamp01,
  easeOutCubic,
  labelPx,
  paperShadow,
  pointAtLen,
  polyD,
  smoothstep,
  sz,
  textBlurPx,
  worldBlur,
  RISE_PX,
  TICK_HALF,
} from "./chinatalkShared";
import type { Pt } from "./chinatalkShared";
import { REFERENCE_PCT, SCALE_PCT } from "./youthUnemploymentData";
import {
  CUM,
  END_M,
  F_LAND,
  JANUARIES,
  K_END,
  LAST,
  PTS,
  X,
  Y,
} from "./youthUnemploymentGeom";

// ---------------------------------------------------------------------------
// youthUnemploymentParts -- the drawn pieces of YouthUnemploymentTwentyPlus that
// the kit does not have ready-made: the chart's hairlines, the quiet red glow
// under the line, the tip (the kit's bead with a bloom that breathes once it
// has stopped), a block entrance (the kit Label's own slide-up + blur-in applied
// to a group), and the readout number built from kit Odometers + Labels.
// ---------------------------------------------------------------------------

/** The kit Label entrance (slide up RISE_PX + fade + blur 6 -> 0) applied to a
 *  whole block, so a lockup of several kit parts arrives as ONE thing. `appear`
 *  is raw linear progress, as everywhere in the kit. */
export const BlockEntrance: React.FC<{ appear: number; k: number; children: React.ReactNode }> = ({ appear, k, children }) => {
  const a = clamp01(appear);
  if (a <= 0.001) return null;
  if (a >= 1) return <>{children}</>;
  const lift = (1 - easeOutCubic(a)) * (RISE_PX / k);
  return (
    <g opacity={smoothstep(a).toFixed(4)} transform={`translate(0 ${lift.toFixed(3)})`} style={{ filter: worldBlur(textBlurPx(a, 0), k) }}>
      {children}
    </g>
  );
};

/** A kit part drawn at `m` times its size about its own anchor (x, y). */
export const Scaled: React.FC<{ x: number; y: number; m: number; children: React.ReactNode }> = ({ x, y, m, children }) => (
  <g transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${m.toFixed(5)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`}>{children}</g>
);

// --- hairlines (kit spec: INK 0.07, 1.5 world px, feathered at the ends) ------------
const HAIR_OPACITY = 0.07;
const HAIR_W = 1.5;
const HAIR_FEATHER = 80;
export const Hairlines: React.FC<{ k: number }> = ({ k }) => {
  const x0 = X(0);
  const x1 = X(END_M);
  const yTop = Y(REFERENCE_PCT);
  const fx = HAIR_FEATHER / (x1 - x0);
  const fy = HAIR_FEATHER / -yTop;
  const w = (HAIR_W * sz(k)).toFixed(3);
  return (
    <g fill="none">
      <defs>
        <linearGradient id="yu-hair-h" gradientUnits="userSpaceOnUse" x1={x0} y1={0} x2={x1} y2={0}>
          <stop offset={0} stopColor={INK} stopOpacity={0} />
          <stop offset={fx.toFixed(5)} stopColor={INK} stopOpacity={HAIR_OPACITY} />
          <stop offset={(1 - fx).toFixed(5)} stopColor={INK} stopOpacity={HAIR_OPACITY} />
          <stop offset={1} stopColor={INK} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="yu-hair-v" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={yTop}>
          <stop offset={0} stopColor={INK} stopOpacity={HAIR_OPACITY} />
          <stop offset={(1 - fy).toFixed(5)} stopColor={INK} stopOpacity={HAIR_OPACITY} />
          <stop offset={1} stopColor={INK} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the one scale hairline */}
      <path d={`M${x0} ${Y(SCALE_PCT)}L${x1} ${Y(SCALE_PCT)}`} stroke="url(#yu-hair-h)" strokeWidth={w} />
      {/* a faint vertical per January, from the baseline up to the reference */}
      <path d={JANUARIES.map((m) => `M${X(m)} 0L${X(m)} ${yTop}`).join("")} stroke="url(#yu-hair-v)" strokeWidth={w} />
    </g>
  );
};

/** The baseline at 0 % with a tick per January (ink, context rung). */
export const Baseline: React.FC<{ k: number }> = ({ k }) => {
  const t = TICK_HALF * sz(k);
  return (
    <g>
      <InkPath
        points={[
          { x: X(0), y: 0 },
          { x: X(END_M), y: 0 },
        ]}
        k={k}
        rung={INK_LO}
      />
      {JANUARIES.map((m) => (
        <InkPath
          key={m}
          points={[
            { x: X(m), y: -t },
            { x: X(m), y: t },
          ]}
          k={k}
          rung={INK_LO}
        />
      ))}
    </g>
  );
};

// --- the red glow under the line -----------------------------------------------------
// One even, quiet glow hugging the underside of the whole drawn line: RED at
// WASH_TOP (0.10) at the line, gone within WASH_DEPTH (100 px in the END frame)
// of it. It falls off with the DISTANCE to the line, so it has the same profile
// everywhere and cannot pile up where the saw-tooth doubles back (a tint is the
// nearest stroke's, never a sum): the drawn stroke is laid down WASH_LAYERS
// times at growing widths (round joins), each with the alpha that makes the
// stack's coverage at distance d equal (1 - d / WASH_DEPTH)^WASH_POW, lightly
// blurred so no layer edge shows; the stack is clipped to the area under the
// drawn line and the whole group is then set to WASH_TOP. (The layers are drawn
// strong and the GROUP is faded: 24 layers at ~0.004 each round away in 8-bit
// compositing.) A horizontal mask eases it in over the line's first WASH_START
// px and lets it trail the tip by `lead` px, so it has no edge anywhere.
/** 100 screen px in the END frame */
const WASH_DEPTH = 100 / K_END;
const WASH_TOP = 0.1;
const WASH_LAYERS = 24;
const WASH_POW = 2;
/** world px: melts the layer edges into one gradient */
const WASH_BLUR = 3;
const WASH_START = 60;
/** the glow trails the moving tip by this much, and keeps WASH_REST of it once the tip is at rest */
export const WASH_LEAD = 44;
export const WASH_REST = 30;
/** the stack's peak coverage (kept under 1 so every layer's alpha is finite) */
const WASH_PEAK = 0.96;
const WASH_STACK = Array.from({ length: WASH_LAYERS }, (_, j) => {
  const i = j + 1;
  // target coverage inside layer n's band; layers composite "over", so alpha_i = 1 - (1 - P_i) / (1 - P_i+1)
  const cover = (n: number) => (n > WASH_LAYERS ? 0 : WASH_PEAK * Math.pow(1 - (n - 0.5) / WASH_LAYERS, WASH_POW));
  return { half: (WASH_DEPTH * i) / WASH_LAYERS, o: 1 - (1 - cover(i)) / (1 - cover(i + 1)) };
});
export const RedWash: React.FC<{ L: number; lead: number }> = ({ L, lead }) => {
  if (L < 2) return null;
  const tip = pointAtLen(PTS, CUM, L);
  const x0 = PTS[0].x;
  const x1 = tip.x;
  const span = x1 - x0;
  if (span < 1) return null;
  const drawn: Pt[] = [];
  for (let i = 0; i <= LAST && CUM[i] < L; i++) drawn.push(PTS[i]);
  drawn.push(tip);
  const line = polyD(drawn);
  const under = polyD([...drawn, { x: x1, y: 0 }, { x: x0, y: 0 }], true);
  // the horizontal feather: 0 at the start -> 1 after WASH_START ... 1 -> 0 over the last `lead` px
  const a = Math.min(0.45, WASH_START / span);
  const b = Math.min(0.5, Math.max(1, lead) / span);
  const stops: { t: number; o: number }[] = [];
  for (let i = 0; i <= 5; i++) stops.push({ t: (a * i) / 5, o: smoothstep(i / 5) });
  for (let i = 0; i <= 5; i++) stops.push({ t: 1 - b + (b * i) / 5, o: 1 - smoothstep(i / 5) });
  const top = Math.min(...drawn.map((p) => p.y)) - 4;
  return (
    <g>
      <defs>
        <clipPath id="yu-wash-clip">
          <path d={under} />
        </clipPath>
        <linearGradient id="yu-wash-fade" gradientUnits="userSpaceOnUse" x1={x0.toFixed(2)} y1={0} x2={x1.toFixed(2)} y2={0}>
          {stops.map((st, i) => (
            <stop key={i} offset={st.t.toFixed(5)} stopColor="#FFFFFF" stopOpacity={st.o.toFixed(4)} />
          ))}
        </linearGradient>
        <mask id="yu-wash-mask" maskUnits="userSpaceOnUse" x={(x0 - 2).toFixed(2)} y={top.toFixed(2)} width={(span + 4).toFixed(2)} height={(-top + 2).toFixed(2)}>
          <rect x={(x0 - 2).toFixed(2)} y={top.toFixed(2)} width={(span + 4).toFixed(2)} height={(-top + 2).toFixed(2)} fill="url(#yu-wash-fade)" />
        </mask>
      </defs>
      <g clipPath="url(#yu-wash-clip)">
        <g mask="url(#yu-wash-mask)" opacity={(WASH_TOP / WASH_PEAK).toFixed(4)}>
          <g fill="none" stroke={RED} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `blur(${WASH_BLUR}px)` }}>
            {WASH_STACK.map((w, i) => (
              <path key={i} d={line} strokeWidth={(2 * w.half).toFixed(2)} strokeOpacity={w.o.toFixed(5)} />
            ))}
          </g>
        </g>
      </g>
    </g>
  );
};

// --- the tip: the kit's bead; its bloom breathes once it has stopped ---------------------
/** The kit Bead (bloom 2.6 r at 0.22, dot, specular) on the tip of the line. It
 *  simply stops on the last month; from then on the bloom breathes very slightly
 *  (the bloom is drawn here, with the kit's own stops, so its radius can move). */
export const TipMark: React.FC<{ S: number; k: number; tip: Pt }> = ({ S, k, tip }) => {
  const r = DOT_R * sz(k);
  const breathe = 1 + 0.08 * Math.sin((S - F_LAND) / 6.5) * smoothstep((S - F_LAND) / 12);
  return (
    <g style={{ filter: paperShadow(k) }}>
      <defs>
        <radialGradient id="yu-tip-bloom">
          <stop offset={0} stopColor={RED} stopOpacity={0.22} />
          <stop offset={0.45} stopColor={RED} stopOpacity={0.11} />
          <stop offset={1} stopColor={RED} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={tip.x.toFixed(3)} cy={tip.y.toFixed(3)} r={(2.6 * r * breathe).toFixed(3)} fill="url(#yu-tip-bloom)" />
      <Bead id="yu-tip" x={tip.x} y={tip.y} r={r} bloom={false} />
    </g>
  );
};

// --- the readout number: kit Odometers + kit Labels, "21.3%" ------------------------------
/** em advances of the value class (the kit's own figures: a digit wheel is 0.58 em) */
const DIGIT_EM = 0.58;
const POINT_EM = 0.3;
const PCT_GAP_EM = 0.05;
const PCT_EM = 0.9;
export const READOUT_EM = 3 * DIGIT_EM + POINT_EM + PCT_GAP_EM + PCT_EM;
/** The payoff number: whole part (2 wheels), decimal point, tenths wheel, per
 *  cent sign, right-aligned at `xRight`, caps centred on `y`, at `fs` world px.
 *  `value` is continuous (the tip's own height on the chart); the tenths wheel
 *  always turns, the whole part turns only while the tenths pass 9 -> 0. */
export const ReadoutNumber: React.FC<{ value: number; speed: number; xRight: number; y: number; fs: number; k: number }> = ({
  value,
  speed,
  xRight,
  y,
  fs,
  k,
}) => {
  const u = labelPx("value", k); // the kit's own value size at this k
  const m = fs / u;
  const xL = xRight - READOUT_EM * fs;
  const v10 = Math.round(Math.max(0, value) * 10 * 1e6) / 1e6;
  const whole = Math.floor(v10 / 10 + 1e-9);
  const tenths = v10 - 10 * whole;
  const carry = Math.max(0, tenths - 9);
  return (
    <Scaled x={xL} y={y} m={m}>
      <Odometer id="yu-whole" value={whole + carry} digits={2} x={xL} y={y} k={k} rung={INK_HI} />
      <Label text="." x={xL + 2 * DIGIT_EM * u} y={y} k={k} size="value" anchor="start" rung={INK_HI} />
      <Odometer id="yu-tenths" value={tenths} digits={1} x={xL + (2 * DIGIT_EM + POINT_EM) * u} y={y} k={k} speed={speed} rung={INK_HI} />
      <Label text="%" x={xL + (3 * DIGIT_EM + POINT_EM + PCT_GAP_EM) * u} y={y} k={k} size="value" anchor="start" rung={INK_HI} />
    </Scaled>
  );
};
