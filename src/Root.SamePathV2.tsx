import {Composition} from 'remotion';
import SamePathV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SamePathV2';

// Private render entry for SamePathV2 (Noam_Challenge_The_Model, cut 2, V2), so
// this cut renders while other builders own src/Root.tsx. Orange Dwarkesh on the
// grid background: our model's path is drawn and has a bottom end, then ONE pan
// right carries the column, the mark and its orange level line off the frame for
// good and finds a real Go game — AlphaGo vs Lee Sedol, game 2 — running under
// the Google DeepMind mark, with five more games around it.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SamePathV2"
        component={SamePathV2}
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
