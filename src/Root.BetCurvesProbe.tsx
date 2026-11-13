import {Composition} from 'remotion';
import BetCurvesProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/BetCurvesProbe';

// Private render entry for BetCurvesProbe (nik-trend-friend; Cheeky Pint style (stout)): three stills of the shared chart world.
// Opaque 1080x1920, 23.976 fps, 3 frames.
export const RemotionRoot = () => (
  <Composition
    id="BetCurvesProbe"
    component={BetCurvesProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
