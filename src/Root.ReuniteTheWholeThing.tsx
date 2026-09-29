import {Composition} from 'remotion';
import ReuniteTheWholeThing, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ReuniteTheWholeThing';

// Private render entry for ReuniteTheWholeThing (Sarah Paine, Korea clip,
// cut 4: MacArthur's front erases the 38th and rolls to the Yalu).
// Opaque, 1080x1920, 24fps, 121 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ReuniteTheWholeThing"
        component={ReuniteTheWholeThing}
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
