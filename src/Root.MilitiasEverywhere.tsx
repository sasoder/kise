import {Composition} from 'remotion';
import MilitiasEverywhere, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/MilitiasEverywhere';

// Private render entry for MilitiasEverywhere (sarah-insurgency; Dwarkesh 3D style): four cream British blocks slide into one at New York facing the orange Continental block, then orange militia pawns rise all over the thirteen states under one pull-back.
// Opaque 1080x1920, 24 fps, 126 frames.
export const RemotionRoot = () => (
  <Composition
    id="MilitiasEverywhere"
    component={MilitiasEverywhere}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
