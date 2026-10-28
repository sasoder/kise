import {Composition} from 'remotion';
import NanometersVsReality, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/NanometersVsReality';

// Private render entry for NanometersVsReality (sam-pricing-tokens, cut 48; Cheeky Pint style (stout)): a dive into a "3 nm" die lands on gates 45 nm apart.
// Opaque 1080x1920, 23.976 fps, 68 frames.
export const RemotionRoot = () => (
  <Composition
    id="NanometersVsReality"
    component={NanometersVsReality}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
