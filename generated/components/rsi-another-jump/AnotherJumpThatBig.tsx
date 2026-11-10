// ---------------------------------------------------------------------------
// AnotherJumpThatBig (rsi-another-jump, cut 21). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 152 frames.
//
// CHECK LINE: "take that same four-year climb again, starting in 2028, and the AI ends up a giant towering over
// every human — in the fields where answers can be checked."
//
// THE LINE (after "If you made another jump that big by" on the speaker): "starting in 2028, you'd probably get a
// mind which would be vastly superhuman in domains that are even slightly verifiable."
// WORD -> FRAME: starting 0 · in 7 · 2028 13 · you'd 29 · probably 32 · get 41 · a 47 · mind 49 · which 55 ·
//   would 62 · be 64 · vastly 68 · superhuman 79 · in 93 · domains 102 · that 108 · are 113 · even 116 ·
//   slightly 121 · verifiable 132 (words.json, faster-whisper, slot-relative).
// DURATION: the slot 21.521 -> 27.861 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION: f0 is cut 15's last frame, pixel for pixel (same world, camera, grid clock, sway, breath and planted
// feet; proven with a still-vs-still difference image, max 0). The camera travels right as the rule runs on past
// 2026 as a DASHED (forecast) line, 2027 and 2028 sliding up (2028 settled by f13). The five height marks of the
// 2022 -> 2026 climb lift off as a dashed copy (f2-6), are carried right and land on 2028 -> 2032 (f28), stretched
// so the copy's first mark is exactly the intern's height: the same climb, starting where the intern is (the intern
// is to the giant what the preschooler was to the intern, x2.22). From f16 the intern walks on along the dashed
// rule at constant speed and, from 2028, grows as it walks the copied staircase (age = its position, as in cut 15),
// a marching dashed contour round its solid body from the moment it steps past 2027; the camera pulls back (k 1.0 ->
// 0.758) so it stays framed whole, and the pan reveals three white adults of the intern's own height standing just
// past 2032, turned to face it. It stops at 2032 at f79 ("superhuman") as a giant 2.2x their height; they reach its
// hip. On "in domains ..." three white station rings draw on in the gaps of the staircase (a chip, a market chart,
// a flask; the ring's sweep uncovers the glyph). The AI's reach then runs along the GROUND: one orange thread leaves
// the giant's rear heel at f91 and runs head-led (white head, one constant speed, one ring gap per 11 frames) just
// above the rule, passing under each ring in turn, nearest first; each ring lights orange both ways from its bottom
// contact point and a white check writes itself above it, the last on "verifiable". f132-151 settled and alive:
// packets out and back along the ground thread, marching dashes, breath, camera creep, grid drift. No fade.
// CAUSE -> EFFECT: the thread's head touches a ring's bottom -> it lights and its check starts, same frame:
//   chip f104 (check done f110) · chart f115 (f121) · flask f126 (f132 "verifiable").
// CAMERA: one key track (k, cx, the rule's screen y) through the kit damper, started at rest on cut 15's resolved
//   camera; peak pan ~39 screen px/frame at f12. Year labels end at screen y <= 1068 on every frame. Settled
//   (f88-151): nothing readable within 62 px of either edge (measured on full-size stills).
// FORECAST TREATMENT: timelineWorld's own `dashed` AiFigure (hollow outline, dashed stick limbs) was rendered first
//   (a test render, since removed): the figure goes transparent, loses its cup and badge and the copy bar shows through
//   it, so it does not read as one solid figure. The build uses jumpWorld's ForecastOutline instead.
// Orange = the AI, nothing else; white = people, structure, years, the domains.
//
// SOURCES: the years only. "Another jump that big" = the 2022 -> 2026 jump of cut 15, starting 2028 -> 2032.
// No other figure on screen.
//
// THE WORLD is `timelineWorld.tsx` (cut 15's, imported, never edited) plus `jumpWorld.tsx` (this cut's additions).
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
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, Label, MARCH_PX_PER_F } from "../kits/dwarkesh/alignShared";
import {
  AiFigure,
  CAM15_CX0,
  CAM15_CY0,
  GROUND_Y,
  H_INTERN,
  HeightBar,
  RULE_OVERHANG,
  RULE_Y,
  STROKE_W,
  THREAD_W,
  TICK_LEN,
  TimelineRule,
  X_2022,
  YEAR_LABEL_DY,
  YEAR_LABEL_SIZE,
  ageForHeight,
  cam15,
  figureHeight,
  figurePose,
  makeWalk,
  yearX,
} from "./timelineWorld";
import {
  CheckMark,
  DashedBar,
  DomainStation,
  ForecastOutline,
  HumanFigure,
  ICON_CANDLES,
  ICON_CPU,
  ICON_FLASK,
  ReachThread,
} from "./jumpWorld";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- cut 15's resolved state (f103), asserted ---------------------------------------
const C15_LAST = 103;
const C15 = cam15(C15_LAST);
if (Math.abs(C15.k - 1.01964) > 2e-4 || Math.abs(C15.cx - 509.874) > 0.02 || Math.abs(C15.cy - 958.459) > 0.02) {
  throw new Error(`AnotherJumpThatBig: cut 15's resolved camera moved (${C15.k}, ${C15.cx}, ${C15.cy})`);
}
/** the one clock shared with cut 15: grid drift, sway and breath continue from its last frame */
const clock = (f: number) => C15_LAST + f;

