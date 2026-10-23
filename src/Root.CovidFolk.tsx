import {Composition} from 'remotion';
import {CovidFolkCrowd, CovidFolkGlow, CovidFolkGlow3, CovidFolkRow4, G3_H, G3_W, GLOW_H, GLOW_W, CovidFolkHeads, HEADS_H, HEADS_W, CovidFolkMotion, CovidFolkPhone, CovidFolkStrip, CovidFolkStyle, STRIPS, STYLE_H, STYLE_W, motionFrames, stripSize} from '../generated/components/kyle-covid/covidFolkProbe';

// Probe sheets of the kyle-covid modern cast (covidFolk.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="CovidFolkStyle" component={CovidFolkStyle} durationInFrames={1} fps={30} width={STYLE_W} height={STYLE_H} />
    <Composition id="CovidFolkHeads" component={CovidFolkHeads} durationInFrames={1} fps={30} width={HEADS_W} height={HEADS_H} defaultProps={{sick: 0}} />
    <Composition id="CovidFolkGlow" component={CovidFolkGlow} durationInFrames={1} fps={30} width={GLOW_W} height={GLOW_H} />
    <Composition id="CovidFolkGlow3" component={CovidFolkGlow3} durationInFrames={1} fps={30} width={G3_W} height={G3_H} />
    <Composition id="CovidFolkRow4" component={CovidFolkRow4} durationInFrames={1} fps={30} width={1080} height={1240} />
    <Composition id="CovidFolkPhone" component={CovidFolkPhone} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CovidFolkCrowd" component={CovidFolkCrowd} durationInFrames={1} fps={30} width={1080} height={1920} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`CovidFolkStrip-${s}`} component={CovidFolkStrip} durationInFrames={1} fps={30} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
    {STRIPS.map((s) => (
      <Composition key={`m${s}`} id={`CovidFolkMotion-${s}`} component={CovidFolkMotion} durationInFrames={motionFrames(s)} fps={30} width={760} height={720} defaultProps={{strip: s}} />
    ))}
  </>
);
