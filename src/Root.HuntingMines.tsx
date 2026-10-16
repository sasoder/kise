import {Composition} from 'remotion';
import HuntingMines, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/will-hunting-mines/HuntingMines';

// Private render entry for HuntingMines, so this cut renders while other
// builders own src/Root.tsx. Cheeky Pint S4E02 (Will O'Brien, Ulysses): "mine
// countermeasures, finding mines and hunting mines before it was cool". The
// Mako's sonar fan finds a moored mine and locks it. Opaque, 1080x1920,
// 24000/1001 fps, 96 frames (80 + 16 tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HuntingMines"
        component={HuntingMines}
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
