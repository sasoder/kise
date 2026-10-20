import {Composition} from 'remotion';
import DiseaseDidTheWork, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/DiseaseDidTheWork';

// Private render entry for DiseaseDidTheWork (kyle-first-farmers; Dwarkesh map style): germs off the orange farmer and Spaniard bring the cream forager and Aztec down together.
// Opaque 1080x1920, 29.97 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="DiseaseDidTheWork"
    component={DiseaseDidTheWork}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
