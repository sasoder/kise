// ---------------------------------------------------------------------------
// ThreeFactoriesEveryMonth (skyroot-trailer, cut 38), v4. Core Memory podcast style, the ARCHIVE COLLAGE at 16:9
// (on ./skyrootShared over mikkelShared / nealShared). Opaque 2048x1080, 23.976 fps, 97 frames; finals --scale 2.
//
// CHECK LINE: Skyroot's three factories are one pulse line: a Vikram-1 is built up part by part as it steps through
// the three halls, and every month a finished rocket steps out and joins a growing row.
//
// THE LINE: "Today we have three factories which can build one orbital rocket every month."
// WORD -> FRAME: Today 0 · we 5 · have 8 · three 11 · factories 15 · which 25 · can 34 · build 40 · one 47 ·
//   orbital 61 · rocket 69 · every 76 · month 81 · speech ends ~89. The edit returns to the speaker at f97.
// DURATION: the slot 38.747 -> 42.793 s (sequence f929-f1026) = 4.046 s x 23.976 = 97 frames (f0..f96).
//
// THE PICTURE (v4: the user wants the rocket "split in multiple parts ... on a line, like an assembly line, getting
// built", and the row of finished rockets that "shows the scale"; no caption bands, the whole frame). Three tall
// CUTAWAY halls side by side (white outline frame, saw-tooth roof, the interior the light paper), one floor rail
// running through all three and on out of frame both ways, a crane rail along the eave truss inside them. Each rocket is built UPRIGHT on a shuttle: stage 1 (Kalam-1200)
// stands on it, and the rest of its parts hang above it as an exploded column on one thin crane line from the
// overhead rail (stage 2 Kalam-250, stage 3 Kalam-100, the Raman upper stage, the fairing; sliced off skyrootShared's
// VIKRAM1 at the joints in the photo, bake-vikram1-parts.py). The column arrives with its shuttle from off-frame right
// along the open rail (no frame or roof over the in-feed: exactly three halls), its line running up out of frame.
// In each hall the lowest gap closes, one ease per part as it seats (the parts above ride down with it): hall 1
// stage 2 onto stage 1; hall 2 stage 3, then the upper stage; hall 3 the fairing caps it and the line reels up.
// THE PULSE: every PULSE = 16 frames (the month beat) every shuttle advances one station together (MOVE = 8 f,
// constant speed with an ease only at the stops), the row included: the finished rocket steps out of hall 3 into the
// first slot and the row steps left, so the row grows by one rocket a pulse, nothing passes anything, and JAN (the
// first out) leads at the left. Each month's label rises under its rocket as it lands and travels with it.
// Arrivals in the row: JAN f1, FEB 17, MAR 33, APR 49, MAY 65 ("orbital rocket"), JUN 81 ("month"). From f89 the
// next pulse is under way (JUL steps out at f97): the end frame is living.
// FLOW RIGHT TO LEFT (DIR -1, director's OK): the row reads JAN ... JUN left to right and grows away from the halls.
// CAMERA: opens on the three halls (k 1.35, all three in shot from f0), one move (smootherstep f3-80) pulling back
// and left as the row grows, resolving at f80 on the whole line (k ~1.01: rockets ~425 px, halls ~640 px, the
// roofs from y ~180, the rail at y ~835); then a slow drift left with the row.
// CHAIN: none in this cut.
//
// FACTS (FACTS.txt item 5): "three factories ... one orbital rocket every month" is the speaker's (the CEO's) claim.
// Skyroot publicly lists two facilities (Max-Q headquarters and the Infinity Campus, Hyderabad); "one orbital rocket
// every month" is reported as the Infinity Campus design capacity (Business Today, 27 Nov 2025), not demonstrated
// output. Director's call: draw what the speaker says, three identical drawn halls (not a photo of one real
// building), and the picture reads "can build" (a capacity line). The count is flagged in the hand-off. No numbers,
// no year, no "per month" on screen: the month labels are the unit.
// ILLUSTRATIVE: the upright stacking under a crane is illustrative; Vikram-1 is really integrated lying horizontally on
// carriers (Skyroot's factory-floor photo). The split of the work across the three halls is illustrative too.
//
// SOURCES: Vikram-1 parts = skyrootShared VIKRAM1 (vikram1.png: the real Vikram-1 on the First Launch Pad,
// SDSC-SHAR, July 2026, ISRO, GODL-India) sliced at its stage joints (scripts/clips/skyroot-trailer/
// bake-vikram1-parts.py -> public/skyroot-trailer/vikram1_part_*.png). Halls, rails, shuttles and crane lines drawn
// here. No figures on screen. Checks: scripts/clips/skyroot-trailer/check-three-factories.ts.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  INK,
  Inked,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  SKYROOT_FILTER,
  ShadowText,
  SkyrootCam,
  SkyrootFilmLife,
  SkyrootPaper,
  SkyrootPlane,
  SkyrootSvg,
  VIKRAM1,
  textRise,
} from "./skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 97;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// -- the vehicle: five parts off the VIKRAM1 cut-out ------------------------------------------------------------------
/** Nose to base, world px (~425 px on screen in the resolved frame). */
export const ROCKET_H = 420;
const PH = ROCKET_H / (VIKRAM1.baseY - VIKRAM1.noseY); // the PNG's height
const PW = (PH * VIKRAM1.w) / VIKRAM1.h; // the PNG's width
const AXIS = VIKRAM1.axisX * PW;
const ROW = PH / VIKRAM1.h; // world px per src row
const BASE_ROW = VIKRAM1.baseY * VIKRAM1.h;
export const BODY_W = VIKRAM1.bodyW * PW;
/** The parts, base first: src rows [top, bottom) of each slice (bake-vikram1-parts.py) and its joint row (its base). */
const PARTS = [
  { name: "stage1", top: 1259, bottom: 2412, joint: BASE_ROW },
  { name: "stage2", top: 749, bottom: 1260, joint: 1260 },
  { name: "stage3", top: 578, bottom: 750, joint: 750 },
  { name: "upper", top: 338, bottom: 579, joint: 579 },
  { name: "fairing", top: 0, bottom: 339, joint: 339 },
] as const;
/** Each part's seated height of its base (joint) above the rocket's base, world px. */
export const PART_A = PARTS.map((p) => (BASE_ROW - p.joint) * ROW);
/** The exploded gap under each hanging part. */
export const GAP = 36;

