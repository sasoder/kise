import {Composition} from 'remotion';
import SeemsLikeATrap, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SeemsLikeATrap';

// Private render entry for SeemsLikeATrap (Noam_Trap, cut 4 of 5), so this cut
// renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: cut 3's standing picture picked up, the model's needle landing on
// the folder, and the tripwire out of it to the evaluator outside the wall.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SeemsLikeATrap"
        component={SeemsLikeATrap}
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
