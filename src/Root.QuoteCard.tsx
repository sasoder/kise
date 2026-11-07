import {Composition} from 'remotion';
import QuoteCard, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/QuoteCard';

// Private render entry for QuoteCard (caro-firing-moses; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 127 frames.
export const RemotionRoot = () => (
  <Composition
    id="QuoteCard"
    component={QuoteCard}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
