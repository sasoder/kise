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
  FLASH,
  FLASH_DENSE,
  FLASH_DENSE_INK,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  RISE,
  backdropStyle,
  clamp01,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "a situation in which the technology is changing under you so fast as you're
// building the product" — SRT 8.080s -> 12.419s at 24fps.
export const DURATION = 104;

// ---------------------------------------------------------------------------
// The ground is the technology
//
// He is not describing a race, he is describing a floor. So the technology is
// not a thing beside the product — it is the thing the product stands on, and
// the only event in the piece is a new layer of it arriving between the stack
// and the old surface. The stack rides up on what arrives. Nothing about the
// product changes; it just ends the shot a long way above where it started.
//
// ---------------------------------------------------------------------------
// One module
//
// Every measurement in the scene is a multiple of G. Two materials that each
// keep their own proportions read as two drawings sharing a frame, however
// well the motion is timed — which is what "they don't harmonise" means. So
// there is one gap, used between ground units, between tiles and between
// strata; one corner radius; and one width step, which is also the gap, and
// also the taper of the stack. The ground unit is the atom: everything else is
// counted in it.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11; // G / 2, on every corner in the scene

const UNIT_W = 6 * G; // 132
const UNIT_H = 2 * G; // 44
const ROW_PITCH = UNIT_H + G; // 66
const ROW_UNITS = 6;
const ROW_W = ROW_UNITS * UNIT_W + (ROW_UNITS - 1) * G; // 902

const TILE_H = 3 * G; // 66
const TILE_PITCH = TILE_H + G; // 88
// The stack tapers by exactly one gap per tile, and its widest is one gap
// narrower than the pair of ground units directly under it — so the floor
// arriving beneath him is never hidden behind what is standing on it.
const TILE_W0 = 12 * G; // 264, against a centre pair of 2 * UNIT_W + G = 286
const tileW = (i: number) => TILE_W0 - i * G;
// And its own shade. The piece placed most recently is the brightest, each one
// under it a step back — the same rule the superseded floors follow, so both
// materials fade the same way and depth reads without a second shadow.
const tileInk = (i: number) => 0.76 + i * 0.05;

const MARK_SIZE = UNIT_W; // the actor is one ground unit across
const MARK_GAP = 6 * G; // 132

const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;

const BASE_Y = 2156; // the bottom of the mass never moves
const N0 = 4; // the substrate that is already there when he starts talking
const SURFACE0 = BASE_Y - N0 * ROW_PITCH; // 1892 — where he was standing
const DATUM_Y = SURFACE0;
const DATUM_HALF = ROW_W / 2 + 6 * G;

const unitX = (i: number) => X0 - ROW_W / 2 + i * (UNIT_W + G);
const rowY = (row: number) => BASE_Y - (row + 1) * ROW_PITCH;

// The nine arrivals. The first is "changing", the third is "so fast as", and
// from there the gap shortens every time — 12, 11, 8, 7, 6, 5, 4, 3 — so the
// acceleration is in the rhythm rather than asserted by anything on screen.
// The last one resolves at about frame 101, so the shot holds finished.
const INSERTS = [38, 50, 61, 69, 76, 82, 87, 91, 94];
const SPREAD_T = 5;
const SPREAD_STAGGER = 0.7; // frames per unit, working outward from the middle
const LEAD = 7; // the row is outlined before anything fills it

// The product: four tiles placed at a dead-steady 28 frames apart, against a
// floor that ends up arriving every three. The first is already down at frame
// 0 and the second is already falling, so the shot opens mid-build.
const LANDS = [6, 34, 62, 89];
const TILE_N = 1 + LANDS.length;
const DROP_T = 16;

const ANTHROPIC_D =
  "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z";

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));

