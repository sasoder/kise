import {Composition} from 'remotion';
import ReplicateOrExceed, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/ReplicateOrExceed';

// Private render entry for ReplicateOrExceed (rsi-years-in-days; Dwarkesh style): two marble busts (Napoleon, Rockefeller) with brains; the orange intern copies them and its copy outgrows them.
// Opaque 1080x1920, 23.976 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="ReplicateOrExceed"
    component={ReplicateOrExceed}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
