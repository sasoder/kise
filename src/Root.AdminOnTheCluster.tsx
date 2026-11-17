import {Composition} from 'remotion';
import AdminOnTheCluster, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/AdminOnTheCluster';

// Private render entry for AdminOnTheCluster (paul-hugging-face; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 186 frames.
export const RemotionRoot = () => (
  <Composition
    id="AdminOnTheCluster"
    component={AdminOnTheCluster}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
