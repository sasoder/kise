import {Composition} from 'remotion';
import FrozenToTheAI, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/FrozenToTheAI';

// Private render entry for FrozenToTheAI (rsi-since-writing; Dwarkesh 3D style): you frozen mid-pour, the coffee hanging in the air, while the Genius walks past and works through sheets at his desk; "1,000×".
// Opaque 1080x1920, 23.976 fps, 131 frames.
export const RemotionRoot = () => (
  <Composition
    id="FrozenToTheAI"
    component={FrozenToTheAI}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
