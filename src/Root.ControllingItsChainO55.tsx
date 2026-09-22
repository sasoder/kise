import {Composition} from 'remotion';
import ControllingItsChainO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ControllingItsChainO55';

// Private render entry for Noam_Punishing_AIs cut 6 (O55 rebuild):
// "...the model is becoming better able at controlling its chain of thought."
// Opaque 1080x1920 at 24fps. Never touches src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ControllingItsChainO55"
        component={ControllingItsChainO55}
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
