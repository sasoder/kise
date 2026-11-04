import {Composition} from 'remotion';
import LBJNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-johnson-ranch/LBJNameTag';

// Private render entry for LBJNameTag (robert-johnson-ranch; Name tag): "Lyndon B. Johnson / 36th President of the United States" over his close-up (B10, 2.419-3.712 s).
// Transparent overlay 1080x1920, 23.976 fps, 31 frames.
export const RemotionRoot = () => (
  <Composition
    id="LBJNameTag"
    component={LBJNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
