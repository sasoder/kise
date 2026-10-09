import {Composition} from 'remotion';
import NineHundredBelow, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NineHundredBelow';

// Private render entry for "NineHundredBelow" (Brent Underwood, Core Memory
// short "five days in the mine", 1080x1920), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NineHundredBelow"
      component={NineHundredBelow}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
