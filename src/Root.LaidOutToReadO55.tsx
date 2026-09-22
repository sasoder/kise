import {Composition} from 'remotion';
import LaidOutToReadO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LaidOutToReadO55';

// Private render entry for LaidOutToReadO55 (Noam_Punishing_AIs cut 1, the O55
// rebuild): the model writing its thought close, the pull-back that lays the
// page out, and the reader arriving to read it. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LaidOutToReadO55"
        component={LaidOutToReadO55}
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
