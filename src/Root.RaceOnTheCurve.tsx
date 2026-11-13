import {Composition} from 'remotion';
import RaceOnTheCurve, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/RaceOnTheCurve';

// Private render entry for RaceOnTheCurve (nik-trend-friend; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 109 frames.
export const RemotionRoot = () => (
  <Composition
    id="RaceOnTheCurve"
    component={RaceOnTheCurve}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
