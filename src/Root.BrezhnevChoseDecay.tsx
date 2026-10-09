import {Composition} from 'remotion';
import BrezhnevChoseDecay, {DURATION, FPS, defaultProps, schema} from '../generated/components/BrezhnevChoseDecay';

// Private render entry for BrezhnevChoseDecay (cut B of Logan Wright,
// "Brezhnev chose decay", ChinaTalk slightly vintage): "Brezhnev basically
// chose decay". The 1972 portrait over a railway switch; the red line takes
// the road down. Opaque, 1080x1920, 24 fps, 65 frames (53 slot + 12 tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BrezhnevChoseDecay"
        component={BrezhnevChoseDecay}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
