import {Composition} from 'remotion';
import FasterBetterCheaper, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FasterBetterCheaper';

// Private render entry for FasterBetterCheaper, so this cut renders while other
// builders own src/Root.tsx. Hadrian Machina 06: "China's producing everything
// the US does, just faster and better and cheaper." A top-down two-lane race on
// paper; China pulls away. 1080x1920, 24fps, 103 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FasterBetterCheaper"
        component={FasterBetterCheaper}
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
