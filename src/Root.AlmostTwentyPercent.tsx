import {Composition} from 'remotion';
import AlmostTwentyPercent, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-fuel/AlmostTwentyPercent';

// Private render entry for AlmostTwentyPercent (scott-nolan-fuel; Cheeky Pint style (stout)): a 20 x 20 tray of atoms turns from 5% to 19.75% amber U-235 under a sweeping front.
// Opaque 1080x1920, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="AlmostTwentyPercent"
    component={AlmostTwentyPercent}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
