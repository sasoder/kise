import {Composition} from 'remotion';
import SlatedForAnnihilationV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/SlatedForAnnihilationV2';

// Private render entry for SlatedForAnnihilationV2 (sarah-death-ground; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 165 frames.
export const RemotionRoot = () => (
  <Composition
    id="SlatedForAnnihilationV2"
    component={SlatedForAnnihilationV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
