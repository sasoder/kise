import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {
  CaptorHand,
  Emperor,
  Noble,
  POSE_HANG,
  POSE_OPEN,
  POSE_SLUMP,
  POSE_UPRIGHT,
  PuppetString,
  Tableau,
  stateCam,
  StringsPage,
  type StateName,
} from '../generated/components/stringsShared';

// Private test rig for stringsShared (builder A): the figure sheets and the
// three named states as stills. Not a deliverable.
const Sheet: React.FC<{children: React.ReactNode; w: number; h: number}> = ({children, w, h}) => (
  <AbsoluteFill style={{backgroundColor: '#3F3428'}}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {children}
    </svg>
  </AbsoluteFill>
);
const POSES = [POSE_OPEN, POSE_UPRIGHT, POSE_SLUMP, POSE_HANG];
const SheetEmperor: React.FC = () => (
  <Sheet w={2000} h={1500}>
    {(['aztec', 'inca'] as const).map((v, row) =>
      POSES.map((p, i) => (
        <g key={`${v}${i}`} transform={`translate(${260 + i * 490} ${700 + row * 730}) scale(1.9)`}>
          <Emperor pose={p} variant={v} at={[0, 0]} uid={`s${v}${i}`} />
        </g>
      )),
    )}
  </Sheet>
);
const SheetMisc: React.FC = () => (
  <Sheet w={2000} h={1500}>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <g key={i} transform={`translate(${150 + i * 250} 420) scale(2.2)`}>
        <Noble i={i} at={[0, 0]} bow={0} uid={`a${i}`} />
      </g>
    ))}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <g key={i} transform={`translate(${150 + i * 250} 800) scale(2.2)`}>
        <Noble i={i} at={[0, 0]} bow={[1, 1, 0.66, 0.35, 0.35, 1, 1][i]} tone={i < 2 ? 0.55 : 1} uid={`b${i}`} />
      </g>
    ))}
    <g transform="translate(330 1250) scale(1.3)">
      <CaptorHand bar={0} at={[0, 0]} uid="h0" />
    </g>
    <g transform="translate(900 1250) scale(1.3)">
      <CaptorHand bar={1} tilt={-9} at={[0, 0]} uid="h1" />
    </g>
    <PuppetString from={[1300, 900]} to={[1900, 960]} slack={1} base={0.28} />
    <PuppetString from={[1300, 940]} to={[1900, 1000]} slack={1} base={1} />
    <PuppetString from={[1300, 1040]} to={[1900, 1100]} slack={0} live={[0, 1]} highlight={0.5} />
    <PuppetString from={[1300, 1100]} to={[1900, 1160]} slack={[0, 1]} live={[0, 0.45]} knots={[0.2, 0.7]} />
    <PuppetString from={[1400, 1180]} to={[1380, 1480]} slack={1} base={0.28} />
    <PuppetString from={[1500, 1180]} to={[1560, 1480]} slack={1} base={1} drawn={[0.3, 1]} />
    <PuppetString from={[1650, 1180]} to={[1800, 1480]} slack={0.4} live={[0, 0.6]} />
  </Sheet>
);
const State: React.FC<{state: string}> = ({state}) => {
  const cam = stateCam(state as StateName);
  return (
    <StringsPage cam={cam}>
      <Tableau state={state as StateName} cam={cam} frame={20} />
    </StringsPage>
  );
};

export const RemotionRoot = () => (
  <>
    <Composition id="SheetEmperor" component={SheetEmperor} durationInFrames={1} fps={24} width={2000} height={1500} />
    <Composition id="SheetMisc" component={SheetMisc} durationInFrames={1} fps={24} width={2000} height={1500} />
    {(['E1', 'E2', 'E3'] as const).map((s) => (
      <Composition key={s} id={`State${s}`} component={State} defaultProps={{state: s}} durationInFrames={1} fps={24} width={1080} height={1920} />
    ))}
  </>
);
