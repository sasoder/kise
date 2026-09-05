import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  FLASH_DENSE,
  FLASH_DENSE_INK,
  GLIDE,
  LAND,
  RISE,
  backdropStyle,
  clamp01,
  hash,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "it's very hard to tell what's going to catch on, because a new model may
// suddenly be good at something that makes a product possible."
// SRT 21.219s -> 28.780s at 24fps; runs to 230 so the gather can finish.
export const DURATION = 230;

// ---------------------------------------------------------------------------
// They come to the one that works
//
// "Catch on" is adoption, so the only thing that matters is whether anybody
// moves. People are the house glyph — public/person.png, painted as ink behind
// its own alpha with a CSS mask rather than a filter, which is how the rest of
// the library draws crowds. Products are the same tile as the other cutaways.
//
// Nothing here is placed by eye. Everyone stands on a grid whose scatter is
// bounded so no two figures can touch; the lean toward an attempt is capped by
// the gradient of its own falloff over one grid step, so a group leaning
// together stays a group and does not pile up; and where they end up is a ring
// packing — concentric rings sized off one spacing, alternate rings offset by
// half a slot, the outer ring re-spaced evenly to whatever is left over — so
// the crowd that forms around the product has exactly one figure per slot and
// no overlaps anywhere in it.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11;
const PERSON = staticFile("person.png");

const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;
const Y0 = 1300;

const SIZE = 70; // person.png is square; its ink fills ~84% of the box
const S_MIN = 0.86;
const S_VAR = 0.28;
const SIZE_MAX = SIZE * (S_MIN + S_VAR); // 75.6

// Where they stand. A crowd has to look scattered, and a small scatter on a
// tight grid reads as a lattice — so the grid is wide enough that a large
// scatter still clears: the closest any two can get is the step less the
// scatter, 100 across and 96 down, which stays clear of SIZE_MAX with the
// lean and the idle drift on top of it.
const COLS = 13;
const ROWS = 13;
const STEP_X = 172;
const STEP_Y = 166;
const SCATTER = 0.42;
const HALF_X = ((COLS - 1) / 2) * STEP_X;
const HALF_Y = ((ROWS - 1) / 2) * STEP_Y;

// Nothing is placed off the grid. A block stands in a cell of the crowd's own
// grid and the person who would have stood there is not there — six cells for
// the attempts, and two at the middle for the model and the product above it.
// Clearance follows from that rather than from luck: a neighbour can lean a
// scatter's worth toward a cell, which leaves 96 across and 91 down of free
// space around its centre, and the widest block is 66 by 22.
type Cell = { c: number; r: number };
const MODEL_CELLS: Cell[] = [
  { c: 0, r: 0 },
  { c: 0, r: -1 },
];
const ATTEMPT_CELLS: Cell[] = [
  { c: -1, r: -1 },
  { c: 1, r: 1 },
  { c: -1, r: 2 },
  { c: 1, r: -2 },
  { c: -2, r: 0 },
  { c: 0, r: -2 },
];
const cellKey = (c: number, r: number) => `${c},${r}`;
const TAKEN = new Set(
  [...MODEL_CELLS, ...ATTEMPT_CELLS].map((x) => cellKey(x.c, x.r)),
);

// Where they end up.
// Derived from the widest figure rather than picked, so the no-overlap
// guarantee is in the code and not in a comment: a full ring's arc spacing is
// 2piR/floor(2piR/RING_S) >= RING_S, the radial gap between rings is RING_S,
// and squashing y only ever increases separation.
const RING_S = Math.round(SIZE_MAX * 1.14);
// Far enough out that no ring-0 figure, at any bearing, touches the model or
// the product standing on it.
const RING_R0 = 210;
const Y_SQUASH = 1.25; // scaling y only ever increases separation

type Person = {
  hx: number;
  hy: number;
  tx: number;
  ty: number;
  s: number;
  ph: number;
  rank: number;
};

