import {Composition} from 'remotion';
import BackInTheDay, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BackInTheDay';

// Private render entry for the Toto Wolff "Mercedes F1 financials" clip (BackInTheDay, Act A),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="BackInTheDay"
      component={BackInTheDay}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
