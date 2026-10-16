import {Composition} from 'remotion';
import StillAroundLaterV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/StillAroundLaterV2';

// Private render entry for StillAroundLaterV2 (sarah-death-ground; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 235 frames.
export const RemotionRoot = () => (
  <Composition
    id="StillAroundLaterV2"
    component={StillAroundLaterV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
