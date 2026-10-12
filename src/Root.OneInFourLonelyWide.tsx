import {Composition} from 'remotion';
import OneInFourLonelyWide, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OneInFourLonelyWide';

// Private render entry for cut 5 of the CM_EARLY_JS trailer, 16:9 round
// (OneInFourLonelyWide, 2048x1080, 24000/1001 fps; the final renders with
// --scale 2 to 4096x2160), so it renders without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="OneInFourLonelyWide"
      component={OneInFourLonelyWide}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={2048}
      height={1080}
    />
  );
};
