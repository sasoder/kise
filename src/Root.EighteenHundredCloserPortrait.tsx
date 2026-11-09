import {Composition} from 'remotion';
import EighteenHundredCloserPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/mikkel-trailer/EighteenHundredCloserPortrait';

// Private render entry for EighteenHundredCloserPortrait (mikkel-trailer; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="EighteenHundredCloserPortrait"
    component={EighteenHundredCloserPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
