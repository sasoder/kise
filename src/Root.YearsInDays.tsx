import {Composition} from 'remotion';
import YearsInDays, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/YearsInDays';

// Private render entry for YearsInDays (rsi-years-in-days; Dwarkesh style): days along the ground, years up the side: the OpenAI mark climbs past year after year while the calendar moves three days.
// Opaque 1080x1920, 23.976 fps, 106 frames.
export const RemotionRoot = () => (
  <Composition
    id="YearsInDays"
    component={YearsInDays}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
