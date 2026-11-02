import {Composition} from 'remotion';
import TwentyMinuteWalk, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/TwentyMinuteWalk';

// Private render entry for TwentyMinuteWalk (wip-victorians; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 186 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwentyMinuteWalk"
    component={TwentyMinuteWalk}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