// --- the axis -------------------------------------------------------------------------
const OLD_YEARS = [2022, 2023, 2024, 2025, 2026];
const NEW_YEARS = [2027, 2028, 2029, 2030, 2031, 2032];
const X26 = yearX(2026);
const X28 = yearX(2028);
const X32 = yearX(2032);
const SOLID_END = X26 + RULE_OVERHANG; // cut 15's rule ends here
const DASH_START = SOLID_END + STROKE_W * 2.2; // the forecast starts after a gap
const DASH_END = yearX(2034) + 100; // the rule runs on under the humans (no years past 2032)
const DASH_ON = 26;
const DASH_OFF = 16;
// the dashed rule's head: fast off the mark (there is an edit before it), easing out; 2028 at ~f4.5
const HEAD_F1 = 40;
const headAt = (f: number) => {
  const u = clamp01(f / HEAD_F1);
  return SOLID_END + (DASH_END - SOLID_END) * (1 - (1 - u) * (1 - u));
};
const reachFrame = (x: number) => {
  let lo = 0;
  let hi = HEAD_F1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (headAt(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};
const LABEL_IN_F = 7; // a forecast year slides up over 7 frames from the head reaching its tick
const tickFrame = (yr: number) => (yr <= 2026 ? -100 : reachFrame(yearX(yr)));

// --- the jump: cut 15's climb, copied ------------------------------------------------
/** the copy is stretched so its first mark is the intern: the intern is to the giant what the preschooler was to the intern */
const JUMP = H_INTERN / figureHeight(0); // 2.222
const OLD_H = OLD_YEARS.map((yr) => figureHeight((yr - 2022) / 4));
const GIANT_H = figureHeight(1) * JUMP; // 1088.9 world px
const AGE_G = ageForHeight(GIANT_H); // 3.22
const SHIFT = X28 - X_2022; // 6 years
const COPY_F0 = 2; // the copy starts to lift off its marks
const COPY_F1 = 28; // and lands on 2028-2032
const LIFT = 70;
const copyAt = (f: number) => {
  const u = clamp01((f - COPY_F0) / (COPY_F1 - COPY_F0));
  const travel = camEase(clamp01((u - 0.12) / 0.8), 0.9);
  const stretch = smoothstep(clamp01((u - 0.2) / 0.75));
  // up off the marks, across, down onto the rule
  const lift = LIFT * (u < 0.18 ? smoothstep(u / 0.18) : u > 0.82 ? smoothstep((1 - u) / 0.18) : 1);
  return { dx: SHIFT * travel, s: 1 + (JUMP - 1) * stretch, lift };
};

// --- the walk ------------------------------------------------------------------------
const WALK_F0 = 16;
const WALK_F1 = 79; // stopped at 2032 before "superhuman"
const ageAt = (x: number) => (x <= X28 ? 1 : 1 + (AGE_G - 1) * clamp01((x - X28) / (X32 - X28)));
const WALK = makeWalk({ x0: X26, x1: X32, f0: WALK_F0, f1: WALK_F1, easeIn: 6, easeOut: 8, ageAt });
// cut 15's walk ends with the near foot planted 3.64 px ahead of the hip (its own last step), where this walk
// starts with both feet under it: the near foot keeps cut 15's spot until its first swing, which absorbs it.
const C15_WALK = makeWalk({
  x0: yearX(2022),
  x1: X26,
  f0: 40,
  f1: 88,
  easeIn: 6,
  easeOut: 8,
  ageAt: (x) => clamp01((x - yearX(2022)) / (X26 - yearX(2022))),
});
const NEAR_OFF = C15_WALK.feet(C15_LAST).near.x - WALK.feet(0).near.x;
const feetAt = (f: number) => {
  const ft = WALK.feet(f);
  const phi = WALK.phase(f);
  const w = phi < 0.5 ? 1 : phi < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * ((phi - 0.5) / 0.5)) : 0;
  return { near: { x: ft.near.x + NEAR_OFF * w, lift: ft.near.lift }, far: ft.far };
};
/** the forecast contour shows right of this (the first forecast year) */
const FORECAST_X = yearX(2027);

// --- the humans ------------------------------------------------------------------------
// a short row of adults the intern's height, just past the giant's cup, turned to face it
const HUMANS = [2290, 2345, 2400];

// --- the domains -----------------------------------------------------------------------
const RING_R = 76;
const RING_SW = STROKE_W * 1.15;
/** the AI's reach runs along the ground, just above the rule; each ring stands with its bottom on that line */
const REACH_Y = GROUND_Y - 16;
const RING_CY = REACH_Y - RING_R;
// nearest the giant first; the thread's head passes under each ring's bottom on its `arrive` frame
const DOMAINS = [
  { id: "cpu", x: (yearX(2030) + yearX(2031)) / 2, icon: ICON_CPU, draw0: 84, arrive: 104 },
  { id: "mkt", x: (yearX(2029) + yearX(2030)) / 2, icon: ICON_CANDLES, draw0: 88, arrive: 115 },
  { id: "lab", x: (yearX(2028) + yearX(2029)) / 2, icon: ICON_FLASK, draw0: 92, arrive: 126 },
];
const RING_DRAW = 12;
/** the thread's head travels at one constant speed: one ring gap (190 world px) per 11 frames */
const REACH_V = (DOMAINS[0].x - DOMAINS[1].x) / (DOMAINS[1].arrive - DOMAINS[0].arrive);
const REACH_END = DOMAINS[2];
/** where the reach leaves the giant: just inside its rear heel, standing at 2032 (from f79 on) */
const GIANT_POSE = figurePose({ x: X32, age: AGE_G, feet: WALK.feet(WALK_F1), gait: 0 });
const HEEL = Math.min(GIANT_POSE.footFar.cx - GIANT_POSE.footFar.rx, GIANT_POSE.footNear.cx - GIANT_POSE.footNear.rx) + 10;
/** the frame the head leaves the heel, at the thread's one speed */
const REACH_F0 = DOMAINS[0].arrive - (HEEL - DOMAINS[0].x) / REACH_V;
const CHECK_SIZE = 70;
const CHECK_DY = 44; // above the ring, centred
const LIT_FROM = Math.PI / 2; // the ring lights from its bottom, where the ground thread touches it
const CHECK_F = 6;
const LIT_F = 8;

// --- the camera ----------------------------------------------------------------------------
// One key track (k, cx, and the rule's SCREEN y, so cy is solved from k and the year labels never reach the
// caption band) through the kit's damper, started at rest on cut 15's resolved camera. Move 1 (f0-22) pans to
// 2027-28 at k 1.0; move 2 (f12-84) carries on right and pulls back to frame the giant whole; a creep to f151.
const CAM = {
  m1: { f0: 0, f1: 20, k: 1.0, cx: 1120, ry: 990 },
  m2: { f0: 10, f1: 84, k: 0.758, cx: 1818, ry: 1004 },
  creep: { k: 0.752, cx: 1822, ry: 1006 },
};
const cyFor = (k: number, ry: number) => RULE_Y - (ry - 960) / k;
const CAM_TRACK = (() => {
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  const k0 = C15.k;
  const ry0 = 960 + (RULE_Y - C15.cy) * C15.k;
  for (let f = 0; f <= DURATION; f++) {
    const a = camEase((f - CAM.m1.f0) / (CAM.m1.f1 - CAM.m1.f0), 0.7);
    const b = camEase((f - CAM.m2.f0) / (CAM.m2.f1 - CAM.m2.f0), 0.85);
    const c = camEase((f - CAM.m2.f1) / (DURATION - CAM.m2.f1), 1);
    const lk =
      Math.log(k0) +
      (Math.log(CAM.m1.k) - Math.log(k0)) * a +
      (Math.log(CAM.m2.k) - Math.log(CAM.m1.k)) * b +
      (Math.log(CAM.creep.k) - Math.log(CAM.m2.k)) * c;
    const k = Math.exp(lk);
    const cx = C15.cx + (CAM.m1.cx - C15.cx) * a + (CAM.m2.cx - CAM.m1.cx) * b + (CAM.creep.cx - CAM.m2.cx) * c;
    const ry = ry0 + (CAM.m1.ry - ry0) * a + (CAM.m2.ry - CAM.m1.ry) * b + (CAM.creep.ry - CAM.m2.ry) * c;
    K.push(k);
    CX.push(cx);
    CY.push(cyFor(k, ry));
  }
  // the damper, run once for every frame
  const out: { k: number; cx: number; cy: number }[] = [];
  let k = C15.k;
  let cx = C15.cx;
  let cy = C15.cy;
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    vk += (K[f] - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (CX[f] - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (CY[f] - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();
export const camAt = (f: number) => CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];

const AnotherJumpThatBig: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(clock(frame));
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const march = clock(frame) * MARCH_PX_PER_F;

  // the figure
  const hipX = WALK.hipX(frame);
  const age = ageAt(hipX);
  const gait = WALK.gaitW(frame);
  const feet = feetAt(frame);
  const breathT = clock(frame);
  const pose = figurePose({ x: hipX, age, feet, gait, breathT });

  // the copy
  const cp = copyAt(frame);
  const copyOn = frame >= COPY_F0;

  // the dashed rule
  const headX = headAt(frame);
  const dashedRule =
    headX > DASH_START ? (
      <line
        x1={DASH_START}
        y1={Math.round(RULE_Y) + 0.5}
        x2={headX}
        y2={Math.round(RULE_Y) + 0.5}
        stroke={INK}
        strokeWidth={STROKE_W}
        strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
        strokeDashoffset={-march}
      />
    ) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={clock(frame)}
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
            {/* cut 15's height marks (the 2026 one stays hidden behind the intern until it walks off it) */}
            {OLD_YEARS.map((yr, i) => (
              <HeightBar key={yr} id={`bar${yr}`} x={yearX(yr)} h={OLD_H[i]} revealX={yr === 2026 ? pose.backX : Infinity} />
            ))}
            {/* the dashed copy of the climb */}
            {copyOn
              ? OLD_YEARS.map((yr, i) => (
                  <DashedBar
                    key={`c${yr}`}
                    x={yearX(yr) + cp.dx}
                    bottom={GROUND_Y - cp.lift}
                    h={OLD_H[i] * cp.s}
                    march={march}
                  />
                ))
              : null}
            <TimelineRule
              k={k}
              frame={frame}
              x0={X_2022 - RULE_OVERHANG}
              headX={SOLID_END}
              years={OLD_YEARS}
              tickFrame={() => -100}
            />
            <g style={{ filter: iconShadow(k) }}>
              {dashedRule}
              {NEW_YEARS.map((yr) => {
                const u = clamp01((frame - tickFrame(yr)) / 3);
                if (u <= 0) return null;
                const e = 1 - (1 - u) * (1 - u);
                const y = Math.round(RULE_Y) + 0.5;
                return (
                  <line
                    key={yr}
                    x1={yearX(yr)}
                    y1={y}
                    x2={yearX(yr)}
                    y2={y + TICK_LEN * e}
                    stroke={INK}
                    strokeWidth={STROKE_W}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
            {/* the humans */}
            {HUMANS.map((x, i) => (
              <HumanFigure key={i} k={k} x={x} breathT={clock(frame) + i * 23} facing={-1} />
            ))}
            {/* the AI's reach: one thread from the giant's heel along the ground, under each ring in turn */}
            {(() => {
              if (frame < REACH_F0) return null;
              const heel = HEEL;
              const xh = DOMAINS[0].x - REACH_V * (frame - DOMAINS[0].arrive); // the head, if unclamped
              const pr = clamp01((heel - xh) / (heel - REACH_END.x));
              return (
                <ReachThread
                  k={k}
                  frame={frame}
                  p0={{ x: heel, y: REACH_Y }}
                  p1={{ x: (heel + REACH_END.x) / 2, y: REACH_Y }}
                  p2={{ x: REACH_END.x, y: REACH_Y }}
                  progress={pr}
                  width={THREAD_W * 1.25}
                  packetR={THREAD_W * 1.2}
                  period={16}
                  speed={22}
                  phase={REACH_END.arrive}
                />
              );
            })()}
            <AiFigure id="ai" k={k} x={hipX} age={age} feet={feet} gait={gait} breathT={breathT} />
            <ForecastOutline id="aiF" k={k} pose={pose} march={march} clipX0={FORECAST_X} />
            {/* the domains, at the giant's feet */}
            {DOMAINS.map((d) => {
              return (
                <g key={d.id}>
                  <DomainStation
                    id={d.id}
                    k={k}
                    x={d.x}
                    y={RING_CY}
                    r={RING_R}
                    icon={d.icon}
                    draw={(frame - d.draw0) / RING_DRAW}
                    lit={smoothstep((frame - d.arrive) / LIT_F)}
                    litFrom={LIT_FROM}
                    sw={RING_SW}
                  />
                  <CheckMark
                    k={k}
                    x={d.x}
                    y={RING_CY - RING_R - CHECK_DY}
                    size={CHECK_SIZE}
                    progress={(frame - d.arrive) / CHECK_F}
                    sw={RING_SW * 1.15}
                  />
                </g>
              );
            })}
          </svg>
          {/* year labels: cut 15's five (already in), then the forecast years as the head reaches them */}
          {[...OLD_YEARS, ...NEW_YEARS].map((yr) => (
            <Label
              key={yr}
              k={k}
              x={yearX(yr)}
              y={RULE_Y + YEAR_LABEL_DY}
              text={String(yr)}
              inT={yr <= 2026 ? 1 : smoothstep((frame - tickFrame(yr)) / LABEL_IN_F)}
              size={YEAR_LABEL_SIZE}
              opacity={INK_HI}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default AnotherJumpThatBig;
