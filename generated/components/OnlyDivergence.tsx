import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { PaperTop, sway } from "./cortesShared";
import { hash } from "./fieldShared";
import {
  ARROW,
  ARROWS,
  CENTURY,
  DURATION as MOTION_DURATION,
  FPS as MOTION_FPS,
  H,
  N_CENT,
  PIVOT_Y,
  T,
  TICK_FIRST,
  TICK_LAST,
  W,
  W1,
  X_END,
  X_FORK,
  Y_AXIS,
  Y_BRANCH,
  branchW,
  branchY,
  BREAK_BACK,
  breakFrameAt,
  breakTip,
  cam,
  clamp01,
  frameAt,
  headX,
  smoothstep,
} from "./onlyDivergenceMotion";

// ---------------------------------------------------------------------------
// OnlyDivergence — cut C of "Sheppard_Vikings" (Dwarkesh with Si Sheppard),
// Dwarkesh map style, "beyond maps" page: no map, an engraved timeline on the
// same umber paper. NO text and NO numbers anywhere in this cut.
//
// THE LINE: "(To go further back in time, I think the) ONLY DIVERGENCE THAT
//   WOULD HAVE GIVEN PRE-COLUMBIAN PEOPLES A REAL LONG-TERM CHANCE TO HOLD
//   OFF THE EUROPEANS."   (next, on camera: "If we reverse the clock another
//   500 years back to Leif Erikson and the Norse in Greenland…")
//
// IN 25.692 s (seq f616), OUT 31.490 s (seq f755): 139 frames + 2 tail frames
// that hold the last state = DURATION 141, 24 fps. Local word onsets:
//   only -1 · divergence 6-19 · that 19 · would 30 · have 36 · given 40 ·
//   pre 50 · -Columbian 60 · peoples 68 · a 76 · real 86 · long 92 ·
//   -term 99 · chance 105 · to 112 · hold 116 · off 121 · the 123 ·
//   Europeans 126-134 · (If 134)
//
// THE IDEA: time is an axis; a divergence is a fork in it. The cream rule is
// the history that happened; the orange branch is the history a transfer
// would have made (the clip's one accent: orange = WHAT IS PASSED ON). The
// 500 years are five century ticks (the speaker's "another 500 years back":
// c. 1000, Leif Erikson, to c. 1500, the conquistadors). Nothing is labelled.
//
// ELEMENT TYPES (four): cream axis (double rule + its graduations), century
// ticks, orange branch, cream arrowheads.
//
// THE GESTURES, each with the word it serves (nothing else moves):
//   1. f0 OPENING: the camera is already gliding right along the left part of
//      the axis; the heavy cream rule and its century ticks cross the frame.
//                                                        — "(back in time)"
//   2. f3-23 THE FORK: at a tick near screen centre an orange line peels up
//      off the cream rule on a railway-switch curve (330 px) and runs on,
//      parallel.                                    — "only divergence" f6-19
//   3. f22-113 THE 500 YEARS: one long eased travel to the right; the orange
//      head grows through exactly five century ticks (it reaches them on
//      f17, 30, 54, 79, 112) and gains weight continuously, 10 px -> 24 px. A
//      short orange tick rises on the branch as the head passes each century.
//      Under the branch the cream rule drops to the lower ink rung where the
//      head has passed (the front is the head itself, never a timer).
//        — "that would have given pre-Columbian peoples a real long-term
//           chance" f19-112 ("long-term" f92-105 = the length already run)
//   4. f113-120 THE CAP: the branch ends blunt on the fifth tick; its cap
//      rises as the head arrives.                               — "to hold"
//   5. f100-134 THE EUROPEANS: two fronts of three cream march arrows (one
//      family: solid barbed head, concave back, shaft tapering to nothing)
//      come in from the right as the camera arrives. The front on the
//      branch's line slows and stops a clear gap short of the cap (leader
//      f122; the stand-off sits on x 540). The front on the cream rule runs
//      it through: behind the leading head, and nowhere else, the rule
//      crumbles (pieces drift down and apart and fade as they age).
//                         — "to hold off the Europeans" f112-134 (Eur. f126)
//   6. f132-141 HANDOFF: slow creep in (k 1.024 -> 1.04); the branch holds;
//      one faint highlight travels along it (from f124); the front on the
//      cream rule is still pressing on at ~3 px/frame.
//   Camera: its own keyed pchip track (onlyDivergenceMotion.CX / LK), one
//   travel, peak 20 screen px/frame, never at rest; plus the house sway. The
//   paper is in world space and moves with it.
//
// SOURCES: no data is drawn beyond the five centuries. Leif Erikson's voyage
// c. 1000 (Grœnlendinga saga, Eiríks saga rauða); L'Anse aux Meadows occupied
// in AD 1021 (Kuitems et al., Nature 601, 2022); Columbus 1492, Cortés 1519.
// ---------------------------------------------------------------------------

