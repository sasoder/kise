import {Composition} from 'remotion';
import TenThousandAgents, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/TenThousandAgents';

// Private render entry for TenThousandAgents (rsi-since-writing; Dwarkesh 3D style): one big glowing slab of work cracks into 100 pads that fly out over a hall of 100 x 100 desks and each deal their 100 sheets, one per desk; each robot switches on as its own sheet lands, the camera craning up over the hall under a hung "10,000" banner.
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
