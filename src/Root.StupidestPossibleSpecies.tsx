import {Composition} from 'remotion';
import StupidestPossibleSpecies, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/StupidestPossibleSpecies';

// Private render entry for StupidestPossibleSpecies (rsi-stupidest-species; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 220 frames.
export const RemotionRoot = () => (
  <Composition
    id="StupidestPossibleSpecies"
    component={StupidestPossibleSpecies}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
