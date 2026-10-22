import {Composition} from 'remotion';
import ProductOfGenerations, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/ProductOfGenerations';

// Private render entry for ProductOfGenerations (kyle-greek-math; Dwarkesh 3D style): Euclid alone in the fog, then one crane down to the stair of generations handing up their diagrams.
// Opaque 1080x1920, 29.97 fps, 229 frames.
export const RemotionRoot = () => (
  <Composition
    id="ProductOfGenerations"
    component={ProductOfGenerations}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
