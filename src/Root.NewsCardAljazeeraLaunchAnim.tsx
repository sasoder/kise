import {Composition} from 'remotion';
import NewsCardAljazeeraLaunchAnim, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/NewsCardAljazeeraLaunchAnim';

// Private render entry for NewsCardAljazeeraLaunchAnim (skyroot-trailer; Core memory podcast style): news card A as a video, the layout-C still with the chain-colour marker drawing on across LAUNCH OF FIRST PRIVATE-SECTOR (f3-20).
// Opaque 2048x1080, 23.976 fps, 44 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAljazeeraLaunchAnim"
    component={NewsCardAljazeeraLaunchAnim}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
