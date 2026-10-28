// ---------------------------------------------------------------------------
// SmallNumberOfIdeasAway (sam-macintosh-moment, cut 26), rev 1: the TIMELINE. Cheeky Pint style (stout)
// (styles/cheeky-pint.md). Opaque 1080x1920, 23.976 fps, 108 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "personal agents like Dots are today only a few ideas short of their mainstream moment, and it isn't
// far ahead on the timeline."
//
// THE LINE (Sam Altman): "But I think this is like a small number of ideas away from a super mainstream thing."
// ("this" = personal agents such as OpenAI's Dots.)
// WORD -> FRAME: I f2 · think f6 · this f14 · is f19 · like f24 · a f27 · small f33 · number f42 · of f53 · ideas f57 ·
// away f63 · from f72 · a f78 · super f81 · mainstream f86 · thing f93 · ("Oh" f103, John).
// DURATION: the slot 26.109 -> 30.614 s = 4.504 s x 23.976 = 108 frames (f0..f107); hard cut after f107.
//
// THE MOTION: one camera tracking right along ONE horizontal time axis while it widens. f0: close on a thick cream
// time rule (small ticks under it): solid behind TODAY, dashed cream lo ahead (the future is not built), its dashed
// tip drawing on ahead of the camera from f0; the cream Dots tile (OpenAI's ring + "dots") stands pinned on the rule
// at TODAY and settles; "TODAY" (the only word) slides up in under the rule. "small number" (f27 -> f51): three
// small idea cards drop onto the dashed rule just ahead of today from above the frame, close and evenly spaced, at
// board tone, a lightbulb in ink on each. "ideas": as the camera passes them each card warms through cream to
// amber, its bulb's glass lit (f55 / 58 / 61). "away from a super mainstream": a short dashed stretch further on,
// the milestone, a tall cream flag on a slim pole, is planted in the rule from above the frame (f60 -> f76; its stake
// sinks into the line; board in flight, cream as it lands; its cloth flies left, back over the dashed gap), and the
// crowd rises up out of the rule behind and to the right of the pole, a wave from the flag outward, dark as it comes
// up and lit as it lands (f66 -> f86..90; "mainstream" f86). Settled by ~f92: Dots at TODAY -> the three amber ideas
// -> the flag with its crowd (8 fully in frame, the row running off the right edge), the rule at y 880; a living
// hold to f107 (bobs, blinks, the cloth's ripple, drift, grain). Dots never leaves the frame. The rule between the
// third idea and the flag stays dashed: not there yet.
// CAMERA: makeClockCam, k 1.84 (f0, on TODAY) -> 1.5 (~f50, Dots + the ideas) -> 0.85 (settled ~f92, the whole
// stretch), one move right and wider; max speed ~15 px/f, max accel ~1.0; the rule stays at screen y ~830-880;
// readable things above y 1080 (TODAY's baseline <= ~960).
// CONTACT / REACTION: an idea card's foot meets the rule -> it settles (lift -> rest); the camera passes a card ->
// it warms (WARM_F); the flag's stake meets the rule -> it settles and turns cream (FLAG_LIT); the rise wave reaches
// a bust -> it rises.
// AMBER = the few missing ideas that would make personal agents indispensable (COMMON.md); cream = the subject (Dots,
// the milestone, the people), cream lo = the future not built yet.
//
// SOURCES: Dots = OpenAI's personal agent (COMMON.md). Lightbulb = Lucide "lightbulb" (ISC), inlined. No figures,
// no years: the only text is "TODAY".
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Label,
  METRIC,
  SPACE,
  StoutStage,
  lerp,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import {
  BUST,
  Bust,
  CLOTH,
  CROWD,
  DotsMark,
  HAIR,
  SKIN,
  blinkAt,
  bustSil,
  type BustSpec,
} from "./macintoshShared";
import {
  CAM,
  CROWD_DROP,
  CROWD_DY,
  CROWD_ROW,
  CROWD_X,
  DOTS,
  IDEA,
  IdeaNode,
  LINE,
  LINE_TOP,
  MilestoneFlag,
  POOL_AT,
  SETTLE,
  TODAY,
  TODAY_IN,
  TODAY_PX,
  TimeRule,
  crowdAt,
  ideaAt,
  flagAt,
  tipAt,
} from "./timelinePath";

export const FPS = 24000 / 1001;
export const DURATION = 108;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** An idea card waits this far above its rest (world px): above the frame's top edge when its drop starts. */
const DROP_H = 620;
/** The crowd reads as people from the shoulders: short torsos (head units) that fade into the board over FADE
 *  (world px below the head centre), above the rule; the shared shadow's silhouettes stop inside the opaque part. */
const CROWD_BODY = 252;
const SHADOW_BODY = 170;
const FADE = { y0: 1.78 * CROWD_ROW.r, y1: 4.03 * CROWD_ROW.r } as const;
/** The mainstream's cast: the shared CROWD plus five recolours of it, so neighbours never repeat; all turned left,
 *  back along the rule toward today (converging profiles would meet nose to nose). */
