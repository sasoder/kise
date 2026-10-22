import {Composition} from 'remotion';
import {GreekFolkCrowd, GreekFolkHeads, GreekFolkMotion, GreekFolkSheet, GreekFolkStrip, GreekFolkTurnaround, HEADS_H, HEADS_W, SHEET_H, SHEET_W, TURN_H, TURN_W, stripSize, type StripName} from '../generated/components/kyle-greek-math/greekFolkProbe';

// Probe sheets of the kyle-greek-math Greek cast (greekFolk.tsx): the style sheet, Euclid's head turn, every pose's
// strip (every 2nd frame at ~520 px and ~170 px), one performance animated (frame-differences), the 300-figure crowd.
const STRIPS: StripName[] = ['turn', 'headTurn', 'lookUp', 'offerUp', 'holdTablet', 'write', 'writeSeated', 'crouchDraw', 'stickTo', 'gesture', 'walk', 'walkWoman'];
export const RemotionRoot = () => (
  <>
    <Composition id="GreekFolkSheet" component={GreekFolkSheet} durationInFrames={1} fps={30000 / 1001} width={SHEET_W} height={SHEET_H} />
    <Composition id="GreekFolkTurnaround" component={GreekFolkTurnaround} durationInFrames={1} fps={30000 / 1001} width={TURN_W} height={TURN_H} />
    <Composition id="GreekFolkHeads" component={GreekFolkHeads} durationInFrames={1} fps={30000 / 1001} width={HEADS_W} height={HEADS_H} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`GreekFolkStrip-${s}`} component={GreekFolkStrip} durationInFrames={1} fps={30000 / 1001} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
    {STRIPS.map((s) => (
      <Composition key={`m${s}`} id={`GreekFolkMotion-${s}`} component={GreekFolkMotion} durationInFrames={60} fps={30000 / 1001} width={760} height={720} defaultProps={{strip: s}} />
    ))}
    <Composition id="GreekFolkCrowd" component={GreekFolkCrowd} durationInFrames={90} fps={30000 / 1001} width={1080} height={1920} />
  </>
);
