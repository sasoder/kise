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
  FLASH_DENSE,
  GROUND_O,
  GROUND_W,
  LAND,
  backdropStyle,
  clamp01,
  hash,
  runCamera,
  sgnPick as sgn,
} from "./cheekyPintSystem";

export const FPS = 24;
// V2 — sleek pass on the shared Cheeky Pint system.
// "it's the first time you can advertise niche products / exactly, and the
// niche products are actually doing better — that's the crazy thing"
// SRT 25.760s -> 30.440s at 24fps.
export const DURATION = 112;

// ---------------------------------------------------------------------------
// One grid, everywhere
//
// Every measurement in the scene comes off two numbers: a unit, and a gap. The
// gap is the same between the mass-market product and its neighbour as it is
// between two niche products (the first pass had 8px in one place and 30 in the
// other, which is what made the spacing look accidental). The mass-market
// product is exactly two slots wide and exactly six units tall, so the height
// it sets is a whole number of the unit everything else is built from and the
// lead each niche product ends up with is countable rather than asserted.
// ---------------------------------------------------------------------------
const GAP = 30;
const UNIT_W = 74;
const UNIT_H = 40;
const UNIT_GAP = 8;
const UNIT_PITCH = UNIT_H + UNIT_GAP; // 48
const SLOT = UNIT_W + GAP; // 104

const BIG_UNITS = 6;
const BIG_W = 2 * UNIT_W + GAP; // 178 — two slots
const BIG_H = BIG_UNITS * UNIT_PITCH - UNIT_GAP; // 280
const FIRST_X = BIG_W / 2 + GAP + UNIT_W / 2; // 156

const WORLD_W = 3400;
const WORLD_H = 2400;
const X0 = 1700;
const SHELF_Y = 1900;
const PER_SIDE = 3;

// The mark is exactly as wide as the product it used to be the only channel
// for, and the beam leaves from just under it.
const META_SIZE = BIG_W;
const META_Y = 1145;
const BEAM_APEX_Y = 1214;
const BEAM_HALF = BIG_W / 2 + 40; // lands on the big product, and nothing else


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
  // How far the mass-market product recedes. He says the niche ones do better,
  // not that this one collapses, so it dims, never shrinks, and stops well
  // short of grey.
  bigRecede: z.number(),
  // Ambient impression traffic. Subordinate to the stacking by a wide margin.
  trafficOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "it's the" · 6 "first time" · 12 "you can" · 17 "advertise niche"
  //   30 "products" · 40 "exactly and the" · 60 "niche products"
  //   71 "actually doing" · 80 "better" · 87 "that's the" · 97 "crazy thing"
  beats: z.object({
    firstTime: z.number().int(),
    youCan: z.number().int(),
    advertiseNiche: z.number().int(),
    products: z.number().int(),
    exactly: z.number().int(),
    nicheProducts: z.number().int(),
    actuallyDoing: z.number().int(),
    better: z.number().int(),
    crazyThing: z.number().int(),
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
  bigRecede: 0.5,
  trafficOpacity: AMBIENT_O,
  beats: {
    firstTime: 6,
    youCan: 12,
    advertiseNiche: 17,
    products: 30,
    exactly: 40,
    nicheProducts: 60,
    actuallyDoing: 71,
    better: 80,
    crazyThing: 97,
  },
});

type Beats = Props["beats"];

// ---------------------------------------------------------------------------
// The shelf
//
// Every stack ends on a different unit count, 8 through 13, so no two are the
// same height and each clears the mass-market six by a number you could count.
// The seed was chosen for that spread: the obvious one clustered every stack
// within a unit of its neighbour and the finished shelf read as a wall.
// ---------------------------------------------------------------------------
type Product = { x: number; rank: number; units: number; seed: number };
const NICHES: Product[] = [];
for (let r = 0; r < PER_SIDE; r++) {
  for (const side of [-1, 1]) {
    const seed = r * 2 + (side > 0 ? 1 : 0);
    NICHES.push({
      x: X0 + side * (FIRST_X + r * SLOT),
      rank: r,
      units: 8 + Math.round(hash(seed * 3 + 16) * 5),
      seed,
    });
  }
}

const THREAD_STAGGER = 3.2;
const THREAD_DRAW = 9;
const GROW_STAGGER = 2.5;
const GROW_TIME = 36;
const GROW_LEAD = 8;

const unitY = (j: number) => SHELF_Y - (j + 1) * UNIT_H - j * UNIT_GAP;
const threadLit = (rank: number, b: Beats) =>
  b.advertiseNiche + rank * THREAD_STAGGER + THREAD_DRAW;
const growStart = (p: Product, b: Beats) =>
  b.nicheProducts - GROW_LEAD + p.rank * GROW_STAGGER;

