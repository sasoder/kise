import {Composition} from 'remotion';
import ConservativeMultiples, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ConservativeMultiples';

// Private render entry for the Toto Wolff clip, cut 3 (ConservativeMultiples, S_B 0-96),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ConservativeMultiples"
      component={ConservativeMultiples}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
