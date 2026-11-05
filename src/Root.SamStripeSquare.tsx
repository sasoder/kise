import {Composition} from 'remotion';
import SamStripeSquare, {DURATION, FPS, defaultProps, schema} from '../generated/components/julien-fireside/SamStripeSquare';

export const RemotionRoot = () => (
  <Composition
    id="SamStripeSquare"
    component={SamStripeSquare}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1080}
  />
);
