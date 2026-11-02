import {Composition} from 'remotion';
import NewsCardAirboundTechCrunch, {DURATION, FPS, defaultProps, schema} from '../generated/components/pushp-trailer/NewsCardAirboundTechCrunch';

// Private render entry for NewsCardAirboundTechCrunch (pushp-trailer; Core memory podcast style): the TechCrunch Airbound article as printed matter (headline and the aircraft photo), a 16:9 still.
// Opaque 1920x1080, 23.976 fps, 1 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewsCardAirboundTechCrunch"
    component={NewsCardAirboundTechCrunch}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
