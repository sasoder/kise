import {Composition} from 'remotion';
import TenEarths, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/TenEarths';

// Private render entry for TenEarths (rsi-ten-earths; Dwarkesh 3D style): an orange tide of AIs fills China, then the Earth, then nine more orange Earths fan out into ten.
// Opaque 1080x1920, 23.976 fps, 268 frames.
export const RemotionRoot = () => (
  <Composition
    id="TenEarths"
    component={TenEarths}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
