import {Composition} from 'remotion';
import FirstDayEveryDay, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/FirstDayEveryDay';

// Private render entry for FirstDayEveryDay (rsi-derpy-interns; Dwarkesh style): the intern and the
// person walk the same days door after door; the intern drops its cards at every door, the person stacks a white
// tower, and the pair stop together over one MONTH 3.
// Opaque 1080x1920, 23.976 fps, 245 frames.
export const RemotionRoot = () => (
  <Composition
    id="FirstDayEveryDay"
    component={FirstDayEveryDay}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
