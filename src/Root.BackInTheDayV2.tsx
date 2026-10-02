import {Composition} from 'remotion';
import BackInTheDayV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BackInTheDayV2';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BackInTheDayV2, cut 2 V2),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BackInTheDayV2"
      component={BackInTheDayV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
