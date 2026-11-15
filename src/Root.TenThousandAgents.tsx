import {Composition} from 'remotion';
import TenThousandAgents, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/TenThousandAgents';

// Private render entry for TenThousandAgents (rsi-since-writing; Dwarkesh 3D style): one Genius splits into a 100 x 100 field of 10,000 agents while the camera cranes up over it.
// Opaque 1080x1920, 23.976 fps, 88 frames.
export const RemotionRoot = () => (
  <Composition
    id="TenThousandAgents"
    component={TenThousandAgents}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
