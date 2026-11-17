import {Composition} from 'remotion';
import OrbitOnEightyMillionPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer-vertical/OrbitOnEightyMillionPortrait';

// Private render entry for OrbitOnEightyMillionPortrait (shruti-trailer-vertical; Core memory podcast style): the rocket launches from a small cash pile; five taller comparator stacks rise along the Earth.
// Opaque 1080x1920, 23.976 fps, 191 frames.
export const RemotionRoot = () => (
  <Composition
    id="OrbitOnEightyMillionPortrait"
    component={OrbitOnEightyMillionPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
