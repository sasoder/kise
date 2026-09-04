import {Composition} from 'remotion';
import NicheProductsDoingBetterV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NicheProductsDoingBetterV2';

// tobi-more-businesses-than-any-government-policy — V2 sleek pass.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:25.760 -> 0:30.440 */}
      <Composition
        id="NicheProductsDoingBetterV2"
        component={NicheProductsDoingBetterV2}
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
