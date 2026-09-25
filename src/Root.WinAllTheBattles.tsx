import {Composition} from 'remotion';
import WinAllTheBattles, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/WinAllTheBattles';

// Private render entry for WinAllTheBattles, so this cut renders while
// another builder owns src/Root.tsx. War essay "It is not whether you win all
// the battles…": five swords, a left-to-right wave plants an orange flag on
// each, BATTLES WON 0 / 5 → 5 / 5. Transparent 1080x1920 overlay, 24 fps, 2 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WinAllTheBattles"
        component={WinAllTheBattles}
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
