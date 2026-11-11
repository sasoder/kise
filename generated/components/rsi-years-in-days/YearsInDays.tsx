// ---------------------------------------------------------------------------
// YearsInDays (rsi-years-in-days, cut 15). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 106 frames.
//
// CHECK LINE: "While the calendar moves three days, the AI's experience climbs past year after year: the axis
// along the bottom is in days, the axis up the side is in years."
//
// THE LINE: "AI is going to accumulate years of deployed context in just a few days of calendar time."
// WORD -> FRAME: AI -1 · is 3 · going 6 · to 8 · accumulate 10 · years ~16 · of 26 · deployed 33 · context 39 ·
// in 49 · just 63 · a 67 · few 70 · days 74 · of 81 · calendar 88 · time 94 (· next line 104).
// DURATION: the slot 15.349 -> 19.770 s = 4.421 s x 23.976 = 106 frames (f0..f105).
//
// THE MOTION: one chart, two rulers. A white day rule along the ground (DAY 1-3, people's calendar) and, standing
// on its left end, a white year ruler (1 YEAR, 2 YEARS, ... experience). The orange OpenAI mark climbs from the
// corner on one straight steep line at one constant speed; a white drop line under it ends in a white dot on the
// day rule (where the calendar is). Under the line its accumulated context fills in as a wedge of horizontal
// orange lanes, each born under the mark when the mark passes its height and growing rightward to the leading
// edge, where a column of bright dots (the copies) sits at the lane tips. Everything is derived from the mark's
// path parameter tau, never a timer. One damped camera track pulls back from k 2.4 on the corner to ~0.9 with
// both rulers whole by "days" (f74), then creeps. The mark is drawn above the
// vignette so it stays full ACCENT, the brightest orange in frame, in the upper-right corner where it ends.
// BEATS: calendar dot passes DAY 2's tick f32, DAY 3's f73 ("days" 74); the mark's height passes 1 YEAR f15
// ("years"), 2 YEARS f40, 3 YEARS f65, 4 YEARS f90; each label slides up as its tick is passed. The camera's eased
// move runs f-14 -> f70 (already moving at f0) and the damper settles it ~f76. From f94 the climb eases from
// full speed to ~40 % (the hold's creep); lanes keep laying, dots breathe, grid drifts. No fade.
// Orange = the AI and its accumulated context, nothing else; white = the calendar, the experience ruler, the
// drop line, the labels.
//
// SOURCES: none. The axes are a schematic of the speaker's claim, no data: the days and years are illustrative.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  FONT_LABEL,
  INK,
  INK_HI,
  INK_LO,
  LABEL_TRACKING,
  LABEL_WEIGHT,
  Label,
  labelIn,
  worldPx,
} from "../kits/dwarkesh/alignShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";

export const FPS = 24000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// Scale. Strokes, labels and dots are sized for the settled zoom.
// ---------------------------------------------------------------------------
const K_REF = 0.9;
const SW = worldPx(6.5, K_REF); // the one stroke weight
const THREAD = SW / 2;
const LABEL_SIZE = worldPx(46, K_REF);
const TICK = worldPx(22, K_REF);
const CAL_DOT_R = worldPx(11, K_REF);

// ---------------------------------------------------------------------------
// The world. The corner of the two rulers is the world origin; up is -y. A day is DAY_W world px along the rule,
// a year YEAR_H world px up the ruler (250 and 195 screen px at K_REF).
// ---------------------------------------------------------------------------
const DAY_W = 250 / K_REF;
const YEAR_H = 192 / K_REF;
const DAYS_SHOWN = 3; // the rule ends just past DAY 3's end
const RULE_END = DAYS_SHOWN * DAY_W + TICK;
const YEARS_SHOWN = 5;
const RULER_TOP = (YEARS_SHOWN + 0.35) * YEAR_H;

