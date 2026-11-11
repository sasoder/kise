import {Composition} from 'remotion';
import TraitsOverlap, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-taylor-swift/TraitsOverlap';

// Private render entry for TraitsOverlap (wip-taylor-swift; Works in Progress style): press prints of Taylor Swift ringed in indigo, an "Autism spectrum" ring overlaps them, the lens printed red.
// Opaque 1080x1920, 24 fps, 124 frames.
export const RemotionRoot = () => (
  <Composition
    id="TraitsOverlap"
    component={TraitsOverlap}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
