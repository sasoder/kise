import {Composition} from 'remotion';
import NewsCardFortuneAIPause, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/NewsCardFortuneAIPause';

// Private render entry for NewsCardFortuneAIPause (neal-stephenson-trailer; Core memory podcast style): the Fortune Schmidt A.I.-pause article as one printed sheet (headline over the stage photo), a 16:9 still.
// Opaque 1920x1080, 23.976 fps, 1 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardFortuneAIPause"
    component={NewsCardFortuneAIPause}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
