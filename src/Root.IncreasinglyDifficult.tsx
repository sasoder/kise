import {Composition} from 'remotion';
import IncreasinglyDifficult, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IncreasinglyDifficult';

// Private render entry for IncreasinglyDifficult (Noam_Trap, the closing cut),
// so this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on
// the grid background: the evaluator closes every gap in the dashed wall until
// it passes for solid, and the model's sweeping attention tears them open again
// faster than they can be closed. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IncreasinglyDifficult"
        component={IncreasinglyDifficult}
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
