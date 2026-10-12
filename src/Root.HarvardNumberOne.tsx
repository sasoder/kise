import {Composition} from 'remotion';
import HarvardNumberOne, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HarvardNumberOne';

// Private render entry for "HarvardNumberOne" of the CM_EARLY_JS trailer
// (2048x1080, 24000/1001 fps; final at --scale 2 = 4096x2160), so it renders
// without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HarvardNumberOne"
      component={HarvardNumberOne}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={2048}
      height={1080}
    />
  );
};
