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
// "bringing this idea into retail has done a lot of good things, right? it just
// created better products. it created ..." — SRT 41.000s -> 48.740s at 24fps.
export const DURATION = 186;

// ---------------------------------------------------------------------------
// The rack
//
// Retail is shelving, and a rack is the only version of this that composes in a
// vertical frame — a single shelf of products is a wide, shallow band that
// leaves most of a 9:16 frame empty. Same material as the previous cut, shelf
// lines and product units on one grid, turned upright. One gap everywhere: 40
// between products across a shelf, and the shelf pitch is a product plus that
// same gap plus the line it stands on.
// ---------------------------------------------------------------------------
const GAP = 40;
const SLOT_W = 110;
const SLOT_PITCH = SLOT_W + GAP; // 150
const SHELF_PITCH = 170;
const SHELVES = 4;

// The generic product: every one identical, bigger than it needs to be, soft at
// the corners, stacked slightly askew. Mass-market means one shape for
// everybody — so "better" here is not smaller, it is *specific*: each refined
// product ends up its own size, exact, and square to the shelf. Sameness
// becoming variety is the whole argument, so the coarse state has to be
// visibly, obviously wrong rather than a few pixels off.
const COARSE_W = 118;
const COARSE_H = 112;
const COARSE_RX = 26;
const PROD_RX = 8;

const WORLD_W = 2000;
const WORLD_H = 2400;
const X0 = 1000;
const SHELF_BASE = 1900;
const SHELF_HALF = 260; // the lines run past the products: the rack continues

// The idea, before it is anywhere: one product that has its own audience.
const TOKEN_Y = 1080;
const RING_R = 84;
const FAN_N = 12;
const FAN_R = 13;
const ARC_R = 78;

const lineY = (shelf: number) => SHELF_BASE - shelf * SHELF_PITCH;
const slotX = (slot: number) => X0 + slot * SLOT_PITCH;

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
  coarseOpacity: z.number(),
  fanOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "bringing" · 5 "this idea into" · 23 "retail has" · 43 "done a lot"
  //   70 "of good things" · 95 "right?" · 99 "it just created"
  //   120 "better products" · 142 "it created" · 186 end
  beats: z.object({
    thisIdea: z.number().int(),
    retail: z.number().int(),
    doneALot: z.number().int(),
    justCreated: z.number().int(),
    betterProducts: z.number().int(),
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
  coarseOpacity: 0.16,
  fanOpacity: 0.5,
  beats: {
    thisIdea: 5,
    retail: 23,
    doneALot: 43,
    justCreated: 99,
    betterProducts: 120,
  },
});

// ---------------------------------------------------------------------------
// The relay
//
// The idea lands in the one empty slot, and then its audience carries it: a fan
// leaves the arc, crosses to a product that has not been reached, and its
// arrival is what refines that product — then it stays there, because that
// product now has people of its own. Breadth-first from the landing, so the
// idea spreads outward and downward through the rack instead of marching along
// a line, and each arrival is caused by the last. Step 6 lands on "it just
// created" and step 8 on "better products".
// ---------------------------------------------------------------------------
type Step = { shelf: number; slot: number; parent: number; at: number };
const RELAY: Step[] = [
  { shelf: 3, slot: 0, parent: -1, at: 43 }, // the landing itself
  { shelf: 3, slot: -1, parent: 0, at: 54 },
  { shelf: 3, slot: 1, parent: 0, at: 63 },
  { shelf: 2, slot: 0, parent: 0, at: 72 },
  { shelf: 2, slot: -1, parent: 3, at: 82 },
  { shelf: 2, slot: 1, parent: 3, at: 91 },
  { shelf: 1, slot: 0, parent: 3, at: 100 },
  { shelf: 1, slot: -1, parent: 6, at: 110 },
  { shelf: 1, slot: 1, parent: 6, at: 120 },
  { shelf: 0, slot: 0, parent: 6, at: 131 },
  { shelf: 0, slot: -1, parent: 9, at: 143 },
  { shelf: 0, slot: 1, parent: 9, at: 156 },
];
const PULSE_TIME = 10;
const REFINE_TIME = 14;
const GHOST_TIME = 18;
const SETTLE_TIME = 16;

