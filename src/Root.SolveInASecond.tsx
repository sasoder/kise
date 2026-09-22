import {Composition} from 'remotion';
import SolveInASecond, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SolveInASecond';

// Private render entry for SolveInASecond (Noam_Challenge_The_Model, cut 4), so
// this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the
// grid background: a trainer below the model's level hands it problems, each one
// is solved on contact and sinks onto the pile, and the level line never moves.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SolveInASecond"
        component={SolveInASecond}
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