export const FPS = MOTION_FPS;
export const DURATION = MOTION_DURATION;

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADE = "#140F0A";
const HILITE = "#FFE3A6";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
  grain: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_3840x2160_flat.png",
  vignette: 0.5,
  grain: 0.55,
});

// ---- the page: the 3840x2160 umber land backdrop, in world space -----------
const PAGE = { x: 0, y: -120, w: 3840, h: 2160 };

// ---- the axis ---------------------------------------------------------------
const AX_L = PAGE.x - 100;
const AX_R = PAGE.x + PAGE.w + 100;
const RULE = 10; // the heavy rule
const HAIR = 3; // its fine companion
const HAIR_DY = 22;
const TICK = { w: 8, up: 95, down: 55 }; // century tick: 150 px tall
const GRAD = 30; // a graduation every decade, inside the double rule
const BAND = { y: Y_AXIS - 160, h: 320 };
const TICKS = Array.from({ length: TICK_LAST - TICK_FIRST + 1 }, (_, i) => X_FORK + (TICK_FIRST + i) * CENTURY);
const GRADS_D = (() => {
  let d = "";
  for (let x = Math.ceil(AX_L / GRAD) * GRAD; x <= AX_R; x += GRAD) d += `M${x},${Y_AXIS + RULE / 2}V${Y_AXIS + HAIR_DY}`;
  return d;
})();
const TICKS_D = TICKS.map((x) => `M${x},${Y_AXIS - TICK.up}V${Y_AXIS + TICK.down}`).join("");
const DIM = 0.58; // 0.94 * 0.58 = the lower rung (~0.55)
const DIM_RAMP = 170;

// where the Europeans have passed, the rule is in pieces: fixed world slots,
// each piece ages from the frame the front passed it
const PIECE = { len: 24, pitch: 40, age: 26 };
const PIECES = (() => {
  const out: { x: number; i: number }[] = [];
  for (let x = X_END - 400, i = 0; x < AX_R; x += PIECE.pitch, i++) out.push({ x, i });
  return out;
})();

// ---- the branch -------------------------------------------------------------
const STEP = 6;
const branchPolygon = (head: number) => {
  const up: string[] = [];
  const down: string[] = [];
  const n = Math.max(1, Math.ceil((head - X_FORK) / STEP));
  for (let i = 0; i <= n; i++) {
    const x = X_FORK + ((head - X_FORK) * i) / n;
    const y = branchY(x);
    const dy = branchY(x + 0.5) - branchY(x - 0.5);
    const len = Math.hypot(1, dy);
    const hw = branchW(x) / 2;
    const nx = -dy / len;
    const ny = 1 / len;
    up.push(`${(x - nx * hw).toFixed(2)},${(y - ny * hw).toFixed(2)}`);
    down.push(`${(x + nx * hw).toFixed(2)},${(y + ny * hw).toFixed(2)}`);
  }
  return `M${up.join("L")}L${down.reverse().join("L")}Z`;
};
// a short tick on the branch at each century it passes; the fifth is its cap
const BRANCH_TICKS = Array.from({ length: N_CENT }, (_, i) => {
  const x = X_FORK + (i + 1) * CENTURY;
  const last = i === N_CENT - 1;
  return { x, y: branchY(x), f: frameAt(x), half: last ? 100 : 52, w: last ? W1 : Math.max(8, branchW(x) * 0.6), last };
});

