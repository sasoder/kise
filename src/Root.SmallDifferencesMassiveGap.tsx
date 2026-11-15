import {Composition} from 'remotion';
import SmallDifferencesMassiveGap, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/SmallDifferencesMassiveGap';

// Private render entry for SmallDifferencesMassiveGap (rsi-stupidest-species; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 159 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmallDifferencesMassiveGap"
    component={SmallDifferencesMassiveGap}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
