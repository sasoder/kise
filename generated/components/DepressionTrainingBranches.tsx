import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const schema = z.object({
  icon: z.string(),
  // The one accent in the piece: it means "depressed" and nothing else.
  accent: z.string(),
  // Beat frames, so the whole diagram can be retimed to the edit without
  // touching layout. Defaults are the SRT timings with t=0 at 00:22.179.
  rlIn: z.number().int(),
  rlOut: z.number().int(),
  sftIn: z.number().int(),
  sftOut: z.number().int(),
  filteredIn: z.number().int(),
  filterAt: z.number().int(),
  filteredOut: z.number().int(),
  // Once the contradiction has landed, the first two lanes step back.
  dimAt: z.number().int(),
});

export type DepressionTrainingBranchesProps = z.infer<typeof schema>;

export const defaultProps: DepressionTrainingBranchesProps = schema.parse({
  icon: 'deep.png',
  accent: '#FF5E1A',
  rlIn: 65,
  rlOut: 102,
  sftIn: 127,
  sftOut: 178,
  filteredIn: 207,
  filterAt: 250,
  filteredOut: 337,
  dimAt: 350,
});

// ---- Layout (1080x1920 transparent overlay) ----
const SPINE_X = 166;
const BASE_PLATE = 148;
const BASE_CY = 370;
const SPINE_TOP = BASE_CY + BASE_PLATE / 2;

const PILL_X = 300;
const PILL_W = 280;
const PILL_RIGHT = PILL_X + PILL_W;
const ARROW_X1 = PILL_RIGHT + 16;
const ARROW_X2 = ARROW_X1 + 60;
const OUTCOME_X = ARROW_X2 + 16;

const WHITE = 'rgba(255,255,255,0.92)';
const PLATE = 'rgba(10,10,12,0.55)';
const HAIRLINE = 2;

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// Naked type sits straight on footage, so it carries its own contrast. Kept to
// a single soft pass: the root drop-shadow already adds one, and stacking both
// hard and soft shadows reads as a black slab rather than a floating label.
const TEXT_SHADOW = '0 2px 9px rgba(0,0,0,0.7)';

type Row = {
  y: number;
  pillHeight: number;
  term: string;
  note: string;
  outcome: string;
  depressed: boolean;
  strip: 'none' | 'full' | 'filtered';
};

const ROWS: Row[] = [
  {
    y: 700,
    pillHeight: 92,
    term: 'RL',
    note: 'reinforcement learning — it tries things, and good outcomes get rewarded',
    outcome: 'NOT DEPRESSED',
    depressed: false,
    strip: 'none',
  },
  {
    y: 1020,
    pillHeight: 150,
    term: 'SFT',
    note: 'supervised fine-tuning — it is shown example conversations and copies them',
    outcome: 'DEPRESSED',
    depressed: true,
    strip: 'full',
  },
  {
    y: 1390,
    pillHeight: 150,
    term: 'SFT',
    note: 'the same data, with every depressed example filtered out first',
    outcome: 'STILL DEPRESSED',
    depressed: true,
    strip: 'filtered',
  },
];

// ---- The data strip inside the SFT pills ----
const DOT_COUNT = 9;
const DOT_R = 7;
const DOT_GAP = 26;
const STRIP_W = 264;
const STRIP_H = 22;
const STRIP_CX = STRIP_W / 2;
const DEPRESSED_DOTS = [2, 3, 6];

const dotHomeX = (i: number) => STRIP_CX - ((DOT_COUNT - 1) * DOT_GAP) / 2 + i * DOT_GAP;

