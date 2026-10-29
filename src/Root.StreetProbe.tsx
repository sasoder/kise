import {Composition} from 'remotion';
import StreetProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-old-buildings/streetProbe';

// Private render entry for StreetProbe (robert-old-buildings): still probes of the shared streetWorld (not a cut).
// Opaque 1080x1920, one frame; props pick the camera, lamp, glow and sweep.
export const RemotionRoot = () => (
  <Composition
    id="StreetProbe"
    component={StreetProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
