import {Composition} from 'remotion';
import EighteenHundredCloser, {DURATION, FPS, defaultProps, schema} from '../generated/components/mikkel-trailer/EighteenHundredCloser';

// Private render entry for EighteenHundredCloser (mikkel-trailer; Core memory podcast style): a log-scale pull-back from Sceye's airship over the limb to the whole Earth, "1,800x" rising, a GEO satellite (WGS) at its true 6.62 Earth radii.
// Opaque 2048x1080, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="EighteenHundredCloser"
    component={EighteenHundredCloser}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
