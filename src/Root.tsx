import {Composition} from 'remotion';
import ThreeSecretSocieties, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ThreeSecretSocieties';

// three secret ai societies — "three consecutive secret AI societies got
// started, then got wiped out, only to re-emerge from their predecessor's
// ashes." Dwarkesh style on the grid background.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:01.399 -> 0:08.839 (+12 frame tail) */}
      <Composition
        id="ThreeSecretSocieties"
        component={ThreeSecretSocieties}
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
