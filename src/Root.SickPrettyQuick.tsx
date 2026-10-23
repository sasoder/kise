import {Composition} from 'remotion';
import SickPrettyQuick, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/SickPrettyQuick';

// Private render entry for SickPrettyQuick (kyle-covid; Dwarkesh 3D style): at cut 3's pole the SARS-1 Officer's lungs
// flare orange, he pales, coughs and sinks onto the bench, and the woman beside him jumps up and backs away.
// Opaque 1080x1920, 29.97 fps, 82 frames.
export const RemotionRoot = () => (
  <Composition
    id="SickPrettyQuick"
    component={SickPrettyQuick}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
