import {Composition} from 'remotion';
import LearningFromEachOtherV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/sheppard-vikings/LearningFromEachOtherV3';

// Private render entry for LearningFromEachOtherV3 (sheppard-vikings; Dwarkesh map style): three Spaniards pass an orange book along and all turn orange; below, the Aztec and the Inca keep their own records and turn apart.
// Opaque 1080x1920, 23.976 fps, 141 frames.
export const RemotionRoot = () => (
  <Composition
    id="LearningFromEachOtherV3"
    component={LearningFromEachOtherV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
