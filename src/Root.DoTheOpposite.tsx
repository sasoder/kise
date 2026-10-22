import {Composition} from 'remotion';
import DoTheOpposite, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/DoTheOpposite';

// Private render entry for DoTheOpposite (scott-aircraft-order, cut 14): the hangar's doors open and a line of new
// United 787s rolls out toward the camera, the opposite way to the stored row. Opaque 1080x1920, 23.976 fps, 116
// frames. Render with --gl=angle.
export const RemotionRoot = () => (
  <Composition
    id="DoTheOpposite"
    component={DoTheOpposite}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
