import {Composition} from 'remotion';
import KeepCollecting, {DURATION, FPS, defaultProps, schema} from '../generated/components/KeepCollecting';

// Private render entry for Bharat "Project Maven's data problem" V3 cut C (KeepCollecting).
export const RemotionRoot = () => {
  return (
    <Composition
      id="KeepCollecting"
      component={KeepCollecting}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
