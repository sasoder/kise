import {Composition} from 'remotion';
import StillDecideWhatWeWant, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/StillDecideWhatWeWant';

// Private render entry for StillDecideWhatWeWant, so this cut renders while
// another builder owns src/Root.tsx. Orange Dwarkesh style on the grid
// background: four decision slots under five people, the crowd fills the two
// empty ones, the leftover dots wait under a space that has no outline, and one
// person draws the fourth so they can pour in. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StillDecideWhatWeWant"
        component={StillDecideWhatWeWant}
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
