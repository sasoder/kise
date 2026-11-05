import {Composition} from 'remotion';
import StillToLaunch, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-revolut-ipo/StillToLaunch';

// Private render entry for StillToLaunch (nik-revolut-ipo; Cheeky Pint style (stout), 3D): a flight over the slab world map from cream Europe to the US warming amber, then a crane back as the expansion markets warm amber.
// Opaque 1080x1920, 23.976 fps, 118 frames.
export const RemotionRoot = () => (
  <Composition
    id="StillToLaunch"
    component={StillToLaunch}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
