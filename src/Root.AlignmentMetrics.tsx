import {Composition} from 'remotion';
import AlignmentMetrics, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AlignmentMetrics';

// Private render entry for cut 4 of `Noam_Punishing_AIs` (0:23.300) — the
// chain of thought with two flagged thoughts above, our alignment metric
// running flat below, and one move that puts them in the same frame.
// Opaque 1080x1920 at 24fps. src/Root.tsx is shared; this file is not.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AlignmentMetrics"
        component={AlignmentMetrics}
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
