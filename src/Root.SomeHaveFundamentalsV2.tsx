import {Composition} from 'remotion';
import SomeHaveFundamentalsV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SomeHaveFundamentalsV2';

// Private render entry for the Toto Wolff clip, cut 4 V2 (SomeHaveFundamentalsV2,
// S_B 94-233, real US teams with their crests), so it renders while other
// sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SomeHaveFundamentalsV2"
      component={SomeHaveFundamentalsV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
