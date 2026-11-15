import {Composition} from 'remotion';
import TwentyWatts, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/TwentyWatts';

// Private render entry for TwentyWatts (rsi-stupidest-species; Dwarkesh 3D style): the brain's thin 20 W cord beside the stomach's and the immune cell's thick lines from one hub.
// Opaque 1080x1920, 23.976 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwentyWatts"
    component={TwentyWatts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
