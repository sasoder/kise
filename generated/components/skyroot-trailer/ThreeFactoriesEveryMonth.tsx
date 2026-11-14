// ---------------------------------------------------------------------------
// ThreeFactoriesEveryMonth (skyroot-trailer, cut 38), rev 2. Core Memory podcast style, the ARCHIVE COLLAGE at 16:9
// (on ./skyrootShared over mikkelShared / nealShared). Opaque 2048x1080, 23.976 fps, 97 frames; finals --scale 2.
//
// CHECK LINE: Skyroot's three factories together turn out a whole orbital rocket every month: the line rolls out one
// rocket per month, JAN, FEB, MAR ..., and keeps going.
//
// THE LINE: "Today we have three factories which can build one orbital rocket every month."
// WORD -> FRAME: Today 0 · we 5 · have 8 · three 11 · factories 15 · which 25 · can 34 · build 40 · one 47 ·
//   orbital 61 · rocket 69 · every 76 · month 81 · speech ends ~89. The edit returns to the speaker at f97.
// DURATION: the slot 38.747 -> 42.793 s (sequence f929-f1026) = 4.046 s x 23.976 = 97 frames (f0..f96).
//
// THE MOTION (rev 2, after the director's and a blind review: rockets read as pencils at phone size, so six months
// and everything bigger; no chain; no rocket slivers in dark doorways; labels arrive with their rocket). Three
// identical white factory glyphs (saw-tooth roof sheds with a row of tall works windows, each open at its right end in
// a big hangar door taller than a rocket, on their hard shadow) stand side by side on the rail. The line runs through the halls, hidden inside, and
// out of the third hall's door: each Vikram-1 rolls out upright from behind that door's jamb (the jamb is the only
// occluder; a rocket is either hidden inside or emerging past the jamb, lit, in front of the dark interior). ONE exit
// door, not three in rotation: rockets from the first two doors would roll across the third factory's front, and a
// lockstep rotation needs the doors two slots apart, wider than the frame. The line is one lockstep conveyor at
// constant speed (PITCH 180 px every CADENCE 9 frames = 20 px/f), so a rocket rolls out every 9 frames (centre past
// the jamb at f22.4, 31.4 ... 67.4) and no rocket ever passes another. The first rocket leads; each month's label
// slides up as the lead rocket arrives on its slot (JAN f29 ... JUN f79). From f71 the line brakes (velocity
// smoothstep, 10 f, half a pitch) and stops at f81 on "month" with six rockets on JAN-JUN; they lean ~1 deg into the
// braking and rock back upright. The seventh (the next month's, no label) keeps nosing out of the door to the end
// (its own slow stop at f96), and the rail runs on off the right edge: the line keeps going. Camera: open close on
// the three factories (k 1.08, all three in shot from f0), one move right and back to the resolved frame (k 0.968,
// pan smootherstep f6-82, zoom f0-30), then a slow creep. On every frame the camera height holds the roof tips at screen
// y 26 (>= 24 clear of the top), so once the zoom has settled the labels' baseline sits at ~595 and their shadow above
// 600 (caption bands 607-703, 765-821: only paper and the rail's run below).
// CHAIN: none in this cut (director, rev 2).
// Cause before effect: rocket i's right edge clears the jamb ~1 f before its centre (f22.4 + 9i); each label starts
// 2 f before the lead's centre reaches its slot. Checks: scripts/clips/skyroot-trailer/check-three-factories.ts.
//
// FACTS (FACTS.txt item 5): "three factories ... one orbital rocket every month" is the speaker's (the CEO's) claim.
// Skyroot publicly lists two facilities (Max-Q headquarters and the Infinity Campus, Hyderabad); "one orbital rocket
// every month" is reported as the Infinity Campus design capacity (Business Today, 27 Nov 2025), not demonstrated
// output. Director's call: draw what the speaker says, three identical factory glyphs (not a photo of one real
// building), and the picture reads "can build" (a capacity line). The count is flagged in the hand-off. No numbers,
// no year, no "per month" on screen: the month labels are the unit.
//
// SOURCES: Vikram-1 cut-out = skyrootShared VIKRAM1 (vikram1.png: the real Vikram-1 on the First Launch Pad,
// SDSC-SHAR, July 2026, ISRO, GODL-India), drawn with RocketCutOut as in cut 4. Factory glyphs drawn here (no factory
// cut-out exists: SKYROOT_READY.md). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBands,
  INK,
  Inked,
  RocketCutOut,
  SHADOW,
  STROKE,
  ShadowText,
  type SkyrootCam,
  SkyrootFilmLife,
  SkyrootPaper,
  SkyrootPlane,
  SkyrootSvg,
  VIKRAM1,
  textRise,
} from "./skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 97;
export const schema = z.object({ bands: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// -- the world (plane px; the resolved frame is k ~0.968) ----------------------------------------------------------------
/** The rail's top = every hall's floor = every rocket's base. */
export const GROUND = 530;
const RAIL_H = STROKE;
/** Rocket height nose to base (world px): ~39 px wide (+5 px shadow); on screen 436 x 38 in the resolved frame (k 0.968).
 *  The vertical budget binds: labels (cap ~49) under the rail by y 600, a factory taller than a rocket, its roof tips
 *  >= 24 px below the frame top. */
export const ROCKET_H = 450;
const ROCKET_SHADOW = 5;
const HALL_SHADOW = 6;

// The three halls: identical saw-tooth sheds, each open at its right end in a hangar door taller than a rocket.
const HALL_W = 230;
const HALL_GAP = 16;
const DOOR_W = 76;
const DOOR_H = 458;
const BODY_H = 466;
const TOOTH_H = 50;
const TEETH = 3;
const F_LEFT = 120;
const WIN_N = 3;
const WIN_W = 26;
const WIN_H = 74;
const WIN_TOP = 34;
const WIN_M = 24;
const WIN_GAP = (HALL_W - DOOR_W - 2 * WIN_M - WIN_N * WIN_W) / (WIN_N - 1);
/** The roof's tooth tips (world y): the highest thing in the cut. */
export const ROOF_Y = GROUND - BODY_H - TOOTH_H;
export const HALLS = [0, 1, 2].map((j) => F_LEFT + j * (HALL_W + HALL_GAP));
export const DOORS = HALLS.map((x0) => ({ x0: x0 + HALL_W - DOOR_W, x1: x0 + HALL_W, y0: GROUND - DOOR_H, y1: GROUND }));
/** The exit door's jamb: a rocket is hidden left of this x and emerges, lit, to its right. */
export const JAMB_X = DOORS[2].x0;
/** The third hall's outer right edge. */
export const EXIT_X = HALLS[2] + HALL_W;

// The calendar: six month slots on the rail, right of the factories; the rail runs on off the frame.
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"] as const;
export const PITCH = 180;
const JAN_X = EXIT_X + 96;
export const SLOT_X = MONTHS.map((_, m) => JAN_X + m * PITCH);
const LAST_X = SLOT_X[MONTHS.length - 1];
const RAIL_X0 = -1200;
const RAIL_X1 = 4200;
const LABEL_SIZE = 70; // Barlow 900, cap ~49 px
/** The labels' baseline (world); cap top ~549, under the rail (530-536) and its shadow. */
export const LABEL_Y = 598;
export const LABEL_RISE_PX = 8; // screen px
export const LABEL_SHADOW = 4; // ShadowText's hard copy, world px down

// -- the line: one lockstep conveyor ----------------------------------------------------------------------------------
export const CADENCE = 9; // frames between rockets
export const V = PITCH / CADENCE; // px per frame
export const STOP = 81; // the line stops on "month"
const BRAKE = 10;

/** The lead (first) rocket's x: constant speed, then a smooth brake onto the last slot at STOP. */
export const leadX = (f: number) => {
  const b0 = STOP - BRAKE;
  if (f <= b0) return LAST_X - (V * BRAKE) / 2 - V * (b0 - f);
  if (f >= STOP) return LAST_X;
  const w = (f - b0) / BRAKE;
  return LAST_X - V * BRAKE * (0.5 - w + w ** 3 - w ** 4 / 2);
};
const lineV = (f: number) => {
  const w = (f - (STOP - BRAKE)) / BRAKE;
  if (w <= 0) return V;
  if (w >= 1) return 0;
  return V * (1 - 3 * w * w + 2 * w ** 3);
};

/** The next rocket (index MONTHS.length): on the line until the brake, then its own slow stop at the cut's end. */
const NEXT = MONTHS.length;
const NEXT_RUN = DURATION - 1 - (STOP - BRAKE); // frames of its own stop
const NEXT_D = 150; // px it still rolls after the line starts braking
const NEXT_P = (V * NEXT_RUN) / NEXT_D - 1; // v = V (1 - w)^p covers NEXT_D
const nextV = (f: number) => {
  const w = (f - (STOP - BRAKE)) / NEXT_RUN;
  if (w <= 0) return V;
  if (w >= 1) return 0;
  return V * (1 - w) ** NEXT_P;
};

/** Rocket i (0 = the lead) on the line. */
export const rocketX = (i: number, f: number) => {
  const onLine = leadX(f) - i * PITCH;
  if (i !== NEXT || f <= STOP - BRAKE) return onLine;
  const at = leadX(STOP - BRAKE) - i * PITCH;
  const w = Math.min(1, (f - (STOP - BRAKE)) / NEXT_RUN);
  return at + NEXT_D * (1 - (1 - w) ** (NEXT_P + 1));
};

// The settle: tall rockets lean into the braking (nose forward = clockwise) and rock back upright: a damped spring
// driven by the deceleration, integrated once at module load (deterministic). ~1 deg at the peak.
const LEAN_OMEGA = (2 * Math.PI) / 13;
const LEAN_ZETA = 0.28;
const LEAN_GAIN = 3.3 / (2.76 / LEAN_OMEGA ** 2); // deg per (px/f^2)
const leanTrack = (vel: (f: number) => number): number[] => {
  const out: number[] = [];
  let th = 0;
  let om = 0;
  const SUB = 8;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(th);
    for (let s = 0; s < SUB; s++) {
      const t = f + s / SUB;
      const a = (vel(t) - vel(t + 1 / SUB)) * SUB;
      const acc = -(LEAN_OMEGA ** 2) * th - 2 * LEAN_ZETA * LEAN_OMEGA * om + LEAN_GAIN * LEAN_OMEGA ** 2 * a;
      om += acc / SUB;
      th += om / SUB;
    }
  }
  return out;
};
const LEAN_LINE = leanTrack(lineV);
const LEAN_NEXT = leanTrack(nextV);
export const leanAt = (i: number, f: number) => {
  const tr = i === NEXT ? LEAN_NEXT : LEAN_LINE;
  return tr[Math.max(0, Math.min(tr.length - 1, Math.round(f)))];
};

/** Each label starts 2 frames before the lead rocket's centre reaches its slot. */
const labelStart = (m: number) => {
  let f = 0;
  while (f < STOP && leadX(f) < SLOT_X[m] - 0.01) f += 0.05;
  return Math.round(f) - 2;
};
export const LABEL_START = MONTHS.map((_, m) => labelStart(m));

// -- the camera ------------------------------------------------------------------------------------------------------------
const smoother = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * x * (x * (6 * x - 15) + 10);
};
const X0 = F_LEFT + (3 * HALL_W + 2 * HALL_GAP) / 2; // the three factories' centre
const X1 = (F_LEFT + LAST_X + 80) / 2; // the resolved frame's centre: factories to the last label
const K0 = 1.08;
const K1 = 0.976; // where the pull-back lands at f30; the drift then takes it to ~0.968 at f81
const DRIFT_X = 0.5; // px/f, always moving
const DRIFT_K = 0.0001; // per frame, a slow pull-back under everything
const MOVE_X = X1 - X0 - DRIFT_X * STOP;
const MOVE_K = K0 - K1;
const camX = (f: number) => X0 + DRIFT_X * f + MOVE_X * smoother((f - 6) / 76);
// The pull-back is front-loaded (done by ~f30): the roof tips are pinned ROOF_SCREEN_Y below the frame top, so the
// labels' baseline sits at ROOF_SCREEN_Y + (LABEL_Y - ROOF_Y) k, whose shadow is at or above 599 only at k <= ~0.974,
// and the first label shows at f29 (k there 0.973). The pan runs on to f82.
const camK = (f: number) => K0 - DRIFT_K * f - MOVE_K * smoother(f / 30);
/** Screen y of the roof tips on every frame (>= 24 px clear of the top); the world grows down from it as k falls. */
export const ROOF_SCREEN_Y = 26;
const camY = (f: number) => ROOF_Y - (ROOF_SCREEN_Y - 540) / camK(f);
/** The camera at frame f (rest camera = the f0 camera). */
export const camAt = (f: number): SkyrootCam => ({ x: camX(f), y: camY(f), k: camK(f), x0: camX(0), y0: camY(0) });

