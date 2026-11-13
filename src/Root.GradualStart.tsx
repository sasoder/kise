import {Composition} from 'remotion';
import GradualStart, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/GradualStart';

// Private render entry for GradualStart (nik-trend-friend; Cheeky Pint style (stout)): a slow cream product tile creeps along the floor of the bet chart under the soaring pack.
// Opaque 1080x1920, 23.976 fps, 50 frames.
export const RemotionRoot = () => (
  <Composition
    id="GradualStart"
    component={GradualStart}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
