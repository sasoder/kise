import {Composition} from 'remotion';
import InstantExpert, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/InstantExpert';

// Private render entry for InstantExpert (neal-stephenson-trailer; Core memory podcast style): <one line on the picture>.
// Opaque 1920x1080, 23.976 fps, 81 frames.
export const RemotionRoot = () => (
  <Composition
    id="InstantExpert"
    component={InstantExpert}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
