import { Composition } from "remotion";
import MoveOnToTheNextPortrait, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/zach-shore-trailer-portrait/MoveOnToTheNextPortrait";

// Private render entry for MoveOnToTheNextPortrait (zach-shore-trailer-portrait; Core memory podcast style): two crew eject, then an uncrewed echelon replaces its lost lead.
// Opaque 1080x1920, 23.976 fps, 145 frames.
export const RemotionRoot = () => (
  <Composition
    id="MoveOnToTheNextPortrait"
    component={MoveOnToTheNextPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
