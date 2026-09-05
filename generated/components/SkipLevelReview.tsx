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
  AMBIENT_O,
  FLASH,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  LAND,
  backdropStyle,
  hash,
  qbez,
  runCamera,
  sgnPick,
} from "./cheekyPintSystem";

export const FPS = 24;
// 00:00:11,759 -> 00:00:18,500 of the source cut. round(6.741 * 24) = 162.
export const DURATION = 162;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GLIDE = Easing.inOut(Easing.cubic);
const RISE = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// The world
//
// A ground with people standing on it, one report above them, a review rule
// above that, and the actor the review is for above the rule. Everything is a
// dot, a tile, a line or a rule — the same four primitives the other paper
// cutaways are built from.
//
// The grid is the rule's: seven slots at one pitch, so the count on the rule
// is countable and the width of the rule is what makes one contribution look
// like one. The people are spread wider than the slots so every thread is its
// own length and its own diagonal, never a row of parallels.
// ---------------------------------------------------------------------------
const WORLD_W = 2200;
const WORLD_H = 3000;
const X0 = 1100;

const N = 7;
const SLOT_PITCH = 100;
const TILE_W = 62;
const TILE_H = 30;
const RULE_Y = 1330;
const RULE_HALF = 360;

const MGR_Y = 1740;
const MGR_R = 42;

const HIM_Y = 1060;
const HIM_R = 58;

const GROUND_Y = 2160;
const GROUND_HALF = 440;
const SRC_PITCH = 138;

const tileX = (i: number) => X0 + (i - (N - 1) / 2) * SLOT_PITCH;

const PEOPLE = Array.from({ length: N }, (_, i) => {
  const r = 22 * (0.8 + hash(i * 3 + 1) * 0.4);
  return {
    x: X0 + (i - (N - 1) / 2) * SRC_PITCH + sgnPick(i * 7 + 2) * hash(i * 5 + 3) * 16,
    r,
    y: GROUND_Y - r,
    // Each thread bows its own way, so seven rising at once read as seven
    // things happening rather than one gesture performed in unison.
    bow: sgnPick(i * 11 + 5) * (54 + hash(i * 13 + 7) * 62),
  };
});

