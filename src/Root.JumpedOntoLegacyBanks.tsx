import {Composition} from 'remotion';
import JumpedOntoLegacyBanks, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/JumpedOntoLegacyBanks';

// Private render entry for JumpedOntoLegacyBanks (nik-neobanks-us; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 94 frames.
export const RemotionRoot = () => (
  <Composition
    id="JumpedOntoLegacyBanks"
    component={JumpedOntoLegacyBanks}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
