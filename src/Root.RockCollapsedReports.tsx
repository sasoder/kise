import {Composition} from 'remotion';
import RockCollapsedReports, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/RockCollapsedReports';

// Private render entry for "brent - the mine death count", cut A
// (RockCollapsedReports, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="RockCollapsedReports"
      component={RockCollapsedReports}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
