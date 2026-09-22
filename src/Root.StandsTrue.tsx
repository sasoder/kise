import {Composition} from 'remotion';
import StandsTrue, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/StandsTrue';

// Private render entry for cut 5 of Noam_Alignment_Degradation v2, "StandsTrue"
// (in at 0:32.979): a straightening wave climbs the tower and it stands true
// on the plumb line. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StandsTrue"
        component={StandsTrue}
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