const DataStrip: React.FC<{
  accent: string;
  filterAt: number | null;
}> = ({accent, filterAt}) => {
  const frame = useCurrentFrame();

  const kept = new Array(DOT_COUNT)
    .fill(true)
    .map((_, i) => i)
    .filter((i) => !DEPRESSED_DOTS.includes(i));

  return (
    <svg width={STRIP_W} height={STRIP_H} viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}>
      {new Array(DOT_COUNT).fill(true).map((_, i) => {
        const isDepressed = DEPRESSED_DOTS.includes(i);

        if (filterAt === null) {
          return (
            <circle
              key={i}
              cx={dotHomeX(i)}
              cy={STRIP_H / 2}
              r={DOT_R}
              fill={isDepressed ? accent : WHITE}
            />
          );
        }

        // Filtered lane: the depressed examples lift out of the set, and the
        // survivors close ranks so the remaining data reads as intact.
        if (isDepressed) {
          const leave = interpolate(frame, [filterAt, filterAt + 16], [0, 1], {
            ...clamp,
            easing: Easing.in(Easing.quad),
          });
          return (
            <circle
              key={i}
              cx={dotHomeX(i)}
              cy={STRIP_H / 2 - leave * 16}
              r={DOT_R * (1 - leave)}
              fill={accent}
              opacity={1 - leave}
            />
          );
        }

        const slot = kept.indexOf(i);
        const target = STRIP_CX - ((kept.length - 1) * DOT_GAP) / 2 + slot * DOT_GAP;
        return (
          <circle
            key={i}
            cx={interpolate(frame, [filterAt + 10, filterAt + 40], [dotHomeX(i), target], {
              ...clamp,
              easing: Easing.inOut(Easing.cubic),
            })}
            cy={STRIP_H / 2}
            r={DOT_R}
            fill={WHITE}
          />
        );
      })}
    </svg>
  );
};

// ---- One lane: connector, pill, note, arrow, outcome ----
const Lane: React.FC<{
  row: Row;
  accent: string;
  startAt: number;
  outcomeAt: number;
  filterAt: number | null;
  noteAt: number;
  dim: number;
}> = ({row, accent, startAt, outcomeAt, filterAt, noteAt, dim}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pillTop = row.y - row.pillHeight / 2;

  // The connector runs out of the spine, then the pill arrives along it, so the
  // lane reads as one continuous movement away from the base model.
  const connector = interpolate(frame, [startAt, startAt + 12], [SPINE_X, PILL_X], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const pillEnter = spring({
    frame: frame - (startAt + 5),
    fps,
    config: {damping: 26, stiffness: 110, mass: 0.8},
  });

  const arrow = interpolate(frame, [outcomeAt - 8, outcomeAt], [ARROW_X1, ARROW_X2], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const outcomeEnter = spring({
    frame: frame - outcomeAt,
    fps,
    config: {damping: 22, stiffness: 130, mass: 0.7},
  });

  // The third lane's result is the surprise, so it gets a brief bloom that
  // settles rather than a permanent glow.
  const flash = interpolate(frame, [outcomeAt, outcomeAt + 10, outcomeAt + 34], [0, 1, 0], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  const noteOpacity = interpolate(frame, [noteAt, noteAt + 14], [0, 0.82], clamp);

  return (
    <AbsoluteFill style={{opacity: dim}}>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}
      >
        <line
          x1={SPINE_X}
          y1={row.y}
          x2={connector}
          y2={row.y}
          stroke={WHITE}
          strokeWidth={HAIRLINE}
        />
        <line
          x1={ARROW_X1}
          y1={row.y}
          x2={arrow}
          y2={row.y}
          stroke={row.depressed ? accent : WHITE}
          strokeWidth={HAIRLINE}
        />
        <polygon
          points={`${ARROW_X2},${row.y} ${ARROW_X2 - 13},${row.y - 8} ${ARROW_X2 - 13},${row.y + 8}`}
          fill={row.depressed ? accent : WHITE}
          opacity={interpolate(frame, [outcomeAt - 3, outcomeAt + 2], [0, 1], clamp)}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: PILL_X,
          top: pillTop,
          width: PILL_W,
          height: row.pillHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          backgroundColor: PLATE,
          border: `${HAIRLINE}px solid ${WHITE}`,
          borderRadius: 16,
          opacity: interpolate(pillEnter, [0, 0.35], [0, 1], clamp),
          translate: `${interpolate(pillEnter, [0, 1], [-34, 0], clamp)}px 0px`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: 1,
            color: WHITE,
          }}
        >
          {row.term}
        </div>
        {row.strip === 'none' ? null : (
          <DataStrip accent={accent} filterAt={row.strip === 'filtered' ? filterAt : null} />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: PILL_X,
          top: pillTop + row.pillHeight + 18,
          width: 560,
          fontFamily,
          fontSize: 25,
          fontWeight: 600,
          lineHeight: 1.3,
          color: '#FFFFFF',
          textShadow: TEXT_SHADOW,
          opacity: noteOpacity,
        }}
      >
        {row.note}
      </div>

      <div
        style={{
          position: 'absolute',
          left: OUTCOME_X,
          // Half a 38px line box, so the word sits centred on the arrow.
          top: row.y - 21,
          width: 320,
          fontFamily,
          fontSize: 38,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -1,
          color: row.depressed ? accent : WHITE,
          textShadow: `${TEXT_SHADOW}${
            row.depressed ? `, 0 0 ${18 * flash}px ${accent}` : ''
          }`,
          opacity: interpolate(outcomeEnter, [0, 0.35], [0, 1], clamp),
          translate: `${interpolate(outcomeEnter, [0, 1], [-18, 0], clamp)}px 0px`,
        }}
      >
        {row.outcome}
      </div>
    </AbsoluteFill>
  );
};

