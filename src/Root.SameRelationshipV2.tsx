import {Composition} from 'remotion';
import SameRelationshipV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/SameRelationshipV2';

// Private render entry for SameRelationshipV2 (kyle-first-farmers; Dwarkesh map style; cold-review V2): the farmer's
// takeover of the forager's ground, then the Spaniard's of the Aztec's, stacked in two aligned rows.
// Opaque 1080x1920, 29.97 fps, 181 frames.
export const RemotionRoot = () => (
  <Composition
    id="SameRelationshipV2"
    component={SameRelationshipV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
