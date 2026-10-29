import {Composition} from 'remotion';
import SeventyBillionAGigawatt, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/SeventyBillionAGigawatt';

// Private render entry for SeventyBillionAGigawatt (sam-gigawatt-cost; Cheeky Pint air look): a stack of gold slabs rises out of the apron as $70B per gigawatt, the campus lights up (install), five year tiles light (run five years).
// Opaque 1080x1920, 23.976 fps, 132 frames.
export const RemotionRoot = () => (
  <Composition
    id="SeventyBillionAGigawatt"
    component={SeventyBillionAGigawatt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
