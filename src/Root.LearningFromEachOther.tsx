import {Composition} from 'remotion';
import LearningFromEachOther, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LearningFromEachOther';

// Private render entry for LearningFromEachOther (cut A of Sheppard_Vikings), so
// this cut renders while other builders own src/Root.tsx. Opaque Dwarkesh map
// style, 1080x1920, 24fps, 143 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LearningFromEachOther"
        component={LearningFromEachOther}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
