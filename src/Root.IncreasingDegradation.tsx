import {Composition} from 'remotion';
import IncreasingDegradation, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IncreasingDegradation';

// Private render entry for IncreasingDegradation (Noam_Alignment_Degradation,
// cut 3), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: four generations of models are made in a
// row, each one sooner than the last and each one leaning further off the
// dashed line the humans drew, while the camera climbs with the head of the
// chain and falls back to hold the whole curl. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IncreasingDegradation"
        component={IncreasingDegradation}
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