// Fractional unit count, so a thread's endpoint rides its stack smoothly rather
// than hopping a unit at a time.
const stackCount = (p: Product, frame: number, b: Beats) => {
  const s = growStart(p, b);
  const g = interpolate(frame, [s, s + GROW_TIME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return 1 + (p.units - 1) * g;
};
const productTop = (p: Product, frame: number, b: Beats) =>
  SHELF_Y - stackCount(p, frame, b) * UNIT_PITCH + UNIT_GAP;

// ---------------------------------------------------------------------------
// Camera
//
// Four keys and one long ramp. The scene is wide rather than tall and its
// vertical extent never changes, so the move is a slow widening that reveals
// another product on each side and then settles — the composition relaxes
// inward instead of arriving somewhere new. cy is derived from k to keep the
// content's centre parked near y 825, under the caption band.
// ---------------------------------------------------------------------------
const CONTENT_TOP = 1086; // the mark's ink, the highest thing in the scene
const CONTENT_MID = (CONTENT_TOP + SHELF_Y) / 2;
const camCy = (k: number) => CONTENT_MID + 135 / k;

const CAM_F = [0, 14, 46, 92, DURATION];
const CAM_K = [1.53, 1.52, 1.4, 1.21, 1.2];


// Simple Icons Meta, on a 24x24 box centred on (12,12) — the same mark, at the
// same weight, as the one that opened the previous cut.
const META_D =
  "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";

const NicheProductsDoingBetterV2: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  bigRecede,
  trafficOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  const { cy, k } = React.useMemo(() => runCamera(frame, CAM_F, CAM_K, camCy), [frame]);
  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;


  // One channel that could only carry one product becomes many that each carry
  // one. The beam narrows to nothing as the threads draw out of the same point.
  const collapse = interpolate(frame, [beats.youCan + 2, beats.advertiseNiche + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const beamHalf = BEAM_HALF * (1 - collapse);
  const beamOpacity = 0.13 * (1 - collapse);
  // One channel becoming many is the turn this whole graphic hangs on, so the
  // apex flares as the last of the beam folds into the threads: a ring born at
  // the point, opening outward and fading as it goes.
  const flareStart = beats.advertiseNiche + 6;
  const switchFlare = interpolate(frame, [flareStart, flareStart + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const bigOpacity = interpolate(frame, [beats.better, beats.crazyThing], [0.85, bigRecede], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // Impression traffic: the one ambient layer, and it stays well under the
  // stacking. It quickens when the other speaker agrees, which is what carries
  // the stretch between the last thread landing and the first sale.
  const pulsePeriod = interpolate(frame, [beats.exactly, beats.nicheProducts], [30, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The height to beat, drawn out from the product that used to hold it, with a
  // bright tip while it runs. Six units, so it lands on a unit boundary in
  // every stack it crosses.
  const RULE_REACH = 640;
  const ruleOut = interpolate(
    frame,
    [beats.actuallyDoing, beats.actuallyDoing + 18],
    [0, RULE_REACH],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const ruleY = SHELF_Y - BIG_H;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, camCy(CAM_K[0]), backgroundBlur, backgroundDim)}
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
            <rect x={X0 - 1300} y={SHELF_Y} width={2600} height={GROUND_W} fill={ink} opacity={GROUND_O} />

            {beamOpacity > 0.002 ? (
              <>
                <path
                  d={`M ${X0} ${BEAM_APEX_Y} L ${X0 - beamHalf} ${SHELF_Y} L ${X0 + beamHalf} ${SHELF_Y} Z`}
                  fill={ink}
                  opacity={beamOpacity}
                />
                {[0, 1].map((n) => {
                  const t = ((frame + n * 13) % 26) / 26;
                  const y = BEAM_APEX_Y + (SHELF_Y - BEAM_APEX_Y) * t;
                  const w = beamHalf * t;
                  return (
                    <rect
                      key={`bp-${n}`}
                      x={X0 - w}
                      y={y}
                      width={w * 2}
                      height={4}
                      fill={ink}
                      opacity={beamOpacity * 2.6 * (1 - t)}
                    />
                  );
                })}
              </>
            ) : null}

            {/* Threads. The mass-market product gets one too — it never stopped
                being advertisable — drawn in ink so it reads as one of the
                family rather than as a separate mechanism. */}
            {[{ x: X0, rank: 0, top: SHELF_Y - BIG_H, seed: 99, mass: true }]
              .concat(
                NICHES.map((p) => ({
                  x: p.x,
                  rank: p.rank,
                  top: productTop(p, frame, beats),
                  seed: p.seed,
                  mass: false,
                })),
              )
              .map((t) => {
                const start = beats.advertiseNiche + t.rank * THREAD_STAGGER;
                const draw = interpolate(frame, [start, start + THREAD_DRAW], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.inOut(Easing.quad),
                });
                if (draw <= 0) return null;
                const hx = X0 + (t.x - X0) * draw;
                const hy = BEAM_APEX_Y + (t.top - BEAM_APEX_Y) * draw;
                const pt = ((frame + t.seed * 5) % pulsePeriod) / pulsePeriod;
                return (
                  <g key={`th-${t.mass ? "m" : t.seed}`}>
                    <line
                      x1={X0}
                      y1={BEAM_APEX_Y}
                      x2={hx}
                      y2={hy}
                      stroke={t.mass ? ink : accent}
                      strokeWidth={2.6}
                      opacity={t.mass ? 0.24 : 0.46}
                    />
                    {/* The head dissolves into the product instead of blinking
                        out — the line resolves rather than stopping. */}
                    {draw < 1 ? (
                      <circle
                        cx={hx}
                        cy={hy}
                        r={5.5 * clamp01((1 - draw) / 0.24)}
                        fill={ink}
                      />
                    ) : null}
                    {draw >= 1 ? (
                      <circle
                        cx={X0 + (t.x - X0) * pt}
                        cy={BEAM_APEX_Y + (t.top - BEAM_APEX_Y) * pt}
                        r={5}
                        fill={t.mass ? ink : accent}
                        opacity={trafficOpacity * Math.sin(Math.PI * pt)}
                      />
                    ) : null}
                  </g>
                );
              })}

            {frame >= flareStart && switchFlare < 1 ? (
              <circle
                cx={X0}
                cy={BEAM_APEX_Y}
                r={12 + 46 * switchFlare}
                fill="none"
                stroke={ink}
                strokeWidth={5 - 2.4 * switchFlare}
                opacity={0.62 * (1 - switchFlare) ** 1.4}
              />
            ) : null}

            {/* The mass-market product, built from the same unit as everything
                else so the six it stands for can be counted. */}
            {Array.from({ length: BIG_UNITS }, (_, j) => (
              <rect
                key={`big-${j}`}
                x={X0 - BIG_W / 2}
                y={unitY(j)}
                width={BIG_W}
                height={UNIT_H}
                rx={5}
                fill={ink}
                opacity={bigOpacity}
              />
            ))}

            {NICHES.map((p) => {
              const lit = threadLit(p.rank, beats);
              const age = frame - lit;
              const found = age >= 0;
              const s = growStart(p, beats);
              // unknown -> read -> accent, the same ladder as everywhere else.
              const fill = found
                ? interpolateColors(Math.min(age, FLASH_DENSE), [0, FLASH_DENSE], [ink, accent])
                : ink;
              return (
                <g key={`pr-${p.seed}`}>
                  {Array.from({ length: p.units }, (_, j) => {
                    // The base unit is the product; every one above it is a
                    // sale, arriving on its own beat and drifting in from its
                    // own side so the stack never fills in lockstep.
                    const at =
                      j === 0 ? lit : s + ((j - 1) / Math.max(1, p.units - 2)) * GROW_TIME;
                    const drop = interpolate(frame, [at, at + 8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: LAND,
                    });
                    if (j > 0 && drop <= 0) return null;
                    const slide = j === 0 ? 0 : sgn(p.seed * 7 + j) * 11 * (1 - drop);
                    const clears = j === BIG_UNITS;
                    return (
                      <rect
                        key={j}
                        x={p.x - UNIT_W / 2 + slide}
                        y={unitY(j) - 26 * (1 - drop)}
                        width={UNIT_W}
                        height={UNIT_H}
                        rx={5}
                        fill={
                          clears
                            ? interpolateColors(
                                Math.min(frame - at, FLASH),
                                [0, FLASH],
                                [ink, accent],
                              )
                            : fill
                        }
                        opacity={j === 0 ? (found ? 0.95 : 0.1) : 0.95 * clamp01(drop * 1.7)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {ruleOut > 0 ? (
              <>
                <rect
                  x={X0 - BIG_W / 2 - ruleOut}
                  y={ruleY}
                  width={ruleOut}
                  height={4}
                  fill={ink}
                  opacity={0.42}
                />
                <rect
                  x={X0 + BIG_W / 2}
                  y={ruleY}
                  width={ruleOut}
                  height={4}
                  fill={ink}
                  opacity={0.42}
                />
                {ruleOut < RULE_REACH
                  ? [-1, 1].map((s) => (
                      <circle
                        key={`rt-${s}`}
                        cx={X0 + s * (BIG_W / 2 + ruleOut)}
                        cy={ruleY + 2}
                        r={5}
                        fill={ink}
                        opacity={0.8}
                      />
                    ))
                  : null}
              </>
            ) : null}

            <g
              transform={`translate(${X0} ${META_Y}) scale(${META_SIZE / 24}) translate(-12 -12)`}
            >
              <path d={META_D} fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default NicheProductsDoingBetterV2;