// -- the world (plane px) ---------------------------------------------------------------------------------------------------
export const RAIL_Y = 830; // the floor rail's top
const RAIL_H = STROKE + 2;
const SHUTTLE_W = 64;
export const SHUTTLE_H = 12;
/** The rockets' base (on the shuttle). */
export const BASE_Y = RAIL_Y - SHUTTLE_H;
/** Station pitch: hall to hall, and slot to slot in the row. */
export const PITCH = 200;
/** Station 0 (the in-feed, right of hall 1); station s is s PITCHes downstream (left); halls are stations 1-3. */
const X_IN = 1950;
export const stationX = (s: number) => X_IN - s * PITCH;
/** The halls stand wall to wall (one shared post between neighbours): hall h spans stationX(h) +- PITCH / 2. */
export const HALL_W = PITCH;
export const HALL_EAVES = 604; // the eave truss above the rail; the crane rail runs along it
const TOOTH_H = 40;
const TEETH = 2;
const POST_W = 10;
/** The crane rail = the eave truss; a full exploded column (rocket + 4 gaps + shuttle = 576) hangs clear under it. */
export const OVH = HALL_EAVES;
export const OVH_Y = RAIL_Y - OVH;
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"] as const;
const LABEL_SIZE = 52; // Barlow 900, cap ~36
export const LABEL_Y = RAIL_Y + RAIL_H + 56; // baseline

