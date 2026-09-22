import {Composition} from 'remotion';
import NextGeneration, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NextGeneration';

// Private render entry for NextGeneration (Noam_Alignment_Degradation, cut 2),
// so this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on
// the grid background: the first generation of models goes to work on its own
// arrow, the people run threads up past it to the same empty spot, the second
// generation fills in there and the first one's arrow is copied up onto it.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NextGeneration"
        component={NextGeneration}
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
