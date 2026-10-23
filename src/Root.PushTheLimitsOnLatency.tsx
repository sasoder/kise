import {Composition} from 'remotion';
import PushTheLimitsOnLatency, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/PushTheLimitsOnLatency';

// Private render entry for PushTheLimitsOnLatency (kyle-covid; Dwarkesh 3D style): a hidden orange wave outruns the
// fence the health workers close round the three visibly sick. Opaque 1080x1920, 29.97 fps, 160 frames.
export const RemotionRoot = () => (
  <Composition
    id="PushTheLimitsOnLatency"
    component={PushTheLimitsOnLatency}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
