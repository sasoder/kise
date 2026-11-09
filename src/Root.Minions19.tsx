import {Composition} from 'remotion';
import Minions19, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/Minions19';

// Private render entry for Minions19 (wip-entertainment; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 22 frames.
export const RemotionRoot = () => (
  <Composition
    id="Minions19"
    component={Minions19}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