const PEOPLE: Person[] = (() => {
  const raw: { hx: number; hy: number; i: number }[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const c = (i % COLS) - (COLS - 1) / 2;
    const r = Math.floor(i / COLS) - (ROWS - 1) / 2;
    if (TAKEN.has(cellKey(c, r))) continue;
    const ox = c * STEP_X + (hash(i * 3 + 1) - 0.5) * STEP_X * SCATTER;
    const oy = r * STEP_Y + (hash(i * 7 + 5) - 0.5) * STEP_Y * SCATTER;
    if (Math.hypot(ox / HALF_X, oy / HALF_Y) > 1.02 + (hash(i * 17 + 3) - 0.5) * 0.22)
      continue;
    raw.push({ hx: ox, hy: oy, i });
  }
  const n = raw.length;

  // Rings, inner to outer, until everybody has a slot.
  const rings: { R: number; count: number }[] = [];
  let placed = 0;
  for (let j = 0; placed < n; j++) {
    const R = RING_R0 + j * RING_S;
    const cap = Math.max(1, Math.floor((2 * Math.PI * R) / RING_S));
    const count = Math.min(cap, n - placed);
    rings.push({ R, count });
    placed += count;
  }

  const byDist = raw
    .map((p, idx) => ({ idx, d: Math.hypot(p.hx, p.hy), a: Math.atan2(p.hy, p.hx) }))
    .sort((x, y) => x.d - y.d);

  const out: Person[] = new Array(n);
  let cursor = 0;
  rings.forEach((ring, j) => {
    const group = byDist.slice(cursor, cursor + ring.count);
    cursor += ring.count;
    // The last ring is re-spaced over however many are left, so it is evenly
    // filled rather than a full ring with holes in it.
    const step = (Math.PI * 2) / ring.count;
    const base = j % 2 ? step / 2 : 0;
    const sorted = [...group].sort((x, y) => x.a - y.a);
    // Rotate the ring so the first arrival keeps roughly its own bearing.
    let rot = 0;
    let best = Infinity;
    for (let m = 0; m < ring.count; m++) {
      let d = Math.abs(base + m * step - (sorted[0].a + Math.PI * 2)) % (Math.PI * 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d < best) {
        best = d;
        rot = m;
      }
    }
    sorted.forEach((g, m) => {
      const a = base + ((rot + m) % ring.count) * step;
      const p = raw[g.idx];
      out[g.idx] = {
        hx: p.hx,
        hy: p.hy,
        tx: Math.cos(a) * ring.R,
        ty: Math.sin(a) * ring.R * Y_SQUASH,
        s: S_MIN + hash(p.i * 11 + 3) * S_VAR,
        ph: hash(p.i * 13 + 9) * 6.283,
        rank: byDist.findIndex((b) => b.idx === g.idx),
      };
    });
  });
  return out;
})();
const N = PEOPLE.length;

type Attempt = { x: number; y: number; at: number; reach: number; w: number };
const ATTEMPTS: Attempt[] = ATTEMPT_CELLS.map((cell, i) => ({
  x: cell.c * STEP_X,
  y: cell.r * STEP_Y,
  ...[
    { at: -8, reach: 265, w: 5 * G },
    { at: 8, reach: 280, w: 4 * G },
    { at: 20, reach: 258, w: 5 * G },
    { at: 32, reach: 292, w: 6 * G },
    { at: 44, reach: 276, w: 4 * G },
    // "catch on" — the near miss, and the only one that reaches the whole
    // frame. It comes to nothing all the same.
    { at: 55, reach: 520, w: 5 * G },
  ][i],
}));
const A_R0 = 70;
const A_GROW = 16;
const A_H = 2 * G;
// A step, not a lunge. At 24 the most a lean can close the gap between two
// neighbours is about eight world units, which keeps them clear.
const LEAN = 24;
const IDLE_X = 3.5;
const IDLE_Y = 4;

const MODEL_AT = 103;
const MODEL_FLARE = 116;
const MODEL_W = 4 * G;
const MODEL_W2 = 5 * G;
const PROD_AT = 124;
const PROD_T = 16;
const PROD_CLICK = 145;
const PROD_W = 6 * G;

const COME_AT = 142;
const COME_T = 34;
const COME_SPREAD = 38; // inner rings are settled before the outer arrive

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));

const life = (age: number) => {
  if (age < 0) return 0;
  if (age < 5) return ez(GLIDE, age / 5);
  if (age < 11) return 1;
  return 1 - ez(GLIDE, (age - 11) / 15);
};

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
  restOpacity: z.number(),
  keenOpacity: z.number(),
  spentOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "it's very" · 18 "hard to tell" · 40 "what's going to" · 55 "catch on"
  //   69 "because a" · 103 "new model may" · 116 "suddenly" · 124 "be good at"
  //   138 "something" · 145 "that makes" · 157 "a product" · 167 "possible"
  //   181 line ends · 230 end of tail
  beats: z.object({
    catchOn: z.number().int(),
    because: z.number().int(),
    newModel: z.number().int(),
    suddenly: z.number().int(),
    possible: z.number().int(),
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
  restOpacity: 0.46,
  keenOpacity: 0.96,
  spentOpacity: 0.2,
  beats: {
    catchOn: 55,
    because: 69,
    newModel: 103,
    suddenly: 116,
    possible: 167,
  },
});

