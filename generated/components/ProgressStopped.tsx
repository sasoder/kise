import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  FLASH_DENSE,
  FLASH_DENSE_INK,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  RISE,
  backdropStyle,
  clamp01,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "if the progress in models stopped, the way we built products would change
// instantly" — SRT 0.000s -> 4.879s at 24fps.
export const DURATION = 117;

// ---------------------------------------------------------------------------
// How far ahead you dare draw
//
// The payoff noun in the line is *the way* — a method, not a product. So the
// piece has to show one manner of building and then a different one, and the
// switch has to be instant, because he says instant.
//
// The floor is the models, the same as the other cut in this edit. Standing on
// it is the one thing actually built; above that, drawn in outline, is the plan
// for what comes next. While models keep arriving the plan cannot survive: the
// builder draws two slots ahead, an arrival lands, the plan is invalidated back
// to nothing, and it starts again. Three times, and the third one is a floor
// that begins to arrive and then does not — which is the stop.
//
// After that, nothing wipes it. The plan climbs past the ceiling it could never
// get above before, and on "instantly" every slot fills at once. Committing to
// six pieces in one frame is the changed method; the floor never moves again.
//
// Same module as the other cut: every measurement here is a multiple of G.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11;

const UNIT_W = 6 * G; // 132
const UNIT_H = 2 * G; // 44
const ROW_PITCH = UNIT_H + G; // 66
const ROW_UNITS = 6;
const ROW_W = ROW_UNITS * UNIT_W + (ROW_UNITS - 1) * G; // 902

// One plan, so the slots are all one width — no taper. The stack in the other
// cut is a history and tapers; this is a single committed object and does not.
const SLOT_W = 10 * G; // 220, inside the 286 of the ground pair beneath it
const SLOT_H = 3 * G; // 66
const SLOT_PITCH = SLOT_H + G; // 88
const SLOTS = 7; // slot 0 is built; 1..6 are drawn
const slotInk = (k: number) => 0.76 + k * 0.033;

const MARK_SIZE = UNIT_W;
const MARK_GAP = 4 * G; // 88

const WORLD_W = 2400;
const WORLD_H = 3000;
const X0 = 1200;

const BASE_Y = 2300;
const N0 = 4;

// Three arrivals land; the fourth begins at 29 and is still coming in when the
// progress stops, so it retracts instead. The floor rising and then settling
// back is the stop — no rule drawn across the frame to announce it.
const ARRIVALS = [-6, 7, 19, 31];
const ABORT = 3;
const STOP = 33;
const SPREAD_T = 5;
const SPREAD_STAGGER = 0.7;
const LEAD = 7;

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));
// Ten frames, not seven: the fourth floor has to be caught visibly
// mid-arrival and then withdraw, or it reads as a row that appeared and
// vanished rather than one that was coming and did not.
const retract = (f: number) => 1 - clamp01((f - STOP) / 10);

const liftAt = (f: number) =>
  ARRIVALS.reduce(
    (a, t, m) =>
      a +
      ez(RISE, (f - t - 0.5 * SPREAD_STAGGER) / SPREAD_T) *
        (m === ABORT ? retract(f) : 1),
    0,
  );
const surfaceAt = (f: number) => BASE_Y - (N0 + liftAt(f)) * ROW_PITCH;

// The ceiling: the top of slot 3, measured against the floor as it stands once
// the arrivals are done. Three ahead is as far as the plan ever survived, and
// the rule runs to twice the plan's width so it reads as attached to it rather
// than as a stray line across the frame.
const FINAL_SURFACE = BASE_Y - (N0 + 3) * ROW_PITCH; // 1838
const CEILING_Y = FINAL_SURFACE - 3 * SLOT_PITCH - SLOT_H; // 1508
const CEILING_HALF = SLOT_W;

// How many slots are drawn, as a continuous number. The sawtooth is the whole
// first half: draw up two, an arrival lands, back to nothing, again. The dip at
// 29 is the plan starting to come apart for an arrival that never finishes,
// and 33 is where that reverses.
const REACH_F = [0, 6, 10, 18, 22, 31, 36, 46, 54, 66, 92, DURATION];
const REACH_K = [2.4, 3.1, 0.45, 3.05, 0.45, 2.6, 1.6, 3.0, 3.05, 4.2, 6, 6];

