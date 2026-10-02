import {Composition} from 'remotion';
import GoToTheTop, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GoToTheTop';

// Private render entry for GoToTheTop, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Pizarro: "Go to the top, seize
// whoever is at the very pinnacle of the social hierarchy, you control the
// entire structure." TRANSPARENT overlay: an old-paper playbook (1596 paper)
// with the Inca hierarchy engraved on it and the play drawn in orange.
// 1080x1920, 24fps, 169 frames (121 + a 48-frame hold), no background.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GoToTheTop"
        component={GoToTheTop}
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
