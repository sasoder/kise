import {Composition} from 'remotion';
import PricedLikeTheLakers, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-worth-twelve/PricedLikeTheLakers';

// Private render entry for PricedLikeTheLakers (toto-worth-twelve; Cheeky Pint style (stout)): Mercedes amber column to $12B beside the Lakers $10B.
// Opaque 1080x1920, 25 fps, 151 frames.
export const RemotionRoot = () => (
  <Composition
    id="PricedLikeTheLakers"
    component={PricedLikeTheLakers}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
