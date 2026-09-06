import {Composition} from 'remotion';
import BestForecasterField, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/BestForecasterField';

// kalshi — monitoring the situation: the same line in the Dwarkesh grid language.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:23.160 -> 0:34.100 (+0.5s tail) */}
      <Composition
        id="BestForecasterField"
        component={BestForecasterField}
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
