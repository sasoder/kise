import {Composition} from 'remotion';
import DisgustingLondonV5, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/DisgustingLondonV5';

// Private render entry for DisgustingLondonV5 (kyle-london; Dwarkesh map style): one tilt down an engraved London column, St Paul's to the gutter, a chamber pot emptied out of a window into the kennel.
// Opaque 1080x1920, 29.97 fps, 115 frames.
export const RemotionRoot = () => (
  <Composition
    id="DisgustingLondonV5"
    component={DisgustingLondonV5}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
