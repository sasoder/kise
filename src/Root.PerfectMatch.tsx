import {Composition} from 'remotion';
import PerfectMatch, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PerfectMatch';

// Private render entry for PerfectMatch (Noam_Trap, the cut that butts against
// DeployToTheRealWorld), so this cut renders while other builders own
// src/Root.tsx. Orange Dwarkesh on the grid background: the test's little
// course lifts off as a dashed copy, scales up to the real course and is
// absorbed into it, and the model rides the line that is left.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PerfectMatch"
        component={PerfectMatch}
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
