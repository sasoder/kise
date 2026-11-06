import {Composition} from 'remotion';
import FewBigHitters, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/FewBigHitters';

// Private render entry for FewBigHitters (wip-ya-boom; Works in Progress style): a bestseller list fills with four authors' covers, the Big Five crowd round them.
// Opaque 1080x1920, 24 fps, 144 frames.
export const RemotionRoot = () => (
  <Composition
    id="FewBigHitters"
    component={FewBigHitters}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
