import {Composition} from 'remotion';
import AllAboutEnergyV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/AllAboutEnergyV2';

// Private render entry for AllAboutEnergyV2 (kyle-first-farmers; Dwarkesh map style; cold-review V2 of AllAboutEnergy):
// the heap starts at zero, the grain is thrown in arcs, a second carrier takes over, the heap tops out on "energy";
// its last frame is the delivered f240. Opaque 1080x1920, 29.97 fps, 241 frames.
export const RemotionRoot = () => (
  <Composition
    id="AllAboutEnergyV2"
    component={AllAboutEnergyV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
