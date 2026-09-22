import {Composition} from 'remotion';
import EquallyStrong, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EquallyStrong';

// Private render entry for EquallyStrong (Noam_Challenge_The_Model, cut 3), so
// this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the
// grid background: the camera leaves our column behind and pushes in on one of
// cut 2's white climbers, which splits into a pair standing at the same height
// with a level line drawn between them — and from then on it is that line that
// turns each question into a tick. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EquallyStrong"
        component={EquallyStrong}
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
