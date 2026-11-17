import {Composition} from 'remotion';
import MonthsAhead, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/MonthsAhead';

// Private render entry for MonthsAhead (paul-twelve-hours, S5; Paul world look C): China's token moves 8 -> 12 -> 6 months behind the US on the race ruler, the gap plate flipping.
// Opaque 1080x1920, 23.976 fps, 108 frames.
export const RemotionRoot = () => (
  <Composition
    id="MonthsAhead"
    component={MonthsAhead}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
