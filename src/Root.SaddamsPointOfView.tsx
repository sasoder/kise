import {Composition} from 'remotion';
import SaddamsPointOfView, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/SaddamsPointOfView';

// Private render entry for SaddamsPointOfView (sarah-gulf-war; Dwarkesh 3D style): the camera pulls back and tilts up out of cut 12's last frame as Iraq's southern oil fields light orange beside Kuwait's, and Saddam's real photo rises out of the far haze like a giant mural over them. Render with --gl=angle.
// Opaque 1080x1920, 24 fps, 68 frames.
export const RemotionRoot = () => (
  <Composition
    id="SaddamsPointOfView"
    component={SaddamsPointOfView}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
