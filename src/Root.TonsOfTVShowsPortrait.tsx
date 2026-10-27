import {Composition} from 'remotion';
import TonsOfTVShowsPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/TonsOfTVShowsPortrait';

// Private render entry for TonsOfTVShowsPortrait (neal-stephenson-trailer; Core memory podcast style): Neal's seven novels rise out of his head into a two-row shelf above him (9:16 twin of TonsOfTVShows).
// Opaque 1080x1920, 23.976 fps, 105 frames.
export const RemotionRoot = () => (
  <Composition
    id="TonsOfTVShowsPortrait"
    component={TonsOfTVShowsPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