// ---------------------------------------------------------------------------
// The climb, on one parameter tau (frames of travel). years and days are both linear in tau and in a fixed ratio,
// so the mark rides one straight line out of the corner at one constant speed. tau = f until f94, then the climb
// eases to ~40 % speed by the last frame (the hold's creep).
// ---------------------------------------------------------------------------
const Y0 = 0.4; // years at tau 0 (the mark just off the corner)
const Y_RATE = 0.04; // years per frame: 1 YEAR at f15, 2 at f40, 3 at f65, 4 at f90
const D_PER_Y = 0.6; // days per year of experience: DAY 2's tick at f32, DAY 3's at f73
const yearsAt = (tau: number) => Y0 + Y_RATE * tau;
const daysAt = (tau: number) => D_PER_Y * yearsAt(tau);
const EASE_F = 94;
const EASE_LEN = 11;
const SPEED_END = 0.4;
const TAU: number[] = (() => {
  const out: number[] = [];
  let t = 0;
  const SUB = 20;
  for (let f = 0; f <= DURATION; f++) {
    out.push(t);
    for (let s = 0; s < SUB; s++) {
      const u = f + (s + 0.5) / SUB;
      const v = 1 - (1 - SPEED_END) * smoothstep((u - EASE_F) / EASE_LEN);
      t += v / SUB;
    }
  }
  return out;
})();
const tauAt = (f: number) => TAU[Math.max(0, Math.min(DURATION, f))];
/** The frame at which tau first reaches t (for label entrances). */
const frameOfTau = (t: number) => {
  for (let f = 0; f < DURATION; f++) {
    if (TAU[f + 1] >= t) return f + (t - TAU[f]) / (TAU[f + 1] - TAU[f]);
  }
  return 1e9;
};
const markWorld = (tau: number) => ({
  x: daysAt(tau) * DAY_W,
  y: -yearsAt(tau) * YEAR_H,
});
// The line's x at a height h above the rule (where the mark was when it stood that high).
const lineXAt = (h: number) => (h / YEAR_H) * D_PER_Y * DAY_W;

// ---------------------------------------------------------------------------
// The camera: one eased key track (k 1.7 on the corner -> ~0.92 with both rulers whole), plus a slow constant
// zoom creep, followed by the kit's damped tracker in x, y and k. The track begins at f-14 and the damper is run
// from f-30, so the camera is already moving at f0. The framing is written as where the corner sits on screen.
// ---------------------------------------------------------------------------
const PRE = 30;
const MOVE_F0 = -14;
const MOVE_F1 = 70;
const MOVE_WARP = 0.8;
const K0 = 2.4;
const K1 = 0.925;
const K_CREEP = 0.00025; // per frame, always on
const CORNER0 = { x: 470, y: 1000 };
const CORNER1 = { x: 250, y: 1195 };

const camTarget = (f: number) => {
  const g = camEase((f - MOVE_F0) / (MOVE_F1 - MOVE_F0), MOVE_WARP);
  const k = K0 + (K1 - K0) * g - K_CREEP * (f + PRE);
  const sx = CORNER0.x + (CORNER1.x - CORNER0.x) * g;
  const sy = CORNER0.y + (CORNER1.y - CORNER0.y) * g;
  // the world origin lands on (sx, sy): sx = 540 + (0 - cx) * k
  return { x: -(sx - 540) / k, y: -(sy - 960) / k, k };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  const t0 = camTarget(-PRE);
  let cx = t0.x;
  let cy = t0.y;
  let k = t0.k;
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let f = -PRE + 1; f <= DURATION; f++) {
    const T = camTarget(f);
    vx += (T.x - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (T.y - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (T.k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    if (f >= 0) out.push({ cx, cy, k });
  }
  return out;
})();
const BG_CX_REST = (CAM[0].cx + CAM[DURATION - 1].cx) / 2;
const BG_CY_REST = CAM[0].cy;

/** The camera at a frame (for the hand-off checks). */
export const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION - 1, f))];
/** The mark's and the calendar dot's screen positions at a frame (no sway): what the speed check measures. */
export const onScreen = (f: number) => {
  const c = camAt(f);
  const m = markWorld(tauAt(f));
  const { tx, ty } = worldTransform(c.cx, c.cy, c.k);
  return {
    mark: { x: tx + m.x * c.k, y: ty + m.y * c.k },
    cal: { x: tx + m.x * c.k, y: ty },
    k: c.k,
  };
};

