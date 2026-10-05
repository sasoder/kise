import {Composition} from 'remotion';
import TwoThousandMilesOfBorder, {DURATION, FPS, defaultProps, schema} from '../generated/components/TwoThousandMilesOfBorder';

// Private render entry for TwoThousandMilesOfBorder (cut E of the Sheppard Iraq clip, builder N), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style, 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TwoThousandMilesOfBorder"
        component={TwoThousandMilesOfBorder}
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