const CrowdComesToIt: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  restOpacity,
  keenOpacity,
  spentOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // Three movements, tapered at both ends so the follower never stops dead: a
  // slow drift while nothing works, one push in to 1.40 on the model, and one
  // long accelerating pull out that eases into its resting frame.
  const CAM_F = [0, 95, 112, 134, 150, 158, 172, 190, 206, 220, DURATION];
  const CAM_K = [
    1.18, 1.1, 1.2, 1.38, 1.4, 1.36, 1.12, 0.88, 0.79, 0.765, 0.76,
  ];
  const CAM_CY = [
    1372, 1420, 1404, 1391, 1389, 1392, 1412, 1442, 1458, 1463, 1464,
  ];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  const modelIn = ez(LAND, (frame - MODEL_AT) / 9);
  const modelGrow = ez(LAND, (frame - MODEL_FLARE) / 10);
  const modelW = MODEL_W + (MODEL_W2 - MODEL_W) * modelGrow;
  const flareAge = frame - MODEL_FLARE;
  const modelFill =
    flareAge >= 0 && flareAge < FLASH_DENSE + 1 ? FLASH_DENSE_INK : accent;

  const prodOpen = ez(RISE, (frame - PROD_AT) / PROD_T);
  const prodFilled = frame >= PROD_CLICK;
  const prodClick = clamp01(1 - (frame - PROD_CLICK) / FLASH);

  // The record of what was tried clears as the model arrives — partly because
  // the past attempts stop mattering, and partly so that nobody walks over an
  // outline on their way in.
  const spentFade = 1 - ez(GLIDE, (frame - MODEL_AT) / 22);

  const live = ATTEMPTS.map((a) => {
    const age = frame - a.at;
    return { a, l: life(age), r: A_R0 + a.reach * ez(GLIDE, age / A_GROW) };
  });

  const glyph = (o: number, x: number, y: number, w: number): React.CSSProperties => ({
    position: "absolute",
    left: x - w / 2,
    top: y - w / 2,
    width: w,
    height: w,
    backgroundColor: ink,
    maskImage: `url(${PERSON})`,
    WebkitMaskImage: `url(${PERSON})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    opacity: o,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, CAM_CY[0], backgroundBlur, backgroundDim)}
        />
      </AbsoluteFill>

      {/* Gates every frame on the glyph being loaded. */}
      <Img src={PERSON} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />

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
          {PEOPLE.map((p, i) => {
            let pull = 0;
            let pdx = 0;
            let pdy = 0;
            for (const { a, l, r } of live) {
              if (l <= 0) continue;
              const dx = a.x - p.hx;
              const dy = a.y - p.hy;
              const d = Math.hypot(dx, dy);
              if (d >= r || d < 1) continue;
              const w = l * ez(GLIDE, (1 - d / r) * 1.8);
              if (w > pull) {
                pull = w;
                pdx = dx / d;
                pdy = dy / d;
              }
            }

            const come = ez(
              GLIDE,
              (frame - COME_AT - (p.rank / N) * COME_SPREAD) / COME_T,
            );
            const idle = 1 - come;
            const x =
              X0 +
              p.hx +
              (p.tx - p.hx) * come +
              (pdx * LEAN * pull + Math.cos(frame / 47 + p.ph) * IDLE_X) * idle;
            const y =
              Y0 +
              p.hy +
              (p.ty - p.hy) * come +
              (pdy * LEAN * pull + Math.sin(frame / 39 + p.ph) * IDLE_Y) * idle;

            const s = Math.max(pull, come);
            return (
              <div
                key={`p-${i}`}
                style={glyph(
                  restOpacity + (keenOpacity - restOpacity) * s,
                  x,
                  y,
                  SIZE * p.s,
                )}
              />
            );
          })}

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {ATTEMPTS.map((a, i) => {
              const age = frame - a.at;
              if (age < 0) return null;
              const open = ez(LAND, age / 5);
              const l = life(age);
              const w = a.w * (0.3 + 0.7 * open);
              return (
                <rect
                  key={`a-${i}`}
                  x={X0 + a.x - w / 2}
                  y={Y0 + a.y - A_H / 2}
                  width={w}
                  height={A_H}
                  rx={RX}
                  fill={ink}
                  fillOpacity={0.92 * l}
                  stroke={ink}
                  strokeWidth={3}
                  strokeOpacity={spentOpacity * (1 - l) * spentFade}
                />
              );
            })}

            {modelIn > 0 ? (
              <rect
                x={X0 - (modelW * modelIn) / 2}
                y={Y0 - (modelW * modelIn) / 2}
                width={modelW * modelIn}
                height={modelW * modelIn}
                rx={RX}
                fill={modelFill}
                opacity={0.95}
              />
            ) : null}

            {prodOpen > 0 ? (
              <rect
                x={X0 - (PROD_W * prodOpen) / 2}
                y={Y0 - modelW / 2 - A_H - G / 2}
                width={PROD_W * prodOpen}
                height={A_H}
                rx={RX}
                fill={ink}
                fillOpacity={prodFilled ? 0.96 : 0}
                stroke={ink}
                strokeWidth={3}
                strokeOpacity={prodFilled ? 0.96 * prodClick : 0.5}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CrowdComesToIt;
