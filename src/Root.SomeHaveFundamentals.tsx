import {Composition} from 'remotion';
import SomeHaveFundamentals, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SomeHaveFundamentals';

// Private render entry for the Toto Wolff clip, cut 4 (SomeHaveFundamentals, S_B 94-233),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SomeHaveFundamentals"
      component={SomeHaveFundamentals}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
