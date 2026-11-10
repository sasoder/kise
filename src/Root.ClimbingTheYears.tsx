import {Composition} from 'remotion';
import ClimbingTheYears, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/ClimbingTheYears';

// Private render entry for ClimbingTheYears (rsi-fall-of-gods; Dwarkesh style): the AI dot climbs a staircase of years, 2023 -> 2026.
// Opaque 1080x1920, 23.976 fps, 379 frames.
export const RemotionRoot = () => (
  <Composition
    id="ClimbingTheYears"
    component={ClimbingTheYears}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