// -- the pulse ------------------------------------------------------------------------------------------------------------
export const PULSE = 16; // frames: the month beat
export const MOVE = 8; // frames of each pulse the line moves; the rest it works
const RAMP = 3; // frames of ease at each end of a move (velocity smoothstep); constant speed between
/** Move m runs [MOVE_0 + m PULSE, + MOVE]; move 0 brings JAN out to the first slot at f1. */
const MOVE_0 = 1 - MOVE;
export const V = PITCH / (MOVE - RAMP); // world px / frame at full speed (40)
/** Fraction of a move done after t frames of it (trapezoid velocity, smoothstep ramps). */
const moveFrac = (t: number) => {
  if (t <= 0) return 0;
  if (t >= MOVE) return 1;
  const ramp = (u: number) => u * u * u * (1 - u / 2); // distance in an accelerating smoothstep ramp, unit speed x RAMP
  const vmax = 1 / (MOVE - RAMP);
  if (t < RAMP) return vmax * RAMP * ramp(t / RAMP);
  if (t > MOVE - RAMP) return 1 - vmax * RAMP * ramp((MOVE - t) / RAMP);
  return vmax * (RAMP / 2 + (t - RAMP));
};
/** Moves done at frame f (fractional during a move); 1 after move 0. */
export const movesAt = (f: number) => {
  const m = Math.floor((f - MOVE_0) / PULSE);
  return m + moveFrac(f - MOVE_0 - m * PULSE);
};
/** Rocket n's station at frame f (n = 0 JAN reaches the first slot, station 4, after move 0). */
export const stationOf = (n: number, f: number) => 3 + movesAt(f) - n;
export const rocketX = (n: number, f: number) => stationX(stationOf(n, f));
/** The frame rocket n lands in the row's first slot (end of move n). */
export const arriveAt = (n: number) => MOVE_0 + n * PULSE + MOVE;
/** The start of the dwell in which rocket n is in hall h (1..3). */
const dwellIn = (n: number, h: number) => arriveAt(n) - (4 - h) * PULSE;

const smoother = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** Part p (1..4) seats in [a, b] frames from the dwell start of its hall (it starts as the shuttle settles, 4 px out). */
export const SEAT: Record<number, { hall: number; a: number; b: number }> = {
  1: { hall: 1, a: -1, b: 6 }, // stage 2 onto stage 1
  2: { hall: 2, a: -1, b: 4 }, // stage 3
  3: { hall: 2, a: 2, b: 8 }, // then the upper stage
  4: { hall: 3, a: -1, b: 6 }, // the fairing caps it
};
const REEL = { a: 5, b: 10 }; // hall 3: the crane line reels up off the nose
export const seatAt = (n: number, p: number) => dwellIn(n, SEAT[p].hall) + SEAT[p].b;
/** The gap still open under part p of rocket n at frame f. */
export const gapUnder = (n: number, p: number, f: number) => {
  const s = SEAT[p];
  const d = dwellIn(n, s.hall);
  return GAP * (1 - smoother((f - d - s.a) / (s.b - s.a)));
};
/** Part p's lift above its seat: the open gaps under it (the column above a seating part rides down with it). */
export const liftOf = (n: number, p: number, f: number) => {
  let l = 0;
  for (let q = 1; q <= p; q++) l += gapUnder(n, q, f);
  return l;
};
/** The crane line's bottom (world y): the fairing's nose until it seats, then reeling up to the overhead rail. */
export const lineBottom = (n: number, f: number) => {
  const nose = BASE_Y - ROCKET_H - liftOf(n, 4, f);
  const d = dwellIn(n, 3);
  const u = smoother((f - d - REEL.a) / (REEL.b - REEL.a));
  return nose + (OVH_Y - nose) * u;
};
/** The rockets drawn: JAN (the first this year: nothing stands beyond it) to the ones still off-frame right. */
export const N_LAST = 11;
export const LABEL_START = MONTHS.map((_, n) => arriveAt(n));

