import {Composition} from 'remotion';
import CompeteGlobally, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-uranium/CompeteGlobally';

// Private render entry for CompeteGlobally (scott-nolan-uranium; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 168 frames.
export const RemotionRoot = () => (
  <Composition
    id="CompeteGlobally"
    component={CompeteGlobally}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
