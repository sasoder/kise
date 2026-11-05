import {Composition} from 'remotion';
import NameTagNikStoronsky, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/NameTagNikStoronsky';

// Private render entry for NameTagNikStoronsky (nik-neobanks-us; Name tag): <one line on the picture>.
// Transparent overlay 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="NameTagNikStoronsky"
    component={NameTagNikStoronsky}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
