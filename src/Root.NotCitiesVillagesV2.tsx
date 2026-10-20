import {Composition} from 'remotion';
import NotCitiesVillagesV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/NotCitiesVillagesV2';

// Private render entry for NotCitiesVillagesV2 (kyle-first-farmers; Dwarkesh map style): village between a ghost city and a forager camp.
// Opaque 1080x1920, 29.97 fps, 308 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotCitiesVillagesV2"
    component={NotCitiesVillagesV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
