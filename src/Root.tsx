import {Composition} from 'remotion';
import AdminAccessToTheCluster, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AdminAccessToTheCluster';

// The field — the crowd's traffic turns on OpenAI's internal network, three
// probes find a way in, possession spreads along the network's own edges, and
// the breached node opens into the research cluster and the VMs it carried.
// Ajeya, 0:01.740 -> 0:13.619 (+16 frame tail).
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
