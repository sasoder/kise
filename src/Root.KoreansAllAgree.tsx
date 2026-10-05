import {Composition} from 'remotion';
import KoreansAllAgree, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/KoreansAllAgree';

// Private render entry for KoreansAllAgree (Sheppard, "Regime change in Iraq
// was the easy part", cut D: one people, the fight is over the state; the MDL).
// Opaque, 1080x1920, 24fps, 260 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="KoreansAllAgree"
        component={KoreansAllAgree}
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