// -- the camera -------------------------------------------------------------------------------------------------------------
const K0 = 1.35;
const X0 = stationX(2); // hall 2
const Y0 = RAIL_Y - (HALL_EAVES + TOOTH_H) / 2 + 30;
/** The resolved frame at f81: JAN's label (station 9) to the in-feed column (station 0), with margins. After it the
 *  frame keeps travelling with the row (a slow pan left that holds JAN in shot as the next pulse moves it, the in-feed
 *  easing off the right edge), so the camera never settles dead. */
const LEFT_81 = stationX(9) - 150;
const RIGHT_81 = stationX(0) + 70;
const LEFT_96 = stationX(10) - 124; // JAN at f96 is ~98 % through its next step
const RIGHT_96 = stationX(1) + PITCH / 2 + 40; // hall 1's right post + 40
const RAMP_F = 60; // the travel eases in from here (inside the main move, so the composite never stops)
const RAMP_TAU = 10;
const ramp = (f: number) => {
  const t = Math.max(0, f - RAMP_F);
  return t - RAMP_TAU * (1 - Math.exp(-t / RAMP_TAU));
};
const frameAt = (f: number) => {
  const u = (ramp(f) - ramp(81)) / (ramp(96) - ramp(81));
  const l = LEFT_81 + (LEFT_96 - LEFT_81) * u;
  const r = RIGHT_81 + (RIGHT_96 - RIGHT_81) * u;
  const k = 2048 / (r - l);
  return { x: (l + r) / 2, y: RAIL_Y - (RAIL_SCREEN - 540) / k, k };
};
export const K1 = 2048 / (RIGHT_81 - LEFT_81);
const RAIL_SCREEN = 836;
const MOVE_A = 3;
const MOVE_B = 80;
export const camAt = (f: number): SkyrootCam => {
  const s = smoother((f - MOVE_A) / (MOVE_B - MOVE_A));
  const t = frameAt(f);
  const k = Math.exp(Math.log(K0) + (Math.log(t.k) - Math.log(K0)) * s);
  return { x: X0 + (t.x - X0) * s, y: Y0 + (t.y - Y0) * s, k, x0: X0, y0: Y0 };
};

// -- the pieces --------------------------------------------------------------------------------------------------------------
const hallBox = (h: number) => {
  const c = stationX(h);
  return { l: c - HALL_W / 2, r: c + HALL_W / 2 };
};
/** Hall 1's end post (the halls' right edge, world x): the in-feed starts beyond it. */
export const HALLS_R = stationX(1) + PITCH / 2;
const LINE_SKY = -3000; // the in-feed crane lines run up out of frame
const INTERIOR_OP = 0.3; // the halls' interior: a very light tint over the paper

/** Halls (light interior, white frame: shared posts, one saw-tooth roof closed by the end post), the crane rail (the
 *  eave truss, inside the halls only) and the floor rail (open, on out of frame both ways). Exactly three halls: the
 *  in-feed right of hall 1 has no frame and no roof. */
const Halls: React.FC = () => {
  const eave = RAIL_Y - HALL_EAVES;
  const L = hallBox(3).l;
  const R = hallBox(1).r;
  const tw = HALL_W / TEETH;
  let roof = `M${L} ${eave}`;
  for (let i = 0; i < 3 * TEETH; i++) roof += ` L${L + i * tw} ${eave - TOOTH_H} L${L + (i + 1) * tw} ${eave}`;
  return (
    <SkyrootSvg>
      <rect x={L} y={eave} width={R - L} height={HALL_EAVES} fill={INK} opacity={INTERIOR_OP} />
      <Inked
        off={SHADOW_OFF}
        render={(c) => (
          <g>
            <path d={roof} fill="none" stroke={c} strokeWidth={POST_W} strokeLinejoin="miter" strokeLinecap="square" />
            {[L, hallBox(2).l, hallBox(1).l, R].map((x) => (
              <rect key={x} x={x - POST_W / 2} y={eave} width={POST_W} height={HALL_EAVES} fill={c} />
            ))}
            <rect x={L} y={eave - POST_W / 2} width={R - L} height={POST_W} fill={c} />
            <rect x={-2000} y={RAIL_Y} width={6000} height={RAIL_H} fill={c} />
          </g>
        )}
      />
    </SkyrootSvg>
  );
};

