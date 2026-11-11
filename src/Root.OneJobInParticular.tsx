import {Composition} from 'remotion';
import OneJobInParticular, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/OneJobInParticular';

// Private render entry for OneJobInParticular (rsi-years-in-days; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 246 frames.
export const RemotionRoot = () => (
  <Composition
    id="OneJobInParticular"
    component={OneJobInParticular}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
