import {Composition} from 'remotion';
import FiveDaysUndergroundTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FiveDaysUndergroundTall';

// Private render entry for the Cerro Gordo set's cut 6, 9:16
// (FiveDaysUndergroundTall, 1080x1920), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FiveDaysUndergroundTall"
      component={FiveDaysUndergroundTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
