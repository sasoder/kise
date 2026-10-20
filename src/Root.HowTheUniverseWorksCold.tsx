import {Composition} from 'remotion';
import HowTheUniverseWorksCold, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/HowTheUniverseWorksCold';

// Private render entry for HowTheUniverseWorksCold (kyle-london; Dwarkesh map style): an engraved 18th-century orrery becomes Watt's sun-and-planet engine.
// Opaque 1080x1920, 29.97 fps, 204 frames.
export const RemotionRoot = () => (
  <Composition
    id="HowTheUniverseWorksCold"
    component={HowTheUniverseWorksCold}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