const MAIN_CAST: BustSpec[] = [
  ...CROWD,
  { ...CROWD[0], top: CLOTH.rust, hair: HAIR.auburn, hairStyle: "crop" },
  { ...CROWD[2], top: CLOTH.plum, skin: SKIN.light, glasses: false },
  {
    ...CROWD[4],
    top: CLOTH.terracotta,
    skin: SKIN.tan,
    hair: HAIR.ink,
    hairStyle: "curly",
    mustache: false,
  },
  {
    ...CROWD[6],
    top: CLOTH.sage,
    skin: SKIN.deeper,
    hair: HAIR.ink,
    hairStyle: "bun",
  },
  {
    ...CROWD[8],
    top: CLOTH.denim,
    skin: SKIN.cream,
    hair: HAIR.sandy,
    hairStyle: "bob",
  },
];

const SmallNumberOfIdeasAway: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const pool = POOL_AT(S);
  const flag = flagAt(S);
  const settle = smoothstep((S - SETTLE.f0) / (SETTLE.f1 - SETTLE.f0));
  const R = CROWD_ROW.r;
  const crowd = CROWD_X.map((x, i) => {
    const c = crowdAt(x, i, S);
    const facing: -1 | 1 = -1;
    return {
      x,
      i,
      ...c,
      y: CROWD_ROW.headY + CROWD_DY[i] + c.sink * CROWD_DROP,
      facing,
    };
  });
  const todayBase =
    LINE.y + LINE.w / 2 + TODAY.tick + (SPACE.AXIS + TODAY_PX * METRIC.cap) / k;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      <defs>
        {/* the crowd comes up out of the rule: nothing of it below the rule's top edge */}
        <clipPath id="sn26above">
          <rect x={-3000} y={LINE_TOP - 4000} width={8000} height={4000} />
        </clipPath>
        {crowd.map((c) => (
          <React.Fragment key={c.i}>
            <linearGradient
              id={`sn26cf${c.i}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={c.y + FADE.y0}
              x2="0"
              y2={c.y + FADE.y1}
            >
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask
              id={`sn26cm${c.i}`}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={c.x - 200}
              y={c.y - 200}
              width={400}
              height={200 + FADE.y1 + 10}
            >
              <rect
                x={c.x - 200}
                y={c.y - 200}
                width={400}
                height={200 + FADE.y1 + 10}
                fill={`url(#sn26cf${c.i})`}
              />
            </mask>
          </React.Fragment>
        ))}
      </defs>
      {/* the mainstream, behind the rule and the pin: ONE shadow for the row, then the people left to right */}
      <g clipPath="url(#sn26above)">
        <UnionShadow
          sil={crowd.flatMap((c) =>
            bustSil(c.x, c.y, R, c.facing, SHADOW_BODY),
          )}
          s={R / BUST.R}
        />
        {crowd.map((c) => (
          <g key={c.i} mask={`url(#sn26cm${c.i})`}>
            <Bust
              x={c.x}
              y={c.y}
              r={R}
              bodyLen={CROWD_BODY}
              spec={MAIN_CAST[(c.i * 7 + 3) % MAIN_CAST.length]}
              facing={c.facing}
              pose={{
                dim: c.dark,
                bob: c.bob,
                smile: 0.4 * (1 - c.dark),
                blink: blinkAt(c.i, S),
              }}
            />
          </g>
        ))}
      </g>
      {/* the milestone flag, planted in the rule: drawn before the rule so its stake sinks into the line */}
      {flag.shown ? (
        <MilestoneFlag
          k={k}
          dim={flag.dim}
          fall={flag.fall}
          lift={flag.lift}
          ph={flag.ph}
        />
      ) : null}
      {/* the time rule: solid behind today, the dashed future drawn ahead by its tip */}
      <TimeRule tip={tipAt(S)} k={k} />

      {/* the three ideas, dropped onto the rule, warming on "ideas" */}
      {IDEA.xs.map((x, i) => {
        const s = ideaAt(i, S);
        if (!s.shown) return null;
        return (
          <IdeaNode
            key={i}
            x={x}
            floor={LINE_TOP}
            size={IDEA.size}
            k={k}
            fall={(1 - s.land) * DROP_H}
            lift={s.lift}
            dim={s.dim}
            warm={s.warm}
          />
        );
      })}
      {/* Dots, pinned on the rule at TODAY */}
      <DotsMark
        x={DOTS.x}
        floor={DOTS.floor - 6 * lerp(1, 0, settle)}
        size={DOTS.size}
        k={k}
        lift={lerp(1, 0, settle)}
        wordmark
      />
      <Label
        x={TODAY.x}
        y={todayBase}
        k={k}
        px={TODAY_PX}
        text="TODAY"
        tone="cream"
        enter={(S - TODAY_IN) / 12}
      />
    </StoutStage>
  );
};

export default SmallNumberOfIdeasAway;
