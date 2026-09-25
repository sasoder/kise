import {Composition} from 'remotion';
import AchieveTheObjective, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AchieveTheObjective';

// Private render entry for AchieveTheObjective, so this cut renders while
// another builder owns src/Root.tsx. War essay cut 2, "…whether you achieve the
// objective for which you're fighting the war": joins on WinAllTheBattles f47;
// the row recedes, an orange line reaches up toward a white objective ring and
// stops short. Transparent 1080x1920 overlay, 24 fps, 4 s, one continuous move.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AchieveTheObjective"
        component={AchieveTheObjective}
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
