import {Composition} from 'remotion';
import NavierStokesSolved, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/NavierStokesSolved';

// Private render entry for NavierStokesSolved (rsi-since-writing; Dwarkesh 3D style): the OpenAI mark beside a cloud of broken cream streamline pieces that join into one clean vortex, an orange front climbing its core.
// Opaque 1080x1920, 23.976 fps, 114 frames.
export const RemotionRoot = () => (
  <Composition
    id="NavierStokesSolved"
    component={NavierStokesSolved}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
