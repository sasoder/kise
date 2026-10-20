import {Composition} from 'remotion';
import SameRelationship, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/SameRelationship';

// Private render entry for SameRelationship (kyle-first-farmers; Dwarkesh map style): the farmer and the forager, then
// the Spaniard and the Aztec staged the same way along one ground line, ending on both pairs side by side.
// Opaque 1080x1920, 29.97 fps, 181 frames.
export const RemotionRoot = () => (
  <Composition
    id="SameRelationship"
    component={SameRelationship}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
