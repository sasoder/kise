import {Composition} from 'remotion';
import HidingTranscriptsV5, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HidingTranscriptsV5';

// Private render entry for HidingTranscripts V5: V4 held closer — a narrower
// column, a much bigger margin skull, and one more push-in as the box shuts
// behind the caret, held through the redactions. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HidingTranscriptsV5"
        component={HidingTranscriptsV5}
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
