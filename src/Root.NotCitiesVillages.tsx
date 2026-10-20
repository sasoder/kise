import {Composition} from 'remotion';
import NotCitiesVillages, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/NotCitiesVillages';

// Private render entry for NotCitiesVillages (kyle-first-farmers; Dwarkesh map style): village between a ghost city and a forager camp.
// Opaque 1080x1920, 29.97 fps, 308 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotCitiesVillages"
    component={NotCitiesVillages}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