// Each product's own proportions, so the finished rack is a shelf of different
// things rather than a lattice of identical squares. Bottom-aligned on the
// line, centred in its slot, so the spacing stays exact while the goods vary.
const refinedW = (i: number) => 74 + hash(i * 13 + 2) * 40;
const refinedH = (i: number) => 70 + hash(i * 17 + 5) * 30;

const IdeaIntoRetailV2: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  coarseOpacity,
  fanOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  const CAM_F = [0, 20, 46, 100, 152, DURATION];
  const CAM_K = [3.2, 3.15, 2.6, 2.0, 1.83, 1.8];
  const CAM_CY = [1120, 1128, 1390, 1580, 1626, 1629];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;


  const landAt = RELAY[0].at;
  const originTop = lineY(3) - refinedH(0);

  const descend = interpolate(frame, [beats.retail + 4, landAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const tokenCY = TOKEN_Y + (originTop + refinedH(0) / 2 - TOKEN_Y) * descend;

  const settle = interpolate(frame, [landAt, landAt + SETTLE_TIME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const orbit = frame * 0.26;

  const rackIn = (shelf: number) =>
    interpolate(
      frame,
      [beats.retail + (3 - shelf) * 3, beats.retail + (3 - shelf) * 3 + 14],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
    );

  const departAt = (i: number) => RELAY[i].at - PULSE_TIME;
  // Who is still gathered around the idea. The huddle re-spaces itself as
  // people leave, and narrows as it thins, so it always looks arranged rather
  // than steadily eaten away from one end.
  const staying: number[] = [0];
  for (let i = 1; i < FAN_N; i++) if (frame < departAt(i)) staying.push(i);

  // Where a fan sits: gathered around the idea, crossing to the product it is
  // about to reach, or parked above the one it reached.
  const fanAt = (i: number) => {
    // An even ring of twelve reads as a loading spinner, so the angles are
    // jittered off their cells and the radii vary widely — a crowd, not a dial.
    const ringA =
      ((i / FAN_N) * 360 + orbit + (hash(i * 23 + 5) - 0.5) * 30) * (Math.PI / 180);
    const rf = 0.78 + hash(i * 11 + 3) * 0.5;
    const rx = X0 + Math.sin(ringA) * RING_R * rf;
    const ry = tokenCY - Math.cos(ringA) * RING_R * rf;

    const n = staying.length;
    const p = Math.max(0, staying.indexOf(i));
    const span = 26 + (46 * (n - 1)) / (FAN_N - 1);
    const deg =
      (n === 1 ? 0 : -span + (p / (n - 1)) * span * 2) + Math.sin(frame / 34 + i) * 2.2;
    const arcA = (deg * Math.PI) / 180;
    const ar =
      (28 + (ARC_R - 28) * ((n - 1) / (FAN_N - 1))) * (0.9 + hash(i * 13 + 7) * 0.22);
    const ax = X0 + Math.sin(arcA) * ar;
    const ay = originTop - 10 - Math.cos(arcA) * ar;

    const home = { x: rx + (ax - rx) * settle, y: ry + (ay - ry) * settle, r: FAN_R, o: 1 };
    if (i === 0) return home; // one stays with the idea

    const step = RELAY[i];
    const depart = departAt(i);
    if (frame < depart) return home;

    const px = slotX(step.slot);
    const py = lineY(step.shelf) - refinedH(i) - 28 + Math.sin(frame / 31 + i * 1.7) * 4;
    const t = clamp01((frame - depart) / PULSE_TIME);
    const e = Easing.inOut(Easing.cubic)(t);
    const mx = (home.x + px) / 2 + sgn(i * 3 + 2) * 46;
    const my = (home.y + py) / 2 - 46;
    return {
      x: (1 - e) * (1 - e) * home.x + 2 * (1 - e) * e * mx + e * e * px,
      y: (1 - e) * (1 - e) * home.y + 2 * (1 - e) * e * my + e * e * py,
      r: FAN_R * (1 + 0.28 * Math.sin(Math.PI * t)),
      o: 1 + 0.7 * Math.sin(Math.PI * t),
    };
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
            {Array.from({ length: SHELVES }, (_, s) => {
              const g = rackIn(s);
              if (g <= 0) return null;
              return (
                <rect
                  key={`sh-${s}`}
                  x={X0 - SHELF_HALF * g}
                  y={lineY(s)}
                  width={SHELF_HALF * 2 * g}
                  height={GROUND_W}
                  fill={ink}
                  opacity={GROUND_O}
                />
              );
            })}

            {/* The slot the idea is going to fill, so the landing answers a
                question the frame has already asked. */}
            {descend < 1 ? (
              <rect
                x={slotX(0) - refinedW(0) / 2}
                y={originTop}
                width={refinedW(0)}
                height={refinedH(0)}
                rx={PROD_RX}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                strokeDasharray="10 12"
                opacity={0.2 * rackIn(3) * (1 - descend)}
              />
            ) : null}

            {RELAY.map((step, idx) => {
              if (idx === 0) return null; // the origin slot is the idea itself
              const g = rackIn(step.shelf);
              if (g <= 0) return null;

              const refine = interpolate(frame, [step.at, step.at + REFINE_TIME], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: LAND,
              });
              const cx = slotX(step.slot);
              const base = lineY(step.shelf);
              const rw = COARSE_W + (refinedW(idx) - COARSE_W) * refine;
              const rh = COARSE_H + (refinedH(idx) - COARSE_H) * refine;
              const rx = COARSE_RX + (PROD_RX - COARSE_RX) * refine;
              const rot = sgn(idx * 5 + 1) * 4.5 * (1 - refine);
              const ox = sgn(idx * 7 + 3) * 12 * (1 - refine);
              const oy = sgn(idx * 11 + 5) * 9 * (1 - refine);
              const ghost = interpolate(frame, [step.at, step.at + GHOST_TIME], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.quad),
              });
              const snap = interpolate(
                frame,
                [step.at + REFINE_TIME - 3, step.at + REFINE_TIME + 6],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) },
              );
              return (
                <g key={`p-${idx}`}>
                  {/* What it used to be, left behind for a moment so the
                      difference is visible rather than asserted. */}
                  {refine > 0 && ghost > 0 ? (
                    <rect
                      x={cx - COARSE_W / 2}
                      y={base - COARSE_H}
                      width={COARSE_W}
                      height={COARSE_H}
                      rx={COARSE_RX}
                      fill="none"
                      stroke={ink}
                      strokeWidth={2.5}
                      strokeDasharray="8 10"
                      opacity={0.28 * ghost}
                    />
                  ) : null}
                  <rect
                    x={cx - rw / 2 + ox}
                    y={base - rh + oy}
                    width={rw}
                    height={rh}
                    rx={rx}
                    fill={
                      refine > 0
                        ? interpolateColors(Math.min(frame - step.at, FLASH), [0, FLASH], [ink, accent])
                        : ink
                    }
                    opacity={
                      (coarseOpacity + (0.95 - coarseOpacity) * clamp01(refine * 2.2)) * g
                    }
                    transform={`rotate(${rot} ${cx} ${base - COARSE_H / 2})`}
                  />
                  {refine >= 1 && snap > 0.01 ? (
                    <rect
                      x={cx - refinedW(idx) / 2 - 3}
                      y={base - refinedH(idx) - 3}
                      width={refinedW(idx) + 6}
                      height={refinedH(idx) + 6}
                      rx={PROD_RX + 3}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3}
                      opacity={0.7 * snap}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* The idea: a product that has its own audience. */}
            <rect
              x={X0 - refinedW(0) / 2}
              y={tokenCY - refinedH(0) / 2}
              width={refinedW(0)}
              height={refinedH(0)}
              rx={PROD_RX}
              fill={accent}
              opacity={0.95}
            />

            {Array.from({ length: FAN_N }, (_, i) => {
              const f = fanAt(i);
              return (
                <circle
                  key={`fan-${i}`}
                  cx={f.x}
                  cy={f.y}
                  r={f.r}
                  fill={ink}
                  opacity={clamp01(fanOpacity * f.o)}
                />
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default IdeaIntoRetailV2;
