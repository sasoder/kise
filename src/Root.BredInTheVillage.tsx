import {Composition} from 'remotion';
import BredInTheVillage, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/BredInTheVillage';

// Private render entry for BredInTheVillage (kyle-first-farmers; Dwarkesh map style): one pull-back out of a crowded Neolithic village, every body breeding germs until one haze hangs over it.
// Opaque 1080x1920, 29.97 fps, 168 frames.
export const RemotionRoot = () => (
  <Composition
    id="BredInTheVillage"
    component={BredInTheVillage}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
