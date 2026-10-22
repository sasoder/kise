import {Composition} from 'remotion';
import ReturnsHugeDownsideSmall, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/ReturnsHugeDownsideSmall';

// Private render entry for ReturnsHugeDownsideSmall (scott-aircraft-order; Cheeky Pint style (stout)): a glass column of amber returns towers over the jet while a short drained column dips below the apron edge.
// Opaque 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="ReturnsHugeDownsideSmall"
    component={ReturnsHugeDownsideSmall}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
