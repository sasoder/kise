import {Composition} from 'remotion';
import MarginsEvenHigher, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-europe-worst-market/MarginsEvenHigher';

// Private render entry for MarginsEvenHigher (nik-europe-worst-market; Cheeky Pint style (stout)): a thermometer climbs, the credit-rate column climbs past it, the amber margin on top grows thickest.
// Opaque 1080x1920, 23.976 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="MarginsEvenHigher"
    component={MarginsEvenHigher}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