// -- the pieces --------------------------------------------------------------------------------------------------------------
const hallPath = (x0: number) => {
  const top = GROUND - BODY_H;
  const tw = HALL_W / TEETH;
  let d = `M${x0} ${GROUND} L${x0} ${top}`;
  for (let i = 0; i < TEETH; i++) {
    const b = x0 + (i + 1) * tw;
    d += ` L${b} ${top - TOOTH_H} L${b} ${top}`;
  }
  return `${d} L${x0 + HALL_W} ${GROUND} Z`;
};

const Factories: React.FC = () => (
  <SkyrootSvg>
    {/* the rail: one ground strip under the halls and on along the months, off both edges of the frame */}
    <Inked off={4} render={(c) => <rect x={RAIL_X0} y={GROUND} width={RAIL_X1 - RAIL_X0} height={RAIL_H} fill={c} />} />
    {HALLS.map((x0) => (
      <Inked key={x0} off={HALL_SHADOW} render={(c) => <path d={hallPath(x0)} fill={c} />} />
    ))}
    {DOORS.map((d) => (
      <rect key={d.x0} x={d.x0} y={d.y0} width={d.x1 - d.x0} height={d.y1 - d.y0} fill={SHADOW} />
    ))}
    {/* a row of tall works windows high on each hall's wall, so the slab reads as a building */}
    {HALLS.flatMap((x0) =>
      Array.from({ length: WIN_N }, (_, i) => (
        <rect key={`${x0}-${i}`} x={x0 + WIN_M + i * (WIN_W + WIN_GAP)} y={GROUND - BODY_H + WIN_TOP} width={WIN_W} height={WIN_H} fill={SHADOW} />
      )),
    )}
  </SkyrootSvg>
);

