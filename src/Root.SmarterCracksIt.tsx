import {Composition} from 'remotion';
import SmarterCracksIt, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/SmarterCracksIt';

// Private render entry for SmarterCracksIt (rsi-derpy-interns; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 172 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmarterCracksIt"
    component={SmarterCracksIt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
