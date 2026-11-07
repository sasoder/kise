import {Composition} from 'remotion';
import FrontPages, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/FrontPages';

// Private render entry for FrontPages (caro-firing-moses; the show's silhouette pictogram look):
// six identical front pages, MOSES QUITS, slap onto the stamped slip; in the top paper's picture a small politician shoves Moses out.
// Opaque 1080x1920, 24 fps, 293 frames.
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