// a period march arrow: solid barbed head, concave back, shaft tapering to nothing
const A = ARROW;
const ARROW_D =
  `M0,0L${A.barb},${-A.half}Q${A.neck + 2},${-A.half * 0.42} ${A.neck},${-A.shaft}L${A.len},0` +
  `L${A.neck},${A.shaft}Q${A.neck + 2},${A.half * 0.42} ${A.barb},${A.half}Z`;

const OnlyDivergence: React.FC<Props> = ({ ink, accent, backdropSrc, vignette, grain }) => {
  const frame = useCurrentFrame();

  const c = cam(frame);
  const drift = sway(frame);
  const tx = W / 2 - c.cx * c.k + drift.dx * 0.6;
  const ty = PIVOT_Y - PIVOT_Y * c.k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${c.k.toFixed(5)})`;

  const head = headX(frame);
  const branchOn = head - X_FORK > 0.5;
  const bx = breakTip(frame) + BREAK_BACK; // the rule is whole to the left of this

  // the rule under the branch recedes where the head has passed
  const span = Math.max(1, head - X_FORK);
  const r = Math.min(DIM_RAMP, span / 2);
  const depth = 1 - (1 - DIM) * (r / DIM_RAMP);
  const grey = (v: number) => {
    const g = Math.round(255 * v);
    return `rgb(${g},${g},${g})`;
  };

  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shX = X_END - 520 + 500 * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.5;

  // a broken piece: how far it has aged since the front passed world x
  const aged = (x: number) => {
    const f0 = breakFrameAt(x, frame);
    return f0 === Infinity ? -1 : smoothstep((frame - f0) / PIECE.age);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the paper, world space: it moves with the camera */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${c.k})`,
        }}
      >
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h }} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="odDimGrad" gradientUnits="userSpaceOnUse" x1={X_FORK} y1={0} x2={X_FORK + span} y2={0}>
            <stop offset={0} stopColor="#fff" />
            <stop offset={r / span} stopColor={grey(depth)} />
            <stop offset={1 - r / span} stopColor={grey(depth)} />
            <stop offset={1} stopColor="#fff" />
          </linearGradient>
          <mask id="odDim" maskUnits="userSpaceOnUse" x={AX_L} y={BAND.y} width={AX_R - AX_L} height={BAND.h}>
            <rect x={AX_L} y={BAND.y} width={AX_R - AX_L} height={BAND.h} fill="url(#odDimGrad)" />
          </mask>
          <clipPath id="odIntact">
            <rect x={AX_L} y={BAND.y} width={Math.max(0, bx - AX_L)} height={BAND.h} />
          </clipPath>
        </defs>

        <g transform={camT}>
          {/* the history that happened: an engraved double rule with century ticks */}
          <g clipPath="url(#odIntact)">
            <g mask="url(#odDim)">
              <line x1={AX_L} y1={Y_AXIS} x2={AX_R} y2={Y_AXIS} stroke={SHADE} strokeOpacity={0.5} strokeWidth={RULE + 5} />
              <path d={TICKS_D} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={TICK.w + 4.5} />
              <g opacity={0.94}>
                <path d={GRADS_D} fill="none" stroke={ink} strokeOpacity={0.6} strokeWidth={2.4} />
                <line x1={AX_L} y1={Y_AXIS + HAIR_DY} x2={AX_R} y2={Y_AXIS + HAIR_DY} stroke={ink} strokeWidth={HAIR} />
                <line x1={AX_L} y1={Y_AXIS} x2={AX_R} y2={Y_AXIS} stroke={ink} strokeWidth={RULE} />
                <path d={TICKS_D} fill="none" stroke={ink} strokeWidth={TICK.w} />
              </g>
            </g>
          </g>
          {/* where the Europeans have passed: the rule crumbles; pieces drift down and apart and fade with age */}
          {PIECES.map(({ x, i }) => {
            const a = aged(x);
            if (a < 0) return null;
            const dy = a * (5 + 17 * hash(i, 1));
            const dx = a * (hash(i, 2) - 0.5) * 16;
            const rot = a * (hash(i, 3) - 0.5) * 30;
            const op = 0.7 - 0.3 * a;
            const cx = x + PIECE.len / 2;
            return (
              <g key={`pc-${i}`} transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${cx} ${Y_AXIS})`} opacity={op}>
                <line x1={x} y1={Y_AXIS} x2={x + PIECE.len} y2={Y_AXIS} stroke={ink} strokeWidth={RULE} />
                <line
                  x1={x + 3}
                  y1={Y_AXIS + HAIR_DY + a * 9 * hash(i, 4)}
                  x2={x + PIECE.len - 5}
                  y2={Y_AXIS + HAIR_DY + a * 9 * hash(i, 5)}
                  stroke={ink}
                  strokeOpacity={0.7}
                  strokeWidth={HAIR}
                />
              </g>
            );
          })}
          {TICKS.map((x, i) => {
            const a = aged(x);
            if (a < 0) return null;
            const rot = a * (hash(i, 7) - 0.5) * 16;
            return (
              <g key={`bt-${x}`} transform={`translate(0 ${(a * 12).toFixed(2)}) rotate(${rot.toFixed(2)} ${x} ${Y_AXIS})`} opacity={0.7 - 0.3 * a}>
                <line x1={x} y1={Y_AXIS - TICK.up} x2={x} y2={Y_AXIS - 22} stroke={ink} strokeWidth={TICK.w} />
                <line x1={x} y1={Y_AXIS + 22 + a * 8} x2={x} y2={Y_AXIS + TICK.down + a * 8} stroke={ink} strokeWidth={TICK.w} />
              </g>
            );
          })}

          {/* the branch: what a transfer would have made */}
          {branchOn ? (
            <>
              <path d={branchPolygon(head)} fill={SHADE} fillOpacity={0.5} stroke={SHADE} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />
              {BRANCH_TICKS.map((t) => {
                const g = smoothstep((frame - t.f) / (t.last ? 8 : 7));
                if (g <= 0) return null;
                return (
                  <g key={`brt-${t.x}`}>
                    <line x1={t.x} y1={t.y - t.half * g} x2={t.x} y2={t.y + t.half * g} stroke={SHADE} strokeOpacity={0.5} strokeWidth={t.w + 5} />
                    <line x1={t.x} y1={t.y - t.half * g} x2={t.x} y2={t.y + t.half * g} stroke={accent} strokeWidth={t.w} />
                  </g>
                );
              })}
              <path d={branchPolygon(head)} fill={accent} />
            </>
          ) : null}
          {shOp > 0.01
            ? [
                [130, 0.3],
                [66, 0.5],
                [24, 0.75],
              ].map(([len, o]) => (
                <line
                  key={`sh-${len}`}
                  x1={shX - len / 2}
                  y1={Y_BRANCH}
                  x2={Math.min(X_END - 14, shX + len / 2)}
                  y2={Y_BRANCH}
                  stroke={HILITE}
                  strokeOpacity={o * shOp}
                  strokeWidth={9}
                  strokeLinecap="round"
                />
              ))
            : null}

          {/* the Europeans */}
          {ARROWS.map((a, i) => (
            <g key={`ar-${i}`} transform={`translate(${a.tip(frame).toFixed(2)} ${a.y})`}>
              <path d={ARROW_D} fill="none" stroke={SHADE} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />
              <path d={ARROW_D} fill={ink} fillOpacity={0.94} />
            </g>
          ))}
        </g>
      </svg>

      <PaperTop vignette={vignette} grainOpacity={grain} />
    </AbsoluteFill>
  );
};

export default OnlyDivergence;
