import {Composition} from 'remotion';
import YaDivisionsClosed, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/YaDivisionsClosed';

// Private render entry for YaDivisionsClosed (wip-ya-boom, cut 29; Works in Progress style): the Penguin Random House, HarperCollins and Hachette logo slips cut in on their names, then a red CLOSED rubber stamp on all three on "closed".
// Opaque 1080x1920, 24 fps, 90 frames.
export const RemotionRoot = () => (
  <Composition
    id="YaDivisionsClosed"
    component={YaDivisionsClosed}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
