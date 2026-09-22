import {Composition} from 'remotion';
import MoreAndMoreAligned, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MoreAndMoreAligned';

// Private render entry for MoreAndMoreAligned (Noam_Alignment_Degradation, cut
// 5), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: a white correction train runs up the crooked
// chain from the humans and every generation it passes swings its arrow back
// onto the guide, unrolling the spiral into one straight column.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MoreAndMoreAligned"
        component={MoreAndMoreAligned}
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
