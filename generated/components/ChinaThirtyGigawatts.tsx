import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:35.159 -> 00:00:41.399 of the source cut. round(6.240 * 30) = 187.
// Picks up from the last frame of ComputeInflect2028, where China stood alone
// on the mid-height rule. That bar becomes the middle row of this grid, so the
// field opens outward from where the previous graphic left off.
export const DURATION = 187;

// One cell is one gigawatt. The whole point of the sentence is that thirty of
// them is not many, which only reads if the arena is drawn before the claim is.
const COLS = 10;
const ROWS = 20;
const TOTAL = COLS * ROWS;
const CELL = 56;
const GAP = 10;
const PITCH = CELL + GAP;
const RADIUS = 8;

const GRID_W = COLS * PITCH - GAP;
const GRID_H = ROWS * PITCH - GAP;
const X0 = Math.round((1080 - GRID_W) / 2);
const Y0 = Math.round((1920 - GRID_H) / 2);

// Ten columns is the only width that puts every quantity on a whole row:
// China 30 (3 rows), the rest of the world 30 (3 rows), America 140 (14 rows).
const CN = 30;
const REST = 30;
const US = TOTAL - CN - REST;
const CN_TOP_ROW = ROWS - CN / COLS;
const REST_TOP_ROW = CN_TOP_ROW - REST / COLS;

// Where in the grid each block's claim index lands. America fills downward from
// the top, China upward from the floor, and the rest of the world closes the
// seam between them.
const usSlot = (p: number) => p;
const cnSlot = (p: number) => (ROWS - 1 - Math.floor(p / COLS)) * COLS + (p % COLS);
const restSlot = (p: number) => (REST_TOP_ROW + Math.floor(p / COLS)) * COLS + (p % COLS);

const slotCol = (slot: number) => slot % COLS;
const slotRow = (slot: number) => Math.floor(slot / COLS);
const slotX = (slot: number) => X0 + slotCol(slot) * PITCH;
const slotY = (slot: number) => Y0 + slotRow(slot) * PITCH;

// The substrate arrives as a wavefront out of the row the old bar stood on.
const SEED_ROW = (ROWS - 1) / 2;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const snap = (v: number) => Math.round(v) + 0.5;
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const rot = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * INNER_RATIO;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5 + rot;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

// Both fields are the ones already clipped into the bars of the three graphics
// that run before this one, so a single flagged cell identifies a block without
// a legend or a word of type.
const UsField: React.FC<{w: number; h: number}> = ({w, h}) => {
  const stripeH = h / 13;
  const unionW = h * 0.76;
  const unionH = stripeH * 7;
  const starR = h * 0.0308;

  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (unionH * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0 ? (unionW * (2 * col + 1)) / 12 : (unionW * (2 * col + 2)) / 12;
      stars.push(starPoints(x, y, starR));
    }
  }

  return (
    <>
      <rect width={w} height={h} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} y={i * 2 * stripeH} width={w} height={stripeH} fill="#B22234" />
      ))}
      <rect width={unionW} height={unionH} fill="#3C3B6E" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#FFFFFF" />
      ))}
    </>
  );
};

