import {Composition} from 'remotion';
import ConservativeMultiplesStout, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ConservativeMultiplesStout';

// Private render entry for the Toto Wolff clip in the stout system (ConservativeMultiplesStout),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ConservativeMultiplesStout"
      component={ConservativeMultiplesStout}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
