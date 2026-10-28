import {Composition} from 'remotion';
import BenchProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/BenchProbe';

// Private render entry for the sam-benchmaxxing shared world's probe stills (BenchProbe). Opaque 1080x1920.
export const RemotionRoot = () => (
  <Composition
    id="BenchProbe"
    component={BenchProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
