import {Composition} from 'remotion';
import GrewSixtyToEighty, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/GrewSixtyToEighty';

// Private render entry for GrewSixtyToEighty (nik-detecting-bullshit; Cheeky Pint style (stout)): last year's bar, then this year's 1.7x with the growth as an amber slice, "+60–80%".
// Opaque 1080x1920, 23.976 fps, 102 frames.
export const RemotionRoot = () => (
  <Composition
    id="GrewSixtyToEighty"
    component={GrewSixtyToEighty}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
