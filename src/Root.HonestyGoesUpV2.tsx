import {Composition} from 'remotion';
import HonestyGoesUpV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HonestyGoesUpV2';

// Private render entry for HonestyGoesUpV2 (Noam_Alignment cut 3, in at
// 0:27.820) — the revamp of HonestyGoesUp on the note that V1 was crowded and
// overstimulating. One centred axis out of the user's own arrow, two levels
// riding it, and a bead from the flock for every notch they climb. Opaque
// 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HonestyGoesUpV2"
        component={HonestyGoesUpV2}
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
