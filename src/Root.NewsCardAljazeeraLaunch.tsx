import {Composition} from 'remotion';
import NewsCardAljazeeraLaunch, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/NewsCardAljazeeraLaunch';

// Private render entry for NewsCardAljazeeraLaunch (skyroot-trailer; Core memory podcast style): news card A, the Al Jazeera launch headline on one minimal white slip (SkyrootNewsCard), a 16:9 still.
// Opaque 2048x1080 (rendered --scale=2 to 4096x2160), 23.976 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAljazeeraLaunch"
    component={NewsCardAljazeeraLaunch}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
