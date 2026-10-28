// ---------------------------------------------------------------------------
// SmallNumberOfIdeasAway (sam-macintosh-moment, cut 26). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 108 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "a personal agent like Dots is only a few missing ideas away from a huge mainstream audience".
//
// THE LINE (Sam Altman): "But I think this is like a small number of ideas away from a super mainstream thing."
// ("this" = personal agents such as OpenAI's Dots.)
// WORD -> FRAME: I f2 · think f6 · this f14 · is f19 · like f24 · a f27 · small f33 · number f42 · of f53 · ideas f57 ·
// away f63 · from f72 · a f78 · super f81 · mainstream f86 · thing f93 · ("Oh" f103, John).
// DURATION: the slot 26.109 -> 30.614 s = 4.504 s x 23.976 = 108 frames (f0..f107); hard cut after f107.
//
// THE MOTION: one path down the board under one continuous pull-back. f0: tight on the cream Dots tile (OpenAI's
// ring + "dots", ~430 px wide, centre y ~780) settling onto the board in the light, its few people close beside it,
// the camera already gliding back; the stones are not drawn yet. "small number": the light runs ahead down a gentle
// diagonal and lights three equal stepping stones across the empty gap (f31 / 37 / 43, from the board's own tone to
// cream lo): dashed outlines of tiles not built yet, a lightbulb in each. "ideas": the three bulbs warm to amber,
// nearest first (f55 / 58 / 61). "away ... from a super mainstream": the pull-back continues and the light travels on
// past the stones while a long row of ~13+ people (heads about Dots's four), shoulder humps overlapping and running
// off both edges, rises from below the frame into the light, a wave from under the last stone out to both edges
// (f60 -> f85..90; dim as they come up, lit over the second half of the rise); their short torsos fade into the board
// just below the shoulders (no columns). Resolved from ~f90: the Dots group y ~291-518 (tile ~227 px, group x ~65-853)
// -> three 140 px amber-bulb stones stepping down y ~574-877 -> the crowd (hair-chin y ~903-1018, torsos gone by
// ~1195, dark board below); nothing has crossed. A living hold to f107 (bobs, blinks, a slow creep, drift, grain).
// CAMERA: makeClockCam, k 1.92 -> 1.27 (path centred mid-cut; each stone lights as it clears the caption band)
// -> 1.0 (f98) + a slow creep; max speed ~16 px/f, no stall, eases out.
// CONTACT / REACTION: the pool's centre passes stone i -> stone i lights (LIT_F); the rise wave reaches a bust -> it
// starts rising (riseStart).
// AMBER = the few missing ideas that would make personal agents indispensable (COMMON.md); cream = the subject (Dots,
// the people), cream lo = what is not built yet.
//
// SOURCES: Dots = OpenAI's personal agent (COMMON.md). Lightbulb = Lucide "lightbulb" (ISC), inlined. No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  StoutStage,
  amberBandFor,
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
  CROWD_DY,
  CROWD_ROW,
  CROWD_X,
  DOTS,
  FAINT,
  HEAD_R,
  FEW,
  LIT_F,
  LIT_FRAMES,
  POOL_AT,
  SETTLE,
  STONES,
  Stone,
  WARM_F,
  WARM_FRAMES,
  crowdAt,
} from "./ideasPath";

export const FPS = 24000 / 1001;
export const DURATION = 108;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** People: the shared Bust, one head radius for Dots's few and the crowd (world px). HEAD_UP = the head centre
 *  above the floor / slot they stand in; the body runs down to it. */
const HEAD_UP = (100 / 44) * HEAD_R;
const BODY_LEN = (HEAD_UP / HEAD_R) * BUST.R;
/** The crowd reads as people from the shoulders: short torsos (head units) that end soon below the shoulder humps and
 *  fade into the board over FADE (world px below the head centre: at rest ~y 1060 -> ~1195), so no long parallel
 *  columns run down the frame; below them is dark board. The shared shadow's silhouettes stop inside the opaque part
 *  (SHADOW_BODY), so it reads as one soft shadow under the row. */
const CROWD_BODY = 270;
const SHADOW_BODY = 170;
const FADE = { y0: 100, y1: 232 } as const;
/** The mainstream's cast: the shared CROWD plus five recolours of it (other tops / hair), so neighbours along the
 *  dense row never repeat; all turned one way (left, up the row toward Dots: converging profiles would meet nose to
 *  nose). */
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
  const band = amberBandFor(cam);
  const pool = POOL_AT(S);
  const settle = smoothstep((S - SETTLE.f0) / (SETTLE.f1 - SETTLE.f0));
  // the crowd: everyone turned one way, up the row toward the Dots side (converging profiles would meet nose to nose)
  const crowd = CROWD_X.map((x, i) => {
    const c = crowdAt(x, i, S);
    const facing: -1 | 1 = -1;
    return {
      x,
      i,
      ...c,
      y: CROWD_ROW.headY + CROWD_DY[i] + c.sink * CROWD_ROW.drop,
      facing,
    };
  });
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      {/* the mainstream: ONE shadow for the whole row, then the people left to right (each face, turned left, sits in
          front of its neighbour's back); bodies run off the bottom of the frame */}
      <UnionShadow
        sil={crowd.flatMap((c) =>
          bustSil(c.x, c.y, HEAD_R, c.facing, SHADOW_BODY),
        )}
        s={HEAD_R / BUST.R}
      />
      <defs>
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
      {crowd.map((c) => (
        <g key={c.i} mask={`url(#sn26cm${c.i})`}>
          <Bust
            x={c.x}
            y={c.y}
            r={HEAD_R}
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
      {/* the three stones, lit by the light running ahead, their bulbs warming on "ideas" */}
      {STONES.map((p, i) => (
        <Stone
          key={i}
          x={p.x}
          y={p.y}
          k={k}
          band={band}
          lit={lerp(FAINT, 1, smoothstep((S - LIT_F[i]) / LIT_FRAMES))}
          warm={smoothstep((S - WARM_F[i]) / WARM_FRAMES)}
        />
      ))}
      {/* Dots's few people, turned toward the tile, then the tile settling in the light */}
      {FEW.map((dx, i) => {
        const x = DOTS.x + dx;
        const facing: -1 | 1 = dx < 0 ? 1 : -1;
        return (
          <g key={i}>
            <UnionShadow
              sil={bustSil(x, DOTS.floor - HEAD_UP, HEAD_R, facing, BODY_LEN)}
              s={HEAD_R / BUST.R}
              contact={{ x, y: DOTS.floor, w: 2.6 * HEAD_R }}
            />
            <Bust
              x={x}
              y={DOTS.floor - HEAD_UP}
              r={HEAD_R}
              spec={CROWD[i]}
              facing={facing}
              bodyLen={BODY_LEN}
              pose={{
                bob: 3 * Math.sin(S * (0.12 + 0.02 * i) + i * 1.7),
                smile: 0.5,
                blink: blinkAt(i + 20, S),
              }}
            />
          </g>
        );
      })}
      <DotsMark
        x={DOTS.x}
        floor={DOTS.floor - 6 * lerp(1, 0, settle)}
        size={DOTS.size}
        k={k}
        lift={lerp(1, 0, settle)}
        wordmark
      />
    </StoutStage>
  );
};

export default SmallNumberOfIdeasAway;
