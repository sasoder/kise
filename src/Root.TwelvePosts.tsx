import {Composition} from 'remotion';
import TwelvePosts, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/TwelvePosts';

// Private render entry for TwelvePosts (caro-firing-moses; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 159 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwelvePosts"
    component={TwelvePosts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
