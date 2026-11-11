import {Composition} from 'remotion';
import MonthsLongSession, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/MonthsLongSession';

// Private render entry for MonthsLongSession (rsi-derpy-interns; Dwarkesh style): door 6 stretches into one months-long session and the intern's orange stack grows as tall as the person's white tower.
// Opaque 1080x1920, 23.976 fps, 169 frames.
export const RemotionRoot = () => (
  <Composition
    id="MonthsLongSession"
    component={MonthsLongSession}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
