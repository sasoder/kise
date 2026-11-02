import {Composition} from 'remotion';
import FiveKilosThreeKiloPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/pushp-trailer/FiveKilosThreeKiloPortrait';

// Private render entry for FiveKilosThreeKiloPortrait (pushp-trailer, cut 30, 9:16; Core memory podcast style): a small aircraft hauls a 5 KG iron weight off a print of farmland, the 3 KG tied to the aircraft by a white leader.
// Opaque 1080x1920, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="FiveKilosThreeKiloPortrait"
    component={FiveKilosThreeKiloPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
