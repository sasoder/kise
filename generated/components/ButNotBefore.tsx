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
  CAM_DAMP,
  CAM_STIFF,
  GLIDE,
  GROUND_O,
  GROUND_W,
  LAND,
  backdropStyle,
  clamp01,
  runCamera,
} from "./cheekyPintSystem";
import {
  CAP_D,
  CAP_GAP,
  CAP_L,
  DISHES_N,
  DISHES_X,
  GAP,
  GY,
  ICON_FLATWARE,
  ICON_LAUNDRY,
  LAUNDRY_N,
  LAUNDRY_X,
  PITCH,
  RULE_H,
  RULE_X0,
  RULE_X1,
  SLAB_H,
  SLAB_W,
  SMALL,
  SMALL_H,
  SMALL_PITCH,
  slabTop,
} from "./GreatTasksPoorToStart";

export const FPS = 24;
// "over time as the technology improves — and i can confidently say to you, we
// can do the dishes in the exact way that you want — then we'll deliver that
// experience. but not before." — SRT 33.960s -> 40.619s at 24fps.
export const DURATION = 160;

// ---------------------------------------------------------------------------
// But not before
//
// The payoff to `GreatTasksPoorToStart`, and built on its world rather than a
// copy of it — same plates, same grid, same rule, imported. That cut left the
// dishes tower standing above the reach rule. This one brings the rule up to
// get it, and then takes it all back.
//
// Every move is the previous cut's move run the other way. There the rule swept
// across and drained the value out of the tower; here it climbs the tower's own
// gaps and pours the value back in. Which is what makes the last three words
// work: "but not before" is not a new idea, it is the whole thing releasing at
// once and dropping back to the frame it started on.
//
// The rule climbs on the stack's own grid — gap to gap, never landing on a
// slab — because that grid is what it is measuring itself against.
// ---------------------------------------------------------------------------
const GAP_Y = (s: number) => GY - (s + 1) * PITCH + GAP / 2;
const TOWER_TOP = slabTop(DISHES_N - 1);
// Flush means resting on the top edge, not straddling it.
const LOCK_Y = TOWER_TOP - RULE_H / 2;

// One step per word. Six of them, from where the last cut left the rule to the
// air above the whole stack.
//
// A true ratchet: it dwells in a gap and then takes the next one in seven
// frames. An eased continuous climb was tried and rejected — it spends most of
// its time halfway between gaps, which puts the line through a slab for most of
// the shot, which is the one thing this rule must never do.
const STEP_MOVE = 7;
const STEP_BEATS = [16, 25, 41, 52, 64, 72];
const STEP_S = [2, 3, 4, 5, 6, 7, 8];
const STEP_F: number[] = [0];
const STEP_Y: number[] = [GAP_Y(STEP_S[0])];
STEP_BEATS.forEach((b, j) => {
  STEP_F.push(b - STEP_MOVE, b);
  STEP_Y.push(GAP_Y(STEP_S[j]), GAP_Y(STEP_S[j + 1]));
});
const CLEARED = GAP_Y(8);
// Once it has cleared the requirement it floats up off it, which is also what
// gives the lock something to descend through.
const FREE = CLEARED - 46;

const WORLD_W = 1080;
const WORLD_H = 1920;

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
  readOpacity: z.number(),
  recedeOpacity: z.number(),
  asideOpacity: z.number(),
  capOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "time as the" · 16 "technology" · 25 "improves" · 33 "and i can"
  //   41 "confidently" · 52 "say to you" · 64 "we can do" · 72 "the dishes"
  //   84 "in the" · 89 "exact way" · 100 "that you" · 105 "want then we'll"
  //   122 "deliver that" · 132 "experience" · 142 "but not before" · 160 end
  beats: z.object({
    theDishes: z.number().int(),
    inThe: z.number().int(),
    exactWay: z.number().int(),
    thenWell: z.number().int(),
    experience: z.number().int(),
    butNotBefore: z.number().int(),
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
  readOpacity: 0.92,
  // The state the previous cut resolved on, so this one opens on its last
  // frame rather than near it.
  recedeOpacity: 0.62,
  asideOpacity: 0.3,
  capOpacity: 0.55,
  beats: {
    theDishes: 72,
    inThe: 84,
    exactWay: 89,
    thenWell: 105,
    experience: 132,
    butNotBefore: 142,
  },
});

