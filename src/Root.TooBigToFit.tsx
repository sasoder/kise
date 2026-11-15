import {Composition} from 'remotion';
import TooBigToFit, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/TooBigToFit';

// Private render entry for TooBigToFit (rsi-stupidest-species; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 78 frames.
export const RemotionRoot = () => (
  <Composition
    id="TooBigToFit"
    component={TooBigToFit}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
