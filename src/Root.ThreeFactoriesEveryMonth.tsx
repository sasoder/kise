import {Composition} from 'remotion';
import ThreeFactoriesEveryMonth, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/ThreeFactoriesEveryMonth';

// Private render entry for ThreeFactoriesEveryMonth (skyroot-trailer, cut 38; Core memory archive collage): three factory
// glyphs feed one constant-speed line of Vikram-1 rockets out of one door onto a JAN-JUN rail, six by "every month",
// the seventh nosing out.
// Opaque 2048x1080, 23.976 fps, 97 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThreeFactoriesEveryMonth"
    component={ThreeFactoriesEveryMonth}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
