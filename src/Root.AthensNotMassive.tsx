import {Composition} from 'remotion';
import AthensNotMassive, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/AthensNotMassive';

// Private render entry for AthensNotMassive (kyle-greek-math; Dwarkesh 3D style): from the Parthenon on its rock, one pull-back reveals the Athenians as a modest crowd on a wide empty plain.
// Opaque 1080x1920, 29.97 fps, 133 frames.
export const RemotionRoot = () => (
  <Composition
    id="AthensNotMassive"
    component={AthensNotMassive}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
