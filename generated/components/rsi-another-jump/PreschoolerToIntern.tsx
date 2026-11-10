// ---------------------------------------------------------------------------
// PreschoolerToIntern (rsi-another-jump, cut 15). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 104 frames.
//
// CHECK LINE: "over 2022 -> 2026 the AI grew, year by year, from a small child into a grown-up intern — the
// timeline shows the climb."
//
// THE LINE: "In the last four years, we've gone from basically a preschooler to a savant intern."
// WORD -> FRAME: In 0 · the 2 · last 4 · four 10 · years 16 · we've 28 · gone 32 · from 35 · basically 41 ·
//   a 53 · preschooler 59 · to 73 · a 77 · savant 81 · intern 89 (words.json, faster-whisper, slot-relative).
// DURATION: the slot 15.432 -> 19.770 s = 4.338 s x 23.976 = 104 frames (f0..f103).
//
// THE MOTION: one white timeline, 2022 -> 2026, draws head-led on "in the last four years" (f0-f36), each tick
// dropping and each year sliding up as the head reaches it, while the camera pulls back from k 1.3 on the
// 2022 end (a small deep-orange preschooler standing on the rule, topknot, backpack, a big juice box in hand) to
// the whole span (settled ~f50). From f40 ("basically") the figure walks right at constant speed and grows as
// it goes — age is its position on the rule, so it is exactly one quarter grown at 2023 — its head shrinking
// against a lengthening body, its tone ripening deep -> ACCENT, the juice box turning into a lidded coffee cup,
// the topknot sinking into the head, the backpack cross-fading out (f60-71) as an ID badge on a lanyard (f62-74)
// and a collar and tie (f67-78) cross-fade in (identityAt in the world);
// at every tick it leaves its height behind as a thin deep bar that comes out from behind its torso, so a
// rising staircase builds behind it. It stops on 2026 at f88 as a grown-up intern (settled before "intern"
// f89) and holds alive (breath, slow camera creep, grid drift) to f103.
// Orange = the AI, nothing else; white = structure, years, the drink and the badge.
//
// THE WALK (makeWalk): 2022 -> 2026 (760 world px) between f40 and f88, 18.5 px/frame at full speed with a 6-frame
// set-off and an 8-frame stop, 7 steps; the gait is tied to position, so planted feet never slip (measured: 0 px)
// and the child's short quick steps lengthen into the adult's stride as it grows. Constant speed, as briefed: the
// child therefore takes ~4-frame steps (a hurried little run) and the adult ~9-frame ones.
// CAUSE -> EFFECT (a height bar is uncovered by the torso walking off it): hip over 2022 f40 -> bar first visible
// f44, out f45 · 2023 f54 -> f55/f56 · 2024 f64 -> f65/f66 · 2025 f74 -> f76 · 2026: the intern stops on it at
// f88, so its bar stays hidden behind the figure (it exists for cut 21).
// CAMERA (CAM15 in the world): k 1.3 on the 2022 end -> k 1.0 on the whole span, keys f0-f38, settled ~f46; then a
// slow creep to k 1.02 to f103. Rule's screen y 948 -> 980 -> 982; year labels end at screen y <= 1056 on every
// frame (caption band starts 1080).
//
// SOURCES: the years only. ChatGPT (GPT-3.5) launched 30 Nov 2022; the essay is read in Nov 2026 — "the last
// four years" = 2022 -> 2026. No other figure on screen.
//
// THE WORLD is `timelineWorld.tsx` (shared with cut 21): yearX, the rule, the figure, the bars, CAM15.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  camEase,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  AiFigure,
  CAM15_CX0,
  CAM15_CY0,
  HeightBar,
  RULE_OVERHANG,
  TimelineRule,
  X_2022,
  YearLabels,
  cam15,
  figureHeight,
  figurePose,
  makeWalk,
  yearX,
} from "./timelineWorld";

export const FPS = 24000 / 1001;
export const DURATION = 104;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const YEARS = [2022, 2023, 2024, 2025, 2026];
const X0 = yearX(2022);
const X1 = yearX(2026);

// --- the rule ---------------------------------------------------------------
// Head-led from just past the child's toes at f0 to the overhang past 2026 at
// RULE_F1, eased in and out (a drawn line, not a marcher). Timed against the
// pull-back so the head stays inside the frame (its screen x peaks ~955 at f32)
// and every year lands on screen: 2023 f7, 2024 f13, 2025 f20, 2026 f29 (at
// screen x ~950, then carried in to ~880 by the camera).
const RULE_START = X_2022 - RULE_OVERHANG;
const HEAD_F0_X = X0 + 34;
const HEAD_END_X = X1 + RULE_OVERHANG;
const RULE_F1 = 36;
const headAt = (f: number) =>
  HEAD_F0_X + (HEAD_END_X - HEAD_F0_X) * camEase(f / RULE_F1, 0.75);
/** the (fractional) frame the head reaches x; a tick already passed at f0 is 0 */
const reachFrame = (x: number) => {
  if (x <= HEAD_F0_X) return 0;
  let lo = 0;
  let hi = RULE_F1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (headAt(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};
const tickFrame = (yr: number) => reachFrame(yearX(yr));

// --- the walk ---------------------------------------------------------------
const ageAt = (x: number) => clamp01((x - X0) / (X1 - X0));
const WALK = makeWalk({ x0: X0, x1: X1, f0: 40, f1: 88, easeIn: 6, easeOut: 8, ageAt });

const PreschoolerToIntern: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = cam15(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);

  const hipX = WALK.hipX(frame);
  const age = ageAt(hipX);
  const gait = WALK.gaitW(frame);
  const feet = WALK.feet(frame);
  const pose = figurePose({ x: hipX, age, feet, gait, breathT: frame });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM15_CY0}
        cx={cx}
        cxRest={CAM15_CX0}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {YEARS.map((yr) => (
              <HeightBar
                key={yr}
                id={`bar${yr}`}
                x={yearX(yr)}
                h={figureHeight(ageAt(yearX(yr)))}
                revealX={pose.backX}
              />
            ))}
            <TimelineRule
              k={k}
              frame={frame}
              x0={RULE_START}
              headX={headAt(frame)}
              years={YEARS}
              tickFrame={tickFrame}
            />
            <AiFigure id="ai" k={k} x={hipX} age={age} feet={feet} gait={gait} breathT={frame} />
          </svg>
          <YearLabels k={k} frame={frame} years={YEARS} tickFrame={tickFrame} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default PreschoolerToIntern;
