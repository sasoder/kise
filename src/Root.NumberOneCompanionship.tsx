import {Composition} from 'remotion';
import NumberOneCompanionship, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NumberOneCompanionship';

// Private render entry for cut 3 of the CM_EARLY_JS trailer
// (NumberOneCompanionship, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NumberOneCompanionship"
      component={NumberOneCompanionship}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
