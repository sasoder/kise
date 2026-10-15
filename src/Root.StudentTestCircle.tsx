import {Composition} from 'remotion';
import StudentTestCircle, {DURATION, FPS, defaultProps, schema} from '../generated/components/StudentTestCircle';

// Private render entry for the pen circle round "Student 't' test" on the Gosset plaque (Will Guinness t-test clip).
export const RemotionRoot = () => {
  return (
    <Composition
      id="StudentTestCircle"
      component={StudentTestCircle}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
