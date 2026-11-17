import {Composition} from 'remotion';
import NewsCardAimNamanPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer-vertical/NewsCardAimNamanPortrait';

// Private render entry for NewsCardAimNamanPortrait (shruti-trailer-vertical; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 179 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAimNamanPortrait"
    component={NewsCardAimNamanPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
