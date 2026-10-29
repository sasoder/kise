import {Composition} from 'remotion';
import HornsOfTheDilemma, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/HornsOfTheDilemma';

// Private render entry for HornsOfTheDilemma (sarah-insurgency; Dwarkesh 3D map look): Japan masses its garrisons at the front and the rear fills with guerrillas, spreads them back and the front is freed. RENDER WITH --gl=angle.
// Opaque 1080x1920, 24 fps, 389 frames.
export const RemotionRoot = () => (
  <Composition
    id="HornsOfTheDilemma"
    component={HornsOfTheDilemma}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
