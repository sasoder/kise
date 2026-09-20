import {Composition} from 'remotion';
import HidingTranscripts, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HidingTranscripts';

// Private render entry for HidingTranscripts, the fifth cut of Noam_Children.
// ChainOfThought's `skull` world in close-up, 136 frames later: one ringed
// comet, its chain and its skull, and the AI's own orange ring travelling out
// along the chain, enclosing the skull, and coming back hiding what it finds.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HidingTranscripts"
        component={HidingTranscripts}
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
