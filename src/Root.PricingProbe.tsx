import {Composition} from 'remotion';
import PricingProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/PricingProbe';

// Private render entry for the sam-pricing-tokens shared world's probe still (PricingProbe). Opaque 1080x1920.
export const RemotionRoot = () => (
  <Composition
    id="PricingProbe"
    component={PricingProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
