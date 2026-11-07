import {Composition} from 'remotion';
import HydraHands, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/HydraHands';

// Private render entry for HydraHands (caro-firing-moses; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 144 frames.
export const RemotionRoot = () => (
  <Composition
    id="HydraHands"
    component={HydraHands}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
