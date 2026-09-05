import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  GLIDE,
  GROUND_O,
  GROUND_W,
  LAND,
  backdropStyle,
  clamp01,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "and i think those are great tasks to automate — i think they're very poor
// tasks to start with, counterintuitively" — SRT 5.059s -> 10.419s at 24fps.
export const DURATION = 129;

// ---------------------------------------------------------------------------
// The reach rule
//
// The line contains exactly two objects and one reversal: the same pair scores
// highest on one measure and lowest on another, and the surprise is that it is
// the same pair. So the scene is one pair of towers measured twice, never two
// pictures side by side.
//
// Height is a single honest axis here. A tall stack is why the task is worth
// automating AND why it is out of reach on day one — that identity is the whole
// argument, so both readings are taken off the same geometry rather than off
// two encodings that would then have to be kept in agreement.
//
// Countable, on one grid: nine plates, eight folded garments, and every small
// job in the field is one, two or three of its own unit. The rule sits 240
// above the ground — clear of the tallest small job, a third of the way up the
// shorter tower — and runs off both edges, because the constraint applies to
// everything including what the frame cannot show.
// ---------------------------------------------------------------------------
const GY = 1500; // the ground
const SLAB_W = 240;
const SLAB_H = 66;
const PITCH = 100; // slab plus 34 of air, so a stack stays countable
const DISHES_N = 9;
const LAUNDRY_N = 8;
const DISHES_X = 400;
const LAUNDRY_X = 680;

const SMALL_H = 48;
const SMALL_PITCH = 66;

const RULE_Y = GY - 240;
const RULE_H = 10;
const RULE_X0 = -280;
const RULE_X1 = 1360;

const WORLD_W = 1080;
const WORLD_H = 1920;
const X0 = 540; // the column axis everything is gathered on

// The rest of what a robot could be doing. Widths and counts vary so the field
// reads as a row of different jobs rather than a lattice.
const SMALL = [
  { cx: -100, w: 104, n: 2 },
  { cx: 40, w: 92, n: 1 },
  { cx: 180, w: 108, n: 3 },
  { cx: 900, w: 96, n: 2 },
  { cx: 1040, w: 112, n: 3 },
  { cx: 1180, w: 88, n: 1 },
];

const slabTop = (i: number) => GY - (i + 1) * PITCH + (PITCH - SLAB_H);

// Arrivals. Both towers are already standing at frame 0 — the previous
// sentence named them — and the rest of each stack arrives across "those are
// great tasks to automate", alternating so something lands every four or five
// frames and the growth is never one tower's private event.
const DISH_BASE = 5;
const LAUN_BASE = 4;
const DISH_ARRIVE = [12, 24, 34, 42];
const LAUN_ARRIVE = [18, 29, 38, 45];
const FALL = 10;
// Shorter than the gap the cap keeps above the stack, so an arriving slab
// never crosses the mark that names the tower.
const FALL_H = 30;
const CAP_GAP = 44;

// The value read. Amber floods up from the ground on "automate"; each slab
// converts when the front reaches its own centre, so the front is the colour
// change itself and the two cannot drift apart if this is ever retimed.
const AMBER_F = 45;
const AMBER_SPAN = 13;
const AMBER_TOP = 700;

// The pulse that runs out along the finished rule on "start with", lighting
// each job it passes. Reach covers the farthest job in the field.
const PULSE_F = 92;
const PULSE_SPAN = 18;
const PULSE_REACH = 900;

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
  unknownOpacity: z.number(),
  readOpacity: z.number(),
  recedeOpacity: z.number(),
  capOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "and i think" · 16 "those are great" · 28 "tasks to" · 45 "automate"
  //   54 "i think they're" · 62 "very poor" · 79 "tasks to" · 94 "start with"
  //   106 "counterintuitively" · 129 end
  beats: z.object({
    thoseAreGreat: z.number().int(),
    automate: z.number().int(),
    veryPoor: z.number().int(),
    ruleLands: z.number().int(),
    startWith: z.number().int(),
    counterintuitively: z.number().int(),
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
  unknownOpacity: 0.14,
  readOpacity: 0.92,
  // Not 0.42: on kraft a low floor goes muddy rather than receding, the same
  // lesson the grid background taught at 0.5.
  recedeOpacity: 0.58,
  capOpacity: 0.55,
  beats: {
    thoseAreGreat: 16,
    automate: 45,
    veryPoor: 62,
    ruleLands: 88,
    startWith: 94,
    counterintuitively: 106,
  },
});