// Where the mark rides. Not the plan's top — the highest the plan has ever
// got, which only ever rises. The builder's reach does not retreat when the
// drawing is knocked down; the drawing collapses underneath it, which is both
// the better reading and the only way the framing survives a sawtooth.
const MARKR_F = [0, 8, 60, 92, DURATION];
const MARKR_K = [2.4, 3.1, 3.1, 6, 6];

const FILL_AT = 100; // "instantly"

const ANTHROPIC_D =
  "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z";

const barO = (age: number) =>
  interpolate(age, [1, 2, 3.5, 7], [0.4, 0.24, 0.15, 0.09], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const barH = (age: number) =>
  interpolate(age, [1, 4.5], [UNIT_H, G], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const unitX = (i: number) => X0 - ROW_W / 2 + i * (UNIT_W + G);
const rowY = (row: number) => BASE_Y - (row + 1) * ROW_PITCH;

// The ambient band along the live floor decelerates to a standstill from the
// stop onward, so the technology visibly stops moving rather than being
// declared stopped. Integrated, because the speed is what changes.
const driftPhase = (f: number) => {
  let s = 0;
  for (let i = 1; i <= f; i++) s += 11 * (1 - clamp01((i - STOP) / 15));
  return s;
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  planOpacity: z.number(),
  markOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "if the progress" · 19 "in models" · 33 "stopped" · 54 "the way we"
  //   68 "built products" · 85 "would change" · 100 "instantly" · 117 end
  beats: z.object({
    inModels: z.number().int(),
    stopped: z.number().int(),
    theWayWe: z.number().int(),
    builtProducts: z.number().int(),
    wouldChange: z.number().int(),
    instantly: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  planOpacity: 0.46,
  markOpacity: 0.88,
  beats: {
    inModels: 19,
    stopped: 33,
    theWayWe: 54,
    builtProducts: 68,
    wouldChange: 85,
    instantly: 100,
  },
});

const ProgressStopped: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  planOpacity,
  markOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // A small rise rather than the other cut's pull-back: the subject here is
  // how far up the frame the plan gets, so the camera follows it up and barely
  // widens at all.
  const CAM_F = [0, 16, 30, 46, 64, 82, DURATION];
  const CAM_K = [1.05, 1.04, 1.03, 0.98, 0.92, 0.9, 0.9];
  const CAM_CY = [1990, 1986, 1978, 1932, 1855, 1812, 1812];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  const stackY = surfaceAt(frame - 0.7);
  const slotBottom = (s: number) => stackY - s * SLOT_PITCH;

  const reach = interpolate(frame, REACH_F, REACH_K, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const fill = clamp01((frame - FILL_AT) / 2);
  const click = frame >= FILL_AT ? clamp01(1 - (frame - FILL_AT) / FLASH) : 0;

  // The mark sits above the top of whatever is currently drawn, so when the
  // plan is invalidated it pulls back down with it. In the last eight frames
  // before the fill it settles a little closer — the commitment, anticipated.
  const markReach = interpolate(frame, MARKR_F, MARKR_K, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const commit = interpolate(frame, [92, FILL_AT], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const markY =
    slotBottom(markReach) -
    SLOT_H -
    MARK_GAP -
    MARK_SIZE / 2 +
    commit +
    Math.sin(frame / 33) * 4;

  const ceilOpacity =
    interpolate(frame, [STOP, 46], [0, GROUND_O], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
    interpolate(reach, [2, 2.8], [0, GROUND_LIFT - GROUND_O], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
      clamp01((frame - 46) / 4);

  const driftX = X0 - 780 + (driftPhase(frame) % 1620);
  const liveIndex = N0 - 1 + liftAt(frame - 6);

  const rows: number[] = [];
  for (let j = 0; j < N0; j++) rows.push(j);
  ARRIVALS.forEach((t, m) => {
    if (frame >= t - LEAD && (m !== ABORT || retract(frame) > 0.01)) {
      rows.push(N0 + m);
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(
            frame,
            cy,
            k,
            CAM_CY[0],
            backgroundBlur,
            backgroundDim,
          )}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {rows.map((j) => {
              const m = j - N0;
              const arriving = m >= 0;
              const t = arriving ? ARRIVALS[m] : -100;
              const dying = m === ABORT ? retract(frame) : 1;
              const age = liveIndex - j;
              const fillO = interpolate(age, [0, 1.4], [0.95, 0.45], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const barMix = clamp01((age - 0.5) / 0.9);
              const bh = barH(age);
              const y = rowY(j);

              if (arriving && frame < t) {
                const lead = clamp01((frame - (t - LEAD)) / 5);
                return (
                  <rect
                    key={`lead-${j}`}
                    x={X0 - (ROW_W / 2) * lead}
                    y={y + (UNIT_H - GROUND_W) / 2}
                    width={ROW_W * lead}
                    height={GROUND_W}
                    fill={accent}
                    opacity={0.15 * lead}
                  />
                );
              }

              return (
                <g key={`row-${j}`}>
                  {barMix > 0.01 ? (
                    <rect
                      x={X0 - ROW_W / 2}
                      y={y + (UNIT_H - bh) / 2}
                      width={ROW_W}
                      height={bh}
                      rx={RX}
                      fill={accent}
                      opacity={barO(age) * barMix}
                    />
                  ) : null}
                  {barMix > 0.99
                    ? null
                    : Array.from({ length: ROW_UNITS }, (_, i) => {
                        const co = Math.abs(i - (ROW_UNITS - 1) / 2);
                        const age0 = frame - t - co * SPREAD_STAGGER;
                        const p =
                          (arriving ? ez(RISE, age0 / SPREAD_T) : 1) * dying;
                        if (p <= 0.005) return null;
                        const pa = clamp01(p * 2.2);
                        const cxu = unitX(i) + UNIT_W / 2;
                        const sx = 0.5 + 0.5 * p;

                        let paint = accent;
                        if (
                          arriving &&
                          dying >= 1 &&
                          age0 >= 0 &&
                          age0 < FLASH_DENSE + 1
                        ) {
                          paint = FLASH_DENSE_INK;
                        } else if (age < 1.2) {
                          const near = clamp01(
                            1 - Math.abs(cxu - driftX) / 300,
                          );
                          if (near > 0) {
                            paint = interpolateColors(
                              near * 0.34,
                              [0, 1],
                              [accent, FLASH_DENSE_INK],
                            );
                          }
                        }

                        return (
                          <rect
                            key={`u-${j}-${i}`}
                            x={cxu - (UNIT_W * sx) / 2}
                            y={y}
                            width={UNIT_W * sx}
                            height={UNIT_H}
                            rx={RX}
                            fill={paint}
                            opacity={fillO * pa * (1 - barMix)}
                          />
                        );
                      })}
                </g>
              );
            })}

            {/* As far ahead as the plan ever survived. It only appears once
                there is something to measure, and lifts when it is beaten. */}
            {ceilOpacity > 0.005 ? (
              <rect
                x={X0 - CEILING_HALF}
                y={CEILING_Y}
                width={CEILING_HALF * 2}
                height={GROUND_W}
                fill={ink}
                opacity={ceilOpacity}
              />
            ) : null}

            {Array.from({ length: SLOTS - 1 }, (_, idx) => {
              const s = idx + 1;
              const drawn = clamp01(reach - (s - 1));
              if (drawn <= 0.01 || fill >= 1) return null;
              const bottom = slotBottom(s) + 8 * (1 - drawn);
              return (
                <rect
                  key={`plan-${s}`}
                  x={X0 - SLOT_W / 2}
                  y={bottom - SLOT_H}
                  width={SLOT_W}
                  height={SLOT_H}
                  rx={RX}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5}
                  strokeDasharray={`${RX} ${RX}`}
                  opacity={planOpacity * drawn * (1 - fill)}
                />
              );
            })}

            {Array.from({ length: SLOTS }, (_, s) => {
              const solid = s === 0 ? 1 : fill;
              if (solid <= 0.01) return null;
              const rest = slotInk(s);
              return (
                <rect
                  key={`slot-${s}`}
                  x={X0 - SLOT_W / 2}
                  y={slotBottom(s) - SLOT_H}
                  width={SLOT_W}
                  height={SLOT_H}
                  rx={RX}
                  fill={ink}
                  opacity={(rest + (1 - rest) * click) * solid}
                />
              );
            })}

            <g
              transform={`translate(${X0} ${markY}) scale(${MARK_SIZE / 24}) translate(-12 -12)`}
              opacity={markOpacity}
            >
              <path d={ANTHROPIC_D} fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ProgressStopped;
