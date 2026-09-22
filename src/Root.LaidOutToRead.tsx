import {Composition} from 'remotion';
import LaidOutToRead, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LaidOutToRead';

// Private render entry for `Noam_Punishing_AIs` cut 1, LaidOutToRead (in at
// 0:03.020). Eight builders share this checkout, so this cut renders through
// its own root and never touches src/Root.tsx. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LaidOutToRead"
        component={LaidOutToRead}
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
