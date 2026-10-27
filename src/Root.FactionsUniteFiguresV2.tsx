import {Composition} from 'remotion';
import FactionsUniteFiguresV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/FactionsUniteFiguresV2';

// Private render entry for FactionsUniteFiguresV2 (sarah-pearl-harbor; Dwarkesh map style): China's rival
// armies of engraved 1937 soldiers clash, turn and form one front against Japan's orange.
// Opaque 1080x1920, 24 fps, 179 frames (used 0..166, 167..178 a living hold handle).
export const RemotionRoot = () => (
  <Composition
    id="FactionsUniteFiguresV2"
    component={FactionsUniteFiguresV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
