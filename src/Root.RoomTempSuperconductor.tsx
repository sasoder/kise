import {Composition} from 'remotion';
import RoomTempSuperconductor, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-another-jump/RoomTempSuperconductor';

// Private render entry for RoomTempSuperconductor (rsi-another-jump; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 179 frames.
export const RemotionRoot = () => (
  <Composition
    id="RoomTempSuperconductor"
    component={RoomTempSuperconductor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
