import {Composition} from 'remotion';
import NineHundredReal, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/brent-five-days/NineHundredReal';

// Private render entry for "NineHundredReal" (Brent Underwood, Core Memory short
// "five days in the mine", 1080x1920), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NineHundredReal"
      component={NineHundredReal}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
