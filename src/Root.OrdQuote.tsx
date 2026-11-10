import {Composition} from 'remotion';
import OrdQuote, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/OrdQuote';

// Private render entry for OrdQuote (rsi-fall-of-gods; Dwarkesh style): Toby Ord's sentence types on a paper card pinned on the clip's quote wall.
// Opaque 1080x1920, 23.976 fps, 287 frames.
export const RemotionRoot = () => (
  <Composition
    id="OrdQuote"
    component={OrdQuote}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
