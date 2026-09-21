import {Composition} from 'remotion';
import HidingTranscriptsV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HidingTranscriptsV3';

// Private render entry for HidingTranscripts V3: the chain of thought as TEXT
// being generated, a white scan line reading it, brackets around what it finds,
// and the caret going back to un-type two of them. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HidingTranscriptsV3"
        component={HidingTranscriptsV3}
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
