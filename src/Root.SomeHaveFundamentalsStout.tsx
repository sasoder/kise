import {Composition} from 'remotion';
import SomeHaveFundamentalsStout, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SomeHaveFundamentalsStout';

// Private render entry for the Toto Wolff clip in the stout system (SomeHaveFundamentalsStout),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SomeHaveFundamentalsStout"
      component={SomeHaveFundamentalsStout}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
