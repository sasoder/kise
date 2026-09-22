import {Composition} from 'remotion';
import NotObservableO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NotObservableO55';

// Private render entry for NotObservableO55 (Noam_Punishing_AIs cut 3, O55
// rebuild): three words in the middle of a line are written and sink to
// nothing before the reader gets there; it passes the hole and leaves no
// bracket. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NotObservableO55"
        component={NotObservableO55}
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
