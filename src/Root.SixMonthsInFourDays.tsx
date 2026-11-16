import {Composition} from 'remotion';
import SixMonthsInFourDays, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/SixMonthsInFourDays';

// Private render entry for SixMonthsInFourDays (rsi-since-writing; Dwarkesh 3D style): cut 3's calendar board as half a year: the human's sheets fill 26 weeks, then the robot sweeps them onto 4 stacks on the painted MON..THU, "4 DAYS".
// Opaque 1080x1920, 23.976 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="SixMonthsInFourDays"
    component={SixMonthsInFourDays}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
