import {Composition} from 'remotion';
import StarlinkLinksDrones, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-starlink/StarlinkLinksDrones';

// Private render entry for StarlinkLinksDrones (kofman-starlink; ChinaTalk style (newsprint)): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 227 frames.
export const RemotionRoot = () => (
  <Composition
    id="StarlinkLinksDrones"
    component={StarlinkLinksDrones}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
