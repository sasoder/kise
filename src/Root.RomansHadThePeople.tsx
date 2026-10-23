import {Composition} from 'remotion';
import RomansHadThePeople, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/RomansHadThePeople';

// Private render entry for RomansHadThePeople (kyle-greek-math; Dwarkesh 3D style): from cut E's last frame one truck, rise and lens widen brings the vast Roman crowd before the Colosseum in beside small Athens.
// Opaque 1080x1920, 29.97 fps, 74 frames.
export const RemotionRoot = () => (
  <Composition
    id="RomansHadThePeople"
    component={RomansHadThePeople}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
