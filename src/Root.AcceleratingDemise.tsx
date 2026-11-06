import {Composition} from 'remotion';
import AcceleratingDemise, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/AcceleratingDemise';

// Private render entry for AcceleratingDemise (wip-ya-boom; Works in Progress style): a leaning tower of photocopied best-seller spines gets more copies piled on, tips further at each one, and topples into a heap.
// Opaque 1080x1920, 24 fps, 111 frames.
export const RemotionRoot = () => (
  <Composition
    id="AcceleratingDemise"
    component={AcceleratingDemise}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
