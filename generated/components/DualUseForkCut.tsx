import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:00.000 -> 00:00:12.740 of the source cut. round(12.740 * 30).
export const DURATION = 382;

// One capability rising out of the people who can reach it, forking into two
// uses. The fork is the thing that turns out not to be real: the two uses
// collapse onto each other, so the only place left to cut is the stem.
const CX = 540;
const NODE_Y = 540;
const NODE_DX = 250;
const FORK_Y = 1020;
const TRUNK_BOTTOM = 1500;
// Below the fork, close to the people — cutting here is cutting access, not
// cutting a use.
const CUT_Y = 1250;
// Bezier handles as a fixed fraction of the fork-to-node rise, so the arms
// straighten into the stem when the node x collapses to centre.
const BEND = 0.35;
const C1_Y = FORK_Y - BEND * (FORK_Y - NODE_Y);
const C2_Y = NODE_Y + BEND * (FORK_Y - NODE_Y);
// Parameter 0.5 on the arm: x is the midpoint of centre and node, y is fixed.
const CLAMP_Y = 780;

const HEAD_Y = 1648;
const HEAD_R = 19;
const SHOULDER_R = 34;
const PEOPLE_GAP = 132;
const JAW_H = 34;
const JAW_W = 46;

const ease = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  pop: Easing.bezier(0.2, 1.5, 0.4, 1),
};

const ramp = (
  frame: number,
  range: number[],
  out: number[],
  easing: (n: number) => number = ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const armPath = (nx: number) =>
  `M${CX} ${FORK_Y} C${CX} ${C1_Y} ${nx.toFixed(2)} ${C2_Y} ${nx.toFixed(2)} ${NODE_Y}`;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  peopleOpacity: z.number().min(0).max(1),
  linkOpacity: z.number().min(0).max(1),
  strokeWidth: z.number().min(4).max(24),
  nodeRadius: z.number().min(20).max(90),
  mergedRadius: z.number().min(20).max(120),
  peopleCount: z.number().int().min(3).max(9),
  // Beat frames from the SRT at 30fps, frame 0 pinned to 00:00:00.000:
  //   16 "use" · 41 "intelligence" · 77 "if we want to" · 117 "restrict"
  //   166 "things we don't" · 198 "are pro social" · 253 "we just have to"
  //   276 "limit broad" · 294 "democratic" · 328 "access to" · 356 "ai capabilities"
  beats: z.object({
    fork: z.number().int(),
    nodes: z.number().int(),
    clampIn: z.number().int(),
    clampGrip: z.number().int(),
    markHarm: z.number().int(),
    markGood: z.number().int(),
    merge: z.number().int(),
    mergeEnd: z.number().int(),
    people: z.number().int(),
    descend: z.number().int(),
    descendEnd: z.number().int(),
    cut: z.number().int(),
    wave: z.number().int(),
    waveEnd: z.number().int(),
  }),
});

export type DualUseForkCutProps = z.infer<typeof schema>;

export const defaultProps: DualUseForkCutProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#D86D4B',
  shadow: 'rgba(0, 0, 0, 0.28)',
  // Lifted a touch off the 0.10 unknown level: this is a dead state the viewer
  // has to still be able to read on the held final frame.
  dimOpacity: 0.16,
  peopleOpacity: 0.82,
  linkOpacity: 0.62,
  strokeWidth: 13,
  nodeRadius: 44,
  mergedRadius: 62,
  peopleCount: 7,
  beats: {
    fork: 16,
    nodes: 41,
    clampIn: 77,
    clampGrip: 117,
    markHarm: 166,
    markGood: 198,
    merge: 251,
    mergeEnd: 278,
    people: 280,
    descend: 294,
    descendEnd: 320,
    cut: 328,
    wave: 336,
    waveEnd: 370,
  },
});

