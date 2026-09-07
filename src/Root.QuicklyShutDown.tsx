import { Composition } from "remotion";
import QuicklyShutDown, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/QuicklyShutDown";

// The field — the cluster's machines make a lot of noise, the noise leaks out
// across the mesh and into the crowd, an ink front sweeps down and shuts it
// all off, and a faint ring is traced back around the breached node.
// Ajeya, 0:48.380 -> 0:56.460 (+16 frame tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="QuicklyShutDown"
        component={QuicklyShutDown}
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
