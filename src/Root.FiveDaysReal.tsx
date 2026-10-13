import {Composition} from 'remotion';
import FiveDaysReal, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FiveDaysReal';

// Private render entry for "FiveDaysReal" (Brent Underwood, Core Memory short
// "five days in the mine", 1080x1920), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FiveDaysReal"
      component={FiveDaysReal}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
