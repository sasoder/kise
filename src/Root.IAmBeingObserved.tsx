import {Composition} from 'remotion';
import IAmBeingObserved, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IAmBeingObserved';

// Private render entry for `Noam_Punishing_AIs` cut 8, `IAmBeingObserved`
// (in at 1:07.120). Eight builders share this checkout, so this cut renders
// through its own root and never touches src/Root.tsx.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IAmBeingObserved"
        component={IAmBeingObserved}
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
