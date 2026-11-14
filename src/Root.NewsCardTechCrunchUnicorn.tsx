import {Composition} from 'remotion';
import NewsCardTechCrunchUnicorn, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/NewsCardTechCrunchUnicorn';

// Private render entry for NewsCardTechCrunchUnicorn (skyroot-trailer; Core memory podcast style): news card B, the TechCrunch unicorn headline (prop article: "businesstoday" for the alt) on the same minimal white slip as card A (SkyrootNewsCard), a 16:9 still.
// Opaque 2048x1080 (rendered --scale=2 to 4096x2160), 23.976 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardTechCrunchUnicorn"
    component={NewsCardTechCrunchUnicorn}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
