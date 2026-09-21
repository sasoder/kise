import {Composition} from 'remotion';
import HonestyGoesUp, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HonestyGoesUp';

// Private render entry for HonestyGoesUp (Noam_Alignment cut 3, in at
// 0:27.820), so this cut renders while the other builders of the set own
// src/Root.tsx. Orange Dwarkesh on the grid background: the snapped flock's
// eval beads stream up the user seat's arrow into two columns — honesty,
// instruction following — and the route they run on is drawn over as a path
// that the honesty column keeps climbing. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HonestyGoesUp"
        component={HonestyGoesUp}
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
