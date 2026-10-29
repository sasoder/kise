import {Composition} from 'remotion';
import CashProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/cashProbe';

// Private still entry for cashProbe (sam-gigawatt-cost): the cash bundle look on the desert. Not a cut.
// Opaque 1080x1920, one frame.
export const RemotionRoot = () => (
  <Composition
    id="CashProbe"
    component={CashProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
