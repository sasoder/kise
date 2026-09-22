import {Composition} from 'remotion';
import EquallyStrongV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EquallyStrongV2';

// Private render entry for EquallyStrongV2 (Noam_Challenge_The_Model, cut 3 V2),
// so this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on
// the grid background: the camera pushes in out of cut 2 V2's field of Go games
// onto the AlphaGo board, a second identical DeepMind mark rises into place
// beneath it, and one line is drawn from the top player round the game to the
// bottom one while the stones keep landing black, white, black, white.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EquallyStrongV2"
        component={EquallyStrongV2}
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
