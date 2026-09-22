import {Composition} from 'remotion';
import NotObservable, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NotObservable';

// Private render entry for cut 3 of Noam_Punishing_AIs, "NotObservable" (in at
// 0:16.480): the model writes a bad thought and it is gone before the reader
// gets there. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NotObservable"
        component={NotObservable}
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
