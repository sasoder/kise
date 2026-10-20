import {Composition} from 'remotion';
import OutcompeteEuropeV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/OutcompeteEuropeV2';

// Private render entry for OutcompeteEuropeV2 (kyle-first-farmers; Dwarkesh map style; cold-review pass): the
// farmers' orange front grows from one Anatolian core across Europe, the cream foragers backing off and absorbed.
// Opaque 1080x1920, 29.97 fps, 166 frames.
export const RemotionRoot = () => (
  <Composition
    id="OutcompeteEuropeV2"
    component={OutcompeteEuropeV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
