import {Composition} from 'remotion';
import BadThoughtsO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BadThoughtsO55';

// Private render entry for BadThoughtsO55 (Noam_Punishing_AIs cut 2, O55
// rebuild): the camera looks, rides down with the reader, and becomes the
// magnifier on the bad thought it finds. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BadThoughtsO55"
        component={BadThoughtsO55}
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
