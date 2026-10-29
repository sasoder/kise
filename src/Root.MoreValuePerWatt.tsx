import {Composition} from 'remotion';
import MoreValuePerWatt, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/MoreValuePerWatt';

// Private render entry for MoreValuePerWatt (sam-gigawatt-cost; Cheeky Pint air look): a "1 W" power tile cabled to a cash pedestal; banknote bundles land on the stack faster and faster.
// Opaque 1080x1920, 23.976 fps, 78 frames.
export const RemotionRoot = () => (
  <Composition
    id="MoreValuePerWatt"
    component={MoreValuePerWatt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
