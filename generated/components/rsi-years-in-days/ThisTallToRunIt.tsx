// ---------------------------------------------------------------------------
// ThisTallToRunIt (rsi-years-in-days, cut 46). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 171 frames.
//
// CHECK LINE: "The 2028 AI is far taller than today's, and it still doesn't reach the bar for running a business
// on its own."
//
// THE LINE: "While the AIs of 2028 will be far more generally capable than the AIs of today, they might still not be
// able to autonomously run your business for you."
// WORD -> FRAME: While -2 · the 1 · AIs 5 · of 11 · 2028 13 · will 24 · be 31 · far 35 · more 39 · generally 43 ·
//   capable 51 · than 59 · the 69 · AIs 71 · of 78 · today 80 · they 90 · might 99 · still 103 · not 107 · be 110 ·
//   able 113 · to 116 · autonomously 122 · run 145 · your 150 · business 153 · for 159 · you 164 (the brief's table).
// DURATION: the slot 46.380 -> 53.512 s = 7.132 s x 23.976 = 171 frames (f0..f170).
//
// THE MOTION: the series timeline (rsi-another-jump): the orange intern (age 1, 490 world px, OpenAI-mark head)
// stands on 2026 and is already stepping off to the right at f0; its own height stays behind as an ACCENT_DEEP
// mark at 2026 (today), uncovered as the torso walks off it. It walks the DASHED (forecast) rule to 2028 at
// constant speed with planted feet and grows as it goes (age = position, most of the growth on "far more generally
// capable", f35-58) to 1.6x the intern; from 2026.5 it wears the marching dashed forecast contour. The camera pulls
// back and tracks right in one move (keys f0-66) so a white height gauge standing at 2028 (post, arm, sign "THIS
// TALL TO / RUN A BUSINESS") enters over the top-right edge; by ~f70 the frame holds today's short mark at the
// left and the tall 2028 figure under the gauge at the right. It stops under the arm at f84, its head well short
// of it, and glances up at the arm (f92-100). On "autonomously ... run" it rises on tiptoe (toes planted, heels
// up, straining tall: +66 world px, f118-138), holds there alive with one slow balance wobble (+/-3, f138-150) and
// still does not reach (gap ~132 -> ~69 world px); it sinks back f150-162. A slow push (k +9 %) about the
// head-to-arm gap runs f90-150; f160-170 settled and alive (breath, marching dashes, grid drift, creep). No fade.
// CAUSE -> EFFECT: the torso's back edge leaves the 2026 mark -> the mark is uncovered from behind it (f5 on);
//   the figure's hip passes 2026.5 -> the forecast contour starts at that x (a world-x wipe, f20 on).
// Orange = the AI, nothing else; white = the gauge, rule, labels; dashed = forecast (rule past 2026, contour).
//
// SOURCES: the years only (2026 = now, the essay is read Nov 2026; 2028 is the speaker's year). No other figure.
//
// THE WORLD is rsi-another-jump's timelineWorld.tsx + jumpWorld.tsx (imported read-only) plus tallWorld.tsx (the
// tiptoe pose and its drawing).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK, INK_HI, LABEL_TRACKING, LABEL_WEIGHT, Label, MARCH_PX_PER_F, worldPx } from "../kits/dwarkesh/alignShared";
import { H_INTERN, HeightBar, RULE_OVERHANG, RULE_Y, makeWalk, yearX } from "../rsi-another-jump/timelineWorld";
import { TallFigure, TallOutline, tallPose } from "./tallWorld";

