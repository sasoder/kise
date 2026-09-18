import {Composition} from 'remotion';
import DeployToTheRealWorld, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DeployToTheRealWorld';

// Private render entry for DeployToTheRealWorld (Noam_Trap cut 1), so this cut
// renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: a dashed test ring low in a tall world, its little slalom course
// continued 2.2x above it as a dashed forecast, and the model dot deployed up
// it between real people. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DeployToTheRealWorld"
        component={DeployToTheRealWorld}
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