/** Everything right of the exit door's jamb: a rocket is drawn only where it has come out from behind it. */
const openClip = `polygon(${JAMB_X}px -4000px, 9000px -4000px, 9000px 4000px, ${JAMB_X}px 4000px)`;
const N_LINE = MONTHS.length + 1; // six for the months + the next one nosing out (the rest are hidden inside)
const HALF = 26; // half the rocket's width incl. its shadow

const Line: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 4000, height: 2000, clipPath: openClip }}>
    {Array.from({ length: N_LINE }, (_, i) => {
      const x = rocketX(i, frame);
      if (x + HALF <= JAMB_X) return null;
      return <RocketCutOut key={i} rocket={VIKRAM1} x={x} y={GROUND} height={ROCKET_H} rot={leanAt(i, frame)} pivot={0} shadow={ROCKET_SHADOW} />;
    })}
  </div>
);

const Labels: React.FC<{ frame: number; k: number }> = ({ frame, k }) => (
  <SkyrootSvg>
    {MONTHS.map((m, i) => {
      const r = textRise(frame, LABEL_START[i], k, { px: LABEL_RISE_PX });
      if (r.opacity <= 0) return null;
      return <ShadowText key={m} text={m} x={SLOT_X[i]} y={LABEL_Y + r.dy} size={LABEL_SIZE} weight={900} tracking={0.02} ink={INK} opacity={r.opacity} />;
    })}
  </SkyrootSvg>
);

// -- the cut -------------------------------------------------------------------------------------------------------------------
const ThreeFactoriesEveryMonth: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <SkyrootFilmLife frame={frame}>
        <SkyrootPaper frame={frame} cam={cam} />
        <SkyrootPlane cam={cam}>
          <Factories />
          <Line frame={frame} />
          <Labels frame={frame} k={cam.k} />
        </SkyrootPlane>
      </SkyrootFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default ThreeFactoriesEveryMonth;
