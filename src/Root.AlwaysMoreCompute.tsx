import {Composition} from 'remotion';
import AlwaysMoreCompute, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-self-replicating/AlwaysMoreCompute';

// Private render entry for AlwaysMoreCompute (sam-self-replicating; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 112 frames.
export const RemotionRoot = () => (
  <Composition
    id="AlwaysMoreCompute"
    component={AlwaysMoreCompute}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
