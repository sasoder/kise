import {Composition} from 'remotion';
import ShowItToMyFriends, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-kids-mind-blown/ShowItToMyFriends';

// Private render entry for ShowItToMyFriends (sam-kids-mind-blown; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 94 frames.
export const RemotionRoot = () => (
  <Composition
    id="ShowItToMyFriends"
    component={ShowItToMyFriends}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
