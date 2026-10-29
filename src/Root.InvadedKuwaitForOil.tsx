import {Composition} from 'remotion';
import InvadedKuwaitForOil, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/InvadedKuwaitForOil';

// Private render entry for InvadedKuwaitForOil (sarah-gulf-war; Dwarkesh 3D style): an Iraqi tank column rolls across the real map into Kuwait, knocks over the $14B debt stack at Kuwait City and fans out as Kuwait's oil fields light orange. Render with --gl=angle.
// Opaque 1080x1920, 24 fps, 174 frames.
export const RemotionRoot = () => (
  <Composition
    id="InvadedKuwaitForOil"
    component={InvadedKuwaitForOil}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
