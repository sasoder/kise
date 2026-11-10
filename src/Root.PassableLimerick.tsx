import {Composition} from 'remotion';
import PassableLimerick, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-another-jump/PassableLimerick';

// Private render entry for PassableLimerick (rsi-another-jump; Dwarkesh style): GPT-3.5 streams a readable limerick into its card, then autocompletes a one-line Python function body.
// Opaque 1080x1920, 23.976 fps, 82 frames.
export const RemotionRoot = () => (
  <Composition
    id="PassableLimerick"
    component={PassableLimerick}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