// ---------------------------------------------------------------------------
// The marks
//
// Material Symbols (Apache 2.0), rounded fill, viewBox 0 -960 960 960 — one
// family, so the two chores are labelled in one hand. They are marks anchored
// to the thing they name, not props: the towers carry the argument and these
// only say which chore each tower is. Deliberately not the washing machine or
// the dishwasher, which the next sentence needs.
//
// Sized by ink area, not bounding box, the way the brand lockups are. Measured
// at 512px: flatware inks 65,328px in a 384x384 box, laundry 96,644 in a
// 452x384 box. Equal ink puts laundry at 0.82x flatware and equal box at 0.92x;
// the blend is the 0.87x below.
// ---------------------------------------------------------------------------
const CAP_D = 150;
const CAP_L = Math.round(CAP_D * 0.87);
const ICON_FLATWARE =
  "M208.5-128.5Q200-137 200-150v-381q-33 0-56.5-23.5T120-611v-206q0-9 7-16t16-7q9 0 16.5 7t7.5 16v142h40v-142q0-9 7-16t16-7q9 0 16 7t7 16v142h40v-142q0-9 7.5-16t16.5-7q9 0 16 7t7 16v206q0 33-23.5 56.5T260-531v381q0 13-8.5 21.5T230-120q-13 0-21.5-8.5Zm280 0Q480-137 480-150v-383q-41-23-62-62t-21-90q0-60 30.5-107.5T511-840q53 0 83.5 47.5T625-685q0 51-22 90t-63 62v383q0 13-8.5 21.5T510-120q-13 0-21.5-8.5Zm214 0Q694-137 694-150v-653q0-12 9-21t21-9q43 0 79.5 43.5T840-694v214q0 13-8.5 21.5T810-450h-56v300q0 13-8.5 21.5T724-120q-13 0-21.5-8.5Z";
const ICON_LAUNDRY =
  "M167-212q-8-10-7-22.5t11-20.5l56-47q23-19 51-29t57-10q29 0 56.5 10t50.5 29l116 99q14 12 31.5 17.5T626-180q19 0 36.5-5.5T694-203l56-49q10-8 22.5-7t20.5 11q8 10 7 22.5T789-205l-56 47q-23 19-50.5 28.5T626-120q-29 0-57-9.5T518-158l-115-99q-14-12-31.5-17.5T335-280q-19 0-36.5 5.5T267-257l-57 49q-10 8-22.5 7T167-212Zm73-168v-141l-49 27q-11 6-23 3t-18-14L60-662q-6-11-3-23t14-18l214-123q11-7 23.5-10.5T334-840q12 0 21.5 7t14.5 18q14 38 42.5 66.5T480-720q39 0 67.5-28.5T590-815q5-11 15-18t22-7q13 0 25 3.5t23 10.5l214 123q11 6 14 18t-3 23l-90 157q-6 11-18 14t-23-3l-49-27v216l-60 51q-7 7-15.5 11t-18.5 4q-8 0-15.5-2.5T597-249l-116-99q-31-26-68.5-39.5T335-401q-25 0-48.5 5T240-380Z";

// Where each cap sits: on top of its own tower, stepping up ahead of the slab
// that is about to arrive, so it rides the growth and clears the landing.
const capTrack = (arrive: number[], base: number) => {
  const F: number[] = [0];
  const Y: number[] = [slabTop(base - 1)];
  arrive.forEach((a, j) => {
    // Kept strictly rising: two arrivals close together would otherwise hand
    // interpolate() a non-monotonic track.
    const start = Math.max(F[F.length - 1] + 1, a - FALL);
    F.push(start, Math.max(start + 1, a - 2));
    Y.push(Y[Y.length - 1], slabTop(base + j));
  });
  return { F, Y };
};
const DISH_CAP = capTrack(DISH_ARRIVE, DISH_BASE);
const LAUN_CAP = capTrack(LAUN_ARRIVE, LAUN_BASE);