// A floor that is superseded does not disappear and does not pile up into a
// wall — it collapses. While it is the thing you are standing on it is
// granular, six separate units you can count. The moment something lands on
// top of it, it stops being a floor and becomes a layer: the units merge into
// one bar, which thins from 2G to 1G and fades the deeper it goes. Left as
// units it reads as seventy blocks whose gaps line up into vertical channels;
// as bars it reads as sediment, the climb still countable and the paper still
// showing through.
const barO = (age: number) =>
  interpolate(age, [1, 2, 3.5, 7], [0.4, 0.24, 0.15, 0.09], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const barH = (age: number) =>
  interpolate(age, [1, 4.5], [UNIT_H, G], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
  markOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "situation" · 10 "in which the" · 21 "technology is" · 38 "changing"
  //   46 "under you" · 61 "so fast as" · 81 "you're building"
  //   89 "the product" · 104 end
  beats: z.object({
    inWhich: z.number().int(),
    technology: z.number().int(),
    changing: z.number().int(),
    underYou: z.number().int(),
    soFast: z.number().int(),
    building: z.number().int(),
    product: z.number().int(),
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
  unknownOpacity: 0.34,
  markOpacity: 0.88,
  beats: {
    inWhich: 10,
    technology: 21,
    changing: 38,
    underYou: 46,
    soFast: 61,
    building: 81,
    product: 89,
  },
});

// How many rows have arrived, as a continuous number. Lift and spread are one
// gesture on one clock, locked to the middle pair of units, because that is
// the part he is standing on. Run the lift ahead of it and the stack levitates
// off a gap; run it behind and the floor arrives as a shelf beside his feet.
const INNER = 0.5;
const liftAt = (f: number) =>
  INSERTS.reduce(
    (a, t) => a + ez(RISE, (f - t - INNER * SPREAD_STAGGER) / SPREAD_T),
    0,
  );
const surfaceAt = (f: number) => BASE_Y - (N0 + liftAt(f)) * ROW_PITCH;

const ChangingUnderYou: React.FC<Props> = ({
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
  markOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // One continuous widening. It starts tight enough that the floor fills the
  // frame and ends far enough back that the datum he started on is still in
  // shot, which is the only way the climb is measurable.
  const CAM_F = [0, 22, 40, 58, 78, 96, DURATION];
  const CAM_K = [1.32, 1.3, 1.24, 1.11, 0.94, 0.78, 0.77];
  const CAM_CY = [1927, 1922, 1895, 1830, 1725, 1552, 1548];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  // The stack is carried, not glued — but as one body, on a single lag. Per
  // tile lag flexes the column and the gaps inside it stop being equal, which
  // is the difference between a stack being lifted and a stack going wonky.
  const stackY = surfaceAt(frame - 0.7);
  const tileBottom = (i: number) => stackY - i * TILE_PITCH;

  // The mark rises exactly while it is handing a piece down, and sits a settled
  // MARK_GAP above the top tile the moment that piece lands.
  const placed =
    1 + LANDS.reduce((a, t) => a + clamp01((frame - (t - DROP_T)) / DROP_T), 0);
  const markY =
    tileBottom(placed - 1) -
    TILE_H -
    MARK_GAP -
    MARK_SIZE / 2 +
    Math.sin(frame / 33) * 4;

  const datumOpacity = interpolate(
    frame,
    [0, 8, beats.underYou - 6, beats.underYou + 8],
    [0, GROUND_O, GROUND_O, GROUND_LIFT],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // "technology is" — a read runs the length of the floor and names it. It is
  // the only moment the ground is the subject rather than the surface.
  const sweep = interpolate(
    frame,
    [beats.technology, beats.technology + 14],
    [X0 - 900, X0 + 900],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );
  const sweepLive =
    frame >= beats.technology && frame <= beats.technology + 16;

  // The one ambient layer: a warm band drifting along whatever floor is
  // currently live, so the technology is never still even between arrivals. It
  // is the quiet form of the read above — same gesture, a third as loud — which
  // is what makes the loud one at "technology is" legible as emphasis.
  const driftX = X0 - 780 + ((frame * 11) % 1620);

  const liveIndex = N0 - 1 + liftAt(frame - 6);

  const rows: number[] = [];
  for (let j = 0; j < N0; j++) rows.push(j);
  INSERTS.forEach((t, m) => {
    if (frame >= t - LEAD) rows.push(N0 + m);
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(
            frame,
            cy,
            k,
            CAM_CY[0],
            backgroundBlur,
            backgroundDim,
          )}
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
            {rows.map((j) => {
              const age = liveIndex - j;
              const fillO = interpolate(age, [0, 1.4], [0.95, 0.45], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const barMix = clamp01((age - 0.5) / 0.9);
              const bh = barH(age);
              const m = j - N0;
              const arriving = m >= 0;
              const t = arriving ? INSERTS[m] : -100;
              const y = rowY(j);

              // The row is drawn as a rule before anything fills it, at the
              // same weight as the datum.
              if (arriving && frame < t) {
                const lead = clamp01((frame - (t - LEAD)) / 5);
                return (
                  <rect
                    key={`lead-${j}`}
                    x={X0 - (ROW_W / 2) * lead}
                    y={y + (UNIT_H - GROUND_W) / 2}
                    width={ROW_W * lead}
                    height={GROUND_W}
                    fill={accent}
                    opacity={0.15 * lead}
                  />
                );
              }

              return (
                <g key={`row-${j}`}>
                  {barMix > 0.01 ? (
                    <rect
                      x={X0 - ROW_W / 2}
                      y={y + (UNIT_H - bh) / 2}
                      width={ROW_W}
                      height={bh}
                      rx={RX}
                      fill={accent}
                      opacity={barO(age) * barMix}
                    />
                  ) : null}
                  {barMix > 0.99
                    ? null
                    : Array.from({ length: ROW_UNITS }, (_, i) => {
                        const co = Math.abs(i - (ROW_UNITS - 1) / 2);
                        const age0 = frame - t - co * SPREAD_STAGGER;
                        const p = arriving ? ez(RISE, age0 / SPREAD_T) : 1;
                        if (p <= 0) return null;
                        const pa = clamp01(p * 2.2);
                        const cxu = unitX(i) + UNIT_W / 2;
                        // Each unit draws itself open about its own centre, so
                        // the row grows outward rather than travelling in.
                        const sx = 0.5 + 0.5 * p;

                        let fill = accent;
                        if (arriving && age0 >= 0 && age0 < FLASH_DENSE + 1) {
                          fill = FLASH_DENSE_INK;
                        } else if (sweepLive && age < 1.2) {
                          const near = clamp01(
                            1 - Math.abs(cxu - sweep) / 200,
                          );
                          if (near > 0) {
                            fill = interpolateColors(
                              near,
                              [0, 1],
                              [accent, FLASH_DENSE_INK],
                            );
                          }
                        } else if (age < 1.2) {
                          const near = clamp01(
                            1 - Math.abs(cxu - driftX) / 300,
                          );
                          if (near > 0) {
                            fill = interpolateColors(
                              near * 0.34,
                              [0, 1],
                              [accent, FLASH_DENSE_INK],
                            );
                          }
                        }

                        return (
                          <rect
                            key={`u-${j}-${i}`}
                            x={cxu - (UNIT_W * sx) / 2}
                            y={y}
                            width={UNIT_W * sx}
                            height={UNIT_H}
                            rx={RX}
                            fill={fill}
                            opacity={fillO * pa * (1 - barMix)}
                          />
                        );
                      })}
                </g>
              );
            })}

            {/* Where the floor was when he started. It runs past the mass on
                both sides so it reads as a rule and not another layer. */}
            <rect
              x={X0 - DATUM_HALF}
              y={DATUM_Y}
              width={DATUM_HALF * 2}
              height={GROUND_W}
              fill={ink}
              opacity={datumOpacity}
            />

            {Array.from({ length: TILE_N }, (_, i) => {
              const land = i === 0 ? -DROP_T : LANDS[i - 1];
              const release = land - DROP_T;
              if (frame < release) return null;

              const w = tileW(i);
              const slot = tileBottom(i);
              const drop = ez(
                Easing.inOut(Easing.cubic),
                (frame - release) / DROP_T,
              );
              const start = markY + MARK_SIZE / 2 + TILE_H + G;
              const bottom = drop >= 1 ? slot : start + (slot - start) * drop;

              // In the air it is line-work, not a pale fill: the scene carries
              // one drop shadow for everything, and a shadow at full strength
              // under a translucent slab reads as a smudge rather than a ghost.
              // On the landing it fills, reads full ink for four frames, and
              // settles back to its own shade — the click is the piece itself.
              const rest = tileInk(i);
              const placedYet = frame >= land;

              return (
                <rect
                  key={`tile-${i}`}
                  x={X0 - w / 2}
                  y={bottom - TILE_H}
                  width={w}
                  height={TILE_H}
                  rx={RX}
                  fill={placedYet ? ink : "none"}
                  stroke={placedYet ? undefined : ink}
                  strokeWidth={placedYet ? undefined : 3}
                  opacity={
                    placedYet
                      ? rest + (1 - rest) * clamp01(1 - (frame - land) / FLASH)
                      : unknownOpacity
                  }
                />
              );
            })}

            <g
              transform={`translate(${X0} ${markY}) scale(${MARK_SIZE / 24}) translate(-12 -12)`}
              opacity={markOpacity}
            >
              <path d={ANTHROPIC_D} fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ChangingUnderYou;
