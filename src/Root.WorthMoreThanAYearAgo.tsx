import {Composition} from 'remotion';
import WorthMoreThanAYearAgo, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-worth-twelve/WorthMoreThanAYearAgo';

// Private render entry for WorthMoreThanAYearAgo (toto-worth-twelve; Cheeky Pint style (stout)): the amber climbs from the $6B notch (a year ago) to $12B.
// Opaque 1080x1920, 25 fps, 82 frames.
export const RemotionRoot = () => (
  <Composition
    id="WorthMoreThanAYearAgo"
    component={WorthMoreThanAYearAgo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
