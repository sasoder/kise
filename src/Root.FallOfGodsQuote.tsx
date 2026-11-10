import {Composition} from 'remotion';
import FallOfGodsQuote, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/FallOfGodsQuote';

// Private render entry for FallOfGodsQuote (rsi-fall-of-gods; Dwarkesh style): Steinbeck's East of Eden line typed on with the voice on one white paper pinned to the grid wall.
// Opaque 1080x1920, 23.976 fps, 134 frames.
export const RemotionRoot = () => (
  <Composition
    id="FallOfGodsQuote"
    component={FallOfGodsQuote}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
