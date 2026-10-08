import {Composition} from 'remotion';
import SoonerOrLaterABadKing, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SoonerOrLaterABadKing';

// Private render entry for SoonerOrLaterABadKing, so this cut renders while
// other builders own src/Root.tsx. Dwarkesh: "there's this monarchical
// tradition across all these principalities in India, there's just going to be
// sooner or later a bad king. And that king will not be able to stop the
// British incursion." Dwarkesh map style, 1080x1920, 23.976 fps, 234 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SoonerOrLaterABadKing"
        component={SoonerOrLaterABadKing}
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
