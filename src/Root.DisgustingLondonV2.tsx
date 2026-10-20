import {Composition} from 'remotion';
import DisgustingLondonV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/DisgustingLondonV2';

// Private render entry for DisgustingLondonV2 (kyle-london; Dwarkesh map style): one tilt down an engraved London column, St Paul's to the gutter, a chamber pot emptied out of a window into the kennel.
// Opaque 1080x1920, 29.97 fps, 115 frames.
export const RemotionRoot = () => (
  <Composition
    id="DisgustingLondonV2"
    component={DisgustingLondonV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
