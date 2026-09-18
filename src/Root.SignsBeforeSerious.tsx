import {Composition} from 'remotion';
import SignsBeforeSerious, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SignsBeforeSerious';

// Private render entry for SignsBeforeSerious, the second cut of Noam_Children.
// It stands in GoodTrajectory's world at world time 110 + f: the same curve, the
// same dots, the same spine. Three comets break alignment and are ringed, a
// threshold tick goes across the curve high up, and the camera eases back (V2:
// the twin curve was removed on the user's note). Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SignsBeforeSerious"
        component={SignsBeforeSerious}
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
