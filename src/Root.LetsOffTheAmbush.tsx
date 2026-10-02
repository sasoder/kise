import {Composition} from 'remotion';
import LetsOffTheAmbush, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LetsOffTheAmbush';

// Private render entry for LetsOffTheAmbush, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Pizarro at Cajamarca: "That's when
// Pizarro lets off the ambush. He lets fly with all his artillery and all his
// musketry for the shock value, unleashes his horses." Opaque engraved plan,
// 1080x1920, 24fps, 178 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LetsOffTheAmbush"
        component={LetsOffTheAmbush}
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
