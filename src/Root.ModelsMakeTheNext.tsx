import {Composition} from 'remotion';
import ModelsMakeTheNext, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ModelsMakeTheNext';

// Private render entry for cut 2 of Noam_Alignment_Degradation v2,
// "ModelsMakeTheNext" (in at 0:09.380): generation 2 slides up out of
// generation 1 and lands a hair off the white line. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ModelsMakeTheNext"
        component={ModelsMakeTheNext}
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
