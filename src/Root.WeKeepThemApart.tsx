import {Composition} from 'remotion';
import WeKeepThemApart, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/WeKeepThemApart';

// Private render entry for WeKeepThemApart (kyle-rome-slavery; Dwarkesh map style): a slave sale and a thriving pottery on one stage, which splits in two.
// Opaque 1080x1920, 29.97 fps, 211 frames.
export const RemotionRoot = () => (
  <Composition
    id="WeKeepThemApart"
    component={WeKeepThemApart}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
