import {Composition} from 'remotion';
import BredInTheVillageV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/BredInTheVillageV2';

// Private render entry for BredInTheVillageV2 (kyle-first-farmers; Dwarkesh map style): the cold-review V2 of BredInTheVillage, germs bred by the crowd and its animals, landing on and multiplying across the farmers under one pull-back.
// Opaque 1080x1920, 29.97 fps, 168 frames.
export const RemotionRoot = () => (
  <Composition
    id="BredInTheVillageV2"
    component={BredInTheVillageV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
