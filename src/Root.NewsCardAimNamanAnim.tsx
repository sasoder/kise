import {Composition} from 'remotion';
import NewsCardAimNamanAnim, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer/NewsCardAimNamanAnim';

// Private render entry for NewsCardAimNamanAnim (shruti-trailer; Core memory podcast style): the AIM news card under a slow push-in, the highlighter on "20-YEAR-OLD" at f24.
// Opaque 1920x1080, 23.976 fps, 179 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAimNamanAnim"
    component={NewsCardAimNamanAnim}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