const DepressionTrainingBranches: React.FC<DepressionTrainingBranchesProps> = ({
  icon,
  accent,
  rlIn,
  rlOut,
  sftIn,
  sftOut,
  filteredIn,
  filterAt,
  filteredOut,
  dimAt,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const baseEnter = spring({
    frame,
    fps,
    config: {damping: 24, stiffness: 100, mass: 0.9},
  });

  // The spine only ever grows as far as the lane that is currently opening.
  const spineY = interpolate(
    frame,
    [rlIn - 10, rlIn, sftIn - 10, sftIn, filteredIn - 10, filteredIn],
    [SPINE_TOP, ROWS[0].y, ROWS[0].y, ROWS[1].y, ROWS[1].y, ROWS[2].y],
    {...clamp, easing: Easing.inOut(Easing.cubic)},
  );

  const settled = interpolate(frame, [dimAt, dimAt + 24], [1, 0.62], clamp);

  return (
    // Overlay asset: no background, so this drops straight onto the footage.
    <AbsoluteFill style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))'}}>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}
      >
        <line
          x1={SPINE_X}
          y1={SPINE_TOP}
          x2={SPINE_X}
          y2={spineY}
          stroke={WHITE}
          strokeWidth={HAIRLINE}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: SPINE_X - BASE_PLATE / 2,
          top: BASE_CY - BASE_PLATE / 2,
          width: BASE_PLATE,
          height: BASE_PLATE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: PLATE,
          border: `${HAIRLINE}px solid ${WHITE}`,
          borderRadius: 24,
          opacity: interpolate(baseEnter, [0, 0.35], [0, 1], clamp),
          scale: interpolate(baseEnter, [0, 1], [0.8, 1], clamp) + '',
        }}
      >
        <Img src={staticFile(icon)} style={{width: 104, height: 104}} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: SPINE_X + BASE_PLATE / 2 + 32,
          top: BASE_CY - 46,
          width: 600,
          fontFamily,
          opacity: interpolate(baseEnter, [0.15, 0.6], [0, 1], clamp),
          translate: `${interpolate(baseEnter, [0, 1], [-20, 0], clamp)}px 0px`,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: -0.5,
            color: '#FFFFFF',
            textShadow: TEXT_SHADOW,
          }}
        >
          BASE MODEL
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 27,
            fontWeight: 600,
            color: '#FFFFFF',
            opacity: 0.82,
            textShadow: TEXT_SHADOW,
          }}
        >
          straight out of pretraining — not depressed
        </div>
      </div>

      <Lane
        row={ROWS[0]}
        accent={accent}
        startAt={rlIn}
        outcomeAt={rlOut}
        filterAt={null}
        noteAt={rlIn + 8}
        dim={settled}
      />
      <Lane
        row={ROWS[1]}
        accent={accent}
        startAt={sftIn}
        outcomeAt={sftOut}
        filterAt={null}
        noteAt={sftIn + 8}
        dim={settled}
      />
      <Lane
        row={ROWS[2]}
        accent={accent}
        startAt={filteredIn}
        outcomeAt={filteredOut}
        filterAt={filterAt}
        noteAt={filterAt + 4}
        dim={1}
      />
    </AbsoluteFill>
  );
};

export default DepressionTrainingBranches;
