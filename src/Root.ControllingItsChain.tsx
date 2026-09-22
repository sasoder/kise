import {Composition} from 'remotion';
import ControllingItsChain, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ControllingItsChain';

// Private render entry for Noam_Punishing_AIs cut 6 (0:48.840) — the model
// takes over the press: four self-presses, then words born at the hairline in
// a repeating pattern. Opaque 1080x1920 at 24fps. src/Root.tsx is shared with
// seven other builders and is never touched.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ControllingItsChain"
        component={ControllingItsChain}
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
