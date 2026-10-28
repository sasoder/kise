import {Composition} from 'remotion';
import TwoThingsToCareAbout, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/TwoThingsToCareAbout';

// Private render entry for TwoThingsToCareAbout (sam-benchmaxxing; Cheeky Pint style (stout)): two sealed cards (1, 2) rise on the apron, the camera pushes onto card 1 and pans right to card 2 as each flips open.
// Opaque 1080x1920, 23.976 fps, 184 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwoThingsToCareAbout"
    component={TwoThingsToCareAbout}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
