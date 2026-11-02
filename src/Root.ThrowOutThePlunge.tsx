import {Composition} from 'remotion';
import ThrowOutThePlunge, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/ThrowOutThePlunge';

// Private render entry for ThrowOutThePlunge (wip-victorians; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 97 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThrowOutThePlunge"
    component={ThrowOutThePlunge}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
