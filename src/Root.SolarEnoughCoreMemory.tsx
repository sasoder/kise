import {Composition} from 'remotion';
import WhyNotDesertsCoreMemory, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/WhyNotDesertsCoreMemory';

// Private render entry: the core memory text card (WhyNotDesertsCoreMemory)
// with new copy, so it renders while another builder owns src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SolarEnoughCoreMemory"
      component={WhyNotDesertsCoreMemory}
      schema={schema}
      defaultProps={{
        ...defaultProps,
        text: 'IS SOLAR ENERGY\nENOUGH TO\nPOWER AI?',
      }}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
