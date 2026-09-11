import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FEATHER_STEPS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  runCamera,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// John Charles Beren, clip `JohnCharlesBeren_Feels_Like_AGI`, CUT 2 — the cut
// that follows `CatchUpInSomeAreas`: "and like right now you don't get
// explosive growth in capabilities".
//
// SRT span 0:25.679 -> 0:30.000 at 24fps.
// round((30.000 - 25.679) * 24) = round(4.321 * 24) = round(103.704) = 104
// frames of speech, plus a 16 frame tail so the resolved state holds = 120.
export const DURATION = 120;

// ---------------------------------------------------------------------------
// "You don't get explosive growth in capabilities". The SAME world as cut 1 —
// same six columns, same floor, same ledges, same people, same geometry — opened
// exactly where cut 1 left it: three columns locked flush under their ledges,
// three still short and ragged, everything already ripe because the wave has
// passed. Nothing is built here. The only new thing is a PLAN of what explosive
// would have looked like, and it is a plan that never gets built.
//
// Every gesture is one word. Nothing else happens.
//   f0 IS cut 1's last frame: six stacks on one
//     floor at world y 1000, columns 1/3/5 locked
//     flush under their ledges, columns 2/4/6 short
//     and ragged, camera at k 0.95 with the content
//     centre at 586. Alive with the creep only.     — "and like right now" f0-21
//   the three short columns keep creeping upward at
//     HALF cut 1's tail rate for the whole piece, so
//     a row is still arriving at three top edges on
//     the last frame. They gain 2.9 / 4.4 / 3.4 rows
//     over the 120 frames and stay 126 / 165 / 149
//     world px short of their ledges: never caught
//     up. The lockers are frozen flush — a locked
//     column cannot grow again.                     — under everything    f0-119
//   the ONE camera move: k 0.95 -> 0.80, content
//     centre 586 -> 444. Keyed f8-24 so the damper's
//     visible move runs f11-f28 and lands inside
//     0.3% of 0.80 by f30, two frames before
//     "explosive". It drops the floor to screen y
//     1280 and opens 420 screen px of empty
//     headroom above the highest person — the room
//     the plan is about to need.                    — "right now"         f11-30
//   out of EVERY stack, a dashed white plan outline
//     of a far taller stack shoots upward: two
//     vertical dashed edges per column, exactly the
//     column's width, starting at that column's
//     live top, drawn head-led with a white tip.
//     All six launch together on the word and
//     decelerate on one shared ease; every head is
//     off the top of the frame between f37 and f42,
//     well clear of "growth" at f50, and the trail
//     finishes drawing off-screen by f56. The
//     outlines pass BEHIND the ledges and the
//     people, who stay clean on top.                — "explosive growth"  f32-56
//   hold. The dashed edges stand there and the only
//     motion is the creep and the idle. This is the
//     beat where the plan is read.                  — "in"                f56-81
//   the negation: the six plans dissolve on ONE
//     group move, in place — OP_UNREAD -> OP_DARK
//     over f82-91, out by f96, still attached to
//     the columns they grew from. The upward wipe
//     the brief asked for first was built and
//     rejected in the strip; see the note at
//     FADE_KNEE. The real stacks are untouched.     — "capabilities"      f82-96
//   hold on the unchanged world, the shorts still
//     creeping. The last frame is cut 1's ending
//     with nothing gained: no explosive growth.     — tail                f96-119
//
// The OpenAI mark under the floor rule is cut 1 v3's, unchanged: it is in cut
// 1's resolved frame, so it has to be in this one or it pops out at the cut.
//
// ambient: breath on every dot and the camera's own sway, f0 to f119. No
// threads, no wave — every dot is already ripe and the only thing allowed to
// move a dot is the creep.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: the wave passed in cut 1, so every dot is this
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; dots are solid in this style
  beats: z.object({
    andLike: z.number(), // "and like"
    rightNow: z.number(), // "right now"
    youDontGet: z.number(), // "you don't get"
    explosive: z.number(), // "explosive"
    growthIn: z.number(), // "growth in"
    capabilities: z.number(), // "capabilities"
    end: z.number(), // speech ends; tail to 120
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  beats: {
    andLike: 0,
    rightNow: 10,
    youDontGet: 22,
    explosive: 32,
    growthIn: 50,
    capabilities: 82,
    end: 104,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole camera track: k 0.95 -> 0.80 with
// the content centre 586 -> 444. Cut 1 resolved at k 0.95 / centre 586, so this
// piece opens on exactly that camera and the cut is invisible.
//
// The move is a pull-back AND a small push of the content down the frame,
// because a pure pull-back around 586 would lift the floor to screen y 1166 and
// put the composition in the middle of the frame with nothing above it. Taking
// the centre to 444 lands the floor at screen y 1280 — low, inside the
// caption-safe band, with the whole graphic between screen y 617 (the highest
// person's head) and 1281 (the floor rule) — and opens 420 screen px of empty
// sky above the people. That sky is the gesture: it is where the plan goes.
//
// Keyed f8-24 rather than the f14-30 the brief sketched. The damper needs ~8
// frames past the last key to settle, and "explosive" is at f32: keyed at 14-30
// the camera is still 2.8% off its target at f30 and visibly creeping under the
// launch. At 8-24 the move is imperceptible until ~f11 (k has moved 0.3% by
// f10, under the 1%/frame that reads at all), peaks on "right now", and is
// inside 0.3% of 0.80 by f30 and flat from f34 — landed and still before the
// word, which is the house rule.
//
//   f0-10    k 0.95  cut 1's resolved frame, unchanged.
//   f11-28   -> 0.80 the pull-back, eased per frame (warp 0.72, speed early).
//   f30-119  k 0.80  still. Nothing moves the camera again.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;
const K_OPEN = 0.95; // cut 1's resolved k
const K_FINAL = 0.8;
const CONTENT_CENTRE = 586; // cut 1's resolved content centre
const CONTENT_CENTRE_OUT = 444;
const CAM = camMove({
  f0: 8,
  f1: 24,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_CENTRE,
  c1: CONTENT_CENTRE_OUT,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [
  CONTENT_CENTRE + CAM_LIFT / K_OPEN,
  ...CAM.CY,
  CONTENT_CENTRE_OUT + CAM_LIFT / K_FINAL,
];

// ---------------------------------------------------------------------------
// The six areas, copied from cut 1 unchanged: same pitch, same seats, same
// jitter, same hashes, same floor, same ledges, same locks. The only additions
// are EXTRA_ROWS_SHORT (the short columns creep for another 120 frames here, so
// their lattices need rows above where cut 1 stopped) and the creep rate.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
const COL_SEATS = 4;
const PITCH = 136;
const NCOL = 6;
const JIT_X = 0.9;
const JIT_Y = 0.9;

const FLOOR_Y = 1000;
const FLOOR_PAD = 40;
const BASE_GAP = 12;
const BASE_Y = FLOOR_Y - BASE_GAP;

const LEDGE_Y = [380, 470, 430, 300, 560, 240];
const LOCKS = [true, false, true, false, true, false]; // columns 1, 3, 5 of 6
const REST_TOP = [660, 780, 650, 730, 800, 600];
const LOCK_GAP = 10;
const SHORT_TOP = [0, 650, 0, 540, 0, 450];
const FINAL_ROW = LEDGE_Y.map((ly, c) => (LOCKS[c] ? ly + LOCK_GAP : SHORT_TOP[c]));

const COL_ROWS = FINAL_ROW.map((y) => Math.round((BASE_Y - y) / STEP_Y));
const COL_STEP = FINAL_ROW.map((y, c) => (BASE_Y - y) / COL_ROWS[c]);
// Cut 1's three rows of headroom for a still-wobbling edge, plus — for the
// three short columns only — the rows this piece's creep delivers on top.
const EXTRA_ROWS = 3;
const EXTRA_ROWS_SHORT = 9;

const FINAL_TOP = FINAL_ROW.map((y, c) => (LOCKS[c] ? y - 0.5 * COL_STEP[c] : y));
const COL_X = Array.from({ length: NCOL }, (_, c) => CENTRE_X + (c - (NCOL - 1) / 2) * PITCH);

const LEDGE_W = 116;
// The OpenAI mark under the floor rule, copied from cut 1 v3 (Simple Icons
// `public/si-openai.svg`, one compound path in a 24-unit box). It is in cut 1's
// resolved frame, so it has to be in this one or it pops out at the cut.
const MARK_SIZE = 108;
const MARK_GAP = 36; // floor rule to the top of the mark
const MARK_D =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
const PERSON_SIZE = 72;
const PERSON_FOOT = 471 / 512;
const STROKE = 3; // the one stroke weight in this piece

const COL_HALF = ((COL_SEATS - 1) / 2) * STEP_X + 0.5 * JIT_X * STEP_X + DOT_RADIUS * 1.25;
const FLOOR_X0 = COL_X[0] - COL_HALF - FLOOR_PAD;
const FLOOR_X1 = COL_X[NCOL - 1] + COL_HALF + FLOOR_PAD;

// ---------------------------------------------------------------------------
// The creep. Cut 1's short columns ended on a slow constant rise that was still
// delivering a row on its last frame — TAIL_SHARE 0.16 of the column's travel
// spread over its last 28 frames. That rise carries straight through this cut,
// at HALF the rate: at cut 1's full rate the three shorts would close 50% of
// what is left between them and their ledges inside these 120 frames, which
// reads as catching up, and the sentence is that they do not. Halved, they gain
// 2.9 / 4.4 / 3.4 rows — a row arriving at each top edge every 25 to 40 frames,
// visible on the last frame — and finish 126 / 165 / 149 world px short.
// ---------------------------------------------------------------------------
const CUT1_TAIL_SHARE = 0.16;
const CUT1_TAIL_FRAMES = 28;
const CREEP_SCALE = 0.5;
const CREEP_PX = REST_TOP.map((rest, c) =>
  LOCKS[c] ? 0 : CREEP_SCALE * (CUT1_TAIL_SHARE / CUT1_TAIL_FRAMES) * (rest - SHORT_TOP[c]),
);
// A short column may never reach its ledge. It does not get close at this rate,
// but the clamp is here so the piece cannot be lengthened into a lie.
const CREEP_FLOOR = LEDGE_Y.map((ly) => ly + LOCK_GAP);

const STRAIGHT_FULL = 2.6;
const STRAIGHT_FADE = 3;
const straightenPlateau = (depth: number) =>
  clamp01((STRAIGHT_FULL + STRAIGHT_FADE - depth) / STRAIGHT_FADE);

type Seat = {
  c: number;
  x: number;
  yj: number;
  y0: number;
  base: number;
  r: number;
  h: number;
};
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let c = 0; c < NCOL; c++) {
    const step = COL_STEP[c];
    const extra = LOCKS[c] ? EXTRA_ROWS : EXTRA_ROWS_SHORT;
    for (let r = 0; r <= COL_ROWS[c] + extra; r++) {
      for (let s = 0; s < COL_SEATS; s++) {
        // cut 1's index, so the seats that exist in both cuts are the same seats
        const i = c * 100000 + r * COL_SEATS + s;
        const y0 = BASE_Y - r * step;
        out.push({
          c,
          x:
            COL_X[c] +
            (s - (COL_SEATS - 1) / 2) * STEP_X +
            (hash(i, 11) - 0.5) * STEP_X * JIT_X,
          yj: y0 + (hash(i, 12) - 0.5) * step * JIT_Y,
          y0,
          base: straightenPlateau(r),
          r: 0.75 + 0.5 * hash(i, 13),
          h: hash(i, 71),
        });
      }
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The plan. Out of every stack, two vertical dashed edges exactly the column's
// width apart — COL_HALF either side of its centre, which is the same half-width
// the floor rule is drawn from, so the plan is the column continued rather than
// a new shape. They start at that column's LIVE top (so the creep carries the
// base with it) and are drawn head-led: the head runs, the dash trail follows it
// out of the crowd.
//
// The dash is `TenTimesTheCost`'s plan dash, 9 on 7 off at stroke 3 and
// OP_UNREAD, with the same per-icon shadow and the same small white tip at the
// head. Dashes are laid from the base, so the phase is anchored where the plan
// leaves the crowd and no offset is needed.
//
// GHOST_LEN is the same for all six, so the six heads travel at exactly the same
// speed and read as one launch; because the six tops differ, the heads cross the
// frame edge at f37 (the tallest) to f42 (the shortest). Every one of them is
// gone well before "growth" at f50. 1600 world px puts even the lowest tip at
// world y -950, which at k 0.80 is 280 screen px above the frame, so nothing
// stops inside the frame and no sway can bring a tip back in.
// ---------------------------------------------------------------------------
const GHOST_HALF = COL_HALF;
const GHOST_LEN = 1600;
const GHOST_DUR = 24; // f32 -> f56; the last third of it is off-screen
const GHOST_DASH = "9 7";
const GHOST_HEAD_R = 4;
// world y -700 is screen y -80 at k 0.80: the head is out of the frame here
const GHOST_HEAD_OUT = -700;
// The dissolve. The brief's first choice was an upward wipe from each column's
// own real top; it was built, rendered and rejected in the strip. Two things
// were wrong with it. It is a second upward move on the same shape that just
// launched upward — the pitfall MEMORY names, "never stagger the same shape
// twice" — and at f88 it leaves a dashed fragment hanging in mid-air with a
// 200 screen px gap between it and the column it belongs to, which is a new
// object arriving on the beat where the sentence is taking one away.
//
// So the plan goes out IN PLACE: OP_UNREAD -> OP_DARK over 9 frames, then out
// by f96, still attached to the columns it grew from the whole way down. The
// negation lands on the columns, which is where the sentence is, and the last
// thing the eye sees is the real stack with nothing above it.
const FADE_KNEE = 9; // to OP_DARK
const FADE_DUR = 14; // to nothing, f82 -> f96

const NoExplosiveGrowth: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the world, as cut 1 left it -------------------------------------------
  // The lockers are frozen flush at their final top with the lock fully
  // resolved; the shorts sit at cut 1's last height and creep on from there.
  const colTop: number[] = [];
  const colFlat: number[] = [];
  for (let c = 0; c < NCOL; c++) {
    colTop.push(
      LOCKS[c] ? FINAL_TOP[c] : Math.max(CREEP_FLOOR[c], SHORT_TOP[c] - CREEP_PX[c] * frame),
    );
    colFlat.push(LOCKS[c] ? 1 : 0);
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the plan --------------------------------------------------------------
  // One group ease for all six: launched together on "explosive", decelerating.
  const ghostT = interpolate(
    frame,
    [beats.explosive, beats.explosive + GHOST_DUR],
    [0, 1],
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
  // One group dissolve on "capabilities": the whole plan goes down the ink
  // ladder together and out, in place, still keyed to its columns.
  const ghostOp = interpolate(
    frame,
    [beats.capabilities, beats.capabilities + FADE_KNEE, beats.capabilities + FADE_DUR],
    [OP_UNREAD, OP_DARK, 0],
    clamp,
  );

  // -- the dots --------------------------------------------------------------
  const dots: { key: number; x: number; y: number; r: number }[] = [];
  for (let i = 0; i < SEATS.length; i++) {
    const s = SEATS[i];
    const step = COL_STEP[s.c];
    const flat = colFlat[s.c];
    const edge = colTop[s.c] + (1 - flat) * wobble(s.x, s.c * 1.7 + 0.4) * step;
    const d = (s.y0 - edge) / step;
    const fe = feather(d, FEATHER_STEPS * (1 - flat) + 0.02);
    if (s.h >= fe) continue;
    const straighten = Math.max(s.base, flat * straightenPlateau(d));
    const y = s.yj + (s.y0 - s.yj) * straighten;
    const rv = s.r + (1 - s.r) * straighten;
    dots.push({
      key: i,
      x: s.x,
      y,
      r: dotRadius * rv * (0.7 + 0.3 * fe) * breath(frame, s.h),
    });
  }

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

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
            {/* the plan, UNDER the crowd and under the ink: two dashed edges per
                column, head-led out of that column's live top. It leaves the
                crowd at the top edge and passes behind the ledges and the
                people, who stay clean on top of it. */}
            {ghostT <= 0 || ghostOp <= 0
              ? null
              : COL_X.map((x, c) => {
                  const yBase = colTop[c];
                  const yHead = colTop[c] - GHOST_LEN * ghostT;
                  if (yHead >= yBase) return null;
                  // the head is only ever drawn while it is still in the frame
                  const showHead = ghostT < 1 && yHead > GHOST_HEAD_OUT;
                  return (
                    <g key={`gh${c}`} style={{ filter: icon }}>
                      {[-GHOST_HALF, GHOST_HALF].map((dx) => (
                        <g key={dx}>
                          <line
                            x1={x + dx}
                            y1={yBase}
                            x2={x + dx}
                            y2={yHead}
                            stroke={ink}
                            strokeWidth={STROKE}
                            strokeLinecap="butt"
                            strokeDasharray={GHOST_DASH}
                            opacity={ghostOp}
                          />
                          {showHead ? (
                            <circle
                              cx={x + dx}
                              cy={yHead}
                              r={GHOST_HEAD_R}
                              fill={ink}
                              opacity={OP_READ}
                            />
                          ) : null}
                        </g>
                      ))}
                    </g>
                  );
                })}

            {/* the six areas */}
            {dots.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={dotUnread} />
            ))}

            <g style={{ filter: icon }}>
              {/* the floor: one rule under all six */}
              <line
                x1={FLOOR_X0}
                y1={FLOOR_Y}
                x2={FLOOR_X1}
                y2={FLOOR_Y}
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={OP_READ}
              />

              {/* the ledges: one ink rule per area, at its own height */}
              {COL_X.map((x, c) => (
                <line
                  key={c}
                  x1={x - LEDGE_W / 2}
                  y1={LEDGE_Y[c]}
                  x2={x + LEDGE_W / 2}
                  y2={LEDGE_Y[c]}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ))}

              {/* the OpenAI mark, centred under the floor rule — cut 1's */}
              <g
                transform={`translate(${CENTRE_X - MARK_SIZE / 2} ${FLOOR_Y + MARK_GAP}) scale(${MARK_SIZE / 24})`}
              >
                <path d={MARK_D} fill={ink} opacity={OP_READ} />
              </g>
            </g>
          </svg>

          {/* one person standing on each ledge */}
          {COL_X.map((x, c) => (
            <Img
              key={c}
              src={staticFile("person.png")}
              style={{
                position: "absolute",
                left: x - PERSON_SIZE / 2,
                top: LEDGE_Y[c] - STROKE / 2 - PERSON_SIZE * PERSON_FOOT,
                width: PERSON_SIZE,
                height: PERSON_SIZE,
                filter: `brightness(0) invert(1) ${icon}`,
                opacity: OP_READ,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default NoExplosiveGrowth;