const CnField: React.FC<{w: number; h: number}> = ({w, h}) => {
  const s = h / 60;
  const big = {x: 15 * s, y: 15 * s, r: 9 * s};
  const small = [
    {x: 30 * s, y: 6 * s},
    {x: 36 * s, y: 12 * s},
    {x: 36 * s, y: 21 * s},
    {x: 30 * s, y: 27 * s},
  ];

  return (
    <>
      <rect width={w} height={h} fill="#DE2910" />
      <polygon points={starPoints(big.x, big.y, big.r)} fill="#FFDE00" />
      {small.map((p, i) => {
        const aim = (Math.atan2(big.y - p.y, big.x - p.x) * 180) / Math.PI + 90;
        return <polygon key={i} points={starPoints(p.x, p.y, 3 * s, aim)} fill="#FFDE00" />;
      })}
    </>
  );
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  china: z.string(),
  shadow: z.string(),
  // Unclaimed world, the rest of the world once it is drawn, and the two
  // claimed blocks. Three states: unknown -> read -> structural.
  dimOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  claimOpacity: z.number().min(0).max(1),
  // How many cells are mid-entrance at once, per block. Set so each cell's pop
  // lasts about five frames whatever rate its block fills at.
  windows: z.object({
    cn: z.number(),
    us: z.number(),
    rest: z.number(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:35.159:
  //     0 "but it's pretty" ·  14 "easy to"         ·  31 "say china"
  //    45 "will have"       ·  53 "like 30"         ·  65 "gigawatts of ai"
  //    83 "compute or less" · 133 "by 2028?"        · 158 "yeah in 2028"
  beats: z.object({
    like30: z.number().int(),
    gigawattsOfAi: z.number().int(),
    orLess: z.number().int(),
    by2028: z.number().int(),
    yeah2028: z.number().int(),
  }),
});

export type ChinaThirtyGigawattsProps = z.infer<typeof schema>;

export const defaultProps: ChinaThirtyGigawattsProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  china: '#DE2910',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.1,
  restOpacity: 0.34,
  claimOpacity: 0.94,
  windows: {cn: 5.5, us: 17, rest: 8},
  beats: {
    like30: 53,
    gigawattsOfAi: 65,
    orLess: 83,
    by2028: 133,
    yeah2028: 158,
  },
});

