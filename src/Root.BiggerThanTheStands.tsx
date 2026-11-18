import {Composition} from 'remotion';
import BiggerThanTheStands, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/BiggerThanTheStands';

// Private render entry for BiggerThanTheStands (toto-female-fans; Cheeky Pint style (stout)): the modest cream stand fills, then the crowd overflows onto the hill until the stand is a small island in a sea of amber-scarved fans.
// Opaque 1080x1920, 25 fps, 119 frames.
export const RemotionRoot = () => (
  <Composition
    id="BiggerThanTheStands"
    component={BiggerThanTheStands}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
