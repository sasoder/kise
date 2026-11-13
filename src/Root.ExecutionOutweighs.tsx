import {Composition} from 'remotion';
import ExecutionOutweighs, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-any-idea/ExecutionOutweighs';

// Private render entry for ExecutionOutweighs (nik-any-idea; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 74 frames.
export const RemotionRoot = () => (
  <Composition
    id="ExecutionOutweighs"
    component={ExecutionOutweighs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