// Sampled rather than emitted as a Q path, because the line has to be drawable
// to a fraction of its length with a tip on the end.
const bez = (
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
) => {
  const n = 20;
  const pts: string[] = [];
  for (let s = 0; s <= n; s++) {
    const u = (s / n) * t;
    pts.push(`${qbez(x0, cx, x1, u).toFixed(1)} ${qbez(y0, cy, y1, u).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
};
const bezAt = (
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  u: number,
) => ({ x: qbez(x0, cx, x1, u), y: qbez(y0, cy, y1, u) });

// The camera is one continuous widening: it starts on the ground and the one
// report, lifts to take in the review rule and the person it is for, and ends
// pulled back on the whole structure.
const CAM_F = [0, 26, 46, 80, 108, 140, DURATION];
const CAM_K = [1.18, 1.14, 1.08, 1.05, 1.0, 0.92, 0.92];
const CAM_CY = [1900, 1840, 1790, 1775, 1780, 1730, 1730];

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
  himOpacity: z.number().min(0).max(1),
  threadW: z.number().min(1).max(12),
  beats: z.object({
    // Beat frames lifted from the SRT at 24fps, f0 = 00:00:11,759.
    //   f0 instead of      f8 having the    f15 person that   f23 reports to
    //   f33 me say things  f68 it's everyone   f80 that reports to
    //   f98 them says      f117 something    f124 in the
    //   f139 technical     f147 review (ends f162)
    person: z.number().int(),
    feed: z.number().int(),
    carry: z.number().int(),
    bypass: z.number().int(),
    first: z.number().int(),
    lift: z.number().int(),
    resolve: z.number().int(),
  }),
});

export type SkipLevelReviewProps = z.infer<typeof schema>;

export const defaultProps: SkipLevelReviewProps = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  himOpacity: 0.5,
  threadW: 4,
  beats: {
    person: 15,
    feed: 23,
    carry: 33,
    bypass: 68,
    first: 78,
    lift: 124,
    resolve: 132,
  },
});

const FEED_DRAW = 13;
const FEED_STAG = 3;
const CARRY_DRAW = 12;
const SEND_STAG = 7;
const SEND_DRAW = 15;
const TILE_IN = 9;

export const SkipLevelReview: React.FC<SkipLevelReviewProps> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  himOpacity,
  threadW,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = React.useMemo(() => runCamera(frame, CAM_F, CAM_K, CAM_CY), [frame]);
  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  // The one channel gives way. It does not leave the frame — it stays exactly
  // where it was and recedes to the ambient floor, so the seven threads can be
  // seen going around the person they used to go through.
  const give = interpolate(frame, [beats.bypass, beats.bypass + 12], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const mgrLive = interpolate(frame, [beats.person, beats.person + 8], [0.4, 0.95], {
    ...CLAMP,
    easing: RISE,
  });
  const mgrO = mgrLive + (AMBIENT_O - mgrLive) * give;
  const mgrR = MGR_R * (1 - 0.19 * give);
  const ringIn = interpolate(frame, [beats.person, beats.person + 11], [0, 1], {
    ...CLAMP,
    easing: LAND,
  });

  // The one thing that got said. It is drawn up, it sits alone on a rule wide
  // enough for seven, and when the channel gives way it goes back down the way
  // it came instead of being cut — the voice is not deleted, it is bypassed.
  const carryDraw = interpolate(
    frame,
    [beats.carry, beats.carry + CARRY_DRAW],
    [0, 1],
    { ...CLAMP, easing: RISE },
  );
  const carryBack = interpolate(frame, [beats.bypass, beats.bypass + 11], [1, 0], {
    ...CLAMP,
    easing: GLIDE,
  });
  const carryT = Math.min(carryDraw, carryBack);
  const oneIn =
    interpolate(
      frame,
      [beats.carry + CARRY_DRAW, beats.carry + CARRY_DRAW + TILE_IN],
      [0, 1],
      { ...CLAMP, easing: LAND },
    ) * carryBack;

  const feedFade = interpolate(frame, [beats.bypass, beats.bypass + 12], [1, 0], CLAMP);
  const ruleLift = interpolate(
    frame,
    [beats.lift, beats.lift + 15],
    [GROUND_O, GROUND_LIFT],
    { ...CLAMP, easing: GLIDE },
  );
  const ruleHue = interpolate(frame, [beats.resolve + 4, beats.resolve + 24], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const himIn = interpolate(frame, [0, 40], [0.55, 1], { ...CLAMP, easing: GLIDE });

  const MGR_CX = X0 + 0;
  const carryCtrl = { x: X0 + 34, y: (MGR_Y + RULE_Y) / 2 };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, CAM_CY[0], backgroundBlur, backgroundDim)}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
              x={X0 - GROUND_HALF}
              y={GROUND_Y}
              width={GROUND_HALF * 2}
              height={GROUND_W}
              rx={GROUND_W / 2}
              fill={ink}
              opacity={GROUND_O}
            />
            <rect
              x={X0 - RULE_HALF}
              y={RULE_Y}
              width={RULE_HALF * 2}
              height={GROUND_W}
              rx={GROUND_W / 2}
              fill={interpolateColors(ruleHue, [0, 1], [ink, accent])}
              opacity={ruleLift}
            />

            {/* The person the review is for. No brand, so a mark built from the
                scene's own circles, kept at half weight — an audience, not an
                actor in the exchange. */}
            <g opacity={himOpacity * himIn}>
              <circle cx={X0} cy={HIM_Y} r={HIM_R} fill="none" stroke={ink} strokeWidth={7} />
              <circle cx={X0} cy={HIM_Y} r={18} fill={ink} />
            </g>

            {/* Phase one: everyone feeds the one, and packets keep running up
                those threads for as long as the channel exists — the input
                never stops, and one thing still comes out of it. */}
            {feedFade > 0
              ? PEOPLE.map((p, i) => {
                  const t = interpolate(
                    frame,
                    [beats.feed + i * FEED_STAG, beats.feed + i * FEED_STAG + FEED_DRAW],
                    [0, 1],
                    { ...CLAMP, easing: RISE },
                  );
                  if (t <= 0) return null;
                  const cxc = (p.x + MGR_CX) / 2 + p.bow * 0.22;
                  const cyc = (p.y - p.r + MGR_Y) / 2;
                  const per = 34;
                  const u = ((frame - beats.feed) / per + hash(i * 17 + 9)) % 1;
                  const pk = bezAt(p.x, p.y - p.r, cxc, cyc, MGR_CX, MGR_Y + mgrR, u);
                  return (
                    <g key={`f${i}`} opacity={feedFade}>
                      <path
                        d={bez(p.x, p.y - p.r, cxc, cyc, MGR_CX, MGR_Y + mgrR, t)}
                        fill="none"
                        stroke={ink}
                        strokeWidth={threadW * 0.7}
                        strokeLinecap="round"
                        opacity={AMBIENT_O}
                      />
                      {t >= 1 ? (
                        <circle cx={pk.x} cy={pk.y} r={7} fill={ink} opacity={AMBIENT_O} />
                      ) : null}
                    </g>
                  );
                })
              : null}

            {carryT > 0 ? (
              <path
                d={bez(MGR_CX, MGR_Y - mgrR, carryCtrl.x, carryCtrl.y, X0, RULE_Y, carryT)}
                fill="none"
                stroke={ink}
                strokeWidth={threadW}
                strokeLinecap="round"
                opacity={0.9 * carryBack}
              />
            ) : null}

            <g opacity={mgrO}>
              <circle cx={MGR_CX} cy={MGR_Y} r={mgrR} fill={ink} />
            </g>
            {ringIn > 0 ? (
              <circle
                cx={MGR_CX}
                cy={MGR_Y}
                r={MGR_R + 26 * ringIn}
                fill="none"
                stroke={ink}
                strokeWidth={5}
                opacity={0.75 * ringIn * (1 - give)}
              />
            ) : null}

            {oneIn > 0 ? (
              <rect
                x={X0 - (TILE_W / 2) * oneIn}
                y={RULE_Y - TILE_H * oneIn}
                width={TILE_W * oneIn}
                height={TILE_H * oneIn}
                rx={8 * oneIn}
                fill={ink}
                opacity={0.95}
              />
            ) : null}

            {/* Phase two: each of them says its own thing. One thread, one
                tile, one slot — the count on the rule is the sentence. */}
            {PEOPLE.map((p, i) => {
              const start = beats.first + i * SEND_STAG;
              const t = interpolate(frame, [start, start + SEND_DRAW], [0, 1], {
                ...CLAMP,
                easing: RISE,
              });
              if (t <= 0) return null;
              const x1 = tileX(i);
              const cxc = (p.x + x1) / 2 + p.bow;
              const cyc = (p.y - p.r + RULE_Y) / 2;
              const tip = bezAt(p.x, p.y - p.r, cxc, cyc, x1, RULE_Y, t);
              const landed = frame - (start + SEND_DRAW);
              const inT = interpolate(landed, [0, TILE_IN], [0, 1], {
                ...CLAMP,
                easing: LAND,
              });
              const hot = landed >= 0 && landed < FLASH ? 1 : 0;
              const conv = interpolate(
                frame,
                [beats.resolve + i * 3, beats.resolve + i * 3 + 11],
                [0, 1],
                { ...CLAMP, easing: GLIDE },
              );
              const col = interpolateColors(conv, [0, 1], [ink, accent]);
              return (
                <g key={`s${i}`}>
                  <path
                    d={bez(p.x, p.y - p.r, cxc, cyc, x1, RULE_Y, t)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={threadW}
                    strokeLinecap="round"
                    opacity={t < 1 ? 0.9 : AMBIENT_O}
                  />
                  {t < 1 ? <circle cx={tip.x} cy={tip.y} r={8} fill={ink} /> : null}
                  {inT > 0 ? (
                    <rect
                      x={x1 - (TILE_W / 2) * inT}
                      y={RULE_Y - TILE_H * inT}
                      width={TILE_W * inT}
                      height={TILE_H * inT}
                      rx={8 * inT}
                      fill={hot ? ink : col}
                      opacity={hot ? 1 : 0.95}
                    />
                  ) : null}
                </g>
              );
            })}

            {PEOPLE.map((p, i) => (
              <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r} fill={ink} opacity={0.88} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SkipLevelReview;
