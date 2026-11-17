import {Composition} from 'remotion';
import TwelveHoursAhead, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/TwelveHoursAhead';

// Private render entry for TwelveHoursAhead (paul-twelve-hours, S6; Paul world look C): China rushes from 6 months to just behind the US on the race ruler, the plate flipping to "12 HOURS".
// Opaque 1080x1920, 23.976 fps, 63 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwelveHoursAhead"
    component={TwelveHoursAhead}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
