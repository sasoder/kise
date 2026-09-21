import {Composition} from 'remotion';
import HidingTranscriptsV4, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HidingTranscriptsV4';

// Private render entry for HidingTranscripts V4: V3 with the disappearing-text
// bug fixed (there is no bottom clip any more) and the white scan line removed
// — the monitoring is carried by the brackets alone, on a read-lag after each
// phrase is written. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HidingTranscriptsV4"
        component={HidingTranscriptsV4}
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
