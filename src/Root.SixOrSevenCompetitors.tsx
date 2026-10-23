import React from 'react';
import {AbsoluteFill, Composition, useCurrentFrame} from 'remotion';
import SixOrSevenCompetitors, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-superpower/SixOrSevenCompetitors';
import {TallPaper} from '../generated/components/kits/core-memory/deathCountShared';
import {
  ROCKET_W_PX,
  ROW_ORDER,
  ROW_RULE_X0,
  ROW_RULE_X1,
  ROW_RULE_Y,
  ROW_X,
  Rocket,
  RowRule,
  StarlinkSat,
  StarlinkTrain,
  type RocketKind,
} from '../generated/components/zach-superpower/superpowerRockets';

// Private render entry for SixOrSevenCompetitors (zach-superpower; Core memory podcast style): the Falcon 9, then
// seven Chinese rockets rising beside it as chain-echo copies (six solid, one hollow).
// Opaque 1080x1920, 23.976 fps, 86 frames.
// RocketsProbe (preview aid only, not delivered): f0 each glyph big, f1 the row solid, f2 the row hollow,
// f3 Starlink. Stills: bunx remotion still src/entry.SixOrSevenCompetitors.ts RocketsProbe <out> --frame=N
const PROBE_KINDS: RocketKind[] = ROW_ORDER;
const RocketsProbe: React.FC = () => {
  const f = useCurrentFrame();
  const W = 1080;
  let body: React.ReactNode = null;
  if (f === 0) {
    // each glyph alone, scale 1.6, two rows of four
    const s = 1.6;
    body = PROBE_KINDS.map((k, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 135 + col * 270;
      const y = 900 + row * 900;
      return (
        <g key={k}>
          <Rocket kind={k} x={x} y={y} scale={s} id={`p0-${k}`} />
          <RowRule x0={x - 120} x1={x + 120} y={y} />
        </g>
      );
    });
  } else if (f === 1 || f === 2) {
    body = (
      <g>
        {PROBE_KINDS.map((k) => (
          <Rocket key={k} kind={k} x={ROW_X[k]} y={ROW_RULE_Y} hollow={f === 2 && k !== 'falcon9'} id={`p${f}-${k}`} />
        ))}
        <RowRule x0={ROW_RULE_X0} x1={ROW_RULE_X1} y={ROW_RULE_Y} />
        {PROBE_KINDS.map((k) => (
          <rect key={`w${k}`} x={ROW_X[k] - ROCKET_W_PX[k] / 2} y={ROW_RULE_Y + 30} width={ROCKET_W_PX[k]} height={6} fill="#ff00ff" />
        ))}
      </g>
    );
  } else {
    body = (
      <g>
        <StarlinkSat x={300} y={500} scale={2} />
        <StarlinkSat x={300} y={800} angle={-20} scale={1.2} />
        <StarlinkTrain x0={80} y0={1100} count={8} spacing={150} heading={-8} bend={2} scale={0.6} />
        <Rocket kind="falcon9" x={W - 160} y={1800} scale={0.6} />
      </g>
    );
  }
  return (
    <AbsoluteFill>
      <TallPaper frame={0} cx={540} cy={960} k={1} />
      <svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {body}
      </svg>
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <>
    <Composition
      id="SixOrSevenCompetitors"
      component={SixOrSevenCompetitors}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="RocketsProbe" component={RocketsProbe} durationInFrames={4} fps={FPS} width={1080} height={1920} />
  </>
);
