import {Composition} from 'remotion';
import CrazyUplift, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-worth-twelve/CrazyUplift';

// Private render entry for CrazyUplift (toto-worth-twelve; Cheeky Pint style (stout)): the NFL and NBA cream value columns surge out of frame past Mercedes' amber one.
// Opaque 1080x1920, 25 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CrazyUplift"
    component={CrazyUplift}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
