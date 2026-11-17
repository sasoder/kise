import {Composition} from 'remotion';
import DrowningInApplicationsPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer-vertical/DrowningInApplicationsPortrait';

// Private render entry for DrowningInApplicationsPortrait (shruti-trailer-vertical; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="DrowningInApplicationsPortrait"
    component={DrowningInApplicationsPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
