import {Composition} from 'remotion';
import SpendHalf, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/SpendHalf';

// Private render entry for SpendHalf (wip-entertainment; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 164 frames.
export const RemotionRoot = () => (
  <Composition
    id="SpendHalf"
    component={SpendHalf}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
