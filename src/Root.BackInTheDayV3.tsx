import {Composition} from 'remotion';
import BackInTheDayV3, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BackInTheDayV3';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BackInTheDayV3, cut 2 V3:
// V2 with every figure the filed number), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BackInTheDayV3"
      component={BackInTheDayV3}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
