import {Composition} from 'remotion';
import TuberculosisToll, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/TuberculosisToll';

// Private render entry for TuberculosisToll (kyle-pandemics; Dwarkesh map style): an isotype in depth, one engraved
// figure = one million deaths; a crane pull-back from one orange man to TB's 1,000 beside the 1918 flu, AIDS and COVID.
// Opaque 1080x1920, 29.97 fps, 186 frames.
export const RemotionRoot = () => (
  <Composition
    id="TuberculosisToll"
    component={TuberculosisToll}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
