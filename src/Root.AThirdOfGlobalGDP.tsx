import {Composition} from 'remotion';
import AThirdOfGlobalGDP, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AThirdOfGlobalGDP';

// Private render entry for Logan Wright "the biggest credit boom in history",
// V2 cut 2 (10_AThirdOfGlobalGDP), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="AThirdOfGlobalGDP"
      component={AThirdOfGlobalGDP}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
