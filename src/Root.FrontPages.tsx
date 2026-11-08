import {Composition} from 'remotion';
import FrontPages, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/FrontPages';

// Private render entry for FrontPages (caro-firing-moses; the show's silhouette pictogram look):
// rev 1: six different New York dailies (Times, Herald Tribune, Journal-American, Daily News, Mirror, Post) slap onto the
// stamped slip, the same glowing Moses on every front page; the camera eases back to the whole spread.
// Opaque 1080x1920, 24 fps, 134 frames.
export const RemotionRoot = () => (
  <Composition
    id="FrontPages"
    component={FrontPages}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
