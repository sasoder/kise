import {Composition} from 'remotion';
import HardlyAnybodyDied, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/HardlyAnybodyDied';

// Private render entry for HardlyAnybodyDied (sarah-gulf-war, cut 6; Dwarkesh 3D style): US military deaths by war as a flat bar chart in the air, the Gulf War an orange 383 sliver.
// Opaque 1080x1920, 24 fps, 42 frames.
export const RemotionRoot = () => (
  <Composition
    id="HardlyAnybodyDied"
    component={HardlyAnybodyDied}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
