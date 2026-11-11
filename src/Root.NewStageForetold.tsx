import {Composition} from 'remotion';
import NewStageForetold, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/NewStageForetold';

// Private render entry for NewStageForetold (wip-biblical; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 138 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewStageForetold"
    component={NewStageForetold}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
