import {Composition} from 'remotion';
import {RomeFolkCrowd, RomeFolkMotion, RomeFolkPhone, RomeFolkStrip, RomeFolkStyle, STYLE_H, STYLE_W, stripSize, type StripName} from '../generated/components/kyle-rome-slavery/romeFolkProbe';

// Probe sheets of the kyle-rome-slavery drawn Roman folk (romeFolk.tsx, V3).
const STRIPS: StripName[] = ['walk', 'push', 'tread', 'carry', 'grind', 'strike', 'potter', 'sit', 'recline', 'haul', 'stoop', 'raiseRod', 'turn'];
export const RemotionRoot = () => (
  <>
    <Composition id="RomeFolkStyle" component={RomeFolkStyle} durationInFrames={1} fps={30} width={STYLE_W} height={STYLE_H} />
    <Composition id="RomeFolkPhone" component={RomeFolkPhone} durationInFrames={1} fps={30} width={1080} height={1920} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`RomeFolkStrip-${s}`} component={RomeFolkStrip} durationInFrames={1} fps={30} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
    <Composition id="RomeFolkCrowd" component={RomeFolkCrowd} durationInFrames={12} fps={30} width={1080} height={1920} defaultProps={{shared: false}} />
    <Composition id="RomeFolkMotion" component={RomeFolkMotion} durationInFrames={40} fps={30} width={760} height={720} defaultProps={{strip: 'walk' as StripName}} />
  </>
);
