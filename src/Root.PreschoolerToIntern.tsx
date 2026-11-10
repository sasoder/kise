import {Composition} from 'remotion';
import PreschoolerToIntern, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-another-jump/PreschoolerToIntern';

// Private render entry for PreschoolerToIntern (rsi-another-jump; Dwarkesh style): an orange figure walks the 2022-2026 timeline growing from a preschooler into an intern, leaving a staircase of height marks.
// Opaque 1080x1920, 23.976 fps, 104 frames.
export const RemotionRoot = () => (
  <Composition
    id="PreschoolerToIntern"
    component={PreschoolerToIntern}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
