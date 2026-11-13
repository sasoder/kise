import {Composition} from 'remotion';
import GtaHud, {DURATION, FPS, defaultProps, schema} from '../generated/components/pressbyran-gta/GtaHud';

// Private render entry for GtaHud (pressbyran-gta): open-world game HUD over the Pressbyrån GTA cut.
// Transparent overlay 1080x1920, 29.97 fps.
export const RemotionRoot = () => (
  <Composition
    id="GtaHud"
    component={GtaHud}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
