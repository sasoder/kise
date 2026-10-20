import {Composition} from 'remotion';
import DiseaseDidTheWorkV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/DiseaseDidTheWorkV2';

// Private render entry for DiseaseDidTheWorkV2 (kyle-first-farmers; Dwarkesh map style): germs off both turned-away orange men bring the cream forager and the Aztec down in two rows, then the orange fields roll over the ground.
// Opaque 1080x1920, 29.97 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="DiseaseDidTheWorkV2"
    component={DiseaseDidTheWorkV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
