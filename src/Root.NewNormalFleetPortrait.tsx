import {Composition} from 'remotion';
import NewNormalFleetPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/mikkel-trailer/NewNormalFleetPortrait';

// Private render entry for NewNormalFleetPortrait (mikkel-trailer; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 101 frames.
export const RemotionRoot = () => (
  <Composition
    id="NewNormalFleetPortrait"
    component={NewNormalFleetPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
