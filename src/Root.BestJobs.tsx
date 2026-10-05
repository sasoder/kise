import {Composition} from 'remotion';
import BestJobs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BestJobs';

// Private render entry for BestJobs (Toto Wolff, "how he got the Mercedes job", Cheeky Pint S4E01), so
// this cut renders while other builders own src/Root.tsx. One world: mercJobShared.tsx (Act B: mercJobActB.tsx).
// Opaque, 1080x1920 (9:16, vertical shorts), 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BestJobs"
        component={BestJobs}
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
