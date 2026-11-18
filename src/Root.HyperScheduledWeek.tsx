import {Composition} from 'remotion';
import HyperScheduledWeek, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/HyperScheduledWeek';

// Private render entry for HyperScheduledWeek (nik-detecting-bullshit; Cheeky Pint style (stout)): a week planner, MON-FRI, packs solid with cascading 15- and 30-min meeting blocks; a push into WED names them (15 MIN, 30 MIN, business review, product review, one-on-one).
// Opaque 1080x1920, 23.976 fps, 165 frames.
export const RemotionRoot = () => (
  <Composition
    id="HyperScheduledWeek"
    component={HyperScheduledWeek}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
