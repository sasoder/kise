import {Composition} from 'remotion';
import ThreeFactoriesEveryMonth, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/ThreeFactoriesEveryMonth';

// Private render entry for ThreeFactoriesEveryMonth (skyroot-trailer, cut 38; Core memory archive collage), v4: a
// pulse line through three cutaway halls builds upright Vikram-1s, the parts lowered on crane lines; every month-beat
// pulse a finished rocket steps out of hall 3 into a growing JAN-JUN row.
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
