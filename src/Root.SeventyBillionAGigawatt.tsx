import {Composition} from 'remotion';
import SeventyBillionAGigawatt, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/SeventyBillionAGigawatt';

// Private render entry for SeventyBillionAGigawatt (sam-gigawatt-cost; Cheeky Pint air look): a stack of cash bundles rises out of the apron as $70B per gigawatt, the campus lights up (install), five year tiles light (run five years); then on "20" the column sinks to $20B and a field of new campuses rises behind it.
// Opaque 1080x1920, 23.976 fps, 225 frames.
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
