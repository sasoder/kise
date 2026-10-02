import {Composition} from 'remotion';
import BackInTheDayStout, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BackInTheDayStout';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BackInTheDayStout, stout system),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BackInTheDayStout"
      component={BackInTheDayStout}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
