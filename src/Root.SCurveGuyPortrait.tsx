import {Composition} from 'remotion';
import SCurveGuyPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/SCurveGuyPortrait';

// Private render entry for SCurveGuyPortrait (neal-stephenson-trailer; Core memory podcast style): the 9:16 recomposition of SCurveGuy, a tall graph where the exponential climbs off the top and the S-curve peels off and levels.
// Opaque 1080x1920, 23.976 fps, 99 frames.
export const RemotionRoot = () => (
  <Composition
    id="SCurveGuyPortrait"
    component={SCurveGuyPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
