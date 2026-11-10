import {Composition} from 'remotion';
import AnotherJumpThatBig, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-another-jump/AnotherJumpThatBig';

// Private render entry for AnotherJumpThatBig (rsi-another-jump; Dwarkesh style): cut 15's climb copied to 2028-2032 grows the intern into a dashed-outlined giant beside three humans; its threads tick three verifiable domains.
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="AnotherJumpThatBig"
    component={AnotherJumpThatBig}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
