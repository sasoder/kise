import {Composition} from 'remotion';
import OutcompeteEurope, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/OutcompeteEurope';

// Private render entry for OutcompeteEurope (kyle-first-farmers; Dwarkesh map style): the farmers' orange front sweeps
// out of Anatolia across Europe under a pull-back from the Aegean, the cream foragers absorbed or giving way.
// Opaque 1080x1920, 29.97 fps, 166 frames.
export const RemotionRoot = () => (
  <Composition
    id="OutcompeteEurope"
    component={OutcompeteEurope}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
