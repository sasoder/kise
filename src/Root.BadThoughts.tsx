import {Composition} from 'remotion';
import BadThoughts, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BadThoughts';

// Private render entry for `Noam_Punishing_AIs` cut 2, BadThoughts (in at
// 0:11.419): we look, the reader finds a bad thought, and the camera is the
// magnifier on it. Opaque 1080x1920 at 24fps. Seven sibling cuts are being
// built in the same checkout, so this cut renders through its own root and
// never touches src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BadThoughts"
        component={BadThoughts}
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
