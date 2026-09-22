import {Composition} from 'remotion';
import PeopleAreObserving, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PeopleAreObserving';

// Private render entry for Noam_Punishing_AIs cut 7 (0:52.920): the model
// draws our instruments in its own colour — an orange bracket round the phrase
// it just wrote, then an orange reader line swept across the column under it.
// Opaque 1080x1920 at 24fps. src/Root.tsx is shared; this file is not.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PeopleAreObserving"
        component={PeopleAreObserving}
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
