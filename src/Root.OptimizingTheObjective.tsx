import {Composition} from 'remotion';
import OptimizingTheObjective, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OptimizingTheObjective';

// Private render entry for OptimizingTheObjective, so this cut renders while
// another builder owns src/Root.tsx. Orange Dwarkesh on the grid background:
// a person, a planted Lucide flag, and a crowd of orange dots that races to it.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OptimizingTheObjective"
        component={OptimizingTheObjective}
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
