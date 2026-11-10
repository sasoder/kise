import {Composition} from 'remotion';
import CheckableNotTheory, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-fall-of-gods/CheckableNotTheory';

// Private render entry for CheckableNotTheory (rsi-fall-of-gods; Dwarkesh style): agents tick a field of claim cards and slash one with an X; the camera rises to an empty dashed theory slot.
// Opaque 1080x1920, 23.976 fps, 140 frames.
export const RemotionRoot = () => (
  <Composition
    id="CheckableNotTheory"
    component={CheckableNotTheory}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
