import {Composition} from 'remotion';
import WiredIntoOneTribe, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/WiredIntoOneTribe';

// Private render entry for WiredIntoOneTribe (wip-biblical; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 185 frames.
export const RemotionRoot = () => (
  <Composition
    id="WiredIntoOneTribe"
    component={WiredIntoOneTribe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
