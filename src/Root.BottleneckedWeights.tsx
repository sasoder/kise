import {Composition} from 'remotion';
import BottleneckedWeights, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/BottleneckedWeights';

// Private render entry for BottleneckedWeights (rsi-derpy-interns; Dwarkesh style): the intern's notes jam at a dashed funnel neck above its weights, then fall away when the session's door shuts.
// Opaque 1080x1920, 23.976 fps, 184 frames.
export const RemotionRoot = () => (
  <Composition
    id="BottleneckedWeights"
    component={BottleneckedWeights}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
