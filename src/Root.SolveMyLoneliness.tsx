import {Composition} from 'remotion';
import SolveMyLoneliness, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/SolveMyLoneliness';

// Private render entry for cut 4 of the CM_EARLY_JS trailer
// (SolveMyLoneliness, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SolveMyLoneliness"
      component={SolveMyLoneliness}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
