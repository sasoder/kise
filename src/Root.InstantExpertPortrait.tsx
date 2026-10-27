import {Composition} from 'remotion';
import InstantExpertPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/InstantExpertPortrait';

// Private render entry for InstantExpertPortrait (neal-stephenson-trailer; Core memory podcast style): the 9:16 twin of InstantExpert: each novel's research subject rises out of its cover on the two-row shelf as the camera rides the ripple.
// Opaque 1080x1920, 23.976 fps, 81 frames.
export const RemotionRoot = () => (
  <Composition
    id="InstantExpertPortrait"
    component={InstantExpertPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
