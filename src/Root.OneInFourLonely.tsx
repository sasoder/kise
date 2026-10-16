import {Composition} from 'remotion';
import OneInFourLonely, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/cm-early-js-trailer/OneInFourLonely';

// Private render entry for cut 1 of the CM_EARLY_JS trailer
// (OneInFourLonely, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="OneInFourLonely"
      component={OneInFourLonely}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
