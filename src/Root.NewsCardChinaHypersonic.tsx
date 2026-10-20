import {Composition} from 'remotion';
import NewsCardChinaHypersonic, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer/NewsCardChinaHypersonic';

// Private render entry for NewsCardChinaHypersonic (zach-shore-trailer; Core memory podcast style): the SCMP hypersonic article as a headline sheet over a parade photo print, a 16:9 still.
// Opaque 2048x1080, 23.976 fps, 1 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardChinaHypersonic"
    component={NewsCardChinaHypersonic}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
