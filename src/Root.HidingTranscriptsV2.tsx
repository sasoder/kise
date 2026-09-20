import {Composition} from 'remotion';
import HidingTranscriptsV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HidingTranscriptsV2';

// Private render entry for HidingTranscripts V2, the fifth cut of Noam_Children
// rebuilt as the mechanism rather than cut 4's picture: thoughts leave the AI,
// travel down a chain, land on a page as written lines that a white ring reads,
// and finished pages pile up as the transcripts. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HidingTranscriptsV2"
        component={HidingTranscriptsV2}
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
