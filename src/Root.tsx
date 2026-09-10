import {Composition} from 'remotion';
import SporttouchenTimer, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SporttouchenTimer';

// Sporttouchen 15 s countdown, brand ring + MADE Tommy Soft numeral.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SporttouchenTimer"
        component={SporttouchenTimer}
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
