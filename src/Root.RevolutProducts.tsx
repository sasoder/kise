import {Composition} from 'remotion';
import RevolutProducts, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/RevolutProducts';

// Private render entry for RevolutProducts (nik-trend-friend; Cheeky Pint style (stout)): Revolut's R at the hub, eight products slide out of it into a ring.
// Opaque 1080x1920, 23.976 fps, 166 frames.
export const RemotionRoot = () => (
  <Composition
    id="RevolutProducts"
    component={RevolutProducts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
