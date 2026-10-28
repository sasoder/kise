import {Composition} from 'remotion';
import PromptInPriceOut, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/PromptInPriceOut';

// Private render entry for PromptInPriceOut (sam-pricing-tokens; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 71 frames.
export const RemotionRoot = () => (
  <Composition
    id="PromptInPriceOut"
    component={PromptInPriceOut}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
