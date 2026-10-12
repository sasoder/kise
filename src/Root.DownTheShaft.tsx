import {Composition} from 'remotion';
import DownTheShaft, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DownTheShaft';

// Private render entry for "DownTheShaft" (Brent Underwood, Core Memory short
// "five days in the mine", 1080x1920), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DownTheShaft"
      component={DownTheShaft}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
