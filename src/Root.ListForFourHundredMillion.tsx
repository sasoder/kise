import {Composition} from 'remotion';
import ListForFourHundredMillion, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/ListForFourHundredMillion';

// Private render entry for ListForFourHundredMillion (scott-aircraft-order; Cheeky Pint style (stout)): United 787 side profile; cash bundles drop and stack into a block as tall as the fin (render with --gl=angle).
// Opaque 1080x1920, 23.976 fps, 71 frames.
export const RemotionRoot = () => (
  <Composition
    id="ListForFourHundredMillion"
    component={ListForFourHundredMillion}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
