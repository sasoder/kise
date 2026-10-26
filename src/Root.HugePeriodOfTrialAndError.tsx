import {Composition} from 'remotion';
import HugePeriodOfTrialAndError, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/HugePeriodOfTrialAndError';

// Private render entry for HugePeriodOfTrialAndError (kyle-vaccine; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 249 frames.
export const RemotionRoot = () => (
  <Composition
    id="HugePeriodOfTrialAndError"
    component={HugePeriodOfTrialAndError}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
