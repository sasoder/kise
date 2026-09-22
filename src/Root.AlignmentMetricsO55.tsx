import {Composition} from 'remotion';
import AlignmentMetricsO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AlignmentMetricsO55';

// Private render entry for Noam_Punishing_AIs cut 4, AlignmentMetrics (O55
// rebuild): two flags found in the chain of thought above, the alignment
// metric's steady trace below. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AlignmentMetricsO55"
        component={AlignmentMetricsO55}
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