// ---------------------------------------------------------------------------
// The wedge: horizontal lanes at a fixed pitch above the rule. Lane i (height h_i) is born under the mark when
// the mark's height passes h_i, starts where the line crosses h_i and runs to the leading edge (the mark's x),
// where its copy (a bright dot) sits. Lanes are ACCENT_DEEP, ripening in steps toward the leading edge; the dots
// are ACCENT, a little bigger than a lane is thick.
// ---------------------------------------------------------------------------
const LANE_PITCH = worldPx(40, K_REF);
const LANE_T = worldPx(15, K_REF);
const LANE_N = Math.ceil((RULER_TOP - LANE_PITCH) / LANE_PITCH);
const LANE_H = (i: number) => (i + 0.6) * LANE_PITCH;
const RIPE_LEN = worldPx(130, K_REF);
const RIPE_STEPS = 10;
const RIPE_MAX = 0.55;
const TONE = makeTone(ACCENT_DEEP, ACCENT);
const DOT_JX = worldPx(4, K_REF);
const DOT_R = worldPx(10, K_REF);
const DOT_GAP = worldPx(3, K_REF); // lane end to its dot's rim

const Wedge: React.FC<{ frame: number; tau: number }> = ({ frame, tau }) => {
  const m = markWorld(tau);
  const H = -m.y;
  const X = m.x;
  const lanes: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < LANE_N; i++) {
    const h = LANE_H(i);
    if (h >= H) break;
    const tipX = X + DOT_JX * (hash(i, 3.7) * 2 - 1);
    const x0 = lineXAt(h);
    const y = -h - LANE_T / 2;
    const r = DOT_R * (0.85 + 0.3 * hash(i, 9.1)) * breath(frame, hash(i, 5.3));
    const laneEnd = tipX - r - DOT_GAP;
    if (laneEnd > x0) {
      // the whole lane, deep (the ripening steps lie over its newest part)
      const ripeStart = laneEnd - RIPE_LEN;
      lanes.push(<rect key={`b${i}`} x={x0} y={y} width={laneEnd - x0} height={LANE_T} fill={ACCENT_DEEP} />);
      // the ripening steps toward the leading edge, each laid over the last and running to the lane's end, so
      // no anti-aliased seam shows between two steps
      for (let s = 0; s < RIPE_STEPS; s++) {
        const a = Math.max(x0, ripeStart + (RIPE_LEN * s) / RIPE_STEPS);
        if (laneEnd <= a) continue;
        lanes.push(
          <rect
            key={`r${i}-${s}`}
            x={a}
            y={y}
            width={laneEnd - a}
            height={LANE_T}
            fill={TONE((RIPE_MAX * (s + 1)) / RIPE_STEPS)}
          />,
        );
      }
    }
    dots.push(<circle key={`d${i}`} cx={tipX} cy={-h} r={r} fill={ACCENT} />);
  }
  return (
    <g>
      {lanes}
      {dots}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The two rulers. Passed stretch INK_HI, the stretch ahead INK_LO; a tick lights as it is passed.
// ---------------------------------------------------------------------------
const Rulers: React.FC<{ k: number; tau: number }> = ({ k, tau }) => {
  const m = markWorld(tau);
  const H = -m.y;
  const X = m.x;
  const lit = (passed: boolean) => (passed ? INK_HI : INK_LO);
  return (
    <g style={{ filter: iconShadow(k) }}>
      {/* day rule: from just left of the corner (the year ruler's zero tick) to just past DAY 3's end */}
      <line x1={-TICK} x2={X} y1={0} y2={0} stroke={INK} strokeWidth={SW} opacity={INK_HI} />
      <line x1={X} x2={RULE_END} y1={0} y2={0} stroke={INK} strokeWidth={SW} opacity={INK_LO} />
      {/* year ruler: from just below the corner (the day rule's zero tick) to above 5 years */}
      <line x1={0} x2={0} y1={TICK} y2={-H} stroke={INK} strokeWidth={SW} opacity={INK_HI} />
      <line x1={0} x2={0} y1={-H} y2={-RULER_TOP} stroke={INK} strokeWidth={SW} opacity={INK_LO} />
      {Array.from({ length: DAYS_SHOWN }, (_, n) => n + 1).map((n) => (
        <line
          key={`dt${n}`}
          x1={n * DAY_W}
          x2={n * DAY_W}
          y1={0}
          y2={TICK}
          stroke={INK}
          strokeWidth={SW}
          opacity={lit(X >= n * DAY_W)}
        />
      ))}
      {Array.from({ length: YEARS_SHOWN }, (_, n) => n + 1).map((n) => (
        <line
          key={`yt${n}`}
          x1={-TICK}
          x2={0}
          y1={-n * YEAR_H}
          y2={-n * YEAR_H}
          stroke={INK}
          strokeWidth={SW}
          opacity={lit(H >= n * YEAR_H)}
        />
      ))}
    </g>
  );
};

// A right-aligned label (the year labels sit left of the ruler, their right edges on one line). Same type,
// rise and fade as alignShared's Label.
const RightLabel: React.FC<{ k: number; xRight: number; yMid: number; text: string; inT: number }> = ({
  k,
  xRight,
  yMid,
  text,
  inT,
}) => {
  const t = clamp01(inT);
  if (t <= 0) return null;
  const rise = worldPx(24) * (1 - t);
  return (
    <div
      style={{
        position: "absolute",
        left: xRight - 1200,
        top: yMid - LABEL_SIZE * 0.5 + rise,
        width: 1200,
        textAlign: "right",
        fontFamily: FONT_LABEL,
        fontWeight: LABEL_WEIGHT,
        fontSize: LABEL_SIZE,
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: LABEL_TRACKING,
        color: INK,
        opacity: INK_HI * t,
        whiteSpace: "nowrap",
        filter: iconShadow(k),
      }}
    >
      {text}
    </div>
  );
};

const DAY_LABEL_F = [0, 1, 2].map((n) => (n === 0 ? -1e9 : frameOfTau((n / D_PER_Y - Y0) / Y_RATE)));
const YEAR_LABEL_F = [1, 2, 3, 4, 5].map((n) => frameOfTau((n - Y0) / Y_RATE));
const MARK_PX0 = 190;
const MARK_PX1 = 124;
const MARK_GROW_F = 72;

const YearsInDays: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const tau = tauAt(frame);
  const m = markWorld(tau);
  // the mark shrinks on screen 190 -> 124 px through the pull-back while it grows in the world (79 -> 137)
  // (the second half of a smoothstep: already growing at f0, easing onto its size by MARK_GROW_F)
  const grow = 2 * smoothstep(0.5 + 0.5 * (frame / MARK_GROW_F)) - 1;
  const markPx = MARK_PX0 + (MARK_PX1 - MARK_PX0) * grow;
  const markSize = (markPx / k) * breath(frame, 0.3);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={BG_CY_REST}
        cx={cx}
        cxRest={BG_CX_REST}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Rulers k={k} tau={tau} />
            <Wedge frame={frame} tau={tau} />
            {/* the drop line and the calendar dot: where the calendar is */}
            <g style={{ filter: iconShadow(k) }}>
              <line x1={m.x} x2={m.x} y1={m.y + markSize * 0.46} y2={0} stroke={INK} strokeWidth={THREAD} opacity={INK_HI} />
              <circle cx={m.x} cy={0} r={CAL_DOT_R} fill={INK} />
            </g>
          </svg>
          {DAY_LABEL_F.map((f0, n) => (
            <Label
              key={`d${n}`}
              k={k}
              x={n * DAY_W + worldPx(16, K_REF)}
              y={worldPx(20, K_REF)}
              text={`DAY ${n + 1}`}
              inT={n === 0 ? 1 : labelIn(frame, f0)}
              size={LABEL_SIZE}
              align="left"
            />
          ))}
          {YEAR_LABEL_F.map((f0, n) => (
            <RightLabel
              key={`y${n}`}
              k={k}
              xRight={-TICK - worldPx(14, K_REF)}
              yMid={-(n + 1) * YEAR_H}
              text={n === 0 ? "1 YEAR" : `${n + 1} YEARS`}
              inT={labelIn(frame, f0)}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
      {/* The mark rides ABOVE the vignette, on the same world transform and the same global shadow: it climbs into
          the upper-right corner, where the vignette took it a shade under the leading dots (measured f105: brightest
          mark pixel 234,162,0 against a mid-column dot's 250,173,0). Above it, its fill is full ACCENT, so it stays
          the brightest orange in frame. */}
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g style={{ filter: iconShadow(k, 2, 3, 0.27) }}>
              <g transform={`translate(${m.x} ${m.y}) scale(${markSize / 24}) translate(-12 -12)`}>
                {OPENAI.paths.map((d, i) => (
                  <path key={i} d={d} fill={ACCENT} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default YearsInDays;
