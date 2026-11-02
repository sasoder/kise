import {Composition} from 'remotion';
import FiveKilosThreeKilo, {DURATION, FPS, defaultProps, schema} from '../generated/components/pushp-trailer/FiveKilosThreeKilo';

// Private render entry for FiveKilosThreeKilo (pushp-trailer; Core memory podcast style): the aircraft lifts a stack of five weights while itself weighing a stack of three, on Airbound's own photos.
// Opaque 1920x1080, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="FiveKilosThreeKilo"
    component={FiveKilosThreeKilo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
