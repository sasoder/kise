import {Composition} from 'remotion';
import TwelveMonthShow, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/TwelveMonthShow';

// Private render entry for TwelveMonthShow (toto-female-fans; Cheeky Pint style (stout)): two team bosses arguing on camera, then the camera trucks along the paddock street (one month per stretch, JAN-DEC pennants) and pulls out to the whole year, every drama filmed with an amber tally.
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
