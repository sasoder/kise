import {Composition} from 'remotion';
import IncrediblyComplicated, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-uranium/IncrediblyComplicated';

// Private render entry for IncrediblyComplicated (scott-nolan-uranium; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 77 frames.
export const RemotionRoot = () => (
  <Composition
    id="IncrediblyComplicated"
    component={IncrediblyComplicated}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
