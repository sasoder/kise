import {Composition} from 'remotion';
import InterestRatesGoDownV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InterestRatesGoDownV2';

// Private render entry for InterestRatesGoDownV2, so this cut renders while
// other builders own src/Root.tsx. The 9:16 pared-back take on
// InterestRatesGoDown: one centred column (title, big readout 6% -> 4½%, the
// coupon step and its orange saving band). Opaque, 1080x1920, 24fps, 4.25 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="InterestRatesGoDownV2"
        component={InterestRatesGoDownV2}
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
