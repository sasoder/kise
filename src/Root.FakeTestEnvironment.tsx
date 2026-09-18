import {Composition} from 'remotion';
import FakeTestEnvironment, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FakeTestEnvironment';

// Private render entry for FakeTestEnvironment (Noam_Trap cut 2), so this cut
// renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: one orange model dot inside a solid white ring, its gaze sweeping
// wider and wider until everything it passes turns out to be dashed. Opaque
// 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FakeTestEnvironment"
        component={FakeTestEnvironment}
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
