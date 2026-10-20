import {Composition} from 'remotion';
import AllAboutEnergyV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/AllAboutEnergyV3';

// Private render entry for AllAboutEnergyV3 (kyle-first-farmers; Dwarkesh map style; V3 of AllAboutEnergy):
// AllAboutEnergyV2 without the wind crest through the wheat on "It's all about energy" (f201-f236); the wheat keeps
// its ordinary sway to the end. Its last frame is the delivered f240. Opaque 1080x1920, 29.97 fps, 241 frames.
export const RemotionRoot = () => (
  <Composition
    id="AllAboutEnergyV3"
    component={AllAboutEnergyV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
