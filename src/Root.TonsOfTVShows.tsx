import {Composition} from 'remotion';
import TonsOfTVShows, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/TonsOfTVShows';

// Private render entry for TonsOfTVShows (neal-stephenson-trailer; Core memory podcast style): Neal Stephenson's seven famous books fly out from behind his head into a row above him.
// Opaque 1920x1080, 23.976 fps, 105 frames. Preview aid: props {"bands": true} shows the caption bands.
export const RemotionRoot = () => (
  <Composition
    id="TonsOfTVShows"
    component={TonsOfTVShows}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
