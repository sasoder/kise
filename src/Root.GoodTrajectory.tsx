import {Composition} from 'remotion';
import GoodTrajectory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GoodTrajectory';

// Private render entry for GoodTrajectory, so this cut renders while another
// builder owns src/Root.tsx. Orange Dwarkesh on the grid background: a white
// trajectory line draws up and to the right through a scattered crowd of orange
// models, and the crowd it has passed turns, ripens and streams along it.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GoodTrajectory"
        component={GoodTrajectory}
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
