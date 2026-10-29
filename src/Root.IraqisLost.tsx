import {Composition} from 'remotion';
import IraqisLost, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/IraqisLost';

// Private render entry for IraqisLost (sarah-gulf-war; Dwarkesh 3D style): the Iraqi dead as a flat bar chart in the air.
// Opaque 1080x1920, 24 fps, 163 frames.
export const RemotionRoot = () => (
  <Composition
    id="IraqisLost"
    component={IraqisLost}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
