import {Composition} from 'remotion';
import ArtisanalToIndustrial, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/ArtisanalToIndustrial';

// Private render entry for ArtisanalToIndustrial (kyle-rome-industrial; Dwarkesh 3D style): one potter at his wheel, a pull-back to a district of identical potters feeding one huge kiln.
// Opaque 1080x1920, 29.97 fps, 263 frames.
export const RemotionRoot = () => (
  <Composition
    id="ArtisanalToIndustrial"
    component={ArtisanalToIndustrial}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