const GreatTasksPoorToStart: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  unknownOpacity,
  readOpacity,
  recedeOpacity,
  capOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // One continuous widening: tight on the pair while they grow, opening as the
  // rule crosses the field, resolving on a pull-back. The content centre is
  // held at y 835 in every phase, so the composition never drifts under the
  // burned-in captions.
  const CAM_F = [0, beats.automate, beats.veryPoor, beats.ruleLands, 100, 126];
  const CAM_K = [1.22, 1.04, 1.02, 0.98, 0.95, 0.92];
  const CAM_CY = [1272, 1090, 1093, 1098, 1102, 1106];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );
  const tx = X0 - X0 * k;
  const ty = 960 - cy * k;

  const ease = (f: number[], v: number[], easing = GLIDE) =>
    interpolate(frame, f, v, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });

  // The rule. It draws in ink behind a white tip — it is being read, not yet
  // understood — and only becomes accent once it has crossed everything.
  const tipX = ease([beats.veryPoor, beats.ruleLands], [RULE_X0, RULE_X1]);
  const ruleDrawing = frame >= beats.veryPoor && frame < beats.ruleLands;
  const ruleDone = clamp01((frame - beats.ruleLands) / 8);
  const ruleColour = interpolateColors(ruleDone, [0, 1], [ink, accent]);
  const ruleLand = clamp01(1 - Math.abs(frame - beats.ruleLands) / 7);

  // As the tip crosses a tower it wipes the value read off it, left to right,
  // across the tower's own width. The withdrawal is caused by the line
  // arriving, not by a frame number sitting next to it.
  const wipe = (cx: number, w: number) =>
    frame < beats.veryPoor ? 0 : clamp01((tipX - (cx - w / 2 - 60)) / (w + 120));

  // "start with": a bright pulse runs out along the finished rule from the
  // centre, and each job it passes comes up to the read state.
  const pulseX = ease([PULSE_F, PULSE_F + PULSE_SPAN], [0, PULSE_REACH]);
  const pulseAlive = clamp01((frame - PULSE_F) / 3) * ease([PULSE_F + PULSE_SPAN - 5, PULSE_F + PULSE_SPAN + 3], [1, 0]);

  // "counterintuitively": the two tallest are the two that recede.
  const towerInk = ease(
    [beats.counterintuitively, beats.counterintuitively + 16],
    [readOpacity, recedeOpacity],
  );
  const capInk = ease(
    [beats.counterintuitively, beats.counterintuitively + 16],
    [capOpacity, capOpacity * 0.6],
  );

  const tower = (
    key: string,
    cx: number,
    n: number,
    base: number,
    arrive: number[],
    cap: { F: number[]; Y: number[] },
    capPath: string,
    capBox: number,
    lead: number,
    cloth: boolean,
  ) => {
    const slabs = [];
    for (let i = 0; i < n; i++) {
      const at = i < base ? -999 : arrive[i - base];
      if (frame < at - FALL) continue;

      const drop = clamp01((frame - (at - FALL)) / FALL);
      const fall = i < base ? 1 : LAND(drop);
      const born = i < base ? 1 : clamp01((frame - (at - FALL)) / 4);

      // Weight on landing: the slab takes the impact as a squash and gives the
      // width back, so an arrival has a body rather than just a stop.
      const settle = i < base ? 1 : clamp01((frame - at) / 6);
      const squash = i < base ? 0 : (1 - settle) * Math.max(0, drop * 2 - 1);
      const h = SLAB_H * (1 - 0.14 * squash);
      const wSquash = 1 + 0.05 * squash;

      // Cloth is never stacked square: garments sit off-centre and breathe;
      // crockery does not. This is the one ambient layer, and it is the
      // material itself rather than a decoration laid over it.
      const sway = cloth ? Math.sin((frame + i * 17) * 0.052) * 3 : 0;
      const skew = cloth ? (((i * 37) % 11) - 5) * 1.8 : 0;
      const w = (cloth ? SLAB_W - 14 + ((i * 29) % 5) * 7 : SLAB_W) * wSquash;

      const base_y = slabTop(i) + SLAB_H - FALL_H * (1 - fall);
      const centre = slabTop(i) + SLAB_H / 2;
      const amberAt =
        AMBER_F + lead + (AMBER_SPAN * (GY - centre)) / (GY - AMBER_TOP);
      const amber = clamp01((frame - amberAt) / 5) * (1 - wipe(cx, SLAB_W));

      slabs.push(
        <rect
          key={`${key}-${i}`}
          x={cx - w / 2 + sway + skew}
          y={base_y - h}
          width={w}
          height={h}
          rx={cloth ? 12 : SLAB_H / 2}
          fill={interpolateColors(amber, [0, 1], [ink, accent])}
          opacity={born * Math.min(1, towerInk + 0.06 * amber)}
        />,
      );
    }

    const capY =
      interpolate(frame, cap.F, cap.Y, {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: GLIDE,
      }) -
      CAP_GAP -
      capBox +
      Math.sin(frame * 0.058 + lead) * 3;
    const capAmber =
      clamp01((frame - (AMBER_F + lead + AMBER_SPAN * 0.94)) / 6) *
      (1 - wipe(cx, SLAB_W));

    return (
      <g key={key}>
        {slabs}
        <svg
          x={cx - capBox / 2}
          y={capY}
          width={capBox}
          height={capBox}
          viewBox="0 -960 960 960"
          overflow="visible"
        >
          <path
            d={capPath}
            fill={interpolateColors(capAmber, [0, 1], [ink, accent])}
            opacity={capInk}
          />
        </svg>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, CAM_CY[0], backgroundBlur, backgroundDim)}
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
            <rect
              x={RULE_X0 - 60}
              y={GY}
              width={RULE_X1 - RULE_X0 + 120}
              height={GROUND_W}
              fill={ink}
              opacity={GROUND_O}
            />

            {/* The rest of the field. Present from the first frame at the
                unknown state, so nothing has to be introduced later; it comes
                up when the pulse reaches it. */}
            {SMALL.map((s, i) => {
              const on = clamp01((pulseX - Math.abs(s.cx - X0)) / 130);
              return Array.from({ length: s.n }, (_, j) => (
                <rect
                  key={`s-${i}-${j}`}
                  x={s.cx - s.w / 2}
                  y={GY - (j + 1) * SMALL_PITCH + (SMALL_PITCH - SMALL_H)}
                  width={s.w}
                  height={SMALL_H}
                  rx={9}
                  fill={ink}
                  opacity={unknownOpacity + (readOpacity - unknownOpacity) * on}
                />
              ));
            })}

            {tower(
              "dishes",
              DISHES_X,
              DISHES_N,
              DISH_BASE,
              DISH_ARRIVE,
              DISH_CAP,
              ICON_FLATWARE,
              CAP_D,
              0,
              false,
            )}
            {tower(
              "laundry",
              LAUNDRY_X,
              LAUNDRY_N,
              LAUN_BASE,
              LAUN_ARRIVE,
              LAUN_CAP,
              ICON_LAUNDRY,
              CAP_L,
              2,
              true,
            )}

            {/* What you can actually reach on day one. */}
            {frame >= beats.veryPoor ? (
              <>
                <rect
                  x={RULE_X0}
                  y={RULE_Y - RULE_H / 2}
                  width={Math.max(0, tipX - RULE_X0)}
                  height={RULE_H}
                  fill={ruleColour}
                  opacity={0.9 + 0.1 * ruleLand}
                />
                {ruleDrawing ? (
                  <circle cx={tipX} cy={RULE_Y} r={11} fill={ink} opacity={0.95} />
                ) : null}
                {pulseAlive > 0.01
                  ? [-1, 1].map((d) => (
                      <rect
                        key={`pulse-${d}`}
                        x={X0 + d * pulseX - 55}
                        y={RULE_Y - RULE_H / 2 - 2}
                        width={110}
                        height={RULE_H + 4}
                        rx={RULE_H / 2 + 2}
                        fill={ink}
                        opacity={0.85 * pulseAlive}
                      />
                    ))
                  : null}
              </>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default GreatTasksPoorToStart;
