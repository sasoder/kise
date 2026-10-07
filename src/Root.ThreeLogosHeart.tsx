import {Composition} from 'remotion';
import ThreeLogosHeart, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ThreeLogosHeart';

// Private render entry for ThreeLogosHeart, so this cut renders while other
// builders own src/Root.tsx. "SportsCenter, CNBC and X had a threesome": the
// three real logos gather into a triangle and a heart with the chain crown
// pops up between them. Core memory podcast graphic standard, opaque paper,
// 1080x1920, 24fps, 73 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThreeLogosHeart"
        component={ThreeLogosHeart}
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
