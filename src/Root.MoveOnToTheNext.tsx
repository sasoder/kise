import {Composition} from 'remotion';
import MoveOnToTheNext, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-shore-trailer/MoveOnToTheNext';

// Private render entry for MoveOnToTheNext (zach-shore-trailer; Core memory podcast style): a crewed F-15E is shot down and two chutes come down; the uncrewed jet hit next is simply replaced by the next one in the column.
// Opaque 2048x1080, 23.976 fps, 145 frames.
export const RemotionRoot = () => (
  <Composition
    id="MoveOnToTheNext"
    component={MoveOnToTheNext}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
