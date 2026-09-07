import {Composition} from 'remotion';
import AdminAccessToTheCluster, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AdminAccessToTheCluster';

// "...the agents using a series of creative exploits to gain full
// administrative access to a research cluster that supported our virtual
// machine environments." Ajeya 0:01.740 -> 0:13.619 (+16 frame tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AdminAccessToTheCluster"
        component={AdminAccessToTheCluster}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
