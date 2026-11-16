import {Composition} from 'remotion';
import NewsCardTechCrunchUnicornAnim, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/NewsCardTechCrunchUnicornAnim';

// Private render entry for NewsCardTechCrunchUnicornAnim (skyroot-trailer; Core memory podcast style): news card B (alt) as a video, the layout-C card with the chain-colour marker drawing on across INDIA’S FIRST SPACE TECH UNICORN (f3-20).
// Opaque 2048x1080, 23.976 fps, 143 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardTechCrunchUnicornAnim"
    component={NewsCardTechCrunchUnicornAnim}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
