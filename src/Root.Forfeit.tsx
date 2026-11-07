import {Composition} from 'remotion';
import Forfeit, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/Forfeit';

// Private render entry for Forfeit (caro-firing-moses; the show's silhouette pictogram look):
// the Mayor's hand stamps the resignation slip ACCEPTED; Moses's half-built projects lose their plans and their money.
// Opaque 1080x1920, 24 fps, 225 frames.
export const RemotionRoot = () => (
  <Composition
    id="Forfeit"
    component={Forfeit}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
