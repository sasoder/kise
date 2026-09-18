import {Composition} from 'remotion';
import AnswerKeyInTheFolder, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AnswerKeyInTheFolder';

// Private render entry for AnswerKeyInTheFolder (Noam_Trap cut 3), so this cut
// renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: the model inside a dashed test environment, handed a maths
// question from outside, with a folder and its answer key beside it. Opaque
// 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AnswerKeyInTheFolder"
        component={AnswerKeyInTheFolder}
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