/** Rocket n at frame f: its shuttle, its parts (hanging ones lifted), its crane line; `shadow` draws the hard copy. */
const Rocket: React.FC<{ n: number; f: number; shadow?: boolean }> = ({ n, f, shadow }) => {
  const x = rocketX(n, f);
  const off = shadow ? SHADOW_OFF : 0;
  // the crane line runs down the axis through the hanging parts (they hide it) to the base of the lowest one still
  // lifted; once all are seated it ends at the nose and reels up
  const lowest = [1, 2, 3, 4].find((p) => liftOf(n, p, f) > 0.5);
  const lb = lowest === undefined ? lineBottom(n, f) : BASE_Y - PART_A[lowest] - liftOf(n, lowest, f) - 2;
  // inside the halls the line hangs from the eave truss; out on the open in-feed it runs up out of frame (it passes
  // into the hall behind the end post as the shuttle crosses it)
  const lineTop = x > HALLS_R + POST_W / 2 ? LINE_SKY : OVH_Y;
  return (
    <div style={{ position: "absolute", left: off, top: off, width: 0, height: 0 }}>
      {!shadow && lb > OVH_Y + 0.5 ? (
        <div style={{ position: "absolute", left: x - 1.25, top: lineTop, width: 2.5, height: lb - lineTop, background: SHADOW }} />
      ) : null}
      <div style={{ position: "absolute", left: x - SHUTTLE_W / 2, top: BASE_Y, width: SHUTTLE_W, height: SHUTTLE_H, background: shadow ? SHADOW : INK }} />
      {PARTS.map((part, p) => {
        const lift = p === 0 ? 0 : liftOf(n, p, f);
        const top = BASE_Y - (BASE_ROW - part.top) * ROW - lift;
        return (
          <Img
            key={part.name}
            src={staticFile(`skyroot-trailer/vikram1_part_${part.name}.png`)}
            style={{ position: "absolute", left: x - AXIS, top, width: PW, height: (part.bottom - part.top) * ROW, maxWidth: "none", filter: shadow ? "brightness(0)" : SKYROOT_FILTER }}
          />
        );
      })}
    </div>
  );
};

const NS = Array.from({ length: N_LAST + 1 }, (_, i) => i);
const Line: React.FC<{ f: number }> = ({ f }) => {
  const live = NS.filter((n) => stationOf(n, f) >= -1.6);
  return (
    <>
      {live.map((n) => (
        <Rocket key={`s${n}`} n={n} f={f} shadow />
      ))}
      {live.map((n) => (
        <Rocket key={n} n={n} f={f} />
      ))}
    </>
  );
};

// Keyed by frame: Chromium kept a stale paint of SVG text that moved while off-screen in sequential renders (v3);
// a fresh SVG every frame paints the labels where they are.
const Labels: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <SkyrootSvg key={f}>
    {MONTHS.map((m, n) => {
      const r = textRise(f, LABEL_START[n], k);
      if (r.opacity <= 0) return null;
      return <ShadowText key={m} text={m} x={rocketX(n, f)} y={LABEL_Y + r.dy} size={LABEL_SIZE} weight={900} tracking={0.02} ink={INK} opacity={r.opacity} />;
    })}
  </SkyrootSvg>
);

// -- the cut -------------------------------------------------------------------------------------------------------------------
const ThreeFactoriesEveryMonth: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <SkyrootFilmLife frame={frame}>
        <SkyrootPaper frame={frame} cam={cam} />
        <SkyrootPlane cam={cam}>
          <Halls />
          <Line f={frame} />
          <Labels f={frame} k={cam.k} />
        </SkyrootPlane>
      </SkyrootFilmLife>
    </AbsoluteFill>
  );
};

export default ThreeFactoriesEveryMonth;
