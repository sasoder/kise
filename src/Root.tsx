import {Composition} from 'remotion';
import DesertSunlightCoreMemory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DesertSunlightCoreMemory';

// Core memory podcast style location title: "📍DESERT SUNLIGHT SOLAR FARM" set
// on two lines in Barlow 900, with an SVG map pin drawn inside every colour
// layer so it slides up with the letters. Transparent 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DesertSunlightCoreMemory"
        component={DesertSunlightCoreMemory}
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
