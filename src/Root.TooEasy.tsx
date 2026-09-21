import {Composition} from 'remotion';
import TooEasy, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TooEasy';

// Private render entry for TooEasy (Noam_Challenge_The_Model, cut 1), so this
// cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the grid
// background: the model climbs a column of questions and everything its level
// line reaches turns into a tick and goes dim. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TooEasy"
        component={TooEasy}
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
