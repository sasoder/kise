import {Composition} from 'remotion';
import TalentToNetwork, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TalentToNetwork';

// Private render entry for TalentToNetwork, so this cut renders while
// another builder owns src/Root.tsx. Lovable talent -> network app-icon
// morph as a transparent 1080x1920 overlay at 24fps, 4.0 s (96 f).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TalentToNetwork"
        component={TalentToNetwork}
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
