import {Composition} from 'remotion';
import GhostLines, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GhostLines';

// Private render entry for GhostLines, so this cut renders while other builders
// own src/Root.tsx. Cheeky Pint S4E02 (Will O'Brien, Ulysses): "put these power
// cables in the water. They attract abandoned fishing lines. The fishing lines
// then are what catch dolphins and whales". Opaque ocean world (oceanShared),
// 1080x1920, 23.976 fps, 200 frames (184 + 16 tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GhostLines"
        component={GhostLines}
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
