import {Composition} from 'remotion';
import YaGoldRush, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/YaGoldRush';

// Private render entry for YaGoldRush (wip-ya-boom; Works in Progress style): six real YA covers cut onto the page in three hard cuts, one taped heap.
// Opaque 1080x1920, 24 fps, 54 frames.
export const RemotionRoot = () => (
  <Composition
    id="YaGoldRush"
    component={YaGoldRush}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
