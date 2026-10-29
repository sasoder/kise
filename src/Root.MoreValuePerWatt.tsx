import {Composition} from 'remotion';
import MoreValuePerWatt, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/MoreValuePerWatt';

// Private render entry for MoreValuePerWatt (sam-gigawatt-cost; Cheeky Pint air look): one cable of steady light pulses into a chip, gold bars doubling out into a stepped pile.
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
