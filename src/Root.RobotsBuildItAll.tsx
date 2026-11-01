import {Composition} from 'remotion';
import RobotsBuildItAll, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-self-replicating/RobotsBuildItAll';

// Private render entry for RobotsBuildItAll (sam-self-replicating; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="RobotsBuildItAll"
    component={RobotsBuildItAll}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
