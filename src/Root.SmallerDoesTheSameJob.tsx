import {Composition} from 'remotion';
import SmallerDoesTheSameJob, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/SmallerDoesTheSameJob';

// Private render entry for SmallerDoesTheSameJob (rsi-ten-earths; Dwarkesh 3D style), revision 1: Meta's big robot (Llama 2 70B, 2023) heaves a barbell; the camera tracks to the small robot (Llama 3 8B, 2024) who lifts the identical barbell; two-shot of both.
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmallerDoesTheSameJob"
    component={SmallerDoesTheSameJob}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
