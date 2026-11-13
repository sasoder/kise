import {Composition} from 'remotion';
import TrendIsYourFriend, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/TrendIsYourFriend';

// Private render entry for TrendIsYourFriend (nik-trend-friend; Cheeky Pint style (stout)): the R tile climbs one straight amber line and runs on along the dashed projection of its first two months.
// Opaque 1080x1920, 23.976 fps, 113 frames.
export const RemotionRoot = () => (
  <Composition
    id="TrendIsYourFriend"
    component={TrendIsYourFriend}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
