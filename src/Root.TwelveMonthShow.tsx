import {Composition} from 'remotion';
import TwelveMonthShow, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/TwelveMonthShow';

// Private render entry for TwelveMonthShow (toto-female-fans; Cheeky Pint style (stout)): one scene: two team bosses arguing under a motorhome flip calendar that turns JAN to DEC (faster and faster) while a tree goes through the seasons, December snow settles, and the page turns back to JAN; one camera op films it all, amber tally; slow push-in.
// Opaque 1080x1920, 25 fps, 140 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwelveMonthShow"
    component={TwelveMonthShow}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
