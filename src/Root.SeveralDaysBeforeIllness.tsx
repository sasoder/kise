import {Composition} from 'remotion';
import SeveralDaysBeforeIllness, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/SeveralDaysBeforeIllness';

// Private render entry for SeveralDaysBeforeIllness (kyle-covid; Dwarkesh 3D style): a time-lapse walk: the Carrier, glowing and well, breathes on passer after passer for several days, then sickens on a bench.
// Opaque 1080x1920, 29.97 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="SeveralDaysBeforeIllness"
    component={SeveralDaysBeforeIllness}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
