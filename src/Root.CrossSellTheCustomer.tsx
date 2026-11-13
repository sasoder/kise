import {Composition} from 'remotion';
import CrossSellTheCustomer, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/CrossSellTheCustomer';

// Private render entry for CrossSellTheCustomer (nik-trend-friend; Cheeky Pint style (stout)): eight Revolut products seat round one customer, who turns amber.
// Opaque 1080x1920, 23.976 fps, 166 frames.
export const RemotionRoot = () => (
  <Composition
    id="CrossSellTheCustomer"
    component={CrossSellTheCustomer}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
