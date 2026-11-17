import {Composition} from 'remotion';
import OrbitOnEightyMillion, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer/OrbitOnEightyMillion';

// Private render entry for OrbitOnEightyMillion (shruti-trailer; Core memory podcast style): Vikram-1 lifts off a small stack of $100 bricks into orbit; a tower of the same bricks, 12.5x taller, rises to the orbit.
// Opaque 1920x1080, 23.976 fps, 191 frames.
export const RemotionRoot = () => (
  <Composition
    id="OrbitOnEightyMillion"
    component={OrbitOnEightyMillion}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
