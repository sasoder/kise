import {Composition} from 'remotion';
import ScalableCostCompetitive, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-uranium/ScalableCostCompetitive';

// Private render entry for ScalableCostCompetitive (scott-nolan-uranium; Cheeky Pint style (stout)): one machine beside a tall stack of cash; a hall rises to the horizon while the stack is dealt away.
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="ScalableCostCompetitive"
    component={ScalableCostCompetitive}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
