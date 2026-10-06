import {Composition} from 'remotion';
import DepartmentOfWarOpen, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DepartmentOfWarOpen';

// Private render entry for the Bharat / Project Maven V3 opening shot
// (DepartmentOfWarOpen), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DepartmentOfWarOpen"
      component={DepartmentOfWarOpen}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
