import {Composition} from 'remotion';
import HarvardNumberOneTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HarvardNumberOneTall';

// Private render entry for "HarvardNumberOneTall" of the CM_EARLY_JS trailer
// (the 1080x1920 version, 24000/1001 fps), so it renders
// without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HarvardNumberOneTall"
      component={HarvardNumberOneTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
