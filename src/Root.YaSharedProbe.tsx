import {Composition} from 'remotion';
import YaSharedProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/YaSharedProbe';

// Private render entry for YaSharedProbe (wip-ya-boom; Works in Progress style): the clip's shared materials (yaShared.tsx) on one page.
// Opaque 1080x1920, 24 fps, 48 frames.
export const RemotionRoot = () => (
  <Composition
    id="YaSharedProbe"
    component={YaSharedProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
