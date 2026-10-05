import { Composition } from "remotion";
import PickAColor, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/PickAColor";

// Private render entry for PickAColor (builder M): Si Sheppard, "if you could pick a
// color on that map, the chances are it might want to kill one or two more colors on
// that map" — the CIA 2003 ethnoreligious map redrawn clean, one colour picked, two
// drained. Opaque, 1080x1920, 24 fps, 158 frames (re-cut timeline f707-864).
export const RemotionRoot = () => (
  <>
    <Composition
      id="PickAColor"
      component={PickAColor}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
