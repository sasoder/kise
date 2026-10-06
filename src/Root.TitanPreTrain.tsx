import {Composition} from 'remotion';
import TitanPreTrain, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TitanPreTrain';

// Private render entry for the Bharat "synthetic data needs real data" clip,
// cut B V2 (TitanPreTrain, one file 14_TitanPreTrain.mov, 245 f), so it
// renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TitanPreTrain"
      component={TitanPreTrain}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
