import {Composition} from 'remotion';
import BredInTheVillageV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/BredInTheVillageV3';

// Private render entry for BredInTheVillageV3 (kyle-first-farmers; Dwarkesh map style): V3 of BredInTheVillage: the germs as fine stipple dots only, the foreground yard on the village ground.
// Opaque 1080x1920, 29.97 fps, 168 frames.
export const RemotionRoot = () => (
  <Composition
    id="BredInTheVillageV3"
    component={BredInTheVillageV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