const ButNotBefore: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  readOpacity,
  recedeOpacity,
  asideOpacity,
  capOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // The camera goes out and comes back, because the line does: it narrows onto
  // the dishes as he names them and returns to the opening framing on "but not
  // before", so the last frame is the first frame.
  const CAM_F = [0, 25, 64, beats.exactWay, beats.thenWell, 136, 158];
  const CAM_K = [0.92, 0.94, 0.96, 1.03, 1.03, 1.0, 0.92];
  const CAM_CY = [1099, 1096, 1093, 1084, 1084, 1088, 1099];
  const CAM_CX = [540, 540, 520, 460, 460, 470, 540];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );
  // Same hand as the system camera — the horizontal just is not part of its
  // signature, so it is integrated here on the same stiffness and damping.
  const cx = React.useMemo(() => {
    let v = 0;
    let x = CAM_CX[0];
    for (let f = 1; f <= frame; f++) {
      const t = interpolate(f, CAM_F, CAM_CX, {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      v += (t - x) * CAM_STIFF - v * CAM_DAMP;
      x += v;
    }
    return x;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);

  const tx = 540 - cx * k;
  const ty = 960 - cy * k;

  const ease = (f: number[], v: number[], easing = GLIDE) =>
    interpolate(frame, f, v, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });

  // ---- the rule -----------------------------------------------------------
  const climb = ease(STEP_F, STEP_Y, LAND);
  const drift = ease([74, beats.inThe + 2], [0, 1]);
  const lock = ease([beats.inThe + 2, beats.exactWay + 9], [0, 1], LAND);
  const fall = ease(
    [beats.butNotBefore, beats.butNotBefore + 10],
    [0, 1],
    Easing.in(Easing.cubic),
  );
  const land = clamp01((frame - (beats.butNotBefore + 10)) / 6);
  const ruleY =
    climb +
    (FREE - CLEARED) * drift +
    (LOCK_Y - FREE) * lock +
    (GAP_Y(2) - LOCK_Y) * fall +
    6 * Math.sin(Math.PI * land);

  // "in the exact way that you want": the line stops being a general limit and
  // becomes this one thing's exact size — it draws in from both ends until it
  // is the tower's own footprint. On "but not before" it lets go and is a
  // general limit again.
  const expand = ease(
    [beats.butNotBefore, beats.butNotBefore + 8],
    [0, 1],
  );
  const fit = lock * (1 - expand);
  const rx0 = RULE_X0 + (DISHES_X - SLAB_W / 2 - RULE_X0) * fit;
  const rx1 = RULE_X1 + (DISHES_X + SLAB_W / 2 - RULE_X1) * fit;
  const fitClick = clamp01(1 - Math.abs(frame - (beats.exactWay + 9)) / 6);

  // ---- the pour -----------------------------------------------------------
  // The exact inverse of the previous cut, where the rule crossed the tower and
  // drained the accent out of it top-down. Here it pours back in from the lid.
  const pour = ease([beats.thenWell, 136], [TOWER_TOP, GY]);
  const drainAt = (i: number) =>
    beats.butNotBefore + (i / (DISHES_N - 1)) * 5;

  const dishInk = ease(
    [0, beats.theDishes, beats.butNotBefore, beats.butNotBefore + 12],
    [recedeOpacity, readOpacity, readOpacity, recedeOpacity],
  );
  const asideInk = ease(
    [0, 60, 76, beats.butNotBefore, beats.butNotBefore + 12],
    [recedeOpacity, recedeOpacity, asideOpacity, asideOpacity, recedeOpacity],
  );
  // The laundry mark sits lower than the dishes mark, because its tower is one
  // slab shorter — which puts it exactly where the rule ends up once it has
  // cleared the stack. It is a label, not an object, so it steps aside ahead of
  // its own tower rather than being crossed out by the line.
  const asideCap = ease(
    [0, 56, 66, beats.butNotBefore, beats.butNotBefore + 12],
    [capOpacity, capOpacity, 0.05, 0.05, capOpacity],
  );

  const tower = (
    key: string,
    cxTower: number,
    n: number,
    capPath: string,
    capBox: number,
    inkO: number,
    capO: number,
    pouring: boolean,
  ) => {
    const slabs = [];
    for (let i = 0; i < n; i++) {
      const centre = slabTop(i) + SLAB_H / 2;
      const amber = pouring
        ? clamp01((pour - centre) / 26) * (1 - clamp01((frame - drainAt(i)) / 4))
        : 0;
      const sway = Math.sin((frame + i * 17 + (pouring ? 0 : 80)) * 0.052) * 2;
      slabs.push(
        <rect
          key={`${key}-${i}`}
          x={cxTower - SLAB_W / 2 + sway}
          y={slabTop(i)}
          width={SLAB_W}
          height={SLAB_H}
          rx={SLAB_H / 2}
          fill={interpolateColors(amber, [0, 1], [ink, accent])}
          opacity={Math.min(1, inkO + 0.06 * amber)}
        />,
      );
    }

    const capAmber = pouring
      ? clamp01((frame - (beats.exactWay + 4)) / 8) *
        (1 - clamp01((frame - beats.butNotBefore) / 4))
      : 0;
    const capY =
      slabTop(n - 1) - CAP_GAP - capBox + Math.sin(frame * 0.058) * 3;

    return (
      <g key={key}>
        {slabs}
        <svg
          x={cxTower - capBox / 2}
          y={capY}
          width={capBox}
          height={capBox}
          viewBox="0 -960 960 960"
          overflow="visible"
        >
          <path
            d={capPath}
            fill={interpolateColors(capAmber, [0, 1], [ink, accent])}
            opacity={capO}
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
              rx={GROUND_W / 2}
              fill={ink}
              opacity={GROUND_O}
            />

            {/* The field, exactly where the last cut left it. */}
            {SMALL.map((s, i) =>
              Array.from({ length: s.n }, (_, j) => (
                <rect
                  key={`s-${i}-${j}`}
                  x={s.cx - s.w / 2}
                  y={GY - (j + 1) * SMALL_PITCH + (SMALL_PITCH - SMALL_H)}
                  width={s.w}
                  height={SMALL_H}
                  rx={SMALL_H / 2}
                  fill={ink}
                  opacity={readOpacity}
                />
              )),
            )}

            {tower(
              "laundry",
              LAUNDRY_X,
              LAUNDRY_N,
              ICON_LAUNDRY,
              CAP_L,
              asideInk,
              asideCap,
              false,
            )}
            {tower(
              "dishes",
              DISHES_X,
              DISHES_N,
              ICON_FLATWARE,
              CAP_D,
              dishInk,
              (capOpacity * dishInk) / readOpacity,
              true,
            )}

            <rect
              x={rx0}
              y={ruleY - (RULE_H + 4 * fitClick) / 2}
              width={Math.max(0, rx1 - rx0)}
              height={RULE_H + 4 * fitClick}
              rx={(RULE_H + 4 * fitClick) / 2}
              fill={accent}
              opacity={0.9 + 0.1 * fitClick}
            />
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ButNotBefore;
