import {Composition} from 'remotion';
import UltraBenefits, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-any-idea/UltraBenefits';

// Private render entry for UltraBenefits (nik-any-idea; Cheeky Pint style (stout)): perk tiles slide out from behind the Ultra card into an arch.
// Opaque 1080x1920, 23.976 fps, 61 frames.
export const RemotionRoot = () => (
  <Composition
    id="UltraBenefits"
    component={UltraBenefits}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
