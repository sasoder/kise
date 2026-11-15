import {Composition} from 'remotion';
import YearIntoAWeek, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/YearIntoAWeek';

// Private render entry for YearIntoAWeek (rsi-since-writing; Dwarkesh 3D style): a year of workday sheets slides off a 52-week calendar onto the front week's seven days, cut 23.
// Opaque 1080x1920, 23.976 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="YearIntoAWeek"
    component={YearIntoAWeek}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
