import {Composition} from 'remotion';
import FourteenBillionMore, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/FourteenBillionMore';

// Private render entry for FourteenBillionMore (sarah-gulf-war, cut 80; Dwarkesh 3D style): a +$14B stack pours over the allies and settles onto their block beside the US block under its $50B+ slab, then one pull-back.
// Opaque 1080x1920, 24 fps, 155 frames.
export const RemotionRoot = () => (
  <Composition
    id="FourteenBillionMore"
    component={FourteenBillionMore}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
