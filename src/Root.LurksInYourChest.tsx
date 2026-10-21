import {Composition} from 'remotion';
import LurksInYourChest, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/LurksInYourChest';

// Private render entry for LurksInYourChest (kyle-pandemics; Dwarkesh map style): a poor labourer in a cold garret turns see-through; TB settles in his lung tops, lurks, then spreads and wastes him.
// Opaque 1080x1920, 29.97 fps, 173 frames.
export const RemotionRoot = () => (
  <Composition
    id="LurksInYourChest"
    component={LurksInYourChest}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
