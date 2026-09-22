import {Composition} from 'remotion';
import SamePath, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SamePath';

// Private render entry for SamePath (Noam_Challenge_The_Model, cut 2), so this
// cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: our model's path is drawn and has a bottom end, and out to the
// right four white climbers lay their own question-mark rungs and never run out.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SamePath"
        component={SamePath}
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