export const FPS = 24000 / 1001;
export const DURATION = 171;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the resting zoom strokes and labels are sized for (the wide k 0.833 .. the push's 0.92) */
const K_REST = 0.87;
const SW = worldPx(6.5, K_REST); // the style's one weight: rule, ticks, post, arm, plate
const LABEL_SIZE = worldPx(48, K_REST);
const LABEL_DY = 34;
const TICK = 21;

// --- the axis ---------------------------------------------------------------------
const X26 = yearX(2026); // 860
const X28 = yearX(2028); // 1240
const SOLID_X0 = yearX(2023); // never in frame
const SOLID_END = X26 + RULE_OVERHANG;
const DASH_START = SOLID_END + SW * 2.2;
const DASH_END = yearX(2032);
const DASH_ON = 26;
const DASH_OFF = 16;
const FORECAST_X = yearX(2026.5);

// --- the walk ---------------------------------------------------------------------
const AGE_END = 2.1; // 1.605 x the intern: 786 world px
const WALK_F0 = -3; // already stepping off at f0
const WALK_F1 = 84;
/** age = position; most of the growth on "far more generally capable" (f35-58) */
const ageAt = (x: number) => {
  const u = clamp01((x - X26) / (X28 - X26));
  return 1 + (AGE_END - 1) * (0.12 * u + 0.88 * smoothstep((u - 0.36) / 0.46));
};
const WALK = makeWalk({ x0: X26, x1: X28, f0: WALK_F0, f1: WALK_F1, easeIn: 6, easeOut: 10, ageAt, steps: 4, liftFrac: 0.07 });
/** a label slides up as the walker's hip comes within this of its tick */
const LABEL_LEAD = 40;
const labelFrame = (yr: number) => {
  const x = yearX(yr) - LABEL_LEAD;
  let lo = WALK_F0;
  let hi = WALK_F1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (WALK.hipX(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};

// --- the tiptoe and the glance -------------------------------------------------------
// (director's revision) the rise is 66 world px at its peak, so the standing gap of ~132 closes to ~69 (breath included): up
// f118-138, a living hold f138-150 with one slow balance wobble (+/-3), down f150-162. The heels lift until the
// foot stands at most ~67 deg (44 px of the rise, toes planted); the rest is the body straining up, a vertical
// stretch about the ground line of < 3 %.
const RISE = 66;
const FOOT_RISE_MAX = 44;
const WOBBLE = 3;
const riseAt = (f: number) => {
  const base = RISE * smoothstep((f - 118) / 20) * (1 - smoothstep((f - 150) / 12));
  const u = clamp01((f - 138) / 12);
  // one slow cycle, up then down, enveloped so it joins the hold without a kink
  const wob = u > 0 && u < 1 ? WOBBLE * 1.3 * Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u) : 0;
  return base + wob;
};
const footRiseAt = (f: number) => (riseAt(f) * FOOT_RISE_MAX) / RISE;
/** the camera was keyed for the first pass's 40 px tiptoe; it stays exactly as approved */
const CAM_RISE = 40;
const lookAt = (f: number) => 0.9 * smoothstep((f - 92) / 8);

// --- the gauge ------------------------------------------------------------------------
const END_POSE = tallPose({ x: X28, age: AGE_END, feet: WALK.feet(WALK_F1), gait: 0, breathT: 0 });
const HEAD_TOP = END_POSE.top; // standing (breath moves it < 1 px)
export const GAP = 135; // head top -> the arm's underside, standing (world px)
const ARM_Y = HEAD_TOP - GAP - SW / 2;
const POST_X = 1462;
const ARM_X0 = 1090;
const PLATE = { x0: 1150, w: 650, h: 222, gap: 100 }; // gap: arm centre -> plate bottom
const PLATE_Y1 = ARM_Y - PLATE.gap;
const PLATE_Y0 = PLATE_Y1 - PLATE.h;
const SIGN_SIZE = worldPx(60, K_REST);
const SIGN_LINES = ["THIS TALL TO", "RUN A BUSINESS"];

// --- the camera -------------------------------------------------------------------------
// One key track (k, cx, and the rule's SCREEN y; cy is solved from them) through the kit damper.
// pull: f0-66 pull back and track right (k 1.30 -> 0.833) so the gauge enters and the frame holds 2026 and the gauge;
// push: f66-152 (warped late, most of it f90-140) k +9 % about the head-to-arm gap; creep to f170.
const GAP_Y = HEAD_TOP - GAP / 2 - CAM_RISE / 2; // the gap's middle around the tiptoe
const pushRuleY = (k: number, gapScreenY: number) => gapScreenY + (RULE_Y - GAP_Y) * k;
const CAM_KEYS = [
  { f: 0, k: 1.3, cx: 920, ry: 1150, warp: 1 },
  { f: 62, k: 0.833, cx: 1322, ry: 1195, warp: 0.62 },
  { f: 152, k: 0.912, cx: 1328, ry: pushRuleY(0.912, 470), warp: 1.35 },
  { f: 170, k: 0.918, cx: 1330, ry: pushRuleY(0.918, 471), warp: 1 },
];
const cyFor = (k: number, ry: number) => RULE_Y - (ry - 960) / k;
const CAM_TRACK = (() => {
  const K: number[] = [];
  const CX: number[] = [];
  const RY: number[] = [];
  for (let f = 0; f <= DURATION; f++) {
    let i = 0;
    while (i < CAM_KEYS.length - 2 && f > CAM_KEYS[i + 1].f) i++;
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    const u = camEase((f - a.f) / (b.f - a.f), b.warp);
    K.push(Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * u));
    CX.push(a.cx + (b.cx - a.cx) * u);
    RY.push(a.ry + (b.ry - a.ry) * u);
  }
  const out: { k: number; cx: number; cy: number }[] = [];
  let k = K[0];
  let cx = CX[0];
  let cy = cyFor(K[0], RY[0]);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    vk += (K[f] - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (CX[f] - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    const ty = cyFor(K[f], RY[f]);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();
export const camAt = (f: number) => CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];
const CX0 = CAM_TRACK[0].cx;
const CY0 = CAM_TRACK[0].cy;

/** the figure's pose at frame f (exported for the checks) */
export const poseAt = (frame: number) => {
  const walking = frame < WALK_F1;
  const hipX = WALK.hipX(frame);
  return tallPose({
    x: hipX,
    age: ageAt(hipX),
    feet: WALK.feet(Math.min(frame, WALK_F1)),
    gait: walking ? WALK.gaitW(frame) : 0,
    breathT: frame,
    rise: footRiseAt(frame),
    stretch: riseAt(frame) - footRiseAt(frame),
  });
};
export const GAUGE = { ARM_Y, SW, POST_X, ARM_X0, PLATE_Y0, PLATE_Y1 };

const ThisTallToRunIt: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const march = frame * MARCH_PX_PER_F;

  const pose = poseAt(frame);
  const ry = Math.round(RULE_Y) + 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CY0}
        cx={cx}
        cxRest={CX0}
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
            {/* today's height, left behind at 2026 */}
            <HeightBar id="bar26" x={X26} h={H_INTERN} revealX={pose.backX} />
            {/* the rule: solid to 2026, dashed (forecast) on */}
            <g style={{ filter: iconShadow(k) }}>
              <line x1={SOLID_X0} y1={ry} x2={SOLID_END} y2={ry} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              <line
                x1={DASH_START}
                y1={ry}
                x2={DASH_END}
                y2={ry}
                stroke={INK}
                strokeWidth={SW}
                strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                strokeDashoffset={-march}
              />
              {[2026, 2027, 2028].map((yr) => (
                <line key={yr} x1={yearX(yr)} y1={ry} x2={yearX(yr)} y2={ry + TICK} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              ))}
            </g>
            {/* the gauge: people's structure, all white, solid */}
            <g style={{ filter: iconShadow(k) }} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round">
              <line x1={POST_X} y1={RULE_Y} x2={POST_X} y2={PLATE_Y1} />
              <line x1={ARM_X0} y1={ARM_Y} x2={POST_X} y2={ARM_Y} />
              <path
                d={squirclePath(PLATE.w, PLATE.h)}
                transform={`translate(${PLATE.x0} ${PLATE_Y0})`}
                strokeLinejoin="round"
              />
            </g>
            <TallFigure k={k} pose={pose} toneT={1} look={lookAt(frame)} />
            <TallOutline id="aiF" k={k} pose={pose} march={march} clipX0={FORECAST_X} />
          </svg>
          {/* the sign's two lines */}
          <div
            style={{
              position: "absolute",
              left: PLATE.x0,
              top: PLATE_Y0,
              width: PLATE.w,
              height: PLATE.h,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_LABEL,
              fontWeight: LABEL_WEIGHT,
              fontSize: SIGN_SIZE,
              lineHeight: 1.08,
              letterSpacing: LABEL_TRACKING,
              textTransform: "uppercase",
              color: INK,
              whiteSpace: "nowrap",
              filter: iconShadow(k),
            }}
          >
            {SIGN_LINES.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          {/* years: 2026 is in; 2027 and 2028 slide up as the walker reaches them */}
          {[2026, 2027, 2028].map((yr) => (
            <Label
              key={yr}
              k={k}
              x={yearX(yr)}
              y={RULE_Y + LABEL_DY}
              text={String(yr)}
              inT={yr === 2026 ? 1 : smoothstep((frame - labelFrame(yr)) / 8)}
              size={LABEL_SIZE}
              opacity={INK_HI}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default ThisTallToRunIt;
