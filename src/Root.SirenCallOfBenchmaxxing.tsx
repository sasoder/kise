import {Composition} from 'remotion';
import SirenCallOfBenchmaxxing, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/SirenCallOfBenchmaxxing';

// Private render entry for SirenCallOfBenchmaxxing (sam-benchmaxxing; Cheeky Pint style (stout)): back on cut 1's even chart, the four other labs' columns are lured up by a soft call from above while OpenAI's amber column stays modest and its tile leans back, chill.
// Opaque 1080x1920, 23.976 fps, 76 frames.
export const RemotionRoot = () => (
  <Composition
    id="SirenCallOfBenchmaxxing"
    component={SirenCallOfBenchmaxxing}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
