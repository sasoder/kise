import {Composition} from 'remotion';
import MisalignmentFromHumans, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MisalignmentFromHumans';

// Private render entry for MisalignmentFromHumans (Noam_Alignment_Degradation,
// cut 4), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: the head of the lineage adds three more
// generations, each one turned further off the humans' line, and then the
// camera pulls all the way back — the whole curled spiral in one frame with the
// five people at its base, their arrow still pointing straight up the guide.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MisalignmentFromHumans"
        component={MisalignmentFromHumans}
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
