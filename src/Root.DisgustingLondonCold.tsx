import {Composition} from 'remotion';
import DisgustingLondonCold, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/DisgustingLondonCold';

// Private render entry for DisgustingLondonCold (kyle-london; Dwarkesh map style): one tilt down an engraved London column, St Paul's to the gutter, a chamber pot emptied out of a window into the kennel.
// Opaque 1080x1920, 29.97 fps, 115 frames.
export const RemotionRoot = () => (
  <Composition
    id="DisgustingLondonCold"
    component={DisgustingLondonCold}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
