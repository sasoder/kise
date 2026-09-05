import {Composition} from 'remotion';
import BestForecasterInKansas, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BestForecasterInKansas';

// kalshi — monitoring the situation: the best inflation forecaster is a guy in Kansas.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:23.160 -> 0:34.100 */}
      <Composition
        id="BestForecasterInKansas"
        component={BestForecasterInKansas}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
