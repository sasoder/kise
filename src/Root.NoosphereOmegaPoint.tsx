import {Composition} from 'remotion';
import NoosphereOmegaPoint, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/NoosphereOmegaPoint';

// Private render entry for NoosphereOmegaPoint (wip-biblical; Works in Progress style): cut 43's wired globe grows a red skin whose lines draw into the omega point.
// Opaque 1080x1920, 24 fps, 139 frames.
export const RemotionRoot = () => (
  <Composition
    id="NoosphereOmegaPoint"
    component={NoosphereOmegaPoint}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