const ChinaThirtyGigawatts: React.FC<ChinaThirtyGigawattsProps> = ({
  ink,
  accent,
  china,
  shadow,
  dimOpacity,
  restOpacity,
  claimOpacity,
  windows,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  // He names the quantity on "like 30" and finishes it on "compute". A few
  // frames of anticipation so the first cell is already moving on the word.
  // Every count runs one appearance window past its total, or the last cells
  // in the block are still mid-entrance when the block is nominally full and
  // the trailing edge never resolves.
  const cnCount = interpolate(frame, [beats.like30 - 4, beats.orLess], [0, CN + windows.cn], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  // The whole answer arrives inside the pause he leaves on "or less": one
  // hundred and forty cells in forty frames against China's thirty in thirty,
  // so the quantity is in the rate as well as the count.
  const usCount = interpolate(frame, [beats.orLess + 5, beats.by2028 - 5], [0, US + windows.us], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const restCount = interpolate(frame, [beats.by2028, beats.by2028 + 21], [0, REST + windows.rest], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  const appearOf = (count: number, p: number, window: number) =>
    interpolate(count - p, [0, window], [0, 1], clamp);

  // "or less" is a ceiling, not a forecast. The rule lands on thirty and the
  // top row hollows out behind it — the third row is claimed, not built.
  const ceiling = ramp(beats.orLess, beats.orLess + 12);
  const hollow = ramp(beats.orLess + 3, beats.orLess + 21, Easing.inOut(Easing.cubic));
  // "yeah, in 2028" confirms it, so the cap locks once and holds.
  const lock = interpolate(
    frame,
    [beats.yeah2028, beats.yeah2028 + 10, beats.yeah2028 + 26],
    [0, 1, 0.45],
    {easing: Easing.out(Easing.cubic), ...clamp},
  );

  const substrateIn = (slot: number) => {
    const t = (Math.abs(slotRow(slot) - SEED_ROW) / SEED_ROW) * 30;
    return interpolate(frame, [t - 8, t + 8], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });
  };

  const capY = snap(Y0 + CN_TOP_ROW * PITCH - GAP / 2);
  const capOverhang = 44 + 14 * lock;

  const Cell: React.FC<{
    slot: number;
    fill: string;
    opacity: number;
    appear: number;
  }> = ({slot, fill, opacity, appear}) => {
    const scale = 0.55 + 0.45 * appear;
    return (
      <rect
        x={slotX(slot) + (CELL * (1 - scale)) / 2}
        y={slotY(slot) + (CELL * (1 - scale)) / 2}
        width={CELL * scale}
        height={CELL * scale}
        rx={RADIUS * scale}
        fill={fill}
        opacity={opacity}
      />
    );
  };

  const cn = Array.from({length: CN}, (_, p) => ({
    p,
    slot: cnSlot(p),
    appear: appearOf(cnCount, p, windows.cn),
    // The top row of the block is the part he hedged.
    capped: p >= CN - COLS,
  })).filter((c) => c.appear > 0.002);

  const us = Array.from({length: US}, (_, p) => ({
    p,
    slot: usSlot(p),
    appear: appearOf(usCount, p, windows.us),
  })).filter((c) => c.appear > 0.002);

  const rest = Array.from({length: REST}, (_, p) => ({
    p,
    slot: restSlot(p),
    appear: appearOf(restCount, p, windows.rest),
  })).filter((c) => c.appear > 0.002);

  const cnFlagSlot = cnSlot(0);
  const usFlagSlot = usSlot(0);
  const cnFlagIn = appearOf(cnCount, 0, windows.cn);
  const usFlagIn = appearOf(usCount, 0, windows.us);

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="gw-cn-flag">
            <rect
              x={slotX(cnFlagSlot)}
              y={slotY(cnFlagSlot)}
              width={CELL}
              height={CELL}
              rx={RADIUS}
            />
          </clipPath>
          <clipPath id="gw-us-flag">
            <rect
              x={slotX(usFlagSlot)}
              y={slotY(usFlagSlot)}
              width={CELL}
              height={CELL}
              rx={RADIUS}
            />
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The world in 2028. Two hundred gigawatts, none of them claimed yet. */}
          {Array.from({length: TOTAL}, (_, slot) => (
            <Cell
              key={`s${slot}`}
              slot={slot}
              fill={ink}
              opacity={dimOpacity * substrateIn(slot)}
              appear={1}
            />
          ))}

          {/* Everyone who is neither America nor China, closing the seam. It is
              the same three rows China gets, which is the quietest thing here. */}
          {rest.map((c) => (
            <Cell
              key={`r${c.slot}`}
              slot={c.slot}
              fill={ink}
              opacity={restOpacity * c.appear}
              appear={c.appear}
            />
          ))}

          {/* America. Derived, not stated: his own seventy percent of watts
              applied to the world total he confirms later in the episode. */}
          {us.map((c) => (
            <Cell
              key={`u${c.slot}`}
              slot={c.slot}
              fill={accent}
              opacity={claimOpacity * c.appear}
              appear={c.appear}
            />
          ))}

          <g clipPath="url(#gw-us-flag)" opacity={usFlagIn}>
            <g transform={`translate(${slotX(usFlagSlot)}, ${slotY(usFlagSlot)})`}>
              <UsField w={CELL} h={CELL} />
            </g>
          </g>

          {/* China. Thirty at most. */}
          {cn.map((c) => {
            const solid = claimOpacity * c.appear * (c.capped ? 1 - hollow : 1);
            const outline = c.capped ? claimOpacity * c.appear * hollow : 0;
            const scale = 0.55 + 0.45 * c.appear;
            return (
              <React.Fragment key={`c${c.slot}`}>
                <Cell slot={c.slot} fill={china} opacity={solid} appear={c.appear} />
                {outline > 0.002 ? (
                  <rect
                    x={slotX(c.slot) + (CELL * (1 - scale)) / 2 + 2}
                    y={slotY(c.slot) + (CELL * (1 - scale)) / 2 + 2}
                    width={CELL * scale - 4}
                    height={CELL * scale - 4}
                    rx={Math.max(1, RADIUS * scale - 2)}
                    fill="none"
                    stroke={china}
                    strokeWidth={4}
                    opacity={outline}
                  />
                ) : null}
              </React.Fragment>
            );
          })}

          <g clipPath="url(#gw-cn-flag)" opacity={cnFlagIn}>
            <g transform={`translate(${slotX(cnFlagSlot)}, ${slotY(cnFlagSlot)})`}>
              <CnField w={CELL} h={CELL} />
            </g>
          </g>

          {/* The ceiling. Thirty gigawatts, and the word is "or less". */}
          <g opacity={ceiling}>
            <line
              x1={X0 - capOverhang}
              y1={capY}
              x2={X0 + GRID_W + capOverhang}
              y2={capY}
              stroke={ink}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.6 + 0.35 * lock}
            />
            {[X0 - capOverhang, X0 + GRID_W + capOverhang].map((x) => (
              <line
                key={`cap${x}`}
                x1={x}
                y1={capY - 15}
                x2={x}
                y2={capY + 15}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.6 + 0.35 * lock}
              />
            ))}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ChinaThirtyGigawatts;
