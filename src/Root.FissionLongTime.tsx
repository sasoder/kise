import {Composition} from 'remotion';
import FissionLongTime, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-uranium/FissionLongTime';

// Private render entry for FissionLongTime (scott-nolan-uranium; Cheeky Pint style (stout)): a real 1956 print of a reactor vessel on the board, the camera trucks right to a 3D cutaway PWR vessel with an amber core.
// Opaque 1080x1920, 23.976 fps, 88 frames.
export const RemotionRoot = () => (
  <Composition
    id="FissionLongTime"
    component={FissionLongTime}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
