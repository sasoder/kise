import {Composition} from 'remotion';
import PriceCreepsUp, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/PriceCreepsUp';

// Private render entry for PriceCreepsUp (sam-pricing-tokens; Cheeky Pint style (stout)): monthly bills creep up out of a row of calendar pages.
// Opaque 1080x1920, 23.976 fps, 156 frames.
export const RemotionRoot = () => (
  <Composition
    id="PriceCreepsUp"
    component={PriceCreepsUp}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
