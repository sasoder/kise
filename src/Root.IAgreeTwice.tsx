import {Composition} from 'remotion';
import IAgreeTwice, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-hold-my-beer/IAgreeTwice';

// Private render entry for IAgreeTwice (sam-hold-my-beer; Cheeky Pint style (stout)): a consent card, two "I agree" ticks: the turning Earth, then an amber curve climbing off the card.
// Opaque 1080x1920, 23.976 fps, 129 frames.
export const RemotionRoot = () => (
  <Composition
    id="IAgreeTwice"
    component={IAgreeTwice}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