const DualUseForkCut: React.FC<DualUseForkCutProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  peopleOpacity,
  linkOpacity,
  strokeWidth,
  nodeRadius,
  mergedRadius,
  peopleCount,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // The claim being illustrated: the split was never there. One number drives
  // the node positions, the arm curvature and the clamp's target, so they
  // cannot disagree about where the fork is.
  const merge = ramp(frame, [beats.merge, beats.mergeEnd], [0, 1], ease.inOut);
  const nxRight = CX + NODE_DX * (1 - merge);
  const nxLeft = CX - NODE_DX * (1 - merge);
  const nodeR = nodeRadius + (mergedRadius - nodeRadius) * merge;
  const markDx = 26 * merge;
  const markScale = 1 - 0.28 * merge;

  // Starts with length rather than at zero: frame 0 is a cut point, and an
  // empty first frame reads as a missing overlay.
  const trunkTop = ramp(frame, [0, beats.fork], [TRUNK_BOTTOM - 64, FORK_Y]);
  const armLeft = ramp(frame, [beats.fork, beats.fork + 22], [0, 1]);
  const armRight = ramp(frame, [beats.fork + 3, beats.fork + 25], [0, 1]);
  const nodeLeft = ramp(frame, [beats.nodes, beats.nodes + 12], [0, 1], ease.pop);
  const nodeRight = ramp(frame, [beats.nodes + 4, beats.nodes + 16], [0, 1], ease.pop);
  const markHarm = ramp(frame, [beats.markHarm, beats.markHarm + 10], [0, 1]);
  const markGood = ramp(frame, [beats.markGood, beats.markGood + 10], [0, 1]);

  // Clamp rides the arm it is trying to sever, so when the arm slides to centre
  // the clamp is carried with it and ends up over the stem by construction.
  const clampX = 0.5 * (CX + nxRight);
  const clampY = ramp(frame, [beats.descend, beats.descendEnd], [CLAMP_Y, CUT_Y], ease.inOut);
  const gap =
    ramp(
      frame,
      [beats.clampIn, beats.clampIn + 16, beats.clampGrip, beats.clampGrip + 8],
      [170, 110, 110, 58],
      ease.inOut,
    ) -
    ramp(frame, [beats.descendEnd, beats.cut], [0, 45], ease.inOut) +
    ramp(frame, [beats.cut + 1, beats.cut + 11], [0, 31]);
  const clampIn = ramp(frame, [beats.clampIn, beats.clampIn + 12], [0, 1]);
  const clampOut = ramp(frame, [beats.cut + 2, beats.cut + 16], [0, 1]);

  const cutP = ramp(frame, [beats.cut, beats.cut + 7], [0, 1]);
  const retractUp = 30 * cutP;
  const retractDown = 18 * cutP;
  const deadIn = ramp(frame, [beats.cut, beats.cut + 6], [0, 1]);

  // The two uses arriving at the same point is the turn the whole scene rests
  // on, so it gets its own punctuation.
  const land = ramp(
    frame,
    [beats.mergeEnd - 2, beats.mergeEnd + 8, beats.mergeEnd + 24],
    [0, 1, 0],
  );

  // Loss travels: it starts at the cut and climbs the structure, so the
  // beneficial node goes out last and visibly because of the cut.
  const waveY = ramp(frame, [beats.wave, beats.waveEnd], [CUT_Y, NODE_Y - 96], ease.inOut);

  const upperTop = trunkTop;
  const upperBottom = CUT_Y - retractUp;
  const lowerTop = Math.max(trunkTop, CUT_Y + retractDown);

  const stubFade = ramp(frame, [beats.cut + 2, beats.cut + 18], [0, 1]);
  const stubColor = interpolateColors(stubFade, [0, 1], [accent, ink]);

  const mid = (peopleCount - 1) / 2;
  const people = Array.from({length: peopleCount}, (_, i) => {
    const x = CX + (i - mid) * PEOPLE_GAP;
    const d = Math.abs(i - mid);
    const enter = ramp(frame, [beats.people + d * 4, beats.people + d * 4 + 12], [0, 1]);
    const lose = ramp(frame, [beats.cut + 2 + d * 3, beats.cut + 18 + d * 3], [0, 1]);
    return {x, enter, lose};
  });

  const jaw = (dir: number) => {
    const tip = clampX + dir * gap;
    return `M${tip} ${clampY} L${tip + dir * JAW_H} ${clampY - JAW_W / 2} L${
      tip + dir * JAW_H
    } ${clampY + JAW_W / 2} Z`;
  };

  const upper = (color: string, ringed: boolean) => (
    <>
      {upperTop < upperBottom ? (
        <line
          x1={CX}
          y1={upperTop}
          x2={CX}
          y2={upperBottom}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={armPath(nxLeft)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - armLeft}
      />
      <path
        d={armPath(nxRight)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - armRight}
      />
      <circle
        cx={nxLeft}
        cy={NODE_Y}
        r={nodeR * nodeLeft}
        fill={ringed ? 'none' : color}
        stroke={ringed ? color : 'none'}
        strokeWidth={8}
      />
      <circle
        cx={nxRight}
        cy={NODE_Y}
        r={nodeR * nodeRight}
        fill={ringed ? 'none' : color}
        stroke={ringed ? color : 'none'}
        strokeWidth={8}
      />
    </>
  );

  // Ink glyphs, not colour: the judgement about a use is the human's, and it
  // sits on top of a capability that is identical either way.
  const marks = (color: string) => (
    <>
      <g transform={`translate(${nxLeft - markDx} ${NODE_Y}) scale(${markScale})`}>
        <path
          d="M-18 0 L-5 14 L20 -16"
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - markGood}
        />
      </g>
      <g transform={`translate(${nxRight + markDx} ${NODE_Y}) scale(${markScale})`}>
        <path
          d="M-17 -17 L17 17"
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - markHarm}
        />
        <path
          d="M17 -17 L-17 17"
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ramp(frame, [beats.markHarm + 5, beats.markHarm + 15], [0, 1])}
        />
      </g>
    </>
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <mask id="dualUseLive">
            <rect x={0} y={0} width={width} height={waveY} fill="#FFFFFF" />
          </mask>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Who the stem is standing on. Held back until the argument reaches
              them, so their arrival is the reveal it is in the line. */}
          {people.map((p, i) => (
            <g key={`p${i}`} opacity={p.enter} transform={`translate(0 ${(1 - p.enter) * 22})`}>
              <line
                x1={p.x}
                y1={HEAD_Y - HEAD_R - 13}
                x2={CX}
                y2={TRUNK_BOTTOM}
                stroke={interpolateColors(p.lose, [0, 1], [accent, ink])}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={linkOpacity + (dimOpacity - linkOpacity) * p.lose}
              />
              <circle cx={p.x} cy={HEAD_Y} r={HEAD_R} fill={ink} opacity={peopleOpacity} />
              <path
                d={`M${p.x - SHOULDER_R} ${HEAD_Y + 54} a ${SHOULDER_R} ${SHOULDER_R} 0 0 1 ${SHOULDER_R * 2} 0`}
                fill="none"
                stroke={ink}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={peopleOpacity}
              />
            </g>
          ))}

          {/* Severed stub. */}
          <line
            x1={CX}
            y1={lowerTop}
            x2={CX}
            y2={TRUNK_BOTTOM}
            stroke={stubColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={1 + (dimOpacity - 1) * stubFade}
          />

          {/* Where the split was believed to be. It fades up exactly as the
              two arms leave it, so what is left standing is the belief. */}
          <g opacity={dimOpacity * merge}>
            <path
              d={armPath(CX - NODE_DX)}
              fill="none"
              stroke={ink}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={armPath(CX + NODE_DX)}
              fill="none"
              stroke={ink}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <circle
              cx={CX - NODE_DX}
              cy={NODE_Y}
              r={nodeRadius}
              fill="none"
              stroke={ink}
              strokeWidth={8}
            />
            <circle
              cx={CX + NODE_DX}
              cy={NODE_Y}
              r={nodeRadius}
              fill="none"
              stroke={ink}
              strokeWidth={8}
            />
          </g>

          {/* The structure once the capability has gone out of it. */}
          <g opacity={dimOpacity * deadIn}>
            {upper(ink, true)}
            {marks(ink)}
          </g>

          {/* The live structure, extinguished from the cut upward. */}
          <g mask="url(#dualUseLive)">
            {upper(accent, false)}
            {marks(ink)}
            <circle
              cx={CX}
              cy={NODE_Y}
              r={nodeR + 46 * land}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={0.55 * land}
            />
          </g>

          <g opacity={clampIn * (1 - clampOut) * 0.88}>
            <path d={jaw(-1)} fill={ink} strokeLinejoin="round" stroke={ink} strokeWidth={6} />
            <path d={jaw(1)} fill={ink} strokeLinejoin="round" stroke={ink} strokeWidth={6} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default DualUseForkCut;
