import {Composition} from 'remotion';
import WhyNotDesertsCoreMemory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/WhyNotDesertsCoreMemory';

// Core memory podcast style title card: "WHY AREN'T ALL DESERTS COVERED IN
// SOLAR PANELS?" set on three balanced lines in Barlow 900, the orange/purple/
// blue chain sliding up behind a white core, over a translucent black plate
// that rides the first layer. Transparent 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WhyNotDesertsCoreMemory"
        component={WhyNotDesertsCoreMemory}
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
