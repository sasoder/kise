import {Composition} from 'remotion';
import RadarPhoneProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-radar-map/RadarPhoneProbe';

// Private render entry for the radarPhone probe stills (scott-radar-map).
export const RemotionRoot = () => (
  <Composition id="RadarPhoneProbe" component={RadarPhoneProbe} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
