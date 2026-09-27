import {Composition} from 'remotion';
import InterestRatesGoDown, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InterestRatesGoDown';

// Private render entry for InterestRatesGoDown, so this cut renders while
// other builders own src/Root.tsx. Russo-Japanese War, "War runs on credit":
// Japan's war-loan coupon steps from 6% to 4½% after Mukden and the gap fills
// orange (the saving). Opaque engraved chart on the land backdrop, 1920x1080
// (render with --scale 2 for 3840x2160), 24fps, 4.25 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="InterestRatesGoDown"
        component={InterestRatesGoDown}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
